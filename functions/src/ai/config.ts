/**
 * AI configuration and LLM initialization
 *
 * Manages AI provider selection and model configuration.
 * Supports OpenAI (dev/test) and Anthropic (production).
 */

import {ChatOpenAI} from "@langchain/openai";
import {ChatAnthropic} from "@langchain/anthropic";
import * as logger from "firebase-functions/logger";

/**
 * AI provider type
 */
export type AIProvider = "openai" | "anthropic";

/**
 * Get configured LLM instance based on provider
 *
 * @param provider - AI provider to use ('openai' or 'anthropic')
 * @param modelName - Optional specific model name (overrides default/env)
 * @returns Configured LLM instance
 * @throws Error if API key is missing
 */
export function getLLM(provider: AIProvider = "openai", modelName?: string) {
  logger.info("Initializing LLM", {provider, modelName});

  if (provider === "openai") {
    // Support both process.env (local) and Firebase config (production)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. " +
        "Set it in functions/.env.local for local dev, or use " +
        "'firebase functions:secrets:set OPENAI_API_KEY' for production."
      );
    }

    return new ChatOpenAI({
      modelName: modelName || process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0, // Deterministic for canvas operations
      openAIApiKey: apiKey,
      maxRetries: 2,
      timeout: 30000, // 30s timeout
    });
  } else {
    // Support both process.env (local) and Firebase config (production)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is not set. " +
        "Set it in functions/.env.local for local dev, or use " +
        "'firebase functions:secrets:set ANTHROPIC_API_KEY' for production."
      );
    }

    // Use Claude 3.5 Haiku with prompt caching for better performance
    // Prompt caching reduces latency by 200-400ms on cache hits
    return new ChatAnthropic({
      modelName: modelName || process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
      temperature: 0, // Deterministic for canvas operations
      anthropicApiKey: apiKey,
      maxRetries: 2,
      // Enable prompt caching (Anthropic-specific feature)
      // The system prompt will be cached automatically by LangChain
      clientOptions: {
        defaultHeaders: {
          "anthropic-beta": "prompt-caching-2024-07-31",
        },
      },
    });
  }
}

/**
 * Get current AI provider from environment
 *
 * @returns Current AI provider ('openai' or 'anthropic')
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "anthropic") {
    return "anthropic";
  }
  return "openai"; // Default to OpenAI
}

/**
 * Command complexity analysis for model routing
 */
interface CommandComplexity {
  isComplex: boolean;
  signals: {
    wordCount: number;
    hasBatchOperation: boolean;
    hasMultipleActions: boolean;
    hasConditionalLogic: boolean;
  };
}

/**
 * Analyze command complexity to route to appropriate model
 *
 * Simple commands use faster/cheaper models (gpt-3.5-turbo)
 * Complex commands use more capable models (gpt-4o-mini)
 *
 * @param command - Natural language command to analyze
 * @returns Complexity analysis result
 */
export function analyzeCommandComplexity(command: string): CommandComplexity {
  const words = command.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerCommand = command.toLowerCase();

  // Detect batch operation keywords
  const batchKeywords = [
    "multiple", "several", "many", "bunch", "group",
    "spiral", "grid", "circle", "wave", "pattern",
    "distribute", "arrange", "layout", "rows", "columns"
  ];
  const hasBatchOperation = batchKeywords.some(keyword =>
    lowerCommand.includes(keyword)
  );

  // Detect multiple action words (create AND move, update AND delete, etc.)
  const actionKeywords = ["create", "make", "add", "move", "delete", "remove", "update", "change", "rotate", "resize"];
  const actionCount = actionKeywords.filter(keyword =>
    lowerCommand.includes(keyword)
  ).length;
  const hasMultipleActions = actionCount > 1;

  // Detect conditional/complex logic
  const conditionalKeywords = ["if", "when", "where", "only", "except", "all", "every", "each"];
  const hasConditionalLogic = conditionalKeywords.some(keyword =>
    lowerCommand.includes(keyword)
  );

  // Detect numeric patterns (e.g., "create 30 circles")
  const hasLargeNumber = /\b([2-9]\d|[1-9]\d{2,})\b/.test(command); // 20+ objects

  // Command is complex if:
  // - Very long (>15 words)
  // - Has batch operations
  // - Has multiple actions
  // - Has conditional logic
  // - Requests large number of objects (20+)
  const isComplex =
    wordCount > 15 ||
    hasBatchOperation ||
    hasMultipleActions ||
    hasConditionalLogic ||
    hasLargeNumber;

  return {
    isComplex,
    signals: {
      wordCount,
      hasBatchOperation,
      hasMultipleActions,
      hasConditionalLogic,
    },
  };
}

/**
 * Get appropriate model based on command complexity
 *
 * Routes simple commands to faster models, complex commands to more capable models
 *
 * @param command - Natural language command
 * @param provider - AI provider ('openai' or 'anthropic')
 * @returns Model name to use
 */
export function getModelForCommand(command: string, provider: AIProvider = "openai"): string {
  const complexity = analyzeCommandComplexity(command);

  let selectedModel: string;
  if (provider === "openai") {
    // Simple commands: gpt-3.5-turbo (fast, cheap)
    // Complex commands: gpt-4o-mini (more capable)
    selectedModel = complexity.isComplex ? "gpt-4o-mini" : "gpt-3.5-turbo";
  } else {
    // Anthropic: Use Haiku for all (already fast)
    selectedModel = "claude-3-5-haiku-20241022";
  }

  logger.info("🤖 Model routing decision", {
    command: command.substring(0, 100),
    isComplex: complexity.isComplex,
    wordCount: complexity.signals.wordCount,
    hasBatchOperation: complexity.signals.hasBatchOperation,
    hasMultipleActions: complexity.signals.hasMultipleActions,
    hasConditionalLogic: complexity.signals.hasConditionalLogic,
    provider,
    selectedModel,
    reasoning: complexity.isComplex
      ? "Complex command - using more capable model"
      : "Simple command - using faster model",
  });

  return selectedModel;
}
