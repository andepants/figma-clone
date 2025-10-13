/**
 * Tool Shortcuts Hook
 *
 * Manages keyboard shortcuts for tool selection.
 * Listens for key presses and updates the active tool accordingly.
 */

import { useEffect } from 'react';
import { useToolStore } from '@/stores';
import { useCanvasStore } from '@/stores';

/**
 * Hook to handle keyboard shortcuts for tools
 *
 * Keyboard shortcuts:
 * - V: Select tool
 * - R: Rectangle tool
 * - Escape: Clear selection
 *
 * Shortcuts are disabled when user is typing in an input/textarea.
 *
 * @example
 * ```tsx
 * function CanvasPage() {
 *   useToolShortcuts();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useToolShortcuts() {
  const { setActiveTool } = useToolStore();
  const { clearSelection } = useCanvasStore();

  useEffect(() => {
    /**
     * Handle keydown events for tool shortcuts
     */
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'v':
          setActiveTool('select');
          event.preventDefault();
          break;
        case 'r':
          setActiveTool('rectangle');
          event.preventDefault();
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
  }, [setActiveTool, clearSelection]);
}
