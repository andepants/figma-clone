/**
 * Arrange in Column Tool
 *
 * AI tool for arranging objects vertically in a column.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {getDatabase} from "../../services/firebase-admin";
import {CanvasObject} from "../../types";

/**
 * Schema for column arrangement parameters
 */
const ArrangeInColumnSchema = z.object({
  objectIds: z.array(z.string())
    .min(2)
    .describe("Array of object IDs to arrange (at least 2)"),
  spacing: z.number()
    .default(20)
    .describe("Gap between objects in pixels (default: 20)"),
  x: z.number()
    .optional()
    .describe("X position for all objects (default: average X of all objects)"),
  startY: z.number()
    .optional()
    .describe("Starting Y position (default: current topmost object)"),
});

/**
 * Tool for arranging objects in a vertical column
 *
 * Arranges objects vertically with even spacing.
 * Maintains horizontal alignment (all objects at same X).
 */
export class ArrangeInColumnTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "arrangeInColumn",
      "Arrange objects in a vertical column with even spacing. " +
      "All objects will be aligned at the same X position. " +
      "Useful for commands like 'stack them vertically' or 'arrange in a column'.",
      ArrangeInColumnSchema,
      context
    );
  }

  /**
   * Execute column arrangement
   *
   * @param input - Arrangement parameters
   * @returns Tool result with modified object IDs
   */
  async execute(
    input: z.infer<typeof ArrangeInColumnSchema>
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

      // Calculate X position (average of all objects)
      const x = input.x ??
                objects.reduce((sum, obj) => sum + obj.x, 0) / objects.length;

      // Calculate starting Y position (topmost object)
      const startY = input.startY ??
                     Math.min(...objects.map(obj => obj.y));

      // Prepare batch update
      const updates: Record<string, number> = {};
      let currentY = startY;

      // Sort objects by original Y position to maintain order
      const sortedObjects = [...objects].sort((a, b) => a.y - b.y);

      for (const obj of sortedObjects) {
        // Calculate object height
        const objectHeight = this.getObjectHeight(obj);

        // Update object position
        updates[`canvases/${this.context.canvasId}/objects/${obj.id}/x`] = x;
        updates[`canvases/${this.context.canvasId}/objects/${obj.id}/y`] =
          currentY;

        // Move to next position
        currentY += objectHeight + input.spacing;
      }

      // Apply all updates in one atomic operation
      await getDatabase().ref().update(updates);

      return {
        success: true,
        message: `Arranged ${objects.length} objects in a column ` +
                 `with ${input.spacing}px spacing`,
        objectsModified: input.objectIds,
        data: {
          count: objects.length,
          spacing: input.spacing,
          x,
          startY,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to arrange objects in column",
      };
    }
  }

  /**
   * Get effective height of an object
   *
   * @param obj - Canvas object
   * @returns Height in pixels
   */
  private getObjectHeight(obj: CanvasObject): number {
    if (obj.height !== undefined) {
      return obj.height;
    } else if (obj.radius !== undefined) {
      return obj.radius * 2;
    }
    // Default height for objects without explicit dimensions
    return 100;
  }
}
