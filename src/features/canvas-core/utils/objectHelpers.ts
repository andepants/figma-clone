/**
 * Object Helpers
 *
 * Utility functions for canvas object operations.
 */

import type { CanvasObject } from '@/types';

/**
 * Duplicate a canvas object
 *
 * Creates a copy of an object with:
 * - New unique ID
 * - Offset position (+20, +20) to avoid overlap
 * - New timestamps (createdAt, updatedAt)
 * - All other properties preserved
 *
 * @param {CanvasObject} original - The object to duplicate
 * @returns {CanvasObject} New object with updated properties
 *
 * @example
 * ```typescript
 * const original = { id: '1', type: 'rectangle', x: 100, y: 100, ... };
 * const duplicate = duplicateObject(original);
 * // duplicate.id !== original.id
 * // duplicate.x === 120
 * // duplicate.y === 120
 * ```
 */
export function duplicateObject(original: CanvasObject): CanvasObject {
  return {
    ...original,
    id: crypto.randomUUID(),
    x: original.x + 20,
    y: original.y + 20,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
