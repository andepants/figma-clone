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

/**
 * Schema for rectangle creation parameters
 */
const CreateRectangleSchema = z.object({
  x: z.number()
    .min(0)
    .max(50000)
    .describe("X coordinate of top-left corner (0-50000)"),
  y: z.number()
    .min(0)
    .max(50000)
    .describe("Y coordinate of top-left corner (0-50000)"),
  width: z.number()
    .min(1)
    .max(50000)
    .describe("Width in pixels (1-50000)"),
  height: z.number()
    .min(1)
    .max(50000)
    .describe("Height in pixels (1-50000)"),
  fill: z.string()
    .default("#6b7280")
    .describe("Fill color (hex like #ff0000 or color name)"),
  name: z.string()
    .optional()
    .describe("Optional name for the rectangle"),
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

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: input.x, y: input.y},
        dimensions: {width: input.width, height: input.height},
        appearance: {fill: input.fill},
        name: input.name,
        userId: this.context.userId,
      });

      const message = input.name ?
        `Created rectangle "${input.name}" at (${input.x}, ${input.y}) ` +
        `with size ${input.width}x${input.height}` :
        `Created rectangle at (${input.x}, ${input.y}) ` +
        `with size ${input.width}x${input.height}`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "rectangle",
          x: input.x,
          y: input.y,
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
