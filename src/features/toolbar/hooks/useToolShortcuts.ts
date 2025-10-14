/**
 * Tool Shortcuts Hook
 *
 * Manages keyboard shortcuts for tool selection.
 * Listens for key presses and updates the active tool accordingly.
 */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useToolStore } from '@/stores';
import { useCanvasStore } from '@/stores';
import { removeCanvasObject, addCanvasObject } from '@/lib/firebase';
import { duplicateObject } from '@/features/canvas-core/utils';

/**
 * Check if user is currently typing in an input field
 *
 * Prevents keyboard shortcuts from triggering when user is typing.
 * Checks for input, textarea, and contenteditable elements.
 *
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
 * Hook to handle keyboard shortcuts for tools
 *
 * Keyboard shortcuts:
 * - V: Move tool
 * - R: Rectangle tool
 * - C: Circle tool
 * - T: Text tool
 * - Cmd/Ctrl+D: Duplicate selected object
 * - Cmd/Ctrl+0: Reset zoom to 100%
 * - Cmd/Ctrl+1: Fit all objects in view
 * - Cmd/Ctrl+2: Zoom to selection
 * - Delete/Backspace: Delete selected object
 * - Escape: Clear selection
 * - ?: Show keyboard shortcuts modal
 *
 * Shortcuts are disabled when user is typing in an input/textarea.
 *
 * @param {function} onShowShortcuts - Optional callback to show shortcuts modal
 *
 * @example
 * ```tsx
 * function CanvasPage() {
 *   const [showShortcuts, setShowShortcuts] = useState(false);
 *   useToolShortcuts(() => setShowShortcuts(true));
 *   return <div>...</div>;
 * }
 * ```
 */
export function useToolShortcuts(onShowShortcuts?: () => void) {
  const { setActiveTool } = useToolStore();
  const { clearSelection, selectedId, removeObject, objects, addObject, selectObject, resetView, setZoom, setPan, zoom } = useCanvasStore();

  useEffect(() => {
    /**
     * Handle keydown events for tool shortcuts
     */
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts if user is typing in an input
      if (isInputFocused()) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle Cmd/Ctrl+D for duplicate
      if ((event.metaKey || event.ctrlKey) && key === 'd') {
        event.preventDefault(); // Prevent browser "Add Bookmark" dialog

        if (selectedId) {
          const selectedObject = objects.find(obj => obj.id === selectedId);
          if (selectedObject) {
            // Create duplicate with new ID and offset position
            const duplicate = duplicateObject(selectedObject);

            // Optimistic update
            addObject(duplicate);
            selectObject(duplicate.id);

            // Sync to Realtime Database
            addCanvasObject('main', duplicate)
              .then(() => {
                toast.success('Object duplicated');
              })
              .catch((error) => {
                console.error('Failed to sync duplicate to RTDB:', error);
                toast.error('Failed to duplicate object');
              });
          }
        }
        return;
      }

      // Handle Cmd/Ctrl+0 for reset zoom (100%)
      if ((event.metaKey || event.ctrlKey) && key === '0') {
        event.preventDefault(); // Prevent browser zoom
        resetView();
        return;
      }

      // Handle Cmd/Ctrl+1 for fit all objects
      if ((event.metaKey || event.ctrlKey) && key === '1') {
        event.preventDefault();

        if (objects.length === 0) {
          resetView();
          return;
        }

        // Calculate bounding box of all objects
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        objects.forEach((obj) => {
          if (obj.type === 'rectangle') {
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + obj.width);
            maxY = Math.max(maxY, obj.y + obj.height);
          } else if (obj.type === 'circle') {
            minX = Math.min(minX, obj.x - obj.radius);
            minY = Math.min(minY, obj.y - obj.radius);
            maxX = Math.max(maxX, obj.x + obj.radius);
            maxY = Math.max(maxY, obj.y + obj.radius);
          } else if (obj.type === 'text') {
            // Text positioning - estimate bounds
            const textWidth = obj.width || 200; // Default width
            const textHeight = obj.fontSize * 1.2 || 30; // Approximate height
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + textWidth);
            maxY = Math.max(maxY, obj.y + textHeight);
          }
        });

        // Add padding
        const padding = 50;
        const boundsWidth = maxX - minX + padding * 2;
        const boundsHeight = maxY - minY + padding * 2;

        // Calculate zoom to fit
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scaleX = viewportWidth / boundsWidth;
        const scaleY = viewportHeight / boundsHeight;
        const newZoom = Math.min(scaleX, scaleY, 5.0); // Max 5x zoom

        // Calculate center position
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const newPanX = viewportWidth / 2 - centerX * newZoom;
        const newPanY = viewportHeight / 2 - centerY * newZoom;

        setZoom(newZoom);
        setPan(newPanX, newPanY);
        return;
      }

      // Handle Cmd/Ctrl+2 for zoom to selection
      if ((event.metaKey || event.ctrlKey) && key === '2') {
        event.preventDefault();

        if (!selectedId) {
          toast.info('No object selected');
          return;
        }

        const selectedObject = objects.find(obj => obj.id === selectedId);
        if (!selectedObject) return;

        // Calculate bounding box of selected object
        let minX, minY, maxX, maxY;

        if (selectedObject.type === 'rectangle') {
          minX = selectedObject.x;
          minY = selectedObject.y;
          maxX = selectedObject.x + selectedObject.width;
          maxY = selectedObject.y + selectedObject.height;
        } else if (selectedObject.type === 'circle') {
          minX = selectedObject.x - selectedObject.radius;
          minY = selectedObject.y - selectedObject.radius;
          maxX = selectedObject.x + selectedObject.radius;
          maxY = selectedObject.y + selectedObject.radius;
        } else if (selectedObject.type === 'text') {
          const textWidth = selectedObject.width || 200;
          const textHeight = selectedObject.fontSize * 1.2 || 30;
          minX = selectedObject.x;
          minY = selectedObject.y;
          maxX = selectedObject.x + textWidth;
          maxY = selectedObject.y + textHeight;
        } else {
          return;
        }

        // Add padding
        const padding = 100;
        const boundsWidth = maxX - minX + padding * 2;
        const boundsHeight = maxY - minY + padding * 2;

        // Calculate zoom to fit
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scaleX = viewportWidth / boundsWidth;
        const scaleY = viewportHeight / boundsHeight;
        const newZoom = Math.min(scaleX, scaleY, 5.0); // Max 5x zoom

        // Calculate center position
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const newPanX = viewportWidth / 2 - centerX * newZoom;
        const newPanY = viewportHeight / 2 - centerY * newZoom;

        setZoom(newZoom);
        setPan(newPanX, newPanY);
        return;
      }

      // Handle ? key (Shift + /) to show shortcuts modal
      if (event.key === '?' && onShowShortcuts) {
        event.preventDefault();
        onShowShortcuts();
        return;
      }

      switch (key) {
        case 'v':
          setActiveTool('move');
          event.preventDefault();
          break;
        case 'r':
          setActiveTool('rectangle');
          event.preventDefault();
          break;
        case 'c':
          setActiveTool('circle');
          event.preventDefault();
          break;
        case 't':
          setActiveTool('text');
          event.preventDefault();
          break;
        case 'delete':
        case 'backspace':
          if (selectedId) {
            // Optimistic update
            removeObject(selectedId);
            clearSelection();
            event.preventDefault();

            // Sync to Realtime Database
            removeCanvasObject('main', selectedId)
              .then(() => {
                toast.success('Object deleted');
              })
              .catch((error) => {
                console.error('Failed to sync deletion to RTDB:', error);
                toast.error('Failed to delete object');
              });
          }
          break;
        case 'escape':
          clearSelection();
          event.preventDefault();
          break;
        default:
          break;
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveTool, clearSelection, selectedId, removeObject, objects, addObject, selectObject, resetView, setZoom, setPan, zoom, onShowShortcuts]);
}
