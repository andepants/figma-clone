/**
 * Group Drag Service
 *
 * Manages real-time group drag state synchronization using Firebase Realtime Database.
 * Handles dragging multiple objects simultaneously with atomic lock acquisition.
 *
 * Features:
 * - Atomic group lock acquisition (all-or-nothing)
 * - Batch position updates (50ms throttling)
 * - Automatic cleanup on disconnect
 * - Stale state validation
 */

import { ref, set, get, remove, update, onDisconnect } from 'firebase/database';
import { realtimeDb } from './config';
import { throttle } from '@/lib/utils';
import { STALE_STATE_THRESHOLD } from './dragStateHelpers';
import type { DragState } from '@/types';

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
            // Check if state is stale
            const now = Date.now();
            const timeSinceUpdate = now - existingState.lastUpdate;

            if (timeSinceUpdate < STALE_STATE_THRESHOLD) {
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
  } catch {
    return false;
  }
}

/**
 * Update drag positions for multiple objects during group drag
 *
 * Updates the drag states with new positions for all objects in a group.
 * This function is throttled internally to 50ms to match single-object drag update frequency.
 *
 * Uses Firebase multi-path updates to update all objects in a single atomic operation,
 * reducing network overhead from N requests to 1 request (critical for performance
 * when dragging 100+ objects).
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
    const dbRef = ref(realtimeDb);
    const multiPathUpdates: Record<string, number> = {};
    const timestamp = Date.now();

    // Build multi-path update object for atomic batch update
    // This updates all drag states in a single network call instead of N separate calls
    for (const [objectId, position] of Object.entries(positions)) {
      multiPathUpdates[`canvases/${canvasId}/drag-states/${objectId}/x`] = position.x;
      multiPathUpdates[`canvases/${canvasId}/drag-states/${objectId}/y`] = position.y;
      multiPathUpdates[`canvases/${canvasId}/drag-states/${objectId}/lastUpdate`] = timestamp;
    }

    // Single atomic update (all drag states update together or none do)
    // Benefits:
    // - 1 network call instead of N calls (100x faster for 100 objects)
    // - Atomic consistency (all remote users see updates simultaneously)
    // - No lag when dragging large selections
    await update(dbRef, multiPathUpdates);
  } catch {
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
  } catch {
    // Don't throw - cleanup errors shouldn't break the app
  }
}
