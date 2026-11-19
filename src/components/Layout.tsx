import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Archive,
  BarChart3,
  Calendar,
  CalendarClock,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Star,
  Sun,
  Timer,
  Trash2,
  X,
} from 'lucide-react'
import BrandMark from './BrandMark'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { isDeleted, isOverdue, isToday, isUpcoming } from '../lib/taskLogic'
import { getTheme, resolveDark, toggleLightDark } from '../lib/theme'

const NAV_GROUPS = [
  {
    groupKey: 'groupPrimary',
    items: [
      { to: '/', key: 'dashboard', icon: LayoutDashboard },
      { to: '/inbox', key: 'inbox', icon: Inbox },
      { to: '/today', key: 'today', icon: Star },
      { to: '/upcoming', key: 'upcoming', icon: CalendarClock },
    ],
  },
  {
    groupKey: 'groupWorkspace',
    items: [
      { to: '/projects', key: 'projects', icon: FolderKanban },
      { to: '/calendar', key: 'calendar', icon: Calendar },
      { to: '/focus', key: 'focus', icon: Timer },
      { to: '/stats', key: 'stats', icon: BarChart3 },
    ],
  },
  {
    groupKey: 'groupUtility',
    items: [
      { to: '/archive', key: 'archive', icon: Archive },
      { to: '/trash', key: 'trash', icon: Trash2 },
      { to: '/settings', key: 'settings', icon: Settings },
    ],
  },
] as const

const MOBILE_TABS = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/today', key: 'today', icon: Star },
  { to: '/projects', key: 'projects', icon: FolderKanban },
  { to: '/focus', key: 'focus', icon: Timer },
] as const

export default function Layout() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { tasks } = useData()
  const location = useLocation()
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(() => resolveDark(getTheme()))
  const drawerOpen = drawerPath === location.pathname

  useEffect(() => {
    const sync = () => setIsDark(resolveDark(getTheme()))
    window.addEventListener('taskflow-theme-change', sync)
    return () => window.removeEventListener('taskflow-theme-change', sync)
  }, [])

  const live = tasks.filter(x => !isDeleted(x) && !x.parentTaskId)
  const counts: Record<string, number> = {
    inbox: live.filter(x => x.status !== 'archived' && x.status !== 'done' && !x.projectId && !x.dueAt).length,
    today: live.filter(x => (isToday(x) || isOverdue(x)) && x.status !== 'done').length,
    upcoming: live.filter(x => isUpcoming(x) && x.status !== 'done').length,
    trash: tasks.filter(isDeleted).length,
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
      isActive
        ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
        : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)]'
    }`

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 py-4">
        <NavLink to="/" className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <span className="font-display text-base font-bold tracking-tight text-[var(--ink)]">
            {t('app')}
          </span>
        </NavLink>
        <button
          type="button"
          onClick={() => setIsDark(resolveDark(toggleLightDark()))}
          aria-label={t('settings.theme')}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Grouped Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.groupKey}>
            <div className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              {t(`nav.${group.groupKey}`)}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ to, key, icon: Icon }) => {
                const badge = counts[key] || 0
                return (
                  <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={16}
                            className={`shrink-0 ${
                              isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)] group-hover:text-[var(--ink)]'
                            }`}
                            aria-hidden
                          />
                          <span className="truncate">{t(`nav.${key}`)}</span>
                        </span>
                        {badge > 0 && (
                          <span
                            className={`ml-2 shrink-0 rounded-md px-1.5 py-0.5 font-mono-data text-[11px] ${
                              isActive
                                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                                : 'text-[var(--ink-muted)]'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Chip */}
      <div className="border-t border-[var(--border)] p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] font-mono-data text-xs font-semibold text-[var(--ink)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-[var(--ink)]">{displayName}</div>
            <div className="truncate text-[11px] text-[var(--ink-muted)]">{user?.email}</div>
          </div>
        </NavLink>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink)] md:flex">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Main"
        className="hidden md:flex md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)]/95 px-4 backdrop-blur-sm md:hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="font-display text-base font-bold tracking-tight">{t('app')}</span>
        </NavLink>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsDark(resolveDark(toggleLightDark()))}
            aria-label={t('settings.theme')}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={() => setDrawerPath(location.pathname)}
            aria-label={t('common.openMenu')}
            aria-expanded={drawerOpen}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerPath(null)}
            aria-hidden="true"
          />
          <div className="relative h-full w-72 max-w-[82vw] border-r border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
            <button
              type="button"
              onClick={() => setDrawerPath(null)}
              aria-label={t('common.close')}
              className="absolute right-3 top-3.5 z-10 grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X size={17} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 pt-6 pb-24 sm:px-6 md:px-10 md:py-9">
        <div key={location.pathname} className="mx-auto max-w-5xl animate-view-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 px-1 py-1.5 backdrop-blur-sm md:hidden"
      >
        {MOBILE_TABS.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'
              }`
            }
          >
            <Icon size={18} aria-hidden />
            <span className="truncate max-w-full px-1">{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setDrawerPath(location.pathname)}
          className="flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium text-[var(--ink-muted)] cursor-pointer"
        >
          <Menu size={18} aria-hidden />
          <span>{t('common.openMenu')}</span>
        </button>
      </nav>
    </div>
  )
}
