import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, CheckCircle } from 'lucide-react'
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
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // Ignore audio error if not allowed by browser
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
            clearInterval(timerRef.current!)
            setIsRunning(false)
            if (soundEnabled) playChime()

            if (mode === 'pomodoro') {
              setCompletedSessions(c => c + 1)
              setMode('shortBreak')
              return DURATIONS.shortBreak
            } else {
              setMode('pomodoro')
              return DURATIONS.pomodoro
            }
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
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('nav.focus')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Pomodoro Timer & Focus Flow
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1.5 rounded-2xl glass-card px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 cursor-pointer"
          title={t('focus.soundEnabled')}
        >
          {soundEnabled ? <Volume2 size={16} className="text-indigo-600 dark:text-indigo-400" /> : <VolumeX size={16} />}
          <span className="hidden sm:inline">{t('focus.soundEnabled')}</span>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-10 text-center border border-slate-200/80 dark:border-slate-800/80 shadow-xl">
        {/* Ambient subtle glow behind timer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Mode selector pills */}
        <div className="inline-flex rounded-2xl glass-panel p-1.5 border border-slate-200/70 dark:border-slate-800/70 shadow-xs relative z-10">
          {(['pomodoro', 'shortBreak', 'longBreak'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                mode === m
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t(`focus.${m}`)}
            </button>
          ))}
        </div>

        {/* Big Countdown Timer */}
        <div className="my-10 relative z-10">
          <div className="font-mono text-7xl md:text-8xl font-black tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </div>
          {/* Progress bar */}
          <div className="mx-auto mt-6 h-2.5 max-w-xs overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-500 transition-all duration-300 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 relative z-10">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-gradient-primary flex h-16 w-16 items-center justify-center rounded-3xl shadow-lg cursor-pointer"
            aria-label={isRunning ? t('focus.pause') : t('focus.start')}
          >
            {isRunning ? <Pause size={26} strokeWidth={2.5} /> : <Play size={26} strokeWidth={2.5} className="ml-1" />}
          </button>
          <button
            onClick={resetTimer}
            className="flex h-12 w-12 items-center justify-center rounded-2xl glass-card text-slate-500 transition-all hover:text-slate-800 dark:hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
            aria-label={t('focus.reset')}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => {
              if (mode === 'pomodoro') switchMode('shortBreak')
              else switchMode('pomodoro')
            }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl glass-card text-slate-500 transition-all hover:text-slate-800 dark:hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
            aria-label={t('focus.skip')}
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Completed Pomodoro Counter */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <span>{t('focus.completedSessions')}:</span>
          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{completedSessions}</span>
          <span className="text-base">🍅</span>
        </div>
      </div>

      {/* Task Picker Card */}
      <div className="rounded-3xl glass-card p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          {t('focus.selectTask')}
        </label>
        <select
          value={selectedTaskId}
          onChange={e => setSelectedTaskId(e.target.value)}
          className="w-full rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
        >
          <option value="">{t('focus.noTaskSelected')}</option>
          {activeTasks.map(t => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        {selectedTask && (
          <div className="mt-4 flex items-center justify-between rounded-2xl glass-panel p-4 border border-slate-200/60 dark:border-slate-800/60 animate-page-enter">
            <div className="truncate font-medium text-sm text-slate-800 dark:text-slate-100">{selectedTask.title}</div>
            <button
              onClick={() => {
                toggleDone(selectedTask)
                setSelectedTaskId('')
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500/15 to-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle size={14} /> {t('task.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
