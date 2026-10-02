import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const PROJECT_ID = 'demo-clearflow'
const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'

/** Mengosongkan Auth dan Firestore emulator agar setiap test mulai dari data kosong. */
export const resetEmulators = async (request: APIRequestContext) => {
  await request.delete(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`)
  await request.delete(`${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`)
}

/**
 * Mengumpulkan error JavaScript dan console. Kegagalan jaringan ke host di luar localhost
 * diabaikan karena lingkungan uji bisa memblokir internet; yang dijaga adalah error aplikasi.
 */
export const collectPageErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const url = message.location().url
    const isExternalNetworkFailure = message.text().startsWith('Failed to load resource') && url && !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)
    if (!isExternalNetworkFailure) errors.push(`${message.text()} ${url}`.trim())
  })
  return errors
}

export const fillBusinessSetup = async (page: Page, { allowAi = false, ownerName = 'Fatimah Azzahra', businessName = 'Warung Uji Bersih' } = {}) => {
  await expect(page.getByRole('heading', { name: 'Kenali usaha Anda' })).toBeVisible()
  await page.getByLabel('Nama pemilik').fill(ownerName)
  await page.getByLabel('Nama usaha').fill(businessName)
  await page.getByLabel('Jenis usaha').selectOption('Kuliner')
  await page.getByLabel('Kota / kabupaten').fill('Kota Cirebon')
  if (allowAi) await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Masuk ke aplikasi' }).click()
}

export const startGuestBusiness = async (page: Page, options: { allowAi?: boolean } = {}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Coba tanpa akun' }).click()
  await fillBusinessSetup(page, options)
  await expect(page.getByRole('dialog', { name: 'Catat seperti sedang bercerita' })).toBeVisible()
  await page.getByRole('button', { name: 'Lewati', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

export const recordManualTransaction = async (
  page: Page,
  { description, amount, fund = 'business', flow = 'expense', category }: {
    description: string
    amount: string
    fund?: 'business' | 'personal'
    flow?: 'income' | 'expense'
    category?: string
  },
) => {
  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByRole('button', { name: 'Isi manual' }).click()
  const card = page.locator('.draft-card').first()
  await card.getByLabel('Keterangan').fill(description)
  await card.getByLabel('Nominal').fill(amount)
  await card.getByLabel('Arus kas').selectOption(flow)
  await card.getByLabel('Sumber dana').selectOption(fund)
  if (category) await card.getByLabel('Kategori').selectOption(category)
  await page.getByRole('button', { name: /Konfirmasi dan simpan 1 transaksi/ }).click()
}

export const toast = (page: Page) => page.locator('.toast')
