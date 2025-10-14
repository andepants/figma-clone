/**
 * Rectangle Shape Component
 *
 * Renders a rectangle shape on the canvas with selection and drag capabilities.
 */

import { useState, memo } from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { Rectangle as RectangleType } from '@/types';
import { useToolStore, useCanvasStore } from '@/stores';
import {
  debouncedUpdateCanvas,
  startDragging,
  throttledUpdateDragPosition,
  endDragging,
} from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '@/features/collaboration/utils';
import { toast } from 'sonner';

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
}

/**
 * Rectangle shape component
 *
 * Renders a Konva rectangle with selection, drag, and interaction support.
 * Only allows selection and dragging when the select tool is active.
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
export const Rectangle = memo(function Rectangle({ rectangle, isSelected, onSelect }: RectangleProps) {
  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Handle click on rectangle
   * Only triggers selection when select tool is active
   */
  function handleClick() {
    if (activeTool === 'select') {
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
   */
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;

    // Update local store immediately (optimistic update)
    updateObject(rectangle.id, {
      x: node.x(),
      y: node.y(),
    });

    // Emit throttled position update to Realtime DB (50ms)
    throttledUpdateDragPosition('main', rectangle.id, {
      x: node.x(),
      y: node.y(),
    });
  }

  /**
   * Handle drag end
   * Updates rectangle position in store and syncs to Firestore
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;

    // Update local store (optimistic update)
    updateObject(rectangle.id, {
      x: node.x(),
      y: node.y(),
    });

    // Clear drag state from Realtime DB
    await endDragging('main', rectangle.id);

    // Sync to Firestore (debounced 500ms)
    const currentObjects = useCanvasStore.getState().objects;
    debouncedUpdateCanvas('main', currentObjects);
  }

  /**
   * Handle mouse enter
   * Changes cursor and sets hover state
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Set hover state for visual feedback
    if (activeTool === 'select') {
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
    stage.container().style.cursor = activeTool === 'select' ? 'pointer' : 'crosshair';
  }

  // Determine stroke styling based on state
  const getStroke = () => {
    if (isSelected) return '#0ea5e9'; // Selected: bright blue
    if (isHovered && activeTool === 'select') return '#94a3b8'; // Hovered: subtle gray
    return undefined; // Default: no stroke
  };

  const getStrokeWidth = () => {
    if (isSelected) return 3; // Selected: thick border
    if (isHovered && activeTool === 'select') return 2; // Hovered: thin border
    return undefined; // Default: no border
  };

  return (
    <Rect
      x={rectangle.x}
      y={rectangle.y}
      width={rectangle.width}
      height={rectangle.height}
      fill={rectangle.fill}
      // Dynamic stroke based on state
      stroke={getStroke()}
      strokeWidth={getStrokeWidth()}
      // Interaction
      onClick={handleClick}
      onTap={handleClick} // Mobile support
      draggable={(isSelected || isHovered) && activeTool === 'select'}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
});
