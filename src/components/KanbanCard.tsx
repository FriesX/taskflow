import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { AlertCircle, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Task } from '../types'
import { isOverdue } from '../lib/taskLogic'
import { useData } from '../context/DataContext'

const PRIORITY_BADGES = [
  null,
  { label: 'p1', bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60' },
  { label: 'p2', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60' },
  { label: 'p3', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/60' },
  { label: 'p4', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60 font-semibold' },
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
    opacity: isDragging ? 0.4 : 1,
  }

  const priorityInfo = PRIORITY_BADGES[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className={`cursor-grab active:cursor-grabbing rounded-2xl glass-card p-3.5 border border-slate-200/70 dark:border-slate-800/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isDragging ? 'ring-2 ring-indigo-500 shadow-xl' : ''
      }`}
    >
      <div className={`font-semibold text-sm ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
        {task.title}
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
        {task.dueAt && (
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${
              overdue
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 font-semibold'
                : 'bg-slate-100/80 border-slate-200/80 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {overdue && <AlertCircle size={10} aria-hidden />}
            {format(task.dueAt, 'MMM d')}
          </span>
        )}
        {priorityInfo && (
          <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${priorityInfo.bg}`}>
            <Flag size={10} aria-hidden /> {t(`task.${priorityInfo.label}`)}
          </span>
        )}
        {task.labelIds.map(id => {
          const l = labels.find(x => x.id === id)
          return (
            l && (
              <span
                key={id}
                className="px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
                style={{ color: l.color }}
              >
                #{l.name}
              </span>
            )
          )
        })}
      </div>
    </div>
  )
}
