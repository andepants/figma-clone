/**
 * Firebase Configuration
 *
 * Initializes Firebase app and exports core services:
 * - Firebase app instance
 * - Authentication
 * - Firestore database
 * - Realtime database
 * - Cloud Functions
 * - Cloud Storage
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth'
import {
  initializeFirestore,
  type Firestore,
  connectFirestoreEmulator,
  persistentLocalCache,
} from 'firebase/firestore'
import { getDatabase, type Database, connectDatabaseEmulator } from 'firebase/database'
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth: Auth = getAuth(app)
export const firestore: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache(/* settings */ {}),
})
export const realtimeDb: Database = getDatabase(app)
export const functions: Functions = getFunctions(app)
export const storage: FirebaseStorage = getStorage(app)

// Connect to Firebase Emulators in development
// This ensures complete isolation from production data during local development
if (import.meta.env.DEV) {
  // Only log emulator connection details if explicitly enabled
  if (import.meta.env.VITE_SHOW_EMULATOR_LOGS === 'true') {
    console.log('🔧 Using Firebase Emulators (local development)')
    console.log('   → Auth: localhost:9099')
    console.log('   → Firestore: localhost:9150')
    console.log('   → Realtime DB: localhost:9000')
    console.log('   → Functions: localhost:5001')
    console.log('   → Storage: localhost:9199')
  }

  // Connect all services to local emulators
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(firestore, 'localhost', 9150)
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000)
  connectFunctionsEmulator(functions, 'localhost', 5001)
  connectStorageEmulator(storage, 'localhost', 9199)
}
