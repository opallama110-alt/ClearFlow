import { TRANSACTION_CATEGORIES, type Draft, type Flow, type Fund, type TransactionCategory } from '../types'
import { isValidDateString, makeId, today } from './format'

const AMOUNT_PATTERN = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb|k)?/i

const getAmount = (part: string) => {
  const match = part.match(AMOUNT_PATTERN)
  if (!match) return 0

  const unit = (match[2] ?? '').toLowerCase()
  const normalized = unit
    ? match[1].replace(',', '.')
    : match[1].replace(/[.,]/g, '')
  const value = Number(normalized)
  if (!Number.isFinite(value)) return 0
  const multiplier = /^(juta|jt)$/.test(unit) ? 1_000_000 : /^(ribu|rb|k)$/.test(unit) ? 1_000 : 1
  return Math.round(value * multiplier)
}

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const inferCategory = (lower: string, isIncome: boolean): TransactionCategory => {
  if (isIncome && /modal|setor modal/.test(lower)) return 'Modal'
  if (isIncome) return 'Penjualan'
  if (/plastik|kemasan|bahan|tepung|gula|stok|belanja barang/.test(lower)) return 'Bahan Baku'
  if (/gaji|upah|honor/.test(lower)) return 'Gaji'
  if (/bensin|ongkir|transport|parkir|tol/.test(lower)) return 'Transportasi'
  if (/jajan|makan pribadi|rumah|sekolah|pribadi/.test(lower)) return 'Pribadi'
  if (/token|listrik|internet|sewa|air|telepon|biaya/.test(lower)) return 'Operasional'
  return 'Lainnya'
}

const inferDescription = (part: string, isIncome: boolean) => {
  const lower = part.toLowerCase()
  if (isIncome) return /modal/.test(lower) ? 'Setoran modal' : 'Penjualan'
  if (/plastik|kemasan/.test(lower)) return 'Plastik kemasan'
  if (/token/.test(lower)) return 'Token listrik'
  if (/internet/.test(lower)) return 'Internet'
  if (/bensin/.test(lower)) return 'Bensin'
  if (/gaji|upah/.test(lower)) return 'Gaji karyawan'
  if (/jajan/.test(lower)) return 'Jajan pribadi'

  const stripped = part
    .replace(AMOUNT_PATTERN, '')
    .replace(/\b(pakai|menggunakan|dari)\s+(uang|kas|laci).*$/i, '')
    .replace(/^(beli|bayar|belanja|keluar untuk)\s+/i, '')
    .trim()
  return titleCase(stripped || 'Transaksi baru')
}

const splitTransactions = (input: string) =>
  input
    .replace(/\r?\n/g, ';')
    .split(/\s*(?:;|,(?!\d)|\blalu\b|\bkemudian\b|\bdan\s+(?=(?:jual|terima|beli|bayar|belanja|jajan|setor|keluar)\b))\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)

export const inferDraftsLocally = (input: string): Draft[] =>
  splitTransactions(input)
    .slice(0, 8)
    .map((part): Draft | null => {
      const amount = getAmount(part)
      if (!amount || amount > 100_000_000_000) return null

      const lower = part.toLowerCase()
      const isIncome = /jual|penjualan|terima|masuk|dibayar|setor modal/.test(lower)
      const isExpense = /beli|belanja|bayar|jajan|keluar|biaya|gaji|upah/.test(lower)
      const flow: Flow = isIncome ? 'income' : isExpense ? 'expense' : 'review'
      const isBusiness = /laci toko|kas usaha|uang usaha|untuk usaha|toko|rekening usaha/.test(lower)
      const isPersonal = /uang sendiri|kas pribadi|uang pribadi|rekening pribadi|rumah|pribadi/.test(lower)
      const fund: Fund = isBusiness || isIncome ? 'business' : isPersonal ? 'personal' : 'review'

      return {
        id: makeId(),
        date: today(),
        description: inferDescription(part, isIncome),
        amount,
        flow,
        fund,
        category: inferCategory(lower, isIncome),
        confidence: fund === 'review' || flow === 'review' ? 0.55 : 0.82,
        source: 'Parser',
        schemaVersion: 2,
      }
    })
    .filter((draft): draft is Draft => draft !== null)

type UnknownDraft = Record<string, unknown>

export const validateModelDrafts = (value: unknown, model: string): Draft[] => {
  if (!value || typeof value !== 'object') return []
  const transactions = (value as { transactions?: unknown }).transactions
  if (!Array.isArray(transactions)) return []

  return transactions.slice(0, 8).flatMap((item): Draft[] => {
    if (!item || typeof item !== 'object') return []
    const draft = item as UnknownDraft
    const amount = typeof draft.amount === 'number' ? Math.round(draft.amount) : 0
    const flow = draft.flow === 'income' || draft.flow === 'expense' || draft.flow === 'review' ? draft.flow : 'review'
    const fund = draft.fund === 'business' || draft.fund === 'personal' || draft.fund === 'review' ? draft.fund : 'review'
    const category = typeof draft.category === 'string' && TRANSACTION_CATEGORIES.includes(draft.category as TransactionCategory)
      ? draft.category as TransactionCategory
      : 'Lainnya'
    const description = typeof draft.description === 'string' ? draft.description.trim().slice(0, 160) : ''
    const date = typeof draft.date === 'string' && isValidDateString(draft.date) ? draft.date : today()
    const confidence = typeof draft.confidence === 'number' && Number.isFinite(draft.confidence)
      ? Math.max(0, Math.min(1, draft.confidence))
      : 0.5
    if (!description || amount <= 0 || amount > 100_000_000_000) return []

    return [{
      id: makeId(),
      date,
      description,
      amount,
      flow,
      fund,
      category,
      confidence,
      source: 'Gemini',
      model,
      schemaVersion: 2,
    }]
  })
}
