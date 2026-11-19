import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from 'firebase/firestore'

const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'

if (!useEmulator && !import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn(
    '[TaskFlow] Missing VITE_FIREBASE_API_KEY environment variable. Configure Firebase env vars in .env.local or Vercel Project Settings.',
  )
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-taskflow',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-taskflow.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Offline persistence enabled across tabs
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8085)
}
