/**
 * DimensionLabel Component
 *
 * Displays the width and height of a shape in a blue label at the bottom of the object's
 * bounding box. The label is always horizontal (readable) regardless of shape rotation.
 * Positioned at the visual bottom-center of the rotated shape's bounding box.
 */

import { memo, useMemo, useRef, useLayoutEffect } from 'react';
import { Group, Label, Tag, Text } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '@/types';

/**
 * DimensionLabel component props
 */
interface DimensionLabelProps {
  /** The canvas object to display dimensions for */
  object: CanvasObject;
  /** Whether to show the label (typically only when selected) */
  visible?: boolean;
}

/**
 * Calculate the bounding box of a rotated rectangle
 *
 * @param x - Rectangle x position (top-left)
 * @param y - Rectangle y position (top-left)
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param rotation - Rotation in degrees (clockwise)
 * @returns Bounding box with min/max coordinates
 */
function getRotatedBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  // If no rotation, return simple bounding box
  if (!rotation || rotation === 0) {
    return { minX: x, maxX: x + width, minY: y, maxY: y + height };
  }

  // Convert rotation to radians
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Center of the rectangle
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Calculate the 4 corners relative to center
  const corners = [
    { x: -width / 2, y: -height / 2 }, // Top-left
    { x: width / 2, y: -height / 2 }, // Top-right
    { x: width / 2, y: height / 2 }, // Bottom-right
    { x: -width / 2, y: height / 2 }, // Bottom-left
  ];

  // Rotate each corner and find min/max
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  corners.forEach((corner) => {
    // Rotate the corner
    const rotatedX = corner.x * cos - corner.y * sin;
    const rotatedY = corner.x * sin + corner.y * cos;

    // Convert back to absolute coordinates
    const absoluteX = centerX + rotatedX;
    const absoluteY = centerY + rotatedY;

    // Update min/max
    minX = Math.min(minX, absoluteX);
    maxX = Math.max(maxX, absoluteX);
    minY = Math.min(minY, absoluteY);
    maxY = Math.max(maxY, absoluteY);
  });

  return { minX, maxX, minY, maxY };
}

/**
 * Calculate the position for the dimension label
 * Always positions at the bottom center of the bounding box, always horizontal
 *
 * @param object - Canvas object
 * @param width - Object width
 * @param height - Object height
 * @returns Position and rotation for the label
 */
function calculateLabelPosition(
  object: CanvasObject,
  width: number,
  height: number
) {
  // Label dimensions (approximate)
  const labelPadding = 8;

  // For circles, always position at bottom
  if (object.type === 'circle') {
    const circleObject = object as CanvasObject & { radius: number };
    const radius = circleObject.radius || 50;
    return {
      x: object.x, // Circle x is already center
      y: object.y + radius + labelPadding, // Below circle
      rotation: 0, // Always horizontal
    };
  }

  // For rectangles and text, calculate bounding box and position at bottom
  // Type guard: rotation exists on Rectangle, Circle, Text, Line (but not Group)
  const rotation = object.type !== 'group' ? (object.rotation ?? 0) : 0;
  const bbox = getRotatedBoundingBox(object.x, object.y, width, height, rotation);

  return {
    x: (bbox.minX + bbox.maxX) / 2, // Center horizontally
    y: bbox.maxY + labelPadding, // Bottom of bounding box
    rotation: 0, // Always horizontal (readable)
  };
}

/**
 * Get dimensions for the object
 *
 * @param object - Canvas object
 * @returns Object with width and height
 */
function getObjectDimensions(object: CanvasObject): { width: number; height: number } {
  if (object.type === 'circle') {
    const circleObject = object as CanvasObject & { radius: number };
    const radius = circleObject.radius || 50;
    return { width: radius * 2, height: radius * 2 };
  }

  const sizedObject = object as CanvasObject & { width?: number; height?: number };
  return {
    width: sizedObject.width || 100,
    height: sizedObject.height || 100,
  };
}

/**
 * DimensionLabel component
 *
 * Renders a blue label with white text showing "width × height" at the bottom-center of the
 * shape's bounding box. The label is always horizontal and readable, regardless of shape rotation.
 *
 * @param {DimensionLabelProps} props - Component props
 * @returns {JSX.Element | null} DimensionLabel component
 *
 * @example
 * ```tsx
 * <DimensionLabel
 *   object={rectangle}
 *   visible={isSelected}
 * />
 * ```
 */
export const DimensionLabel = memo(function DimensionLabel({
  object,
  visible = true,
}: DimensionLabelProps) {
  const groupRef = useRef<Konva.Group>(null);
  const labelRef = useRef<Konva.Label>(null);

  // Calculate dimensions
  const { width, height } = useMemo(() => getObjectDimensions(object), [object]);

  // Calculate position and rotation (always at bottom, always horizontal)
  const { x, y, rotation } = useMemo(
    () => calculateLabelPosition(object, width, height),
    [object, width, height]
  );

  // Format dimensions text
  const dimensionsText = `${Math.round(width)} × ${Math.round(height)}`;

  // Center the label by measuring its width after render
  useLayoutEffect(() => {
    if (labelRef.current && groupRef.current) {
      const labelWidth = labelRef.current.width();
      const labelHeight = labelRef.current.height();

      // Only set offset if dimensions are valid (> 0)
      if (labelWidth > 0 && labelHeight > 0) {
        // Center the group around its position point
        groupRef.current.offsetX(labelWidth / 2);
        groupRef.current.offsetY(labelHeight / 2);
      }
    }
  }, [dimensionsText, visible]);

  if (!visible) return null;

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      listening={false} // Don't capture events
    >
      <Label ref={labelRef} opacity={0.95}>
        <Tag
          fill="#0ea5e9" // Figma-style blue
          cornerRadius={4}
          pointerDirection={undefined} // No pointer
        />
        <Text
          text={dimensionsText}
          fontSize={13}
          fontFamily="Inter"
          fontStyle="500" // Medium weight
          fill="#ffffff" // White text
          padding={6}
          align="center"
        />
      </Label>
    </Group>
  );
});
