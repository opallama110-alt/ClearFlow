import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'info'
type ToastState = { id: number; tone: Tone; message: string }

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DURATION: Record<Tone, number> = { success: 3_500, info: 4_500, error: 6_500 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>()

  const show = useCallback((tone: Tone, message: string) => {
    setToast({ id: Date.now(), tone, message })
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(undefined), DURATION[toast.tone])
    return () => window.clearTimeout(timeout)
  }, [toast])

  const api = useMemo<ToastApi>(() => ({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    info: (message) => show('info', message),
  }), [show])

  const Icon = toast?.tone === 'error' ? CircleAlert : toast?.tone === 'info' ? Info : CircleCheck

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Region live selalu terpasang agar pembaca layar mengumumkan setiap pesan baru. */}
      <div className="toast-region" aria-live={toast?.tone === 'error' ? 'assertive' : 'polite'} role="status">
        {toast && (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <Icon size={18} aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(undefined)} aria-label="Tutup pemberitahuan"><X size={16} /></button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider')
  return context
}
