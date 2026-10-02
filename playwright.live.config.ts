import { defineConfig } from '@playwright/test'

/** Smoke test terhadap production (https://clearfloww.web.app) memakai akun tamu sekali pakai. */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './e2e/live',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.CLEARFLOW_E2E_BASE_URL ?? 'https://clearfloww.web.app',
    browserName: 'chromium',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
})
