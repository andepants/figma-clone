/**
 * Position Validation Utilities
 *
 * Validates and clamps object positions to stay within canvas bounds.
 * Allows some off-canvas positioning for partial visibility.
 */

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Default canvas bounds (allows some off-canvas for partial visibility)
const DEFAULT_BOUNDS: CanvasBounds = {
  minX: -1000,
  maxX: 6000,
  minY: -1000,
  maxY: 6000,
};

/**
 * Validate and clamp position to canvas bounds
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param bounds - Optional custom bounds (defaults to standard canvas)
 * @returns Validated position (clamped if necessary)
 */
export function validatePosition(
  x: number,
  y: number,
  bounds: CanvasBounds = DEFAULT_BOUNDS
): CanvasPosition {
  const validatedX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
  const validatedY = Math.max(bounds.minY, Math.min(bounds.maxY, y));

  return { x: validatedX, y: validatedY };
}

/**
 * Check if position is within bounds (without clamping)
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param bounds - Optional custom bounds
 * @returns true if position is within bounds
 */
export function isPositionValid(
  x: number,
  y: number,
  bounds: CanvasBounds = DEFAULT_BOUNDS
): boolean {
  return (
    x >= bounds.minX &&
    x <= bounds.maxX &&
    y >= bounds.minY &&
    y <= bounds.maxY
  );
}

/**
 * Validate size to ensure it's reasonable
 *
 * @param width - Width value
 * @param height - Height value
 * @returns Validated dimensions
 */
export function validateSize(
  width: number,
  height: number
): { width: number; height: number } {
  const minSize = 1; // Minimum 1px
  const maxSize = 5000; // Maximum 5000px

  const validatedWidth = Math.max(minSize, Math.min(maxSize, width));
  const validatedHeight = Math.max(minSize, Math.min(maxSize, height));

  return { width: validatedWidth, height: validatedHeight };
}

/**
 * Validate radius for circles
 *
 * @param radius - Radius value
 * @returns Validated radius
 */
export function validateRadius(radius: number): number {
  const minRadius = 1;
  const maxRadius = 2500;

  const validated = Math.max(minRadius, Math.min(maxRadius, radius));

  return validated;
}

/**
 * Validate rotation angle
 *
 * @param rotation - Rotation in degrees
 * @returns Normalized rotation (-180 to 180)
 */
export function validateRotation(rotation: number): number {
  // Normalize to -180 to 180 range
  let normalized = rotation % 360;
  if (normalized > 180) {
    normalized -= 360;
  } else if (normalized < -180) {
    normalized += 360;
  }

  return normalized;
}
