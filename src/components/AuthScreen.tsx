import { useState, type FormEvent } from 'react'
import { CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from 'lucide-react'
import { isInAppBrowser } from '../lib/authErrors'
import BrandMark from './BrandMark'
import GoogleLogo from './GoogleLogo'

type AuthMode = 'login' | 'register' | 'reset'

type Props = {
  busy: boolean
  error: string
  notice: string
  googleEnabled: boolean
  onEmailLogin: (email: string, password: string) => Promise<void>
  onEmailRegister: (name: string, email: string, password: string) => Promise<void>
  onPasswordReset: (email: string) => Promise<void>
  onGoogle: () => Promise<void>
  onGuest: () => Promise<void>
  onModeChange: () => void
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'Catat seperti chat', copy: 'Tulis “jualan 300rb, beli plastik 50rb” dan Gemini menyiapkan draftnya.' },
  { icon: WalletCards, title: 'Uang usaha ≠ uang pribadi', copy: 'Saldo Kas Usaha dan Dana Pribadi dihitung terpisah.' },
  { icon: ShieldCheck, title: 'Anda tetap memegang kendali', copy: 'Tidak ada yang tersimpan sebelum Anda memeriksa dan mengonfirmasi.' },
]

export default function AuthScreen({
  busy,
  error,
  notice,
  googleEnabled,
  onEmailLogin,
  onEmailRegister,
  onPasswordReset,
  onGoogle,
  onGuest,
  onModeChange,
}: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const inAppBrowser = isInAppBrowser()

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setShowPassword(false)
    onModeChange()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || busy) return
    if (mode === 'reset') return onPasswordReset(email.trim())
    if (mode === 'register') return onEmailRegister(name.trim(), email.trim(), password)
    return onEmailLogin(email.trim(), password)
  }

  const title = mode === 'register' ? 'Buat akun ClearFlow' : mode === 'reset' ? 'Atur ulang kata sandi' : 'Masuk ke ClearFlow.AI'
  const subtitle = mode === 'register'
    ? 'Gunakan satu akun agar catatan dapat dibuka kembali di perangkat lain.'
    : mode === 'reset'
      ? 'Kami akan mengirim tautan pemulihan ke email Anda.'
      : 'Pembukuan UMKM yang terasa seperti bercerita. Lanjutkan dari perangkat mana pun.'
  const emailValid = EMAIL_PATTERN.test(email.trim())
  const canSubmit = mode === 'reset'
    ? emailValid
    : mode === 'register'
      ? name.trim().length >= 2 && emailValid && password.length >= 8 && acceptedTerms
      : emailValid && password.length >= 6

  return (
    <main className="auth-shell">
      <aside className="auth-showcase" aria-label="Tentang ClearFlow.AI">
        <BrandMark withName />
        <h2>Pisahkan uang usaha dan pribadi tanpa ribet.</h2>
        <ul>
          {HIGHLIGHTS.map(({ icon: Icon, title: itemTitle, copy }) => (
            <li key={itemTitle}>
              <span aria-hidden="true"><Icon size={19} /></span>
              <div><strong>{itemTitle}</strong><p>{copy}</p></div>
            </li>
          ))}
        </ul>
        <p className="showcase-footnote">Dibangun dengan React, Firebase, dan Gemini melalui Firebase AI Logic.</p>
      </aside>

      <section className="auth-panel" aria-labelledby="auth-title">
        <header className="auth-brand"><BrandMark withName /></header>

        <div className="auth-copy">
          <h1 id="auth-title">{title}</h1>
          <p>{subtitle}</p>
        </div>

        {error && <div className="callout danger" role="alert"><CircleAlert size={17} aria-hidden="true" /><span>{error}</span></div>}
        {notice && <div className="callout success" role="status"><ShieldCheck size={17} aria-hidden="true" /><span>{notice}</span></div>}

        {mode === 'login' && googleEnabled && (
          <>
            <button className="google-button" type="button" onClick={onGoogle} disabled={busy}>
              <GoogleLogo /> Lanjutkan dengan Google
            </button>
            {inAppBrowser && <p className="field-hint center">Login Google bisa diblokir di browser bawaan aplikasi. Jika gagal, buka tautan ini di Chrome atau Safari.</p>}
            <div className="divider"><span>atau dengan email</span></div>
          </>
        )}

        <form className="form-stack auth-form" onSubmit={submit} noValidate>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-name">Nama Anda</label>
              <input id="auth-name" autoComplete="name" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Rina" />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" />
          </div>

          {mode !== 'reset' && (
            <div className="field">
              <div className="label-row">
                <label htmlFor="auth-password">Kata sandi</label>
                {mode === 'login' && <button className="text-button" type="button" onClick={() => switchMode('reset')}>Lupa kata sandi?</button>}
              </div>
              <span className="input-with-action">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'register' ? 'Minimal 8 karakter' : 'Kata sandi Anda'}
                  aria-describedby={mode === 'register' ? 'auth-password-hint' : undefined}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {mode === 'register' && <small id="auth-password-hint" className={`field-hint ${password && password.length < 8 ? 'warn' : ''}`}>Minimal 8 karakter.</small>}
            </div>
          )}

          {mode === 'register' && (
            <label className="consent">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
              <span>Saya menyetujui <a href="/terms.html" target="_blank" rel="noreferrer">Ketentuan Penggunaan</a> dan sudah membaca <a href="/privacy.html" target="_blank" rel="noreferrer">Kebijakan Privasi</a>.</span>
            </label>
          )}

          <button className="primary-button large" type="submit" disabled={!canSubmit || busy}>
            {busy && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
            {busy ? 'Memproses...' : mode === 'register' ? 'Buat akun' : mode === 'reset' ? 'Kirim tautan pemulihan' : 'Masuk'}
          </button>
        </form>

        {mode === 'login'
          ? <button className="link-button" type="button" onClick={() => switchMode('register')}>Belum punya akun? <strong>Buat akun</strong></button>
          : <button className="link-button" type="button" onClick={() => switchMode('login')}>Kembali ke halaman masuk</button>}

        {mode === 'login' && (
          <button className="outline-button" type="button" onClick={onGuest} disabled={busy}>Coba tanpa akun</button>
        )}

        <div className="auth-trust"><LockKeyhole size={20} aria-hidden="true" /><span>Data setiap usaha dipisahkan dan hanya dapat diakses oleh pemilik akun.</span></div>
        <nav className="auth-legal" aria-label="Dokumen hukum"><a href="/privacy.html">Privasi</a><a href="/terms.html">Ketentuan</a></nav>
      </section>
    </main>
  )
}
