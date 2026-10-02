import { describe, expect, it } from 'vitest'

import { inferDraftsLocally, validateModelDrafts } from './parser'

const REFERENCE = '2026-10-02'

describe('inferDraftsLocally', () => {
  it('memahami pemasukan dalam format ribuan', () => {
    const [draft] = inferDraftsLocally('jualan kopi 125rb', REFERENCE)

    expect(draft).toMatchObject({
      amount: 125_000,
      flow: 'income',
      fund: 'business',
      category: 'Penjualan',
      date: REFERENCE,
      source: 'Parser',
    })
  })

  it('memahami pengeluaran juta dan dana pribadi', () => {
    const [draft] = inferDraftsLocally('bayar listrik rumah 1,5 juta', REFERENCE)

    expect(draft).toMatchObject({
      amount: 1_500_000,
      flow: 'expense',
      fund: 'personal',
    })
  })

  it('membaca nominal dengan pemisah ribuan titik', () => {
    const [draft] = inferDraftsLocally('jualan nasi box 1.500.000', REFERENCE)
    expect(draft.amount).toBe(1_500_000)
  })

  it('memilih nominal bersatuan, bukan jumlah barang', () => {
    const [draft] = inferDraftsLocally('beli 2 bungkus plastik 50rb', REFERENCE)
    expect(draft).toMatchObject({ amount: 50_000, category: 'Bahan Baku', description: 'Plastik kemasan' })
  })

  it('mengenali bahan pangan sebagai bahan baku', () => {
    expect(inferDraftsLocally('beli beras 180rb pakai kas usaha', REFERENCE)[0].category).toBe('Bahan Baku')
  })

  it('memilih angka terbesar bila tidak ada satuan', () => {
    const [draft] = inferDraftsLocally('jualan 3 porsi 45000', REFERENCE)
    expect(draft.amount).toBe(45_000)
  })

  it('tidak salah membaca satuan berat sebagai ribuan', () => {
    const [draft] = inferDraftsLocally('beli gula 5kg 70rb', REFERENCE)
    expect(draft.amount).toBe(70_000)
  })

  it('memecah beberapa transaksi pada baris terpisah', () => {
    const drafts = inferDraftsLocally('jualan 50 ribu\nbeli bahan 20 ribu', REFERENCE)

    expect(drafts).toHaveLength(2)
    expect(drafts.map((draft) => draft.amount)).toEqual([50_000, 20_000])
  })

  it('memecah cerita dengan kata "lalu" dan mengutamakan sumber dana eksplisit', () => {
    const drafts = inferDraftsLocally('Jualan 300rb, lalu beli bahan 1 jt pakai uang pribadi di toko', REFERENCE)

    expect(drafts).toHaveLength(2)
    expect(drafts[0]).toMatchObject({ amount: 300_000, flow: 'income', fund: 'business' })
    expect(drafts[1]).toMatchObject({ amount: 1_000_000, flow: 'expense', fund: 'personal', category: 'Bahan Baku' })
  })

  it('memisahkan kalimat yang diakhiri titik tanpa merusak titik ribuan', () => {
    const drafts = inferDraftsLocally('Modal awal 1.500.000 masuk kas usaha. Jualan 450rb, dan es teh 5rb', REFERENCE)

    expect(drafts.map((draft) => draft.amount)).toEqual([1_500_000, 450_000, 5_000])
    expect(drafts[2].description).toBe('Es teh')
  })

  it('mengenali setoran modal', () => {
    const [draft] = inferDraftsLocally('Modal awal 1 jt masuk Kas Usaha', REFERENCE)
    expect(draft).toMatchObject({ amount: 1_000_000, flow: 'income', fund: 'business', category: 'Modal', description: 'Setoran modal' })
  })

  it('memahami kata "kemarin" sebagai tanggal sebelumnya', () => {
    const [draft] = inferDraftsLocally('kemarin beli bensin 20rb pakai kas usaha', REFERENCE)
    expect(draft).toMatchObject({ date: '2026-10-01', category: 'Transportasi', fund: 'business', description: 'Bensin' })
  })

  it('membaca kata benda biaya sebagai pengeluaran dengan keyakinan lebih rendah', () => {
    const [draft] = inferDraftsLocally('bensin antar pesanan 30rb pakai kas usaha', REFERENCE)
    expect(draft).toMatchObject({ flow: 'expense', fund: 'business', category: 'Transportasi', confidence: 0.7 })
  })

  it('menandai transaksi yang belum jelas untuk ditinjau', () => {
    const [draft] = inferDraftsLocally('es teh 5rb', REFERENCE)
    expect(draft).toMatchObject({ flow: 'review', fund: 'review', confidence: 0.55 })
  })

  it('mengabaikan kalimat tanpa nominal', () => {
    expect(inferDraftsLocally('hari ini toko ramai', REFERENCE)).toEqual([])
  })

  it('membatasi jumlah draft per cerita', () => {
    const input = Array.from({ length: 12 }, (_, index) => `jualan ${index + 1}0rb`).join('\n')
    expect(inferDraftsLocally(input, REFERENCE)).toHaveLength(8)
  })
})

describe('validateModelDrafts', () => {
  it('menerima keluaran model yang valid dan menormalkan nilai', () => {
    const drafts = validateModelDrafts({
      transactions: [
        { date: '2026-10-02', description: ' Jual kopi ', amount: 125000.4, flow: 'income', fund: 'business', category: 'Penjualan', confidence: 1.4 },
      ],
    }, 'gemini-test')

    expect(drafts).toHaveLength(1)
    expect(drafts[0]).toMatchObject({ description: 'Jual kopi', amount: 125_000, confidence: 1, source: 'Gemini', model: 'gemini-test' })
  })

  it('membuang item yang tidak valid dan mengganti nilai di luar enum', () => {
    const drafts = validateModelDrafts({
      transactions: [
        { description: '', amount: 1000 },
        { description: 'Nominal negatif', amount: -5 },
        { description: 'Tanggal salah', amount: 5000, date: '2026-13-40', flow: 'transfer', fund: 'kas', category: 'Hiburan' },
        'bukan objek',
      ],
    }, 'gemini-test')

    expect(drafts).toHaveLength(1)
    expect(drafts[0]).toMatchObject({ flow: 'review', fund: 'review', category: 'Lainnya', confidence: 0.5 })
  })

  it('mengembalikan daftar kosong untuk bentuk yang tidak dikenal', () => {
    expect(validateModelDrafts(null, 'x')).toEqual([])
    expect(validateModelDrafts({ transactions: 'x' }, 'x')).toEqual([])
  })
})
