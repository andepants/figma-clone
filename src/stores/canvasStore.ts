/**
 * Canvas Store
 *
 * Zustand store for managing canvas state including objects, selection, and CRUD operations.
 */

import { create } from 'zustand';
import type { CanvasObject } from '@/types';

/**
 * Canvas store state interface
 * @interface CanvasState
 * @property {CanvasObject[]} objects - All canvas objects
 * @property {string | null} selectedId - ID of currently selected object
 */
interface CanvasState {
  objects: CanvasObject[];
  selectedId: string | null;
}

/**
 * Canvas store actions interface
 * @interface CanvasActions
 */
interface CanvasActions {
  /**
   * Add a new object to the canvas
   * @param {CanvasObject} object - Object to add
   */
  addObject: (object: CanvasObject) => void;

  /**
   * Update an existing object
   * @param {string} id - Object ID to update
   * @param {Partial<CanvasObject>} updates - Properties to update
   */
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;

  /**
   * Remove an object from the canvas
   * @param {string} id - Object ID to remove
   */
  removeObject: (id: string) => void;

  /**
   * Select an object by ID
   * @param {string | null} id - Object ID to select, or null to deselect
   */
  selectObject: (id: string | null) => void;

  /**
   * Clear current selection
   */
  clearSelection: () => void;

  /**
   * Replace all objects (used for Firestore sync)
   * @param {CanvasObject[]} objects - New objects array
   */
  setObjects: (objects: CanvasObject[]) => void;

  /**
   * Clear all objects from the canvas
   */
  clearObjects: () => void;
}

/**
 * Canvas store type combining state and actions
 */
type CanvasStore = CanvasState & CanvasActions;

/**
 * Canvas store hook
 * Provides access to canvas state and actions
 * @returns {CanvasStore} Canvas store instance
 */
export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  objects: [],
  selectedId: null,

  // Actions
  addObject: (object) =>
    set((state) => ({
      objects: [...state.objects, object],
    })),

  updateObject: (id, updates) =>
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

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectObject: (id) =>
    set(() => ({
      selectedId: id,
    })),

  clearSelection: () =>
    set(() => ({
      selectedId: null,
    })),

  setObjects: (objects) =>
    set(() => ({
      objects,
    })),

  clearObjects: () =>
    set(() => ({
      objects: [],
      selectedId: null,
    })),
}));
