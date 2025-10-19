/**
 * Coordinate Utilities
 *
 * Utilities for converting between screen coordinates and canvas coordinates.
 * Handles transformations for pan and zoom.
 */

import type Konva from 'konva';

/**
 * Point in 2D space
 * @interface Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Convert screen coordinates to canvas coordinates
 *
 * Takes into account stage position (pan) and scale (zoom) to convert
 * mouse/pointer coordinates to the actual canvas coordinate system.
 *
 * @param {Konva.Stage | null} stage - The Konva stage instance
 * @param {Point} screenPoint - Point in screen coordinates
 * @returns {Point} Point in canvas coordinates
 *
 * @example
 * ```ts
 * const canvasPoint = screenToCanvasCoords(stage, { x: 100, y: 200 });
 * // If stage is zoomed 2x and panned, canvasPoint will be adjusted accordingly
 * ```
 */
export function screenToCanvasCoords(
  stage: Konva.Stage | null,
  screenPoint: Point
): Point {
  // If no stage, return screen coords unchanged
  if (!stage) {
    return screenPoint;
  }

  // Get the inverse transform to convert screen to canvas coords
  const transform = stage.getAbsoluteTransform().copy().invert();

  // Apply the transform to the screen point
  return transform.point(screenPoint);
}

/**
 * Get the center of the currently visible viewport in canvas coordinates
 *
 * Calculates the center point of what the user can currently see,
 * accounting for pan and zoom transformations.
 * Used as fallback paste position when mouse is off-canvas.
 *
 * @param {Konva.Stage | null} stage - The Konva stage instance
 * @returns {Point} Center point of viewport in canvas coordinates
 *
 * @example
 * ```ts
 * const center = getViewportCenter(stage);
 * // If viewport is 1000x800, zoomed 2x, panned 100px right
 * // Returns canvas coords of what appears in the center of screen
 * ```
 */
export function getViewportCenter(stage: Konva.Stage | null): Point {
  // Fallback to origin if no stage
  if (!stage) {
    return { x: 0, y: 0 };
  }

  // Get stage dimensions (viewport size)
  const width = stage.width();
  const height = stage.height();

  // Calculate center of viewport in screen coordinates
  const screenCenter = {
    x: width / 2,
    y: height / 2,
  };

  // Convert screen center to canvas coordinates (accounts for pan/zoom)
  return screenToCanvasCoords(stage, screenCenter);
}
