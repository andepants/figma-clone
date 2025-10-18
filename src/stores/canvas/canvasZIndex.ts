/**
 * Canvas Z-Index Actions
 *
 * Layer ordering: bring to front, send to back.
 * Syncs z-index to Firebase RTDB.
 */

import type { StateCreator } from 'zustand';
import type { CanvasStore } from './types';

/**
 * Create canvas z-index actions slice
 *
 * @param {StateCreator} set - Zustand state setter
 * @param {Function} get - Zustand state getter
 * @returns Partial canvas store with z-index actions
 */
export function createCanvasZIndex(
  set: Parameters<StateCreator<CanvasStore>>[0],
  get: Parameters<StateCreator<CanvasStore>>[1]
) {
  return {
    bringToFront: (id: string) =>
      set((state) => {
        const index = state.objects.findIndex((obj) => obj.id === id);
        if (index === -1 || index === state.objects.length - 1) {
          // Not found or already at front
          return state;
        }

        const updatedObjects = [...state.objects];
        const [object] = updatedObjects.splice(index, 1); // Remove from current position
        updatedObjects.push(object); // Add to end (front)

        // Sync z-index to Firebase
        import('@/lib/firebase').then(async ({ syncZIndexes }) => {
          try {
            const projectId = get().projectId;
            await syncZIndexes(projectId, updatedObjects);
          } catch (error) {
            console.error('Failed to sync z-index to Firebase:', error);
          }
        });

        return { objects: updatedObjects };
      }),

    sendToBack: (id: string) =>
      set((state) => {
        const index = state.objects.findIndex((obj) => obj.id === id);
        if (index === -1 || index === 0) {
          // Not found or already at back
          return state;
        }

        const updatedObjects = [...state.objects];
        const [object] = updatedObjects.splice(index, 1); // Remove from current position
        updatedObjects.unshift(object); // Add to start (back)

        // Sync z-index to Firebase
        import('@/lib/firebase').then(async ({ syncZIndexes }) => {
          try {
            const projectId = get().projectId;
            await syncZIndexes(projectId, updatedObjects);
          } catch (error) {
            console.error('Failed to sync z-index to Firebase:', error);
          }
        });

        return { objects: updatedObjects };
      }),
  };
}
