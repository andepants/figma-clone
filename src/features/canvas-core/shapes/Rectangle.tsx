/**
 * Rectangle Shape Component
 *
 * Renders a rectangle shape on the canvas with selection and drag capabilities.
 */

import { useState, useEffect, useRef, memo, Fragment, useMemo } from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { Rectangle as RectangleType } from '@/types';
import { useToolStore, useCanvasStore, useUIStore } from '@/stores';
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
import { ResizeHandles, DimensionLabel } from '../components';
import { useResize } from '../hooks';

/**
 * Rectangle component props
 */
interface RectangleProps {
  /** Rectangle data */
  rectangle: RectangleType;
  /** Whether this rectangle is currently selected */
  isSelected: boolean;
  /** Whether this rectangle is part of a multi-select */
  isInMultiSelect?: boolean;
  /** Callback when rectangle is selected (receives event for shift-click detection) */
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
  /** Project/canvas ID for Firebase sync (defaults to 'main' for legacy support) */
  projectId?: string;
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
  isInMultiSelect = false,
  onSelect,
  remoteDragState,
  projectId = 'main',
}: RectangleProps) {
  const { activeTool } = useToolStore();
  const { projectId: storeProjectId, updateObject, zoom } = useCanvasStore();
  const { currentUser } = useAuth();

  // Use projectId from store if not provided via props
  const effectiveProjectId = projectId || storeProjectId;
  const setHoveredObject = useUIStore((state) => state.setHoveredObject);
  const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);

  // Check if object is locked
  const isLocked = rectangle.locked === true;

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize(effectiveProjectId);

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation
  const shapeRef = useRef<Konva.Rect>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Check if this object is hovered in the sidebar (but not selected)
  const isHoveredFromSidebar = hoveredObjectId === rectangle.id && !isSelected;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? rectangle.x;
  const displayY = remoteDragState?.y ?? rectangle.y;

  // Ensure width and height are valid numbers to prevent NaN in offset calculations
  const width = rectangle.width || 100;
  const height = rectangle.height || 100;

  /**
   * Animate selection changes
   * Smoothly transitions stroke properties when selection state changes
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    // Check if node is attached to a layer before animating
    if (!node.getLayer()) return;

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
   * Ignores clicks on locked objects
   * Passes event to parent for shift-click multi-select detection
   */
  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    // Ignore clicks on locked objects
    if (isLocked) {
      return;
    }

    if (activeTool === 'move') {
      onSelect(e);
    }
  }

  /**
   * Handle drag start
   * Checks for drag lock and prevents stage from dragging when dragging a shape
   * Note: In multi-select mode, individual shapes are non-draggable; group drag is handled by invisible drag target
   */
  async function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    if (!currentUser) return;

    // Select object when drag starts (if not already selected)
    // This ensures the dragged object becomes the selected object
    if (!isSelected) {
      // Create fake event without shift key to ensure single selection
      const fakeEvent = {
        evt: { shiftKey: false },
      } as Konva.KonvaEventObject<MouseEvent>;
      onSelect(fakeEvent);
    }

    // Attempt to acquire drag lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canDrag = await startDragging(
      effectiveProjectId,
      rectangle.id,
      currentUser.uid,
      { x: rectangle.x, y: rectangle.y },
      username,
      color
    );

    if (!canDrag) {
      // Another user is dragging this object
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
      x: node.x() - width / 2,
      y: node.y() - height / 2
    };

    // Update local store immediately (optimistic update)
    updateObject(rectangle.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition(effectiveProjectId, rectangle.id, position);
    throttledUpdateCanvasObject(effectiveProjectId, rectangle.id, position); // ← CRITICAL: Keep object current!

    // Update cursor position during drag so other users see cursor moving with object
    if (stage && currentUser) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasCoords = screenToCanvasCoords(stage, pointerPosition);
        const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
        const color = getUserColor(currentUser.uid);
        throttledUpdateCursor(effectiveProjectId, currentUser.uid, canvasCoords, username, color);
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
      x: node.x() - width / 2,
      y: node.y() - height / 2
    };

    // Update local store (optimistic update)
    updateObject(rectangle.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject(effectiveProjectId, rectangle.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging(effectiveProjectId, rectangle.id);
  }

  /**
   * Handle mouse enter
   * Changes cursor and sets hover state
   * Syncs hover state to UI store for bidirectional sidebar sync
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Set hover state for visual feedback
    if (activeTool === 'move') {
      setIsHovered(true);
      stage.container().style.cursor = 'move';
      // Sync to UI store for sidebar hover highlighting
      setHoveredObject(rectangle.id);
    }
  }

  /**
   * Handle mouse leave
   * Resets cursor and hover state
   * Clears UI store hover state if this object is still hovered (prevents race conditions)
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Clear hover state
    setIsHovered(false);

    // Reset cursor based on active tool
    stage.container().style.cursor = activeTool === 'move' ? 'pointer' : 'crosshair';

    // Clear UI store hover only if this object is still the hovered one
    // This prevents race conditions when quickly moving between objects
    const current = useUIStore.getState().hoveredObjectId;
    if (current === rectangle.id) {
      setHoveredObject(null);
    }
  }

  // Determine stroke styling based on state (memoized to prevent unnecessary re-renders)
  const stroke = useMemo(() => {
    if (isLocked && isSelected) return '#0ea5e9'; // Locked + Selected: blue (same as normal selection)
    if (isRemoteDragging) return remoteDragState?.color; // Remote drag: user's color
    if (isInMultiSelect) return '#38bdf8'; // Multi-select: lighter blue
    if (isSelected) return '#0ea5e9'; // Selected: bright blue
    if (isHovered && activeTool === 'move') return '#94a3b8'; // Hovered: subtle gray
    return undefined; // Default: no stroke
  }, [isLocked, isSelected, isRemoteDragging, remoteDragState?.color, isInMultiSelect, isHovered, activeTool]);

  const strokeWidth = useMemo(() => {
    if (isLocked && isSelected) return 3; // Locked + Selected: same as normal selection
    if (isRemoteDragging) return 2; // Remote drag: medium border
    if (isSelected) return 3; // Selected: thick border
    if (isHovered && activeTool === 'move') return 2; // Hovered: thin border
    return undefined; // Default: no border
  }, [isLocked, isSelected, isRemoteDragging, isHovered, activeTool]);

  const opacity = useMemo(() => {
    if (isRemoteDragging) return 0.85; // Remote drag: slightly transparent
    return 1; // Default: fully opaque
  }, [isRemoteDragging]);

  const shadow = useMemo(() => {
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
  }, [isSelected, rectangle.shadowColor, rectangle.shadowBlur, rectangle.shadowOffsetX, rectangle.shadowOffsetY, rectangle.shadowOpacity, rectangle.shadowEnabled]);

  // Don't render if hidden
  if (rectangle.visible === false) {
    return null;
  }

  return (
    <Fragment>
      <Rect
        id={rectangle.id}
        ref={shapeRef}
        // Position adjusted for center-based offset: x,y in data model represents top-left,
        // but with offset we need to position at center, so add half dimensions
        x={displayX + width / 2}
        y={displayY + height / 2}
        width={width}
        height={height}
        fill={rectangle.fill}
        // Transform properties
        rotation={rectangle.rotation ?? 0}
        opacity={(rectangle.opacity ?? 1) * opacity} // Combine shape opacity with state opacity
        scaleX={rectangle.scaleX ?? 1}
        scaleY={rectangle.scaleY ?? 1}
        skewX={rectangle.skewX ?? 0}
        skewY={rectangle.skewY ?? 0}
        // Offset for center-based rotation (shapes rotate around their center, not top-left)
        offsetX={width / 2}
        offsetY={height / 2}
        // Shape-specific properties
        cornerRadius={rectangle.cornerRadius ?? 0}
        // Stroke properties (with state-based overrides for selection/hover)
        stroke={stroke ?? rectangle.stroke}
        strokeWidth={strokeWidth ?? rectangle.strokeWidth ?? 0}
        strokeEnabled={rectangle.strokeEnabled ?? true}
        dash={isRemoteDragging ? [5, 5] : undefined} // Dashed border when being remotely dragged
        // Shadow properties (with selection glow override)
        {...shadow}
        // Interaction
        listening={!isLocked} // Locked objects don't respond to events
        onClick={handleClick}
        onTap={handleClick} // Mobile support
        draggable={!isLocked && (isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging && !isInMultiSelect} // Disable drag if locked, remotely dragging, or in multi-select
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover outline from sidebar (only when hovered in panel, not selected) */}
      {isHoveredFromSidebar && (
        <Rect
          x={displayX + width / 2}
          y={displayY + height / 2}
          width={width}
          height={height}
          stroke="#9ca3af"
          strokeWidth={1.5}
          dash={[4, 4]}
          fill="transparent"
          listening={false}
          rotation={rectangle.rotation ?? 0}
          scaleX={rectangle.scaleX ?? 1}
          scaleY={rectangle.scaleY ?? 1}
          skewX={rectangle.skewX ?? 0}
          skewY={rectangle.skewY ?? 0}
          offsetX={width / 2}
          offsetY={height / 2}
          cornerRadius={rectangle.cornerRadius ?? 0}
        />
      )}

      {/* Resize Handles - only visible when selected and not locked */}
      {!isLocked && (
        <ResizeHandles
          object={rectangle}
          isSelected={isSelected && activeTool === 'move'}
          isResizing={isResizing}
          zoom={zoom}
          onResizeStart={(handleType) =>
            handleResizeStart(rectangle.id, handleType, {
              x: rectangle.x,
              y: rectangle.y,
              width: width,
              height: height,
            })
          }
          onResizeMove={(_handleType, x, y) => handleResizeMove(rectangle.id, x, y)}
          onResizeEnd={() => handleResizeEnd(rectangle.id)}
        />
      )}

      {/* Dimension Label - shows width × height when selected and not locked */}
      {!isLocked && (
        <DimensionLabel object={rectangle} visible={isSelected && activeTool === 'move'} />
      )}
    </Fragment>
  );
});
