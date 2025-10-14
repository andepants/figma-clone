/**
 * Rectangle Shape Component
 *
 * Renders a rectangle shape on the canvas with selection and drag capabilities.
 */

import { useState, useEffect, useRef, memo, Fragment } from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { Rectangle as RectangleType } from '@/types';
import { useToolStore, useCanvasStore } from '@/stores';
import {
  updateCanvasObject,
  throttledUpdateCanvasObject,
  startDragging,
  throttledUpdateDragPosition,
  throttledUpdateCursor,
  endDragging,
} from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '@/features/collaboration/utils';
import { screenToCanvasCoords } from '../utils';
import { ResizeHandles } from '../components';
import { useResize } from '../hooks';

/**
 * Rectangle component props
 */
interface RectangleProps {
  /** Rectangle data */
  rectangle: RectangleType;
  /** Whether this rectangle is currently selected */
  isSelected: boolean;
  /** Callback when rectangle is selected */
  onSelect: () => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
}

/**
 * Rectangle shape component
 *
 * Renders a Konva rectangle with selection, drag, and interaction support.
 * Only allows selection and dragging when the move tool is active.
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * @param {RectangleProps} props - Component props
 * @returns {JSX.Element} Rectangle component
 *
 * @example
 * ```tsx
 * <Rectangle
 *   rectangle={rectangleData}
 *   isSelected={selectedId === rectangleData.id}
 *   onSelect={() => selectObject(rectangleData.id)}
 * />
 * ```
 */
export const Rectangle = memo(function Rectangle({
  rectangle,
  isSelected,
  onSelect,
  remoteDragState
}: RectangleProps) {
  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation
  const shapeRef = useRef<Konva.Rect>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? rectangle.x;
  const displayY = remoteDragState?.y ?? rectangle.y;

  /**
   * Animate selection changes
   * Smoothly transitions stroke properties when selection state changes
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    // Cancel any previous animation to prevent buildup
    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }

    // Animate selection change
    if (isSelected) {
      // Animate to selected state (subtle scale pulse for Figma-style feedback)
      node.to({
        scaleX: (rectangle.scaleX ?? 1) * 1.01,
        scaleY: (rectangle.scaleY ?? 1) * 1.01,
        duration: 0.1,
        onFinish: () => {
          // Return to normal scale
          node.to({
            scaleX: rectangle.scaleX ?? 1,
            scaleY: rectangle.scaleY ?? 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected, rectangle.scaleX, rectangle.scaleY]);

  /**
   * Handle click on rectangle
   * Only triggers selection when move tool is active
   */
  function handleClick() {
    if (activeTool === 'move') {
      onSelect();
    }
  }

  /**
   * Handle drag start
   * Checks for drag lock and prevents stage from dragging when dragging a shape
   */
  async function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    if (!currentUser) return;

    // Attempt to acquire drag lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canDrag = await startDragging(
      'main',
      rectangle.id,
      currentUser.uid,
      { x: rectangle.x, y: rectangle.y },
      username,
      color
    );

    if (!canDrag) {
      // Another user is dragging this object
      console.log('Another user is editing this object');

      // Cancel the drag
      e.target.stopDrag();
      return;
    }
  }

  /**
   * Handle drag move
   * Emits throttled position updates to Realtime DB for real-time sync
   * Also updates cursor position so other users see cursor moving with object
   *
   * CRITICAL: Updates BOTH drag state AND object position to keep them in sync
   * This prevents flash-back bugs when drag ends.
   */
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const stage = node.getStage();
    // With offset, node.x() returns CENTER position, subtract offset to get top-left
    const position = {
      x: node.x() - rectangle.width / 2,
      y: node.y() - rectangle.height / 2
    };

    // Update local store immediately (optimistic update)
    updateObject(rectangle.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition('main', rectangle.id, position);
    throttledUpdateCanvasObject('main', rectangle.id, position); // ← CRITICAL: Keep object current!

    // Update cursor position during drag so other users see cursor moving with object
    if (stage && currentUser) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasCoords = screenToCanvasCoords(stage, pointerPosition);
        const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
        const color = getUserColor(currentUser.uid);
        throttledUpdateCursor('main', currentUser.uid, canvasCoords, username, color);
      }
    }
  }

  /**
   * Handle drag end
   * Updates rectangle position in store and syncs to Realtime Database
   *
   * CRITICAL FIX: Updates object IMMEDIATELY (no throttle) BEFORE clearing drag state
   * This eliminates the flash-back bug by ensuring object position is current
   * when remote users fall back from drag state to object position.
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;
    // With offset, node.x() returns CENTER position, subtract offset to get top-left
    const position = {
      x: node.x() - rectangle.width / 2,
      y: node.y() - rectangle.height / 2
    };

    // Update local store (optimistic update)
    updateObject(rectangle.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject('main', rectangle.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging('main', rectangle.id);
  }

  /**
   * Handle mouse enter
   * Changes cursor and sets hover state
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Set hover state for visual feedback
    if (activeTool === 'move') {
      setIsHovered(true);
      stage.container().style.cursor = 'move';
    }
  }

  /**
   * Handle mouse leave
   * Resets cursor and hover state
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Clear hover state
    setIsHovered(false);

    // Reset cursor based on active tool
    stage.container().style.cursor = activeTool === 'move' ? 'pointer' : 'crosshair';
  }

  // Determine stroke styling based on state
  const getStroke = () => {
    if (isRemoteDragging) return remoteDragState.color; // Remote drag: user's color
    if (isSelected) return '#0ea5e9'; // Selected: bright blue
    if (isHovered && activeTool === 'move') return '#94a3b8'; // Hovered: subtle gray
    return undefined; // Default: no stroke
  };

  const getStrokeWidth = () => {
    if (isRemoteDragging) return 2; // Remote drag: medium border
    if (isSelected) return 3; // Selected: thick border
    if (isHovered && activeTool === 'move') return 2; // Hovered: thin border
    return undefined; // Default: no border
  };

  const getOpacity = () => {
    if (isRemoteDragging) return 0.85; // Remote drag: slightly transparent
    return 1; // Default: fully opaque
  };

  const getShadow = () => {
    // Add subtle glow when selected for better visual feedback
    if (isSelected) {
      return {
        shadowColor: '#0ea5e9',
        shadowBlur: 5,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0.5,
        shadowEnabled: true,
      };
    }
    // Use shape's own shadow properties
    return {
      shadowColor: rectangle.shadowColor,
      shadowBlur: rectangle.shadowBlur ?? 0,
      shadowOffsetX: rectangle.shadowOffsetX ?? 0,
      shadowOffsetY: rectangle.shadowOffsetY ?? 0,
      shadowOpacity: rectangle.shadowOpacity ?? 1,
      shadowEnabled: rectangle.shadowEnabled ?? false,
    };
  };

  return (
    <Fragment>
      <Rect
        ref={shapeRef}
        // Position adjusted for center-based offset: x,y in data model represents top-left,
        // but with offset we need to position at center, so add half dimensions
        x={displayX + rectangle.width / 2}
        y={displayY + rectangle.height / 2}
        width={rectangle.width}
        height={rectangle.height}
        fill={rectangle.fill}
        // Transform properties
        rotation={rectangle.rotation ?? 0}
        opacity={(rectangle.opacity ?? 1) * getOpacity()} // Combine shape opacity with state opacity
        scaleX={rectangle.scaleX ?? 1}
        scaleY={rectangle.scaleY ?? 1}
        skewX={rectangle.skewX ?? 0}
        skewY={rectangle.skewY ?? 0}
        // Offset for center-based rotation (shapes rotate around their center, not top-left)
        offsetX={rectangle.width / 2}
        offsetY={rectangle.height / 2}
        // Shape-specific properties
        cornerRadius={rectangle.cornerRadius ?? 0}
        // Stroke properties (with state-based overrides for selection/hover)
        stroke={getStroke() ?? rectangle.stroke}
        strokeWidth={getStrokeWidth() ?? rectangle.strokeWidth ?? 0}
        strokeEnabled={rectangle.strokeEnabled ?? true}
        dash={isRemoteDragging ? [5, 5] : undefined} // Dashed border when being remotely dragged
        // Shadow properties (with selection glow override)
        {...getShadow()}
        // Interaction
        onClick={handleClick}
        onTap={handleClick} // Mobile support
        draggable={(isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging} // Disable drag if remotely dragging
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Resize Handles - only visible when selected */}
      <ResizeHandles
        object={rectangle}
        isSelected={isSelected && activeTool === 'move'}
        isResizing={isResizing}
        onResizeStart={(handleType) =>
          handleResizeStart(rectangle.id, handleType, {
            x: rectangle.x,
            y: rectangle.y,
            width: rectangle.width,
            height: rectangle.height,
          })
        }
        onResizeMove={(_handleType, x, y) => handleResizeMove(rectangle.id, x, y)}
        onResizeEnd={() => handleResizeEnd(rectangle.id)}
      />
    </Fragment>
  );
});
