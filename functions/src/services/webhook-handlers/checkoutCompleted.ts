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
  logger.info("🎯 CHECKOUT: Processing checkout.session.completed", {
    sessionId: session.id,
    customerId: session.customer,
    clientReferenceId: session.client_reference_id,
    paymentStatus: session.payment_status,
    status: session.status,
    mode: session.mode,
    amountTotal: session.amount_total,
    currency: session.currency,
  });

  // Extract user ID from client_reference_id (passed during checkout)
  const userId = session.client_reference_id;

  if (!userId) {
    logger.error("❌ CHECKOUT: Missing user ID in checkout session", {
      sessionId: session.id,
      sessionData: JSON.stringify(session, null, 2),
    });
    throw new Error("client_reference_id (user ID) not found in session");
  }

  logger.info("✅ CHECKOUT: User ID extracted successfully", {
    userId,
    sessionId: session.id,
  });

  // Extract subscription details
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!customerId) {
    logger.error("❌ CHECKOUT: Missing customer ID in session", {
      sessionId: session.id,
      sessionCustomer: session.customer,
    });
    throw new Error("customer ID not found in session");
  }

  logger.info("✅ CHECKOUT: Customer ID extracted successfully", {
    customerId,
    subscriptionId: subscriptionId || "none",
    sessionId: session.id,
  });

  // Get subscription details from Stripe
  logger.info("🔍 CHECKOUT: Retrieving subscription details from Stripe", {
    subscriptionId: subscriptionId || "none",
  });

  const stripe = getStripeInstance();
  let priceId: string | undefined;
  let currentPeriodEnd: number | undefined;

  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Extract price ID (should match founders or pro tier)
      const priceData = subscription.items.data[0]?.price;
      priceId = priceData?.id;

      // Get current period end (Stripe provides in seconds, we convert to milliseconds)
      // @ts-expect-error - current_period_end exists but not in type definition
      const periodEndSeconds = subscription.current_period_end as number | undefined;
      if (periodEndSeconds) {
        currentPeriodEnd = periodEndSeconds * 1000; // Convert to milliseconds
      }

      logger.info("✅ CHECKOUT: Subscription retrieved successfully", {
        subscriptionId,
        priceId,
        status: subscription.status,
        currentPeriodEndSeconds: periodEndSeconds,
        currentPeriodEndMs: currentPeriodEnd,
        currentPeriodEndDate: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : undefined,
        itemsCount: subscription.items.data.length,
      });

      // Check for free tier subscription - skip processing
      if (priceId === "price_1SJGvHGag53vyQGAppC8KBkE") {
        logger.info("ℹ️ CHECKOUT: Free tier subscription event, skipping upgrade logic", {
          userId,
          priceId,
        });
        return;
      }
    } catch (error) {
      logger.error("❌ CHECKOUT: Failed to retrieve subscription from Stripe", {
        subscriptionId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  } else {
    logger.warn("⚠️ CHECKOUT: No subscription ID in session (one-time payment?)", {
      sessionId: session.id,
      mode: session.mode,
    });
  }

  // Determine subscription tier based on price ID
  logger.info("🔍 CHECKOUT: Determining subscription tier", {
    priceId: priceId || "none",
  });

  const tier = determineTierFromPriceId(priceId);

  logger.info("✅ CHECKOUT: Tier determined", {
    tier,
    priceId: priceId || "none",
  });

  // Update user document in Firestore
  logger.info("💾 CHECKOUT: Updating user subscription in Firestore", {
    userId,
    tier,
    customerId,
  });

  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);

  try {
    // Check if user document exists first
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      logger.error("❌ CHECKOUT: User document does not exist in Firestore", {
        userId,
        sessionId: session.id,
      });
      throw new Error(`User document not found for userId: ${userId}`);
    }

    logger.info("✅ CHECKOUT: User document found", {
      userId,
      currentData: userDoc.data(),
    });

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

    logger.info("🔄 CHECKOUT: Applying Firestore update", {
      userId,
      updateData,
    });

    await userRef.update(updateData);

    logger.info("✅ CHECKOUT: User subscription updated successfully", {
      userId,
      tier,
      customerId,
      priceId,
      updateData,
    });

    // Decrement founders spots if this was a founders tier purchase
    if (tier === "founders") {
      logger.info("🎖️ CHECKOUT: Processing founders tier purchase", {
        userId,
        priceId,
      });
      await decrementFoundersSpots(userId, priceId);
    }
  } catch (error) {
    logger.error("❌ CHECKOUT: Failed to update user subscription in Firestore", {
      userId,
      tier,
      customerId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as {code?: string})?.code,
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
