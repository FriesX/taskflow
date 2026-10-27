import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Plus, Sparkles } from 'lucide-react'
import { parseQuickAdd } from '../lib/quickAdd'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { createLabel, createTask } from '../services/data'
import { useToast } from '../context/ToastContext'

const LABEL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6']

export default function QuickAdd() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { labels, projects } = useData()
  const { success } = useToast()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const parsed = useMemo(() => parseQuickAdd(text), [text])

  const submit = async () => {
    if (!user || !parsed.title.trim() || submitting) return
    setSubmitting(true)
    try {
      const labelIds: string[] = []
      for (const name of parsed.labels) {
        const existing = labels.find(l => l.name.toLowerCase() === name)
        labelIds.push(existing?.id ?? await createLabel(user.uid, name, LABEL_COLORS[labels.length % LABEL_COLORS.length]))
      }
      const project = projects.find(p => p.name.toLowerCase() === parsed.project?.toLowerCase())
      await createTask(user.uid, {
        title: parsed.title, dueAt: parsed.dueAt, priority: parsed.priority,
        labelIds, projectId: project?.id ?? null,
      })
      success(parsed.title, t('task.new'))
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const hasMeta = parsed.dueAt || parsed.labels.length || parsed.priority || parsed.project

  return (
    <div className="mb-6">
      <form
        onSubmit={e => { e.preventDefault(); submit() }}
        className="flex gap-2.5 p-1.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500/60 transition-all shadow-sm"
      >
        <input
          aria-label={t('common.add')}
          placeholder={t('task.quickPlaceholder')}
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2 text-sm md:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="btn-gradient-primary flex items-center gap-1.5 rounded-xl px-4 py-2 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={18} aria-hidden strokeWidth={2.5} />
          <span className="hidden sm:inline">{t('common.add')}</span>
        </button>
      </form>

      {text && hasMeta && (
        <div
          aria-live="polite"
          className="mt-2.5 flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 animate-page-enter"
        >
          <Sparkles size={13} className="text-indigo-500 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{t('task.preview')}:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{parsed.title}</span>
          {parsed.dueAt && (
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-indigo-200/50 dark:border-indigo-800/50">
              📅 {format(parsed.dueAt, parsed.hasTime ? 'MMM d, HH:mm' : 'MMM d')}
            </span>
          )}
          {parsed.priority > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-indigo-200/50 dark:border-indigo-800/50">
              🚩 {t(`task.p${parsed.priority}`)}
            </span>
          )}
          {parsed.labels.map(l => (
            <span key={l} className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-indigo-200/50 dark:border-indigo-800/50">
              #{l}
            </span>
          ))}
          {parsed.project && (
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-indigo-200/50 dark:border-indigo-800/50">
              📁 {parsed.project}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
