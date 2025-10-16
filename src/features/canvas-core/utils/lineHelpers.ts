/**
 * Line Utilities
 *
 * Utilities for line calculations, endpoint conversions, and rotation normalization.
 * Handles line property calculations and coordinate transformations.
 */

import type { Line } from '@/types/canvas.types';

/**
 * Line properties calculated from endpoints
 * @interface LineProperties
 * @property {number} x - X coordinate of lowest point (MIN of both endpoints)
 * @property {number} y - Y coordinate of lowest point (MIN of both endpoints)
 * @property {[number, number, number, number]} points - Line endpoints relative to (x, y)
 * @property {number} width - Line length (Euclidean distance between endpoints)
 * @property {number} rotation - Angle in degrees, normalized to range -179 to 179
 */
export interface LineProperties {
  x: number;
  y: number;
  points: [number, number, number, number];
  width: number;
  rotation: number;
}

/**
 * Line endpoints in absolute canvas coordinates
 * @interface LineEndpoints
 * @property {number} x1 - X coordinate of first endpoint
 * @property {number} y1 - Y coordinate of first endpoint
 * @property {number} x2 - X coordinate of second endpoint
 * @property {number} y2 - Y coordinate of second endpoint
 */
export interface LineEndpoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Calculate line properties from absolute endpoint coordinates
 *
 * Converts two absolute points into the Line object format with:
 * - Position (x, y) as MIN of both endpoints
 * - Points array relative to position
 * - Width as Euclidean distance
 * - Rotation normalized to -179 to 179 degrees
 *
 * @param {number} x1 - X coordinate of first endpoint
 * @param {number} y1 - Y coordinate of first endpoint
 * @param {number} x2 - X coordinate of second endpoint
 * @param {number} y2 - Y coordinate of second endpoint
 * @returns {LineProperties} Calculated line properties
 *
 * @example
 * ```ts
 * // Horizontal line from (0, 0) to (100, 0)
 * const props = calculateLineProperties(0, 0, 100, 0);
 * // { x: 0, y: 0, points: [0, 0, 100, 0], width: 100, rotation: 0 }
 *
 * // Vertical line from (0, 0) to (0, 100)
 * const props2 = calculateLineProperties(0, 0, 0, 100);
 * // { x: 0, y: 0, points: [0, 0, 0, 100], width: 100, rotation: 90 }
 *
 * // Diagonal line from (100, 100) to (200, 50)
 * const props3 = calculateLineProperties(100, 100, 200, 50);
 * // { x: 100, y: 50, points: [0, 50, 100, 0], width: ~111.8, rotation: ~-26.57 }
 * ```
 */
export function calculateLineProperties(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): LineProperties {
  // Position is MIN of endpoints for consistent bounding box
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  // Points relative to position
  const points: [number, number, number, number] = [
    x1 - x,
    y1 - y,
    x2 - x,
    y2 - y,
  ];

  // Calculate width (Euclidean distance)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const width = Math.sqrt(dx * dx + dy * dy);

  // Calculate rotation (angle from point1 to point2)
  let rotation = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize: if rotation is exactly 180, set to -180
  rotation = normalizeLineRotation(rotation);

  return { x, y, points, width, rotation };
}

/**
 * Get absolute endpoint coordinates from a Line object
 *
 * Converts the relative points array in a Line object back to absolute
 * canvas coordinates by adding the line's position (x, y).
 *
 * @param {Line} line - The line object
 * @returns {LineEndpoints} Absolute endpoint coordinates
 *
 * @example
 * ```ts
 * const line: Line = {
 *   x: 100,
 *   y: 50,
 *   points: [0, 50, 100, 0],
 *   // ... other properties
 * };
 * const endpoints = getLineEndpoints(line);
 * // { x1: 100, y1: 100, x2: 200, y2: 50 }
 * ```
 */
export function getLineEndpoints(line: Line): LineEndpoints {
  const [relX1, relY1, relX2, relY2] = line.points;

  return {
    x1: line.x + relX1,
    y1: line.y + relY1,
    x2: line.x + relX2,
    y2: line.y + relY2,
  };
}

/**
 * Normalize angle to -179 to 179 degree range
 *
 * Takes any angle in degrees and normalizes it to the range -179 to 179.
 * Ensures the angle is never exactly 180 (converts 180 to -180).
 *
 * @param {number} angle - Angle in degrees (any range)
 * @returns {number} Normalized angle in range -179 to 179
 *
 * @example
 * ```ts
 * normalizeLineRotation(0);    // 0
 * normalizeLineRotation(90);   // 90
 * normalizeLineRotation(180);  // -180
 * normalizeLineRotation(-180); // -180
 * normalizeLineRotation(270);  // -90
 * normalizeLineRotation(360);  // 0
 * normalizeLineRotation(450);  // 90
 * normalizeLineRotation(-270); // 90
 * ```
 */
export function normalizeLineRotation(angle: number): number {
  // Normalize to -180 to 180 range
  let normalized = ((angle % 360) + 360) % 360;

  // Convert to -180 to 180
  if (normalized > 180) {
    normalized -= 360;
  }

  // Ensure never exactly 180 (convert to -180)
  if (normalized === 180) {
    normalized = -180;
  }

  return normalized;
}
