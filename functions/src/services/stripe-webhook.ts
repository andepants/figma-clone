/**
 * Stripe Webhook Service
 *
 * Handles Stripe webhook events for subscription management.
 * Processes checkout completion, subscription updates, and payment lifecycle events.
 *
 * Security: Verifies webhook signatures to prevent unauthorized access.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {getStripeInstance} from "./webhook-handlers/stripeHelpers.js";
import {handleCheckoutCompleted} from "./webhook-handlers/checkoutCompleted.js";
import {handleSubscriptionUpdated} from "./webhook-handlers/subscriptionUpdated.js";
import {handleSubscriptionDeleted} from "./webhook-handlers/subscriptionDeleted.js";
import {handlePaymentFailed} from "./webhook-handlers/paymentFailed.js";
import {handlePaymentSucceeded} from "./webhook-handlers/paymentSucceeded.js";

// Re-export helper functions for backward compatibility
export {getStripeInstance} from "./webhook-handlers/stripeHelpers.js";

/**
 * Verify webhook signature
 *
 * IMPORTANT: This prevents unauthorized webhook calls.
 * Always verify signatures in production!
 *
 * @param payload - Raw webhook payload (string or buffer)
 * @param signature - Stripe signature header
 * @param webhookSecret - Webhook signing secret from Stripe Dashboard
 * @returns Verified Stripe event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeInstance();

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    logger.info("Webhook signature verified", {
      eventType: event.type,
      eventId: event.id,
    });

    return event;
  } catch (error) {
    logger.error("Webhook signature verification failed", {
      error,
      signatureProvided: !!signature,
    });
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

/**
 * Process Stripe webhook event
 *
 * Routes events to appropriate handlers.
 *
 * @param event - Verified Stripe event
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<void> {
  logger.info("Processing webhook event", {
    type: event.type,
    id: event.id,
  });

  try {
    switch (event.type) {
      // Initial payment successful
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // Subscription updated (renewal, plan change, cancellation)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      // Subscription deleted (access revoked)
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // Payment failed (retry pending)
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      // Payment succeeded (renewal or initial)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      // Unhandled event type (log and ignore)
      default:
        logger.info("Unhandled webhook event type", {type: event.type});
    }

    logger.info("Webhook event processed successfully", {
      type: event.type,
      id: event.id,
    });
  } catch (error) {
    logger.error("Error processing webhook event", {
      type: event.type,
      id: event.id,
      error,
    });
    throw error;
  }
}
