/**
 * Move Object Tool
 *
 * AI tool for moving canvas objects to new positions.
 * Updates the x,y coordinates of an existing object.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {updateCanvasObject, getCanvasObject} from "../../services/canvas-objects";

/**
 * Schema for move object parameters
 */
const MoveObjectSchema = z.object({
  objectId: z.string()
    .describe("ID of the object to move"),
  x: z.number()
    .min(0)
    .max(50000)
    .describe("New X position (0-50000)"),
  y: z.number()
    .min(0)
    .max(50000)
    .describe("New Y position (0-50000)"),
});

/**
 * Tool for moving objects on the canvas
 */
export class MoveObjectTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "moveObject",
      "Move an existing object to a new position (x, y). " +
      "Requires the object ID of the object to move.",
      MoveObjectSchema,
      context
    );
  }

  /**
   * Execute object move
   *
   * @param input - Validated move parameters
   * @returns Tool result with modified object ID
   */
  async execute(
    input: z.infer<typeof MoveObjectSchema>
  ): Promise<ToolResult> {
    try {
      // Check if object exists
      const existingObject = await getCanvasObject(
        this.context.canvasId,
        input.objectId
      );

      if (!existingObject) {
        return {
          success: false,
          error: `Object ${input.objectId} not found in canvas`,
          message: "Failed to move object - object not found",
        };
      }

      // Update object position in RTDB
      await updateCanvasObject(
        this.context.canvasId,
        input.objectId,
        {
          x: input.x,
          y: input.y,
        }
      );

      const objectName = existingObject.name as string || input.objectId;
      const message = `Moved "${objectName}" to position (${input.x}, ${input.y})`;

      return {
        success: true,
        message,
        objectsModified: [input.objectId],
        data: {
          objectId: input.objectId,
          newPosition: {x: input.x, y: input.y},
          oldPosition: {
            x: existingObject.x as number,
            y: existingObject.y as number,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to move object",
      };
    }
  }
}
