import { expect, test } from '@playwright/test'
import { collectPageErrors, fillBusinessSetup, recordManualTransaction, resetEmulators, startGuestBusiness, toast } from './helpers'

test.beforeEach(async ({ request }) => {
  await resetEmulators(request)
})

test('akun tamu: setup usaha, panduan hanya sekali, dan dashboard kosong', async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()

  await page.getByRole('button', { name: 'Coba tanpa akun' }).click()
  await page.getByRole('button', { name: 'Masuk ke aplikasi' }).click()
  await expect(page.getByText('Nama pemilik minimal 2 karakter.')).toBeVisible()
  await expect(page.getByLabel('Nama pemilik')).toBeFocused()

  await fillBusinessSetup(page)
  const tour = page.getByRole('dialog', { name: 'Catat seperti sedang bercerita' })
  await expect(tour).toBeVisible()
  await page.getByRole('button', { name: 'Lanjut' }).click()
  await expect(page.getByRole('heading', { name: 'Gemini hanya menyiapkan draft' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await expect(page.getByRole('heading', { name: /Fatimah$/ })).toBeVisible()
  await expect(page.getByText('Belum ada transaksi', { exact: true })).toBeVisible()
  await expect(page.locator('.balance-value')).toHaveText(/Rp\s0/)

  await page.reload()
  await expect(page.locator('.balance-value')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('mencatat manual, memisahkan dana, mengedit, dan menghapus transaksi', async ({ page }) => {
  const errors = collectPageErrors(page)
  await startGuestBusiness(page)

  await recordManualTransaction(page, { description: 'Belanja bahan uji', amount: '1 jt', category: 'Bahan Baku' })
  await expect(toast(page)).toContainText('1 transaksi tersimpan.')
  await expect(page.locator('.balance-value')).toContainText('1.000.000')

  await recordManualTransaction(page, { description: 'Jajan pribadi uji', amount: '25 rb', fund: 'personal', category: 'Pribadi' })
  await expect(toast(page)).toContainText('1 transaksi tersimpan.')
  // Setelah menyimpan transaksi pribadi, dashboard berpindah ke Dana Pribadi.
  await expect(page.getByRole('button', { name: 'Dana Pribadi', exact: true })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Riwayat', exact: true }).click()
  await expect(page.getByText('Jajan pribadi uji', { exact: true })).toBeVisible()
  await expect(page.getByText('Belanja bahan uji', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Kas Usaha', exact: true }).click()
  await expect(page.getByText('Belanja bahan uji', { exact: true })).toBeVisible()
  await expect(page.getByText('Jajan pribadi uji', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: /Edit transaksi Belanja bahan uji/ }).click()
  const editor = page.getByRole('dialog', { name: 'Edit transaksi' })
  await expect(editor).toBeVisible()
  await editor.getByLabel('Keterangan').fill('Belanja bahan diperbarui')
  await editor.getByLabel('Nominal').fill('1,5 jt')
  await editor.getByRole('button', { name: 'Simpan perubahan' }).click()
  await expect(editor).toHaveCount(0)
  await expect(page.getByText('Belanja bahan diperbarui', { exact: true })).toBeVisible()
  await expect(page.locator('.transaction-amount').first()).toContainText('1.500.000')

  await page.getByRole('button', { name: /Edit transaksi Belanja bahan diperbarui/ }).click()
  await page.getByRole('button', { name: 'Hapus transaksi ini' }).click()
  const confirm = page.getByRole('alertdialog', { name: 'Hapus transaksi?' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Belanja bahan diperbarui', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Belum ada transaksi Kas Usaha')).toBeVisible()
  expect(errors).toEqual([])
})

test('mode cerita: draft parser bisa ditinjau, dibuang sebagian, lalu disimpan', async ({ page }) => {
  await startGuestBusiness(page, { allowAi: true })
  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Dengan cerita' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('textbox', { name: 'Cerita transaksi' }).fill('Jualan 450rb. Beli plastik kemasan 50rb pakai kas usaha, dan es teh 5rb')
  await page.getByRole('button', { name: 'Analisis dengan Gemini' }).click()
  await expect(page.getByRole('heading', { name: '3 transaksi ditemukan' })).toBeVisible()

  // Draft ketiga ambigu: simpan harus ditolak sampai pengguna memilih.
  await page.getByRole('button', { name: /Konfirmasi dan simpan 3 transaksi/ }).click()
  await expect(page.getByText('1 transaksi belum lengkap. Periksa kolom yang ditandai.')).toBeVisible()

  await page.getByRole('button', { name: /Buang draft Es teh/ }).click()
  await expect(page.getByRole('heading', { name: '2 transaksi ditemukan' })).toBeVisible()
  await page.getByRole('button', { name: /Konfirmasi dan simpan 2 transaksi/ }).click()
  await expect(toast(page)).toContainText('2 transaksi tersimpan.')
  await expect(page.locator('.balance-value')).toHaveText(/Rp\s400\.000/)
  await expect(page.locator('.category-bars')).toContainText('Bahan Baku')
  await expect(page.locator('.transaction-list')).toContainText('Plastik kemasan')
})

test('tetap bisa mencatat saat offline lalu tersinkron otomatis', async ({ page, context }) => {
  await startGuestBusiness(page)
  await expect(page.getByRole('status').filter({ hasText: 'Tersinkron' })).toBeVisible()

  await context.setOffline(true)
  await expect(page.getByText(/Anda sedang offline/)).toBeVisible()
  await recordManualTransaction(page, { description: 'Kulakan saat offline', amount: '75rb', category: 'Bahan Baku' })
  await expect(toast(page)).toContainText('Akan disinkronkan saat online')
  await expect(page.getByText('Kulakan saat offline')).toBeVisible()
  await expect(page.getByText('Menunggu sinkron')).toBeVisible()

  await context.setOffline(false)
  await expect(page.getByText('Menunggu sinkron')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByRole('status').filter({ hasText: 'Tersinkron' })).toBeVisible()
})

test('daftar dengan email, keluar, lalu masuk kembali', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Buat akun/ }).click()
  await page.getByLabel('Nama Anda').fill('Fatimah')
  await page.getByLabel('Email').fill('fatimah@example.com')
  await page.getByLabel('Kata sandi', { exact: true }).fill('rahasia123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Buat akun' }).click()

  await fillBusinessSetup(page)
  await page.getByRole('button', { name: 'Lewati', exact: true }).click()
  await page.getByRole('button', { name: 'Buka profil usaha' }).click()
  await expect(page.getByRole('dialog', { name: 'Profil dan pengaturan' })).toContainText('fatimah@example.com')
  await page.getByRole('button', { name: 'Keluar dari akun' }).click()

  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
  await page.getByLabel('Email').fill('fatimah@example.com')
  await page.getByLabel('Kata sandi', { exact: true }).fill('salah-sandi')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email atau kata sandi tidak cocok.')

  await page.getByLabel('Kata sandi', { exact: true }).fill('rahasia123')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByText('Warung Uji Bersih')).toBeVisible()
  await expect(page.getByText('Anda memakai akun tamu')).toHaveCount(0)
})

test('tema gelap tersimpan setelah halaman dimuat ulang', async ({ page }) => {
  await startGuestBusiness(page)
  await page.getByRole('button', { name: 'Buka profil usaha' }).click()
  await page.getByRole('button', { name: 'Gelap' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('menghapus akun beserta seluruh data', async ({ page }) => {
  await startGuestBusiness(page)
  await recordManualTransaction(page, { description: 'Data yang akan dihapus', amount: '10rb' })
  await expect(toast(page)).toContainText('1 transaksi tersimpan.')

  await page.getByRole('button', { name: 'Buka profil usaha' }).click()
  await page.getByRole('button', { name: 'Hapus akun dan semua data' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus permanen' }).click()
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
  await expect(toast(page)).toContainText('Akun dan seluruh data telah dihapus.')
})
