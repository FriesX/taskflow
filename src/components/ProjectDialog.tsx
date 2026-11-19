import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Briefcase, Code, Folder, GraduationCap, Heart, Home, Rocket, ShoppingCart, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createProject } from '../services/data'
import { useToast } from '../context/ToastContext'

const COLORS = [
  '#1D4ED8', // Cobalt
  '#0284C7', // Cerulean
  '#0F766E', // Forest Teal
  '#15803D', // Pine
  '#B45309', // Ochre
  '#C2410C', // Terracotta
  '#DC2626', // Vermilion
  '#475569', // Slate
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

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="proj-dialog-title"
      className="surface-elevated m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-6 text-[var(--ink)]"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 id="proj-dialog-title" className="font-display text-lg font-bold tracking-tight text-[var(--ink)]">
            {t('project.new')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
          {t('project.name')}
          <input
            className="input-field mt-1.5"
            required
            maxLength={100}
            placeholder="e.g. Website Launch"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]">
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
                  color === c ? 'scale-115 ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--bg-surface)]' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--ink-secondary)]">
            {t('project.icon')}
          </span>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(({ name: iName, Icon }) => (
              <button
                key={iName}
                type="button"
                onClick={() => setIcon(iName)}
                className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors cursor-pointer ${
                  icon === iName
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon size={17} aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
            {t('task.cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-sm">
            {t('task.save')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
