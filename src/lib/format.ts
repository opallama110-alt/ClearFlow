import type { PeriodFilter } from '../types'

export const today = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatCompact = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount)

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00+07:00`))

export const parseRupiahInput = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/^rp\.?\s*/, '')
  const shorthand = normalized.match(/^(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb|k)$/)
  if (shorthand) {
    const amount = Number(shorthand[1].replace(',', '.'))
    const multiplier = /^(juta|jt)$/.test(shorthand[2]) ? 1_000_000 : 1_000
    if (Number.isFinite(amount)) return Math.min(Math.round(amount * multiplier), 100_000_000_000)
  }

  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Math.min(Number(digits), 100_000_000_000)
}

export const formatRupiahInput = (amount: number) =>
  amount ? new Intl.NumberFormat('id-ID').format(amount) : ''

export const isValidDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00+07:00`)
  return Number.isFinite(date.getTime())
}

export const inPeriod = (date: string, period: PeriodFilter, reference = today()) => {
  if (period === 'all') return true
  if (period === 'month') return date.slice(0, 7) === reference.slice(0, 7)

  const referenceDate = new Date(`${reference}T12:00:00+07:00`)
  const day = referenceDate.getDay() || 7
  const weekStart = new Date(referenceDate)
  weekStart.setDate(referenceDate.getDate() - day + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  const candidate = new Date(`${date}T12:00:00+07:00`)
  return candidate >= weekStart && candidate < weekEnd
}

export const periodLabel = (period: PeriodFilter) =>
  period === 'week' ? 'Minggu ini' : period === 'month' ? 'Bulan ini' : 'Semua waktu'

export const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
