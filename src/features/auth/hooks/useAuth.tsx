/**
 * useAuth Hook
 *
 * Provides authentication state and methods throughout the app.
 * Manages user session, login, signup, and logout functionality.
 */

import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signUpWithEmail, signInWithEmail, signInWithGoogle, signOutUser, getAuthErrorMessage, createUser, getUser, updateLastLogin } from '@/lib/firebase';
import type { User } from '@/types';

/**
 * Authentication context value
 * @interface AuthContextValue
 * @property {User | null} currentUser - Currently authenticated user
 * @property {boolean} loading - Whether auth state is being determined
 * @property {(email: string, password: string) => Promise<void>} login - Login function
 * @property {(email: string, password: string, username: string) => Promise<void>} signup - Signup function
 * @property {() => Promise<void>} loginWithGoogle - Google login function
 * @property {() => Promise<void>} logout - Logout function
 */
interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
   * Log out current user
   */
  async function logout(): Promise<void> {
    try {
      await signOutUser();
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
            // User document doesn't exist - create it (for existing Auth users)
            console.log('Creating Firestore user profile for:', firebaseUser.email);
            await createUser(
              firebaseUser.uid,
              firebaseUser.email || 'unknown@example.com',
              firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
            );
          } else {
            // User exists - update last login
            await updateLastLogin(firebaseUser.uid);
          }
        } catch (error) {
          console.error('Failed to sync Firestore user profile:', error);
          // Continue anyway - user can still authenticate
        }

        // Convert Firebase user to our User type
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.displayName,
        };
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
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
