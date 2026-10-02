import { describe, expect, it } from 'vitest'

import type { Transaction } from '../types'
import { expenseByCategory, fundTotalsFor, groupByDate, sortNewestFirst, summarizeFund } from './summary'

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  date: '2026-10-02',
  description: 'Transaksi',
  amount: 10_000,
  flow: 'income',
  fund: 'business',
  category: 'Penjualan',
  status: 'confirmed',
  source: 'Manual',
  ...overrides,
})

const REFERENCE = '2026-10-02'

const sample = [
  transaction({ amount: 300_000, date: '2026-10-02' }),
  transaction({ amount: 50_000, flow: 'expense', category: 'Bahan Baku', date: '2026-10-01' }),
  transaction({ amount: 20_000, flow: 'expense', category: 'Transportasi', date: '2026-09-15' }),
  transaction({ amount: 75_000, flow: 'expense', category: 'Bahan Baku', date: '2026-09-29' }),
  transaction({ amount: 99_000, fund: 'personal', flow: 'expense', category: 'Pribadi' }),
  transaction({ amount: 1_000_000, status: 'needs-review' }),
]

describe('summarizeFund', () => {
  it('menghitung saldo sepanjang waktu dan arus kas periode', () => {
    const summary = summarizeFund({ transactions: sample, fund: 'business', period: 'month', openingBalance: 100_000, reference: REFERENCE })

    expect(summary.balance).toBe(100_000 + 300_000 - 50_000 - 20_000 - 75_000)
    expect(summary.periodIncome).toBe(300_000)
    expect(summary.periodExpense).toBe(50_000)
    expect(summary.net).toBe(250_000)
    expect(summary.incomeShare).toBeCloseTo(300 / 350)
  })

  it('memakai total server ketika data lokal belum lengkap', () => {
    const summary = summarizeFund({
      transactions: sample,
      fund: 'business',
      period: 'all',
      openingBalance: 0,
      allTime: { income: 5_000_000, expense: 1_000_000 },
      reference: REFERENCE,
    })

    expect(summary.balance).toBe(4_000_000)
    expect(summary.periodIncome).toBe(5_000_000)
  })

  it('mengembalikan porsi null ketika belum ada arus kas', () => {
    expect(summarizeFund({ transactions: [], fund: 'personal', period: 'week', openingBalance: 0 }).incomeShare).toBeNull()
  })

  it('mengabaikan transaksi yang masih perlu ditinjau', () => {
    expect(fundTotalsFor(sample).business.income).toBe(300_000)
  })
})

describe('expenseByCategory', () => {
  it('mengurutkan kategori pengeluaran terbesar dalam periode', () => {
    const shares = expenseByCategory(sample, 'business', 'week', REFERENCE)

    expect(shares.map((share) => share.category)).toEqual(['Bahan Baku'])
    expect(shares[0]).toMatchObject({ amount: 125_000, share: 1 })
  })

  it('menghitung porsi setiap kategori', () => {
    const shares = expenseByCategory(sample, 'business', 'all', REFERENCE)
    expect(shares.map((share) => [share.category, Math.round(share.share * 100)])).toEqual([
      ['Bahan Baku', 86],
      ['Transportasi', 14],
    ])
  })
})

describe('sortNewestFirst', () => {
  it('mengurutkan tanggal terbaru lalu waktu dibuat terbaru', () => {
    const sorted = sortNewestFirst([
      transaction({ id: 'a', date: '2026-10-01', createdAtMs: 3 }),
      transaction({ id: 'b', date: '2026-10-02', createdAtMs: 1 }),
      transaction({ id: 'c', date: '2026-10-02', createdAtMs: 2 }),
    ])
    expect(sorted.map((item) => item.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('groupByDate', () => {
  it('mengelompokkan transaksi per tanggal dengan selisih harian', () => {
    const groups = groupByDate(sortNewestFirst(sample.filter((item) => item.fund === 'business')))

    expect(groups.map((group) => group.date)).toEqual(['2026-10-02', '2026-10-01', '2026-09-29', '2026-09-15'])
    expect(groups[0].net).toBe(300_000)
    expect(groups[1].net).toBe(-50_000)
  })
})
