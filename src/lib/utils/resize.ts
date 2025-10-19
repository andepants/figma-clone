/**
 * Resize Utility Functions
 *
 * Mathematical functions for calculating resize operations with anchored corners.
 * All functions handle coordinate transforms and minimum size constraints.
 */

import type { ResizeHandle, ResizeAnchor, Bounds } from '@/types';
import {
  RESIZE_MIN_SIZE,
  RESIZE_HANDLE_OFFSET,
  RESIZE_HANDLE_POSITIONS,
} from '@/constants';

/**
 * Get the anchor point (opposite corner) for a given resize handle
 *
 * The anchor point is the corner that stays fixed during resize.
 * When dragging a corner handle, the opposite corner remains stationary.
 *
 * ASCII diagram showing anchor points:
 * ```
 *   anchor(SE)              anchor(SW)
 *        ●-------------------●
 *        |                   |
 *        |      Object       |
 *        |                   |
 *        ●-------------------●
 *   anchor(NE)              anchor(NW)
 * ```
 *
 * @param handle - Which corner handle is being dragged
 * @param bounds - Current object bounds
 * @returns The coordinates of the fixed opposite corner
 *
 * @example
 * // Dragging NW handle → SE corner is anchor
 * getAnchorPoint('nw', { x: 0, y: 0, width: 100, height: 100 })
 * // Returns: { x: 100, y: 100 }
 *
 * @example
 * // Dragging SE handle → NW corner is anchor
 * getAnchorPoint('se', { x: 0, y: 0, width: 100, height: 100 })
 * // Returns: { x: 0, y: 0 }
 */
export function getAnchorPoint(
  handle: ResizeHandle,
  bounds: Bounds
): ResizeAnchor {
  switch (handle) {
    case 'nw':
      // Dragging top-left → anchor is bottom-right (SE)
      return { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
    case 'ne':
      // Dragging top-right → anchor is bottom-left (SW)
      return { x: bounds.x, y: bounds.y + bounds.height };
    case 'sw':
      // Dragging bottom-left → anchor is top-right (NE)
      return { x: bounds.x + bounds.width, y: bounds.y };
    case 'se':
      // Dragging bottom-right → anchor is top-left (NW)
      return { x: bounds.x, y: bounds.y };
  }
}

/**
 * Calculate new bounds based on resize handle drag position
 *
 * Takes the fixed anchor point and current pointer position to calculate
 * the new bounds. Enforces minimum size constraints and ensures positive dimensions.
 *
 * ASCII diagram showing resize calculation:
 * ```
 *   anchor (fixed)
 *        ●-------------------┐
 *        |                   |
 *        |    New Bounds     | height = |pointer.y - anchor.y|
 *        |                   |
 *        └-------------------● currentPointer (dragged)
 *          width = |pointer.x - anchor.x|
 * ```
 *
 * @param handle - Which corner handle is being dragged
 * @param anchor - Fixed opposite corner coordinates
 * @param currentPointer - Current mouse/pointer position (canvas coordinates)
 * @returns New bounds with enforced minimum size
 *
 * @example
 * // Drag NW handle left and up (enlarging)
 * calculateResizedBounds('nw', { x: 100, y: 100 }, { x: 50, y: 50 })
 * // Returns: { x: 50, y: 50, width: 50, height: 50 }
 *
 * @example
 * // Try to resize to 5x5 → clamped to minimum (10x10)
 * calculateResizedBounds('se', { x: 0, y: 0 }, { x: 5, y: 5 })
 * // Returns: { x: 0, y: 0, width: 10, height: 10 }
 */
export function calculateResizedBounds(
  _handle: ResizeHandle,
  anchor: ResizeAnchor,
  currentPointer: { x: number; y: number }
): Bounds {
  // Calculate raw width and height using absolute values
  // (ensures positive dimensions regardless of drag direction)
  const width = Math.abs(currentPointer.x - anchor.x);
  const height = Math.abs(currentPointer.y - anchor.y);

  // Calculate top-left corner position
  // Use Math.min to handle cases where pointer crosses anchor point
  const x = Math.min(currentPointer.x, anchor.x);
  const y = Math.min(currentPointer.y, anchor.y);

  // Return bounds with minimum size enforcement
  return {
    x,
    y,
    width: Math.max(width, RESIZE_MIN_SIZE),
    height: Math.max(height, RESIZE_MIN_SIZE),
  };
}

/**
 * Get the center position for rendering a resize handle
 *
 * Calculates where to position a handle component based on the corner
 * and object bounds. Accounts for handle size and offset from edge.
 *
 * COORDINATE SYSTEM:
 * Returns positions in LOCAL coordinates (before any transforms are applied).
 * When handles are rendered inside a transformed Group (with rotation/scale),
 * Konva automatically applies the transform to these local positions.
 * This ensures handles follow the shape's rotation and flips correctly.
 *
 * @param handle - Which corner handle to position
 * @param bounds - Current object bounds in LOCAL coordinates (untransformed)
 * @param handleSize - Optional dynamic handle size for zoom-aware positioning (defaults to RESIZE_HANDLE_SIZE)
 * @returns Center coordinates for the handle in LOCAL coordinates (x, y)
 *
 * @example
 * // Get position for NW (top-left) handle with default size
 * getHandlePosition('nw', { x: 100, y: 100, width: 200, height: 150 })
 * // Returns: { x: 96, y: 96 } (offset outside top-left corner)
 *
 * @example
 * // Get position for SE (bottom-right) handle with dynamic size
 * getHandlePosition('se', { x: 100, y: 100, width: 200, height: 150 }, 16)
 * // Returns: { x: 304, y: 254 } (offset outside bottom-right corner)
 */
export function getHandlePosition(
  handle: ResizeHandle,
  bounds: Bounds
): { x: number; y: number } {
  const position = RESIZE_HANDLE_POSITIONS[handle];
  const offset = RESIZE_HANDLE_OFFSET;

  // Calculate x position based on horizontal alignment
  let x: number;
  if (position.xAlign === 'left') {
    // Left edge: position at x minus offset (outside object)
    x = bounds.x - offset;
  } else {
    // Right edge: position at x + width plus offset
    x = bounds.x + bounds.width + offset;
  }

  // Calculate y position based on vertical alignment
  let y: number;
  if (position.yAlign === 'top') {
    // Top edge: position at y minus offset (outside object)
    y = bounds.y - offset;
  } else {
    // Bottom edge: position at y + height plus offset
    y = bounds.y + bounds.height + offset;
  }

  return { x, y };
}

/**
 * Validate if resized bounds meet minimum size requirements
 *
 * Checks both width and height against minimum size constant.
 * Prevents negative dimensions and ensures objects remain interactive.
 *
 * @param bounds - Bounds to validate
 * @returns True if bounds are valid (both dimensions >= minimum)
 *
 * @example
 * isValidResize({ x: 0, y: 0, width: 50, height: 50 }) // true
 * isValidResize({ x: 0, y: 0, width: 5, height: 50 }) // false (width too small)
 * isValidResize({ x: 0, y: 0, width: -10, height: 50 }) // false (negative width)
 */
export function isValidResize(bounds: Bounds): boolean {
  return bounds.width >= RESIZE_MIN_SIZE && bounds.height >= RESIZE_MIN_SIZE;
}
