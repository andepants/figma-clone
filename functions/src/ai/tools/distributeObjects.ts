/**
 * Distribute Objects Tool
 *
 * AI tool for distributing and aligning multiple canvas objects.
 * Supports even spacing (distribute) and alignment operations.
 *
 * Use this tool when:
 * - "Space these elements evenly"
 * - "Distribute horizontally with equal gaps"
 * - "Align centers vertically"
 * - "Align all to the left"
 *
 * Best Practice: This tool modifies positions but maintains object sizes.
 * Use separate resize tools to change dimensions.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {CanvasObject} from "../../types";
import {getDatabase} from "../../services/firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Schema for distribution/alignment parameters
 */
const DistributeObjectsSchema = z.object({
  objectIds: z
    .array(z.string())
    .min(2)
    .describe("Array of object IDs to distribute/align (at least 2)"),

  // Distribution options
  distribute: z
    .enum(["horizontal", "vertical", "both", "none"])
    .optional()
    .default("none")
    .describe(
      "Distribute objects with even spacing: horizontal (left-to-right), vertical (top-to-bottom), both, or none"
    ),
  spacing: z
    .number()
    .optional()
    .describe(
      "Fixed spacing between objects in pixels. If not provided, distributes evenly across current span."
    ),

  // Alignment options
  alignHorizontal: z
    .enum(["left", "center", "right", "none"])
    .optional()
    .default("none")
    .describe(
      "Horizontal alignment: left edges, centers, right edges, or none"
    ),
  alignVertical: z
    .enum(["top", "middle", "bottom", "none"])
    .optional()
    .default("none")
    .describe(
      "Vertical alignment: top edges, middles, bottom edges, or none"
    ),
});

/**
 * Tool for distributing and aligning objects
 *
 * Examples:
 * - "Space these evenly horizontally" → distribute='horizontal'
 * - "Align centers vertically" → alignHorizontal='center', alignVertical='none'
 * - "Distribute vertically and align left" → distribute='vertical', alignHorizontal='left'
 */
export class DistributeObjectsTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "distributeObjects",
      "Distribute multiple objects with even spacing or align them along edges/centers. " +
        "Distribute creates equal gaps between objects. Align moves objects to the same position along an axis. " +
        "Examples: 'space evenly', 'align centers', 'distribute horizontally and align top'. " +
        "Requires at least 2 objects.",
      DistributeObjectsSchema,
      context
    );
  }

  /**
   * Execute distribution/alignment
   *
   * @param input - Distribution and alignment parameters
   * @returns Tool result with modified object IDs
   */
  async execute(
    input: z.infer<typeof DistributeObjectsSchema>
  ): Promise<ToolResult> {
    try {
      // Find objects
      const objects = this.context.currentObjects.filter((obj) =>
        input.objectIds.includes(obj.id)
      );

      if (objects.length < 2) {
        return {
          success: false,
          error: `Need at least 2 objects, found ${objects.length}`,
          message: "Distribution/alignment requires at least 2 objects",
        };
      }

      if (objects.length !== input.objectIds.length) {
        const foundIds = new Set(objects.map((obj) => obj.id));
        const missingIds = input.objectIds.filter((id) => !foundIds.has(id));
        return {
          success: false,
          error: `Objects not found: ${missingIds.join(", ")}`,
          message: "Some objects don't exist",
        };
      }

      // Check if any operation requested
      if (
        input.distribute === "none" &&
        input.alignHorizontal === "none" &&
        input.alignVertical === "none"
      ) {
        return {
          success: false,
          error: "Must specify at least one operation (distribute or align)",
          message: "No operation specified",
        };
      }

      // Prepare batch update
      const updates: Record<string, number> = {};
      const operations: string[] = [];

      // Calculate bounding boxes for each object
      const boxes = objects.map((obj) => this.getObjectBounds(obj));

      // Horizontal alignment
      if (input.alignHorizontal && input.alignHorizontal !== "none") {
        let alignX: number;

        switch (input.alignHorizontal) {
          case "left": {
            alignX = Math.min(...boxes.map((b) => b.left));
            objects.forEach((obj, i) => {
              const box = boxes[i];
              const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
              updates[`${basePath}/x`] = alignX + box.offsetX;
            });
            operations.push("aligned left");
            break;
          }
          case "center": {
            const centers = boxes.map((b) => b.centerX);
            alignX = centers.reduce((sum, c) => sum + c, 0) / centers.length;
            objects.forEach((obj, i) => {
              const box = boxes[i];
              const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
              updates[`${basePath}/x`] = alignX - box.width / 2 + box.offsetX;
            });
            operations.push("aligned centers horizontally");
            break;
          }
          case "right": {
            alignX = Math.max(...boxes.map((b) => b.right));
            objects.forEach((obj, i) => {
              const box = boxes[i];
              const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
              updates[`${basePath}/x`] = alignX - box.width + box.offsetX;
            });
            operations.push("aligned right");
            break;
          }
        }
      }

      // Vertical alignment
      if (input.alignVertical && input.alignVertical !== "none") {
        let alignY: number;

        switch (input.alignVertical) {
          case "top": {
            alignY = Math.min(...boxes.map((b) => b.top));
            objects.forEach((obj, i) => {
              const box = boxes[i];
              const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
              updates[`${basePath}/y`] = alignY + box.offsetY;
            });
            operations.push("aligned top");
            break;
          }
          case "middle": {
            const middles = boxes.map((b) => b.centerY);
            alignY = middles.reduce((sum, c) => sum + c, 0) / middles.length;
            objects.forEach((obj, i) => {
              const box = boxes[i];
              const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
              updates[`${basePath}/y`] = alignY - box.height / 2 + box.offsetY;
            });
            operations.push("aligned centers vertically");
            break;
          }
          case "bottom": {
            alignY = Math.max(...boxes.map((b) => b.bottom));
            objects.forEach((obj, i) => {
              const box = boxes[i];
              const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
              updates[`${basePath}/y`] = alignY - box.height + box.offsetY;
            });
            operations.push("aligned bottom");
            break;
          }
        }
      }

      // Horizontal distribution
      if (input.distribute === "horizontal" || input.distribute === "both") {
        // Sort by X position
        const sorted = [...objects].sort((a, b) => {
          const boxA = this.getObjectBounds(a);
          const boxB = this.getObjectBounds(b);
          return boxA.left - boxB.left;
        });

        if (input.spacing !== undefined) {
          // Fixed spacing
          let currentX = this.getObjectBounds(sorted[0]).left;
          sorted.forEach((obj) => {
            const box = this.getObjectBounds(obj);
            const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
            updates[`${basePath}/x`] = currentX + box.offsetX;
            currentX += box.width + input.spacing!;
          });
          operations.push(`distributed horizontally (${input.spacing}px spacing)`);
        } else {
          // Even distribution
          const sortedBoxes = sorted.map((obj) => this.getObjectBounds(obj));
          const startX = sortedBoxes[0].left;
          const endX = sortedBoxes[sortedBoxes.length - 1].right;
          const totalWidth = sortedBoxes.reduce((sum, b) => sum + b.width, 0);
          const totalGap = endX - startX - totalWidth;
          const gap = totalGap / (sorted.length - 1);

          let currentX = startX;
          sorted.forEach((obj) => {
            const box = this.getObjectBounds(obj);
            const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
            updates[`${basePath}/x`] = currentX + box.offsetX;
            currentX += box.width + gap;
          });
          operations.push("distributed evenly horizontally");
        }
      }

      // Vertical distribution
      if (input.distribute === "vertical" || input.distribute === "both") {
        // Sort by Y position
        const sorted = [...objects].sort((a, b) => {
          const boxA = this.getObjectBounds(a);
          const boxB = this.getObjectBounds(b);
          return boxA.top - boxB.top;
        });

        if (input.spacing !== undefined) {
          // Fixed spacing
          let currentY = this.getObjectBounds(sorted[0]).top;
          sorted.forEach((obj) => {
            const box = this.getObjectBounds(obj);
            const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
            updates[`${basePath}/y`] = currentY + box.offsetY;
            currentY += box.height + input.spacing!;
          });
          operations.push(`distributed vertically (${input.spacing}px spacing)`);
        } else {
          // Even distribution
          const sortedBoxes = sorted.map((obj) => this.getObjectBounds(obj));
          const startY = sortedBoxes[0].top;
          const endY = sortedBoxes[sortedBoxes.length - 1].bottom;
          const totalHeight = sortedBoxes.reduce((sum, b) => sum + b.height, 0);
          const totalGap = endY - startY - totalHeight;
          const gap = totalGap / (sorted.length - 1);

          let currentY = startY;
          sorted.forEach((obj) => {
            const box = this.getObjectBounds(obj);
            const basePath = `canvases/${this.context.canvasId}/objects/${obj.id}`;
            updates[`${basePath}/y`] = currentY + box.offsetY;
            currentY += box.height + gap;
          });
          operations.push("distributed evenly vertically");
        }
      }

      // Apply atomic batch update
      if (Object.keys(updates).length > 0) {
        await getDatabase().ref().update(updates);
        logger.info("Distributed/aligned objects", {
          count: objects.length,
          operations,
        });
      }

      const message = `${operations.join(" and ")} for ${objects.length} objects`;

      return {
        success: true,
        message,
        objectsModified: input.objectIds,
        data: {
          count: objects.length,
          operations,
          distribute: input.distribute,
          alignHorizontal: input.alignHorizontal,
          alignVertical: input.alignVertical,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to distribute/align objects",
      };
    }
  }

  /**
   * Get bounding box for an object
   *
   * Handles different object types (rectangle, circle, text, etc.)
   *
   * @param obj - Canvas object
   * @returns Bounding box coordinates
   */
  private getObjectBounds(obj: CanvasObject): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    offsetX: number; // Offset from x,y to left edge
    offsetY: number; // Offset from x,y to top edge
  } {
    let left: number, top: number, width: number, height: number;

    if (obj.type === "circle") {
      // Circle: x,y is center
      const radius = obj.radius || 50;
      width = radius * 2;
      height = radius * 2;
      left = obj.x - radius;
      top = obj.y - radius;
      return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
        centerX: obj.x,
        centerY: obj.y,
        offsetX: radius, // x,y is center, so offset is +radius
        offsetY: radius,
      };
    } else {
      // Rectangle/text: x,y is top-left
      width = obj.width || 100;
      height = obj.height || 100;
      left = obj.x;
      top = obj.y;
      return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
        centerX: obj.x + width / 2,
        centerY: obj.y + height / 2,
        offsetX: 0, // x,y is already top-left
        offsetY: 0,
      };
    }
  }
}
