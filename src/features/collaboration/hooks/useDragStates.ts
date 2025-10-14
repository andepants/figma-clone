/**
 * useDragStates Hook
 *
 * Manages real-time drag states from other users.
 * Subscribes to Firebase Realtime Database and provides drag state information
 * for rendering visual indicators.
 */

import { useState, useEffect } from 'react';
import { subscribeToDragStates } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import type { DragState, DragStateMap } from '@/types';

/**
 * Drag state with object ID
 * Used for rendering drag indicators
 */
export interface DragStateWithObject extends DragState {
  objectId: string;
}

/**
 * Hook to subscribe to and manage drag states for all objects on a canvas
 *
 * Filters out the current user's own drag states (we don't show our own drag indicator).
 * Returns an array of drag states with their associated object IDs.
 *
 * @param canvasId - Canvas identifier to subscribe to
 * @returns Array of drag states for objects being dragged by other users
 *
 * @example
 * ```tsx
 * function CanvasComponent() {
 *   const dragStates = useDragStates('main');
 *
 *   return (
 *     <Layer>
 *       {dragStates.map(state => (
 *         <DragIndicator
 *           key={state.objectId}
 *           objectId={state.objectId}
 *           dragState={state}
 *         />
 *       ))}
 *     </Layer>
 *   );
 * }
 * ```
 */
export function useDragStates(canvasId: string): DragStateWithObject[] {
  const [dragStates, setDragStates] = useState<DragStateWithObject[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!canvasId) {
      setDragStates([]);
      return;
    }

    // Subscribe to drag state updates
    const unsubscribe = subscribeToDragStates(canvasId, (dragStateMap: DragStateMap) => {
      // Convert map to array and filter out own drag states
      const dragStateArray: DragStateWithObject[] = Object.entries(dragStateMap)
        .filter(([, state]) => state.userId !== currentUser?.uid) // Filter out own drags
        .filter(([, state]) => {
          // Validate that drag state has all required fields
          const isValid =
            state.x !== undefined &&
            state.y !== undefined &&
            state.username !== undefined &&
            state.color !== undefined &&
            state.userId !== undefined;

          return isValid;
        })
        .map(([objectId, state]) => ({
          ...state,
          objectId,
        }));

      setDragStates(dragStateArray);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId, currentUser?.uid]);

  return dragStates;
}

/**
 * Hook to check if a specific object is being dragged by another user
 *
 * Useful for showing lock indicators or preventing interactions.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object to check
 * @returns DragState if object is being dragged by another user, null otherwise
 *
 * @example
 * ```tsx
 * function ObjectComponent({ objectId }: { objectId: string }) {
 *   const dragState = useObjectDragState('main', objectId);
 *
 *   if (dragState) {
 *     return <LockedIndicator username={dragState.username} />;
 *   }
 *
 *   return <EditableObject objectId={objectId} />;
 * }
 * ```
 */
export function useObjectDragState(
  canvasId: string,
  objectId: string
): DragState | null {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!canvasId || !objectId) {
      setDragState(null);
      return;
    }

    // Subscribe to drag state updates
    const unsubscribe = subscribeToDragStates(canvasId, (dragStateMap: DragStateMap) => {
      const objectDragState = dragStateMap[objectId];

      if (!objectDragState) {
        setDragState(null);
        return;
      }

      // Filter out own drag state
      if (objectDragState.userId === currentUser?.uid) {
        setDragState(null);
        return;
      }

      setDragState(objectDragState);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId, objectId, currentUser?.uid]);

  return dragState;
}
