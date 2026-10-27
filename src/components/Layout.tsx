import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Archive, BarChart3, Calendar, CalendarClock, CheckCircle2, FolderKanban, Inbox,
  LayoutDashboard, Settings, Star, Timer, Trash2,
} from 'lucide-react'

const items = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/inbox', key: 'inbox', icon: Inbox },
  { to: '/today', key: 'today', icon: Star },
  { to: '/upcoming', key: 'upcoming', icon: CalendarClock },
  { to: '/projects', key: 'projects', icon: FolderKanban },
  { to: '/calendar', key: 'calendar', icon: Calendar },
  { to: '/focus', key: 'focus', icon: Timer },
  { to: '/stats', key: 'stats', icon: BarChart3 },
  { to: '/archive', key: 'archive', icon: Archive },
  { to: '/trash', key: 'trash', icon: Trash2 },
  { to: '/settings', key: 'settings', icon: Settings },
] as const

export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()

  const link = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 md:flex-row flex-col md:gap-3 gap-1 ${
      isActive
        ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs md:translate-x-1'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:translate-x-0.5 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
    }`

  return (
    <div className="min-h-screen md:flex relative selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* Background ambient gradient glow for modern depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/15" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-600/15" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-600/15" />
      </div>

      {/* Desktop sidebar / mobile bottom bar */}
      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-30 flex overflow-x-auto border-t border-slate-200/80 bg-white/85 backdrop-blur-xl p-2 md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:gap-1.5 md:border-r md:border-t-0 md:p-5 md:bg-white/60 dark:border-slate-800/80 dark:bg-slate-950/80 dark:md:bg-slate-950/50"
      >
        <div className="hidden md:flex items-center gap-2.5 mb-6 px-3 py-1">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25">
            <CheckCircle2 size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('app')}
          </span>
        </div>

        <div className="flex md:flex-col flex-1 gap-1 md:gap-1.5">
          {items.map(({ to, key, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={link}>
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'
                    }`}
                    aria-hidden
                  />
                  <span className="text-xs md:text-sm font-medium tracking-wide">
                    {t(`nav.${key}`)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-4 pb-28 md:p-8 md:pb-12 max-w-6xl mx-auto w-full">
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
