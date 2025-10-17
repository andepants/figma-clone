/**
 * Drag State Helpers
 *
 * Shared utilities for drag state management across single and group dragging.
 * Contains common validation, cleanup, and lock checking functions.
 *
 * Features:
 * - Stale state detection and cleanup (> 5 seconds old)
 * - Drag lock validation
 * - Timestamp validation
 */

import { ref, get, remove } from 'firebase/database';
import { realtimeDb } from './config';
import type { DragState } from '@/types';

/**
 * Stale state threshold in milliseconds (5 seconds)
 *
 * Drag states older than this are considered abandoned and can be cleaned up.
 */
export const STALE_STATE_THRESHOLD = 5000;

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

    // Check if state is stale
    const now = Date.now();
    const timeSinceUpdate = now - dragState.lastUpdate;

    if (timeSinceUpdate > STALE_STATE_THRESHOLD) {
      // State is stale, clean it up
      await remove(dragStateRef);
      return null;
    }

    // Locked by another user
    return dragState;
  } catch {
    return null;
  }
}

/**
 * Check if a drag state is stale
 *
 * @param dragState - Drag state to check
 * @returns boolean - true if state is stale (> 5 seconds old)
 */
export function isDragStateStale(dragState: DragState): boolean {
  const now = Date.now();
  const timeSinceUpdate = now - dragState.lastUpdate;
  return timeSinceUpdate > STALE_STATE_THRESHOLD;
}

/**
 * Check if a drag state is locked by another user
 *
 * @param dragState - Drag state to check
 * @param currentUserId - Current user's ID
 * @returns boolean - true if locked by different user and not stale
 */
export function isLockedByOtherUser(
  dragState: DragState,
  currentUserId: string
): boolean {
  // Same user = not locked
  if (dragState.userId === currentUserId) {
    return false;
  }

  // Stale state = not locked
  if (isDragStateStale(dragState)) {
    return false;
  }

  // Different user + fresh state = locked
  return true;
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

      if (timeSinceUpdate > STALE_STATE_THRESHOLD) {
        const staleRef = ref(realtimeDb, `canvases/${canvasId}/drag-states/${objectId}`);
        await remove(staleRef);
        removedCount++;
      }
    });

    await Promise.all(removalPromises);
    return removedCount;
  } catch {
    return 0;
  }
}
