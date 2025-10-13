/**
 * Firebase Barrel Export
 *
 * Central export point for all Firebase services and utilities.
 * Import Firebase functionality from this file throughout the app.
 */

// Export Firebase app and core services
export { app, auth, firestore, realtimeDb } from './config'

// Export authentication utilities
export {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  type User,
} from './auth'

// Export Firestore utilities
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type DocumentData,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
} from './firestore'

// Export Realtime Database utilities
export {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  push,
  type DatabaseReference,
} from './realtimedb'
