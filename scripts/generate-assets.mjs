/**
 * Membuat ikon PWA dan gambar Open Graph dari SVG logo serta screenshot dokumentasi.
 * Jalankan setelah `CAPTURE_SCREENSHOTS=1 npm run test:e2e -- screenshots`:
 *   node scripts/generate-assets.mjs
 */
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const LOGO_PATH = 'M45.4 20.8a18 18 0 1 0 0 22.4l-5.5-4.6a10.7 10.7 0 1 1 0-13.2l5.5-4.6Z'
const BLUE = '#0052cc'

const rounded = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${BLUE}"/><path fill="#fff" d="${LOGO_PATH}"/></svg>`
// Maskable & Apple: latar penuh, logo diperkecil agar tetap utuh di zona aman 80%.
const fullBleed = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="${BLUE}"/><g transform="translate(32 32) scale(0.72) translate(-32 -32)"><path fill="#fff" d="${LOGO_PATH}"/></g></svg>`

const screenshot = readFileSync('docs/screenshots/dashboard.png').toString('base64')
const font = (file) => readFileSync(new URL(`../node_modules/@fontsource-variable/${file}`, import.meta.url)).toString('base64')
const fontFaces = `
  @font-face { font-family: 'Plus Jakarta Sans'; font-weight: 200 800; src: url(data:font/woff2;base64,${font('plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2')}) format('woff2'); }
  @font-face { font-family: 'Inter'; font-weight: 100 900; src: url(data:font/woff2;base64,${font('inter/files/inter-latin-wght-normal.woff2')}) format('woff2'); }`
const og = `<!doctype html><html><head><style>${fontFaces}
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #0b1c30;
    background: radial-gradient(circle at 80% 10%, #ffffff 0, #e3edff 45%, #c9dbf7 100%); }
  .wrap { display: flex; align-items: center; height: 100%; padding: 0 72px; gap: 56px; }
  .copy { flex: 1; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
  .brand span { color: ${BLUE}; }
  h1 { margin-top: 34px; font-size: 58px; line-height: 1.06; letter-spacing: -0.045em; }
  p { margin-top: 22px; color: #3f4f68; font-size: 25px; line-height: 1.45; font-family: Inter, system-ui, sans-serif; }
  .chips { display: flex; gap: 10px; margin-top: 30px; flex-wrap: wrap; }
  .chips div { padding: 10px 16px; border-radius: 999px; background: #fff; color: ${BLUE}; font: 600 19px Inter, system-ui, sans-serif; box-shadow: 0 6px 16px rgba(15,48,98,.08); }
  .phone { width: 300px; height: 560px; margin-top: 70px; border-radius: 40px; padding: 10px; background: #0b1c30; box-shadow: 0 30px 60px rgba(6,24,58,.3); }
  .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 31px; }
</style></head><body><div class="wrap">
  <div class="copy">
    <div class="brand">${rounded(56)}<div>ClearFlow<span>.AI</span></div></div>
    <h1>Pembukuan UMKM yang terasa seperti bercerita.</h1>
    <p>Tulis transaksi seperti chat, Gemini menyiapkan draft, Anda yang mengonfirmasi. Kas Usaha dan Dana Pribadi dihitung terpisah.</p>
    <div class="chips"><div>React 19</div><div>Firebase</div><div>Gemini AI</div><div>PWA offline</div></div>
  </div>
  <div class="phone"><img src="data:image/png;base64,${screenshot}" alt=""></div>
</div></body></html>`

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {})
const render = async (html, size, path, transparent = false) => {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${html}</body></html>`)
  await page.screenshot({ path, omitBackground: transparent, clip: { x: 0, y: 0, ...size } })
  await page.close()
}

await render(rounded(192), { width: 192, height: 192 }, 'public/icons/icon-192.png', true)
await render(rounded(512), { width: 512, height: 512 }, 'public/icons/icon-512.png', true)
await render(fullBleed(512), { width: 512, height: 512 }, 'public/icons/maskable-512.png')
await render(fullBleed(180), { width: 180, height: 180 }, 'public/apple-touch-icon.png')

const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await ogPage.setContent(og, { waitUntil: 'load' })
await ogPage.evaluate(() => document.fonts.ready)
await ogPage.screenshot({ path: 'public/og-image.png' })
await browser.close()
console.log('Ikon dan og-image.png dibuat.')
