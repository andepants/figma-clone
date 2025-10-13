/**
 * Rectangle Shape Component
 *
 * Renders a rectangle shape on the canvas with selection and drag capabilities.
 */

import { useState } from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { Rectangle as RectangleType } from '@/types';
import { useToolStore, useCanvasStore } from '@/stores';
import { debouncedUpdateCanvas } from '@/lib/firebase';

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
export function Rectangle({ rectangle, isSelected, onSelect }: RectangleProps) {
  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();

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
   * Prevents stage from dragging when dragging a shape
   */
  function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;
  }

  /**
   * Handle drag end
   * Updates rectangle position in store and syncs to Firestore
   */
  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;

    // Update local store (optimistic update)
    updateObject(rectangle.id, {
      x: node.x(),
      y: node.y(),
    });

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
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
