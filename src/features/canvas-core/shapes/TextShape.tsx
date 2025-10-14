/**
 * TextShape Component
 *
 * Renders a text shape on the canvas with selection and drag capabilities.
 * Note: Text positioning uses (x, y) as TOP-LEFT point (same as Rectangle).
 */

import { useState, useEffect, useRef, memo, Fragment } from 'react';
import { Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { Text as TextType } from '@/types';
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
import { toast } from 'sonner';
import { ResizeHandles } from '../components';
import { useResize } from '../hooks';

/**
 * TextShape component props
 */
interface TextShapeProps {
  /** Text data */
  text: TextType;
  /** Whether this text is currently selected */
  isSelected: boolean;
  /** Callback when text is selected */
  onSelect: () => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
}

/**
 * TextShape component
 *
 * Renders a Konva text with selection, drag, and interaction support.
 * Only allows selection and dragging when the move tool is active.
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * IMPORTANT: Text position (x, y) represents TOP-LEFT corner (same as Rectangle).
 *
 * @param {TextShapeProps} props - Component props
 * @returns {JSX.Element} TextShape component
 *
 * @example
 * ```tsx
 * <TextShape
 *   text={textData}
 *   isSelected={selectedId === textData.id}
 *   onSelect={() => selectObject(textData.id)}
 * />
 * ```
 */
export const TextShape = memo(function TextShape({
  text,
  isSelected,
  onSelect,
  remoteDragState
}: TextShapeProps) {
  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation
  const shapeRef = useRef<Konva.Text>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? text.x;
  const displayY = remoteDragState?.y ?? text.y;

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
        scaleX: 1.02,
        scaleY: 1.02,
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
   * Handle click on text
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
      text.id,
      currentUser.uid,
      { x: text.x, y: text.y },
      username,
      color
    );

    if (!canDrag) {
      // Another user is dragging this object
      toast.error('Another user is editing this object', {
        duration: 2000,
      });

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
    updateObject(text.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition('main', text.id, position);
    throttledUpdateCanvasObject('main', text.id, position); // ← CRITICAL: Keep object current!

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
   * Updates text position in store and syncs to Realtime Database
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
    updateObject(text.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject('main', text.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging('main', text.id);
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
    // No shadow for unselected text
    return {
      shadowEnabled: false,
    };
  };

  // Build fontStyle string (combines weight and style for Konva)
  const getFontStyle = () => {
    const weight = text.fontWeight || 400;
    const style = text.fontStyle || 'normal';

    // Konva expects format like "italic bold" or "normal" or "bold"
    const parts: string[] = [];
    if (style === 'italic') parts.push('italic');
    if ((typeof weight === 'number' && weight >= 700) || weight === 'bold') parts.push('bold');

    return parts.length > 0 ? parts.join(' ') : 'normal';
  };

  /**
   * Apply text transform to the display text
   */
  const getTransformedText = () => {
    const transform = text.textTransform || 'none';
    const originalText = text.text;

    switch (transform) {
      case 'uppercase':
        return originalText.toUpperCase();
      case 'lowercase':
        return originalText.toLowerCase();
      case 'capitalize':
        return originalText
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      case 'none':
      default:
        return originalText;
    }
  };

  return (
    <Fragment>
      <KonvaText
        ref={shapeRef}
        x={displayX}
        y={displayY}
        text={getTransformedText()}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        fontStyle={getFontStyle()}
        fill={text.fill}
        opacity={getOpacity()}
        // Typography properties
        textDecoration={text.textDecoration || ''}
        lineHeight={text.lineHeight || 1.2}
        letterSpacing={text.letterSpacing || 0}
        // Optional text properties
        width={text.width}
        align={text.align || text.textAlign}
        verticalAlign={text.verticalAlign}
        wrap={text.wrap}
        // Dynamic stroke based on state
        stroke={getStroke()}
        strokeWidth={getStrokeWidth()}
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
      {/* Note: For text, horizontal resize changes width, vertical resize changes height (for multi-line) */}
      <ResizeHandles
        object={text}
        isSelected={isSelected && activeTool === 'move'}
        isResizing={isResizing}
        onResizeStart={(handleType) =>
          handleResizeStart(text.id, handleType, {
            x: text.x,
            y: text.y,
            // For auto-width text, use a default width of 200px for resize calculations
            width: text.width || 200,
            height: text.fontSize * 1.2, // Approximate height based on font size
          })
        }
        onResizeMove={(_handleType, x, y) => handleResizeMove(text.id, x, y)}
        onResizeEnd={() => handleResizeEnd(text.id)}
      />
    </Fragment>
  );
});
