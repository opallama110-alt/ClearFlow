import { useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { BUSINESS_TYPES, type BusinessProfileInput, type BusinessType } from '../types'

type Props = {
  initialValue: BusinessProfileInput
  busy: boolean
  onFinish: (value: BusinessProfileInput) => Promise<void>
  onExit: () => Promise<void>
}

export default function BusinessSetup({ initialValue, busy, onFinish, onExit }: Props) {
  const [value, setValue] = useState(initialValue)
  const [touched, setTouched] = useState(false)

  const update = <K extends keyof BusinessProfileInput>(key: K, next: BusinessProfileInput[K]) => {
    setValue((current) => ({ ...current, [key]: next }))
  }

  const canFinish = value.ownerName.trim().length >= 2
    && value.name.trim().length >= 2
    && value.city.trim().length >= 2
    && Boolean(value.businessType)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (canFinish) await onFinish({
      ...value,
      openingBusinessBalance: 0,
      openingPersonalBalance: 0,
      onboardingCompleted: true,
    })
  }

  return (
    <main className="setup-shell">
      <section className="setup-panel" aria-labelledby="setup-title">
        <header className="setup-brand"><span className="brand-mark">C</span><strong>ClearFlow<span>.AI</span></strong></header>

        <form onSubmit={submit}>
          <div className="setup-heading"><h1 id="setup-title">Kenali usaha Anda</h1><p>Isi singkat saja. Setelah ini Anda langsung dapat mencoba mencatat transaksi pertama.</p></div>
          <div className="setup-fields">
            <label className="form-field"><span>Nama pemilik</span><input autoComplete="name" maxLength={60} value={value.ownerName} onChange={(event) => update('ownerName', event.target.value)} placeholder="Contoh: Rina" /></label>
            <label className="form-field"><span>Nama usaha</span><input maxLength={80} value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Contoh: Toko Rina" /></label>
            <label className="form-field"><span>Jenis usaha</span><select value={value.businessType} onChange={(event) => update('businessType', event.target.value as BusinessType)}>{BUSINESS_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
            <label className="form-field"><span>Kota / kabupaten</span><input maxLength={80} value={value.city} onChange={(event) => update('city', event.target.value)} placeholder="Contoh: Kota Cirebon" /></label>
            <label className="consent setup-consent"><input type="checkbox" checked={value.aiProcessingConsent} onChange={(event) => update('aiProcessingConsent', event.target.checked)} /><span>Opsional: izinkan cerita transaksi diproses oleh Firebase AI Logic untuk menyiapkan draft.</span></label>
            {!value.aiProcessingConsent && <small className="setup-ai-note">Tanpa izin ini, Anda tetap dapat mencatat dengan form manual.</small>}
          </div>
          {touched && !canFinish && <div className="inline-error" role="alert">Lengkapi data usaha terlebih dahulu.</div>}
          <button className="primary-button setup-primary" type="submit" disabled={busy}>{busy ? 'Menyiapkan usaha...' : 'Masuk ke aplikasi'}</button>
          <button className="auth-text-button setup-exit" type="button" onClick={onExit} disabled={busy}>Keluar</button>
          <div className="setup-note"><ShieldCheck size={20} /><span>Saldo dimulai dari Rp 0. Modal awal dicatat sebagai transaksi pertama.</span></div>
        </form>
      </section>
    </main>
  )
}
