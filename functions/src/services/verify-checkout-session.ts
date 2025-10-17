/**
 * Verify Checkout Session Service
 *
 * Manually verifies a Stripe checkout session and updates subscription if needed.
 * Used as fallback when webhooks don't fire in development/emulator environments.
 */

import * as logger from "firebase-functions/logger";
import {getStripeInstance} from "./stripe-webhook.js";
import {handleCheckoutCompleted} from "./stripe-webhook.js";

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

  logger.info("Manually verifying checkout session", {sessionId});

  try {
    const stripe = getStripeInstance();

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logger.info("Checkout session retrieved", {
      sessionId,
      status: session.status,
      paymentStatus: session.payment_status,
    });

    // Check session status
    if (session.status === "expired") {
      return {
        success: false,
        status: "expired",
        subscriptionUpdated: false,
        message: "Checkout session has expired",
      };
    }

    if (session.status !== "complete") {
      return {
        success: false,
        status: "incomplete",
        subscriptionUpdated: false,
        message: "Checkout session is not complete yet",
      };
    }

    // Payment successful - manually trigger subscription update
    logger.info("Checkout session complete, triggering subscription update", {
      sessionId,
      customerId: session.customer,
      clientReferenceId: session.client_reference_id,
    });

    // Call the same handler as the webhook
    await handleCheckoutCompleted(session);

    logger.info("Subscription updated successfully", {
      sessionId,
      userId: session.client_reference_id,
    });

    return {
      success: true,
      status: "complete",
      subscriptionUpdated: true,
      message: "Subscription activated successfully",
    };
  } catch (error) {
    logger.error("Failed to verify checkout session", {
      sessionId,
      error,
    });

    // Check if error is because subscription was already updated
    if (error instanceof Error && error.message.includes("already")) {
      return {
        success: true,
        status: "complete",
        subscriptionUpdated: false,
        message: "Subscription already activated",
      };
    }

    throw new Error(`Failed to verify checkout session: ${error}`);
  }
}
