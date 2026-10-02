import {
  collection,
  deleteDoc,
  doc,
  getAggregateFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  sum,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { reportError } from '../firebase'
import {
  BUSINESS_TYPES,
  TRANSACTION_CATEGORIES,
  type BusinessProfile,
  type BusinessProfileInput,
  type BusinessType,
  type ConfirmedFund,
  type Draft,
  type FundTotals,
  type Transaction,
  type TransactionCategory,
  type WriteOutcome,
} from '../types'
import { db } from './db'
import { today } from './format'

const businessRef = (uid: string) => doc(db, 'businesses', uid)
const transactionsRef = (uid: string) => collection(db, 'businesses', uid, 'transactions')

const toBusinessProfile = (uid: string, data: DocumentData): BusinessProfile => ({
  ownerId: uid,
  ownerName: typeof data.ownerName === 'string' ? data.ownerName : '',
  name: typeof data.name === 'string' ? data.name : 'Usaha Saya',
  businessType: BUSINESS_TYPES.includes(data.businessType) ? data.businessType as BusinessType : 'Lainnya',
  city: typeof data.city === 'string' ? data.city : '',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  bookkeepingStartDate: typeof data.bookkeepingStartDate === 'string' ? data.bookkeepingStartDate : today(),
  openingBusinessBalance: Number.isInteger(data.openingBusinessBalance) ? data.openingBusinessBalance : 0,
  openingPersonalBalance: Number.isInteger(data.openingPersonalBalance) ? data.openingPersonalBalance : 0,
  onboardingCompleted: data.onboardingCompleted !== false,
  aiProcessingConsent: data.aiProcessingConsent === true,
  productTourVersion: Number.isInteger(data.productTourVersion) ? data.productTourVersion : 0,
  plan: 'pilot',
  schemaVersion: 2,
})

const toTransaction = (id: string, data: DocumentData, pending: boolean): Transaction => ({
  id,
  date: typeof data.date === 'string' ? data.date : today(),
  description: typeof data.description === 'string' ? data.description : '',
  amount: typeof data.amount === 'number' ? data.amount : 0,
  flow: data.flow === 'income' ? 'income' : 'expense',
  fund: data.fund === 'personal' ? 'personal' : 'business',
  category: TRANSACTION_CATEGORIES.includes(data.category) ? data.category as TransactionCategory : 'Lainnya',
  status: data.status === 'needs-review' ? 'needs-review' : 'confirmed',
  source: ['Gemini', 'Parser', 'Manual', 'AI'].includes(data.source) ? data.source : 'Manual',
  confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
  model: typeof data.model === 'string' ? data.model : undefined,
  schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : undefined,
  pending,
  createdAtMs: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : undefined,
})

// ---------------------------------------------------------------------------
// Penulisan yang tetap lancar saat offline
// ---------------------------------------------------------------------------

type WriteErrorListener = (error: unknown) => void
const writeErrorListeners = new Set<WriteErrorListener>()

/** Dipanggil bila penulisan yang sempat diantrikan offline akhirnya ditolak server. */
export const onLateWriteError = (listener: WriteErrorListener) => {
  writeErrorListeners.add(listener)
  return () => { writeErrorListeners.delete(listener) }
}

const SERVER_ACK_TIMEOUT_MS = 8_000

/**
 * Firestore menerapkan perubahan ke cache lokal seketika, tetapi promise penulisan baru
 * selesai setelah server mengonfirmasi. Saat offline promise itu bisa menggantung lama,
 * jadi UI cukup menunggu konfirmasi server sebentar lalu menganggap perubahan "diantrikan".
 */
export const settleWrite = async (write: Promise<unknown>): Promise<WriteOutcome> => {
  const reportLate = (error: unknown) => {
    reportError(error, 'late-write')
    writeErrorListeners.forEach((listener) => listener(error))
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    write.catch(reportLate)
    return 'queued'
  }

  let timeoutId = 0
  let timedOut = false
  const timeout = new Promise<WriteOutcome>((resolve) => {
    timeoutId = window.setTimeout(() => {
      timedOut = true
      resolve('queued')
    }, SERVER_ACK_TIMEOUT_MS)
  })

  // Penolakan yang datang setelah batas waktu tidak lagi bisa ditangani pemanggil.
  write.catch((error) => { if (timedOut) reportLate(error) })
  try {
    return await Promise.race([write.then((): WriteOutcome => 'synced'), timeout])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

// ---------------------------------------------------------------------------
// Langganan data
// ---------------------------------------------------------------------------

export const subscribeBusiness = (
  uid: string,
  onValue: (profile?: BusinessProfile) => void,
  onError: (error: unknown) => void,
): Unsubscribe => onSnapshot(
  businessRef(uid),
  (snapshot) => onValue(snapshot.exists() ? toBusinessProfile(uid, snapshot.data()) : undefined),
  onError,
)

export type TransactionsSnapshot = {
  transactions: Transaction[]
  /** False ketika jumlah dokumen mencapai batas listener sehingga data lama belum dimuat. */
  complete: boolean
  fromCache: boolean
  hasPendingWrites: boolean
}

export const subscribeTransactions = (
  uid: string,
  maxDocuments: number,
  onValue: (snapshot: TransactionsSnapshot) => void,
  onError: (error: unknown) => void,
): Unsubscribe => onSnapshot(
  query(transactionsRef(uid), orderBy('date', 'desc'), limit(maxDocuments)),
  { includeMetadataChanges: true },
  (snapshot) => onValue({
    // 'estimate' memberi perkiraan waktu untuk penulisan yang belum dikonfirmasi server.
    transactions: snapshot.docs.map((document) => toTransaction(document.id, document.data({ serverTimestamps: 'estimate' }), document.metadata.hasPendingWrites)),
    complete: snapshot.size < maxDocuments,
    fromCache: snapshot.metadata.fromCache,
    hasPendingWrites: snapshot.metadata.hasPendingWrites,
  }),
  onError,
)

/**
 * Total sepanjang waktu dari server, dipakai ketika listener hanya memuat sebagian data
 * sehingga saldo tetap akurat untuk usaha dengan ribuan transaksi.
 */
export const fetchFundTotals = async (uid: string): Promise<FundTotals> => {
  const totalFor = async (fund: ConfirmedFund, flow: 'income' | 'expense') => {
    const snapshot = await getAggregateFromServer(
      query(transactionsRef(uid), where('fund', '==', fund), where('flow', '==', flow), where('status', '==', 'confirmed')),
      { total: sum('amount') },
    )
    return snapshot.data().total ?? 0
  }
  const [businessIncome, businessExpense, personalIncome, personalExpense] = await Promise.all([
    totalFor('business', 'income'),
    totalFor('business', 'expense'),
    totalFor('personal', 'income'),
    totalFor('personal', 'expense'),
  ])
  return {
    business: { income: businessIncome, expense: businessExpense },
    personal: { income: personalIncome, expense: personalExpense },
  }
}

// ---------------------------------------------------------------------------
// Profil usaha
// ---------------------------------------------------------------------------

export const saveBusinessProfile = (uid: string, input: BusinessProfileInput, exists: boolean) => {
  const profile = {
    ownerId: uid,
    ownerName: input.ownerName.trim(),
    name: input.name.trim(),
    businessType: input.businessType,
    city: input.city.trim(),
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
    bookkeepingStartDate: input.bookkeepingStartDate,
    openingBusinessBalance: Math.round(input.openingBusinessBalance),
    openingPersonalBalance: Math.round(input.openingPersonalBalance),
    onboardingCompleted: input.onboardingCompleted,
    aiProcessingConsent: input.aiProcessingConsent,
    ...(!exists ? { productTourVersion: 0 } : {}),
    plan: 'pilot',
    schemaVersion: 2,
    updatedAt: serverTimestamp(),
    ...(!exists ? { createdAt: serverTimestamp() } : {}),
  }
  return settleWrite(setDoc(businessRef(uid), profile, { merge: exists }))
}

export const saveProductTourVersion = (uid: string, version: number) => settleWrite(updateDoc(businessRef(uid), {
  productTourVersion: version,
  updatedAt: serverTimestamp(),
}))

// ---------------------------------------------------------------------------
// Transaksi
// ---------------------------------------------------------------------------

export const saveDraftTransactions = (uid: string, drafts: Draft[]) => {
  const batch = writeBatch(db)
  drafts.forEach((draft) => {
    batch.set(doc(transactionsRef(uid), draft.id), {
      date: draft.date,
      description: draft.description.trim().slice(0, 160),
      amount: Math.round(draft.amount),
      flow: draft.flow,
      fund: draft.fund,
      category: draft.category,
      status: 'confirmed',
      source: draft.source,
      confidence: draft.confidence,
      ...(draft.model ? { model: draft.model.slice(0, 60) } : {}),
      schemaVersion: 2,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  return settleWrite(batch.commit())
}

export const updateTransaction = (uid: string, transaction: Transaction) => settleWrite(updateDoc(doc(transactionsRef(uid), transaction.id), {
  date: transaction.date,
  description: transaction.description.trim().slice(0, 160),
  amount: Math.round(transaction.amount),
  flow: transaction.flow,
  fund: transaction.fund,
  category: transaction.category,
  status: transaction.status,
  source: transaction.source === 'AI' ? 'Parser' : transaction.source,
  confidence: typeof transaction.confidence === 'number' ? transaction.confidence : 1,
  ...(transaction.model ? { model: transaction.model.slice(0, 60) } : {}),
  schemaVersion: 2,
  updatedAt: serverTimestamp(),
}))

export const deleteTransaction = (uid: string, transactionId: string) =>
  settleWrite(deleteDoc(doc(transactionsRef(uid), transactionId)))

const BATCH_LIMIT = 450

const deleteMatching = async (uid: string, fund?: ConfirmedFund) => {
  const snapshot = await getDocs(fund ? query(transactionsRef(uid), where('fund', '==', fund)) : transactionsRef(uid))
  for (let index = 0; index < snapshot.docs.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db)
    snapshot.docs.slice(index, index + BATCH_LIMIT).forEach((document) => batch.delete(document.ref))
    await batch.commit()
  }
  return snapshot.size
}

export const deleteFundTransactionHistory = (uid: string, fund: ConfirmedFund) => deleteMatching(uid, fund)

export const deleteAllUserData = async (uid: string) => {
  await deleteMatching(uid)
  await deleteDoc(businessRef(uid))
}
