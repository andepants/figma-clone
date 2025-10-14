/**
 * Realtime Canvas Service
 *
 * Manages canvas objects using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/objects/{objectId}
 *
 * Benefits over Firestore:
 * - Real-time updates (no debounce lag)
 * - Atomic per-object updates (no full array replacement)
 * - Eliminates race conditions between databases
 * - Faster sync (50ms vs 500ms)
 */

import { ref, set, update, remove, onValue, push, get } from 'firebase/database';
import { realtimeDb } from './config';
import { throttle } from '@/lib/utils';
import type { CanvasObject } from '@/types';

/**
 * Subscribe to all canvas objects for real-time updates
 *
 * Listens to changes in the objects collection and invokes the callback
 * whenever objects are added, updated, or removed.
 *
 * The subscription automatically converts the RTDB object structure to an array.
 *
 * @param {string} canvasId - The canvas document ID (e.g., 'main')
 * @param {function} callback - Function called with updated objects array
 * @returns {function} Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToCanvasObjects('main', (objects) => {
 *   console.log('Canvas updated:', objects);
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToCanvasObjects(
  canvasId: string,
  callback: (objects: CanvasObject[]) => void
): () => void {
  const objectsRef = ref(realtimeDb, `canvases/${canvasId}/objects`);

  const unsubscribe = onValue(
    objectsRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        // No objects yet
        callback([]);
        return;
      }

      // Convert RTDB object structure to array
      // RTDB stores as: { objectId1: {...}, objectId2: {...} }
      // We need: [{...}, {...}]
      const objectsArray: CanvasObject[] = Object.entries(data)
        .filter(([, value]) => value !== null) // Filter out deleted objects
        .map(([objectId, objectData]) => ({
          ...(objectData as CanvasObject),
          id: objectId, // Ensure ID is set
        }));

      callback(objectsArray);
    },
    (error) => {
      console.error('Error subscribing to canvas objects:', error);
      // Still call callback with empty array on error
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Add a new canvas object to the Realtime Database
 *
 * Creates a new object with a unique ID. If the object already has an ID,
 * it will be used. Otherwise, a unique ID will be generated.
 *
 * @param {string} canvasId - The canvas document ID
 * @param {CanvasObject} object - Canvas object to add
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await addCanvasObject('main', {
 *   id: 'rect-123',
 *   type: 'rectangle',
 *   x: 100,
 *   y: 100,
 *   width: 200,
 *   height: 150,
 *   fill: '#3b82f6',
 *   createdBy: 'user-123',
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * });
 * ```
 */
export async function addCanvasObject(
  canvasId: string,
  object: CanvasObject
): Promise<void> {
  try {
    const objectsRef = ref(realtimeDb, `canvases/${canvasId}/objects`);

    if (object.id) {
      // Use provided ID
      const objectRef = ref(realtimeDb, `canvases/${canvasId}/objects/${object.id}`);
      await set(objectRef, object);
    } else {
      // Generate unique ID using push()
      const newObjectRef = push(objectsRef);
      const objectWithId = {
        ...object,
        id: newObjectRef.key!, // Firebase generates unique key
      };
      await set(newObjectRef, objectWithId);
    }
  } catch (error) {
    console.error('Failed to add canvas object:', error);
    throw error;
  }
}

/**
 * Update an existing canvas object
 *
 * Performs an atomic update on a specific object. Only the provided fields
 * will be updated. This is much more efficient than replacing the entire
 * objects array (Firestore approach).
 *
 * Always sets updatedAt to current timestamp.
 *
 * @param {string} canvasId - The canvas document ID
 * @param {string} objectId - Object ID to update
 * @param {Partial<CanvasObject>} updates - Properties to update
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Update only position during drag
 * await updateCanvasObject('main', 'rect-123', {
 *   x: 150,
 *   y: 200,
 * });
 * ```
 */
export async function updateCanvasObject(
  canvasId: string,
  objectId: string,
  updates: Partial<CanvasObject>
): Promise<void> {
  try {
    const objectRef = ref(realtimeDb, `canvases/${canvasId}/objects/${objectId}`);

    // Always update the timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: Date.now(),
    };

    await update(objectRef, updatesWithTimestamp);
  } catch (error) {
    console.error('Failed to update canvas object:', error);
    // Don't throw - updates shouldn't break the app
  }
}

/**
 * Throttled version of updateCanvasObject
 *
 * Use this in drag handlers to avoid excessive updates.
 * Throttles to 50ms (20 updates per second) - same as drag states.
 *
 * @example
 * ```typescript
 * onDragMove(e => {
 *   throttledUpdateCanvasObject('main', objectId, {
 *     x: e.target.x(),
 *     y: e.target.y(),
 *   });
 * });
 * ```
 */
export const throttledUpdateCanvasObject = throttle(updateCanvasObject, 50);

/**
 * Remove a canvas object from the database
 *
 * Atomically deletes a specific object. Does not affect other objects.
 *
 * @param {string} canvasId - The canvas document ID
 * @param {string} objectId - Object ID to remove
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await removeCanvasObject('main', 'rect-123');
 * ```
 */
export async function removeCanvasObject(
  canvasId: string,
  objectId: string
): Promise<void> {
  try {
    const objectRef = ref(realtimeDb, `canvases/${canvasId}/objects/${objectId}`);
    await remove(objectRef);
  } catch (error) {
    console.error('Failed to remove canvas object:', error);
    throw error;
  }
}

/**
 * Clear all objects from a canvas
 *
 * Clears all objects in a single operation by setting the objects node to null.
 * Using set(null) instead of remove() ensures the subscription properly triggers.
 * Used by the "Clear Canvas" button.
 *
 * @param {string} canvasId - The canvas document ID
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * if (confirm('Clear all shapes?')) {
 *   await clearAllCanvasObjects('main');
 * }
 * ```
 */
export async function clearAllCanvasObjects(canvasId: string): Promise<void> {
  try {
    const objectsRef = ref(realtimeDb, `canvases/${canvasId}/objects`);
    // Use set(null) instead of remove() to reliably trigger subscriptions
    await set(objectsRef, null);
  } catch (error) {
    console.error('Failed to clear canvas objects:', error);
    throw error;
  }
}

/**
 * Get all canvas objects (one-time read)
 *
 * Fetches the current state of all objects without subscribing to updates.
 * Useful for initial load or manual refresh.
 *
 * @param {string} canvasId - The canvas document ID
 * @returns {Promise<CanvasObject[]>} Array of canvas objects
 *
 * @example
 * ```typescript
 * const objects = await getAllCanvasObjects('main');
 * console.log(`Found ${objects.length} objects`);
 * ```
 */
export async function getAllCanvasObjects(
  canvasId: string
): Promise<CanvasObject[]> {
  try {
    const objectsRef = ref(realtimeDb, `canvases/${canvasId}/objects`);
    const snapshot = await get(objectsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    const objectsArray: CanvasObject[] = Object.entries(data)
      .filter(([, value]) => value !== null)
      .map(([objectId, objectData]) => ({
        ...(objectData as CanvasObject),
        id: objectId,
      }));

    return objectsArray;
  } catch (error) {
    console.error('Failed to get canvas objects:', error);
    return [];
  }
}
