# ClearFlow.AI

Mobile-first web app untuk pilot pembukuan UMKM selama 30 hari. Pengguna dapat masuk dengan Google, email, atau akun tamu; menyiapkan profil singkat; mengikuti panduan hanya saat usaha baru dibuat; mencatat modal dan transaksi melalui Firebase AI Logic atau formulir manual; meninjau draft; membuka riwayat Kas Usaha dan Dana Pribadi secara terpisah; mengedit/menghapus transaksi; serta mengunduh CSV.

## Jalankan lokal

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Variabel lokal:

- `VITE_ENABLE_GOOGLE_AUTH=true` hanya setelah provider Google diaktifkan.
- `VITE_FIREBASE_APPCHECK_SITE_KEY` diisi dengan site key reCAPTCHA Enterprise untuk aplikasi web.
- `VITE_FIREBASE_APPCHECK_DEBUG=true` hanya untuk pengembangan lokal; daftarkan debug token di Firebase Console dan jangan kirim token pada build production.
- `VITE_USE_FIREBASE_EMULATORS=true` mengarahkan Auth dan Firestore ke emulator saat mode development.

## Pemeriksaan kualitas

```powershell
npm run check
npm run test:e2e
```

`npm run check` menjalankan lint, unit test parser, dan build production. `npm run test:e2e` menjalankan alur browser pada URL live: setup singkat dari data kosong, panduan pengguna baru, pemisahan riwayat usaha/pribadi, simpan/edit/hapus transaksi, pembersihan akun uji, serta ekstraksi Gemini dengan App Check.

Emulator Firebase gratis sudah disiapkan di `firebase.json`:

```powershell
$env:VITE_USE_FIREBASE_EMULATORS='true'
firebase emulators:start --only auth,firestore,hosting
npm run dev
```

## Layanan Firebase yang dipakai

- Authentication: Google, email/password, dan anonymous.
- Cloud Firestore: profil usaha dan maksimal 500 transaksi terbaru pada listener aplikasi, dengan persistent local cache.
- Firebase AI Logic: Gemini Developer API free tier dan structured JSON untuk membuat draft transaksi.
- App Check: reCAPTCHA Enterprise dengan enforcement aktif untuk Authentication, Firestore, dan AI Logic.
- Remote Config: mengubah model AI, mematikan AI, dan mengatur batas draft tanpa rilis ulang.
- Hosting: SPA hosting, HTTPS, cache policy, dan security headers.
- Analytics: event tur dan performa ekstraksi AI (mesin, durasi, panjang input dalam kelompok, jumlah draft, dan jumlah tinjauan) tanpa isi cerita atau nominal transaksi.
- Performance Monitoring: pemantauan waktu muat dan request aplikasi.
- Local Emulator Suite: pengembangan Auth, Firestore, dan Hosting tanpa menyentuh data production.

Cloud Functions dan Cloud Storage sengaja tidak dipakai pada pilot ini karena alur utama tidak membutuhkannya dan keduanya dapat memerlukan pengaturan billing tambahan.

## Skema data Firestore

```text
businesses/{uid}
  ownerId, ownerName, name, businessType, city
  bookkeepingStartDate
  openingBusinessBalance, openingPersonalBalance
  aiProcessingConsent, onboardingCompleted, productTourVersion
  timezone, currency, plan, schemaVersion
  createdAt, updatedAt

businesses/{uid}/transactions/{transactionId}
  date, description, amount, flow, fund, category
  status, source, confidence, model?, schemaVersion
  createdAt, updatedAt
```

Setiap dokumen usaha menggunakan UID Firebase Authentication sebagai ID. Firestore Security Rules menolak akses pengguna lain, field tambahan, nilai di luar batas, perubahan owner, dan perubahan `createdAt`.

## Deploy pilot

```powershell
npm run build
firebase deploy --only firestore:rules,remoteconfig,hosting --project clearfloww
```

Provider Google, email/password, dan anonymous diaktifkan pada Firebase Authentication. Domain yang diizinkan adalah `localhost`, `clearfloww.firebaseapp.com`, dan `clearfloww.web.app`. Jika membuat project Firebase baru, konfigurasi provider ini dilakukan dari Firebase Console sebelum deploy pertama.

Production saat ini tersedia di <https://clearfloww.web.app>. App Check sudah enforced setelah alur login, pembacaan/penulisan Firestore, dan satu permintaan Firebase AI Logic berhasil diuji dari domain production.

## Batas produk

- Hasil Gemini atau parser selalu berupa draft dan memerlukan konfirmasi pengguna.
- Parser lokal serta formulir manual menjaga aplikasi tetap dapat dipakai saat AI/kuota/koneksi bermasalah.
- Ringkasan bukan laporan akuntansi atau pajak resmi.
- Akun tamu terikat pada browser; pengguna disarankan menghubungkan email sebelum memakai aplikasi untuk data penting.
