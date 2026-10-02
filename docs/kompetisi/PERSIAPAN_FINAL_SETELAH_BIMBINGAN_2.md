# Contekan Final ClearFlow.AI Setelah Bimbingan Kedua

## Tiga kalimat yang harus hafal

### Teknik AI

> ClearFlow memakai information extraction berbasis Gemini dengan structured JSON output. Cerita transaksi dan konteks usaha diproses menjadi draft berskema, lalu aplikasi memvalidasi hasilnya. Pengguna tetap memeriksa sebelum transaksi disimpan ke Firestore.

### Keamanan dan kendali pengguna

> Cerita mentah tidak disimpan sebagai percakapan. Hasil AI hanya draft; informasi ambigu ditandai untuk ditinjau dan keputusan akhir tetap berada di tangan pengguna.

### Bisnis

> Selama pilot kami mengukur permintaan AI per pengguna, biaya rata-rata per permintaan, dan kesediaan membayar. Batas input-output, fallback parser, mode manual, serta Remote Config membantu menjaga biaya agar pendapatan per pengguna tetap lebih besar daripada biaya layanan.

## Jika juri bertanya “teknik AI-nya apa?”

Jawab:

> Teknik utamanya adalah structured information extraction berbasis large language model. Kami memakai prompt dengan konteks dan aturan nominal Indonesia, membatasi keluaran dengan JSON schema, memvalidasi hasilnya di aplikasi, lalu memakai human-in-the-loop untuk koreksi sebelum penyimpanan.

Jangan hanya menjawab:

> “Teksnya dilempar ke Gemini.”

## Jika juri bertanya “bagaimana tahu AI-nya benar?”

Jawab dengan angka hasil evaluasi yang benar-benar sudah diukur:

> Kami menguji [JUMLAH] cerita transaksi. Akurasi nominal [X]%, arus kas [Y]%, sumber dana [Z]%, median waktu respons [T] detik, dan [K]% draft perlu dikoreksi pengguna.

Jika evaluasi belum selesai, jangan mengisi angka. Katakan bahwa evaluasi sedang dijalankan dengan dataset tetap dan jelaskan metriknya.

## Jika juri bertanya “kalau Gemini berbayar, nanti rugi?”

Jawab:

> Kami menghitung biaya per pengguna dari jumlah permintaan, panjang input-output, dan harga model. Angka itu dibandingkan dengan pendapatan paket atau sponsor. Produk juga membatasi input-output, menyediakan parser lokal dan mode manual, serta dapat mengganti atau mematikan model lewat Remote Config agar biaya terkendali.

## Jika juri bertanya “kenapa harus login?”

Jawab:

> Karena pencatatan keuangan perlu tersimpan dan hanya boleh diakses pemiliknya. Login mengikat data Firestore ke UID pengguna, sehingga riwayat dapat dibuka kembali dan terpisah dari akun lain. Untuk pengalaman sederhana kami menyiapkan Google Login, email, dan akun tamu yang dapat dihubungkan kemudian.

Catatan tim: Google Login masih disembunyikan oleh konfigurasi production. Aktifkan dan uji dahulu sebelum kalimat di atas dipakai sebagai klaim demo live.

## Alur demo 60–90 detik

1. Masuk dengan jalur login yang benar-benar aktif.
2. Tunjukkan data awal kosong.
3. Ketik: `Jualan 300rb masuk kas usaha, lalu beli bahan 1 jt pakai uang pribadi.`
4. Tunjukkan dua draft terpisah.
5. Tunjukkan nominal `1 jt` menjadi `Rp1.000.000`.
6. Periksa kategori, arus kas, dan sumber dana.
7. Konfirmasi lalu buka riwayat.
8. Edit satu transaksi dan hapus satu transaksi.
9. Tutup dengan dashboard kas usaha versus dana pribadi.

## Checklist H-1

- [ ] Hasil survei sudah diringkas menjadi angka dan kutipan anonim.
- [ ] Dataset evaluasi AI sudah dijalankan.
- [ ] Angka akurasi dan waktu respons sudah aktual.
- [ ] Model Gemini yang dipakai sudah dipastikan.
- [ ] Harga model dicek dari sumber resmi pada hari perhitungan.
- [ ] Unit economics satu pengguna sudah dihitung.
- [ ] Google Login sudah aktif dan lolos smoke test jika akan didemokan.
- [ ] Lokasi pilot sudah konsisten: Kuningan atau Cirebon berdasarkan data nyata.
- [ ] Slide 3 menjelaskan teknik AI.
- [ ] Slide 5 menjelaskan bisnis dan biaya.
- [ ] Pitch selesai maksimal lima menit.
- [ ] Video/screenshot demo cadangan tersedia.

