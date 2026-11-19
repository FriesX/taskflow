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

  const isExisting = Boolean(task?.id)

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
      title: title.trim(),
      description,
      priority,
      dueAt: due ? new Date(due).getTime() : null,
      projectId: projectId || null,
      ...(task?.status && !isExisting ? { status: task.status } : {}),
    }
    if (isExisting && task) {
      await updateTask(task.id, data)
      success(data.title, t('task.save'))
    } else {
      await createTask(user.uid, data)
      success(data.title, t('task.new'))
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!isExisting || !task) return
    await trashTask(task.id)
    success(task.title, t('task.delete'))
    onClose()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="task-dialog-title"
      className="surface-elevated m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-6 text-[var(--ink)]"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 id="task-dialog-title" className="font-display text-lg font-bold tracking-tight text-[var(--ink)]">
            {isExisting ? t('task.edit') : t('task.new')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
          {t('task.title')}
          <input
            className="input-field mt-1.5"
            required
            maxLength={200}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </label>

        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
          {t('task.description')}
          <textarea
            className="input-field mt-1.5 resize-y"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
            {t('task.due')}
            <input
              type="datetime-local"
              className="input-field mt-1.5 font-mono-data text-xs"
              value={due}
              onChange={e => setDue(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
            {t('task.priority')}
            <select
              className="input-field mt-1.5"
              value={priority}
              onChange={e => setPriority(Number(e.target.value) as Priority)}
            >
              {([0, 1, 2, 3, 4] as const).map(p => (
                <option key={p} value={p}>
                  {t(`task.p${p}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
          {t('task.project')}
          <select
            className="input-field mt-1.5"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">{t('task.none')}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {isExisting && task && user && (
          <SubtaskList parent={task} subtasks={subtasksOf(tasks, task.id)} uid={user.uid} />
        )}

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          {isExisting ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors cursor-pointer"
              onClick={handleDelete}
            >
              <Trash2 size={15} />
              <span>{t('task.delete')}</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              {t('task.cancel')}
            </button>
            <button type="submit" className="btn-primary px-5 py-2 text-sm">
              {t('task.save')}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
