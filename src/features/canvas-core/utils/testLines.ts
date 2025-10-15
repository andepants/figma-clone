/**
 * Test Line Utilities
 *
 * Utilities for testing line rendering by programmatically adding test lines to the canvas.
 * This is a temporary testing utility until the line tool is fully implemented.
 *
 * USAGE:
 * 1. Import this file in CanvasPage.tsx
 * 2. Call addTestLines() in a useEffect
 * 3. Check the canvas to verify lines render correctly
 * 4. Remove when line tool is complete
 */

import type { Line } from '@/types';
import { calculateLineProperties } from './lineHelpers';

/**
 * Create a test line with proper properties calculated from endpoints
 *
 * @param {number} x1 - X coordinate of first endpoint
 * @param {number} y1 - Y coordinate of first endpoint
 * @param {number} x2 - X coordinate of second endpoint
 * @param {number} y2 - Y coordinate of second endpoint
 * @param {string} id - Unique ID for the line
 * @param {string} userId - User ID who created the line
 * @param {Partial<Line>} overrides - Optional property overrides
 * @returns {Line} Complete line object ready for canvas
 *
 * @example
 * ```ts
 * // Create horizontal line from (100, 100) to (300, 100)
 * const line = createTestLine(100, 100, 300, 100, 'test-line-1', 'user123');
 * ```
 */
export function createTestLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  id: string,
  userId: string,
  overrides: Partial<Line> = {}
): Line {
  // Calculate line properties using helper
  const { x, y, points, width, rotation } = calculateLineProperties(x1, y1, x2, y2);

  const timestamp = Date.now();

  return {
    id,
    type: 'line',
    x,
    y,
    points,
    width,
    rotation,
    stroke: '#000000',
    strokeWidth: 2,
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    strokeEnabled: true,
    ...overrides,
  };
}

/**
 * Generate comprehensive test lines covering different angles and positions
 *
 * Returns an array of test lines that verify:
 * - Horizontal lines (0°)
 * - Vertical lines (90° and -90°)
 * - Diagonal lines (45° and -135°)
 * - Correct position calculation (x, y is MIN of endpoints)
 * - Different stroke colors and widths for visual distinction
 *
 * @param {string} userId - User ID who created the lines
 * @returns {Line[]} Array of test line objects
 *
 * @example
 * ```ts
 * const testLines = generateTestLines('user123');
 * testLines.forEach(line => canvasStore.addObject(line));
 * ```
 */
export function generateTestLines(userId: string): Line[] {
  const lines: Line[] = [];

  // Test 1: Horizontal line (0°) - left to right
  // Expected: x=100, y=200, rotation=0
  lines.push(
    createTestLine(
      100, 200,  // Start point
      300, 200,  // End point (same y, increasing x)
      'test-line-horizontal',
      userId,
      { stroke: '#ef4444', strokeWidth: 3 } // Red, thick
    )
  );

  // Test 2: Vertical line (90°) - bottom to top
  // Expected: x=400, y=150, rotation=90
  lines.push(
    createTestLine(
      400, 350,  // Start point (bottom)
      400, 150,  // End point (top, same x, decreasing y)
      'test-line-vertical-up',
      userId,
      { stroke: '#3b82f6', strokeWidth: 3 } // Blue, thick
    )
  );

  // Test 3: Vertical line (-90°) - top to bottom
  // Expected: x=500, y=150, rotation=-90
  lines.push(
    createTestLine(
      500, 150,  // Start point (top)
      500, 350,  // End point (bottom, same x, increasing y)
      'test-line-vertical-down',
      userId,
      { stroke: '#10b981', strokeWidth: 3 } // Green, thick
    )
  );

  // Test 4: Diagonal line (45°) - bottom-left to top-right
  // Expected: x=100, y=400, rotation=45
  lines.push(
    createTestLine(
      100, 550,  // Start point (bottom-left)
      250, 400,  // End point (top-right, increasing x, decreasing y)
      'test-line-diagonal-45',
      userId,
      { stroke: '#f59e0b', strokeWidth: 3 } // Orange, thick
    )
  );

  // Test 5: Diagonal line (-135°) - top-left to bottom-right
  // Expected: x=300, y=400, rotation=-135
  lines.push(
    createTestLine(
      300, 400,  // Start point (top-left)
      450, 550,  // End point (bottom-right, increasing x and y)
      'test-line-diagonal-neg135',
      userId,
      { stroke: '#8b5cf6', strokeWidth: 3 } // Purple, thick
    )
  );

  // Test 6: Diagonal line (135°) - bottom-right to top-left
  // Expected: x=550, y=400, rotation=135
  lines.push(
    createTestLine(
      700, 550,  // Start point (bottom-right)
      550, 400,  // End point (top-left, decreasing x and y)
      'test-line-diagonal-135',
      userId,
      { stroke: '#ec4899', strokeWidth: 3 } // Pink, thick
    )
  );

  // Test 7: Diagonal line (-45°) - top-right to bottom-left
  // Expected: x=550, y=150, rotation=-45
  lines.push(
    createTestLine(
      700, 150,  // Start point (top-right)
      550, 300,  // End point (bottom-left, decreasing x, increasing y)
      'test-line-diagonal-neg45',
      userId,
      { stroke: '#14b8a6', strokeWidth: 3 } // Teal, thick
    )
  );

  // Test 8: Near-horizontal line (small positive angle ~14°)
  // Tests small angles work correctly
  lines.push(
    createTestLine(
      750, 200,  // Start point
      900, 250,  // End point (slightly upward)
      'test-line-slight-angle',
      userId,
      { stroke: '#64748b', strokeWidth: 2 } // Gray, medium
    )
  );

  // Test 9: Line at exactly 180° (should normalize to -180°)
  // Tests normalization edge case
  lines.push(
    createTestLine(
      900, 400,  // Start point
      750, 400,  // End point (exact horizontal, right to left)
      'test-line-180-normalized',
      userId,
      { stroke: '#dc2626', strokeWidth: 4 } // Dark red, very thick
    )
  );

  return lines;
}

/**
 * Add test lines to canvas store
 *
 * Convenience function to add all test lines to the canvas store.
 * Call this from a component (e.g., CanvasPage) to populate test lines.
 *
 * @param {Function} addObject - Canvas store's addObject function
 * @param {string} userId - User ID who created the lines
 *
 * @example
 * ```ts
 * // In CanvasPage.tsx:
 * import { addTestLines } from '@/features/canvas-core/utils/testLines';
 *
 * useEffect(() => {
 *   if (currentUser) {
 *     addTestLines(addObject, currentUser.uid);
 *   }
 * }, [currentUser, addObject]);
 * ```
 */
export function addTestLines(
  addObject: (object: Line) => void,
  userId: string
): void {
  const testLines = generateTestLines(userId);
  testLines.forEach(line => addObject(line));
}

/**
 * Clear test lines from canvas store
 *
 * Removes all test lines (identified by 'test-line-' prefix in ID).
 * Use this to clean up test data when done testing.
 *
 * @param {Line[]} objects - Current canvas objects
 * @param {Function} removeObject - Canvas store's removeObject function
 *
 * @example
 * ```ts
 * // In CanvasPage.tsx:
 * import { clearTestLines } from '@/features/canvas-core/utils/testLines';
 *
 * useEffect(() => {
 *   return () => {
 *     clearTestLines(objects, removeObject);
 *   };
 * }, [objects, removeObject]);
 * ```
 */
export function clearTestLines(
  objects: Line[],
  removeObject: (id: string) => void
): void {
  const testLineIds = objects
    .filter(obj => obj.id.startsWith('test-line-'))
    .map(obj => obj.id);

  testLineIds.forEach(id => removeObject(id));
}
