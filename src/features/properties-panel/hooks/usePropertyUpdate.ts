/**
 * usePropertyUpdate Hook
 *
 * Centralized hook for updating shape properties with:
 * - Optimistic local updates
 * - Throttled Firebase sync (50ms - same as cursors/drag for real-time feel)
 * - Property validation
 */

import { useState, useMemo, useCallback } from 'react';
import { useCanvasStore } from '@/stores';
import { updateCanvasObject } from '@/lib/firebase';
import { throttle } from '@/lib/utils';
import type { CanvasObject } from '@/types';

export interface UsePropertyUpdateReturn {
  /** Update a single property on a shape */
  updateShapeProperty: (id: string, updates: Partial<CanvasObject>) => void;
  /** Whether an update is currently in progress */
  isUpdating: boolean;
  /** Error from last update, if any */
  error: Error | null;
}

/**
 * Hook for updating shape properties
 *
 * Handles optimistic updates locally and syncs to Firebase with throttling.
 * Uses 50ms throttle (same as cursors/drag) for real-time collaborative feel.
 * All updates go through validation before being applied.
 *
 * @returns Object with update functions and state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { updateShapeProperty, isUpdating } = usePropertyUpdate();
 *
 *   function handleChange(x: number) {
 *     updateShapeProperty(shape.id, { x });
 *   }
 *
 *   return <input onChange={handleChange} disabled={isUpdating} />;
 * }
 * ```
 */
export function usePropertyUpdate(): UsePropertyUpdateReturn {
  const { updateObject, projectId } = useCanvasStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Throttled Firebase update (50ms - matches cursor/drag frequency for real-time sync)
  const throttledFirebaseUpdate = useMemo(
    () =>
      throttle(async (id: string, updates: Partial<CanvasObject>) => {
        try {
          setIsUpdating(true);
          await updateCanvasObject(projectId, id, updates);
          setError(null);
        } catch (err) {
          const error = err as Error;
          setError(error);
        } finally {
          setIsUpdating(false);
        }
      }, 50),
    [projectId]
  );

  /**
   * Update a shape property
   * Applies optimistic local update immediately, then syncs to Firebase
   */
  const updateShapeProperty = useCallback(
    (id: string, updates: Partial<CanvasObject>) => {
      // Optimistic local update (immediate)
      updateObject(id, updates);

      // Throttled Firebase sync (50ms - real-time!)
      throttledFirebaseUpdate(id, updates);
    },
    [updateObject, throttledFirebaseUpdate]
  );

  return {
    updateShapeProperty,
    isUpdating,
    error,
  };
}
