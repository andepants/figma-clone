/**
 * Delete Objects Tool
 *
 * AI tool for deleting canvas objects.
 * Supports deleting single or multiple objects.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {
  deleteCanvasObject,
  batchDeleteObjects,
  getCanvasObject,
} from "../../services/canvas-objects";

/**
 * Schema for delete objects parameters
 */
const DeleteObjectsSchema = z.object({
  objectIds: z.array(z.string())
    .min(1)
    .describe("Array of object IDs to delete (at least 1 required)"),
});

/**
 * Tool for deleting objects from the canvas
 */
export class DeleteObjectsTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "deleteObjects",
      "Delete one or more objects from the canvas by their IDs. " +
      "Provide an array of object IDs to delete.",
      DeleteObjectsSchema,
      context
    );
  }

  /**
   * Execute object deletion
   *
   * @param input - Validated deletion parameters
   * @returns Tool result with deleted object IDs
   */
  async execute(
    input: z.infer<typeof DeleteObjectsSchema>
  ): Promise<ToolResult> {
    try {
      const objectIds = input.objectIds;
      const deletedIds: string[] = [];
      const notFoundIds: string[] = [];

      // Verify all objects exist first
      for (const objectId of objectIds) {
        const obj = await getCanvasObject(this.context.canvasId, objectId);
        if (obj) {
          deletedIds.push(objectId);
        } else {
          notFoundIds.push(objectId);
        }
      }

      // If none found, return error
      if (deletedIds.length === 0) {
        return {
          success: false,
          error: `None of the specified objects were found: ${notFoundIds.join(", ")}`,
          message: "Failed to delete objects - no objects found",
        };
      }

      // Delete objects
      if (deletedIds.length === 1) {
        // Single delete
        await deleteCanvasObject(this.context.canvasId, deletedIds[0]);
      } else {
        // Batch delete
        await batchDeleteObjects(this.context.canvasId, deletedIds);
      }

      // Build message
      let message: string;
      if (deletedIds.length === 1) {
        message = `Deleted 1 object`;
      } else {
        message = `Deleted ${deletedIds.length} objects`;
      }

      // Add warning if some weren't found
      if (notFoundIds.length > 0) {
        message += ` (${notFoundIds.length} not found: ${notFoundIds.join(", ")})`;
      }

      return {
        success: true,
        message,
        objectsDeleted: deletedIds,
        data: {
          deletedCount: deletedIds.length,
          notFoundCount: notFoundIds.length,
          notFoundIds,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to delete objects",
      };
    }
  }
}
