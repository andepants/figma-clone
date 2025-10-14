/**
 * ActiveUsers Component
 *
 * DEPRECATED: This component is no longer used in the app.
 * Presence is now integrated into PropertiesPanel as AvatarStack component.
 *
 * Previous functionality:
 * - Displayed a list of currently active users on the canvas
 * - Used Firebase Presence system with automatic disconnect detection
 * - Showed each user's assigned color and username, with the current user highlighted
 *
 * @deprecated Use AvatarStack and PresenceDropdown in PropertiesPanel instead
 */

import { useMemo } from 'react'
import { usePresence } from '../hooks'
import { useAuth } from '@/features/auth/hooks'

/**
 * Represents an active user with their display information
 */
interface ActiveUser {
  userId: string
  username: string
  color: string
  isCurrentUser: boolean
}

/**
 * ActiveUsers component
 *
 * Renders a panel in the top-right corner showing all online users.
 * The current user appears first with a "(You)" label.
 * Each user is displayed with their cursor color and username.
 *
 * Uses Firebase Presence system with onDisconnect() for reliable
 * online/offline status that handles browser crashes and network issues.
 *
 * @example
 * ```tsx
 * <ActiveUsers />
 * ```
 */
export function ActiveUsers() {
  const onlineUsers = usePresence('main')
  const { currentUser } = useAuth()

  /**
   * Combine current user with other active users
   * Sort with current user first
   */
  const activeUsers = useMemo((): ActiveUser[] => {
    const users: ActiveUser[] = []

    // Add current user first
    if (currentUser) {
      users.push({
        userId: currentUser.uid,
        username: currentUser.username || currentUser.email || 'Unknown',
        color: onlineUsers.find(u => u.userId === currentUser.uid)?.color || '#888',
        isCurrentUser: true,
      })
    }

    // Add other online users from presence system
    onlineUsers.forEach((user) => {
      // Skip current user (already added)
      if (user.userId === currentUser?.uid) return

      users.push({
        userId: user.userId,
        username: user.username,
        color: user.color,
        isCurrentUser: false,
      })
    })

    return users
  }, [onlineUsers, currentUser])

  // If no users (shouldn't happen but handle gracefully)
  if (activeUsers.length === 0) {
    return null
  }

  return (
    <div className="absolute right-4 top-4 z-10 flex w-[260px] flex-col rounded-lg bg-white shadow-lg animate-in slide-in-from-right-4 fade-in duration-300">
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

              {/* Username with truncation */}
              <span
                className="flex-1 truncate text-sm text-neutral-700"
                title={user.username}
              >
                {user.username}
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
