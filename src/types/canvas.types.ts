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
 * Visual properties shared by all canvas objects
 * These properties are optional for backward compatibility
 * @interface VisualProperties
 */
export interface VisualProperties {
  // Transform properties (all shapes)
  rotation?: number;           // Degrees: 0-360
  opacity?: number;            // 0-1, default 1
  scaleX?: number;             // Scale factor, default 1
  scaleY?: number;             // Scale factor, default 1
  skewX?: number;              // Skew angle in degrees
  skewY?: number;              // Skew angle in degrees

  // Stroke properties (all shapes)
  stroke?: string;             // Color
  strokeWidth?: number;        // Pixels
  strokeEnabled?: boolean;     // Toggle stroke on/off

  // Shadow properties (all shapes)
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  shadowEnabled?: boolean;
}

/**
 * Rectangle-specific properties
 * @interface RectangleProperties
 */
export interface RectangleProperties {
  cornerRadius?: number | [number, number, number, number]; // Uniform or per-corner [TL, TR, BR, BL]
  lockAspectRatio?: boolean;   // Maintain aspect ratio when resizing
}

/**
 * Circle-specific properties
 * @interface CircleProperties
 */
export interface CircleProperties {
  // Future: arc angles, segments, etc.
  // Circles always maintain aspect ratio, no lock needed
}

/**
 * Text-specific properties
 * @interface TextProperties
 * @property {number | string} [fontWeight] - Font weight: 100-900 or 'normal', 'bold' (default: 400)
 * @property {'normal' | 'italic'} [fontStyle] - Font style (default: 'normal')
 * @property {'left' | 'center' | 'right'} [textAlign] - Horizontal text alignment (default: 'left')
 * @property {'none' | 'underline' | 'line-through'} [textDecoration] - Text decoration (default: 'none')
 * @property {number} [letterSpacing] - Letter spacing in pixels (default: 0, range: -20 to 100)
 * @property {number} [lineHeight] - Line height multiplier (default: 1.2, range: 0.5 to 3.0)
 * @property {number} [paragraphSpacing] - Space between paragraphs in pixels (default: 0)
 * @property {'none' | 'uppercase' | 'lowercase' | 'capitalize'} [textTransform] - Text case transformation (default: 'none')
 */
export interface TextProperties {
  fontWeight?: number | string;  // 100-900 or 'normal', 'bold'
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;        // In pixels, can be negative
  lineHeight?: number;           // Line height multiplier (1.5 = 150%)
  paragraphSpacing?: number;     // Space between paragraphs in pixels
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

/**
 * Rectangle shape object
 * @interface Rectangle
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends RectangleProperties
 * @property {'rectangle'} type - Discriminator for type checking
 * @property {number} width - Width of rectangle
 * @property {number} height - Height of rectangle
 * @property {string} fill - Fill color (hex, rgb, or color name)
 */
export interface Rectangle extends BaseCanvasObject, VisualProperties, RectangleProperties {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
}

/**
 * Circle shape object
 * @interface Circle
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends CircleProperties
 * @property {'circle'} type - Discriminator for type checking
 * @property {number} radius - Radius of circle
 * @property {string} fill - Fill color (hex, rgb, or color name)
 */
export interface Circle extends BaseCanvasObject, VisualProperties, CircleProperties {
  type: 'circle';
  radius: number;
  fill: string;
}

/**
 * Text shape object
 * @interface Text
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends TextProperties
 * @property {'text'} type - Discriminator for type checking
 * @property {string} text - Text content to display
 * @property {number} fontSize - Font size in pixels (default: 24)
 * @property {string} fontFamily - Font family name (default: 'Inter')
 * @property {string} fill - Text color (hex, rgb, or color name)
 * @property {number} width - Fixed width for text box (text wraps/clips within bounds)
 * @property {number} height - Fixed height for text box (text clips if exceeds bounds)
 * @property {'left' | 'center' | 'right'} [align] - Text alignment within width
 * @property {'top' | 'middle' | 'bottom'} [verticalAlign] - Vertical alignment
 * @property {'word' | 'char' | 'none'} [wrap] - Text wrapping mode
 */
export interface Text extends BaseCanvasObject, VisualProperties, TextProperties {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width: number;
  height: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wrap?: 'word' | 'char' | 'none';
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
 * Tracks which objects each user has selected (supports multi-select)
 *
 * @interface SelectionState
 * @property {string[]} objectIds - IDs of selected objects (empty array if nothing selected)
 * @property {number} timestamp - Unix timestamp of selection change
 */
export interface SelectionState {
  objectIds: string[];
  timestamp: number;
}

/**
 * Map of user IDs to their selection states
 * Used for tracking all users' selections
 * @typedef {Record<string, SelectionState>} SelectionStateMap
 */
export type SelectionStateMap = Record<string, SelectionState>;

/**
 * Remote selection info with user details for rendering (supports multi-select)
 * @interface RemoteSelection
 * @property {string} userId - ID of user who made selection
 * @property {string[]} objectIds - IDs of selected objects
 * @property {string} username - Display name of user
 * @property {string} color - User's assigned color
 */
export interface RemoteSelection {
  userId: string;
  objectIds: string[];
  username: string;
  color: string;
}

/**
 * Type guard: Check if shape has dimensional properties (width, height)
 */
export function hasDimensions(shape: CanvasObject): shape is Rectangle | Text {
  return shape.type === 'rectangle' || shape.type === 'text';
}

/**
 * Type guard: Check if shape has radius property
 */
export function hasRadius(shape: CanvasObject): shape is Circle {
  return shape.type === 'circle';
}

/**
 * Type guard: Check if shape supports corner radius
 */
export function hasCornerRadius(shape: CanvasObject): shape is Rectangle {
  return shape.type === 'rectangle';
}

/**
 * Type guard: Check if shape supports aspect ratio lock
 */
export function supportsAspectRatioLock(shape: CanvasObject): boolean {
  return shape.type === 'rectangle' || shape.type === 'text';
}

/**
 * Type guard: Check if shape is text with text-specific properties
 */
export function isTextShape(shape: CanvasObject): shape is Text {
  return shape.type === 'text';
}
