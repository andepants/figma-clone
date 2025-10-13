/**
 * useCursors Hook
 *
 * Manages real-time cursor positions from other users.
 * Subscribes to Firebase Realtime Database and filters out the current user's cursor.
 */

import { useState, useEffect } from 'react'
import { subscribeToCursors, type CursorWithUser } from '@/lib/firebase'
import { useAuth } from '@/features/auth/hooks'

/**
 * Hook to subscribe to and manage cursor positions for all users on a canvas
 *
 * @param canvasId - Canvas identifier to subscribe to
 * @returns Array of cursor data for other users (excludes current user)
 *
 * @example
 * function CanvasComponent() {
 *   const cursors = useCursors('main')
 *   return cursors.map(cursor => <Cursor key={cursor.userId} {...cursor} />)
 * }
 */
export function useCursors(canvasId: string): CursorWithUser[] {
  const [cursors, setCursors] = useState<CursorWithUser[]>([])
  const { currentUser } = useAuth()

  useEffect(() => {
    if (!canvasId) return

    // Subscribe to cursor updates
    const unsubscribe = subscribeToCursors(canvasId, (allCursors) => {
      // Filter out current user's cursor (we don't show our own cursor)
      const otherCursors = allCursors.filter(
        (cursor) => cursor.userId !== currentUser?.uid
      )
      setCursors(otherCursors)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [canvasId, currentUser?.uid])

  return cursors
}
