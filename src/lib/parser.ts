import { MAX_TRANSACTIONS_PER_INPUT, TRANSACTION_CATEGORIES, type Draft, type Flow, type Fund, type TransactionCategory } from '../types'
import { amountFromParts, isValidDateString, makeId, MAX_AMOUNT, shiftDate, today } from './format'

const AMOUNT_PATTERN = /(rp\.?\s*)?(\d[\d.,]*\d|\d)\s*(juta|jt|ribu|rb|k)?\b/gi

type AmountMatch = {
  amount: number
  hasUnit: boolean
  start: number
  end: number
}

const findAmounts = (part: string): AmountMatch[] =>
  [...part.matchAll(AMOUNT_PATTERN)].map((match) => ({
    amount: amountFromParts(match[2], match[3]),
    hasUnit: Boolean(match[1] || match[3]),
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }))

/**
 * Nominal dengan satuan ("50rb") atau awalan "Rp" lebih dipercaya daripada angka biasa,
 * sehingga "beli 2 bungkus plastik 50rb" menghasilkan Rp50.000, bukan Rp2.
 */
const pickAmount = (part: string) => {
  const candidates = findAmounts(part).filter((candidate) => candidate.amount > 0)
  return candidates.find((candidate) => candidate.hasUnit)
    ?? candidates.reduce<AmountMatch | undefined>((largest, candidate) => (!largest || candidate.amount > largest.amount ? candidate : largest), undefined)
}

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const inferCategory = (lower: string, isIncome: boolean): TransactionCategory => {
  if (isIncome && /modal/.test(lower)) return 'Modal'
  if (isIncome) return 'Penjualan'
  if (/plastik|kemasan|bahan|tepung|gula|minyak|telur|beras|sayur|daging|ayam|ikan|bumbu|susu|stok|belanja barang|kulakan|grosir/.test(lower)) return 'Bahan Baku'
  if (/gaji|upah|honor/.test(lower)) return 'Gaji'
  if (/bensin|ongkir|transport|parkir|tol|ojek|grab|gojek/.test(lower)) return 'Transportasi'
  if (/jajan|makan pribadi|rumah|sekolah|pribadi|anak|belanja dapur/.test(lower)) return 'Pribadi'
  if (/token|listrik|internet|wifi|pulsa|sewa|air|telepon|biaya|iklan|promosi/.test(lower)) return 'Operasional'
  return 'Lainnya'
}

const FILLER_WORDS = /\b(kemarin|tadi|hari ini|barusan|tadi pagi|tadi siang|tadi sore|tadi malam)\b/gi
const FUND_PHRASES = /\b(pakai|menggunakan|dari|masuk(?:\s+ke)?|ke)\s+(uang|kas|laci|rekening|dana|dompet)\b.*$/i

const inferDescription = (part: string, amount: AmountMatch, isIncome: boolean) => {
  const lower = part.toLowerCase()
  if (isIncome && /modal/.test(lower)) return 'Setoran modal'
  if (/plastik|kemasan/.test(lower)) return 'Plastik kemasan'
  if (/token/.test(lower)) return 'Token listrik'
  if (/gaji|upah/.test(lower)) return 'Gaji karyawan'

  const stripped = `${part.slice(0, amount.start)} ${part.slice(amount.end)}`
    .replace(FILLER_WORDS, ' ')
    .replace(FUND_PHRASES, '')
    .replace(/^\s*(dan|lalu|terus|kemudian|juga)\s+/i, '')
    .replace(/^\s*(saya|aku|sy)\s+/i, '')
    .replace(/^\s*(beli|bayar|belanja|keluar untuk|keluar buat)\s+/i, '')
    .replace(/\s+(sebesar|seharga|senilai|total)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (isIncome && /^(jual|jualan|penjualan|terjual|laku)$/i.test(stripped)) return 'Penjualan'
  if (stripped) return titleCase(stripped).slice(0, 160)
  return isIncome ? 'Penjualan' : 'Transaksi baru'
}

// Sebutan sumber dana yang eksplisit selalu menang atas petunjuk tidak langsung seperti "toko" atau "rumah".
const PERSONAL_FUND = /uang sendiri|kas pribadi|uang pribadi|dana pribadi|rekening pribadi|dompet pribadi|tabungan pribadi/
const BUSINESS_FUND = /kas usaha|uang usaha|laci toko|kas toko|uang toko|rekening usaha|dana usaha/
const PERSONAL_HINT = /rumah|pribadi|anak|sekolah|jajan|keluarga/
const BUSINESS_HINT = /toko|warung|untuk usaha|buat usaha|dagangan|pelanggan/

const inferDate = (lower: string, reference: string) =>
  /\bkemarin\b/.test(lower) ? shiftDate(reference, -1) : reference

const splitTransactions = (input: string) =>
  input
    .replace(/\r?\n/g, ';')
    // Titik akhir kalimat ("... kas usaha. Jualan 450rb") memisahkan transaksi, tetapi titik ribuan tidak.
    .replace(/\.(?=\s+[a-z])/gi, ';')
    .split(/\s*(?:;|,(?!\d)|\blalu\b|\bkemudian\b|\bterus\b|\bdan\s+(?=(?:jual|terima|beli|bayar|belanja|jajan|setor|keluar)\w*\b))\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)

/** Parser berbasis aturan yang menjadi cadangan ketika Gemini tidak tersedia. */
export const inferDraftsLocally = (input: string, reference = today()): Draft[] =>
  splitTransactions(input)
    .map((part): Draft | null => {
      const amount = pickAmount(part)
      if (!amount || amount.amount > MAX_AMOUNT) return null

      const lower = part.toLowerCase()
      const isIncome = /jual|penjualan|terima|masuk|dibayar|laku|omzet|modal/.test(lower)
      const isExpense = /beli|belanja|bayar|jajan|keluar|biaya|gaji|upah|kulakan/.test(lower)
      // Kata benda biaya yang jelas (bensin, token listrik, sewa, gaji) tetap dibaca sebagai pengeluaran.
      const impliesExpense = !isIncome && !isExpense && inferCategory(lower, false) !== 'Lainnya'
      const flow: Flow = isIncome ? 'income' : isExpense || impliesExpense ? 'expense' : 'review'
      const fund: Fund = PERSONAL_FUND.test(lower)
        ? 'personal'
        : BUSINESS_FUND.test(lower) || isIncome
          ? 'business'
          : PERSONAL_HINT.test(lower)
            ? 'personal'
            : BUSINESS_HINT.test(lower) ? 'business' : 'review'
      const category = fund === 'personal' && flow === 'expense' && inferCategory(lower, false) === 'Lainnya'
        ? 'Pribadi'
        : inferCategory(lower, isIncome)

      return {
        id: makeId(),
        date: inferDate(lower, reference),
        description: inferDescription(part, amount, isIncome),
        amount: amount.amount,
        flow,
        fund,
        category,
        confidence: fund === 'review' || flow === 'review' ? 0.55 : impliesExpense ? 0.7 : 0.82,
        source: 'Parser',
        schemaVersion: 2,
      }
    })
    .filter((draft): draft is Draft => draft !== null)
    .slice(0, MAX_TRANSACTIONS_PER_INPUT)

type UnknownDraft = Record<string, unknown>

/** Memvalidasi keluaran model sebelum ditampilkan sebagai draft. */
export const validateModelDrafts = (value: unknown, model: string, limit = MAX_TRANSACTIONS_PER_INPUT): Draft[] => {
  if (!value || typeof value !== 'object') return []
  const transactions = (value as { transactions?: unknown }).transactions
  if (!Array.isArray(transactions)) return []

  return transactions.slice(0, limit).flatMap((item): Draft[] => {
    if (!item || typeof item !== 'object') return []
    const draft = item as UnknownDraft
    const amount = typeof draft.amount === 'number' && Number.isFinite(draft.amount) ? Math.round(draft.amount) : 0
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
    if (!description || amount <= 0 || amount > MAX_AMOUNT) return []

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
