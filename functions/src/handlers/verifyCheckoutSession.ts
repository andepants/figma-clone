/**
 * Verify Checkout Session Handler (Manual Fallback)
 *
 * Manually verifies a checkout session and updates subscription.
 * Used as fallback when webhooks don't fire reliably in development/emulator.
 */

import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Request parameters for verifying a checkout session
 */
interface VerifyCheckoutSessionRequest {
  sessionId: string;
}

/**
 * Response from verifying a checkout session
 */
interface VerifyCheckoutSessionResponse {
  status: string;
  subscriptionUpdated: boolean;
  customerId?: string;
  subscriptionId?: string;
}

/**
 * Verify checkout session handler
 *
 * @param request - Contains auth context and session ID
 * @returns Verification result with subscription status
 */
export async function verifyCheckoutSessionHandler(
  request: CallableRequest<VerifyCheckoutSessionRequest>
): Promise<VerifyCheckoutSessionResponse> {
  const {auth, data} = request;

  // Authentication check
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to verify checkout session"
    );
  }

  // Validate required fields
  if (!data.sessionId || typeof data.sessionId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid 'sessionId' field"
    );
  }

  logger.info("Verifying checkout session for user", {
    userId: auth.uid,
    sessionId: data.sessionId,
  });

  try {
    const {verifyCheckoutSession: verify} =
      await import("../services/verify-checkout-session.js");

    const result = await verify({
      sessionId: data.sessionId,
    });

    logger.info("Checkout session verified", {
      userId: auth.uid,
      sessionId: data.sessionId,
      status: result.status,
      subscriptionUpdated: result.subscriptionUpdated,
    });

    return result;
  } catch (error) {
    logger.error("Failed to verify checkout session", {
      userId: auth.uid,
      sessionId: data.sessionId,
      error,
    });

    throw new HttpsError(
      "internal",
      `Failed to verify checkout session: ${error}`
    );
  }
}
