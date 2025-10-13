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
