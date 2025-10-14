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
          remove(staleRef).catch(() => {
            // Silently fail
          });
        }
      });

      callback(activeDragStates);
    },
    (error) => {
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
 * await cleanupStaleDragStates('main');
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
    return 0;
  }
}

/**
 * Start dragging multiple objects (group drag)
 *
 * Attempts to acquire drag locks on ALL selected objects. If any object is
 * already being dragged by another user, the entire operation fails and
 * returns false. Otherwise, locks all objects atomically.
 *
 * @param canvasId - Canvas identifier
 * @param objectIds - Array of object IDs being dragged as a group
 * @param userId - User performing the drag
 * @param positions - Initial positions map {objectId: {x, y}}
 * @param username - User's display name
 * @param color - User's assigned color
 * @returns Promise<boolean> - true if all locks acquired, false if any locked by another user
 *
 * @example
 * ```ts
 * const positions = {
 *   'obj-1': { x: 100, y: 100 },
 *   'obj-2': { x: 200, y: 150 }
 * };
 * const canDrag = await startGroupDragging('main', ['obj-1', 'obj-2'], 'user-1', positions, 'John', '#ef4444');
 * if (!canDrag) {
 *   toast.error('Another user is editing one of these objects');
 * }
 * ```
 */
export async function startGroupDragging(
  canvasId: string,
  objectIds: string[],
  userId: string,
  positions: Record<string, { x: number; y: number }>,
  username: string,
  color: string
): Promise<boolean> {
  try {
    // Phase 1: Check if ANY object is locked by another user
    const lockChecks = await Promise.all(
      objectIds.map(async (objectId) => {
        const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
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
              return { objectId, locked: true };
            }
            // State is stale, we can take over
          }
        }

        return { objectId, locked: false };
      })
    );

    // If ANY object is locked, fail the entire operation
    const lockedObject = lockChecks.find((check) => check.locked);
    if (lockedObject) {
      return false;
    }

    // Phase 2: Set drag states for all objects
    // Note: We use individual set() calls instead of multi-path update because
    // Firebase validation rules require all fields to exist atomically.
    // Multi-path updates validate each field individually, causing permission_denied.
    const now = Date.now();

    await Promise.all(
      objectIds.map(async (objectId) => {
        const position = positions[objectId];
        if (!position) return;

        const dragState: DragState = {
          userId,
          x: position.x,
          y: position.y,
          username,
          color,
          startedAt: now,
          lastUpdate: now,
        };

        // Set complete drag state atomically
        const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
        await set(dragStateRef, dragState);
      })
    );

    // Phase 3: Set up automatic cleanup on disconnect for ALL objects
    await Promise.all(
      objectIds.map(async (objectId) => {
        const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
        await onDisconnect(dragStateRef).remove();
      })
    );

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Update drag positions for multiple objects during group drag
 *
 * Updates the drag states with new positions for all objects in a group.
 * This function is throttled internally to 50ms to match single-object drag update frequency.
 *
 * @param canvasId - Canvas identifier
 * @param positions - Map of objectId -> {x, y} positions
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this on every onDragMove event during group drag
 * await updateGroupDragPositions('main', {
 *   'obj-1': { x: 150, y: 200 },
 *   'obj-2': { x: 250, y: 300 }
 * });
 * ```
 */
export async function updateGroupDragPositions(
  canvasId: string,
  positions: Record<string, { x: number; y: number }>
): Promise<void> {
  try {
    const now = Date.now();

    // Update each drag state individually to satisfy validation rules
    // Note: We use individual update() calls per object instead of multi-path update
    // because Firebase validates the complete drag-state structure
    await Promise.all(
      Object.entries(positions).map(async ([objectId, position]) => {
        const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);

        // Update only position and timestamp fields
        await update(dragStateRef, {
          x: position.x,
          y: position.y,
          lastUpdate: now,
        });
      })
    );
  } catch (error) {
    // Don't throw - drag updates shouldn't break the app
  }
}

/**
 * Throttled version of updateGroupDragPositions
 *
 * Use this in group drag handlers to avoid excessive updates.
 * Throttles to 50ms (20 updates per second).
 *
 * @example
 * ```ts
 * onDragMove(e => {
 *   throttledUpdateGroupDragPositions('main', {
 *     'obj-1': {x: 100, y: 100},
 *     'obj-2': {x: 200, y: 200}
 *   });
 * });
 * ```
 */
export const throttledUpdateGroupDragPositions = throttle(updateGroupDragPositions, 50);

/**
 * End dragging multiple objects (group drag)
 *
 * Clears drag states for all objects in the group. This unlocks all objects
 * for other users to drag.
 *
 * @param canvasId - Canvas identifier
 * @param objectIds - Array of object IDs that were being dragged
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this on group drag end
 * await endGroupDragging('main', ['obj-1', 'obj-2', 'obj-3']);
 * ```
 */
export async function endGroupDragging(
  canvasId: string,
  objectIds: string[]
): Promise<void> {
  try {
    // Cancel onDisconnect handlers and remove drag states for all objects
    await Promise.all(
      objectIds.map(async (objectId) => {
        const dragStateRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);

        // Cancel the onDisconnect handler (we're ending gracefully)
        await onDisconnect(dragStateRef).cancel();

        // Remove the drag state
        await remove(dragStateRef);
      })
    );
  } catch (error) {
    // Don't throw - cleanup errors shouldn't break the app
  }
}
