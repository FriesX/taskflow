import { useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
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
  const { tasks, projects, labels } = useData()
  const { success, error } = useToast()
  const [mode, setMode] = useState<ThemeMode>(getTheme())
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

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

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
          {t('nav.settings')}
        </h1>
        <p className="mt-1 font-mono-data text-xs text-[var(--ink-muted)]">{user?.email}</p>
      </div>

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
