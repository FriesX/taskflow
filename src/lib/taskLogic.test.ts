import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { isOverdue, isToday, isUpcoming, isCompletedToday, progressOf, projectProgress, todaySummary, filterTasks } from './taskLogic'

const now = new Date(2026, 9, 26, 12, 0)
const mk = (o: Partial<Task>): Task => ({
  id: 'x', title: 't', description: '', status: 'todo', priority: 0, startAt: null, dueAt: null,
  completedAt: null, projectId: null, parentTaskId: null, labelIds: [], ownerId: 'u',
  assigneeId: null, deletedAt: null, createdAt: 0, updatedAt: 0, ...o,
})
const at = (d: number, h = 9) => new Date(2026, 9, d, h).getTime()

describe('taskLogic', () => {
  it('flags overdue only for unfinished past tasks', () => {
    expect(isOverdue(mk({ dueAt: at(25) }), now)).toBe(true)
    expect(isOverdue(mk({ dueAt: at(25), status: 'done' }), now)).toBe(false)
    expect(isOverdue(mk({ dueAt: at(27) }), now)).toBe(false)
    expect(isOverdue(mk({ dueAt: at(25), deletedAt: 1 }), now)).toBe(false)
  })
  it('classifies today and upcoming', () => {
    expect(isToday(mk({ dueAt: at(26, 8) }), now)).toBe(true)
    expect(isUpcoming(mk({ dueAt: at(28) }), now)).toBe(true)
    expect(isUpcoming(mk({ dueAt: at(26, 20) }), now)).toBe(false)
  })
  it('classifies completed today', () => {
    expect(isCompletedToday(mk({ status: 'done', completedAt: at(26, 10) }), now)).toBe(true)
    expect(isCompletedToday(mk({ status: 'done', completedAt: at(25, 10) }), now)).toBe(false)
    expect(isCompletedToday(mk({ status: 'todo', completedAt: at(26, 10) }), now)).toBe(false)
  })
  it('computes subtask progress', () => {
    const p = mk({ id: 'p' })
    const subs = [
      mk({ id: 'a', parentTaskId: 'p', status: 'done' }),
      mk({ id: 'b', parentTaskId: 'p' }),
    ]
    expect(progressOf(p, [p, ...subs])).toBe(50)
  })
  it('computes project progress and today summary with completed upcoming tasks', () => {
    const ts = [
      mk({ id: '1', projectId: 'pr', status: 'done', dueAt: at(26), completedAt: at(26) }),
      mk({ id: '2', projectId: 'pr', dueAt: at(26) }),
      // Upcoming task completed today:
      mk({ id: '3', dueAt: at(28), status: 'done', completedAt: at(26, 11) }),
    ]
    expect(projectProgress('pr', ts)).toBe(50)
    // 2 due today + 1 upcoming completed today = 3 total, 2 completed = 67%
    expect(todaySummary(ts, now)).toEqual({ total: 3, done: 2, remaining: 1, percent: 67 })
  })
  it('filters tasks by query, priority, and project', () => {
    const list = [
      mk({ id: '1', title: 'Buy groceries', priority: 1, projectId: 'p1', status: 'todo' }),
      mk({ id: '2', title: 'Deploy website', priority: 4, projectId: 'p2', status: 'doing' }),
      mk({ id: '3', title: 'Buy books', description: 'science fiction', priority: 2, projectId: 'p1', status: 'todo' }),
    ]
    expect(filterTasks(list, 'buy', { priority: 'all', status: 'all', projectId: 'all' })).toHaveLength(2)
    expect(filterTasks(list, '', { priority: 4, status: 'all', projectId: 'all' })).toHaveLength(1)
    expect(filterTasks(list, '', { priority: 'all', status: 'all', projectId: 'p1' })).toHaveLength(2)
    expect(filterTasks(list, 'science', { priority: 'all', status: 'all', projectId: 'all' })).toHaveLength(1)
  })
})
