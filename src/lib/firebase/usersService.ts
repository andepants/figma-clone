/**
 * Firestore Users Service
 *
 * Manages user profiles, subscription data, and onboarding state in Firestore.
 * Each authenticated user has a document at /users/{userId}.
 *
 * @see _docs/database/firestore-schema.md
 * @see src/types/subscription.types.ts
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
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './config';
import type { User, Subscription, Onboarding } from '@/types/subscription.types';

/**
 * Create a new user document in Firestore
 *
 * Called after Firebase Auth sign-up completes.
 * Sets default subscription (free) and onboarding config.
 *
 * @param userId - Firebase Auth UID
 * @param email - User's email address
 * @param username - Display username (validated before calling)
 * @throws Error if user creation fails
 */
export async function createUser(
  userId: string,
  email: string,
  username: string
): Promise<User> {
  const user: User = {
    id: userId,
    email,
    username,
    subscription: {
      status: 'free',
      stripePriceId: 'price_1SJGvHGag53vyQGAppC8KBkE', // Free tier price ID
    },
    onboarding: {
      completedSteps: [],
      currentStep: 0,
      skipped: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  const userRef = doc(firestore, 'users', userId);
  await setDoc(userRef, user);

  return user;
}

/**
 * Get user document from Firestore
 *
 * @param userId - Firebase Auth UID
 * @returns User data or null if not found
 */
export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as User;
}

/**
 * Check if username is available (not taken by another user)
 *
 * @param username - Username to check
 * @returns True if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);

  return querySnapshot.empty;
}

/**
 * Update user's last login timestamp
 *
 * Called on successful authentication.
 *
 * @param userId - Firebase Auth UID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    lastLoginAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Update user profile data
 *
 * @param userId - Firebase Auth UID
 * @param updates - Partial user data to update (excluding subscription and onboarding)
 */
export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'email' | 'username'>>
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete user document
 *
 * IMPORTANT: This does not delete Firebase Auth account.
 * Call this after successful auth account deletion.
 *
 * @param userId - Firebase Auth UID
 */
export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await deleteDoc(userRef);
}

// ========================================
// SUBSCRIPTION MANAGEMENT
// ========================================

/**
 * Update user's subscription data
 *
 * Called by Stripe webhooks after payment events.
 *
 * @param userId - Firebase Auth UID
 * @param subscription - Subscription data from Stripe
 */
export async function updateSubscription(
  userId: string,
  subscription: Subscription
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    subscription,
    updatedAt: Date.now(),
  });
}

/**
 * Upgrade user to paid tier (founders or pro)
 *
 * Called after successful Stripe checkout.
 *
 * @param userId - Firebase Auth UID
 * @param tier - Subscription tier ('founders' or 'pro')
 * @param stripeCustomerId - Stripe customer ID
 * @param stripePriceId - Stripe price ID
 * @param currentPeriodEnd - Unix timestamp (ms) when subscription period ends
 */
export async function upgradeToPaidTier(
  userId: string,
  tier: 'founders' | 'pro',
  stripeCustomerId: string,
  stripePriceId: string,
  currentPeriodEnd: number
): Promise<void> {
  const subscription: Subscription = {
    status: tier,
    stripeCustomerId,
    stripePriceId,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
  };

  await updateSubscription(userId, subscription);
}

/**
 * Downgrade user to free tier
 *
 * Called when subscription expires or is cancelled.
 *
 * @param userId - Firebase Auth UID
 */
export async function downgradeToFreeTier(userId: string): Promise<void> {
  const subscription: Subscription = {
    status: 'free',
  };

  await updateSubscription(userId, subscription);
}

/**
 * Check if user has active paid subscription
 *
 * @param userId - Firebase Auth UID
 * @returns True if user has active paid subscription
 */
export async function hasActivePaidSubscription(
  userId: string
): Promise<boolean> {
  const user = await getUser(userId);
  if (!user) return false;

  const { subscription } = user;
  if (subscription.status === 'free') return false;

  // Check if subscription period has not expired
  if (!subscription.currentPeriodEnd) return false;
  return subscription.currentPeriodEnd > Date.now();
}

// ========================================
// ONBOARDING MANAGEMENT
// ========================================

/**
 * Update user's onboarding state
 *
 * @param userId - Firebase Auth UID
 * @param onboarding - Onboarding data
 */
export async function updateOnboarding(
  userId: string,
  onboarding: Onboarding
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    onboarding,
    updatedAt: Date.now(),
  });
}

/**
 * Mark onboarding step as complete
 *
 * @param userId - Firebase Auth UID
 * @param step - Onboarding step identifier
 */
export async function completeOnboardingStep(
  userId: string,
  step: string
): Promise<void> {
  const user = await getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { onboarding } = user;

  // Skip if already completed
  if (onboarding.completedSteps.includes(step)) {
    return;
  }

  const updatedOnboarding: Onboarding = {
    ...onboarding,
    completedSteps: [...onboarding.completedSteps, step],
    currentStep: onboarding.currentStep + 1,
  };

  await updateOnboarding(userId, updatedOnboarding);
}

/**
 * Skip onboarding flow entirely
 *
 * @param userId - Firebase Auth UID
 */
export async function skipOnboarding(userId: string): Promise<void> {
  const user = await getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedOnboarding: Onboarding = {
    ...user.onboarding,
    skipped: true,
  };

  await updateOnboarding(userId, updatedOnboarding);
}

/**
 * Reset onboarding (allow user to start over)
 *
 * @param userId - Firebase Auth UID
 */
export async function resetOnboarding(userId: string): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    onboarding: {
      completedSteps: [],
      currentStep: 0,
      skipped: false,
    },
    updatedAt: Date.now(),
  });
}

// ========================================
// REAL-TIME SUBSCRIPTIONS
// ========================================

/**
 * Subscribe to real-time user updates
 *
 * Use this in components that need to react to subscription changes.
 *
 * @param userId - Firebase Auth UID
 * @param callback - Function called with updated user data
 * @returns Unsubscribe function
 */
export function subscribeToUser(
  userId: string,
  callback: (user: User | null) => void
): Unsubscribe {
  const userRef = doc(firestore, 'users', userId);

  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as User);
    } else {
      callback(null);
    }
  });
}

// ========================================
// ADMIN / ANALYTICS HELPERS
// ========================================

/**
 * Get count of users by subscription tier
 *
 * Useful for analytics and monitoring founders deal spots.
 *
 * @returns Object with counts per tier
 */
export async function getSubscriptionTierCounts(): Promise<{
  free: number;
  founders: number;
  pro: number;
}> {
  const usersRef = collection(firestore, 'users');
  const querySnapshot = await getDocs(usersRef);

  const counts = {
    free: 0,
    founders: 0,
    pro: 0,
  };

  querySnapshot.forEach((doc) => {
    const user = doc.data() as User;
    counts[user.subscription.status]++;
  });

  return counts;
}

/**
 * Get all users with founders tier
 *
 * Useful for tracking founders deal usage.
 *
 * @returns Array of users with founders subscription
 */
export async function getFoundersUsers(): Promise<User[]> {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('subscription.status', '==', 'founders'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as User);
}
