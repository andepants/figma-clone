/**
 * Verify Checkout Session Service
 *
 * Manually verifies a Stripe checkout session and updates subscription if needed.
 * Used as fallback when webhooks don't fire in development/emulator environments.
 */

import * as logger from "firebase-functions/logger";
import {getStripeInstance} from "./webhook-handlers/stripeHelpers.js";
import {handleCheckoutCompleted} from "./webhook-handlers/checkoutCompleted.js";

/**
 * Verify checkout session parameters
 */
export interface VerifyCheckoutSessionParams {
  sessionId: string;
}

/**
 * Verify checkout session result
 */
export interface VerifyCheckoutSessionResult {
  success: boolean;
  status: "complete" | "incomplete" | "expired";
  subscriptionUpdated: boolean;
  message: string;
}

/**
 * Manually verify a checkout session and update subscription if needed
 *
 * This is a fallback for when webhooks don't fire reliably in development.
 * Fetches the session from Stripe and manually triggers subscription update.
 *
 * @param params - Session verification parameters
 * @returns Verification result with subscription status
 * @throws Error if verification fails
 */
export async function verifyCheckoutSession(
  params: VerifyCheckoutSessionParams
): Promise<VerifyCheckoutSessionResult> {
  const {sessionId} = params;

  logger.info("🔍 VERIFY: Manually verifying checkout session (webhook fallback)", {
    sessionId,
    timestamp: new Date().toISOString(),
  });

  try {
    const stripe = getStripeInstance();

    logger.info("🔍 VERIFY: Retrieving session from Stripe API", {
      sessionId,
    });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logger.info("✅ VERIFY: Checkout session retrieved successfully", {
      sessionId,
      status: session.status,
      paymentStatus: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription,
      clientReferenceId: session.client_reference_id,
      mode: session.mode,
      amountTotal: session.amount_total,
    });

    // Check session status
    if (session.status === "expired") {
      logger.warn("⚠️ VERIFY: Checkout session has expired", {
        sessionId,
        status: session.status,
      });
      return {
        success: false,
        status: "expired",
        subscriptionUpdated: false,
        message: "Checkout session has expired",
      };
    }

    if (session.status !== "complete") {
      logger.warn("⚠️ VERIFY: Checkout session is not complete", {
        sessionId,
        status: session.status,
        paymentStatus: session.payment_status,
      });
      return {
        success: false,
        status: "incomplete",
        subscriptionUpdated: false,
        message: "Checkout session is not complete yet",
      };
    }

    // Payment successful - manually trigger subscription update
    logger.info("🔄 VERIFY: Session is complete, triggering subscription update", {
      sessionId,
      customerId: session.customer,
      clientReferenceId: session.client_reference_id,
      subscriptionId: session.subscription,
    });

    // Call the same handler as the webhook
    try {
      await handleCheckoutCompleted(session);

      logger.info("✅ VERIFY: Subscription updated successfully via manual verification", {
        sessionId,
        userId: session.client_reference_id,
      });

      return {
        success: true,
        status: "complete",
        subscriptionUpdated: true,
        message: "Subscription activated successfully",
      };
    } catch (handlerError) {
      logger.error("❌ VERIFY: Error in handleCheckoutCompleted", {
        sessionId,
        error: handlerError instanceof Error ? handlerError.message : String(handlerError),
        errorStack: handlerError instanceof Error ? handlerError.stack : undefined,
      });
      throw handlerError;
    }
  } catch (error) {
    logger.error("❌ VERIFY: Failed to verify checkout session", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
    });

    // Check if error is because subscription was already updated
    if (error instanceof Error && error.message.includes("already")) {
      logger.info("ℹ️ VERIFY: Subscription already activated (idempotent)", {
        sessionId,
      });
      return {
        success: true,
        status: "complete",
        subscriptionUpdated: false,
        message: "Subscription already activated",
      };
    }

    throw new Error(`Failed to verify checkout session: ${error instanceof Error ? error.message : String(error)}`);
  }
}
