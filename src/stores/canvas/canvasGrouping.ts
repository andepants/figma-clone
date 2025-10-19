/**
 * Canvas Grouping Actions
 *
 * Group/ungroup operations for canvas objects.
 * Creates group containers and manages parent-child relationships.
 */

import type { StateCreator } from 'zustand';
import type { CanvasObject } from '@/types';
import type { CanvasStore } from './types';

/**
 * Create canvas grouping actions slice
 *
 * @param {StateCreator} set - Zustand state setter
 * @param {Function} get - Zustand state getter
 * @returns Partial canvas store with grouping actions
 */
export function createCanvasGrouping(
  set: Parameters<StateCreator<CanvasStore>>[0],
  get: Parameters<StateCreator<CanvasStore>>[1]
) {
  return {
    groupObjects: (userId: string) => {
      const state = get();
      const { selectedIds, objects } = state;

      // Need at least 2 objects to group (can't group a single object)
      if (selectedIds.length < 2) {
        console.warn('[GroupObjects] Cannot group: Need at least 2 objects selected');
        return;
      }

      // Dynamic imports to avoid circular dependencies
      import('@/lib/utils/geometry').then(async ({ calculateBoundingBox }) => {
        import('@/features/layers-panel/utils/layerNaming').then(async ({ generateLayerName }) => {
          import('@/lib/firebase').then(async ({ addCanvasObject }) => {
            // Calculate bounding box of selected objects
            // Pass all objects so groups can recursively include their children
            const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));

            const bbox = calculateBoundingBox(selectedObjects, objects);

            // Check if all selected objects share the same parent
            // If yes, create nested group inside that parent
            const parentIds = selectedObjects.map((obj) => obj.parentId ?? null);
            const allSameParent = parentIds.every((pid) => pid === parentIds[0]);
            const sharedParentId = allSameParent ? parentIds[0] : null;

            // Create group object
            const groupId = crypto.randomUUID();
            const groupName = generateLayerName('group', objects);

            // Find the minimum z-index (earliest position) of selected objects
            // Group should appear BEFORE (lower z-index) than its children in Figma
            const selectedIndices = selectedIds.map((id) =>
              objects.findIndex((obj) => obj.id === id)
            );
            const minIndex = Math.min(...selectedIndices);

            const group: CanvasObject = {
              id: groupId,
              type: 'group',
              x: bbox.x + bbox.width / 2, // Center of bounding box
              y: bbox.y + bbox.height / 2,
              rotation: 0,
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              skewX: 0,
              skewY: 0,
              // Omit stroke/strokeWidth for groups (Firebase doesn't allow undefined)
              strokeEnabled: false,
              shadowColor: 'black',
              shadowBlur: 0,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowOpacity: 1,
              shadowEnabled: false,
              createdBy: userId, // IMPORTANT: Set creator to current user (required by database rules)
              createdAt: Date.now(),
              updatedAt: Date.now(),
              name: groupName,
              isCollapsed: false, // Start expanded
              // If all selected objects share same parent, inherit that parent
              // This creates nested groups (group inside a group)
              parentId: sharedParentId,
            };

            // Update selected objects to be children of new group
            const updatedObjects = objects.map((obj) => {
              if (selectedIds.includes(obj.id)) {
                return { ...obj, parentId: groupId, updatedAt: Date.now() };
              }
              return obj;
            });

            // Insert group at the BEGINNING of children's z-index range (appears below in layers panel)
            // This matches Figma behavior: children appear above parent in layers panel
            updatedObjects.splice(minIndex, 0, group);

            // Update state and select group
            set({ objects: updatedObjects });
            state.selectObjects([groupId]);

            // Sync to Firebase - add group first, then update children
            try {
              const projectId = get().projectId;

              await addCanvasObject(projectId, group);

              // Update children with new parentId
              const { batchUpdateCanvasObjects } = await import('@/lib/firebase');
              const childUpdates: Record<string, Partial<CanvasObject>> = {};
              selectedIds.forEach((id) => {
                childUpdates[id] = { parentId: groupId, updatedAt: Date.now() };
              });

              await batchUpdateCanvasObjects(projectId, childUpdates);
            } catch (error) {
              console.error('[GroupObjects] Failed to sync group to Firebase:', error);
            }
          });
        });
      });
    },

    ungroupObjects: () => {
      const state = get();
      const { selectedIds, objects } = state;

      // Filter selected groups
      const selectedGroups = objects.filter(
        (obj) => selectedIds.includes(obj.id) && obj.type === 'group'
      );

      if (selectedGroups.length === 0) return;

      // Get all children of selected groups
      const childIds: string[] = [];
      selectedGroups.forEach((group) => {
        const children = objects.filter((obj) => obj.parentId === group.id);
        children.forEach((child) => childIds.push(child.id));
      });

      // Remove parentId from children
      const updatedObjects = objects
        .map((obj) => {
          if (childIds.includes(obj.id)) {
            return { ...obj, parentId: undefined, updatedAt: Date.now() };
          }
          return obj;
        })
        // Remove group objects
        .filter((obj) => !selectedGroups.some((g) => g.id === obj.id));

      // Update state and select ungrouped children
      set({ objects: updatedObjects });
      state.selectObjects(childIds);

      // Sync to Firebase
      import('@/lib/firebase').then(async ({ batchUpdateCanvasObjects, removeCanvasObject }) => {
        try {
          const projectId = get().projectId;
          // Remove parentId from children
          if (childIds.length > 0) {
            const childUpdates: Record<string, Partial<CanvasObject>> = {};
            childIds.forEach((id) => {
              childUpdates[id] = { parentId: undefined, updatedAt: Date.now() };
            });
            await batchUpdateCanvasObjects(projectId, childUpdates);
          }

          // Delete group objects
          for (const group of selectedGroups) {
            await removeCanvasObject(projectId, group.id);
          }
        } catch (error) {
          console.error('Failed to sync ungroup to Firebase:', error);
        }
      });
    },
  };
}
