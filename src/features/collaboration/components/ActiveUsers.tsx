/**
 * ActiveUsers Component
 *
 * Displays a list of currently active users on the canvas.
 * Shows each user's assigned color and email, with the current user highlighted.
 */

import { useMemo } from 'react'
import { useCursors } from '../hooks'
import { getUserColor } from '../utils'
import { useAuth } from '@/features/auth/hooks'

/**
 * Represents an active user with their display information
 */
interface ActiveUser {
  userId: string
  email: string
  color: string
  isCurrentUser: boolean
}

/**
 * ActiveUsers component
 *
 * Renders a panel in the top-right corner showing all online users.
 * The current user appears first with a "(You)" label.
 * Each user is displayed with their cursor color and email.
 *
 * @example
 * ```tsx
 * <ActiveUsers />
 * ```
 */
export function ActiveUsers() {
  const cursors = useCursors('main')
  const { currentUser } = useAuth()

  /**
   * Combine current user with other active users
   * Filter out stale cursors (older than 30 seconds)
   * Sort with current user first
   */
  const activeUsers = useMemo((): ActiveUser[] => {
    const users: ActiveUser[] = []
    const now = Date.now()
    const STALE_THRESHOLD = 30000 // 30 seconds

    // Add current user first
    if (currentUser) {
      users.push({
        userId: currentUser.uid,
        email: currentUser.email || 'Unknown',
        color: getUserColor(currentUser.uid),
        isCurrentUser: true,
      })
    }

    // Add other users from cursors (filter out stale ones)
    cursors.forEach((cursor) => {
      // Skip if this is somehow the current user (shouldn't happen but be safe)
      if (cursor.userId === currentUser?.uid) return

      // Filter stale cursors
      const lastUpdate =
        typeof cursor.lastUpdate === 'number' ? cursor.lastUpdate : 0
      if (now - lastUpdate > STALE_THRESHOLD) return

      // Use username field which contains email or display name
      const email = cursor.username || 'Unknown'

      users.push({
        userId: cursor.userId,
        email,
        color: cursor.color,
        isCurrentUser: false,
      })
    })

    return users
  }, [cursors, currentUser])

  // If no users (shouldn't happen but handle gracefully)
  if (activeUsers.length === 0) {
    return null
  }

  return (
    <div className="absolute right-4 top-4 z-10 flex w-[260px] flex-col rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <h3 className="text-sm font-semibold text-neutral-900">Active Users</h3>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-100 px-2 text-xs font-medium text-primary-700">
          {activeUsers.length}
        </span>
      </div>

      {/* User list */}
      <div className="max-h-[240px] overflow-y-auto">
        <div className="flex flex-col gap-0.5 p-2">
          {activeUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-50"
            >
              {/* Color indicator */}
              <div
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: user.color }}
                aria-label={`User color: ${user.color}`}
              />

              {/* Email with truncation */}
              <span
                className="flex-1 truncate text-sm text-neutral-700"
                title={user.email}
              >
                {user.email}
              </span>

              {/* Current user indicator */}
              {user.isCurrentUser && (
                <span className="flex-shrink-0 text-xs font-medium text-neutral-500">
                  (You)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
