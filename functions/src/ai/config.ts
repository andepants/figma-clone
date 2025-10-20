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
 * @returns Configured LLM instance
 * @throws Error if API key is missing
 */
export function getLLM(provider: AIProvider = "openai") {
  logger.info("Initializing LLM", {provider});

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
      modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
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

    return new ChatAnthropic({
      modelName: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
      temperature: 0, // Deterministic for canvas operations
      anthropicApiKey: apiKey,
      maxRetries: 2,
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
