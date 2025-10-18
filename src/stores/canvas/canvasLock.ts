/**
 * Canvas Lock Actions
 *
 * Lock/unlock operations for canvas objects.
 * Cascades lock state to all descendants.
 */

import type { StateCreator } from 'zustand';
import type { CanvasObject } from '@/types';
import type { CanvasStore } from './types';
import { getAllDescendantIds } from './utils';

/**
 * Create canvas lock actions slice
 *
 * @param {StateCreator} set - Zustand state setter
 * @param {Function} get - Zustand state getter
 * @returns Partial canvas store with lock actions
 */
export function createCanvasLock(
  set: Parameters<StateCreator<CanvasStore>>[0],
  get: Parameters<StateCreator<CanvasStore>>[1]
) {
  return {
    toggleLock: (id: string) => {
      const state = get();
      const objects = state.objects;
      const object = objects.find((obj) => obj.id === id);
      if (!object) return;

      const newLocked = !(object.locked ?? false);

      // Get all descendants
      const descendants = getAllDescendantIds(id, objects);

      // Update object and all descendants (optimistic local update)
      const updatedObjects = objects.map((obj) => {
        if (obj.id === id || descendants.includes(obj.id)) {
          return { ...obj, locked: newLocked, updatedAt: Date.now() };
        }
        return obj;
      });

      set({ objects: updatedObjects });

      // Sync to Firebase RTDB (async) - batch update for all affected objects
      import('@/lib/firebase').then(async ({ batchUpdateCanvasObjects }) => {
        try {
          const projectId = get().projectId;
          const updates: Record<string, Partial<CanvasObject>> = {};

          // Add parent object
          updates[id] = { locked: newLocked };

          // Add all descendants
          descendants.forEach((descId) => {
            updates[descId] = { locked: newLocked };
          });

          await batchUpdateCanvasObjects(projectId, updates);
        } catch (error) {
          console.error('Failed to sync lock state to Firebase:', error);
        }
      });
    },
  };
}
