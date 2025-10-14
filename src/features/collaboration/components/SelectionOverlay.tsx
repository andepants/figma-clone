/**
 * SelectionOverlay Component
 *
 * Visual overlay shown when another user has selected an object.
 * Features:
 * - Thin colored border matching the user's color
 * - Small username badge on hover
 * - Non-intrusive to show multiple users' selections
 * - Follows all object transforms (rotation, scale, skew)
 */

import { memo } from 'react';
import { Rect, Group, Text } from 'react-konva';
import type { CanvasObject, Rectangle } from '@/types';
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
 * Optionally shows a username badge. The overlay follows all transforms (rotation, scale, skew)
 * to match the object's visual appearance.
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

  const rect = object as Rectangle;

  // Extract transform properties from object (matching Rectangle shape behavior)
  const rotation = rect.rotation ?? 0;
  const scaleX = rect.scaleX ?? 1;
  const scaleY = rect.scaleY ?? 1;
  const skewX = rect.skewX ?? 0;
  const skewY = rect.skewY ?? 0;

  // Calculate center position for Group positioning (same as Rectangle and ResizeHandles)
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  // Badge dimensions
  const badgePadding = 6;
  const badgeHeight = 20;
  const textWidth = username.length * 6 + badgePadding * 2;

  return (
    <Group
      // Position at shape's center for proper rotation pivot
      x={centerX}
      y={centerY}
      // Apply same transforms as the shape
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      skewX={skewX}
      skewY={skewY}
      listening={false}
    >
      {/* Selection border - thin colored outline */}
      <Rect
        // Use offset to rotate around center (local coordinates relative to center)
        x={0}
        y={0}
        width={rect.width}
        height={rect.height}
        offsetX={rect.width / 2}
        offsetY={rect.height / 2}
        stroke={color}
        strokeWidth={1.5}
        listening={false}
      />

      {/* Username badge (shown conditionally) */}
      {showBadge && (
        <Group
          // Position badge relative to center
          x={rect.width / 2 - textWidth}
          y={-rect.height / 2 - badgeHeight - 2}
        >
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
