/**
 * TextShapeOverlays Component
 *
 * Renders visual overlays for text shapes including:
 * - Selection box and underline
 * - Hover effects
 * - Remote editing indicators
 * - Resize handles
 * - Dimension labels
 */

import { Fragment } from 'react';
import { Label, Tag, Text as KonvaTextLabel } from 'react-konva';
import type Konva from 'konva';
import type { Text as TextType, ResizeHandle } from '@/types';
import type { EditState } from '@/lib/firebase';
import { TextSelectionBox, ResizeHandles, DimensionLabel } from '../../components';

/**
 * Props for TextShapeOverlays component
 */
interface TextShapeOverlaysProps {
  /** Text object data */
  text: TextType;
  /** Whether text is currently selected */
  isSelected: boolean;
  /** Whether text is currently being edited locally */
  isEditing: boolean;
  /** Whether text is hovered */
  isHovered: boolean;
  /** Whether text is hovered from sidebar */
  isHoveredFromSidebar: boolean;
  /** Whether text is part of multi-selection */
  isInMultiSelect: boolean;
  /** Whether text is being edited by remote user */
  isRemoteEditing: boolean;
  /** Remote edit state */
  editState?: EditState;
  /** Whether object is locked */
  isLocked: boolean;
  /** Active tool */
  activeTool: string;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Display position X */
  displayX: number;
  /** Display Y position */
  displayY: number;
  /** Text width */
  textWidth: number;
  /** Text height */
  textHeight: number;
  /** Reference to text node */
  textNodeRef: React.RefObject<Konva.Text | null>;
  /** Resize start handler */
  onResizeStart: (handleType: ResizeHandle) => void;
  /** Resize move handler */
  onResizeMove: (_: ResizeHandle, x: number, y: number) => void;
  /** Resize end handler */
  onResizeEnd: () => void;
}

/**
 * TextShapeOverlays component
 *
 * Renders all visual overlay elements for a text shape including
 * selection indicators, hover effects, remote editing indicators,
 * resize handles, and dimension labels.
 *
 * @param {TextShapeOverlaysProps} props - Component props
 * @returns {JSX.Element} Overlay elements
 */
export function TextShapeOverlays({
  text,
  isSelected,
  isEditing,
  isHovered,
  isHoveredFromSidebar,
  isInMultiSelect,
  isRemoteEditing,
  editState,
  isLocked,
  activeTool,
  isResizing,
  displayX,
  displayY,
  textNodeRef,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: TextShapeOverlaysProps) {

  return (
    <Fragment>
      {/* Custom selection visualization for text shapes */}
      {/* Shows underline with glow on hover, underline + bounding box on selection */}
      <TextSelectionBox
        text={text}
        isSelected={isSelected && !isEditing}
        isHovered={(isHovered || isHoveredFromSidebar) && activeTool === 'move' && !isSelected && !isEditing}
        color={isLocked && isSelected ? '#0ea5e9' : isInMultiSelect ? '#38bdf8' : '#0ea5e9'}
        dash={undefined}
        textNodeRef={textNodeRef}
      />

      {/* Remote editing indicator - show underline + label when being edited by another user */}
      {isRemoteEditing && editState && (
        <>
          {/* Show underline in editor's color (just like local editing) */}
          <TextSelectionBox
            text={text}
            isSelected={true}
            color={editState.color}
            textNodeRef={textNodeRef}
          />

          {/* Show username label above text */}
          <Label
            x={displayX}
            y={displayY - 25} // Above text
            opacity={0.9}
          >
            <Tag
              fill={editState.color}
              pointerDirection="down"
              pointerWidth={6}
              pointerHeight={6}
              cornerRadius={3}
            />
            <KonvaTextLabel
              text={`${editState.username} is editing...`}
              fontSize={12}
              fontFamily="Inter"
              fill="#ffffff"
              padding={6}
            />
          </Label>
        </>
      )}

      {/* Resize Handles - only visible when selected, not editing, and not locked */}
      {/* Text boxes have fixed dimensions that can be resized in both width and height */}
      {!isLocked && (
        <ResizeHandles
          object={text}
          isSelected={isSelected && activeTool === 'move' && !isEditing}
          isResizing={isResizing}
          onResizeStart={(handleType) =>
            onResizeStart(handleType)
          }
          onResizeMove={(_, x, y) => onResizeMove(_, x, y)}
          onResizeEnd={() => onResizeEnd()}
        />
      )}

      {/* Dimension Label - shows width × height when selected, not editing, and not locked */}
      {!isLocked && (
        <DimensionLabel object={text} visible={isSelected && activeTool === 'move' && !isEditing} />
      )}
    </Fragment>
  );
}
