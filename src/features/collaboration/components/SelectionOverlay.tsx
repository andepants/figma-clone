/**
 * SelectionOverlay Component
 *
 * Visual overlay shown when another user has selected an object.
 * Features:
 * - Thin colored border matching the user's color
 * - Small username badge on hover
 * - Non-intrusive to show multiple users' selections
 */

import { memo } from 'react';
import { Rect, Group, Text } from 'react-konva';
import type { CanvasObject } from '@/types';
import type { RemoteSelection } from '@/types';

/**
 * SelectionOverlay component props
 */
interface SelectionOverlayProps {
  /** The selected object (for size/position) */
  object: CanvasObject;
  /** Remote selection info with user details */
  selection: RemoteSelection;
  /** Whether to show username badge (e.g., on hover) */
  showBadge?: boolean;
}

/**
 * SelectionOverlay component
 *
 * Renders a thin colored border around an object that another user has selected.
 * Optionally shows a username badge.
 *
 * @param {SelectionOverlayProps} props - Component props
 * @returns {JSX.Element | null} Selection overlay component
 *
 * @example
 * ```tsx
 * <SelectionOverlay
 *   object={rectangleObject}
 *   selection={{
 *     userId: 'user-1',
 *     objectId: 'obj-123',
 *     username: 'Jane',
 *     color: '#10b981',
 *   }}
 *   showBadge={false}
 * />
 * ```
 */
export const SelectionOverlay = memo(function SelectionOverlay({
  object,
  selection,
  showBadge = false,
}: SelectionOverlayProps) {
  const { username, color } = selection;

  // Only render for rectangle type (will expand for other shapes later)
  if (object.type !== 'rectangle') {
    return null;
  }

  // Badge dimensions
  const badgePadding = 6;
  const badgeHeight = 20;
  const textWidth = username.length * 6 + badgePadding * 2;

  return (
    <Group>
      {/* Selection border - thin colored outline */}
      <Rect
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        stroke={color}
        strokeWidth={1.5}
        listening={false} // Don't respond to mouse events
      />

      {/* Username badge (shown conditionally) */}
      {showBadge && (
        <Group x={object.x + object.width - textWidth} y={object.y - badgeHeight - 2}>
          {/* Badge background */}
          <Rect
            width={textWidth}
            height={badgeHeight}
            fill={color}
            cornerRadius={3}
            listening={false}
          />

          {/* Username text */}
          <Text
            text={username}
            x={badgePadding}
            y={badgeHeight / 2}
            offsetY={5} // Center vertically
            fontSize={10}
            fontFamily="Inter, sans-serif"
            fontStyle="500"
            fill="white"
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
});
