/**
 * TextSelectionBox Component
 *
 * Custom selection visualization for text shapes.
 * Shows a blue underline under the text content and a blue bounding box
 * around the text container, instead of the default stroke outline.
 */

import { Group, Rect, Line } from 'react-konva';
import type { Text as TextType } from '@/types';
import type Konva from 'konva';

/**
 * TextSelectionBox component props
 */
interface TextSelectionBoxProps {
  /** Text shape being selected */
  text: TextType;
  /** Whether the text is currently selected */
  isSelected: boolean;
  /** Whether the text is currently hovered */
  isHovered?: boolean;
  /** Color for the selection (blue for user selection, custom for remote) */
  color?: string;
  /** Reference to the text node for measuring actual text dimensions (future use) */
  textNodeRef?: React.RefObject<Konva.Text | null>;
}

/**
 * TextSelectionBox component
 *
 * Renders a custom selection visualization for text shapes:
 * - On hover: Underline with glow effect
 * - On select: Underline + bounding box showing the text container dimensions
 * - Both elements use the same selection color
 *
 * @param {TextSelectionBoxProps} props - Component props
 * @returns {JSX.Element | null} TextSelectionBox component or null if not selected/hovered
 */
export function TextSelectionBox({
  text,
  isSelected,
  isHovered = false,
  color = '#0ea5e9',
  textNodeRef,
}: TextSelectionBoxProps) {
  // Show on either hover or selection
  if (!isSelected && !isHovered) return null;

  // Use different colors for hover vs selection
  const underlineColor = isSelected ? color : '#94a3b8'; // Gray for hover, blue for selection
  const boxColor = color;

  const containerWidth = text.width || 100;
  const containerHeight = text.height || 40;

  // Use text position (top-left of container)
  const x = text.x;
  const y = text.y;

  // Calculate actual text width (not container width)
  // Try to measure actual rendered text width, with robust fallbacks
  let actualTextWidth = containerWidth * 0.5; // Default fallback

  try {
    // Method 1: Use text node ref if available (most accurate)
    if (textNodeRef?.current?.getTextWidth) {
      const measuredWidth = textNodeRef.current.getTextWidth();
      if (measuredWidth > 0) {
        actualTextWidth = measuredWidth;
      }
    }
  } catch {
    // Silently fall back to estimation
  }

  // Method 2: Estimate based on text length if ref method failed
  if (actualTextWidth === containerWidth * 0.5 && text.text) {
    const fontSize = text.fontSize || 24;
    const charCount = text.text.length;
    // Rough estimation: average character width is ~0.6 * fontSize for most fonts
    const estimatedWidth = charCount * fontSize * 0.6;
    // Cap at container width
    actualTextWidth = Math.min(estimatedWidth, containerWidth * 0.95);
  }

  // Calculate underline position
  // The underline should be positioned based on the text's vertical alignment
  const fontSize = text.fontSize || 24;
  const verticalAlign = text.verticalAlign || 'top';

  let underlineY = y;
  switch (verticalAlign) {
    case 'top':
      underlineY = y + fontSize; // Just below the first line baseline
      break;
    case 'middle':
      underlineY = y + containerHeight / 2 + fontSize / 3; // Below middle text
      break;
    case 'bottom':
      underlineY = y + containerHeight - 5; // Near bottom
      break;
  }

  // Calculate underline width and position based on text alignment
  // Use actual text width instead of container width
  const align = text.align || text.textAlign || 'left';
  const underlineWidth = actualTextWidth;

  let underlineX = x;
  switch (align) {
    case 'center':
      underlineX = x + (containerWidth - underlineWidth) / 2;
      break;
    case 'right':
      underlineX = x + containerWidth - underlineWidth;
      break;
    case 'left':
    default:
      underlineX = x; // Start at left edge
      break;
  }

  return (
    <Group
      // Apply same rotation as text to keep selection box aligned
      x={x + containerWidth / 2}
      y={y + containerHeight / 2}
      rotation={text.rotation ?? 0}
      offsetX={containerWidth / 2}
      offsetY={containerHeight / 2}
    >
      {/* Bounding box - only show when selected, not on hover */}
      {isSelected && (
        <Rect
          x={0}
          y={0}
          width={containerWidth}
          height={containerHeight}
          stroke={boxColor}
          strokeWidth={2}
          dash={[5, 5]} // Dashed border to distinguish from solid shapes
          listening={false} // Don't intercept mouse events
        />
      )}

      {/* Underline - shows under the text content */}
      {/* Has glow effect on hover, solid on selection */}
      <Line
        points={[underlineX - x, underlineY - y, underlineX - x + underlineWidth, underlineY - y]}
        stroke={underlineColor}
        strokeWidth={2}
        listening={false} // Don't intercept mouse events
        // Glow effect for hover
        shadowColor={underlineColor}
        shadowBlur={isHovered && !isSelected ? 8 : 0} // Glow on hover, no glow on selection
        shadowOpacity={0.8}
        shadowEnabled={isHovered && !isSelected} // Only enable shadow/glow on hover
      />
    </Group>
  );
}
