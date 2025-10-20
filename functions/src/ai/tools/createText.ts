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
import {validateViewportBounds} from "../utils/viewport-validator.js";
import {adjustToViewport} from "../utils/viewport-adjuster.js";
import {getNextZIndex} from "../utils/zindex-calculator.js";
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

      // Validate viewport bounds
      const validatedBounds = validateViewportBounds(this.context.viewportBounds);

      // Determine initial position (default to viewport center)
      let x = input.x ?? (validatedBounds.centerX - estimatedWidth / 2);
      let y = input.y ?? (validatedBounds.centerY - estimatedHeight / 2);

      // ALWAYS adjust to viewport (even if coordinates explicitly provided)
      const viewportAdjustment = adjustToViewport(
        x,
        y,
        estimatedWidth,
        estimatedHeight,
        validatedBounds,
        'text'
      );

      if (viewportAdjustment.wasAdjusted) {
        logger.info('Adjusted text position to viewport', {
          original: { x, y },
          adjusted: { x: viewportAdjustment.x, y: viewportAdjustment.y },
          reason: 'Object was outside viewport bounds'
        });
      }

      x = viewportAdjustment.x;
      y = viewportAdjustment.y;

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

      // Calculate z-index (new objects always on top)
      const zIndex = getNextZIndex(this.context.currentObjects);

      logger.info('Assigning z-index to new text', {
        zIndex,
        existingObjectsCount: this.context.currentObjects.length,
      });

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
        zIndex, // Assign z-index
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
