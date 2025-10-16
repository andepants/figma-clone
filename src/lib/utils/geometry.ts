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
 *
 * For groups, the bounding box includes all children recursively.
 * This enables proper nested grouping (group inside a group).
 *
 * Algorithm:
 * 1. Iterate through all objects
 * 2. For groups, recursively include all descendants
 * 3. Calculate min/max X and Y coordinates for each object
 * 4. Return bounding box {x, y, width, height}
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
    if (obj.type === 'rectangle') {
      // Rectangle: top-left corner + dimensions
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    } else if (obj.type === 'circle') {
      // Circle: center point - radius to center point + radius
      minX = Math.min(minX, obj.x - obj.radius);
      minY = Math.min(minY, obj.y - obj.radius);
      maxX = Math.max(maxX, obj.x + obj.radius);
      maxY = Math.max(maxY, obj.y + obj.radius);
    } else if (obj.type === 'text') {
      // Text: top-left corner + dimensions
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    } else if (obj.type === 'line') {
      // Line: points are relative to (x, y), calculate absolute positions
      const x1 = obj.x + obj.points[0];
      const y1 = obj.y + obj.points[1];
      const x2 = obj.x + obj.points[2];
      const y2 = obj.y + obj.points[3];
      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);
    }
    // Note: groups without children have no dimensions, so we skip them
    // They're already expanded above to include their children
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
