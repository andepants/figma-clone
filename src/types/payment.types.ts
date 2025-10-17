/**
 * Payment Types
 *
 * Type definitions for Stripe payments, errors, and checkout sessions.
 *
 * @see _docs/ux/error-catalog.md
 * @see _docs/database/firestore-schema.md
 */

export type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

export type VisualTreatment = 'inline' | 'modal' | 'banner' | 'toast' | 'full-page';

export interface PaymentError {
  code: string;
  userMessage: string;
  technicalMessage: string;
  recovery: string;
  visualTreatment: VisualTreatment;
  preserveInput: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface PaymentState {
  status: PaymentStatus;
  error?: PaymentError;
  sessionId?: string;
}

/**
 * Stripe Checkout Session
 */
export interface CheckoutSession {
  sessionId: string;
  url: string;
  customerId?: string;
  subscriptionId?: string;
  status: 'open' | 'complete' | 'expired';
}

/**
 * Stripe Product & Price
 */
export interface StripePrice {
  id: string;
  productId: string;
  amount: number; // In cents
  currency: string;
  interval: 'month' | 'year';
  metadata?: Record<string, string>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: StripePrice;
  features: string[];
  tier: 'founders' | 'pro';
}

/**
 * Webhook Event Types
 */
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded';

export interface WebhookPayload {
  type: StripeWebhookEvent;
  data: {
    object: unknown; // Stripe object (typed per event)
  };
}

/**
 * Type guards
 */
export function isPaymentStatus(value: string): value is PaymentStatus {
  return ['idle', 'loading', 'success', 'error'].includes(value);
}

export function isStripeWebhookEvent(
  value: string
): value is StripeWebhookEvent {
  return [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_failed',
    'invoice.payment_succeeded',
  ].includes(value);
}

/**
 * Helper functions
 */
export function formatPrice(amountInCents: number, currency = 'usd'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function getRecurringInterval(
  interval: 'month' | 'year'
): string {
  return interval === 'month' ? 'per month' : 'per year';
}
