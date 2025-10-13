/**
 * Firebase Firestore Module
 *
 * Exports Firestore instance and commonly used Firestore functions.
 * Used for storing canvas objects with 500ms debounce for sync.
 */

import {
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
} from 'firebase/firestore'
import { firestore } from './config'

// Re-export firestore instance
export { firestore }

// Re-export commonly used Firestore functions
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
}

// Re-export types
export type {
  DocumentData,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
}
