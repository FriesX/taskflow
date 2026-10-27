import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { endOfDay, format, isWithinInterval, startOfDay, subDays } from 'date-fns'
import { CheckCircle2, Clock, ListTodo, TrendingUp } from 'lucide-react'
import { useData } from '../context/DataContext'
import { isDeleted, isOverdue, projectProgress } from '../lib/taskLogic'
import { StatsSkeleton } from '../components/Skeleton'

export default function Stats() {
  const { t } = useTranslation()
  const { tasks, projects, ready } = useData()

  const liveTasks = useMemo(
    () => tasks.filter(t => !isDeleted(t) && !t.parentTaskId),
    [tasks],
  )

  const total = liveTasks.length
  const completed = liveTasks.filter(t => t.status === 'done').length
  const overdue = liveTasks.filter(t => isOverdue(t)).length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  // 7-day productivity trend
  const chartData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(today, 6 - i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const count = liveTasks.filter(
        t =>
          t.status === 'done' &&
          t.completedAt &&
          isWithinInterval(t.completedAt, { start: dayStart, end: dayEnd }),
      ).length

      return {
        name: format(day, 'EEE'),
        date: format(day, 'MMM d'),
        completed: count,
      }
    })
  }, [liveTasks])

  if (!ready) {
    return <StatsSkeleton />
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('nav.stats')}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          {t('stats.overview')}
        </p>
      </div>

      {/* Metric Cards with Asymmetric Grid & Micro-interactions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="group rounded-3xl glass-card p-5 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('stats.totalTasks')}</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 group-hover:scale-110 transition-transform">
              <ListTodo size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{total}</div>
        </div>

        <div className="group rounded-3xl glass-card p-5 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('stats.completedTasks')}</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-teal-500/15 to-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
            {completed}
          </div>
        </div>

        <div className="group rounded-3xl glass-card p-5 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('stats.completionRate')}</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-blue-500/15 to-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {rate}%
          </div>
        </div>

        <div className="group rounded-3xl glass-card p-5 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('stats.overdueTasks')}</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-rose-500/15 to-red-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/40 dark:border-rose-800/40 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {overdue}
          </div>
        </div>
      </div>

      {/* Weekly Chart with Dynamic Gradient Bars */}
      <section className="rounded-3xl glass-card p-6 border border-slate-200/70 dark:border-slate-800/70">
        <h2 className="mb-6 text-lg font-bold text-slate-800 dark:text-slate-100">{t('stats.weeklyTrend')}</h2>
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#cbd5e1" strokeDasharray="3 3" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'rgba(51, 65, 85, 0.6)',
                  borderRadius: '1rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(val) => [`${val} tasks`, t('stats.tasksCompleted')]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="completed" fill="url(#productivityGradient)" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Project Breakdown with Toska-to-Emerald Progress Bars */}
      {projects.filter(p => p.status === 'active').length > 0 && (
        <section className="rounded-3xl glass-card p-6 border border-slate-200/70 dark:border-slate-800/70">
          <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">{t('stats.projectBreakdown')}</h2>
          <div className="space-y-4">
            {projects
              .filter(p => p.status === 'active')
              .map(p => {
                const projTasks = liveTasks.filter(t => t.projectId === p.id)
                const doneCount = projTasks.filter(t => t.status === 'done').length
                const prog = projectProgress(p.id, tasks)

                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {doneCount} / {projTasks.length} ({prog}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500 shadow-xs"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}
    </div>
  )
}
