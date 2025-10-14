/**
 * Cursor Component
 *
 * Renders a collaborator's cursor with username label on the canvas.
 * Uses SVG for crisp rendering at any zoom level.
 */

import { memo, useEffect, useRef, useState } from 'react';
import { Group, Path, Text as KonvaText, Tag, Label } from 'react-konva';
import type Konva from 'konva';

interface CursorProps {
  x: number
  y: number
  username: string
  color: string
}

/**
 * Cursor component for displaying other users' cursor positions
 * Optimized with React.memo to prevent unnecessary re-renders.
 * Fades in smoothly when a new user joins.
 *
 * @param props - Cursor position, username, and color
 */
export const Cursor = memo(function Cursor({ x, y, username, color }: CursorProps) {
  // SVG path for cursor arrow shape
  // M0,0 L0,16 L4,12 L8,16 L12,12 L8,8 Z
  const cursorPath = 'M0,0 L0,16 L4,12 L8,16 L12,12 L8,8 Z';

  // Track if this is a new cursor (first render)
  const [isNew, setIsNew] = useState(true);
  const groupRef = useRef<Konva.Group>(null);

  /**
   * Fade in cursor on mount
   * Only animates once when cursor first appears
   */
  useEffect(() => {
    const node = groupRef.current;
    if (!node || !isNew) return;

    // Start with opacity 0
    node.opacity(0);

    // Fade in to opacity 1
    node.to({
      opacity: 1,
      duration: 0.3,
      onFinish: () => {
        setIsNew(false); // Mark as no longer new
      },
    });
  }, [isNew]);

  return (
    <Group ref={groupRef} x={x} y={y}>
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
