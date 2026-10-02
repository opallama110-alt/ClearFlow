import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let openModalCount = 0

type Props = {
  labelledBy: string
  describedBy?: string
  onClose: () => void
  children: ReactNode
  className?: string
  /** Sheet menempel di bawah layar pada ponsel; dialog selalu di tengah. */
  variant?: 'sheet' | 'dialog'
  /** Mencegah penutupan lewat Esc/klik latar saat proses penting berjalan. */
  dismissible?: boolean
  role?: 'dialog' | 'alertdialog'
}

/**
 * Modal aksesibel: menjebak fokus, menutup dengan Esc, mengunci scroll halaman,
 * dan mengembalikan fokus ke elemen pemicu setelah ditutup.
 */
export default function Modal({
  labelledBy,
  describedBy,
  onClose,
  children,
  className = '',
  variant = 'sheet',
  dismissible = true,
  role = 'dialog',
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)

  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    openModalCount += 1
    document.documentElement.classList.add('modal-open')

    const autofocus = panel?.querySelector<HTMLElement>('[data-autofocus]')
    ;(autofocus ?? panel)?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panel) return
      if (event.key === 'Escape' && dismissibleRef.current) {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.offsetParent !== null)
      if (!focusable.length) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    panel?.addEventListener('keydown', handleKeyDown)
    return () => {
      panel?.removeEventListener('keydown', handleKeyDown)
      openModalCount -= 1
      if (openModalCount <= 0) document.documentElement.classList.remove('modal-open')
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div
      className={`modal-backdrop modal-${variant}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissibleRef.current) onCloseRef.current()
      }}
    >
      <div
        ref={panelRef}
        className={`modal-card ${className}`}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
