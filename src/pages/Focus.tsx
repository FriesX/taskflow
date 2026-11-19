import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, CheckCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { isDeleted } from '../lib/taskLogic'
import { toggleDone } from '../services/data'

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak'

const DURATIONS: Record<Mode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // Ignore audio error if blocked by browser autoplay policy
  }
}

export default function Focus() {
  const { t } = useTranslation()
  const { tasks } = useData()
  const [mode, setMode] = useState<Mode>('pomodoro')
  const [timeLeft, setTimeLeft] = useState(DURATIONS.pomodoro)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const timerRef = useRef<number | null>(null)
  const activeTasks = tasks.filter(t => !isDeleted(t) && !t.parentTaskId && t.status !== 'done')
  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setIsRunning(false)
            if (soundEnabled) playChime()

            if (mode === 'pomodoro') {
              setCompletedSessions(c => c + 1)
              setMode('shortBreak')
              return DURATIONS.shortBreak
            }
            setMode('pomodoro')
            return DURATIONS.pomodoro
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode, soundEnabled])

  const switchMode = (newMode: Mode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(DURATIONS[newMode])
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(DURATIONS[mode])
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const totalDuration = DURATIONS[mode]
  const progressRatio = (totalDuration - timeLeft) / totalDuration
  const radius = 104
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progressRatio)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
            {t('nav.focus')}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            {t('focus.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="btn-secondary px-3 py-2 text-xs shrink-0"
          title={t('focus.soundEnabled')}
        >
          {soundEnabled ? (
            <Volume2 size={15} className="text-[var(--accent)]" aria-hidden />
          ) : (
            <VolumeX size={15} className="text-[var(--ink-muted)]" aria-hidden />
          )}
          <span className="hidden sm:inline">{t('focus.soundEnabled')}</span>
        </button>
      </div>

      {/* Studio Timer Card */}
      <div className="surface-card p-7 sm:p-10 text-center">
        {/* Mode Switcher */}
        <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] p-1">
          {(['pomodoro', 'shortBreak', 'longBreak'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-[var(--ink)] text-[var(--bg-canvas)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
              }`}
            >
              {t(`focus.${m}`)}
            </button>
          ))}
        </div>

        {/* Circular SVG Ring + Countdown */}
        <div className="my-8 flex justify-center">
          <div className="relative grid h-60 w-60 place-items-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="6"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke={mode === 'pomodoro' ? 'var(--accent)' : 'var(--success)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <div className="absolute text-center">
              <div className="font-mono-data text-5xl font-bold tracking-tight text-[var(--ink)] sm:text-6xl">
                {formatTime(timeLeft)}
              </div>
              <div className="mt-2 font-mono-data text-xs text-[var(--ink-muted)]">
                {t(`focus.${mode}`)}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetTimer}
            className="btn-secondary h-11 w-11 p-0"
            aria-label={t('focus.reset')}
          >
            <RotateCcw size={17} aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary h-12 px-7 text-sm"
            aria-label={isRunning ? t('focus.pause') : t('focus.start')}
          >
            {isRunning ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            <span>{isRunning ? t('focus.pause') : t('focus.start')}</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode(mode === 'pomodoro' ? 'shortBreak' : 'pomodoro')}
            className="btn-secondary h-11 w-11 p-0"
            aria-label={t('focus.skip')}
          >
            <SkipForward size={17} aria-hidden />
          </button>
        </div>

        {/* Completed Sessions Indicator */}
        <div className="mt-7 flex items-center justify-center gap-3 border-t border-[var(--border)] pt-5 text-xs text-[var(--ink-secondary)]">
          <span>{t('focus.completedSessions')}</span>
          <span className="font-mono-data text-sm font-bold text-[var(--ink)]">{completedSessions}</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx < completedSessions % 4 || (completedSessions > 0 && completedSessions % 4 === 0)
                    ? 'bg-[var(--success)]'
                    : 'bg-[var(--border-strong)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Task Picker Card */}
      <div className="surface-card p-5">
        <label htmlFor="focus-task-select" className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]">
          {t('focus.selectTask')}
        </label>
        <select
          id="focus-task-select"
          value={selectedTaskId}
          onChange={e => setSelectedTaskId(e.target.value)}
          className="input-field"
        >
          <option value="">{t('focus.noTaskSelected')}</option>
          {activeTasks.map(taskItem => (
            <option key={taskItem.id} value={taskItem.id}>
              {taskItem.title}
            </option>
          ))}
        </select>

        {selectedTask && (
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] px-4 py-3 animate-view-enter">
            <div className="truncate text-sm font-medium text-[var(--ink)]">{selectedTask.title}</div>
            <button
              type="button"
              onClick={() => {
                toggleDone(selectedTask)
                setSelectedTaskId('')
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--success)]/30 bg-[var(--success-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--success)] hover:opacity-85 transition-opacity cursor-pointer"
            >
              <CheckCircle2 size={14} aria-hidden />
              <span>{t('task.done')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
