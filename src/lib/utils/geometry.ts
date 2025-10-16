/**
 * Geometry Utilities
 *
 * Utilities for geometric calculations on canvas objects.
 * Includes bounding box calculation for grouping and export features.
 *
 * @module geometry
 */

import type { CanvasObject } from '@/types/canvas.types';

/**
 * Calculate bounding box of multiple canvas objects
 *
 * Returns the smallest rectangle containing all objects.
 * Handles all object types: rectangle, circle, text, line, group.
 * Accounts for stroke width, shadows, and line thickness.
 *
 * For groups, the bounding box includes all children recursively.
 * This enables proper nested grouping (group inside a group).
 *
 * Algorithm:
 * 1. Iterate through all objects
 * 2. For groups, recursively include all descendants
 * 3. Calculate base bounds for each object type
 * 4. Add stroke width (extends by half stroke on each side)
 * 5. Add shadow extent (blur radius + offset)
 * 6. Return bounding box {x, y, width, height}
 *
 * Edge cases handled:
 * - Lines: Include stroke width in bounds
 * - Strokes: Extend bounds by half stroke width on all sides
 * - Shadows: Extend bounds based on blur radius and offset
 * - Groups: No visual bounds, only their children
 * - Empty arrays: Return zero bounding box
 *
 * @param objects - Array of canvas objects to calculate bounds for
 * @param allObjects - Optional full objects array for resolving group children
 * @returns Bounding box {x, y, width, height}
 *
 * @example
 * ```typescript
 * const objects = [
 *   { type: 'rectangle', x: 0, y: 0, width: 100, height: 50 },
 *   { type: 'circle', x: 200, y: 100, radius: 25 }
 * ];
 * const bbox = calculateBoundingBox(objects);
 * // Result: { x: 0, y: 0, width: 225, height: 125 }
 * ```
 *
 * @example
 * ```typescript
 * // Empty array returns zero bounding box
 * calculateBoundingBox([])
 * // Result: { x: 0, y: 0, width: 0, height: 0 }
 * ```
 */
export function calculateBoundingBox(
  objects: CanvasObject[],
  allObjects?: CanvasObject[]
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (objects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Helper to get all descendants of a group
  const getAllDescendants = (groupId: string, all: CanvasObject[]): CanvasObject[] => {
    const children = all.filter((obj) => obj.parentId === groupId);
    const descendants: CanvasObject[] = [...children];
    children.forEach((child) => {
      if (child.type === 'group') {
        descendants.push(...getAllDescendants(child.id, all));
      }
    });
    return descendants;
  };

  // Expand objects to include children of groups
  const expandedObjects: CanvasObject[] = [];
  objects.forEach((obj) => {
    expandedObjects.push(obj);
    if (obj.type === 'group' && allObjects) {
      // Include all descendants of this group
      const descendants = getAllDescendants(obj.id, allObjects);
      expandedObjects.push(...descendants);
    }
  });

  expandedObjects.forEach((obj) => {
    // Calculate base bounds for each object type
    let objMinX = 0;
    let objMinY = 0;
    let objMaxX = 0;
    let objMaxY = 0;

    if (obj.type === 'rectangle') {
      // Rectangle: top-left corner + dimensions
      objMinX = obj.x;
      objMinY = obj.y;
      objMaxX = obj.x + obj.width;
      objMaxY = obj.y + obj.height;
    } else if (obj.type === 'circle') {
      // Circle: center point - radius to center point + radius
      objMinX = obj.x - obj.radius;
      objMinY = obj.y - obj.radius;
      objMaxX = obj.x + obj.radius;
      objMaxY = obj.y + obj.radius;
    } else if (obj.type === 'text') {
      // Text: top-left corner + dimensions
      objMinX = obj.x;
      objMinY = obj.y;
      objMaxX = obj.x + obj.width;
      objMaxY = obj.y + obj.height;
    } else if (obj.type === 'line') {
      // Line: points are relative to (x, y), calculate absolute positions
      const x1 = obj.x + obj.points[0];
      const y1 = obj.y + obj.points[1];
      const x2 = obj.x + obj.points[2];
      const y2 = obj.y + obj.points[3];
      objMinX = Math.min(x1, x2);
      objMinY = Math.min(y1, y2);
      objMaxX = Math.max(x1, x2);
      objMaxY = Math.max(y1, y2);

      // Add half stroke width to account for line thickness
      const halfStroke = (obj.strokeWidth || 2) / 2;
      objMinX -= halfStroke;
      objMinY -= halfStroke;
      objMaxX += halfStroke;
      objMaxY += halfStroke;
    } else {
      // Groups have no dimensions, skip
      return;
    }

    // Account for stroke width (extends beyond base bounds)
    if (obj.type !== 'line' && obj.strokeEnabled !== false && obj.stroke) {
      const strokeWidth = obj.strokeWidth || 0;
      const halfStroke = strokeWidth / 2;
      objMinX -= halfStroke;
      objMinY -= halfStroke;
      objMaxX += halfStroke;
      objMaxY += halfStroke;
    }

    // Account for shadow (extends beyond base bounds)
    if (obj.shadowEnabled !== false && obj.shadowColor) {
      const shadowBlur = obj.shadowBlur || 0;
      const shadowOffsetX = obj.shadowOffsetX || 0;
      const shadowOffsetY = obj.shadowOffsetY || 0;

      // Shadow extends by blur radius + offset in all directions
      const shadowExtendLeft = Math.max(0, shadowBlur - shadowOffsetX);
      const shadowExtendRight = Math.max(0, shadowBlur + shadowOffsetX);
      const shadowExtendTop = Math.max(0, shadowBlur - shadowOffsetY);
      const shadowExtendBottom = Math.max(0, shadowBlur + shadowOffsetY);

      objMinX -= shadowExtendLeft;
      objMaxX += shadowExtendRight;
      objMinY -= shadowExtendTop;
      objMaxY += shadowExtendBottom;
    }

    // Update global bounds
    minX = Math.min(minX, objMinX);
    minY = Math.min(minY, objMinY);
    maxX = Math.max(maxX, objMaxX);
    maxY = Math.max(maxY, objMaxY);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
