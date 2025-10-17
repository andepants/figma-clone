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
import {getFirestore} from "./firebase-admin.js";

/**
 * Initialize Stripe with API key
 * Uses environment variable or Firebase secret
 */
export function getStripeInstance(): Stripe {
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error(
      "Stripe secret key not configured. " +
        "Set STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY in environment."
    );
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover", // Use latest stable API version
  });
}

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
 * Process checkout.session.completed event
 *
 * Triggered when:
 * - User completes payment on Stripe Checkout
 * - Payment was successful
 *
 * Action:
 * - Update user subscription status in Firestore
 * - Grant access to premium features
 *
 * @param session - Stripe checkout session object
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  logger.info("Processing checkout.session.completed", {
    sessionId: session.id,
    customerId: session.customer,
    clientReferenceId: session.client_reference_id,
  });

  // Extract user ID from client_reference_id (passed during checkout)
  const userId = session.client_reference_id;

  if (!userId) {
    logger.error("Missing user ID in checkout session", {
      sessionId: session.id,
    });
    throw new Error("client_reference_id (user ID) not found in session");
  }

  // Extract subscription details
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!customerId) {
    logger.error("Missing customer ID in session", {sessionId: session.id});
    throw new Error("customer ID not found in session");
  }

  // Get subscription details from Stripe
  const stripe = getStripeInstance();
  let priceId: string | undefined;
  let currentPeriodEnd: number | undefined;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Extract price ID (should match founders or pro tier)
    const priceData = subscription.items.data[0]?.price;
    priceId = priceData?.id;
    // TODO: Stripe types may need updating - property exists at runtime
    currentPeriodEnd = (subscription as any).current_period_end;

    logger.info("Subscription retrieved", {
      subscriptionId,
      priceId,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : undefined,
    });
  }

  // Determine subscription tier based on price ID
  // TODO: Match against your actual Stripe price IDs
  const tier = determineTierFromPriceId(priceId);

  // Update user document in Firestore
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    await userRef.update({
      "subscription.status": tier,
      "subscription.stripeCustomerId": customerId,
      "subscription.stripePriceId": priceId,
      "subscription.currentPeriodEnd": currentPeriodEnd,
      "subscription.cancelAtPeriodEnd": false,
      updatedAt: Date.now(),
    });

    logger.info("User subscription updated", {
      userId,
      tier,
      customerId,
      priceId,
    });
  } catch (error) {
    logger.error("Failed to update user subscription", {
      userId,
      error,
    });
    throw error;
  }
}

/**
 * Process customer.subscription.updated event
 *
 * Triggered when:
 * - Subscription renewed automatically
 * - User changes plan
 * - Subscription is cancelled
 *
 * Action:
 * - Update subscription status and period end in Firestore
 *
 * @param subscription - Stripe subscription object
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  logger.info("Processing customer.subscription.updated", {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Find user by Stripe customer ID
  const customerId = subscription.customer as string;
  const userId = await findUserByCustomerId(customerId);

  if (!userId) {
    logger.error("User not found for customer ID", {customerId});
    throw new Error(`User not found for customer ID: ${customerId}`);
  }

  // Extract subscription details
  const priceId = subscription.items.data[0]?.price.id;
  // TODO: Stripe types may need updating - properties exist at runtime
  const currentPeriodEnd = (subscription as any).current_period_end;
  const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;

  // Determine subscription tier
  const tier = determineTierFromPriceId(priceId);

  // Update user document
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    await userRef.update({
      "subscription.status": tier,
      "subscription.stripePriceId": priceId,
      "subscription.currentPeriodEnd": currentPeriodEnd,
      "subscription.cancelAtPeriodEnd": cancelAtPeriodEnd,
      updatedAt: Date.now(),
    });

    logger.info("Subscription updated", {
      userId,
      tier,
      cancelAtPeriodEnd,
    });
  } catch (error) {
    logger.error("Failed to update subscription", {userId, error});
    throw error;
  }
}

/**
 * Process customer.subscription.deleted event
 *
 * Triggered when:
 * - Subscription is cancelled and period ends
 * - User fails to pay after retries
 *
 * Action:
 * - Downgrade user to free tier
 *
 * @param subscription - Stripe subscription object
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  logger.info("Processing customer.subscription.deleted", {
    subscriptionId: subscription.id,
    status: subscription.status,
  });

  // Find user by Stripe customer ID
  const customerId = subscription.customer as string;
  const userId = await findUserByCustomerId(customerId);

  if (!userId) {
    logger.error("User not found for customer ID", {customerId});
    throw new Error(`User not found for customer ID: ${customerId}`);
  }

  // Downgrade to free tier
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    await userRef.update({
      "subscription.status": "free",
      "subscription.currentPeriodEnd": null,
      "subscription.cancelAtPeriodEnd": false,
      updatedAt: Date.now(),
    });

    logger.info("User downgraded to free tier", {userId});
  } catch (error) {
    logger.error("Failed to downgrade user", {userId, error});
    throw error;
  }
}

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

/**
 * Find user ID by Stripe customer ID
 *
 * @param customerId - Stripe customer ID
 * @returns User ID if found, null otherwise
 */
async function findUserByCustomerId(
  customerId: string
): Promise<string | null> {
  const db = getFirestore();

  try {
    const usersRef = db.collection("users");
    const query = usersRef.where(
      "subscription.stripeCustomerId",
      "==",
      customerId
    );
    const snapshot = await query.get();

    if (snapshot.empty) {
      logger.warn("No user found for customer ID", {customerId});
      return null;
    }

    if (snapshot.size > 1) {
      logger.error("Multiple users found for customer ID", {
        customerId,
        count: snapshot.size,
      });
    }

    const userId = snapshot.docs[0].id;
    logger.info("User found for customer ID", {customerId, userId});
    return userId;
  } catch (error) {
    logger.error("Error finding user by customer ID", {customerId, error});
    throw error;
  }
}

/**
 * Determine subscription tier from Stripe price ID
 *
 * @param priceId - Stripe price ID (e.g., price_xxx)
 * @returns Subscription tier
 */
function determineTierFromPriceId(
  priceId: string | undefined
): "free" | "founders" | "pro" {
  if (!priceId) {
    return "free";
  }

  // Get price IDs from environment
  const foundersPriceId = process.env.STRIPE_FOUNDERS_PRICE_ID;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

  // Match against known price IDs
  if (priceId === foundersPriceId) {
    return "founders";
  }

  if (priceId === proPriceId) {
    return "pro";
  }

  // Default to free if unrecognized
  logger.warn("Unrecognized price ID, defaulting to free", {priceId});
  return "free";
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
