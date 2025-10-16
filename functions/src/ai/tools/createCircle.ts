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

/**
 * Schema for circle creation parameters
 */
const CreateCircleSchema = z.object({
  x: z.number()
    .min(0)
    .max(50000)
    .describe("X coordinate of center point (0-50000)"),
  y: z.number()
    .min(0)
    .max(50000)
    .describe("Y coordinate of center point (0-50000)"),
  radius: z.number()
    .min(1)
    .max(25000)
    .describe("Radius in pixels (1-25000)"),
  fill: z.string()
    .default("#6b7280")
    .describe("Fill color (hex like #ff0000 or color name)"),
  name: z.string()
    .optional()
    .describe("Optional name for the circle"),
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

      // Create object in Firebase RTDB
      const objectId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: input.x, y: input.y},
        radius: input.radius,
        appearance: {fill: input.fill},
        name: input.name,
        userId: this.context.userId,
      });

      const message = input.name ?
        `Created circle "${input.name}" at center (${input.x}, ${input.y}) ` +
        `with radius ${input.radius}` :
        `Created circle at center (${input.x}, ${input.y}) ` +
        `with radius ${input.radius}`;

      return {
        success: true,
        message,
        objectsCreated: [objectId],
        data: {
          id: objectId,
          type: "circle",
          x: input.x,
          y: input.y,
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
