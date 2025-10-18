/**
 * Canvas Subscriptions Hook
 *
 * Manages all Firebase Realtime Database subscriptions for the canvas page.
 * Handles real-time synchronization of canvas objects, drag states, resize states,
 * edit states, and user presence.
 *
 * Features:
 * - Real-time canvas object synchronization with selective merge
 * - Drag/resize/edit state tracking to prevent handle jumping
 * - User presence management (online/offline status)
 * - Automatic cleanup of stale states
 * - Optimistic updates during local manipulation
 */

import { useEffect, useState, useRef } from 'react';
import type { SyncStatus } from '@/components/common';
import type { User } from '@/types/auth.types';
import { useCanvasStore } from '@/stores';
import { markManipulated, unmarkManipulated, isManipulated } from '@/stores/manipulationTracker';
import {
  subscribeToCanvasObjects,
  subscribeToDragStates,
  subscribeToResizeStates,
  subscribeToEditStates,
  setOnline,
  cleanupStaleDragStates,
  cleanupStaleCursors,
  batchUpdateCanvasObjects,
} from '@/lib/firebase';
import { getUserDisplayName } from '@/lib/utils';
import { flattenNonGroupHierarchies, needsMigration } from '@/lib/utils/hierarchyMigration';

/**
 * Hook parameters
 */
interface UseCanvasSubscriptionsParams {
  /** Project ID for Firebase path */
  projectId: string;
  /** Current authenticated user */
  currentUser: User | null;
  /** Callback to update sync status */
  onSyncStatusChange: (status: SyncStatus) => void;
}

/**
 * Hook return value
 */
interface UseCanvasSubscriptionsReturn {
  /** Whether initial data load is complete */
  isLoading: boolean;
}

/**
 * Custom hook to manage all Firebase subscriptions for the canvas
 *
 * Subscribes to:
 * - Canvas objects (with selective merge to prevent handle jumping)
 * - Drag states (tracks which objects are being dragged)
 * - Resize states (tracks which objects are being resized)
 * - Edit states (tracks which text objects are being edited)
 * - User presence (marks user as online with automatic disconnect handling)
 *
 * @param params - Hook parameters
 * @returns Object containing loading state
 *
 * @example
 * function CanvasPage() {
 *   const { currentUser } = useAuth();
 *   const { syncStatus, setSyncStatus } = useCanvasSyncStatus();
 *
 *   const { isLoading } = useCanvasSubscriptions({
 *     projectId: 'my-project',
 *     currentUser,
 *     onSyncStatusChange: setSyncStatus,
 *   });
 *
 *   if (isLoading) return <LoadingSkeleton />;
 *   return <CanvasStage />;
 * }
 */
export function useCanvasSubscriptions({
  projectId,
  currentUser,
  onSyncStatusChange,
}: UseCanvasSubscriptionsParams): UseCanvasSubscriptionsReturn {
  const { setObjects } = useCanvasStore();
  const [isLoading, setIsLoading] = useState(true);
  const migrationRunRef = useRef(false); // Track if migration has been executed for this project

  /**
   * Set user as online with automatic disconnect handling
   * Also cleans up any stale drag states and cursors from previous sessions
   *
   * Firebase onDisconnect() will mark user offline on:
   * - Browser close/crash
   * - Network disconnect
   * - Tab close
   */
  useEffect(() => {
    if (!currentUser) return;

    // Use username with smart fallback to email username (not full email)
    const username = getUserDisplayName(currentUser.username, currentUser.email);

    // Set user online (includes automatic onDisconnect cleanup)
    setOnline(projectId, currentUser.uid, username).catch(() => {});

    // Clean up any stale drag states from previous sessions
    cleanupStaleDragStates(projectId).catch(() => {});

    // Clean up any stale cursors from previous sessions
    cleanupStaleCursors(projectId).catch(() => {});

    // Note: No explicit cleanup needed - onDisconnect() handles it
  }, [currentUser, projectId]);

  /**
   * Subscribe to drag states to track which objects current user is dragging
   * This prevents remote updates from causing handle jump during drag
   *
   * PERFORMANCE FIX: Uses global manipulation tracker instead of local ref
   * to enable immediate tracking in useGroupDrag before Firebase write completes
   */
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToDragStates(projectId, (dragStates) => {
      // Track which objects the current user is actively dragging
      Object.entries(dragStates).forEach(([objectId, dragState]) => {
        if (dragState.userId === currentUser.uid) {
          markManipulated(objectId);
        } else {
          unmarkManipulated(objectId);
        }
      });
    });

    return unsubscribe;
  }, [currentUser, projectId]);

  /**
   * Subscribe to resize states to track which objects current user is resizing
   * This prevents remote updates from causing handle jump during resize
   *
   * PERFORMANCE FIX: Uses global manipulation tracker instead of local ref
   * to enable immediate tracking in useResize before Firebase write completes
   */
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToResizeStates(projectId, (resizeStates) => {
      // Track which objects the current user is actively resizing
      Object.entries(resizeStates).forEach(([objectId, resizeState]) => {
        if (resizeState.userId === currentUser.uid) {
          markManipulated(objectId);
        } else {
          unmarkManipulated(objectId);
        }
      });
    });

    return unsubscribe;
  }, [currentUser, projectId]);

  /**
   * Subscribe to edit states to track which text objects current user is editing
   * This prevents remote updates from overwriting text content during editing
   * CRITICAL FIX: Prevents textarea flickering and text reverting to stored value
   */
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToEditStates(projectId, (editStates) => {
      // Track which text objects the current user is actively editing
      Object.entries(editStates).forEach(([textId, editState]) => {
        if (editState.userId === currentUser.uid) {
          markManipulated(textId);
        } else {
          unmarkManipulated(textId);
        }
      });
    });

    return unsubscribe;
  }, [currentUser, projectId]);

  /**
   * Subscribe to Realtime Database for real-time canvas updates
   * Cleanup subscription on unmount
   *
   * CRITICAL FIX: Uses selective merge to avoid overwriting objects being
   * actively manipulated by the current user. This prevents the "jumping handles"
   * bug where remote updates would overwrite local optimistic updates during drag/resize.
   *
   * HIERARCHY MIGRATION: On first load, runs a one-time migration to flatten any
   * non-group hierarchies (enforces rule that only groups can have children).
   */
  useEffect(() => {
    let isFirstLoad = true;
    // Reset migration flag when project changes
    migrationRunRef.current = false;

    try {
      // Subscribe to project-specific canvas objects in RTDB
      const unsubscribe = subscribeToCanvasObjects(projectId, async (remoteObjects) => {
        // On first load, run migration and accept all remote objects
        if (isFirstLoad) {
          // Check if migration is needed and hasn't been run yet
          if (!migrationRunRef.current && needsMigration(remoteObjects)) {
            console.log('[Hierarchy Migration] Detected non-group parent-child relationships. Running migration...');

            // Run migration to flatten non-group hierarchies
            const result = flattenNonGroupHierarchies(remoteObjects);

            console.log(`[Hierarchy Migration] Flattened ${result.flattenedCount} objects to root level:`, result.flattenedIds);

            // Update local state with migrated objects
            setObjects(result.objects);

            // Sync flattened objects back to Firebase (only update objects that changed)
            if (result.flattenedCount > 0) {
              try {
                const updates: Record<string, Partial<import('@/types').CanvasObject>> = {};
                result.flattenedIds.forEach((id) => {
                  updates[id] = { parentId: null, updatedAt: Date.now() };
                });

                await batchUpdateCanvasObjects(projectId, updates);
                console.log('[Hierarchy Migration] Successfully synced flattened hierarchies to Firebase');
              } catch (error) {
                console.error('[Hierarchy Migration] Failed to sync to Firebase:', error);
              }
            }

            // Mark migration as run
            migrationRunRef.current = true;
          } else {
            // No migration needed - just set objects
            setObjects(remoteObjects);
          }

          setIsLoading(false);
          isFirstLoad = false;
          return;
        }

        // For subsequent updates, perform selective merge
        // Skip objects that the current user is actively manipulating to prevent handle jumping
        const { objects: localObjects } = useCanvasStore.getState();

        // Build a map of local objects for quick lookup
        const localObjectsMap = new Map(localObjects.map(obj => [obj.id, obj]));

        // Merge: Keep local version of actively manipulated objects, use remote for others
        // PERFORMANCE FIX: Uses global manipulation tracker for immediate tracking
        const mergedObjects = remoteObjects.map(remoteObj => {
          // If current user is actively manipulating this object, keep local version
          if (isManipulated(remoteObj.id)) {
            const localObj = localObjectsMap.get(remoteObj.id);
            // If we have a local version, use it; otherwise fall back to remote
            return localObj || remoteObj;
          }

          // Otherwise, use remote version
          return remoteObj;
        });

        // Also include any local objects that don't exist remotely yet
        // (e.g., objects that were just created locally and haven't synced yet)
        localObjects.forEach(localObj => {
          const existsRemotely = remoteObjects.some(remoteObj => remoteObj.id === localObj.id);
          if (!existsRemotely && isManipulated(localObj.id)) {
            mergedObjects.push(localObj);
          }
        });

        // Update store with merged objects
        setObjects(mergedObjects);

        // Show brief "synced" indicator when data updates
        // (only if we're online - don't show during offline mode)
        if (navigator.onLine) {
          onSyncStatusChange('synced');
        }
      });

      // Cleanup: unsubscribe on unmount
      return () => {
        unsubscribe();
      };
    } catch {
      // Mark loading as complete even on error
      setIsLoading(false);
    }
    // Re-subscribe when projectId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return {
    isLoading,
  };
}
