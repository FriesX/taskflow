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
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">
        {t('task.subtasks')} {subtasks.length > 0 && `(${doneCount}/${subtasks.length})`}
      </legend>
      {subtasks.map(s => (
        <label key={s.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.status === 'done'} onChange={() => toggleDone(s)} />
          <span className={s.status === 'done' ? 'line-through text-slate-400' : ''}>{s.title}</span>
          {s.status === 'done' && <Check size={12} aria-hidden />}
        </label>
      ))}
      <div className="flex gap-2">
        <input
          aria-label={t('task.addSubtask')} placeholder={t('task.addSubtask')} value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <button type="button" onClick={add} aria-label={t('task.addSubtask')} className="rounded-lg bg-slate-100 px-2 dark:bg-slate-700">
          <Plus size={16} aria-hidden />
        </button>
      </div>
    </fieldset>
  )
}
