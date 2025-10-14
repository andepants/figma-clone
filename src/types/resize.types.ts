/**
 * Resize Types
 *
 * Type definitions for corner resize handles, resize state, and related data structures.
 * Supports Figma-style corner resizing with real-time collaboration.
 */

/**
 * Corner resize handle positions
 * 4 corners: Northwest, Northeast, Southwest, Southeast
 * @typedef {'nw' | 'ne' | 'sw' | 'se'} ResizeHandle
 */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Fixed anchor point during resize
 * Represents the opposite corner that stays fixed while resizing
 * @interface ResizeAnchor
 * @property {number} x - X coordinate of anchor point (canvas coordinates)
 * @property {number} y - Y coordinate of anchor point (canvas coordinates)
 */
export interface ResizeAnchor {
  x: number;
  y: number;
}

/**
 * Bounds of an object (position and dimensions)
 * Used for tracking resize start and current bounds
 * @interface Bounds
 * @property {number} x - X coordinate of top-left corner
 * @property {number} y - Y coordinate of top-left corner
 * @property {number} width - Width of object
 * @property {number} height - Height of object
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Real-time resize state for collaborative editing
 * Tracks which user is currently resizing which object
 *
 * @interface ResizeState
 * @property {string} objectId - ID of object being resized
 * @property {string} userId - ID of user performing the resize
 * @property {string} username - Display name of user resizing
 * @property {string} color - User's assigned color for visual feedback
 * @property {ResizeHandle} handle - Which corner handle is being dragged
 * @property {Bounds} startBounds - Object bounds when resize started (immutable during resize)
 * @property {Bounds} currentBounds - Current bounds during resize (updated in real-time)
 * @property {ResizeAnchor} anchor - Fixed opposite corner (immutable during resize)
 * @property {number} timestamp - Unix timestamp of last update
 */
export interface ResizeState {
  objectId: string;
  userId: string;
  username: string;
  color: string;
  handle: ResizeHandle;
  startBounds: Bounds;
  currentBounds: Bounds;
  anchor: ResizeAnchor;
  timestamp: number;
}

/**
 * Map of object IDs to their resize states
 * Used for tracking multiple concurrent resizes in real-time
 * Key: objectId, Value: ResizeState
 * @typedef {Record<string, ResizeState>} ResizeStateMap
 */
export type ResizeStateMap = Record<string, ResizeState>;
