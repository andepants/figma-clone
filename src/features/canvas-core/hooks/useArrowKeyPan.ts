/**
 * Arrow Key Pan Hook
 *
 * Enables arrow keys to pan the canvas (Figma-style behavior):
 * - Arrow keys pan the canvas when nothing is selected
 * - Pan distance scales with current zoom level
 * - Hold Shift to increase pan distance (10x faster)
 * - Works even when a tool is active
 */

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores';

/**
 * Check if user is currently typing in an input field
 *
 * Prevents keyboard shortcuts from triggering when user is typing.
 * @returns {boolean} True if an input element is focused
 */
function isInputFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active?.getAttribute('contenteditable') === 'true'
  );
}

/**
 * Hook to handle arrow key panning
 *
 * Mimics Figma's arrow key pan behavior:
 * - Base pan distance: 50px in screen space (feels natural at all zoom levels)
 * - With Shift: 500px (10x faster)
 * - Distance is in screen space, so visual movement is consistent
 * - Only works when no objects are selected (otherwise nudge would trigger)
 *
 * @example
 * ```tsx
 * function CanvasStage() {
 *   useArrowKeyPan();
 *   return <Stage>...</Stage>;
 * }
 * ```
 */
export function useArrowKeyPan() {
  const { selectedIds, panX, panY, setPan, editingTextId } = useCanvasStore();

  useEffect(() => {
    /**
     * Handle arrow key presses for panning
     */
    function handleKeyDown(event: KeyboardEvent) {
      // Don't pan if user is typing
      if (isInputFocused()) {
        return;
      }

      // Don't pan if user is editing text
      if (editingTextId) {
        return;
      }

      // Don't pan if objects are selected (nudge would take priority)
      if (selectedIds.length > 0) {
        return;
      }

      const key = event.key;

      // Check if this is an arrow key
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return;
      }

      // Prevent default scrolling behavior
      event.preventDefault();

      // Base pan distance in screen pixels
      // Normal: 50px feels natural for panning
      // Shift: 500px for faster navigation (10x)
      const basePanDistance = 50;
      const panDistance = event.shiftKey ? basePanDistance * 10 : basePanDistance;

      // Calculate new pan position based on arrow direction
      let newPanX = panX;
      let newPanY = panY;

      switch (key) {
        case 'ArrowUp':
          newPanY += panDistance; // Move viewport down (content moves up)
          break;
        case 'ArrowDown':
          newPanY -= panDistance; // Move viewport up (content moves down)
          break;
        case 'ArrowLeft':
          newPanX += panDistance; // Move viewport right (content moves left)
          break;
        case 'ArrowRight':
          newPanX -= panDistance; // Move viewport left (content moves right)
          break;
      }

      // Apply the new pan position
      setPan(newPanX, newPanY);
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds, panX, panY, setPan, editingTextId]);
}
