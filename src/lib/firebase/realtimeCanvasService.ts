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
import { throttle, retryAsync } from '@/lib/utils';
import type { CanvasObject } from '@/types';

/**
 * Connection status type
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Global connection state
 * Tracks Firebase Realtime Database connection status
 */
let currentConnectionStatus: ConnectionStatus = 'connecting';
const connectionCallbacks = new Set<(status: ConnectionStatus) => void>();

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
 *   // Process updated canvas objects
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
        }))
        // Sort by zIndex (lower = back, higher = front)
        // Objects without zIndex default to 0
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

      callback(objectsArray);
    },
    () => {
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
  // Retry with exponential backoff (3 attempts: 1s, 2s, 3s delays)
  await retryAsync(async () => {
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
  }, 3, 1000);
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
  } catch {
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
  // Retry with exponential backoff (3 attempts: 1s, 2s, 3s delays)
  await retryAsync(async () => {
    const objectRef = ref(realtimeDb, `canvases/${canvasId}/objects/${objectId}`);
    await remove(objectRef);
  }, 3, 1000);
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
  // Retry with exponential backoff (3 attempts: 1s, 2s, 3s delays)
  await retryAsync(async () => {
    const objectsRef = ref(realtimeDb, `canvases/${canvasId}/objects`);
    // Use set(null) instead of remove() to reliably trigger subscriptions
    await set(objectsRef, null);
  }, 3, 1000);
}

/**
 * Atomic batch update for multiple canvas objects
 *
 * Updates multiple objects in a single Firebase transaction.
 * This is essential for group operations like multi-select drag,
 * where all objects must update atomically to prevent flickering
 * or drift for other users.
 *
 * Benefits:
 * - Single network call instead of N separate calls
 * - Atomic: All objects update together or none do
 * - No drift: Other users receive single consistent update
 * - Faster: ~100ms total instead of N × 100ms
 *
 * @param {string} canvasId - Canvas identifier
 * @param {Record<string, Partial<CanvasObject>>} updates - Map of objectId → partial updates
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Update positions of multiple objects in group drag
 * await batchUpdateCanvasObjects('main', {
 *   'rect1': { x: 100, y: 200 },
 *   'rect2': { x: 150, y: 250 },
 *   'circle1': { x: 300, y: 100 }
 * });
 * ```
 */
export async function batchUpdateCanvasObjects(
  canvasId: string,
  updates: Record<string, Partial<CanvasObject>>
): Promise<void> {
  try {
    const dbRef = ref(realtimeDb);

    // Build multi-path update object
    const multiPathUpdates: Record<string, string | number | boolean | number[] | null> = {};
    const timestamp = Date.now();

    for (const [objectId, objectUpdates] of Object.entries(updates)) {
      for (const [key, value] of Object.entries(objectUpdates)) {
        multiPathUpdates[`canvases/${canvasId}/objects/${objectId}/${key}`] = value as string | number | boolean | number[] | null;
      }
      // Always update timestamp
      multiPathUpdates[`canvases/${canvasId}/objects/${objectId}/updatedAt`] = timestamp;
    }

    // Single atomic update
    await update(dbRef, multiPathUpdates);
  } catch {
    // Don't throw - updates shouldn't break the app
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
 * // Process retrieved objects
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
  } catch {
    return [];
  }
}

/**
 * Sync z-index and organizational properties for array of objects
 *
 * Updates the zIndex, parentId, and other organizational properties of all objects
 * to match their current state. This ensures layer ordering and hierarchy
 * persist across sessions and sync to collaborators.
 *
 * Array position maps to z-index:
 * - First in array (index 0) = lowest zIndex (back of canvas)
 * - Last in array (index n-1) = highest zIndex (front of canvas)
 *
 * Also syncs organizational properties that may have changed:
 * - parentId (for hierarchy/grouping)
 * - isCollapsed (for collapsed groups in layers panel)
 *
 * Used when objects are reordered via drag-drop in layers panel.
 *
 * @param {string} canvasId - Canvas identifier
 * @param {CanvasObject[]} objects - Ordered array of canvas objects
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // After reordering in layers panel
 * const reorderedObjects = [...]; // New order
 * await syncZIndexes('main', reorderedObjects);
 * ```
 */
export async function syncZIndexes(
  canvasId: string,
  objects: CanvasObject[]
): Promise<void> {
  try {
    const dbRef = ref(realtimeDb);
    const multiPathUpdates: Record<string, string | number | boolean | null> = {};
    const timestamp = Date.now();

    // Assign zIndex based on array position and sync organizational properties
    objects.forEach((obj, index) => {
      multiPathUpdates[`canvases/${canvasId}/objects/${obj.id}/zIndex`] = index;
      multiPathUpdates[`canvases/${canvasId}/objects/${obj.id}/updatedAt`] = timestamp;

      // Sync parentId (critical for hierarchy persistence)
      // Use null instead of undefined for Firebase compatibility
      multiPathUpdates[`canvases/${canvasId}/objects/${obj.id}/parentId`] = obj.parentId ?? null;

      // Sync collapse state (for groups in layers panel)
      if (obj.isCollapsed !== undefined) {
        multiPathUpdates[`canvases/${canvasId}/objects/${obj.id}/isCollapsed`] = obj.isCollapsed;
      }
    });

    // Single atomic update for all properties
    await update(dbRef, multiPathUpdates);
  } catch {
    // Don't throw - sync shouldn't break the app
  }
}

/**
 * Initialize connection monitoring
 *
 * Sets up Firebase Realtime Database connection state monitoring.
 * This should be called once on app initialization.
 *
 * Firebase RTDB provides a special path `.info/connected` that indicates
 * whether the client is connected to the database.
 *
 * Connection states:
 * - 'connected': Active connection to Firebase RTDB
 * - 'connecting': Attempting to establish connection
 * - 'disconnected': No connection to Firebase RTDB
 *
 * @example
 * ```typescript
 * // Initialize connection monitoring on app startup
 * initConnectionMonitoring();
 * ```
 */
export function initConnectionMonitoring(): void {
  const connectedRef = ref(realtimeDb, '.info/connected');

  onValue(connectedRef, (snapshot) => {
    const isConnected = snapshot.val() === true;
    const newStatus: ConnectionStatus = isConnected ? 'connected' : 'disconnected';

    // Development logging for connection state changes
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Firebase Connection] Status changed: ${currentConnectionStatus} → ${newStatus}`);
    }

    // Update global state
    currentConnectionStatus = newStatus;

    // Notify all subscribers
    connectionCallbacks.forEach(callback => {
      try {
        callback(newStatus);
      } catch (error) {
        console.error('[Firebase Connection] Error in callback:', error);
      }
    });
  });
}

/**
 * Subscribe to connection status changes
 *
 * Registers a callback to be invoked whenever the Firebase RTDB connection
 * status changes. Returns an unsubscribe function.
 *
 * @param {function} callback - Function called with new connection status
 * @returns {function} Unsubscribe function to remove the callback
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToConnectionStatus((status) => {
 *   if (status === 'disconnected') {
 *     showOfflineBanner();
 *   }
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToConnectionStatus(
  callback: (status: ConnectionStatus) => void
): () => void {
  // Call immediately with current status
  callback(currentConnectionStatus);

  // Add to subscribers
  connectionCallbacks.add(callback);

  // Return unsubscribe function
  return () => {
    connectionCallbacks.delete(callback);
  };
}

/**
 * Get current connection status (synchronous)
 *
 * Returns the current Firebase RTDB connection status without subscribing.
 * Useful for one-time checks.
 *
 * @returns {ConnectionStatus} Current connection status
 *
 * @example
 * ```typescript
 * const status = getConnectionStatus();
 * if (status === 'connected') {
 *   // Perform online-only operation
 * }
 * ```
 */
export function getConnectionStatus(): ConnectionStatus {
  return currentConnectionStatus;
}
