import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

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
}

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
}: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (mode === 'reset') return onPasswordReset(email.trim())
    if (mode === 'register') return onEmailRegister(name.trim(), email.trim(), password)
    return onEmailLogin(email.trim(), password)
  }

  const title = mode === 'register' ? 'Buat akun ClearFlow' : mode === 'reset' ? 'Atur ulang kata sandi' : 'Masuk ke ClearFlow.AI'
  const subtitle = mode === 'register'
    ? 'Gunakan satu akun agar catatan dapat dibuka kembali di perangkat lain.'
    : mode === 'reset'
      ? 'Kami akan mengirim tautan pemulihan ke email Anda.'
      : 'Simpan catatan usaha dan lanjutkan dari perangkat mana pun.'
  const canSubmit = mode === 'reset'
    ? email.includes('@')
    : mode === 'register'
      ? name.length >= 2 && email.includes('@') && password.length >= 8 && acceptedTerms
      : email.includes('@') && password.length >= 6

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <header className="auth-brand">
          <span className="brand-mark">C</span>
          <strong>ClearFlow<span>.AI</span></strong>
        </header>

        <div className="auth-copy">
          <h1 id="auth-title">{title}</h1>
          <p>{subtitle}</p>
        </div>

        {error && <div className="form-alert" role="alert">{error}</div>}
        {notice && <div className="form-notice" role="status">{notice}</div>}

        {mode === 'login' && googleEnabled && (
          <>
            <button className="google-button" type="button" onClick={onGoogle} disabled={busy}>
              <span className="google-g" aria-hidden="true">G</span>
              Lanjutkan dengan Google
            </button>
            <div className="auth-divider"><span>atau dengan email</span></div>
          </>
        )}

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label className="form-field">
              <span>Nama Anda</span>
              <span className="input-with-icon"><input autoComplete="name" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Rina" /><ShieldCheck size={18} /></span>
            </label>
          )}

          <label className="form-field">
            <span>Email</span>
            <span className="input-with-icon"><input type="email" autoComplete="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /><Mail size={18} /></span>
          </label>

          {mode !== 'reset' && (
            <label className="form-field">
              <span>Kata sandi</span>
              <span className="input-with-icon">
                <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>
          )}

          {mode === 'login' && <button className="auth-text-button align-right" type="button" onClick={() => setMode('reset')}>Lupa kata sandi?</button>}

          {mode === 'register' && (
            <label className="consent auth-consent">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
              <span>Saya menyetujui <a href="/terms.html" target="_blank" rel="noreferrer">Ketentuan Penggunaan</a> dan sudah membaca <a href="/privacy.html" target="_blank" rel="noreferrer">Kebijakan Privasi</a>.</span>
            </label>
          )}

          <button className="primary-button auth-submit" type="submit" disabled={!canSubmit || busy}>
            {busy ? 'Memproses...' : mode === 'register' ? 'Buat akun' : mode === 'reset' ? 'Kirim tautan pemulihan' : 'Masuk'}
          </button>
        </form>

        {mode === 'login' && <button className="auth-switch" type="button" onClick={() => setMode('register')}>Belum punya akun? <strong>Buat akun</strong></button>}
        {mode !== 'login' && <button className="auth-switch" type="button" onClick={() => setMode('login')}>Kembali ke halaman masuk</button>}

        {mode === 'login' && (
          <button className="guest-button" type="button" onClick={onGuest} disabled={busy}>Coba tanpa akun</button>
        )}

        <div className="auth-trust"><LockKeyhole size={22} /><span>Data setiap usaha dipisahkan dan hanya dapat diakses oleh pemilik akun.</span></div>
      </section>
    </main>
  )
}
