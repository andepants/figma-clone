/**
 * Edge Detection Utility
 *
 * Detects which edge/corner of a rectangle is under the cursor position.
 * Used for resize cursors and edge dragging interactions.
 */

/**
 * Edge/corner types for resize operations
 */
export type EdgeType =
  | 'top' | 'right' | 'bottom' | 'left'           // Edges
  | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'  // Corners
  | null;  // No edge

/**
 * Cursor styles for each edge type
 */
export const EDGE_CURSORS: Record<NonNullable<EdgeType>, string> = {
  'top': 'ns-resize',
  'bottom': 'ns-resize',
  'left': 'ew-resize',
  'right': 'ew-resize',
  'top-left': 'nwse-resize',
  'top-right': 'nesw-resize',
  'bottom-right': 'nwse-resize',
  'bottom-left': 'nesw-resize',
};

/**
 * Detect which edge/corner of a rectangle is under the cursor
 *
 * @param cursorX - Cursor X position in canvas coordinates
 * @param cursorY - Cursor Y position in canvas coordinates
 * @param rect - Rectangle bounds { x, y, width, height }
 * @param threshold - Detection distance from edge in pixels (default: 8)
 * @returns Edge type or null if not near any edge
 */
export function detectEdge(
  cursorX: number,
  cursorY: number,
  rect: { x: number; y: number; width: number; height: number },
  threshold: number = 8
): EdgeType {
  const { x, y, width, height } = rect;

  // Check if cursor is within the overall bounds + threshold
  const inHorizontalRange = cursorX >= x - threshold && cursorX <= x + width + threshold;
  const inVerticalRange = cursorY >= y - threshold && cursorY <= y + height + threshold;

  if (!inHorizontalRange || !inVerticalRange) {
    return null;  // Not near rectangle
  }

  // Detect proximity to each edge
  const nearTop = Math.abs(cursorY - y) <= threshold;
  const nearBottom = Math.abs(cursorY - (y + height)) <= threshold;
  const nearLeft = Math.abs(cursorX - x) <= threshold;
  const nearRight = Math.abs(cursorX - (x + width)) <= threshold;

  // Corners take priority (check corners first)
  if (nearTop && nearLeft) return 'top-left';
  if (nearTop && nearRight) return 'top-right';
  if (nearBottom && nearLeft) return 'bottom-left';
  if (nearBottom && nearRight) return 'bottom-right';

  // Edges
  if (nearTop) return 'top';
  if (nearBottom) return 'bottom';
  if (nearLeft) return 'left';
  if (nearRight) return 'right';

  return null;  // Inside rectangle, not near edge
}

/**
 * Get cursor style for an edge type
 */
export function getCursorForEdge(edge: EdgeType): string | null {
  return edge ? EDGE_CURSORS[edge] : null;
}
