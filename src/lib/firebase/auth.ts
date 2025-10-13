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
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './config'

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
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth)
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

  const firebaseError = error as { code?: string; message?: string }

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
    default:
      return firebaseError.message || 'Authentication failed. Please try again'
  }
}

// Re-export auth instance
export { auth }
export type { User }
