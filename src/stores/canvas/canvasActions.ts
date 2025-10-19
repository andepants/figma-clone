/**
 * Canvas Actions
 *
 * Core CRUD operations for canvas objects.
 * Handles adding, updating, removing, and batch operations.
 */

import type { StateCreator } from 'zustand';
import type { CanvasObject } from '@/types';
import type { CanvasStore } from './types';
import { hasOnlyEmptyGroups } from './utils';
import { addCanvasObject } from '@/lib/firebase';

/**
 * Create canvas actions slice
 *
 * @param {StateCreator} set - Zustand state setter
 * @param {Function} get - Zustand state getter
 * @returns Partial canvas store with CRUD actions
 */
export function createCanvasActions(
  set: Parameters<StateCreator<CanvasStore>>[0],
  get: Parameters<StateCreator<CanvasStore>>[1]
) {
  return {
    addObject: (object: CanvasObject) => {
      set((state) => ({
        objects: [...state.objects, object],
      }));
    },

    updateObject: (id: string, updates: Partial<CanvasObject>) =>
      set((state) => {
        const index = state.objects.findIndex((obj) => obj.id === id);
        if (index === -1) return state;

        const updatedObjects = [...state.objects];
        updatedObjects[index] = {
          ...updatedObjects[index],
          ...updates,
          updatedAt: Date.now(),
        } as CanvasObject;

        return { objects: updatedObjects };
      }),

    batchUpdateObjects: (updates: Array<{ id: string; updates: Partial<CanvasObject> }>) =>
      set((state) => {
        // Clone objects array once
        const updatedObjects = [...state.objects];
        const timestamp = Date.now();

        // Apply all updates in a single pass
        updates.forEach(({ id, updates: objUpdates }) => {
          const index = updatedObjects.findIndex((obj) => obj.id === id);
          if (index !== -1) {
            updatedObjects[index] = {
              ...updatedObjects[index],
              ...objUpdates,
              updatedAt: timestamp,
            } as CanvasObject;
          }
        });

        // Single state update for all objects!
        return { objects: updatedObjects };
      }),

    removeObject: (id: string) =>
      set((state) => {
        const objectToRemove = state.objects.find((obj) => obj.id === id);
        if (!objectToRemove) return state;

        // Clean up image from Firebase Storage if needed
        if (
          objectToRemove.type === 'image' &&
          objectToRemove.storageType === 'storage' &&
          objectToRemove.storagePath
        ) {
          // Dynamic import to avoid circular dependency
          import('@/lib/firebase').then(async ({ deleteImageFromStorage }) => {
            try {
              await deleteImageFromStorage(objectToRemove.storagePath!);
            } catch (error) {
              console.error('Failed to delete image from storage:', error);
              // Don't throw - image already removed from canvas, storage cleanup is best-effort
            }
          });
        }

        // Remove the object
        let updatedObjects = state.objects.filter((obj) => obj.id !== id);

        // Collect all objects to delete (initial object + empty ancestors)
        const objectsToDelete: string[] = [id];

        // Recursively collect empty ancestor groups (or groups with only empty groups)
        const collectEmptyAncestors = (parentId: string | null | undefined) => {
          if (!parentId) return;

          const parent = updatedObjects.find((obj) => obj.id === parentId);
          if (!parent || parent.type !== 'group') return;

          // Check if parent has any remaining children
          const siblings = updatedObjects.filter((obj) => obj.parentId === parentId);

          if (siblings.length === 0 || hasOnlyEmptyGroups(parentId, updatedObjects)) {
            // Parent is empty or only contains empty groups - mark for removal
            objectsToDelete.push(parentId);
            updatedObjects = updatedObjects.filter((obj) => obj.id !== parentId);

            // Recursively check parent's parent
            collectEmptyAncestors(parent.parentId);
          }
        };

        // Start recursive cleanup from removed object's parent
        collectEmptyAncestors(objectToRemove.parentId);

        // Atomically delete all objects in a single Firebase transaction
        import('@/features/layers-panel/utils/transactions').then(async ({ batchDeleteObjects }) => {
          try {
            const projectId = get().projectId;
            await batchDeleteObjects(projectId, objectsToDelete);
          } catch (error) {
            console.error('Failed to sync cascade deletion to Firebase:', error);
            // Don't throw - local state already updated, Firebase sync is best-effort
          }
        });

        return {
          objects: updatedObjects,
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
        };
      }),

    selectObjects: (ids: string[]) =>
      set(() => ({
        selectedIds: ids,
      })),

    toggleSelection: (id: string) =>
      set((state) => {
        const isSelected = state.selectedIds.includes(id);
        if (isSelected) {
          return { selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) };
        } else {
          return { selectedIds: [...state.selectedIds, id] };
        }
      }),

    addToSelection: (id: string) =>
      set((state) => {
        if (state.selectedIds.includes(id)) {
          return state;
        }
        return { selectedIds: [...state.selectedIds, id] };
      }),

    removeFromSelection: (id: string) =>
      set((state) => ({
        selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
      })),

    clearSelection: () =>
      set(() => ({
        selectedIds: [],
      })),

    setEditingText: (id: string | null) => {
      set(() => ({
        editingTextId: id,
      }));
    },

    clearObjects: () =>
      set(() => ({
        objects: [],
        selectedIds: [],
      })),

    /**
     * Create processed image from background removal
     *
     * Creates a new ImageObject next to the original with processed image.
     * Preserves all visual properties from original (rotation, opacity, etc.).
     * Offsets position slightly to avoid overlap.
     * Syncs to Firebase for persistence and real-time collaboration.
     *
     * @param originalImage - Original image object
     * @param processedData - Processed image data from background removal
     * @param userId - Current user ID (for createdBy field, required by database rules)
     */
    createProcessedImage: async (
      originalImage: CanvasObject,
      processedData: {
        url: string;
        storagePath: string;
        naturalWidth?: number;
        naturalHeight?: number;
        fileSize: number;
      },
      userId: string
    ) => {
      if (originalImage.type !== 'image') {
        return;
      }

      const now = Date.now();

      // Extract base filename without extension
      const originalFileName = originalImage.fileName || 'image.png';
      const fileNameParts = originalFileName.split('.');
      const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'png';
      const baseName = fileNameParts.join('.');

      // Create new image object with same properties as original
      const newImage: CanvasObject = {
        ...originalImage,
        id: crypto.randomUUID(),
        name: `${originalImage.name || 'Image'} (no bg)`,
        fileName: `${baseName} (no bg).${extension}`,
        src: processedData.url,
        storagePath: processedData.storagePath,
        storageType: 'storage' as const,
        fileSize: processedData.fileSize,
        // Update dimensions if provided, otherwise keep original
        ...(processedData.naturalWidth
          ? { naturalWidth: processedData.naturalWidth }
          : {}),
        ...(processedData.naturalHeight
          ? { naturalHeight: processedData.naturalHeight }
          : {}),
        // Offset position to avoid overlap
        x: originalImage.x + 20,
        y: originalImage.y + 20,
        // IMPORTANT: Explicitly set createdBy (required by database rules)
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      // Add object locally (optimistic update)
      get().addObject(newImage);
      get().selectObjects([newImage.id]);

      // Sync to Firebase for persistence
      try {
        await addCanvasObject(get().projectId, newImage);
      } catch (error) {
        console.error('[createProcessedImage] Failed to sync image to Firebase:', error);
        // Rollback optimistic update on error
        get().removeObject(newImage.id);
        throw error; // Re-throw so caller can handle
      }
    },
  };
}
