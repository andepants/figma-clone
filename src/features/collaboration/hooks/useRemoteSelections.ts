/**
 * useRemoteSelections Hook
 *
 * Manages real-time selection states from other users.
 * Subscribes to Firebase Realtime Database and provides selection information
 * for rendering visual indicators (colored borders, badges).
 */

import { useState, useEffect } from 'react';
import { subscribeToSelections } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '../utils';
import { subscribeToPresence, type PresenceWithUser } from '@/lib/firebase';
import type { SelectionStateMap, RemoteSelection } from '@/types';

/**
 * Hook to subscribe to and manage selection states for all users on a canvas
 *
 * Filters out the current user's own selection and enriches selection data
 * with user information (username, color) from the presence system.
 *
 * @param canvasId - Canvas identifier to subscribe to
 * @returns Array of remote selections with user details
 *
 * @example
 * ```tsx
 * function CanvasComponent() {
 *   const remoteSelections = useRemoteSelections('main');
 *
 *   return (
 *     <Layer>
 *       {remoteSelections.map(selection => (
 *         <SelectionOverlay
 *           key={selection.userId}
 *           objectId={selection.objectId}
 *           username={selection.username}
 *           color={selection.color}
 *         />
 *       ))}
 *     </Layer>
 *   );
 * }
 * ```
 */
export function useRemoteSelections(canvasId: string): RemoteSelection[] {
  const [remoteSelections, setRemoteSelections] = useState<RemoteSelection[]>([]);
  const [presenceData, setPresenceData] = useState<PresenceWithUser[]>([]);
  const { currentUser } = useAuth();

  // Subscribe to presence data to get usernames
  useEffect(() => {
    if (!canvasId) {
      setPresenceData([]);
      return;
    }

    const unsubscribe = subscribeToPresence(canvasId, (presence) => {
      setPresenceData(presence);
    });

    return () => {
      unsubscribe();
    };
  }, [canvasId]);

  // Subscribe to selection updates
  useEffect(() => {
    if (!canvasId) {
      setRemoteSelections([]);
      return;
    }

    const unsubscribe = subscribeToSelections(canvasId, (selectionMap: SelectionStateMap) => {
      // Convert map to array and enrich with user details
      const selections: RemoteSelection[] = Object.entries(selectionMap)
        .filter(([userId, _]) => userId !== currentUser?.uid) // Filter out own selection
        .filter(([_, state]) => state.objectId !== null) // Filter out empty selections
        .map(([userId, state]) => {
          // Find user in presence data
          const userPresence = presenceData.find((p) => p.userId === userId);
          const username = userPresence?.username || 'Anonymous';
          const color = getUserColor(userId);

          return {
            userId,
            objectId: state.objectId as string, // We know it's not null from filter above
            username,
            color,
          };
        });

      setRemoteSelections(selections);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [canvasId, currentUser?.uid, presenceData]);

  return remoteSelections;
}

/**
 * Hook to get all remote selections for a specific object
 *
 * Returns all users who have selected the specified object.
 * Useful for showing multiple users' selections on the same object.
 *
 * @param canvasId - Canvas identifier
 * @param objectId - Object to check
 * @returns Array of remote selections for this object
 *
 * @example
 * ```tsx
 * function ObjectComponent({ objectId }: { objectId: string }) {
 *   const selections = useObjectSelections('main', objectId);
 *
 *   if (selections.length > 0) {
 *     return (
 *       <div>
 *         {selections.map(sel => (
 *           <Badge key={sel.userId} color={sel.color}>
 *             {sel.username}
 *           </Badge>
 *         ))}
 *       </div>
 *     );
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useObjectSelections(
  canvasId: string,
  objectId: string
): RemoteSelection[] {
  const allSelections = useRemoteSelections(canvasId);

  return allSelections.filter((selection) => selection.objectId === objectId);
}
