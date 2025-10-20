/**
 * Move Object Tool
 *
 * AI tool for moving canvas objects to new positions.
 * Supports both absolute positioning and relative movement.
 * Can move multiple objects at once using last created objects from context.
 */

import {z} from "zod";
import * as logger from "firebase-functions/logger";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {getDatabase} from "../../services/firebase-admin";

/**
 * Schema for move object parameters
 */
const MoveObjectSchema = z.object({
  objectIds: z.array(z.string())
    .optional()
    .describe("Object IDs to move. If not provided, uses last created objects."),
  // Support either absolute position OR relative direction
  x: z.number()
    .optional()
    .describe("Absolute X coordinate"),
  y: z.number()
    .optional()
    .describe("Absolute Y coordinate"),
  direction: z.enum(["left", "right", "up", "down"])
    .optional()
    .describe("Relative direction to move"),
  distance: z.number()
    .optional()
    .default(100)
    .describe("Distance to move in pixels (default: 100)"),
});

/**
 * Tool for moving objects on the canvas
 */
export class MoveObjectTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "moveObject",
      "Move objects to a new position. " +
      "Supports absolute positioning (x, y) or relative movement (direction + distance). " +
      "If no objectIds provided, moves the last created objects. " +
      "Direction: 'left', 'right', 'up', 'down'. Default distance: 100px.",
      MoveObjectSchema,
      context
    );
  }

  /**
   * Execute object move
   *
   * @param input - Validated move parameters
   * @returns Tool result with modified object IDs
   */
  async execute(
    input: z.infer<typeof MoveObjectSchema>
  ): Promise<ToolResult> {
    try {
      // Determine which objects to move
      let objectIds = input.objectIds;

      if (!objectIds || objectIds.length === 0) {
        // Use last created objects from context
        if (this.context.lastCreatedObjectIds &&
            this.context.lastCreatedObjectIds.length > 0) {
          objectIds = this.context.lastCreatedObjectIds;
          logger.info("Using last created objects for move", {objectIds});
        } else {
          return {
            success: false,
            error: "No objects specified and no recently created objects",
            message: "Please specify which objects to move or create objects first",
          };
        }
      }

      // Convert direction to delta
      let deltaX = 0;
      let deltaY = 0;
      let isRelative = false;

      if (input.direction) {
        isRelative = true;
        const distance = input.distance || 100;

        switch (input.direction) {
          case "left":
            deltaX = -distance;
            break;
          case "right":
            deltaX = distance;
            break;
          case "up":
            deltaY = -distance;
            break;
          case "down":
            deltaY = distance;
            break;
        }

        logger.info("Relative movement", {
          direction: input.direction,
          distance,
          deltaX,
          deltaY,
        });
      }

      // Prepare batch update for atomicity
      const updates: Record<string, number> = {};
      const movedObjectIds: string[] = [];
      const moveDetails: Array<{
        id: string;
        oldPos: {x: number; y: number};
        newPos: {x: number; y: number};
      }> = [];

      for (const objectId of objectIds) {
        const obj = this.context.currentObjects.find((o) => o.id === objectId);

        if (!obj) {
          logger.warn("Object not found for move", {objectId});
          continue;
        }

        let newX: number;
        let newY: number;

        if (isRelative) {
          // Relative movement
          newX = obj.x + deltaX;
          newY = obj.y + deltaY;
        } else {
          // Absolute position
          newX = input.x !== undefined ? input.x : obj.x;
          newY = input.y !== undefined ? input.y : obj.y;
        }

        // Add to batch update
        const basePath = `canvases/${this.context.canvasId}/objects/${objectId}`;
        updates[`${basePath}/x`] = newX;
        updates[`${basePath}/y`] = newY;

        movedObjectIds.push(objectId);
        moveDetails.push({
          id: objectId,
          oldPos: {x: obj.x, y: obj.y},
          newPos: {x: newX, y: newY},
        });
      }

      // Execute atomic batch update
      if (Object.keys(updates).length > 0) {
        await getDatabase().ref().update(updates);
        logger.info("Moved objects (batch update)", {
          count: movedObjectIds.length,
          isRelative,
          details: moveDetails,
        });
      }

      const message = isRelative ?
        `Moved ${movedObjectIds.length} object(s) ${input.direction} by ${input.distance}px` :
        `Moved ${movedObjectIds.length} object(s) to (${input.x}, ${input.y})`;

      return {
        success: true,
        message,
        objectsModified: movedObjectIds,
        data: {
          count: movedObjectIds.length,
          direction: input.direction,
          distance: input.distance,
          isRelative,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to move objects",
      };
    }
  }
}
