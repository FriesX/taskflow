import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  CartesianGrid,
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

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="max-w-5xl space-y-7">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
          {t('nav.stats')}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          {t('stats.overview')}
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('stats.totalTasks')}</span>
            <ListTodo size={15} className="text-[var(--ink-muted)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--ink)]">{total}</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('stats.completedTasks')}</span>
            <CheckCircle2 size={15} className="text-[var(--success)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--success)]">{completed}</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('stats.completionRate')}</span>
            <TrendingUp size={15} className="text-[var(--accent)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--accent)]">{rate}%</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
            <span>{t('stats.overdueTasks')}</span>
            <Clock size={15} className="text-[var(--danger)]" aria-hidden />
          </div>
          <div className="mt-2.5 font-mono-data text-3xl font-bold text-[var(--danger)]">{overdue}</div>
        </div>
      </div>

      {/* 7-Day Productivity Chart */}
      <section className="surface-card p-6">
        <h2 className="mb-6 font-display text-base font-bold text-[var(--ink)]">
          {t('stats.weeklyTrend')}
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--bg-subtle)', opacity: 0.6 }}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  borderRadius: '10px',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-md)',
                }}
                formatter={(val) => [`${val}`, t('stats.tasksCompleted')]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="completed" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Project Breakdown */}
      {activeProjects.length > 0 && (
        <section className="surface-card p-6">
          <h2 className="mb-5 font-display text-base font-bold text-[var(--ink)]">
            {t('stats.projectBreakdown')}
          </h2>
          <div className="space-y-4">
            {activeProjects.map(p => {
              const projTasks = liveTasks.filter(t => t.projectId === p.id)
              const doneCount = projTasks.filter(t => t.status === 'done').length
              const prog = projectProgress(p.id, tasks)

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-mono-data text-xs text-[var(--ink-muted)]">
                      {doneCount}/{projTasks.length} ({prog}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
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
