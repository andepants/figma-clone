/**
 * Resize State Service
 *
 * Manages real-time resize state synchronization using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/resize-states/{objectId}/
 *
 * Features:
 * - Real-time resize state broadcasting (all users see active resizes)
 * - Figma-style collaboration (no hard locks, last-writer-wins)
 * - Auto-cleanup on disconnect (browser crash, network loss)
 * - Throttled position updates (50ms via RESIZE_THROTTLE_MS)
 * - Tracks both start and current bounds for smooth interpolation
 *
 * Firebase RTDB Structure:
 * ```
 * /canvases/{canvasId}/resize-states/{objectId}/
 *   objectId: string          // ID of object being resized
 *   userId: string            // ID of user performing resize
 *   username: string          // Display name of user
 *   color: string             // User's assigned color (#hex)
 *   handle: 'nw'|'ne'|'sw'|'se' // Which corner handle is being dragged
 *   startBounds: {            // Object bounds when resize started (immutable)
 *     x: number
 *     y: number
 *     width: number
 *     height: number
 *   }
 *   currentBounds: {          // Current bounds during resize (updated in real-time)
 *     x: number
 *     y: number
 *     width: number
 *     height: number
 *   }
 *   anchor: {                 // Fixed opposite corner (immutable)
 *     x: number
 *     y: number
 *   }
 *   timestamp: number         // Unix timestamp of last update
 * ```
 */

import { ref, set, remove, update, onValue, onDisconnect } from 'firebase/database';
import { realtimeDb } from './config';
import { throttle } from '@/lib/utils';
import { getAnchorPoint } from '@/lib/utils';
import { RESIZE_THROTTLE_MS } from '@/constants';
import type { ResizeState, ResizeStateMap, ResizeHandle, Bounds } from '@/types';

/**
 * Start resizing an object
 *
 * Sets up the initial resize state in Realtime Database with automatic
 * cleanup on disconnect. Unlike drag locking, resize uses Figma-style
 * collaboration where multiple users can resize simultaneously (last-writer-wins).
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object being resized
 * @param userId - User performing the resize
 * @param handle - Which corner handle is being dragged ('nw', 'ne', 'sw', 'se')
 * @param bounds - Initial object bounds (x, y, width, height)
 * @param username - User's display name
 * @param color - User's assigned color for visual feedback
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await startResizing(
 *   'canvas-123',
 *   'rect-456',
 *   'user-789',
 *   'se',
 *   { x: 100, y: 100, width: 200, height: 150 },
 *   'Alice',
 *   '#ef4444'
 * );
 * ```
 */
export async function startResizing(
  canvasId: string,
  objectId: string,
  userId: string,
  handle: ResizeHandle,
  bounds: Bounds,
  username: string,
  color: string
): Promise<void> {
  const resizeStateRef = ref(realtimeDb, `canvases/${canvasId}/resize-states/${objectId}`);

  // Calculate anchor point (fixed opposite corner)
  const anchor = getAnchorPoint(handle, bounds);

  // Create resize state
  const resizeState: ResizeState = {
    objectId,
    userId,
    username,
    color,
    handle,
    startBounds: bounds,
    currentBounds: bounds, // Initially same as start
    anchor,
    timestamp: Date.now(),
  };

  // Set up automatic cleanup on disconnect
  // This ensures resize states are removed if user crashes or loses connection
  await onDisconnect(resizeStateRef).remove();

  // Set resize state in RTDB
  await set(resizeStateRef, resizeState);
}

/**
 * Update resize position during drag
 *
 * Updates only the currentBounds and timestamp fields while keeping
 * startBounds and anchor immutable. This function should be throttled
 * (use throttledUpdateResizePosition instead).
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object being resized
 * @param currentBounds - Current bounds during resize
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // DON'T use this directly - use throttledUpdateResizePosition instead
 * await updateResizePosition('canvas-123', 'rect-456', {
 *   x: 105, y: 110, width: 220, height: 160
 * });
 * ```
 */
export async function updateResizePosition(
  canvasId: string,
  objectId: string,
  currentBounds: Bounds
): Promise<void> {
  try {
    const resizeStateRef = ref(realtimeDb, `canvases/${canvasId}/resize-states/${objectId}`);

    // Atomically update only position and timestamp
    // Keep startBounds and anchor unchanged (immutable during resize)
    await update(resizeStateRef, {
      currentBounds,
      timestamp: Date.now(),
    });
  } catch {
    // Don't throw - resize updates shouldn't break the app
  }
}

/**
 * Throttled version of updateResizePosition
 *
 * Use this in resize drag handlers to avoid excessive updates.
 * Throttles to RESIZE_THROTTLE_MS (50ms = 20 updates per second).
 *
 * @example
 * ```ts
 * // Call this on every resize drag move
 * throttledUpdateResizePosition('canvas-123', 'rect-456', {
 *   x: newX, y: newY, width: newWidth, height: newHeight
 * });
 * ```
 */
export const throttledUpdateResizePosition = throttle(
  updateResizePosition,
  RESIZE_THROTTLE_MS
);

/**
 * End resizing an object
 *
 * Clears the resize state from Realtime Database. This should be called
 * AFTER the final object bounds have been updated to prevent flash-back.
 *
 * Important: Call this AFTER updateCanvasObject to ensure smooth transition:
 * 1. Update object with final bounds
 * 2. Clear resize state
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object that was being resized
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call this on resize end (after updating object)
 * await updateCanvasObject(canvasId, objectId, finalBounds); // First
 * await endResizing(canvasId, objectId);                     // Then
 * ```
 */
export async function endResizing(
  canvasId: string,
  objectId: string
): Promise<void> {
  try {
    const resizeStateRef = ref(realtimeDb, `canvases/${canvasId}/resize-states/${objectId}`);

    // Cancel the onDisconnect handler (we're ending gracefully)
    await onDisconnect(resizeStateRef).cancel();

    // Remove the resize state
    await remove(resizeStateRef);
  } catch {
    // Don't throw - cleanup errors shouldn't break the app
  }
}

/**
 * Subscribe to all resize states for a canvas
 *
 * Listens to real-time updates of all resize states. The callback receives
 * a map of objectId -> ResizeState for all active resizes.
 *
 * Unlike drag states, resize states don't filter by user since we want to
 * show all users' resize operations (Figma-style collaboration).
 *
 * @param canvasId - Canvas identifier
 * @param callback - Function called with updated resize states
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToResizeStates('canvas-123', (resizeStates) => {
 *   // Process active resize states
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToResizeStates(
  canvasId: string,
  callback: (resizeStates: ResizeStateMap) => void
): () => void {
  const resizeStatesRef = ref(realtimeDb, `canvases/${canvasId}/resize-states`);

  const unsubscribe = onValue(
    resizeStatesRef,
    (snapshot) => {
      const data = snapshot.val();

      // Handle null snapshot (no active resizes)
      if (!data) {
        callback({});
        return;
      }

      // Convert snapshot to ResizeStateMap
      const resizeStates: ResizeStateMap = data as ResizeStateMap;
      callback(resizeStates);
    },
    () => {
      // On error, return empty map
      callback({});
    }
  );

  return unsubscribe;
}
