/**
 * User Store (Zustand)
 *
 * STORAGE: Firestore `/users/{uid}` collection
 * REALTIME: onSnapshot() for live subscription updates
 *
 * Global state management for authenticated user profile and subscription data.
 * Subscribes to Firestore real-time updates and provides cached access across the app.
 *
 * Data stored in Firestore:
 * - User profile (email, username, display name)
 * - Subscription status (free, founders, pro)
 * - Stripe customer ID and price ID
 * - Onboarding progress
 *
 * NOT stored here:
 * - Canvas objects (Realtime Database)
 * - Projects (Realtime Database)
 * - Presence/cursors (Realtime Database)
 *
 * Benefits over direct Firestore queries:
 * - Single subscription per user session (not per component)
 * - Instant access to subscription data (no loading states)
 * - Automatic updates when subscription changes
 * - Manual refresh capability for webhook fallbacks
 *
 * @see src/hooks/useSubscription.ts - Simplified hook that reads from this store
 * @see _docs/architecture/data-storage-architecture.md - Database architecture guide
 */

import { create } from 'zustand';
import { doc, onSnapshot, getDocFromServer, type Unsubscribe } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { User as UserProfile, Subscription } from '@/types/subscription.types';
import { isPaidUser, isSubscriptionActive } from '@/types/subscription.types';

/**
 * User store state
 */
interface UserState {
  /** Full user profile with subscription data (null if not loaded or not exists) */
  userProfile: UserProfile | null;

  /** Loading state (true during initial fetch) */
  loading: boolean;

  /** Error state (if subscription fetch failed) */
  error: Error | null;

  /** Firestore unsubscribe function (for cleanup) */
  unsubscribe: Unsubscribe | null;

  // Actions
  /** Initialize subscription for a user (call on login) */
  subscribeToUser: (userId: string) => Promise<void>;

  /** Clean up subscription (call on logout) */
  unsubscribeFromUser: () => void;

  /** Manually refresh user profile (for webhook fallback) */
  refreshUserProfile: () => void;

  /** Force refresh user profile from Firestore (bypasses cache) */
  forceRefreshUserProfile: () => Promise<void>;

  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Default free subscription for users without a subscription field
 */
const DEFAULT_FREE_SUBSCRIPTION: Subscription = {
  status: 'free',
  stripePriceId: 'price_1SJGvHGag53vyQGAppC8KBkE',
};

/**
 * User store
 *
 * Usage:
 * ```tsx
 * // In useAuth (on login)
 * const subscribeToUser = useUserStore(state => state.subscribeToUser);
 * useEffect(() => {
 *   if (firebaseUser) subscribeToUser(firebaseUser.uid);
 * }, [firebaseUser]);
 *
 * // In components
 * const { userProfile, loading } = useUserStore();
 * const isPaid = userProfile?.subscription.status === 'founders';
 * ```
 */
export const useUserStore = create<UserState>((set, get) => ({
  userProfile: null,
  loading: true,
  error: null,
  unsubscribe: null,

  subscribeToUser: async (userId: string) => {
    // Clean up existing subscription if any
    const existingUnsubscribe = get().unsubscribe;
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const userDocRef = doc(firestore, 'users', userId);

    try {
      // STEP 1: Initial server fetch to ensure we have latest data on login
      // This bypasses all caches and gets fresh subscription status
      const initialSnapshot = await getDocFromServer(userDocRef);

      if (initialSnapshot.exists()) {
        const rawData = initialSnapshot.data();
        const data = rawData as UserProfile;

        // Set initial data from server
        if (!data.subscription) {
          const profileWithDefault = { ...data, subscription: DEFAULT_FREE_SUBSCRIPTION };
          set({
            userProfile: profileWithDefault,
            loading: false,
            error: null,
          });
        } else {
          set({ userProfile: data, loading: false, error: null });
        }
      } else {
        set({ userProfile: null, loading: false, error: null });
      }
    } catch (error) {
      console.error('❌ USER_STORE: Initial server fetch failed:', error);
      set({ error: error as Error, loading: false });
    }

    // STEP 2: Set up real-time listener for ongoing updates
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data();
          const data = rawData as UserProfile;

          // Ensure subscription field exists (migration safety)
          if (!data.subscription) {
            const profileWithDefault = { ...data, subscription: DEFAULT_FREE_SUBSCRIPTION };
            set({
              userProfile: profileWithDefault,
              loading: false,
              error: null,
            });
          } else {
            set({ userProfile: data, loading: false, error: null });
          }
        } else {
          // User document doesn't exist yet - treat as free user
          set({ userProfile: null, loading: false, error: null });
        }
      },
      (err) => {
        console.error('❌ USER_STORE: Failed to fetch user profile:', err);
        set({ error: err as Error, loading: false });
      }
    );

    set({ unsubscribe });
  },

  unsubscribeFromUser: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },

  refreshUserProfile: () => {
    // Refresh is automatic with onSnapshot, but we can trigger re-subscription if needed
    const userId = get().userProfile?.id;
    if (userId) {
      get().subscribeToUser(userId);
    }
  },

  forceRefreshUserProfile: async () => {
    const userId = get().userProfile?.id;
    if (!userId) {
      console.warn('⚠️ USER_STORE: Cannot force refresh - no user logged in');
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', userId);

      // Use getDocFromServer to bypass ALL caches (local and persistent)
      // This ensures we get the absolute latest data from Firestore servers
      const snapshot = await getDocFromServer(userDocRef);

      if (snapshot.exists()) {
        const rawData = snapshot.data();
        const data = rawData as UserProfile;

        // Ensure subscription field exists (migration safety)
        if (!data.subscription) {
          const profileWithDefault = { ...data, subscription: DEFAULT_FREE_SUBSCRIPTION };
          set({
            userProfile: profileWithDefault,
            loading: false,
            error: null,
          });
        } else {
          set({ userProfile: data, loading: false, error: null });
        }
      } else {
        console.warn('⚠️ USER_STORE: User document does not exist');
        set({ userProfile: null, loading: false, error: null });
      }
    } catch (error) {
      console.error('❌ USER_STORE: Force refresh failed:', error);
      set({ error: error as Error });
    }
  },

  reset: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) {
      unsubscribe();
    }
    set({
      userProfile: null,
      loading: false,
      error: null,
      unsubscribe: null,
    });
  },
}));

/**
 * Selector hooks for common subscription checks
 * These provide optimized re-renders (only when specific values change)
 */

/** Get full user profile */
export const useUserProfile = () => useUserStore((state) => state.userProfile);

/** Get subscription object */
export const useUserSubscription = () =>
  useUserStore((state) => state.userProfile?.subscription ?? DEFAULT_FREE_SUBSCRIPTION);

/** Check if user is on paid plan (founders or pro) */
export const useIsPaidUser = () => {
  const subscription = useUserSubscription();
  return isPaidUser(subscription);
};

/** Check if subscription is active (not expired) */
export const useIsSubscriptionActive = () => {
  const subscription = useUserSubscription();
  return isPaidUser(subscription) ? isSubscriptionActive(subscription) : true;
};

/** Check if user can create projects */
export const useCanCreateProjects = () => {
  const isPaid = useIsPaidUser();
  const isActive = useIsSubscriptionActive();
  return isPaid && isActive;
};

/** Get subscription badge for UI */
export const useSubscriptionBadge = () => {
  const subscription = useUserSubscription();
  const isPaid = isPaidUser(subscription);

  if (!isPaid) {
    return { text: 'Free', color: 'gray' as const };
  }

  if (subscription.status === 'founders') {
    return { text: 'Founder', color: 'blue' as const };
  }

  if (subscription.status === 'pro') {
    return { text: 'Pro', color: 'green' as const };
  }

  return null;
};

/** Get loading state */
export const useUserLoading = () => useUserStore((state) => state.loading);

/** Get error state */
export const useUserError = () => useUserStore((state) => state.error);

/**
 * Debug helper: Expose user store to window for console debugging
 * Usage in browser console:
 *   window.debugUserStore()
 *   window.forceRefreshUser()
 */
if (typeof window !== 'undefined') {
  (window as unknown as { debugUserStore: () => unknown; forceRefreshUser: () => Promise<unknown> }).debugUserStore = () => {
    const state = useUserStore.getState();
    return state.userProfile;
  };

  (window as unknown as { debugUserStore: () => unknown; forceRefreshUser: () => Promise<unknown> }).forceRefreshUser = async () => {
    await useUserStore.getState().forceRefreshUserProfile();
    return (window as unknown as { debugUserStore: () => unknown }).debugUserStore();
  };
}
