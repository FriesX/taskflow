import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { chunkArray } from '../lib/socialLogic'
import type { Label, Project, Task } from '../types'

export function subscribeTasks(uid: string, cb: (t: Task[]) => void) {
  return onSnapshot(query(collection(db, 'tasks'), where('ownerId', '==', uid)), s =>
    cb(s.docs.map(d => d.data() as Task)))
}

/** Subscribes to tasks belonging to any project the user is a member of (chunked by 30 for Firestore `in` limit). */
export function subscribeProjectTasks(projectIds: string[], cb: (t: Task[]) => void) {
  const chunks = chunkArray(projectIds, 30)
  if (chunks.length === 0) {
    cb([])
    return () => {}
  }

  const buckets = new Map<number, Task[]>()
  const emit = () => {
    const merged: Task[] = []
    buckets.forEach(list => merged.push(...list))
    cb(merged)
  }

  const unsubs = chunks.map((ids, idx) =>
    onSnapshot(
      query(collection(db, 'tasks'), where('projectId', 'in', ids)),
      snap => {
        buckets.set(idx, snap.docs.map(d => d.data() as Task))
        emit()
      },
      () => {
        // Ignore transient permission errors if user was just removed from a project
        buckets.set(idx, [])
        emit()
      },
    ),
  )

  return () => unsubs.forEach(u => u())
}

export function subscribeProjects(uid: string, cb: (p: Project[]) => void) {
  return onSnapshot(query(collection(db, 'projects'), where('memberIds', 'array-contains', uid)), s =>
    cb(s.docs.map(d => ({ ...(d.data() as Project), id: d.id }))))
}

export function subscribeLabels(uid: string, cb: (l: Label[]) => void) {
  return onSnapshot(query(collection(db, 'labels'), where('ownerId', '==', uid)), s =>
    cb(s.docs.map(d => ({ ...(d.data() as Label), id: d.id }))))
}

export type NewTask = Partial<Omit<Task, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>> & { title: string }

export async function createTask(uid: string, input: NewTask): Promise<string> {
  const ref = doc(collection(db, 'tasks'))
  const now = Date.now()
  const task: Task = {
    description: '', status: 'todo', priority: 0, startAt: null, dueAt: null, completedAt: null,
    projectId: null, parentTaskId: null, labelIds: [], assigneeId: null, deletedAt: null,
    ...input, id: ref.id, ownerId: uid, createdAt: now, updatedAt: now,
  }
  await setDoc(ref, task)
  return ref.id
}

export const updateTask = (id: string, patch: Partial<Task>) =>
  updateDoc(doc(db, 'tasks', id), { ...patch, updatedAt: Date.now() })

export const toggleDone = (t: Task) =>
  updateTask(t.id, t.status === 'done'
    ? { status: 'todo', completedAt: null }
    : { status: 'done', completedAt: Date.now() })

/** Soft delete → recycle bin. */
export const trashTask = (id: string) => updateTask(id, { deletedAt: Date.now() })
export const restoreTask = (id: string) => updateTask(id, { deletedAt: null })
export const deleteTaskForever = (id: string) => deleteDoc(doc(db, 'tasks', id))

export async function createProject(uid: string, p: Pick<Project, 'name' | 'color' | 'icon'>) {
  const project: Omit<Project, 'id'> = {
    ...p, ownerId: uid, memberIds: [uid], status: 'active', createdAt: Date.now(),
  }
  return (await addDoc(collection(db, 'projects'), project)).id
}

export async function createLabel(uid: string, name: string, color: string) {
  return (await addDoc(collection(db, 'labels'), { name, color, ownerId: uid })).id
}
