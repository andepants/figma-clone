/**
 * Subscription Updated Handler
 *
 * Processes subscription update events.
 * Handles renewals, plan changes, and cancellations.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "../firebase-admin.js";
import {
  findUserByCustomerId,
  determineTierFromPriceId,
} from "./stripeHelpers.js";

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

  // Get current period end (Stripe provides in seconds, convert to milliseconds)
  // Using type assertion to access property that exists but may not be in type definition
  const periodEndSeconds = (subscription as any).current_period_end as number | undefined;
  const currentPeriodEnd = periodEndSeconds ? periodEndSeconds * 1000 : undefined;

  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  // Check for free tier subscription - skip processing
  if (priceId === "price_1SJGvHGag53vyQGAppC8KBkE") {
    logger.info("Free tier subscription update event, skipping upgrade logic", {
      userId,
      priceId,
    });
    return;
  }

  // Determine subscription tier
  const tier = determineTierFromPriceId(priceId);

  // Update user document
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    // Build update object, excluding undefined values (Firestore doesn't accept undefined)
    const updateData: Record<string, string | number | boolean> = {
      "subscription.status": tier,
      "subscription.cancelAtPeriodEnd": cancelAtPeriodEnd,
      updatedAt: Date.now(),
    };

    // Only include optional fields if they have values
    if (priceId !== undefined) {
      updateData["subscription.stripePriceId"] = priceId;
    }
    if (currentPeriodEnd !== undefined) {
      updateData["subscription.currentPeriodEnd"] = currentPeriodEnd;
    }

    await userRef.update(updateData);

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
