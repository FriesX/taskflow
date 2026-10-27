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
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <ProjectGridSkeleton count={6} />
      </div>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('nav.projects')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {activeProjects.length} {t('project.all').toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="btn-gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
        >
          <Plus size={18} aria-hidden strokeWidth={2.5} />
          <span>{t('project.new')}</span>
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <div className="rounded-3xl glass-card border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto mb-4">
            <Folder size={32} />
          </div>
          <p className="text-slate-500 max-w-sm mx-auto mb-4 text-sm leading-relaxed">{t('project.empty')}</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="btn-gradient-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} aria-hidden strokeWidth={2.5} /> {t('project.new')}
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
                className="group flex flex-col justify-between rounded-3xl glass-card p-6 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-105"
                      style={{ backgroundColor: p.color }}
                    >
                      <Icon size={20} aria-hidden />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {projTasks.length} {t('stats.totalTasks').toLowerCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {p.name}
                  </h2>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>{progress}% {t('task.completed')}</span>
                    <span>{completedCount} / {projTasks.length}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500 shadow-xs"
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
