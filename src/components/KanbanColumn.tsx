import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import KanbanCard from './KanbanCard'

const STATUS_BORDER: Record<string, string> = {
  todo: 'border-slate-300 dark:border-slate-600',
  doing: 'border-sky-400 dark:border-sky-600',
  waiting: 'border-amber-400 dark:border-amber-600',
  done: 'border-emerald-400 dark:border-emerald-600',
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
      className={`flex flex-col rounded-2xl border-t-4 bg-slate-100 p-3 dark:bg-slate-900/60 transition-colors min-h-[400px] ${
        STATUS_BORDER[status] || 'border-slate-300'
      } ${isOver ? 'bg-primary/5 ring-2 ring-primary' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{t(`kanban.${status}`)}</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium dark:bg-slate-700">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onQuickAdd(status)}
          aria-label={t('common.add')}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onOpen={onOpen} />
        ))}
        {tasks.length === 0 && (
          <div className="grid h-24 place-items-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-700">
            {t('kanban.emptyCol')}
          </div>
        )}
      </div>
    </div>
  )
}
