/**
 * LineResizeHandles Component
 *
 * Renders 2 endpoint resize handles specifically for line objects.
 * Unlike rectangle handles, lines only have handles at their 2 endpoints.
 */

import { useState, memo, useRef } from 'react';
import { Rect, Group } from 'react-konva';
import type Konva from 'konva';
import type { Line } from '@/types';
import { calculateLineProperties, getLineEndpoints } from '../utils/lineHelpers';
import { useToolStore, useCanvasStore } from '@/stores';
import { throttledUpdateCanvasObject } from '@/lib/firebase';

/**
 * LineResizeHandles component props
 */
interface LineResizeHandlesProps {
  /** Line object being resized */
  line: Line;
  /** Whether the line is selected */
  isSelected: boolean;
  /** Callback when resize ends with new line properties */
  onResizeEnd: (newLine: Partial<Line>) => void;
}

/**
 * Custom comparison function for React.memo optimization
 * Only re-render if line position/points, selection state, or tool changes
 */
function arePropsEqual(prevProps: LineResizeHandlesProps, nextProps: LineResizeHandlesProps): boolean {
  // Quick checks first
  if (prevProps.isSelected !== nextProps.isSelected) return false;

  // Compare line properties that affect handle positioning
  const prevLine = prevProps.line;
  const nextLine = nextProps.line;

  if (
    prevLine.x !== nextLine.x ||
    prevLine.y !== nextLine.y ||
    prevLine.points[0] !== nextLine.points[0] ||
    prevLine.points[1] !== nextLine.points[1] ||
    prevLine.points[2] !== nextLine.points[2] ||
    prevLine.points[3] !== nextLine.points[3]
  ) {
    return false;
  }

  // All checks passed - props are equal, don't re-render
  return true;
}

/**
 * LineResizeHandles component
 *
 * Renders 2 square handles at the endpoints of a line for resizing.
 * Dragging an endpoint changes the line's length, angle, and position.
 * Only visible when line is selected AND move tool is active.
 *
 * HANDLE POSITIONING:
 * - Handle 1: At absolute endpoint 1 (line.x + points[0], line.y + points[1])
 * - Handle 2: At absolute endpoint 2 (line.x + points[2], line.y + points[3])
 *
 * RESIZE BEHAVIOR:
 * - Dragging handle 1: Updates endpoint 1, recalculates all line properties (REAL-TIME)
 * - Dragging handle 2: Updates endpoint 2, recalculates all line properties (REAL-TIME)
 * - Uses calculateLineProperties to ensure position is MIN of endpoints
 *
 * @param {LineResizeHandlesProps} props - Component props
 * @returns {JSX.Element | null} LineResizeHandles component or null if not selected
 *
 * @example
 * ```tsx
 * <LineResizeHandles
 *   line={lineObject}
 *   isSelected={true}
 *   onResizeEnd={(newProps) => updateLine(newProps)}
 * />
 * ```
 */
export const LineResizeHandles = memo(function LineResizeHandles({
  line,
  isSelected,
  onResizeEnd,
}: LineResizeHandlesProps) {
  const { activeTool } = useToolStore();
  const { updateObject, projectId } = useCanvasStore();

  // Track which handle is being dragged (1 or 2, or null)
  const [draggingHandle, setDraggingHandle] = useState<1 | 2 | null>(null);

  // Refs for hover state
  const [hoveredHandle, setHoveredHandle] = useState<1 | 2 | null>(null);

  // Ref to track starting endpoint positions
  const dragStartRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Don't render if line is not selected or move tool is not active
  if (!isSelected || activeTool !== 'move') return null;

  // Get absolute endpoint coordinates
  const endpoints = getLineEndpoints(line);
  const { x1, y1, x2, y2 } = endpoints;

  /**
   * Handle drag start for endpoint 1
   */
  function handleDragStart1(e: Konva.KonvaEventObject<DragEvent>) {
    e.cancelBubble = true;
    setDraggingHandle(1);
    dragStartRef.current = { x1, y1, x2, y2 };
  }

  /**
   * Handle drag start for endpoint 2
   */
  function handleDragStart2(e: Konva.KonvaEventObject<DragEvent>) {
    e.cancelBubble = true;
    setDraggingHandle(2);
    dragStartRef.current = { x1, y1, x2, y2 };
  }

  /**
   * Handle drag move for endpoint 1
   * Updates endpoint 1 position and recalculates line properties IN REAL-TIME
   */
  function handleDragMove1(e: Konva.KonvaEventObject<DragEvent>) {
    const stage = e.target.getStage();
    if (!stage || !dragStartRef.current) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Get stage transform to convert screen coords to canvas coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPosition = transform.point(pointerPosition);

    // New endpoint 1 position, endpoint 2 stays the same
    const newX1 = canvasPosition.x;
    const newY1 = canvasPosition.y;
    const newX2 = dragStartRef.current.x2;
    const newY2 = dragStartRef.current.y2;

    // Recalculate all line properties from new endpoints
    const newProps = calculateLineProperties(newX1, newY1, newX2, newY2);

    // CRITICAL: Update line IMMEDIATELY for real-time visual feedback (optimistic update)
    updateObject(line.id, {
      x: newProps.x,
      y: newProps.y,
      points: newProps.points,
      width: newProps.width,
      rotation: newProps.rotation,
    });

    // Sync to Firebase (throttled)
    throttledUpdateCanvasObject(projectId, line.id, {
      x: newProps.x,
      y: newProps.y,
      points: newProps.points,
      width: newProps.width,
      rotation: newProps.rotation,
    });
  }

  /**
   * Handle drag move for endpoint 2
   * Updates endpoint 2 position and recalculates line properties IN REAL-TIME
   */
  function handleDragMove2(e: Konva.KonvaEventObject<DragEvent>) {
    const stage = e.target.getStage();
    if (!stage || !dragStartRef.current) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Get stage transform to convert screen coords to canvas coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPosition = transform.point(pointerPosition);

    // New endpoint 2 position, endpoint 1 stays the same
    const newX1 = dragStartRef.current.x1;
    const newY1 = dragStartRef.current.y1;
    const newX2 = canvasPosition.x;
    const newY2 = canvasPosition.y;

    // Recalculate all line properties from new endpoints
    const newProps = calculateLineProperties(newX1, newY1, newX2, newY2);

    // CRITICAL: Update line IMMEDIATELY for real-time visual feedback (optimistic update)
    updateObject(line.id, {
      x: newProps.x,
      y: newProps.y,
      points: newProps.points,
      width: newProps.width,
      rotation: newProps.rotation,
    });

    // Sync to Firebase (throttled)
    throttledUpdateCanvasObject(projectId, line.id, {
      x: newProps.x,
      y: newProps.y,
      points: newProps.points,
      width: newProps.width,
      rotation: newProps.rotation,
    });
  }

  /**
   * Handle drag end for endpoint 1
   * Finalizes resize and calls onResizeEnd with new line properties
   */
  function handleDragEnd1(e: Konva.KonvaEventObject<DragEvent>) {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage || !dragStartRef.current) {
      setDraggingHandle(null);
      return;
    }

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) {
      setDraggingHandle(null);
      return;
    }

    // Get stage transform to convert screen coords to canvas coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPosition = transform.point(pointerPosition);

    // New endpoint 1 position, endpoint 2 stays the same
    const newX1 = canvasPosition.x;
    const newY1 = canvasPosition.y;
    const newX2 = dragStartRef.current.x2;
    const newY2 = dragStartRef.current.y2;

    // Recalculate all line properties from new endpoints
    const newProps = calculateLineProperties(newX1, newY1, newX2, newY2);

    // Call callback with new line properties
    onResizeEnd({
      x: newProps.x,
      y: newProps.y,
      points: newProps.points,
      width: newProps.width,
      rotation: newProps.rotation,
    });

    setDraggingHandle(null);
    dragStartRef.current = null;
  }

  /**
   * Handle drag end for endpoint 2
   * Finalizes resize and calls onResizeEnd with new line properties
   */
  function handleDragEnd2(e: Konva.KonvaEventObject<DragEvent>) {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage || !dragStartRef.current) {
      setDraggingHandle(null);
      return;
    }

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) {
      setDraggingHandle(null);
      return;
    }

    // Get stage transform to convert screen coords to canvas coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPosition = transform.point(pointerPosition);

    // New endpoint 2 position, endpoint 1 stays the same
    const newX1 = dragStartRef.current.x1;
    const newY1 = dragStartRef.current.y1;
    const newX2 = canvasPosition.x;
    const newY2 = canvasPosition.y;

    // Recalculate all line properties from new endpoints
    const newProps = calculateLineProperties(newX1, newY1, newX2, newY2);

    // Call callback with new line properties
    onResizeEnd({
      x: newProps.x,
      y: newProps.y,
      points: newProps.points,
      width: newProps.width,
      rotation: newProps.rotation,
    });

    setDraggingHandle(null);
    dragStartRef.current = null;
  }

  /**
   * Handle mouse enter for endpoint handles
   * Changes cursor to pointer
   */
  function handleMouseEnter(handleNum: 1 | 2) {
    return (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      setHoveredHandle(handleNum);
      stage.container().style.cursor = 'pointer';
    };
  }

  /**
   * Handle mouse leave for endpoint handles
   * Resets cursor
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    setHoveredHandle(null);
    stage.container().style.cursor = 'default';
  }

  // Handle size and styling (matching other shape handles)
  const handleSize = 8;
  const handleStrokeWidth = 2;

  return (
    <Group
      // Add name for hiding during export/preview
      name="resize-handles"
    >
      {/* Handle 1 - First endpoint (square, matching other shapes) */}
      <Rect
        x={x1}
        y={y1}
        width={handleSize}
        height={handleSize}
        offsetX={handleSize / 2}
        offsetY={handleSize / 2}
        fill="#ffffff"
        stroke="#0ea5e9"
        strokeWidth={handleStrokeWidth}
        opacity={hoveredHandle === 1 || draggingHandle === 1 ? 1 : 0.9}
        draggable={true}
        onDragStart={handleDragStart1}
        onDragMove={handleDragMove1}
        onDragEnd={handleDragEnd1}
        onMouseEnter={handleMouseEnter(1)}
        onMouseLeave={handleMouseLeave}
      />

      {/* Handle 2 - Second endpoint (square, matching other shapes) */}
      <Rect
        x={x2}
        y={y2}
        width={handleSize}
        height={handleSize}
        offsetX={handleSize / 2}
        offsetY={handleSize / 2}
        fill="#ffffff"
        stroke="#0ea5e9"
        strokeWidth={handleStrokeWidth}
        opacity={hoveredHandle === 2 || draggingHandle === 2 ? 1 : 0.9}
        draggable={true}
        onDragStart={handleDragStart2}
        onDragMove={handleDragMove2}
        onDragEnd={handleDragEnd2}
        onMouseEnter={handleMouseEnter(2)}
        onMouseLeave={handleMouseLeave}
      />
    </Group>
  );
}, arePropsEqual);
