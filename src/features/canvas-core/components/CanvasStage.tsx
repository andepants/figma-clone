/**
 * CanvasStage Component
 *
 * Main Konva canvas stage component that handles rendering, pan, zoom, and interactions.
 * This is the core of the collaborative canvas application.
 */

import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useShapeCreation } from '../hooks';
import { Rectangle } from '../shapes';
import { useToolStore, useCanvasStore } from '@/stores';
import type { Rectangle as RectangleType } from '@/types';

/**
 * Canvas stage dimensions interface
 * @interface Dimensions
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 */
interface Dimensions {
  width: number;
  height: number;
}

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

  // Get canvas objects and selection
  const { objects, selectedId, selectObject, clearSelection } = useCanvasStore();

  // Shape creation handlers
  const { previewShape, handleMouseDown, handleMouseMove, handleMouseUp } =
    useShapeCreation();

  // Canvas dimensions (full window size)
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Stage position for panning
  const [stagePos, setStagePos] = useState<Position>({ x: 0, y: 0 });

  // Stage scale for zooming
  const [stageScale, setStageScale] = useState<number>(1);

  // Spacebar panning state
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  // Reference to the Konva stage
  const stageRef = useRef<Konva.Stage>(null);

  /**
   * Handle window resize with debounce
   * Updates canvas dimensions to match window size
   */
  useEffect(() => {
    let timeoutId: number;

    function handleResize() {
      // Debounce resize for performance (100ms)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Handle spacebar press for panning mode
   * Enables temporary pan mode when spacebar is held
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check if spacebar is pressed and not already in pan mode
      // Prevent if user is typing in an input field
      if (
        e.code === 'Space' &&
        !isSpacePressed &&
        e.target instanceof HTMLElement &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

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

      setStageScale(clampedScale);
      setStagePos(newPos);
    } else {
      // PAN behavior (regular scroll or two-finger trackpad drag)
      // Pan sensitivity factor (adjust to taste)
      const panSpeed = 1;

      const newPos = {
        x: stagePos.x - e.evt.deltaX * panSpeed,
        y: stagePos.y - e.evt.deltaY * panSpeed,
      };

      setStagePos(newPos);
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
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
    // End panning state
    setIsPanning(false);
  }

  /**
   * Handle stage click
   * Clears selection when clicking on background
   * @param {Konva.KonvaEventObject<MouseEvent>} e - Mouse event
   */
  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    // Check if clicked on stage itself (background)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty && activeTool === 'select') {
      clearSelection();
    }
  }

  // Stage is draggable when spacebar is pressed
  const isDraggable = isSpacePressed;

  // Determine cursor style based on state
  let cursorStyle = activeTool === 'select' ? 'pointer' : 'crosshair';
  if (isSpacePressed) {
    cursorStyle = isPanning ? 'grabbing' : 'grab';
  }

  return (
    <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      draggable={isDraggable}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={stageScale}
      scaleY={stageScale}
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        cursor: cursorStyle,
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
          .map((obj) => (
            <Rectangle
              key={obj.id}
              rectangle={obj as RectangleType}
              isSelected={selectedId === obj.id}
              onSelect={() => selectObject(obj.id)}
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
      </Layer>
    </Stage>
  );
}
