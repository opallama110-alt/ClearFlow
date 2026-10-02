import { expect, test, type Page } from '@playwright/test'

/**
 * Smoke test production setelah deploy (memakai akun tamu sekali pakai yang dihapus di akhir).
 * Jalankan: npm run test:e2e:live
 */

const startGuestBusiness = async (page: Page, allowAi: boolean) => {
  await page.getByRole('button', { name: 'Coba tanpa akun' }).click()
  await expect(page.getByRole('heading', { name: 'Kenali usaha Anda' })).toBeVisible()
  await page.getByLabel('Nama pemilik').fill('Penguji ClearFlow')
  await page.getByLabel('Nama usaha').fill('Warung Uji Bersih')
  await page.getByLabel('Jenis usaha').selectOption('Kuliner')
  await page.getByLabel('Kota / kabupaten').fill('Kota Bandung')
  if (allowAi) await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Masuk ke aplikasi' }).click()
  await page.getByRole('button', { name: 'Lewati', exact: true }).click()
  await expect(page.getByText('Belum ada transaksi', { exact: true })).toBeVisible()
}

const deleteGuestAccount = async (page: Page) => {
  await page.getByRole('button', { name: 'Buka profil usaha' }).click()
  await page.getByRole('button', { name: 'Hapus akun dan semua data' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus permanen' }).click()
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
}

test.afterEach(async ({ page }) => {
  const profileButton = page.getByRole('button', { name: 'Buka profil usaha' })
  if (!page.isClosed() && await profileButton.isVisible().catch(() => false)) {
    await deleteGuestAccount(page).catch(() => undefined)
  }
})

test('production: catat manual, edit, dan hapus', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
  await startGuestBusiness(page, false)

  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  const card = page.locator('.draft-card').first()
  await card.getByLabel('Keterangan').fill('Belanja bahan uji')
  await card.getByLabel('Nominal').fill('1 jt')
  await card.getByLabel('Kategori').selectOption('Bahan Baku')
  await page.getByRole('button', { name: /Konfirmasi dan simpan 1 transaksi/ }).click()
  await expect(page.locator('.toast')).toContainText('1 transaksi tersimpan')

  await page.getByRole('button', { name: 'Riwayat', exact: true }).click()
  await page.getByRole('button', { name: /Edit transaksi Belanja bahan uji/ }).click()
  await page.getByRole('dialog').getByLabel('Nominal').fill('1,5 jt')
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await expect(page.locator('.transaction-amount').first()).toContainText('1.500.000')

  await page.getByRole('button', { name: /Edit transaksi Belanja bahan uji/ }).click()
  await page.getByRole('button', { name: 'Hapus transaksi ini' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Belanja bahan uji', { exact: true })).toHaveCount(0)

  await deleteGuestAccount(page)
  expect(pageErrors).toEqual([])
})

test('production: Firebase AI Logic membuat draft Gemini dengan App Check', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await startGuestBusiness(page, true)
  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByRole('textbox', { name: 'Cerita transaksi' }).fill('Jualan kopi 125rb masuk ke kas usaha')
  await page.getByRole('button', { name: 'Analisis dengan Gemini' }).click()
  await expect(page.getByText(/Disiapkan Gemini · keyakinan \d+%/)).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.draft-card').first().getByLabel('Nominal')).toHaveValue('125.000')
  await deleteGuestAccount(page)
})
