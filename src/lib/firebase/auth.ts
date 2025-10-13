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

// Re-export auth instance
export { auth }
export type { User }
