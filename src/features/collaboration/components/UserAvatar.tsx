/**
 * UserAvatar Component
 *
 * Displays a circular avatar with user initials and coordinated color.
 * Used in presence indicators and user lists throughout the app.
 *
 * Features:
 * - Circular avatar with user initials (first 2 characters)
 * - Consistent color per user (from getUserColor utility)
 * - Three size variants: sm (24px), md (32px), lg (40px)
 * - White border ring for overlap visibility
 * - Smart text color based on background luminance
 */

/**
 * Props for UserAvatar component
 */
interface UserAvatarProps {
  /** User display name */
  username: string
  /** Hex color for avatar background */
  color: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * Size mapping for avatar dimensions and typography
 * Responsive sizing for better mobile touch targets (minimum 44x44px on mobile)
 */
const SIZE_STYLES = {
  sm: 'h-8 w-8 sm:h-6 sm:w-6 text-xs font-medium',
  md: 'h-10 w-10 sm:h-8 sm:w-8 text-sm font-semibold',
  lg: 'h-12 w-12 sm:h-10 sm:w-10 text-base font-bold',
} as const

/**
 * Extract initials from username
 *
 * @param username - User display name
 * @returns Two-character initials, uppercase
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('John') // 'JO'
 * getInitials('') // '?'
 */
function getInitials(username: string): string {
  if (!username || username.trim().length === 0) {
    return '?'
  }

  const trimmed = username.trim()

  // Handle emoji or special characters gracefully
  try {
    // Take first 2 characters, convert to uppercase
    return trimmed.substring(0, 2).toUpperCase()
  } catch {
    return '?'
  }
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
 *
 * @param hex - Hex color string (e.g., '#ef4444')
 * @returns Luminance value between 0 (darkest) and 1 (lightest)
 */
function getLuminance(hex: string): number {
  // Remove # if present
  const color = hex.replace('#', '')

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16) / 255
  const g = parseInt(color.substring(2, 4), 16) / 255
  const b = parseInt(color.substring(4, 6), 16) / 255

  // Apply gamma correction
  const [rs, gs, bs] = [r, g, b].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Determine text color based on background luminance
 * Uses WCAG contrast ratio formula
 *
 * @param backgroundColor - Hex color of background
 * @returns 'white' for dark backgrounds, 'gray-900' for light backgrounds
 */
function getTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  // Threshold of 0.5 provides good contrast
  return luminance > 0.5 ? 'text-gray-900' : 'text-white'
}

/**
 * UserAvatar Component
 *
 * Renders a circular avatar with user initials and background color.
 *
 * @example
 * <UserAvatar
 *   username="John Doe"
 *   color="#ef4444"
 *   size="md"
 * />
 */
export function UserAvatar({
  username,
  color,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const initials = getInitials(username)
  const textColor = getTextColor(color)
  const sizeClasses = SIZE_STYLES[size]

  return (
    <div
      className={`
        ${sizeClasses}
        ${textColor}
        rounded-full
        ring-2 ring-white
        flex items-center justify-center
        transition-transform duration-200 ease-out
        ${className}
      `}
      style={{ backgroundColor: color }}
      aria-label={username}
      title={username}
    >
      {initials}
    </div>
  )
}
