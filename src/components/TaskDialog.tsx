import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Trash2, X } from 'lucide-react'
import type { Priority, Task } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { createTask, trashTask, updateTask } from '../services/data'
import { subtasksOf } from '../lib/taskLogic'
import SubtaskList from './SubtaskList'
import { useToast } from '../context/ToastContext'

const toInput = (ms: number | null) => (ms ? format(ms, "yyyy-MM-dd'T'HH:mm") : '')

export default function TaskDialog({ task, open, onClose }: { task: Task | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { projects, tasks } = useData()
  const { success } = useToast()
  const ref = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<Priority>(0)
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setDue(toInput(task?.dueAt ?? null))
    setPriority(task?.priority ?? 0)
    setProjectId(task?.projectId ?? '')
  }, [open, task])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return
    const data = {
      title: title.trim(), description, priority,
      dueAt: due ? new Date(due).getTime() : null,
      projectId: projectId || null,
    }
    if (task) {
      await updateTask(task.id, data)
      success(data.title, t('task.save'))
    } else {
      await createTask(user.uid, data)
      success(data.title, t('task.new'))
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!task) return
    await trashTask(task.id)
    success(task.title, t('task.delete'))
    onClose()
  }

  const field =
    'mt-1.5 w-full rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 transition-all'

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="task-dialog-title"
      className="m-auto w-full max-w-lg rounded-3xl glass-panel p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <h2 id="task-dialog-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {task ? t('task.edit') : t('task.new')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('task.title')}
          <input className={field} required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('task.description')}
          <textarea className={field} rows={3} maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('task.due')}
            <input type="datetime-local" className={field} value={due} onChange={e => setDue(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('task.priority')}
            <select className={field} value={priority} onChange={e => setPriority(Number(e.target.value) as Priority)}>
              {[0, 1, 2, 3, 4].map(p => (
                <option key={p} value={p}>
                  {t(`task.p${p}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('task.project')}
          <select className={field} value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">{t('task.none')}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {task && user && <SubtaskList parent={task} subtasks={subtasksOf(tasks, task.id)} uid={user.uid} />}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          {task ? (
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              <span>{t('task.delete')}</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t('task.cancel')}
            </button>
            <button
              type="submit"
              className="btn-gradient-primary rounded-2xl px-5 py-2 text-sm font-semibold cursor-pointer"
            >
              {t('task.save')}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
