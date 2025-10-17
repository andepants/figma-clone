/**
 * Canvas Clipboard Actions
 *
 * Copy/paste operations for canvas objects.
 * Preserves parent-child relationships and creates new IDs.
 */

import type { StateCreator } from 'zustand';
import type { CanvasObject } from '@/types';
import type { CanvasStore } from './types';
import { getAllDescendantIds } from './utils';

/**
 * Create canvas clipboard actions slice
 *
 * @param {StateCreator} set - Zustand state setter
 * @param {Function} get - Zustand state getter
 * @returns Partial canvas store with clipboard actions
 */
export function createCanvasClipboard(
  set: Parameters<StateCreator<CanvasStore>>[0],
  get: Parameters<StateCreator<CanvasStore>>[1]
) {
  return {
    copyObjects: () => {
      const state = get();
      const { selectedIds, objects } = state;

      // Do nothing if no objects selected
      if (selectedIds.length === 0) return;

      // Get selected objects and all their descendants
      const allIdsToCheck = new Set<string>(selectedIds);
      selectedIds.forEach((id) => {
        const descendants = getAllDescendantIds(id, objects);
        descendants.forEach((descId) => allIdsToCheck.add(descId));
      });

      // Get all objects to copy (preserving parent-child relationships)
      const objectsToCopy = objects.filter((obj) => allIdsToCheck.has(obj.id));

      // Store in clipboard
      set({ clipboard: objectsToCopy });
    },

    pasteObjects: () => {
      const state = get();
      const { clipboard, addObject } = state;

      // Do nothing if clipboard is empty
      if (clipboard.length === 0) return;

      // Dynamic import to avoid circular dependency
      import('@/lib/firebase').then(async ({ addCanvasObject }) => {
        // Create ID mapping (old ID -> new ID)
        const idMap = new Map<string, string>();
        clipboard.forEach((obj) => {
          idMap.set(obj.id, crypto.randomUUID());
        });

        // Create new objects with updated IDs and positions
        const newObjects: CanvasObject[] = clipboard.map((obj) => {
          const newId = idMap.get(obj.id)!;
          const newParentId =
            obj.parentId && idMap.has(obj.parentId)
              ? idMap.get(obj.parentId)!
              : obj.parentId; // Keep external parent if exists

          return {
            ...obj,
            id: newId,
            x: obj.x + 20,
            y: obj.y + 20,
            parentId: newParentId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as CanvasObject;
        });

        // Add all objects to store (optimistic update)
        const newIds: string[] = [];
        newObjects.forEach((obj) => {
          addObject(obj);
          newIds.push(obj.id);
        });

        // Sync to Firebase
        const projectId = get().projectId;
        for (const obj of newObjects) {
          try {
            await addCanvasObject(projectId, obj);
          } catch {
            // Note: RTDB subscription will restore correct state if sync fails
          }
        }

        // Select the pasted objects
        state.selectObjects(newIds);
      });
    },
  };
}
