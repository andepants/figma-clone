/**
 * useEditStates Hook
 *
 * Subscribes to real-time text editing states for a canvas.
 * Shows which users are currently editing which text objects.
 */

import { useEffect, useState } from 'react';
import { subscribeToEditStates } from '@/lib/firebase';
import type { EditStateMap } from '@/lib/firebase/textEditingService';

/**
 * useEditStates Hook
 *
 * Subscribes to real-time edit states for a canvas.
 * Returns a map of textId -> EditState showing who is editing what.
 *
 * @param canvasId - Canvas identifier
 * @returns EditStateMap - Map of text IDs to edit states
 *
 * @example
 * ```tsx
 * const editStates = useEditStates('main');
 *
 * // Check if a specific text is being edited
 * const isEditing = !!editStates['text-123'];
 * if (isEditing) {
 *   // editStates['text-123'].username is editing
 * }
 * ```
 */
export function useEditStates(canvasId: string): EditStateMap {
  const [editStates, setEditStates] = useState<EditStateMap>({});

  useEffect(() => {
    // Subscribe to edit states
    const unsubscribe = subscribeToEditStates(canvasId, (states) => {
      setEditStates(states);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [canvasId]);

  return editStates;
}
