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
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <TaskListSkeleton count={5} />
      </div>
    )
  }

  const baseList = tasks
    .filter(x => !isDeleted(x) && !x.parentTaskId && filtersMap[kind](x))
    .sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || b.priority - a.priority
    })

  const filteredList = filterTasks(baseList, searchQuery, activeFilters)
  const openTask = (task: Task) => {
    setEditing(task)
    setOpen(true)
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
          {t(`nav.${kind}`)}
        </h1>
        <span className="font-mono-data text-xs font-medium text-[var(--ink-muted)]">
          {t('task.tasksCount', { count: filteredList.length })}
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
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/60 p-12 text-center">
          <p className="text-sm text-[var(--ink-muted)]">
            {searchQuery ||
            activeFilters.priority !== 'all' ||
            activeFilters.status !== 'all' ||
            activeFilters.projectId !== 'all'
              ? t('search.noResults')
              : t('task.empty')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredList.map(x => (
            <TaskItem key={x.id} task={x} onOpen={openTask} />
          ))}
        </ul>
      )}

      <TaskDialog task={editing} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
