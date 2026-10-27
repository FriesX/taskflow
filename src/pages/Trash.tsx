import { useTranslation } from 'react-i18next'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { isDeleted } from '../lib/taskLogic'
import { deleteTaskForever, restoreTask } from '../services/data'
import { useToast } from '../context/ToastContext'

export default function Trash() {
  const { t } = useTranslation()
  const { tasks } = useData()
  const { success } = useToast()
  const list = tasks.filter(isDeleted)

  const handleRestore = async (id: string, title: string) => {
    await restoreTask(id)
    success(title, t('task.restore'))
  }

  const handleDelete = async (id: string, title: string) => {
    await deleteTaskForever(id)
    success(title, t('task.deleteForever'))
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('nav.trash')}
        </h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          {list.length} {t('task.tasksCount', { count: list.length })}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-slate-500 text-sm">{t('task.empty')}</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {list.map(x => (
            <li
              key={x.id}
              className="flex items-center justify-between gap-3 rounded-2xl glass-card p-4 border border-slate-200/70 dark:border-slate-800/70 shadow-xs hover:-translate-y-0.5 transition-all"
            >
              <span className="truncate font-medium text-sm text-slate-700 dark:text-slate-200">{x.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 transition cursor-pointer"
                  onClick={() => handleRestore(x.id, x.title)}
                >
                  <RotateCcw size={14} />
                  <span>{t('task.restore')}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/50 transition cursor-pointer"
                  onClick={() => handleDelete(x.id, x.title)}
                >
                  <Trash2 size={14} />
                  <span>{t('task.deleteForever')}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
