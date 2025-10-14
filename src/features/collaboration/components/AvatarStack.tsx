/**
 * AvatarStack Component
 *
 * Displays a Figma-style overlapping stack of user avatars.
 * Shows a limited number of avatars with an overflow badge for additional users.
 *
 * Features:
 * - Overlapping circular avatars (negative margin spacing)
 * - Configurable maximum visible avatars (default: 3)
 * - "+X more" overflow badge for additional users
 * - Hover tooltips showing usernames
 * - Clickable overflow badge to show all users
 * - Smooth hover animations (scale and z-index)
 */

import { UserAvatar } from './UserAvatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * User object for avatar display
 */
export interface AvatarUser {
  userId: string
  username: string
  color: string
}

/**
 * Props for AvatarStack component
 */
interface AvatarStackProps {
  /** Array of users to display */
  users: AvatarUser[]
  /** Maximum number of avatars to show before overflow badge */
  maxVisible?: number
  /** Size variant for all avatars */
  size?: 'sm' | 'md' | 'lg'
  /** Callback when overflow badge is clicked */
  onShowAll?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * AvatarStack Component
 *
 * Renders an overlapping stack of user avatars with overflow handling.
 *
 * @example
 * <AvatarStack
 *   users={[
 *     { userId: '1', username: 'John Doe', color: '#ef4444' },
 *     { userId: '2', username: 'Jane Smith', color: '#10b981' },
 *   ]}
 *   maxVisible={3}
 *   size="sm"
 *   onShowAll={() => {}}
 * />
 */
export function AvatarStack({
  users,
  maxVisible = 3,
  size = 'md',
  onShowAll,
  className = '',
}: AvatarStackProps) {
  // Handle edge cases
  if (users.length === 0) {
    return null
  }

  // Calculate visible users and overflow count
  const visibleUsers = users.slice(0, maxVisible)
  const overflowCount = users.length - maxVisible
  const hasOverflow = overflowCount > 0

  return (
    <div
      className={`flex items-center -space-x-2 animate-in fade-in slide-in-from-right-2 duration-300 ${className}`}
      aria-label="Active users"
    >
      <TooltipProvider delayDuration={300}>
        {/* Render visible avatars */}
        {visibleUsers.map((user, index) => (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <div
                className="relative hover:scale-110 hover:z-50 transition-transform duration-200 ease-out cursor-pointer"
                style={{
                  zIndex: index,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <UserAvatar
                  username={user.username}
                  color={user.color}
                  size={size}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="max-w-[200px] truncate">{user.username}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Render overflow badge if needed */}
        {hasOverflow && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`
                  relative
                  ${size === 'sm' ? 'h-6 w-6 text-xs' : ''}
                  ${size === 'md' ? 'h-8 w-8 text-sm' : ''}
                  ${size === 'lg' ? 'h-10 w-10 text-base' : ''}
                  rounded-full
                  bg-gray-500
                  text-white
                  font-semibold
                  flex items-center justify-center
                  ring-2 ring-white
                  transition-colors duration-200
                  ${onShowAll ? 'cursor-pointer hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2' : 'cursor-default'}
                `}
                style={{ zIndex: maxVisible }}
                onClick={onShowAll}
                onKeyDown={(e) => {
                  if (onShowAll && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onShowAll()
                  }
                }}
                aria-label="Show all users"
                tabIndex={onShowAll ? 0 : -1}
                disabled={!onShowAll}
              >
                +{overflowCount}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{overflowCount} more user{overflowCount !== 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  )
}
