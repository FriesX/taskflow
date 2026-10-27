import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const { signIn, signUp, google, reset } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

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
      return 'Popup login diblokir oleh browser. Harap klik ikon pop-up di address bar browser untuk mengizinkannya.'
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela masuk Google ditutup sebelum selesai.'
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domain ini belum diizinkan di Firebase Authentication > Settings > Authorized domains.'
    }
    return t('auth.authError')
  }

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setMsg(null)
    try { await fn() } catch (e) { setMsg({ text: formatAuthError(e), error: true }) }
    finally { setBusy(false) }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(() => (mode === 'in' ? signIn(email, password) : signUp(email, password)))
  }

  const inputClass =
    'w-full rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 transition-all'

  return (
    <main className="min-h-screen grid place-items-center p-4 relative overflow-hidden">
      {/* Dynamic ambient gradient background mesh */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl glass-panel p-8 md:p-10 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 relative z-10 animate-page-enter">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <CheckCircle2 size={26} strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('app')}
          </span>
        </div>

        <h1 className="mb-6 text-xl font-bold text-center text-slate-800 dark:text-slate-100 tracking-tight">
          {mode === 'in' ? t('auth.signIn') : t('auth.signUp')}
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {t('auth.email')}
            </label>
            <input
              className={inputClass}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {t('auth.password')}
            </label>
            <input
              className={inputClass}
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {msg && (
            <div
              role="alert"
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-toast-bounce ${
                msg.error
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
              }`}
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-gradient-primary w-full rounded-2xl py-3 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            {mode === 'in' ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>

        {mode === 'in' && (
          <div className="mt-3 text-center">
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer hover:underline"
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
          </div>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700/80" />
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t('auth.or')}</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700/80" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(google)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
          {t('auth.google')}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === 'in' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <button
            type="button"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
          >
            {mode === 'in' ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </p>
      </div>
    </main>
  )
}
