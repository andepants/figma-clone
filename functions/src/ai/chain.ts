/**
 * LangGraph agent chain setup with memory
 *
 * Uses createReactAgent instead of AgentExecutor for better memory support.
 */

import {createReactAgent} from "@langchain/langgraph/prebuilt";
import {MemorySaver} from "@langchain/langgraph";
import {DynamicStructuredTool} from "@langchain/core/tools";
import {BaseMessage, trimMessages} from "@langchain/core/messages";
import * as logger from "firebase-functions/logger";
import {getLLM, getAIProvider} from "./config";

// Global memory saver (persists across function invocations within same instance)
const memorySaver = new MemorySaver();

// Enhanced system prompt with memory instructions
const SYSTEM_PROMPT = `You are an AI assistant for a collaborative canvas application (like Figma).

Your job is to interpret natural language commands and TAKE ACTION immediately using the provided tools.

IMPORTANT MEMORY FEATURES:
- You can remember previous commands in this conversation
- When user says "it" or "that", refer to the last object you created
- Track what you've done to answer questions like "what did you just make?"
- You can reference objects by name or by recency ("the circle I just made")

IMPORTANT: Be action-oriented! Use sensible defaults and execute commands right away. Only ask for clarification when the command is truly ambiguous.

IMPORTANT: Do NOT suggest additional tasks or make recommendations unless explicitly asked. When you complete a task, simply confirm what was created without suggesting next steps.

Key responsibilities:
- Create shapes (rectangles, circles, text, lines)
- Create multiple objects in patterns (use createBatch for bulk operations)
- Move, resize, rotate objects
- Update object appearance (colors, strokes, opacity)
- Arrange multiple objects in layouts
- Delete objects

Default Values (USE THESE AUTOMATICALLY):
- Rectangle size: 200x200 pixels (or 200x150 if specified as non-square)
- Circle radius: 50 pixels
- Text font size: 24px
- Default colors: blue=#3b82f6, red=#ef4444, green=#22c55e, yellow=#eab308, gray=#6b7280
- Position: VIEWPORT CENTER (where user is currently looking) if not specified
- Spacing for layouts: 20px

Coordinate System:
- Canvas size: 5000x5000 pixels
- Origin (0, 0) = top-left corner
- For circles: x,y is the CENTER point
- For rectangles/text: x,y is the TOP-LEFT corner
- Rotation: degrees (0-360)
- VIEWPORT: User's current view (use viewport center for new objects!)

Tool Usage Patterns:
- Batch operations (2-100 objects): Use createBatch with patterns (circle, spiral, grid, wave, hexagon, scatter, line)
- Semantic selection: Use findObjects by properties (type, color, size, selection) before modifying
- Complex layouts: Use composite tools (createForm, createNavBar, createCard) for structured UI
- Memory references: "it", "that", "them" refer to last created objects

Only Ask for Clarification When Truly Ambiguous:
❌ "Create a shape" (no type) → Ask: "What type of shape?"
❌ "Move that" (no object created yet, nothing selected) → Ask: "Which object?"
❌ "Change the color" (no color mentioned) → Ask: "What color?"

Response Format: Confirm action taken briefly. Use numbered lists for multiple questions. Do NOT suggest next steps unless asked.

Viewport context is provided with each command. Use it to understand what the user is currently viewing.`;

/**
 * Message trimmer to limit conversation history
 * Keeps last 5 messages to balance context vs token cost
 * Enables Anthropic prompt caching for system prompt
 */
const messageModifier = async (messages: BaseMessage[]): Promise<BaseMessage[]> => {
  // Trim messages, keeping system prompt
  const trimmed = await trimMessages(messages, {
    tokenCounter: (msgs) => msgs.length, // Count messages, not tokens
    maxTokens: 5, // Keep last 5 messages
    strategy: "last",
    startOn: "human", // Ensure valid conversation structure
    includeSystem: true, // Always keep system prompt
    allowPartial: false,
  });

  // Ensure system prompt is prepended if not present
  const hasSystemPrompt = trimmed.some((msg) => msg._getType() === "system");
  if (!hasSystemPrompt) {
    const {SystemMessage} = await import("@langchain/core/messages");
    const systemMsg = new SystemMessage(SYSTEM_PROMPT);

    // Enable Anthropic prompt caching for system message
    // This marks the system prompt as cacheable, reducing latency by 200-400ms
    interface MessageWithKwargs {
      additional_kwargs?: Record<string, unknown>;
    }
    (systemMsg as MessageWithKwargs).additional_kwargs = {
      cache_control: {type: "ephemeral"},
    };

    return [systemMsg, ...trimmed];
  }

  // If system prompt exists, ensure it has cache control for Anthropic
  const firstMessage = trimmed[0];
  if (firstMessage._getType() === "system") {
    interface MessageWithKwargs {
      additional_kwargs?: Record<string, unknown>;
    }
    (firstMessage as MessageWithKwargs).additional_kwargs = {
      ...(firstMessage as MessageWithKwargs).additional_kwargs,
      cache_control: {type: "ephemeral"},
    };
  }

  return trimmed;
};

/**
 * Create LangGraph React agent with memory
 *
 * @param tools - Array of LangChain tools for canvas operations
 * @param llm - Optional pre-configured LLM instance (for model routing)
 * @returns Configured agent with memory persistence
 */
export async function createAIChain(
  tools: DynamicStructuredTool[],
  llm?: ReturnType<typeof getLLM>
): Promise<ReturnType<typeof createReactAgent>> {
  try {
    const provider = getAIProvider();
    logger.info("Creating LangGraph agent with memory", {
      provider,
      toolCount: tools.length,
      toolNames: tools.map((t) => t.name),
    });

    // Use provided LLM or get default
    const llmInstance = llm || getLLM(provider);

    // For Anthropic, enable prompt caching by wrapping LLM
    // This caches the system prompt for 200-400ms latency reduction
    const finalLLM = llmInstance;
    if (provider === "anthropic") {
      // LangChain Anthropic automatically handles prompt caching
      // when the clientOptions header is set (done in config.ts)
      // The system prompt will be cached automatically
      logger.info("Anthropic provider detected - prompt caching enabled");
    }

    // Create React agent with memory
    // Note: System prompt is automatically included via messageModifier
    const agent = createReactAgent({
      llm: finalLLM,
      tools,
      messageModifier, // Trim to last 5 messages
      checkpointSaver: memorySaver, // Enable conversation memory
    });

    logger.info("LangGraph agent created successfully");
    return agent;
  } catch (error) {
    logger.error("Failed to create LangGraph agent", {error});
    throw new Error(`Failed to create AI chain: ${error}`);
  }
}
