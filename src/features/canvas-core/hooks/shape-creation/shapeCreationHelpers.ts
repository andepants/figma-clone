/**
 * Shape Creation Helpers
 *
 * Pure calculation functions for shape creation preview and finalization.
 * Handles rectangle, circle, and line geometry calculations.
 */

import type { Rectangle, Circle, Line, CanvasObject } from '@/types';
import { calculateLineProperties } from '../../utils/lineHelpers';
import { generateLayerName } from '@/features/layers-panel/utils';

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Minimum shape size in pixels
 */
export const MIN_SIZE = 10;

/**
 * Default fill color for new rectangles
 */
export const DEFAULT_RECTANGLE_FILL = '#3b82f6'; // blue-500

/**
 * Default fill color for new circles
 */
export const DEFAULT_CIRCLE_FILL = '#ef4444'; // red-500

/**
 * Default stroke color for new lines
 */
export const DEFAULT_LINE_STROKE = '#000000'; // black

/**
 * Default stroke width for new lines
 */
export const DEFAULT_LINE_STROKE_WIDTH = 2;

/**
 * Calculate rectangle preview shape from start and current points
 *
 * @param startPoint - Initial click position
 * @param currentPoint - Current mouse position
 * @param userId - User ID for createdBy field
 * @returns Rectangle preview object
 */
export function calculateRectanglePreview(
  startPoint: Point,
  currentPoint: Point,
  userId: string
): Rectangle {
  // Calculate dimensions (handle negative values)
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);

  // Calculate position (top-left corner)
  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);

  return {
    id: 'preview', // Temporary ID
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill: DEFAULT_RECTANGLE_FILL,
    createdBy: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Calculate circle preview shape from start and current points
 *
 * @param startPoint - Center position (initial click)
 * @param currentPoint - Current mouse position (determines radius)
 * @param userId - User ID for createdBy field
 * @returns Circle preview object
 */
export function calculateCirclePreview(
  startPoint: Point,
  currentPoint: Point,
  userId: string
): Circle {
  // Calculate radius as distance from start point to current point
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  const radius = Math.sqrt(dx * dx + dy * dy);

  // Circle position is at the center (start point)
  return {
    id: 'preview', // Temporary ID
    type: 'circle',
    x: startPoint.x,
    y: startPoint.y,
    radius,
    fill: DEFAULT_CIRCLE_FILL,
    createdBy: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Calculate line preview shape from start and current points
 *
 * @param startPoint - Line start position
 * @param currentPoint - Line end position
 * @param userId - User ID for createdBy field
 * @returns Line preview object
 */
export function calculateLinePreview(
  startPoint: Point,
  currentPoint: Point,
  userId: string
): Line {
  // Calculate line properties from start point to current point
  const { x, y, points, width, rotation } = calculateLineProperties(
    startPoint.x,
    startPoint.y,
    currentPoint.x,
    currentPoint.y
  );

  return {
    id: 'preview', // Temporary ID
    type: 'line',
    x,
    y,
    points,
    width,
    rotation,
    stroke: DEFAULT_LINE_STROKE,
    strokeWidth: DEFAULT_LINE_STROKE_WIDTH,
    visible: true,
    createdBy: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Finalize rectangle shape with minimum size enforcement and unique ID
 *
 * @param preview - Preview rectangle to finalize
 * @param existingObjects - Existing objects for name generation
 * @returns Finalized rectangle with unique ID and auto-generated name
 */
export function finalizeRectangle(
  preview: Rectangle,
  existingObjects: CanvasObject[]
): Rectangle {
  // Enforce minimum size
  const width = Math.max(preview.width, MIN_SIZE);
  const height = Math.max(preview.height, MIN_SIZE);

  // Generate auto-name
  const name = generateLayerName('rectangle', existingObjects);

  return {
    ...preview,
    id: `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    width,
    height,
    name,
  };
}

/**
 * Finalize circle shape with minimum radius enforcement and unique ID
 *
 * @param preview - Preview circle to finalize
 * @param existingObjects - Existing objects for name generation
 * @returns Finalized circle with unique ID and auto-generated name
 */
export function finalizeCircle(
  preview: Circle,
  existingObjects: CanvasObject[]
): Circle {
  // Enforce minimum radius (5px = 10px diameter, matching MIN_SIZE)
  const radius = Math.max(preview.radius, MIN_SIZE / 2);

  // Generate auto-name
  const name = generateLayerName('circle', existingObjects);

  return {
    ...preview,
    id: `circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    radius,
    name,
  };
}

/**
 * Finalize line shape with minimum length enforcement and unique ID
 *
 * @param preview - Preview line to finalize
 * @param startPoint - Original start point (for creating default line if too short)
 * @param existingObjects - Existing objects for name generation
 * @param userId - User ID for createdBy field
 * @returns Finalized line with unique ID and auto-generated name
 */
export function finalizeLine(
  preview: Line,
  startPoint: Point | null,
  existingObjects: CanvasObject[],
  userId: string
): Line | null {
  // Generate auto-name
  const name = generateLayerName('line', existingObjects);

  // If line is too short (user clicked without dragging), create a default 10px horizontal line
  if (preview.width < MIN_SIZE) {
    if (!startPoint) {
      return null;
    }

    const { x, y, points, width, rotation } = calculateLineProperties(
      startPoint.x,
      startPoint.y,
      startPoint.x + MIN_SIZE,
      startPoint.y
    );

    return {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'line',
      x,
      y,
      points,
      width,
      rotation,
      stroke: DEFAULT_LINE_STROKE,
      strokeWidth: DEFAULT_LINE_STROKE_WIDTH,
      visible: true,
      name,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // Use the dragged line with enforced minimum length
  const width = Math.max(preview.width, MIN_SIZE);

  return {
    ...preview,
    id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    width,
    visible: true,
    name,
  };
}
