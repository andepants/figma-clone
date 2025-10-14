/**
 * Collision Detection Utilities
 *
 * Provides collision detection functions for various shape types.
 * Used primarily for drag-to-select functionality.
 */

import type { CanvasObject } from '@/types';

/**
 * Rectangle (AABB) intersection test
 *
 * @param r1 - First rectangle
 * @param r2 - Second rectangle
 * @returns True if rectangles overlap
 *
 * @example
 * ```typescript
 * const overlaps = rectanglesIntersect(
 *   { x: 0, y: 0, width: 100, height: 100 },
 *   { x: 50, y: 50, width: 100, height: 100 }
 * );
 * // overlaps = true
 * ```
 */
export function rectanglesIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Circle-rectangle intersection test
 *
 * Uses closest point algorithm:
 * 1. Find closest point on rectangle to circle center
 * 2. Check if that point is within circle radius
 *
 * @param circle - Circle with center (x, y) and radius
 * @param rect - Rectangle bounds
 * @returns True if circle and rectangle overlap
 *
 * @example
 * ```typescript
 * const overlaps = circleRectIntersects(
 *   { x: 150, y: 150, radius: 50 },
 *   { x: 100, y: 100, width: 100, height: 100 }
 * );
 * ```
 */
export function circleRectIntersects(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  // Check if distance is less than radius
  return distanceSquared <= circle.radius * circle.radius;
}

/**
 * Generic object-rectangle intersection test
 * Routes to appropriate collision function based on object type
 *
 * @param obj - Canvas object (rectangle, circle, or text)
 * @param rect - Selection rectangle
 * @returns True if object intersects with rectangle
 *
 * @example
 * ```typescript
 * const objects = canvasStore.objects;
 * const selectionRect = { x: 0, y: 0, width: 200, height: 200 };
 *
 * const selectedObjects = objects.filter(obj =>
 *   objectIntersectsRect(obj, selectionRect)
 * );
 * ```
 */
export function objectIntersectsRect(
  obj: CanvasObject,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  switch (obj.type) {
    case 'rectangle':
    case 'text': {
      // Treat text as rectangle for collision purposes
      const objRect = {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };
      return rectanglesIntersect(objRect, rect);
    }

    case 'circle': {
      return circleRectIntersects({ x: obj.x, y: obj.y, radius: obj.radius }, rect);
    }

    default:
      // Unknown type - assume no intersection
      return false;
  }
}

/**
 * Point-in-rectangle test
 *
 * @param point - Point coordinates
 * @param rect - Rectangle bounds
 * @returns True if point is inside rectangle
 */
export function pointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Point-in-circle test
 *
 * @param point - Point coordinates
 * @param circle - Circle center and radius
 * @returns True if point is inside circle
 */
export function pointInCircle(
  point: { x: number; y: number },
  circle: { x: number; y: number; radius: number }
): boolean {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

// Note: getSelectionBounds is exported from multiSelect.ts to avoid duplication
