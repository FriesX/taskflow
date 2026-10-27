import { describe, expect, it } from 'vitest'
import type { Task, Project, Label } from '../types'
import { exportToJSON, exportToCSV, parseCSVTasks } from './exportImport'

const sampleTasks: Task[] = [
  {
    id: 't1',
    title: 'Finish report',
    description: 'Quarterly financial report, with numbers',
    status: 'doing',
    priority: 3,
    startAt: null,
    dueAt: new Date(2026, 9, 27).getTime(),
    completedAt: null,
    projectId: 'p1',
    parentTaskId: null,
    labelIds: ['l1'],
    ownerId: 'u1',
    assigneeId: null,
    deletedAt: null,
    createdAt: 1000,
    updatedAt: 1000,
  },
]

const sampleProjects: Project[] = [
  {
    id: 'p1',
    name: 'Finance',
    color: '#6366f1',
    icon: 'briefcase',
    ownerId: 'u1',
    memberIds: ['u1'],
    status: 'active',
    createdAt: 1000,
  },
]

const sampleLabels: Label[] = [
  {
    id: 'l1',
    name: 'work',
    color: '#f59e0b',
    ownerId: 'u1',
  },
]

describe('exportImport', () => {
  it('exports and formats JSON correctly', () => {
    const jsonStr = exportToJSON(sampleTasks, sampleProjects, sampleLabels)
    const parsed = JSON.parse(jsonStr)
    expect(parsed.version).toBe('1.0')
    expect(parsed.tasks).toHaveLength(1)
    expect(parsed.tasks[0].title).toBe('Finish report')
    expect(parsed.projects[0].name).toBe('Finance')
  })

  it('exports CSV with proper escaping', () => {
    const csvStr = exportToCSV(sampleTasks, sampleProjects, sampleLabels)
    expect(csvStr).toContain('Title,Status,Priority,Due Date,Project,Labels,Description')
    expect(csvStr).toContain('Finish report')
    expect(csvStr).toContain('"Quarterly financial report, with numbers"')
    expect(csvStr).toContain('Finance')
    expect(csvStr).toContain('work')
  })

  it('parses CSV tasks correctly including quotes with commas', () => {
    const csv = `Title,Status,Priority,Due Date,Project,Labels,Description
"Buy groceries, fruits",todo,2,,Home,,"Fresh produce, apples"
Walk dog,doing,1,,,,
`
    const items = parseCSVTasks(csv)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Buy groceries, fruits')
    expect(items[0].priority).toBe(2)
    expect(items[0].description).toBe('Fresh produce, apples')
    expect(items[1].title).toBe('Walk dog')
  })
})
