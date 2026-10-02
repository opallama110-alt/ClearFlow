# Google Form Riset ClearFlow.AI

Generator siap pakai ada di:

`scripts/create_clearflow_google_forms.js`

Generator tersebut membuat tiga berkas utama di Google Drive:

1. **Survei Kebiasaan Pencatatan Keuangan UMKM** — dibagikan kepada responden.
2. **INTERNAL - Lembar Observasi Uji Prototipe** — hanya diisi tim saat responden mencoba aplikasi.
3. **ClearFlow.AI - Pusat Link Riset** — berisi semua link publik, link edit, spreadsheet respons, dan checklist.

Kedua form sengaja dipisahkan. Survei pertama membuktikan masalah dan menentukan segmen. Form kedua merekam perilaku nyata saat memakai prototipe. Dengan begitu, jawaban sopan seperti “aplikasinya bagus” tidak tercampur dengan bukti penyelesaian tugas.

## Cara membuat form otomatis

1. Masuk ke akun Google tim.
2. Buka <https://script.new>.
3. Hapus isi bawaan `Code.gs`.
4. Buka file `scripts/create_clearflow_google_forms.js` dari folder proyek ini.
5. Salin seluruh isinya ke `Code.gs`, lalu klik **Save**.
6. Pilih fungsi **createClearFlowResearchForms** pada daftar fungsi di bagian atas.
7. Klik **Run**.
8. Saat Google meminta izin, pilih akun tim, baca izinnya, lalu izinkan akses ke Google Forms dan Google Sheets.
9. Setelah status eksekusi selesai, buka Google Drive dan cari **ClearFlow.AI - Pusat Link Riset**.

Jalankan generator **satu kali saja**. Menjalankannya lagi akan membuat salinan form baru.

## Sebelum link dikirim

- Buka link edit survei dan baca semua pertanyaan.
- Jika akun tim memakai Google Workspace, periksa akses responden dan pastikan orang di luar organisasi bisa membuka form.
- Isi satu respons uji dari ponsel.
- Pastikan responden yang tidak menyetujui riset langsung selesai, sedangkan yang bersedia dihubungi melihat kolom kontak.
- Hapus respons uji dari Google Form dan spreadsheet supaya data lapangan dimulai dari nol.
- Bagikan hanya link **Survei Kebiasaan Pencatatan Keuangan UMKM** kepada pelaku UMKM.
- Form berjudul **INTERNAL** jangan dibagikan; form itu diisi pewawancara saat uji prototipe.

## Cara menyebarkan tanpa menggiring jawaban

Contoh pesan WhatsApp:

> Halo, Kak/Bu/Pak. Kami sedang meneliti cara pelaku UMKM mencatat uang masuk dan keluar sehari-hari. Kami belum mencari penilaian bagus atau jelek terhadap aplikasi; kami ingin memahami kejadian yang benar-benar dialami. Survei anonim ini memerlukan sekitar 7–10 menit dan tidak meminta PIN, kata sandi, nomor rekening, atau rincian transaksi sensitif. Jika berkenan, formulirnya dapat diisi melalui tautan berikut: [TEMPEL LINK SURVEI]. Terima kasih.

Jangan mengawali dengan kalimat seperti “ClearFlow membantu memisahkan uang, kan?” karena pertanyaan tersebut mengarahkan responden untuk menyetujui solusi.

## Target pengumpulan awal

- 12–15 UMKM dari sedikitnya 3 sektor.
- Usahakan ada responden usia di bawah 30, 30–45, dan di atas 45 tahun.
- Pilih 6–8 responden dengan masalah paling relevan untuk uji prototipe.
- Simpan kode anonim, waktu tugas, jumlah bantuan, kesalahan, dan kutipan asli.

Angka target pada tab **PANDUAN ANALISIS** adalah ambang usulan, bukan hasil yang boleh diklaim sebelum respons benar-benar terkumpul.
