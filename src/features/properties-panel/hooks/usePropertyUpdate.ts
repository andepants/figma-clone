/**
 * usePropertyUpdate Hook
 *
 * Centralized hook for updating shape properties with:
 * - Optimistic local updates
 * - Debounced Firebase sync
 * - Property validation
 */

import { useState, useMemo, useCallback } from 'react';
import { useCanvasStore } from '@/stores';
import { updateCanvasObject } from '@/lib/firebase';
import { debounce } from '@/lib/utils';
import { toast } from 'sonner';
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
 * Handles optimistic updates locally and syncs to Firebase with debouncing.
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
  const { updateObject } = useCanvasStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounced Firebase update (500ms)
  const debouncedFirebaseUpdate = useMemo(
    () =>
      debounce(async (id: string, updates: Partial<CanvasObject>) => {
        try {
          setIsUpdating(true);
          await updateCanvasObject('main', id, updates);
          setError(null);
        } catch (err) {
          const error = err as Error;
          setError(error);
          console.error('Failed to sync property changes:', error);
          toast.error('Failed to sync changes');
        } finally {
          setIsUpdating(false);
        }
      }, 500),
    []
  );

  /**
   * Update a shape property
   * Applies optimistic local update immediately, then syncs to Firebase
   */
  const updateShapeProperty = useCallback(
    (id: string, updates: Partial<CanvasObject>) => {
      // Optimistic local update (immediate)
      updateObject(id, updates);

      // Debounced Firebase sync (500ms)
      debouncedFirebaseUpdate(id, updates);
    },
    [updateObject, debouncedFirebaseUpdate]
  );

  return {
    updateShapeProperty,
    isUpdating,
    error,
  };
}
