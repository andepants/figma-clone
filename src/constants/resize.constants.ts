/**
 * Resize Constants
 *
 * Constants for corner resize handles including sizes, offsets, and cursor styles.
 * Based on Figma's resize handle behavior.
 */

import type { ResizeHandle } from '@/types';

/**
 * Size of each resize handle in pixels (8x8px squares, matching Figma)
 * Note: This is the base size in canvas coordinates. For zoom-aware rendering,
 * use RESIZE_HANDLE_SCREEN_SIZE with inverse scaling.
 */
export const RESIZE_HANDLE_SIZE = 8;

/**
 * Target screen size for resize handles in pixels (zoom-independent)
 * Handles scale inversely with zoom to maintain constant 8px on-screen appearance.
 * Formula: canvasSize = RESIZE_HANDLE_SCREEN_SIZE / zoom
 * Examples:
 * - At 100% zoom (0.25 scale): 8 / 0.25 = 32px canvas → 8px screen
 * - At 200% zoom (0.5 scale):  8 / 0.5  = 16px canvas → 8px screen
 * - At 50% zoom (0.125 scale): 8 / 0.125 = 64px canvas → 8px screen
 */
export const RESIZE_HANDLE_SCREEN_SIZE = 8;

/**
 * Offset distance for handle positioning outside object bounds in pixels
 * Handles are positioned 4px outside the object's edge
 */
export const RESIZE_HANDLE_OFFSET = 4;

/**
 * Minimum size constraint for resized objects (width/height)
 * Set to 1px to allow Figma-like behavior where objects can be resized very small
 * and can smoothly flip when dragged past the anchor point.
 *
 * Note: Previously 10px, but this caused a "pushing" effect when dragging near
 * the anchor point because the minimum size would force the object to extend
 * past the pointer position. Figma allows ~1px minimum for smooth resize/flip.
 */
export const RESIZE_MIN_SIZE = 1;

/**
 * Throttle interval for resize updates to Firebase RTDB in milliseconds
 * Balances real-time responsiveness with network efficiency
 */
export const RESIZE_THROTTLE_MS = 50;

/**
 * Handle position alignment configuration
 * Maps each corner handle to its horizontal and vertical alignment
 * Used to calculate handle positions relative to object bounds
 */
export const RESIZE_HANDLE_POSITIONS: Record<
  ResizeHandle,
  { xAlign: 'left' | 'right'; yAlign: 'top' | 'bottom' }
> = {
  nw: { xAlign: 'left', yAlign: 'top' },
  ne: { xAlign: 'right', yAlign: 'top' },
  sw: { xAlign: 'left', yAlign: 'bottom' },
  se: { xAlign: 'right', yAlign: 'bottom' },
};

/**
 * CSS cursor styles for each resize handle
 * Provides visual feedback for resize direction
 * - nw/se: nwse-resize (↖↘ diagonal)
 * - ne/sw: nesw-resize (↗↙ diagonal)
 */
export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
};
