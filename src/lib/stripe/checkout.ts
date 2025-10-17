/**
 * Stripe Checkout Integration
 *
 * Handles client-side Stripe checkout redirect for subscription payments.
 * Uses Stripe's hosted checkout page for PCI compliance.
 */

import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key (client-side safe)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Redirect user to Stripe Checkout for subscription purchase
 *
 * @param priceId - Stripe price ID (e.g., price_xxx for Founders tier)
 * @param userEmail - User's email to pre-fill checkout form
 * @param userId - User ID to pass through success URL and webhook
 * @throws Error if Stripe fails to load or checkout fails
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
  try {
    const stripe = await stripePromise;

    if (!stripe) {
      throw new Error('Stripe failed to load. Please refresh the page and try again.');
    }

    // Redirect to Stripe's hosted checkout page
    // Note: In production, you may want to create the checkout session
    // on your backend for additional security and customization
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${window.location.origin}/projects?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/projects?payment=cancelled`,
      customerEmail: userEmail,
      clientReferenceId: userId, // Pass user ID for webhook processing
    });

    if (error) {
      // Log error for debugging
      console.error('Stripe checkout error:', error);
      throw new Error(error.message || 'Failed to initiate checkout');
    }
  } catch (err) {
    // Re-throw with user-friendly message
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Get Stripe instance for advanced use cases
 *
 * @returns Stripe instance or null if not loaded
 * @internal
 */
export async function getStripe() {
  return await stripePromise;
}
