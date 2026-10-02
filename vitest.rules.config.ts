import { defineConfig } from 'vitest/config'

// Dijalankan di dalam `firebase emulators:exec` lewat `npm run test:rules`.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
