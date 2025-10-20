/**
 * Create Rectangle Tool
 *
 * AI tool for creating rectangle shapes on the canvas.
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
 * Schema for rectangle creation parameters
 */
const CreateRectangleSchema = z.object({
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
  width: z.number()
    .min(1)
    .max(50000)
    .default(200)
    .describe("Width in pixels (default: 200)"),
  height: z.number()
    .min(1)
    .max(50000)
    .default(200)
    .describe("Height in pixels (default: 200)"),
  fill: z.string()
    .default("#6b7280")
    .describe("Fill color (hex like #ff0000 or color name)"),
  name: z.string()
    .optional()
    .describe("Optional name for the rectangle"),
  avoidOverlap: z.boolean()
    .optional()
    .default(true)
    .describe("Automatically find empty space if position would overlap (default: true)"),
});

/**
 * Tool for creating rectangles on the canvas
 */
export class CreateRectangleTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createRectangle",
      "Create a rectangle shape on the canvas at specified position and size. " +
      "x,y is the top-left corner. Default fill is gray (#6b7280).",
      CreateRectangleSchema,
      context
    );
  }

  /**
   * Execute rectangle creation
   *
   * @param input - Validated rectangle parameters
   * @returns Tool result with created object ID
   */
  async execute(
    input: z.infer<typeof CreateRectangleSchema>
  ): Promise<ToolResult> {
    try {
      // Validate color format
      if (!this.isValidColor(input.fill)) {
        return {
          success: false,
          error: `Invalid color format: ${input.fill}. ` +
                 `Use hex colors (#ff0000) or named colors.`,
          message: "Failed to create rectangle",
        };
      }

      // Validate viewport bounds
      const validatedBounds = validateViewportBounds(this.context.viewportBounds);

      // Determine initial position (default to viewport center)
      let x = input.x ?? (validatedBounds.centerX - input.width / 2);
      let y = input.y ?? (validatedBounds.centerY - input.height / 2);

      // ALWAYS adjust to viewport (even if coordinates explicitly provided)
      const viewportAdjustment = adjustToViewport(
        x,
        y,
        input.width,
        input.height,
        validatedBounds,
        'rectangle'
      );

      if (viewportAdjustment.wasAdjusted) {
        logger.info('Adjusted rectangle position to viewport', {
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
          input.width,
          input.height,
          this.context.currentObjects,
          500, // maxRadius
          'single' // Layout context: single rectangles always avoid overlaps
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

      logger.info('Assigning z-index to new rectangle', {
        zIndex,
        existingObjectsCount: this.context.currentObjects.length,
      });

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x, y},
        dimensions: {width: input.width, height: input.height},
        appearance: {fill: input.fill},
        name: input.name,
        userId: this.context.userId,
        zIndex, // Assign z-index
      });

      const message = input.name ?
        `Created rectangle "${input.name}" at (${Math.round(x)}, ${Math.round(y)}) ` +
        `with size ${input.width}x${input.height}` :
        `Created rectangle at (${Math.round(x)}, ${Math.round(y)}) ` +
        `with size ${input.width}x${input.height}`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "rectangle",
          x,
          y,
          width: input.width,
          height: input.height,
          fill: input.fill,
          name: input.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create rectangle",
      };
    }
  }
}
