import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { reportError } from '../firebase'
import BrandMark from './BrandMark'

type Props = { children: ReactNode }
type State = { error?: Error }

const isChunkLoadError = (error: Error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error.message)

/** Menampilkan layar pemulihan yang ramah alih-alih halaman kosong ketika terjadi error. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, `render${info.componentStack ? ` ${info.componentStack.split('\n')[1]?.trim() ?? ''}` : ''}`, true)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    // Setelah deploy baru, chunk lama bisa hilang; muat ulang biasanya langsung memperbaikinya.
    const isStaleBuild = isChunkLoadError(error)
    return (
      <main className="fullscreen-state">
        <BrandMark size="large" />
        <h1>{isStaleBuild ? 'Versi baru tersedia' : 'Terjadi kendala'}</h1>
        <p>{isStaleBuild
          ? 'ClearFlow baru saja diperbarui. Muat ulang halaman untuk memakai versi terbaru.'
          : 'Catatan Anda tetap aman. Muat ulang halaman untuk melanjutkan.'}</p>
        <button type="button" className="primary-button" onClick={() => window.location.reload()}><RefreshCw size={18} /> Muat ulang</button>
      </main>
    )
  }
}
