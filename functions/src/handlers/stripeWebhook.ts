/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for subscription management.
 * Handles payment completion, subscription updates, and lifecycle events.
 *
 * Security:
 * - Verifies webhook signatures to prevent unauthorized requests
 * - Uses raw body for signature verification
 *
 * Events handled:
 * - checkout.session.completed: Initial payment successful
 * - customer.subscription.updated: Subscription renewed/changed
 * - customer.subscription.deleted: Subscription cancelled
 * - invoice.payment_failed: Payment failed (retry pending)
 * - invoice.payment_succeeded: Payment succeeded
 */

import * as logger from "firebase-functions/logger";

/**
 * Stripe webhook handler
 *
 * @param req - HTTP request with webhook payload
 * @param res - HTTP response
 * @param stripeWebhookSecret - Firebase secret for webhook verification
 */
export async function stripeWebhookHandler(
  req: any,
  res: any,
  stripeWebhookSecret: any
): Promise<void> {
  // Only accept POST requests
  if (req.method !== "POST") {
    logger.warn("Webhook received non-POST request", {method: req.method});
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Get Stripe signature header
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    logger.error("Missing Stripe signature header");
    res.status(400).send("Missing Stripe signature");
    return;
  }

  // Get webhook secret from environment or Firebase secret
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    stripeWebhookSecret.value();

  if (!webhookSecret) {
    logger.error("Stripe webhook secret not configured");
    res.status(500).send("Webhook secret not configured");
    return;
  }

  logger.info("Webhook secret loaded", {
    source: process.env.STRIPE_WEBHOOK_SECRET ? "env" : "secret",
    secretPrefix: webhookSecret.substring(0, 10),
  });

  try {
    // Import webhook service
    const {verifyWebhookSignature, processWebhookEvent} =
      await import("../services/stripe-webhook.js");

    // Get raw body for signature verification
    // Firebase Functions v2: rawBody is available on the request object
    // It's the raw Buffer before any parsing
    let rawBody = req.rawBody;

    // Fallback: if rawBody not available, try to use body
    if (!rawBody) {
      logger.warn("rawBody not available, attempting fallback", {
        hasBody: !!req.body,
        bodyType: typeof req.body,
        contentType: req.headers["content-type"],
      });

      // Try to use req.body if it's a Buffer
      if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
      } else if (typeof req.body === "string") {
        rawBody = Buffer.from(req.body);
      } else if (req.body) {
        // If body is already parsed JSON, we can't verify signature
        logger.error("Body was already parsed as JSON, cannot verify signature");
        res.status(400).send("Request body was pre-parsed, raw body required");
        return;
      } else {
        logger.error("No request body available");
        res.status(400).send("Missing request body");
        return;
      }
    }

    logger.info("Raw body available", {
      bodyLength: rawBody.length,
      contentType: req.headers["content-type"],
    });

    // Verify webhook signature
    logger.info("Verifying webhook signature");
    const event = verifyWebhookSignature(rawBody, signature, webhookSecret);

    logger.info("Webhook signature verified, processing event", {
      type: event.type,
      id: event.id,
    });

    // Process webhook event
    await processWebhookEvent(event);

    logger.info("Webhook event processed successfully", {
      type: event.type,
      id: event.id,
    });

    // Return 200 to acknowledge receipt
    res.status(200).json({received: true});
  } catch (error) {
    logger.error("Webhook processing error", {
      error,
      signature: signature.substring(0, 20) + "...", // Log partial signature
    });

    // Return 400 for signature verification failures
    // Return 500 for processing errors
    if (error instanceof Error &&
        error.message.includes("signature verification")) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    } else {
      res.status(500).send(`Webhook Error: ${error}`);
    }
  }
}
