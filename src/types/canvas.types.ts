/**
 * Canvas Types
 *
 * Type definitions for canvas objects, shapes, and related data structures.
 */

/**
 * Available shape types on the canvas
 * @typedef {'rectangle' | 'circle' | 'text' | 'line' | 'group' | 'image'} ShapeType
 */
export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'group' | 'image';

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
 * @property {number} [zIndex] - Z-index for layer ordering (higher = front, lower = back) - Synced to Firebase for persistence
 * @property {string} [name] - Optional user-defined name for the object
 * @property {boolean} [visible] - Visibility state (default: true) - Controls whether object is rendered on canvas
 * @property {boolean} [locked] - Lock state (default: false) - Locked objects cannot be selected, moved, or edited on canvas
 * @property {string | null} [parentId] - ID of parent object for hierarchy (null or undefined = root level)
 * @property {boolean} [isCollapsed] - Collapse state for hierarchy (default: false) - If true, children are hidden in layers panel
 */
export interface BaseCanvasObject {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  zIndex?: number;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  parentId?: string | null;
  isCollapsed?: boolean;
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
 *
 * Future: arc angles, segments, etc.
 * Circles always maintain aspect ratio, no lock needed
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CircleProperties {}

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
 * Line shape object
 * @interface Line
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @property {'line'} type - Discriminator for type checking
 * @property {number} x - X coordinate of lowest point (MIN of both endpoints)
 * @property {number} y - Y coordinate of lowest point (MIN of both endpoints)
 * @property {[number, number, number, number]} points - Line endpoints relative to (x, y): [x1, y1, x2, y2]
 * @property {number} width - Line length/distance calculated from points (Euclidean distance)
 * @property {number} rotation - Angle in degrees, normalized to range -179 to 179 (never exactly 180)
 *                                Calculated using Math.atan2(dy, dx) * (180 / Math.PI)
 *                                If result === 180, normalize to -180
 * @property {string} stroke - Line color (hex, rgb, or color name) (default: '#000000')
 * @property {number} strokeWidth - Line thickness in pixels (default: 2)
 *
 * @remarks
 * Lines are 1-dimensional objects with NO height property - only width (length).
 * The position (x, y) is always the MIN of both endpoints for consistent bounding box behavior.
 * Points array contains coordinates relative to this position, not absolute canvas coordinates.
 * Rotation must be in range -179 to 179 degrees to avoid ambiguity at 180/-180.
 */
export interface Line extends BaseCanvasObject, VisualProperties {
  type: 'line';
  points: [number, number, number, number];
  width: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
}

/**
 * Image storage types
 * @typedef {'dataURL' | 'storage'} ImageStorageType
 *
 * @remarks
 * - 'dataURL': Image stored inline as base64 data URL (for small images <100KB)
 * - 'storage': Image stored in Firebase Storage with URL reference (for larger images)
 */
export type ImageStorageType = 'dataURL' | 'storage';

/**
 * Image-specific properties
 * @interface ImageProperties
 * @property {boolean} [lockAspectRatio] - Maintain aspect ratio when resizing (default: true)
 */
export interface ImageProperties {
  lockAspectRatio?: boolean;
}

/**
 * Image shape object
 * @interface ImageObject
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends ImageProperties
 * @property {'image'} type - Discriminator for type checking
 * @property {string} src - Image source (data URL or Firebase Storage URL)
 * @property {number} naturalWidth - Original image width in pixels
 * @property {number} naturalHeight - Original image height in pixels
 * @property {number} width - Display width on canvas
 * @property {number} height - Display height on canvas
 * @property {string} fileName - Original file name
 * @property {number} fileSize - File size in bytes (max 10MB = 10485760)
 * @property {string} mimeType - MIME type (e.g., 'image/png', 'image/jpeg')
 * @property {ImageStorageType} storageType - Storage strategy ('dataURL' or 'storage')
 * @property {string} [storagePath] - Firebase Storage path (only if storageType === 'storage')
 *
 * @remarks
 * Images support two storage strategies:
 * - Small images (<100KB): Stored inline as base64 data URLs in RTDB for fast loading
 * - Large images (>=100KB): Stored in Firebase Storage, only URL stored in RTDB
 *
 * The lockAspectRatio property defaults to true to maintain image proportions.
 * Unlike rectangles where aspect ratio lock is optional, images should almost always
 * maintain their aspect ratio to prevent distortion.
 */
export interface ImageObject extends BaseCanvasObject, VisualProperties, ImageProperties {
  type: 'image';
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: ImageStorageType;
  storagePath?: string;
}

/**
 * Group object (container for other objects)
 * @interface Group
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @property {'group'} type - Discriminator for type checking
 *
 * @remarks
 * Groups are container objects with NO visual representation on canvas.
 * They only exist in the hierarchy to organize other objects.
 * Position (x, y) can be calculated from children's bounding box if needed.
 * Groups inherit VisualProperties for consistency but these are not rendered.
 * Transform properties (rotation, scale, skew) can affect grouped children.
 * Like Figma, groups are purely organizational - they don't render fill/stroke.
 * The isCollapsed property controls whether children are visible in the layers panel.
 */
export interface Group extends BaseCanvasObject, VisualProperties {
  type: 'group';
  // Groups inherit BaseCanvasObject properties:
  // - id, createdBy, createdAt, updatedAt, zIndex
  // - name (e.g., "Group 1", "Group 2")
  // - visible (groups can be hidden, which hides all children)
  // - locked (locked groups cannot be edited, locks cascade to children)
  // - parentId (groups can be nested within other groups)
  // - isCollapsed (hides children in layers panel when true)
  //
  // Groups inherit VisualProperties for consistency:
  // - Transform properties (rotation, opacity, scale, skew)
  // - Stroke/shadow properties (not rendered, but kept for type consistency)
}

/**
 * Union type of all possible canvas objects
 * Discriminated union using the 'type' property
 * @typedef {Rectangle | Circle | Text | Line | Group | ImageObject} CanvasObject
 */
export type CanvasObject = Rectangle | Circle | Text | Line | Group | ImageObject;

/**
 * Helper type for objects with resolved children
 * Used in UI layer for rendering hierarchy in layers panel
 *
 * Intersection type combining CanvasObject with hierarchy metadata.
 * Cannot use 'extends' with union types, so we use intersection operator (&).
 *
 * @typedef {CanvasObject & HierarchyMetadata} CanvasObjectWithChildren
 * @property {CanvasObjectWithChildren[]} children - Array of child objects (empty if no children)
 * @property {number} depth - Hierarchy depth (0 = root, 1 = child, 2 = grandchild, etc.)
 */
export type CanvasObjectWithChildren = CanvasObject & {
  children: CanvasObjectWithChildren[];
  depth: number;
};

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
export function hasDimensions(shape: CanvasObject): shape is Rectangle | Text | ImageObject {
  return shape.type === 'rectangle' || shape.type === 'text' || shape.type === 'image';
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
  return shape.type === 'rectangle' || shape.type === 'text' || shape.type === 'image';
}

/**
 * Type guard: Check if shape is text with text-specific properties
 */
export function isTextShape(shape: CanvasObject): shape is Text {
  return shape.type === 'text';
}

/**
 * Type guard: Check if shape is a line
 */
export function isLineShape(shape: CanvasObject): shape is Line {
  return shape.type === 'line';
}

/**
 * Type guard: Check if object is a group
 */
export function isGroupShape(shape: CanvasObject): shape is Group {
  return shape.type === 'group';
}

/**
 * Type guard: Check if object is an image
 */
export function isImageShape(shape: CanvasObject): shape is ImageObject {
  return shape.type === 'image';
}
