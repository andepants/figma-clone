/**
 * Firebase Auth Service
 *
 * Provides authentication-related utility functions including user search.
 * For core auth operations (sign up, sign in, sign out), see auth.ts.
 *
 * @see src/lib/firebase/auth.ts
 * @see src/lib/firebase/usersService.ts
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './config';
import type { User } from '@/types/subscription.types';

/**
 * Find user by email or username
 *
 * Searches Firestore users collection for a match on email or username.
 * Email search is case-insensitive. Username search is exact match.
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
    // Try email search first (normalized to lowercase)
    const emailQuery = query(usersRef, where('email', '==', normalizedQuery));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      const userData = emailSnapshot.docs[0].data() as User;
      return {
        uid: userData.id,
        username: userData.username,
        email: userData.email,
      };
    }

    // Try username search (case-sensitive exact match)
    const usernameQuery = query(
      usersRef,
      where('username', '==', searchQuery.trim())
    );
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      const userData = usernameSnapshot.docs[0].data() as User;
      return {
        uid: userData.id,
        username: userData.username,
        email: userData.email,
      };
    }

    // No matches found
    return null;
  } catch (error) {
    console.error('Error searching for user:', error);
    throw new Error('Failed to search for user');
  }
}
