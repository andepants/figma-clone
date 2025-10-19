/**
 * Stage Event Handlers Hook
 *
 * Consolidated event handlers for the Konva stage:
 * - Mouse wheel (pan/zoom)
 * - Stage dragging (spacebar pan)
 * - Mouse down/click (selection)
 * - Cursor movement (collaboration)
 */

import { useRef } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores';
import { throttledUpdateCursor } from '@/lib/firebase';
import { screenToCanvasCoords } from '../../utils';
import { getUserDisplayName, debounce } from '@/lib/utils';

/**
 * Position interface
 * @interface Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Hook parameters
 * @interface UseStageHandlersParams
 * @property {React.RefObject<Konva.Stage | null>} stageRef - Reference to the Konva stage
 * @property {string} projectId - Project/canvas ID
 * @property {number} panX - Current pan X position
 * @property {number} panY - Current pan Y position
 * @property {number} zoom - Current zoom level
 * @property {(scale: number) => void} setZoom - Function to update zoom level
 * @property {(x: number, y: number) => void} setPan - Function to update pan position
 * @property {(isPanning: boolean) => void} setIsPanning - Function to update panning state
 * @property {object} currentUser - Current authenticated user
 * @property {(e: Konva.KonvaEventObject<MouseEvent>) => void} handleMouseDown - Shape creation mouse down handler
 * @property {(e: Konva.KonvaEventObject<MouseEvent>) => void} handleDragSelectMouseDown - Drag select mouse down handler
 */
interface UseStageHandlersParams {
  stageRef: React.RefObject<Konva.Stage | null>;
  projectId: string;
  panX: number;
  panY: number;
  zoom: number;
  setZoom: (scale: number) => void;
  setPan: (x: number, y: number) => void;
  setIsPanning: (isPanning: boolean) => void;
  currentUser: { uid: string; username?: string | null; email?: string | null } | null;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleDragSelectMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * Stage event handlers hook
 * @param {UseStageHandlersParams} params - Hook parameters
 * @returns Event handler functions
 */
export function useStageHandlers({
  stageRef,
  projectId,
  panX,
  panY,
  setZoom,
  setPan,
  setIsPanning,
  currentUser,
  handleMouseDown,
  handleDragSelectMouseDown,
}: UseStageHandlersParams) {
  // Track mouse position to distinguish clicks from drags
  const mouseDownPos = useRef<Position | null>(null);

  // Get canvas store methods
  const { clearSelection, setLastCanvasMousePosition } = useCanvasStore();

  // Debounced zoom update to reduce re-renders during scroll zoom
  // Immediate Konva stage update for smooth feel, debounced store update
  const debouncedZoomUpdate = useRef(
    debounce((...args: unknown[]) => {
      const newZoom = args[0] as number;
      setZoom(newZoom);
    }, 16) // ~60fps
  ).current;

  /**
   * Handle mouse wheel for panning and zooming
   * - Cmd/Ctrl + scroll = zoom (Figma style)
   * - Regular scroll = pan
   * @param {Konva.KonvaEventObject<WheelEvent>} e - Wheel event
   */
  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    // Check if Cmd (Mac) or Ctrl (Windows) is pressed
    const isZoomModifier = e.evt.metaKey || e.evt.ctrlKey;

    if (isZoomModifier) {
      // ZOOM behavior (Cmd/Ctrl + scroll or trackpad pinch)
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate new scale (zoom in/out by 10% per wheel tick)
      const scaleBy = 1.1;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Clamp scale between 0.1x and 5.0x
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      // Calculate new position to zoom towards cursor
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      // Apply zoom and pan immediately to Konva stage for smooth feel
      stage.scale({ x: clampedScale, y: clampedScale });
      stage.position(newPos);

      // Update store with debounce to avoid excessive re-renders
      debouncedZoomUpdate(clampedScale);
      setPan(newPos.x, newPos.y);
    } else {
      // PAN behavior (regular scroll or two-finger trackpad drag)
      // Pan sensitivity factor (adjust to taste)
      const panSpeed = 1;

      const newPos = {
        x: panX - e.evt.deltaX * panSpeed,
        y: panY - e.evt.deltaY * panSpeed,
      };

      setPan(newPos.x, newPos.y);
    }
  }

  /**
   * Handle stage drag start
   * Prevents stage from dragging when dragging a shape
   * @param {Konva.KonvaEventObject<DragEvent>} e - Drag event
   */
  function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Only allow stage drag if we're dragging the stage itself, not a shape
    const isDraggingStage = e.target === e.target.getStage();
    if (!isDraggingStage) {
      // Cancel stage drag if we're dragging a shape
      e.target.stopDrag();
    } else {
      // Mark that we're actively panning
      setIsPanning(true);
    }
  }

  /**
   * Handle stage drag end
   * Updates stage position after panning
   * @param {Konva.KonvaEventObject<DragEvent>} e - Drag event
   */
  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    setPan(e.target.x(), e.target.y());
    // End panning state
    setIsPanning(false);
  }

  /**
   * Handle stage mouse down
   * Track position to distinguish clicks from drags
   * Combines shape creation and drag-to-select
   * @param {Konva.KonvaEventObject<MouseEvent>} e - Mouse event
   */
  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (pointerPos) {
      mouseDownPos.current = { x: pointerPos.x, y: pointerPos.y };
    }

    // Shape creation if needed
    handleMouseDown(e);

    // Drag-to-select (only activates if clicking on empty canvas with move tool)
    handleDragSelectMouseDown(e);
  }

  /**
   * Handle stage click
   * Clears selection when clicking on background (not dragging)
   * @param {Konva.KonvaEventObject<MouseEvent>} e - Mouse event
   */
  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    // Check if clicked on stage itself (background)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (!clickedOnEmpty) return;

    // CRITICAL: Don't clear selection if we're editing text
    // This prevents the edit session from being interrupted
    const { editingTextId } = useCanvasStore.getState();
    if (editingTextId) {
      return;
    }

    // Get current pointer position
    const currentPos = stage.getPointerPosition();
    if (!currentPos || !mouseDownPos.current) return;

    // Calculate distance moved since mousedown
    const dx = currentPos.x - mouseDownPos.current.x;
    const dy = currentPos.y - mouseDownPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only deselect if it was a true click (moved less than 5px)
    // This prevents deselection when panning the canvas
    if (distance < 5) {
      clearSelection();
    }

    // Clear the tracked position
    mouseDownPos.current = null;
  }

  /**
   * Handle cursor position updates
   * Sends throttled cursor position updates to Firebase
   */
  function handleCursorMove() {
    const stage = stageRef.current;
    if (!stage) return;

    // Get canvas coordinates (accounting for pan and zoom)
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const canvasCoords = screenToCanvasCoords(stage, pointerPosition);

    // Track mouse position for paste functionality
    setLastCanvasMousePosition(canvasCoords);

    // Update cursor position in Realtime DB (throttled to 50ms)
    // Use username with smart fallback to email username (not full email)
    if (currentUser) {
      const username = getUserDisplayName(
        currentUser.username ?? null,
        currentUser.email ?? null
      );
      const color = '#0ea5e9'; // Default color, will be user-specific in getUserColor

      throttledUpdateCursor(projectId, currentUser.uid, canvasCoords, username, color);
    }
  }

  /**
   * Handle mouse leaving canvas
   * Clears mouse position tracking when cursor exits canvas
   */
  function handleMouseLeave() {
    setLastCanvasMousePosition(null);
  }

  return {
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleStageMouseDown,
    handleStageClick,
    handleCursorMove,
    handleMouseLeave,
  };
}
