import { endOfDay, isBefore, startOfDay } from 'date-fns'
import type { Task } from '../types'

export const isDeleted = (t: Task) => t.deletedAt != null
export const isActive = (t: Task) => !isDeleted(t) && t.status !== 'archived' && !t.parentTaskId

export function isOverdue(t: Task, now = new Date()): boolean {
  return isActive(t) && t.status !== 'done' && t.dueAt != null && isBefore(t.dueAt, now)
}

export function isToday(t: Task, now = new Date()): boolean {
  if (!isActive(t) || t.dueAt == null) return false
  return t.dueAt >= startOfDay(now).getTime() && t.dueAt <= endOfDay(now).getTime()
}

export function isCompletedToday(t: Task, now = new Date()): boolean {
  if (isDeleted(t) || t.parentTaskId || t.status !== 'done' || !t.completedAt) return false
  return t.completedAt >= startOfDay(now).getTime() && t.completedAt <= endOfDay(now).getTime()
}

export function isUpcoming(t: Task, now = new Date()): boolean {
  return isActive(t) && t.dueAt != null && t.dueAt > endOfDay(now).getTime()
}

export function subtasksOf(tasks: Task[], parentId: string): Task[] {
  return tasks.filter(t => t.parentTaskId === parentId && !isDeleted(t))
}

/** Progress 0-100 from subtasks (or done state if none). */
export function progressOf(task: Task, tasks: Task[]): number {
  const subs = subtasksOf(tasks, task.id)
  if (!subs.length) return task.status === 'done' ? 100 : 0
  return Math.round((subs.filter(s => s.status === 'done').length / subs.length) * 100)
}

export function projectProgress(projectId: string, tasks: Task[]): number {
  const own = tasks.filter(t => t.projectId === projectId && isActive(t))
  if (!own.length) return 0
  return Math.round((own.filter(t => t.status === 'done').length / own.length) * 100)
}

/**
 * Today summary includes:
 * 1. Tasks due today (whether completed or pending)
 * 2. Any task completed today (even if originally from inbox or upcoming)
 */
export function todaySummary(tasks: Task[], now = new Date()) {
  const live = tasks.filter(t => !isDeleted(t) && !t.parentTaskId && t.status !== 'archived')
  const relevant = live.filter(t => isToday(t, now) || isCompletedToday(t, now))
  const done = relevant.filter(t => t.status === 'done').length
  const total = relevant.length
  return {
    total,
    done,
    remaining: Math.max(0, total - done),
    percent: total ? Math.round((done / total) * 100) : 0,
  }
}

export function filterTasks(
  tasks: Task[],
  query: string,
  filters: { priority: number | 'all'; status: string | 'all'; projectId: string | 'all' },
): Task[] {
  const q = query.trim().toLowerCase()
  return tasks.filter(t => {
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.projectId !== 'all' && t.projectId !== filters.projectId) return false
    if (q) {
      const matchTitle = t.title.toLowerCase().includes(q)
      const matchDesc = t.description?.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
    }
    return true
  })
}
