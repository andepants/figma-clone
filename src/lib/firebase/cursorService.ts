/**
 * Firebase Cursor Service
 *
 * Manages real-time cursor positions using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/cursors/{userId}/
 *
 * Uses 50ms throttle for optimal performance with minimal latency.
 */

import { ref, set, onValue, serverTimestamp, onDisconnect, remove, get } from 'firebase/database'
import { realtimeDb } from './config'

/**
 * Cursor position data structure
 */
export interface CursorData {
  x: number
  y: number
  username: string
  color: string
  lastUpdate: number | object // number for reads, object (serverTimestamp) for writes
}

/**
 * Cursor data with userId
 */
export interface CursorWithUser extends CursorData {
  userId: string
}

/**
 * Update cursor position for a user
 *
 * Automatically sets up onDisconnect() cleanup to remove the cursor
 * when the user disconnects (browser close, crash, network loss).
 *
 * @param canvasId - Canvas identifier
 * @param userId - User identifier
 * @param position - Cursor x, y coordinates
 * @param username - User's display name
 * @param color - User's assigned color
 * @returns Promise that resolves when update is complete
 */
export async function updateCursor(
  canvasId: string,
  userId: string,
  position: { x: number; y: number },
  username: string,
  color: string
): Promise<void> {
  try {
    const cursorRef = ref(realtimeDb, `canvases/${canvasId}/cursors/${userId}`)

    const cursorData: CursorData = {
      x: position.x,
      y: position.y,
      username,
      color,
      lastUpdate: serverTimestamp(),
    }

    // Set up automatic cleanup on disconnect (browser close, crash, network loss)
    await onDisconnect(cursorRef).remove()

    // Update cursor position
    await set(cursorRef, cursorData)
  } catch (error) {
    console.error('Failed to update cursor:', error)
    // Don't throw - cursor updates shouldn't break the app
  }
}

/**
 * Remove cursor for a user
 *
 * Manually removes a user's cursor from the canvas. This is useful for
 * explicit cleanup scenarios like logout or leaving the canvas.
 *
 * @param canvasId - Canvas identifier
 * @param userId - User identifier
 * @returns Promise that resolves when cursor is removed
 *
 * @example
 * ```ts
 * // Remove cursor on logout
 * await removeCursor('main', userId);
 * ```
 */
export async function removeCursor(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    const cursorRef = ref(realtimeDb, `canvases/${canvasId}/cursors/${userId}`)

    // Cancel the onDisconnect handler (we're removing manually)
    await onDisconnect(cursorRef).cancel()

    // Remove the cursor
    await remove(cursorRef)
  } catch (error) {
    console.error('Failed to remove cursor:', error)
    // Don't throw - cleanup errors shouldn't break the app
  }
}

/**
 * Subscribe to all cursor positions for a canvas
 *
 * @param canvasId - Canvas identifier
 * @param callback - Function called with updated cursor data
 * @returns Unsubscribe function
 */
export function subscribeToCursors(
  canvasId: string,
  callback: (cursors: CursorWithUser[]) => void
): () => void {
  const cursorsRef = ref(realtimeDb, `canvases/${canvasId}/cursors`)

  const unsubscribe = onValue(
    cursorsRef,
    (snapshot) => {
      const cursorsData = snapshot.val()

      if (!cursorsData) {
        callback([])
        return
      }

      // Convert object to array with userId included
      const cursors: CursorWithUser[] = Object.entries(cursorsData).map(
        ([userId, data]) => ({
          userId,
          ...(data as CursorData),
        })
      )

      callback(cursors)
    },
    (error) => {
      // Error callback - handles permission denied, network issues, etc.
      console.error('Firebase cursor subscription error:', error)
      // Call callback with empty array so app doesn't break
      callback([])
    }
  )

  return unsubscribe
}

/**
 * Create a throttled version of updateCursor for optimal performance
 * Throttles updates to 50ms to balance responsiveness with performance
 */
import { throttle } from '../utils/throttle'

export const throttledUpdateCursor = throttle(updateCursor, 50)

/**
 * Clean up all stale cursors for a canvas
 *
 * Removes cursor data that hasn't been updated in the last 10 seconds.
 * This is a maintenance function that should be called when entering a canvas
 * to clean up leftover cursor data from previous sessions.
 *
 * @param canvasId - Canvas identifier
 * @returns Promise<number> - Number of stale cursors removed
 *
 * @example
 * ```ts
 * // Call when entering a canvas
 * const removed = await cleanupStaleCursors('main');
 * if (removed > 0) {
 *   console.log(`Cleaned up ${removed} stale cursors`);
 * }
 * ```
 */
export async function cleanupStaleCursors(canvasId: string): Promise<number> {
  try {
    const cursorsRef = ref(realtimeDb, `canvases/${canvasId}/cursors`)
    const snapshot = await get(cursorsRef)

    if (!snapshot.exists()) {
      return 0
    }

    const data = snapshot.val()
    const now = Date.now()
    let removedCount = 0

    // Remove cursors that haven't been updated in the last 10 seconds
    const removalPromises = Object.entries(data).map(async ([userId, cursor]) => {
      const cursorData = cursor as CursorData
      const lastUpdate = typeof cursorData.lastUpdate === 'number'
        ? cursorData.lastUpdate
        : Date.now()

      const timeSinceUpdate = now - lastUpdate

      if (timeSinceUpdate > 10000) {
        const staleRef = ref(realtimeDb, `canvases/${canvasId}/cursors/${userId}`)
        await remove(staleRef)
        removedCount++
      }
    })

    await Promise.all(removalPromises)
    return removedCount
  } catch (error) {
    console.error('Failed to cleanup stale cursors:', error)
    return 0
  }
}
