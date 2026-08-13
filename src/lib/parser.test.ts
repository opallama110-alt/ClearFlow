import { describe, expect, it } from 'vitest'

import { inferDraftsLocally } from './parser'

describe('inferDraftsLocally', () => {
  it('memahami pemasukan dalam format ribuan', () => {
    const [draft] = inferDraftsLocally('jualan kopi 125rb')

    expect(draft).toMatchObject({
      amount: 125_000,
      flow: 'income',
      category: 'Penjualan',
    })
  })

  it('memahami pengeluaran juta dan dana pribadi', () => {
    const [draft] = inferDraftsLocally('bayar listrik rumah 1,5 juta')

    expect(draft).toMatchObject({
      amount: 1_500_000,
      flow: 'expense',
      fund: 'personal',
      category: 'Pribadi',
    })
  })

  it('memecah beberapa transaksi pada baris terpisah', () => {
    const drafts = inferDraftsLocally('jualan 50 ribu\nbeli bahan 20 ribu')

    expect(drafts).toHaveLength(2)
    expect(drafts.map((draft) => draft.amount)).toEqual([50_000, 20_000])
  })

  it('mengabaikan kalimat tanpa nominal', () => {
    expect(inferDraftsLocally('hari ini toko ramai')).toEqual([])
  })
})
