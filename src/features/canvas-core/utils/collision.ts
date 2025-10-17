/**
 * Collision Detection Utilities
 *
 * Provides collision detection functions for various shape types.
 * Used primarily for drag-to-select functionality.
 */

import type { CanvasObject, Line } from '@/types';

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
 * Line-segment to rectangle intersection test
 *
 * Checks if a line segment intersects with or is contained within a rectangle.
 * Uses the Liang-Barsky algorithm for efficient line-rectangle intersection.
 *
 * @param line - Line object with position and points array
 * @param rect - Rectangle bounds
 * @returns True if line intersects with rectangle
 *
 * @example
 * ```typescript
 * const line = { x: 0, y: 0, points: [0, 0, 100, 100] };
 * const rect = { x: 50, y: 50, width: 100, height: 100 };
 * const intersects = lineRectIntersects(line, rect);
 * ```
 */
export function lineRectIntersects(
  line: Line,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // Get absolute endpoints from line's position and relative points
  const [relX1, relY1, relX2, relY2] = line.points;
  const x1 = line.x + relX1;
  const y1 = line.y + relY1;
  const x2 = line.x + relX2;
  const y2 = line.y + relY2;

  // Check if either endpoint is inside the rectangle
  if (pointInRect({ x: x1, y: y1 }, rect) || pointInRect({ x: x2, y: y2 }, rect)) {
    return true;
  }

  // Check if line intersects any of the four rectangle edges
  const rectLeft = rect.x;
  const rectRight = rect.x + rect.width;
  const rectTop = rect.y;
  const rectBottom = rect.y + rect.height;

  // Check intersection with all four edges
  if (
    lineSegmentsIntersect(x1, y1, x2, y2, rectLeft, rectTop, rectRight, rectTop) || // Top edge
    lineSegmentsIntersect(x1, y1, x2, y2, rectRight, rectTop, rectRight, rectBottom) || // Right edge
    lineSegmentsIntersect(x1, y1, x2, y2, rectLeft, rectBottom, rectRight, rectBottom) || // Bottom edge
    lineSegmentsIntersect(x1, y1, x2, y2, rectLeft, rectTop, rectLeft, rectBottom) // Left edge
  ) {
    return true;
  }

  return false;
}

/**
 * Line segment intersection test
 *
 * Checks if two line segments intersect using the orientation method.
 *
 * @param x1 - First line start X
 * @param y1 - First line start Y
 * @param x2 - First line end X
 * @param y2 - First line end Y
 * @param x3 - Second line start X
 * @param y3 - Second line start Y
 * @param x4 - Second line end X
 * @param y4 - Second line end Y
 * @returns True if segments intersect
 */
function lineSegmentsIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean {
  // Calculate orientations
  const o1 = orientation(x1, y1, x2, y2, x3, y3);
  const o2 = orientation(x1, y1, x2, y2, x4, y4);
  const o3 = orientation(x3, y3, x4, y4, x1, y1);
  const o4 = orientation(x3, y3, x4, y4, x2, y2);

  // General case - segments intersect if orientations differ
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // Special cases - collinear points
  if (o1 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return true;
  if (o2 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return true;
  if (o3 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return true;
  if (o4 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return true;

  return false;
}

/**
 * Calculate orientation of ordered triplet (p, q, r)
 *
 * @returns 0 if collinear, 1 if clockwise, -1 if counterclockwise
 */
function orientation(px: number, py: number, qx: number, qy: number, rx: number, ry: number): number {
  const val = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
  if (val === 0) return 0; // Collinear
  return val > 0 ? 1 : -1; // Clockwise or counterclockwise
}

/**
 * Check if point q lies on segment pr (assuming they're collinear)
 */
function onSegment(px: number, py: number, qx: number, qy: number, rx: number, ry: number): boolean {
  return (
    qx <= Math.max(px, rx) &&
    qx >= Math.min(px, rx) &&
    qy <= Math.max(py, ry) &&
    qy >= Math.min(py, ry)
  );
}

/**
 * Generic object-rectangle intersection test
 * Routes to appropriate collision function based on object type
 *
 * @param obj - Canvas object (rectangle, circle, text, or line)
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
    case 'text':
    case 'image': {
      // Treat text and images as rectangles for collision purposes
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

    case 'line': {
      return lineRectIntersects(obj as Line, rect);
    }

    default:
      // Unknown type - assume no intersection
      return false;
  }
}

/**
 * Point-in-rectangle test (internal helper)
 *
 * @param point - Point coordinates
 * @param rect - Rectangle bounds
 * @returns True if point is inside rectangle
 */
function pointInRect(
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

// Note: getSelectionBounds is exported from multiSelect.ts to avoid duplication
