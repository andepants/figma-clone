/**
 * Canvas Hierarchy Actions
 *
 * Parent-child relationships: setParent, toggleCollapse, selectWithDescendants.
 */

import type { StateCreator } from 'zustand';
import type { CanvasStore } from './types';
import { getAllDescendantIds, hasOnlyEmptyGroups } from './utils';

/**
 * Create canvas hierarchy actions slice
 *
 * @param {Function} _set - Zustand state setter (unused)
 * @param {Function} get - Zustand state getter
 * @returns Partial canvas store with hierarchy actions
 */
export function createCanvasHierarchy(
  _set: Parameters<StateCreator<CanvasStore>>[0],
  get: Parameters<StateCreator<CanvasStore>>[1]
) {
  return {
    toggleCollapse: (id: string) => {
      const state = get();
      const object = state.objects.find((obj) => obj.id === id);
      if (object) {
        const newCollapsed = !object.isCollapsed;

        // Optimistic local update (immediate)
        state.updateObject(id, { isCollapsed: newCollapsed });

        // Sync to Firebase RTDB (async)
        import('@/lib/firebase').then(async ({ updateCanvasObject }) => {
          try {
            const projectId = get().projectId;
            await updateCanvasObject(projectId, id, { isCollapsed: newCollapsed });
          } catch (error) {
            console.error('Failed to sync collapse state to Firebase:', error);
          }
        });
      }
    },

    setParent: (objectId: string, newParentId: string | null) => {
      const state = get();
      const objects = state.objects;
      const object = objects.find((obj) => obj.id === objectId);
      if (!object) return;

      // Store old parent ID before update
      const oldParentId = object.parentId;

      // Validate new parent is a group (or null for root level)
      if (newParentId) {
        const newParent = objects.find((obj) => obj.id === newParentId);

        // Parent must exist and be a group type
        if (!newParent || newParent.type !== 'group') {
          console.warn('[setParent] Parent must be a group type. Ignoring setParent call.', {
            objectId,
            newParentId,
            parentType: newParent?.type,
          });
          return;
        }

        // Prevent circular references
        const descendants = getAllDescendantIds(objectId, objects);
        if (descendants.includes(newParentId)) {
          // Prevent circular reference - silently return
          return;
        }
      }

      // Optimistic local update (immediate)
      state.updateObject(objectId, { parentId: newParentId });

      // Sync to Firebase RTDB (async)
      import('@/lib/firebase').then(async ({ updateCanvasObject }) => {
        try {
          const projectId = get().projectId;
          await updateCanvasObject(projectId, objectId, { parentId: newParentId ?? null });
        } catch (error) {
          console.error('Failed to sync parentId to Firebase:', error);
        }
      });

      // Check if old parent should be deleted (empty or only contains empty groups)
      if (oldParentId) {
        const oldParent = objects.find((obj) => obj.id === oldParentId);
        if (oldParent && oldParent.type === 'group') {
          // Get current state after parent update
          const currentObjects = get().objects;

          // Check if old parent has any remaining children (excluding the object we just moved)
          const remainingSiblings = currentObjects.filter(
            (obj) => obj.parentId === oldParentId && obj.id !== objectId
          );

          if (remainingSiblings.length === 0) {
            // Old parent is now completely empty - delete it
            state.removeObject(oldParentId);
          } else if (hasOnlyEmptyGroups(oldParentId, currentObjects)) {
            // Old parent only contains empty groups (no actual objects) - delete it
            state.removeObject(oldParentId);
          }
        }
      }
    },

    selectWithDescendants: (id: string) => {
      const state = get();
      const objects = state.objects;

      const descendants = getAllDescendantIds(id, objects);
      state.selectObjects([id, ...descendants]);
    },

    toggleVisibility: (id: string) => {
      const state = get();
      const object = state.objects.find((obj) => obj.id === id);
      if (object) {
        const newVisible = !(object.visible ?? true); // Default true

        // Optimistic local update (immediate)
        state.updateObject(id, { visible: newVisible });

        // Sync to Firebase RTDB (async)
        import('@/lib/firebase').then(async ({ updateCanvasObject }) => {
          try {
            const projectId = get().projectId;
            await updateCanvasObject(projectId, id, { visible: newVisible });
          } catch (error) {
            console.error('Failed to sync visibility to Firebase:', error);
          }
        });
      }
    },
  };
}
