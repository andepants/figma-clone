/**
 * Find Empty Space Tool
 *
 * Finds a non-overlapping position near a target location.
 * Uses spiral search to find closest available space.
 */

import { z } from 'zod';
import { CanvasTool } from './base.js';
import { ToolResult, CanvasToolContext } from './types.js';
import { findEmptySpace as findEmptySpaceUtil } from '../utils/collision-detector.js';

const FindEmptySpaceSchema = z.object({
  targetX: z.number().describe('Preferred X coordinate'),
  targetY: z.number().describe('Preferred Y coordinate'),
  width: z.number().min(1).describe('Width of object to place'),
  height: z.number().min(1).describe('Height of object to place'),
  maxSearchRadius: z.number()
    .optional()
    .default(500)
    .describe('Maximum search radius in pixels (default: 500)'),
});

export class FindEmptySpaceTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'findEmptySpace',
      'Find an empty space near a target position where an object can be placed without overlapping existing objects. ' +
      'Uses spiral search pattern to find closest available position. ' +
      'Returns { x, y } coordinates of empty space.',
      FindEmptySpaceSchema,
      context
    );
  }

  async execute(input: z.infer<typeof FindEmptySpaceSchema>): Promise<ToolResult> {
    try {
      const { targetX, targetY, width, height, maxSearchRadius } = input;

      const emptyPosition = findEmptySpaceUtil(
        targetX,
        targetY,
        width,
        height,
        this.context.currentObjects,
        maxSearchRadius
      );

      const movedDistance = Math.sqrt(
        Math.pow(emptyPosition.x - targetX, 2) +
        Math.pow(emptyPosition.y - targetY, 2)
      );

      return {
        success: true,
        message: movedDistance > 1
          ? `Found empty space ${Math.round(movedDistance)}px from target at (${Math.round(emptyPosition.x)}, ${Math.round(emptyPosition.y)})`
          : `Target position is already empty at (${Math.round(emptyPosition.x)}, ${Math.round(emptyPosition.y)})`,
        data: {
          x: emptyPosition.x,
          y: emptyPosition.y,
          originalTarget: { x: targetX, y: targetY },
          distance: movedDistance,
          wasAdjusted: movedDistance > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: 'Failed to find empty space',
      };
    }
  }
}
