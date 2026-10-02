import { useState, type FormEvent } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { BUSINESS_TYPES, type BusinessProfileInput, type BusinessType } from '../types'
import BrandMark from './BrandMark'

type Props = {
  initialValue: BusinessProfileInput
  busy: boolean
  onFinish: (value: BusinessProfileInput) => Promise<void>
  onExit: () => void
}

type Field = 'ownerName' | 'name' | 'city'

const LABELS: Record<Field, string> = { ownerName: 'Nama pemilik', name: 'Nama usaha', city: 'Kota / kabupaten' }

export default function BusinessSetup({ initialValue, busy, onFinish, onExit }: Props) {
  const [value, setValue] = useState(initialValue)
  const [touched, setTouched] = useState(false)

  const update = <K extends keyof BusinessProfileInput>(key: K, next: BusinessProfileInput[K]) => {
    setValue((current) => ({ ...current, [key]: next }))
  }

  const errors = (['ownerName', 'name', 'city'] as const).reduce<Partial<Record<Field, string>>>((result, field) => {
    if (value[field].trim().length < 2) result[field] = `${LABELS[field]} minimal 2 karakter.`
    return result
  }, {})
  const canFinish = Object.keys(errors).length === 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!canFinish) {
      const firstInvalid = Object.keys(errors)[0]
      document.getElementById(`setup-${firstInvalid}`)?.focus()
      return
    }
    await onFinish({ ...value, openingBusinessBalance: 0, openingPersonalBalance: 0, onboardingCompleted: true })
  }

  const fieldProps = (field: Field) => ({
    id: `setup-${field}`,
    'aria-invalid': touched && Boolean(errors[field]),
    'aria-describedby': touched && errors[field] ? `setup-${field}-error` : undefined,
  })
  const fieldError = (field: Field) => touched && errors[field]
    ? <small className="field-error" id={`setup-${field}-error`}>{errors[field]}</small>
    : null

  return (
    <main className="setup-shell">
      <section className="setup-panel" aria-labelledby="setup-title">
        <header className="auth-brand"><BrandMark withName /></header>

        <form onSubmit={submit} noValidate>
          <div className="auth-copy">
            <p className="eyebrow">Satu langkah lagi</p>
            <h1 id="setup-title">Kenali usaha Anda</h1>
            <p>Isi singkat saja. Setelah ini Anda langsung dapat mencoba mencatat transaksi pertama.</p>
          </div>
          <div className="form-stack setup-fields">
            <div className="field">
              <label htmlFor="setup-ownerName">Nama pemilik</label>
              <input {...fieldProps('ownerName')} autoComplete="name" maxLength={60} value={value.ownerName} onChange={(event) => update('ownerName', event.target.value)} placeholder="Contoh: Rina" />
              {fieldError('ownerName')}
            </div>
            <div className="field">
              <label htmlFor="setup-name">Nama usaha</label>
              <input {...fieldProps('name')} autoComplete="organization" maxLength={80} value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Contoh: Toko Rina" />
              {fieldError('name')}
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="setup-type">Jenis usaha</label>
                <select id="setup-type" value={value.businessType} onChange={(event) => update('businessType', event.target.value as BusinessType)}>
                  {BUSINESS_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="setup-city">Kota / kabupaten</label>
                <input {...fieldProps('city')} autoComplete="address-level2" maxLength={80} value={value.city} onChange={(event) => update('city', event.target.value)} placeholder="Contoh: Kota Cirebon" />
                {fieldError('city')}
              </div>
            </div>
            <label className="consent highlighted">
              <input type="checkbox" checked={value.aiProcessingConsent} onChange={(event) => update('aiProcessingConsent', event.target.checked)} />
              <span><strong>Aktifkan pencatatan dengan cerita (opsional)</strong>Izinkan cerita transaksi diproses oleh Firebase AI Logic untuk menyiapkan draft. Tanpa izin ini, Anda tetap dapat mencatat dengan formulir manual.</span>
            </label>
          </div>
          <button className="primary-button large setup-primary" type="submit" disabled={busy}>
            {busy && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
            {busy ? 'Menyiapkan usaha...' : 'Masuk ke aplikasi'}
          </button>
          <button className="link-button" type="button" onClick={onExit} disabled={busy}>Keluar</button>
          <div className="auth-trust"><ShieldCheck size={20} aria-hidden="true" /><span>Saldo dimulai dari Rp0. Modal awal dicatat sebagai transaksi pertama.</span></div>
        </form>
      </section>
    </main>
  )
}
