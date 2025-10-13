/**
 * usePresence Hook
 *
 * Manages real-time presence (online/offline status) for users on a canvas.
 * Subscribes to Firebase Realtime Database presence data.
 */

import { useState, useEffect } from 'react'
import { subscribeToPresence, type PresenceWithUser } from '@/lib/firebase'
import { getUserColor } from '../utils'

/**
 * Extended presence data with assigned color
 */
export interface PresenceWithColor extends PresenceWithUser {
  color: string
}

/**
 * Hook to subscribe to and manage presence for all users on a canvas
 *
 * Filters to only return online users and adds their assigned color.
 *
 * @param canvasId - Canvas identifier to subscribe to
 * @returns Array of online users with their presence data and color
 *
 * @example
 * ```tsx
 * function PresenceList() {
 *   const onlineUsers = usePresence('main')
 *   return (
 *     <ul>
 *       {onlineUsers.map(user => (
 *         <li key={user.userId} style={{ color: user.color }}>
 *           {user.username}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function usePresence(canvasId: string): PresenceWithColor[] {
  const [presence, setPresence] = useState<PresenceWithColor[]>([])

  useEffect(() => {
    if (!canvasId) {
      setPresence([])
      return
    }

    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence(canvasId, (allPresence) => {
      // Filter to only online users and add their color
      const onlineUsers = allPresence
        .filter((user) => user.online)
        .map((user) => ({
          ...user,
          color: getUserColor(user.userId),
        }))

      setPresence(onlineUsers)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [canvasId])

  return presence
}
