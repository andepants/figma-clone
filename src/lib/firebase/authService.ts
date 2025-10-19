/**
 * Firebase Auth Service
 *
 * Provides authentication-related utility functions including user search.
 * For core auth operations (sign up, sign in, sign out), see auth.ts.
 *
 * @see src/lib/firebase/auth.ts
 * @see src/lib/firebase/usersService.ts
 */

import { collection, getDocs } from 'firebase/firestore';
import { firestore } from './config';
import type { User } from '@/types/subscription.types';

/**
 * Find user by email or username
 *
 * Searches Firestore users collection for a match on email or username.
 * Both email and username searches are case-insensitive.
 *
 * Note: Uses client-side filtering instead of Firestore where() queries
 * to enable case-insensitive search without requiring indexed fields.
 *
 * @param searchQuery - Email or username to search for
 * @returns User data (uid, username, email) or null if not found
 */
export async function findUserByEmailOrUsername(
  searchQuery: string
): Promise<{ uid: string; username: string; email: string } | null> {
  // Guard: empty query
  if (!searchQuery || searchQuery.trim() === '') {
    return null;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const usersRef = collection(firestore, 'users');

  try {
    // Fetch all users and filter client-side for case-insensitive search
    const snapshot = await getDocs(usersRef);

    // Debug logging
    console.log(`[User Search] Searching for: "${searchQuery}"`);
    console.log(`[User Search] Normalized query: "${normalizedQuery}"`);
    console.log(`[User Search] Total users in database: ${snapshot.docs.length}`);
    console.log(`[User Search] Environment: ${import.meta.env.DEV ? 'DEVELOPMENT (Emulator)' : 'PRODUCTION'}`);

    // Log all users for debugging (remove in production)
    if (import.meta.env.DEV) {
      console.log('[User Search] Available users:', snapshot.docs.map(doc => {
        const user = doc.data() as User;
        return { email: user.email, username: user.username };
      }));
    }

    for (const doc of snapshot.docs) {
      const userData = doc.data() as User;

      // Check email (case-insensitive)
      if (userData.email.toLowerCase() === normalizedQuery) {
        console.log(`[User Search] ✅ Found user by email: ${userData.username}`);
        return {
          uid: userData.id,
          username: userData.username,
          email: userData.email,
        };
      }

      // Check username (case-insensitive)
      if (userData.username.toLowerCase() === normalizedQuery) {
        console.log(`[User Search] ✅ Found user by username: ${userData.username}`);
        return {
          uid: userData.id,
          username: userData.username,
          email: userData.email,
        };
      }
    }

    // No matches found
    console.log('[User Search] ❌ No user found matching query');
    return null;
  } catch (error) {
    console.error('[User Search] Error searching for user:', error);

    // Re-throw with more specific error message
    if (error instanceof Error) {
      throw new Error(`Failed to search for user: ${error.message}`);
    }
    throw new Error('Failed to search for user');
  }
}
