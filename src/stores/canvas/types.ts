/**
 * Canvas Store Types
 *
 * Type definitions and interfaces for the canvas store.
 * Split from main canvasStore to improve modularity.
 */

import type { CanvasObject } from '@/types';

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
 * @property {string} projectId - Current project ID (defaults to 'main' for legacy support)
 */
export interface CanvasState {
  objects: CanvasObject[];
  selectedIds: string[];
  editingTextId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  clipboard: CanvasObject[];
  projectId: string;
}

/**
 * Canvas store actions interface
 * @interface CanvasActions
 */
export interface CanvasActions {
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
   * - Updated createdBy field (set to current user)
   * - Synced to Firebase Realtime Database
   *
   * Does nothing if clipboard is empty.
   * Selects the pasted objects after creation.
   *
   * @param userId - Current user ID (for createdBy field, required by database rules)
   */
  pasteObjects: (userId: string) => void;

  /**
   * Group selected objects under new group
   *
   * Creates new group object with calculated position (bounding box center).
   * Sets parentId on all selected objects to group ID.
   * Sets createdBy to current user (required by database rules).
   * Syncs to Firebase RTDB.
   * Selects the new group.
   *
   * Does nothing if < 2 objects selected.
   *
   * @param userId - Current user ID (for createdBy field, required by database rules)
   */
  groupObjects: (userId: string) => void;

  /**
   * Ungroup selected group(s)
   *
   * Removes parentId from all children of selected groups.
   * Deletes the group objects.
   * Selects the ungrouped objects.
   * Syncs to Firebase RTDB.
   *
   * Does nothing if no groups selected.
   */
  ungroupObjects: () => void;

  /**
   * Bring object to front (highest z-index)
   *
   * Moves object to end of objects array.
   * Last in array = front of canvas.
   * Syncs z-index to Firebase RTDB.
   *
   * @param id - Object ID to move to front
   */
  bringToFront: (id: string) => void;

  /**
   * Send object to back (lowest z-index)
   *
   * Moves object to start of objects array.
   * First in array = back of canvas.
   * Syncs z-index to Firebase RTDB.
   *
   * @param id - Object ID to move to back
   */
  sendToBack: (id: string) => void;

  /**
   * Set current project ID
   *
   * Updates the active project context.
   * Validates that projectId is non-empty, fallback to 'main' if empty/null/undefined.
   *
   * @param id - Project ID to set (defaults to 'main' if invalid)
   */
  setProjectId: (id: string) => void;

  /**
   * Get current project ID
   *
   * Returns the active project ID.
   *
   * @returns Current project ID
   */
  getProjectId: () => string;

  /**
   * Create a processed version of an image (e.g., after background removal)
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
  createProcessedImage: (
    originalImage: CanvasObject,
    processedData: {
      url: string;
      storagePath: string;
      naturalWidth?: number;
      naturalHeight?: number;
      fileSize: number;
    },
    userId: string
  ) => Promise<void>;
}

/**
 * Canvas store type combining state and actions
 */
export type CanvasStore = CanvasState & CanvasActions;
