import type { ReactNode } from 'react'
import { CalendarDays, ChevronDown, WalletCards } from 'lucide-react'
import type { ConfirmedFund, PeriodFilter } from '../types'

export function PeriodSelect({ value, onChange }: { value: PeriodFilter; onChange: (period: PeriodFilter) => void }) {
  return (
    <label className="period-select">
      <CalendarDays size={16} aria-hidden="true" />
      <select aria-label="Pilih periode" value={value} onChange={(event) => onChange(event.target.value as PeriodFilter)}>
        <option value="week">Minggu ini</option>
        <option value="month">Bulan ini</option>
        <option value="all">Semua waktu</option>
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  )
}

export function PersonalIcon() {
  return <span className="personal-icon" aria-hidden="true">P</span>
}

/** Pemilih Kas Usaha / Dana Pribadi. Memakai tombol bertekanan (aria-pressed), bukan tab palsu. */
export function FundSwitch({ value, onChange, label }: { value: ConfirmedFund; onChange: (fund: ConfirmedFund) => void; label: string }) {
  return (
    <div className="segmented fund-switch" role="group" aria-label={label}>
      <button type="button" aria-pressed={value === 'business'} className={value === 'business' ? 'active' : ''} onClick={() => onChange('business')}>
        <WalletCards size={17} aria-hidden="true" /> Kas Usaha
      </button>
      <button type="button" aria-pressed={value === 'personal'} className={value === 'personal' ? 'active personal' : ''} onClick={() => onChange('personal')}>
        <PersonalIcon /> Dana Pribadi
      </button>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
