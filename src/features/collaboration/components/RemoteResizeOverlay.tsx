/**
 * RemoteResizeOverlay Component
 *
 * Visual overlay shown when another user is resizing an object in real-time.
 * Shows the object's current resize bounds with a dashed border in the user's color,
 * resize handles at each corner, and a username badge.
 */

import { memo } from 'react';
import { Rect, Group, Text } from 'react-konva';
import type { ResizeState } from '@/types';
import { RESIZE_HANDLE_SIZE, RESIZE_HANDLE_OFFSET } from '@/constants';

/**
 * RemoteResizeOverlay component props
 */
interface RemoteResizeOverlayProps {
  /** Resize state containing bounds and user info */
  resizeState: ResizeState;
}

/**
 * Custom comparison function for React.memo optimization
 * Only re-render if bounds change significantly (>1px) to avoid jank
 * This reduces unnecessary re-renders during rapid remote resize updates
 */
function arePropsEqual(prevProps: RemoteResizeOverlayProps, nextProps: RemoteResizeOverlayProps): boolean {
  const prev = prevProps.resizeState;
  const next = nextProps.resizeState;

  // Quick checks for critical changes
  if (prev.objectId !== next.objectId) return false;
  if (prev.userId !== next.userId) return false;

  // Check if bounds have changed significantly (more than 1px threshold)
  // This prevents unnecessary re-renders during rapid drag movements
  const prevBounds = prev.currentBounds;
  const nextBounds = next.currentBounds;

  if (!prevBounds || !nextBounds) return false;

  const THRESHOLD = 1; // Only re-render if change is >1px

  if (
    Math.abs(prevBounds.x - nextBounds.x) > THRESHOLD ||
    Math.abs(prevBounds.y - nextBounds.y) > THRESHOLD ||
    Math.abs(prevBounds.width - nextBounds.width) > THRESHOLD ||
    Math.abs(prevBounds.height - nextBounds.height) > THRESHOLD
  ) {
    return false; // Bounds changed significantly, re-render
  }

  // All checks passed - props are effectively equal, don't re-render
  return true;
}

/**
 * RemoteResizeOverlay component
 *
 * Renders a visual overlay when a remote user is resizing an object.
 * Shows the object's resize preview with dashed border, corner handles,
 * and username badge all in the user's color.
 *
 * @param {RemoteResizeOverlayProps} props - Component props
 * @returns {JSX.Element | null} Remote resize overlay component
 *
 * @example
 * ```tsx
 * <RemoteResizeOverlay
 *   resizeState={{
 *     objectId: 'rect-123',
 *     userId: 'user-456',
 *     username: 'Alice',
 *     color: '#ef4444',
 *     handle: 'se',
 *     currentBounds: { x: 100, y: 100, width: 200, height: 150 },
 *     ...
 *   }}
 * />
 * ```
 */
export const RemoteResizeOverlay = memo(function RemoteResizeOverlay({
  resizeState,
}: RemoteResizeOverlayProps) {
  // Defensive checks: provide fallback values if data is incomplete
  const { currentBounds, username = 'Anonymous', color = '#666666' } = resizeState;

  // Early return if critical bounds data is missing
  if (!currentBounds || currentBounds.x === undefined || currentBounds.y === undefined) {
    console.warn('RemoteResizeOverlay: Missing bounds data', resizeState);
    return null;
  }

  const { x, y, width, height } = currentBounds;

  // Badge dimensions
  const badgePadding = 8;
  const badgeHeight = 24;
  const badgeText = `${username} is resizing`;
  const textWidth = badgeText.length * 7 + badgePadding * 2; // Approximate width

  // Handle positions at each corner
  const handles = [
    { x: x - RESIZE_HANDLE_OFFSET, y: y - RESIZE_HANDLE_OFFSET }, // NW
    { x: x + width + RESIZE_HANDLE_OFFSET, y: y - RESIZE_HANDLE_OFFSET }, // NE
    { x: x - RESIZE_HANDLE_OFFSET, y: y + height + RESIZE_HANDLE_OFFSET }, // SW
    { x: x + width + RESIZE_HANDLE_OFFSET, y: y + height + RESIZE_HANDLE_OFFSET }, // SE
  ];

  return (
    <Group listening={false}>
      {/* Resize preview border - dashed to distinguish from selection */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={color}
        strokeWidth={2}
        dash={[5, 5]} // Dashed border
        opacity={0.85}
        listening={false}
      />

      {/* Corner resize handles in user's color */}
      {handles.map((handle, index) => (
        <Group key={index} listening={false}>
          {/* Handle background (white) */}
          <Rect
            x={handle.x}
            y={handle.y}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill="#ffffff"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.9}
            listening={false}
          />
        </Group>
      ))}

      {/* Username badge - positioned above the object */}
      <Group x={x} y={y - badgeHeight - 8}>
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
          text={badgeText}
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

      {/* Subtle glow effect around the bounds (optional - creates depth) */}
      <Rect
        x={x - 2}
        y={y - 2}
        width={width + 4}
        height={height + 4}
        stroke={color}
        strokeWidth={4}
        opacity={0.15}
        listening={false}
      />
    </Group>
  );
}, arePropsEqual);
