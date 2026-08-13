# Hasil Bimbingan Pertama — ClearFlow.AI

Sumber: `rekaman bimbingan.mp4`, 11 Agustus 2026, durasi 8 menit 40 detik. Ringkasan dibuat dari audio yang dinormalisasi dan transkrip lokal. Beberapa nama serta istilah pada rekaman kurang jelas; keputusan di bawah hanya memakai bagian yang maknanya konsisten.

## Kesimpulan paling sederhana

Pembimbing tidak meminta tim menambah banyak fitur. Pembimbing meminta tim berhenti mengandalkan asumsi dan membawa bukti bahwa:

1. masalah mencampur atau tidak memilah uang usaha dan pribadi benar-benar dialami UMKM;
2. cara yang sekarang mereka pakai belum cukup membantu;
3. ada segmen UMKM tertentu yang paling cocok memakai ClearFlow;
4. prototipe dapat dipakai oleh segmen tersebut;
5. hasilnya dapat diukur, bukan hanya diceritakan sebagai rencana.

Dengan kata lain: **aplikasinya sudah cukup untuk diuji; sekarang yang kurang adalah bukti lapangan.**

## Arahan pembimbing berdasarkan waktu

| Waktu | Arahan yang terdengar | Arti untuk tim |
|---|---|---|
| 00:07–00:36 | Pastikan masalahnya benar dan cari tahu solusi yang sudah dipakai UMKM sebelum ada chatbot. | Jangan mulai wawancara dengan menawarkan ClearFlow. Gali perilaku dan workaround yang sudah ada. |
| 00:51–01:11 | Tentukan UMKM mana yang cocok; tidak semua umur atau jenis usaha cocok dengan chatbot. | Cari beachhead segment, bukan menargetkan semua UMKM. |
| 01:32–02:07 | Survei beberapa sektor dan demografi di Kuningan; lihat siapa yang sudah dan belum bisa memilah. | Sampel perlu bervariasi berdasarkan sektor, usia, dan karakter pengguna. |
| 02:10–03:00 | Prototipe chat dapat disimulasikan secara manual; sesuaikan bahasa untuk pengguna muda dan tua. | Uji tugas dan gaya bahasa lebih penting daripada menambah teknologi. Wizard-of-Oz boleh dipakai. |
| 03:02–03:33 | Jelaskan backend, database, data pribadi, dan data apa yang disimpan dari chat. | Siapkan penjelasan arsitektur dan privasi yang sangat sederhana. |
| 03:37–05:19 | Pikirkan siapa yang membayar biaya AI, kemungkinan gratis/sponsor, target pengguna, dan impact terukur. | Free pilot boleh, tetapi harus ada hipotesis model pendanaan dan target numerik. |
| 05:27–06:37 | PR utama adalah survei lapangan, memilih yang paling butuh, lalu testing; masalah masih asumsi. | Prioritas empat hari berikutnya adalah riset, bukan coding besar. |
| 06:40–07:18 | Dalam empat hari kumpulkan data; saat penjurian sudah ada hasil survei dan uji coba. | Deck harus berisi evidence, bukan “kayaknya”, “maunya”, atau “semoga”. |
| 07:20–08:11 | Bukti dapat mengarahkan fokus ke segmen tertentu, lalu buat rencana ekspansi tiga bulan berikutnya. | Tentukan segmen awal dari data dan pisahkan dengan roadmap perluasan. |
| 08:20–08:35 | Jika berhasil, ada kemungkinan dibawa ke UMKM binaan mitra seperti Bank Indonesia. | Potensi B2B2B/kemitraan boleh disebut sebagai jalur scale, bukan kerja sama yang sudah pasti. |

## Jawaban teknis ClearFlow yang sudah tersedia

Pertanyaan pembimbing tentang “apa yang disimpan di belakang chat” sudah bisa dijawab dengan kondisi aplikasi sekarang:

- Teks cerita dikirim ke Firebase AI Logic hanya jika pengguna memberi persetujuan.
- Teks mentah tidak disimpan ke Firestore.
- Gemini atau parser menghasilkan draft; pengguna memeriksa dan mengonfirmasi dahulu.
- Firestore hanya menyimpan transaksi terstruktur: tanggal, keterangan, nominal, arus kas, sumber dana, kategori, status, sumber pemrosesan, confidence, dan timestamp.
- Profil usaha menyimpan nama pemilik/usaha, jenis usaha, kota, tanggal mulai, saldo awal, serta persetujuan AI.
- Setiap data dipisahkan berdasarkan UID pengguna dan dilindungi Firestore Rules serta App Check.
- Analytics hanya mencatat event teknis dan jumlah transaksi, bukan isi cerita atau nominal.

Kalimat presentasi yang disarankan:

> “ClearFlow tidak menyimpan percakapan mentah. Cerita hanya diproses menjadi draft, lalu yang disimpan adalah transaksi terstruktur setelah pengguna memeriksanya.”

Catatan penting: pada rekaman, produk sempat disebut memakai OpenAI. Implementasi sekarang memakai **Gemini melalui Firebase AI Logic**, jadi jawaban dan deck berikutnya harus konsisten memakai nama tersebut.

## Hipotesis segmen awal — belum boleh disebut temuan

Hipotesis yang layak diuji:

> Pemilik usaha mikro kuliner perempuan usia sekitar 25–45 tahun di Kuningan, memakai WhatsApp setiap hari, mencatat secara tidak rutin, dan masih memakai uang pribadi untuk kebutuhan usaha.

Ini hanya hipotesis awal. Jika survei menunjukkan segmen lain lebih bermasalah atau lebih mudah mengadopsi, target harus mengikuti data.

## Rencana validasi empat hari

### Hari 1 — Persiapan dan rekrutmen

- Siapkan satu formulir pencatatan jawaban.
- Rekrut 12–15 UMKM dari minimal tiga sektor, misalnya kuliner, perdagangan/fashion, dan jasa.
- Usahakan ada tiga rentang usia: di bawah 30, 30–45, dan di atas 45 tahun.
- Jangan hanya merekrut teman yang sudah nyaman memakai aplikasi.

### Hari 2 — Wawancara masalah

- Lakukan wawancara 10–15 menit per orang.
- Jangan menunjukkan aplikasi pada lima menit pertama.
- Catat ucapan asli, cara mencatat sekarang, frekuensi masalah, serta dampaknya.

### Hari 3 — Uji prototipe

- Pilih 6–8 responden yang masalahnya paling relevan.
- Berikan tugas yang sama tanpa banyak mengajari.
- Rekam waktu, salah input, bagian yang ditanyakan, dan apakah tugas selesai.
- Jangan menghitung pujian sebagai keberhasilan; ukur perilaku.

### Hari 4 — Sintesis dan deck

- Kelompokkan jawaban berdasarkan sektor dan usia.
- Pilih satu segmen awal berdasarkan bukti.
- Buat tabel hasil dan 2–3 kutipan anonim.
- Masukkan hasil aktual ke pitch deck dengan label “hasil validasi”, bukan “target”.
- Pisahkan hasil aktual dari target pilot 30 hari.

## Pertanyaan wawancara yang tidak menggiring

1. “Dalam tujuh hari terakhir, bagaimana Anda mencatat uang masuk dan keluar usaha?”
2. “Ceritakan terakhir kali uang usaha dan uang pribadi terpakai bersamaan.”
3. “Waktu itu apa yang Anda lakukan supaya tetap tahu saldo usaha?”
4. “Alat apa yang biasa dipakai: ingatan, kertas, WhatsApp, Excel, atau aplikasi lain?”
5. “Bagian mana yang paling merepotkan dari cara tersebut?”
6. “Seberapa sering transaksi tidak tercatat? Apa akibatnya?”
7. “Siapa yang biasanya mencatat keuangan di usaha ini?”
8. “Informasi apa yang tidak ingin Anda masukkan ke aplikasi atau chatbot?”
9. “Kalau ada solusi seperti ini, kapan Anda akan memakainya dan kapan tidak?”
10. Setelah mencoba: “Bagian mana yang membuat Anda berhenti, ragu, atau meminta bantuan?”

Hindari pertanyaan seperti “Aplikasi ini membantu, kan?” karena akan menghasilkan jawaban sopan, bukan bukti.

## Tugas uji prototipe

Berikan tanpa menjelaskan tombol satu per satu:

1. Catat penjualan Rp300.000 yang masuk ke kas usaha.
2. Catat pembelian bahan Rp50.000 yang memakai uang pribadi.
3. Periksa draft dan perbaiki kategori yang salah.
4. Temukan transaksi tadi di riwayat.
5. Edit nominal transaksi.
6. Hapus satu transaksi yang salah.
7. Jelaskan dengan kata sendiri arti saldo kas usaha dan dana pribadi di beranda.

## Ukuran keberhasilan yang diusulkan

Angka berikut adalah **ambang validasi usulan, bukan pencapaian saat ini**:

- minimal 60% responden menceritakan masalah pencatatan/pemisahan dana tanpa diarahkan;
- minimal 50% masih memakai ingatan, kertas, atau chat pribadi sebagai cara utama;
- minimal 5 dari 6 tugas inti selesai tanpa bantuan pada uji kedua;
- median waktu mencatat satu transaksi di bawah 2 menit;
- minimal 70% nominal dan sumber dana tersimpan benar setelah konfirmasi;
- minimal 5 responden bersedia mencoba selama tujuh hari;
- setelah tujuh hari, ukur berapa yang mencatat minimal tiga hari dan berapa yang lebih konsisten memisahkan sumber dana.

## Data riset yang perlu dicatat

- kode responden anonim, bukan nama lengkap;
- sektor usaha, lama usaha, rentang usia, jumlah transaksi harian;
- orang yang bertanggung jawab mencatat;
- alat pencatatan sekarang;
- apakah kas usaha dan pribadi sudah dipisah;
- masalah yang disebut spontan dan dampaknya;
- tugas berhasil/gagal, waktu tugas, jumlah bantuan;
- kekhawatiran privasi;
- minat mencoba dan kesediaan membayar;
- satu kutipan anonim yang mewakili masalah.

Jangan menyimpan NIK, PIN, kata sandi, nomor kartu, atau data transaksi sensitif yang tidak diperlukan.

## Model bisnis yang perlu diuji, bukan langsung diputuskan

Tiga hipotesis yang dapat dibandingkan:

1. Gratis selama pilot, lalu paket UMKM murah.
2. Gratis untuk UMKM karena biaya ditanggung sponsor/CSR/bank/dinas.
3. Freemium: pencatatan dasar gratis, fitur laporan/pendampingan berbayar.

Untuk penjurian, jalur sponsor atau lembaga pembina dapat disampaikan sebagai hipotesis scale. Jangan mengklaim Bank Indonesia sebagai mitra resmi sebelum ada persetujuan tertulis.

## Perubahan yang disarankan pada pitch

- Ganti klaim masalah berbasis asumsi dengan angka survei aktual.
- Nyatakan satu segmen pengguna awal dengan jelas.
- Tampilkan “cara lama → tugas di ClearFlow → hasil terukur”.
- Tambahkan diagram data sederhana: cerita sementara → draft → konfirmasi → transaksi terstruktur.
- Jelaskan bahwa aplikasi memakai Gemini/Firebase AI Logic, bukan OpenAI.
- Pisahkan hasil uji yang sudah terjadi dari target pilot 30 hari.
- Tambahkan model keberlanjutan biaya AI dan roadmap segmen tiga bulan.

## Yang belum perlu dikerjakan sekarang

- Tidak perlu mengganti database.
- Tidak perlu menambah banyak menu.
- Tidak perlu membuat chatbot multi-turn penuh sebelum validasi.
- Tidak perlu memasukkan demografi sensitif ke akun production; data survei dapat disimpan terpisah dan anonim.
- Tidak perlu menetapkan harga final sebelum wawancara willingness-to-pay.

Prioritas berikutnya adalah **survei → pilih segmen → uji tugas → ukur hasil → perbarui deck**.
