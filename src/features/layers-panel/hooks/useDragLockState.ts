/**
 * useDragLockState Hook
 *
 * Monitors the layer panel drag lock state in real-time and provides
 * information about whether the panel is locked and by whom.
 */

import { useEffect, useState } from 'react';
import { subscribeToLayerDragLock } from '@/lib/firebase/layerPanelDragService';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface DragLockState {
  isLocked: boolean;
  lockedBy: string | null;
  lockedByUsername: string | null;
  objectIds: string[];
  timestamp: number | null;
  isStale: boolean;
}

const DRAG_TIMEOUT = 5000; // Must match layerPanelDragService.ts

/**
 * Hook to monitor layer panel drag lock state
 *
 * @param projectId - The current project ID
 * @returns Drag lock state information
 */
export function useDragLockState(projectId: string): DragLockState {
  const { currentUser } = useAuth();
  const [lockState, setLockState] = useState<DragLockState>({
    isLocked: false,
    lockedBy: null,
    lockedByUsername: null,
    objectIds: [],
    timestamp: null,
    isStale: false,
  });

  useEffect(() => {
    if (!projectId || !currentUser) {
      setLockState({
        isLocked: false,
        lockedBy: null,
        lockedByUsername: null,
        objectIds: [],
        timestamp: null,
        isStale: false,
      });
      return;
    }

    const unsubscribe = subscribeToLayerDragLock(projectId, (lock) => {
      if (!lock) {
        setLockState({
          isLocked: false,
          lockedBy: null,
          lockedByUsername: null,
          objectIds: [],
          timestamp: null,
          isStale: false,
        });
        return;
      }

      // Check if lock is held by current user
      const isLockedByCurrentUser = lock.userId === currentUser.uid;

      // Check if lock is stale
      const age = Date.now() - lock.timestamp;
      const isStale = age > DRAG_TIMEOUT;

      setLockState({
        isLocked: !isLockedByCurrentUser && !isStale,
        lockedBy: lock.userId,
        lockedByUsername: lock.username,
        objectIds: lock.objectIds,
        timestamp: lock.timestamp,
        isStale,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [projectId, currentUser]);

  return lockState;
}
