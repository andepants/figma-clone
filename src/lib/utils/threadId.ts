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

