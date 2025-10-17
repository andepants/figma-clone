/**
 * Stripe Checkout Integration
 *
 * Handles Stripe checkout session creation via Firebase Functions.
 * Uses server-side session creation (modern Stripe API) instead of deprecated redirectToCheckout.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

/**
 * Firebase Functions response for checkout session creation
 */
interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Redirect user to Stripe Checkout for subscription purchase
 *
 * Creates a checkout session via Firebase Functions (server-side) and redirects to Stripe.
 * This replaces the deprecated `stripe.redirectToCheckout()` method.
 *
 * @param priceId - Stripe price ID (e.g., price_xxx for Founders tier)
 * @param userEmail - User's email to pre-fill checkout form
 * @param userId - User ID to pass through webhook
 * @throws Error if session creation or redirect fails
 *
 * @example
 * ```ts
 * await redirectToCheckout(
 *   import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID,
 *   user.email,
 *   user.id
 * );
 * ```
 */
export async function redirectToCheckout(
  priceId: string,
  userEmail: string,
  userId: string
): Promise<void> {
  console.log('=== STRIPE CHECKOUT (Modern API) ===');
  console.log('💳 Price ID:', priceId);
  console.log('📧 Email:', userEmail);
  console.log('👤 User ID:', userId);

  try {
    // Initialize Firebase Functions
    const functions = getFunctions(app);

    // Get callable function reference
    const createCheckoutSession = httpsCallable<
      {
        priceId: string;
        userEmail: string;
        successUrl: string;
        cancelUrl: string;
      },
      CreateCheckoutSessionResponse
    >(functions, 'createCheckoutSession');

    console.log('⏳ Creating checkout session via Firebase Functions...');

    // Call Firebase Function to create checkout session
    const result = await createCheckoutSession({
      priceId,
      userEmail,
      successUrl: `${window.location.origin}/projects?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/projects?payment=cancelled`,
    });

    const { sessionId, url } = result.data;

    console.log('✅ Checkout session created:', sessionId);
    console.log('🚀 Redirecting to Stripe Checkout:', url);

    // Redirect to Stripe Checkout (direct navigation)
    window.location.href = url;

  } catch (err) {
    console.error('❌ Checkout session creation failed:', err);

    // Extract Firebase Functions error message
    if (err && typeof err === 'object' && 'message' in err) {
      throw new Error((err as Error).message);
    }

    throw new Error('Failed to start checkout. Please try again.');
  }
}
