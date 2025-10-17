/**
 * Payment Succeeded Handler
 *
 * Processes invoice payment success events.
 * Logs successful payments for analytics.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {findUserByCustomerId} from "./stripeHelpers.js";

/**
 * Process invoice.payment_succeeded event
 *
 * Triggered when:
 * - Subscription renewal payment succeeds
 * - Initial payment succeeds (also fires checkout.session.completed)
 *
 * Action:
 * - Log success
 * - Ensure subscription is active
 *
 * @param invoice - Stripe invoice object
 */
export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  logger.info("Processing invoice.payment_succeeded", {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amountPaid: invoice.amount_paid,
  });

  // Find user by customer ID
  const customerId = invoice.customer as string;
  const userId = await findUserByCustomerId(customerId);

  if (!userId) {
    logger.error("User not found for customer ID", {customerId});
    return;
  }

  logger.info("Payment succeeded for user", {
    userId,
    amountPaid: invoice.amount_paid / 100, // Convert cents to dollars
  });

  // Subscription should already be active via subscription.updated event
  // This is just for logging/analytics
}
