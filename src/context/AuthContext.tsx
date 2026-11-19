import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  redirectError: unknown
  clearRedirectError: () => void
  signIn: (email: string, password: string) => Promise<unknown>
  signUp: (email: string, password: string) => Promise<unknown>
  google: () => Promise<unknown>
  reset: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirectError, setRedirectError] = useState<unknown>(null)

  useEffect(() => {
    let authSettled = false
    let redirectSettled = false
    const finishIfReady = () => {
      if (authSettled && redirectSettled) setLoading(false)
    }

    // Completes any pending redirect sign-in AND pre-initializes Firebase's popup/redirect
    // iframe on page load so Chrome's user-gesture window never expires before window.open().
    getRedirectResult(auth, browserPopupRedirectResolver)
      .then(result => {
        if (result?.user) setUser(result.user)
      })
      .catch(err => {
        setRedirectError(err)
      })
      .finally(() => {
        redirectSettled = true
        finishIfReady()
      })

    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      authSettled = true
      finishIfReady()
    })

    return unsub
  }, [])

  const google = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      return await signInWithPopup(auth, provider, browserPopupRedirectResolver)
    } catch (err) {
      const code = (err as { code?: string })?.code || ''
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        return signInWithRedirect(auth, provider, browserPopupRedirectResolver)
      }
      throw err
    }
  }

  const value: AuthState = {
    user,
    loading,
    redirectError,
    clearRedirectError: () => setRedirectError(null),
    signIn: (e, p) => signInWithEmailAndPassword(auth, e, p),
    signUp: (e, p) => createUserWithEmailAndPassword(auth, e, p),
    google,
    reset: e => sendPasswordResetEmail(auth, e),
    logout: () => signOut(auth),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
