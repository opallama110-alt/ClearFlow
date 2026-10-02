import { useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { BookOpen, Download, LoaderCircle, LogOut, MailCheck, Monitor, Moon, ShieldCheck, Sun, Trash2, UserRound, X } from 'lucide-react'
import type { ThemePreference } from '../hooks/useTheme'
import { BUSINESS_TYPES, type BusinessProfile, type BusinessProfileInput, type BusinessType } from '../types'
import GoogleLogo from './GoogleLogo'
import Modal from './Modal'

type Props = {
  user: User
  profile: BusinessProfile
  busy: boolean
  googleEnabled: boolean
  theme: ThemePreference
  canInstall: boolean
  onClose: () => void
  onSave: (value: BusinessProfileInput) => Promise<void>
  onSignOut: () => Promise<void>
  onSendVerification: () => Promise<void>
  onUpgradeEmail: (name: string, email: string, password: string) => Promise<void>
  onUpgradeGoogle: () => Promise<void>
  onOpenTour: () => void
  onDeleteAccount: () => Promise<void>
  onThemeChange: (theme: ThemePreference) => void
  onInstall: () => void
}

const THEMES: Array<[ThemePreference, string, typeof Sun]> = [
  ['system', 'Sistem', Monitor],
  ['light', 'Terang', Sun],
  ['dark', 'Gelap', Moon],
]

export default function ProfilePanel({
  user,
  profile,
  busy,
  googleEnabled,
  theme,
  canInstall,
  onClose,
  onSave,
  onSignOut,
  onSendVerification,
  onUpgradeEmail,
  onUpgradeGoogle,
  onOpenTour,
  onDeleteAccount,
  onThemeChange,
  onInstall,
}: Props) {
  // Formulir disalin sekali saat panel dibuka agar ketikan tidak tertimpa sinkronisasi realtime.
  const [form, setForm] = useState<BusinessProfileInput>(profile)
  const [upgradeName, setUpgradeName] = useState(profile.ownerName)
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')
  const update = <K extends keyof BusinessProfileInput>(key: K, value: BusinessProfileInput[K]) => setForm((current) => ({ ...current, [key]: value }))

  const profileValid = form.ownerName.trim().length >= 2 && form.name.trim().length >= 2 && form.city.trim().length >= 2
  const upgradeValid = upgradeName.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(upgradeEmail.trim()) && upgradePassword.length >= 8

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (profileValid) await onSave(form)
  }

  return (
    <Modal labelledBy="profile-title" onClose={onClose} className="profile-modal">
      <header className="modal-header sticky">
        <div><h2 id="profile-title">Profil dan pengaturan</h2><p>Kelola usaha, tampilan, dan akun.</p></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup profil"><X size={19} /></button>
      </header>

      <form className="profile-section form-stack" onSubmit={submit}>
        <h3>Data usaha</h3>
        <div className="field">
          <label htmlFor="profile-owner">Nama pemilik</label>
          <input id="profile-owner" autoComplete="name" maxLength={60} value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="profile-name">Nama usaha</label>
          <input id="profile-name" maxLength={80} value={form.name} onChange={(event) => update('name', event.target.value)} />
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="profile-type">Jenis usaha</label>
            <select id="profile-type" value={form.businessType} onChange={(event) => update('businessType', event.target.value as BusinessType)}>{BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="profile-city">Kota / kabupaten</label>
            <input id="profile-city" maxLength={80} value={form.city} onChange={(event) => update('city', event.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="profile-start">Mulai mencatat sejak</label>
          <input id="profile-start" type="date" value={form.bookkeepingStartDate} onChange={(event) => update('bookkeepingStartDate', event.target.value)} />
        </div>
        <label className="consent">
          <input type="checkbox" checked={form.aiProcessingConsent} onChange={(event) => update('aiProcessingConsent', event.target.checked)} />
          <span>Izinkan teks transaksi diproses oleh Firebase AI Logic (Gemini) untuk menyiapkan draft. Jika dimatikan, gunakan pencatatan manual.</span>
        </label>
        {!profileValid && <small className="field-error">Nama pemilik, nama usaha, dan kota minimal 2 karakter.</small>}
        <button className="primary-button" type="submit" disabled={busy || !profileValid}>
          {busy && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
          {busy ? 'Menyimpan...' : 'Simpan profil usaha'}
        </button>
      </form>

      <section className="profile-section">
        <h3>Tampilan</h3>
        <div className="segmented theme-switch" role="group" aria-label="Tema tampilan">
          {THEMES.map(([value, label, Icon]) => (
            <button type="button" key={value} aria-pressed={theme === value} className={theme === value ? 'active' : ''} onClick={() => onThemeChange(value)}>
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h3>Akun</h3>
        <div className="account-card">
          <span className="account-icon" aria-hidden="true"><UserRound size={20} /></span>
          <div>
            <strong>{user.isAnonymous ? 'Akun tamu' : user.displayName || profile.ownerName}</strong>
            <small>{user.email || 'Belum terhubung ke email'}</small>
          </div>
          <span className={user.isAnonymous ? 'status-badge review' : 'status-badge ok'}>{user.isAnonymous ? 'Sementara' : user.emailVerified || !user.email ? 'Tersimpan' : 'Belum verifikasi'}</span>
        </div>

        {user.isAnonymous ? (
          <div className="upgrade-box">
            <div className="upgrade-copy">
              <ShieldCheck size={21} aria-hidden="true" />
              <div><strong>Amankan catatan Anda</strong><p>Hubungkan akun agar data tidak hilang saat browser dibersihkan dan bisa dibuka dari perangkat lain.</p></div>
            </div>
            {googleEnabled && (
              <button className="google-button" type="button" onClick={onUpgradeGoogle} disabled={busy}>
                <GoogleLogo /> Hubungkan Google
              </button>
            )}
            <div className="divider"><span>atau gunakan email</span></div>
            <div className="form-stack">
              <div className="field">
                <label htmlFor="upgrade-name">Nama</label>
                <input id="upgrade-name" autoComplete="name" maxLength={60} value={upgradeName} onChange={(event) => setUpgradeName(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="upgrade-email">Email</label>
                <input id="upgrade-email" type="email" autoComplete="email" maxLength={120} value={upgradeEmail} onChange={(event) => setUpgradeEmail(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="upgrade-password">Kata sandi baru</label>
                <input id="upgrade-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={upgradePassword} onChange={(event) => setUpgradePassword(event.target.value)} aria-describedby="upgrade-password-hint" />
                <small id="upgrade-password-hint" className="field-hint">Minimal 8 karakter.</small>
              </div>
              <button className="secondary-button" type="button" onClick={() => onUpgradeEmail(upgradeName.trim(), upgradeEmail.trim(), upgradePassword)} disabled={busy || !upgradeValid}>Hubungkan email</button>
            </div>
          </div>
        ) : (
          <div className="button-stack">
            {user.email && !user.emailVerified && <button className="secondary-button" type="button" onClick={onSendVerification} disabled={busy}><MailCheck size={17} aria-hidden="true" /> Kirim ulang verifikasi email</button>}
            <button className="secondary-button" type="button" onClick={onSignOut} disabled={busy}><LogOut size={17} aria-hidden="true" /> Keluar dari akun</button>
          </div>
        )}
      </section>

      <section className="profile-section">
        <h3>Bantuan</h3>
        <p className="section-copy">Buka lagi pengenalan singkat tentang cara mencatat, memeriksa draft AI, dan mengelola riwayat.</p>
        <div className="button-stack">
          <button className="secondary-button" type="button" onClick={onOpenTour}><BookOpen size={17} aria-hidden="true" /> Lihat panduan penggunaan</button>
          {canInstall && <button className="secondary-button" type="button" onClick={onInstall}><Download size={17} aria-hidden="true" /> Pasang ClearFlow di perangkat</button>}
        </div>
      </section>

      <section className="profile-section danger-section">
        <h3>Zona berbahaya</h3>
        <p className="section-copy">Menghapus akun akan menghapus profil usaha dan seluruh transaksi secara permanen. Unduh CSV lebih dahulu jika perlu.</p>
        <button className="danger-button" type="button" onClick={onDeleteAccount} disabled={busy}><Trash2 size={17} aria-hidden="true" /> Hapus akun dan semua data</button>
      </section>

      <footer className="profile-footer">
        <a href="/privacy.html" target="_blank" rel="noreferrer">Privasi</a>
        <a href="/terms.html" target="_blank" rel="noreferrer">Ketentuan</a>
        <span>Versi {__APP_VERSION__}</span>
      </footer>
    </Modal>
  )
}
