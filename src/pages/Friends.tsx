import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  Check,
  Copy,
  FolderKanban,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import {
  FriendRequestError,
  acceptFriendRequest,
  acceptProjectInvite,
  declineOrCancelProjectInvite,
  removeFriendship,
  sendFriendRequest,
} from '../services/social'
import type { ProjectInvite, UserProfile } from '../types'

function UserAvatar({ profile, fallback }: { profile?: UserProfile; fallback: string }) {
  const label = profile?.displayName || fallback
  const initials = label.slice(0, 2).toUpperCase()
  if (profile?.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt={label}
        referrerPolicy="no-referrer"
        className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] object-cover"
      />
    )
  }
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] font-mono-data text-xs font-semibold text-[var(--ink)]">
      {initials}
    </div>
  )
}

export default function Friends() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profile, friendships, incomingProjectInvites, profiles } = useData()
  const { success, error } = useToast()
  const [lookupInput, setLookupInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!user) return null
  const uid = user.uid

  const incomingRequests = friendships.filter(
    f => f.status === 'pending' && f.recipientId === uid,
  )
  const sentRequests = friendships.filter(
    f => f.status === 'pending' && f.requesterId === uid,
  )
  const acceptedFriends = friendships.filter(f => f.status === 'accepted')

  const otherUid = (users: [string, string]) => (users[0] === uid ? users[1] : users[0])

  const handleCopyCode = async () => {
    if (!profile?.friendCode) return
    try {
      await navigator.clipboard.writeText(profile.friendCode)
      setCopied(true)
      success(profile.friendCode, t('friends.codeCopied'))
      setTimeout(() => setCopied(false), 1800)
    } catch {
      error(t('friends.errGeneric'))
    }
  }

  const handleSendRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (!lookupInput.trim() || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      const target = await sendFriendRequest(uid, lookupInput)
      success(target.displayName, t('friends.requestSent'))
      setLookupInput('')
    } catch (err) {
      if (err instanceof FriendRequestError) {
        const keyMap: Record<FriendRequestError['code'], string> = {
          invalid_format: 'friends.errInvalidFormat',
          not_found: 'friends.errNotFound',
          self: 'friends.errSelf',
          already_friends: 'friends.errAlreadyFriends',
          already_pending: 'friends.errAlreadyPending',
        }
        setFormError(t(keyMap[err.code]))
      } else {
        setFormError(t('friends.errGeneric'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptFriend = async (pairId: string, name: string) => {
    setBusyId(pairId)
    try {
      await acceptFriendRequest(pairId)
      success(name, t('friends.acceptedToast'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const handleRemoveFriendship = async (pairId: string, name: string, toastKey: string) => {
    setBusyId(pairId)
    try {
      await removeFriendship(pairId)
      success(name, t(toastKey))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const handleAcceptProjectInvite = async (invite: ProjectInvite) => {
    setBusyId(invite.id)
    try {
      await acceptProjectInvite(invite, uid)
      success(t('friends.projectJoined', { name: invite.projectName }), t('nav.projects'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDeclineProjectInvite = async (invite: ProjectInvite) => {
    setBusyId(invite.id)
    try {
      await declineOrCancelProjectInvite(invite.id)
      success(invite.projectName, t('friends.projectDeclined'))
    } catch {
      error(t('friends.errGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-7">
      {/* Header + My Friend Code */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
            {t('nav.friends')}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">{t('friends.subtitle')}</p>
        </div>

        {profile?.friendCode && (
          <div className="flex items-center gap-2.5 self-start rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 sm:self-auto">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                {t('friends.myCodeLabel')}
              </div>
              <div className="font-mono-data text-sm font-bold tracking-wide text-[var(--ink)]">
                {profile.friendCode}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label={t('friends.copyCode')}
              className="btn-secondary h-8 w-8 p-0"
            >
              {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Add Friend Form */}
      <section className="surface-card p-5">
        <h2 className="mb-3 font-display text-sm font-bold text-[var(--ink)]">
          {t('friends.addTitle')}
        </h2>
        <form onSubmit={handleSendRequest} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={lookupInput}
            onChange={e => {
              setLookupInput(e.target.value)
              if (formError) setFormError(null)
            }}
            placeholder={t('friends.addPlaceholder')}
            className="input-field flex-1"
            aria-label={t('friends.addTitle')}
          />
          <button
            type="submit"
            disabled={!lookupInput.trim() || submitting}
            className="btn-primary px-4 py-2.5 text-sm shrink-0"
          >
            <UserPlus size={15} aria-hidden />
            <span>{t('friends.sendRequest')}</span>
          </button>
        </form>
        {formError && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)] animate-view-enter"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        )}
      </section>

      {/* Incoming Project Invitations */}
      {incomingProjectInvites.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <FolderKanban size={15} className="text-[var(--accent)]" aria-hidden />
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              {t('friends.projectInvites')}
            </h2>
            <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono-data text-xs font-semibold text-[var(--accent)]">
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
                  className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
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
                      disabled={busyId === invite.id}
                      onClick={() => handleAcceptProjectInvite(invite)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Check size={13} aria-hidden />
                      <span>{t('friends.accept')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === invite.id}
                      onClick={() => handleDeclineProjectInvite(invite)}
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

      {/* Incoming Friend Requests */}
      {incomingRequests.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-[var(--accent)]" aria-hidden />
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              {t('friends.incomingRequests')}
            </h2>
            <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono-data text-xs font-semibold text-[var(--accent)]">
              {incomingRequests.length}
            </span>
          </div>

          <ul className="space-y-2">
            {incomingRequests.map(req => {
              const sender = profiles[req.requesterId]
              const name = sender?.displayName || sender?.email || req.requesterId.slice(0, 8)
              return (
                <li
                  key={req.id}
                  className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar profile={sender} fallback={name} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--ink)]">{name}</div>
                      <div className="truncate font-mono-data text-xs text-[var(--ink-muted)]">
                        {sender?.email || sender?.friendCode || ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleAcceptFriend(req.id, name)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Check size={13} aria-hidden />
                      <span>{t('friends.accept')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleRemoveFriendship(req.id, name, 'friends.cancelledToast')}
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

      {/* Accepted Friends */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-[var(--ink-muted)]" aria-hidden />
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            {t('friends.yourFriends')}
          </h2>
          <span className="rounded-md bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono-data text-xs text-[var(--ink-muted)]">
            {acceptedFriends.length}
          </span>
        </div>

        {acceptedFriends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/60 p-10 text-center">
            <p className="mx-auto max-w-md text-sm text-[var(--ink-muted)]">
              {t('friends.emptyFriends')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {acceptedFriends.map(f => {
              const friendUid = otherUid(f.users)
              const friend = profiles[friendUid]
              const name = friend?.displayName || friend?.email || friendUid.slice(0, 8)
              return (
                <li
                  key={f.id}
                  className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar profile={friend} fallback={name} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--ink)]">{name}</div>
                      <div className="flex flex-wrap items-center gap-2 font-mono-data text-xs text-[var(--ink-muted)]">
                        {friend?.email && <span className="truncate">{friend.email}</span>}
                        {friend?.friendCode && (
                          <span className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[11px] text-[var(--ink-secondary)]">
                            {friend.friendCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    onClick={() => handleRemoveFriendship(f.id, name, 'friends.removedToast')}
                    className="btn-ghost px-2.5 py-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--danger)]"
                  >
                    <UserMinus size={14} aria-hidden />
                    <span>{t('friends.remove')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Sent Outgoing Requests */}
      {sentRequests.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-display text-sm font-semibold text-[var(--ink-secondary)]">
            {t('friends.sentRequests')} ({sentRequests.length})
          </h2>
          <ul className="space-y-2">
            {sentRequests.map(req => {
              const recipient = profiles[req.recipientId]
              const name = recipient?.displayName || recipient?.email || req.recipientId.slice(0, 8)
              return (
                <li
                  key={req.id}
                  className="surface-subtle flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar profile={recipient} fallback={name} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--ink)]">{name}</div>
                      <div className="truncate font-mono-data text-xs text-[var(--ink-muted)]">
                        {recipient?.email || recipient?.friendCode || ''}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => handleRemoveFriendship(req.id, name, 'friends.cancelledToast')}
                    className="btn-secondary px-3 py-1.5 text-xs shrink-0"
                  >
                    {t('friends.cancel')}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
