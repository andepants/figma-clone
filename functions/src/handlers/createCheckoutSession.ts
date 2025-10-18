/**
 * Create Stripe Checkout Session Handler
 *
 * Handles creation of Stripe Checkout Sessions for subscription payments.
 * Returns the session URL for client-side redirect.
 *
 * Replaces deprecated `stripe.redirectToCheckout()` method with server-side session creation.
 */

import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Request parameters for creating a checkout session
 */
interface CreateCheckoutSessionRequest {
  priceId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Response from creating a checkout session
 */
interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create checkout session handler
 *
 * @param request - Contains auth context and checkout parameters
 * @returns Session ID and URL for redirect
 */
export async function createCheckoutSessionHandler(
  request: CallableRequest<CreateCheckoutSessionRequest>
): Promise<CreateCheckoutSessionResponse> {
  const {auth, data} = request;

  // Authentication check
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to create checkout session"
    );
  }

  // Validate required fields
  if (!data.priceId || typeof data.priceId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid 'priceId' field"
    );
  }

  if (!data.userEmail || typeof data.userEmail !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid 'userEmail' field"
    );
  }

  if (!data.successUrl || typeof data.successUrl !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid 'successUrl' field"
    );
  }

  if (!data.cancelUrl || typeof data.cancelUrl !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid 'cancelUrl' field"
    );
  }

  logger.info("Creating checkout session for user", {
    userId: auth.uid,
    priceId: data.priceId,
    email: data.userEmail,
  });

  try {
    const {createCheckoutSession: createSession} =
      await import("../services/create-checkout-session.js");

    const result = await createSession({
      priceId: data.priceId,
      userEmail: data.userEmail,
      userId: auth.uid,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
    });

    logger.info("Checkout session created successfully", {
      userId: auth.uid,
      sessionId: result.sessionId,
    });

    return result;
  } catch (error) {
    logger.error("Failed to create checkout session", {
      userId: auth.uid,
      error,
    });

    throw new HttpsError(
      "internal",
      `Failed to create checkout session: ${error}`
    );
  }
}
