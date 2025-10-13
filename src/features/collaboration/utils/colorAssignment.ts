/**
 * Color Assignment Utility
 *
 * Assigns consistent colors to users based on their userId.
 * Uses a hash function to ensure the same user always gets the same color.
 */

/**
 * Predefined color palette for user cursors and presence
 * Colors selected for good visibility and distinction
 */
const CURSOR_COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Orange
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Deep Orange
  '#14b8a6', // Teal
  '#a855f7', // Violet
]

/**
 * Simple hash function to convert string to number
 *
 * @param str - String to hash
 * @returns Hash value
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a consistent color for a user based on their userId
 *
 * @param userId - User identifier
 * @returns Hex color string
 *
 * @example
 * const color = getUserColor('user123') // Always returns same color for 'user123'
 */
export function getUserColor(userId: string): string {
  const hash = hashCode(userId)
  const index = hash % CURSOR_COLORS.length
  return CURSOR_COLORS[index]
}
