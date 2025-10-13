/**
 * Firebase Cursor Service
 *
 * Manages real-time cursor positions using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/cursors/{userId}/
 *
 * Uses 50ms throttle for optimal performance with minimal latency.
 */

import { ref, set, onValue, serverTimestamp } from 'firebase/database'
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

    await set(cursorRef, cursorData)
  } catch (error) {
    console.error('Failed to update cursor:', error)
    // Don't throw - cursor updates shouldn't break the app
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
