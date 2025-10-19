/**
 * Stage Preview Shapes Component
 *
 * Renders preview shapes during creation and selection:
 * - Rectangle preview (during rectangle creation)
 * - Circle preview (during circle creation)
 * - Line preview (during line creation)
 * - Drag-to-select rectangle (marquee selection)
 * - Multi-select drag target (invisible bounding box)
 *
 * Performance optimizations:
 * - Memoized with React.memo to prevent re-renders during canvas interactions
 */

import { memo } from 'react';
import type Konva from 'konva';
import { Rect, Circle as KonvaCircle, Line as KonvaLine } from 'react-konva';
import type { CanvasObject } from '@/types';
import { GroupBoundingBox } from '../GroupBoundingBox';
import { useToolStore } from '@/stores';
import { getSelectionBounds } from '../../utils';

/**
 * Selection rectangle for marquee selection
 * @interface SelectionRect
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width
 * @property {number} height - Height
 */
interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * StagePreviewShapes component props
 * @interface StagePreviewShapesProps
 * @property {CanvasObject | null} previewShape - Current preview shape
 * @property {SelectionRect | null} selectionRect - Drag-to-select rectangle
 * @property {string[]} selectedIds - Currently selected object IDs
 * @property {CanvasObject[]} objects - All canvas objects
 * @property {boolean} isGroupDragging - Whether group is being dragged
 * @property {(e: Konva.KonvaEventObject<DragEvent>) => void} handleGroupDragStart - Group drag start handler
 * @property {(e: Konva.KonvaEventObject<DragEvent>) => void} handleGroupDragMove - Group drag move handler
 * @property {(e: Konva.KonvaEventObject<DragEvent>) => void} handleGroupDragEnd - Group drag end handler
 */
interface StagePreviewShapesProps {
  previewShape: CanvasObject | null;
  selectionRect: SelectionRect | null;
  selectedIds: string[];
  objects: CanvasObject[];
  isGroupDragging: boolean;
  handleGroupDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleGroupDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleGroupDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

/**
 * StagePreviewShapes component
 * Renders all preview shapes for shape creation and selection
 *
 * Memoized to prevent unnecessary re-renders during canvas interactions
 *
 * @param {StagePreviewShapesProps} props - Component props
 * @returns {JSX.Element} Preview shapes
 */
export const StagePreviewShapes = memo(
  function StagePreviewShapes({
  previewShape,
  selectionRect,
  selectedIds,
  objects,
  isGroupDragging,
  handleGroupDragStart,
  handleGroupDragMove,
  handleGroupDragEnd,
}: StagePreviewShapesProps) {
  const { activeTool } = useToolStore();

  // Calculate bounding box for multi-select drag target
  const isInMultiSelect = selectedIds.length > 1;
  const selectionBounds = isInMultiSelect ? getSelectionBounds(objects, selectedIds) : null;

  return (
    <>
      {/* Preview rectangle (while creating) */}
      {previewShape && previewShape.type === 'rectangle' && (
        <Rect
          x={previewShape.x}
          y={previewShape.y}
          width={previewShape.width}
          height={previewShape.height}
          fill="transparent"
          stroke="#0ea5e9"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Preview circle (while creating) */}
      {previewShape && previewShape.type === 'circle' && (
        <KonvaCircle
          x={previewShape.x}
          y={previewShape.y}
          radius={previewShape.radius}
          fill="transparent"
          stroke="#ef4444"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Preview line (while creating) */}
      {previewShape && previewShape.type === 'line' && (
        <KonvaLine
          x={previewShape.x}
          y={previewShape.y}
          points={previewShape.points}
          stroke="#0ea5e9"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
          lineCap="round"
          lineJoin="round"
          rotation={0} // Always 0 - line direction comes from points array
        />
      )}

      {/* Drag-to-select rectangle (marquee selection) */}
      {selectionRect && (
        <Rect
          x={selectionRect.x}
          y={selectionRect.y}
          width={selectionRect.width}
          height={selectionRect.height}
          fill="rgba(14, 165, 233, 0.1)"
          stroke="#0ea5e9"
          strokeWidth={1}
          dash={[5, 5]}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}

      {/* Invisible drag target for multi-select group dragging */}
      {isInMultiSelect && selectionBounds && activeTool === 'move' && (
        <Rect
          x={selectionBounds.x}
          y={selectionBounds.y}
          width={selectionBounds.width}
          height={selectionBounds.height}
          fill="transparent"
          draggable={true}
          onDragStart={handleGroupDragStart}
          onDragMove={handleGroupDragMove}
          onDragEnd={handleGroupDragEnd}
        />
      )}

      {/* Group bounding box (visible during group drag) */}
      <GroupBoundingBox isGroupDragging={isGroupDragging} />
    </>
  );
  }
);
