import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { AlertCircle, ArrowUpRight, CalendarClock, CheckCircle2, FolderKanban, Star } from 'lucide-react'
import type { Task } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  isCompletedToday,
  isDeleted,
  isOverdue,
  isToday,
  isUpcoming,
  projectProgress,
  todaySummary,
} from '../lib/taskLogic'
import TaskItem from '../components/TaskItem'
import TaskDialog from '../components/TaskDialog'
import QuickAdd from '../components/QuickAdd'
import { DashboardSkeleton } from '../components/Skeleton'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { tasks, projects, profile, ready } = useData()
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)
  const [now] = useState(() => new Date())

  if (!ready) {
    return <DashboardSkeleton />
  }

  const live = tasks.filter(x => !isDeleted(x) && !x.parentTaskId)
  const summary = todaySummary(live)
  const overdue = live.filter(x => isOverdue(x))
  const today = live
    .filter(x => (isToday(x) || isCompletedToday(x)) && !isOverdue(x))
    .sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0))
  const upcoming = live.filter(x => isUpcoming(x) && x.status !== 'done')
  const hour = now.getHours()
  const greeting = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'
  const name = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || ''
  const openTask = (task: Task) => {
    setEditing(task)
    setOpen(true)
  }

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="max-w-4xl space-y-7">
      {/* Editorial Header + Progress Card */}
      <section className="surface-card p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono-data text-xs text-[var(--ink-muted)]">
              {format(now, 'EEEE, MMMM d, yyyy')}
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
              {t(`task.${greeting}`)}
              {name ? `, ${name}` : ''}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
              {summary.remaining > 0
                ? `${summary.remaining} ${t('task.left')}, ${summary.done} ${t('task.completed')}`
                : t('task.empty')}
            </p>
          </div>

          <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0.5">
            <span className="font-mono-data text-3xl font-bold tracking-tight text-[var(--success)]">
              {summary.percent}%
            </span>
            <span className="font-mono-data text-xs text-[var(--ink-muted)]">
              {summary.done} / {summary.total} {t('task.completed')}
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={summary.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]"
        >
          <div
            className="h-full rounded-full bg-[var(--success)] transition-all duration-500"
            style={{ width: `${summary.percent}%` }}
          />
        </div>
      </section>

      {/* Quick Add */}
      <QuickAdd />

      {/* Precision KPI Strip */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Link to="/today" className="surface-interactive p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('task.overdue')}</span>
            <AlertCircle size={15} className="text-[var(--danger)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--danger)]">
            {overdue.length}
          </div>
        </Link>

        <Link to="/today" className="surface-interactive p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('nav.today')}</span>
            <Star size={15} className="text-[var(--accent)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--ink)]">
            {today.filter(x => x.status !== 'done').length}
          </div>
        </Link>

        <Link to="/upcoming" className="surface-interactive p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('nav.upcoming')}</span>
            <CalendarClock size={15} className="text-[var(--warning)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--ink)]">
            {upcoming.length}
          </div>
        </Link>
      </div>

      {/* Overdue Tasks */}
      {overdue.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--danger)]" aria-hidden />
            <h2 className="font-display text-base font-bold tracking-tight text-[var(--danger)]">
              {t('task.overdue')}
            </h2>
            <span className="rounded-md bg-[var(--danger-soft)] px-1.5 py-0.5 font-mono-data text-xs font-semibold text-[var(--danger)]">
              {overdue.length}
            </span>
          </div>
          <ul className="space-y-2">
            {overdue.map(x => (
              <TaskItem key={x.id} task={x} onOpen={openTask} />
            ))}
          </ul>
        </section>
      )}

      {/* Today Tasks */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[var(--accent)]" aria-hidden />
          <h2 className="font-display text-base font-bold tracking-tight text-[var(--ink)]">
            {t('nav.today')}
          </h2>
          <span className="rounded-md bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono-data text-xs text-[var(--ink-muted)]">
            {today.length}
          </span>
        </div>

        {today.length > 0 ? (
          <ul className="space-y-2">
            {today.map(x => (
              <TaskItem key={x.id} task={x} onOpen={openTask} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/60 p-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">{t('task.empty')}</p>
          </div>
        )}
      </section>

      {/* Active Projects Preview */}
      {activeProjects.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-[var(--ink-muted)]" aria-hidden />
              <h2 className="font-display text-base font-bold tracking-tight text-[var(--ink)]">
                {t('task.activeProjects')}
              </h2>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <span>{t('project.all')}</span>
              <ArrowUpRight size={13} aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeProjects.map(p => {
              const prog = projectProgress(p.id, tasks)
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="surface-interactive flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="truncate text-sm font-semibold text-[var(--ink)]">{p.name}</span>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2.5">
                    <span className="font-mono-data text-xs font-medium text-[var(--ink-secondary)]">{prog}%</span>
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div
                        className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <TaskDialog task={editing} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
