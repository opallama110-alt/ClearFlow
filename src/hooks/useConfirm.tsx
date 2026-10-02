import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import Modal from '../components/Modal'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Pengganti window.confirm yang konsisten dengan desain dan dapat diakses keyboard. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions>()
  const resolverRef = useRef<(value: boolean) => void>(undefined)

  const confirm = useCallback<ConfirmFn>((next) => new Promise<boolean>((resolve) => {
    resolverRef.current?.(false)
    resolverRef.current = resolve
    setOptions(next)
  }), [])

  const settle = (value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = undefined
    setOptions(undefined)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal labelledBy="confirm-title" describedBy="confirm-message" onClose={() => settle(false)} variant="dialog" role="alertdialog" className="confirm-modal">
          <div className={`confirm-icon ${options.tone === 'danger' ? 'danger' : ''}`} aria-hidden="true"><CircleAlert size={24} /></div>
          <h2 id="confirm-title">{options.title}</h2>
          <p id="confirm-message">{options.message}</p>
          <div className="confirm-actions">
            <button type="button" className="secondary-button" onClick={() => settle(false)} data-autofocus>{options.cancelLabel ?? 'Batal'}</button>
            <button type="button" className={options.tone === 'danger' ? 'danger-solid-button' : 'primary-button'} onClick={() => settle(true)}>{options.confirmLabel ?? 'Lanjutkan'}</button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm harus dipakai di dalam ConfirmProvider')
  return context
}
