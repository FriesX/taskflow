import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CalendarClock, CheckCircle2, Flame, FolderKanban, Star } from 'lucide-react'
import type { Task } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { isOverdue, isToday, isUpcoming, isDeleted, isCompletedToday, projectProgress, todaySummary } from '../lib/taskLogic'
import TaskItem from '../components/TaskItem'
import TaskDialog from '../components/TaskDialog'
import QuickAdd from '../components/QuickAdd'
import { DashboardSkeleton } from '../components/Skeleton'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { tasks, projects, ready } = useData()
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)

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
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'
  const name = user?.displayName ?? user?.email?.split('@')[0] ?? ''
  const openTask = (task: Task) => { setEditing(task); setOpen(true) }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Modern Asymmetric Hero Card */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-6 md:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        {/* Subtle decorative gradient background flare */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-tr from-teal-500/15 to-emerald-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mb-3">
              <Flame size={14} className="text-amber-500 animate-bounce" />
              <span>TaskFlow Workspace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t(`task.${greeting}`)}{name ? `, ${name}` : ''}
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              {summary.remaining > 0
                ? `${summary.remaining} ${t('task.left')}, ${summary.done} ${t('task.completed')}`
                : t('task.empty')}
            </p>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
              {summary.percent}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              {summary.done} / {summary.total} {t('task.completed')}
            </span>
          </div>
        </div>

        {/* Dynamic Toska-to-Emerald Progress bar */}
        <div className="relative mt-5">
          <div
            role="progressbar"
            aria-valuenow={summary.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80 p-0.5"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-500 to-emerald-600 transition-all duration-500 shadow-xs shadow-emerald-500/30"
              style={{ width: `${summary.percent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Quick Add with glassmorphism */}
      <QuickAdd />

      {/* Dynamic Metric Stat Cards with Micro-interactions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="group glass-card p-4 md:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('task.overdue')}
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-rose-500/15 to-red-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/40 dark:border-rose-800/40 group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{overdue.length}</div>
        </div>

        <div className="group glass-card p-4 md:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('nav.today')}
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 group-hover:scale-110 transition-transform">
              <Star size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {today.filter(x => x.status !== 'done').length}
          </div>
        </div>

        <div className="group glass-card p-4 md:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('nav.upcoming')}
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-800/40 group-hover:scale-110 transition-transform">
              <CalendarClock size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{upcoming.length}</div>
        </div>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600" />
            <h2 className="font-bold text-lg text-rose-600 tracking-tight">{t('task.overdue')}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold dark:bg-rose-950 dark:text-rose-300">
              {overdue.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {overdue.map(x => (
              <TaskItem key={x.id} task={x} onOpen={openTask} />
            ))}
          </ul>
        </section>
      )}

      {/* Today Section */}
      {today.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                {t('nav.today')}
              </h2>
            </div>
          </div>
          <ul className="space-y-2.5">
            {today.map(x => (
              <TaskItem key={x.id} task={x} onOpen={openTask} />
            ))}
          </ul>
        </section>
      ) : (
        <div className="p-8 text-center rounded-2xl glass-card border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('task.empty')}</p>
        </div>
      )}

      {/* Active Projects Preview */}
      {projects.filter(p => p.status === 'active').length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-slate-600 dark:text-slate-400" />
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
              {t('task.activeProjects')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects
              .filter(p => p.status === 'active')
              .map(p => {
                const prog = projectProgress(p.id, tasks)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl glass-card p-4 border border-slate-200/70 dark:border-slate-800/70 hover:-translate-y-0.5 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>{prog}%</span>
                      <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      <TaskDialog task={editing} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
