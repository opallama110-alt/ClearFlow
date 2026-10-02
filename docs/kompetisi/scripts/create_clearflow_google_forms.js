/**
 * Generator Google Forms untuk riset ClearFlow.AI.
 *
 * CARA PAKAI:
 * 1. Buka https://script.new dengan akun Google tim.
 * 2. Hapus isi Code.gs, lalu tempel seluruh isi file ini.
 * 3. Pilih fungsi createClearFlowResearchForms lalu klik Run.
 * 4. Izinkan akses Google Forms dan Google Sheets.
 * 5. Cari spreadsheet "ClearFlow.AI - Pusat Link Riset" di Google Drive.
 *
 * PENTING: jalankan satu kali. Setiap eksekusi membuat form baru.
 */

function createClearFlowResearchForms() {
  const survey = buildProblemValidationSurvey();
  const usability = buildPrototypeObservationForm();
  const hub = buildResearchHub(survey, usability);

  console.log('SELESAI - pusat link: ' + hub.url);
  console.log('Survei publik: ' + survey.publicUrl);
  console.log('Form observasi internal: ' + usability.publicUrl);

  return {
    hubUrl: hub.url,
    surveyPublicUrl: survey.publicUrl,
    usabilityPublicUrl: usability.publicUrl,
  };
}

function buildProblemValidationSurvey() {
  const title = 'Survei Kebiasaan Pencatatan Keuangan UMKM - ClearFlow.AI';
  const form = FormApp.create(title, true);

  configureForm(
    form,
    [
      'Tujuan survei ini adalah memahami cara pelaku UMKM mencatat uang usaha sehari-hari. Ini bukan ujian dan tidak ada jawaban benar atau salah.',
      '',
      'Waktu pengisian sekitar 7-10 menit. Jawaban dianalisis secara anonim untuk pengembangan dan evaluasi prototipe ClearFlow.AI.',
      '',
      'Jangan menuliskan NIK, PIN, kata sandi, nomor kartu, nomor rekening, atau rincian transaksi sensitif.',
    ].join('\n'),
    'Terima kasih. Jawaban Anda sudah tercatat dan sangat membantu kami memahami kebutuhan UMKM secara nyata.'
  );

  const consent = form
    .addMultipleChoiceItem()
    .setTitle('Apakah Anda bersedia menjadi responden dan jawaban anonim Anda dipakai untuk riset ClearFlow.AI?')
    .setHelpText('Anda boleh berhenti kapan saja. Kami tidak meminta data keuangan rahasia.')
    .setRequired(true);

  const profilePage = form
    .addPageBreakItem()
    .setTitle('A. Profil singkat usaha')
    .setHelpText('Bagian ini dipakai untuk melihat kelompok UMKM mana yang paling membutuhkan solusi.');

  consent.setChoices([
    consent.createChoice('Ya, saya bersedia', profilePage),
    consent.createChoice('Tidak bersedia', FormApp.PageNavigationType.SUBMIT),
  ]);

  addMultipleChoice(form, 'Peran Anda dalam usaha ini', [
    'Pemilik usaha',
    'Pemilik sekaligus pencatat keuangan',
    'Anggota keluarga yang membantu usaha',
    'Karyawan/admin yang mencatat keuangan',
  ], true, true);

  addText(form, 'Kabupaten/kota tempat usaha', true, 'Contoh: Kabupaten Kuningan');

  addMultipleChoice(form, 'Bidang usaha utama', [
    'Kuliner/makanan/minuman',
    'Toko/retail/perdagangan',
    'Fashion/kerajinan',
    'Jasa',
    'Pertanian/peternakan',
    'Produksi rumahan',
  ], true, true);

  addMultipleChoice(form, 'Lama usaha berjalan', [
    'Kurang dari 6 bulan',
    '6-12 bulan',
    'Lebih dari 1-3 tahun',
    'Lebih dari 3-5 tahun',
    'Lebih dari 5 tahun',
  ]);

  addMultipleChoice(form, 'Rentang usia Anda', [
    'Di bawah 25 tahun',
    '25-29 tahun',
    '30-45 tahun',
    '46-55 tahun',
    'Di atas 55 tahun',
    'Tidak ingin menjawab',
  ]);

  addMultipleChoice(form, 'Jenis kelamin (opsional)', [
    'Perempuan',
    'Laki-laki',
    'Tidak ingin menjawab',
  ], false);

  addMultipleChoice(form, 'Rata-rata jumlah transaksi usaha per hari', [
    '0-5 transaksi',
    '6-10 transaksi',
    '11-20 transaksi',
    '21-50 transaksi',
    'Lebih dari 50 transaksi',
    'Tidak tahu',
  ]);

  addMultipleChoice(form, 'Seberapa sering Anda memakai WhatsApp atau aplikasi chat?', [
    'Setiap hari',
    'Beberapa kali seminggu',
    'Jarang',
    'Tidak pernah',
  ]);

  form
    .addPageBreakItem()
    .setTitle('B. Cara mencatat saat ini')
    .setHelpText('Jawablah berdasarkan yang benar-benar dilakukan dalam tujuh hari terakhir, bukan cara yang ideal.');

  addCheckbox(form, 'Dalam 7 hari terakhir, bagaimana Anda mencatat uang masuk dan keluar usaha? (boleh pilih lebih dari satu)', [
    'Mengandalkan ingatan',
    'Buku/kertas catatan',
    'Kalkulator saja',
    'Chat pribadi/WhatsApp',
    'Catatan di ponsel',
    'Excel/Google Sheets',
    'Aplikasi kasir/POS',
    'Aplikasi pembukuan',
    'Tidak mencatat',
  ], true, true);

  addMultipleChoice(form, 'Dari pilihan tadi, mana yang paling utama Anda pakai?', [
    'Ingatan',
    'Buku/kertas',
    'Kalkulator',
    'Chat/catatan ponsel',
    'Excel/Google Sheets',
    'Aplikasi kasir/POS',
    'Aplikasi pembukuan',
    'Tidak mencatat',
  ], true, true);

  addMultipleChoice(form, 'Seberapa rutin transaksi dicatat?', [
    'Langsung setiap ada transaksi',
    'Dikumpulkan lalu dicatat setiap hari',
    'Beberapa kali seminggu',
    'Kalau sempat atau kalau ingat',
    'Hanya saat dibutuhkan',
    'Tidak pernah',
  ]);

  addMultipleChoice(form, 'Siapa yang paling sering mencatat keuangan usaha?', [
    'Saya sendiri',
    'Pasangan/anggota keluarga',
    'Karyawan/admin',
    'Akuntan/pihak luar',
    'Tidak ada yang khusus mencatat',
  ], true, true);

  addCheckbox(form, 'Informasi apa yang biasanya dicatat?', [
    'Nominal uang masuk',
    'Nominal uang keluar',
    'Tanggal',
    'Keterangan transaksi',
    'Kategori transaksi',
    'Sumber uang: kas usaha atau uang pribadi',
    'Utang/piutang',
    'Tidak ada format tetap',
  ], true, true);

  addParagraph(
    form,
    'Ceritakan kejadian terakhir ketika Anda lupa mencatat atau sulit mengetahui sisa uang usaha.',
    true,
    'Apa yang terjadi, kapan kira-kira terjadi, dan apa yang Anda lakukan? Jika belum pernah, tulis "belum pernah".'
  );

  form
    .addPageBreakItem()
    .setTitle('C. Pemisahan uang usaha dan uang pribadi')
    .setHelpText('Kami ingin memahami kejadian nyata, bukan menilai apakah cara Anda benar atau salah.');

  addMultipleChoice(form, 'Saat ini, bagaimana Anda memisahkan uang usaha dan uang pribadi?', [
    'Selalu terpisah: tempat/rekening dan catatannya berbeda',
    'Sebagian terpisah, tetapi kadang masih tercampur',
    'Sering tercampur',
    'Tidak dipisahkan',
    'Tidak yakin',
  ]);

  addMultipleChoice(form, 'Dalam 30 hari terakhir, seberapa sering uang usaha dan uang pribadi terpakai bergantian atau tercampur?', [
    'Tidak pernah',
    '1 kali',
    '2-3 kali',
    'Sekitar seminggu sekali',
    'Hampir setiap hari',
    'Tidak ingat',
  ]);

  addCheckbox(form, 'Jika pernah tercampur, apa penyebabnya? (boleh pilih lebih dari satu)', [
    'Butuh membayar kebutuhan usaha dengan uang pribadi',
    'Uang usaha dipakai untuk kebutuhan rumah/pribadi',
    'Belum punya tempat atau rekening terpisah',
    'Lupa mencatat sumber uang',
    'Terlalu sibuk untuk mencatat',
    'Tidak tahu cara memisahkannya',
    'Tidak pernah tercampur',
  ], false, true);

  addCheckbox(form, 'Apa akibat yang pernah Anda rasakan dari pencatatan atau pemisahan uang yang kurang rapi?', [
    'Tidak yakin berapa laba usaha',
    'Tidak tahu sisa kas usaha',
    'Sulit menentukan uang yang boleh dipakai pribadi',
    'Lupa pengeluaran tertentu',
    'Sulit merencanakan belanja/modal',
    'Bingung saat membuat laporan atau mengajukan bantuan/pinjaman',
    'Berselisih dengan keluarga/karyawan',
    'Belum pernah merasakan akibat',
  ], true, true);

  addScale(
    form,
    'Seberapa sulit mengetahui kondisi uang usaha Anda saat ini?',
    1,
    5,
    '1 = sangat mudah',
    '5 = sangat sulit'
  );

  addParagraph(
    form,
    'Bagian mana yang paling merepotkan dari cara pencatatan Anda sekarang?',
    true,
    'Tuliskan dengan kata-kata Anda sendiri.'
  );

  form
    .addPageBreakItem()
    .setTitle('D. Kebiasaan digital dan privasi')
    .setHelpText('Bagian ini membantu kami memilih cara penggunaan yang sesuai untuk tiap kelompok UMKM.');

  addMultipleChoice(form, 'Apakah Anda pernah mencoba aplikasi pembukuan atau kasir digital?', [
    'Ya, masih dipakai',
    'Ya, tetapi sudah berhenti',
    'Pernah melihat/mencoba sebentar',
    'Belum pernah',
  ]);

  addCheckbox(form, 'Jika pernah berhenti atau enggan memakai aplikasi, apa alasannya?', [
    'Terlalu rumit',
    'Terlalu banyak menu',
    'Harus mengetik terlalu banyak',
    'Tidak paham istilah keuangan',
    'Lupa mengisi secara rutin',
    'Biaya berlangganan',
    'Khawatir data tidak aman',
    'Internet/perangkat terbatas',
    'Belum merasa membutuhkan',
    'Tidak pernah mencoba aplikasi',
  ], false, true);

  addScale(
    form,
    'Seberapa nyaman Anda mengetik cerita singkat tentang transaksi seperti sedang mengirim chat?',
    1,
    5,
    '1 = tidak nyaman',
    '5 = sangat nyaman'
  );

  addMultipleChoice(form, 'Gaya bahasa mana yang paling mudah Anda pahami di aplikasi?', [
    'Sangat sederhana dan singkat',
    'Santai seperti chat',
    'Formal seperti laporan',
    'Gabungan: sederhana tetapi tetap sopan',
  ], true, true);

  addCheckbox(form, 'Data apa yang membuat Anda ragu memasukkannya ke aplikasi atau chatbot?', [
    'Nominal transaksi',
    'Nama usaha',
    'Nama pelanggan/pemasok',
    'Saldo uang',
    'Nomor rekening',
    'Foto bukti transaksi',
    'Tidak ada kekhawatiran khusus',
  ], true, true);

  form
    .addPageBreakItem()
    .setTitle('E. Undangan uji coba prototipe')
    .setHelpText(
      'ClearFlow.AI adalah prototipe pencatatan yang mengubah cerita singkat menjadi draft transaksi. Pengguna tetap memeriksa nominal, kategori, arus kas, dan sumber dana sebelum menyimpan. Teks cerita mentah tidak disimpan sebagai percakapan; yang disimpan setelah konfirmasi adalah data transaksi terstruktur.'
    );

  addCheckbox(form, 'Dalam situasi apa Anda mungkin memakai cara pencatatan seperti ini?', [
    'Saat baru selesai melayani pelanggan',
    'Saat menutup usaha di akhir hari',
    'Saat membayar kebutuhan usaha dengan uang pribadi',
    'Saat mengambil uang usaha untuk kebutuhan pribadi',
    'Saat mengecek sisa kas',
    'Saat mencari transaksi lama',
    'Saya belum melihat situasi yang cocok',
  ], true, true);

  addParagraph(
    form,
    'Apa yang mungkin membuat Anda berhenti, ragu, atau tidak memakai prototipe ini?',
    true,
    'Contoh: bahasa, waktu, biaya, kepercayaan, privasi, fitur, atau alasan lain.'
  );

  addMultipleChoice(form, 'Jika nanti terbukti berguna, model biaya mana yang paling mungkin Anda terima?', [
    'Fitur dasar gratis',
    'Kurang dari Rp10.000 per bulan',
    'Rp10.000-Rp25.000 per bulan',
    'Rp26.000-Rp50.000 per bulan',
    'Gratis karena ditanggung sponsor/bank/dinas/lembaga pembina',
    'Belum bisa menentukan',
    'Tidak bersedia membayar',
  ]);

  const willingness = form
    .addMultipleChoiceItem()
    .setTitle('Apakah Anda bersedia mencoba prototipe selama 7 hari dan memberi masukan singkat?')
    .setHelpText('Kesediaan ini tidak mengikat dan uji coba tidak meminta PIN, kata sandi, atau data rekening.')
    .setRequired(true);

  const contactPage = form
    .addPageBreakItem()
    .setTitle('F. Kontak uji coba')
    .setHelpText('Bagian ini hanya muncul bagi responden yang bersedia dihubungi. Kontak tidak dimasukkan ke analisis anonim.');

  willingness.setChoices([
    willingness.createChoice('Ya, saya bersedia dihubungi', contactPage),
    willingness.createChoice('Mungkin, saya ingin melihat detail dulu', FormApp.PageNavigationType.SUBMIT),
    willingness.createChoice('Belum bersedia', FormApp.PageNavigationType.SUBMIT),
  ]);

  addText(form, 'Nama panggilan', true);
  addText(form, 'Nomor WhatsApp yang dapat dihubungi', true, 'Gunakan hanya untuk penjadwalan uji coba.');
  addMultipleChoice(form, 'Saya mengizinkan tim ClearFlow.AI menghubungi saya untuk uji coba dan tindak lanjut riset ini.', [
    'Ya, saya mengizinkan',
  ]);

  const responseSheet = SpreadsheetApp.create(title + ' - Respons');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, responseSheet.getId());
  addSurveyAnalysisGuide(responseSheet);

  return formResult(form, responseSheet);
}

function buildPrototypeObservationForm() {
  const title = 'INTERNAL - Lembar Observasi Uji Prototipe ClearFlow.AI';
  const form = FormApp.create(title, true);

  configureForm(
    form,
    [
      'KHUSUS TIM/PEWAWANCARA - jangan kirim form ini kepada responden.',
      '',
      'Isi satu respons untuk satu sesi uji. Berikan tugas tanpa menjelaskan tombol satu per satu. Catat perilaku, waktu, bantuan, dan ucapan asli; jangan hanya mencatat pujian.',
      '',
      'Gunakan kode anonim seperti CF-001. Jangan masukkan NIK, PIN, kata sandi, nomor rekening, atau transaksi sensitif responden.',
    ].join('\n'),
    'Observasi tersimpan. Pastikan rekaman/catatan mentah diberi kode responden yang sama.'
  );

  form
    .addSectionHeaderItem()
    .setTitle('Identitas sesi')
    .setHelpText('Gunakan data minimum yang dibutuhkan untuk analisis.');

  form.addDateItem().setTitle('Tanggal uji').setIncludesYear(true).setRequired(true);
  addText(form, 'Kode responden anonim', true, 'Contoh: CF-001');
  addText(form, 'Inisial penguji/observer', true);

  addMultipleChoice(form, 'Jenis sesi', [
    'Uji pertama',
    'Uji ulang setelah perbaikan',
    'Pilot hari ke-1',
    'Pilot hari ke-7',
  ]);

  addMultipleChoice(form, 'Bidang usaha responden', [
    'Kuliner/makanan/minuman',
    'Toko/retail/perdagangan',
    'Fashion/kerajinan',
    'Jasa',
    'Pertanian/peternakan',
    'Produksi rumahan',
  ], true, true);

  addMultipleChoice(form, 'Rentang usia responden', [
    'Di bawah 25 tahun',
    '25-29 tahun',
    '30-45 tahun',
    '46-55 tahun',
    'Di atas 55 tahun',
    'Tidak diketahui/tidak menjawab',
  ]);

  addMultipleChoice(form, 'Cara pencatatan utama responden sebelum ClearFlow.AI', [
    'Ingatan',
    'Buku/kertas',
    'Kalkulator',
    'Chat/catatan ponsel',
    'Excel/Google Sheets',
    'Aplikasi kasir/POS',
    'Aplikasi pembukuan',
    'Tidak mencatat',
  ], true, true);

  form
    .addPageBreakItem()
    .setTitle('Hasil tugas uji')
    .setHelpText('Status "tanpa bantuan" berarti observer tidak menunjukkan tombol atau urutan langkah.');

  const statusOptions = [
    'Selesai tanpa bantuan',
    'Selesai dengan satu bantuan',
    'Selesai dengan lebih dari satu bantuan',
    'Tidak selesai',
    'Tidak diuji',
  ];

  addTaskStatus(form, 'Tugas 1 - Catat penjualan Rp300.000 yang masuk ke kas usaha', statusOptions);
  addText(form, 'Waktu Tugas 1 sampai draft siap (detik)', true, 'Isi angka saja, misalnya 75.');

  addTaskStatus(form, 'Tugas 2 - Catat pembelian bahan Rp50.000 memakai uang pribadi', statusOptions);
  addText(form, 'Waktu Tugas 2 sampai draft siap (detik)', true, 'Isi angka saja, misalnya 90.');

  addTaskStatus(form, 'Tugas 3 - Periksa draft dan perbaiki kategori yang salah', statusOptions);
  addTaskStatus(form, 'Tugas 4 - Temukan transaksi tadi di riwayat', statusOptions);
  addTaskStatus(form, 'Tugas 5 - Edit nominal transaksi', statusOptions);
  addTaskStatus(form, 'Tugas 6 - Hapus satu transaksi yang salah', statusOptions);
  addTaskStatus(form, 'Tugas 7 - Jelaskan arti saldo kas usaha dan dana pribadi di beranda', statusOptions);

  addMultipleChoice(form, 'Apakah nominal dan sumber dana tersimpan benar setelah pengguna mengonfirmasi?', [
    'Ya, semuanya benar',
    'Sebagian benar',
    'Tidak benar',
    'Tidak sampai tahap simpan',
  ]);

  addText(form, 'Jumlah bantuan/petunjuk yang diberikan selama seluruh sesi', true, 'Isi 0 jika tidak ada bantuan.');
  addText(form, 'Total durasi tujuh tugas (menit)', true, 'Isi angka, misalnya 8 atau 8,5.');

  form
    .addPageBreakItem()
    .setTitle('Temuan setelah uji')
    .setHelpText('Catat apa yang terjadi, bukan apa yang ingin kita dengar.');

  addParagraph(
    form,
    'Di bagian mana responden berhenti, ragu, salah, atau meminta bantuan?',
    true,
    'Sebutkan layar/tombol/istilah dan tindakan yang terlihat.'
  );

  addParagraph(
    form,
    'Tuliskan satu kutipan asli responden yang paling penting.',
    true,
    'Tanpa nama. Jangan memperbaiki pilihan katanya.'
  );

  addMultipleChoice(form, 'Setelah dijelaskan, apakah responden memahami bahwa cerita diproses menjadi draft dan tidak langsung disimpan?', [
    'Paham tanpa pertanyaan tambahan',
    'Paham setelah dijelaskan ulang',
    'Masih ragu/tidak paham',
    'Tidak ditanyakan',
  ]);

  addCheckbox(form, 'Kekhawatiran yang disebut responden setelah uji', [
    'Keamanan/privasi data',
    'Ketepatan nominal atau kategori',
    'Biaya',
    'Butuh internet',
    'Takut salah pencet',
    'Bahasa/istilah sulit',
    'Terlalu banyak langkah',
    'Tidak ada kekhawatiran yang disebut',
  ], true, true);

  addMultipleChoice(form, 'Apakah responden bersedia mencoba selama 7 hari?', [
    'Ya',
    'Mungkin, perlu penjelasan lebih lanjut',
    'Tidak',
    'Belum ditanyakan',
  ]);

  addParagraph(
    form,
    'Perbaikan paling penting sebelum uji berikutnya',
    true,
    'Pilih satu hal yang paling menghambat penyelesaian tugas.'
  );

  addParagraph(form, 'Catatan bug atau kejadian teknis (opsional)', false);

  const responseSheet = SpreadsheetApp.create(title + ' - Respons');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, responseSheet.getId());
  addUsabilityAnalysisGuide(responseSheet);

  return formResult(form, responseSheet);
}

function configureForm(form, description, confirmationMessage) {
  form
    .setDescription(description)
    .setConfirmationMessage(confirmationMessage)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true)
    .setPublishingSummary(false)
    .setShowLinkToRespondAgain(false)
    .setShuffleQuestions(false);
}

function addText(form, title, required, helpText) {
  const item = form.addTextItem().setTitle(title).setRequired(required !== false);
  if (helpText) item.setHelpText(helpText);
  return item;
}

function addParagraph(form, title, required, helpText) {
  const item = form.addParagraphTextItem().setTitle(title).setRequired(required !== false);
  if (helpText) item.setHelpText(helpText);
  return item;
}

function addMultipleChoice(form, title, choices, required, showOther) {
  const item = form
    .addMultipleChoiceItem()
    .setTitle(title)
    .setChoiceValues(choices)
    .setRequired(required !== false);
  if (showOther) item.showOtherOption(true);
  return item;
}

function addCheckbox(form, title, choices, required, showOther) {
  const item = form
    .addCheckboxItem()
    .setTitle(title)
    .setChoiceValues(choices)
    .setRequired(required !== false);
  if (showOther) item.showOtherOption(true);
  return item;
}

function addScale(form, title, lower, upper, lowerLabel, upperLabel) {
  return form
    .addScaleItem()
    .setTitle(title)
    .setBounds(lower, upper)
    .setLabels(lowerLabel, upperLabel)
    .setRequired(true);
}

function addTaskStatus(form, title, choices) {
  return addMultipleChoice(form, title, choices, true, false);
}

function formResult(form, responseSheet) {
  return {
    title: form.getTitle(),
    editUrl: form.getEditUrl(),
    publicUrl: form.getPublishedUrl(),
    responseSheetUrl: responseSheet.getUrl(),
    formId: form.getId(),
    responseSheetId: responseSheet.getId(),
  };
}

function addSurveyAnalysisGuide(spreadsheet) {
  const guide = spreadsheet.insertSheet('PANDUAN ANALISIS', 0);
  const rows = [
    ['PANDUAN ANALISIS SURVEI CLEARFLOW.AI', ''],
    ['Prinsip', 'Gunakan hasil aktual. Jangan mengubah target menjadi klaim pencapaian.'],
    ['Sampel awal', '12-15 UMKM dari minimal 3 sektor dan 3 rentang usia.'],
    ['Validasi masalah', 'Hitung responden yang spontan menceritakan masalah pencatatan/pemisahan dana. Target usulan >=60%.'],
    ['Cara lama', 'Hitung responden dengan cara utama ingatan, kertas, atau chat/catatan ponsel. Target usulan >=50%.'],
    ['Segmen awal', 'Bandingkan sektor, usia, transaksi harian, WhatsApp, pemisahan dana, dan dampak. Pilih satu kelompok dengan masalah serta kesiapan adopsi tertinggi.'],
    ['Minat pilot', 'Pisahkan Ya, Mungkin, dan Tidak. Minat bukan bukti keberhasilan produk; gunakan untuk rekrutmen uji.'],
    ['Kutipan', 'Pilih 2-3 kutipan anonim yang konkret dan mewakili pola, bukan hanya pujian.'],
    ['Privasi', 'Pisahkan kolom kontak dari analisis. Jangan salin NIK, PIN, kata sandi, nomor rekening, atau transaksi sensitif.'],
    ['Bahasa deck', 'Tulis "hasil validasi" hanya untuk angka yang benar-benar terkumpul. Tulis "target" untuk ambang yang belum tercapai.'],
  ];
  guide.getRange(1, 1, rows.length, 2).setValues(rows);
  formatGuideSheet(guide, rows.length);
}

function addUsabilityAnalysisGuide(spreadsheet) {
  const guide = spreadsheet.insertSheet('PANDUAN ANALISIS', 0);
  const rows = [
    ['PANDUAN ANALISIS UJI PROTOTIPE CLEARFLOW.AI', ''],
    ['Cara menguji', 'Berikan tugas tanpa menunjukkan tombol. Bantuan baru diberikan setelah responden mencoba sendiri.'],
    ['Sampel awal', 'Pilih 6-8 responden dengan masalah paling relevan dari survei.'],
    ['Penyelesaian tugas', 'Hitung status per tugas. Target usulan pada uji kedua: minimal 5 dari 6 tugas inti selesai tanpa bantuan.'],
    ['Kecepatan', 'Gunakan median, bukan hanya rata-rata. Target usulan: pencatatan satu transaksi <2 menit.'],
    ['Ketepatan', 'Hitung sesi dengan nominal dan sumber dana benar setelah konfirmasi. Target usulan >=70%.'],
    ['Pilot', 'Target usulan: minimal 5 responden bersedia mencoba selama 7 hari.'],
    ['Bukti', 'Simpan hasil tugas, waktu, bantuan, bug, dan kutipan. Pujian tanpa perilaku bukan bukti keberhasilan.'],
    ['Privasi', 'Gunakan kode anonim. Jangan masukkan data identitas atau keuangan sensitif responden.'],
    ['Iterasi', 'Setelah setiap sesi, pilih satu hambatan terbesar untuk diperbaiki sebelum uji berikutnya.'],
  ];
  guide.getRange(1, 1, rows.length, 2).setValues(rows);
  formatGuideSheet(guide, rows.length);
}

function formatGuideSheet(sheet, rowCount) {
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 700);
  sheet.getRange(1, 1, rowCount, 2).setWrap(true).setVerticalAlignment('top');
  sheet.getRange(1, 1, 1, 2).setBackground('#0B2341').setFontColor('#FFFFFF').setFontWeight('bold');
  if (rowCount > 1) {
    sheet.getRange(2, 1, rowCount - 1, 1).setBackground('#EAF2FF').setFontWeight('bold');
  }
}

function buildResearchHub(survey, usability) {
  const spreadsheet = SpreadsheetApp.create('ClearFlow.AI - Pusat Link Riset');
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('LINK DAN PETUNJUK');

  const rows = [
    ['Berkas', 'Fungsi', 'Link untuk dibagikan/diisi', 'Link edit', 'Spreadsheet respons'],
    [survey.title, 'Survei masalah - kirim ke pelaku UMKM', survey.publicUrl, survey.editUrl, survey.responseSheetUrl],
    [usability.title, 'Observasi uji prototipe - hanya diisi tim', usability.publicUrl, usability.editUrl, usability.responseSheetUrl],
  ];

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, rows[0].length).setBackground('#0B2341').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(1, 1, rows.length, rows[0].length).setWrap(true).setVerticalAlignment('top');
  sheet.setColumnWidth(1, 310);
  sheet.setColumnWidth(2, 310);
  sheet.setColumnWidth(3, 430);
  sheet.setColumnWidth(4, 430);
  sheet.setColumnWidth(5, 430);

  const notes = spreadsheet.insertSheet('SEBELUM DISEBAR');
  const checklist = [
    ['CHECKLIST SEBELUM DISEBAR'],
    ['1. Buka link edit survei dan baca dari awal sampai akhir.'],
    ['2. Pada akses responden, pastikan pelaku UMKM di luar organisasi dapat membuka form jika akun tim memakai Google Workspace.'],
    ['3. Isi satu respons percobaan lewat ponsel. Pastikan cabang persetujuan dan kontak bekerja.'],
    ['4. Hapus respons percobaan dari Form dan spreadsheet agar angka riset mulai dari nol.'],
    ['5. Bagikan hanya link survei masalah kepada responden. Form observasi diisi oleh tim saat uji aplikasi.'],
    ['6. Jangan mengubah target usulan menjadi klaim hasil sebelum data terkumpul.'],
  ];
  notes.getRange(1, 1, checklist.length, 1).setValues(checklist);
  notes.setColumnWidth(1, 850);
  notes.getRange(1, 1, checklist.length, 1).setWrap(true);
  notes.getRange(1, 1).setBackground('#0B2341').setFontColor('#FFFFFF').setFontWeight('bold');

  return { id: spreadsheet.getId(), url: spreadsheet.getUrl() };
}
