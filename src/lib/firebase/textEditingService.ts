/**
 * Text Editing Service
 *
 * Manages real-time text editing state synchronization using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/edit-states/{textId}/
 *
 * Features:
 * - Edit locking (first user to edit gets exclusive control)
 * - Auto-cleanup on disconnect (browser crash, network loss)
 * - Heartbeat updates to keep lock alive
 * - Stale state detection and cleanup (30 seconds timeout)
 */

import { ref, set, get, remove, update, onValue, onDisconnect } from 'firebase/database';
import { realtimeDb } from './config';
import { throttle } from '../utils/throttle';

/**
 * Text editing state
 * Tracks which user is currently editing a text object
 *
 * RTDB Structure: /canvases/{canvasId}/edit-states/{textId}/
 * - userId: string - User ID of editor
 * - username: string - Display name of editor
 * - color: string - User's assigned color
 * - startedAt: number - Timestamp when editing started
 * - lastUpdate: number - Timestamp of last update (heartbeat)
 * - liveText?: string - Current text content (updated while typing, throttled to 100ms)
 */
export interface EditState {
  userId: string;
  username: string;
  color: string;
  startedAt: number;
  lastUpdate: number;
  liveText?: string; // Real-time text content (optional, added on first keystroke)
}

/**
 * Map of text IDs to their edit states
 */
export type EditStateMap = Record<string, EditState>;

/**
 * Start editing a text object
 *
 * Attempts to acquire an edit lock on the text. If another user is already
 * editing, returns false. Otherwise, sets up the edit state with automatic
 * cleanup on disconnect.
 *
 * @param canvasId - Canvas identifier
 * @param textId - Text object being edited
 * @param userId - User performing the edit
 * @param username - User's display name
 * @param color - User's assigned color
 * @returns Promise<boolean> - true if edit lock acquired, false if locked by another user
 *
 * @example
 * ```ts
 * const canEdit = await startEditing('main', 'text-123', 'user-1', 'John', '#ef4444');
 * if (!canEdit) {
 *   toast.error('Another user is editing this text');
 * }
 * ```
 */
export async function startEditing(
  canvasId: string,
  textId: string,
  userId: string,
  username: string,
  color: string
): Promise<boolean> {
  try {
    const editStateRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);

    // Check if text is already locked
    const snapshot = await get(editStateRef);
    if (snapshot.exists()) {
      const existingState = snapshot.val() as EditState;

      // Check if it's locked by the SAME user (re-acquiring own lock)
      if (existingState.userId === userId) {
        // Same user - just refresh the timestamp and return success
        // Don't set up a new onDisconnect handler (avoid stacking handlers)
        await update(editStateRef, {
          lastUpdate: Date.now(),
        });
        return true;
      }

      // Different user - check if their lock is stale
      const now = Date.now();
      const timeSinceUpdate = now - existingState.lastUpdate;

      if (timeSinceUpdate < 30000) {
        // State is fresh, locked by another user
        return false;
      }
    }

    // Create edit state (either new lock or taking over stale one)
    const editState: EditState = {
      userId,
      username,
      color,
      startedAt: Date.now(),
      lastUpdate: Date.now(),
    };

    // Set up automatic cleanup on disconnect
    // IMPORTANT: Cancel any existing onDisconnect handler first to avoid stacking
    await onDisconnect(editStateRef).cancel();
    await onDisconnect(editStateRef).remove();

    // Set edit state
    await set(editStateRef, editState);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Update edit heartbeat
 *
 * Updates the lastUpdate timestamp to keep the lock alive. Call this
 * periodically (every 5-10 seconds) while editing to prevent timeout.
 *
 * @param canvasId - Canvas identifier
 * @param textId - Text object being edited
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this every 5 seconds while editing
 * setInterval(() => {
 *   updateEditHeartbeat('main', 'text-123');
 * }, 5000);
 * ```
 */
export async function updateEditHeartbeat(
  canvasId: string,
  textId: string
): Promise<void> {
  try {
    const editStateRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);

    await update(editStateRef, {
      lastUpdate: Date.now(),
    });
  } catch (error) {
    // Don't throw - heartbeat updates shouldn't break the app
  }
}

/**
 * Update live text content during editing
 *
 * Updates the liveText field in edit state so other users can see
 * text content as it's being typed. Should be called with throttling
 * (~100ms) to avoid excessive RTDB writes.
 *
 * @param canvasId - Canvas identifier
 * @param textId - Text object being edited
 * @param liveText - Current text content
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this while typing (throttled)
 * throttledUpdateLiveText('main', 'text-123', 'Hello World...');
 * ```
 */
export async function updateLiveText(
  canvasId: string,
  textId: string,
  liveText: string
): Promise<void> {
  try {
    const editStateRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);

    await update(editStateRef, {
      liveText,
      lastUpdate: Date.now(), // Update heartbeat too
    });
  } catch (error) {
    // Don't throw - live updates shouldn't break the app
  }
}

/**
 * Throttled version of updateLiveText (100ms)
 *
 * Use this to update live text during typing to avoid excessive writes.
 * Throttles updates to max 10 writes/second for optimal performance.
 */
export const throttledUpdateLiveText = throttle(updateLiveText, 100);

/**
 * End editing a text object
 *
 * Clears the edit state from Realtime Database. This unlocks the text
 * for other users to edit.
 *
 * @param canvasId - Canvas identifier
 * @param textId - Text object that was being edited
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this when exiting edit mode
 * await endEditing('main', 'text-123');
 * ```
 */
export async function endEditing(
  canvasId: string,
  textId: string
): Promise<void> {
  try {
    const editStateRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);

    // Cancel the onDisconnect handler (we're ending gracefully)
    await onDisconnect(editStateRef).cancel();

    // Remove the edit state
    await remove(editStateRef);
  } catch (error) {
    // Don't throw - cleanup errors shouldn't break the app
  }
}

/**
 * Check if a text is locked by another user
 *
 * Returns the edit state if locked, null if unlocked or if the
 * current user is the one editing.
 *
 * @param canvasId - Canvas identifier
 * @param textId - Text object to check
 * @param currentUserId - Current user's ID
 * @returns Promise<EditState | null> - Edit state if locked by another user, null otherwise
 *
 * @example
 * ```ts
 * const lockState = await checkEditLock('main', 'text-123', 'user-2');
 * if (lockState) {
 *   toast.error(`${lockState.username} is editing this text`);
 * }
 * ```
 */
export async function checkEditLock(
  canvasId: string,
  textId: string,
  currentUserId: string
): Promise<EditState | null> {
  try {
    const editStateRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);
    const snapshot = await get(editStateRef);

    if (!snapshot.exists()) {
      return null; // No lock
    }

    const editState = snapshot.val() as EditState;

    // Check if it's the current user
    if (editState.userId === currentUserId) {
      return null; // Current user's own lock
    }

    // Check if state is stale (> 30 seconds old)
    const now = Date.now();
    const timeSinceUpdate = now - editState.lastUpdate;

    if (timeSinceUpdate > 30000) {
      // State is stale, clean it up
      await remove(editStateRef);
      return null;
    }

    // Locked by another user
    return editState;
  } catch (error) {
    return null;
  }
}

/**
 * Subscribe to all edit states for a canvas
 *
 * Listens to real-time updates of all edit states and filters out stale states.
 * The callback receives a map of textId -> EditState.
 *
 * @param canvasId - Canvas identifier
 * @param callback - Function called with updated edit states
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToEditStates('main', (editStates) => {
 *   // Process active edit states
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToEditStates(
  canvasId: string,
  callback: (editStates: EditStateMap) => void
): () => void {
  const editStatesRef = ref(realtimeDb, `canvases/${canvasId}/edit-states`);

  const unsubscribe = onValue(
    editStatesRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        callback({});
        return;
      }

      // Filter out stale states (> 30 seconds old)
      const now = Date.now();
      const activeEditStates: EditStateMap = {};

      Object.entries(data).forEach(([textId, state]) => {
        const editState = state as EditState;
        const timeSinceUpdate = now - editState.lastUpdate;

        if (timeSinceUpdate <= 30000) {
          // State is fresh
          activeEditStates[textId] = editState;
        } else {
          // State is stale, remove it
          const staleRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);
          remove(staleRef).catch((err) => {
          });
        }
      });

      callback(activeEditStates);
    },
    (error) => {
      callback({});
    }
  );

  return unsubscribe;
}

/**
 * Clean up all stale edit states for a canvas
 *
 * Removes edit states that haven't been updated in the last 30 seconds.
 * This is a maintenance function that should be called periodically or
 * when entering a canvas.
 *
 * @param canvasId - Canvas identifier
 * @returns Promise<number> - Number of stale states removed
 *
 * @example
 * ```ts
 * // Call when entering a canvas or periodically
 * await cleanupStaleEditStates('main');
 * ```
 */
export async function cleanupStaleEditStates(canvasId: string): Promise<number> {
  try {
    const editStatesRef = ref(realtimeDb, `canvases/${canvasId}/edit-states`);
    const snapshot = await get(editStatesRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    const now = Date.now();
    let removedCount = 0;

    const removalPromises = Object.entries(data).map(async ([textId, state]) => {
      const editState = state as EditState;
      const timeSinceUpdate = now - editState.lastUpdate;

      if (timeSinceUpdate > 30000) {
        const staleRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);
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
