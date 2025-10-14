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
 * @property {number} zoom - Current zoom level (0.1 to 5.0, default 1.0)
 * @property {number} panX - Pan X position
 * @property {number} panY - Pan Y position
 */
interface CanvasState {
  objects: CanvasObject[];
  selectedId: string | null;
  zoom: number;
  panX: number;
  panY: number;
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

  /**
   * Set zoom level
   * @param {number} zoom - Zoom level (0.1 to 5.0)
   */
  setZoom: (zoom: number) => void;

  /**
   * Zoom in by 10%
   */
  zoomIn: () => void;

  /**
   * Zoom out by 10%
   */
  zoomOut: () => void;

  /**
   * Zoom to specific percentage
   * @param {number} percentage - Target zoom percentage (e.g., 100 for 100%)
   */
  zoomTo: (percentage: number) => void;

  /**
   * Zoom to fit all objects in viewport
   */
  zoomToFit: () => void;

  /**
   * Set pan position
   * @param {number} x - Pan X position
   * @param {number} y - Pan Y position
   */
  setPan: (x: number, y: number) => void;

  /**
   * Reset view to default (zoom 100%, centered)
   */
  resetView: () => void;
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
  zoom: 1.0,
  panX: 0,
  panY: 0,

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

  setZoom: (zoom) =>
    set(() => ({
      zoom: Math.max(0.1, Math.min(5.0, zoom)),
    })),

  zoomIn: () =>
    set((state) => ({
      zoom: Math.max(0.1, Math.min(5.0, state.zoom * 1.1)),
    })),

  zoomOut: () =>
    set((state) => ({
      zoom: Math.max(0.1, Math.min(5.0, state.zoom / 1.1)),
    })),

  zoomTo: (percentage) =>
    set(() => ({
      zoom: Math.max(0.1, Math.min(5.0, percentage / 100)),
    })),

  zoomToFit: () =>
    set((state) => {
      // If no objects, reset to 100%
      if (state.objects.length === 0) {
        return { zoom: 1.0, panX: 0, panY: 0 };
      }

      // Calculate bounding box of all objects
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      state.objects.forEach((obj) => {
        if (obj.type === 'rectangle') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + obj.width);
          maxY = Math.max(maxY, obj.y + obj.height);
        } else if (obj.type === 'circle') {
          minX = Math.min(minX, obj.x - obj.radius);
          minY = Math.min(minY, obj.y - obj.radius);
          maxX = Math.max(maxX, obj.x + obj.radius);
          maxY = Math.max(maxY, obj.y + obj.radius);
        } else if (obj.type === 'text') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + obj.width);
          maxY = Math.max(maxY, obj.y + obj.height);
        }
      });

      // Add padding (20% of viewport)
      const padding = 0.2;
      const width = maxX - minX;
      const height = maxY - minY;

      // Calculate zoom to fit (assuming standard viewport ~1200x800)
      const viewportWidth = 1200;
      const viewportHeight = 800;
      const scaleX = (viewportWidth * (1 - padding)) / width;
      const scaleY = (viewportHeight * (1 - padding)) / height;
      const newZoom = Math.max(0.1, Math.min(5.0, Math.min(scaleX, scaleY)));

      return {
        zoom: newZoom,
        panX: 0,
        panY: 0,
      };
    }),

  setPan: (x, y) =>
    set(() => ({
      panX: x,
      panY: y,
    })),

  resetView: () =>
    set(() => ({
      zoom: 1.0,
      panX: 0,
      panY: 0,
    })),
}));
