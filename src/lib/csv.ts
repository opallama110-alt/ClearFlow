import type { Transaction } from '../types'
import { flowLabel, fundLabel, sourceLabel, statusLabel } from './labels'

const HEADER = ['Tanggal', 'Keterangan', 'Nominal', 'Arus Kas', 'Sumber Dana', 'Kategori', 'Sumber Draft', 'Status']

/**
 * Teks yang diawali =, +, -, @, tab, atau carriage return dapat dieksekusi sebagai formula
 * oleh Excel/Sheets (CSV injection), sehingga diberi awalan apostrof.
 */
export const escapeCsvCell = (value: string | number) => {
  const text = typeof value === 'number' ? String(value) : value.replace(/^([=+\-@\t\r])/, "'$1")
  return `"${text.replace(/"/g, '""')}"`
}

export const buildTransactionsCsv = (transactions: Transaction[]) => {
  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.description,
    transaction.amount,
    flowLabel(transaction.flow),
    fundLabel(transaction.fund),
    transaction.category,
    sourceLabel(transaction.source),
    statusLabel(transaction.status),
  ])
  return [HEADER, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}

export const downloadTextFile = (content: string, filename: string, type = 'text/csv;charset=utf-8') => {
  const href = URL.createObjectURL(new Blob([`﻿${content}`], { type }))
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  // Safari dan Firefox membutuhkan URL tetap hidup sesaat setelah klik.
  window.setTimeout(() => URL.revokeObjectURL(href), 30_000)
}
