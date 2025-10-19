/**
 * Canvas Clipboard Actions
 *
 * Copy/paste operations for canvas objects.
 * Preserves parent-child relationships and creates new IDs.
 * Smart paste positioning at mouse cursor or viewport center.
 */

import type { StateCreator } from 'zustand';
import type { CanvasObject } from '@/types';
import type { CanvasStore } from './types';
import { getAllDescendantIds } from './utils';
import { getViewportCenter } from '@/features/canvas-core/utils/coordinates';

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

    pasteObjects: (userId: string) => {
      const state = get();
      const { clipboard, objects, selectedIds, stageRef, lastCanvasMousePosition } = state;

      // Do nothing if clipboard is empty
      if (clipboard.length === 0) return;

      // Dynamic import to avoid circular dependency
      import('@/lib/firebase').then(async ({ addCanvasObject }) => {
        // ============================================================
        // STEP 1: Calculate paste position (mouse cursor or viewport center)
        // ============================================================

        let pastePosition: { x: number; y: number };

        if (lastCanvasMousePosition) {
          // Mouse is on canvas - paste at cursor
          pastePosition = lastCanvasMousePosition;
        } else {
          // Mouse is off canvas - paste at viewport center
          pastePosition = getViewportCenter(stageRef);
        }

        // ============================================================
        // STEP 2: Calculate centroid of clipboard objects
        // ============================================================

        // Calculate centroid (center point) of all clipboard objects
        let sumX = 0;
        let sumY = 0;
        clipboard.forEach((obj) => {
          sumX += obj.x;
          sumY += obj.y;
        });
        const centroidX = sumX / clipboard.length;
        const centroidY = sumY / clipboard.length;

        // Calculate offset to move centroid to paste position
        const offsetX = pastePosition.x - centroidX;
        const offsetY = pastePosition.y - centroidY;

        // ============================================================
        // STEP 3: Determine target parent
        // ============================================================

        let targetParentId: string | null = null;

        if (selectedIds.length === 1) {
          // Single object selected
          const selectedObj = objects.find((obj) => obj.id === selectedIds[0]);
          if (selectedObj) {
            if (selectedObj.type === 'group') {
              // Paste into selected group
              targetParentId = selectedObj.id;
            } else {
              // Paste into same parent as selected object
              targetParentId = selectedObj.parentId ?? null;
            }
          }
        } else if (selectedIds.length > 1) {
          // Multiple objects selected - check if they share same parent
          const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
          const parentIds = selectedObjects.map((obj) => obj.parentId ?? null);
          const allSameParent = parentIds.every((pid) => pid === parentIds[0]);

          if (allSameParent) {
            // All selected objects share same parent - paste into that parent
            targetParentId = parentIds[0];
          }
          // Otherwise targetParentId stays null (paste at root level)
        }
        // If no selection, targetParentId stays null (paste at root level)

        // ============================================================
        // STEP 4: Create ID mapping and identify top-level objects
        // ============================================================

        // Create ID mapping (old ID -> new ID)
        const idMap = new Map<string, string>();
        clipboard.forEach((obj) => {
          idMap.set(obj.id, crypto.randomUUID());
        });

        // Identify top-level objects (those without parent in clipboard)
        const clipboardIds = new Set(clipboard.map((obj) => obj.id));
        const topLevelObjects = clipboard.filter(
          (obj) => !obj.parentId || !clipboardIds.has(obj.parentId)
        );

        // ============================================================
        // STEP 5: Create new objects with positioning and hierarchy
        // ============================================================

        const newObjects: CanvasObject[] = clipboard.map((obj) => {
          const newId = idMap.get(obj.id)!;

          // Remap parentId if it's within clipboard (preserve internal hierarchy)
          // Otherwise keep external parent or use targetParentId
          let newParentId: string | null = null;

          if (obj.parentId && idMap.has(obj.parentId)) {
            // Parent is in clipboard - remap to new ID (preserve internal hierarchy)
            newParentId = idMap.get(obj.parentId)!;
          } else if (topLevelObjects.includes(obj)) {
            // Top-level object - set to target parent
            newParentId = targetParentId;
          } else {
            // This shouldn't happen but keep null as fallback
            newParentId = null;
          }

          // Apply position offset to all objects
          const newX = obj.x + offsetX;
          const newY = obj.y + offsetY;

          // CRITICAL: Firebase RTDB doesn't allow undefined values
          return {
            ...obj,
            id: newId,
            type: obj.type, // CRITICAL: Explicitly preserve type for Firebase validation
            x: newX,
            y: newY,
            parentId: newParentId,
            createdBy: userId, // IMPORTANT: Set creator to current user
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as CanvasObject;
        });

        // ============================================================
        // STEP 6: Insert at top of layers (highest z-index)
        // ============================================================

        // Get current objects and append pasted objects at end (top of stack)
        const currentObjects = get().objects;
        const updatedObjects = [...currentObjects, ...newObjects];

        // Update store with new objects array
        state.setObjects(updatedObjects);

        // ============================================================
        // STEP 7: Sync to Firebase
        // ============================================================

        const projectId = get().projectId;
        const newIds: string[] = [];

        for (const obj of newObjects) {
          try {
            await addCanvasObject(projectId, obj);
            newIds.push(obj.id);
          } catch {
            // Note: RTDB subscription will restore correct state if sync fails
          }
        }

        // ============================================================
        // STEP 8: Select the pasted objects
        // ============================================================

        state.selectObjects(newIds);
      });
    },
  };
}
