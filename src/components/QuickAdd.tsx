import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Clock, Flag, Folder, Hash, Plus } from 'lucide-react'
import { parseQuickAdd } from '../lib/quickAdd'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { createLabel, createTask } from '../services/data'
import { useToast } from '../context/ToastContext'

const LABEL_COLORS = ['#1D4ED8', '#0F766E', '#B45309', '#DC2626', '#0284C7', '#475569']

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
        title: parsed.title,
        dueAt: parsed.dueAt,
        priority: parsed.priority,
        labelIds,
        projectId: project?.id ?? null,
      })
      success(parsed.title, t('task.new'))
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const hasMeta = parsed.dueAt || parsed.labels.length > 0 || parsed.priority > 0 || Boolean(parsed.project)

  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault()
          submit()
        }}
        className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1.5 transition-all focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]"
      >
        <input
          aria-label={t('common.add')}
          placeholder={t('task.quickPlaceholder')}
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="btn-primary px-3.5 py-2 text-xs sm:text-sm"
        >
          <Plus size={16} aria-hidden strokeWidth={2.4} />
          <span className="hidden sm:inline">{t('common.add')}</span>
        </button>
      </form>

      {text && hasMeta && (
        <div
          aria-live="polite"
          className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-xs animate-view-enter"
        >
          <span className="font-medium text-[var(--ink-muted)]">{t('task.preview')}:</span>
          <span className="font-semibold text-[var(--ink)]">{parsed.title}</span>
          {parsed.dueAt && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono-data text-[11px] text-[var(--accent)]">
              <Clock size={11} aria-hidden />
              {format(parsed.dueAt, parsed.hasTime ? 'MMM d, HH:mm' : 'MMM d')}
            </span>
          )}
          {parsed.priority > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono-data text-[11px] text-[var(--warning)]">
              <Flag size={11} aria-hidden />
              {t(`task.p${parsed.priority}`)}
            </span>
          )}
          {parsed.labels.map(l => (
            <span
              key={l}
              className="inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono-data text-[11px] text-[var(--ink-secondary)]"
            >
              <Hash size={10} aria-hidden />
              {l}
            </span>
          ))}
          {parsed.project && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono-data text-[11px] text-[var(--ink-secondary)]">
              <Folder size={11} aria-hidden />
              {parsed.project}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
