/**
 * useDragToSelect Hook
 *
 * Implements drag-to-select (marquee selection) functionality.
 * - Tracks mouse down → drag → mouse up on stage background
 * - Renders selection rectangle during drag
 * - Performs collision detection to select overlapping objects
 * - Accounts for zoom and pan transformations
 */

import { useState, useCallback } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores';
import { useToolStore } from '@/stores';
import { screenToCanvasCoords } from '../utils';
import { objectIntersectsRect } from '../utils/collision';

interface DragSelectState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

/**
 * Get normalized selection rectangle (handles all 4 drag directions)
 */
function getSelectionRect(
  start: { x: number; y: number },
  current: { x: number; y: number }
) {
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  };
}

/**
 * Hook to enable drag-to-select functionality
 *
 * @returns {Object} Drag-to-select handlers and state
 *
 * @example
 * ```tsx
 * const {
 *   handleStageMouseDown,
 *   handleStageMouseMove,
 *   handleStageMouseUp,
 *   selectionRect
 * } = useDragToSelect(stageRef);
 *
 * <Stage
 *   onMouseDown={handleStageMouseDown}
 *   onMouseMove={handleStageMouseMove}
 *   onMouseUp={handleStageMouseUp}
 * >
 *   <Layer>
 *     {selectionRect && (
 *       <Rect {...selectionRect} stroke="blue" />
 *     )}
 *   </Layer>
 * </Stage>
 * ```
 */
export function useDragToSelect(stageRef: React.RefObject<Konva.Stage | null>) {
  const [dragSelectState, setDragSelectState] = useState<DragSelectState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
  });

  const { objects, selectObjects } = useCanvasStore();
  const { activeTool } = useToolStore();

  /**
   * Handle mouse down on stage background
   * Starts drag-to-select if clicking on empty space
   */
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Only allow drag-to-select when 'move' tool is active
      if (activeTool !== 'move') return;

      // Only start drag-to-select if clicking stage background (not a shape)
      const clickedOnEmpty = e.target === e.target.getStage();
      if (!clickedOnEmpty) return;

      // Don't start if shift is pressed (shift+click is for toggle selection)
      if (e.evt.shiftKey) return;

      // Get canvas coordinates (accounting for zoom/pan)
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const canvasCoords = screenToCanvasCoords(stage, pointerPos);

      setDragSelectState({
        isActive: true,
        startPoint: canvasCoords,
        currentPoint: canvasCoords,
      });
    },
    [stageRef, activeTool]
  );

  /**
   * Handle mouse move during drag
   * Updates selection rectangle
   */
  const handleStageMouseMove = useCallback(
    () => {
      if (!dragSelectState.isActive) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const canvasCoords = screenToCanvasCoords(stage, pointerPos);

      setDragSelectState((prev) => ({
        ...prev,
        currentPoint: canvasCoords,
      }));
    },
    [dragSelectState.isActive, stageRef]
  );

  /**
   * Handle mouse up - finalize selection
   * Performs collision detection and selects overlapping objects
   */
  const handleStageMouseUp = useCallback(
    () => {
      if (!dragSelectState.isActive) return;
      if (!dragSelectState.startPoint || !dragSelectState.currentPoint) return;

      // Get normalized selection rectangle
      const selectionRect = getSelectionRect(
        dragSelectState.startPoint,
        dragSelectState.currentPoint
      );

      // Minimum drag threshold (5px) - ignore tiny movements
      const MIN_DRAG_DISTANCE = 5;
      if (
        selectionRect.width < MIN_DRAG_DISTANCE &&
        selectionRect.height < MIN_DRAG_DISTANCE
      ) {
        // Treat as click, not drag - clear selection
        selectObjects([]);
        setDragSelectState({
          isActive: false,
          startPoint: null,
          currentPoint: null,
        });
        return;
      }

      // Find all objects that intersect with selection rectangle
      const selectedIds = objects
        .filter((obj) => objectIntersectsRect(obj, selectionRect))
        .map((obj) => obj.id);

      // Update selection (replace existing selection unless shift is held)
      selectObjects(selectedIds);

      // Reset drag state
      setDragSelectState({
        isActive: false,
        startPoint: null,
        currentPoint: null,
      });
    },
    [dragSelectState, objects, selectObjects]
  );

  // Calculate selection rectangle for rendering
  const selectionRect =
    dragSelectState.isActive && dragSelectState.startPoint && dragSelectState.currentPoint
      ? getSelectionRect(dragSelectState.startPoint, dragSelectState.currentPoint)
      : null;

  return {
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    selectionRect,
    isDragSelecting: dragSelectState.isActive,
  };
}
