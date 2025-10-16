/**
 * Get User Display Name Utility
 *
 * Extracts a clean display name for users, preferring username
 * but falling back to email username (before @) if needed.
 */

/**
 * Extracts username from email address
 * @param email - Email address (e.g., "john.doe@example.com")
 * @returns Username part before @ (e.g., "john.doe")
 */
function extractUsernameFromEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;
  return email.substring(0, atIndex);
}

/**
 * Gets a clean display name for a user
 * Priority:
 * 1. User's display name (username field)
 * 2. Email username (part before @)
 * 3. "Anonymous"
 *
 * @param username - User's display name (nullable)
 * @param email - User's email address (nullable)
 * @returns Clean display name for UI
 *
 * @example
 * ```ts
 * getUserDisplayName("John Doe", "john@example.com") // "John Doe"
 * getUserDisplayName(null, "john.doe@example.com") // "john.doe"
 * getUserDisplayName(null, null) // "Anonymous"
 * ```
 */
export function getUserDisplayName(
  username: string | null,
  email: string | null
): string {
  // First priority: use username if available
  if (username) return username;

  // Second priority: extract username from email
  if (email) return extractUsernameFromEmail(email);

  // Fallback: anonymous user
  return 'Anonymous';
}
