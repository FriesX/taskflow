import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { AlertCircle, Check, Clock, Flag } from 'lucide-react'
import type { Task } from '../types'
import { isOverdue, subtasksOf } from '../lib/taskLogic'
import { toggleDone } from '../services/data'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'

const PRIORITY_STYLE = [
  null,
  { label: 'p1', text: 'text-sky-700 dark:text-sky-400', ring: 'border-sky-500/60' },
  { label: 'p2', text: 'text-amber-700 dark:text-amber-400', ring: 'border-amber-500/60' },
  { label: 'p3', text: 'text-orange-700 dark:text-orange-400', ring: 'border-orange-500/60' },
  { label: 'p4', text: 'text-[var(--danger)]', ring: 'border-[var(--danger)]' },
]

export default function TaskItem({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { t } = useTranslation()
  const { projects, labels, tasks } = useData()
  const { success } = useToast()
  const [justCompleted, setJustCompleted] = useState(false)

  const done = task.status === 'done'
  const overdue = isOverdue(task)
  const project = projects.find(p => p.id === task.projectId)
  const priorityInfo = PRIORITY_STYLE[task.priority]
  const subs = subtasksOf(tasks, task.id)
  const subsDone = subs.filter(s => s.status === 'done').length

  const handleToggle = async () => {
    const nextDone = !done
    if (nextDone) {
      setJustCompleted(true)
      success(task.title, t('task.completed'))
      setTimeout(() => setJustCompleted(false), 900)
    }
    await toggleDone(task)
  }

  return (
    <li
      className={`group flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
        justCompleted
          ? 'border-[var(--success)] bg-[var(--success-soft)]'
          : done
          ? 'border-[var(--border)] bg-[var(--bg-subtle)]/60 opacity-70'
          : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:-translate-y-[1px]'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={task.title}
        onClick={handleToggle}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.75px] transition-all cursor-pointer active:scale-90 ${
          done
            ? 'border-[var(--success)] bg-[var(--success)] text-white animate-check-pop'
            : `${priorityInfo?.ring || 'border-[var(--border-strong)]'} hover:border-[var(--accent)]`
        }`}
      >
        {done && <Check size={12} strokeWidth={3} aria-hidden />}
      </button>

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-none"
      >
        <div
          className={`truncate text-sm font-medium leading-snug transition-colors ${
            done
              ? 'line-through text-[var(--ink-muted)]'
              : 'text-[var(--ink)] group-hover:text-[var(--accent)]'
          }`}
        >
          {task.title}
        </div>

        {(task.dueAt || priorityInfo || project || task.labelIds.length > 0 || subs.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            {task.dueAt && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono-data font-medium ${
                  overdue
                    ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--ink-secondary)]'
                }`}
              >
                {overdue ? <AlertCircle size={11} aria-hidden /> : <Clock size={11} aria-hidden />}
                <span>
                  {overdue && `${t('task.overdue')} · `}
                  {format(task.dueAt, 'MMM d, HH:mm')}
                </span>
              </span>
            )}

            {priorityInfo && (
              <span className={`inline-flex items-center gap-1 font-mono-data font-medium ${priorityInfo.text}`}>
                <Flag size={11} aria-hidden />
                {t(`task.${priorityInfo.label}`)}
              </span>
            )}

            {project && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-medium text-[var(--ink-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                <span>{project.name}</span>
              </span>
            )}

            {subs.length > 0 && (
              <span className="font-mono-data text-[var(--ink-muted)]">
                {subsDone}/{subs.length} {t('task.subtasks').toLowerCase()}
              </span>
            )}

            {task.labelIds.map(id => {
              const l = labels.find(x => x.id === id)
              return (
                l && (
                  <span
                    key={id}
                    className="font-mono-data font-medium"
                    style={{ color: l.color }}
                  >
                    #{l.name}
                  </span>
                )
              )
            })}
          </div>
        )}
      </button>
    </li>
  )
}
