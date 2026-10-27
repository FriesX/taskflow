import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { AlertCircle, Check, Flag } from 'lucide-react'
import type { Task } from '../types'
import { isOverdue } from '../lib/taskLogic'
import { toggleDone } from '../services/data'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'

const PRIORITY_BADGES = [
  null,
  { label: 'p1', bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60' },
  { label: 'p2', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60' },
  { label: 'p3', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/60' },
  { label: 'p4', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60 font-semibold' },
]

export default function TaskItem({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { t } = useTranslation()
  const { projects, labels } = useData()
  const { success } = useToast()
  const [justCompleted, setJustCompleted] = useState(false)

  const done = task.status === 'done'
  const overdue = isOverdue(task)
  const project = projects.find(p => p.id === task.projectId)
  const priorityInfo = PRIORITY_BADGES[task.priority]

  const handleToggle = async () => {
    const nextDone = !done
    if (nextDone) {
      setJustCompleted(true)
      success(task.title, t('task.completed'))
      setTimeout(() => setJustCompleted(false), 1200)
    }
    await toggleDone(task)
  }

  return (
    <li
      className={`group relative flex items-start gap-3.5 rounded-2xl p-4 transition-all duration-300 ${
        justCompleted
          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-950/40'
          : done
          ? 'bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 opacity-70'
          : 'glass-card hover:-translate-y-0.5 hover:shadow-md border border-slate-200/70 dark:border-slate-800/70'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={task.title}
        onClick={handleToggle}
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-xl border-2 transition-all duration-200 active:scale-90 ${
          done
            ? 'border-emerald-500 bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-xs animate-success-pop'
            : 'border-slate-300 hover:border-indigo-500 dark:border-slate-600 dark:hover:border-indigo-400 hover:scale-105'
        }`}
      >
        {done && <Check size={14} strokeWidth={3} aria-hidden />}
      </button>

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="min-w-0 flex-1 text-left cursor-pointer"
      >
        <div
          className={`truncate font-medium text-sm md:text-base tracking-tight transition-all ${
            done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
          }`}
        >
          {task.title}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {task.dueAt && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
                overdue
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-400 font-semibold animate-pulse'
                  : 'bg-slate-100/80 border-slate-200/80 text-slate-600 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <AlertCircle size={12} aria-hidden={!overdue} className={overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
              <span>
                {overdue && `${t('task.overdue')}: `}
                {format(task.dueAt, 'MMM d, HH:mm')}
              </span>
            </span>
          )}

          {priorityInfo && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${priorityInfo.bg}`}>
              <Flag size={11} aria-hidden /> {t(`task.${priorityInfo.label}`)}
            </span>
          )}

          {project && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 font-medium"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="text-slate-700 dark:text-slate-300">{project.name}</span>
            </span>
          )}

          {task.labelIds.map(id => {
            const l = labels.find(x => x.id === id)
            return (
              l && (
                <span
                  key={id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium border border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
                  style={{ color: l.color }}
                >
                  #{l.name}
                </span>
              )
            )
          })}
        </div>
      </button>
    </li>
  )
}
