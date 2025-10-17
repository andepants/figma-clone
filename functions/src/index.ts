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
import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {
  ProcessAICommandRequest,
  ProcessAICommandResponse,
} from "./types";

// Define secrets (for production deployment)
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

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
  async (request) => {
    const {auth, data} = request;

    // Authentication check
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to use AI features"
      );
    }

    // Rate limiting check
    logger.info("Importing rate limiter service");
    const {checkRateLimit} = await import("./services/rate-limiter.js");
    logger.info("Checking rate limit", {userId: auth.uid});
    const allowed = await checkRateLimit(auth.uid);
    logger.info("Rate limit check completed", {allowed});
    if (!allowed) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many AI commands. Please wait a moment before trying again."
      );
    }

    // Validate required fields
    if (!data.command || typeof data.command !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid 'command' field"
      );
    }

    // Input validation
    const trimmedCommand = data.command.trim();
    if (trimmedCommand.length === 0) {
      throw new HttpsError("invalid-argument", "Command cannot be empty");
    }

    if (trimmedCommand.length > 500) {
      throw new HttpsError(
        "invalid-argument",
        "Command too long (max 500 characters)"
      );
    }

    if (!data.canvasId || typeof data.canvasId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid 'canvasId' field"
      );
    }

    // Validate canvas ID format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(data.canvasId)) {
      throw new HttpsError("invalid-argument", "Invalid canvas ID format");
    }

    if (!data.canvasState || !Array.isArray(data.canvasState.objects)) {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid 'canvasState' field"
      );
    }

    // NEW: Validate viewport data (optional but must be valid if provided)
    if (data.canvasState.viewport) {
      const {camera, zoom} = data.canvasState.viewport;

      if (
        typeof camera?.x !== "number" ||
        typeof camera?.y !== "number" ||
        typeof zoom !== "number" ||
        zoom <= 0
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid viewport data format. Camera x/y must be numbers and zoom must be a positive number."
        );
      }
    }

    // NEW: Validate threadId format if provided
    if (data.threadId && typeof data.threadId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Invalid threadId format. Must be a string."
      );
    }

    // Authorization check (temporarily disabled for local testing)
    // TODO: Re-enable for production
    // const {canUserModifyCanvas} = await import("./services/authorization.js");
    // const canModify = await canUserModifyCanvas(auth.uid, data.canvasId);
    // if (!canModify) {
    //   throw new HttpsError(
    //     "permission-denied",
    //     "You do not have permission to modify this canvas"
    //   );
    // }

    // Generate thread ID for conversation persistence
    const threadId = data.threadId || `${auth.uid}_${data.canvasId}_default`;

    logger.info("Processing AI command with thread", {
      userId: auth.uid,
      canvasId: data.canvasId,
      threadId,
      command: data.command.substring(0, 100), // Log first 100 chars
      objectCount: data.canvasState.objects.length,
    });

    // Track execution time
    const startTime = Date.now();
    let aiProvider: string = "openai";
    let modelName: string = "gpt-4o-mini";

    try {
      // Import AI chain components
      const {createAIChain} = await import("./ai/chain.js");
      const {getTools} = await import("./ai/tools/index.js");
      const {getLLM} = await import("./ai/config.js");
      const {logAIUsage} = await import("./services/analytics.js");
      const {optimizeContext} = await import("./ai/utils/context-optimizer.js");
      const {
        getCachedContext,
        setCachedContext,
        generateCacheKey,
      } = await import("./ai/utils/context-cache.js");

      // Try cache first
      const cacheKey = generateCacheKey(data.canvasState);
      let optimizedState = getCachedContext(cacheKey);

      if (optimizedState) {
        logger.info("Using cached context", {cacheKey});
      } else {
        logger.info("Optimizing context (cache miss)", {cacheKey});
        optimizedState = optimizeContext(data.canvasState);
        setCachedContext(cacheKey, optimizedState);

        logger.info("Context optimized", {
          originalObjects: data.canvasState.objects.length,
          optimizedObjects: optimizedState.objects.length,
          selectedCount: data.canvasState.selectedObjectIds?.length || 0,
          hasViewport: !!optimizedState._viewportBounds,
        });
      }

      // Use OpenAI for all environments
      const provider = "openai";
      aiProvider = provider;
      const llm = getLLM(provider);
      // Extract model name safely from either provider
      if ("modelName" in llm) {
        modelName = llm.modelName || modelName;
      }

      // Create tool context with optimized state
      const toolContext = {
        canvasId: data.canvasId,
        userId: auth.uid,
        currentObjects: optimizedState.objects,
        canvasSize: optimizedState.canvasSize,
        selectedObjectIds: optimizedState.selectedObjectIds,
        // Pass viewport bounds from optimized state
        viewportBounds: optimizedState._viewportBounds,
        // Will be populated from conversation memory in Phase 3
        lastCreatedObjectIds: [],
      };

      // Get tools and create AI chain
      const tools = getTools(toolContext);
      const chain = await createAIChain(tools);

      // Configure LangGraph with thread ID for memory persistence
      const config = {
        configurable: {
          thread_id: threadId,
        },
        streamMode: "values" as const,
      };

      logger.info("Invoking LangGraph agent", {
        command: data.command,
        toolCount: tools.length,
        provider: aiProvider,
        model: modelName,
        threadId,
      });

      // Invoke with messages format (LangGraph expects this)
      const result = await chain.invoke(
        {
          messages: [
            {
              role: "user",
              content: data.command,
            },
          ],
        },
        config
      );

      const responseTime = Date.now() - startTime;

      // Extract response from LangGraph result
      const messages = result.messages || [];
      const lastMessage = messages[messages.length - 1];
      const output = lastMessage?.content || "Command processed successfully";

      logger.info("LangGraph agent completed", {
        output: output.substring(0, 200),
        messageCount: messages.length,
        threadId,
        responseTime: `${responseTime}ms`,
      });

      // Parse tool calls from messages
      const actions: Array<{tool: string; params: Record<string, unknown>; result: {success: boolean}}> = [];
      for (const msg of messages) {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          for (const toolCall of msg.tool_calls) {
            actions.push({
              tool: toolCall.name,
              params: toolCall.args,
              result: {success: true}, // Simplified for now
            });
          }
        }
      }

      // Count objects created/modified
      const objectsCreated = actions.filter(
        (a) => a.tool.startsWith("create_")
      ).length;
      const objectsModified = actions.filter(
        (a) =>
          a.tool.startsWith("update_") ||
          a.tool.startsWith("move_") ||
          a.tool.startsWith("delete_")
      ).length;
      const toolNames = actions.map((a) => a.tool as string);
      const toolsUsed: string[] = Array.from(new Set(toolNames));

      // Extract token usage from result metadata
      // Note: LangChain may expose this differently depending on provider
      const usage = (result as {llmOutput?: {tokenUsage?: {promptTokens?: number; input_tokens?: number; completionTokens?: number; output_tokens?: number; totalTokens?: number}}}).llmOutput?.tokenUsage || {};
      const promptTokens = usage.promptTokens || usage.input_tokens || 0;
      const completionTokens =
        usage.completionTokens || usage.output_tokens || 0;
      const totalTokens =
        usage.totalTokens || promptTokens + completionTokens || 0;

      // Log analytics (fire and forget - don't block response)
      logAIUsage({
        userId: auth.uid,
        provider: aiProvider as "openai" | "anthropic",
        model: modelName,
        promptTokens,
        completionTokens,
        totalTokens,
        command: data.command,
        success: true,
        responseTime,
        canvasId: data.canvasId,
        objectsCreated,
        objectsModified,
        toolsUsed,
      }).catch((err) => {
        logger.error("Failed to log analytics", {error: err});
      });

      const response: ProcessAICommandResponse = {
        success: true,
        message: output,
        actions,
      };

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Extract detailed error information
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : undefined;

      logger.error("Error processing AI command", {
        error,
        errorMessage,
        errorStack,
        errorName,
        userId: auth.uid,
        canvasId: data.canvasId,
        responseTime: `${responseTime}ms`,
      });

      // Log failed command to analytics (fire and forget)
      (async () => {
        try {
          const {logAIUsage} = await import("./services/analytics.js");
          await logAIUsage({
            userId: auth.uid,
            provider: aiProvider as "openai" | "anthropic",
            model: modelName,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            command: data.command,
            success: false,
            responseTime,
            canvasId: data.canvasId,
            objectsCreated: 0,
            objectsModified: 0,
            toolsUsed: [],
          });
        } catch (logError) {
          logger.error("Failed to log failed command analytics", {
            error: logError,
          });
        }
      })();

      // Return user-friendly error with detailed message
      throw new HttpsError(
        "internal",
        `Failed to process AI command: ${errorMessage || error}`
      );
    }
  }
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
  async (request) => {
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
        await import("./services/create-checkout-session.js");

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
  async (request) => {
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
        await import("./services/verify-checkout-session.js");

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
    secrets: [stripeWebhookSecret],
  },
  async (req, res) => {
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
        await import("./services/stripe-webhook.js");

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
);
