# Operasional Pilot ClearFlow.AI — 30 Hari

Panduan ini dibuat agar aplikasi dapat dijaga oleh orang non-teknis selama uji coba. URL production: <https://clearfloww.web.app>.

## Yang sudah aktif

| Layanan | Kegunaan | Status |
|---|---|---|
| Firebase Hosting | Menayangkan web app dengan HTTPS | Aktif |
| Firebase Authentication | Login Google, email/password, dan mode tamu | Aktif |
| Cloud Firestore | Profil usaha dan transaksi asli per pengguna | Aktif |
| Firebase AI Logic | Mengubah cerita transaksi menjadi draft Gemini | Aktif |
| Firebase App Check | Menolak request dari aplikasi palsu | Enforced pada Auth, Firestore, dan AI Logic |
| Remote Config | Tombol darurat AI, pilihan model, dan batas draft | Aktif |
| Analytics + Performance | Event teknis dan performa tanpa isi transaksi | Aktif |
| Emulator Suite | Pengujian lokal tanpa menyentuh production | Siap |

Realtime Database, Cloud Storage, Cloud Functions, dan login SMS tidak dipakai karena belum dibutuhkan oleh alur pilot. Data utama hanya disimpan di Firestore agar tidak ada dua database yang harus dirawat.

## Cek harian — sekitar 5 menit

1. Buka URL production dari ponsel.
2. Pilih **Coba tanpa akun**, isi profil singkat, lalu catat modal awal sebagai transaksi manual.
3. Buka **Riwayat**, periksa tab **Kas Usaha** dan **Dana Pribadi**, lalu coba edit dan hapus transaksi.
4. Buka profil, lalu pilih **Hapus akun dan semua data** supaya record pengecekan tidak tertinggal.
5. Di Firebase Console, lihat Firestore Usage, Hosting Usage, Authentication Usage, AI Logic Usage, dan App Check Metrics.

Jangan memakai akun atau transaksi peserta untuk pengecekan teknis.

## Cek mingguan

Jalankan dari folder proyek:

```powershell
npm run check
npm run test:e2e
```

Pastikan hasilnya:

- lint tidak memiliki error;
- 4 unit test parser lulus;
- build production selesai;
- 2 browser test live lulus;
- tidak ada profil `Warung Uji Bersih` yang tertinggal setelah test.

Minta peserta mengunduh CSV dari menu **Riwayat** minimal sekali seminggu. Backup/restore Firestore terkelola memerlukan billing, sehingga CSV adalah salinan gratis yang paling sederhana untuk pilot ini.

## Batas gratis yang perlu dipantau

- Firestore: 1 GiB data, 50.000 read/hari, 20.000 write/hari, 20.000 delete/hari, dan 10 GiB transfer/bulan.
- Hosting: 10 GB penyimpanan dan 10 GB transfer/bulan.
- Authentication Spark: 3.000 pengguna aktif harian untuk email/anonymous; reset password 150 email/hari.
- Remote Config: mulai 1 September 2026, Spark mencakup sampai 100.000 fetch/hari.
- reCAPTCHA Enterprise untuk App Check: 10.000 assessment/bulan tanpa biaya.
- Firebase AI Logic dengan Gemini Developer API memiliki free tier; lihat halaman Usage and limits karena kuota model dapat berubah.

Tautan resmi: [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing), [Authentication limits](https://firebase.google.com/docs/auth/limits), [Remote Config pricing](https://firebase.google.com/docs/remote-config/pricing), [AI Logic pricing](https://firebase.google.com/docs/ai-logic/pricing), dan [App Check reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-provider).

## Tombol darurat

Jika Gemini error atau kuota hampir habis:

1. Buka Firebase Console → Remote Config.
2. Ubah `ai_enabled` menjadi `false`.
3. Publish perubahan.
4. Pengguna tetap dapat mencatat melalui **Isi manual**.

Jika satu input terlalu berat, turunkan `max_transactions_per_input`. Jika model bermasalah, ganti `ai_model` hanya ke nama model yang tercantum pada dokumentasi Firebase AI Logic saat itu.

Jika versi web baru bermasalah, buka Firebase Hosting → Release history dan rollback ke release sebelumnya. Jangan mematikan Firestore Rules atau App Check untuk menyelesaikan error tampilan.

## Aturan data selama pilot

- Mulai setiap akun dengan data kosong; jangan menambahkan seed/demo ke production.
- Panduan otomatis hanya muncul setelah usaha baru dibuat. Login ulang pada akun yang sudah memiliki profil/data tidak memunculkannya lagi; panduan tetap dapat dibuka dari Profil → Bantuan.
- Jangan memasukkan nomor kartu, PIN, kata sandi, NIK, atau data rahasia lain ke cerita transaksi.
- Gemini hanya membuat draft. Pengguna wajib memeriksa nominal, sumber dana, kategori, dan arus kas sebelum menyimpan.
- Pengguna dapat menghapus satu transaksi, seluruh riwayat transaksi, atau akun beserta seluruh datanya.
- Akun tamu hanya aman di browser yang sama. Hubungkan email sebelum dipakai untuk catatan penting.
