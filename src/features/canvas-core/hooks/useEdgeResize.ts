/**
 * Edge Resize Hook
 *
 * Handles edge/corner dragging for image resize and crop operations.
 * Supports three modes:
 * 1. Locked mode (imageLocked=true): Maintains aspect ratio, scales from opposite edge
 * 2. Unlocked mode (imageLocked=false): Stretches layout, image fills
 * 3. Crop mode (Cmd/Ctrl held): Changes layout bounds, image stays fixed size
 */

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvas';
import { getImageLocked, getImageDimensions, type ImageObject } from '@/types/canvas.types';
import type { EdgeType } from '../utils/edgeDetection';

interface EdgeResizeState {
  objectId: string;
  edgeType: EdgeType;
  startX: number;      // Initial cursor position
  startY: number;
  startBounds: {       // Initial layout bounds
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startImage: {        // Initial image position/size
    imageX: number;
    imageY: number;
    imageWidth: number;
    imageHeight: number;
  };
  imageLocked: boolean;
  isCropMode: boolean; // Cmd/Ctrl held during drag
}

export function useEdgeResize() {
  const [resizeState, setResizeState] = useState<EdgeResizeState | null>(null);
  const updateObject = useCanvasStore((state) => state.updateObject);

  const startEdgeResize = useCallback((
    objectId: string,
    edgeType: EdgeType,
    cursorX: number,
    cursorY: number,
    image: ImageObject,
    isCropMode: boolean
  ) => {
    if (!edgeType) return;

    const imageLocked = getImageLocked(image);
    const { imageX, imageY, imageWidth, imageHeight } = getImageDimensions(image);

    setResizeState({
      objectId,
      edgeType,
      startX: cursorX,
      startY: cursorY,
      startBounds: {
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
      },
      startImage: {
        imageX,
        imageY,
        imageWidth,
        imageHeight,
      },
      imageLocked,
      isCropMode,
    });
  }, []);

  const moveEdgeResize = useCallback((
    cursorX: number,
    cursorY: number
  ) => {
    if (!resizeState) return;

    const { edgeType, startX, startY, startBounds, startImage, imageLocked, isCropMode } = resizeState;

    // Calculate delta from start position
    const dx = cursorX - startX;
    const dy = cursorY - startY;

    // Calculate new bounds based on edge type
    let newBounds = { ...startBounds };
    let newImage = { ...startImage };

    if (isCropMode) {
      // CROP MODE: Layout changes, image stays fixed
      newBounds = calculateCropBounds(edgeType, startBounds, dx, dy);
      newImage = { ...startImage }; // Image size/position unchanged
    } else if (imageLocked) {
      // LOCKED MODE: Maintain aspect ratio, scale both dimensions
      const result = calculateLockedResize(edgeType, startBounds, startImage, dx, dy);
      newBounds = result.bounds;
      newImage = result.image;
    } else {
      // UNLOCKED MODE: Stretch layout, image fills
      newBounds = calculateUnlockedBounds(edgeType, startBounds, dx, dy);
      newImage = {
        imageX: 0,
        imageY: 0,
        imageWidth: newBounds.width,
        imageHeight: newBounds.height,
      };
    }

    // Enforce minimum dimensions
    if (newBounds.width < 1) newBounds.width = 1;
    if (newBounds.height < 1) newBounds.height = 1;

    // Update object
    updateObject(resizeState.objectId, {
      x: newBounds.x,
      y: newBounds.y,
      width: newBounds.width,
      height: newBounds.height,
      imageX: newImage.imageX,
      imageY: newImage.imageY,
      imageWidth: newImage.imageWidth,
      imageHeight: newImage.imageHeight,
    });
  }, [resizeState, updateObject]);

  const endEdgeResize = useCallback(() => {
    setResizeState(null);
  }, []);

  return {
    isResizing: !!resizeState,
    startEdgeResize,
    moveEdgeResize,
    endEdgeResize,
  };
}

// Helper: Calculate new bounds in crop mode (layout changes, image fixed)
function calculateCropBounds(
  edge: EdgeType,
  startBounds: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number
) {
  let { x, y, width, height } = startBounds;

  // Adjust based on edge
  switch (edge) {
    case 'top':
      y += dy;
      height -= dy;
      break;
    case 'bottom':
      height += dy;
      break;
    case 'left':
      x += dx;
      width -= dx;
      break;
    case 'right':
      width += dx;
      break;
    case 'top-left':
      x += dx;
      y += dy;
      width -= dx;
      height -= dy;
      break;
    case 'top-right':
      y += dy;
      width += dx;
      height -= dy;
      break;
    case 'bottom-right':
      width += dx;
      height += dy;
      break;
    case 'bottom-left':
      x += dx;
      width -= dx;
      height += dy;
      break;
  }

  return { x, y, width, height };
}

// Helper: Calculate locked resize (maintain aspect ratio)
function calculateLockedResize(
  edge: EdgeType,
  startBounds: { x: number; y: number; width: number; height: number },
  startImage: { imageX: number; imageY: number; imageWidth: number; imageHeight: number },
  dx: number,
  dy: number
) {
  const aspectRatio = startBounds.width / startBounds.height;
  let { x, y, width, height } = startBounds;

  // For edges: use the dimension being dragged, calculate other dimension
  // For corners: use larger delta to determine scale

  if (edge === 'right' || edge === 'left') {
    // Horizontal edge: change width, calculate height
    const delta = edge === 'right' ? dx : -dx;
    width = startBounds.width + delta;
    height = width / aspectRatio;

    // Adjust position if left edge (opposite edge stays fixed)
    if (edge === 'left') {
      x = startBounds.x + startBounds.width - width;
    }
  } else if (edge === 'top' || edge === 'bottom') {
    // Vertical edge: change height, calculate width
    const delta = edge === 'bottom' ? dy : -dy;
    height = startBounds.height + delta;
    width = height * aspectRatio;

    // Adjust position if top edge
    if (edge === 'top') {
      y = startBounds.y + startBounds.height - height;
    }
  } else if (edge) {
    // Corner: use dominant delta
    const deltaX = Math.abs(dx);
    const deltaY = Math.abs(dy);

    if (deltaX > deltaY) {
      // Width drives resize
      const delta = edge.includes('right') ? dx : -dx;
      width = startBounds.width + delta;
      height = width / aspectRatio;
    } else {
      // Height drives resize
      const delta = edge.includes('bottom') ? dy : -dy;
      height = startBounds.height + delta;
      width = height * aspectRatio;
    }

    // Adjust position for top/left corners
    if (edge.includes('left')) {
      x = startBounds.x + startBounds.width - width;
    }
    if (edge.includes('top')) {
      y = startBounds.y + startBounds.height - height;
    }
  }

  // Scale image proportionally
  const scaleX = width / startBounds.width;
  const scaleY = height / startBounds.height;
  const scale = Math.min(scaleX, scaleY); // Use uniform scale to maintain aspect

  return {
    bounds: { x, y, width, height },
    image: {
      imageX: startImage.imageX * scale,
      imageY: startImage.imageY * scale,
      imageWidth: startImage.imageWidth * scale,
      imageHeight: startImage.imageHeight * scale,
    },
  };
}

// Helper: Calculate unlocked resize (stretch to fill)
function calculateUnlockedBounds(
  edge: EdgeType,
  startBounds: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number
) {
  // Same as crop mode but image will fill (handled in moveEdgeResize)
  return calculateCropBounds(edge, startBounds, dx, dy);
}
