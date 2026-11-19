import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs,
  query, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore'

let env: RulesTestEnvironment

const task = (over: Record<string, unknown> = {}) => ({
  id: 't1', title: 'Hello', description: '', status: 'todo', priority: 2,
  startAt: null, dueAt: null, completedAt: null, projectId: null, parentTaskId: null,
  labelIds: [], ownerId: 'alice', assigneeId: null, deletedAt: null,
  createdAt: 1, updatedAt: 1, ...over,
})

const project = (over: Record<string, unknown> = {}) => ({
  name: 'P', color: '#6366f1', icon: 'folder', ownerId: 'alice',
  memberIds: ['alice', 'bob'], status: 'active', createdAt: 1, ...over,
})

const profile = (uid = 'alice', over: Record<string, unknown> = {}) => ({
  uid, displayName: 'Alice', email: `${uid}@example.com`, photoURL: null,
  friendCode: 'TF-AB12', updatedAt: 100, ...over,
})

const lookupEntry = (uid = 'alice', over: Record<string, unknown> = {}) => ({
  uid, email: `${uid}@example.com`, displayName: 'Alice', photoURL: null,
  friendCode: 'TF-AB12', updatedAt: 100, ...over,
})

const friendship = (
  uidA = 'alice',
  uidB = 'bob',
  over: Record<string, unknown> = {},
) => {
  const users = uidA < uidB ? [uidA, uidB] : [uidB, uidA]
  const id = `${users[0]}_${users[1]}`
  return {
    id, users, requesterId: uidA, recipientId: uidB, status: 'pending',
    createdAt: 100, updatedAt: 100, ...over,
  }
}

const projectInvite = (
  projectId = 'p1',
  inviteeId = 'charlie',
  over: Record<string, unknown> = {},
) => ({
  id: `${projectId}_${inviteeId}`,
  projectId,
  projectName: 'P',
  projectColor: '#6366f1',
  inviterId: 'alice',
  inviteeId,
  status: 'pending',
  createdAt: 100,
  ...over,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-taskflow',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
  })
})
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const as = (uid: string, tokenOptions?: Record<string, unknown>) =>
  env.authenticatedContext(uid, tokenOptions).firestore()

describe('tasks', () => {
  it('owner can create and read own task', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'tasks/t1'), task()))
    await assertSucceeds(getDoc(doc(as('alice'), 'tasks/t1')))
  })
  it('unauthenticated users are denied', async () => {
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), 'tasks/t1'), task()))
  })
  it('cannot create task owned by someone else', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'tasks/t1'), task()))
  })
  it('other users cannot read a private task', async () => {
    await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'tasks/t1'), task()))
    await assertFails(getDoc(doc(as('bob'), 'tasks/t1')))
  })
  it('rejects invalid priority and empty title', async () => {
    await assertFails(setDoc(doc(as('alice'), 'tasks/t1'), task({ priority: 9 })))
    await assertFails(setDoc(doc(as('alice'), 'tasks/t1'), task({ title: '' })))
  })
  it('project member can read, query via projectId in, and update but not delete', async () => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project())
      await setDoc(doc(c.firestore(), 'tasks/t1'), task({ projectId: 'p1' }))
    })
    await assertSucceeds(getDoc(doc(as('bob'), 'tasks/t1')))
    await assertSucceeds(getDocs(query(collection(as('bob'), 'tasks'), where('projectId', 'in', ['p1']))))
    await assertSucceeds(updateDoc(doc(as('bob'), 'tasks/t1'), { status: 'done', updatedAt: 2 }))
    await assertFails(deleteDoc(doc(as('bob'), 'tasks/t1')))
  })
  it('non-members cannot read project tasks', async () => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project())
      await setDoc(doc(c.firestore(), 'tasks/t1'), task({ projectId: 'p1' }))
    })
    await assertFails(getDoc(doc(as('eve'), 'tasks/t1')))
  })
})

describe('labels', () => {
  it('only owner can create, read, update, and delete labels', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'labels/l1'), { name: 'Work', color: '#fff', ownerId: 'alice' }))
    await assertSucceeds(getDoc(doc(as('alice'), 'labels/l1')))
    await assertFails(getDoc(doc(as('bob'), 'labels/l1')))
    await assertSucceeds(updateDoc(doc(as('alice'), 'labels/l1'), { name: 'Personal' }))
    await assertFails(updateDoc(doc(as('alice'), 'labels/l1'), { ownerId: 'bob' }))
    await assertFails(deleteDoc(doc(as('bob'), 'labels/l1')))
    await assertSucceeds(deleteDoc(doc(as('alice'), 'labels/l1')))
  })
})

describe('users', () => {
  it('only the user can read own profile', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice'), { name: 'A' }))
    await assertFails(getDoc(doc(as('bob'), 'users/alice')))
  })
})

describe('profiles', () => {
  it('owner can create, update, and delete own profile; authenticated users can get but not list', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice')))
    await assertSucceeds(getDoc(doc(as('bob'), 'profiles/alice')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'profiles/alice')))
    await assertFails(getDocs(collection(as('bob'), 'profiles')))

    await assertSucceeds(updateDoc(doc(as('alice'), 'profiles/alice'), {
      displayName: 'Alice Updated', photoURL: 'https://example.com/a.png', updatedAt: 200,
    }))
    await assertSucceeds(deleteDoc(doc(as('alice'), 'profiles/alice')))
  })

  it('denies non-owner writes, invalid fields, and immutable mutations', async () => {
    await assertFails(setDoc(doc(as('bob'), 'profiles/alice'), profile('alice')))
    await assertFails(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice', { uid: 'bob' })))
    await assertFails(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice', { friendCode: 'BAD' })))
    await assertFails(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice', { displayName: '' })))
    await assertFails(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice', { displayName: 'x'.repeat(101) })))
    await assertFails(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice', { photoURL: 'x'.repeat(2049) })))
    await assertFails(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice', { extra: true })))

    await assertSucceeds(setDoc(doc(as('alice'), 'profiles/alice'), profile('alice')))
    await assertFails(updateDoc(doc(as('alice'), 'profiles/alice'), { friendCode: 'TF-ZZ99' }))
    await assertFails(updateDoc(doc(as('alice'), 'profiles/alice'), { uid: 'bob' }))
    await assertFails(updateDoc(doc(as('bob'), 'profiles/alice'), { displayName: 'Hacked' }))
    await assertFails(deleteDoc(doc(as('bob'), 'profiles/alice')))
  })
})

describe('emailIndex', () => {
  it('owner with matching token email can create, update, and delete; others can get only', async () => {
    const aliceDb = as('alice', { email: 'Alice@Example.com' })
    await assertSucceeds(setDoc(doc(aliceDb, 'emailIndex/alice@example.com'), lookupEntry('alice')))
    await assertSucceeds(getDoc(doc(as('bob'), 'emailIndex/alice@example.com')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'emailIndex/alice@example.com')))
    await assertFails(getDocs(collection(as('bob'), 'emailIndex')))

    await assertSucceeds(updateDoc(doc(aliceDb, 'emailIndex/alice@example.com'), {
      displayName: 'Alice 2', updatedAt: 200,
    }))
    await assertSucceeds(deleteDoc(doc(aliceDb, 'emailIndex/alice@example.com')))
  })

  it('blocks mismatched email token, spoofing, hijacking, and immutable edits', async () => {
    await assertFails(setDoc(doc(as('alice'), 'emailIndex/alice@example.com'), lookupEntry('alice')))
    await assertFails(setDoc(
      doc(as('alice', { email: 'other@example.com' }), 'emailIndex/alice@example.com'),
      lookupEntry('alice'),
    ))
    await assertFails(setDoc(
      doc(as('alice', { email: 'alice@example.com' }), 'emailIndex/alice@example.com'),
      lookupEntry('alice', { email: 'spoofed@example.com' }),
    ))
    await assertFails(setDoc(
      doc(as('alice', { email: 'alice@example.com' }), 'emailIndex/alice@example.com'),
      lookupEntry('bob'),
    ))
    await assertFails(setDoc(
      doc(as('alice', { email: 'a@' }), 'emailIndex/a@'),
      lookupEntry('alice', { email: 'a@' }),
    ))

    const aliceDb = as('alice', { email: 'alice@example.com' })
    await assertSucceeds(setDoc(doc(aliceDb, 'emailIndex/alice@example.com'), lookupEntry('alice')))
    await assertFails(updateDoc(doc(aliceDb, 'emailIndex/alice@example.com'), { email: 'new@example.com' }))
    await assertFails(updateDoc(doc(aliceDb, 'emailIndex/alice@example.com'), { uid: 'bob' }))
    await assertFails(updateDoc(doc(as('bob'), 'emailIndex/alice@example.com'), { displayName: 'Hijack' }))
    await assertFails(deleteDoc(doc(as('bob'), 'emailIndex/alice@example.com')))
  })
})

describe('friendCodes', () => {
  it('owner can create, update, and delete own code; others can get only', async () => {
    await assertSucceeds(setDoc(
      doc(as('alice'), 'friendCodes/TF-AB12'),
      lookupEntry('alice', { email: '', friendCode: 'TF-AB12' }),
    ))
    await assertSucceeds(getDoc(doc(as('bob'), 'friendCodes/TF-AB12')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'friendCodes/TF-AB12')))
    await assertFails(getDocs(collection(as('bob'), 'friendCodes')))

    await assertSucceeds(updateDoc(doc(as('alice'), 'friendCodes/TF-AB12'), {
      displayName: 'Alice Renamed', updatedAt: 200,
    }))
    await assertSucceeds(deleteDoc(doc(as('alice'), 'friendCodes/TF-AB12')))
  })

  it('blocks invalid code format, code mismatch, hijacking, and immutable edits', async () => {
    await assertFails(setDoc(
      doc(as('alice'), 'friendCodes/INVALID'),
      lookupEntry('alice', { friendCode: 'INVALID' }),
    ))
    await assertFails(setDoc(
      doc(as('alice'), 'friendCodes/TF-AB12'),
      lookupEntry('alice', { friendCode: 'TF-CD34' }),
    ))
    await assertFails(setDoc(
      doc(as('alice'), 'friendCodes/TF-AB12'),
      lookupEntry('bob', { friendCode: 'TF-AB12' }),
    ))

    await assertSucceeds(setDoc(doc(as('alice'), 'friendCodes/TF-AB12'), lookupEntry('alice')))
    await assertFails(setDoc(doc(as('bob'), 'friendCodes/TF-AB12'), lookupEntry('bob')))
    await assertFails(updateDoc(doc(as('alice'), 'friendCodes/TF-AB12'), { friendCode: 'TF-ZZ99' }))
    await assertFails(updateDoc(doc(as('alice'), 'friendCodes/TF-AB12'), { uid: 'bob' }))
    await assertFails(deleteDoc(doc(as('bob'), 'friendCodes/TF-AB12')))
  })
})

describe('friendships', () => {
  it('supports full request -> accept -> query -> delete lifecycle', async () => {
    const f = friendship('alice', 'bob')

    // Pre-create existence check (used by sendFriendRequest): participants allowed, outsiders denied
    await assertSucceeds(getDoc(doc(as('alice'), `friendships/${f.id}`)))
    await assertSucceeds(getDoc(doc(as('bob'), `friendships/${f.id}`)))
    await assertFails(getDoc(doc(as('eve'), `friendships/${f.id}`)))
    await assertFails(getDoc(doc(as('alice'), 'friendships/alice2_bob')))
    await assertFails(getDoc(doc(as('alice'), 'friendships/bob_malice')))

    await assertSucceeds(setDoc(doc(as('alice'), `friendships/${f.id}`), f))

    // Both participants can read and query via array-contains; outsider cannot
    await assertSucceeds(getDoc(doc(as('alice'), `friendships/${f.id}`)))
    await assertSucceeds(getDoc(doc(as('bob'), `friendships/${f.id}`)))
    await assertSucceeds(getDocs(query(collection(as('alice'), 'friendships'), where('users', 'array-contains', 'alice'))))
    await assertFails(getDoc(doc(as('eve'), `friendships/${f.id}`)))
    await assertFails(getDocs(collection(as('eve'), 'friendships')))

    // Requester cannot self-accept; outsider cannot accept; recipient can accept
    await assertFails(updateDoc(doc(as('alice'), `friendships/${f.id}`), { status: 'accepted', updatedAt: 200 }))
    await assertFails(updateDoc(doc(as('eve'), `friendships/${f.id}`), { status: 'accepted', updatedAt: 200 }))
    await assertSucceeds(updateDoc(doc(as('bob'), `friendships/${f.id}`), { status: 'accepted', updatedAt: 200 }))

    // Cannot revert accepted -> pending or update accepted friendship again
    await assertFails(updateDoc(doc(as('bob'), `friendships/${f.id}`), { status: 'pending', updatedAt: 300 }))
    await assertFails(updateDoc(doc(as('bob'), `friendships/${f.id}`), { status: 'accepted', updatedAt: 300 }))

    // Outsider cannot delete; participant can delete
    await assertFails(deleteDoc(doc(as('eve'), `friendships/${f.id}`)))
    await assertSucceeds(deleteDoc(doc(as('alice'), `friendships/${f.id}`)))
  })

  it('rejects invalid pairId ordering, self-friendship, pre-accepted create, and immutable edits', async () => {
    // Unsorted pairId / users
    await assertFails(setDoc(doc(as('bob'), 'friendships/bob_alice'), {
      id: 'bob_alice', users: ['bob', 'alice'], requesterId: 'bob', recipientId: 'alice',
      status: 'pending', createdAt: 1, updatedAt: 1,
    }))
    // Self-friendship
    await assertFails(setDoc(doc(as('alice'), 'friendships/alice_alice'), {
      id: 'alice_alice', users: ['alice', 'alice'], requesterId: 'alice', recipientId: 'alice',
      status: 'pending', createdAt: 1, updatedAt: 1,
    }))
    // Creating already accepted
    await assertFails(setDoc(doc(as('alice'), 'friendships/alice_bob'), friendship('alice', 'bob', { status: 'accepted' })))
    // Spoofing requesterId
    await assertFails(setDoc(doc(as('bob'), 'friendships/alice_bob'), friendship('alice', 'bob')))

    // Immutable field modification during accept
    await assertSucceeds(setDoc(doc(as('alice'), 'friendships/alice_bob'), friendship('alice', 'bob')))
    await assertFails(updateDoc(doc(as('bob'), 'friendships/alice_bob'), {
      status: 'accepted', createdAt: 999, updatedAt: 200,
    }))
    await assertFails(updateDoc(doc(as('bob'), 'friendships/alice_bob'), {
      status: 'accepted', requesterId: 'bob', recipientId: 'alice', updatedAt: 200,
    }))
  })
})

describe('projectInvites', () => {
  const seedProjectAndFriendship = async (friendStatus: 'pending' | 'accepted' = 'accepted') => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project())
      await setDoc(
        doc(c.firestore(), 'friendships/alice_charlie'),
        friendship('alice', 'charlie', { status: friendStatus }),
      )
    })
  }

  it('owner can invite an accepted friend; inviter & invitee can read/delete; no updates allowed', async () => {
    await seedProjectAndFriendship('accepted')

    await assertSucceeds(setDoc(doc(as('alice'), 'projectInvites/p1_charlie'), projectInvite()))
    await assertSucceeds(getDoc(doc(as('alice'), 'projectInvites/p1_charlie')))
    await assertSucceeds(getDoc(doc(as('charlie'), 'projectInvites/p1_charlie')))
    await assertSucceeds(getDocs(query(collection(as('charlie'), 'projectInvites'), where('inviteeId', '==', 'charlie'))))
    await assertSucceeds(getDocs(query(collection(as('alice'), 'projectInvites'), where('inviterId', '==', 'alice'))))

    // Outsider cannot read or delete
    await assertFails(getDoc(doc(as('eve'), 'projectInvites/p1_charlie')))
    await assertFails(deleteDoc(doc(as('eve'), 'projectInvites/p1_charlie')))

    // Nobody can update
    await assertFails(updateDoc(doc(as('alice'), 'projectInvites/p1_charlie'), { projectName: 'New' }))
    await assertFails(updateDoc(doc(as('charlie'), 'projectInvites/p1_charlie'), { projectName: 'New' }))

    // Invitee can delete (decline/consume)
    await assertSucceeds(deleteDoc(doc(as('charlie'), 'projectInvites/p1_charlie')))
  })

  it('blocks invites to non-friends, pending friends, existing members, self, or by non-owners', async () => {
    await seedProjectAndFriendship('pending')

    // Pending friendship is not enough
    await assertFails(setDoc(doc(as('alice'), 'projectInvites/p1_charlie'), projectInvite()))
    // Stranger (no friendship doc)
    await assertFails(setDoc(doc(as('alice'), 'projectInvites/p1_dave'), projectInvite('p1', 'dave')))

    // Upgrade to accepted + add bob-charlie accepted friendship + alice-bob accepted friendship
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'friendships/alice_charlie'), friendship('alice', 'charlie', { status: 'accepted' }))
      await setDoc(doc(c.firestore(), 'friendships/bob_charlie'), friendship('bob', 'charlie', { status: 'accepted' }))
      await setDoc(doc(c.firestore(), 'friendships/alice_bob'), friendship('alice', 'bob', { status: 'accepted' }))
    })

    // Non-owner member (bob) cannot invite
    await assertFails(setDoc(
      doc(as('bob'), 'projectInvites/p1_charlie'),
      projectInvite('p1', 'charlie', { inviterId: 'bob' }),
    ))
    // Owner cannot invite someone already a member (bob)
    await assertFails(setDoc(doc(as('alice'), 'projectInvites/p1_bob'), projectInvite('p1', 'bob')))
    // Owner cannot invite self
    await assertFails(setDoc(doc(as('alice'), 'projectInvites/p1_alice'), projectInvite('p1', 'alice')))
    // Non-existent project
    await assertFails(setDoc(doc(as('alice'), 'projectInvites/missing_charlie'), projectInvite('missing', 'charlie')))
    // Wrong inviteId format
    await assertFails(setDoc(doc(as('alice'), 'projectInvites/wrong_id'), projectInvite('p1', 'charlie', { id: 'wrong_id' })))
  })
})

describe('projects', () => {
  it('owner creates and updates; non-owner cannot update arbitrary fields', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'projects/p1'), project()))
    await assertSucceeds(updateDoc(doc(as('alice'), 'projects/p1'), { name: 'Renamed' }))
    await assertFails(updateDoc(doc(as('alice'), 'projects/p1'), { ownerId: 'bob' }))
    await assertFails(updateDoc(doc(as('alice'), 'projects/p1'), { createdAt: 999 }))
    await assertFails(updateDoc(doc(as('bob'), 'projects/p1'), { name: 'X' }))
  })

  it('invitee can self-join via valid projectInvite (including batch with invite delete)', async () => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project())
      await setDoc(doc(c.firestore(), 'projectInvites/p1_charlie'), projectInvite('p1', 'charlie'))
    })

    // Non-invited user cannot self-join
    await assertFails(updateDoc(doc(as('dave'), 'projects/p1'), { memberIds: arrayUnion('dave') }))

    // Invitee cannot modify other fields while joining
    await assertFails(updateDoc(doc(as('charlie'), 'projects/p1'), {
      memberIds: ['alice', 'bob', 'charlie'], name: 'Hijacked',
    }))

    // Invitee cannot sneak in a second user or drop an existing member
    await assertFails(updateDoc(doc(as('charlie'), 'projects/p1'), {
      memberIds: ['alice', 'bob', 'charlie', 'mallory'],
    }))
    await assertFails(updateDoc(doc(as('charlie'), 'projects/p1'), {
      memberIds: ['alice', 'charlie', 'mallory'],
    }))

    // Invitee can atomically self-join and delete invite in a batch
    const charlieDb = as('charlie')
    const batch = writeBatch(charlieDb)
    batch.update(doc(charlieDb, 'projects/p1'), { memberIds: arrayUnion('charlie') })
    batch.delete(doc(charlieDb, 'projectInvites/p1_charlie'))
    await assertSucceeds(batch.commit())
  })

  it('non-owner member can self-leave; cannot kick others, edit other fields, or duplicate members; owner cannot self-leave', async () => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project({ memberIds: ['alice', 'bob', 'charlie'] }))
    })

    // Cannot edit other fields while leaving
    await assertFails(updateDoc(doc(as('bob'), 'projects/p1'), {
      memberIds: ['alice', 'charlie'], name: 'Hijacked',
    }))
    // Cannot kick another member
    await assertFails(updateDoc(doc(as('bob'), 'projects/p1'), {
      memberIds: ['alice', 'bob'],
    }))
    // Cannot kick another member while leaving by duplicating alice
    await assertFails(updateDoc(doc(as('bob'), 'projects/p1'), {
      memberIds: ['alice', 'alice'],
    }))
    // Owner cannot remove self
    await assertFails(updateDoc(doc(as('alice'), 'projects/p1'), {
      memberIds: arrayRemove('alice'),
    }))

    // Valid self-leave
    await assertSucceeds(updateDoc(doc(as('bob'), 'projects/p1'), {
      memberIds: arrayRemove('bob'),
    }))
  })
})

describe('default deny', () => {
  it('denies access to unknown collections', async () => {
    await assertFails(setDoc(doc(as('alice'), 'unknown/doc1'), { a: 1 }))
    await assertFails(getDoc(doc(as('alice'), 'unknown/doc1')))
  })
})
