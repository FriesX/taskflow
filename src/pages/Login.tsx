import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandMark from '../components/BrandMark'
import { LANGUAGES } from '../i18n'
import { getTheme, resolveDark, toggleLightDark } from '../lib/theme'

export default function Login() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, google, reset, redirectError, clearRedirectError } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>(() => (searchParams.get('mode') === 'up' ? 'up' : 'in'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [isDark, setIsDark] = useState(() => resolveDark(getTheme()))

  useEffect(() => {
    const sync = () => setIsDark(resolveDark(getTheme()))
    window.addEventListener('taskflow-theme-change', sync)
    return () => window.removeEventListener('taskflow-theme-change', sync)
  }, [])

  const formatAuthError = (err: unknown) => {
    console.error('Auth error:', err)
    const code = (err as { code?: string })?.code || ''
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-email'
    ) {
      return t('auth.invalidCredentials')
    }
    if (code === 'auth/popup-blocked') {
      return 'Popup login diblokir oleh browser. Izinkan pop-up pada address bar lalu coba lagi.'
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela masuk Google ditutup sebelum selesai.'
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domain ini belum diizinkan di Firebase Console > Authentication > Settings > Authorized domains.'
    }
    return t('auth.authError')
  }

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setMsg(null)
    clearRedirectError()
    try {
      await fn()
    } catch (e) {
      setMsg({ text: formatAuthError(e), error: true })
    } finally {
      setBusy(false)
    }
  }

  const displayMsg =
    msg ?? (redirectError ? { text: formatAuthError(redirectError), error: true } : null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(() => (mode === 'in' ? signIn(email, password) : signUp(email, password)))
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--bg-canvas)] text-[var(--ink)]">
      {/* Left Editorial Context Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between border-r border-[var(--border)] bg-[var(--bg-surface)] p-12">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <BrandMark size={30} />
            <span className="font-display text-xl font-bold tracking-tight text-[var(--ink)]">
              {t('app')}
            </span>
          </Link>

          <div className="mt-16">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-[var(--ink)]">
              {t('auth.asideHeadline')}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-secondary)]">
              {t('auth.asideBody')}
            </p>
          </div>

          <ul className="mt-10 space-y-4 border-t border-[var(--border)] pt-8 text-sm text-[var(--ink-secondary)]">
            {[t('auth.asideFact1'), t('auth.asideFact2'), t('auth.asideFact3')].map(fact => (
              <li key={fact} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                  <Check size={12} strokeWidth={3} aria-hidden />
                </span>
                <span className="leading-snug">{fact}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft size={14} aria-hidden />
          <span>{t('auth.backHome')}</span>
        </Link>
      </aside>

      {/* Right Authentication Form */}
      <section className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] lg:invisible"
          >
            <ArrowLeft size={14} aria-hidden />
            <span>{t('auth.backHome')}</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-0.5">
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
            <button
              type="button"
              onClick={() => setIsDark(resolveDark(toggleLightDark()))}
              aria-label={t('settings.theme')}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-md py-10 animate-view-enter">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark size={28} />
            <span className="font-display text-lg font-bold tracking-tight">{t('app')}</span>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[var(--ink)] sm:text-3xl">
            {mode === 'in' ? t('auth.signIn') : t('auth.signUp')}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
            {mode === 'in' ? t('auth.welcomeBack') : t('auth.createSubtitle')}
          </p>

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(google)}
            className="btn-secondary mt-7 w-full py-2.5 text-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('auth.google')}</span>
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              {t('auth.or')}
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[var(--ink-secondary)] mb-1.5">
                {t('auth.email')}
              </label>
              <input
                id="auth-email"
                className="input-field"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="text-xs font-medium text-[var(--ink-secondary)]">
                  {t('auth.password')}
                </label>
                {mode === 'in' && (
                  <button
                    type="button"
                    className="text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer"
                    onClick={() =>
                      email &&
                      run(async () => {
                        await reset(email)
                        setMsg({ text: t('auth.resetSent'), error: false })
                      })
                    }
                  >
                    {t('auth.reset')}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  className="input-field pr-10"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {displayMsg && (
              <div
                role="alert"
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium animate-toast-in ${
                  displayMsg.error
                    ? 'border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]'
                    : 'border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]'
                }`}
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{displayMsg.text}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-sm">
              {mode === 'in' ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--ink-secondary)]">
            {mode === 'in' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <button
              type="button"
              className="font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              onClick={() => {
                setMode(mode === 'in' ? 'up' : 'in')
                setMsg(null)
              }}
            >
              {mode === 'in' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>

        <div className="text-center text-xs text-[var(--ink-muted)] lg:text-right">
          {t('app')}
        </div>
      </section>
    </main>
  )
}
