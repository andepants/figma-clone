/**
 * CanvasStage Component
 *
 * Main Konva canvas stage component that handles rendering, pan, zoom, and interactions.
 * This is the core of the collaborative canvas application.
 */

import { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle as KonvaCircle } from 'react-konva';
import type Konva from 'konva';
import { useShapeCreation, useWindowResize, useSpacebarPan, useTouchGestures } from '../hooks';
import { Rectangle, Circle, TextShape } from '../shapes';
import { useToolStore, useCanvasStore } from '@/stores';
import type { Rectangle as RectangleType, Circle as CircleType, Text as TextType } from '@/types';
import { useCursors, useDragStates, useRemoteSelections, useRemoteResizes } from '@/features/collaboration/hooks';
import { Cursor, SelectionOverlay, RemoteResizeOverlay } from '@/features/collaboration/components';
import { getUserColor } from '@/features/collaboration/utils';
import { throttledUpdateCursor, updateSelection } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { screenToCanvasCoords } from '../utils';

/**
 * Canvas stage position interface
 * @interface Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */
interface Position {
  x: number;
  y: number;
}

/**
 * CanvasStage component
 * Renders the main Konva stage with pan and zoom capabilities
 * @returns {JSX.Element} Canvas stage component
 */
export function CanvasStage() {
  // Get active tool to control canvas behavior
  const { activeTool } = useToolStore();

  // Get canvas objects, selection, zoom and pan from store
  const { objects, selectedId, selectObject, clearSelection, zoom, panX, panY, setZoom, setPan } = useCanvasStore();

  // Shape creation handlers
  const { previewShape, handleMouseDown, handleMouseMove, handleMouseUp } =
    useShapeCreation();

  // Auth and collaboration
  const { currentUser } = useAuth();
  const cursors = useCursors('main');
  const dragStates = useDragStates('main');
  const remoteSelections = useRemoteSelections('main');
  const remoteResizes = useRemoteResizes('main');

  // Canvas dimensions (full window size with debounced resize)
  const dimensions = useWindowResize(100);

  // Spacebar panning state
  const { isSpacePressed, isPanning, setIsPanning } = useSpacebarPan();

  // Track mouse position to distinguish clicks from drags
  const mouseDownPos = useRef<Position | null>(null);

  // Reference to the Konva stage
  const stageRef = useRef<Konva.Stage | null>(null);

  // Touch gesture handlers
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures(
    stageRef,
    setZoom,
    setPan
  );

  /**
   * Sync local selection to Realtime DB
   * Emits selection changes so other users can see what's selected
   */
  useEffect(() => {
    if (!currentUser) return;

    // Update selection in Realtime DB
    updateSelection('main', currentUser.uid, selectedId);
  }, [selectedId, currentUser]);

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

      setZoom(clampedScale);
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
   * @param {Konva.KonvaEventObject<MouseEvent>} e - Mouse event
   */
  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (pointerPos) {
      mouseDownPos.current = { x: pointerPos.x, y: pointerPos.y };
    }

    // Continue with shape creation if needed
    handleMouseDown(e);
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
    if (!stage || !currentUser) return;

    // Get canvas coordinates (accounting for pan and zoom)
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const canvasCoords = screenToCanvasCoords(stage, pointerPosition);

    // Update cursor position in Realtime DB (throttled to 50ms)
    // Use username (displayName) with fallback to email if not set
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    throttledUpdateCursor('main', currentUser.uid, canvasCoords, username, color);
  }

  // Stage is draggable when spacebar is pressed
  const isDraggable = isSpacePressed;

  // Determine cursor style based on state
  let cursorStyle = activeTool === 'move' ? 'pointer' : 'crosshair';
  if (isSpacePressed) {
    cursorStyle = isPanning ? 'grabbing' : 'grab';
  }

  return (
    <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      draggable={isDraggable}
      x={panX}
      y={panY}
      scaleX={zoom}
      scaleY={zoom}
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onMouseDown={handleStageMouseDown}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleCursorMove();
      }}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: cursorStyle,
        touchAction: 'none', // Prevent default touch behaviors like page zoom
      }}
    >
      {/* Background Layer - Infinite canvas feel */}
      <Layer listening={false}>
        <Rect
          x={-10000}
          y={-10000}
          width={20000}
          height={20000}
          fill="#f5f5f5"
        />
      </Layer>

      {/* Objects Layer (shapes and preview) */}
      <Layer>
        {/* Render persisted rectangles from store */}
        {objects
          .filter((obj) => obj.type === 'rectangle')
          .map((obj) => {
            // Find if this object is being dragged by another user
            const remoteDragState = dragStates.find((state) => state.objectId === obj.id);

            return (
              <Rectangle
                key={obj.id}
                rectangle={obj as RectangleType}
                isSelected={selectedId === obj.id}
                onSelect={() => selectObject(obj.id)}
                remoteDragState={remoteDragState}
              />
            );
          })}

        {/* Render persisted circles from store */}
        {objects
          .filter((obj) => obj.type === 'circle')
          .map((obj) => {
            // Find if this object is being dragged by another user
            const remoteDragState = dragStates.find((state) => state.objectId === obj.id);

            return (
              <Circle
                key={obj.id}
                circle={obj as CircleType}
                isSelected={selectedId === obj.id}
                onSelect={() => selectObject(obj.id)}
                remoteDragState={remoteDragState}
              />
            );
          })}

        {/* Render persisted text shapes from store */}
        {objects
          .filter((obj) => obj.type === 'text')
          .map((obj) => {
            // Find if this object is being dragged by another user
            const remoteDragState = dragStates.find((state) => state.objectId === obj.id);

            return (
              <TextShape
                key={obj.id}
                text={obj as TextType}
                isSelected={selectedId === obj.id}
                onSelect={() => selectObject(obj.id)}
                remoteDragState={remoteDragState}
              />
            );
          })}

        {/* Render remote selection overlays */}
        {remoteSelections.map((selection) => {
          const object = objects.find((obj) => obj.id === selection.objectId);
          if (!object) return null;

          return (
            <SelectionOverlay
              key={`selection-${selection.userId}-${selection.objectId}`}
              object={object}
              selection={selection}
              showBadge={false} // Can enable on hover if needed
            />
          );
        })}

        {/* Render remote resize overlays - show other users' resize operations */}
        {remoteResizes.map((resizeState) => (
          <RemoteResizeOverlay
            key={`resize-${resizeState.userId}-${resizeState.objectId}`}
            resizeState={resizeState}
          />
        ))}

        {/* Preview shape (while creating) */}
        {previewShape && previewShape.type === 'rectangle' && (
          <Rect
            x={previewShape.x}
            y={previewShape.y}
            width={previewShape.width}
            height={previewShape.height}
            fill="transparent"
            stroke="#0ea5e9"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
          />
        )}

        {/* Preview circle (while creating) */}
        {previewShape && previewShape.type === 'circle' && (
          <KonvaCircle
            x={previewShape.x}
            y={previewShape.y}
            radius={previewShape.radius}
            fill="transparent"
            stroke="#ef4444"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
          />
        )}
      </Layer>

      {/* Cursors Layer - Render other users' cursors */}
      <Layer listening={false}>
        {cursors.map((cursor) => (
          <Cursor
            key={cursor.userId}
            x={cursor.x}
            y={cursor.y}
            username={cursor.username}
            color={cursor.color}
          />
        ))}
      </Layer>
    </Stage>
  );
}
