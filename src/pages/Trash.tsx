import { useTranslation } from 'react-i18next'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { isDeleted } from '../lib/taskLogic'
import { deleteTaskForever, restoreTask } from '../services/data'
import { useToast } from '../context/ToastContext'

export default function Trash() {
  const { t } = useTranslation()
  const { tasks } = useData()
  const { success } = useToast()
  const list = tasks.filter(isDeleted)

  const handleRestore = async (id: string, title: string) => {
    await restoreTask(id)
    success(title, t('task.restore'))
  }

  const handleDelete = async (id: string, title: string) => {
    await deleteTaskForever(id)
    success(title, t('task.deleteForever'))
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
          {t('nav.trash')}
        </h1>
        <span className="font-mono-data text-xs font-medium text-[var(--ink-muted)]">
          {t('task.tasksCount', { count: list.length })}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/60 p-12 text-center">
          <p className="text-sm text-[var(--ink-muted)]">{t('task.empty')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map(x => (
            <li
              key={x.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]">
                {x.title}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => handleRestore(x.id, x.title)}
                >
                  <RotateCcw size={13} aria-hidden />
                  <span>{t('task.restore')}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] hover:opacity-85 transition-opacity cursor-pointer"
                  onClick={() => handleDelete(x.id, x.title)}
                >
                  <Trash2 size={13} aria-hidden />
                  <span>{t('task.deleteForever')}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
