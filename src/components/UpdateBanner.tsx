import { useSyncExternalStore } from 'react'
import { RefreshCw } from 'lucide-react'
import { isUpdateReady, onUpdateReady, reloadToUpdate } from '../registerServiceWorker'

/** Pemberitahuan versi baru dari service worker. */
export default function UpdateBanner() {
  const ready = useSyncExternalStore(onUpdateReady, isUpdateReady, () => false)
  if (!ready) return null
  return (
    <div className="update-banner" role="status">
      <span>Versi baru ClearFlow tersedia.</span>
      <button type="button" onClick={() => void reloadToUpdate()}><RefreshCw size={15} aria-hidden="true" /> Muat ulang</button>
    </div>
  )
}
