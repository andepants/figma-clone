/**
 * Circle Shape Component
 *
 * Renders a circle shape on the canvas with selection and drag capabilities.
 * Note: Circle positioning uses (x, y) as CENTER point, unlike Rectangle which uses top-left.
 */

import { useState, useEffect, useRef, memo, Fragment } from 'react';
import { Circle as KonvaCircle } from 'react-konva';
import type Konva from 'konva';
import type { Circle as CircleType } from '@/types';
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
 * Circle component props
 */
interface CircleProps {
  /** Circle data */
  circle: CircleType;
  /** Whether this circle is currently selected */
  isSelected: boolean;
  /** Callback when circle is selected */
  onSelect: () => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
}

/**
 * Circle shape component
 *
 * Renders a Konva circle with selection, drag, and interaction support.
 * Only allows selection and dragging when the move tool is active.
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * IMPORTANT: Circle position (x, y) represents the CENTER, not top-left corner.
 *
 * @param {CircleProps} props - Component props
 * @returns {JSX.Element} Circle component
 *
 * @example
 * ```tsx
 * <Circle
 *   circle={circleData}
 *   isSelected={selectedId === circleData.id}
 *   onSelect={() => selectObject(circleData.id)}
 * />
 * ```
 */
export const Circle = memo(function Circle({
  circle,
  isSelected,
  onSelect,
  remoteDragState
}: CircleProps) {
  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation
  const shapeRef = useRef<Konva.Circle>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? circle.x;
  const displayY = remoteDragState?.y ?? circle.y;

  /**
   * Animate selection changes
   * Smoothly transitions with a subtle scale pulse when selection state changes
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
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 0.1,
        onFinish: () => {
          // Return to normal scale
          node.to({
            scaleX: 1,
            scaleY: 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected]);

  /**
   * Handle click on circle
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
      circle.id,
      currentUser.uid,
      { x: circle.x, y: circle.y },
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
    const position = { x: node.x(), y: node.y() };

    // Update local store immediately (optimistic update)
    updateObject(circle.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition('main', circle.id, position);
    throttledUpdateCanvasObject('main', circle.id, position); // ← CRITICAL: Keep object current!

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
   * Updates circle position in store and syncs to Realtime Database
   *
   * CRITICAL FIX: Updates object IMMEDIATELY (no throttle) BEFORE clearing drag state
   * This eliminates the flash-back bug by ensuring object position is current
   * when remote users fall back from drag state to object position.
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;
    const position = { x: node.x(), y: node.y() };

    // Update local store (optimistic update)
    updateObject(circle.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject('main', circle.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging('main', circle.id);
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
    return circle.opacity ?? 1; // Use shape opacity, default to fully opaque
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
    // Use shape's own shadow properties when not selected
    return {
      shadowColor: circle.shadowColor,
      shadowBlur: circle.shadowBlur ?? 0,
      shadowOffsetX: circle.shadowOffsetX ?? 0,
      shadowOffsetY: circle.shadowOffsetY ?? 0,
      shadowOpacity: circle.shadowOpacity ?? 1,
      shadowEnabled: circle.shadowEnabled ?? false,
    };
  };

  return (
    <Fragment>
      <KonvaCircle
        ref={shapeRef}
        x={displayX}
        y={displayY}
        radius={circle.radius}
        fill={circle.fill}
        // Transform properties (rotation, scale, skew)
        // Circles naturally rotate around center since (x,y) is already center point
        rotation={circle.rotation ?? 0}
        scaleX={circle.scaleX ?? 1}
        scaleY={circle.scaleY ?? 1}
        skewX={circle.skewX ?? 0}
        skewY={circle.skewY ?? 0}
        opacity={(circle.opacity ?? 1) * (isRemoteDragging ? 0.85 : 1)} // Combine shape opacity with state opacity
        // Stroke properties (with state-based overrides for selection/hover)
        stroke={getStroke() ?? circle.stroke}
        strokeWidth={getStrokeWidth() ?? circle.strokeWidth ?? 0}
        strokeEnabled={circle.strokeEnabled ?? true}
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
      {/* Note: For circles, resize handles should maintain circular shape (uniform scaling) */}
      <ResizeHandles
        object={circle}
        isSelected={isSelected && activeTool === 'move'}
        isResizing={isResizing}
        onResizeStart={(handleType) => {
          const bounds = {
            // IMPORTANT: Pass bounding box top-left corner, NOT circle center
            // This ensures anchor point is calculated at the correct bounding box corner
            x: circle.x - circle.radius, // Top-left x of bounding box
            y: circle.y - circle.radius, // Top-left y of bounding box
            width: circle.radius * 2, // Bounding box width
            height: circle.radius * 2, // Bounding box height
          };
          handleResizeStart(circle.id, handleType, bounds);
        }}
        onResizeMove={(_handleType, x, y) => handleResizeMove(circle.id, x, y)}
        onResizeEnd={() => handleResizeEnd(circle.id)}
      />
    </Fragment>
  );
});
