/**
 * Checkout Session Completed Handler
 *
 * Processes successful checkout completion events.
 * Updates user subscription status and decrements founders spots if applicable.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "../firebase-admin.js";
import {
  getStripeInstance,
  determineTierFromPriceId,
} from "./stripeHelpers.js";

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

    // Get current period end (Stripe provides in seconds, we convert to milliseconds)
    // Using type assertion to access property that exists but may not be in type definition
    const periodEndSeconds = (subscription as any).current_period_end as number | undefined;
    if (periodEndSeconds) {
      currentPeriodEnd = periodEndSeconds * 1000; // Convert to milliseconds
    }

    logger.info("Subscription retrieved", {
      subscriptionId,
      priceId,
      currentPeriodEndSeconds: periodEndSeconds,
      currentPeriodEndMs: currentPeriodEnd,
      currentPeriodEndDate: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : undefined,
    });

    // Check for free tier subscription - skip processing
    if (priceId === "price_1SJGvHGag53vyQGAppC8KBkE") {
      logger.info("Free tier subscription event, skipping upgrade logic", {
        userId,
        priceId,
      });
      return;
    }
  }

  // Determine subscription tier based on price ID
  const tier = determineTierFromPriceId(priceId);

  // Update user document in Firestore
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    // Build update object, excluding undefined values (Firestore doesn't accept undefined)
    const updateData: Record<string, string | number | boolean> = {
      "subscription.status": tier,
      "subscription.stripeCustomerId": customerId,
      "subscription.cancelAtPeriodEnd": false,
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

    logger.info("User subscription updated", {
      userId,
      tier,
      customerId,
      priceId,
    });

    // Decrement founders spots if this was a founders tier purchase
    if (tier === "founders") {
      await decrementFoundersSpots(userId, priceId);
    }
  } catch (error) {
    logger.error("Failed to update user subscription", {
      userId,
      error,
    });
    throw error;
  }
}

/**
 * Decrement founders deal spots after successful purchase
 *
 * @param userId - User ID who purchased
 * @param priceId - Stripe price ID
 */
async function decrementFoundersSpots(
  userId: string,
  priceId: string | undefined
): Promise<void> {
  try {
    const db = getFirestore();
    const configRef = db.collection("config").doc("founders-deal");
    const configSnap = await configRef.get();

    if (configSnap.exists) {
      const config = configSnap.data();
      const spotsRemaining = config?.spotsRemaining ?? 0;

      if (spotsRemaining > 0) {
        await configRef.update({
          spotsRemaining: spotsRemaining - 1,
          lastUpdated: Date.now(),
        });

        logger.info("Decremented founders spots", {
          spotsRemaining: spotsRemaining - 1,
          userId,
        });
      } else {
        logger.warn("Founders deal sold out, but payment succeeded", {
          userId,
          priceId,
        });
      }
    } else {
      logger.warn("Founders deal config not found, skipping decrement", {
        userId,
      });
    }
  } catch (configError) {
    logger.error("Failed to decrement founders spots", {
      userId,
      error: configError,
    });
    // Don't throw - user payment already succeeded
  }
}
