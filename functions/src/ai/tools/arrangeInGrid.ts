/**
 * Arrange in Grid Tool
 *
 * AI tool for arranging objects in a grid layout.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {db} from "../../services/firebase-admin";

/**
 * Schema for grid arrangement parameters
 */
const ArrangeInGridSchema = z.object({
  objectIds: z.array(z.string())
    .min(4)
    .describe("Array of object IDs to arrange (at least 4)"),
  columns: z.number()
    .min(2)
    .describe("Number of columns in the grid (at least 2)"),
  spacing: z.number()
    .default(20)
    .describe("Gap between objects in pixels (default: 20)"),
  startX: z.number()
    .optional()
    .describe("Starting X position (default: current leftmost object)"),
  startY: z.number()
    .optional()
    .describe("Starting Y position (default: current topmost object)"),
});

/**
 * Tool for arranging objects in a grid layout
 *
 * Arranges objects in a grid with specified number of columns.
 * Rows are calculated automatically based on number of objects.
 */
export class ArrangeInGridTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "arrangeInGrid",
      "Arrange objects in a grid layout with specified columns. " +
      "Rows are calculated automatically. " +
      "Useful for commands like 'arrange in a 3x2 grid' or 'create a grid layout'.",
      ArrangeInGridSchema,
      context
    );
  }

  /**
   * Execute grid arrangement
   *
   * @param input - Arrangement parameters
   * @returns Tool result with modified object IDs
   */
  async execute(
    input: z.infer<typeof ArrangeInGridSchema>
  ): Promise<ToolResult> {
    try {
      // Find objects to arrange
      const objects = this.context.currentObjects.filter(obj =>
        input.objectIds.includes(obj.id)
      );

      // Validate we have enough objects
      if (objects.length < 4) {
        return {
          success: false,
          error: `Need at least 4 objects for grid, found ${objects.length}`,
          message: "Arrangement failed: not enough objects for grid",
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

      // Calculate grid dimensions
      const columns = input.columns;
      const rows = Math.ceil(objects.length / columns);

      // Calculate starting position
      const startX = input.startX ??
                     Math.min(...objects.map(obj => obj.x));
      const startY = input.startY ??
                     Math.min(...objects.map(obj => obj.y));

      // Calculate max dimensions for grid cells
      const maxWidth = this.getMaxDimension(objects, "width");
      const maxHeight = this.getMaxDimension(objects, "height");

      // Prepare batch update
      const updates: Record<string, any> = {};

      // Arrange objects in grid
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];

        // Calculate grid position
        const row = Math.floor(i / columns);
        const col = i % columns;

        // Calculate pixel position
        const x = startX + col * (maxWidth + input.spacing);
        const y = startY + row * (maxHeight + input.spacing);

        // Update object position
        updates[`canvases/${this.context.canvasId}/objects/${obj.id}/x`] = x;
        updates[`canvases/${this.context.canvasId}/objects/${obj.id}/y`] = y;
      }

      // Apply all updates in one atomic operation
      await db.ref().update(updates);

      return {
        success: true,
        message: `Arranged ${objects.length} objects in a ${columns}x${rows} ` +
                 `grid with ${input.spacing}px spacing`,
        objectsModified: input.objectIds,
        data: {
          count: objects.length,
          columns,
          rows,
          spacing: input.spacing,
          cellSize: {width: maxWidth, height: maxHeight},
          startX,
          startY,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to arrange objects in grid",
      };
    }
  }

  /**
   * Get maximum dimension across all objects
   *
   * @param objects - Array of canvas objects
   * @param dimension - 'width' or 'height'
   * @returns Maximum dimension in pixels
   */
  private getMaxDimension(objects: any[], dimension: "width" | "height"):
    number {
    let max = 0;

    for (const obj of objects) {
      let size: number;

      if (dimension === "width") {
        if (obj.width !== undefined) {
          size = obj.width;
        } else if (obj.radius !== undefined) {
          size = obj.radius * 2;
        } else {
          size = 100; // Default
        }
      } else {
        // height
        if (obj.height !== undefined) {
          size = obj.height;
        } else if (obj.radius !== undefined) {
          size = obj.radius * 2;
        } else {
          size = 100; // Default
        }
      }

      max = Math.max(max, size);
    }

    return max;
  }
}
