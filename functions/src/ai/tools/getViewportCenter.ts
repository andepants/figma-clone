/**
 * Get Viewport Center Tool
 *
 * Returns the center point of the user's current viewport.
 * Used for smart object placement in visible area.
 */

import { z } from 'zod';
import { CanvasTool } from './base.js';
import { ToolResult, CanvasToolContext } from './types.js';

const GetViewportCenterSchema = z.object({
  // No inputs needed
});

export class GetViewportCenterTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'getViewportCenter',
      'Get the center point of the user\'s current viewport. ' +
      'Use this to place new objects in the visible area where the user is looking. ' +
      'Returns { x, y } coordinates of viewport center.',
      GetViewportCenterSchema,
      context
    );
  }

  async execute(input: z.infer<typeof GetViewportCenterSchema>): Promise<ToolResult> {
    try {
      if (!this.context.viewportBounds) {
        // Fallback: No viewport data, use canvas center
        return {
          success: true,
          message: 'Viewport not available, using canvas center',
          data: {
            x: this.context.canvasSize.width / 2,
            y: this.context.canvasSize.height / 2,
            isViewportCenter: false,
            isFallback: true,
          },
        };
      }

      const { centerX, centerY } = this.context.viewportBounds;

      return {
        success: true,
        message: `Viewport center at (${Math.round(centerX)}, ${Math.round(centerY)})`,
        data: {
          x: centerX,
          y: centerY,
          isViewportCenter: true,
          isFallback: false,
          viewportSize: {
            width: this.context.viewportBounds.maxX - this.context.viewportBounds.minX,
            height: this.context.viewportBounds.maxY - this.context.viewportBounds.minY,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: 'Failed to get viewport center',
      };
    }
  }
}
