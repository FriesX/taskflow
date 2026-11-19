import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Send, UserMinus, Users, X } from 'lucide-react'
import type { Project, ProjectInvite, UserProfile } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import {
  declineOrCancelProjectInvite,
  leaveProject,
  removeProjectMember,
  sendProjectInvite,
  subscribeProjectInvitesForProject,
} from '../services/social'

function MemberAvatar({ profile, fallback }: { profile?: UserProfile; fallback: string }) {
  const label = profile?.displayName || fallback
  const initials = label.slice(0, 2).toUpperCase()
  if (profile?.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt={label}
        referrerPolicy="no-referrer"
        className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)] object-cover"
      />
    )
  }
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] font-mono-data text-[11px] font-semibold text-[var(--ink)]">
      {initials}
    </div>
  )
}

export default function ProjectMembersDialog({
  project,
  open,
  onClose,
}: {
  project: Project
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { friendships, profiles } = useData()
  const { success, error } = useToast()
  const ref = useRef<HTMLDialogElement>(null)
  const [pendingInvites, setPendingInvites] = useState<ProjectInvite[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const uid = user?.uid ?? ''
  const isOwner = uid === project.ownerId

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    if (!open || !isOwner || !uid) return
    return subscribeProjectInvitesForProject(project.id, uid, setPendingInvites)
  }, [open, isOwner, project.id, uid])

  const acceptedFriendUids = friendships
    .filter(f => f.status === 'accepted')
    .map(f => (f.users[0] === uid ? f.users[1] : f.users[0]))

  const pendingInviteeSet = new Set(pendingInvites.map(i => i.inviteeId))
  const memberSet = new Set(project.memberIds)
  const eligibleFriendUids = acceptedFriendUids.filter(
    fUid => !memberSet.has(fUid) && !pendingInviteeSet.has(fUid),
  )

  const handleInvite = async (friendUid: string) => {
    setBusyId(friendUid)
    try {
      await sendProjectInvite(project, uid, friendUid)
      const name = profiles[friendUid]?.displayName || profiles[friendUid]?.email || 'Friend'
      success(t('projectMembers.invited', { name }), project.name)
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    setBusyId(inviteId)
    try {
      await declineOrCancelProjectInvite(inviteId)
      success(project.name, t('projectMembers.inviteCancelled'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const handleRemoveMember = async (memberUid: string) => {
    setBusyId(memberUid)
    try {
      await removeProjectMember(project.id, memberUid)
      success(project.name, t('projectMembers.memberRemoved'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const handleLeave = async () => {
    setBusyId(uid)
    try {
      await leaveProject(project.id, uid)
      success(t('projectMembers.leftProject', { name: project.name }))
      onClose()
      navigate('/projects')
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="proj-members-title"
      className="surface-elevated m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-6 text-[var(--ink)]"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
            <h2 id="proj-members-title" className="truncate font-display text-lg font-bold text-[var(--ink)]">
              {t('projectMembers.title')}
            </h2>
            <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-0.5 font-mono-data text-xs text-[var(--ink-muted)]">
              {project.memberIds.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Current Members */}
        <div className="space-y-2">
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)]">
            {project.memberIds.map(memberUid => {
              const p = profiles[memberUid]
              const name = p?.displayName || p?.email || memberUid.slice(0, 8)
              const isMemberOwner = memberUid === project.ownerId
              const isSelf = memberUid === uid
              return (
                <li key={memberUid} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MemberAvatar profile={p} fallback={name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-[var(--ink)]">{name}</span>
                        {isMemberOwner && (
                          <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                            {t('projectMembers.ownerBadge')}
                          </span>
                        )}
                        {isSelf && !isMemberOwner && (
                          <span className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-muted)]">
                            {t('projectMembers.youBadge')}
                          </span>
                        )}
                      </div>
                      {p?.email && (
                        <div className="truncate font-mono-data text-[11px] text-[var(--ink-muted)]">
                          {p.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwner && !isMemberOwner && (
                    <button
                      type="button"
                      disabled={busyId === memberUid}
                      onClick={() => handleRemoveMember(memberUid)}
                      className="btn-ghost px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--danger)]"
                    >
                      <UserMinus size={13} aria-hidden />
                      <span>{t('projectMembers.remove')}</span>
                    </button>
                  )}

                  {!isOwner && isSelf && (
                    <button
                      type="button"
                      disabled={busyId === uid}
                      onClick={handleLeave}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--danger)] hover:opacity-85 cursor-pointer"
                    >
                      <LogOut size={12} aria-hidden />
                      <span>{t('projectMembers.leave')}</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Owner-only: Pending Invites */}
        {isOwner && pendingInvites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              {t('projectMembers.pendingInvitesTitle')}
            </h3>
            <ul className="space-y-1.5">
              {pendingInvites.map(inv => {
                const p = profiles[inv.inviteeId]
                const name = p?.displayName || p?.email || inv.inviteeId.slice(0, 8)
                return (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/70 px-3.5 py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar profile={p} fallback={name} />
                      <span className="truncate text-sm text-[var(--ink)]">{name}</span>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === inv.id}
                      onClick={() => handleCancelInvite(inv.id)}
                      className="btn-secondary px-2.5 py-1 text-xs shrink-0"
                    >
                      {t('friends.cancel')}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Owner-only: Invite Friends */}
        {isOwner && (
          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                {t('projectMembers.inviteFriendsTitle')}
              </h3>
              <Link
                to="/friends"
                onClick={onClose}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                {t('projectMembers.goToFriends')}
              </Link>
            </div>

            {eligibleFriendUids.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[var(--border-strong)] p-4 text-xs text-[var(--ink-muted)]">
                <Users size={15} className="shrink-0" aria-hidden />
                <span>{t('projectMembers.noEligibleFriends')}</span>
              </div>
            ) : (
              <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                {eligibleFriendUids.map(friendUid => {
                  const p = profiles[friendUid]
                  const name = p?.displayName || p?.email || friendUid.slice(0, 8)
                  return (
                    <li
                      key={friendUid}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MemberAvatar profile={p} fallback={name} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[var(--ink)]">{name}</div>
                          {p?.email && (
                            <div className="truncate font-mono-data text-[11px] text-[var(--ink-muted)]">
                              {p.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === friendUid}
                        onClick={() => handleInvite(friendUid)}
                        className="btn-primary px-3 py-1.5 text-xs shrink-0"
                      >
                        <Send size={12} aria-hidden />
                        <span>{t('projectMembers.inviteButton')}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}
