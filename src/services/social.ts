import { updateProfile, type User } from 'firebase/auth'
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  friendshipPairId,
  generateFriendCode,
  normalizeDisplayName,
  normalizeFriendLookup,
  projectInviteId,
  sortedPair,
} from '../lib/socialLogic'
import type { Friendship, Project, ProjectInvite, UserProfile } from '../types'

export type FriendRequestErrorCode =
  | 'invalid_format'
  | 'not_found'
  | 'self'
  | 'already_friends'
  | 'already_pending'

export class FriendRequestError extends Error {
  code: FriendRequestErrorCode
  constructor(code: FriendRequestErrorCode) {
    super(code)
    this.code = code
  }
}

function buildDisplayName(user: User): string {
  const fromAuth = user.displayName?.trim()
  if (fromAuth) return fromAuth.slice(0, 100)
  const fromEmail = user.email?.split('@')[0]?.trim()
  if (fromEmail) return fromEmail.slice(0, 100)
  return 'TaskFlow User'
}

/**
 * Ensures the signed-in user has a `profiles/{uid}` document along with privacy-safe
 * exact-lookup records in `friendCodes/{code}` and `emailIndex/{emailLower}`.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const profileRef = doc(db, 'profiles', user.uid)
  const snap = await getDoc(profileRef)
  const displayName = buildDisplayName(user)
  const email = (user.email ?? '').trim()
  const emailLower = email.toLowerCase()
  const photoURL = user.photoURL ?? null
  const now = Date.now()

  if (snap.exists()) {
    const existing = snap.data() as UserProfile
    // Preserve customized displayName; only sync photoURL or email changes from Auth
    const needsRefresh = existing.photoURL !== photoURL || existing.email !== email

    if (needsRefresh) {
      const updated: UserProfile = {
        ...existing,
        email,
        photoURL,
        updatedAt: now,
      }
      const batch = writeBatch(db)
      batch.set(profileRef, updated)
      batch.set(doc(db, 'friendCodes', existing.friendCode), updated)
      if (emailLower) {
        batch.set(doc(db, 'emailIndex', emailLower), updated)
      }
      await batch.commit()
      return updated
    }
    return existing
  }

  // Generate an unused TF-XXXX friend code (retry on rare collision)
  let friendCode = ''
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generateFriendCode(attempt < 4 ? 4 : 6)
    const codeSnap = await getDoc(doc(db, 'friendCodes', candidate))
    if (!codeSnap.exists()) {
      friendCode = candidate
      break
    }
  }
  if (!friendCode) {
    friendCode = generateFriendCode(6)
  }

  const profile: UserProfile = {
    uid: user.uid,
    displayName,
    email,
    photoURL,
    friendCode,
    updatedAt: now,
  }

  const batch = writeBatch(db)
  batch.set(profileRef, profile)
  batch.set(doc(db, 'friendCodes', friendCode), profile)
  if (emailLower) {
    batch.set(doc(db, 'emailIndex', emailLower), profile)
  }
  await batch.commit()
  return profile
}

/** Realtime subscription for the signed-in user's own profile document. */
export function subscribeOwnProfile(uid: string, cb: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, 'profiles', uid), snap => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null)
  })
}

/**
 * Updates the user's display name across Firebase Auth and Firestore (`profiles`,
 * `friendCodes`, and `emailIndex`) atomically.
 */
export async function updateUserDisplayName(
  user: User,
  currentProfile: UserProfile | null,
  rawName: string,
): Promise<UserProfile> {
  const cleanName = normalizeDisplayName(rawName)
  if (!cleanName) {
    throw new Error('INVALID_DISPLAY_NAME')
  }

  const base = currentProfile ?? (await ensureUserProfile(user))
  const updated: UserProfile = {
    ...base,
    displayName: cleanName,
    updatedAt: Date.now(),
  }

  const batch = writeBatch(db)
  batch.set(doc(db, 'profiles', base.uid), updated)
  batch.set(doc(db, 'friendCodes', base.friendCode), updated)
  const emailLower = base.email.trim().toLowerCase()
  if (emailLower) {
    batch.set(doc(db, 'emailIndex', emailLower), updated)
  }
  await batch.commit()

  try {
    await updateProfile(user, { displayName: cleanName })
  } catch (err) {
    console.warn('[TaskFlow] Auth displayName sync warning:', err)
  }

  return updated
}

/** Exact-match lookup by email or `TF-XXXX` friend code. */
export async function lookupUserByEmailOrCode(rawInput: string): Promise<UserProfile | null> {
  const parsed = normalizeFriendLookup(rawInput)
  if (!parsed) throw new FriendRequestError('invalid_format')

  const col = parsed.kind === 'email' ? 'emailIndex' : 'friendCodes'
  const snap = await getDoc(doc(db, col, parsed.value))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

/** Fetches profiles by UIDs via individual `getDoc` calls (respects `list: false`). */
export async function getProfilesByIds(uids: string[]): Promise<Record<string, UserProfile>> {
  const unique = Array.from(new Set(uids.filter(Boolean)))
  if (unique.length === 0) return {}
  const snaps = await Promise.all(
    unique.map(async uid => {
      try {
        const s = await getDoc(doc(db, 'profiles', uid))
        return s.exists() ? (s.data() as UserProfile) : null
      } catch {
        return null
      }
    }),
  )
  const map: Record<string, UserProfile> = {}
  for (const p of snaps) {
    if (p) map[p.uid] = p
  }
  return map
}

export function subscribeFriendships(uid: string, cb: (list: Friendship[]) => void) {
  return onSnapshot(
    query(collection(db, 'friendships'), where('users', 'array-contains', uid)),
    snap => cb(snap.docs.map(d => d.data() as Friendship)),
  )
}

export async function sendFriendRequest(currentUid: string, rawInput: string): Promise<UserProfile> {
  const target = await lookupUserByEmailOrCode(rawInput)
  if (!target) throw new FriendRequestError('not_found')
  if (target.uid === currentUid) throw new FriendRequestError('self')

  const pairId = friendshipPairId(currentUid, target.uid)
  const ref = doc(db, 'friendships', pairId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    const data = existing.data() as Friendship
    throw new FriendRequestError(data.status === 'accepted' ? 'already_friends' : 'already_pending')
  }

  const now = Date.now()
  const friendship: Friendship = {
    id: pairId,
    users: sortedPair(currentUid, target.uid),
    requesterId: currentUid,
    recipientId: target.uid,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(ref, friendship)
  return target
}

export const acceptFriendRequest = (pairId: string) =>
  updateDoc(doc(db, 'friendships', pairId), {
    status: 'accepted',
    updatedAt: Date.now(),
  })

export const removeFriendship = (pairId: string) => deleteDoc(doc(db, 'friendships', pairId))

export function subscribeIncomingProjectInvites(uid: string, cb: (list: ProjectInvite[]) => void) {
  return onSnapshot(
    query(collection(db, 'projectInvites'), where('inviteeId', '==', uid)),
    snap => cb(snap.docs.map(d => d.data() as ProjectInvite)),
  )
}

export function subscribeProjectInvitesForProject(
  projectId: string,
  inviterUid: string,
  cb: (list: ProjectInvite[]) => void,
) {
  return onSnapshot(
    query(collection(db, 'projectInvites'), where('inviterId', '==', inviterUid)),
    snap =>
      cb(
        snap.docs
          .map(d => d.data() as ProjectInvite)
          .filter(inv => inv.projectId === projectId),
      ),
  )
}

export async function sendProjectInvite(
  project: Project,
  inviterUid: string,
  inviteeUid: string,
): Promise<string> {
  const id = projectInviteId(project.id, inviteeUid)
  const invite: ProjectInvite = {
    id,
    projectId: project.id,
    projectName: project.name,
    projectColor: project.color,
    inviterId: inviterUid,
    inviteeId: inviteeUid,
    status: 'pending',
    createdAt: Date.now(),
  }
  await setDoc(doc(db, 'projectInvites', id), invite)
  return id
}

/** Atomically adds the invitee to `projects/{projectId}.memberIds` and deletes the invite. */
export async function acceptProjectInvite(invite: ProjectInvite, uid: string): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'projects', invite.projectId), {
    memberIds: arrayUnion(uid),
  })
  batch.delete(doc(db, 'projectInvites', invite.id))
  await batch.commit()
}

export const declineOrCancelProjectInvite = (inviteId: string) =>
  deleteDoc(doc(db, 'projectInvites', inviteId))

export const removeProjectMember = (projectId: string, memberUid: string) =>
  updateDoc(doc(db, 'projects', projectId), {
    memberIds: arrayRemove(memberUid),
  })

export const leaveProject = (projectId: string, uid: string) =>
  updateDoc(doc(db, 'projects', projectId), {
    memberIds: arrayRemove(uid),
  })
