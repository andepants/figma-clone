/**
 * Payment Failed Handler
 *
 * Processes invoice payment failure events.
 * Logs failures and tracks retry attempts.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {findUserByCustomerId} from "./stripeHelpers.js";

/**
 * Process invoice.payment_failed event
 *
 * Triggered when:
 * - Subscription renewal payment fails
 * - Card declined, insufficient funds, etc.
 *
 * Action:
 * - Log failure (Stripe will retry automatically)
 * - Optionally notify user via email (future enhancement)
 *
 * @param invoice - Stripe invoice object
 */
export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  logger.warn("Processing invoice.payment_failed", {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amountDue: invoice.amount_due,
    attemptCount: invoice.attempt_count,
  });

  // Find user by customer ID
  const customerId = invoice.customer as string;
  const userId = await findUserByCustomerId(customerId);

  if (!userId) {
    logger.error("User not found for customer ID", {customerId});
    return; // Don't throw - payment already failed
  }

  logger.info("Payment failed for user", {
    userId,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000).toISOString()
      : "none",
  });

  // TODO: Future enhancement - send email notification
  // - "Your payment failed. Please update your payment method."
  // - Link to billing portal
}
