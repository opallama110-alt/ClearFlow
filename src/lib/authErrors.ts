export const authErrorMessage = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email atau kata sandi tidak cocok.',
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan masuk.',
    'auth/weak-password': 'Kata sandi minimal 8 karakter.',
    'auth/invalid-email': 'Format email belum benar.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
    'auth/network-request-failed': 'Koneksi internet bermasalah. Silakan coba lagi.',
    'auth/popup-closed-by-user': 'Jendela Google ditutup sebelum proses selesai.',
    'auth/popup-blocked': 'Browser memblokir jendela Google. Izinkan pop-up lalu coba lagi.',
    'auth/operation-not-allowed': 'Metode login ini belum diaktifkan pada Firebase.',
    'auth/requires-recent-login': 'Demi keamanan, silakan keluar dan masuk lagi sebelum menghapus akun.',
    'auth/credential-already-in-use': 'Akun tersebut sudah terhubung ke pengguna lain.',
  }
  return messages[code] ?? 'Proses belum berhasil. Silakan coba lagi.'
}
