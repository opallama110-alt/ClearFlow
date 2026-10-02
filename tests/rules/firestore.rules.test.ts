import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, setLogLevel, Timestamp, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

const business = (uid: string, overrides: Record<string, unknown> = {}) => ({
  ownerId: uid,
  ownerName: 'Fatimah',
  name: 'Warung Uji',
  businessType: 'Kuliner',
  city: 'Kota Cirebon',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  bookkeepingStartDate: '2026-10-02',
  openingBusinessBalance: 0,
  openingPersonalBalance: 0,
  onboardingCompleted: true,
  aiProcessingConsent: false,
  productTourVersion: 0,
  plan: 'pilot',
  schemaVersion: 2,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})

const transaction = (overrides: Record<string, unknown> = {}) => ({
  date: '2026-10-02',
  description: 'Jual kopi',
  amount: 125_000,
  flow: 'income',
  fund: 'business',
  category: 'Penjualan',
  status: 'confirmed',
  source: 'Manual',
  confidence: 1,
  schemaVersion: 2,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})

const db = (uid?: string) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore()

const seedBusiness = async (uid: string) => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'businesses', uid), business(uid, { createdAt: Timestamp.now(), updatedAt: Timestamp.now() }))
  })
}

const seedTransaction = async (uid: string, id: string) => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'businesses', uid, 'transactions', id), transaction({ createdAt: Timestamp.now(), updatedAt: Timestamp.now() }))
  })
}

beforeAll(async () => {
  // Penolakan yang memang diharapkan tidak perlu memenuhi log.
  setLogLevel('silent')
  env = await initializeTestEnvironment({
    projectId: 'demo-clearflow-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
})

afterAll(async () => {
  await env.cleanup()
})

describe('businesses/{uid}', () => {
  it('pemilik dapat membuat profil usaha yang valid', async () => {
    await assertSucceeds(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice')))
  })

  it('menolak pengguna tanpa login dan pengguna lain', async () => {
    await seedBusiness('alice')
    await assertFails(getDoc(doc(db(), 'businesses', 'alice')))
    await assertFails(getDoc(doc(db('bob'), 'businesses', 'alice')))
    await assertFails(setDoc(doc(db('bob'), 'businesses', 'alice'), business('alice')))
    await assertFails(deleteDoc(doc(db('bob'), 'businesses', 'alice')))
  })

  it('menolak ownerId yang tidak sama dengan UID dokumen', async () => {
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('bob')))
  })

  it('menolak timestamp buatan perangkat', async () => {
    const forged = Timestamp.fromDate(new Date('2020-01-01T00:00:00Z'))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { createdAt: forged })))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { updatedAt: forged })))
  })

  it('menolak field tambahan dan nilai di luar batas', async () => {
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { isAdmin: true })))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { businessType: 'Kasino' })))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { openingBusinessBalance: -1 })))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { name: 'A' })))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice'), business('alice', { plan: 'pro' })))
  })

  it('pembaruan tidak boleh mengubah createdAt', async () => {
    await seedBusiness('alice')
    await assertSucceeds(updateDoc(doc(db('alice'), 'businesses', 'alice'), { productTourVersion: 1, updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(db('alice'), 'businesses', 'alice'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(db('alice'), 'businesses', 'alice'), { productTourVersion: 99, updatedAt: serverTimestamp() }))
  })

  it('pemilik dapat menghapus profil usahanya', async () => {
    await seedBusiness('alice')
    await assertSucceeds(deleteDoc(doc(db('alice'), 'businesses', 'alice')))
  })
})

describe('businesses/{uid}/transactions/{id}', () => {
  it('pemilik dapat mencatat transaksi yang valid', async () => {
    await seedBusiness('alice')
    await assertSucceeds(setDoc(doc(db('alice'), 'businesses', 'alice', 'transactions', 't1'), transaction()))
    await assertSucceeds(setDoc(doc(db('alice'), 'businesses', 'alice', 'transactions', 't2'), transaction({ model: 'gemini-3.5-flash-lite', source: 'Gemini', confidence: 0.82 })))
  })

  it('menolak nominal, arus kas, dan sumber dana yang tidak valid', async () => {
    const ref = (id: string) => doc(db('alice'), 'businesses', 'alice', 'transactions', id)
    await assertFails(setDoc(ref('zero'), transaction({ amount: 0 })))
    await assertFails(setDoc(ref('float'), transaction({ amount: 1.5 })))
    await assertFails(setDoc(ref('huge'), transaction({ amount: 100_000_000_001 })))
    await assertFails(setDoc(ref('review-flow'), transaction({ flow: 'review' })))
    await assertFails(setDoc(ref('review-fund'), transaction({ fund: 'review' })))
    await assertFails(setDoc(ref('date'), transaction({ date: '02-10-2026' })))
    await assertFails(setDoc(ref('empty'), transaction({ description: '' })))
    await assertFails(setDoc(ref('extra'), transaction({ note: 'tambahan' })))
    await assertFails(setDoc(ref('confidence'), transaction({ confidence: 2 })))
  })

  it('pengguna lain tidak dapat membaca atau mengubah transaksi', async () => {
    await seedTransaction('alice', 't1')
    await assertFails(getDoc(doc(db('bob'), 'businesses', 'alice', 'transactions', 't1')))
    await assertFails(setDoc(doc(db('bob'), 'businesses', 'alice', 'transactions', 't2'), transaction()))
    await assertFails(deleteDoc(doc(db('bob'), 'businesses', 'alice', 'transactions', 't1')))
  })

  it('pembaruan wajib mempertahankan createdAt dan memakai waktu server', async () => {
    await seedTransaction('alice', 't1')
    const ref = doc(db('alice'), 'businesses', 'alice', 'transactions', 't1')
    await assertSucceeds(updateDoc(ref, { amount: 150_000, updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { amount: 150_000, updatedAt: Timestamp.now() }))
    await assertFails(updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  })

  it('pemilik dapat menghapus transaksi', async () => {
    await seedTransaction('alice', 't1')
    await assertSucceeds(deleteDoc(doc(db('alice'), 'businesses', 'alice', 'transactions', 't1')))
  })
})

describe('koleksi lain', () => {
  it('menolak akses ke path yang tidak dikenal', async () => {
    await assertFails(setDoc(doc(db('alice'), 'admins', 'alice'), { role: 'owner' }))
    await assertFails(setDoc(doc(db('alice'), 'businesses', 'alice', 'secrets', 'x'), { value: 1 }))
  })
})
