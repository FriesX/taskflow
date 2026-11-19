import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { AlertCircle, Clock, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Task } from '../types'
import { isOverdue } from '../lib/taskLogic'
import { useData } from '../context/DataContext'

const PRIORITY_TEXT = [
  null,
  { label: 'p1', cls: 'text-sky-700 dark:text-sky-400' },
  { label: 'p2', cls: 'text-amber-700 dark:text-amber-400' },
  { label: 'p3', cls: 'text-orange-700 dark:text-orange-400' },
  { label: 'p4', cls: 'text-[var(--danger)]' },
]

export default function KanbanCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { t } = useTranslation()
  const { labels } = useData()
  const overdue = isOverdue(task)
  const done = task.status === 'done'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityInfo = PRIORITY_TEXT[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className={`cursor-grab active:cursor-grabbing rounded-xl border bg-[var(--bg-surface)] p-3.5 transition-all hover:border-[var(--border-strong)] hover:-translate-y-[1px] ${
        isDragging ? 'border-[var(--accent)] shadow-[var(--shadow-md)]' : 'border-[var(--border)]'
      }`}
    >
      <div
        className={`text-sm font-medium leading-snug ${
          done ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink)]'
        }`}
      >
        {task.title}
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--ink-secondary)]">
          {task.description}
        </p>
      )}
      {(task.dueAt || priorityInfo || task.labelIds.length > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
          {task.dueAt && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono-data font-medium ${
                overdue
                  ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--ink-secondary)]'
              }`}
            >
              {overdue ? <AlertCircle size={10} aria-hidden /> : <Clock size={10} aria-hidden />}
              {format(task.dueAt, 'MMM d')}
            </span>
          )}
          {priorityInfo && (
            <span className={`inline-flex items-center gap-0.5 font-mono-data font-medium ${priorityInfo.cls}`}>
              <Flag size={10} aria-hidden />
              {t(`task.${priorityInfo.label}`)}
            </span>
          )}
          {task.labelIds.map(id => {
            const l = labels.find(x => x.id === id)
            return (
              l && (
                <span key={id} className="font-mono-data font-medium" style={{ color: l.color }}>
                  #{l.name}
                </span>
              )
            )
          })}
        </div>
      )}
    </div>
  )
}
