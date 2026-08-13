import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBoZ2u4AUL4R_nZENMpl0Rs-xG1RDBcDCo',
  authDomain: 'clearfloww.firebaseapp.com',
  projectId: 'clearfloww',
  storageBucket: 'clearfloww.firebasestorage.app',
  messagingSenderId: '399518069291',
  appId: '1:399518069291:web:9862f28b4ef3d294a5f06e',
  measurementId: 'G-3R3BH2WCDT',
}

export const firebaseApp = initializeApp(firebaseConfig)

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim()
if (appCheckSiteKey && typeof window !== 'undefined') {
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG === 'true') {
    ;(globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export const auth = getAuth(firebaseApp)
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence)

export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

let analyticsPromise: Promise<unknown> | undefined

export const initializeObservability = () => {
  analyticsPromise ??= Promise.allSettled([
    import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) return getAnalytics(firebaseApp)
      return undefined
    }),
    import('firebase/performance').then(({ getPerformance }) => getPerformance(firebaseApp)),
  ])
  return analyticsPromise
}

export const trackEvent = async (name: string, params?: Record<string, string | number | boolean>) => {
  try {
    const { getAnalytics, isSupported, logEvent } = await import('firebase/analytics')
    if (!(await isSupported())) return
    logEvent(getAnalytics(firebaseApp), name, params)
  } catch {
    // Observability must never block the bookkeeping flow.
  }
}
