/**
 * Line Shape Component
 *
 * Renders a line shape on the canvas with selection and drag capabilities.
 */

import { useState, useEffect, useRef, memo, Fragment } from 'react';
import { Line as KonvaLine } from 'react-konva';
import type Konva from 'konva';
import type { Line as LineType } from '@/types';
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
import { LineResizeHandles } from '../components/LineResizeHandles';

/**
 * Line component props
 */
interface LineProps {
  /** Line data */
  line: LineType;
  /** Whether this line is currently selected */
  isSelected: boolean;
  /** Whether this line is part of a multi-select */
  isInMultiSelect?: boolean;
  /** Callback when line is selected (receives event for shift-click detection) */
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
}

/**
 * Line shape component
 *
 * Renders a Konva line with selection, drag, and interaction support.
 * Only allows selection and dragging when the move tool is active.
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * @param {LineProps} props - Component props
 * @returns {JSX.Element} Line component
 *
 * @example
 * ```tsx
 * <Line
 *   line={lineData}
 *   isSelected={selectedId === lineData.id}
 *   onSelect={() => selectObject(lineData.id)}
 * />
 * ```
 */
export const Line = memo(function Line({
  line,
  isSelected,
  isInMultiSelect = false,
  onSelect,
  remoteDragState,
}: LineProps) {
  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();
  const setHoveredObject = useUIStore((state) => state.setHoveredObject);
  const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);

  // Check if object is locked
  const isLocked = line.locked === true;

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation
  const shapeRef = useRef<Konva.Line>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Check if this object is hovered in the sidebar (but not selected)
  const isHoveredFromSidebar = hoveredObjectId === line.id && !isSelected;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? line.x;
  const displayY = remoteDragState?.y ?? line.y;

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
        scaleX: (line.scaleX ?? 1) * 1.01,
        scaleY: (line.scaleY ?? 1) * 1.01,
        duration: 0.1,
        onFinish: () => {
          // Return to normal scale
          node.to({
            scaleX: line.scaleX ?? 1,
            scaleY: line.scaleY ?? 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected, line.scaleX, line.scaleY]);

  /**
   * Handle click on line
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
      'main',
      line.id,
      currentUser.uid,
      { x: line.x, y: line.y },
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
    // For lines, node.x() and node.y() directly give us the position
    const position = {
      x: node.x(),
      y: node.y()
    };

    // Update local store immediately (optimistic update)
    updateObject(line.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition('main', line.id, position);
    throttledUpdateCanvasObject('main', line.id, position);

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
   * Updates line position in store and syncs to Realtime Database
   *
   * CRITICAL FIX: Updates object IMMEDIATELY (no throttle) BEFORE clearing drag state
   * This eliminates the flash-back bug by ensuring object position is current
   * when remote users fall back from drag state to object position.
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;
    // For lines, node.x() and node.y() directly give us the position
    const position = {
      x: node.x(),
      y: node.y()
    };

    // Update local store (optimistic update)
    updateObject(line.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject('main', line.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging('main', line.id);
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
      setHoveredObject(line.id);
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
    if (current === line.id) {
      setHoveredObject(null);
    }
  }

  /**
   * Handle resize end from LineResizeHandles
   * Updates line properties when endpoint is dragged
   */
  async function handleResizeEnd(newLineProps: Partial<LineType>) {
    // Update local store immediately (optimistic update)
    updateObject(line.id, newLineProps);

    // Update in Firebase
    await updateCanvasObject('main', line.id, newLineProps);
  }

  // Determine stroke styling based on state
  const getStroke = () => {
    if (isLocked && isSelected) return '#0ea5e9'; // Locked + Selected: blue (same as normal selection)
    if (isRemoteDragging) return remoteDragState.color; // Remote drag: user's color
    if (isInMultiSelect) return '#38bdf8'; // Multi-select: lighter blue
    if (isSelected) return '#0ea5e9'; // Selected: bright blue
    if (isHovered && activeTool === 'move') return '#94a3b8'; // Hovered: subtle gray
    return line.stroke; // Default: line's own stroke color
  };

  const getStrokeWidth = () => {
    if (isLocked && isSelected) return (line.strokeWidth ?? 2) + 3; // Locked + Selected: same as normal selection
    if (isRemoteDragging) return (line.strokeWidth ?? 2) + 2; // Remote drag: thicker
    if (isSelected) return (line.strokeWidth ?? 2) + 3; // Selected: thicker
    if (isHovered && activeTool === 'move') return (line.strokeWidth ?? 2) + 1; // Hovered: slightly thicker
    return line.strokeWidth ?? 2; // Default: line's own stroke width
  };

  const getOpacity = () => {
    if (isRemoteDragging) return 0.85; // Remote drag: slightly transparent
    return line.opacity ?? 1; // Default: use line's opacity or fully opaque
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
      shadowColor: line.shadowColor,
      shadowBlur: line.shadowBlur ?? 0,
      shadowOffsetX: line.shadowOffsetX ?? 0,
      shadowOffsetY: line.shadowOffsetY ?? 0,
      shadowOpacity: line.shadowOpacity ?? 1,
      shadowEnabled: line.shadowEnabled ?? false,
    };
  };

  // Don't render if hidden
  if (line.visible === false) {
    return null;
  }

  return (
    <Fragment>
      <KonvaLine
        ref={shapeRef}
        // Position
        x={displayX}
        y={displayY}
        // Line points (relative to x, y)
        points={line.points}
        // Stroke properties
        stroke={getStroke()}
        strokeWidth={getStrokeWidth()}
        // Line cap and join for smooth endpoints
        lineCap="round"
        lineJoin="round"
        // Transform properties
        // NOTE: rotation is stored as metadata but NOT applied as a transform
        // because the line's direction is already encoded in the points array.
        // Applying rotation would rotate the points again, causing visual shifting.
        rotation={0} // Always 0 - line direction comes from points array
        opacity={getOpacity()}
        scaleX={line.scaleX ?? 1}
        scaleY={line.scaleY ?? 1}
        skewX={line.skewX ?? 0}
        skewY={line.skewY ?? 0}
        // Dashed when being remotely dragged
        dash={isRemoteDragging ? [5, 5] : undefined}
        // Shadow properties (with selection glow override)
        {...getShadow()}
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
        // Hit detection - make it easier to select thin lines
        hitStrokeWidth={Math.max(line.strokeWidth ?? 2, 10)} // Minimum 10px hit area
      />

      {/* Hover outline from sidebar (only when hovered in panel, not selected) */}
      {isHoveredFromSidebar && (
        <KonvaLine
          x={displayX}
          y={displayY}
          points={line.points}
          stroke="#9ca3af"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
          lineCap="round"
          lineJoin="round"
          rotation={0} // Always 0 - line direction comes from points array
          scaleX={line.scaleX ?? 1}
          scaleY={line.scaleY ?? 1}
          skewX={line.skewX ?? 0}
          skewY={line.skewY ?? 0}
        />
      )}

      {/* Line-specific resize handles (2 endpoint handles) - only visible when not locked */}
      {!isLocked && (
        <LineResizeHandles
          line={line}
          isSelected={isSelected && !isInMultiSelect}
          onResizeEnd={handleResizeEnd}
        />
      )}
    </Fragment>
  );
});
