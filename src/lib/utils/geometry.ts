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
 * Handles all object types: rectangle, circle, text, image, line, group.
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

  /**
   * Apply transform matrix to a point
   * Handles rotation, scale, and skew transformations
   */
  const transformPoint = (
    x: number,
    y: number,
    centerX: number,
    centerY: number,
    rotation: number = 0,
    scaleX: number = 1,
    scaleY: number = 1,
    skewX: number = 0,
    skewY: number = 0
  ): { x: number; y: number } => {
    // Translate to origin (relative to center)
    let px = x - centerX;
    let py = y - centerY;

    // Apply scale
    px *= scaleX;
    py *= scaleY;

    // Apply skew
    const skewXRad = (skewX * Math.PI) / 180;
    const skewYRad = (skewY * Math.PI) / 180;
    const skewedX = px + py * Math.tan(skewXRad);
    const skewedY = py + px * Math.tan(skewYRad);
    px = skewedX;
    py = skewedY;

    // Apply rotation
    const rotRad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    const rotatedX = px * cos - py * sin;
    const rotatedY = px * sin + py * cos;

    // Translate back to world coordinates
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY,
    };
  };

  expandedObjects.forEach((obj) => {
    // Calculate base bounds for each object type
    let objMinX = 0;
    let objMinY = 0;
    let objMaxX = 0;
    let objMaxY = 0;

    // Get transform properties (all shapes support these)
    const rotation = obj.rotation ?? 0;
    const scaleX = 'scaleX' in obj ? (obj.scaleX ?? 1) : 1;
    const scaleY = 'scaleY' in obj ? (obj.scaleY ?? 1) : 1;
    const skewX = 'skewX' in obj ? (obj.skewX ?? 0) : 0;
    const skewY = 'skewY' in obj ? (obj.skewY ?? 0) : 0;

    // Check if object has any transforms applied
    const hasTransforms = rotation !== 0 || scaleX !== 1 || scaleY !== 1 || skewX !== 0 || skewY !== 0;

    if (obj.type === 'rectangle') {
      if (hasTransforms) {
        // Rectangle with transforms: calculate transformed corners
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;

        // Four corners of the untransformed rectangle
        const corners = [
          { x: obj.x, y: obj.y }, // top-left
          { x: obj.x + obj.width, y: obj.y }, // top-right
          { x: obj.x + obj.width, y: obj.y + obj.height }, // bottom-right
          { x: obj.x, y: obj.y + obj.height }, // bottom-left
        ];

        // Transform each corner and find min/max
        const transformedCorners = corners.map(corner =>
          transformPoint(corner.x, corner.y, centerX, centerY, rotation, scaleX, scaleY, skewX, skewY)
        );

        objMinX = Math.min(...transformedCorners.map(c => c.x));
        objMinY = Math.min(...transformedCorners.map(c => c.y));
        objMaxX = Math.max(...transformedCorners.map(c => c.x));
        objMaxY = Math.max(...transformedCorners.map(c => c.y));
      } else {
        // No transforms: simple bounds calculation
        objMinX = obj.x;
        objMinY = obj.y;
        objMaxX = obj.x + obj.width;
        objMaxY = obj.y + obj.height;
      }
    } else if (obj.type === 'circle') {
      // Circle: for transforms, treat as a square bounding box then transform
      const radius = obj.radius;
      const centerX = obj.x;
      const centerY = obj.y;

      if (hasTransforms) {
        // Calculate bounding box corners and transform them
        const corners = [
          { x: centerX - radius, y: centerY - radius }, // top-left
          { x: centerX + radius, y: centerY - radius }, // top-right
          { x: centerX + radius, y: centerY + radius }, // bottom-right
          { x: centerX - radius, y: centerY + radius }, // bottom-left
        ];

        const transformedCorners = corners.map(corner =>
          transformPoint(corner.x, corner.y, centerX, centerY, rotation, scaleX, scaleY, skewX, skewY)
        );

        objMinX = Math.min(...transformedCorners.map(c => c.x));
        objMinY = Math.min(...transformedCorners.map(c => c.y));
        objMaxX = Math.max(...transformedCorners.map(c => c.x));
        objMaxY = Math.max(...transformedCorners.map(c => c.y));
      } else {
        // No transforms: simple bounds
        objMinX = centerX - radius;
        objMinY = centerY - radius;
        objMaxX = centerX + radius;
        objMaxY = centerY + radius;
      }
    } else if (obj.type === 'text') {
      if (hasTransforms) {
        // Text with transforms: calculate transformed corners
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;

        const corners = [
          { x: obj.x, y: obj.y },
          { x: obj.x + obj.width, y: obj.y },
          { x: obj.x + obj.width, y: obj.y + obj.height },
          { x: obj.x, y: obj.y + obj.height },
        ];

        const transformedCorners = corners.map(corner =>
          transformPoint(corner.x, corner.y, centerX, centerY, rotation, scaleX, scaleY, skewX, skewY)
        );

        objMinX = Math.min(...transformedCorners.map(c => c.x));
        objMinY = Math.min(...transformedCorners.map(c => c.y));
        objMaxX = Math.max(...transformedCorners.map(c => c.x));
        objMaxY = Math.max(...transformedCorners.map(c => c.y));
      } else {
        // No transforms: simple bounds
        objMinX = obj.x;
        objMinY = obj.y;
        objMaxX = obj.x + obj.width;
        objMaxY = obj.y + obj.height;
      }
    } else if (obj.type === 'image') {
      if (hasTransforms) {
        // Image with transforms: calculate transformed corners
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;

        const corners = [
          { x: obj.x, y: obj.y },
          { x: obj.x + obj.width, y: obj.y },
          { x: obj.x + obj.width, y: obj.y + obj.height },
          { x: obj.x, y: obj.y + obj.height },
        ];

        const transformedCorners = corners.map(corner =>
          transformPoint(corner.x, corner.y, centerX, centerY, rotation, scaleX, scaleY, skewX, skewY)
        );

        objMinX = Math.min(...transformedCorners.map(c => c.x));
        objMinY = Math.min(...transformedCorners.map(c => c.y));
        objMaxX = Math.max(...transformedCorners.map(c => c.x));
        objMaxY = Math.max(...transformedCorners.map(c => c.y));
      } else {
        // No transforms: simple bounds
        objMinX = obj.x;
        objMinY = obj.y;
        objMaxX = obj.x + obj.width;
        objMaxY = obj.y + obj.height;
      }
    } else if (obj.type === 'line') {
      // Line: points are relative to (x, y), calculate absolute positions
      const x1 = obj.x + obj.points[0];
      const y1 = obj.y + obj.points[1];
      const x2 = obj.x + obj.points[2];
      const y2 = obj.y + obj.points[3];

      if (hasTransforms) {
        // Transform both endpoints
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        const p1 = transformPoint(x1, y1, centerX, centerY, rotation, scaleX, scaleY, skewX, skewY);
        const p2 = transformPoint(x2, y2, centerX, centerY, rotation, scaleX, scaleY, skewX, skewY);

        objMinX = Math.min(p1.x, p2.x);
        objMinY = Math.min(p1.y, p2.y);
        objMaxX = Math.max(p1.x, p2.x);
        objMaxY = Math.max(p1.y, p2.y);
      } else {
        objMinX = Math.min(x1, x2);
        objMinY = Math.min(y1, y2);
        objMaxX = Math.max(x1, x2);
        objMaxY = Math.max(y1, y2);
      }

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
