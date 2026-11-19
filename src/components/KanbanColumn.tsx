import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import KanbanCard from './KanbanCard'

const STATUS_DOT: Record<string, string> = {
  todo: 'bg-[var(--ink-muted)]',
  doing: 'bg-[var(--accent)]',
  waiting: 'bg-[var(--warning)]',
  done: 'bg-[var(--success)]',
}

export default function KanbanColumn({
  status,
  tasks,
  onOpen,
  onQuickAdd,
}: {
  status: TaskStatus
  tasks: Task[]
  onOpen: (t: Task) => void
  onQuickAdd: (status: TaskStatus) => void
}) {
  const { t } = useTranslation()
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] flex-col rounded-2xl border p-3 transition-colors ${
        isOver
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-[var(--bg-subtle)]/70'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status] || STATUS_DOT.todo}`} />
          <span className="font-display text-xs font-semibold text-[var(--ink)]">
            {t(`kanban.${status}`)}
          </span>
          <span className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono-data text-[11px] text-[var(--ink-muted)]">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onQuickAdd(status)}
          aria-label={t('common.add')}
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--ink)] transition-colors cursor-pointer"
        >
          <Plus size={15} aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onOpen={onOpen} />
        ))}
        {tasks.length === 0 && (
          <div className="grid h-24 place-items-center rounded-xl border border-dashed border-[var(--border-strong)] text-xs text-[var(--ink-muted)]">
            {t('kanban.emptyCol')}
          </div>
        )}
      </div>
    </div>
  )
}
