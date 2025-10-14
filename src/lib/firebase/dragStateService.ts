/**
 * Drag State Service
 *
 * Manages real-time drag state synchronization using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/drag-states/{objectId}/
 *
 * Features:
 * - Drag locking (first user to drag gets exclusive control)
 * - Auto-cleanup on disconnect (browser crash, network loss)
 * - Throttled position updates (50ms)
 * - Stale state detection and cleanup
 */

import { ref, set, get, remove, update, onValue, onDisconnect } from 'firebase/database';
import { realtimeDb } from './config';
import { throttle } from '@/lib/utils';
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
        // Check if state is stale (> 5 seconds old)
        const now = Date.now();
        const timeSinceUpdate = now - existingState.lastUpdate;

        if (timeSinceUpdate < 5000) {
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
  } catch (error) {
    console.error('Failed to start dragging:', error);
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
  } catch (error) {
    console.error('Failed to update drag position:', error);
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
  } catch (error) {
    console.error('Failed to end dragging:', error);
    // Don't throw - cleanup errors shouldn't break the app
  }
}

/**
 * Check if an object is locked by another user
 *
 * Returns the drag state if locked, null if unlocked or if the
 * current user is the one dragging.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object to check
 * @param currentUserId - Current user's ID
 * @returns Promise<DragState | null> - Drag state if locked by another user, null otherwise
 *
 * @example
 * ```ts
 * const lockState = await checkDragLock('main', 'obj-123', 'user-2');
 * if (lockState) {
 *   toast.error(`${lockState.username} is editing this object`);
 * }
 * ```
 */
export async function checkDragLock(
  canvasId: string,
  objectId: string,
  currentUserId: string
): Promise<DragState | null> {
  try {
    const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
    const snapshot = await get(dragStateRef);

    if (!snapshot.exists()) {
      return null; // No lock
    }

    const dragState = snapshot.val() as DragState;

    // Check if it's the current user
    if (dragState.userId === currentUserId) {
      return null; // Current user's own lock
    }

    // Check if state is stale (> 5 seconds old)
    const now = Date.now();
    const timeSinceUpdate = now - dragState.lastUpdate;

    if (timeSinceUpdate > 5000) {
      // State is stale, clean it up
      await remove(dragStateRef);
      return null;
    }

    // Locked by another user
    return dragState;
  } catch (error) {
    console.error('Failed to check drag lock:', error);
    return null;
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
 *   console.log('Active drags:', Object.keys(dragStates).length);
 *   Object.entries(dragStates).forEach(([objectId, state]) => {
 *     console.log(`${state.username} is dragging ${objectId}`);
 *   });
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

      // Filter out stale states (> 5 seconds old)
      const now = Date.now();
      const activeDragStates: DragStateMap = {};

      Object.entries(data).forEach(([objectId, state]) => {
        const dragState = state as DragState;
        const timeSinceUpdate = now - dragState.lastUpdate;

        if (timeSinceUpdate <= 5000) {
          // State is fresh
          activeDragStates[objectId] = dragState;
        } else {
          // State is stale, remove it
          const staleRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
          remove(staleRef).catch((err) => {
            console.error('Failed to remove stale drag state:', err);
          });
        }
      });

      callback(activeDragStates);
    },
    (error) => {
      console.error('Firebase drag states subscription error:', error);
      callback({});
    }
  );

  return unsubscribe;
}

/**
 * Clean up all stale drag states for a canvas
 *
 * Removes drag states that haven't been updated in the last 5 seconds.
 * This is a maintenance function that should be called periodically or
 * when entering a canvas.
 *
 * @param canvasId - Canvas identifier
 * @returns Promise<number> - Number of stale states removed
 *
 * @example
 * ```ts
 * // Call when entering a canvas or periodically
 * const removed = await cleanupStaleDragStates('main');
 * console.log(`Cleaned up ${removed} stale drag states`);
 * ```
 */
export async function cleanupStaleDragStates(canvasId: string): Promise<number> {
  try {
    const dragStatesRef = ref(realtimeDb, `canvases/${canvasId}/drag-states`);
    const snapshot = await get(dragStatesRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    const now = Date.now();
    let removedCount = 0;

    const removalPromises = Object.entries(data).map(async ([objectId, state]) => {
      const dragState = state as DragState;
      const timeSinceUpdate = now - dragState.lastUpdate;

      if (timeSinceUpdate > 5000) {
        const staleRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
        await remove(staleRef);
        removedCount++;
      }
    });

    await Promise.all(removalPromises);
    return removedCount;
  } catch (error) {
    console.error('Failed to cleanup stale drag states:', error);
    return 0;
  }
}
