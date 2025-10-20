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

      // Determine position (default to viewport center)
      let x = input.x;
      let y = input.y;

      if (x === undefined || y === undefined) {
        // Use viewport center if available, else canvas center
        if (this.context.viewportBounds) {
          x = this.context.viewportBounds.centerX - input.width / 2; // Top-left corner
          y = this.context.viewportBounds.centerY - input.height / 2;
          logger.info('Using viewport center for rectangle placement', {
            viewportCenter: {
              x: this.context.viewportBounds.centerX,
              y: this.context.viewportBounds.centerY
            },
            rectangleTopLeft: { x, y }
          });
        } else {
          x = this.context.canvasSize.width / 2 - input.width / 2;
          y = this.context.canvasSize.height / 2 - input.height / 2;
          logger.info('Using canvas center for rectangle placement (no viewport)', {
            canvasCenter: {
              x: this.context.canvasSize.width / 2,
              y: this.context.canvasSize.height / 2
            },
            rectangleTopLeft: { x, y }
          });
        }
      }

      // Check for overlap and find empty space if needed
      if (input.avoidOverlap) {
        const emptyPos = findEmptySpace(
          x,
          y,
          input.width,
          input.height,
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
        type: "rectangle",
        position: {x, y},
        dimensions: {width: input.width, height: input.height},
        appearance: {fill: input.fill},
        name: input.name,
        userId: this.context.userId,
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
