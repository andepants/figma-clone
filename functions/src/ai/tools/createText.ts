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
import {findEmptySpace} from "../utils/collision-detector.js";
import * as logger from 'firebase-functions/logger';

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
    .optional()
    .describe("X coordinate of top-left corner (defaults to viewport center)"),
  y: z.number()
    .min(0)
    .max(50000)
    .optional()
    .describe("Y coordinate of top-left corner (defaults to viewport center)"),
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
  avoidOverlap: z.boolean()
    .optional()
    .default(true)
    .describe("Automatically find empty space if position would overlap (default: true)"),
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

      // Determine position (default to viewport center)
      let x = input.x;
      let y = input.y;

      if (x === undefined || y === undefined) {
        // Use viewport center if available, else canvas center
        if (this.context.viewportBounds) {
          x = this.context.viewportBounds.centerX - estimatedWidth / 2; // Top-left corner
          y = this.context.viewportBounds.centerY - estimatedHeight / 2;
          logger.info('Using viewport center for text placement', {
            viewportCenter: {
              x: this.context.viewportBounds.centerX,
              y: this.context.viewportBounds.centerY
            },
            textTopLeft: { x, y },
            estimatedDimensions: { width: estimatedWidth, height: estimatedHeight }
          });
        } else {
          x = this.context.canvasSize.width / 2 - estimatedWidth / 2;
          y = this.context.canvasSize.height / 2 - estimatedHeight / 2;
          logger.info('Using canvas center for text placement (no viewport)', {
            canvasCenter: {
              x: this.context.canvasSize.width / 2,
              y: this.context.canvasSize.height / 2
            },
            textTopLeft: { x, y }
          });
        }
      }

      // Check for overlap and find empty space if needed
      if (input.avoidOverlap) {
        const emptyPos = findEmptySpace(
          x,
          y,
          estimatedWidth,
          estimatedHeight,
          this.context.currentObjects
        );

        if (emptyPos.x !== x || emptyPos.y !== y) {
          logger.info('Adjusted position to avoid overlap', {
            original: { x, y },
            adjusted: emptyPos,
          });
          x = emptyPos.x;
          y = emptyPos.y;
        }
      }

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {x, y},
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
        `at (${Math.round(x)}, ${Math.round(y)})` :
        `Created text ${textPreview} at (${Math.round(x)}, ${Math.round(y)})`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "text",
          x,
          y,
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
