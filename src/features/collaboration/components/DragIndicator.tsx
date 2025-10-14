/**
 * DragIndicator Component
 *
 * @deprecated This component is no longer used. Objects now move in real-time
 * using drag state positions applied directly to the shape components.
 * The actual objects show colored borders and move smoothly with 50ms updates
 * via Realtime Database, making this separate indicator unnecessary.
 *
 * Previous functionality:
 * - Visual overlay shown when another user is dragging an object in real-time.
 * - Colored border matching the user's color
 * - Username badge showing who is dragging
 * - Subtle pulsing animation
 * - Slightly reduced opacity to distinguish from local objects
 */

import { memo } from 'react';
import { Rect, Group, Text } from 'react-konva';
import type { Rectangle as RectangleType } from '@/types';
import type { DragState } from '@/types';

/**
 * DragIndicator component props
 */
interface DragIndicatorProps {
  /** The object being dragged (for size/position) */
  object: RectangleType;
  /** Drag state containing position and user info */
  dragState: DragState;
}

/**
 * DragIndicator component
 *
 * Renders a visual indicator when a remote user is dragging an object.
 * Shows the object at its current drag position with user's color border
 * and username badge.
 *
 * @param {DragIndicatorProps} props - Component props
 * @returns {JSX.Element} Drag indicator component
 *
 * @example
 * ```tsx
 * <DragIndicator
 *   object={rectangleObject}
 *   dragState={{
 *     x: 150,
 *     y: 200,
 *     username: 'John',
 *     color: '#ef4444',
 *     ...
 *   }}
 * />
 * ```
 */
export const DragIndicator = memo(function DragIndicator({
  object,
  dragState,
}: DragIndicatorProps) {
  // Defensive checks: provide fallback values if data is incomplete
  const { x, y, username = 'Anonymous', color = '#666666' } = dragState;

  // Early return if critical position data is missing
  if (x === undefined || y === undefined) {
    return null;
  }

  // Badge dimensions
  const badgePadding = 8;
  const badgeHeight = 24;
  const textWidth = username.length * 7 + badgePadding * 2; // Approximate width

  // Pulsing animation - using timestamp to create oscillating value
  // This is a simple approach; for smoother animation, consider using Konva.Animation
  const pulseOpacity = 0.85;

  return (
    <Group>
      {/* Dragged object preview with user's color border */}
      <Rect
        x={x}
        y={y}
        width={object.width}
        height={object.height}
        fill={object.fill}
        opacity={pulseOpacity}
        stroke={color}
        strokeWidth={2}
        dash={[5, 5]} // Dashed border to distinguish from solid selection
        listening={false} // Don't respond to mouse events
      />

      {/* Username badge - positioned above the object */}
      <Group x={x} y={y - badgeHeight - 4}>
        {/* Badge background */}
        <Rect
          width={textWidth}
          height={badgeHeight}
          fill={color}
          cornerRadius={4}
          listening={false}
        />

        {/* Username text */}
        <Text
          text={username}
          x={badgePadding}
          y={badgeHeight / 2}
          offsetY={6} // Center vertically
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fontStyle="600"
          fill="white"
          listening={false}
        />
      </Group>

      {/* Subtle pulsing glow effect (optional - creates depth) */}
      <Rect
        x={x - 2}
        y={y - 2}
        width={object.width + 4}
        height={object.height + 4}
        stroke={color}
        strokeWidth={4}
        opacity={0.2}
        listening={false}
      />
    </Group>
  );
});
