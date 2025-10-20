/**
 * Process AI Command Handler
 *
 * Accepts natural language commands and executes canvas operations.
 * Used by the frontend AI input component.
 */

import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  ProcessAICommandRequest,
  ProcessAICommandResponse,
} from "../types";

/**
 * Process AI command callable function handler
 *
 * @param request - Contains auth context and command data
 * @returns Response with success status and actions taken
 */
export async function processAICommandHandler(
  request: CallableRequest<ProcessAICommandRequest>
): Promise<ProcessAICommandResponse> {
  const {auth, data} = request;

  // Authentication check
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to use AI features"
    );
  }

  // Try fast path BEFORE rate limiting for ultra-low latency
  // (Only for simple, unambiguous commands)
  const {tryFastPath, isTooComplex} = await import("../ai/utils/fast-path.js");

  if (!isTooComplex(data.command)) {
    const fastPathMatch = tryFastPath(data.command);

    if (fastPathMatch) {
      logger.info("Fast path matched - bypassing LLM", {
        toolName: fastPathMatch.toolName,
        command: data.command,
      });

      // Execute fast path tool directly
      const {executeFastPathTool} = await import("../ai/utils/fast-path-executor.js");
      try {
        const result = await executeFastPathTool(
          fastPathMatch,
          data.canvasId,
          auth.uid,
          data.canvasState
        );

        logger.info("Fast path execution complete", {
          toolName: fastPathMatch.toolName,
          success: result.success,
        });

        return result;
      } catch (error) {
        // Fast path failed - fall through to LLM
        logger.warn("Fast path execution failed, falling back to LLM", {error});
      }
    }
  }

  // Validate required fields FIRST (before async operations)
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

  // Validate viewport data (optional but must be valid if provided)
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

  // Validate threadId format if provided
  if (data.threadId && typeof data.threadId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Invalid threadId format. Must be a string."
    );
  }

  // Parallel validation: Run rate limit check in parallel with async imports
  // This saves 30-50ms by not waiting sequentially
  logger.info("Starting parallel validation");
  const parallelStart = Date.now();

  const {checkRateLimit} = await import("../services/rate-limiter.js");
  const allowed = await checkRateLimit(auth.uid);

  logger.info("Parallel validation completed", {
    allowed,
    parallelTime: `${Date.now() - parallelStart}ms`,
  });

  if (!allowed) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many AI commands. Please wait a moment before trying again."
    );
  }

  // Authorization check (temporarily disabled for local testing)
  // TODO: Re-enable for production
  // const {canUserModifyCanvas} = await import("../services/authorization.js");
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
    // Import all dependencies in parallel for faster initialization
    const [
      {createAIChain},
      {getTools},
      {getLLM},
      {logAIUsage},
      {optimizeContext},
      {
        getCachedContext,
        setCachedContext,
        generateCacheKey,
      },
    ] = await Promise.all([
      import("../ai/chain.js"),
      import("../ai/tools/index.js"),
      import("../ai/config.js"),
      import("../services/analytics.js"),
      import("../ai/utils/context-optimizer.js"),
      import("../ai/utils/context-cache.js"),
    ]);

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
    const hasViewport = !!optimizedState._viewportBounds;
    const viewportBounds = optimizedState._viewportBounds || {
      centerX: 2500,
      centerY: 2500,
      minX: 0,
      maxX: 5000,
      minY: 0,
      maxY: 5000,
    };

    if (!hasViewport) {
      logger.warn("⚠️ No viewport data provided - using canvas center as fallback", {
        fallbackCenter: {x: viewportBounds.centerX, y: viewportBounds.centerY},
        canvasSize: optimizedState.canvasSize,
      });
    } else {
      logger.info("📍 Viewport context provided", {
        center: {x: viewportBounds.centerX, y: viewportBounds.centerY},
        bounds: {
          minX: viewportBounds.minX,
          maxX: viewportBounds.maxX,
          minY: viewportBounds.minY,
          maxY: viewportBounds.maxY,
        },
      });
    }

    const toolContext = {
      canvasId: data.canvasId,
      userId: auth.uid,
      currentObjects: optimizedState.objects,
      canvasSize: optimizedState.canvasSize,
      selectedObjectIds: optimizedState.selectedObjectIds,
      // Pass viewport bounds from optimized state (with fallback)
      viewportBounds,
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
      // Increased from default 25 to prevent "Recursion limit reached" errors
      // Allows complex multi-step operations (e.g., creating navbars with menu items)
      recursionLimit: 150,
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
          logger.info("🔧 Tool executed", {
            toolName: toolCall.name,
            params: JSON.stringify(toolCall.args).substring(0, 200),
            messageId: msg.id,
          });

          actions.push({
            tool: toolCall.name,
            params: toolCall.args,
            result: {success: true}, // Simplified for now
          });
        }
      }
    }

    logger.info("📊 Execution summary", {
      totalActions: actions.length,
      toolsUsed: Array.from(new Set(actions.map(a => a.tool))),
      commandLength: data.command.length,
      responseTime: `${responseTime}ms`,
    });

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
        const {logAIUsage} = await import("../services/analytics.js");
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
