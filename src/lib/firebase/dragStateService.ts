/**
 * Drag State Service
 *
 * Manages real-time drag state synchronization for single objects using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/drag-states/{objectId}/
 *
 * Features:
 * - Drag locking (first user to drag gets exclusive control)
 * - Auto-cleanup on disconnect (browser crash, network loss)
 * - Throttled position updates (50ms)
 * - Stale state detection and cleanup
 *
 * For group dragging operations, see groupDragService.ts
 * For shared utilities, see dragStateHelpers.ts
 */

import { ref, set, get, remove, update, onValue, onDisconnect } from 'firebase/database';
import { realtimeDb } from './config';
import { throttle } from '@/lib/utils';
import { STALE_STATE_THRESHOLD, isDragStateStale } from './dragStateHelpers';
import type { DragState, DragStateMap } from '@/types';

/**
 * Start dragging an object
 *
 * Attempts to acquire a drag lock on the object. If another user is already
 * dragging, returns false. Otherwise, sets up the drag state with automatic
 * cleanup on disconnect.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object being dragged
 * @param userId - User performing the drag
 * @param position - Initial position {x, y}
 * @param username - User's display name
 * @param color - User's assigned color
 * @returns Promise<boolean> - true if drag lock acquired, false if locked by another user
 *
 * @example
 * ```ts
 * const canDrag = await startDragging('main', 'obj-123', 'user-1', {x: 100, y: 100}, 'John', '#ef4444');
 * if (!canDrag) {
 *   toast.error('Another user is editing this object');
 * }
 * ```
 */
export async function startDragging(
  canvasId: string,
  objectId: string,
  userId: string,
  position: { x: number; y: number },
  username: string,
  color: string
): Promise<boolean> {
  try {
    const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);

    // Check if object is already locked by another user
    const snapshot = await get(dragStateRef);
    if (snapshot.exists()) {
      const existingState = snapshot.val() as DragState;

      // Check if it's locked by a different user
      if (existingState.userId !== userId) {
        // Check if state is stale
        const now = Date.now();
        const timeSinceUpdate = now - existingState.lastUpdate;

        if (timeSinceUpdate < STALE_STATE_THRESHOLD) {
          // State is fresh, locked by another user
          return false;
        }
        // State is stale, we can take over
      }
    }

    // Create drag state
    const dragState: DragState = {
      userId,
      x: position.x,
      y: position.y,
      username,
      color,
      startedAt: Date.now(),
      lastUpdate: Date.now(),
    };

    // Set up automatic cleanup on disconnect
    await onDisconnect(dragStateRef).remove();

    // Set drag state
    await set(dragStateRef, dragState);

    return true;
  } catch {
    return false;
  }
}

/**
 * Update drag position during drag
 *
 * Updates the drag state with new position. This function is throttled
 * internally to 50ms to match cursor update frequency.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object being dragged
 * @param position - Current position {x, y}
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this on every onDragMove event
 * await updateDragPosition('main', 'obj-123', {x: 150, y: 200});
 * ```
 */
export async function updateDragPosition(
  canvasId: string,
  objectId: string,
  position: { x: number; y: number }
): Promise<void> {
  try {
    const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);

    // Atomically update position and timestamp in one operation
    // This prevents race conditions where partial state is received
    await update(dragStateRef, {
      x: position.x,
      y: position.y,
      lastUpdate: Date.now(),
    });
  } catch {
    // Don't throw - drag updates shouldn't break the app
  }
}

/**
 * Throttled version of updateDragPosition
 *
 * Use this in drag handlers to avoid excessive updates.
 * Throttles to 50ms (20 updates per second).
 *
 * @example
 * ```ts
 * onDragMove(e => {
 *   throttledUpdateDragPosition('main', objectId, {x: e.target.x(), y: e.target.y()});
 * });
 * ```
 */
export const throttledUpdateDragPosition = throttle(updateDragPosition, 50);

/**
 * End dragging an object
 *
 * Clears the drag state from Realtime Database. This unlocks the object
 * for other users to drag.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object that was being dragged
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this on onDragEnd event
 * await endDragging('main', 'obj-123');
 * ```
 */
export async function endDragging(
  canvasId: string,
  objectId: string
): Promise<void> {
  try {
    const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);

    // Cancel the onDisconnect handler (we're ending gracefully)
    await onDisconnect(dragStateRef).cancel();

    // Remove the drag state
    await remove(dragStateRef);
  } catch {
    // Don't throw - cleanup errors shouldn't break the app
  }
}

/**
 * Subscribe to all drag states for a canvas
 *
 * Listens to real-time updates of all drag states and filters out stale states.
 * The callback receives a map of objectId -> DragState.
 *
 * @param canvasId - Canvas identifier
 * @param callback - Function called with updated drag states
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToDragStates('main', (dragStates) => {
 *   // Process active drag states
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToDragStates(
  canvasId: string,
  callback: (dragStates: DragStateMap) => void
): () => void {
  const dragStatesRef = ref(realtimeDb, `canvases/${canvasId}/drag-states`);

  const unsubscribe = onValue(
    dragStatesRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        callback({});
        return;
      }

      // Filter out stale states
      const activeDragStates: DragStateMap = {};

      Object.entries(data).forEach(([objectId, state]) => {
        const dragState = state as DragState;

        if (!isDragStateStale(dragState)) {
          // State is fresh
          activeDragStates[objectId] = dragState;
        } else {
          // State is stale, remove it
          const staleRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
          remove(staleRef).catch(() => {
            // Silently fail
          });
        }
      });

      callback(activeDragStates);
    },
    () => {
      callback({});
    }
  );

  return unsubscribe;
}
