import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { subscribeLabels, subscribeProjectTasks, subscribeProjects, subscribeTasks } from '../services/data'
import {
  ensureUserProfile,
  getProfilesByIds,
  subscribeFriendships,
  subscribeIncomingProjectInvites,
} from '../services/social'
import { mergeUniqueTasks } from '../lib/socialLogic'
import type { Friendship, Label, Project, ProjectInvite, Task, UserProfile } from '../types'

interface DataState {
  tasks: Task[]
  projects: Project[]
  labels: Label[]
  profile: UserProfile | null
  friendships: Friendship[]
  incomingProjectInvites: ProjectInvite[]
  profiles: Record<string, UserProfile>
  pendingSocialCount: number
  ready: boolean
}

const Ctx = createContext<DataState>({
  tasks: [],
  projects: [],
  labels: [],
  profile: null,
  friendships: [],
  incomingProjectInvites: [],
  profiles: {},
  pendingSocialCount: 0,
  ready: false,
})

/** Realtime subscriptions per collection, shared across every page. */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ownTasks, setOwnTasks] = useState<Task[]>([])
  const [sharedProjectTasks, setSharedProjectTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [incomingProjectInvites, setIncomingProjectInvites] = useState<ProjectInvite[]>([])
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})
  const [ready, setReady] = useState(false)
  const fetchedUidsRef = useRef<Set<string>>(new Set())

  // Core user subscriptions + profile sync
  useEffect(() => {
    if (!user) return
    const uid = user.uid
    let active = true

    ensureUserProfile(user)
      .then(p => {
        if (!active) return
        setProfile(p)
        setProfiles(prev => ({ ...prev, [p.uid]: p }))
        fetchedUidsRef.current.add(p.uid)
      })
      .catch(err => {
        console.warn('[TaskFlow] Profile sync skipped (check Firestore rules):', err)
      })

    const offs = [
      subscribeTasks(uid, t => {
        setOwnTasks(t)
        setReady(true)
      }),
      subscribeProjects(uid, setProjects),
      subscribeLabels(uid, setLabels),
      subscribeFriendships(uid, setFriendships),
      subscribeIncomingProjectInvites(uid, setIncomingProjectInvites),
    ]
    return () => {
      active = false
      offs.forEach(f => f())
    }
  }, [user])

  // Subscribe to tasks of all shared projects (projects where memberIds.length > 1 or non-owner)
  const sharedProjectKey = useMemo(() => {
    if (!user) return ''
    return projects
      .filter(p => p.memberIds.length > 1 || p.ownerId !== user.uid)
      .map(p => p.id)
      .sort()
      .join(',')
  }, [projects, user])

  useEffect(() => {
    if (!user || !sharedProjectKey) return
    const ids = sharedProjectKey.split(',')
    return subscribeProjectTasks(ids, setSharedProjectTasks)
  }, [user, sharedProjectKey])

  // Lazily resolve UserProfiles for all friends, project members, and project inviters
  const neededUidsKey = useMemo(() => {
    if (!user) return ''
    const set = new Set<string>()
    for (const f of friendships) {
      f.users.forEach(id => set.add(id))
    }
    for (const p of projects) {
      p.memberIds.forEach(id => set.add(id))
    }
    for (const inv of incomingProjectInvites) {
      set.add(inv.inviterId)
      set.add(inv.inviteeId)
    }
    return Array.from(set).sort().join(',')
  }, [user, friendships, projects, incomingProjectInvites])

  useEffect(() => {
    if (!user || !neededUidsKey) return
    const missing = neededUidsKey.split(',').filter(id => !fetchedUidsRef.current.has(id))
    if (missing.length === 0) return

    missing.forEach(id => fetchedUidsRef.current.add(id))
    let cancelled = false

    getProfilesByIds(missing).then(fetched => {
      if (cancelled || Object.keys(fetched).length === 0) return
      setProfiles(prev => ({ ...prev, ...fetched }))
    })

    return () => {
      cancelled = true
    }
  }, [user, neededUidsKey])

  const tasks = useMemo(() => {
    if (!sharedProjectKey) return ownTasks
    return mergeUniqueTasks(ownTasks, sharedProjectTasks)
  }, [ownTasks, sharedProjectTasks, sharedProjectKey])

  const pendingSocialCount = useMemo(() => {
    if (!user) return 0
    const incomingFriends = friendships.filter(
      f => f.status === 'pending' && f.recipientId === user.uid,
    ).length
    return incomingFriends + incomingProjectInvites.length
  }, [user, friendships, incomingProjectInvites])

  return (
    <Ctx.Provider
      value={{
        tasks,
        projects,
        labels,
        profile,
        friendships,
        incomingProjectInvites,
        profiles,
        pendingSocialCount,
        ready,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useData = () => useContext(Ctx)
