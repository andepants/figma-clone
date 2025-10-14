/**
 * Cursor Component
 *
 * Renders a collaborator's cursor with username label on the canvas.
 * Uses SVG for crisp rendering at any zoom level.
 */

import { memo } from 'react';
import { Group, Path, Text as KonvaText, Tag, Label } from 'react-konva'

interface CursorProps {
  x: number
  y: number
  username: string
  color: string
}

/**
 * Cursor component for displaying other users' cursor positions
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * @param props - Cursor position, username, and color
 */
export const Cursor = memo(function Cursor({ x, y, username, color }: CursorProps) {
  // SVG path for cursor arrow shape
  // M0,0 L0,16 L4,12 L8,16 L12,12 L8,8 Z
  const cursorPath = 'M0,0 L0,16 L4,12 L8,16 L12,12 L8,8 Z'

  return (
    <Group x={x} y={y}>
      {/* Cursor arrow */}
      <Path
        data={cursorPath}
        fill={color}
        stroke="white"
        strokeWidth={1}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        listening={false}
      />

      {/* Username label */}
      <Label x={12} y={2} listening={false}>
        <Tag fill={color} cornerRadius={3} />
        <KonvaText
          text={username}
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fill="white"
          padding={4}
        />
      </Label>
    </Group>
  )
});
