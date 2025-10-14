/**
 * TextShape Component
 *
 * Renders a text shape on the canvas with selection and drag capabilities.
 * Text boxes are fixed-dimension containers (like rectangles) where text wraps/clips within bounds.
 * Note: Text positioning uses (x, y) as TOP-LEFT point (same as Rectangle).
 */

import { useState, useEffect, useRef, memo, Fragment, useCallback } from 'react';
import { Text as KonvaText, Label, Tag, Text as KonvaTextLabel } from 'react-konva';
import type Konva from 'konva';
import type { Text as TextType } from '@/types';
import { useToolStore, useCanvasStore } from '@/stores';
import {
  updateCanvasObject,
  throttledUpdateCanvasObject,
  startDragging,
  throttledUpdateDragPosition,
  throttledUpdateCursor,
  endDragging,
  startEditing,
  endEditing,
  checkEditLock,
  type EditState,
} from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '@/features/collaboration/utils';
import { screenToCanvasCoords, getFontStyle, applyTextTransform, getTextShadowProps } from '../utils';
import { ResizeHandles, TextSelectionBox, DimensionLabel } from '../components';
import { useResize, useTextEditor } from '../hooks';

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
  const { activeTool, setActiveTool } = useToolStore();
  const { updateObject, removeObject, editingTextId, setEditingText } = useCanvasStore();
  const { currentUser } = useAuth();

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation and editing
  const shapeRef = useRef<Konva.Text>(null);
  const animationRef = useRef<Konva.Tween | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  // Check if this text is being edited
  const isEditing = editingTextId === text.id;

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? text.x;
  const displayY = remoteDragState?.y ?? text.y;

  // Text boxes have fixed dimensions (width and height)
  // Ensure width and height are valid numbers to prevent NaN in offset calculations
  const textWidth = text.width || 100;
  const textHeight = text.height || 40;

  /**
   * Handle text save from editor
   * Updates text content and ends editing mode
   * If text is empty or unchanged from placeholder, deletes the text object
   * Switches tool back to move after editing completes
   */
  const handleTextSave = useCallback(async (newText: string) => {
    // Trim whitespace (removes spaces, tabs, newlines from beginning and end)
    const trimmedText = newText.trim();

    // Check if text is empty or still the placeholder
    const isEmpty = trimmedText === '';
    const isPlaceholder = trimmedText === 'Start typing...';

    if (isEmpty || isPlaceholder) {
      // Delete the text object
      removeObject(text.id);

      // Sync deletion to Firebase
      const { removeCanvasObject } = await import('@/lib/firebase');
      await removeCanvasObject('main', text.id);
    } else {
      // Update text content (trimmed, so no leading/trailing whitespace)
      updateObject(text.id, { text: trimmedText });
      await updateCanvasObject('main', text.id, { text: trimmedText });
    }

    // End editing
    setEditingText(null);
    await endEditing('main', text.id);

    // Switch back to move tool after editing completes (Figma-style behavior)
    setActiveTool('move');
  }, [removeObject, text.id, updateObject, setEditingText, setActiveTool]);

  /**
   * Handle text edit cancel
   * Closes editor without saving changes
   * Switches tool back to move after editing completes
   */
  const handleTextCancel = useCallback(async () => {
    // End editing without saving
    setEditingText(null);
    await endEditing('main', text.id);

    // Switch back to move tool after editing completes (Figma-style behavior)
    setActiveTool('move');
  }, [text.id, setEditingText, setActiveTool]);

  /**
   * Update stage ref when component mounts or text node changes
   */
  useEffect(() => {
    if (shapeRef.current) {
      stageRef.current = shapeRef.current.getStage();
    }
  }, []);

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

  /**
   * Animate selection changes
   * Smoothly transitions with a subtle scale pulse when selection state changes
   * Skip animation when text is being edited (text is invisible during edit)
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    // Cancel any previous animation to prevent buildup
    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }

    // Don't animate during editing (text is hidden anyway)
    if (isEditing) return;

    // Animate selection change
    if (isSelected) {
      // Animate to selected state (subtle scale pulse for Figma-style feedback)
      node.to({
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 0.1,
        onFinish: () => {
          // Return to normal scale
          node.to({
            scaleX: 1,
            scaleY: 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected, isEditing]);

  /**
   * Handle click on text
   * Only triggers selection when move tool is active
   * Supports shift-click for multi-select
   */
  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool === 'move') {
      onSelect(e);
    }
  }

  /**
   * Handle double-click on text
   * Enters edit mode if move tool is active and text is not locked
   */
  async function handleDoubleClick() {
    // Only allow editing in move tool mode
    if (activeTool !== 'move') {
      return;
    }

    if (!currentUser) {
      return;
    }

    // Can't edit if already editing (prevents redundant lock acquisition)
    if (isEditing) {
      return;
    }

    // Can't edit if another user is already editing
    if (isRemoteEditing) {
      // TODO: Show toast notification
      return;
    }

    // Check if text is locked by another user
    const lockState = await checkEditLock('main', text.id, currentUser.uid);
    if (lockState) {
      // TODO: Show toast notification
      return;
    }

    // Attempt to acquire editing lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canEdit = await startEditing('main', text.id, currentUser.uid, username, color);

    if (!canEdit) {
      // TODO: Show toast notification
      return;
    }

    // Select the text first (create fake event without shift key to ensure single selection for editing)
    const fakeEvent = {
      evt: { shiftKey: false },
    } as Konva.KonvaEventObject<MouseEvent>;
    onSelect(fakeEvent);

    // Enter edit mode
    setEditingText(text.id);
  }

  /**
   * Handle drag start
   * Checks for drag lock and prevents stage from dragging when dragging a shape
   * Note: In multi-select mode, individual shapes are non-draggable; group drag is handled by invisible drag target
   */
  async function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    if (!currentUser) return;

    // Attempt to acquire drag lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canDrag = await startDragging(
      'main',
      text.id,
      currentUser.uid,
      { x: text.x, y: text.y },
      username,
      color
    );

    if (!canDrag) {
      // Another user is dragging this object
      // Cancel the drag
      e.target.stopDrag();
      return;
    }
  }

  /**
   * Handle drag move
   * Emits throttled position updates to Realtime DB for real-time sync
   * Also updates cursor position so other users see cursor moving with object
   *
   * CRITICAL: Updates BOTH drag state AND object position to keep them in sync
   * This prevents flash-back bugs when drag ends.
   */
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const stage = node.getStage();
    // With offset, node.x() returns CENTER position, subtract offset to get top-left
    const position = {
      x: node.x() - textWidth / 2,
      y: node.y() - textHeight / 2
    };

    // Update local store immediately (optimistic update)
    updateObject(text.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition('main', text.id, position);
    throttledUpdateCanvasObject('main', text.id, position); // ← CRITICAL: Keep object current!

    // Update cursor position during drag so other users see cursor moving with object
    if (stage && currentUser) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasCoords = screenToCanvasCoords(stage, pointerPosition);
        const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
        const color = getUserColor(currentUser.uid);
        throttledUpdateCursor('main', currentUser.uid, canvasCoords, username, color);
      }
    }
  }

  /**
   * Handle drag end
   * Updates text position in store and syncs to Realtime Database
   *
   * CRITICAL FIX: Updates object IMMEDIATELY (no throttle) BEFORE clearing drag state
   * This eliminates the flash-back bug by ensuring object position is current
   * when remote users fall back from drag state to object position.
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;
    // With offset, node.x() returns CENTER position, subtract offset to get top-left
    const position = {
      x: node.x() - textWidth / 2,
      y: node.y() - textHeight / 2
    };

    // Update local store (optimistic update)
    updateObject(text.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject('main', text.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging('main', text.id);
  }

  /**
   * Handle mouse enter
   * Changes cursor and sets hover state
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Set hover state for visual feedback
    if (activeTool === 'move') {
      setIsHovered(true);
      stage.container().style.cursor = 'move';
    }
  }

  /**
   * Handle mouse leave
   * Resets cursor and hover state
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Clear hover state
    setIsHovered(false);

    // Reset cursor based on active tool
    stage.container().style.cursor = activeTool === 'move' ? 'pointer' : 'crosshair';
  }

  // Determine stroke styling based on state
  // NOTE: Selection and hover are now handled by TextSelectionBox, not stroke
  const getStroke = () => {
    // Remote editing: Show editor's color with dashed stroke (highest priority)
    if (isRemoteEditing) return editState.color;
    if (isRemoteDragging) return remoteDragState.color; // Remote drag: user's color
    // Hover is now handled by TextSelectionBox underline
    return undefined; // Default: no stroke (selection/hover handled by TextSelectionBox)
  };

  const getStrokeWidth = () => {
    if (isRemoteDragging) return 2; // Remote drag: medium border
    // Hover is now handled by TextSelectionBox underline
    return undefined; // Default: no border (selection/hover handled by TextSelectionBox)
  };

  /**
   * Determine if this text is being edited by a remote user
   */
  const isRemoteEditing = editState && editState.userId !== currentUser?.uid;

  /**
   * Get the text content to display
   * If another user is editing, show their live text
   * Otherwise show the persisted text (with transforms)
   */
  const getDisplayText = () => {
    // If being edited by another user and we have live text, show it
    if (isRemoteEditing && editState.liveText !== undefined) {
      return editState.liveText;
    }

    // Otherwise show persisted text (transformed)
    return applyTextTransform(text.text, text.textTransform);
  };

  // Calculate final draggable state
  const isDraggable = (isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging && !isEditing && !isInMultiSelect;

  return (
    <Fragment>
      <KonvaText
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
        opacity={(text.opacity ?? 1) * (isRemoteDragging ? 0.85 : 1)} // Combine shape opacity with state opacity
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
        stroke={getStroke() ?? text.stroke}
        strokeWidth={getStrokeWidth() ?? text.strokeWidth ?? 0}
        strokeEnabled={text.strokeEnabled ?? true}
        // Dashed stroke when being edited remotely
        dash={isRemoteEditing ? [5, 5] : undefined}
        // Shadow properties
        {...getTextShadowProps(text)}
        // Visibility - hide when editing
        visible={!isEditing}
        // Interaction
        onClick={handleClick}
        onTap={handleClick} // Mobile support
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick} // Mobile support
        draggable={isDraggable} // Disable drag if editing, remotely dragging, or in multi-select
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Custom selection visualization for text shapes */}
      {/* Shows underline with glow on hover, underline + bounding box on selection */}
      <TextSelectionBox
        text={text}
        isSelected={isSelected && !isEditing}
        isHovered={isHovered && activeTool === 'move' && !isSelected && !isEditing}
        color={isInMultiSelect ? '#38bdf8' : '#0ea5e9'}
        textNodeRef={shapeRef}
      />

      {/* Remote editing indicator - show underline + label when being edited by another user */}
      {isRemoteEditing && (
        <>
          {/* Show underline in editor's color (just like local editing) */}
          <TextSelectionBox
            text={text}
            isSelected={true}
            color={editState.color}
            textNodeRef={shapeRef}
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

      {/* Resize Handles - only visible when selected and not editing */}
      {/* Text boxes have fixed dimensions that can be resized in both width and height */}
      <ResizeHandles
        object={text}
        isSelected={isSelected && activeTool === 'move' && !isEditing}
        isResizing={isResizing}
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

      {/* Dimension Label - shows width × height when selected and not editing */}
      <DimensionLabel object={text} visible={isSelected && activeTool === 'move' && !isEditing} />
    </Fragment>
  );
});
