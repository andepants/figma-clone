/**
 * Analytics service for AI usage tracking
 *
 * Tracks token usage, response times, and costs for AI operations.
 * Used for monitoring spending and optimizing prompts.
 */

import * as logger from "firebase-functions/logger";
import {getDatabase} from "./firebase-admin";
import {AIProvider} from "../ai/config";

/**
 * AI usage data structure
 */
export interface AIUsageData {
  userId: string;
  provider: AIProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  command: string;
  success: boolean;
  responseTime: number; // milliseconds
  canvasId: string;
  objectsCreated: number;
  objectsModified: number;
  toolsUsed: string[];
}

/**
 * Model pricing (per 1M tokens)
 * Source: OpenAI and Anthropic pricing pages (as of Oct 2024)
 */
const MODEL_PRICING: Record<string, {input: number; output: number}> = {
  // OpenAI
  "gpt-4o-mini": {input: 0.15, output: 0.6}, // $0.15 / $0.60 per 1M tokens
  "gpt-4o": {input: 2.5, output: 10}, // $2.50 / $10.00 per 1M tokens
  "gpt-4-turbo": {input: 10, output: 30}, // $10 / $30 per 1M tokens

  // Anthropic
  "claude-3-5-haiku-20241022": {input: 1.0, output: 5.0}, // $1 / $5 per 1M tokens
  "claude-3-5-sonnet-20241022": {input: 3.0, output: 15.0}, // $3 / $15 per 1M tokens
};

/**
 * Calculate cost for a given usage
 *
 * @param model - Model name
 * @param promptTokens - Input tokens used
 * @param completionTokens - Output tokens used
 * @returns Cost in USD
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    logger.warn("Unknown model for pricing calculation", {model});
    return 0;
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Log AI usage to analytics database
 *
 * @param data - Usage data to log
 * @returns Promise that resolves when logged
 */
export async function logAIUsage(data: AIUsageData): Promise<void> {
  try {
    const cost = calculateCost(
      data.model,
      data.promptTokens,
      data.completionTokens
    );

    const analyticsData = {
      ...data,
      cost,
      timestamp: Date.now(),
    };

    const ref = getDatabase().ref("analytics/ai-usage").push();
    await ref.set(analyticsData);

    logger.info("AI usage logged", {
      userId: data.userId,
      provider: data.provider,
      model: data.model,
      totalTokens: data.totalTokens,
      cost: `$${cost.toFixed(6)}`,
      responseTime: `${data.responseTime}ms`,
      success: data.success,
    });
  } catch (error) {
    // Don't fail the request if analytics logging fails
    logger.error("Failed to log AI usage", {error, data});
  }
}

/**
 * Get usage statistics for a user
 *
 * @param userId - User ID to get stats for
 * @param timeRangeMs - Time range in milliseconds (default: 24 hours)
 * @returns Promise with usage stats
 */
export async function getUserUsageStats(
  userId: string,
  timeRangeMs: number = 24 * 60 * 60 * 1000
): Promise<{
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
}> {
  const ref = getDatabase().ref("analytics/ai-usage");
  const startTime = Date.now() - timeRangeMs;

  const snapshot = await ref
    .orderByChild("timestamp")
    .startAt(startTime)
    .once("value");

  const entries = snapshot.val() || {};
  const userEntries = Object.values(entries).filter(
    (entry: any) => entry.userId === userId
  );

  if (userEntries.length === 0) {
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgResponseTime: 0,
    };
  }

  const totalTokens = userEntries.reduce(
    (sum: number, e: any) => sum + (e.totalTokens || 0),
    0
  );

  const totalCost = userEntries.reduce(
    (sum: number, e: any) => sum + (e.cost || 0),
    0
  );

  const totalResponseTime = userEntries.reduce(
    (sum: number, e: any) => sum + (e.responseTime || 0),
    0
  );

  return {
    totalRequests: userEntries.length,
    totalTokens,
    totalCost,
    avgResponseTime: totalResponseTime / userEntries.length,
  };
}
