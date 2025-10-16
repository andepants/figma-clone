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
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {
  ProcessAICommandRequest,
  ProcessAICommandResponse,
} from "./types";

// Define secrets (for production deployment)
const openaiApiKey = defineSecret("OPENAI_API_KEY");

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

    logger.info("Processing AI command", {
      userId: auth.uid,
      canvasId: data.canvasId,
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

      // Optimize context to reduce token usage
      const optimizedState = optimizeContext(data.canvasState);

      logger.info("Context optimized", {
        originalObjects: data.canvasState.objects.length,
        optimizedObjects: optimizedState.objects.length,
        selectedCount: data.canvasState.selectedObjectIds?.length || 0,
      });

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
      };

      // Get tools and create AI chain
      const tools = getTools(toolContext);
      const chain = await createAIChain(tools);

      logger.info("Invoking AI chain", {
        command: data.command,
        toolCount: tools.length,
        provider: aiProvider,
        model: modelName,
      });

      // Invoke the chain with the command
      const result = await chain.invoke({
        input: data.command,
      });

      const responseTime = Date.now() - startTime;

      logger.info("AI chain completed", {
        output: result.output?.substring(0, 200),
        stepCount: result.intermediateSteps?.length || 0,
        responseTime: `${responseTime}ms`,
      });

      // Parse intermediate steps to extract actions
      const actions = (result.intermediateSteps || []).map(
        (step: any) => ({
          tool: step.action?.tool || "unknown",
          params: step.action?.toolInput || {},
          result: step.observation ? JSON.parse(step.observation) : null,
        })
      );

      // Count objects created/modified
      const objectsCreated = actions.filter(
        (a: any) => a.tool.startsWith("create_")
      ).length;
      const objectsModified = actions.filter(
        (a: any) =>
          a.tool.startsWith("update_") ||
          a.tool.startsWith("move_") ||
          a.tool.startsWith("delete_")
      ).length;
      const toolNames = actions.map((a: any) => a.tool as string);
      const toolsUsed: string[] = Array.from(new Set(toolNames));

      // Extract token usage from result metadata
      // Note: LangChain may expose this differently depending on provider
      const usage = (result as any).llmOutput?.tokenUsage || {};
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
        message: result.output || "Command processed successfully",
        actions,
      };

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      logger.error("Error processing AI command", {
        error,
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

      // Return user-friendly error
      throw new HttpsError(
        "internal",
        `Failed to process AI command: ${error}`
      );
    }
  }
);
