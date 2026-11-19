import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Check,
  Code,
  Folder,
  GraduationCap,
  Heart,
  Home,
  Plus,
  Rocket,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { isDeleted, projectProgress } from '../lib/taskLogic'
import { acceptProjectInvite, declineOrCancelProjectInvite } from '../services/social'
import type { ProjectInvite } from '../types'
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
  const { user } = useAuth()
  const { projects, tasks, incomingProjectInvites, profiles, ready } = useData()
  const { success, error } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null)

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

  const handleAcceptInvite = async (invite: ProjectInvite) => {
    if (!user) return
    setBusyInviteId(invite.id)
    try {
      await acceptProjectInvite(invite, user.uid)
      success(t('friends.projectJoined', { name: invite.projectName }), t('nav.projects'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyInviteId(null)
    }
  }

  const handleDeclineInvite = async (invite: ProjectInvite) => {
    setBusyInviteId(invite.id)
    try {
      await declineOrCancelProjectInvite(invite.id)
      success(invite.projectName, t('friends.projectDeclined'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyInviteId(null)
    }
  }

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

      {/* Incoming Project Invites Banner */}
      {incomingProjectInvites.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            <span>{t('friends.projectInvites')}</span>
            <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono-data">
              {incomingProjectInvites.length}
            </span>
          </div>
          <ul className="space-y-2">
            {incomingProjectInvites.map(invite => {
              const inviter = profiles[invite.inviterId]
              const inviterName = inviter?.displayName || inviter?.email || 'TaskFlow User'
              return (
                <li
                  key={invite.id}
                  className="surface-card flex flex-wrap items-center justify-between gap-3 border-[var(--accent-border)] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: invite.projectColor }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--ink)]">
                        {invite.projectName}
                      </div>
                      <div className="truncate text-xs text-[var(--ink-secondary)]">
                        {t('friends.invitedBy', { name: inviterName })}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={busyInviteId === invite.id}
                      onClick={() => handleAcceptInvite(invite)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Check size={13} aria-hidden />
                      <span>{t('friends.accept')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyInviteId === invite.id}
                      onClick={() => handleDeclineInvite(invite)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <X size={13} aria-hidden />
                      <span>{t('friends.decline')}</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

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
            const isShared = p.memberIds.length > 1

            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="surface-interactive group flex flex-col justify-between p-5"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      <Icon size={18} aria-hidden />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isShared && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-mono-data text-[11px] font-medium text-[var(--accent)]">
                          <Users size={11} aria-hidden />
                          {p.memberIds.length}
                        </span>
                      )}
                      <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-0.5 font-mono-data text-[11px] font-medium text-[var(--ink-secondary)]">
                        {projTasks.length} {t('stats.totalTasks').toLowerCase()}
                      </span>
                    </div>
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
