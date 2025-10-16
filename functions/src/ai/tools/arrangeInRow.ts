/**
 * Arrange in Row Tool
 *
 * AI tool for arranging objects horizontally in a row.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {getDatabase} from "../../services/firebase-admin";

/**
 * Schema for row arrangement parameters
 */
const ArrangeInRowSchema = z.object({
  objectIds: z.array(z.string())
    .min(2)
    .describe("Array of object IDs to arrange (at least 2)"),
  spacing: z.number()
    .default(20)
    .describe("Gap between objects in pixels (default: 20)"),
  startX: z.number()
    .optional()
    .describe("Starting X position (default: current leftmost object)"),
  y: z.number()
    .optional()
    .describe("Y position for all objects (default: average Y of all objects)"),
});

/**
 * Tool for arranging objects in a horizontal row
 *
 * Arranges objects horizontally with even spacing.
 * Maintains vertical alignment (all objects at same Y).
 */
export class ArrangeInRowTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "arrangeInRow",
      "Arrange objects in a horizontal row with even spacing. " +
      "All objects will be aligned at the same Y position. " +
      "Useful for commands like 'arrange them in a row' or 'line them up horizontally'.",
      ArrangeInRowSchema,
      context
    );
  }

  /**
   * Execute row arrangement
   *
   * @param input - Arrangement parameters
   * @returns Tool result with modified object IDs
   */
  async execute(
    input: z.infer<typeof ArrangeInRowSchema>
  ): Promise<ToolResult> {
    try {
      // Find objects to arrange
      const objects = this.context.currentObjects.filter(obj =>
        input.objectIds.includes(obj.id)
      );

      // Validate we have enough objects
      if (objects.length < 2) {
        return {
          success: false,
          error: `Need at least 2 objects to arrange, found ${objects.length}`,
          message: "Arrangement failed: not enough objects",
        };
      }

      // Validate all objects exist
      if (objects.length !== input.objectIds.length) {
        const foundIds = new Set(objects.map(obj => obj.id));
        const missingIds = input.objectIds.filter(id => !foundIds.has(id));
        return {
          success: false,
          error: `Objects not found: ${missingIds.join(", ")}`,
          message: "Arrangement failed: some objects don't exist",
        };
      }

      // Calculate starting X position (leftmost object)
      const startX = input.startX ??
                     Math.min(...objects.map(obj => obj.x));

      // Calculate Y position (average of all objects)
      const y = input.y ??
                objects.reduce((sum, obj) => sum + obj.y, 0) / objects.length;

      // Prepare batch update
      const updates: Record<string, any> = {};
      let currentX = startX;

      // Sort objects by original X position to maintain order
      const sortedObjects = [...objects].sort((a, b) => a.x - b.x);

      for (const obj of sortedObjects) {
        // Calculate object width
        const objectWidth = this.getObjectWidth(obj);

        // Update object position
        updates[`canvases/${this.context.canvasId}/objects/${obj.id}/x`] =
          currentX;
        updates[`canvases/${this.context.canvasId}/objects/${obj.id}/y`] = y;

        // Move to next position
        currentX += objectWidth + input.spacing;
      }

      // Apply all updates in one atomic operation
      await getDatabase().ref().update(updates);

      return {
        success: true,
        message: `Arranged ${objects.length} objects in a row ` +
                 `with ${input.spacing}px spacing`,
        objectsModified: input.objectIds,
        data: {
          count: objects.length,
          spacing: input.spacing,
          startX,
          y,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to arrange objects in row",
      };
    }
  }

  /**
   * Get effective width of an object
   *
   * @param obj - Canvas object
   * @returns Width in pixels
   */
  private getObjectWidth(obj: any): number {
    if (obj.width !== undefined) {
      return obj.width;
    } else if (obj.radius !== undefined) {
      return obj.radius * 2;
    }
    // Default width for objects without explicit dimensions
    return 100;
  }
}
