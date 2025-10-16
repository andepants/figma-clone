/**
 * Context Menu Utilities
 *
 * Helper functions for building context menu items for layer objects.
 * Items vary based on object type, state (locked, grouped, etc.), and selection.
 *
 * @module features/layers-panel/utils/contextMenu
 */

import type { CanvasObject } from '@/types/canvas.types';
import type { ContextMenuItem } from '@/components/common/ContextMenu';
import { useCanvasStore } from '@/stores/canvasStore';

/**
 * Build context menu items for a layer object
 *
 * Items vary based on:
 * - Object type (group vs shape)
 * - Lock state (locked objects show different actions)
 * - Visibility state (visible vs hidden)
 * - Selection count (single vs multi-select)
 *
 * Context menu follows Figma patterns:
 * 1. Bring to Front / Send to Back
 * 2. Separator
 * 3. Rename
 * 4. Separator
 * 5. Copy / Paste
 * 6. Separator
 * 7. Group Selection / Ungroup (context-dependent)
 * 8. Separator
 * 9. Show/Hide
 * 10. Lock/Unlock
 *
 * Keyboard shortcuts displayed on right side:
 * - Mac: ⌘ (Command), ⇧ (Shift), ⌃ (Control), ⌥ (Option)
 * - Windows: Ctrl, Shift, Alt
 *
 * @param object - Canvas object to build menu for
 * @param objects - All canvas objects (for context)
 * @param selectedIds - Currently selected object IDs
 * @returns Array of context menu items
 *
 * @example
 * ```tsx
 * const items = getContextMenuItems(rectangle, allObjects, ['rect-1']);
 * // Returns: [
 * //   { label: 'Bring to Front', shortcut: ']', onClick: ... },
 * //   { label: 'Send to Back', shortcut: '[', onClick: ... },
 * //   { type: 'separator' },
 * //   ...
 * // ]
 * ```
 */
export function getContextMenuItems(
  object: CanvasObject,
  objects: CanvasObject[],
  selectedIds: string[]
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  // Determine object and selection state
  const isGroup = object.type === 'group';
  const isLocked = object.locked === true;
  const isVisible = object.visible !== false;
  const hasSelection = selectedIds.length >= 1;

  // Detect OS for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const cmdKey = isMac ? '⌘' : 'Ctrl';
  const shiftKey = isMac ? '⇧' : 'Shift';

  // Bring to Front / Send to Back
  items.push(
    {
      label: 'Bring to Front',
      shortcut: ']',
      onClick: () => {
        useCanvasStore.getState().bringToFront(object.id);
      },
    },
    {
      label: 'Send to Back',
      shortcut: '[',
      onClick: () => {
        useCanvasStore.getState().sendToBack(object.id);
      },
    },
    { type: 'separator' },
  );

  // Rename (single selection only)
  if (selectedIds.length === 1) {
    items.push(
      {
        label: 'Rename',
        shortcut: `${cmdKey}R`,
        onClick: () => {
          // Trigger rename via custom event (same as Cmd+R shortcut)
          window.dispatchEvent(new CustomEvent('trigger-rename', { detail: { id: object.id } }));
        },
      },
      { type: 'separator' },
    );
  }

  // Copy / Paste
  items.push(
    {
      label: 'Copy',
      shortcut: `${cmdKey}C`,
      onClick: () => {
        useCanvasStore.getState().copyObjects();
      },
    },
    {
      label: 'Paste',
      shortcut: `${cmdKey}V`,
      onClick: () => {
        useCanvasStore.getState().pasteObjects();
      },
    },
    { type: 'separator' },
  );

  // Group / Ungroup
  if (isGroup) {
    items.push({
      label: 'Ungroup',
      shortcut: `${shiftKey}${cmdKey}G`,
      onClick: () => {
        useCanvasStore.getState().ungroupObjects();
      },
    });
  } else if (hasSelection) {
    items.push({
      label: 'Group Selection',
      shortcut: `${cmdKey}G`,
      onClick: () => {
        useCanvasStore.getState().groupObjects();
      },
    });
  }
  items.push({ type: 'separator' });

  // Show/Hide
  items.push({
    label: isVisible ? 'Hide' : 'Show',
    shortcut: `${shiftKey}${cmdKey}H`,
    onClick: () => {
      useCanvasStore.getState().toggleVisibility(object.id);
    },
  });

  // Lock/Unlock
  items.push({
    label: isLocked ? 'Unlock' : 'Lock',
    shortcut: `${shiftKey}${cmdKey}L`,
    onClick: () => {
      useCanvasStore.getState().toggleLock(object.id);
    },
  });

  return items;
}
