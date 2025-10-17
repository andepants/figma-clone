/**
 * Shape Property Detection Utilities
 *
 * Provides helper functions to work with different shape types
 * in a type-safe and normalized way.
 */

import type { CanvasObject } from '@/types/canvas.types';
import {
  hasDimensions,
  hasRadius,
  hasCornerRadius,
  supportsAspectRatioLock,
  isTextShape,
  isLineShape,
} from '@/types/canvas.types';

/**
 * Get normalized dimensions for any shape type
 * Returns { width, height } or null if shape doesn't have dimensions
 *
 * - Rectangle/Text/Image: Returns width and height directly (all have fixed dimensions)
 * - Circle: Returns diameter as both width and height
 * - Line: Returns width (line length) only, no height (1D shape)
 */
export function getNormalizedDimensions(shape: CanvasObject): {
  width: number;
  height?: number;
} | null {
  if (hasDimensions(shape)) {
    // Rectangle, Text, and Image shapes: all have width and height properties
    return { width: shape.width, height: shape.height };
  }

  if (hasRadius(shape)) {
    const diameter = shape.radius * 2;
    return { width: diameter, height: diameter };
  }

  if (isLineShape(shape)) {
    // Lines have width (length) but no height (1D shape)
    return { width: shape.width };
  }

  return null;
}

/**
 * Get the display name for a shape's dimension property
 * Used for UI labels
 */
export function getDimensionLabels(shape: CanvasObject): {
  primary: string;
  secondary?: string;
} {
  if (hasRadius(shape)) {
    return { primary: 'Radius', secondary: 'Diameter' };
  }
  if (isLineShape(shape)) {
    return { primary: 'Width (Length)' };
  }
  if (hasDimensions(shape)) {
    return { primary: 'Width', secondary: 'Height' };
  }
  return { primary: 'Size' };
}

/**
 * Get shape-specific properties for display in properties panel
 * Returns an object with all relevant properties for the shape type
 */
export function getShapeSpecificProperties(shape: CanvasObject): Record<string, string | number | boolean | number[] | undefined> {
  switch (shape.type) {
    case 'rectangle':
      return {
        width: shape.width,
        height: shape.height,
        cornerRadius: shape.cornerRadius ?? 0,
        lockAspectRatio: shape.lockAspectRatio ?? false,
      };

    case 'circle':
      return {
        radius: shape.radius,
        diameter: shape.radius * 2,
        // Circles always maintain aspect ratio
        lockAspectRatio: true,
      };

    case 'text':
      return {
        content: shape.text,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        width: shape.width,
        height: shape.height,
        fontWeight: shape.fontWeight ?? 400,
        fontStyle: shape.fontStyle ?? 'normal',
        textAlign: shape.textAlign ?? 'left',
      };

    case 'line':
      return {
        width: shape.width,
        rotation: shape.rotation,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
      };

    default:
      return {};
  }
}

/**
 * Check if a property is applicable to a given shape type
 * Used to conditionally render property controls
 */
export function isPropertyApplicable(shape: CanvasObject, property: string): boolean {
  const propertyMap: Record<string, (shape: CanvasObject) => boolean> = {
    width: hasDimensions,
    height: hasDimensions,
    radius: hasRadius,
    cornerRadius: hasCornerRadius,
    lockAspectRatio: supportsAspectRatioLock,
    content: isTextShape,
    fontSize: isTextShape,
    fontFamily: isTextShape,
    fontWeight: isTextShape,
    fontStyle: isTextShape,
    textAlign: isTextShape,
    textDecoration: isTextShape,
    letterSpacing: isTextShape,
    lineHeight: isTextShape,
  };

  const checker = propertyMap[property];
  return checker ? checker(shape) : true; // Default to true for common properties
}

/**
 * Get minimum dimension constraints for a shape type
 */
export function getMinimumDimensions(shapeType: CanvasObject['type']): {
  min: number;
  label: string;
} {
  switch (shapeType) {
    case 'rectangle':
      return { min: 1, label: 'Minimum size: 1×1 px' };
    case 'circle':
      return { min: 1, label: 'Minimum radius: 1 px (2 px diameter)' };
    case 'text':
      return { min: 1, label: 'Minimum font size: 1 px' };
    default:
      return { min: 1, label: 'Minimum size: 1 px' };
  }
}

/**
 * Validate and clamp dimension update for a shape
 * Returns validated value or null if invalid
 */
export function validateDimensionUpdate(
  shape: CanvasObject,
  property: 'width' | 'height' | 'radius',
  value: number
): number | null {
  const min = getMinimumDimensions(shape.type).min;
  const max = 10000; // Maximum canvas dimension

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  // Validate property is applicable to this shape
  if (!isPropertyApplicable(shape, property)) {
    return null;
  }

  // Clamp to valid range
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate aspect ratio for a shape
 * Returns null if shape doesn't support aspect ratio
 */
export function getAspectRatio(shape: CanvasObject): number | null {
  if (hasRadius(shape)) {
    return 1; // Circles always 1:1
  }

  if (shape.type === 'rectangle') {
    if (shape.height === 0) return null;
    return shape.width / shape.height;
  }

  // Text shapes don't have a meaningful aspect ratio
  if (shape.type === 'text') {
    return null;
  }

  return null;
}

/**
 * Apply aspect ratio lock to dimension change
 * Returns updated dimensions maintaining aspect ratio
 */
export function applyAspectRatioLock(
  shape: CanvasObject,
  changedProperty: 'width' | 'height' | 'radius',
  newValue: number
): { width?: number; height?: number; radius?: number } | null {
  if (!supportsAspectRatioLock(shape)) {
    return null;
  }

  const aspectRatio = getAspectRatio(shape);
  if (!aspectRatio) return null;

  if (hasRadius(shape)) {
    // Circles: radius change affects diameter
    return { radius: newValue };
  }

  if (hasDimensions(shape)) {
    if (changedProperty === 'width') {
      return {
        width: newValue,
        height: newValue / aspectRatio,
      };
    } else if (changedProperty === 'height') {
      return {
        width: newValue * aspectRatio,
        height: newValue,
      };
    }
  }

  return null;
}

// Re-export type guard functions for convenience
export {
  hasDimensions,
  hasRadius,
  hasCornerRadius,
  supportsAspectRatioLock,
  isTextShape,
} from '@/types/canvas.types';
