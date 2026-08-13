# Contekan Mentoring ClearFlow.AI

## Baca ini 5 menit sebelum Zoom

### Jawaban kalau ditanya "web ini dibuat pakai apa?"

> Saya membuatnya dengan Codex melalui vibe coding. Tampilan memakai React, TypeScript, dan Vite. Data nyata disimpan di Cloud Firestore, pengguna diberi identitas anonim, akses data dibatasi dengan Security Rules, dan web dipublikasikan lewat Firebase Hosting.

### Cerita produk dalam 30 detik

> Banyak UMKM masih mencampur uang usaha dan pribadi serta tidak rutin mencatat karena pembukuan terasa rumit. ClearFlow.AI membuat pencatatan terasa seperti bercerita melalui chat. Sistem menyiapkan draft transaksi, pengguna memeriksa dan mengonfirmasi, lalu data baru disimpan. Prototype sudah online dan siap diuji bersama UMKM Cirebon.

### Alur produk dalam satu napas

> Cerita transaksi -> draft terstruktur -> pengguna meninjau -> pengguna mengonfirmasi -> Firestore menyimpan -> dashboard memperbarui ringkasan.

### Rumus prompt lima jari

1. Siapa perannya?
2. Apa tugasnya?
3. Apa konteks dan datanya?
4. Apa aturan atau batasannya?
5. Apa format keluarannya?

### Batas prototype yang harus disampaikan jujur

> Penyimpanan, dashboard, konfirmasi, ekspor, penghapusan, dan keamanan dasar sudah nyata. Pembacaan kalimat saat ini masih parser berbasis aturan. Integrasi LLM yang lebih fleksibel adalah pengembangan berikutnya.

### Bukti bahwa manusia tidak cuma menekan tombol

- Memutuskan aplikasi harus mulai tanpa data palsu.
- Memindahkan penyimpanan dari browser ke Firestore.
- Menambahkan identitas pengguna dan aturan akses.
- Menambahkan hapus satu transaksi dan hapus seluruh riwayat.
- Memperbaiki klaim agar tidak mengaku memakai LLM yang belum terpasang.

## Susunan mentoring 15 menit

- Menit 0-1: cerita masalah dan solusi.
- Menit 1-3: tunjukkan alur web dengan satu contoh transaksi.
- Menit 3-4: sebutkan batas prototype secara jujur.
- Menit 4-12: ajukan pertanyaan mentor.
- Menit 12-15: ulangi masukan mentor dengan kata sendiri dan catat tiga tindakan utama.

## Pertanyaan untuk Pak Dody

1. Apakah lapisan AI perlu sudah terhubung saat final, atau roadmap dan evaluasinya boleh dijelaskan sebagai tahap berikutnya?
2. Apakah alur human-in-the-loop kami sudah cukup kuat?
3. Bukti prompt dan iterasi seperti apa yang paling meyakinkan untuk penilaian?
4. Dari integrasi LLM, uji akurasi, dan pilot pengguna, mana yang harus diprioritaskan sebelum final?
5. Dari total sekitar 10 menit final, berapa pembagian pitch, demo, dan tanya jawab?

## Pertanyaan untuk Pak Bayu

1. Apakah target "UMKM mikro yang belum rutin mencatat dan mencampur kas" sudah cukup spesifik?
2. Metrik pilot apa yang paling meyakinkan?
3. Apa hambatan adopsi terbesar yang harus dijawab?
4. Apakah hipotesis freemium masuk akal, atau ada model yang lebih realistis?
5. Klaim dampak apa yang aman untuk MVP yang belum diuji lapangan?

## Kalau mendadak blank

Ucapkan ini:

> Maaf Pak, saya masih belajar teknis. Yang saya pahami dan putuskan adalah masalah pengguna, alur, aturan, serta batas produknya. Boleh saya jelaskan dari alur pengguna terlebih dahulu?

## Checklist sebelum Zoom

- Web sudah terbuka: https://clearfloww.web.app
- Riwayat transaksi sudah dikosongkan.
- Satu kalimat contoh transaksi sudah disalin.
- Slide dan PDF terbuka secara offline.
- Charger dan hotspot siap.
- Notifikasi dimatikan.
- Kertas catatan berisi tiga kolom: masukan, prioritas, tindakan.
