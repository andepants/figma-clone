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

Action-Oriented Examples:
✅ "Create a blue square" → Use createRectangle at VIEWPORT CENTER
✅ "Make a red circle" → Use createCircle at VIEWPORT CENTER
✅ "Move it to the right" → Move last created object 100px right
✅ "Make it bigger" → Resize last created object with scale: 1.5
✅ "Arrange them in a row" → Use arrangeInRow on last created objects

Memory Examples:
✅ "Create 3 circles" → Create circles, remember their IDs
✅ "Now move them left" → Move the 3 circles you just created
✅ "What did I just make?" → Refer to conversation history

Only Ask for Clarification When Truly Ambiguous:
❌ "Create a shape" (no type) → Ask: "What type of shape?"
❌ "Move that" (no object created yet, nothing selected) → Ask: "Which object?"
❌ "Change the color" (no color mentioned) → Ask: "What color?"

FORMATTING GUIDELINES:
When asking multiple questions, format them clearly with line breaks:
- Start each numbered question on a new line
- Use blank lines to separate different sections
- Keep questions concise and easy to scan
- Example:
  "I need some information to create the feature graphic:

  1. What is the app name?
  2. What category does the app fall under?
  3. What is the key feature or value proposition?

  Please provide these details!"

After executing tools, respond with a brief confirmation of what was created/changed. Do NOT suggest next steps, additional tasks, or related features unless the user explicitly asks for recommendations.

Viewport context is provided with each command. Use it to understand what the user is currently viewing.`;

/**
 * Message trimmer to limit conversation history
 * Keeps last 10 messages to balance context vs token cost
 */
const messageModifier = async (messages: BaseMessage[]): Promise<BaseMessage[]> => {
  // Trim messages, keeping system prompt
  const trimmed = await trimMessages(messages, {
    tokenCounter: (msgs) => msgs.length, // Count messages, not tokens
    maxTokens: 10, // Keep last 10 messages
    strategy: "last",
    startOn: "human", // Ensure valid conversation structure
    includeSystem: true, // Always keep system prompt
    allowPartial: false,
  });

  // Ensure system prompt is prepended if not present
  const hasSystemPrompt = trimmed.some((msg) => msg._getType() === "system");
  if (!hasSystemPrompt) {
    const {SystemMessage} = await import("@langchain/core/messages");
    return [new SystemMessage(SYSTEM_PROMPT), ...trimmed];
  }

  return trimmed;
};

/**
 * Create LangGraph React agent with memory
 *
 * @param tools - Array of LangChain tools for canvas operations
 * @returns Configured agent with memory persistence
 */
export async function createAIChain(
  tools: DynamicStructuredTool[]
): Promise<ReturnType<typeof createReactAgent>> {
  try {
    const provider = getAIProvider();
    logger.info("Creating LangGraph agent with memory", {
      provider,
      toolCount: tools.length,
      toolNames: tools.map((t) => t.name),
    });

    const llm = getLLM(provider);

    // Create React agent with memory
    // Note: System prompt is automatically included via messageModifier
    const agent = createReactAgent({
      llm,
      tools,
      messageModifier, // Trim to last 10 messages
      checkpointSaver: memorySaver, // Enable conversation memory
    });

    logger.info("LangGraph agent created successfully");
    return agent;
  } catch (error) {
    logger.error("Failed to create LangGraph agent", {error});
    throw new Error(`Failed to create AI chain: ${error}`);
  }
}
