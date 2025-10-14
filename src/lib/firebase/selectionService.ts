/**
 * Selection Service
 *
 * Manages real-time selection state synchronization using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/selections/{userId}/
 *
 * Features:
 * - Track what each user has selected
 * - Auto-cleanup on disconnect
 * - Filter out own selection for rendering
 */

import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
import { realtimeDb } from './config';
import type { SelectionState, SelectionStateMap } from '@/types';

/**
 * Update user's selection (supports multi-select)
 *
 * Sets or updates the user's current selection. Automatically cleans up
 * on disconnect. Pass empty array to clear selection.
 *
 * @param canvasId - Canvas identifier
 * @param userId - User making the selection
 * @param objectIds - Array of selected object IDs (empty array to deselect)
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Select multiple objects
 * await updateSelection('main', 'user-1', ['obj-123', 'obj-456']);
 *
 * // Select single object
 * await updateSelection('main', 'user-1', ['obj-123']);
 *
 * // Deselect all
 * await updateSelection('main', 'user-1', []);
 * ```
 */
export async function updateSelection(
  canvasId: string,
  userId: string,
  objectIds: string[]
): Promise<void> {
  try {
    const selectionRef = ref(realtimeDb, `canvases/${canvasId}/selections/${userId}`);

    if (objectIds.length === 0) {
      // Clear selection (empty array means no selection)
      await remove(selectionRef);
      return;
    }

    // Set selection state
    const selectionState: SelectionState = {
      objectIds,
      timestamp: Date.now(),
    };

    // Set up automatic cleanup on disconnect
    await onDisconnect(selectionRef).remove();

    // Set selection
    await set(selectionRef, selectionState);
  } catch {
    // Don't throw - selection updates shouldn't break the app
  }
}

/**
 * Clear user's selection
 *
 * Removes the user's selection state from Realtime Database.
 *
 * @param canvasId - Canvas identifier
 * @param userId - User whose selection to clear
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await clearSelection('main', 'user-1');
 * ```
 */
export async function clearSelection(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    const selectionRef = ref(realtimeDb, `canvases/${canvasId}/selections/${userId}`);

    // Cancel the onDisconnect handler
    await onDisconnect(selectionRef).cancel();

    // Remove the selection
    await remove(selectionRef);
  } catch {
    // Don't throw - cleanup errors shouldn't break the app
  }
}

/**
 * Subscribe to all selections for a canvas
 *
 * Listens to real-time updates of all user selections.
 * The callback receives a map of userId -> SelectionState.
 *
 * @param canvasId - Canvas identifier
 * @param callback - Function called with updated selections
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToSelections('main', (selections) => {
 *   // Process active selections
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToSelections(
  canvasId: string,
  callback: (selections: SelectionStateMap) => void
): () => void {
  const selectionsRef = ref(realtimeDb, `canvases/${canvasId}/selections`);

  const unsubscribe = onValue(
    selectionsRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        callback({});
        return;
      }

      // Convert to SelectionStateMap
      const selections: SelectionStateMap = {};
      Object.entries(data).forEach(([userId, state]) => {
        selections[userId] = state as SelectionState;
      });

      callback(selections);
    },
    () => {
      callback({});
    }
  );

  return unsubscribe;
}

/**
 * Set user online with selection cleanup
 *
 * Helper function to set up presence with selection cleanup.
 * This ensures selections are cleared when a user disconnects.
 *
 * @param canvasId - Canvas identifier
 * @param userId - User ID
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call when user enters canvas
 * await setOnlineWithSelectionCleanup('main', 'user-1');
 * ```
 */
export async function setOnlineWithSelectionCleanup(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    const selectionRef = ref(realtimeDb, `canvases/${canvasId}/selections/${userId}`);

    // Set up automatic selection cleanup on disconnect
    await onDisconnect(selectionRef).remove();
  } catch {
    // Silently fail - cleanup errors shouldn't break the app
  }
}
