/**
 * Canvas Types
 *
 * Type definitions for canvas objects, shapes, and related data structures.
 */

/**
 * Available shape types on the canvas
 * @typedef {'rectangle' | 'circle' | 'text'} ShapeType
 */
export type ShapeType = 'rectangle' | 'circle' | 'text';

/**
 * Base properties shared by all canvas objects
 * @interface BaseCanvasObject
 * @property {string} id - Unique identifier for the object
 * @property {ShapeType} type - Type of shape (rectangle, circle, text)
 * @property {number} x - X coordinate on canvas
 * @property {number} y - Y coordinate on canvas
 * @property {string} createdBy - User ID of creator
 * @property {number} createdAt - Unix timestamp of creation
 * @property {number} updatedAt - Unix timestamp of last update
 */
export interface BaseCanvasObject {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Rectangle shape object
 * @interface Rectangle
 * @extends BaseCanvasObject
 * @property {'rectangle'} type - Discriminator for type checking
 * @property {number} width - Width of rectangle
 * @property {number} height - Height of rectangle
 * @property {string} fill - Fill color (hex, rgb, or color name)
 */
export interface Rectangle extends BaseCanvasObject {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
}

/**
 * Circle shape object (placeholder for Phase 2)
 * @interface Circle
 * @extends BaseCanvasObject
 * @property {'circle'} type - Discriminator for type checking
 * @property {number} radius - Radius of circle
 * @property {string} fill - Fill color (hex, rgb, or color name)
 */
export interface Circle extends BaseCanvasObject {
  type: 'circle';
  radius: number;
  fill: string;
}

/**
 * Text shape object (placeholder for Phase 2)
 * @interface Text
 * @extends BaseCanvasObject
 * @property {'text'} type - Discriminator for type checking
 * @property {string} content - Text content
 * @property {number} fontSize - Font size in pixels
 * @property {string} fontFamily - Font family name
 * @property {string} fill - Text color (hex, rgb, or color name)
 */
export interface Text extends BaseCanvasObject {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

/**
 * Union type of all possible canvas objects
 * Discriminated union using the 'type' property
 * @typedef {Rectangle | Circle | Text} CanvasObject
 */
export type CanvasObject = Rectangle | Circle | Text;

/**
 * Real-time drag state for collaborative editing
 * Tracks which user is currently dragging which object
 *
 * @interface DragState
 * @property {string} userId - ID of user performing the drag
 * @property {number} x - Current X position during drag (canvas coordinates)
 * @property {number} y - Current Y position during drag (canvas coordinates)
 * @property {string} username - Display name of user dragging
 * @property {string} color - User's assigned color for visual feedback
 * @property {number} startedAt - Unix timestamp when drag started
 * @property {number} lastUpdate - Unix timestamp of last position update
 */
export interface DragState {
  userId: string;
  x: number;
  y: number;
  username: string;
  color: string;
  startedAt: number;
  lastUpdate: number;
}

/**
 * Map of object IDs to their drag states
 * Used for tracking multiple concurrent drags
 * @typedef {Record<string, DragState>} DragStateMap
 */
export type DragStateMap = Record<string, DragState>;

/**
 * Real-time selection state for collaborative editing
 * Tracks which object each user has selected
 *
 * @interface SelectionState
 * @property {string | null} objectId - ID of selected object, null if nothing selected
 * @property {number} timestamp - Unix timestamp of selection change
 */
export interface SelectionState {
  objectId: string | null;
  timestamp: number;
}

/**
 * Map of user IDs to their selection states
 * Used for tracking all users' selections
 * @typedef {Record<string, SelectionState>} SelectionStateMap
 */
export type SelectionStateMap = Record<string, SelectionState>;

/**
 * Remote selection info with user details for rendering
 * @interface RemoteSelection
 * @property {string} userId - ID of user who made selection
 * @property {string} objectId - ID of selected object
 * @property {string} username - Display name of user
 * @property {string} color - User's assigned color
 */
export interface RemoteSelection {
  userId: string;
  objectId: string;
  username: string;
  color: string;
}
