/**
 * useShapeCreation Hook
 *
 * Manages dynamic shape creation with click-drag-release pattern.
 * Handles preview rendering, coordinate transforms, and finalizing shapes.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type Konva from 'konva';
import { useCanvasStore, useToolStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import { addCanvasObject } from '@/lib/firebase';
import { screenToCanvasCoords } from '../utils/coordinates';
import type { CanvasObject, Rectangle, Circle, Text } from '@/types';
import { TEXT_DEFAULTS, DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT } from '@/constants';

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
const DEFAULT_RECTANGLE_FILL = '#3b82f6'; // blue-500

/**
 * Default fill color for new circles
 */
const DEFAULT_CIRCLE_FILL = '#ef4444'; // red-500

/**
 * Default text color for new text shapes
 */
const DEFAULT_TEXT_FILL = '#171717'; // neutral-900

/**
 * Default font size for new text shapes
 */
const DEFAULT_FONT_SIZE = 24;

/**
 * Default font family for new text shapes
 */
const DEFAULT_FONT_FAMILY = 'Inter';

/**
 * Default text content for new text shapes
 */
const DEFAULT_TEXT_CONTENT = 'Double-click to edit';

/**
 * Hook for managing shape creation with click-drag-release
 *
 * Provides handlers for mouse events and preview state.
 * Creates shapes when rectangle or circle tool is active.
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
 *   {previewShape && renderShape(previewShape)}
 * </Stage>
 * ```
 */
export function useShapeCreation(): UseShapeCreationReturn {
  const { activeTool, setActiveTool } = useToolStore();
  const { addObject, clearSelection } = useCanvasStore();
  const { currentUser } = useAuth();

  const [previewShape, setPreviewShape] = useState<CanvasObject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Store stage ref for coordinate transforms
  const stageRef = useRef<Konva.Stage | null>(null);

  /**
   * Reset shape creation state when switching tools
   * Prevents orphaned preview shapes when user switches tools mid-creation
   */
  useEffect(() => {
    if (activeTool !== 'rectangle' && activeTool !== 'circle' && activeTool !== 'text' && isCreating) {
      // Clear preview and creation state when switching away from shape tools
      setIsCreating(false);
      setStartPoint(null);
      setPreviewShape(null);
    }
  }, [activeTool, isCreating]);

  /**
   * Handle Escape key to cancel shape creation
   * Allows user to cancel mid-creation without completing the shape
   */
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && isCreating) {
        // Cancel shape creation on Escape
        setIsCreating(false);
        setStartPoint(null);
        setPreviewShape(null);
        event.preventDefault();
      }
    }

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCreating]);

  /**
   * Handle mouse down - start shape creation
   * Only activates when rectangle, circle, or text tool is selected
   *
   * For text tool: Creates text immediately on click (no drag)
   * For shapes: Starts drag-to-create flow
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only create shapes when rectangle, circle, or text tool is active
      if (activeTool !== 'rectangle' && activeTool !== 'circle' && activeTool !== 'text') return;

      const stage = e.target.getStage();
      if (!stage) return;

      stageRef.current = stage;

      // Get pointer position in screen coordinates
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Convert to canvas coordinates
      const canvasPos = screenToCanvasCoords(stage, pointerPos);

      // Clear any existing selection before starting shape creation
      clearSelection();

      // For text tool: Create text immediately on click (no drag needed)
      if (activeTool === 'text') {
        // Create text shape immediately with all default typography properties
        // Text boxes are fixed-size containers (like rectangles) that hold text
        const newText: Text = {
          id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          x: canvasPos.x,
          y: canvasPos.y,
          text: DEFAULT_TEXT_CONTENT,
          fontSize: DEFAULT_FONT_SIZE,
          fontFamily: DEFAULT_FONT_FAMILY,
          fill: DEFAULT_TEXT_FILL,
          // Fixed dimensions - text wraps/clips within these bounds
          width: DEFAULT_TEXT_WIDTH,
          height: DEFAULT_TEXT_HEIGHT,
          wrap: 'word', // Enable text wrapping by default
          // Typography properties from TEXT_DEFAULTS
          fontWeight: TEXT_DEFAULTS.fontWeight,
          fontStyle: TEXT_DEFAULTS.fontStyle,
          textAlign: TEXT_DEFAULTS.textAlign,
          align: TEXT_DEFAULTS.textAlign, // For backward compatibility
          verticalAlign: TEXT_DEFAULTS.verticalAlign,
          letterSpacing: TEXT_DEFAULTS.letterSpacing,
          lineHeight: TEXT_DEFAULTS.lineHeight,
          textDecoration: TEXT_DEFAULTS.textDecoration,
          paragraphSpacing: TEXT_DEFAULTS.paragraphSpacing,
          textTransform: TEXT_DEFAULTS.textTransform,
          // Base properties
          opacity: TEXT_DEFAULTS.opacity,
          rotation: TEXT_DEFAULTS.rotation,
          createdBy: currentUser?.uid || 'unknown',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Add to canvas store (optimistic update)
        addObject(newText);

        // Auto-switch back to move tool (Figma-style behavior)
        setActiveTool('move');

        // Sync to Realtime Database
        addCanvasObject('main', newText).catch((error) => {
          console.error('Failed to add text to RTDB:', error);
          // Rollback optimistic update on error
          const { removeObject } = useCanvasStore.getState();
          removeObject(newText.id);
        });

        // Don't start drag creation flow for text
        return;
      }

      // For rectangles and circles: Start drag creation flow
      setStartPoint(canvasPos);
      setIsCreating(true);
    },
    [activeTool, clearSelection, currentUser, addObject, setActiveTool]
  );

  /**
   * Handle mouse move - update preview shape
   * Shows dynamic sizing as user drags
   * For rectangles: shows width x height
   * For circles: shows radius from center point
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

      // Create preview shape based on active tool
      let preview: CanvasObject;

      if (activeTool === 'rectangle') {
        // Calculate dimensions (handle negative values)
        const width = Math.abs(currentPos.x - startPoint.x);
        const height = Math.abs(currentPos.y - startPoint.y);

        // Calculate position (top-left corner)
        const x = Math.min(startPoint.x, currentPos.x);
        const y = Math.min(startPoint.y, currentPos.y);

        preview = {
          id: 'preview', // Temporary ID
          type: 'rectangle',
          x,
          y,
          width,
          height,
          fill: DEFAULT_RECTANGLE_FILL,
          createdBy: currentUser?.uid || 'unknown',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as Rectangle;
      } else if (activeTool === 'circle') {
        // Calculate radius as distance from start point to current point
        const dx = currentPos.x - startPoint.x;
        const dy = currentPos.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        // Circle position is at the center (start point)
        preview = {
          id: 'preview', // Temporary ID
          type: 'circle',
          x: startPoint.x,
          y: startPoint.y,
          radius,
          fill: DEFAULT_CIRCLE_FILL,
          createdBy: currentUser?.uid || 'unknown',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as Circle;
      } else {
        return;
      }

      setPreviewShape(preview);
    },
    [isCreating, startPoint, currentUser, activeTool]
  );

  /**
   * Handle mouse up - finalize shape creation
   * Enforces minimum size and adds to canvas store
   *
   * Note: Migrated from Firestore to RTDB for atomic object creation
   */
  const handleMouseUp = useCallback(async () => {
    // Only finalize if we were creating
    if (!isCreating || !previewShape) {
      setIsCreating(false);
      setStartPoint(null);
      setPreviewShape(null);
      return;
    }

    // Create final shape with unique ID based on type
    let newShape: CanvasObject;

    if (previewShape.type === 'rectangle') {
      // Enforce minimum size for rectangles
      const rectPreview = previewShape as Rectangle;
      const width = Math.max(rectPreview.width, MIN_SIZE);
      const height = Math.max(rectPreview.height, MIN_SIZE);

      newShape = {
        ...rectPreview,
        id: `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        width,
        height,
      };
    } else if (previewShape.type === 'circle') {
      // Enforce minimum radius for circles (5px = 10px diameter, matching MIN_SIZE)
      const circlePreview = previewShape as Circle;
      const radius = Math.max(circlePreview.radius, MIN_SIZE / 2);

      newShape = {
        ...circlePreview,
        id: `circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        radius,
      };
    } else {
      // Unknown shape type, abort
      setIsCreating(false);
      setStartPoint(null);
      setPreviewShape(null);
      return;
    }

    // Add to canvas store (optimistic update)
    addObject(newShape);

    // Auto-switch back to move tool (Figma-style behavior)
    // Happens immediately after creation, before async Firebase sync
    setActiveTool('move');

    // Sync to Realtime Database (atomic add)
    // RTDB updates are fast - no need for debouncing
    try {
      await addCanvasObject('main', newShape);
    } catch (error) {
      console.error('Failed to add object to RTDB:', error);
      // Rollback optimistic update on error
      const { removeObject } = useCanvasStore.getState();
      removeObject(newShape.id);
    }

    // Reset state
    setIsCreating(false);
    setStartPoint(null);
    setPreviewShape(null);
  }, [isCreating, previewShape, addObject, setActiveTool]);

  return {
    previewShape,
    isCreating,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
