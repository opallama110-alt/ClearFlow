# Persiapan Final ClearFlow.AI - Bahasa Bayi

Panduan ini dibuat untuk Fatimah Azzahra agar bisa menjelaskan ClearFlow.AI dengan tenang walaupun masih awam pemrograman. Isinya sudah disesuaikan dengan Panduan Peserta ImpactPreneur, materi bootcamp Hari 1 dan Hari 2, briefing studi kasus, serta pemberitahuan terbaru dari admin.

## 1. Kabar baiknya

Fatimah Azzahra dan ClearFlow.AI tercantum sebagai **nomor 3 dalam daftar 10 finalis Final Pitching**. Ini berarti nomor urut di daftar, bukan klaim peringkat juara tiga.

ClearFlow.AI adalah **web app**, bukan aplikasi Android yang harus diunduh dari Play Store. Web-nya bisa dibuka di:

https://clearfloww.web.app

## 2. Kalau ditanya: "Aplikasi buat bikin web-nya apa?"

Jawaban paling pendek:

> Saya membuat prototype ClearFlow.AI dengan bantuan Codex melalui metode vibe coding. Tampilan web menggunakan React, TypeScript, dan Vite. Data disimpan di Cloud Firestore, pengguna diberi identitas melalui Firebase Anonymous Authentication, lalu web dipublikasikan melalui Firebase Hosting.

Versi bahasa bayi:

- **Codex** = teman AI yang membantu menulis dan memperbaiki kode.
- **React** = bahan untuk membuat tombol, halaman, dan tampilan web.
- **TypeScript** = bahasa yang dipakai untuk memberi instruksi kepada web dengan lebih rapi.
- **Vite** = mesin yang menyiapkan dan menjalankan web dengan cepat.
- **Firestore** = lemari online tempat transaksi disimpan.
- **Anonymous Authentication** = kartu identitas sementara agar data setiap browser tidak bercampur.
- **Firebase Hosting** = tanah dan alamat online tempat web tinggal.

Jadi jangan hanya menjawab "Firebase". Firebase bukan alat utama untuk mendesain tampilan. Firebase dipakai untuk **menyimpan data, memberi identitas pengguna, dan menayangkan web**.

## 3. Apa itu vibe coding?

Vibe coding artinya kita menjelaskan kebutuhan kepada AI dengan bahasa manusia, lalu AI membantu membuat kodenya.

Alurnya:

1. Manusia menentukan masalah dan hasil yang diinginkan.
2. Manusia memberi instruksi atau prompt kepada Codex.
3. Codex membantu menulis atau mengubah kode.
4. Web dijalankan dan diperiksa.
5. Kalau ada masalah, manusia menjelaskan koreksinya.
6. Codex membantu memperbaiki.
7. Manusia menguji dan menyetujui hasil sebelum dipublikasikan.

Kalimat aman saat pitching:

> Saya tidak sekadar meminta AI "buatkan aplikasi". Saya menentukan masalah, pengguna, alur, aturan penyimpanan, dan batasan solusi. Codex membantu menerjemahkannya menjadi kode. Setelah itu hasilnya saya uji, koreksi, dan iterasikan.

## 4. Rumus prompt dari bootcamp - versi lima jari

Materi bootcamp menjelaskan bahwa hasil AI akan lebih terarah kalau prompt tidak terlalu umum. Ingat saja lima jari berikut:

1. **Siapa:** AI diminta berperan sebagai apa?
2. **Kerjakan apa:** tugas atau tujuan yang harus dilakukan.
3. **Bahannya apa:** konteks, data, target pengguna, dan masalahnya.
4. **Aturannya apa:** batasan, hal yang boleh, dan hal yang tidak boleh.
5. **Bungkusnya bagaimana:** bentuk keluaran yang diminta.

Materi juga mengenalkan pemberian **contoh keluaran** agar AI lebih memahami pola yang diinginkan. Istilahnya one-shot atau few-shot prompting. Bahasa bayinya: jangan cuma menyuruh; kasih contoh juga.

Contoh sederhana:

> Kamu adalah asisten pembukuan untuk pemilik UMKM yang awam akuntansi. Ubah cerita transaksi berbahasa Indonesia menjadi draft transaksi terstruktur. Pisahkan pemasukan atau pengeluaran serta kas usaha atau pribadi. Jangan mengarang nominal. Jika informasi tidak jelas, tandai untuk ditinjau. Jangan simpan apa pun sebelum pengguna mengonfirmasi. Tampilkan hasil dalam daftar draft yang mudah diedit.

Itu adalah **contoh rekonstruksi prompt untuk menjelaskan strategi**, bukan klaim bahwa hanya satu prompt tersebut yang langsung menghasilkan seluruh aplikasi.

## 5. Materi Custom Generative AI dan hubungannya dengan ClearFlow

Dalam bootcamp dijelaskan secara sederhana bahwa solusi Custom Generative AI membutuhkan dua bahan besar:

- **Instruction:** AI harus melakukan apa dan mengikuti aturan apa.
- **Knowledge:** data atau pengetahuan apa yang boleh dipakai sebagai rujukan.

Struktur instruksi yang diajarkan mencakup role, objective, target user, scope, workflow, rules atau constraints, communication style, output format, handling missing information, dan knowledge usage.

Kalau diterapkan ke ClearFlow, bentuknya seperti ini:

- **Role:** asisten pencatatan keuangan UMKM.
- **Objective:** mengubah cerita transaksi menjadi draft yang rapi.
- **Target user:** pemilik UMKM mikro yang awam akuntansi.
- **Scope:** membantu pencatatan; bukan menggantikan akuntan atau memberi nasihat pajak.
- **Workflow:** cerita -> draft -> diperiksa manusia -> dikonfirmasi -> disimpan.
- **Rules:** jangan mengarang nominal, jangan menyimpan otomatis, dan tandai informasi yang ambigu.
- **Communication style:** bahasa Indonesia yang sederhana dan tidak menghakimi.
- **Output format:** jenis transaksi, nominal, kategori, sumber kas, catatan, dan status tinjauan.
- **Missing information:** minta perbaikan atau tandai untuk ditinjau.
- **Knowledge:** kategori transaksi dan aturan pemisahan kas usaha-pribadi yang telah ditentukan.

Materi bootcamp juga mengingatkan bahwa Custom AI akan bagus jika instruksi dan datanya bagus. Jadi kalimat pentingnya:

> AI bukan sulap. Kualitas hasil bergantung pada kejelasan instruksi, kualitas data, dan pemeriksaan manusia.

## 6. Alur ClearFlow.AI

Bayangkan pemilik warung berkata:

> "Hari ini jualan 300 ribu, beli plastik 50 ribu dari uang laci, lalu jajan 15 ribu pakai uang sendiri."

Yang dilakukan ClearFlow.AI:

1. Pengguna mengetik cerita transaksi.
2. Sistem memecah cerita menjadi beberapa draft transaksi.
3. Sistem menyiapkan nominal, kategori, pemasukan atau pengeluaran, serta kas usaha atau pribadi.
4. Pengguna memeriksa hasilnya.
5. Kalau ada yang salah atau ambigu, pengguna memperbaikinya.
6. Data belum disimpan sebelum pengguna menekan tombol konfirmasi.
7. Setelah dikonfirmasi, transaksi masuk ke Firestore.
8. Dashboard menghitung pemasukan, pengeluaran, dan saldo.
9. Pengguna bisa mengekspor CSV, menghapus satu transaksi, atau menghapus seluruh riwayat.

Inti produknya:

> AI membantu merapikan, tetapi manusia tetap memutuskan.

## 7. Kenapa ClearFlow cocok dengan studi kasus resmi?

Dalam briefing, masalah UMKM Cirebon dibagi menjadi lima kelompok. ClearFlow memilih fokus kedua: **keuangan dan administrasi usaha**.

Masalah yang disebut dalam briefing sangat nyambung dengan ClearFlow:

- pencatatan keuangan belum rapi;
- uang pribadi dan uang usaha bercampur;
- pemilik kesulitan mengetahui laba-rugi;
- pembuatan laporan terasa sulit;
- pemahaman pajak dan kewajiban usaha masih terbatas.

Pak Dody juga mengingatkan agar peserta tidak terlalu rakus memilih banyak topik. Karena itu posisi ClearFlow harus fokus:

> ClearFlow membantu UMKM memulai kebiasaan mencatat dan memisahkan arus kas usaha-pribadi. ClearFlow tidak mengklaim menyelesaikan pemasaran, stok, pajak, dan seluruh masalah UMKM sekaligus.

## 8. Harus jujur tentang prototype saat ini

Bagian ini sangat penting.

- Penyimpanan transaksi sudah memakai **database Firestore sungguhan**.
- Data setiap browser dipisahkan dengan **Anonymous Authentication** dan Firestore Security Rules.
- Dashboard, konfirmasi, ekspor CSV, dan penghapusan sudah berjalan.
- Pembacaan kalimat pada prototype saat ini masih berupa **parser berbasis aturan dan kata kunci** untuk membuktikan alur pengguna.
- Model AI atau LLM yang memahami variasi bahasa lebih luas adalah tahap pengembangan berikutnya.

Jawaban kalau mentor bertanya, "AI-nya sudah benar-benar terpasang?"

> Untuk MVP, saya sengaja memvalidasi alur pengguna lebih dahulu menggunakan parser terkontrol. Vibe coding dengan Codex sudah digunakan dalam perumusan, pembangunan, debugging, dan iterasi solusi. Integrasi model bahasa untuk ekstraksi yang lebih fleksibel menjadi milestone teknis berikutnya. Saya tidak ingin mengklaim kemampuan yang belum diuji.

Kejujuran ini lebih kuat daripada berpura-pura semua sudah sempurna.

## 9. Bukti proses AI yang perlu diceritakan

Bobot penerapan AI dari admin adalah 60 persen. Juri kemungkinan tidak hanya melihat hasil akhir, tetapi juga ingin tahu bagaimana AI dipakai dan diperbaiki manusia.

Gunakan cerita iterasi berikut:

1. **Versi awal:** prototype masih berisi data contoh.  
   **Keputusan manusia:** demo harus membuktikan data sungguhan, jadi aplikasi diubah agar mulai dari nol.
2. **Versi awal:** data hanya tinggal di browser.  
   **Keputusan manusia:** data perlu bertahan, jadi penyimpanan dipindahkan ke Firestore.
3. **Masalah baru:** database online tidak boleh terbuka untuk semua orang.  
   **Keputusan manusia:** Anonymous Authentication dan Security Rules ditambahkan agar setiap identitas hanya mengakses datanya sendiri.
4. **Masalah penggunaan:** transaksi yang salah perlu bisa dikoreksi.  
   **Keputusan manusia:** ditambahkan hapus satu transaksi dan tombol "Hapus riwayat transaksi".
5. **Masalah klaim:** prototype belum memakai LLM untuk ekstraksi.  
   **Keputusan manusia:** pitch diperbaiki agar menjelaskan parser terkontrol secara jujur dan menempatkan LLM sebagai pengembangan berikutnya.

Kalau memiliki screenshot percakapan dengan Codex, pilih 3 sampai 5 gambar yang menunjukkan perubahan tersebut. Jangan tampilkan puluhan chat. Yang dicari adalah bukti bahwa Fatimah **berpikir, menilai, dan memberi keputusan**, bukan sekadar menekan tombol.

## 10. Pitch 30 detik

> Banyak UMKM merasa usahanya ramai, tetapi tidak tahu uang usahanya sebenarnya bertambah atau justru terpakai untuk kebutuhan pribadi. ClearFlow.AI membantu mereka mencatat dengan bahasa sehari-hari. Sistem menyiapkan draft transaksi, memisahkan kas usaha dan pribadi, lalu pengguna tetap mengonfirmasi sebelum data disimpan. Prototype web sudah online dan siap diuji bersama UMKM Cirebon.

## 11. Script demo 90 detik

1. **Buka halaman kosong:** "Prototype sengaja dimulai tanpa data palsu."
2. **Masuk menu Catat:** "Pengguna tidak perlu memahami istilah akuntansi."
3. **Ketik contoh transaksi:** "Cukup bercerita seperti mengirim chat."
4. **Buat draft:** "Sistem memecah cerita menjadi transaksi yang terstruktur."
5. **Tunjukkan kas usaha-pribadi:** "Pemisahan ini membantu uang usaha lebih mudah dipantau."
6. **Tunjukkan konfirmasi:** "Tidak ada data tersimpan otomatis. Pengguna tetap memegang kendali."
7. **Simpan:** "Setelah dikonfirmasi, data masuk ke Firestore."
8. **Buka dashboard atau riwayat:** "Ringkasan langsung diperbarui dan riwayat bisa dikoreksi atau dihapus."

Jangan mengetik terlalu cepat. Juri harus melihat perubahan dari kalimat menjadi draft.

## 12. Fokus penilaian dari admin

### A. Penerapan AI - 60 persen

Yang harus bisa dijelaskan:

- **Problem Framing and AI Relevance - 10 persen:** masalah apa yang dibantu AI dan kenapa input bahasa sehari-hari relevan?
- **AI Workflow and Prompt Strategy - 15 persen:** bagaimana instruksi disusun secara bertahap?
- **Iteration, Validation, and Human Refinement - 15 persen:** apa yang diperiksa dan diubah manusia?
- **AI Contribution - 10 persen:** bagian mana yang menjadi lebih cepat karena bantuan AI?
- **Quality and Efficiency - 10 persen:** bagaimana hasil diuji agar tidak asal jadi?

### B. Penerapan solusi ke bisnis - 40 persen

Yang harus bisa dijelaskan:

- **Problem-Solution Fit - 10 persen:** apakah solusi cocok dengan masalah pengguna?
- **Feasibility and Practicality - 15 persen:** apakah realistis dipakai dan dikembangkan?
- **Impact and Value - 10 persen:** manfaat apa yang hendak divalidasi?
- **Adoption and Scalability - 5 persen:** bagaimana pengguna mulai memakai dan bagaimana solusi dapat berkembang?

Jawaban ClearFlow:

- Pengguna awal: pemilik UMKM mikro yang masih mencampur kas usaha dan pribadi.
- Masalah utama: pencatatan terasa rumit dan tidak menjadi kebiasaan.
- Nilai utama: input seperti chat, pemisahan kas, dan konfirmasi manusia.
- Pilot: uji coba 30 hari bersama sekitar 10 UMKM Cirebon.
- Target validasi: kebiasaan mencatat, tingkat peninjauan draft, dan rasa terbantu melihat arus kas.
- Model bisnis sementara: pilot gratis; opsi freemium atau langganan terjangkau ditentukan setelah kebutuhan pengguna tervalidasi.

## 13. Mentoring Pak Dody - solusi dan teknis

Durasi hanya sekitar 15 menit. Jangan habiskan waktu untuk membacakan semua slide.

Pembukaan:

> Pak, ClearFlow.AI adalah web app pencatatan berbasis percakapan untuk memisahkan kas usaha dan pribadi. Alur end-to-end, database, dan keamanan dasar sudah berjalan. Saat ini ekstraksi kalimat masih parser terkontrol, dan saya ingin meminta arahan untuk memperkuat lapisan AI secara jujur dan realistis.

Pertanyaan yang perlu diajukan:

1. Untuk tahap final, seberapa dalam integrasi AI produk yang diharapkan?
2. Apakah pendekatan human-in-the-loop kami sudah cukup jelas?
3. Apakah penjelasan prompt kami sebaiknya memakai struktur role, objective, target user, workflow, constraints, output, dan handling missing information dari bootcamp?
4. Klaim teknis mana yang perlu dipersempit agar tidak overclaim?
5. Prioritas berikutnya lebih baik integrasi LLM, evaluasi akurasi, atau uji pengguna?
6. Panduan menyebut waktu final sekitar 10 menit termasuk tanya jawab. Pembagian pitch, demo, dan Q&A yang diharapkan berapa menit?

## 14. Mentoring Pak Bayu - bisnis

Pembukaan:

> Pak, target awal kami adalah UMKM mikro yang belum rutin mencatat dan masih mencampur uang usaha dengan pribadi. Kami menyiapkan pilot 30 hari untuk menguji apakah input seperti chat benar-benar membuat pencatatan lebih mudah diadopsi.

Pertanyaan yang perlu diajukan:

1. Apakah target pengguna awal kami sudah cukup spesifik?
2. Metrik pilot mana yang paling meyakinkan untuk problem-solution fit?
3. Apakah freemium cocok, atau ada model bisnis yang lebih realistis?
4. Hambatan adopsi terbesar yang perlu kami jawab saat pitching apa?
5. Bagaimana menjelaskan potensi skala tanpa membuat klaim berlebihan?

## 15. Pertanyaan juri dan jawaban sederhana

### "Kenapa harus AI? Form biasa juga bisa."

> Form biasa meminta pengguna memahami kolom dan istilah. AI diarahkan untuk mengubah bahasa sehari-hari menjadi draft terstruktur, sehingga hambatan mencatat lebih rendah. Pengguna tetap mengonfirmasi agar kesalahan tidak langsung masuk ke pembukuan.

### "Kalau AI salah bagaimana?"

> Hasil AI hanya draft. Transaksi ambigu ditandai dan tidak disimpan sebelum pengguna memeriksa serta mengonfirmasi.

### "Datanya disimpan di mana?"

> Di Cloud Firestore. Prototype memakai identitas anonim per browser dan Security Rules agar pengguna hanya dapat mengakses jalurnya sendiri.

### "Apakah sudah aman untuk produksi?"

> Belum. Keamanan dasar prototype sudah ada, tetapi versi produksi masih membutuhkan akun permanen, pemulihan akun, kebijakan privasi, logging, pengujian keamanan, dan evaluasi kepatuhan.

### "Apa kelemahan prototype sekarang?"

> Ekstraksi bahasa masih parser terkontrol, identitas masih terikat browser, dan validasi pengguna lapangan belum dilakukan. Karena itu tahap berikutnya adalah pilot serta integrasi model bahasa yang dapat dievaluasi.

### "Siapa yang mau memakai?"

> UMKM mikro yang sekarang mencatat dengan ingatan, chat, atau catatan acak dan kesulitan memisahkan uang usaha dengan pribadi.

### "Apa bedanya dengan aplikasi pembukuan biasa?"

> Fokus kami adalah kebiasaan mencatat melalui input seperti chat, pemisahan kas usaha-pribadi, serta konfirmasi manusia. ClearFlow.AI bukan menggantikan akuntan; ia menurunkan hambatan untuk mulai mencatat.

### "Bagaimana menghasilkan uang?"

> Tahap awal fokus pada validasi. Hipotesis bisnisnya adalah freemium: pencatatan dasar gratis, lalu fitur laporan, sinkronisasi lintas perangkat, dan kebutuhan lanjutan masuk paket berbayar terjangkau. Harga belum ditetapkan sebelum wawancara dan pilot.

### "Apa target keberhasilan pilot?"

> Target awal: sekitar 10 UMKM diundang, minimal 70 persen aktif mencatat tiga kali per minggu, minimal 80 persen draft ditinjau, dan skor kejelasan arus kas minimal 4 dari 5. Ini target, bukan hasil yang sudah dicapai.

### "Seberapa besar kontribusi Codex?"

> Codex membantu menerjemahkan kebutuhan menjadi React, menghubungkan Firebase, membuat rules, memperbaiki bug, dan menyiapkan deployment. Manusia menentukan masalah, mengevaluasi hasil, memberi koreksi, memilih trade-off, dan menyetujui hasil akhir.

### "Apakah ini sama dengan Custom Gemini yang diajarkan?"

> Prinsip instruksi terstruktur dari bootcamp kami terapkan dalam proses pengembangan. Namun produk ini bukan sekadar Gem atau chatbot Gemini. ClearFlow adalah web app dengan antarmuka, alur konfirmasi, database, dan aturan aksesnya sendiri. Lapisan ekstraksi LLM yang lebih fleksibel masih menjadi tahap berikutnya.

## 16. Yang jangan dikatakan

Jangan berkata:

- "AI kami sudah memahami semua bahasa."
- "Aplikasi ini 100 persen aman."
- "Kami sudah terbukti meningkatkan laba UMKM."
- "Semua dibuat AI, saya tidak tahu apa-apa."
- "Data pengguna pasti tidak pernah hilang."
- "Ini sudah siap dipakai massal."
- "ClearFlow mencegah uang pribadi dan usaha tercampur."

Ganti dengan:

- "Ini MVP yang siap diuji."
- "Kami memakai human-in-the-loop."
- "Ini target validasi, bukan capaian."
- "Saya memahami masalah, alur, aturan, dan keputusan produknya, meskipun AI membantu penulisan kode."
- "ClearFlow membantu pengguna memantau dan menandai pemakaian kas usaha-pribadi."

## 17. Waktu presentasi dan format enam slide

Panduan peserta menyebut total presentasi dan tanya jawab sekitar **10 menit per peserta**. Briefing lisan juga menyebut presentasi final 10 menit. Karena pembagian detailnya belum tertulis jelas, tanyakan pembagian resminya saat mentoring.

Sambil menunggu jawaban, latihan dengan batas aman:

- 30 detik: pembuka dan masalah;
- 3 menit 30 detik: lima slide isi;
- 1 menit 30 detik: demo;
- 30 detik: penutup;
- sisa sekitar 4 menit: tanya jawab dan pergantian.

Materi bootcamp awal menyebut maksimal lima slide. Namun admin kemudian mengonfirmasi bahwa **enam slide diperbolehkan: satu cover dan lima slide isi**. Gunakan ketentuan terbaru dari admin.

## 18. Checklist demo sebelum berangkat

- Gunakan laptop dan browser yang sama dengan saat latihan.
- Buka https://clearfloww.web.app sebelum masuk ruang pitching.
- Jangan memakai incognito dan jangan menghapus data browser karena identitas prototype masih terikat browser.
- Atur nama usaha lebih dahulu, lalu pilih "Hapus riwayat transaksi" agar demo mulai kosong.
- Siapkan charger dan hotspot pribadi.
- Panduan menyebut laptop akan terhubung ke display melalui HDMI. Bawa adapter HDMI yang cocok dengan port laptop.
- Simpan pitch deck dalam format PPTX dan PDF secara offline.
- Siapkan screenshot dan rekaman demo pendek jika internet bermasalah.
- Uji QR code dari ponsel lain.
- Tutup notifikasi pribadi dan tab yang tidak diperlukan.
- Siapkan satu kalimat utama untuk setiap slide.
- Latihan dengan timer dan berhenti sebelum waktu habis.
- Gunakan tab chat AI baru jika berpindah ke data atau tugas yang berbeda agar konteks lama tidak tercampur, sesuai saran materi bootcamp.

## 19. Tindakan dari chat admin

- Mentoring berlangsung **10-13 Agustus 2026**, online melalui Zoom.
- Ada **dua sesi one-on-one**, masing-masing sekitar 15 menit.
- Pak Dody fokus pada solusi dan teknis.
- Pak Bayu fokus pada value proposition, model bisnis, implementasi, dan pitching.
- Pastikan sudah masuk grup Finalis dan grup Final AI Prompting Challenge.
- Berikan reaksi jempol pada pesan admin sebagai tanda sudah membaca.
- Pilihan slot yang diumumkan: 10 Agustus 19.00-21.00 WIB; 11 Agustus 19.00-21.00 WIB; 12 Agustus 12.00-17.00 WIB; 13 Agustus 12.00-17.00 WIB.
- Karena batas pengiriman availability pada chat adalah jam 11 dan sudah lewat dalam rangkaian pesan, jika belum mengirim, segera hubungi Nova dengan sopan.
- Jika berdomisili di luar Ciayumajakuning, konfirmasikan domisili dan kesiapan hadir di Cirebon pada 15 Agustus 2026.
- Panitia hanya menyediakan hotel untuk peserta luar wilayah; transportasi dan biaya lain ditanggung peserta.

Format pesan availability:

> Halo Kak Nova, mohon maaf saya baru mengirimkan availability mentoring.  
> Nama: Fatimah Azzahra  
> Pilihan 1: [tanggal], pukul [jam]-[jam] WIB  
> Pilihan 2: [tanggal], pukul [jam]-[jam] WIB  
> Terima kasih, Kak.

## 20. Sumber materi yang paling relevan

- Panduan Peserta ImpactPreneur: tujuan program, alur Top 10, mentoring, final pitching, laptop pribadi, HDMI, demo prototype, dan durasi sekitar 10 menit termasuk tanya jawab.
- Bootcamp Hari 2 sekitar 00:46-01:09: prompting dasar, pemberian contoh, role, konteks, constraints, dan format output.
- Bootcamp Hari 2 sekitar 01:52-02:18: Custom Generative AI, instruction, knowledge, serta struktur instruksi.
- Bootcamp Hari 2 sekitar 03:14-03:20: lima kelompok masalah UMKM, masalah keuangan-administrasi, format proposal, dan prototype opsional.
- Informasi admin terbaru: enam slide diperbolehkan dan jadwal mentoring one-on-one.

## 21. Kalimat terakhir untuk diingat

> Saya tidak harus menjadi programmer hebat untuk menjelaskan ClearFlow.AI. Saya harus paham masalahnya, siapa penggunanya, bagaimana alurnya, bagaimana saya memberi instruksi kepada AI, apa yang saya koreksi, bagian mana yang sudah nyata, bagian mana yang masih terbatas, dan apa yang akan saya uji berikutnya.
