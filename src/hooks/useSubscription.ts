/**
 * useSubscription Hook
 *
 * Provides subscription state and access control checks for the authenticated user.
 * Fetches and monitors user subscription data from Firestore.
 *
 * Key features:
 * - Real-time subscription status
 * - Feature access checks (canCreateProjects, canAccessPrivateProjects)
 * - Upgrade prompts and paywall logic
 * - Subscription badge information
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isPaid, canCreateProjects, subscription } = useSubscription();
 *
 *   if (!canCreateProjects) {
 *     return <UpgradePrompt />;
 *   }
 *
 *   return <CreateProjectButton />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import type { Subscription, User as UserProfile } from '@/types/subscription.types';
import { isPaidUser, isSubscriptionActive } from '@/types/subscription.types';

/**
 * Subscription hook return value
 */
export interface UseSubscriptionReturn {
  /** Full user profile with subscription data */
  userProfile: UserProfile | null;

  /** Subscription object */
  subscription: Subscription | null;

  /** Is the user on a paid plan (founders or pro) */
  isPaid: boolean;

  /** Is the subscription currently active (not expired) */
  isActive: boolean;

  /** Can the user create new projects */
  canCreateProjects: boolean;

  /** Can the user make projects private */
  canAccessPrivateProjects: boolean;

  /** Loading state while fetching subscription */
  loading: boolean;

  /** Error if subscription fetch failed */
  error: Error | null;

  /** Upgrade prompt messaging */
  upgradePrompt: {
    title: string;
    description: string;
    ctaText: string;
  } | null;

  /** Subscription badge for UI display */
  badge: {
    text: string;
    color: 'gray' | 'blue' | 'green';
  } | null;
}

/**
 * Default free subscription for users without Firestore profile
 */
const DEFAULT_FREE_SUBSCRIPTION: Subscription = {
  status: 'free',
};

/**
 * Hook to access user subscription state and permissions
 *
 * @returns Subscription state and access control checks
 *
 * @throws Does not throw - returns error state instead
 */
export function useSubscription(): UseSubscriptionReturn {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Listen to Firestore user document for real-time subscription updates
   */
  useEffect(() => {
    if (!currentUser?.uid) {
      // Not authenticated - free tier
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const userDocRef = doc(firestore, 'users', currentUser.uid);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;

          // Migration: Add free subscription if missing
          if (!data.subscription) {
            const freeSubscription: Subscription = {
              status: 'free',
              stripePriceId: 'price_1SJGvHGag53vyQGAppC8KBkE',
            };

            try {
              // Update Firestore with free subscription
              await updateDoc(userDocRef, {
                subscription: freeSubscription,
                updatedAt: Date.now(),
              });

              // Update local state with migrated data
              setUserProfile({ ...data, subscription: freeSubscription });
            } catch (migrationError) {
              console.error('Failed to migrate user to free subscription:', migrationError);
              // Still set user profile with default subscription for this session
              setUserProfile({ ...data, subscription: freeSubscription });
            }
          } else {
            setUserProfile(data);
          }
        } else {
          // User document doesn't exist yet - treat as free user
          setUserProfile(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to fetch user subscription:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Get subscription (use default free if no profile exists)
  const subscription = userProfile?.subscription ?? DEFAULT_FREE_SUBSCRIPTION;

  // Check if user is on paid plan
  const isPaid = isPaidUser(subscription);

  // Check if subscription is active (for paid users)
  const isActive = isPaid ? isSubscriptionActive(subscription) : true; // Free is always "active"

  // Access control: Can user create projects?
  // Free users can only join public projects, not create their own
  const canCreateProjects = isPaid && isActive;

  // Access control: Can user make projects private?
  // Only paid users can create private projects
  const canAccessPrivateProjects = isPaid && isActive;

  // Generate upgrade prompt if user needs to upgrade
  const upgradePrompt = !isPaid
    ? {
        title: 'Upgrade to Create Projects',
        description:
          'Free users can join public projects. Upgrade to create unlimited projects and unlock all templates.',
        ctaText: 'View Pricing',
      }
    : !isActive
    ? {
        title: 'Subscription Expired',
        description:
          'Your subscription has expired. Renew to continue creating projects and accessing premium features.',
        ctaText: 'Renew Subscription',
      }
    : null;

  // Generate badge for subscription status
  const badge = !currentUser
    ? null
    : !isPaid
    ? { text: 'Free', color: 'gray' as const }
    : subscription.status === 'founders'
    ? { text: 'Founder', color: 'blue' as const }
    : subscription.status === 'pro'
    ? { text: 'Pro', color: 'green' as const }
    : null;

  return {
    userProfile,
    subscription,
    isPaid,
    isActive,
    canCreateProjects,
    canAccessPrivateProjects,
    loading,
    error,
    upgradePrompt,
    badge,
  };
}

/**
 * Helper hook to check if a specific feature is available
 *
 * @example
 * ```tsx
 * const hasAccess = useFeatureAccess('create_projects');
 * if (!hasAccess) return <UpgradePrompt />;
 * ```
 */
export function useFeatureAccess(
  feature: 'create_projects' | 'private_projects' | 'templates'
): boolean {
  const { canCreateProjects, canAccessPrivateProjects, isPaid } = useSubscription();

  switch (feature) {
    case 'create_projects':
      return canCreateProjects;
    case 'private_projects':
      return canAccessPrivateProjects;
    case 'templates':
      return isPaid; // All templates available to paid users
    default:
      return false;
  }
}
