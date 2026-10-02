import { describe, expect, it } from 'vitest'

import {
  amountFromParts,
  firstName,
  formatDayHeading,
  greeting,
  initials,
  inPeriod,
  isValidDateString,
  MAX_AMOUNT,
  parseRupiahInput,
  shiftDate,
  today,
  weekRange,
} from './format'

describe('parseRupiahInput', () => {
  it.each([
    ['1 jt', 1_000_000],
    ['1 juta', 1_000_000],
    ['1,5 jt', 1_500_000],
    ['2.5 juta', 2_500_000],
    ['500 rb', 500_000],
    ['Rp 750 ribu', 750_000],
    ['Rp. 12.500', 12_500],
    ['25k', 25_000],
    ['1.500.000', 1_500_000],
    ['1.500 rb', 1_500_000],
    ['12.500,50', 12_501],
    ['1,500', 1_500],
    ['1.500.', 1_500],
    ['', 0],
    ['abc', 0],
  ])('mengubah %s menjadi %d', (input, expected) => {
    expect(parseRupiahInput(input)).toBe(expected)
  })

  it('membatasi nominal maksimum', () => {
    expect(parseRupiahInput('999999999999999')).toBe(MAX_AMOUNT)
    expect(amountFromParts('500000', 'jt')).toBe(MAX_AMOUNT)
  })
})

describe('tanggal', () => {
  it('menghitung hari ini menurut zona waktu Jakarta', () => {
    // 17:30 UTC = 00:30 WIB keesokan harinya.
    expect(today(new Date('2026-10-01T17:30:00Z'))).toBe('2026-10-02')
    expect(today(new Date('2026-10-01T16:59:00Z'))).toBe('2026-10-01')
  })

  it('menggeser tanggal melewati batas bulan dan tahun', () => {
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('memvalidasi tanggal kalender yang benar', () => {
    expect(isValidDateString('2026-02-28')).toBe(true)
    expect(isValidDateString('2026-02-30')).toBe(false)
    expect(isValidDateString('02-10-2026')).toBe(false)
  })

  it('membentuk minggu Senin sampai Minggu', () => {
    expect(weekRange('2026-10-02')).toEqual({ start: '2026-09-28', end: '2026-10-04' })
    expect(weekRange('2026-10-04')).toEqual({ start: '2026-09-28', end: '2026-10-04' })
    expect(weekRange('2026-09-28')).toEqual({ start: '2026-09-28', end: '2026-10-04' })
  })

  it('memfilter periode minggu, bulan, dan semua waktu', () => {
    const reference = '2026-10-02'
    expect(inPeriod('2026-09-28', 'week', reference)).toBe(true)
    expect(inPeriod('2026-09-27', 'week', reference)).toBe(false)
    expect(inPeriod('2026-10-31', 'month', reference)).toBe(true)
    expect(inPeriod('2026-09-30', 'month', reference)).toBe(false)
    expect(inPeriod('2020-01-01', 'all', reference)).toBe(true)
  })

  it('memberi judul grup tanggal yang ramah', () => {
    expect(formatDayHeading('2026-10-02', '2026-10-02')).toBe('Hari ini')
    expect(formatDayHeading('2026-10-01', '2026-10-02')).toBe('Kemarin')
    expect(formatDayHeading('2026-09-28', '2026-10-02')).toMatch(/Senin, 28 September 2026/)
  })
})

describe('sapaan dan nama', () => {
  it('menyesuaikan salam dengan jam di Jakarta', () => {
    expect(greeting(new Date('2026-10-02T01:00:00Z'))).toBe('Selamat pagi')
    expect(greeting(new Date('2026-10-02T06:00:00Z'))).toBe('Selamat siang')
    expect(greeting(new Date('2026-10-02T09:00:00Z'))).toBe('Selamat sore')
    expect(greeting(new Date('2026-10-02T13:00:00Z'))).toBe('Selamat malam')
  })

  it('mengambil nama depan dan inisial', () => {
    expect(firstName('  Fatimah Azzahra ')).toBe('Fatimah')
    expect(initials('Fatimah Azzahra')).toBe('FA')
    expect(initials('')).toBe('C')
  })
})
