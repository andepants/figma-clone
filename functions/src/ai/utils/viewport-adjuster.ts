/**
 * Viewport Position Adjuster
 *
 * Adjusts object positions to ensure they appear within the viewport.
 * Implements the viewport override strategy: ALL objects placed in viewport,
 * even when user specifies explicit coordinates.
 */

import { ViewportBounds } from './viewport-validator';

/**
 * Result of position adjustment
 */
export interface AdjustmentResult {
  x: number;
  y: number;
  wasAdjusted: boolean;
}

/**
 * Adjust position to be within viewport bounds
 *
 * Strategy: If object is completely outside viewport, move it to viewport center.
 * If object is partially visible, keep it as-is (edge case).
 *
 * @param x - Original X position
 * @param y - Original Y position
 * @param width - Object width
 * @param height - Object height
 * @param bounds - Viewport bounds
 * @param objectType - Type of object (affects position interpretation)
 * @returns Adjusted position and whether adjustment occurred
 *
 * @example
 * // Rectangle off-screen
 * const result = adjustToViewport(10000, 10000, 200, 100, bounds, 'rectangle');
 * // result.wasAdjusted === true
 * // result.x === bounds.centerX - 100 (centered)
 * // result.y === bounds.centerY - 50 (centered)
 *
 * @example
 * // Circle already in viewport
 * const result = adjustToViewport(2500, 2500, 100, 100, bounds, 'circle');
 * // result.wasAdjusted === false
 * // result.x === 2500
 * // result.y === 2500
 */
export function adjustToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: ViewportBounds,
  objectType: 'rectangle' | 'circle' | 'text' | 'line'
): AdjustmentResult {
  // Calculate object bounds based on type
  let objectLeft: number;
  let objectRight: number;
  let objectTop: number;
  let objectBottom: number;

  if (objectType === 'circle') {
    // Circle: x,y is center, radius = width/2 = height/2
    const radius = width / 2;
    objectLeft = x - radius;
    objectRight = x + radius;
    objectTop = y - radius;
    objectBottom = y + radius;
  } else {
    // Rectangle/Text/Line: x,y is top-left corner
    objectLeft = x;
    objectRight = x + width;
    objectTop = y;
    objectBottom = y + height;
  }

  // Check if object is completely outside viewport
  const isCompletelyOutside =
    objectRight < bounds.minX ||
    objectLeft > bounds.maxX ||
    objectBottom < bounds.minY ||
    objectTop > bounds.maxY;

  // If completely outside, move to viewport center
  if (isCompletelyOutside) {
    let adjustedX: number;
    let adjustedY: number;

    if (objectType === 'circle') {
      // Circle: center at viewport center
      adjustedX = bounds.centerX;
      adjustedY = bounds.centerY;
    } else {
      // Rectangle/Text/Line: top-left corner positioned to center object
      adjustedX = bounds.centerX - width / 2;
      adjustedY = bounds.centerY - height / 2;
    }

    return {
      x: adjustedX,
      y: adjustedY,
      wasAdjusted: true,
    };
  }

  // Object is at least partially visible, keep as-is
  return {
    x,
    y,
    wasAdjusted: false,
  };
}

/**
 * Adjust line endpoints to be within viewport
 *
 * Lines are special: they have points [x1, y1, x2, y2] instead of x, y, width, height.
 * If line is completely outside viewport, move it to viewport center while preserving
 * length and angle.
 *
 * @param x1 - Start X
 * @param y1 - Start Y
 * @param x2 - End X
 * @param y2 - End Y
 * @param bounds - Viewport bounds
 * @returns Adjusted line points and whether adjustment occurred
 *
 * @example
 * const result = adjustLineToViewport(10000, 10000, 10100, 10100, bounds);
 * // Line moved to viewport center, preserving 100px diagonal
 */
export function adjustLineToViewport(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bounds: ViewportBounds
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wasAdjusted: boolean;
} {
  // Calculate line bounding box
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Check if line is completely outside viewport
  const isCompletelyOutside =
    maxX < bounds.minX ||
    minX > bounds.maxX ||
    maxY < bounds.minY ||
    minY > bounds.maxY;

  if (isCompletelyOutside) {
    // Calculate line vector (length and direction)
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Center line at viewport center
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;

    // New line points: start at center - half vector, end at center + half vector
    const adjustedX1 = centerX - dx / 2;
    const adjustedY1 = centerY - dy / 2;
    const adjustedX2 = centerX + dx / 2;
    const adjustedY2 = centerY + dy / 2;

    return {
      x1: adjustedX1,
      y1: adjustedY1,
      x2: adjustedX2,
      y2: adjustedY2,
      wasAdjusted: true,
    };
  }

  // Line is at least partially visible, keep as-is
  return {
    x1,
    y1,
    x2,
    y2,
    wasAdjusted: false,
  };
}

/**
 * Calculate safe position for very large objects that may exceed viewport
 *
 * If object is larger than viewport, position it so top-left corner is at
 * viewport top-left (not centered, as that would hide most of the object).
 *
 * @param width - Object width
 * @param height - Object height
 * @param bounds - Viewport bounds
 * @param objectType - Type of object
 * @returns Safe position for large object
 *
 * @example
 * // Object 3000x3000, viewport 1920x1080
 * const pos = getSafePositionForLargeObject(3000, 3000, bounds, 'rectangle');
 * // pos.x === bounds.minX (top-left of viewport)
 * // pos.y === bounds.minY
 */
export function getSafePositionForLargeObject(
  width: number,
  height: number,
  bounds: ViewportBounds,
  objectType: 'rectangle' | 'circle' | 'text' | 'line'
): { x: number; y: number } {
  const viewportWidth = bounds.maxX - bounds.minX;
  const viewportHeight = bounds.maxY - bounds.minY;

  // Check if object exceeds viewport
  const exceedsViewport = width > viewportWidth || height > viewportHeight;

  if (exceedsViewport) {
    // Position at viewport top-left
    if (objectType === 'circle') {
      // Circle: center positioned at top-left + radius
      const radius = width / 2;
      return {
        x: bounds.minX + radius,
        y: bounds.minY + radius,
      };
    } else {
      // Rectangle/Text/Line: top-left corner at viewport top-left
      return {
        x: bounds.minX,
        y: bounds.minY,
      };
    }
  }

  // Normal size object, use center
  if (objectType === 'circle') {
    return {
      x: bounds.centerX,
      y: bounds.centerY,
    };
  } else {
    return {
      x: bounds.centerX - width / 2,
      y: bounds.centerY - height / 2,
    };
  }
}
