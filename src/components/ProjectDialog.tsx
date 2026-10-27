import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Briefcase, Code, Folder, GraduationCap, Heart, Home, Rocket, ShoppingCart, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createProject } from '../services/data'
import { useToast } from '../context/ToastContext'

const COLORS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
]

const ICONS = [
  { name: 'folder', Icon: Folder },
  { name: 'briefcase', Icon: Briefcase },
  { name: 'graduation-cap', Icon: GraduationCap },
  { name: 'home', Icon: Home },
  { name: 'heart', Icon: Heart },
  { name: 'rocket', Icon: Rocket },
  { name: 'code', Icon: Code },
  { name: 'shopping-cart', Icon: ShoppingCart },
]

export default function ProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { success } = useToast()
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState(ICONS[0].name)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setName('')
      setColor(COLORS[0])
      setIcon(ICONS[0].name)
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setBusy(true)
    try {
      await createProject(user.uid, { name: name.trim(), color, icon })
      success(name.trim(), t('project.new'))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const field =
    'mt-1.5 w-full rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 transition-all'

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="proj-dialog-title"
      className="m-auto w-full max-w-md rounded-3xl glass-panel p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <h2 id="proj-dialog-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('project.new')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('project.name')}
          <input
            className={field}
            required
            maxLength={100}
            placeholder="e.g. Website Launch"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>

        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t('project.color')}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                aria-label={c}
                className={`h-7 w-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t('project.icon')}
          </span>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(({ name: iName, Icon }) => (
              <button
                key={iName}
                type="button"
                onClick={() => setIcon(iName)}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                  icon === iName
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {t('task.cancel')}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-gradient-primary rounded-2xl px-5 py-2 text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {t('task.save')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
