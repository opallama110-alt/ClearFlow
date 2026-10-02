import type { PeriodFilter } from '../types'

export const MAX_AMOUNT = 100_000_000_000
export const APP_TIMEZONE = 'Asia/Jakarta'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Tanggal hari ini (YYYY-MM-DD) menurut zona waktu Asia/Jakarta. */
export const today = (now = new Date()) => isoDateFormatter.format(now)

/** Menggeser tanggal ISO sejumlah hari tanpa terpengaruh zona waktu perangkat. */
export const shiftDate = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const plainNumberFormatter = new Intl.NumberFormat('id-ID')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dayHeadingFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export const formatCurrency = (amount: number) => currencyFormatter.format(amount)

/** Rupiah ringkas untuk ruang sempit, misalnya "Rp 450 rb" atau "Rp 1,3 jt". */
export const formatCompactCurrency = (amount: number) => `Rp\u00a0${compactFormatter.format(amount)}`

export const formatDate = (date: string) => dateFormatter.format(new Date(`${date}T00:00:00Z`))

/** Judul grup riwayat, misalnya "Hari ini", "Kemarin", atau "Senin, 29 September 2026". */
export const formatDayHeading = (date: string, reference = today()) => {
  if (date === reference) return 'Hari ini'
  if (date === shiftDate(reference, -1)) return 'Kemarin'
  return dayHeadingFormatter.format(new Date(`${date}T00:00:00Z`))
}

const unitMultiplier = (unit = '') => {
  const normalized = unit.toLowerCase()
  if (normalized === 'juta' || normalized === 'jt') return 1_000_000
  if (normalized === 'ribu' || normalized === 'rb' || normalized === 'k') return 1_000
  return 1
}

const clampAmount = (amount: number) =>
  Number.isFinite(amount) && amount > 0 ? Math.min(Math.round(amount), MAX_AMOUNT) : 0

/**
 * Mengubah angka bergaya Indonesia beserta satuannya menjadi rupiah.
 * Titik dipakai sebagai pemisah ribuan ("1.500.000"), koma sebagai desimal ("1,5 jt").
 */
export const amountFromParts = (numberText: string, unit = '') => {
  const multiplier = unitMultiplier(unit)
  const text = numberText.replace(/[.,]+$/, '')
  if (!text) return 0

  if (multiplier === 1) {
    const decimalComma = text.match(/^([\d.]+),(\d{1,2})$/)
    if (decimalComma) return clampAmount(Number(`${decimalComma[1].replace(/\./g, '')}.${decimalComma[2]}`))
    return clampAmount(Number(text.replace(/[.,]/g, '')))
  }

  if (/^\d{1,3}(?:\.\d{3})+$/.test(text)) return clampAmount(Number(text.replace(/\./g, '')) * multiplier)
  return clampAmount(Number(text.replace(',', '.')) * multiplier)
}

export const parseRupiahInput = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/^rp\.?\s*/, '')
  const match = normalized.match(/^(\d[\d.,]*)\s*(juta|jt|ribu|rb|k)?$/)
  if (match) return amountFromParts(match[1], match[2])

  const digits = value.replace(/\D/g, '')
  return digits ? clampAmount(Number(digits)) : 0
}

export const formatRupiahInput = (amount: number) => (amount ? plainNumberFormatter.format(amount) : '')

export const isValidDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** Rentang Senin–Minggu yang memuat tanggal acuan. */
export const weekRange = (reference = today()) => {
  const dayOfWeek = new Date(`${reference}T00:00:00Z`).getUTCDay() || 7
  const start = shiftDate(reference, 1 - dayOfWeek)
  return { start, end: shiftDate(start, 6) }
}

export const inPeriod = (date: string, period: PeriodFilter, reference = today()) => {
  if (period === 'all') return true
  if (period === 'month') return date.slice(0, 7) === reference.slice(0, 7)
  const { start, end } = weekRange(reference)
  return date >= start && date <= end
}

export const periodLabel = (period: PeriodFilter) =>
  period === 'week' ? 'Minggu ini' : period === 'month' ? 'Bulan ini' : 'Semua waktu'

export const greeting = (now = new Date()) => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: APP_TIMEZONE }).format(now))
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? ''

export const initials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'C'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
