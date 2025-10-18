/**
 * useShapeDimensions Hook
 *
 * Provides normalized dimension access and update functions for any shape type.
 * Handles Rectangle (width/height), Circle (radius), and Text (width/height).
 */

import type { CanvasObject } from '@/types';
import {
  getNormalizedDimensions,
  getDimensionLabels,
  validateDimensionUpdate,
  getAspectRatio,
  applyAspectRatioLock,
  hasDimensions,
  hasRadius,
} from '@/lib/utils';
import { isImageShape, getImageLocked, getImageDimensions } from '@/types/canvas.types';
import { usePropertyUpdate } from './usePropertyUpdate';

export interface ShapeDimensionsReturn {
  // Normalized values
  width: number | null;
  height: number | null;
  radius: number | null;
  diameter: number | null;

  // Labels for UI
  primaryLabel: string; // "Width", "Radius", etc.
  secondaryLabel?: string; // "Height", "Diameter", etc.

  // Update functions
  updateWidth: (value: number) => void;
  updateHeight: (value: number) => void;
  updateRadius: (value: number) => void;

  // Aspect ratio support
  hasAspectRatioLock: boolean;
  supportsAspectRatioLock: boolean;
  toggleAspectRatioLock: () => void;
}

/**
 * Hook for managing shape dimensions
 *
 * Provides normalized dimension values and update functions that work
 * across all shape types (Rectangle, Circle, Text).
 *
 * @param shape - The shape to manage dimensions for
 * @returns Dimension values and update functions
 *
 * @example
 * ```tsx
 * function LayoutSection() {
 *   const shape = useSelectedShape();
 *   const dimensions = useShapeDimensions(shape);
 *
 *   return (
 *     <NumberInput
 *       value={dimensions.width!}
 *       onChange={dimensions.updateWidth}
 *     />
 *   );
 * }
 * ```
 */
export function useShapeDimensions(shape: CanvasObject | null): ShapeDimensionsReturn {
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) {
    return {
      width: null,
      height: null,
      radius: null,
      diameter: null,
      primaryLabel: 'Width',
      secondaryLabel: 'Height',
      updateWidth: () => {},
      updateHeight: () => {},
      updateRadius: () => {},
      hasAspectRatioLock: false,
      supportsAspectRatioLock: false,
      toggleAspectRatioLock: () => {},
    };
  }

  // Handle image dimensions separately (new crop system)
  if (isImageShape(shape)) {
    const imageLocked = getImageLocked(shape);
    const { imageWidth, imageHeight } = getImageDimensions(shape);

    function updateImageWidth(newWidth: number) {
      if (newWidth < 1 || !shape || !('width' in shape) || !('height' in shape)) return;

      if (imageLocked) {
        // Locked: scale height proportionally
        const aspectRatio = shape.height / shape.width;
        const newHeight = newWidth * aspectRatio;

        // Also scale image proportionally
        const imageScale = newWidth / shape.width;
        updateShapeProperty(shape.id, {
          width: newWidth,
          height: newHeight,
          imageWidth: imageWidth * imageScale,
          imageHeight: imageHeight * imageScale,
        });
      } else {
        // Unlocked: only change width, image stretches to fill
        updateShapeProperty(shape.id, {
          width: newWidth,
          imageWidth: newWidth,
        });
      }
    }

    function updateImageHeight(newHeight: number) {
      if (newHeight < 1 || !shape || !('width' in shape) || !('height' in shape)) return;

      if (imageLocked) {
        // Locked: scale width proportionally
        const aspectRatio = shape.width / shape.height;
        const newWidth = newHeight * aspectRatio;

        // Also scale image proportionally
        const imageScale = newHeight / shape.height;
        updateShapeProperty(shape.id, {
          width: newWidth,
          height: newHeight,
          imageWidth: imageWidth * imageScale,
          imageHeight: imageHeight * imageScale,
        });
      } else {
        // Unlocked: only change height, image stretches to fill
        updateShapeProperty(shape.id, {
          height: newHeight,
          imageHeight: newHeight,
        });
      }
    }

    return {
      width: shape.width,
      height: shape.height,
      radius: null,
      diameter: null,
      primaryLabel: 'Width',
      secondaryLabel: 'Height',
      updateWidth: updateImageWidth,
      updateHeight: updateImageHeight,
      updateRadius: () => {},
      hasAspectRatioLock: imageLocked,
      supportsAspectRatioLock: false, // Images use imageLocked instead
      toggleAspectRatioLock: () => {}, // Handled by button in LayoutSection
    };
  }

  const dimensions = getNormalizedDimensions(shape);
  const labels = getDimensionLabels(shape);
  const aspectRatio = getAspectRatio(shape);

  // Get lock state
  const hasLock = hasDimensions(shape)
    ? (shape.type === 'rectangle' ? (shape.lockAspectRatio ?? false) : false)
    : hasRadius(shape); // Circles always locked

  // Dimension update handlers
  function updateWidth(newWidth: number) {
    if (!shape || !hasDimensions(shape)) return;

    const validated = validateDimensionUpdate(shape, 'width', newWidth);
    if (validated === null) return;

    if (hasLock && aspectRatio) {
      const updates = applyAspectRatioLock(shape, 'width', validated);
      if (updates) {
        updateShapeProperty(shape.id, updates);
      }
    } else {
      updateShapeProperty(shape.id, { width: validated });
    }
  }

  function updateHeight(newHeight: number) {
    if (!shape || !hasDimensions(shape)) return;

    const validated = validateDimensionUpdate(shape, 'height', newHeight);
    if (validated === null) return;

    if (hasLock && aspectRatio) {
      const updates = applyAspectRatioLock(shape, 'height', validated);
      if (updates) {
        updateShapeProperty(shape.id, updates);
      }
    } else {
      updateShapeProperty(shape.id, { height: validated });
    }
  }

  function updateRadius(newRadius: number) {
    if (!shape || !hasRadius(shape)) return;

    const validated = validateDimensionUpdate(shape, 'radius', newRadius);
    if (validated === null) return;

    updateShapeProperty(shape.id, { radius: validated });
  }

  function toggleAspectRatioLock() {
    if (!shape || !hasDimensions(shape)) return; // Circles always locked
    updateShapeProperty(shape.id, { lockAspectRatio: !hasLock });
  }

  return {
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    radius: hasRadius(shape) ? shape.radius : null,
    diameter: hasRadius(shape) ? shape.radius * 2 : null,
    primaryLabel: labels.primary,
    secondaryLabel: labels.secondary,
    updateWidth,
    updateHeight,
    updateRadius,
    hasAspectRatioLock: hasLock,
    supportsAspectRatioLock: hasDimensions(shape),
    toggleAspectRatioLock,
  };
}
