/**
 * Create Stripe Checkout Session Service
 *
 * Creates a new Stripe Checkout Session for subscription payments.
 * Returns the session URL for frontend redirect.
 */

import * as logger from "firebase-functions/logger";
import {getStripeInstance} from "./stripe-webhook.js";
import type Stripe from "stripe";

/**
 * Create checkout session parameters
 */
export interface CreateCheckoutSessionParams {
  priceId: string;
  userEmail: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create checkout session result
 */
export interface CreateCheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Create a new Stripe Checkout Session
 *
 * Creates a session on the server-side and returns the URL for client-side redirect.
 * This replaces the deprecated `stripe.redirectToCheckout()` method.
 *
 * @param params - Checkout session parameters
 * @returns Session ID and URL
 * @throws Error if session creation fails
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResult> {
  const {priceId, userEmail, userId, successUrl, cancelUrl} = params;

  logger.info("Creating Stripe Checkout Session", {
    priceId,
    userEmail,
    userId,
  });

  try {
    const stripe = getStripeInstance();

    // Create checkout session with modern Stripe API
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      client_reference_id: userId, // Pass user ID for webhook processing
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: "auto", // Collect billing address
      payment_method_types: ["card"], // Accept card payments
    });

    logger.info("Checkout session created successfully", {
      sessionId: session.id,
      url: session.url,
      userId,
    });

    if (!session.url) {
      throw new Error("Checkout session URL not generated");
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    logger.error("Failed to create checkout session", {
      error,
      priceId,
      userId,
    });
    throw new Error(`Failed to create checkout session: ${error}`);
  }
}
