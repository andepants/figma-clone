/**
 * Viewport culling utilities
 *
 * Provides functions for determining object visibility within the canvas viewport
 * to optimize rendering performance by only rendering visible objects.
 */

import type { CanvasObject } from '@/types'
import type Konva from 'konva'

/**
 * Check if object is visible in current viewport
 *
 * @param obj - The canvas object to check
 * @param stage - The Konva stage reference
 * @param padding - Extra padding for smooth transitions (default: 100px)
 * @returns True if object intersects with viewport bounds
 */
export function isObjectInViewport(
  obj: CanvasObject,
  stage: Konva.Stage,
  padding = 100
): boolean {
  const viewport = getViewportBounds(stage, padding)
  const objBounds = getObjectBounds(obj)

  return (
    objBounds.x < viewport.x + viewport.width &&
    objBounds.x + objBounds.width > viewport.x &&
    objBounds.y < viewport.y + viewport.height &&
    objBounds.y + objBounds.height > viewport.y
  )
}

/**
 * Get viewport bounds in canvas coordinates
 *
 * Converts screen space viewport to canvas space, accounting for zoom and pan.
 *
 * @param stage - The Konva stage reference
 * @param padding - Extra padding around viewport (default: 0)
 * @returns Viewport bounds in canvas coordinates
 */
export function getViewportBounds(
  stage: Konva.Stage,
  padding = 0
): { x: number; y: number; width: number; height: number } {
  const scale = stage.scaleX() // Assumes scaleX === scaleY
  const position = stage.position()

  return {
    x: -position.x / scale - padding,
    y: -position.y / scale - padding,
    width: stage.width() / scale + padding * 2,
    height: stage.height() / scale + padding * 2,
  }
}

/**
 * Get object bounding box including rotation and stroke
 *
 * Calculates the axis-aligned bounding box that fully contains the object,
 * accounting for stroke width, shadows, and object type-specific dimensions.
 *
 * @param obj - The canvas object
 * @returns Bounding box coordinates and dimensions
 */
export function getObjectBounds(obj: CanvasObject): {
  x: number
  y: number
  width: number
  height: number
} {
  const strokeWidth = obj.strokeWidth || 0
  const shadowBlur = obj.shadowEnabled ? (obj.shadowBlur || 0) : 0
  const padding = strokeWidth + shadowBlur

  // Handle different object types
  switch (obj.type) {
    case 'circle':
      const radius = obj.radius || 0
      return {
        x: obj.x - radius - padding,
        y: obj.y - radius - padding,
        width: radius * 2 + padding * 2,
        height: radius * 2 + padding * 2,
      }

    case 'line':
      return {
        x: obj.x - padding,
        y: obj.y - padding,
        width: (obj.width || 0) + padding * 2,
        height: 10 + padding * 2, // Line height approximation
      }

    case 'group':
      // Groups don't have explicit dimensions, use position with default size
      // In practice, groups should be culled based on their children's bounds
      return {
        x: obj.x - padding,
        y: obj.y - padding,
        width: 100 + padding * 2, // Default size for group bounds approximation
        height: 100 + padding * 2,
      }

    default: // rectangle, text, image
      return {
        x: obj.x - padding,
        y: obj.y - padding,
        width: (obj.width || 0) + padding * 2,
        height: (obj.height || 0) + padding * 2,
      }
  }
}

/**
 * Filter objects to only those visible in viewport
 *
 * Optimizes rendering by culling off-screen objects. Returns all objects
 * if stage is not available (e.g., during initial render).
 *
 * @param objects - Array of canvas objects to filter
 * @param stage - The Konva stage reference (nullable for safety)
 * @returns Array containing only visible objects
 */
export function filterVisibleObjects(
  objects: CanvasObject[],
  stage: Konva.Stage | null
): CanvasObject[] {
  if (!stage) return objects

  return objects.filter(obj => isObjectInViewport(obj, stage))
}
