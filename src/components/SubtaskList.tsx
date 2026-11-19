import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Plus } from 'lucide-react'
import type { Task } from '../types'
import { createTask, toggleDone } from '../services/data'

export default function SubtaskList({ parent, subtasks, uid }: { parent: Task; subtasks: Task[]; uid: string }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const doneCount = subtasks.filter(s => s.status === 'done').length

  const add = async () => {
    if (!text.trim()) return
    await createTask(uid, { title: text.trim(), parentTaskId: parent.id, projectId: parent.projectId })
    setText('')
  }

  return (
    <fieldset className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] p-3.5">
      <legend className="px-1 text-xs font-semibold text-[var(--ink-secondary)]">
        {t('task.subtasks')}{' '}
        {subtasks.length > 0 && (
          <span className="font-mono-data text-[var(--ink-muted)]">
            ({doneCount}/{subtasks.length})
          </span>
        )}
      </legend>

      {subtasks.length > 0 && (
        <ul className="space-y-1.5">
          {subtasks.map(s => {
            const isDone = s.status === 'done'
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggleDone(s)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                      isDone
                        ? 'border-[var(--success)] bg-[var(--success)] text-white'
                        : 'border-[var(--border-strong)]'
                    }`}
                  >
                    {isDone && <Check size={10} strokeWidth={3} aria-hidden />}
                  </span>
                  <span className={isDone ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink)]'}>
                    {s.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          aria-label={t('task.addSubtask')}
          placeholder={t('task.addSubtask')}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="input-field py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={add}
          aria-label={t('task.addSubtask')}
          className="btn-secondary p-2"
        >
          <Plus size={14} aria-hidden />
        </button>
      </div>
    </fieldset>
  )
}
