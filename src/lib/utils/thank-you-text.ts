/**
 * Thank You Text Utility
 *
 * Shows a temporary "Thank you" message on the canvas when template loads.
 * Message fades in, stays for 1 second, then fades out and auto-deletes.
 *
 * Used to:
 * 1. Provide visual feedback that template loaded successfully
 * 2. Force canvas re-render which helps trigger Konva layer updates
 * 3. Give users a nice welcome message
 */

import type { Text } from '@/types/canvas.types';
import { addCanvasObject, updateCanvasObject, removeCanvasObject } from '@/lib/firebase/realtimeCanvasService';

/**
 * Show Thank You Text
 *
 * Creates a temporary text object that:
 * - Appears at viewport center
 * - Fades in over 300ms (opacity 0 → 1)
 * - Stays visible for 700ms
 * - Fades out over 300ms (opacity 1 → 0)
 * - Auto-deletes after fade-out completes
 *
 * This also helps trigger canvas re-renders and Konva layer updates,
 * which can fix issues where template objects don't appear until
 * first user interaction.
 *
 * @param projectId - Firebase project ID
 * @param userId - Current user ID (for createdBy field)
 * @param viewportCenter - Viewport center coordinates { x, y }
 */
export async function showThankYouText(
  projectId: string,
  userId: string,
  viewportCenter: { x: number; y: number }
): Promise<void> {
  // Create temporary text object
  const textId = crypto.randomUUID();
  const thankYouText: Text = {
    id: textId,
    type: 'text',
    x: viewportCenter.x,
    y: viewportCenter.y,
    text: 'Thank you for using Canvas Icons',
    fontSize: 36,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: 600,
    fill: '#6b7280', // Gray-500 - neutral, non-distracting
    align: 'center',
    width: 500, // Fixed width for center alignment
    height: 50, // Approximate height for 36px font
    opacity: 0, // Start invisible for fade-in
    visible: true,
    locked: false,
    name: 'Thank You Text',
    zIndex: 999999, // Ensure it's on top of everything
    createdBy: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    // Add to canvas (starts invisible with opacity: 0)
    await addCanvasObject(projectId, thankYouText);

    // Fade in: opacity 0 → 1 over 300ms
    setTimeout(async () => {
      try {
        await updateCanvasObject(projectId, textId, {
          opacity: 1,
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error('[Thank You Text] Failed to fade in:', error);
      }
    }, 50); // Small delay to ensure object is rendered before animating

    // Fade out: opacity 1 → 0 after 1000ms (300ms fade-in + 700ms visible)
    setTimeout(async () => {
      try {
        await updateCanvasObject(projectId, textId, {
          opacity: 0,
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error('[Thank You Text] Failed to fade out:', error);
      }
    }, 1000);

    // Delete: Remove from canvas after 1300ms (fade-in + visible + fade-out)
    setTimeout(async () => {
      try {
        await removeCanvasObject(projectId, textId);
      } catch (error) {
        console.error('[Thank You Text] Failed to delete:', error);
      }
    }, 1300);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Thank You Text] Displayed successfully');
    }
  } catch (error) {
    console.error('[Thank You Text] Failed to create:', error);
  }
}

/**
 * Check if Project is Freshly Created
 *
 * Determines if a project was created recently (within last 60 seconds).
 * Used to show thank you text only for new projects with fresh templates.
 *
 * @param projectCreatedAt - Project creation timestamp (milliseconds)
 * @returns True if project was created within last 60 seconds
 */
export function isFreshProject(projectCreatedAt: number): boolean {
  const now = Date.now();
  const ageInSeconds = (now - projectCreatedAt) / 1000;
  return ageInSeconds < 60; // Fresh if created within last minute
}
