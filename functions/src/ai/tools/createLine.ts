/**
 * Create Line Tool
 *
 * AI tool for creating line shapes on the canvas.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import {validateViewportBounds} from "../utils/viewport-validator.js";
import {adjustLineToViewport} from "../utils/viewport-adjuster.js";
import {getNextZIndex} from "../utils/zindex-calculator.js";
import * as logger from 'firebase-functions/logger';

/**
 * Schema for line creation parameters
 */
const CreateLineSchema = z.object({
  x1: z.number()
    .min(0)
    .max(50000)
    .describe("X coordinate of start point (0-50000)"),
  y1: z.number()
    .min(0)
    .max(50000)
    .describe("Y coordinate of start point (0-50000)"),
  x2: z.number()
    .min(0)
    .max(50000)
    .describe("X coordinate of end point (0-50000)"),
  y2: z.number()
    .min(0)
    .max(50000)
    .describe("Y coordinate of end point (0-50000)"),
  stroke: z.string()
    .default("#000000")
    .describe("Line color (hex like #000000 or color name, default black)"),
  strokeWidth: z.number()
    .min(1)
    .max(100)
    .default(2)
    .describe("Line width in pixels (1-100, default 2)"),
  name: z.string()
    .optional()
    .describe("Optional name for the line"),
});

/**
 * Tool for creating lines on the canvas
 */
export class CreateLineTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createLine",
      "Create a line from point (x1,y1) to (x2,y2). " +
      "Default stroke is black (#000000), default strokeWidth is 2.",
      CreateLineSchema,
      context
    );
  }

  /**
   * Execute line creation
   *
   * @param input - Validated line parameters
   * @returns Tool result with created object ID
   */
  async execute(
    input: z.infer<typeof CreateLineSchema>
  ): Promise<ToolResult> {
    try {
      // Validate color format
      if (!this.isValidColor(input.stroke)) {
        return {
          success: false,
          error: `Invalid color format: ${input.stroke}. ` +
                 `Use hex colors (#000000) or named colors.`,
          message: "Failed to create line",
        };
      }

      // Validate line is not a point (start and end are different)
      if (input.x1 === input.x2 && input.y1 === input.y2) {
        return {
          success: false,
          error: "Start and end points cannot be the same",
          message: "Failed to create line",
        };
      }

      // Validate viewport bounds
      const validatedBounds = validateViewportBounds(this.context.viewportBounds);

      // Adjust line endpoints to viewport if outside
      const viewportAdjustment = adjustLineToViewport(
        input.x1,
        input.y1,
        input.x2,
        input.y2,
        validatedBounds
      );

      if (viewportAdjustment.wasAdjusted) {
        logger.info('Adjusted line endpoints to viewport', {
          original: { x1: input.x1, y1: input.y1, x2: input.x2, y2: input.y2 },
          adjusted: {
            x1: viewportAdjustment.x1,
            y1: viewportAdjustment.y1,
            x2: viewportAdjustment.x2,
            y2: viewportAdjustment.y2,
          },
          reason: 'Line was outside viewport bounds'
        });
      }

      // Use adjusted endpoints
      const x1 = viewportAdjustment.x1;
      const y1 = viewportAdjustment.y1;
      const x2 = viewportAdjustment.x2;
      const y2 = viewportAdjustment.y2;

      // Calculate line position and points (relative to position)
      // Position is MIN of both endpoints
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);

      // Points are relative to position
      const relX1 = x1 - x;
      const relY1 = y1 - y;
      const relX2 = x2 - x;
      const relY2 = y2 - y;
      const points: [number, number, number, number] = [relX1, relY1, relX2, relY2];

      // Calculate rotation (angle in degrees)
      const dx = x2 - x1;
      const dy = y2 - y1;
      let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      // Normalize to -179 to 179 (never exactly 180)
      if (rotation === 180) rotation = -180;

      // Calculate z-index (new objects always on top)
      const zIndex = getNextZIndex(this.context.currentObjects);

      logger.info('Assigning z-index to new line', {
        zIndex,
        existingObjectsCount: this.context.currentObjects.length,
      });

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "line",
        position: {x, y},
        points,
        rotation,
        appearance: {
          stroke: input.stroke,
          strokeWidth: input.strokeWidth,
        },
        name: input.name,
        userId: this.context.userId,
        zIndex, // Assign z-index
      });

      const message = input.name ?
        `Created line "${input.name}" from (${input.x1}, ${input.y1}) ` +
        `to (${input.x2}, ${input.y2})` :
        `Created line from (${input.x1}, ${input.y1}) ` +
        `to (${input.x2}, ${input.y2})`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "line",
          x,
          y,
          points,
          rotation,
          stroke: input.stroke,
          strokeWidth: input.strokeWidth,
          name: input.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create line",
      };
    }
  }
}
