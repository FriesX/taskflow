import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Upload,
} from 'lucide-react'
import { LANGUAGES } from '../i18n'
import { getTheme, setTheme, type ThemeMode } from '../lib/theme'
import { normalizeDisplayName } from '../lib/socialLogic'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  exportToCSV,
  exportToJSON,
  parseCSVTasks,
  triggerDownload,
  type TaskFlowBackup,
} from '../lib/exportImport'
import { createTask, createProject } from '../services/data'
import { updateUserDisplayName } from '../services/social'
import type { Priority } from '../types'
import { useToast } from '../context/ToastContext'

const THEME_OPTIONS: { id: ThemeMode; Icon: typeof Sun }[] = [
  { id: 'light', Icon: Sun },
  { id: 'dark', Icon: Moon },
  { id: 'system', Icon: Monitor },
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { tasks, projects, labels, profile } = useData()
  const { success, error } = useToast()
  const [mode, setMode] = useState<ThemeMode>(getTheme())
  const [draftName, setDraftName] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const currentDisplayName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || ''
  const nameValue = draftName ?? currentDisplayName
  const normalizedDraft = normalizeDisplayName(nameValue)
  const isNameDirty = normalizedDraft !== null && normalizedDraft !== currentDisplayName

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || savingName) return
    if (!normalizedDraft) {
      setNameError(t('settings.nameInvalid'))
      return
    }
    setSavingName(true)
    setNameError(null)
    try {
      const updated = await updateUserDisplayName(user, profile, normalizedDraft)
      setDraftName(null)
      success(updated.displayName, t('settings.nameSaved'))
    } catch {
      const msg = t('settings.nameError')
      setNameError(msg)
      error(msg, t('settings.profileTitle'))
    } finally {
      setSavingName(false)
    }
  }

  const handleExportJSON = () => {
    const jsonStr = exportToJSON(tasks, projects, labels)
    const dateStr = new Date().toISOString().slice(0, 10)
    triggerDownload(jsonStr, `taskflow-backup-${dateStr}.json`, 'application/json')
    success('JSON backup downloaded', t('settings.exportJSON'))
  }

  const handleExportCSV = () => {
    const csvStr = exportToCSV(tasks, projects, labels)
    const dateStr = new Date().toISOString().slice(0, 10)
    triggerDownload(csvStr, `taskflow-tasks-${dateStr}.csv`, 'text/csv')
    success('CSV spreadsheet downloaded', t('settings.exportCSV'))
  }

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setBusy(true)
    setImportStatus(null)

    try {
      const text = await file.text()
      let count = 0

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text) as Partial<TaskFlowBackup>
        if (Array.isArray(parsed.projects)) {
          for (const p of parsed.projects) {
            await createProject(user.uid, {
              name: p.name || 'Imported Project',
              color: p.color || '#1D4ED8',
              icon: p.icon || 'folder',
            })
          }
        }
        if (Array.isArray(parsed.tasks)) {
          for (const item of parsed.tasks) {
            if (item.title) {
              await createTask(user.uid, {
                title: item.title,
                description: item.description || '',
                priority: (item.priority as Priority) || 0,
                dueAt: item.dueAt || null,
                status: item.status || 'todo',
              })
              count++
            }
          }
        }
      } else {
        const parsed = parseCSVTasks(text)
        for (const item of parsed) {
          await createTask(user.uid, {
            title: item.title,
            description: item.description,
            priority: (item.priority as Priority) || 0,
            status: (item.status as 'todo' | 'doing' | 'waiting' | 'done') || 'todo',
          })
          count++
        }
      }

      const msg = t('settings.importSuccess', { count })
      setImportStatus({ message: msg, isError: false })
      success(msg, t('settings.importData'))
    } catch {
      const msg = t('settings.importError')
      setImportStatus({ message: msg, isError: true })
      error(msg, t('settings.importData'))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const avatarInitials = (currentDisplayName || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
          {t('nav.settings')}
        </h1>
        <p className="mt-1 font-mono-data text-xs text-[var(--ink-muted)]">{user?.email}</p>
      </div>

      {/* Profile Display Name */}
      <section className="surface-card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.photoURL || user?.photoURL ? (
              <img
                src={profile?.photoURL || user?.photoURL || ''}
                alt={currentDisplayName}
                referrerPolicy="no-referrer"
                className="h-11 w-11 shrink-0 rounded-full border border-[var(--border)] object-cover"
              />
            ) : (
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] font-mono-data text-sm font-semibold text-[var(--ink)]">
                {avatarInitials}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                {t('settings.profileTitle')}
              </h2>
              <p className="truncate font-mono-data text-xs text-[var(--ink-muted)]">{user?.email}</p>
            </div>
          </div>

          {profile?.friendCode && (
            <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono-data text-xs font-semibold text-[var(--ink-secondary)]">
              {profile.friendCode}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveName} className="space-y-2.5">
          <label htmlFor="settings-display-name" className="block text-xs font-medium text-[var(--ink-secondary)]">
            {t('settings.displayName')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="settings-display-name"
              type="text"
              maxLength={100}
              value={nameValue}
              onChange={e => {
                setDraftName(e.target.value)
                if (nameError) setNameError(null)
              }}
              placeholder={t('settings.displayNamePlaceholder')}
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!isNameDirty || savingName}
              className="btn-primary px-4 py-2.5 text-sm shrink-0"
            >
              <Check size={15} aria-hidden />
              <span>{t('settings.saveName')}</span>
            </button>
          </div>

          {nameError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)] animate-view-enter"
            >
              <AlertCircle size={14} className="shrink-0" aria-hidden />
              <span>{nameError}</span>
            </div>
          )}
        </form>
      </section>

      {/* Appearance & Language */}
      <section className="surface-card space-y-6 p-6">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          {t('settings.appearanceTitle')}
        </h2>

        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]">
            {t('settings.theme')}
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {THEME_OPTIONS.map(({ id, Icon }) => {
              const active = mode === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMode(id)
                    setTheme(id)
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon size={15} aria-hidden />
                  <span>{t(`settings.${id}`)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]">
            {t('settings.language')}
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {LANGUAGES.map(lang => {
              const active = i18n.language === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                  }`}
                >
                  {lang.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Portability */}
      <section className="surface-card space-y-5 p-6">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          {t('settings.dataTitle')}
        </h2>

        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={handleExportJSON} className="btn-secondary px-4 py-2 text-xs">
            <Download size={14} className="text-[var(--accent)]" aria-hidden />
            <span>{t('settings.exportJSON')}</span>
          </button>
          <button type="button" onClick={handleExportCSV} className="btn-secondary px-4 py-2 text-xs">
            <Download size={14} className="text-[var(--success)]" aria-hidden />
            <span>{t('settings.exportCSV')}</span>
          </button>
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <label className="btn-secondary inline-flex cursor-pointer px-4 py-2 text-xs">
            <Upload size={14} aria-hidden />
            <span>{t('settings.importData')}</span>
            <input
              type="file"
              accept=".json,.csv"
              disabled={busy}
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium animate-toast-in ${
              importStatus.isError
                ? 'border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]'
                : 'border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]'
            }`}
          >
            {importStatus.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{importStatus.message}</span>
          </div>
        )}
      </section>

      {/* Account Sign Out */}
      <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            {t('settings.accountTitle')}
          </h2>
          <p className="mt-0.5 font-mono-data text-xs text-[var(--ink-muted)]">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-2 text-xs font-semibold text-[var(--danger)] hover:opacity-85 transition-opacity cursor-pointer"
        >
          <LogOut size={15} aria-hidden />
          <span>{t('auth.signOut')}</span>
        </button>
      </section>
    </div>
  )
}
