/**
 * Application-wide constants
 */

/**
 * Public playground project ID
 * This project is shared by all authenticated users as a test environment
 */
export const PUBLIC_PLAYGROUND_ID = 'PUBLIC_PLAYGROUND';

/**
 * Public playground project name
 */
export const PUBLIC_PLAYGROUND_NAME = 'Public Playground';

/**
 * Public playground project description
 */
export const PUBLIC_PLAYGROUND_DESCRIPTION = 'Shared canvas for all users to experiment and collaborate in real-time';

/**
 * Stripe price IDs
 * Automatically switches between test and live mode based on environment
 * - Dev: Test mode price IDs
 * - Production: Live mode price IDs
 */
export const STRIPE_FOUNDERS_PRICE_ID = import.meta.env.DEV
  ? 'price_1SJJZeGag53vyQGAtNqPGRLW' // Test mode: $10/year (first 10 users)
  : 'price_1SJGEAGag53vyQGAM3IbE7d2'; // Live mode: $10/year (first 10 users)

export const STRIPE_REGULAR_PRICE_ID = import.meta.env.DEV
  ? 'price_1SJI8SK9ZHlDy73WyRYHyGIt' // Test mode: $60/year (after 10 users)
  : 'price_1SJI92Gag53vyQGAm9YexOeY'; // Live mode: $60/year (after 10 users)
