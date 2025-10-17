/**
 * useTextShapeHandlers Hook
 *
 * Event handlers for TextShape component including:
 * - Click and double-click handlers
 * - Drag handlers (start, move, end)
 * - Mouse enter/leave handlers
 * - Text save/cancel handlers
 */

import { useCallback } from 'react';
import type Konva from 'konva';
import type { Text as TextType } from '@/types';
import type { EditState } from '@/lib/firebase';
import { useToolStore, useCanvasStore, useUIStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '@/features/collaboration/utils';
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
} from '@/lib/firebase';
import { screenToCanvasCoords } from '../../utils';

/**
 * Props for useTextShapeHandlers hook
 */
interface UseTextShapeHandlersProps {
  /** Text object data */
  text: TextType;
  /** Whether text is currently selected */
  isSelected: boolean;
  /** Whether text is currently being edited locally */
  isEditing: boolean;
  /** Remote edit state from another user */
  editState?: EditState;
  /** Whether text is being remotely edited */
  isRemoteEditing: boolean;
  /** Whether object is locked */
  isLocked: boolean;
  /** Text width */
  textWidth: number;
  /** Text height */
  textHeight: number;
  /** Callback when text is selected */
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * useTextShapeHandlers hook
 *
 * Provides all event handlers for TextShape component.
 * Handles clicks, drags, mouse interactions, and text editing.
 *
 * @param {UseTextShapeHandlersProps} props - Hook props
 * @returns Event handlers
 */
export function useTextShapeHandlers({
  text,
  isSelected,
  isEditing,
  isRemoteEditing,
  isLocked,
  textWidth,
  textHeight,
  onSelect,
}: UseTextShapeHandlersProps) {
  const { activeTool, setActiveTool } = useToolStore();
  const { projectId, updateObject, removeObject, setEditingText } = useCanvasStore();
  const { currentUser } = useAuth();
  const setHoveredObject = useUIStore((state) => state.setHoveredObject);

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
      await removeCanvasObject(projectId, text.id);
    } else {
      // Update text content (trimmed, so no leading/trailing whitespace)
      updateObject(text.id, { text: trimmedText });
      await updateCanvasObject(projectId, text.id, { text: trimmedText });
    }

    // End editing
    setEditingText(null);
    await endEditing(projectId, text.id);

    // Switch back to move tool after editing completes (Figma-style behavior)
    setActiveTool('move');
  }, [projectId, removeObject, text.id, updateObject, setEditingText, setActiveTool]);

  /**
   * Handle text edit cancel
   * Closes editor without saving changes
   * Switches tool back to move after editing completes
   */
  const handleTextCancel = useCallback(async () => {
    // End editing without saving
    setEditingText(null);
    await endEditing(projectId, text.id);

    // Switch back to move tool after editing completes (Figma-style behavior)
    setActiveTool('move');
  }, [projectId, text.id, setEditingText, setActiveTool]);

  /**
   * Handle click on text
   * Only triggers selection when move tool is active
   * Ignores clicks on locked objects
   * Supports shift-click for multi-select
   */
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Ignore clicks on locked objects
    if (isLocked) {
      return;
    }

    if (activeTool === 'move') {
      onSelect(e);
    }
  }, [isLocked, activeTool, onSelect]);

  /**
   * Handle double-click on text
   * Enters edit mode if move tool is active and text is not locked
   */
  const handleDoubleClick = useCallback(async () => {
    // Can't edit locked objects
    if (isLocked) {
      return;
    }

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
    const lockState = await checkEditLock(projectId, text.id, currentUser.uid);
    if (lockState) {
      // TODO: Show toast notification
      return;
    }

    // Attempt to acquire editing lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canEdit = await startEditing(projectId, text.id, currentUser.uid, username, color);

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
  }, [isLocked, activeTool, currentUser, isEditing, isRemoteEditing, projectId, text.id, onSelect, setEditingText]);

  /**
   * Handle drag start
   * Checks for drag lock and prevents stage from dragging when dragging a shape
   * Note: In multi-select mode, individual shapes are non-draggable; group drag is handled by invisible drag target
   */
  const handleDragStart = useCallback(async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    if (!currentUser) return;

    // Select object when drag starts (if not already selected)
    // This ensures the dragged object becomes the selected object
    if (!isSelected) {
      // Create fake event without shift key to ensure single selection
      const fakeEvent = {
        evt: { shiftKey: false },
      } as Konva.KonvaEventObject<MouseEvent>;
      onSelect(fakeEvent);
    }

    // Attempt to acquire drag lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canDrag = await startDragging(
      projectId,
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
  }, [currentUser, isSelected, projectId, text.id, text.x, text.y, onSelect]);

  /**
   * Handle drag move
   * Emits throttled position updates to Realtime DB for real-time sync
   * Also updates cursor position so other users see cursor moving with object
   *
   * CRITICAL: Updates BOTH drag state AND object position to keep them in sync
   * This prevents flash-back bugs when drag ends.
   */
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
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
    throttledUpdateDragPosition(projectId, text.id, position);
    throttledUpdateCanvasObject(projectId, text.id, position); // ← CRITICAL: Keep object current!

    // Update cursor position during drag so other users see cursor moving with object
    if (stage && currentUser) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasCoords = screenToCanvasCoords(stage, pointerPosition);
        const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
        const color = getUserColor(currentUser.uid);
        throttledUpdateCursor(projectId, currentUser.uid, canvasCoords, username, color);
      }
    }
  }, [textWidth, textHeight, updateObject, text.id, projectId, currentUser]);

  /**
   * Handle drag end
   * Updates text position in store and syncs to Realtime Database
   *
   * CRITICAL FIX: Updates object IMMEDIATELY (no throttle) BEFORE clearing drag state
   * This eliminates the flash-back bug by ensuring object position is current
   * when remote users fall back from drag state to object position.
   */
  const handleDragEnd = useCallback(async (e: Konva.KonvaEventObject<DragEvent>) => {
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
    await updateCanvasObject(projectId, text.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging(projectId, text.id);
  }, [textWidth, textHeight, updateObject, text.id, projectId]);

  /**
   * Handle mouse enter
   * Changes cursor and sets hover state
   * Syncs hover state to UI store for bidirectional sidebar sync
   */
  const handleMouseEnter = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Set hover state for visual feedback
    if (activeTool === 'move') {
      stage.container().style.cursor = 'move';
      // Sync to UI store for sidebar hover highlighting
      setHoveredObject(text.id);
    }
  }, [activeTool, setHoveredObject, text.id]);

  /**
   * Handle mouse leave
   * Resets cursor and hover state
   * Clears UI store hover state if this object is still hovered (prevents race conditions)
   */
  const handleMouseLeave = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Reset cursor based on active tool
    stage.container().style.cursor = activeTool === 'move' ? 'pointer' : 'crosshair';

    // Clear UI store hover only if this object is still the hovered one
    // This prevents race conditions when quickly moving between objects
    const current = useUIStore.getState().hoveredObjectId;
    if (current === text.id) {
      setHoveredObject(null);
    }
  }, [activeTool, text.id, setHoveredObject]);

  return {
    handleTextSave,
    handleTextCancel,
    handleClick,
    handleDoubleClick,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleMouseEnter,
    handleMouseLeave,
  };
}
