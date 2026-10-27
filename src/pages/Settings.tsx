import { useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'
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
              color: p.color || '#6366f1',
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
        // Assume CSV
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
      setImportStatus({
        message: msg,
        isError: false,
      })
      success(msg, t('settings.importData'))
    } catch {
      const msg = t('settings.importError')
      setImportStatus({
        message: msg,
        isError: true,
      })
      error(msg, t('settings.importData'))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const field =
    'rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 transition-all'

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('nav.settings')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      </div>

      {/* General Settings */}
      <section className="space-y-5 rounded-3xl glass-card p-6 md:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('nav.settings')}</h2>
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t('settings.language')}
            <select
              className={`${field} mt-1.5 block w-full`}
              value={i18n.language}
              onChange={e => i18n.changeLanguage(e.target.value)}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t('settings.theme')}
            <select
              className={`${field} mt-1.5 block w-full`}
              value={mode}
              onChange={e => {
                const m = e.target.value as ThemeMode
                setMode(m)
                setTheme(m)
              }}
            >
              <option value="light">{t('settings.light')}</option>
              <option value="dark">{t('settings.dark')}</option>
              <option value="system">{t('settings.system')}</option>
            </select>
          </label>
        </div>
      </section>

      {/* Data Export / Import */}
      <section className="space-y-5 rounded-3xl glass-card p-6 md:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('settings.dataTitle')}</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-2xl glass-panel px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Download size={15} className="text-indigo-600 dark:text-indigo-400" />
            {t('settings.exportJSON')}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-2xl glass-panel px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Download size={15} className="text-teal-600 dark:text-teal-400" />
            {t('settings.exportCSV')}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            {t('settings.importData')}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/60 dark:border-indigo-800/50 px-4 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition-all shadow-xs">
            <Upload size={15} />
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
            className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-semibold animate-toast-bounce border ${
              importStatus.isError
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
            }`}
          >
            {importStatus.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{importStatus.message}</span>
          </div>
        )}
      </section>

      {/* Account */}
      <div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-red-700 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>{t('auth.signOut')}</span>
        </button>
      </div>
    </div>
  )
}
