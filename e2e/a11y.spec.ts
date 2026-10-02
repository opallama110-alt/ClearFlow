import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { recordManualTransaction, resetEmulators, startGuestBusiness } from './helpers'

const seriousViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test.beforeEach(async ({ request }) => {
  await resetEmulators(request)
})

for (const theme of ['light', 'dark'] as const) {
  test(`tidak ada pelanggaran aksesibilitas serius (${theme})`, async ({ page }) => {
    // Animasi masuk dimatikan agar axe menilai warna akhir, bukan warna di tengah transisi.
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Masuk ke ClearFlow.AI' })).toBeVisible()
    expect(await seriousViolations(page), 'halaman masuk').toEqual([])

    await startGuestBusiness(page)
    await recordManualTransaction(page, { description: 'Belanja bahan', amount: '50rb', category: 'Bahan Baku' })
    await expect(page.locator('.toast')).toBeVisible()
    expect(await seriousViolations(page), 'dashboard').toEqual([])

    await page.getByRole('button', { name: 'Catat', exact: true }).click()
    expect(await seriousViolations(page), 'catat').toEqual([])

    await page.getByRole('button', { name: 'Riwayat', exact: true }).click()
    expect(await seriousViolations(page), 'riwayat').toEqual([])

    await page.getByRole('button', { name: 'Buka profil usaha' }).click()
    await expect(page.getByRole('dialog', { name: 'Profil dan pengaturan' })).toBeVisible()
    expect(await seriousViolations(page), 'profil').toEqual([])
  })
}
