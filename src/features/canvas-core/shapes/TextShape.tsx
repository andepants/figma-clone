/**
 * TextShape Component
 *
 * Renders a text shape on the canvas with selection and drag capabilities.
 * Text boxes are fixed-dimension containers (like rectangles) where text wraps/clips within bounds.
 * Note: Text positioning uses (x, y) as TOP-LEFT point (same as Rectangle).
 */

import { useEffect, memo, Fragment, useMemo } from 'react';
import { Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { Text as TextType } from '@/types';
import type { EditState } from '@/lib/firebase';
import { useToolStore, useCanvasStore, useUIStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import { getFontStyle, getTextShadowProps } from '../utils';
import { useResize, useTextEditor } from '../hooks';
import { useTextShapeState, useTextShapeHandlers, TextShapeOverlays } from './text';

/**
 * TextShape component props
 */
interface TextShapeProps {
  /** Text data */
  text: TextType;
  /** Whether this text is currently selected */
  isSelected: boolean;
  /** Callback when text is selected (supports shift-click for multi-select) */
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
  /** Optional edit state from another user (for live text preview and editing indicators) */
  editState?: EditState;
  /** Whether this text is part of a multi-selection */
  isInMultiSelect?: boolean;
}

/**
 * TextShape component
 *
 * Renders a Konva text with selection, drag, and interaction support.
 * Only allows selection and dragging when the move tool is active.
 * Optimized with React.memo to prevent unnecessary re-renders.
 *
 * IMPORTANT: Text position (x, y) represents TOP-LEFT corner (same as Rectangle).
 *
 * @param {TextShapeProps} props - Component props
 * @returns {JSX.Element} TextShape component
 *
 * @example
 * ```tsx
 * <TextShape
 *   text={textData}
 *   isSelected={selectedId === textData.id}
 *   onSelect={() => selectObject(textData.id)}
 * />
 * ```
 */
export const TextShape = memo(function TextShape({
  text,
  isSelected,
  onSelect,
  remoteDragState,
  editState,
  isInMultiSelect = false,
}: TextShapeProps) {
  const { activeTool } = useToolStore();
  const { editingTextId } = useCanvasStore();
  const { currentUser } = useAuth();
  const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);

  // Check if object is locked
  const isLocked = text.locked === true;

  // Check if this text is being edited
  const isEditing = editingTextId === text.id;

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Check if this object is hovered in the sidebar (but not selected)
  const isHoveredFromSidebar = hoveredObjectId === text.id && !isSelected;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? text.x;
  const displayY = remoteDragState?.y ?? text.y;

  // Text boxes have fixed dimensions (width and height)
  // Ensure width and height are valid numbers to prevent NaN in offset calculations
  const textWidth = text.width || 100;
  const textHeight = text.height || 40;

  // State management hook
  const {
    isHovered,
    isRemoteEditing,
    shapeRef,
    stageRef,
    getDisplayText,
  } = useTextShapeState({
    text,
    isSelected,
    isEditing,
    editState,
    currentUserId: currentUser?.uid,
  });

  // Event handlers hook
  const {
    handleTextSave,
    handleTextCancel,
    handleClick,
    handleDoubleClick,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleMouseEnter,
    handleMouseLeave,
  } = useTextShapeHandlers({
    text,
    isSelected,
    isEditing,
    editState,
    isRemoteEditing,
    isLocked,
    textWidth,
    textHeight,
    onSelect,
  });

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();

  /**
   * Text editor hook - manages textarea overlay
   */
  useTextEditor({
    text,
    textNodeRef: shapeRef,
    stageRef,
    isEditing,
    onSave: handleTextSave,
    onCancel: handleTextCancel,
  });

  /**
   * Edge case: Close editor when tool changes
   * Auto-save changes when user switches tools
   */
  useEffect(() => {
    // CRITICAL: Only trigger if we're editing AND tool is not 'move' AND tool is not 'text'
    // Skip 'text' tool because that's the creation tool - we don't want to close
    // the editor immediately after creating text
    if (isEditing && activeTool !== 'move' && activeTool !== 'text') {
      // Tool changed while editing, auto-save
      // Get the current textarea value
      const textarea = document.querySelector('textarea');
      if (textarea) {
        handleTextSave(textarea.value);
      } else {
        // Textarea not found, just close
        handleTextCancel();
      }
    }
  }, [activeTool, isEditing, handleTextSave, handleTextCancel]);


  // Determine stroke styling based on state (memoized to prevent unnecessary re-renders)
  // NOTE: Selection and hover are now handled by TextSelectionBox, not stroke
  const stroke = useMemo(() => {
    // Remote editing: Show editor's color with dashed stroke (highest priority)
    if (isRemoteEditing && editState) return editState.color;
    if (isRemoteDragging) return remoteDragState?.color; // Remote drag: user's color
    // Hover is now handled by TextSelectionBox underline
    return undefined; // Default: no stroke (selection/hover handled by TextSelectionBox)
  }, [isRemoteEditing, editState, isRemoteDragging, remoteDragState?.color]);

  const strokeWidth = useMemo(() => {
    if (isRemoteDragging) return 2; // Remote drag: medium border
    // Hover is now handled by TextSelectionBox underline
    return undefined; // Default: no border (selection/hover handled by TextSelectionBox)
  }, [isRemoteDragging]);

  const opacity = useMemo(() => {
    if (isRemoteDragging) return 0.85; // Remote drag: slightly transparent
    return 1; // Default: fully opaque
  }, [isRemoteDragging]);

  // Calculate final draggable state
  const isDraggable = !isLocked && (isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging && !isEditing && !isInMultiSelect;

  // Don't render if hidden
  if (text.visible === false) {
    return null;
  }

  return (
    <Fragment>
      <KonvaText
        id={text.id}
        ref={shapeRef}
        // Position adjusted for center-based offset: x,y in data model represents top-left,
        // but with offset we need to position at center, so add half dimensions
        x={displayX + textWidth / 2}
        y={displayY + textHeight / 2}
        text={getDisplayText()}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        fontStyle={getFontStyle(text.fontWeight, text.fontStyle)}
        fill={text.fill}
        // Transform properties
        rotation={text.rotation ?? 0}
        opacity={(text.opacity ?? 1) * opacity} // Combine shape opacity with state opacity
        // Typography properties
        textDecoration={text.textDecoration || ''}
        lineHeight={text.lineHeight || 1.2}
        letterSpacing={text.letterSpacing || 0}
        // Fixed dimensions - text wraps/clips within bounds
        width={textWidth}
        height={textHeight}
        align={text.align || text.textAlign}
        verticalAlign={text.verticalAlign}
        wrap={text.wrap || 'word'} // Enable wrapping by default
        ellipsis={true} // Show ellipsis if text overflows
        // Offset for center-based rotation (shapes rotate around their center, not top-left)
        offsetX={textWidth / 2}
        offsetY={textHeight / 2}
        // Stroke properties (with state-based overrides for selection/hover)
        stroke={stroke ?? text.stroke}
        strokeWidth={strokeWidth ?? text.strokeWidth ?? 0}
        strokeEnabled={text.strokeEnabled ?? true}
        // Dashed stroke when being edited remotely
        dash={isRemoteEditing ? [5, 5] : undefined}
        // Shadow properties
        {...getTextShadowProps(text)}
        // Visibility - hide when editing
        visible={!isEditing}
        // Interaction
        listening={!isLocked} // Locked objects don't respond to events
        onClick={handleClick}
        onTap={handleClick} // Mobile support
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick} // Mobile support
        draggable={isDraggable} // Disable drag if locked, editing, remotely dragging, or in multi-select
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* All visual overlays (selection, hover, resize, labels) */}
      <TextShapeOverlays
        text={text}
        isSelected={isSelected}
        isEditing={isEditing}
        isHovered={isHovered}
        isHoveredFromSidebar={isHoveredFromSidebar}
        isInMultiSelect={isInMultiSelect}
        isRemoteEditing={isRemoteEditing ?? false}
        editState={editState}
        isLocked={isLocked}
        activeTool={activeTool}
        isResizing={isResizing ?? false}
        displayX={displayX}
        displayY={displayY}
        textWidth={textWidth}
        textHeight={textHeight}
        textNodeRef={shapeRef}
        onResizeStart={(handleType) =>
          handleResizeStart(text.id, handleType, {
            x: text.x,
            y: text.y,
            width: textWidth,
            height: textHeight,
          })
        }
        onResizeMove={(_, x, y) => handleResizeMove(text.id, x, y)}
        onResizeEnd={() => handleResizeEnd(text.id)}
      />
    </Fragment>
  );
});
