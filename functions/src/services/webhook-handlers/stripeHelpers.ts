/**
 * Stripe Webhook Helper Functions
 *
 * Shared utilities for webhook event handlers.
 * Includes user lookup and subscription tier determination.
 */

import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "../firebase-admin.js";

/**
 * Initialize Stripe with API key
 * Uses environment variable or Firebase secret
 *
 * Priority order (for local development):
 * 1. STRIPE_TEST_SECRET_KEY (from .env.local) - forces test mode
 * 2. STRIPE_SECRET_KEY (from .env.local or Firebase Secret)
 *
 * This ensures emulators use test keys even if Firebase Secrets are set.
 */
export function getStripeInstance(): Stripe {
  // In development, prioritize STRIPE_TEST_SECRET_KEY from .env.local
  // This prevents Firebase Secrets from overriding local test config
  const stripeSecretKey =
    process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    logger.error("❌ STRIPE: Stripe secret key not configured", {
      hasTestKey: !!process.env.STRIPE_TEST_SECRET_KEY,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes("STRIPE")),
    });
    throw new Error(
      "Stripe secret key not configured. " +
        "Set STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY in environment."
    );
  }

  logger.info("✅ STRIPE: Stripe instance initialized", {
    keyType: stripeSecretKey.startsWith("sk_test_") ? "test" : "live",
    keyPrefix: stripeSecretKey.substring(0, 10) + "...",
  });

  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover", // Use latest stable API version
  });
}

/**
 * Find user ID by Stripe customer ID
 *
 * @param customerId - Stripe customer ID
 * @returns User ID if found, null otherwise
 */
export async function findUserByCustomerId(
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
export function determineTierFromPriceId(
  priceId: string | undefined
): "free" | "founders" | "pro" {
  if (!priceId) {
    return "free";
  }

  // Get price IDs from environment
  const freePriceId = "price_1SJGvHGag53vyQGAppC8KBkE"; // Free tier price
  const foundersPriceId = process.env.STRIPE_FOUNDERS_PRICE_ID;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

  logger.info("Price ID matching", {
    receivedPriceId: priceId,
    foundersPriceId,
    proPriceId,
    freePriceId,
    matches: {
      free: priceId === freePriceId,
      founders: priceId === foundersPriceId,
      pro: priceId === proPriceId,
    },
  });

  // Match against known price IDs
  if (priceId === freePriceId) {
    return "free";
  }

  if (priceId === foundersPriceId) {
    return "founders";
  }

  if (priceId === proPriceId) {
    return "pro";
  }

  // Default to free if unrecognized
  logger.warn("Unrecognized price ID, defaulting to free", {
    priceId,
    foundersPriceId,
    proPriceId,
  });
  return "free";
}
