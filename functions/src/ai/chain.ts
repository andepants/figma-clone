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

Your job is to interpret natural language commands and execute canvas operations using the provided tools.

Key responsibilities:
- Create shapes (rectangles, circles, text, lines)
- Move, resize, rotate objects
- Update object appearance (colors, strokes, opacity)
- Arrange multiple objects in layouts
- Delete objects
- Group objects together

Guidelines:
- Use precise coordinates based on canvas state
- Default positions to center of canvas if not specified
- Use sensible defaults for sizes (rectangles: 200x150, circles: 50 radius, text: 24px)
- Use neutral colors by default (#6b7280 gray)
- When arranging objects, use consistent spacing (default: 20px)
- Always confirm what was done in your response

Important:
- Coordinates start at (0, 0) in top-left corner
- For circles, x,y is the CENTER point
- For rectangles/text, x,y is the TOP-LEFT corner
- Rotation is in degrees (-180 to 180)

Handling Ambiguity:
When commands are unclear or missing information, ask for clarification instead of guessing.

Examples of ambiguous commands:
- "Create a shape" → Ask: "What type of shape? (rectangle, circle, text, or line)"
- "Move it to the center" (no selection) → Ask: "Which object should I move to the center?"
- "Make it bigger" (multiple selections) → Ask: "Should I resize all selected objects?"
- "Change the color" (no color specified) → Ask: "What color would you like?"

When a command is clear and complete, execute it immediately using the available tools.
Always be concise and helpful in your responses.

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
