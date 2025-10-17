/**
 * Subscription Types
 *
 * Type definitions for user subscriptions, onboarding, and account management.
 *
 * @see _docs/database/firestore-schema.md
 */

export type SubscriptionStatus = 'free' | 'founders' | 'pro';

export interface Subscription {
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: number; // Unix timestamp (ms)
  cancelAtPeriodEnd?: boolean;
}

export interface Onboarding {
  completedSteps: string[];
  currentStep: number; // 0-4 (for 5-step onboarding)
  skipped: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  subscription: Subscription;
  onboarding: Onboarding;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number;
}

/**
 * Helper type guards
 */
export function isSubscriptionStatus(
  value: string
): value is SubscriptionStatus {
  return ['free', 'founders', 'pro'].includes(value);
}

export function isPaidUser(subscription: Subscription): boolean {
  return subscription.status === 'founders' || subscription.status === 'pro';
}

export function isSubscriptionActive(subscription: Subscription): boolean {
  if (!isPaidUser(subscription)) return false;

  // If no period end is set, assume active (for lifetime/founders subscriptions)
  if (!subscription.currentPeriodEnd) return true;

  // Check if subscription hasn't expired
  // Stripe provides timestamps in seconds, but we store in milliseconds
  const periodEndMs = subscription.currentPeriodEnd > 9999999999
    ? subscription.currentPeriodEnd  // Already in milliseconds
    : subscription.currentPeriodEnd * 1000;  // Convert from seconds

  return periodEndMs > Date.now();
}

/**
 * Validation functions
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }

  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { valid: true };
}
