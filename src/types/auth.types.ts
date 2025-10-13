/**
 * Authentication Types
 *
 * Defines types for user authentication flow including modes, user data, and errors.
 */

/**
 * Authentication mode for the auth modal
 * @typedef {('login' | 'signup')} AuthMode
 */
export type AuthMode = 'login' | 'signup';

/**
 * User data structure
 * @interface User
 * @property {string} uid - Firebase user ID
 * @property {string | null} email - User email address (nullable)
 * @property {string | null} username - Display name/username (nullable)
 */
export interface User {
  uid: string;
  email: string | null;
  username: string | null;
}

/**
 * Authentication error structure
 * @interface AuthError
 * @property {string} code - Firebase error code
 * @property {string} message - User-friendly error message
 */
export interface AuthError {
  code: string;
  message: string;
}
