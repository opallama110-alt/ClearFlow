import type { Flow, Fund, TransactionSource, TransactionStatus } from '../types'

export const flowLabel = (flow: Flow) =>
  flow === 'income' ? 'Pemasukan' : flow === 'expense' ? 'Pengeluaran' : 'Perlu klarifikasi'

export const fundLabel = (fund: Fund) =>
  fund === 'business' ? 'Kas Usaha' : fund === 'personal' ? 'Dana Pribadi' : 'Pilih sumber dana'

export const sourceLabel = (source: TransactionSource) =>
  source === 'Gemini' ? 'Gemini' : source === 'Manual' ? 'Manual' : 'Parser lokal'

export const statusLabel = (status: TransactionStatus) =>
  status === 'confirmed' ? 'Dikonfirmasi' : 'Perlu ditinjau'
