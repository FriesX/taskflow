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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t('search.placeholder')}
          className="input-field pl-9 pr-12"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="rounded p-0.5 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} aria-hidden />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono-data text-[10px] font-medium text-[var(--ink-muted)]">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowFilterMenu(v => !v)}
          className={`flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
            activeFilterCount > 0
              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)]'
          }`}
        >
          <Filter size={14} aria-hidden />
          <span className="hidden sm:inline">{t('search.filters')}</span>
          {activeFilterCount > 0 && (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--accent)] font-mono-data text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {showFilterMenu && (
          <div className="surface-elevated absolute right-0 z-40 mt-2 w-72 rounded-xl p-4 animate-view-enter">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <span className="text-xs font-semibold text-[var(--ink)]">
                {t('search.filters')}
              </span>
              {(activeFilterCount > 0 || query) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-[var(--danger)] hover:underline cursor-pointer"
                >
                  {t('search.clear')}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                {t('task.priority')}
                <select
                  value={filters.priority}
                  onChange={e =>
                    onFilterChange({
                      ...filters,
                      priority: e.target.value === 'all' ? 'all' : (Number(e.target.value) as Priority),
                    })
                  }
                  className="input-field mt-1 py-2 text-xs"
                >
                  <option value="all">{t('search.all')}</option>
                  {[1, 2, 3, 4].map(p => (
                    <option key={p} value={p}>
                      {t(`task.p${p}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                {t('task.project')}
                <select
                  value={filters.projectId}
                  onChange={e => onFilterChange({ ...filters, projectId: e.target.value })}
                  className="input-field mt-1 py-2 text-xs"
                >
                  <option value="all">{t('search.all')}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                Status
                <select
                  value={filters.status}
                  onChange={e =>
                    onFilterChange({
                      ...filters,
                      status: e.target.value === 'all' ? 'all' : (e.target.value as TaskStatus),
                    })
                  }
                  className="input-field mt-1 py-2 text-xs"
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
