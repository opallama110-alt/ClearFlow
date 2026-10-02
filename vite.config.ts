import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'privacy.html', 'terms.html', 'legal.css'],
      manifest: {
        id: '/',
        name: 'ClearFlow.AI — Pembukuan UMKM',
        short_name: 'ClearFlow',
        description: 'Catat arus kas UMKM seperti bercerita. Pisahkan Kas Usaha dan Dana Pribadi dengan bantuan Gemini.',
        lang: 'id-ID',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f8fd',
        theme_color: '#0052cc',
        categories: ['business', 'finance', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Catat transaksi', short_name: 'Catat', url: '/?screen=record', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // Subset huruf non-Latin tetap tersedia lewat jaringan, tetapi tidak ikut di-precache.
        globIgnores: ['**/og-image.png', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-wght-*.woff2'],
        navigateFallback: '/index.html',
        // Halaman statis dan URL milik Firebase Hosting (mis. /__/auth) tidak boleh dialihkan ke SPA.
        navigateFallbackDenylist: [/^\/__\//, /\/privacy\.html$/, /\/terms\.html$/],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 550,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'firebase-auth',
              test: /node_modules[\\/]@firebase[\\/]auth[\\/]/,
              priority: 25,
            },
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/,
              priority: 24,
            },
            {
              name: 'firebase-app-check',
              test: /node_modules[\\/]@firebase[\\/]app-check[\\/]/,
              priority: 23,
            },
          ],
        },
      },
    },
  },
})
