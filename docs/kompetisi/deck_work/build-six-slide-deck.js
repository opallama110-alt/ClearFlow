import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const pptxgen = require('pptxgenjs')

const ROOT = 'D:/ClearFlow.AI'
const WORK = path.join(ROOT, 'deck_work')
const RENDER_DIR = path.join(WORK, 'rendered')
const OUTPUT = path.join(ROOT, 'ClearFlow.AI_Pitch_Deck_6_Slides.pptx')
const BG_PATH = path.join(WORK, 'unpacked-inspect', 'ppt', 'media', 'image.png')
const PROTOTYPE_PATH = path.join(WORK, 'prototype-mobile.png')
const QR_PATH = path.join(WORK, 'qr-clearflow.png')

fs.mkdirSync(RENDER_DIR, { recursive: true })

const W = 1600
const H = 900
const FONT = 'Aptos, Segoe UI, Arial, sans-serif'
const C = {
  navy: '#0B1C30',
  navy2: '#16324F',
  blue: '#0052CC',
  blueSoft: '#EAF2FF',
  teal: '#00856A',
  tealSoft: '#E2F7EF',
  coral: '#C55C43',
  coralSoft: '#FFF0EC',
  gold: '#B27A10',
  goldSoft: '#FFF4D8',
  text: '#263750',
  muted: '#66758B',
  line: '#D7E1EC',
  white: '#FFFFFF',
}

const asDataUri = (file) => {
  const ext = path.extname(file).slice(1).toLowerCase()
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
}

const bgData = asDataUri(BG_PATH)
const prototypeData = `data:image/jpeg;base64,${fs.readFileSync(PROTOTYPE_PATH).toString('base64')}`
const qrData = asDataUri(QR_PATH)

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const text = (value, x, y, options = {}) => {
  const {
    size = 26,
    weight = 400,
    color = C.text,
    anchor = 'start',
    letterSpacing = 0,
    opacity = 1,
    italic = false,
  } = options
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" letter-spacing="${letterSpacing}" opacity="${opacity}"${italic ? ' font-style="italic"' : ''}>${esc(value)}</text>`
}

const lines = (values, x, y, options = {}) => {
  const { size = 26, lineHeight = Math.round(size * 1.25), weight = 400, color = C.text, anchor = 'start', italic = false } = options
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}>${values.map((value, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(value)}</tspan>`).join('')}</text>`
}

const roundedRect = (x, y, w, h, fill, stroke = 'none', radius = 24, strokeWidth = 1, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${extra}/>`

const pill = (label, x, y, width, fill, color) =>
  `${roundedRect(x, y, width, 42, fill, 'none', 21)}${text(label, x + width / 2, y + 28, { size: 17, weight: 700, color, anchor: 'middle', letterSpacing: 1.2 })}`

const pageHeader = (number, label = 'CLEARFLOW.AI · PROPOSAL') =>
  `${pill(number, 76, 42, 58, C.navy, C.white)}${text(label, 1520, 70, { size: 16, weight: 700, color: C.muted, anchor: 'end', letterSpacing: 1.8 })}`

const card = (x, y, w, h, fill = C.white, stroke = C.line, radius = 28) =>
  roundedRect(x, y, w, h, fill, stroke, radius, 1.2, 'filter="url(#shadow)"')

const badgeCircle = (label, cx, cy, fill, color, radius = 30) =>
  `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}"/>${text(label, cx, cy + 8, { size: 22, weight: 800, color, anchor: 'middle' })}`

const baseSvg = (content, options = {}) => {
  const { darkOverlay = false } = options
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0B1C30" flood-opacity="0.10"/></filter>
      <clipPath id="prototypeClip"><rect x="92" y="168" width="350" height="660" rx="30"/></clipPath>
    </defs>
    <image href="${bgData}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
    ${darkOverlay ? '<rect width="1600" height="900" fill="#0B1C30" opacity="0.03"/>' : ''}
    ${content}
  </svg>`
}

const slideSvgs = [
  baseSvg(`
    ${pill('AI SOLUTIONS FOR SMEs · UMKM CIREBON', 82, 58, 390, C.blueSoft, C.blue)}
    ${text('01', 1515, 84, { size: 22, weight: 800, color: C.muted, anchor: 'end' })}
    ${text('ClearFlow.AI', 84, 215, { size: 78, weight: 800, color: C.navy })}
    ${lines(['Pembukuan yang mengalir,', 'keputusan yang lebih jernih.'], 84, 302, { size: 46, lineHeight: 54, weight: 700, color: C.blue })}
    ${lines(['Asisten pembukuan cerdas untuk membantu UMKM', 'memisahkan uang usaha dan uang pribadi.'], 86, 438, { size: 25, lineHeight: 34, color: C.text })}
    ${roundedRect(84, 675, 650, 104, '#FFFFFFCC', C.line, 22, 1)}
    ${text('Fatimah Azzahra', 112, 718, { size: 23, weight: 800, color: C.navy })}
    ${text('UIN Cyber Cirebon  ·  Pengusul ClearFlow.AI', 112, 756, { size: 19, color: C.muted })}

    ${card(860, 128, 650, 640, '#0B1C30F2', '#0B1C30', 36)}
    ${pill('CERITA TRANSAKSI', 910, 176, 218, '#1B3D60', '#BBD8FF')}
    ${roundedRect(910, 245, 550, 112, '#FFFFFF', 'none', 22)}
    ${lines(['“Jualan 300rb, beli plastik 50rb,', 'lalu jajan 15rb pakai uang sendiri.”'], 940, 290, { size: 22, lineHeight: 31, color: C.text })}
    ${badgeCircle('→', 1185, 405, C.blue, C.white, 28)}
    ${roundedRect(910, 458, 255, 174, '#E4F8EE', 'none', 24)}
    ${text('KAS USAHA', 942, 504, { size: 17, weight: 800, color: C.teal, letterSpacing: 1.3 })}
    ${text('+Rp250.000', 942, 563, { size: 34, weight: 800, color: C.teal })}
    ${text('Penjualan − bahan', 942, 604, { size: 17, color: C.muted })}
    ${roundedRect(1205, 458, 255, 174, '#FFF0EC', 'none', 24)}
    ${text('KAS PRIBADI', 1237, 504, { size: 17, weight: 800, color: C.coral, letterSpacing: 1.3 })}
    ${text('−Rp15.000', 1237, 563, { size: 34, weight: 800, color: C.coral })}
    ${text('Jajan pribadi', 1237, 604, { size: 17, color: C.muted })}
    ${text('Beberapa transaksi → satu gambaran kas yang jernih', 1185, 704, { size: 18, weight: 600, color: '#D7E7FA', anchor: 'middle' })}
  `),

  baseSvg(`
    ${pageHeader('02')}
    ${lines(['Ketika Uang Usaha dan Pribadi Berbaur,', 'Keputusan Jadi Kabur.'], 80, 150, { size: 47, lineHeight: 53, weight: 800, color: C.navy })}
    ${text('TIGA POLA MASALAH YANG PALING RELEVAN BAGI UMKM CIREBON', 82, 248, { size: 18, weight: 800, color: C.blue, letterSpacing: 1.4 })}

    ${card(80, 286, 455, 292)}
    ${badgeCircle('01', 132, 338, C.blueSoft, C.blue, 28)}
    ${text('Pencatatan belum rapi', 178, 347, { size: 26, weight: 800, color: C.navy })}
    ${lines(['Transaksi harian masih mengandalkan', 'ingatan, catatan acak, atau chat', 'pribadi yang sulit ditelusuri.'], 112, 414, { size: 21, lineHeight: 31, color: C.text })}

    ${card(572, 286, 455, 292)}
    ${badgeCircle('02', 624, 338, C.tealSoft, C.teal, 28)}
    ${text('Kas bercampur', 670, 347, { size: 26, weight: 800, color: C.navy })}
    ${lines(['Pengeluaran rumah tangga dan', 'operasional usaha sulit dibedakan,', 'sehingga modal mudah terpakai.'], 604, 414, { size: 21, lineHeight: 31, color: C.text })}

    ${card(1064, 286, 455, 292)}
    ${badgeCircle('03', 1116, 338, C.coralSoft, C.coral, 28)}
    ${text('Laba/rugi kabur', 1162, 347, { size: 26, weight: 800, color: C.navy })}
    ${lines(['Usaha terasa ramai, tetapi pemilik', 'belum mengetahui kondisi kas dan', 'hasil usaha yang sebenarnya.'], 1096, 414, { size: 21, lineHeight: 31, color: C.text })}

    ${roundedRect(80, 625, 1439, 158, C.navy, 'none', 28)}
    ${pill('AKIBATNYA', 112, 662, 150, '#1E4268', '#CDE1FB')}
    ${lines(['Pelaku UMKM sulit menjaga modal kerja, mengevaluasi pengeluaran,', 'dan menentukan langkah pengembangan usaha dengan percaya diri.'], 300, 683, { size: 27, lineHeight: 38, weight: 700, color: C.white })}
    ${text('Sumber masalah: Case Brief AI Solutions for SMEs · materi bootcamp UMKM Cirebon', 82, 842, { size: 16, color: C.muted })}
  `),

  baseSvg(`
    ${pageHeader('03')}
    ${lines(['ClearFlow.AI Mengubah Cerita Transaksi', 'Menjadi Kejelasan Finansial.'], 80, 150, { size: 47, lineHeight: 53, weight: 800, color: C.navy })}

    ${card(80, 272, 342, 400)}
    ${badgeCircle('1', 130, 322, C.blue, C.white, 28)}
    ${text('Ceritakan', 176, 332, { size: 26, weight: 800, color: C.navy })}
    ${roundedRect(112, 384, 278, 94, C.blueSoft, 'none', 20)}
    ${lines(['“Jualan 300rb,', 'beli plastik 50rb…”'], 139, 421, { size: 21, lineHeight: 29, weight: 700, color: C.blue })}
    ${lines(['Pengguna mengetik seperti', 'sedang mengirim pesan.'], 112, 535, { size: 20, lineHeight: 30, color: C.text })}

    ${text('→', 447, 478, { size: 42, weight: 800, color: C.blue, anchor: 'middle' })}
    ${card(472, 272, 342, 400)}
    ${badgeCircle('2', 522, 322, C.teal, C.white, 28)}
    ${text('Ekstraksi', 568, 332, { size: 26, weight: 800, color: C.navy })}
    ${pill('TANGGAL', 505, 392, 104, C.tealSoft, C.teal)}
    ${pill('NOMINAL', 619, 392, 104, C.tealSoft, C.teal)}
    ${pill('KATEGORI', 733, 392, 104, C.tealSoft, C.teal)}
    ${lines(['Sistem menyiapkan struktur', 'tanggal, nominal, arus kas,', 'sumber dana, dan kategori.'], 504, 504, { size: 20, lineHeight: 30, color: C.text })}

    ${text('→', 839, 478, { size: 42, weight: 800, color: C.blue, anchor: 'middle' })}
    ${card(864, 272, 342, 400)}
    ${badgeCircle('3', 914, 322, C.gold, C.white, 28)}
    ${text('Konfirmasi', 960, 332, { size: 26, weight: 800, color: C.navy })}
    ${roundedRect(896, 388, 278, 92, C.goldSoft, 'none', 20)}
    ${text('?', 933, 446, { size: 43, weight: 800, color: C.gold })}
    ${lines(['Transaksi ambigu', 'ditandai untuk', 'ditinjau.'], 990, 416, { size: 18, lineHeight: 24, weight: 700, color: C.gold })}
    ${lines(['Pengguna tetap memegang', 'kendali sebelum menyimpan.'], 896, 535, { size: 20, lineHeight: 30, color: C.text })}

    ${text('→', 1231, 478, { size: 42, weight: 800, color: C.blue, anchor: 'middle' })}
    ${card(1256, 272, 264, 400)}
    ${badgeCircle('4', 1306, 322, C.navy, C.white, 28)}
    ${text('Ringkasan', 1352, 332, { size: 25, weight: 800, color: C.navy })}
    ${roundedRect(1288, 388, 200, 94, C.tealSoft, 'none', 20)}
    ${text('USAHA', 1312, 424, { size: 17, weight: 800, color: C.teal })}
    ${text('+250rb', 1312, 462, { size: 27, weight: 800, color: C.teal })}
    ${roundedRect(1288, 498, 200, 94, C.coralSoft, 'none', 20)}
    ${text('PRIBADI', 1312, 534, { size: 17, weight: 800, color: C.coral })}
    ${text('−15rb', 1312, 572, { size: 27, weight: 800, color: C.coral })}

    ${roundedRect(80, 720, 1440, 92, '#EAF2FF', '#C7DDFB', 22, 1)}
    ${badgeCircle('✓', 132, 766, C.blue, C.white, 24)}
    ${text('AI membantu merapikan data — keputusan akhir tetap berada di tangan pengguna.', 178, 775, { size: 25, weight: 700, color: C.navy })}
  `),

  baseSvg(`
    ${pageHeader('04')}
    ${lines(['Dari Kalimat Sehari-hari ke Catatan', 'yang Bisa Ditindaklanjuti.'], 510, 142, { size: 44, lineHeight: 50, weight: 800, color: C.navy })}
    ${roundedRect(72, 146, 390, 702, '#0B1C30', 'none', 38, 0, 'filter="url(#shadow)"')}
    <image href="${prototypeData}" x="92" y="168" width="350" height="660" preserveAspectRatio="xMidYMin slice" clip-path="url(#prototypeClip)"/>

    ${pill('PROTOTYPE LIVE', 512, 268, 184, C.blueSoft, C.blue)}
    ${text('Alur utama sudah berjalan end-to-end', 512, 344, { size: 31, weight: 800, color: C.navy })}

    ${card(512, 386, 285, 164, C.white, C.line, 24)}
    ${badgeCircle('1', 552, 426, C.blueSoft, C.blue, 23)}
    ${text('Input bebas', 590, 435, { size: 22, weight: 800, color: C.navy })}
    ${lines(['Bahasa sehari-hari', 'menjadi draft transaksi.'], 540, 485, { size: 18, lineHeight: 27, color: C.text })}

    ${card(824, 386, 285, 164, C.white, C.line, 24)}
    ${badgeCircle('2', 864, 426, C.tealSoft, C.teal, 23)}
    ${text('Tinjau', 902, 435, { size: 22, weight: 800, color: C.navy })}
    ${lines(['Nominal, kategori,', 'dan sumber dana dicek.'], 852, 485, { size: 18, lineHeight: 27, color: C.text })}

    ${card(1136, 386, 285, 164, C.white, C.line, 24)}
    ${badgeCircle('3', 1176, 426, C.goldSoft, C.gold, 23)}
    ${text('Simpan', 1214, 435, { size: 22, weight: 800, color: C.navy })}
    ${lines(['Data tersimpan realtime', 'di Cloud Firestore.'], 1164, 485, { size: 18, lineHeight: 27, color: C.text })}

    ${roundedRect(512, 596, 695, 176, C.navy, 'none', 28)}
    ${text('KONTROL PENGGUNA', 548, 638, { size: 17, weight: 800, color: '#AFCFF7', letterSpacing: 1.5 })}
    ${lines(['Tidak ada transaksi tersimpan sebelum pengguna', 'menekan konfirmasi. Riwayat juga dapat dihapus.'], 548, 686, { size: 24, lineHeight: 34, weight: 700, color: C.white })}

    ${roundedRect(1240, 588, 280, 226, '#FFFFFF', C.line, 28, 1.2, 'filter="url(#shadow)"')}
    <image href="${qrData}" x="1280" y="610" width="145" height="145"/>
    ${text('SCAN DEMO', 1352, 790, { size: 17, weight: 800, color: C.blue, anchor: 'middle', letterSpacing: 1.2 })}
    ${text('clearfloww.web.app', 1518, 842, { size: 17, weight: 700, color: C.blue, anchor: 'end' })}
  `),

  baseSvg(`
    ${pageHeader('05')}
    ${lines(['Uji Coba 30 Hari untuk Membuktikan', 'Kebiasaan, Bukan Sekadar Fitur.'], 80, 150, { size: 47, lineHeight: 53, weight: 800, color: C.navy })}
    ${text('RENCANA PILOT UMKM CIREBON', 82, 248, { size: 18, weight: 800, color: C.blue, letterSpacing: 1.4 })}

    ${roundedRect(80, 292, 1440, 244, '#FFFFFFCC', C.line, 30, 1.2)}
    <line x1="230" y1="390" x2="1368" y2="390" stroke="${C.line}" stroke-width="8" stroke-linecap="round"/>
    <line x1="230" y1="390" x2="793" y2="390" stroke="${C.blue}" stroke-width="8" stroke-linecap="round"/>
    ${badgeCircle('1', 230, 390, C.blue, C.white, 34)}
    ${badgeCircle('2', 800, 390, C.teal, C.white, 34)}
    ${badgeCircle('3', 1368, 390, C.navy, C.white, 34)}
    ${text('MINGGU 1', 230, 340, { size: 17, weight: 800, color: C.blue, anchor: 'middle', letterSpacing: 1.2 })}
    ${text('Onboarding & baseline', 230, 460, { size: 24, weight: 800, color: C.navy, anchor: 'middle' })}
    ${text('Kenali kebiasaan pencatatan awal', 230, 493, { size: 17, color: C.muted, anchor: 'middle' })}
    ${text('MINGGU 2–3', 800, 340, { size: 17, weight: 800, color: C.teal, anchor: 'middle', letterSpacing: 1.2 })}
    ${text('Pemakaian harian', 800, 460, { size: 24, weight: 800, color: C.navy, anchor: 'middle' })}
    ${text('Catat, konfirmasi, dan beri umpan balik', 800, 493, { size: 17, color: C.muted, anchor: 'middle' })}
    ${text('MINGGU 4', 1368, 340, { size: 17, weight: 800, color: C.navy, anchor: 'middle', letterSpacing: 1.2 })}
    ${text('Evaluasi & iterasi', 1368, 460, { size: 24, weight: 800, color: C.navy, anchor: 'middle' })}
    ${text('Ukur manfaat dan perbaiki alur', 1368, 493, { size: 17, color: C.muted, anchor: 'middle' })}

    ${text('TARGET VALIDASI', 82, 602, { size: 18, weight: 800, color: C.blue, letterSpacing: 1.4 })}
    ${card(80, 632, 330, 150, C.blueSoft, '#C4D9FB', 24)}
    ${text('10 UMKM', 112, 688, { size: 34, weight: 800, color: C.blue })}
    ${text('diundang mengikuti pilot', 112, 735, { size: 19, color: C.text })}
    ${card(450, 632, 330, 150, C.tealSoft, '#BDE9DA', 24)}
    ${text('≥70%', 482, 688, { size: 34, weight: 800, color: C.teal })}
    ${text('aktif mencatat ≥3× per minggu', 482, 735, { size: 19, color: C.text })}
    ${card(820, 632, 330, 150, C.goldSoft, '#F0D89C', 24)}
    ${text('≥80%', 852, 688, { size: 34, weight: 800, color: C.gold })}
    ${text('draft ditinjau pengguna', 852, 735, { size: 19, color: C.text })}
    ${card(1190, 632, 330, 150, C.coralSoft, '#F1C7BD', 24)}
    ${text('≥4/5', 1222, 688, { size: 34, weight: 800, color: C.coral })}
    ${text('skor kejelasan arus kas', 1222, 735, { size: 19, color: C.text })}
    ${text('Catatan: seluruh angka di atas adalah target uji coba, bukan capaian saat ini.', 82, 842, { size: 17, color: C.muted, italic: true })}
  `),

  baseSvg(`
    ${pageHeader('06', 'CLEARFLOW.AI · DAMPAK & AJAKAN')}
    ${roundedRect(70, 112, 930, 686, C.navy, 'none', 38, 0, 'filter="url(#shadow)"')}
    ${pill('DAMPAK YANG DITUJU', 118, 158, 250, '#1E4268', '#CDE1FB')}
    ${lines(['Bukan Sekadar Mencatat.', 'ClearFlow.AI Membantu', 'UMKM Melihat Arah.'], 118, 260, { size: 49, lineHeight: 57, weight: 800, color: C.white })}
    ${lines(['Dari transaksi harian yang berantakan', 'menuju keputusan usaha yang lebih jernih.'], 120, 480, { size: 26, lineHeight: 38, color: '#D5E3F4' })}
    ${roundedRect(118, 620, 808, 120, '#153451', '#2B5378', 24, 1)}
    ${text('PROTOTYPE SIAP DIUJI', 152, 665, { size: 18, weight: 800, color: '#9CC6FA', letterSpacing: 1.5 })}
    ${text('Bersama UMKM Cirebon', 152, 710, { size: 31, weight: 800, color: C.white })}

    ${card(1040, 142, 480, 158, C.white, C.line, 26)}
    ${badgeCircle('01', 1092, 194, C.blueSoft, C.blue, 27)}
    ${text('Arus kas transparan', 1138, 203, { size: 25, weight: 800, color: C.navy })}
    ${lines(['Pemasukan dan pengeluaran', 'lebih cepat terlihat.'], 1072, 248, { size: 19, lineHeight: 28, color: C.text })}

    ${card(1040, 326, 480, 158, C.white, C.line, 26)}
    ${badgeCircle('02', 1092, 378, C.tealSoft, C.teal, 27)}
    ${text('Modal lebih terpantau', 1138, 387, { size: 25, weight: 800, color: C.navy })}
    ${lines(['Catatan terpisah membantu', 'kas usaha lebih mudah dijaga.'], 1072, 432, { size: 19, lineHeight: 28, color: C.text })}

    ${card(1040, 510, 480, 158, C.white, C.line, 26)}
    ${badgeCircle('03', 1092, 562, C.coralSoft, C.coral, 27)}
    ${text('Mudah diadopsi', 1138, 571, { size: 25, weight: 800, color: C.navy })}
    ${lines(['Mulai mencatat tanpa rumus', 'akuntansi yang rumit.'], 1072, 616, { size: 19, lineHeight: 28, color: C.text })}

    ${roundedRect(1040, 710, 480, 88, C.blue, 'none', 24)}
    ${text('Butuh: mitra pilot · mentor · feedback', 1280, 765, { size: 21, weight: 800, color: C.white, anchor: 'middle' })}
    ${text('clearfloww.web.app  ·  Q&A', 1520, 852, { size: 18, weight: 700, color: C.blue, anchor: 'end' })}
  `, { darkOverlay: true }),
]

async function build() {
  const pngPaths = []
  for (let index = 0; index < slideSvgs.length; index += 1) {
    const pngPath = path.join(RENDER_DIR, `slide-${index + 1}.png`)
    await sharp(Buffer.from(slideSvgs[index]))
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(pngPath)
    pngPaths.push(pngPath)
  }

  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'Fatimah Azzahra'
  pptx.subject = 'Proposal ClearFlow.AI untuk UMKM Cirebon'
  pptx.title = 'ClearFlow.AI Pitch Deck — 6 Slides'
  pptx.company = 'UIN Cyber Cirebon'
  pptx.lang = 'id-ID'
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
    lang: 'id-ID',
  }

  pngPaths.forEach((pngPath, index) => {
    const slide = pptx.addSlide()
    slide.background = { color: 'F8F5EF' }
    slide.addImage({
      path: pngPath,
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      altText: `ClearFlow.AI slide ${index + 1}`,
    })
    if (index === 3) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 10.67,
        y: 5.08,
        w: 1.25,
        h: 1.3,
        fill: { color: 'FFFFFF', transparency: 100 },
        line: { color: 'FFFFFF', transparency: 100 },
        hyperlink: { url: 'https://clearfloww.web.app' },
      })
    }
  })

  await pptx.writeFile({ fileName: OUTPUT })
  console.log(JSON.stringify({ output: OUTPUT, slides: pngPaths }, null, 2))
}

build().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
