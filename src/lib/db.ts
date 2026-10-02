import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { firebaseApp, USE_EMULATORS } from '../firebase'

// Dipisahkan dari firebase.ts agar chunk Firestore hanya dimuat setelah pengguna masuk.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (USE_EMULATORS) connectFirestoreEmulator(db, '127.0.0.1', 8080)
