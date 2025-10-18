/**
 * Firebase Authentication Module
 *
 * Exports authentication instance and helper functions for:
 * - User sign up
 * - User sign in
 * - User sign out
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './config'

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider()

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @param displayName - User's display name (username)
 * @returns UserCredential with user information
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)

  // Update user profile with display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }

  return userCredential
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns UserCredential with user information
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Sign in with Google using popup flow
 * Creates new user if doesn't exist, signs in existing user otherwise
 * @returns UserCredential with user information
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider)
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

/**
 * Firebase error shape
 */
interface FirebaseError {
  code?: string;
  message?: string;
}

/**
 * Maps Firebase auth error codes to user-friendly messages
 * @param error - Firebase auth error
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'An unexpected error occurred'
  }

  const firebaseError = error as FirebaseError

  switch (firebaseError.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/user-disabled':
      return 'This account has been disabled'
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/invalid-credential':
      return 'Invalid email or password'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection'
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing'
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by the browser'
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address'
    default:
      return firebaseError.message || 'Authentication failed. Please try again'
  }
}

// Re-export auth instance
export { auth }
export type { User }
