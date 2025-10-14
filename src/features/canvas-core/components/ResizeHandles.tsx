/**
 * ResizeHandles Component
 *
 * Renders a group of 4 corner resize handles for canvas objects.
 * Works with any CanvasObject type by extracting bounds appropriately.
 */

import { memo } from 'react';
import { Group, Line, Label, Tag, Text as KonvaText } from 'react-konva';
import { ResizeHandle } from './ResizeHandle';
import type { CanvasObject, ResizeHandle as ResizeHandleType, ResizeAnchor, Rectangle, Circle, Text } from '@/types';
import { getHandlePosition } from '@/lib/utils';

/**
 * ResizeHandles component props
 */
interface ResizeHandlesProps {
  /** Canvas object being resized */
  object: CanvasObject;
  /** Whether the object is selected */
  isSelected: boolean;
  /** Whether currently resizing (for showing preview lines) */
  isResizing?: boolean;
  /** Active handle being dragged (for showing preview lines) */
  activeHandle?: ResizeHandleType | null;
  /** Anchor point (opposite corner) for preview lines */
  anchor?: ResizeAnchor | null;
  /** Callback when resize starts on a specific handle */
  onResizeStart: (handle: ResizeHandleType) => void;
  /** Callback during resize with handle and pointer position */
  onResizeMove: (handle: ResizeHandleType, x: number, y: number) => void;
  /** Callback when resize ends */
  onResizeEnd: () => void;
}

/**
 * Extract bounding box from any CanvasObject type
 *
 * This function handles shape-specific coordinate systems:
 * - **Rectangle:** Uses (x, y) as top-left corner, returns x, y, width, height directly
 * - **Circle:** Uses (x, y) as CENTER, converts to bounding box by subtracting radius
 * - **Text:** Uses (x, y) as top-left, width/height from text metrics
 *
 * @param {CanvasObject} object - Canvas object
 * @returns {{ x: number; y: number; width: number; height: number }} Bounding box
 *
 * @example
 * ```tsx
 * // Rectangle at (100, 100) with 50x50 size
 * getBounds({ type: 'rectangle', x: 100, y: 100, width: 50, height: 50 })
 * // Returns: { x: 100, y: 100, width: 50, height: 50 }
 *
 * // Circle at center (100, 100) with radius 25
 * getBounds({ type: 'circle', x: 100, y: 100, radius: 25 })
 * // Returns: { x: 75, y: 75, width: 50, height: 50 } (bounding box)
 * ```
 */
function getBounds(object: CanvasObject): { x: number; y: number; width: number; height: number } {
  switch (object.type) {
    case 'rectangle': {
      const rect = object as Rectangle;
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    case 'circle': {
      const circle = object as Circle;
      return {
        x: circle.x - circle.radius,
        y: circle.y - circle.radius,
        width: circle.radius * 2,
        height: circle.radius * 2,
      };
    }
    case 'text': {
      const text = object as Text;
      // For text, width might be undefined (auto-width), use a default
      // Height is approximated from fontSize with line-height multiplier
      return {
        x: text.x,
        y: text.y,
        width: text.width || 200, // Default width for auto-width text
        height: text.fontSize * 1.2, // Approximate height (fontSize * line-height)
      };
    }
    default:
      // Default fallback for unsupported types
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * Custom comparison function for React.memo optimization
 * Only re-render if object bounds, selection state, or resize state changes
 */
function arePropsEqual(prevProps: ResizeHandlesProps, nextProps: ResizeHandlesProps): boolean {
  // Quick checks first
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isResizing !== nextProps.isResizing) return false;
  if (prevProps.activeHandle !== nextProps.activeHandle) return false;

  // Check anchor point (only matters during resize)
  if (prevProps.isResizing && nextProps.isResizing) {
    if (prevProps.anchor?.x !== nextProps.anchor?.x || prevProps.anchor?.y !== nextProps.anchor?.y) {
      return false;
    }
  }

  // Compare object bounds (most important for handle positioning)
  const prevBounds = getBounds(prevProps.object);
  const nextBounds = getBounds(nextProps.object);

  if (
    prevBounds.x !== nextBounds.x ||
    prevBounds.y !== nextBounds.y ||
    prevBounds.width !== nextBounds.width ||
    prevBounds.height !== nextBounds.height
  ) {
    return false;
  }

  // All checks passed - props are equal, don't re-render
  return true;
}

/**
 * ResizeHandles component
 *
 * Renders 4 corner resize handles (NW, NE, SW, SE) for a selected canvas object.
 * Handles are positioned at the corners of the object's bounding box.
 * Works generically with any shape type by extracting bounds appropriately.
 *
 * @param {ResizeHandlesProps} props - Component props
 * @returns {JSX.Element | null} ResizeHandles component or null if not selected
 *
 * @example
 * ```tsx
 * <ResizeHandles
 *   object={rectangle}
 *   isSelected={true}
 *   onResizeStart={(handle) => startResize(handle)}
 *   onResizeMove={(handle, x, y) => updateResize(handle, x, y)}
 *   onResizeEnd={() => endResize()}
 * />
 * ```
 */
export const ResizeHandles = memo(function ResizeHandles({
  object,
  isSelected,
  isResizing = false,
  activeHandle = null,
  anchor = null,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: ResizeHandlesProps) {
  // Don't render if object is not selected
  if (!isSelected) return null;

  // Extract bounds from object
  const bounds = getBounds(object);

  // Calculate handle positions for all 4 corners
  const handles: ResizeHandleType[] = ['nw', 'ne', 'sw', 'se'];
  const handlePositions = handles.map((handle) => ({
    handle,
    position: getHandlePosition(handle, bounds),
  }));

  /**
   * Handle resize move for a specific handle
   * Wraps the callback to pass the handle along with coordinates
   */
  function handleResizeMove(handle: ResizeHandleType) {
    return (x: number, y: number) => {
      onResizeMove(handle, x, y);
    };
  }

  // Calculate tooltip position centered on the object during resize
  const tooltipPosition = isResizing
    ? {
        x: bounds.x + bounds.width / 2,
        y: bounds.y - 20, // Position above the object
      }
    : null;

  // Format dimensions for tooltip display
  const dimensionsText = `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`;

  return (
    <Group>
      {/* Size tooltip during resize */}
      {isResizing && tooltipPosition && (
        <Label
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          opacity={0.9}
          listening={false}
        >
          <Tag
            fill="#1e293b"
            cornerRadius={4}
            padding={6}
          />
          <KonvaText
            text={dimensionsText}
            fontFamily="Inter, system-ui, sans-serif"
            fontSize={12}
            fontStyle="500"
            fill="white"
            padding={6}
            align="center"
          />
        </Label>
      )}

      {/* Resize handles */}
      {handlePositions.map(({ handle, position }) => (
        <ResizeHandle
          key={handle}
          handle={handle}
          x={position.x}
          y={position.y}
          isSelected={isSelected}
          onResizeStart={onResizeStart}
          onResizeMove={handleResizeMove(handle)}
          onResizeEnd={onResizeEnd}
        />
      ))}
    </Group>
  );
}, arePropsEqual);
