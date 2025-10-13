/**
 * useShapeCreation Hook
 *
 * Manages dynamic shape creation with click-drag-release pattern.
 * Handles preview rendering, coordinate transforms, and finalizing shapes.
 */

import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import { useCanvasStore, useToolStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import { debouncedUpdateCanvas } from '@/lib/firebase';
import { screenToCanvasCoords } from '../utils/coordinates';
import type { CanvasObject, Rectangle } from '@/types';

/**
 * Point in 2D space
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Shape creation state and handlers
 */
interface UseShapeCreationReturn {
  /** Preview shape being drawn (null when not creating) */
  previewShape: CanvasObject | null;
  /** Whether user is currently creating a shape */
  isCreating: boolean;
  /** Handle mouse down event to start shape creation */
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Handle mouse move event to update preview */
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Handle mouse up event to finalize shape */
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * Minimum shape size in pixels
 */
const MIN_SIZE = 10;

/**
 * Default fill color for new rectangles
 */
const DEFAULT_FILL = '#3b82f6'; // blue-500

/**
 * Hook for managing shape creation with click-drag-release
 *
 * Provides handlers for mouse events and preview state.
 * Only creates shapes when rectangle tool is active.
 *
 * @returns {UseShapeCreationReturn} Shape creation state and handlers
 *
 * @example
 * ```tsx
 * const { previewShape, handleMouseDown, handleMouseMove, handleMouseUp } = useShapeCreation();
 *
 * <Stage
 *   onMouseDown={handleMouseDown}
 *   onMouseMove={handleMouseMove}
 *   onMouseUp={handleMouseUp}
 * >
 *   {previewShape && <Rect {...previewShape} />}
 * </Stage>
 * ```
 */
export function useShapeCreation(): UseShapeCreationReturn {
  const { activeTool } = useToolStore();
  const { addObject } = useCanvasStore();
  const { currentUser } = useAuth();

  const [previewShape, setPreviewShape] = useState<CanvasObject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Store stage ref for coordinate transforms
  const stageRef = useRef<Konva.Stage | null>(null);

  /**
   * Handle mouse down - start shape creation
   * Only activates when rectangle tool is selected
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only create shapes when rectangle tool is active
      if (activeTool !== 'rectangle') return;

      const stage = e.target.getStage();
      if (!stage) return;

      stageRef.current = stage;

      // Get pointer position in screen coordinates
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Convert to canvas coordinates
      const canvasPos = screenToCanvasCoords(stage, pointerPos);

      // Start creating
      setStartPoint(canvasPos);
      setIsCreating(true);
    },
    [activeTool]
  );

  /**
   * Handle mouse move - update preview shape
   * Shows dynamic sizing as user drags
   */
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only update preview while creating
      if (!isCreating || !startPoint) return;

      const stage = e.target.getStage();
      if (!stage) return;

      // Get current pointer position
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Convert to canvas coordinates
      const currentPos = screenToCanvasCoords(stage, pointerPos);

      // Calculate dimensions (handle negative values)
      const width = Math.abs(currentPos.x - startPoint.x);
      const height = Math.abs(currentPos.y - startPoint.y);

      // Calculate position (top-left corner)
      const x = Math.min(startPoint.x, currentPos.x);
      const y = Math.min(startPoint.y, currentPos.y);

      // Create preview shape
      const preview: Rectangle = {
        id: 'preview', // Temporary ID
        type: 'rectangle',
        x,
        y,
        width,
        height,
        fill: DEFAULT_FILL,
        createdBy: currentUser?.uid || 'unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setPreviewShape(preview);
    },
    [isCreating, startPoint, currentUser]
  );

  /**
   * Handle mouse up - finalize shape creation
   * Enforces minimum size and adds to canvas store
   */
  const handleMouseUp = useCallback(() => {
    // Only finalize if we were creating
    if (!isCreating || !previewShape) {
      setIsCreating(false);
      setStartPoint(null);
      setPreviewShape(null);
      return;
    }

    // Enforce minimum size
    const finalShape = previewShape as Rectangle;
    const width = Math.max(finalShape.width, MIN_SIZE);
    const height = Math.max(finalShape.height, MIN_SIZE);

    // Create final shape with unique ID
    const newShape: Rectangle = {
      ...finalShape,
      id: `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      width,
      height,
    };

    // Add to canvas store (optimistic update)
    addObject(newShape);

    // Sync to Firestore (debounced 500ms)
    // Zustand updates are synchronous, so we can get the state immediately
    const currentObjects = useCanvasStore.getState().objects;
    console.log('Syncing to Firestore:', currentObjects.length, 'objects');
    debouncedUpdateCanvas('main', currentObjects);

    // Reset state
    setIsCreating(false);
    setStartPoint(null);
    setPreviewShape(null);
  }, [isCreating, previewShape, addObject]);

  return {
    previewShape,
    isCreating,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
