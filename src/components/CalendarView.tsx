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
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="rounded-3xl glass-card p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className="rounded-xl glass-panel px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5 transition-all cursor-pointer shadow-xs"
          >
            {t('calendar.today')}
          </button>
          <button
            onClick={prevMonth}
            aria-label={t('calendar.prev')}
            className="rounded-xl glass-panel p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            onClick={nextMonth}
            aria-label={t('calendar.next')}
            className="rounded-xl glass-panel p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200/70 pb-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800/70">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl overflow-hidden mt-2 shadow-xs">
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.dueAt && isSameDay(t.dueAt, day))
          const isCurrMonth = isSameMonth(day, monthStart)
          const isDayToday = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={`group flex min-h-[110px] flex-col p-2 transition-colors ${
                isCurrMonth ? 'bg-white/90 dark:bg-slate-900/90' : 'bg-slate-50/70 dark:bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    isDayToday
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs'
                      : isCurrMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <button
                  type="button"
                  onClick={() => onAddTaskDate(day)}
                  aria-label={t('common.add')}
                  className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition cursor-pointer"
                >
                  <Plus size={14} aria-hidden />
                </button>
              </div>

              {/* Task Chips */}
              <div className="mt-1 flex-1 space-y-1 overflow-y-auto max-h-24">
                {dayTasks.slice(0, 3).map(task => {
                  const proj = projects.find(p => p.id === task.projectId)
                  const done = task.status === 'done'
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpen(task)}
                      className={`flex w-full items-center gap-1.5 truncate rounded-lg px-2 py-1 text-left text-xs transition hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer ${
                        done ? 'line-through text-slate-400 opacity-60' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: proj?.color || '#6366f1' }}
                      />
                      <span className="truncate font-medium">{task.title}</span>
                    </button>
                  )
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-slate-400 px-1 font-semibold">
                    +{dayTasks.length - 3} more
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
