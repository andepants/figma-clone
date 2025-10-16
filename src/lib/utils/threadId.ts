/**
 * Thread ID Utility
 *
 * Generates consistent thread IDs for AI conversation persistence.
 * Format: {userId}_{canvasId}_{sessionDate}
 */

/**
 * Generate thread ID for AI conversation
 * One thread per user per canvas per session (day)
 *
 * @param userId - Current user ID (or 'guest' if unauthenticated)
 * @param canvasId - Current canvas ID
 * @returns Consistent thread ID string
 */
export function generateThreadId(userId: string | null, canvasId: string): string {
  // Use 'guest' for unauthenticated users
  const safeUserId = userId || 'guest';

  // Include date to reset conversation daily (prevent token bloat)
  // Use UTC for consistency across timezones
  const sessionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Sanitize IDs to alphanumeric + underscores only
  const sanitizedUserId = safeUserId.replace(/[^a-zA-Z0-9_]/g, '_');
  const sanitizedCanvasId = canvasId.replace(/[^a-zA-Z0-9_]/g, '_');

  return `${sanitizedUserId}_${sanitizedCanvasId}_${sessionDate}`;
}

/**
 * Extract user ID from thread ID
 *
 * @param threadId - Thread ID string
 * @returns User ID or null if invalid format
 */
export function extractUserIdFromThreadId(threadId: string): string | null {
  const parts = threadId.split('_');
  // Thread ID format: userId_canvasId_date (minimum 3 parts)
  return parts.length >= 3 ? parts[0] : null;
}

/**
 * Extract canvas ID from thread ID
 *
 * @param threadId - Thread ID string
 * @returns Canvas ID or null if invalid format
 */
export function extractCanvasIdFromThreadId(threadId: string): string | null {
  const parts = threadId.split('_');
  // Thread ID format: userId_canvasId_date
  // If parts > 3, canvas ID might contain underscores, so rejoin middle parts
  if (parts.length < 3) return null;

  // Last part is always the date (YYYY-MM-DD)
  // First part is always the user ID
  // Everything in between is the canvas ID
  return parts.slice(1, -1).join('_');
}

/**
 * Check if thread ID is from today
 *
 * @param threadId - Thread ID string
 * @returns True if thread is from today (in UTC)
 */
export function isThreadIdFromToday(threadId: string): boolean {
  const parts = threadId.split('_');
  if (parts.length < 3) return false;

  const threadDate = parts[parts.length - 1]; // Last part is the date
  const today = new Date().toISOString().split('T')[0];

  return threadDate === today;
}
