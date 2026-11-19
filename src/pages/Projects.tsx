import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Code,
  Folder,
  GraduationCap,
  Heart,
  Home,
  Plus,
  Rocket,
  ShoppingCart,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { isDeleted, projectProgress } from '../lib/taskLogic'
import ProjectDialog from '../components/ProjectDialog'
import { ProjectGridSkeleton, Skeleton } from '../components/Skeleton'

const ICON_MAP: Record<string, typeof Folder> = {
  folder: Folder,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  home: Home,
  heart: Heart,
  rocket: Rocket,
  code: Code,
  'shopping-cart': ShoppingCart,
}

export default function Projects() {
  const { t } = useTranslation()
  const { projects, tasks, ready } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!ready) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
        <ProjectGridSkeleton count={6} />
      </div>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
            {t('nav.projects')}
          </h1>
          <p className="mt-1 font-mono-data text-xs text-[var(--ink-muted)]">
            {activeProjects.length} {t('project.all').toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="btn-primary px-4 py-2 text-sm"
        >
          <Plus size={16} aria-hidden strokeWidth={2.4} />
          <span>{t('project.new')}</span>
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/60 p-12 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--ink-secondary)]">
            <Folder size={22} />
          </div>
          <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-[var(--ink-secondary)]">
            {t('project.empty')}
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            <Plus size={16} aria-hidden />
            <span>{t('project.new')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map(p => {
            const Icon = ICON_MAP[p.icon] || Folder
            const projTasks = tasks.filter(t => t.projectId === p.id && !isDeleted(t) && !t.parentTaskId)
            const progress = projectProgress(p.id, tasks)
            const completedCount = projTasks.filter(t => t.status === 'done').length

            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="surface-interactive group flex flex-col justify-between p-5"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      <Icon size={18} aria-hidden />
                    </div>
                    <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-0.5 font-mono-data text-[11px] font-medium text-[var(--ink-secondary)]">
                      {projTasks.length} {t('stats.totalTasks').toLowerCase()}
                    </span>
                  </div>
                  <h2 className="truncate font-display text-base font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {p.name}
                  </h2>
                </div>

                <div className="mt-6 border-t border-[var(--border)] pt-3.5">
                  <div className="mb-2 flex justify-between font-mono-data text-xs text-[var(--ink-muted)]">
                    <span>{progress}% {t('task.completed')}</span>
                    <span>{completedCount}/{projTasks.length}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <ProjectDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
