/**
 * Resize Object Tool
 *
 * AI tool for resizing canvas objects.
 * Supports absolute dimensions and relative scaling.
 * Works with rectangles (width/height) and circles (radius).
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {updateCanvasObject, getCanvasObject} from "../../services/canvas-objects";

/**
 * Schema for resize object parameters
 */
const ResizeObjectSchema = z.object({
  objectId: z.string()
    .describe("ID of the object to resize"),
  width: z.number()
    .min(1)
    .max(50000)
    .optional()
    .describe("New width in pixels (for rectangles/text)"),
  height: z.number()
    .min(1)
    .max(50000)
    .optional()
    .describe("New height in pixels (for rectangles/text)"),
  radius: z.number()
    .min(1)
    .max(25000)
    .optional()
    .describe("New radius in pixels (for circles)"),
  scale: z.number()
    .min(0.1)
    .max(10)
    .optional()
    .describe("Scale factor to multiply current dimensions (e.g., 2 = double size, 0.5 = half size)"),
});

/**
 * Tool for resizing objects on the canvas
 */
export class ResizeObjectTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "resizeObject",
      "Resize an existing object. For rectangles/text, use width/height. " +
      "For circles, use radius. Or use 'scale' to multiply current dimensions " +
      "(e.g., scale: 2 makes it twice as big).",
      ResizeObjectSchema,
      context
    );
  }

  /**
   * Execute object resize
   *
   * @param input - Validated resize parameters
   * @returns Tool result with modified object ID
   */
  async execute(
    input: z.infer<typeof ResizeObjectSchema>
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
          message: "Failed to resize object - object not found",
        };
      }

      const objectType = existingObject.type as string;
      const updates: Record<string, number> = {};
      let message = "";

      // Handle different object types
      if (objectType === "rectangle" || objectType === "text") {
        // Rectangles and text have width/height
        if (input.scale !== undefined) {
          // Relative scaling
          const currentWidth = existingObject.width as number;
          const currentHeight = existingObject.height as number;
          updates.width = Math.round(currentWidth * input.scale);
          updates.height = Math.round(currentHeight * input.scale);
          message = `Scaled "${existingObject.name}" by ${input.scale}x ` +
                   `(new size: ${updates.width}x${updates.height})`;
        } else if (input.width !== undefined || input.height !== undefined) {
          // Absolute sizing
          if (input.width !== undefined) {
            updates.width = input.width;
          }
          if (input.height !== undefined) {
            updates.height = input.height;
          }
          const finalWidth = updates.width || existingObject.width;
          const finalHeight = updates.height || existingObject.height;
          message = `Resized "${existingObject.name}" to ${finalWidth}x${finalHeight}`;
        } else {
          return {
            success: false,
            error: "For rectangles/text, provide width/height or scale",
            message: "Failed to resize object - missing parameters",
          };
        }
      } else if (objectType === "circle") {
        // Circles have radius
        if (input.scale !== undefined) {
          // Relative scaling
          const currentRadius = existingObject.radius as number;
          updates.radius = Math.round(currentRadius * input.scale);
          message = `Scaled circle "${existingObject.name}" by ${input.scale}x ` +
                   `(new radius: ${updates.radius})`;
        } else if (input.radius !== undefined) {
          // Absolute sizing
          updates.radius = input.radius;
          message = `Resized circle "${existingObject.name}" to radius ${input.radius}`;
        } else {
          return {
            success: false,
            error: "For circles, provide radius or scale",
            message: "Failed to resize object - missing parameters",
          };
        }
      } else if (objectType === "line") {
        return {
          success: false,
          error: "Cannot resize lines - use moveObject to adjust endpoints",
          message: "Failed to resize object - lines cannot be resized",
        };
      } else {
        return {
          success: false,
          error: `Unsupported object type: ${objectType}`,
          message: "Failed to resize object - unsupported type",
        };
      }

      // Apply updates to RTDB
      await updateCanvasObject(
        this.context.canvasId,
        input.objectId,
        updates
      );

      return {
        success: true,
        message,
        objectsModified: [input.objectId],
        data: {
          objectId: input.objectId,
          updates,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to resize object",
      };
    }
  }
}
