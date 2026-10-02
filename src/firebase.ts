import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from 'firebase/auth'

const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)

/**
 * Emulator hanya boleh aktif di localhost, sehingga build yang tidak sengaja memakai
 * VITE_USE_FIREBASE_EMULATORS=true tetap aman ketika ter-deploy.
 */
export const USE_EMULATORS = isLocalHost && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

// Konfigurasi web Firebase memang bersifat publik; keamanan data dijaga oleh
// Security Rules, App Check, dan Authentication.
const firebaseConfig = {
  apiKey: 'AIzaSyBoZ2u4AUL4R_nZENMpl0Rs-xG1RDBcDCo',
  authDomain: 'clearfloww.firebaseapp.com',
  projectId: USE_EMULATORS ? 'demo-clearflow' : 'clearfloww',
  storageBucket: 'clearfloww.firebasestorage.app',
  messagingSenderId: '399518069291',
  appId: '1:399518069291:web:9862f28b4ef3d294a5f06e',
  measurementId: 'G-3R3BH2WCDT',
}

export const firebaseApp = initializeApp(firebaseConfig)

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim()
if (appCheckSiteKey && typeof window !== 'undefined' && !USE_EMULATORS) {
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG === 'true') {
    ;(globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export const auth = getAuth(firebaseApp)
auth.languageCode = 'id'
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => undefined)

if (USE_EMULATORS) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

const observabilityEnabled = !USE_EMULATORS && import.meta.env.PROD

let analyticsPromise: Promise<unknown> | undefined

export const initializeObservability = () => {
  if (!observabilityEnabled) return Promise.resolve()
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
  if (!observabilityEnabled) return
  try {
    const { getAnalytics, isSupported, logEvent } = await import('firebase/analytics')
    if (!(await isSupported())) return
    logEvent(getAnalytics(firebaseApp), name, params)
  } catch {
    // Observability tidak boleh menghambat alur pembukuan.
  }
}

/** Melaporkan error tanpa isi transaksi: hanya nama error dan potongan pesan teknis. */
export const reportError = (error: unknown, context: string, fatal = false) => {
  const description = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  if (import.meta.env.DEV) console.error(`[${context}]`, error)
  void trackEvent('exception', { description: `${context} | ${description}`.slice(0, 150), fatal })
}
