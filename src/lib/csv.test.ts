import { describe, expect, it } from 'vitest'

import { buildTransactionsCsv, escapeCsvCell } from './csv'

describe('escapeCsvCell', () => {
  it('membungkus teks dan menggandakan tanda kutip', () => {
    expect(escapeCsvCell('Kopi "spesial"')).toBe('"Kopi ""spesial"""')
  })

  it.each(['=SUM(A1:A2)', '+62812', '-cmd', '@import'])('menetralkan formula %s', (value) => {
    expect(escapeCsvCell(value)).toBe(`"'${value}"`)
  })

  it('membiarkan angka apa adanya', () => {
    expect(escapeCsvCell(125000)).toBe('"125000"')
  })
})

describe('buildTransactionsCsv', () => {
  it('menyusun header dan baris dengan label bahasa Indonesia', () => {
    const csv = buildTransactionsCsv([{
      id: '1',
      date: '2026-10-02',
      description: 'Jual kopi',
      amount: 125_000,
      flow: 'income',
      fund: 'personal',
      category: 'Penjualan',
      status: 'confirmed',
      source: 'Gemini',
    }])

    const [header, row] = csv.split('\r\n')
    expect(header).toBe('"Tanggal","Keterangan","Nominal","Arus Kas","Sumber Dana","Kategori","Sumber Draft","Status"')
    expect(row).toBe('"2026-10-02","Jual kopi","125000","Pemasukan","Dana Pribadi","Penjualan","Gemini","Dikonfirmasi"')
  })
})
