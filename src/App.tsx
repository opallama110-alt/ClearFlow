import { lazy, Suspense, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from 'firebase/auth'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import { auth, authPersistenceReady, initializeObservability, trackEvent } from './firebase'
import { authErrorMessage } from './lib/authErrors'

const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true'

// Ruang kerja (beserta Firestore) dimuat terpisah agar halaman masuk tampil lebih cepat.
const loadWorkspace = () => import('./workspace/Workspace')
const Workspace = lazy(loadWorkspace)

export default function App() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const [userRevision, setUserRevision] = useState(0)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    const unsubscribers: Array<() => void> = []
    void authPersistenceReady.then(() => {
      if (cancelled) return
      unsubscribers.push(onAuthStateChanged(auth, (user) => {
        if (user) void loadWorkspace()
        setAuthUser(user)
      }))
      // Menautkan akun tamu tidak memicu onAuthStateChanged, tetapi memperbarui token.
      unsubscribers.push(onIdTokenChanged(auth, () => setUserRevision((current) => current + 1)))
    })
    void initializeObservability()
    return () => {
      cancelled = true
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  // Saat halaman masuk terbuka, unduh chunk ruang kerja di waktu senggang.
  useEffect(() => {
    if (authUser !== null) return undefined
    const timeout = window.setTimeout(() => void loadWorkspace(), 2_000)
    return () => window.clearTimeout(timeout)
  }, [authUser])

  const runAuth = async (action: () => Promise<unknown>, successMessage = '') => {
    setAuthBusy(true)
    setAuthError('')
    setAuthNotice('')
    try {
      await action()
      if (successMessage) setAuthNotice(successMessage)
    } catch (error) {
      setAuthError(authErrorMessage(error))
    } finally {
      setAuthBusy(false)
    }
  }

  const emailLogin = (email: string, password: string) => runAuth(async () => {
    await signInWithEmailAndPassword(auth, email, password)
    void trackEvent('login', { method: 'email' })
  })

  const emailRegister = (name: string, email: string, password: string) => runAuth(async () => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    void sendEmailVerification(result.user).catch(() => undefined)
    void trackEvent('sign_up', { method: 'email' })
  })

  const resetPassword = (email: string) => runAuth(
    () => sendPasswordResetEmail(auth, email),
    'Jika email terdaftar, tautan pemulihan sudah dikirim. Periksa kotak masuk dan folder spam.',
  )

  const googleLogin = () => runAuth(async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
    void trackEvent('login', { method: 'google' })
  })

  const guestLogin = () => runAuth(async () => {
    await signInAnonymously(auth)
    void trackEvent('login', { method: 'anonymous' })
  })

  if (authUser === undefined) return <LoadingScreen label="Menyiapkan ClearFlow..." />

  if (!authUser) {
    return (
      <AuthScreen
        busy={authBusy}
        error={authError}
        notice={authNotice}
        googleEnabled={GOOGLE_AUTH_ENABLED}
        onEmailLogin={emailLogin}
        onEmailRegister={emailRegister}
        onPasswordReset={resetPassword}
        onGoogle={googleLogin}
        onGuest={guestLogin}
        onModeChange={() => {
          setAuthError('')
          setAuthNotice('')
        }}
      />
    )
  }

  return (
    <Suspense fallback={<LoadingScreen label="Membuka ruang usaha..." />}>
      <Workspace key={authUser.uid} user={authUser} userRevision={userRevision} />
    </Suspense>
  )
}
