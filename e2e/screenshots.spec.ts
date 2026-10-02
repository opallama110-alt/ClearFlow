import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { fillBusinessSetup, resetEmulators } from './helpers'

/**
 * Membuat screenshot README dari aplikasi asli (emulator).
 * Jalankan: CAPTURE_SCREENSHOTS=1 npm run test:e2e -- screenshots
 */
test.skip(!process.env.CAPTURE_SCREENSHOTS, 'Hanya dijalankan saat membuat ulang screenshot dokumentasi.')

const OUT = path.resolve('docs', 'screenshots')
mkdirSync(OUT, { recursive: true })

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

const settle = async (page: Page) => {
  await page.locator('.toast').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined)
  await page.waitForTimeout(350)
}

const seed = async (page: Page) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Buat akun/ }).click()
  await page.getByLabel('Nama Anda').fill('Fatimah Azzahra')
  await page.getByLabel('Email').fill('fatimah@example.com')
  await page.getByLabel('Kata sandi', { exact: true }).fill('rahasia123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Buat akun' }).click()
  await fillBusinessSetup(page, { allowAi: true, businessName: 'Warung Nasi Bu Fatimah' })
  await page.getByRole('button', { name: 'Lewati', exact: true }).click()
  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByRole('textbox', { name: 'Cerita transaksi' }).fill('Modal awal 2 jt masuk kas usaha. Jualan nasi box 850rb, lalu beli beras 180rb pakai kas usaha, terus beli plastik kemasan 45rb pakai kas usaha, kemarin bayar gaji karyawan 300rb pakai kas usaha, dan bensin antar pesanan 30rb pakai kas usaha')
  await page.getByRole('button', { name: 'Analisis dengan Gemini' }).click()
  await expect(page.getByRole('heading', { name: /transaksi ditemukan/ })).toBeVisible()
  await page.getByRole('button', { name: /Konfirmasi dan simpan/ }).click()
  await expect(page.locator('.toast')).toContainText('tersimpan')
}

test('screenshot dokumentasi', async ({ page, request }) => {
  await resetEmulators(request)
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await seed(page)
  await page.getByRole('button', { name: 'Beranda', exact: true }).click()
  await settle(page)
  await page.screenshot({ path: path.join(OUT, 'dashboard.png') })

  await page.getByRole('button', { name: 'Catat', exact: true }).click()
  await page.getByRole('textbox', { name: 'Cerita transaksi' }).fill('Jualan es teh 120rb, lalu beli gula 25rb pakai uang pribadi')
  await page.getByRole('button', { name: 'Analisis dengan Gemini' }).click()
  await expect(page.getByRole('heading', { name: '2 transaksi ditemukan' })).toBeVisible()
  await settle(page)
  await page.locator('.draft-section').scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, -90))
  await page.screenshot({ path: path.join(OUT, 'record.png') })
  await page.getByRole('button', { name: 'Buang semua draft' }).click()

  await page.getByRole('button', { name: 'Riwayat', exact: true }).click()
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 330))
  await page.screenshot({ path: path.join(OUT, 'history.png') })

  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Beranda', exact: true }).click()
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 330))
  await page.screenshot({ path: path.join(OUT, 'dashboard-dark.png') })
})

test('screenshot halaman masuk desktop', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(OUT, 'login-desktop.png') })
  await context.close()
})
