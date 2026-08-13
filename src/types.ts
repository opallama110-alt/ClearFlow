export type Flow = 'income' | 'expense' | 'review'
export type ConfirmedFlow = Exclude<Flow, 'review'>
export type Fund = 'business' | 'personal' | 'review'
export type ConfirmedFund = Exclude<Fund, 'review'>
export type TransactionStatus = 'confirmed' | 'needs-review'
export type TransactionSource = 'Gemini' | 'Parser' | 'Manual' | 'AI'
export type Screen = 'dashboard' | 'record' | 'history'
export type HistoryFilter = 'all' | ConfirmedFlow | 'needs-review'
export type PeriodFilter = 'week' | 'month' | 'all'

export const BUSINESS_TYPES = [
  'Kuliner',
  'Perdagangan',
  'Jasa',
  'Produksi',
  'Pertanian',
  'Kreatif',
  'Lainnya',
] as const

export const TRANSACTION_CATEGORIES = [
  'Penjualan',
  'Bahan Baku',
  'Operasional',
  'Gaji',
  'Transportasi',
  'Pribadi',
  'Modal',
  'Lainnya',
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]

export type BusinessProfile = {
  ownerId: string
  ownerName: string
  name: string
  businessType: BusinessType
  city: string
  timezone: 'Asia/Jakarta'
  currency: 'IDR'
  bookkeepingStartDate: string
  openingBusinessBalance: number
  openingPersonalBalance: number
  onboardingCompleted: boolean
  aiProcessingConsent: boolean
  productTourVersion: number
  plan: 'pilot'
  schemaVersion: 2
}

export type BusinessProfileInput = Omit<BusinessProfile, 'ownerId' | 'timezone' | 'currency' | 'productTourVersion' | 'plan' | 'schemaVersion'>

export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  flow: ConfirmedFlow
  fund: ConfirmedFund
  category: TransactionCategory
  status: TransactionStatus
  source: TransactionSource
  confidence?: number
  model?: string
  schemaVersion?: number
}

export type Draft = Omit<Transaction, 'status' | 'flow' | 'fund'> & {
  flow: Flow
  fund: Fund
  confidence: number
  source: Exclude<TransactionSource, 'AI'>
}

export type ExtractionResult = {
  drafts: Draft[]
  engine: 'gemini' | 'parser'
  model?: string
  fallbackReason?: string
}
