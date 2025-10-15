/**
 * Update Appearance Tool
 *
 * AI tool for updating visual properties of canvas objects.
 * Supports changing colors (fill/stroke) and stroke width.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {updateCanvasObject, getCanvasObject} from "../../services/canvas-objects";

/**
 * Schema for update appearance parameters
 */
const UpdateAppearanceSchema = z.object({
  objectId: z.string()
    .describe("ID of the object to update"),
  fill: z.string()
    .optional()
    .describe("New fill color (hex like #ff0000 or color name)"),
  stroke: z.string()
    .optional()
    .describe("New stroke color (hex like #000000 or color name)"),
  strokeWidth: z.number()
    .min(0)
    .max(100)
    .optional()
    .describe("New stroke width in pixels (0-100)"),
  opacity: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe("New opacity (0-1, where 0 is transparent and 1 is opaque)"),
});

/**
 * Tool for updating object appearance
 */
export class UpdateAppearanceTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "updateAppearance",
      "Update visual properties of an existing object. " +
      "Can change fill color, stroke color, stroke width, and opacity. " +
      "Provide at least one property to update.",
      UpdateAppearanceSchema,
      context
    );
  }

  /**
   * Execute appearance update
   *
   * @param input - Validated appearance parameters
   * @returns Tool result with modified object ID
   */
  async execute(
    input: z.infer<typeof UpdateAppearanceSchema>
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
          message: "Failed to update appearance - object not found",
        };
      }

      // Validate at least one property provided
      if (
        input.fill === undefined &&
        input.stroke === undefined &&
        input.strokeWidth === undefined &&
        input.opacity === undefined
      ) {
        return {
          success: false,
          error: "Must provide at least one property to update (fill, stroke, strokeWidth, or opacity)",
          message: "Failed to update appearance - no properties specified",
        };
      }

      // Validate colors
      if (input.fill !== undefined && !this.isValidColor(input.fill)) {
        return {
          success: false,
          error: `Invalid fill color format: ${input.fill}. Use hex colors (#ff0000) or named colors.`,
          message: "Failed to update appearance - invalid fill color",
        };
      }

      if (input.stroke !== undefined && !this.isValidColor(input.stroke)) {
        return {
          success: false,
          error: `Invalid stroke color format: ${input.stroke}. Use hex colors (#000000) or named colors.`,
          message: "Failed to update appearance - invalid stroke color",
        };
      }

      // Build updates object
      const updates: Record<string, string | number> = {};
      const changes: string[] = [];

      if (input.fill !== undefined) {
        updates.fill = input.fill;
        changes.push(`fill to ${input.fill}`);
      }

      if (input.stroke !== undefined) {
        updates.stroke = input.stroke;
        changes.push(`stroke to ${input.stroke}`);
      }

      if (input.strokeWidth !== undefined) {
        updates.strokeWidth = input.strokeWidth;
        changes.push(`stroke width to ${input.strokeWidth}px`);
      }

      if (input.opacity !== undefined) {
        updates.opacity = input.opacity;
        changes.push(`opacity to ${input.opacity}`);
      }

      // Update object in RTDB
      await updateCanvasObject(
        this.context.canvasId,
        input.objectId,
        updates
      );

      const objectName = existingObject.name as string || input.objectId;
      const message = `Updated "${objectName}": ${changes.join(", ")}`;

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
        message: "Failed to update appearance",
      };
    }
  }
}
