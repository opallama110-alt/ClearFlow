const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email atau kata sandi tidak cocok.',
  'auth/invalid-login-credentials': 'Email atau kata sandi tidak cocok.',
  'auth/wrong-password': 'Email atau kata sandi tidak cocok.',
  'auth/user-not-found': 'Email atau kata sandi tidak cocok.',
  'auth/user-disabled': 'Akun ini dinonaktifkan. Hubungi penyelenggara pilot.',
  'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan masuk.',
  'auth/weak-password': 'Kata sandi minimal 8 karakter.',
  'auth/password-does-not-meet-requirements': 'Kata sandi belum memenuhi syarat keamanan. Gunakan minimal 8 karakter.',
  'auth/invalid-email': 'Format email belum benar.',
  'auth/missing-email': 'Email wajib diisi.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  'auth/network-request-failed': 'Koneksi internet bermasalah. Silakan coba lagi.',
  'auth/popup-closed-by-user': 'Jendela Google ditutup sebelum proses selesai.',
  'auth/cancelled-popup-request': 'Jendela Google ditutup sebelum proses selesai.',
  'auth/popup-blocked': 'Browser memblokir jendela Google. Izinkan pop-up lalu coba lagi.',
  'auth/operation-not-supported-in-this-environment': 'Login Google tidak didukung di browser ini. Buka ClearFlow di Chrome atau Safari.',
  'auth/web-storage-unsupported': 'Browser ini memblokir penyimpanan data. Buka ClearFlow di Chrome atau Safari.',
  'auth/unauthorized-domain': 'Domain ini belum diizinkan untuk login. Gunakan clearfloww.web.app.',
  'auth/operation-not-allowed': 'Metode login ini belum diaktifkan pada Firebase.',
  'auth/requires-recent-login': 'Demi keamanan, silakan keluar lalu masuk lagi sebelum melanjutkan.',
  'auth/credential-already-in-use': 'Akun tersebut sudah terhubung ke pengguna lain.',
  'auth/provider-already-linked': 'Akun ini sudah terhubung dengan metode tersebut.',
  'auth/admin-restricted-operation': 'Mode tamu sedang dinonaktifkan. Silakan buat akun dengan email.',
  'auth/firebase-app-check-token-is-invalid': 'Verifikasi keamanan browser gagal. Muat ulang halaman lalu coba lagi.',
}

export const authErrorCode = (error: unknown) =>
  typeof error === 'object' && error && 'code' in error ? String(error.code) : ''

export const authErrorMessage = (error: unknown) =>
  MESSAGES[authErrorCode(error)] ?? 'Proses belum berhasil. Silakan coba lagi.'

/** Browser bawaan aplikasi (Instagram, WhatsApp, dll.) sering memblokir login Google via pop-up. */
export const isInAppBrowser = (userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) =>
  /FBAN|FBAV|Instagram|Line\/|WhatsApp|TikTok|musical_ly|Snapchat|; wv\)/i.test(userAgent)
