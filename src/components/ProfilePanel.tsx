import { useEffect, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { BookOpen, LogOut, MailCheck, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { BUSINESS_TYPES, type BusinessProfile, type BusinessProfileInput, type BusinessType } from '../types'

type Props = {
  user: User
  profile: BusinessProfile
  busy: boolean
  googleEnabled: boolean
  onClose: () => void
  onSave: (value: BusinessProfileInput) => Promise<void>
  onSignOut: () => Promise<void>
  onSendVerification: () => Promise<void>
  onUpgradeEmail: (name: string, email: string, password: string) => Promise<void>
  onUpgradeGoogle: () => Promise<void>
  onOpenTour: () => void
  onDeleteAccount: () => Promise<void>
}

export default function ProfilePanel({
  user,
  profile,
  busy,
  googleEnabled,
  onClose,
  onSave,
  onSignOut,
  onSendVerification,
  onUpgradeEmail,
  onUpgradeGoogle,
  onOpenTour,
  onDeleteAccount,
}: Props) {
  const [form, setForm] = useState<BusinessProfileInput>(profile)
  const [upgradeName, setUpgradeName] = useState(profile.ownerName)
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')

  useEffect(() => setForm(profile), [profile])
  const update = <K extends keyof BusinessProfileInput>(key: K, value: BusinessProfileInput[K]) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSave(form)
  }

  return (
    <div className="modal-backdrop profile-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <header className="modal-header sticky"><div><h2 id="profile-title">Profil dan pengaturan</h2><p>Kelola usaha, saldo awal, dan akun.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup profil"><X size={19} /></button></header>

        <form className="profile-section modal-form" onSubmit={submit}>
          <h3>Data usaha</h3>
          <label className="form-field"><span>Nama pemilik</span><input maxLength={60} value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} /></label>
          <label className="form-field"><span>Nama usaha</span><input maxLength={80} value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <div className="two-fields">
            <label className="form-field"><span>Jenis usaha</span><select value={form.businessType} onChange={(event) => update('businessType', event.target.value as BusinessType)}>{BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="form-field"><span>Kota / kabupaten</span><input maxLength={80} value={form.city} onChange={(event) => update('city', event.target.value)} /></label>
          </div>
          <label className="form-field"><span>Mulai mencatat sejak</span><input type="date" value={form.bookkeepingStartDate} onChange={(event) => update('bookkeepingStartDate', event.target.value)} /></label>
          <label className="consent"><input type="checkbox" checked={form.aiProcessingConsent} onChange={(event) => update('aiProcessingConsent', event.target.checked)} /><span>Izinkan teks transaksi diproses oleh Firebase AI Logic. Jika dimatikan, gunakan pencatatan manual.</span></label>
          <button className="primary-button" type="submit" disabled={busy || form.name.trim().length < 2 || form.ownerName.trim().length < 2}>{busy ? 'Menyimpan...' : 'Simpan profil usaha'}</button>
        </form>

        <section className="profile-section account-section">
          <h3>Akun</h3>
          <div className="account-card"><span className="account-icon"><UserRound size={20} /></span><div><strong>{user.isAnonymous ? 'Akun tamu' : user.displayName || profile.ownerName}</strong><small>{user.email || 'Belum terhubung ke email'}</small></div><span className={user.isAnonymous ? 'account-status guest' : 'account-status'}>{user.isAnonymous ? 'Sementara' : 'Tersimpan'}</span></div>

          {user.isAnonymous ? (
            <div className="upgrade-box">
              <div className="upgrade-copy"><ShieldCheck size={21} /><div><strong>Amankan catatan Anda</strong><p>Hubungkan akun agar data dapat dibuka dari perangkat lain.</p></div></div>
              {googleEnabled && <button className="google-button compact" type="button" onClick={onUpgradeGoogle} disabled={busy}><span className="google-g">G</span> Hubungkan Google</button>}
              <div className="auth-divider"><span>atau gunakan email</span></div>
              <label className="form-field"><span>Nama</span><input maxLength={60} value={upgradeName} onChange={(event) => setUpgradeName(event.target.value)} /></label>
              <label className="form-field"><span>Email</span><input type="email" autoComplete="email" maxLength={120} value={upgradeEmail} onChange={(event) => setUpgradeEmail(event.target.value)} /></label>
              <label className="form-field"><span>Kata sandi baru</span><input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={upgradePassword} onChange={(event) => setUpgradePassword(event.target.value)} /></label>
              <button className="secondary-button" type="button" onClick={() => onUpgradeEmail(upgradeName.trim(), upgradeEmail.trim(), upgradePassword)} disabled={busy || upgradeName.trim().length < 2 || !upgradeEmail.includes('@') || upgradePassword.length < 8}>Hubungkan email</button>
            </div>
          ) : (
            <>
              {user.email && !user.emailVerified && <button className="secondary-button" type="button" onClick={onSendVerification} disabled={busy}><MailCheck size={17} /> Kirim ulang verifikasi email</button>}
              <button className="secondary-button" type="button" onClick={onSignOut} disabled={busy}><LogOut size={17} /> Keluar dari akun</button>
            </>
          )}
        </section>

        <section className="profile-section guide-section">
          <h3>Bantuan</h3>
          <p>Buka lagi pengenalan singkat tentang cara mencatat, memeriksa draft AI, dan mengelola riwayat.</p>
          <button className="secondary-button" type="button" onClick={onOpenTour}><BookOpen size={17} /> Lihat panduan penggunaan</button>
        </section>

        <section className="profile-section danger-section">
          <h3>Zona berbahaya</h3>
          <p>Menghapus akun akan menghapus profil usaha dan seluruh transaksi. Unduh CSV lebih dahulu jika perlu.</p>
          <button className="danger-button" type="button" onClick={onDeleteAccount} disabled={busy}><Trash2 size={17} /> Hapus akun dan semua data</button>
        </section>

        <footer className="profile-footer"><a href="/privacy.html" target="_blank" rel="noreferrer">Privasi</a><a href="/terms.html" target="_blank" rel="noreferrer">Ketentuan</a><span>Versi pilot 2.0</span></footer>
      </section>
    </div>
  )
}
