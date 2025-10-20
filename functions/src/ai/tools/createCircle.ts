/**
 * Create Circle Tool
 *
 * AI tool for creating circle shapes on the canvas.
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
 * Schema for circle creation parameters
 */
const CreateCircleSchema = z.object({
  x: z.number()
    .min(0)
    .max(50000)
    .optional()
    .describe("X coordinate of center point (defaults to viewport center)"),
  y: z.number()
    .min(0)
    .max(50000)
    .optional()
    .describe("Y coordinate of center point (defaults to viewport center)"),
  radius: z.number()
    .min(1)
    .max(25000)
    .default(50)
    .describe("Radius in pixels (default: 50)"),
  fill: z.string()
    .default("#6b7280")
    .describe("Fill color (hex like #ff0000 or color name)"),
  name: z.string()
    .optional()
    .describe("Optional name for the circle"),
  avoidOverlap: z.boolean()
    .optional()
    .default(true)
    .describe("Automatically find empty space if position would overlap (default: true)"),
});

/**
 * Tool for creating circles on the canvas
 */
export class CreateCircleTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createCircle",
      "Create a circle shape on the canvas. x,y is the CENTER point " +
      "(not top-left). Default fill is gray (#6b7280).",
      CreateCircleSchema,
      context
    );
  }

  /**
   * Execute circle creation
   *
   * @param input - Validated circle parameters
   * @returns Tool result with created object ID
   */
  async execute(
    input: z.infer<typeof CreateCircleSchema>
  ): Promise<ToolResult> {
    try {
      // Validate color format
      if (!this.isValidColor(input.fill)) {
        return {
          success: false,
          error: `Invalid color format: ${input.fill}. ` +
                 `Use hex colors (#ff0000) or named colors.`,
          message: "Failed to create circle",
        };
      }

      // Validate viewport bounds
      const validatedBounds = validateViewportBounds(this.context.viewportBounds);

      // Determine initial position (default to viewport center)
      // For circles, x,y is the CENTER point (not top-left)
      let x = input.x ?? validatedBounds.centerX;
      let y = input.y ?? validatedBounds.centerY;

      // ALWAYS adjust to viewport (even if coordinates explicitly provided)
      const diameter = input.radius * 2;
      const viewportAdjustment = adjustToViewport(
        x,
        y,
        diameter,
        diameter,
        validatedBounds,
        'circle'
      );

      if (viewportAdjustment.wasAdjusted) {
        logger.info('Adjusted circle position to viewport', {
          original: { x, y },
          adjusted: { x: viewportAdjustment.x, y: viewportAdjustment.y },
          reason: 'Object was outside viewport bounds'
        });
      }

      x = viewportAdjustment.x;
      y = viewportAdjustment.y;

      // Check for overlap and find empty space if needed
      if (input.avoidOverlap) {
        // For collision detection, calculate bounding box (top-left corner)
        const boundingBoxX = x - input.radius;
        const boundingBoxY = y - input.radius;
        const diameter = input.radius * 2;

        const emptyPos = findEmptySpace(
          boundingBoxX,
          boundingBoxY,
          diameter,
          diameter,
          this.context.currentObjects
        );

        // Convert back to center point
        const newCenterX = emptyPos.x + input.radius;
        const newCenterY = emptyPos.y + input.radius;

        if (newCenterX !== x || newCenterY !== y) {
          logger.info('Adjusted position to avoid overlap', {
            original: { x, y },
            adjusted: { x: newCenterX, y: newCenterY },
          });
          x = newCenterX;
          y = newCenterY;
        }
      }

      // Calculate z-index (new objects always on top)
      const zIndex = getNextZIndex(this.context.currentObjects);

      logger.info('Assigning z-index to new circle', {
        zIndex,
        existingObjectsCount: this.context.currentObjects.length,
      });

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x, y},
        radius: input.radius,
        appearance: {fill: input.fill},
        name: input.name,
        userId: this.context.userId,
        zIndex, // Assign z-index
      });

      const message = input.name ?
        `Created circle "${input.name}" at center (${Math.round(x)}, ${Math.round(y)}) ` +
        `with radius ${input.radius}` :
        `Created circle at center (${Math.round(x)}, ${Math.round(y)}) ` +
        `with radius ${input.radius}`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "circle",
          x,
          y,
          radius: input.radius,
          fill: input.fill,
          name: input.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create circle",
      };
    }
  }
}
