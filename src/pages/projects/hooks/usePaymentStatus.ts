/**
 * usePaymentStatus Hook
 *
 * Manages payment status handling after Stripe checkout:
 * - Auto-dismiss success banner when subscription activates
 * - Webhook fallback: Manually verify session if webhook doesn't fire
 * - Timeout handling: Show error if subscription not updated within 30s
 *
 * Extracted from ProjectsPage.tsx to improve modularity and testability.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UsePaymentStatusReturn {
  /** Payment status from URL query params ('success' | 'cancelled' | null) */
  paymentStatus: string | null;
  /** Stripe checkout session ID */
  sessionId: string | null;
  /** Whether webhook timeout has occurred (30s) */
  webhookTimeout: boolean;
  /** Clear payment status from URL params */
  clearPaymentStatus: () => void;
}

/**
 * Handles payment status after Stripe checkout redirect.
 *
 * Features:
 * 1. Auto-dismiss success banner after 3s when subscription activates
 * 2. Webhook fallback: Manually verify session after 5s if webhook hasn't fired
 * 3. Timeout: Show error after 30s if subscription still not activated
 *
 * @param isPaidUser - Whether user has active paid subscription
 * @param subscriptionStatus - Current subscription status ('free' | 'active' | 'trialing' | etc.)
 * @param canCreateProjects - Whether user can create projects (derived from subscription)
 * @returns Payment status and utilities
 *
 * @example
 * ```tsx
 * const { paymentStatus, webhookTimeout, clearPaymentStatus } = usePaymentStatus(
 *   isPaidUser,
 *   subscription?.status || 'free',
 *   canCreateProjects
 * );
 * ```
 */
export function usePaymentStatus(
  isPaidUser: boolean,
  subscriptionStatus: string,
  canCreateProjects: boolean
): UsePaymentStatusReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [webhookTimeout, setWebhookTimeout] = useState(false);

  // Payment status from URL query params
  const paymentStatus = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');

  /**
   * Clears payment status from URL query params.
   * Used to dismiss success/error banners.
   */
  const clearPaymentStatus = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Auto-dismiss payment success banner when subscription updates
  useEffect(() => {
    if (paymentStatus === 'success' && isPaidUser && subscriptionStatus !== 'free') {
      // Clear URL params after subscription is confirmed active
      const timer = setTimeout(() => {
        clearPaymentStatus();
      }, 3000); // Show success message for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, isPaidUser, subscriptionStatus, clearPaymentStatus]);

  // Webhook fallback: Manually verify session if webhook doesn't fire within 5 seconds
  useEffect(() => {
    if (paymentStatus === 'success' && !canCreateProjects && sessionId) {
      const timer = setTimeout(async () => {
        try {
          // Dynamically import Firebase Functions
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const { app } = await import('@/lib/firebase');

          const functions = getFunctions(app);
          const verifyCheckoutSession = httpsCallable<
            { sessionId: string },
            { success: boolean; status: string; subscriptionUpdated: boolean; message: string }
          >(functions, 'verifyCheckoutSession');

          await verifyCheckoutSession({ sessionId });
          // Subscription will update via Firestore listener
        } catch (error) {
          console.error('❌ Failed to verify checkout session:', error);
          // Continue waiting for webhook or show timeout error
        }
      }, 5000); // 5 second delay before manual verification

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, canCreateProjects, sessionId]);

  // Webhook timeout handler: Show error if subscription not updated within 30 seconds
  useEffect(() => {
    if (paymentStatus === 'success' && !canCreateProjects && !webhookTimeout) {
      const timer = setTimeout(() => {
        setWebhookTimeout(true);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timer);
    }

    // Reset timeout flag when subscription updates successfully
    if (canCreateProjects && webhookTimeout) {
      setWebhookTimeout(false);
    }
  }, [paymentStatus, canCreateProjects, webhookTimeout]);

  return {
    paymentStatus,
    sessionId,
    webhookTimeout,
    clearPaymentStatus,
  };
}
