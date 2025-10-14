/**
 * ResizeHandle Component
 *
 * Renders a single corner resize handle for canvas objects.
 * Provides visual feedback on hover and handles drag interactions for resizing.
 */

import { useState, memo, useRef, useEffect } from 'react';
import { Rect, Group, Label, Tag, Text } from 'react-konva';
import type Konva from 'konva';
import type { ResizeHandle as ResizeHandleType } from '@/types';
import { RESIZE_HANDLE_SIZE, RESIZE_CURSORS } from '@/constants';

/**
 * ResizeHandle component props
 */
interface ResizeHandleProps {
  /** Which corner this handle represents (nw, ne, sw, se) */
  handle: ResizeHandleType;
  /** Handle center x position in canvas coordinates */
  x: number;
  /** Handle center y position in canvas coordinates */
  y: number;
  /** Whether the parent object is selected */
  isSelected: boolean;
  /** Callback when resize starts */
  onResizeStart: (handle: ResizeHandleType) => void;
  /** Callback during resize with current pointer position */
  onResizeMove: (x: number, y: number) => void;
  /** Callback when resize ends */
  onResizeEnd: () => void;
}

/**
 * ResizeHandle component
 *
 * Renders a single corner resize handle with hover effects and drag support.
 * Handles are small white squares with blue borders that appear when an object is selected.
 *
 * @param {ResizeHandleProps} props - Component props
 * @returns {JSX.Element} ResizeHandle component
 *
 * @example
 * ```tsx
 * <ResizeHandle
 *   handle="nw"
 *   x={100}
 *   y={100}
 *   isSelected={true}
 *   onResizeStart={(handle) => startResize(handle)}
 *   onResizeMove={(x, y) => updateResize(x, y)}
 *   onResizeEnd={() => endResize()}
 * />
 * ```
 */
/**
 * Map of directional arrows for each handle
 */
const HANDLE_ARROWS: Record<ResizeHandleType, string> = {
  nw: '↖',
  ne: '↗',
  sw: '↙',
  se: '↘',
};

/**
 * Custom comparison function for React.memo optimization
 * Only re-render if position or selection state changes
 */
function arePropsEqual(prevProps: ResizeHandleProps, nextProps: ResizeHandleProps): boolean {
  return (
    prevProps.handle === nextProps.handle &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.isSelected === nextProps.isSelected
    // Deliberately ignore callback functions - they shouldn't trigger re-renders
  );
}

export const ResizeHandle = memo(function ResizeHandle({
  handle,
  x,
  y,
  isSelected,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: ResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const handleRef = useRef<Konva.Rect>(null);

  // Track whether this handle is currently being dragged
  const isDraggingRef = useRef(false);

  /**
   * Animate scale on hover state change
   * Smoothly scales handle from 1 to 1.1 on hover
   */
  useEffect(() => {
    if (!handleRef.current) return;

    handleRef.current.to({
      scaleX: isHovered ? 1.1 : 1,
      scaleY: isHovered ? 1.1 : 1,
      duration: 0.15, // 150ms as specified
    });
  }, [isHovered]);

  /**
   * Handle mouse enter
   * Sets hover state and changes cursor to appropriate resize cursor
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    setIsHovered(true);
    stage.container().style.cursor = RESIZE_CURSORS[handle];
  }

  /**
   * Handle mouse leave
   * Clears hover state and resets cursor
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    setIsHovered(false);
    stage.container().style.cursor = 'default';
  }

  /**
   * Handle drag start
   * Initiates resize operation
   *
   * Note: We don't call onResizeMove here because React state updates are async.
   * The first handleDragMove event will happen naturally within milliseconds.
   */
  function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to parent objects
    e.cancelBubble = true;
    isDraggingRef.current = true;
    onResizeStart(handle);
  }

  /**
   * Handle drag move
   * Updates resize with current pointer position
   */
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Get stage transform to convert screen coords to canvas coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPosition = transform.point(pointerPosition);

    onResizeMove(canvasPosition.x, canvasPosition.y);
  }

  /**
   * Handle drag end
   * Completes resize operation and resets handle to calculated position
   */
  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to parent objects
    e.cancelBubble = true;
    isDraggingRef.current = false;

    // Snap handle back to calculated position (from props)
    if (handleRef.current) {
      handleRef.current.position({ x, y });
    }

    onResizeEnd();
  }

  // Only render when parent object is selected
  if (!isSelected) return null;

  // Tooltip text with directional arrow and keyboard shortcuts
  const tooltipText = `${HANDLE_ARROWS[handle]} Resize\n⇧ Lock aspect  ⌥ From center`;

  return (
    <Group>
      <Rect
        ref={handleRef}
        x={x}
        y={y}
        width={RESIZE_HANDLE_SIZE}
        height={RESIZE_HANDLE_SIZE}
        fill="#ffffff"
        stroke="#0ea5e9"
        strokeWidth={isHovered ? 2 : 1.5}
        opacity={isHovered ? 1 : 0.9}
        draggable={isSelected}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        // Allow handle to move freely with mouse during drag
        // After drag ends, it snaps back to calculated position
        // Set offset to center for scale animation around center point
        offsetX={RESIZE_HANDLE_SIZE / 2}
        offsetY={RESIZE_HANDLE_SIZE / 2}
      />

      {/* Tooltip - only visible on hover */}
      {isHovered && (
        <Label
          x={x}
          y={y - 35}
          opacity={0.9}
        >
          <Tag
            fill="#1e293b"
            cornerRadius={4}
            pointerDirection="down"
            pointerWidth={6}
            pointerHeight={6}
          />
          <Text
            text={tooltipText}
            fontFamily="Inter, system-ui, sans-serif"
            fontSize={11}
            padding={8}
            fill="white"
            lineHeight={1.4}
            align="center"
          />
        </Label>
      )}
    </Group>
  );
}, arePropsEqual);
