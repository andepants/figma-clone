/**
 * PresenceDropdown Component
 *
 * Expandable dropdown showing the full list of active users.
 * Triggered by clicking the AvatarStack overflow badge.
 *
 * Features:
 * - Header with "Active Users" title and count badge
 * - Scrollable user list (max height: 300px)
 * - Current user highlighted and shown first
 * - "(You)" badge for current user
 * - Optional search/filter for 10+ users
 * - Smooth open/close animations
 * - Keyboard accessible (Escape to close)
 */

import React, { useState } from 'react'
import { UserAvatar } from './UserAvatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * User object with current user flag
 */
export interface PresenceUser {
  userId: string
  username: string
  color: string
  isCurrentUser: boolean
}

/**
 * Props for PresenceDropdown component
 */
interface PresenceDropdownProps {
  /** Array of users with current user flag */
  users: PresenceUser[]
  /** Trigger element (usually AvatarStack) */
  trigger: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * PresenceDropdown Component
 *
 * Renders an expandable dropdown with the full user list.
 *
 * @example
 * <PresenceDropdown
 *   users={[
 *     { userId: '1', username: 'You', color: '#ef4444', isCurrentUser: true },
 *     { userId: '2', username: 'John Doe', color: '#10b981', isCurrentUser: false },
 *   ]}
 *   trigger={<AvatarStack users={users} />}
 * />
 */
export function PresenceDropdown({
  users,
  trigger,
  className = '',
}: PresenceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sort users: current user first, then alphabetically
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isCurrentUser) return -1
    if (b.isCurrentUser) return 1
    return a.username.localeCompare(b.username)
  })

  // Filter users by search query
  const filteredUsers = searchQuery
    ? sortedUsers.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedUsers

  // Show search input if more than 10 users
  const showSearch = users.length > 10

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`cursor-pointer ${className}`}>{trigger}</div>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-64 p-0 animate-in fade-in-0 zoom-in-95 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150"
        onEscapeKeyDown={() => setIsOpen(false)}
        role="dialog"
        aria-label="Active users list"
      >
        {/* Header */}
        <div className="border-b px-3 py-2 flex items-center justify-between cursor-default">
          <h3 className="text-sm font-semibold text-gray-900">Active Users</h3>
          <span className="inline-flex items-center rounded-md bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
            {users.length}
          </span>
        </div>

        {/* Search Input (if > 10 users) */}
        {showSearch && (
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        {/* User List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredUsers.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {filteredUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-2 rounded-md px-2 py-2 sm:py-1.5 hover:bg-neutral-50 transition-colors duration-150 cursor-default"
                  title={user.username}
                >
                  <UserAvatar
                    username={user.username}
                    color={user.color}
                    size="sm"
                  />
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {user.username}
                  </span>
                  {user.isCurrentUser && (
                    <span className="text-xs text-gray-500 font-medium">
                      (You)
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // No results state
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              No users found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
