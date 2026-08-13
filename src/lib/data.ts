import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { BusinessProfile, BusinessProfileInput, Draft, Transaction } from '../types'
import { today } from './format'

const defaultBusinessProfile = (uid: string, data: DocumentData): BusinessProfile => ({
  ownerId: uid,
  ownerName: typeof data.ownerName === 'string' ? data.ownerName : '',
  name: typeof data.name === 'string' ? data.name : 'Usaha Saya',
  businessType: ['Kuliner', 'Perdagangan', 'Jasa', 'Produksi', 'Pertanian', 'Kreatif', 'Lainnya'].includes(data.businessType)
    ? data.businessType
    : 'Lainnya',
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

export const subscribeBusiness = (
  uid: string,
  onValue: (profile?: BusinessProfile) => void,
  onError: () => void,
): Unsubscribe => onSnapshot(
  doc(db, 'businesses', uid),
  (snapshot) => onValue(snapshot.exists() ? defaultBusinessProfile(uid, snapshot.data()) : undefined),
  onError,
)

export const subscribeTransactions = (
  uid: string,
  onValue: (transactions: Transaction[]) => void,
  onError: () => void,
): Unsubscribe => onSnapshot(
  query(collection(db, 'businesses', uid, 'transactions'), orderBy('date', 'desc'), limit(500)),
  (snapshot) => onValue(snapshot.docs.map((transactionDocument): Transaction => {
    const data = transactionDocument.data() as Omit<Transaction, 'id'>
    return { ...data, id: transactionDocument.id }
  })),
  onError,
)

export const saveBusinessProfile = async (uid: string, input: BusinessProfileInput, exists: boolean) => {
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
  await setDoc(doc(db, 'businesses', uid), profile, { merge: exists })
}

export const saveProductTourVersion = (uid: string, version: number) => updateDoc(doc(db, 'businesses', uid), {
  productTourVersion: version,
  updatedAt: serverTimestamp(),
})

export const saveDraftTransactions = async (uid: string, drafts: Draft[]) => {
  const batch = writeBatch(db)
  drafts.forEach((draft) => {
    const transactionRef = doc(db, 'businesses', uid, 'transactions', draft.id)
    batch.set(transactionRef, {
      date: draft.date,
      description: draft.description.trim(),
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
  await batch.commit()
}

export const updateTransaction = async (uid: string, transaction: Transaction) => {
  await updateDoc(doc(db, 'businesses', uid, 'transactions', transaction.id), {
    date: transaction.date,
    description: transaction.description.trim(),
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
  })
}

export const deleteTransaction = (uid: string, transactionId: string) =>
  deleteDoc(doc(db, 'businesses', uid, 'transactions', transactionId))

export const deleteTransactionHistory = async (uid: string) => {
  const transactionSnapshot = await getDocs(collection(db, 'businesses', uid, 'transactions'))
  for (let index = 0; index < transactionSnapshot.docs.length; index += 450) {
    const batch = writeBatch(db)
    transactionSnapshot.docs.slice(index, index + 450).forEach((transactionDocument) => batch.delete(transactionDocument.ref))
    await batch.commit()
  }
}

export const deleteFundTransactionHistory = async (uid: string, fund: 'business' | 'personal') => {
  const transactionSnapshot = await getDocs(collection(db, 'businesses', uid, 'transactions'))
  const matchingDocuments = transactionSnapshot.docs.filter((transactionDocument) => transactionDocument.data().fund === fund)
  for (let index = 0; index < matchingDocuments.length; index += 450) {
    const batch = writeBatch(db)
    matchingDocuments.slice(index, index + 450).forEach((transactionDocument) => batch.delete(transactionDocument.ref))
    await batch.commit()
  }
}

export const deleteAllUserData = async (uid: string) => {
  await deleteTransactionHistory(uid)
  await deleteDoc(doc(db, 'businesses', uid))
}
