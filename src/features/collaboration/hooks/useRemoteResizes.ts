/**
 * useRemoteResizes Hook
 *
 * Manages real-time resize states from other users.
 * Subscribes to Firebase Realtime Database and provides resize state information
 * for rendering visual indicators showing which objects other users are resizing.
 */

import { useState, useEffect } from 'react';
import { subscribeToResizeStates } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import type { ResizeState, ResizeStateMap } from '@/types';

/**
 * Resize state with object ID
 * Used for rendering resize overlays
 */
export interface ResizeStateWithObject extends ResizeState {
  objectId: string;
}

/**
 * Hook to subscribe to and manage resize states for all objects on a canvas
 *
 * Filters out the current user's own resize states (we don't show our own resize indicator).
 * Returns an array of resize states with their associated object IDs.
 *
 * @param canvasId - Canvas identifier to subscribe to
 * @returns Array of resize states for objects being resized by other users
 *
 * @example
 * ```tsx
 * function CanvasComponent() {
 *   const resizeStates = useRemoteResizes('main');
 *
 *   return (
 *     <Layer>
 *       {resizeStates.map(state => (
 *         <RemoteResizeOverlay
 *           key={state.objectId}
 *           objectId={state.objectId}
 *           resizeState={state}
 *         />
 *       ))}
 *     </Layer>
 *   );
 * }
 * ```
 */
export function useRemoteResizes(canvasId: string): ResizeStateWithObject[] {
  const [resizeStates, setResizeStates] = useState<ResizeStateWithObject[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!canvasId) {
      setResizeStates([]);
      return;
    }

    // Subscribe to resize state updates
    const unsubscribe = subscribeToResizeStates(canvasId, (resizeStateMap: ResizeStateMap) => {
      // Convert map to array and filter out own resize states
      const resizeStateArray: ResizeStateWithObject[] = Object.entries(resizeStateMap)
        .filter(([, state]) => state.userId !== currentUser?.uid) // Filter out own resizes
        .filter(([, state]) => {
          // Validate that resize state has all required fields
          const isValid =
            state.objectId !== undefined &&
            state.userId !== undefined &&
            state.username !== undefined &&
            state.color !== undefined &&
            state.handle !== undefined &&
            state.startBounds !== undefined &&
            state.currentBounds !== undefined &&
            state.anchor !== undefined;

          return isValid;
        })
        .map(([objectId, state]) => ({
          ...state,
          objectId,
        }));

      setResizeStates(resizeStateArray);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId, currentUser?.uid]);

  return resizeStates;
}

/**
 * Hook to check if a specific object is being resized by another user
 *
 * Useful for showing lock indicators or preventing interactions.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object to check
 * @returns ResizeState if object is being resized by another user, null otherwise
 *
 * @example
 * ```tsx
 * function ObjectComponent({ objectId }: { objectId: string }) {
 *   const resizeState = useObjectResizeState('main', objectId);
 *
 *   if (resizeState) {
 *     return <ResizingIndicator username={resizeState.username} />;
 *   }
 *
 *   return <EditableObject objectId={objectId} />;
 * }
 * ```
 */
export function useObjectResizeState(
  canvasId: string,
  objectId: string
): ResizeState | null {
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!canvasId || !objectId) {
      setResizeState(null);
      return;
    }

    // Subscribe to resize state updates
    const unsubscribe = subscribeToResizeStates(canvasId, (resizeStateMap: ResizeStateMap) => {
      const objectResizeState = resizeStateMap[objectId];

      if (!objectResizeState) {
        setResizeState(null);
        return;
      }

      // Filter out own resize state
      if (objectResizeState.userId === currentUser?.uid) {
        setResizeState(null);
        return;
      }

      setResizeState(objectResizeState);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId, objectId, currentUser?.uid]);

  return resizeState;
}
