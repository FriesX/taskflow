import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from './quickAdd'

const now = new Date(2026, 9, 26, 10, 0) // Monday

describe('parseQuickAdd', () => {
  it('parses the PRD example', () => {
    const r = parseQuickAdd('Send report to client tomorrow 09:00 #work p1', now)
    expect(r.title).toBe('Send report to client')
    expect(r.labels).toEqual(['work'])
    expect(r.priority).toBe(4)
    const d = new Date(r.dueAt!)
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([27, 9, 0])
  })

  it('parses Indonesian', () => {
    const r = parseQuickAdd('Kirim laporan besok jam 09:00 #kerja p1', now)
    expect(r.title).toBe('Kirim laporan')
    expect(new Date(r.dueAt!).getDate()).toBe(27)
  })

  it('parses weekday and project', () => {
    const r = parseQuickAdd('Review friday @Website', now)
    expect(r.project).toBe('Website')
    expect(new Date(r.dueAt!).getDay()).toBe(5)
  })

  it('leaves plain titles untouched', () => {
    const r = parseQuickAdd('Buy milk', now)
    expect(r).toMatchObject({ title: 'Buy milk', dueAt: null, priority: 0 })
  })
})
