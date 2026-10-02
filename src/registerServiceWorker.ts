import { registerSW } from 'virtual:pwa-register'

type Listener = () => void

let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined
let updateReady = false
const listeners = new Set<Listener>()

export const isUpdateReady = () => updateReady

export const onUpdateReady = (listener: Listener) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const reloadToUpdate = () => applyUpdate?.(true)

/**
 * Service worker menyimpan cangkang aplikasi agar ClearFlow tetap terbuka saat offline.
 * Versi baru tidak dipaksakan: pengguna memilih kapan memuat ulang agar ketikan tidak hilang.
 */
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true
      listeners.forEach((listener) => listener())
    },
    onRegisteredSW(_url, registration) {
      // Periksa versi baru setiap jam selama aplikasi terbuka.
      if (registration) window.setInterval(() => void registration.update().catch(() => undefined), 60 * 60_000)
    },
  })
}
