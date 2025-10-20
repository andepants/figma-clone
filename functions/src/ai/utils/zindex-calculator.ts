/**
 * Z-Index Calculator
 *
 * Calculates z-index values for new canvas objects to ensure they appear on top.
 * Supports both single object creation and batch operations with order preservation.
 */

import { CanvasObject } from '../../types.js';

/**
 * Get the maximum z-index from existing objects
 *
 * @param objects - Array of existing canvas objects
 * @returns Maximum z-index value (0 if no objects or all undefined)
 *
 * @example
 * const objects = [
 *   { id: '1', zIndex: 0, ... },
 *   { id: '2', zIndex: 5, ... },
 *   { id: '3', zIndex: 3, ... },
 * ];
 * const max = getMaxZIndex(objects);
 * // max === 5
 */
export function getMaxZIndex(objects: CanvasObject[]): number {
  if (objects.length === 0) {
    return 0;
  }

  // Filter out undefined/null zIndex values and get max
  const zIndexes = objects
    .map((obj) => obj.zIndex ?? 0)
    .filter((z) => Number.isFinite(z) && z >= 0);

  if (zIndexes.length === 0) {
    return 0;
  }

  return Math.max(...zIndexes);
}

/**
 * Get next available z-index (max + 1)
 *
 * New objects should have the highest z-index to appear on top.
 *
 * @param objects - Array of existing canvas objects
 * @returns Next z-index value (max + 1)
 *
 * @example
 * const objects = [
 *   { id: '1', zIndex: 0, ... },
 *   { id: '2', zIndex: 5, ... },
 * ];
 * const next = getNextZIndex(objects);
 * // next === 6
 *
 * @example
 * // Empty canvas
 * const next = getNextZIndex([]);
 * // next === 0 (first object)
 */
export function getNextZIndex(objects: CanvasObject[]): number {
  return getMaxZIndex(objects) + 1;
}

/**
 * Get batch of z-indexes for multiple objects
 *
 * Preserves creation order:
 * - First object = lowest z-index in batch (but higher than existing)
 * - Last object = highest z-index in batch (on top)
 *
 * @param objects - Array of existing canvas objects
 * @param count - Number of new objects to create
 * @returns Array of z-index values [startZ, startZ+1, ..., startZ+count-1]
 *
 * @example
 * // Create 3 new objects on canvas with max z-index = 5
 * const zIndexes = getBatchZIndexes(objects, 3);
 * // zIndexes === [6, 7, 8]
 * // Object 0 gets z-index 6 (middle of batch)
 * // Object 1 gets z-index 7
 * // Object 2 gets z-index 8 (on top)
 *
 * @example
 * // Empty canvas
 * const zIndexes = getBatchZIndexes([], 3);
 * // zIndexes === [0, 1, 2]
 */
export function getBatchZIndexes(
  objects: CanvasObject[],
  count: number
): number[] {
  if (count <= 0) {
    return [];
  }

  const startZ = getNextZIndex(objects);
  return Array.from({ length: count }, (_, i) => startZ + i);
}

/**
 * Validate z-index value
 *
 * Ensures z-index is a non-negative finite number.
 *
 * @param zIndex - Z-index value to validate
 * @returns True if valid
 *
 * @example
 * isValidZIndex(5);       // true
 * isValidZIndex(0);       // true
 * isValidZIndex(-1);      // false (negative)
 * isValidZIndex(NaN);     // false
 * isValidZIndex(Infinity); // false
 */
export function isValidZIndex(zIndex: number): boolean {
  return Number.isFinite(zIndex) && zIndex >= 0;
}

/**
 * Normalize z-index value
 *
 * Converts invalid z-index values to 0 (default).
 * Used for defensive programming when reading from Firebase.
 *
 * @param zIndex - Z-index value (may be undefined, null, NaN, negative, etc.)
 * @returns Valid z-index (defaults to 0)
 *
 * @example
 * normalizeZIndex(5);        // 5
 * normalizeZIndex(undefined); // 0
 * normalizeZIndex(null);     // 0
 * normalizeZIndex(-5);       // 0
 * normalizeZIndex(NaN);      // 0
 */
export function normalizeZIndex(
  zIndex: number | undefined | null
): number {
  if (zIndex === undefined || zIndex === null) {
    return 0;
  }

  if (!isValidZIndex(zIndex)) {
    return 0;
  }

  return zIndex;
}
