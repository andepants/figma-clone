/**
 * Canvas Store
 *
 * Main canvas store combining all slices:
 * - Core state and types
 * - CRUD actions (add/update/remove objects)
 * - Zoom/pan/view management
 * - Hierarchy operations (parent-child relationships)
 * - Lock/unlock operations
 * - Clipboard (copy/paste)
 * - Z-index (layer ordering)
 * - Grouping (group/ungroup)
 *
 * Split into modular slices for maintainability (500 line max per file).
 */

import { create } from 'zustand';
import type { CanvasObject } from '@/types';
import type { CanvasStore } from './types';
import { areObjectArraysEqual } from './utils';
import { createCanvasActions } from './canvasActions';
import { createCanvasZoomPan } from './canvasZoomPan';
import { createCanvasHierarchy } from './canvasHierarchy';
import { createCanvasLock } from './canvasLock';
import { createCanvasClipboard } from './canvasClipboard';
import { createCanvasZIndex } from './canvasZIndex';
import { createCanvasGrouping } from './canvasGrouping';
import { migrateCanvasObjects } from '@/lib/utils/imageMigration';

/**
 * Canvas store hook
 * Provides access to canvas state and actions
 * @returns {CanvasStore} Canvas store instance
 */
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  objects: [],
  selectedIds: [],
  editingTextId: null,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  clipboard: [],
  projectId: 'main', // Default to 'main' for legacy support

  // setObjects is critical - needs to be in main store for performance optimization
  setObjects: (objects: CanvasObject[]) =>
    set((state) => {
      // MIGRATION: Apply image migrations for legacy objects
      // This ensures all images have the new crop properties (imageLocked, imageWidth, etc.)
      // Migration is idempotent - safe to run on already-migrated objects
      const migratedObjects = migrateCanvasObjects(objects);

      // PERFORMANCE FIX: Skip update if arrays are shallowly equal
      // This prevents unnecessary re-renders when Firebase subscription
      // creates a new array reference with identical object values
      if (areObjectArraysEqual(state.objects, migratedObjects)) {
        return state; // No update → no re-render!
      }

      // SYNC FIX: Clean up stale selection IDs
      // When objects are deleted remotely (via Firebase), we need to remove
      // their IDs from selectedIds to prevent the UI from trying to access
      // deleted objects. This prevents "Cannot read properties of null" errors.
      const objectIds = new Set(migratedObjects.map((obj) => obj.id));
      const cleanedSelectedIds = state.selectedIds.filter((id) => objectIds.has(id));

      // Only update selectedIds if it actually changed (avoid unnecessary re-renders)
      const selectedIdsChanged = cleanedSelectedIds.length !== state.selectedIds.length;

      return {
        objects: migratedObjects,
        ...(selectedIdsChanged && { selectedIds: cleanedSelectedIds }),
      };
    }),

  // Project ID management
  setProjectId: (id: string) =>
    set(() => ({
      projectId: id && id.trim() !== '' ? id : 'main', // Validate and fallback to 'main'
    })),

  getProjectId: () => get().projectId,

  // Combine all action slices
  ...createCanvasActions(set, get),
  ...createCanvasZoomPan(set),
  ...createCanvasHierarchy(set, get),
  ...createCanvasLock(set, get),
  ...createCanvasClipboard(set, get),
  ...createCanvasZIndex(set, get),
  ...createCanvasGrouping(set, get),
}));
