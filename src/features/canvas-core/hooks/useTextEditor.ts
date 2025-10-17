/**
 * useTextEditor Hook
 *
 * Manages text editing with HTML textarea overlay positioned over Konva Text node.
 * Handles positioning, styling, keyboard events, and cleanup.
 */

import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import type { Text } from '@/types';
import { throttledUpdateLiveText, updateEditHeartbeat, endEditing } from '@/lib/firebase';
import { useCanvasStore } from '@/stores';

/**
 * useTextEditor hook parameters
 */
interface UseTextEditorParams {
  /** The text object being edited */
  text: Text;
  /** Konva Text node reference */
  textNodeRef: React.RefObject<Konva.Text | null>;
  /** Konva Stage reference for positioning */
  stageRef: React.RefObject<Konva.Stage | null>;
  /** Whether editing is active */
  isEditing: boolean;
  /** Callback when text is saved */
  onSave: (newText: string) => void;
  /** Callback when editing is cancelled */
  onCancel: () => void;
}

/**
 * Hook for managing text editing with textarea overlay
 *
 * Creates an HTML textarea positioned over the Konva Text node, styled to match
 * the text appearance. Handles all editing interactions including keyboard events
 * and outside clicks.
 *
 * @param params - Text editor parameters
 *
 * @example
 * ```tsx
 * const textNodeRef = useRef<Konva.Text>(null);
 * const stageRef = useRef<Konva.Stage>(null);
 *
 * useTextEditor({
 *   text: textObject,
 *   textNodeRef,
 *   stageRef,
 *   isEditing: editingTextId === textObject.id,
 *   onSave: (newText) => updateText(textObject.id, { text: newText }),
 *   onCancel: () => setEditingTextId(null),
 * });
 * ```
 */
export function useTextEditor({
  text,
  textNodeRef,
  stageRef,
  isEditing,
  onSave,
  onCancel,
}: UseTextEditorParams) {
  const { projectId } = useCanvasStore();
  // Store textarea reference for cleanup
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Store original text for cancel
  const originalTextRef = useRef<string>('');
  // Store heartbeat interval
  const heartbeatIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only create textarea when editing is active
    if (!isEditing) {
      return;
    }

    const textNode = textNodeRef.current;
    const stage = stageRef.current;

    if (!textNode || !stage) {
      return;
    }

    // CRITICAL: Capture text properties at creation time
    // Don't let RTDB updates trigger re-creation of textarea
    const capturedText = { ...text };

    // Store original text for cancel
    originalTextRef.current = capturedText.text;

    // Create textarea element
    const textarea = document.createElement('textarea');
    textareaRef.current = textarea;
    document.body.appendChild(textarea);

    // Get absolute position of text on screen
    // CRITICAL: absolutePosition() returns CENTER position (after offset is applied)
    // We need TOP-LEFT position for textarea, so we must subtract the offset
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const stageScale = stage.scaleX(); // Assumes uniform scaling (scaleX === scaleY)

    // Get text dimensions
    const textWidth = capturedText.width || 100;
    const textHeight = capturedText.height || 40;

    // Convert from center position (Konva) to top-left position (HTML)
    // absolutePosition gives us CENTER, subtract half dimensions to get TOP-LEFT
    const topLeftX = textPosition.x - (textWidth * stageScale) / 2;
    const topLeftY = textPosition.y - (textHeight * stageScale) / 2;

    // Calculate screen position accounting for stage position and zoom
    const areaPosition = {
      x: stageBox.left + topLeftX,
      y: stageBox.top + topLeftY,
    };

    // Set textarea content and basic styles
    textarea.value = capturedText.text;
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;

    // Calculate dimensions accounting for zoom (already computed above)
    const scaledWidth = textWidth * stageScale;
    const scaledHeight = textHeight * stageScale;
    const padding = (textNode.padding() || 0) * stageScale;

    textarea.style.width = `${scaledWidth - padding * 2}px`;
    textarea.style.height = `${scaledHeight - padding * 2 + 5}px`;

    // Match text styling
    const fontSize = (capturedText.fontSize || 16) * stageScale;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = capturedText.fontFamily || 'Inter';
    textarea.style.color = capturedText.fill || '#000000';
    textarea.style.lineHeight = (capturedText.lineHeight || 1.2).toString();
    textarea.style.letterSpacing = `${(capturedText.letterSpacing || 0) * stageScale}px`;
    textarea.style.textAlign = capturedText.align || capturedText.textAlign || 'left';

    // Apply font weight and style
    const fontWeight = capturedText.fontWeight || 400;
    const fontStyle = capturedText.fontStyle || 'normal';
    textarea.style.fontWeight = fontWeight.toString();
    textarea.style.fontStyle = fontStyle;

    // Apply text decoration
    if (capturedText.textDecoration && capturedText.textDecoration !== 'none') {
      textarea.style.textDecoration = capturedText.textDecoration;
    }

    // Apply text transform
    if (capturedText.textTransform && capturedText.textTransform !== 'none') {
      textarea.style.textTransform = capturedText.textTransform;
    }

    // Reset default textarea styles
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none'; // No outline - text itself shows you're editing
    textarea.style.resize = 'none';
    textarea.style.transformOrigin = 'left top';
    textarea.style.zIndex = '10000'; // Above canvas

    // Handle rotation
    const rotation = capturedText.rotation || 0;
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    // Auto-resize textarea height
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    // Focus and select all text
    // CRITICAL: Use multiple strategies to ensure focus and selection work reliably

    // Strategy 1: Immediate focus (works in most cases)
    textarea.focus();
    textarea.select();

    // Strategy 2: requestAnimationFrame (next frame, after DOM paint)
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      // Strategy 3: Early timeout (50ms - catches most edge cases)
      setTimeout(() => {
        const wasFocused = document.activeElement === textarea;
        if (!wasFocused) {
          textarea.focus();
        }
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
      }, 50);

      // Strategy 4: Final timeout (150ms - ensures selection in all browsers)
      // This guarantees the placeholder text is selected and ready to be replaced
      setTimeout(() => {
        const wasFocused = document.activeElement === textarea;
        if (!wasFocused) {
          textarea.focus();
        }
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
      }, 150);
    });

    // Set up heartbeat to keep edit lock alive
    // Update every 5 seconds to prevent timeout (30s timeout in textEditingService)
    heartbeatIntervalRef.current = setInterval(() => {
      updateEditHeartbeat(projectId, capturedText.id);
    }, 5000);

    /**
     * Handle keyboard events
     */
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Enter without Shift: save and close
        e.preventDefault();
        onSave(textarea.value);
      } else if (e.key === 'Escape') {
        // Escape: cancel and close
        e.preventDefault();
        onCancel();
      }
    }

    /**
     * Handle input to auto-resize textarea
     * Also updates live text in RTDB so other users can see typing
     */
    function handleInput() {
      if (!textNode || !stage) return;

      const scale = stageScale;
      const scaledWidth = textWidth * scale;

      // Update width (in case text properties changed)
      textarea.style.width = `${scaledWidth}px`;

      // Auto-resize height
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + fontSize}px`;

      // Update live text in RTDB so other users can see typing (throttled to 100ms)
      throttledUpdateLiveText(projectId, capturedText.id, textarea.value);
    }

    // Track whether outside click handler is active
    let outsideClickActive = false;

    /**
     * Handle clicks outside textarea
     */
    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      if (!outsideClickActive) {
        return;
      }

      if (e.target !== textarea) {
        onSave(textarea.value);
      }
    }

    // Add event listeners
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);

    // Delay outside click handler to prevent immediate trigger
    // CRITICAL: 600ms delay gives users ample time to start typing after text creation
    // This prevents accidental closure when repositioning mouse or thinking about what to type
    const outsideClickTimeout = setTimeout(() => {
      outsideClickActive = true;
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('touchstart', handleOutsideClick);
    }, 600);

    // Cleanup function
    return () => {

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // CRITICAL: Always release edit lock on cleanup
      // This ensures the lock is released even if cleanup runs before
      // the normal save/cancel flow completes (e.g., component unmount, re-render)
      // This prevents "zombie locks" that block future edit attempts
      endEditing(projectId, capturedText.id).catch(() => {});

      clearTimeout(outsideClickTimeout);
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);

      // Remove textarea from DOM
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }

      textareaRef.current = null;
    };
    // CRITICAL: Only depend on isEditing and text.id, NOT the full text object
    // This prevents re-creation of textarea when RTDB updates text content/properties
    // We capture text properties at creation time, so we don't need to react to their changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, text.id]);
}
