import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ message, title, type = 'info', duration = 3400 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts(prev => [...prev, { id, message, title, type, duration }])
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast],
  )

  const success = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: 'success' })
  }, [showToast])

  const error = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: 'error' })
  }, [showToast])

  const info = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: 'info' })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2 pointer-events-none px-4 sm:px-0"
      >
        {toasts.map(item => {
          const isSuccess = item.type === 'success'
          const isError = item.type === 'error'
          return (
            <div
              key={item.id}
              role="status"
              className="surface-elevated pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-toast-in"
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" aria-hidden />}
                {isError && <AlertCircle className="h-4 w-4 text-[var(--danger)]" aria-hidden />}
                {!isSuccess && !isError && <Info className="h-4 w-4 text-[var(--accent)]" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                {item.title && <div className="font-semibold text-[var(--ink)]">{item.title}</div>}
                <div className="truncate text-xs text-[var(--ink-secondary)] leading-relaxed">{item.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="shrink-0 rounded-md p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
