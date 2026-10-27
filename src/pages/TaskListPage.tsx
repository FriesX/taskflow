import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task } from '../types'
import { useData } from '../context/DataContext'
import { filterTasks, isCompletedToday, isDeleted, isOverdue, isToday, isUpcoming } from '../lib/taskLogic'
import TaskItem from '../components/TaskItem'
import TaskDialog from '../components/TaskDialog'
import QuickAdd from '../components/QuickAdd'
import SearchBar, { type FilterState } from '../components/SearchBar'
import { TaskListSkeleton, Skeleton } from '../components/Skeleton'

export type ListKind = 'inbox' | 'today' | 'upcoming' | 'archive'

const filtersMap: Record<ListKind, (t: Task) => boolean> = {
  inbox: t => t.status !== 'archived' && !t.projectId && !t.dueAt,
  today: t => isToday(t) || isOverdue(t) || isCompletedToday(t),
  upcoming: t => isUpcoming(t),
  archive: t => t.status === 'archived',
}

export default function TaskListPage({ kind }: { kind: ListKind }) {
  const { t } = useTranslation()
  const { tasks, ready } = useData()
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priority: 'all',
    status: 'all',
    projectId: 'all',
  })

  if (!ready) {
    return (
      <div className="max-w-3xl space-y-5">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <TaskListSkeleton count={5} />
      </div>
    )
  }

  const baseList = tasks
    .filter(x => !isDeleted(x) && !x.parentTaskId && filtersMap[kind](x))
    .sort((a, b) => {
      // Pending first, completed at the end
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || b.priority - a.priority
    })

  const filteredList = filterTasks(baseList, searchQuery, activeFilters)
  const openTask = (task: Task) => { setEditing(task); setOpen(true) }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t(`nav.${kind}`)}
        </h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
          {filteredList.length} {t('task.tasksCount', { count: filteredList.length })}
        </span>
      </div>

      {kind !== 'archive' && <QuickAdd />}

      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        filters={activeFilters}
        onFilterChange={setActiveFilters}
      />

      {filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {searchQuery || activeFilters.priority !== 'all' || activeFilters.status !== 'all' || activeFilters.projectId !== 'all'
              ? t('search.noResults')
              : t('task.empty')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filteredList.map(x => (
            <TaskItem key={x.id} task={x} onOpen={openTask} />
          ))}
        </ul>
      )}

      <TaskDialog task={editing} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
