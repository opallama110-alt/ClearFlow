# Hasil Bimbingan Kedua — ClearFlow.AI

Sumber: `bimbingan 2.mp4`, 13 Agustus 2026, durasi 8 menit 33 detik. Rekaman sebenarnya berisi audio saja. Audio dinormalisasi dan ditranskripsikan secara lokal. Beberapa kata pada rekaman kurang jelas; kesimpulan di bawah hanya memakai bagian yang maknanya konsisten.

## Kesimpulan bahasa bayi

Mentor bilang produknya **sudah bagus, idenya masuk, dan web-nya benar-benar bisa dicoba**. Jadi jangan panik menambah banyak fitur.

Yang harus diperkuat sebelum final hanya dua cerita besar:

1. **AI-nya bekerja bagaimana?** Jangan hanya bilang “dikirim ke Gemini”. Jelaskan bagaimana cerita diubah menjadi data transaksi yang rapi dan tetap diperiksa pengguna.
2. **Bisnisnya tidak rugi bagaimana?** Jika setiap pemakaian Gemini menimbulkan biaya, pendapatan dari langganan atau sponsor harus lebih besar dari biaya AI dan operasional.

Mentor juga menilai login dengan Google **bukan masalah**. Untuk produk yang menyimpan riwayat dan mungkin berlangganan, akun pengguna justru masuk akal.

## Arahan mentor berdasarkan waktu

| Waktu | Arahan yang terdengar | Arti untuk tim |
|---|---|---|
| 00:00–00:27 | Ide, inovasi, implementasi, dan proposal dinilai bagus, sederhana, serta elegan. | Pertahankan kesederhanaan; jangan merusak alur dengan fitur baru yang tidak penting. |
| 00:28–00:55 | Mentor menyebut penilaian final terdiri dari 60% AI dan 40% bisnis. | Porsi penjelasan dan bukti harus mengikuti bobot ini. Angka tetap perlu dicocokkan dengan rubrik resmi terbaru. |
| 01:10–01:44 | Ada ide sejenis yang rumit dan masih berupa mockup, sedangkan ClearFlow sudah menjadi web app yang dapat dicoba. | Live product adalah pembeda utama. Demo harus lancar dan menunjukkan data benar-benar tersimpan. |
| 01:44–02:09 | Tantangan adalah menyampaikan ide dengan ringkas; mentor menyatakan ide yang sederhana seharusnya dapat dipresentasikan sekitar lima menit. | Latihan pitch dengan timer. Jangan memenuhi presentasi dengan penjelasan teknis yang tidak menjawab nilai. |
| 02:17–03:40 | Perkuat penjelasan proses dari cerita menjadi kumpulan data transaksi dan sebutkan teknik AI yang tepat. | Gunakan istilah yang benar: information extraction berbasis LLM, structured JSON output, schema validation, dan human-in-the-loop. |
| 03:48–04:58 | Penggunaan Gemini dapat menimbulkan biaya; pastikan harga pengguna lebih besar daripada biaya API agar produk tidak rugi. | Siapkan unit economics per pengguna, batas pemakaian, model pendanaan, dan kontrol biaya. |
| 05:12–06:45 | Tim bertanya apakah login Google membuat aplikasi terlalu rumit dan apakah riwayat akan aman. | Akun diperlukan agar data terikat ke identitas pengguna dan dapat diakses kembali. UX tetap harus sederhana. |
| 06:50–07:33 | Mentor menilai login Google tidak masalah dan bahkan mendukung calon bisnis/langganan. | Login Google layak dijadikan jalur masuk utama, setelah benar-benar aktif dan diuji di production. |
| 07:40–08:16 | Mentor meminta tim tetap memperkuat yang bisa diperkuat dan tidak cepat puas. | Fokus pada bukti, keandalan demo, AI, dan bisnis; bukan ekspansi fitur acak. |

Catatan: kalimat penutup menyebut posisi/ranking tim, tetapi angka pada audio kurang cukup jelas untuk dijadikan klaim resmi. Jangan menuliskan ranking baru hanya berdasarkan transkrip ini.

## Jawaban teknis AI yang sesuai dengan aplikasi sekarang

Teknik yang tepat untuk disebut adalah:

> **Information extraction berbasis Gemini dengan schema-constrained structured output dan human-in-the-loop validation.**

Versi bahasa presentasi:

> “ClearFlow menggunakan Gemini untuk mengekstrak informasi dari cerita transaksi. Prompt berisi konteks usaha dan aturan nominal Indonesia, lalu model diwajibkan menghasilkan JSON sesuai skema: tanggal, keterangan, nominal, arus kas, sumber dana, kategori, dan confidence. Aplikasi memvalidasi hasil itu menjadi draft. Jika ada informasi ambigu, sistem menandainya untuk ditinjau. Data baru masuk ke Firestore setelah pengguna memeriksa dan mengonfirmasi.”

Alur sebenarnya di kode:

```text
Cerita maksimal 1.200 karakter
        ↓
Prompt + tanggal + konteks usaha + aturan “rb/jt”
        ↓
Gemini dengan temperature 0,1 dan output JSON berskema
        ↓
JSON.parse + validasi nilai, kategori, dan format
        ↓
Draft; nilai ambigu menjadi “review”
        ↓
Pengguna mengedit/mengonfirmasi
        ↓
Transaksi terstruktur disimpan ke Firestore
```

Lapisan keandalannya:

- maksimal delapan transaksi dari satu cerita;
- input dipotong maksimal 1.200 karakter;
- output dibatasi maksimal 1.500 token;
- permintaan AI memiliki timeout 15 detik;
- parser lokal menjadi cadangan jika AI gagal atau dijeda;
- pengguna dapat memakai form manual;
- Remote Config dapat mengganti model atau mematikan AI tanpa rilis ulang;
- hasil Gemini selalu berupa draft, bukan keputusan final.

## Bukti AI yang masih perlu disiapkan

Penjelasan teknik saja belum cukup untuk bobot AI yang besar. Buat dataset uji kecil berisi sedikitnya 20 cerita transaksi, termasuk:

- `jualan kopi 300rb masuk kas usaha`;
- `beli bahan 1 jt pakai uang pribadi`;
- dua atau tiga transaksi dalam satu cerita;
- nominal `rb`, `ribu`, `jt`, `juta`, dan desimal seperti `1,5 juta`;
- kalimat dengan sumber dana yang jelas dan ambigu;
- pengeluaran pribadi, modal, penjualan, bahan baku, dan operasional;
- tanggal eksplisit dan tanpa tanggal.

Ukur:

1. akurasi nominal;
2. akurasi pemasukan/pengeluaran;
3. akurasi kas usaha/dana pribadi;
4. akurasi pemecahan beberapa transaksi;
5. persentase hasil yang perlu dikoreksi pengguna;
6. waktu respons median;
7. persentase fallback ke parser lokal.

Jangan menyebut “akurasi tinggi” sebelum angka aktual tersedia.

## Unit economics yang diminta mentor

Rumus minimum:

```text
Biaya AI per pengguna per bulan
= permintaan AI per hari
 × hari aktif per bulan
 × biaya rata-rata per permintaan

Margin kontribusi per pengguna
= pendapatan/langganan per bulan
 − biaya AI
 − biaya Firebase/infrastruktur
 − biaya pembayaran dan dukungan
```

Data yang harus diukur saat pilot:

| Variabel | Cara mendapatkan |
|---|---|
| Permintaan AI per pengguna per hari | Analytics tanpa isi atau nominal transaksi |
| Panjang input/output rata-rata | Metadata teknis agregat; jangan simpan cerita mentah |
| Biaya rata-rata satu permintaan | Harga resmi model yang benar pada saat final |
| Biaya AI per pengguna per bulan | Pemakaian aktual × harga model |
| Kesediaan membayar | Survei dan wawancara, bukan tebakan tim |
| Pendanaan alternatif | Uji hipotesis sponsor/CSR/bank/dinas; jangan klaim kemitraan sebelum ada bukti |

Kontrol biaya yang sudah ada di produk—batas input/output, batas transaksi, parser fallback, form manual, dan Remote Config—harus diceritakan sebagai bukti bahwa biaya dapat dikendalikan.

## Temuan penting dari audit implementasi

### Sudah sesuai arahan mentor

- Firebase AI Logic dan Gemini benar-benar terhubung di kode.
- Output Gemini dibatasi dengan JSON schema.
- Data ambigu ditandai untuk ditinjau.
- Pengguna mengonfirmasi sebelum penyimpanan.
- Firestore menyimpan data transaksi terstruktur.
- Parser lokal dan form manual tersedia sebagai fallback.
- Login Google dan pengaitan akun tamu sudah diimplementasikan di kode.

### Belum konsisten untuk demo production

Konfigurasi `.env.production` saat ini berisi:

```text
VITE_ENABLE_GOOGLE_AUTH=false
```

Artinya tombol Google Login disembunyikan pada build production yang dibuat dari konfigurasi ini. Jangan mengatakan login Google sudah aktif di web live sebelum:

1. provider Google diaktifkan pada Firebase Authentication;
2. flag production diubah menjadi `true`;
3. aplikasi dibangun dan dideploy ulang;
4. login, logout, penyimpanan, dan pembacaan ulang data diuji di domain production.

### Lokasi pilot harus dibuat konsisten

Bimbingan pertama menyebut pengumpulan responden di Kuningan. Deck saat ini beberapa kali menulis UMKM Cirebon. Pilih lokasi lapangan yang benar berdasarkan responden aktual, lalu samakan di slide, narasi, survei, dan jawaban juri. UIN Cyber Cirebon sebagai institusi tidak otomatis berarti lokasi pilot harus Cirebon.

## Perubahan yang disarankan untuk deck enam slide

1. **Cover** — janji nilai satu kalimat.
2. **Masalah + bukti survei** — angka dan kutipan aktual, bukan asumsi.
3. **Teknik AI** — prompt/context → structured JSON schema → validation/review → confirmation.
4. **Live product + hasil evaluasi AI** — screenshot/demo dan metrik akurasi, koreksi, serta waktu respons.
5. **Bisnis + unit economics** — siapa membayar, biaya per pengguna, kontrol biaya, dan margin/hipotesis sponsor.
6. **Dampak + pilot/roadmap + ajakan** — hasil yang sudah ada dipisahkan dari target berikutnya.

Slide 3 saat ini sudah menjelaskan alur pengguna, tetapi belum menyebut teknik `structured JSON schema`, validasi, atau fallback. Slide 5 saat ini hanya berisi target pilot dan belum menjawab biaya Gemini versus pendapatan.

## Hubungan bimbingan pertama dan kedua

Kedua bimbingan tidak bertentangan:

- **Bimbingan 1:** buktikan masalah, pilih segmen, uji pengguna, dan ukur dampak.
- **Bimbingan 2:** buktikan teknik AI, evaluasi hasil AI, dan tunjukkan bisnis tidak rugi.

Jadi paket bukti final yang lengkap adalah:

```text
Bukti masalah pengguna
+ bukti aplikasi bisa dipakai
+ bukti AI bekerja dan dapat dikoreksi
+ bukti biaya dapat dikendalikan
+ rencana pendapatan yang masuk akal
```

## Prioritas sebelum final

1. Kumpulkan dan ringkas hasil survei/wawancara aktual.
2. Jalankan evaluasi AI dengan dataset tetap dan catat metriknya.
3. Hitung biaya per permintaan dan biaya per pengguna memakai harga resmi model saat final.
4. Aktifkan serta uji Google Login jika akan didemokan.
5. Perbarui slide 3 dan 5 agar menjawab teknik AI dan unit economics.
6. Latihan pitch lima menit dengan demo cadangan berupa video/screenshot.
7. Samakan lokasi pilot dan semua klaim di deck, aplikasi, serta jawaban lisan.

## Yang tidak perlu dilakukan

- Tidak perlu mengganti database.
- Tidak perlu mengganti Gemini hanya agar terdengar lebih canggih.
- Tidak perlu membuat chatbot multi-turn penuh.
- Tidak perlu menambah menu yang tidak dinilai.
- Tidak perlu mengarang harga, akurasi, jumlah pengguna, atau kemitraan.
- Tidak perlu mengaku memahami proses internal rahasia Gemini; jelaskan desain sistem ClearFlow yang memang dapat dibuktikan.

