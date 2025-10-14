/**
 * Tool Shortcuts Hook
 *
 * Manages keyboard shortcuts for tool selection.
 * Listens for key presses and updates the active tool accordingly.
 */

import { useEffect } from 'react';
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
 * - Cmd/Ctrl+D: Duplicate selected objects (supports multi-select)
 * - Cmd/Ctrl+0: Reset zoom to 100%
 * - Cmd/Ctrl+1: Fit all objects in view
 * - Cmd/Ctrl+2: Zoom to selection (supports multi-select)
 * - Delete/Backspace: Delete selected objects (supports multi-select)
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
  const { clearSelection, selectedIds, removeObject, objects, addObject, selectObjects, resetView, setZoom, setPan, zoom, zoomIn, zoomOut, zoomTo } = useCanvasStore();

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

      // Handle Cmd/Ctrl+D for duplicate (supports multi-select)
      if ((event.metaKey || event.ctrlKey) && key === 'd') {
        event.preventDefault(); // Prevent browser "Add Bookmark" dialog

        if (selectedIds.length > 0) {
          const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
          const newIds: string[] = [];

          // Create duplicates for all selected objects
          for (const selectedObject of selectedObjects) {
            const duplicate = duplicateObject(selectedObject);

            // Optimistic update
            addObject(duplicate);
            newIds.push(duplicate.id);

            // Sync to Realtime Database
            addCanvasObject('main', duplicate)
              .catch(() => {
                // Silently fail - RTDB subscription will restore correct state
              });
          }

          // Select the duplicates
          selectObjects(newIds);
        }
        return;
      }

      // Handle Cmd/Ctrl+Plus for zoom in
      if ((event.metaKey || event.ctrlKey) && (key === '+' || key === '=')) {
        event.preventDefault(); // Prevent browser zoom
        zoomIn();
        return;
      }

      // Handle Cmd/Ctrl+Minus for zoom out
      if ((event.metaKey || event.ctrlKey) && key === '-') {
        event.preventDefault(); // Prevent browser zoom
        zoomOut();
        return;
      }

      // Handle Cmd/Ctrl+0 for reset zoom (100%)
      if ((event.metaKey || event.ctrlKey) && key === '0') {
        event.preventDefault(); // Prevent browser zoom
        zoomTo(100);
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

      // Handle Cmd/Ctrl+2 for zoom to selection (supports multi-select)
      if ((event.metaKey || event.ctrlKey) && key === '2') {
        event.preventDefault();

        if (selectedIds.length === 0) {
          return;
        }

        const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
        if (selectedObjects.length === 0) return;

        // Calculate bounding box of all selected objects
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        selectedObjects.forEach((selectedObject) => {
          if (selectedObject.type === 'rectangle') {
            minX = Math.min(minX, selectedObject.x);
            minY = Math.min(minY, selectedObject.y);
            maxX = Math.max(maxX, selectedObject.x + selectedObject.width);
            maxY = Math.max(maxY, selectedObject.y + selectedObject.height);
          } else if (selectedObject.type === 'circle') {
            minX = Math.min(minX, selectedObject.x - selectedObject.radius);
            minY = Math.min(minY, selectedObject.y - selectedObject.radius);
            maxX = Math.max(maxX, selectedObject.x + selectedObject.radius);
            maxY = Math.max(maxY, selectedObject.y + selectedObject.radius);
          } else if (selectedObject.type === 'text') {
            const textWidth = selectedObject.width || 200;
            const textHeight = selectedObject.fontSize * 1.2 || 30;
            minX = Math.min(minX, selectedObject.x);
            minY = Math.min(minY, selectedObject.y);
            maxX = Math.max(maxX, selectedObject.x + textWidth);
            maxY = Math.max(maxY, selectedObject.y + textHeight);
          }
        });

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
          if (selectedIds.length > 0) {
            // Optimistic update - remove all selected objects
            selectedIds.forEach(id => removeObject(id));
            clearSelection();
            event.preventDefault();

            // Sync to Realtime Database
            for (const id of selectedIds) {
              removeCanvasObject('main', id)
                .catch(() => {
                  // Silently fail - RTDB subscription will restore correct state
                });
            }
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
  }, [setActiveTool, clearSelection, selectedIds, removeObject, objects, addObject, selectObjects, resetView, setZoom, setPan, zoom, zoomIn, zoomOut, zoomTo, onShowShortcuts]);
}
