import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const screenshotPath = (name: string) => path.resolve('artifacts', 'qa', name)

const startGuestBusiness = async (page: Page, allowAi: boolean) => {
  await page.getByRole('button', { name: 'Coba tanpa akun' }).click()
  await expect(page.getByRole('heading', { name: 'Kenali usaha Anda' })).toBeVisible()
  await page.getByLabel('Nama pemilik').fill('Penguji ClearFlow')
  await page.getByLabel('Nama usaha').fill('Warung Uji Bersih')
  await page.getByLabel('Jenis usaha').selectOption('Kuliner')
  await page.getByLabel('Kota / kabupaten').fill('Kota Bandung')
  if (allowAi) await page.getByRole('checkbox').check()
  await page.screenshot({ path: screenshotPath(allowAi ? 'setup-ai-mobile.png' : 'setup-manual-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Masuk ke aplikasi' }).click()
  await expect(page.getByRole('dialog', { name: 'Catat seperti sedang bercerita' })).toBeVisible()
  await page.getByRole('button', { name: 'Lewati', exact: true }).click()
  await expect(page.getByText('Belum ada transaksi', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Belum ada transaksi', { exact: true })).toBeVisible()
}

const deleteGuestAccount = async (page: Page) => {
  await page.getByRole('button', { name: 'Buka profil usaha' }).click()
  await expect(page.getByRole('heading', { name: 'Profil dan pengaturan' })).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Hapus akun dan semua data' }).click()
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
}

test.afterEach(async ({ page }) => {
  const profileButton = page.getByRole('button', { name: 'Buka profil usaha' })
  if (!page.isClosed() && await profileButton.isVisible().catch(() => false)) {
    await deleteGuestAccount(page).catch(() => undefined)
  }
})

test('alur production manual dari data kosong sampai edit dan hapus', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lanjutkan dengan Google' })).toBeVisible()
  await page.screenshot({ path: screenshotPath('login-desktop.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: screenshotPath('login-mobile.png'), fullPage: true })
  await startGuestBusiness(page, false)
  await expect(page.getByText('Rp 0', { exact: true })).toBeVisible()
  await page.screenshot({ path: screenshotPath('dashboard-empty-mobile.png'), fullPage: true })

  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByRole('tab', { name: 'Isi manual' }).click()
  await page.getByLabel('Keterangan').fill('Belanja bahan uji')
  await page.getByLabel('Nominal').fill('1 jt')
  await page.getByLabel('Kategori').selectOption('Bahan Baku')
  await page.getByRole('button', { name: /Konfirmasi dan simpan 1 transaksi/ }).click()
  await expect(page.getByText('1 transaksi tersimpan dan tersinkron.')).toBeVisible()

  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByRole('tab', { name: 'Isi manual' }).click()
  await page.getByLabel('Keterangan').fill('Jajan pribadi uji')
  await page.getByLabel('Nominal').fill('25 rb')
  await page.getByLabel('Sumber dana').selectOption('personal')
  await page.getByLabel('Kategori').selectOption('Pribadi')
  await page.getByRole('button', { name: /Konfirmasi dan simpan 1 transaksi/ }).click()
  await expect(page.getByText('1 transaksi tersimpan dan tersinkron.')).toBeVisible()

  await page.getByRole('button', { name: 'Riwayat' }).click()
  await expect(page.getByText('Belanja bahan uji', { exact: true })).toBeVisible()
  await expect(page.getByText('Jajan pribadi uji', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/-Rp\s*1\.000\.000/, { exact: true })).toBeVisible()
  await page.screenshot({ path: screenshotPath('history-one-transaction-mobile.png'), fullPage: true })

  await page.getByRole('tab', { name: /Dana Pribadi/ }).click()
  await expect(page.getByText('Jajan pribadi uji', { exact: true })).toBeVisible()
  await expect(page.getByText('Belanja bahan uji', { exact: true })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Kas Usaha' }).click()

  await page.getByRole('button', { name: 'Edit transaksi Belanja bahan uji' }).click()
  await expect(page.getByRole('heading', { name: 'Edit transaksi' })).toBeVisible()
  await page.getByRole('dialog').getByLabel('Keterangan').fill('Belanja bahan diperbarui')
  await page.getByRole('dialog').getByLabel('Nominal').fill('1,5 jt')
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await expect(page.getByText('Belanja bahan diperbarui', { exact: true })).toBeVisible()
  await expect(page.getByText(/-Rp\s*1\.500\.000/, { exact: true })).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Hapus transaksi Belanja bahan diperbarui' }).click()
  await expect(page.getByText('Belanja bahan diperbarui', { exact: true })).toHaveCount(0)
  await expect(page.getByText('0 transaksi', { exact: true })).toBeVisible()

  await deleteGuestAccount(page)
  expect(pageErrors).toEqual([])
})

test('Firebase AI Logic membuat draft Gemini dengan App Check', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await startGuestBusiness(page, true)
  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByLabel('Cerita transaksi').fill('Jualan kopi 125rb masuk ke kas usaha')
  await page.getByRole('button', { name: 'Analisis dengan Gemini' }).click()
  await expect(page.getByText(/Gemini \d+%/)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByLabel('Nominal')).toHaveValue('125.000')
  await page.screenshot({ path: screenshotPath('gemini-draft-mobile.png'), fullPage: true })
  await deleteGuestAccount(page)
})
