/**
 * Multi-Select Utility Functions
 *
 * Helper functions for working with multi-select functionality including
 * selection state checks, bounding box calculations, and object filtering.
 */

import type { CanvasObject } from '@/types';

/**
 * Check if an object is currently selected
 *
 * @param objectId - ID of the object to check
 * @param selectedIds - Array of currently selected object IDs
 * @returns True if object is selected
 *
 * @example
 * ```ts
 * const selected = isSelected('obj-1', ['obj-1', 'obj-2']);
 * // => true
 * ```
 */
export function isSelected(objectId: string, selectedIds: string[]): boolean {
  return selectedIds.includes(objectId);
}

/**
 * Check if multiple objects are selected
 *
 * @param selectedIds - Array of currently selected object IDs
 * @returns True if more than one object is selected
 *
 * @example
 * ```ts
 * const hasMulti = isMultiSelect(['obj-1', 'obj-2']);
 * // => true
 * ```
 */
export function isMultiSelect(selectedIds: string[]): boolean {
  return selectedIds.length > 1;
}

/**
 * Get filtered array of selected objects
 *
 * @param objects - All canvas objects
 * @param selectedIds - Array of selected object IDs
 * @returns Array of selected objects
 *
 * @example
 * ```ts
 * const selected = getSelectedObjects(allObjects, ['obj-1', 'obj-3']);
 * // => [object1, object3]
 * ```
 */
export function getSelectedObjects(
  objects: CanvasObject[],
  selectedIds: string[]
): CanvasObject[] {
  return objects.filter((obj) => selectedIds.includes(obj.id));
}

/**
 * Calculate bounding box containing all selected objects
 *
 * Handles all shape types (rectangles, circles, text) and returns
 * the minimum bounding box that contains all selected objects.
 * Returns null if no objects are selected.
 *
 * @param objects - All canvas objects
 * @param selectedIds - Array of selected object IDs
 * @returns Bounding box {x, y, width, height} or null if no selection
 *
 * @example
 * ```ts
 * const bounds = getSelectionBounds(objects, ['obj-1', 'obj-2']);
 * // => { x: 100, y: 50, width: 200, height: 150 }
 * ```
 */
export function getSelectionBounds(
  objects: CanvasObject[],
  selectedIds: string[]
): { x: number; y: number; width: number; height: number } | null {
  const selected = getSelectedObjects(objects, selectedIds);

  if (selected.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selected.forEach((obj) => {
    if (obj.type === 'rectangle') {
      // Rectangle: (x, y) is top-left corner
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    } else if (obj.type === 'circle') {
      // Circle: (x, y) is center point
      minX = Math.min(minX, obj.x - obj.radius);
      minY = Math.min(minY, obj.y - obj.radius);
      maxX = Math.max(maxX, obj.x + obj.radius);
      maxY = Math.max(maxY, obj.y + obj.radius);
    } else if (obj.type === 'text') {
      // Text: (x, y) is top-left corner
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    }
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
