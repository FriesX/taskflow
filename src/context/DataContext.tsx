import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { subscribeLabels, subscribeProjects, subscribeTasks } from '../services/data'
import type { Label, Project, Task } from '../types'

interface DataState { tasks: Task[]; projects: Project[]; labels: Label[]; ready: boolean }
const Ctx = createContext<DataState>({ tasks: [], projects: [], labels: [], ready: false })

/** One realtime subscription per collection, shared by every page. */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    const offs = [
      subscribeTasks(uid, t => { setTasks(t); setReady(true) }),
      subscribeProjects(uid, setProjects),
      subscribeLabels(uid, setLabels),
    ]
    return () => offs.forEach(f => f())
  }, [user])

  return <Ctx.Provider value={{ tasks, projects, labels, ready }}>{children}</Ctx.Provider>
}

export const useData = () => useContext(Ctx)
