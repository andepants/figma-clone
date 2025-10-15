/**
 * Rotate Object Tool
 *
 * AI tool for rotating canvas objects.
 * Supports both absolute and relative rotation.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {updateCanvasObject, getCanvasObject} from "../../services/canvas-objects";

/**
 * Schema for rotate object parameters
 */
const RotateObjectSchema = z.object({
  objectId: z.string()
    .describe("ID of the object to rotate"),
  rotation: z.number()
    .describe("Rotation in degrees (0-360 for absolute, any value for relative)"),
  relative: z.boolean()
    .default(false)
    .describe("If true, add to current rotation. If false (default), set absolute rotation."),
});

/**
 * Tool for rotating objects on the canvas
 */
export class RotateObjectTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "rotateObject",
      "Rotate an existing object. By default, sets absolute rotation " +
      "(0-360 degrees). Set 'relative: true' to add to current rotation " +
      "(e.g., rotate 45 more degrees).",
      RotateObjectSchema,
      context
    );
  }

  /**
   * Normalize rotation to 0-360 range
   */
  private normalizeRotation(degrees: number): number {
    let normalized = degrees % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    return normalized;
  }

  /**
   * Execute object rotation
   *
   * @param input - Validated rotation parameters
   * @returns Tool result with modified object ID
   */
  async execute(
    input: z.infer<typeof RotateObjectSchema>
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
          message: "Failed to rotate object - object not found",
        };
      }

      // Calculate new rotation
      let newRotation: number;
      const currentRotation = (existingObject.rotation as number) || 0;

      if (input.relative) {
        // Add to current rotation
        newRotation = this.normalizeRotation(currentRotation + input.rotation);
      } else {
        // Set absolute rotation
        newRotation = this.normalizeRotation(input.rotation);
      }

      // Update object rotation in RTDB
      await updateCanvasObject(
        this.context.canvasId,
        input.objectId,
        {
          rotation: newRotation,
        }
      );

      const objectName = existingObject.name as string || input.objectId;
      const message = input.relative ?
        `Rotated "${objectName}" by ${input.rotation}° (now at ${newRotation}°)` :
        `Set rotation of "${objectName}" to ${newRotation}°`;

      return {
        success: true,
        message,
        objectsModified: [input.objectId],
        data: {
          objectId: input.objectId,
          oldRotation: currentRotation,
          newRotation,
          relative: input.relative,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to rotate object",
      };
    }
  }
}
