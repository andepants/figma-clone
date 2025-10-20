/**
 * Viewport Bounds Validator
 *
 * Validates viewport bounds are present and valid before using them.
 * Provides defensive checks and fallback to default canvas center.
 */

/**
 * Viewport bounds interface
 */
export interface ViewportBounds {
  centerX: number;
  centerY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Default viewport bounds (canvas center)
 * Used as fallback when viewport data is missing
 */
const DEFAULT_VIEWPORT: ViewportBounds = {
  centerX: 2500,
  centerY: 2500,
  minX: 0,
  maxX: 5000,
  minY: 0,
  maxY: 5000,
};

/**
 * Validate viewport bounds are present and valid
 *
 * @param bounds - Viewport bounds to validate (may be undefined)
 * @returns Valid viewport bounds (defaults to canvas center if missing)
 * @throws Error if bounds are malformed (invalid numbers)
 *
 * @example
 * const bounds = validateViewportBounds(context.viewportBounds);
 * // Returns default if undefined, validates if present
 */
export function validateViewportBounds(
  bounds: ViewportBounds | undefined | null
): ViewportBounds {
  // Return default for null/undefined
  if (!bounds) {
    return DEFAULT_VIEWPORT;
  }

  // Validate all fields are finite numbers (not NaN, Infinity)
  if (
    !Number.isFinite(bounds.centerX) ||
    !Number.isFinite(bounds.centerY) ||
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxY)
  ) {
    throw new Error(
      'Invalid viewport bounds: all fields must be finite numbers'
    );
  }

  // Validate bounds make sense (min < max)
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) {
    throw new Error(
      'Invalid viewport bounds: minX must be < maxX and minY must be < maxY'
    );
  }

  // Validate center is within bounds
  if (
    bounds.centerX < bounds.minX ||
    bounds.centerX > bounds.maxX ||
    bounds.centerY < bounds.minY ||
    bounds.centerY > bounds.maxY
  ) {
    throw new Error(
      'Invalid viewport bounds: center must be within min/max bounds'
    );
  }

  return bounds;
}

/**
 * Check if a position is within viewport bounds
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param bounds - Viewport bounds
 * @returns True if position is inside viewport
 *
 * @example
 * if (isPositionInViewport(100, 100, bounds)) {
 *   console.log('Position is visible');
 * }
 */
export function isPositionInViewport(
  x: number,
  y: number,
  bounds: ViewportBounds
): boolean {
  return (
    x >= bounds.minX &&
    x <= bounds.maxX &&
    y >= bounds.minY &&
    y <= bounds.maxY
  );
}

/**
 * Check if an object (bounding box) is within viewport bounds
 *
 * @param x - Object x position (top-left for rectangles, center for circles)
 * @param y - Object y position (top-left for rectangles, center for circles)
 * @param width - Object width
 * @param height - Object height
 * @param bounds - Viewport bounds
 * @param objectType - Type of object (affects position interpretation)
 * @returns True if object is visible in viewport
 *
 * @example
 * if (isObjectInViewport(x, y, width, height, bounds, 'rectangle')) {
 *   console.log('Object is visible');
 * }
 */
export function isObjectInViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: ViewportBounds,
  objectType: 'rectangle' | 'circle' | 'text' | 'line'
): boolean {
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

  // Check if object overlaps with viewport
  // (Not completely outside viewport)
  return !(
    objectRight < bounds.minX ||
    objectLeft > bounds.maxX ||
    objectBottom < bounds.minY ||
    objectTop > bounds.maxY
  );
}
