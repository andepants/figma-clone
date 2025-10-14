/**
 * Firebase Presence Service
 *
 * Manages user presence (online/offline status) using Firebase Realtime Database.
 * Structure: /canvases/{canvasId}/presence/{userId}/
 *
 * Uses Firebase's onDisconnect() feature to automatically mark users offline
 * when they disconnect, handling browser crashes, network issues, etc.
 */

import { ref, set, onValue, serverTimestamp, onDisconnect } from 'firebase/database'
import { realtimeDb } from './config'

/**
 * Presence data structure
 */
export interface PresenceData {
  username: string
  online: boolean
  lastSeen: number | object // number for reads, object (serverTimestamp) for writes
}

/**
 * Presence data with userId
 */
export interface PresenceWithUser extends PresenceData {
  userId: string
  lastSeen: number // Always number when read from DB
}

/**
 * Set user as online and configure automatic offline on disconnect
 *
 * This function:
 * 1. Marks the user as online immediately
 * 2. Sets up onDisconnect() to mark them offline when they disconnect
 * 3. Handles browser crashes, network issues, tab closes automatically
 *
 * @param canvasId - Canvas identifier
 * @param userId - User identifier
 * @param username - User's display name or email
 * @returns Promise that resolves when online status is set
 *
 * @example
 * ```ts
 * useEffect(() => {
 *   const username = currentUser.username || currentUser.email || 'Anonymous'
 *   setOnline('main', currentUser.uid, username)
 * }, [currentUser])
 * ```
 */
export async function setOnline(
  canvasId: string,
  userId: string,
  username: string
): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `canvases/${canvasId}/presence/${userId}`)

    // Set up automatic offline on disconnect (handles crashes, network loss, etc.)
    await onDisconnect(presenceRef).set({
      username,
      online: false,
      lastSeen: serverTimestamp(),
    } as PresenceData)

    // Set user as online now
    await set(presenceRef, {
      username,
      online: true,
      lastSeen: serverTimestamp(),
    } as PresenceData)

    console.log(`Presence: User ${username} set online with auto-disconnect cleanup`)
  } catch (error) {
    console.error('Failed to set user online:', error)
    throw error
  }
}

/**
 * Manually set user as offline
 *
 * Call this when user explicitly logs out or leaves the canvas.
 * For automatic offline on disconnect, onDisconnect() is already configured in setOnline().
 *
 * @param canvasId - Canvas identifier
 * @param userId - User identifier
 * @param username - User's display name or email
 * @returns Promise that resolves when offline status is set
 */
export async function setOffline(
  canvasId: string,
  userId: string,
  username: string
): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `canvases/${canvasId}/presence/${userId}`)

    await set(presenceRef, {
      username,
      online: false,
      lastSeen: serverTimestamp(),
    } as PresenceData)

    console.log(`Presence: User ${username} set offline`)
  } catch (error) {
    console.error('Failed to set user offline:', error)
    // Don't throw - offline updates shouldn't break the app
  }
}

/**
 * Subscribe to presence updates for all users on a canvas
 *
 * @param canvasId - Canvas identifier
 * @param callback - Function called with updated presence data
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * useEffect(() => {
 *   const unsubscribe = subscribeToPresence('main', (users) => {
 *     console.log('Online users:', users.filter(u => u.online))
 *   })
 *   return unsubscribe
 * }, [])
 * ```
 */
export function subscribeToPresence(
  canvasId: string,
  callback: (presence: PresenceWithUser[]) => void
): () => void {
  const presenceRef = ref(realtimeDb, `canvases/${canvasId}/presence`)

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const presenceData = snapshot.val()

      if (!presenceData) {
        callback([])
        return
      }

      // Convert object to array with userId included
      const presence: PresenceWithUser[] = Object.entries(presenceData).map(
        ([userId, data]) => ({
          userId,
          ...(data as PresenceData),
          // Ensure lastSeen is a number (it will be when read from DB)
          lastSeen: (data as PresenceData).lastSeen as number,
        })
      )

      callback(presence)
    },
    (error) => {
      console.error('Firebase presence subscription error:', error)
      callback([])
    }
  )

  return unsubscribe
}
