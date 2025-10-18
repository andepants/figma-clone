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
import { screenToCanvasCoords } from '../utils/coordinates';
import { getUserColor } from '@/features/collaboration/utils';
import { generateLayerName } from '@/features/layers-panel/utils';
import type { CanvasObject, Rectangle, Circle, Text, Line } from '@/types';
import { TEXT_DEFAULTS, DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT } from '@/constants';
import {
  calculateRectanglePreview,
  calculateCirclePreview,
  calculateLinePreview,
  finalizeRectangle,
  finalizeCircle,
  finalizeLine,
  type Point,
} from './shape-creation/shapeCreationHelpers';
import {
  addShapeToFirebase,
  createTextWithEditingLock,
} from './shape-creation/shapeCreationFirebase';

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
  const { addObject, clearSelection, setEditingText, projectId } = useCanvasStore();
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
    if (activeTool !== 'rectangle' && activeTool !== 'circle' && activeTool !== 'text' && activeTool !== 'line' && isCreating) {
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
   * Create text object with immediate edit mode
   *
   * Creates text at click position and enters edit mode immediately.
   * Uses optimistic updates with parallel Firebase sync and lock acquisition.
   */
  const createText = useCallback(
    async (canvasPos: Point) => {
      if (!currentUser) return;

      // Get current objects for name generation
      const objects = useCanvasStore.getState().objects;
      const name = generateLayerName('text', objects);

      // Create text shape immediately with all default typography properties
      // Text boxes are fixed-size containers (like rectangles) that hold text
      // Start with placeholder text so it's visible while edit mode loads
      const newText: Text = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        x: canvasPos.x,
        y: canvasPos.y,
        text: 'Start typing...', // Placeholder text - visible while editing starts
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
        name, // Auto-generated name (e.g., "Text 1")
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // CRITICAL: Switch to move tool BEFORE entering edit mode
      // This prevents the "tool changed while editing" effect from triggering auto-save
      setActiveTool('move');

      // Get user metadata for editing lock
      const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
      const color = getUserColor(currentUser.uid);

      // Create text with optimistic editing lock
      await createTextWithEditingLock(
        projectId,
        newText,
        currentUser.uid,
        username,
        color,
        addObject,
        setEditingText
      );
    },
    [currentUser, addObject, setActiveTool, setEditingText, projectId]
  );

  /**
   * Handle mouse down - start shape creation
   * Only activates when rectangle, circle, text, or line tool is selected
   *
   * For text tool: Creates text immediately on click (no drag)
   * For shapes/lines: Starts drag-to-create flow
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only create shapes when rectangle, circle, text, or line tool is active
      if (activeTool !== 'rectangle' && activeTool !== 'circle' && activeTool !== 'text' && activeTool !== 'line') return;

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
        createText(canvasPos);
        return;
      }

      // For rectangles, circles, and lines: Start drag creation flow
      setStartPoint(canvasPos);
      setIsCreating(true);
    },
    [activeTool, clearSelection, createText]
  );

  /**
   * Handle mouse move - update preview shape
   * Shows dynamic sizing as user drags
   * For rectangles: shows width x height
   * For circles: shows radius from center point
   * For lines: shows line from start point to current point
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

      // Get user ID for preview
      const userId = currentUser?.uid || 'unknown';

      // Create preview shape based on active tool
      let preview: CanvasObject;

      if (activeTool === 'rectangle') {
        preview = calculateRectanglePreview(startPoint, currentPos, userId);
      } else if (activeTool === 'circle') {
        preview = calculateCirclePreview(startPoint, currentPos, userId);
      } else if (activeTool === 'line') {
        preview = calculateLinePreview(startPoint, currentPos, userId);
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

    // Get current objects for name generation
    const objects = useCanvasStore.getState().objects;
    const userId = currentUser?.uid || 'unknown';

    // Create final shape with unique ID based on type
    let newShape: CanvasObject | null = null;

    if (previewShape.type === 'rectangle') {
      newShape = finalizeRectangle(previewShape as Rectangle, objects);
    } else if (previewShape.type === 'circle') {
      newShape = finalizeCircle(previewShape as Circle, objects);
    } else if (previewShape.type === 'line') {
      newShape = finalizeLine(previewShape as Line, startPoint, objects, userId);
    }

    // Reset state before async operations
    setIsCreating(false);
    setStartPoint(null);
    setPreviewShape(null);

    // Abort if no shape was created
    if (!newShape) return;

    // Auto-switch back to move tool (Figma-style behavior)
    // Happens immediately after creation, before async Firebase sync
    setActiveTool('move');

    // Add shape to Firebase with optimistic update
    try {
      await addShapeToFirebase(projectId, newShape, addObject);
    } catch {
      // Error already handled by addShapeToFirebase (rollback complete)
      // Could show toast notification here
    }
  }, [isCreating, previewShape, startPoint, currentUser, addObject, setActiveTool, projectId]);

  return {
    previewShape,
    isCreating,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
