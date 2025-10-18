/**
 * Firebase Functions for AI Canvas Agent
 *
 * Main entry point for AI-powered canvas manipulation.
 * Processes natural language commands and executes canvas operations.
 */

// Load environment variables from .env.local (for local development)
import dotenv from "dotenv";
import {resolve} from "path";
dotenv.config({path: resolve(__dirname, "../../.env.local")});

import {setGlobalOptions} from "firebase-functions/v2";
import {onCall, onRequest} from "firebase-functions/v2/https";
import {defineSecret, defineString} from "firebase-functions/params";
import {ProcessAICommandRequest} from "./types";

// Import handlers
import {processAICommandHandler} from "./handlers/processAICommand.js";
import {createCheckoutSessionHandler} from "./handlers/createCheckoutSession.js";
import {verifyCheckoutSessionHandler} from "./handlers/verifyCheckoutSession.js";
import {stripeWebhookHandler} from "./handlers/stripeWebhook.js";

// Define secrets (for production deployment)
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Define environment parameters (non-secret config)
const stripeFoundersPriceId = defineString("STRIPE_FOUNDERS_PRICE_ID");
const stripeProPriceId = defineString("STRIPE_PRO_PRICE_ID");

// Global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

/**
 * Process AI command callable function
 *
 * Accepts natural language commands and executes canvas operations.
 * Used by the frontend AI input component.
 *
 * @param request - Contains auth context and command data
 * @returns Response with success status and actions taken
 */
export const processAICommand = onCall<ProcessAICommandRequest>(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 300, // 5 minutes (AI image generation can take 30-60s)
    memory: "512MiB", // Increased memory for AI processing
  },
  processAICommandHandler
);

/**
 * Create Stripe Checkout Session
 *
 * Callable function to create a new Stripe Checkout Session for subscription payments.
 * Returns the session URL for client-side redirect.
 *
 * Replaces deprecated `stripe.redirectToCheckout()` method with server-side session creation.
 *
 * @param request - Contains auth context and checkout parameters
 * @returns Session ID and URL for redirect
 */
export const createCheckoutSession = onCall(
  {
    secrets: [stripeSecretKey],
  },
  createCheckoutSessionHandler
);

/**
 * Verify Checkout Session (Manual Fallback)
 *
 * Callable function to manually verify a checkout session and update subscription.
 * Used as fallback when webhooks don't fire reliably in development/emulator.
 *
 * @param request - Contains auth context and session ID
 * @returns Verification result with subscription status
 */
export const verifyCheckoutSession = onCall(
  {
    secrets: [stripeSecretKey],
  },
  verifyCheckoutSessionHandler
);

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
export const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    // Set price IDs in environment for webhook handlers to access
    // In production, these come from Firebase params; in dev, from .env.local
    if (!process.env.STRIPE_FOUNDERS_PRICE_ID) {
      process.env.STRIPE_FOUNDERS_PRICE_ID = stripeFoundersPriceId.value();
    }
    if (!process.env.STRIPE_PRO_PRICE_ID) {
      process.env.STRIPE_PRO_PRICE_ID = stripeProPriceId.value();
    }

    // Type assertion for compatibility with handler signature
    await stripeWebhookHandler(req as never, res as never, stripeWebhookSecret);
  }
);
