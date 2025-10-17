/**
 * Subscription Deleted Handler
 *
 * Processes subscription deletion events.
 * Downgrades users to free tier when subscription ends.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "../firebase-admin.js";
import {findUserByCustomerId} from "./stripeHelpers.js";

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
