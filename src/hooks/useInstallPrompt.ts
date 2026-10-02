import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | undefined
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    listeners.forEach((listener) => listener())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = undefined
    listeners.forEach((listener) => listener())
  })
}

/** Menyediakan tombol "Pasang aplikasi" ketika browser mendukung instalasi PWA. */
export const useInstallPrompt = () => {
  const [available, setAvailable] = useState(() => Boolean(deferredPrompt))

  useEffect(() => {
    const sync = () => setAvailable(Boolean(deferredPrompt))
    listeners.add(sync)
    return () => { listeners.delete(sync) }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = undefined
    setAvailable(false)
    return outcome === 'accepted'
  }, [])

  return { available, install }
}
