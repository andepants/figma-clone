/**
 * Layer Naming Utility
 *
 * Smart name generation for canvas objects with gap-filling algorithm.
 * Generates human-readable names like "Rectangle 1", "Circle 2", etc.
 * Automatically fills gaps in numbering sequence (e.g., if 1 and 3 exist, generates 2).
 *
 * @module layerNaming
 */

import type { CanvasObject, ShapeType } from '@/types/canvas.types';

/**
 * Get base name for shape type
 *
 * Returns a human-readable name for each shape type that will be used
 * as the prefix for auto-generated layer names.
 *
 * @param type - Shape type
 * @returns Human-readable base name
 *
 * @example
 * getBaseName('rectangle') // 'Rectangle'
 * getBaseName('circle')    // 'Circle'
 * getBaseName('text')      // 'Text'
 * getBaseName('line')      // 'Line'
 * getBaseName('group')     // 'Group'
 */
export function getBaseName(type: ShapeType): string {
  const nameMap: Record<ShapeType, string> = {
    rectangle: 'Rectangle',
    circle: 'Circle',
    text: 'Text',
    line: 'Line',
    group: 'Group',
  };
  return nameMap[type] || 'Object';
}

/**
 * Parse layer number from name
 *
 * Extracts the numeric suffix from auto-generated layer names.
 * Only matches the pattern "Word Number" (e.g., "Rectangle 5").
 * Custom names (e.g., "My Shape") return null.
 *
 * @param name - Layer name (e.g., "Rectangle 5")
 * @returns Number or null if not auto-generated
 *
 * @example
 * parseLayerNumber("Rectangle 5")    // 5
 * parseLayerNumber("My Shape")       // null
 * parseLayerNumber("Circle 123")     // 123
 * parseLayerNumber(undefined)        // null
 * parseLayerNumber("Text")           // null (no number)
 * parseLayerNumber("Rectangle 5 v2") // null (extra text after number)
 */
export function parseLayerNumber(name: string | undefined): number | null {
  if (!name) return null;

  // Match pattern: "Word Number" (e.g., "Rectangle 5")
  // ^[A-Za-z]+ : Starts with one or more letters
  // \s+        : Followed by whitespace
  // (\d+)$     : Ends with one or more digits (captured)
  const match = name.match(/^[A-Za-z]+\s+(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Generate layer name with gap-filling
 *
 * Finds the lowest available number for the specified shape type.
 * Uses a gap-filling algorithm to reuse numbers from deleted objects.
 *
 * Algorithm:
 * 1. Filter objects to same type
 * 2. Extract numbers from auto-generated names only (ignores custom names)
 * 3. Sort numbers in ascending order
 * 4. Find first gap in sequence, or use next sequential number
 *
 * Performance: O(n log n) for sorting, efficient for 100+ objects
 *
 * @param type - Shape type
 * @param objects - All canvas objects
 * @returns Generated name (e.g., "Rectangle 2")
 *
 * @example
 * // No existing objects
 * generateLayerName('rectangle', [])
 * // Returns: "Rectangle 1"
 *
 * @example
 * // Existing: Rectangle 1, Rectangle 2, Rectangle 3
 * generateLayerName('rectangle', objects)
 * // Returns: "Rectangle 4" (next sequential)
 *
 * @example
 * // Existing: Rectangle 1, Rectangle 3 (gap at 2)
 * generateLayerName('rectangle', objects)
 * // Returns: "Rectangle 2" (fills gap)
 *
 * @example
 * // Existing: Rectangle 1, "My Shape", Rectangle 3
 * generateLayerName('rectangle', objects)
 * // Returns: "Rectangle 2" (custom names ignored)
 *
 * @example
 * // Mixed types: Rectangle 1, Circle 1, Rectangle 3
 * generateLayerName('rectangle', objects)
 * // Returns: "Rectangle 2" (independent numbering per type)
 */
export function generateLayerName(
  type: ShapeType,
  objects: CanvasObject[]
): string {
  const baseName = getBaseName(type);

  // Filter to same type
  const sameTypeObjects = objects.filter((obj) => obj.type === type);

  // Extract existing numbers (only from auto-generated names)
  // Custom names (e.g., "My Shape") are filtered out by parseLayerNumber
  const existingNumbers = sameTypeObjects
    .map((obj) => parseLayerNumber(obj.name))
    .filter((num): num is number => num !== null)
    .sort((a, b) => a - b);

  // Find lowest available number (including gaps)
  let nextNumber = 1;
  for (const num of existingNumbers) {
    if (num === nextNumber) {
      // This number is taken, try next
      nextNumber++;
    } else if (num > nextNumber) {
      // Found a gap - use nextNumber
      break;
    }
    // if num < nextNumber, skip it (duplicate or lower number, shouldn't happen but handles edge case)
  }

  return `${baseName} ${nextNumber}`;
}
