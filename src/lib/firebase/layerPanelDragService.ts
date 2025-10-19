/**
 * Layer Panel Drag Service
 *
 * Manages drag state locking for layer panel reordering operations to prevent
 * race conditions between local updates and Firebase sync, and to handle
 * multi-user scenarios gracefully.
 */

import { ref, set, onValue, remove, get } from 'firebase/database';
import { realtimeDb } from './config';

interface LayerDragState {
  userId: string;
  username: string;
  timestamp: number;
  objectIds: string[]; // IDs being reordered
}

const DRAG_TIMEOUT = 5000; // 5 seconds - auto-release stale locks

/**
 * Acquires a drag lock for layer panel reordering operations
 *
 * @param projectId - The project ID
 * @param userId - The current user's ID
 * @param username - The current user's name
 * @param objectIds - IDs of objects being reordered
 * @returns true if lock acquired, false if locked by another user
 */
export async function acquireLayerDragLock(
  projectId: string,
  userId: string,
  username: string,
  objectIds: string[]
): Promise<boolean> {
  const lockRef = ref(realtimeDb, `projects/${projectId}/layerDragLock`);

  try {
    // Check if there's an existing lock
    const snapshot = await get(lockRef);

    if (snapshot.exists()) {
      const existingLock = snapshot.val() as LayerDragState;

      // Allow same user to override their own lock
      if (existingLock.userId === userId) {
        await set(lockRef, {
          userId,
          username,
          timestamp: Date.now(),
          objectIds,
        });
        return true;
      }

      // Check if lock is stale (older than DRAG_TIMEOUT)
      const age = Date.now() - existingLock.timestamp;
      if (age > DRAG_TIMEOUT) {
        console.warn(`Releasing stale layer drag lock from ${existingLock.username}`);
        await set(lockRef, {
          userId,
          username,
          timestamp: Date.now(),
          objectIds,
        });
        return true;
      }

      // Lock held by another user
      console.log(`Layer drag locked by ${existingLock.username}`);
      return false;
    }

    // No existing lock - acquire it
    await set(lockRef, {
      userId,
      username,
      timestamp: Date.now(),
      objectIds,
    });
    return true;
  } catch (error) {
    console.error('Error acquiring layer drag lock:', error);
    return false;
  }
}

/**
 * Releases the layer drag lock
 *
 * @param projectId - The project ID
 * @param userId - The current user's ID
 */
export async function releaseLayerDragLock(
  projectId: string,
  userId: string
): Promise<void> {
  const lockRef = ref(realtimeDb, `projects/${projectId}/layerDragLock`);

  try {
    const snapshot = await get(lockRef);

    if (snapshot.exists()) {
      const existingLock = snapshot.val() as LayerDragState;

      // Only release if this user holds the lock
      if (existingLock.userId === userId) {
        await remove(lockRef);
      }
    }
  } catch (error) {
    console.error('Error releasing layer drag lock:', error);
  }
}

/**
 * Subscribe to layer drag lock changes
 *
 * @param projectId - The project ID
 * @param callback - Called when lock state changes
 * @returns Unsubscribe function
 */
export function subscribeToLayerDragLock(
  projectId: string,
  callback: (lock: LayerDragState | null) => void
): () => void {
  const lockRef = ref(realtimeDb, `projects/${projectId}/layerDragLock`);

  const unsubscribe = onValue(lockRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as LayerDragState);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

/**
 * Check if layer panel is currently locked for dragging
 *
 * @param projectId - The project ID
 * @param userId - The current user's ID
 * @returns true if locked by another user
 */
export async function isLayerDragLocked(
  projectId: string,
  userId: string
): Promise<boolean> {
  const lockRef = ref(realtimeDb, `projects/${projectId}/layerDragLock`);

  try {
    const snapshot = await get(lockRef);

    if (!snapshot.exists()) {
      return false;
    }

    const lock = snapshot.val() as LayerDragState;

    // Not locked if this user holds the lock
    if (lock.userId === userId) {
      return false;
    }

    // Check if lock is stale
    const age = Date.now() - lock.timestamp;
    if (age > DRAG_TIMEOUT) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking layer drag lock:', error);
    return false;
  }
}
