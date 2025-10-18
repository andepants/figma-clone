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
  req: {
    method: string;
    headers: Record<string, string | string[]>;
    rawBody?: Buffer;
    body?: unknown;
  },
  res: {
    status: (code: number) => {
      send: (message: string) => void;
      json: (data: { received: boolean }) => void;
    };
  },
  stripeWebhookSecret: { value: () => string }
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
    logger.info("🔵 WEBHOOK: Starting webhook processing", {
      timestamp: new Date().toISOString(),
      hasRawBody: !!req.rawBody,
      hasBody: !!req.body,
      contentType: req.headers["content-type"],
      userAgent: req.headers["user-agent"],
    });

    // Import webhook service
    const {verifyWebhookSignature, processWebhookEvent} =
      await import("../services/stripe-webhook.js");

    // Get raw body for signature verification
    // Firebase Functions v2: rawBody is available on the request object
    // It's the raw Buffer before any parsing
    let rawBody = req.rawBody;

    // Fallback: if rawBody not available, try to use body
    if (!rawBody) {
      logger.warn("⚠️ WEBHOOK: rawBody not available, attempting fallback", {
        hasBody: !!req.body,
        bodyType: typeof req.body,
        contentType: req.headers["content-type"],
      });

      // Try to use req.body if it's a Buffer
      if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
        logger.info("✅ WEBHOOK: Using req.body as Buffer");
      } else if (typeof req.body === "string") {
        rawBody = Buffer.from(req.body);
        logger.info("✅ WEBHOOK: Converted string body to Buffer");
      } else if (req.body) {
        // If body is already parsed JSON, we can't verify signature
        logger.error("❌ WEBHOOK: Body was already parsed as JSON, cannot verify signature", {
          bodyKeys: Object.keys(req.body as object),
        });
        res.status(400).send("Request body was pre-parsed, raw body required");
        return;
      } else {
        logger.error("❌ WEBHOOK: No request body available at all");
        res.status(400).send("Missing request body");
        return;
      }
    }

    logger.info("✅ WEBHOOK: Raw body available for signature verification", {
      bodyLength: rawBody.length,
      bodyPreview: rawBody.toString().substring(0, 100) + "...",
      contentType: req.headers["content-type"],
    });

    // Verify webhook signature
    logger.info("🔐 WEBHOOK: Verifying webhook signature", {
      signatureLength: signature.length,
      signaturePreview: signature.substring(0, 30) + "...",
      webhookSecretConfigured: !!webhookSecret,
      webhookSecretLength: webhookSecret.length,
    });

    const event = verifyWebhookSignature(rawBody, signature, webhookSecret);

    logger.info("✅ WEBHOOK: Signature verified successfully", {
      eventType: event.type,
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode,
    });

    // Process webhook event
    logger.info("🔄 WEBHOOK: Processing webhook event", {
      type: event.type,
      id: event.id,
    });

    await processWebhookEvent(event);

    logger.info("✅ WEBHOOK: Event processed successfully", {
      type: event.type,
      id: event.id,
      processingTime: `${Date.now()}`,
    });

    // Return 200 to acknowledge receipt
    res.status(200).json({received: true});
  } catch (error) {
    logger.error("❌ WEBHOOK: Processing error occurred", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
      signature: signature.substring(0, 20) + "...",
      timestamp: new Date().toISOString(),
    });

    // Return 400 for signature verification failures
    // Return 500 for processing errors
    if (error instanceof Error &&
        error.message.includes("signature verification")) {
      logger.error("❌ WEBHOOK: Signature verification failed - webhook secret mismatch?", {
        errorMessage: error.message,
        webhookSecretConfigured: !!webhookSecret,
      });
      res.status(400).send(`Webhook Error: ${error.message}`);
    } else {
      logger.error("❌ WEBHOOK: Internal processing error", {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      res.status(500).send(`Webhook Error: ${error}`);
    }
  }
}
