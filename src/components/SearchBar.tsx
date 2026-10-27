import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Search, X } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { Priority, TaskStatus } from '../types'

export interface FilterState {
  priority: Priority | 'all'
  status: TaskStatus | 'all'
  projectId: string | 'all'
}

export default function SearchBar({
  query,
  onQueryChange,
  filters,
  onFilterChange,
}: {
  query: string
  onQueryChange: (q: string) => void
  filters: FilterState
  onFilterChange: (f: FilterState) => void
}) {
  const { t } = useTranslation()
  const { projects } = useData()
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Hotkey "/" to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false)
      }
    }
    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilterMenu])

  const activeFilterCount =
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.projectId !== 'all' ? 1 : 0)

  const clearFilters = () => {
    onFilterChange({ priority: 'all', status: 'all', projectId: 'all' })
    onQueryChange('')
  }

  const selectClass =
    'mt-1 w-full rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-800 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'

  return (
    <div className="relative flex items-center gap-2.5 mb-5">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full rounded-2xl glass-card py-2.5 pl-10 pr-16 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 shadow-xs transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => onQueryChange('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md"
              aria-label="Clear search"
            >
              <X size={15} aria-hidden />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700/80">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeFilterCount > 0
              ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-300/60 dark:border-indigo-700/60 shadow-xs'
              : 'glass-card text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <Filter size={15} aria-hidden />
          <span className="hidden sm:inline">{t('search.filters')}</span>
          {activeFilterCount > 0 && (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] font-bold text-white shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </button>

        {showFilterMenu && (
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-3xl glass-panel p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 animate-page-enter">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60 mb-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('search.filters')}
              </span>
              {(activeFilterCount > 0 || query) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
                >
                  {t('search.clear')}
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('task.priority')}
                <select
                  value={filters.priority}
                  onChange={e =>
                    onFilterChange({
                      ...filters,
                      priority: e.target.value === 'all' ? 'all' : (Number(e.target.value) as Priority),
                    })
                  }
                  className={selectClass}
                >
                  <option value="all">{t('search.all')}</option>
                  {[1, 2, 3, 4].map(p => (
                    <option key={p} value={p}>
                      {t(`task.p${p}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('task.project')}
                <select
                  value={filters.projectId}
                  onChange={e => onFilterChange({ ...filters, projectId: e.target.value })}
                  className={selectClass}
                >
                  <option value="all">{t('search.all')}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
                <select
                  value={filters.status}
                  onChange={e =>
                    onFilterChange({
                      ...filters,
                      status: e.target.value === 'all' ? 'all' : (e.target.value as TaskStatus),
                    })
                  }
                  className={selectClass}
                >
                  <option value="all">{t('search.all')}</option>
                  <option value="todo">{t('kanban.todo')}</option>
                  <option value="doing">{t('kanban.doing')}</option>
                  <option value="waiting">{t('kanban.waiting')}</option>
                  <option value="done">{t('kanban.done')}</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
