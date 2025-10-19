/**
 * useAuth Hook
 *
 * Provides authentication state and methods throughout the app.
 * Manages user session, login, signup, and logout functionality.
 */

import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signUpWithEmail, signInWithEmail, signInWithGoogle, signOutUser, getAuthErrorMessage, createUser, getUser, updateLastLogin, updateUser } from '@/lib/firebase';
import type { User } from '@/types';

/**
 * Google sign-in pending user data (for username selection flow)
 */
export interface PendingGoogleUser {
  uid: string;
  email: string;
  suggestedUsername: string;
}

/**
 * Authentication context value
 * @interface AuthContextValue
 * @property {User | null} currentUser - Currently authenticated user
 * @property {boolean} loading - Whether auth state is being determined
 * @property {PendingGoogleUser | null} pendingGoogleUser - Google user awaiting username selection
 * @property {(email: string, password: string) => Promise<void>} login - Login function
 * @property {(email: string, password: string, username: string) => Promise<void>} signup - Signup function
 * @property {() => Promise<void>} loginWithGoogle - Google login function
 * @property {(username: string) => Promise<void>} completeGoogleSignup - Complete Google signup with username
 * @property {() => Promise<void>} logout - Logout function
 */
interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  pendingGoogleUser: PendingGoogleUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleSignup: (username: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Authentication context
 */
const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider component
 * @interface AuthProviderProps
 * @property {React.ReactNode} children - Child components
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 * Wraps the app to provide auth state and methods
 * @param {AuthProviderProps} props - Component props
 * @returns {JSX.Element} Provider component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pendingGoogleUser, setPendingGoogleUser] = React.useState<PendingGoogleUser | null>(null);

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async function login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Sign up new user with email, password, and username
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} username - Display name
   */
  async function signup(email: string, password: string, username: string): Promise<void> {
    try {
      await signUpWithEmail(email, password, username);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Sign in with Google account
   * Uses popup flow for OAuth authentication
   */
  async function loginWithGoogle(): Promise<void> {
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Complete Google signup by setting username
   * Called after username selection modal
   * @param {string} username - Selected username
   */
  async function completeGoogleSignup(username: string): Promise<void> {
    if (!pendingGoogleUser) {
      throw new Error('No pending Google user');
    }

    try {
      // Update username in Firestore
      await updateUser(pendingGoogleUser.uid, { username });

      // Clear pending state - auth state listener will handle the rest
      setPendingGoogleUser(null);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Log out current user
   */
  async function logout(): Promise<void> {
    try {
      await signOutUser();
      setPendingGoogleUser(null);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Listen to Firebase auth state changes and sync Firestore user profile
   */
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if Firestore user document exists
          const firestoreUser = await getUser(firebaseUser.uid);

          if (!firestoreUser) {
            // New user - check if this is a Google sign-in (has providerData)
            const isGoogleSignIn = firebaseUser.providerData.some(
              (provider) => provider.providerId === 'google.com'
            );

            if (isGoogleSignIn) {
              // Google sign-in: Show username selection modal
              const suggestedUsername =
                firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

              setPendingGoogleUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || 'unknown@example.com',
                suggestedUsername,
              });

              // Create user document with suggested username (will be updated after selection)
              await createUser(
                firebaseUser.uid,
                firebaseUser.email || 'unknown@example.com',
                suggestedUsername
              );
            } else {
              // Email/password sign-up: Use displayName from registration
              await createUser(
                firebaseUser.uid,
                firebaseUser.email || 'unknown@example.com',
                firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
              );
            }
          } else {
            // User exists - update last login
            await updateLastLogin(firebaseUser.uid);
          }
        } catch (error) {
          console.error('Failed to sync Firestore user profile:', error);
          // Continue anyway - user can still authenticate
        }

        // Only set current user if not waiting for username selection
        if (!pendingGoogleUser) {
          // Convert Firebase user to our User type
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName,
          };
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setPendingGoogleUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [pendingGoogleUser]);

  const value: AuthContextValue = {
    currentUser,
    loading,
    pendingGoogleUser,
    login,
    signup,
    loginWithGoogle,
    completeGoogleSignup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * @returns {AuthContextValue} Auth context value
 * @throws {Error} If used outside of AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
