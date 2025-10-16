/**
 * LangChain agent chain setup
 *
 * Creates and configures the AI agent with tools for canvas manipulation.
 */

import {AgentExecutor, createToolCallingAgent} from "langchain/agents";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {DynamicStructuredTool} from "@langchain/core/tools";
import * as logger from "firebase-functions/logger";
import {getLLM, getAIProvider} from "./config";

/**
 * System prompt for the AI canvas agent
 */
const SYSTEM_PROMPT = `You are an AI assistant for a collaborative canvas application (like Figma).

Your job is to interpret natural language commands and TAKE ACTION immediately using the provided tools.

IMPORTANT: Be action-oriented! Use sensible defaults and execute commands right away. Only ask for clarification when the command is truly ambiguous.

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
- Position: Top-left (0, 0) if not specified
- Spacing for layouts: 20px

Coordinate System:
- Canvas size: 5000x5000 pixels
- Origin (0, 0) = top-left corner
- For circles: x,y is the CENTER point
- For rectangles/text: x,y is the TOP-LEFT corner
- Rotation: degrees (0-360)

Action-Oriented Examples:
✅ "Create a blue square" → Use createRectangle with 200x200, blue color, center position
✅ "Make a red circle" → Use createCircle with 50 radius, red color, center position
✅ "Move it to 100, 200" → Use moveObject with specified coordinates
✅ "Make it bigger" → Use resizeObject with scale: 2 (double size)
✅ "Arrange in a row" → Use arrangeInRow with default spacing

Only Ask for Clarification When Truly Ambiguous:
❌ "Create a shape" (no type) → Ask: "What type of shape?"
❌ "Move that" (no object selected, multiple objects exist) → Ask: "Which object?"
❌ "Change the color" (no color mentioned) → Ask: "What color?"

After executing tools, respond with a brief confirmation of what was created/changed.

Canvas state is provided with each command. Use it to understand current objects and positions.`;

/**
 * Create AI agent chain with tools
 *
 * @param tools - Array of LangChain tools for canvas operations
 * @returns Configured agent executor ready to process commands
 */
export async function createAIChain(
  tools: DynamicStructuredTool[]
): Promise<AgentExecutor> {
  try {
    const provider = getAIProvider();
    logger.info("Creating AI chain", {
      provider,
      toolCount: tools.length,
      toolNames: tools.map((t) => t.name),
    });

    const llm = getLLM(provider);

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);

    // Create tool-calling agent
    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    // Create executor
    const executor = new AgentExecutor({
      agent,
      tools,
      verbose: true, // Log tool calls in development
      maxIterations: 10, // Prevent infinite loops
      returnIntermediateSteps: true, // Return tool call history
    });

    logger.info("AI chain created successfully");
    return executor;
  } catch (error) {
    logger.error("Failed to create AI chain", {error});
    throw new Error(`Failed to create AI chain: ${error}`);
  }
}
