/**
 * SelectionOverlay Component
 *
 * Visual overlay shown when another user has selected an object.
 * Features:
 * - Thin colored border matching the user's color (rectangles/circles)
 * - Underline + dashed box for text shapes (Figma-style)
 * - Small username badge on hover
 * - Non-intrusive to show multiple users' selections
 * - Follows all object transforms (rotation, scale, skew)
 */

import { memo } from 'react';
import { Rect, Group, Text, Line } from 'react-konva';
import type { CanvasObject, Rectangle, Circle, Text as TextType } from '@/types';
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

  // Badge dimensions
  const badgePadding = 6;
  const badgeHeight = 20;
  const textWidth = username.length * 6 + badgePadding * 2;

  // Handle text shapes with underline + dashed box (Figma-style)
  if (object.type === 'text') {
    const textObj = object as TextType;
    const width = textObj.width || 100;
    const height = textObj.height || 40;
    const x = textObj.x;
    const y = textObj.y;

    // Calculate underline position (same logic as TextSelectionBox)
    const fontSize = textObj.fontSize || 24;
    const verticalAlign = textObj.verticalAlign || 'top';

    let underlineY = y;
    switch (verticalAlign) {
      case 'top':
        underlineY = y + fontSize;
        break;
      case 'middle':
        underlineY = y + height / 2 + fontSize / 3;
        break;
      case 'bottom':
        underlineY = y + height - 5;
        break;
    }

    // Calculate underline width and x position
    const align = textObj.align || textObj.textAlign || 'left';
    const underlineWidth = width * 0.95;

    let underlineX = x;
    switch (align) {
      case 'center':
        underlineX = x + (width - underlineWidth) / 2;
        break;
      case 'right':
        underlineX = x + width - underlineWidth;
        break;
      case 'left':
      default:
        underlineX = x + width * 0.025;
        break;
    }

    return (
      <Group listening={false}>
        {/* Dashed bounding box */}
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={color}
          strokeWidth={1.5}
          dash={[5, 5]}
          listening={false}
        />

        {/* Underline under text content */}
        <Line
          points={[underlineX, underlineY, underlineX + underlineWidth, underlineY]}
          stroke={color}
          strokeWidth={2}
          listening={false}
        />

        {/* Username badge (shown conditionally) */}
        {showBadge && (
          <Group x={x} y={y - badgeHeight - 2}>
            <Rect
              width={textWidth}
              height={badgeHeight}
              fill={color}
              cornerRadius={3}
              listening={false}
            />
            <Text
              text={username}
              x={badgePadding}
              y={badgeHeight / 2}
              offsetY={5}
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
  }

  // Handle circles with thin border
  if (object.type === 'circle') {
    const circle = object as Circle;
    // Circles use center positioning, so no offset needed
    return (
      <Group listening={false}>
        <Rect
          x={circle.x}
          y={circle.y}
          width={circle.radius * 2}
          height={circle.radius * 2}
          offsetX={circle.radius}
          offsetY={circle.radius}
          stroke={color}
          strokeWidth={1.5}
          listening={false}
        />
        {showBadge && (
          <Group x={circle.x} y={circle.y - circle.radius - badgeHeight - 2}>
            <Rect
              width={textWidth}
              height={badgeHeight}
              fill={color}
              cornerRadius={3}
              listening={false}
            />
            <Text
              text={username}
              x={badgePadding}
              y={badgeHeight / 2}
              offsetY={5}
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
  }

  // Handle rectangles with thin border and proper transforms
  if (object.type === 'rectangle') {
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
  }

  // Unknown type - don't render
  return null;
});
