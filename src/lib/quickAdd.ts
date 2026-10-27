import { addDays } from 'date-fns'
import type { Priority } from '../types'

export interface QuickAddResult {
  title: string
  dueAt: number | null
  hasTime: boolean
  labels: string[]
  project: string | null
  priority: Priority
}

const DAYS: Record<string, number> = {
  sunday: 0, minggu: 0, monday: 1, senin: 1, tuesday: 2, selasa: 2,
  wednesday: 3, rabu: 3, thursday: 4, kamis: 4, friday: 5, jumat: 5,
  saturday: 6, sabtu: 6,
}

/** Parses "Send report tomorrow 09:00 #work p1 @Website" into structured fields. */
export function parseQuickAdd(input: string, now: Date = new Date()): QuickAddResult {
  let text = ` ${input} `
  const labels: string[] = []
  let project: string | null = null
  let priority: Priority = 0
  let day: Date | null = null
  let time: { h: number; m: number } | null = null

  text = text.replace(/\s#([\p{L}\p{N}_-]+)/gu, (_, l) => { labels.push(l.toLowerCase()); return ' ' })
  text = text.replace(/\s@([\p{L}\p{N}_-]+)/gu, (_, p) => { project = p; return ' ' })
  text = text.replace(/\sp([1-4])(?=\s)/gi, (_, n) => {
    priority = (5 - Number(n)) as Priority // p1 = urgent(4) ... p4 = low(1)
    return ' '
  })
  text = text.replace(/\s(?:at\s|jam\s)?(\d{1,2})[:.](\d{2})(?=\s)/i, (_, h, m) => {
    if (Number(h) < 24 && Number(m) < 60) { time = { h: Number(h), m: Number(m) }; return ' ' }
    return _
  })
  text = text.replace(/\s(today|hari ini|tomorrow|besok|lusa)(?=\s)/i, (_, w) => {
    const k = String(w).toLowerCase()
    day = k === 'today' || k === 'hari ini' ? now : addDays(now, k === 'lusa' ? 2 : 1)
    return ' '
  })
  if (!day) {
    text = text.replace(/\s(?:on\s|hari\s)?([a-z]+)(?=\s)/gi, (m, w) => {
      const target = DAYS[String(w).toLowerCase()]
      if (target === undefined || day) return m
      const diff = ((target - now.getDay() + 7) % 7) || 7
      day = addDays(now, diff)
      return ' '
    })
  }

  let dueAt: number | null = null
  if (day || time) {
    const d = new Date(day ?? now)
    const t = time as { h: number; m: number } | null
    if (t) d.setHours(t.h, t.m, 0, 0); else d.setHours(23, 59, 0, 0)
    dueAt = d.getTime()
  }
  return {
    title: text.replace(/\s+/g, ' ').trim(),
    dueAt, hasTime: !!time, labels, project, priority,
  }
}
