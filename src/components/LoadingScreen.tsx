import BrandMark from './BrandMark'

export default function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="loading-shell" aria-busy="true">
      <BrandMark size="large" />
      <div className="loading-line" aria-hidden="true" />
      <p role="status">{label}</p>
    </main>
  )
}
