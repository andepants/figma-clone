/**
 * Canvas Store
 *
 * Zustand store for managing canvas state including objects, selection, and CRUD operations.
 */

import { create } from 'zustand';
import type { CanvasObject, Rectangle, Circle, Text, Line } from '@/types';

/**
 * Compare two canvas object arrays for shallow equality
 *
 * Compares all visual properties that would affect rendering:
 * - Position (x, y)
 * - Dimensions (width, height, radius)
 * - Transform (rotation, opacity, scaleX, scaleY, skewX, skewY)
 * - Style (fill, stroke, strokeWidth, cornerRadius, shadowColor, etc.)
 * - Content (text for TextShape)
 *
 * This prevents unnecessary re-renders when Firebase subscription
 * creates a new array reference with identical values.
 *
 * @param {CanvasObject[]} arr1 - First array
 * @param {CanvasObject[]} arr2 - Second array
 * @returns {boolean} - True if arrays are shallowly equal
 */
function areObjectArraysEqual(arr1: CanvasObject[], arr2: CanvasObject[]): boolean {
  // Quick length check
  if (arr1.length !== arr2.length) return false;

  // Compare each object's properties
  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i];
    const obj2 = arr2[i];

    // Compare common properties
    if (
      obj1.id !== obj2.id ||
      obj1.type !== obj2.type ||
      obj1.x !== obj2.x ||
      obj1.y !== obj2.y ||
      obj1.rotation !== obj2.rotation ||
      obj1.opacity !== obj2.opacity ||
      obj1.scaleX !== obj2.scaleX ||
      obj1.scaleY !== obj2.scaleY ||
      obj1.skewX !== obj2.skewX ||
      obj1.skewY !== obj2.skewY ||
      obj1.stroke !== obj2.stroke ||
      obj1.strokeWidth !== obj2.strokeWidth ||
      obj1.strokeEnabled !== obj2.strokeEnabled ||
      obj1.shadowColor !== obj2.shadowColor ||
      obj1.shadowBlur !== obj2.shadowBlur ||
      obj1.shadowOffsetX !== obj2.shadowOffsetX ||
      obj1.shadowOffsetY !== obj2.shadowOffsetY ||
      obj1.shadowOpacity !== obj2.shadowOpacity ||
      obj1.shadowEnabled !== obj2.shadowEnabled ||
      obj1.createdBy !== obj2.createdBy
    ) {
      return false;
    }

    // Compare fill property (only exists on Rectangle, Circle, Text - not Line)
    if ('fill' in obj1 && 'fill' in obj2 && obj1.fill !== obj2.fill) {
      return false;
    }

    // Type-specific comparisons
    if (obj1.type === 'rectangle' && obj2.type === 'rectangle') {
      const rect1 = obj1 as Rectangle;
      const rect2 = obj2 as Rectangle;
      if (
        rect1.width !== rect2.width ||
        rect1.height !== rect2.height ||
        rect1.cornerRadius !== rect2.cornerRadius
      ) {
        return false;
      }
    } else if (obj1.type === 'circle' && obj2.type === 'circle') {
      const circle1 = obj1 as Circle;
      const circle2 = obj2 as Circle;
      if (circle1.radius !== circle2.radius) {
        return false;
      }
    } else if (obj1.type === 'text' && obj2.type === 'text') {
      const text1 = obj1 as Text;
      const text2 = obj2 as Text;
      if (
        text1.text !== text2.text ||
        text1.width !== text2.width ||
        text1.height !== text2.height ||
        text1.fontSize !== text2.fontSize ||
        text1.fontFamily !== text2.fontFamily ||
        text1.fontStyle !== text2.fontStyle ||
        text1.textDecoration !== text2.textDecoration ||
        text1.align !== text2.align ||
        text1.verticalAlign !== text2.verticalAlign ||
        text1.lineHeight !== text2.lineHeight ||
        text1.letterSpacing !== text2.letterSpacing ||
        text1.wrap !== text2.wrap
      ) {
        return false;
      }
    } else if (obj1.type === 'line' && obj2.type === 'line') {
      const line1 = obj1 as Line;
      const line2 = obj2 as Line;
      if (
        line1.points[0] !== line2.points[0] ||
        line1.points[1] !== line2.points[1] ||
        line1.points[2] !== line2.points[2] ||
        line1.points[3] !== line2.points[3] ||
        line1.width !== line2.width
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Canvas store state interface
 * @interface CanvasState
 * @property {CanvasObject[]} objects - All canvas objects
 * @property {string[]} selectedIds - IDs of currently selected objects (supports multi-select)
 * @property {string | null} editingTextId - ID of text currently being edited
 * @property {number} zoom - Current zoom level (0.1 to 5.0, default 1.0)
 * @property {number} panX - Pan X position
 * @property {number} panY - Pan Y position
 * @property {CanvasObject[]} clipboard - Objects copied to clipboard (used for copy/paste)
 */
interface CanvasState {
  objects: CanvasObject[];
  selectedIds: string[];
  editingTextId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  clipboard: CanvasObject[];
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
   * Batch update multiple objects in a single state transaction
   * This is CRITICAL for performance when dragging multiple selected objects.
   * Updates all objects atomically in one state change, triggering only ONE React re-render
   * instead of N re-renders (one per object).
   *
   * @param {Array<{id: string, updates: Partial<CanvasObject>}>} updates - Array of object updates
   *
   * @example
   * ```typescript
   * // Update 5 objects in group drag - single state update!
   * batchUpdateObjects([
   *   { id: 'rect1', updates: { x: 100, y: 200 } },
   *   { id: 'rect2', updates: { x: 150, y: 250 } },
   *   { id: 'circle1', updates: { x: 300, y: 100 } },
   * ]);
   * ```
   */
  batchUpdateObjects: (updates: Array<{ id: string; updates: Partial<CanvasObject> }>) => void;

  /**
   * Remove an object from the canvas
   * @param {string} id - Object ID to remove
   */
  removeObject: (id: string) => void;

  /**
   * Select multiple objects (replaces current selection)
   * @param {string[]} ids - Array of object IDs to select
   */
  selectObjects: (ids: string[]) => void;

  /**
   * Toggle an object in selection (add if not present, remove if present)
   * @param {string} id - Object ID to toggle
   */
  toggleSelection: (id: string) => void;

  /**
   * Add an object to current selection
   * @param {string} id - Object ID to add
   */
  addToSelection: (id: string) => void;

  /**
   * Remove an object from current selection
   * @param {string} id - Object ID to remove
   */
  removeFromSelection: (id: string) => void;

  /**
   * Clear current selection
   */
  clearSelection: () => void;

  /**
   * Set the text currently being edited
   * @param {string | null} id - Text ID to edit, or null to clear
   */
  setEditingText: (id: string | null) => void;

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
   * @param {number} viewportWidth - Optional viewport width (defaults to 1200)
   * @param {number} viewportHeight - Optional viewport height (defaults to 800)
   */
  zoomToFit: (viewportWidth?: number, viewportHeight?: number) => void;

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

  /**
   * Toggle visibility of an object
   * @param {string} id - Object ID to toggle
   */
  toggleVisibility: (id: string) => void;

  /**
   * Toggle collapse state of object
   *
   * When collapsed, children are hidden in layers panel.
   * @param {string} id - Object ID to toggle
   */
  toggleCollapse: (id: string) => void;

  /**
   * Set parent of object
   *
   * Validates no circular references before updating.
   * Returns early if circular reference detected.
   * @param {string} objectId - Object to move
   * @param {string | null} newParentId - New parent ID (null for root)
   */
  setParent: (objectId: string, newParentId: string | null) => void;

  /**
   * Select object and all descendants
   *
   * Used when clicking collapsed parent or selecting entire group.
   * @param {string} id - Parent object ID
   */
  selectWithDescendants: (id: string) => void;

  /**
   * Toggle lock state of an object
   *
   * Locked objects cannot be selected, edited, or deleted on canvas.
   * @param {string} id - Object ID to toggle
   */
  toggleLock: (id: string) => void;

  /**
   * Copy selected objects to clipboard
   *
   * Copies all selected objects and their descendants to clipboard.
   * Maintains parent-child relationships within the copied set.
   * Does nothing if no objects are selected.
   */
  copyObjects: () => void;

  /**
   * Paste objects from clipboard
   *
   * Creates new objects from clipboard with:
   * - New unique IDs
   * - Offset position (+20, +20)
   * - Preserved parent-child relationships
   * - Synced to Firebase Realtime Database
   *
   * Does nothing if clipboard is empty.
   * Selects the pasted objects after creation.
   */
  pasteObjects: () => void;
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
  selectedIds: [],
  editingTextId: null,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  clipboard: [],

  // Actions
  addObject: (object) => {
    set((state) => ({
      objects: [...state.objects, object],
    }));
  },

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

  batchUpdateObjects: (updates) =>
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

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    })),

  selectObjects: (ids) =>
    set(() => ({
      selectedIds: ids,
    })),

  toggleSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      if (isSelected) {
        return { selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) };
      } else {
        return { selectedIds: [...state.selectedIds, id] };
      }
    }),

  addToSelection: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return state;
      }
      return { selectedIds: [...state.selectedIds, id] };
    }),

  removeFromSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    })),

  clearSelection: () =>
    set(() => ({
      selectedIds: [],
    })),

  setEditingText: (id) => {
    set(() => ({
      editingTextId: id,
    }));
  },

  setObjects: (objects) =>
    set((state) => {
      // PERFORMANCE FIX: Skip update if arrays are shallowly equal
      // This prevents unnecessary re-renders when Firebase subscription
      // creates a new array reference with identical object values
      if (areObjectArraysEqual(state.objects, objects)) {
        return state; // No update → no re-render!
      }

      // SYNC FIX: Clean up stale selection IDs
      // When objects are deleted remotely (via Firebase), we need to remove
      // their IDs from selectedIds to prevent the UI from trying to access
      // deleted objects. This prevents "Cannot read properties of null" errors.
      const objectIds = new Set(objects.map(obj => obj.id));
      const cleanedSelectedIds = state.selectedIds.filter(id => objectIds.has(id));

      // Only update selectedIds if it actually changed (avoid unnecessary re-renders)
      const selectedIdsChanged = cleanedSelectedIds.length !== state.selectedIds.length;

      return {
        objects,
        ...(selectedIdsChanged && { selectedIds: cleanedSelectedIds }),
      };
    }),

  clearObjects: () =>
    set(() => ({
      objects: [],
      selectedIds: [],
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

  zoomToFit: (viewportWidth = 1200, viewportHeight = 800) =>
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
        } else if (obj.type === 'line') {
          // Line points are relative to (x, y), so we need to calculate absolute positions
          const x1 = obj.x + obj.points[0];
          const y1 = obj.y + obj.points[1];
          const x2 = obj.x + obj.points[2];
          const y2 = obj.y + obj.points[3];
          minX = Math.min(minX, x1, x2);
          minY = Math.min(minY, y1, y2);
          maxX = Math.max(maxX, x1, x2);
          maxY = Math.max(maxY, y1, y2);
        }
      });

      // Calculate content dimensions
      const width = maxX - minX;
      const height = maxY - minY;

      // Guard against zero or invalid dimensions
      if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
        return { zoom: 1.0, panX: 0, panY: 0 };
      }

      // Add padding (20% of viewport)
      const padding = 0.2;

      // Calculate zoom to fit
      const scaleX = (viewportWidth * (1 - padding)) / width;
      const scaleY = (viewportHeight * (1 - padding)) / height;
      const newZoom = Math.max(0.1, Math.min(5.0, Math.min(scaleX, scaleY)));

      // Guard against NaN zoom
      if (!isFinite(newZoom)) {
        return { zoom: 1.0, panX: 0, panY: 0 };
      }

      // Calculate center position for the content
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Center the content in viewport
      const newPanX = viewportWidth / 2 - centerX * newZoom;
      const newPanY = viewportHeight / 2 - centerY * newZoom;

      return {
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY,
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

  toggleVisibility: (id) => {
    const state = useCanvasStore.getState();
    const object = state.objects.find((obj) => obj.id === id);
    if (object) {
      const newVisible = !(object.visible ?? true); // Default true
      state.updateObject(id, { visible: newVisible });
    }
  },

  toggleCollapse: (id) => {
    const state = useCanvasStore.getState();
    const object = state.objects.find((obj) => obj.id === id);
    if (object) {
      state.updateObject(id, { isCollapsed: !object.isCollapsed });
    }
  },

  setParent: (objectId, newParentId) => {
    const state = useCanvasStore.getState();
    const objects = state.objects;

    // Prevent circular references
    if (newParentId) {
      // Import getAllDescendantIds locally to avoid circular import
      const getAllDescendantIds = (nodeId: string, objs: CanvasObject[]): string[] => {
        const descendants: string[] = [];
        const children = objs.filter((obj) => obj.parentId === nodeId);
        children.forEach((child) => {
          descendants.push(child.id);
          descendants.push(...getAllDescendantIds(child.id, objs));
        });
        return descendants;
      };

      const descendants = getAllDescendantIds(objectId, objects);
      if (descendants.includes(newParentId)) {
        // Prevent circular reference - silently return
        return;
      }
    }

    // Update parent
    state.updateObject(objectId, { parentId: newParentId });
  },

  selectWithDescendants: (id) => {
    const state = useCanvasStore.getState();
    const objects = state.objects;

    // Import getAllDescendantIds locally to avoid circular import
    const getAllDescendantIds = (nodeId: string, objs: CanvasObject[]): string[] => {
      const descendants: string[] = [];
      const children = objs.filter((obj) => obj.parentId === nodeId);
      children.forEach((child) => {
        descendants.push(child.id);
        descendants.push(...getAllDescendantIds(child.id, objs));
      });
      return descendants;
    };

    const descendants = getAllDescendantIds(id, objects);
    state.selectObjects([id, ...descendants]);
  },

  toggleLock: (id) => {
    const state = useCanvasStore.getState();
    const objects = state.objects;
    const object = objects.find((obj) => obj.id === id);
    if (!object) return;

    const newLocked = !(object.locked ?? false);

    // Get all descendants
    const getAllDescendantIds = (nodeId: string, objs: CanvasObject[]): string[] => {
      const descendants: string[] = [];
      const children = objs.filter((obj) => obj.parentId === nodeId);
      children.forEach((child) => {
        descendants.push(child.id);
        descendants.push(...getAllDescendantIds(child.id, objs));
      });
      return descendants;
    };

    const descendants = getAllDescendantIds(id, objects);

    // Update object and all descendants
    const updatedObjects = objects.map((obj) => {
      if (obj.id === id || descendants.includes(obj.id)) {
        return { ...obj, locked: newLocked, updatedAt: Date.now() };
      }
      return obj;
    });

    set({ objects: updatedObjects });
  },

  copyObjects: () => {
    const state = useCanvasStore.getState();
    const { selectedIds, objects } = state;

    // Do nothing if no objects selected
    if (selectedIds.length === 0) return;

    // Helper to get all descendants
    const getAllDescendantIds = (nodeId: string, objs: CanvasObject[]): string[] => {
      const descendants: string[] = [];
      const children = objs.filter((obj) => obj.parentId === nodeId);
      children.forEach((child) => {
        descendants.push(child.id);
        descendants.push(...getAllDescendantIds(child.id, objs));
      });
      return descendants;
    };

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
    const state = useCanvasStore.getState();
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
        const newParentId = obj.parentId && idMap.has(obj.parentId)
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
      for (const obj of newObjects) {
        try {
          await addCanvasObject('main', obj);
        } catch {
          // Note: RTDB subscription will restore correct state if sync fails
        }
      }

      // Select the pasted objects
      state.selectObjects(newIds);
    });
  },
}));
