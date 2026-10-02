import { defineConfig, devices } from '@playwright/test'

/**
 * E2E lokal: build mode "e2e" yang terhubung ke Firebase Emulator Suite (proyek demo-clearflow),
 * sehingga tidak ada data production yang tersentuh. Jalankan lewat `npm run test:e2e`.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['live/**'],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npx vite build --mode e2e && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
