/**
 * Base class for canvas manipulation tools
 *
 * Provides common structure and context for all AI tools.
 */

import {DynamicStructuredTool} from "@langchain/core/tools";
import {z} from "zod";
import * as logger from "firebase-functions/logger";
import {CanvasToolContext, ToolResult} from "./types";

/**
 * Abstract base class for canvas tools
 *
 * All canvas manipulation tools should extend this class.
 * Provides context access and standardized result format.
 */
export abstract class CanvasTool {
  protected context: CanvasToolContext;
  protected tool: DynamicStructuredTool;

  /**
   * Create a new canvas tool
   *
   * @param name - Tool name (used by LLM to select tool)
   * @param description - Tool description (helps LLM understand when to use it)
   * @param schema - Zod schema for tool parameters
   * @param context - Canvas context (canvasId, userId, current objects)
   */
  constructor(
    name: string,
    description: string,
    schema: z.ZodObject<any>,
    context: CanvasToolContext
  ) {
    this.context = context;

    // Wrap execute method to add logging, error handling, and memory tracking
    this.tool = new DynamicStructuredTool({
      name,
      description,
      schema,
      func: async (input: any) => {
        try {
          logger.info(`Executing tool: ${name}`, {input});
          const result = await this.execute(input);

          // Update context with last created objects for conversation memory
          if (result.objectsCreated && result.objectsCreated.length > 0) {
            this.context.lastCreatedObjectIds = result.objectsCreated;
            logger.info(`Updated last created objects`, {
              objectIds: result.objectsCreated,
            });
          }

          logger.info(`Tool ${name} completed`, {
            success: result.success,
            message: result.message,
          });
          return JSON.stringify(result);
        } catch (error) {
          logger.error(`Tool ${name} failed`, {error, input});
          const errorResult: ToolResult = {
            success: false,
            message: `Tool execution failed: ${error}`,
            error: String(error),
          };
          return JSON.stringify(errorResult);
        }
      },
    });
  }

  /**
   * Execute the tool operation
   *
   * Must be implemented by subclasses.
   *
   * @param input - Validated input parameters (matches schema)
   * @returns Tool result with success status and details
   */
  abstract execute(input: any): Promise<ToolResult>;

  /**
   * Get the LangChain tool instance
   *
   * @returns Configured DynamicStructuredTool
   */
  getTool(): DynamicStructuredTool {
    return this.tool;
  }

  /**
   * Helper: Generate unique object ID
   *
   * @returns Unique ID string
   */
  protected generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Find object by ID in current canvas state
   *
   * @param objectId - Object ID to find
   * @returns Object if found, undefined otherwise
   */
  protected findObject(objectId: string) {
    return this.context.currentObjects.find((obj) => obj.id === objectId);
  }

  /**
   * Helper: Validate color string
   *
   * @param color - Color string to validate
   * @returns True if valid, false otherwise
   */
  protected isValidColor(color: string): boolean {
    // Simple validation: hex colors or named colors
    return /^#[0-9A-Fa-f]{6}$/.test(color) ||
           /^#[0-9A-Fa-f]{3}$/.test(color) ||
           ["transparent", "black", "white", "red", "green", "blue",
            "yellow", "purple", "orange", "gray", "grey"].includes(
             color.toLowerCase()
           );
  }
}
