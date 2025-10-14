/**
 * GroupBoundingBox Component
 *
 * Renders a dashed bounding box around all selected objects during group drag.
 * Provides visual feedback that objects are being moved together.
 */

import { Rect } from 'react-konva';
import { useCanvasStore } from '@/stores';
import { getSelectionBounds } from '../utils/multiSelect';

interface GroupBoundingBoxProps {
  /** Whether group drag is active */
  isGroupDragging: boolean;
}

/**
 * Renders a dashed bounding box around multi-selected objects
 * Only visible during active group drag
 *
 * @example
 * ```tsx
 * <Layer>
 *   <GroupBoundingBox isGroupDragging={isGroupDragging} />
 * </Layer>
 * ```
 */
export function GroupBoundingBox({ isGroupDragging }: GroupBoundingBoxProps) {
  const { selectedIds, objects } = useCanvasStore();

  // Don't render if not dragging or single selection
  if (!isGroupDragging || selectedIds.length <= 1) {
    return null;
  }

  // Calculate bounding box
  const bounds = getSelectionBounds(objects, selectedIds);

  if (!bounds) {
    return null;
  }

  return (
    <Rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      stroke="#0ea5e9"
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}
