/**
 * Create Text Tool
 *
 * AI tool for creating text objects on the canvas.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";

/**
 * Schema for text creation parameters
 */
const CreateTextSchema = z.object({
  text: z.string()
    .min(1)
    .max(50000)
    .describe("Text content (1-50000 characters)"),
  x: z.number()
    .min(0)
    .max(50000)
    .describe("X coordinate of top-left corner (0-50000)"),
  y: z.number()
    .min(0)
    .max(50000)
    .describe("Y coordinate of top-left corner (0-50000)"),
  fontSize: z.number()
    .min(1)
    .max(500)
    .default(24)
    .describe("Font size in pixels (1-500, default 24)"),
  fill: z.string()
    .default("#000000")
    .describe("Text color (hex like #000000 or color name, default black)"),
  name: z.string()
    .optional()
    .describe("Optional name for the text object"),
});

/**
 * Tool for creating text objects on the canvas
 */
export class CreateTextTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createText",
      "Create text on the canvas. x,y is the top-left corner. " +
      "Default fontSize is 24, default color is black (#000000).",
      CreateTextSchema,
      context
    );
  }

  /**
   * Execute text creation
   *
   * @param input - Validated text parameters
   * @returns Tool result with created object ID
   */
  async execute(
    input: z.infer<typeof CreateTextSchema>
  ): Promise<ToolResult> {
    try {
      // Validate color format
      if (!this.isValidColor(input.fill)) {
        return {
          success: false,
          error: `Invalid color format: ${input.fill}. ` +
                 `Use hex colors (#000000) or named colors.`,
          message: "Failed to create text",
        };
      }

      // Validate text is not empty after trim
      if (input.text.trim().length === 0) {
        return {
          success: false,
          error: "Text content cannot be empty",
          message: "Failed to create text",
        };
      }

      // Calculate text dimensions (rough estimate)
      // For Inter font: ~0.6 * fontSize per character width
      const charWidth = input.fontSize * 0.6;
      const estimatedWidth = Math.max(200, input.text.length * charWidth);
      const estimatedHeight = input.fontSize * 1.5; // Line height

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {x: input.x, y: input.y},
        dimensions: {
          width: estimatedWidth,
          height: estimatedHeight,
        },
        text: input.text,
        fontSize: input.fontSize,
        fontFamily: "Inter",
        appearance: {fill: input.fill},
        name: input.name,
        userId: this.context.userId,
      });

      const textPreview = input.text.length > 30 ?
        `"${input.text.substring(0, 30)}..."` :
        `"${input.text}"`;

      const message = input.name ?
        `Created text "${input.name}" with content ${textPreview} ` +
        `at (${input.x}, ${input.y})` :
        `Created text ${textPreview} at (${input.x}, ${input.y})`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "text",
          x: input.x,
          y: input.y,
          text: input.text,
          fontSize: input.fontSize,
          fill: input.fill,
          name: input.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create text",
      };
    }
  }
}
