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

  logger.info("🎯 HANDLER: verifyCheckoutSession called from frontend", {
    hasAuth: !!auth,
    userId: auth?.uid,
    sessionId: data?.sessionId,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    timestamp: new Date().toISOString(),
  });

  // Authentication check
  if (!auth) {
    logger.error("❌ HANDLER: Unauthenticated request to verifyCheckoutSession");
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to verify checkout session"
    );
  }

  // Validate required fields
  if (!data.sessionId || typeof data.sessionId !== "string") {
    logger.error("❌ HANDLER: Invalid request data", {
      hasSessionId: !!data.sessionId,
      sessionIdType: typeof data.sessionId,
      userId: auth.uid,
    });
    throw new HttpsError(
      "invalid-argument",
      "Missing or invalid 'sessionId' field"
    );
  }

  logger.info("✅ HANDLER: Request validated, calling verification service", {
    userId: auth.uid,
    sessionId: data.sessionId,
  });

  try {
    const {verifyCheckoutSession: verify} =
      await import("../services/verify-checkout-session.js");

    const result = await verify({
      sessionId: data.sessionId,
    });

    logger.info("✅ HANDLER: Checkout session verification completed", {
      userId: auth.uid,
      sessionId: data.sessionId,
      status: result.status,
      subscriptionUpdated: result.subscriptionUpdated,
      success: result.success,
      message: result.message,
    });

    return result;
  } catch (error) {
    logger.error("❌ HANDLER: Failed to verify checkout session", {
      userId: auth.uid,
      sessionId: data.sessionId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
    });

    throw new HttpsError(
      "internal",
      `Failed to verify checkout session: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
