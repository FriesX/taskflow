import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Download,
  Flag,
  Globe,
  Hash,
  Kanban,
  Keyboard,
  List,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sun,
  Timer,
  WifiOff,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { LANGUAGES } from '../i18n'
import { parseQuickAdd } from '../lib/quickAdd'
import { getTheme, resolveDark, toggleLightDark } from '../lib/theme'

interface DemoTask {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 0 | 1 | 2 | 3 | 4
  dueLabel: string
  tag: string
}

const INITIAL_DEMO_TASKS: DemoTask[] = [
  { id: 'd1', title: 'Finalize Q4 product roadmap', status: 'doing', priority: 4, dueLabel: 'Today, 14:00', tag: 'strategy' },
  { id: 'd2', title: 'Review mobile navigation pull request', status: 'todo', priority: 3, dueLabel: 'Today, 17:30', tag: 'engineering' },
  { id: 'd3', title: 'Draft onboarding checklist for new hires', status: 'todo', priority: 2, dueLabel: 'Tomorrow, 10:00', tag: 'ops' },
  { id: 'd4', title: 'Export weekly backup to JSON', status: 'done', priority: 1, dueLabel: 'Today, 09:00', tag: 'routine' },
]

const CAPTURE_EXAMPLES = [
  'Send quarterly deck tomorrow 09:00 #work p1',
  'Ship v2 checklist today 16:30 #launch p4',
  'Book dentist appointment next week #personal p2',
]

const WEEK_BARS = [
  { day: 'Mon', count: 5 },
  { day: 'Tue', count: 8 },
  { day: 'Wed', count: 6 },
  { day: 'Thu', count: 11 },
  { day: 'Fri', count: 9 },
  { day: 'Sat', count: 4 },
  { day: 'Sun', count: 7 },
]

const PRIORITY_DOT: Record<number, string> = {
  1: 'bg-sky-500',
  2: 'bg-amber-500',
  3: 'bg-orange-500',
  4: 'bg-red-600 dark:bg-red-400',
}

export default function Landing() {
  const { t, i18n } = useTranslation()
  const [isDark, setIsDark] = useState(() => resolveDark(getTheme()))
  const [previewTab, setPreviewTab] = useState<'today' | 'kanban' | 'focus'>('today')
  const [demoTasks, setDemoTasks] = useState<DemoTask[]>(INITIAL_DEMO_TASKS)
  const [quickInput, setQuickInput] = useState('')
  const [captureInput, setCaptureInput] = useState(CAPTURE_EXAMPLES[0])
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'calendar'>('list')

  // Interactive miniature Pomodoro inside preview
  const [demoSecs, setDemoSecs] = useState(25 * 60)
  const [demoRunning, setDemoRunning] = useState(false)
  const [now] = useState(() => new Date())
  const previewInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sync = () => setIsDark(resolveDark(getTheme()))
    window.addEventListener('taskflow-theme-change', sync)
    return () => window.removeEventListener('taskflow-theme-change', sync)
  }, [])

  useEffect(() => {
    if (!demoRunning) return
    const id = window.setInterval(() => {
      setDemoSecs(s => (s > 0 ? s - 1 : 25 * 60))
    }, 1000)
    return () => clearInterval(id)
  }, [demoRunning])

  const parsedQuick = useMemo(() => parseQuickAdd(quickInput), [quickInput])
  const parsedCapture = useMemo(() => parseQuickAdd(captureInput), [captureInput])

  const doneCount = demoTasks.filter(x => x.status === 'done').length
  const pct = Math.round((doneCount / Math.max(demoTasks.length, 1)) * 100)

  const handleAddDemoTask = (e: FormEvent) => {
    e.preventDefault()
    if (!parsedQuick.title.trim()) return
    const next: DemoTask = {
      id: `d-${Date.now()}`,
      title: parsedQuick.title.trim(),
      status: 'todo',
      priority: parsedQuick.priority,
      dueLabel: parsedQuick.dueAt
        ? format(parsedQuick.dueAt, parsedQuick.hasTime ? 'MMM d, HH:mm' : 'MMM d')
        : 'Inbox',
      tag: parsedQuick.labels[0] || 'general',
    }
    setDemoTasks(prev => [next, ...prev])
    setQuickInput('')
  }

  const toggleDemoTask = (id: string) => {
    setDemoTasks(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'done' ? 'todo' : 'done' }
          : item,
      ),
    )
  }

  const cycleKanbanStatus = (id: string) => {
    const order: DemoTask['status'][] = ['todo', 'doing', 'done']
    setDemoTasks(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const next = order[(order.indexOf(item.status) + 1) % order.length]
        return { ...item, status: next }
      }),
    )
  }

  const fmtSecs = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const r = (s % 60).toString().padStart(2, '0')
    return `${m}:${r}`
  }

  const focusPreview = () => {
    setPreviewTab('today')
    previewInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => previewInputRef.current?.focus(), 320)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Editorial Navigation */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 focus-visible:rounded-lg">
              <BrandMark size={28} />
              <span className="font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                {t('app')}
              </span>
            </Link>

            <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm text-[var(--ink-secondary)]">
              <a href="#features" className="hover:text-[var(--ink)] transition-colors">{t('landing.navFeatures')}</a>
              <a href="#views" className="hover:text-[var(--ink)] transition-colors">{t('landing.navViews')}</a>
              <a href="#focus" className="hover:text-[var(--ink)] transition-colors">{t('landing.navFocus')}</a>
              <a href="#craft" className="hover:text-[var(--ink)] transition-colors">{t('landing.navCraft')}</a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div
              role="group"
              aria-label={t('settings.language')}
              className="hidden sm:flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-0.5 text-xs"
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`rounded-md px-2 py-1 font-mono-data text-[11px] font-medium transition-colors cursor-pointer ${
                    i18n.language === lang.code
                      ? 'bg-[var(--ink)] text-[var(--bg-canvas)]'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                  }`}
                >
                  {lang.short}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setIsDark(resolveDark(toggleLightDark()))}
              aria-label={t('settings.theme')}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link to="/login" className="btn-ghost px-3 py-2 text-sm hidden sm:inline-flex">
              {t('landing.signIn')}
            </Link>

            <Link to="/login?mode=up" className="btn-primary px-4 py-2 text-sm">
              <span>{t('landing.startFree')}</span>
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 sm:px-8 md:pt-20 md:pb-28 animate-hero-enter">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left Copy Column */}
            <div className="lg:col-span-5 lg:pt-4">
              <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-[var(--ink)] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                {t('landing.heroTitleBefore')}{' '}
                <span className="font-editorial italic font-normal text-[var(--accent)]">
                  {t('landing.heroTitleAccent')}
                </span>
              </h1>

              <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-[var(--ink-secondary)] sm:text-[17px]">
                {t('landing.heroSubtitle')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/login?mode=up" className="btn-primary px-5 py-3 text-sm">
                  <span>{t('landing.startFree')}</span>
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <button type="button" onClick={focusPreview} className="btn-secondary px-5 py-3 text-sm">
                  {t('landing.tryPreview')}
                </button>
              </div>

              {/* Concrete Hard Facts */}
              <ul className="mt-10 space-y-2.5 border-t border-[var(--border)] pt-6 text-sm text-[var(--ink-secondary)]">
                {[t('landing.heroFact1'), t('landing.heroFact2'), t('landing.heroFact3')].map(fact => (
                  <li key={fact} className="flex items-center gap-2.5">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                      <Check size={11} strokeWidth={3} aria-hidden />
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Interactive Live App-Frame */}
            <div className="lg:col-span-7">
              <div className="surface-card overflow-hidden shadow-[var(--shadow-lg)]">
                {/* Window Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BrandMark size={20} />
                    <span className="font-display text-xs font-semibold text-[var(--ink)]">TaskFlow</span>
                    <span className="font-mono-data text-[11px] text-[var(--ink-muted)]">/ workspace</span>
                  </div>

                  {/* Segmented Interactive Preview Switcher */}
                  <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-0.5">
                    {([
                      { id: 'today', label: t('landing.previewTabToday'), Icon: List },
                      { id: 'kanban', label: t('landing.previewTabKanban'), Icon: Kanban },
                      { id: 'focus', label: t('landing.previewTabFocus'), Icon: Timer },
                    ] as const).map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPreviewTab(id)}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          previewTab === id
                            ? 'bg-[var(--ink)] text-[var(--bg-canvas)]'
                            : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <Icon size={13} aria-hidden />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Workspace Body */}
                <div className="p-5 sm:p-6">
                  {previewTab === 'today' && (
                    <div className="space-y-4">
                      {/* Progress Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-display text-base font-semibold text-[var(--ink)]">
                            {t('landing.previewTabToday')}
                          </div>
                          <div className="font-mono-data text-xs text-[var(--ink-muted)]">
                            {format(now, 'EEE, MMM d')} · {doneCount}/{demoTasks.length} {t('task.completed')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                            <div
                              className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono-data text-xs font-semibold text-[var(--success)]">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Real Quick Add Input inside Hero */}
                      <form onSubmit={handleAddDemoTask} className="space-y-2">
                        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-1.5 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)] transition-all">
                          <input
                            ref={previewInputRef}
                            type="text"
                            value={quickInput}
                            onChange={e => setQuickInput(e.target.value)}
                            placeholder={t('landing.previewInputPlaceholder')}
                            className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!quickInput.trim()}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            <Plus size={14} aria-hidden />
                            <span>{t('landing.previewAddBtn')}</span>
                          </button>
                        </div>

                        {quickInput.trim() && (
                          <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px] font-mono-data">
                            <span className="text-[var(--ink-muted)]">{t('task.preview')}:</span>
                            <span className="font-medium text-[var(--ink)]">{parsedQuick.title || '…'}</span>
                            {parsedQuick.dueAt && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[var(--accent)]">
                                <Clock size={11} />
                                {format(parsedQuick.dueAt, parsedQuick.hasTime ? 'MMM d HH:mm' : 'MMM d')}
                              </span>
                            )}
                            {parsedQuick.priority > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[var(--warning)]">
                                <Flag size={11} />
                                P{parsedQuick.priority}
                              </span>
                            )}
                            {parsedQuick.labels.map(lbl => (
                              <span
                                key={lbl}
                                className="inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[var(--ink-secondary)]"
                              >
                                <Hash size={10} />
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}
                      </form>

                      {/* Task Rows */}
                      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                        {demoTasks.slice(0, 5).map(item => {
                          const isDone = item.status === 'done'
                          return (
                            <li
                              key={item.id}
                              className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[var(--bg-canvas)]"
                            >
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isDone}
                                aria-label={item.title}
                                onClick={() => toggleDemoTask(item.id)}
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all cursor-pointer ${
                                  isDone
                                    ? 'border-[var(--success)] bg-[var(--success)] text-white animate-check-pop'
                                    : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
                                }`}
                              >
                                {isDone && <Check size={12} strokeWidth={3} />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div
                                  className={`truncate text-sm font-medium ${
                                    isDone ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink)]'
                                  }`}
                                >
                                  {item.title}
                                </div>
                              </div>

                              <div className="hidden sm:flex items-center gap-2 shrink-0">
                                {item.priority > 0 && (
                                  <span
                                    className={`h-2 w-2 rounded-full ${PRIORITY_DOT[item.priority]}`}
                                    title={`P${item.priority}`}
                                  />
                                )}
                                <span className="font-mono-data text-[11px] text-[var(--ink-muted)]">
                                  #{item.tag}
                                </span>
                                <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-0.5 font-mono-data text-[11px] text-[var(--ink-secondary)]">
                                  {item.dueLabel}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {previewTab === 'kanban' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(['todo', 'doing', 'done'] as const).map(col => {
                        const colItems = demoTasks.filter(x => x.status === col)
                        return (
                          <div
                            key={col}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] p-3"
                          >
                            <div className="mb-2.5 flex items-center justify-between">
                              <span className="text-xs font-semibold text-[var(--ink)]">
                                {t(`kanban.${col}`)}
                              </span>
                              <span className="font-mono-data text-[11px] text-[var(--ink-muted)]">
                                {colItems.length}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {colItems.map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => cycleKanbanStatus(item.id)}
                                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 text-left transition-all hover:border-[var(--border-strong)] hover:-translate-y-0.5 cursor-pointer"
                                >
                                  <div className="text-xs font-medium text-[var(--ink)] leading-snug">
                                    {item.title}
                                  </div>
                                  <div className="mt-2 flex items-center justify-between font-mono-data text-[10px] text-[var(--ink-muted)]">
                                    <span>#{item.tag}</span>
                                    <span>{item.dueLabel}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {previewTab === 'focus' && (
                    <div className="flex flex-col items-center py-4 text-center">
                      <div className="font-mono-data text-xs text-[var(--ink-muted)]">
                        {demoTasks.find(x => x.status !== 'done')?.title || t('focus.noTaskSelected')}
                      </div>
                      <div className="mt-3 font-mono-data text-6xl font-semibold tracking-tight text-[var(--ink)]">
                        {fmtSecs(demoSecs)}
                      </div>
                      <div className="mt-5 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setDemoRunning(r => !r)}
                          className="btn-primary px-5 py-2.5 text-sm"
                        >
                          {demoRunning ? <Pause size={15} /> : <Play size={15} />}
                          <span>{demoRunning ? t('focus.pause') : t('focus.start')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDemoRunning(false)
                            setDemoSecs(25 * 60)
                          }}
                          className="btn-secondary p-2.5"
                          aria-label={t('focus.reset')}
                        >
                          <RotateCcw size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--ink-muted)]">
                {t('landing.previewHint')}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Natural-Language Capture Workbench */}
        <section id="features" className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
                {t('landing.captureTitle')}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ink-secondary)]">
                {t('landing.captureBody')}
              </p>

              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium text-[var(--ink-muted)]">
                  {t('landing.captureTryLabel')}
                </p>
                {CAPTURE_EXAMPLES.map(example => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setCaptureInput(example)}
                    className={`block w-full rounded-lg border px-3.5 py-2 text-left font-mono-data text-xs transition-colors cursor-pointer ${
                      captureInput === example
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] p-6 sm:p-8">
                <label className="block text-xs font-medium text-[var(--ink-muted)] mb-2">
                  Quick Add Input
                </label>
                <input
                  type="text"
                  value={captureInput}
                  onChange={e => setCaptureInput(e.target.value)}
                  className="input-field font-mono-data text-sm"
                />

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                    <div className="text-[11px] text-[var(--ink-muted)]">{t('task.title')}</div>
                    <div className="mt-1 truncate text-sm font-semibold text-[var(--ink)]">
                      {parsedCapture.title || '—'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                    <div className="text-[11px] text-[var(--ink-muted)]">{t('task.due')}</div>
                    <div className="mt-1 font-mono-data text-sm font-semibold text-[var(--accent)]">
                      {parsedCapture.dueAt
                        ? format(parsedCapture.dueAt, parsedCapture.hasTime ? 'MMM d, HH:mm' : 'MMM d')
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                    <div className="text-[11px] text-[var(--ink-muted)]">{t('task.priority')}</div>
                    <div className="mt-1 font-mono-data text-sm font-semibold text-[var(--warning)]">
                      {parsedCapture.priority > 0 ? t(`task.p${parsedCapture.priority}`) : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5">
                    <div className="text-[11px] text-[var(--ink-muted)]">Labels</div>
                    <div className="mt-1 truncate font-mono-data text-sm font-semibold text-[var(--success)]">
                      {parsedCapture.labels.length > 0 ? parsedCapture.labels.map(l => `#${l}`).join(' ') : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Three Views Over One Source of Truth */}
        <section id="views" className="border-t border-[var(--border)] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
                  {t('landing.viewsTitle')}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--ink-secondary)]">
                  {t('landing.viewsBody')}
                </p>
              </div>

              <div className="inline-flex self-start rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1">
                {([
                  { id: 'list', label: t('project.viewList'), Icon: List },
                  { id: 'kanban', label: t('project.viewKanban'), Icon: Kanban },
                  { id: 'calendar', label: t('project.viewCalendar'), Icon: Calendar },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveView(id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      activeView === id
                        ? 'bg-[var(--ink)] text-[var(--bg-canvas)]'
                        : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Icon size={14} aria-hidden />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-4">
                {([
                  { id: 'list', title: t('project.viewList'), desc: t('landing.viewsListDesc'), Icon: List },
                  { id: 'kanban', title: t('project.viewKanban'), desc: t('landing.viewsKanbanDesc'), Icon: Kanban },
                  { id: 'calendar', title: t('project.viewCalendar'), desc: t('landing.viewsCalendarDesc'), Icon: Calendar },
                ] as const).map(({ id, title, desc, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveView(id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      activeView === id
                        ? 'border-[var(--accent)] bg-[var(--bg-surface)]'
                        : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-surface)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={activeView === id ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'}
                        aria-hidden
                      />
                      <span className="font-display text-sm font-semibold text-[var(--ink)]">{title}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">{desc}</p>
                  </button>
                ))}
              </div>

              <div className="surface-card p-6 lg:col-span-8">
                {activeView === 'list' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <span className="font-display text-sm font-semibold text-[var(--ink)]">Website Launch</span>
                      <span className="font-mono-data text-xs text-[var(--success)]">68% {t('task.completed')}</span>
                    </div>
                    {INITIAL_DEMO_TASKS.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              item.status === 'done'
                                ? 'bg-[var(--success)]'
                                : PRIORITY_DOT[item.priority] || 'bg-[var(--border-strong)]'
                            }`}
                          />
                          <span
                            className={`truncate text-sm ${
                              item.status === 'done'
                                ? 'line-through text-[var(--ink-muted)]'
                                : 'font-medium text-[var(--ink)]'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        <span className="ml-3 shrink-0 font-mono-data text-xs text-[var(--ink-muted)]">
                          {item.dueLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeView === 'kanban' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {([
                      { key: 'todo', dot: 'bg-[var(--ink-muted)]', items: [INITIAL_DEMO_TASKS[1], INITIAL_DEMO_TASKS[2]] },
                      { key: 'doing', dot: 'bg-[var(--accent)]', items: [INITIAL_DEMO_TASKS[0]] },
                      { key: 'done', dot: 'bg-[var(--success)]', items: [INITIAL_DEMO_TASKS[3]] },
                    ] as const).map(col => (
                      <div key={col.key} className="rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                          <span className="text-xs font-semibold text-[var(--ink)]">{t(`kanban.${col.key}`)}</span>
                          <span className="ml-auto font-mono-data text-[11px] text-[var(--ink-muted)]">
                            {col.items.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {col.items.map(card => (
                            <div
                              key={card.id}
                              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
                            >
                              <div className="text-xs font-medium text-[var(--ink)]">{card.title}</div>
                              <div className="mt-2 font-mono-data text-[10px] text-[var(--ink-muted)]">
                                #{card.tag} · {card.dueLabel}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeView === 'calendar' && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-display text-sm font-semibold text-[var(--ink)]">
                        {format(now, 'MMMM yyyy')}
                      </span>
                      <span className="font-mono-data text-xs text-[var(--ink-muted)]">Mon – Sun</span>
                    </div>
                    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
                      {Array.from({ length: 14 }).map((_, idx) => {
                        const dayNum = idx + 12
                        const isCurrent = idx === 4
                        const hasEvent = idx === 4 || idx === 6 || idx === 10
                        return (
                          <div
                            key={dayNum}
                            className="min-h-[76px] bg-[var(--bg-surface)] p-2 flex flex-col justify-between"
                          >
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-md font-mono-data text-[11px] font-medium ${
                                isCurrent
                                  ? 'bg-[var(--accent)] text-white'
                                  : 'text-[var(--ink-secondary)]'
                              }`}
                            >
                              {dayNum}
                            </span>
                            {hasEvent && (
                              <span className="truncate rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                                {idx === 4 ? 'Q4 roadmap' : idx === 6 ? 'PR review' : 'Release v2'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Focus & Weekly Progress */}
        <section id="focus" className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
                {t('landing.focusTitle')}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ink-secondary)]">
                {t('landing.focusBody')}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Focus Timer Architectural Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] p-6 sm:p-8 lg:col-span-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                    {t('landing.focusSessionLabel')}
                  </span>
                  <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-mono-data text-[11px] font-medium text-[var(--accent)]">
                    25:00 · Pomodoro
                  </span>
                </div>

                <div className="my-8 flex flex-col items-center">
                  <div className="relative grid h-44 w-44 place-items-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="5" />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={326.7}
                        strokeDashoffset={326.7 * 0.28}
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="font-mono-data text-3xl font-semibold text-[var(--ink)]">18:04</div>
                      <div className="mt-1 text-[11px] text-[var(--ink-muted)]">Deep work</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-[var(--ink)]">
                    Finalize Q4 product roadmap
                  </span>
                  <span className="ml-2 shrink-0 font-mono-data text-xs text-[var(--success)]">72%</span>
                </div>
              </div>

              {/* 7-day Completion Trend */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[var(--ink-secondary)]">
                      {t('landing.focusTrendLabel')}
                    </div>
                    <div className="mt-1 font-mono-data text-2xl font-bold text-[var(--ink)]">
                      50 <span className="text-sm font-normal text-[var(--ink-muted)]">{t('task.completed')}</span>
                    </div>
                  </div>
                  <span className="font-mono-data text-xs text-[var(--ink-muted)]">Mon – Sun</span>
                </div>

                <div className="mt-8 grid h-48 grid-cols-7 items-end gap-3 sm:gap-5">
                  {WEEK_BARS.map(bar => {
                    const heightPct = Math.round((bar.count / 12) * 100)
                    return (
                      <div key={bar.day} className="flex h-full flex-col items-center justify-end gap-2">
                        <span className="font-mono-data text-[11px] text-[var(--ink-muted)]">{bar.count}</span>
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t-md bg-[var(--accent)] transition-all duration-300 hover:opacity-85"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="font-mono-data text-xs text-[var(--ink-secondary)]">{bar.day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Quiet Engineering Ledger */}
        <section id="craft" className="border-t border-[var(--border)] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
                {t('landing.craftTitle')}
              </h2>
              <p className="mt-3 text-base text-[var(--ink-secondary)]">
                {t('landing.craftBody')}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 border-t border-l border-[var(--border)] sm:grid-cols-2">
              {([
                { title: t('landing.craftItem1Title'), body: t('landing.craftItem1Body'), Icon: WifiOff },
                { title: t('landing.craftItem2Title'), body: t('landing.craftItem2Body'), Icon: Download },
                { title: t('landing.craftItem3Title'), body: t('landing.craftItem3Body'), Icon: Globe },
                { title: t('landing.craftItem4Title'), body: t('landing.craftItem4Body'), Icon: Keyboard },
              ]).map(({ title, body, Icon }) => (
                <div
                  key={title}
                  className="border-r border-b border-[var(--border)] bg-[var(--bg-surface)] p-7 sm:p-8"
                >
                  <Icon size={20} className="text-[var(--accent)]" aria-hidden />
                  <h3 className="mt-4 font-display text-lg font-semibold text-[var(--ink)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Call to Action */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-7 py-12 sm:px-12 sm:py-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
                  {t('landing.ctaTitle')}
                </h2>
                <p className="mt-3 text-base text-[var(--ink-secondary)]">
                  {t('landing.ctaBody')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link to="/login?mode=up" className="btn-primary px-6 py-3 text-sm">
                  <span>{t('landing.ctaPrimary')}</span>
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link to="/login" className="btn-secondary px-5 py-3 text-sm">
                  {t('landing.ctaSecondary')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-canvas)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-3">
            <BrandMark size={24} />
            <span className="text-sm text-[var(--ink-secondary)]">{t('landing.footerNote')}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 sm:hidden">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`rounded px-2 py-1 font-mono-data text-xs cursor-pointer ${
                    i18n.language === lang.code
                      ? 'bg-[var(--ink)] text-[var(--bg-canvas)]'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {lang.short}
                </button>
              ))}
            </div>
            <Link to="/login" className="text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors">
              {t('landing.signIn')}
            </Link>
            <Link to="/login?mode=up" className="font-medium text-[var(--accent)] hover:underline">
              {t('auth.signUp')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
