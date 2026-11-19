import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Task } from '../types'
import { useData } from '../context/DataContext'

export default function CalendarView({
  tasks,
  onOpen,
  onAddTaskDate,
}: {
  tasks: Task[]
  onOpen: (t: Task) => void
  onAddTaskDate: (date: Date) => void
}) {
  const { t } = useTranslation()
  const { projects } = useData()
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="surface-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <h2 className="font-display text-lg font-bold tracking-tight text-[var(--ink)]">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            {t('calendar.today')}
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            aria-label={t('calendar.prev')}
            className="btn-secondary p-1.5"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            aria-label={t('calendar.next')}
            className="btn-secondary p-1.5"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-subtle)]/60 py-2.5 text-center font-mono-data text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr gap-px bg-[var(--border)]">
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.dueAt && isSameDay(t.dueAt, day))
          const isCurrMonth = isSameMonth(day, monthStart)
          const isDayToday = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={`group flex min-h-[108px] flex-col p-2 transition-colors ${
                isCurrMonth ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-canvas)]/70'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md font-mono-data text-xs font-medium ${
                    isDayToday
                      ? 'bg-[var(--accent)] text-white font-semibold'
                      : isCurrMonth
                      ? 'text-[var(--ink)]'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <button
                  type="button"
                  onClick={() => onAddTaskDate(day)}
                  aria-label={t('common.add')}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-md p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent)] transition-opacity cursor-pointer"
                >
                  <Plus size={13} aria-hidden />
                </button>
              </div>

              <div className="mt-0.5 flex-1 space-y-1 overflow-y-auto max-h-24">
                {dayTasks.slice(0, 3).map(task => {
                  const proj = projects.find(p => p.id === task.projectId)
                  const done = task.status === 'done'
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpen(task)}
                      className={`flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-[var(--bg-subtle)] cursor-pointer ${
                        done ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink)]'
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: proj?.color || 'var(--accent)' }}
                      />
                      <span className="truncate font-medium">{task.title}</span>
                    </button>
                  )
                })}
                {dayTasks.length > 3 && (
                  <div className="px-1.5 font-mono-data text-[10px] font-medium text-[var(--ink-muted)]">
                    +{dayTasks.length - 3}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
