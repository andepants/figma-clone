/**
 * Firebase Transaction Utilities
 *
 * Utilities for batching multiple Firebase operations into atomic transactions.
 * Ensures all operations succeed or all fail together, preventing partial updates.
 *
 * @module features/layers-panel/utils/transactions
 */

import { ref, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase/config';
import type { CanvasObject } from '@/types/canvas.types';

/**
 * Firebase Realtime Database value type
 * Supports all primitive types, arrays, and nested objects
 */
type FirebaseValue = string | number | boolean | null | FirebaseValue[] | { [key: string]: FirebaseValue };

/**
 * Batch update multiple canvas objects atomically
 *
 * Uses Firebase multi-path update to ensure all changes happen together
 * or none happen at all. More reliable than sequential updates.
 *
 * @param canvasId - The canvas ID
 * @param updates - Map of objectId to partial updates
 * @returns Promise that resolves when all updates complete
 *
 * @example
 * ```typescript
 * await batchUpdateObjects('main', {
 *   'rect-1': { x: 100, y: 200 },
 *   'rect-2': { x: 150, y: 250 },
 * });
 * ```
 */
export async function batchUpdateObjects(
  canvasId: string,
  updates: Record<string, Partial<CanvasObject>>
): Promise<void> {
  const timestamp = Date.now();
  const multiPathUpdate: Record<string, FirebaseValue> = {};

  // Build multi-path update object
  Object.entries(updates).forEach(([objectId, objectUpdates]) => {
    Object.entries(objectUpdates).forEach(([key, value]) => {
      multiPathUpdate[`canvases/${canvasId}/objects/${objectId}/${key}`] = value as FirebaseValue;
    });
    // Always update timestamp
    multiPathUpdate[`canvases/${canvasId}/objects/${objectId}/updatedAt`] = timestamp;
  });

  const rootRef = ref(realtimeDb);
  await update(rootRef, multiPathUpdate);
}

/**
 * Batch delete multiple canvas objects atomically
 *
 * Uses Firebase multi-path update to delete all objects at once.
 * All deletions succeed or all fail together.
 *
 * @param canvasId - The canvas ID
 * @param objectIds - Array of object IDs to delete
 * @returns Promise that resolves when all deletions complete
 *
 * @example
 * ```typescript
 * await batchDeleteObjects('main', ['rect-1', 'rect-2', 'group-3']);
 * ```
 */
export async function batchDeleteObjects(
  canvasId: string,
  objectIds: string[]
): Promise<void> {
  const multiPathUpdate: Record<string, null> = {};

  // Set each object to null to delete it
  objectIds.forEach((objectId) => {
    multiPathUpdate[`canvases/${canvasId}/objects/${objectId}`] = null;
  });

  const rootRef = ref(realtimeDb);
  await update(rootRef, multiPathUpdate);
}

/**
 * Atomically move object and update z-indexes
 *
 * Batches parent change and z-index updates into single Firebase transaction.
 * Ensures consistency between hierarchy and rendering order.
 *
 * @param canvasId - The canvas ID
 * @param objectId - Object being moved
 * @param newParentId - New parent ID (null for root)
 * @param zIndexUpdates - Map of objectId to new zIndex
 * @returns Promise that resolves when transaction completes
 *
 * @example
 * ```typescript
 * await atomicMoveWithZIndexes('main', 'rect-1', 'group-2', {
 *   'rect-1': 5,
 *   'rect-2': 6,
 * });
 * ```
 */
export async function atomicMoveWithZIndexes(
  canvasId: string,
  objectId: string,
  newParentId: string | null,
  zIndexUpdates: Record<string, number>
): Promise<void> {
  const timestamp = Date.now();
  const multiPathUpdate: Record<string, FirebaseValue> = {};

  // Update parent
  multiPathUpdate[`canvases/${canvasId}/objects/${objectId}/parentId`] = newParentId;
  multiPathUpdate[`canvases/${canvasId}/objects/${objectId}/updatedAt`] = timestamp;

  // Update z-indexes
  Object.entries(zIndexUpdates).forEach(([id, zIndex]) => {
    multiPathUpdate[`canvases/${canvasId}/objects/${id}/zIndex`] = zIndex;
    multiPathUpdate[`canvases/${canvasId}/objects/${id}/updatedAt`] = timestamp;
  });

  const rootRef = ref(realtimeDb);
  await update(rootRef, multiPathUpdate);
}

/**
 * Cascade delete group and all descendants atomically
 *
 * Deletes a group and all its children/grandchildren in a single transaction.
 * Prevents partial deletions that would leave orphaned objects.
 *
 * @param canvasId - The canvas ID
 * @param groupId - Group ID to delete
 * @param descendantIds - All descendant IDs (from getAllDescendantIds)
 * @returns Promise that resolves when cascade deletion completes
 *
 * @example
 * ```typescript
 * const descendants = getAllDescendantIds('group-1', objects);
 * await cascadeDeleteGroup('main', 'group-1', descendants);
 * ```
 */
export async function cascadeDeleteGroup(
  canvasId: string,
  groupId: string,
  descendantIds: string[]
): Promise<void> {
  const idsToDelete = [groupId, ...descendantIds];
  await batchDeleteObjects(canvasId, idsToDelete);
}

/**
 * Atomically reorder objects with new z-indexes
 *
 * Updates all z-indexes in a single transaction, ensuring consistent rendering order.
 *
 * @param canvasId - The canvas ID
 * @param objects - Objects array in new order
 * @returns Promise that resolves when reordering completes
 *
 * @example
 * ```typescript
 * const reordered = [...objects];
 * // ... reorder logic ...
 * await atomicReorderObjects('main', reordered);
 * ```
 */
export async function atomicReorderObjects(
  canvasId: string,
  objects: CanvasObject[]
): Promise<void> {
  const timestamp = Date.now();
  const multiPathUpdate: Record<string, FirebaseValue> = {};

  // Update z-index for all objects (array index = z-index)
  objects.forEach((obj, index) => {
    multiPathUpdate[`canvases/${canvasId}/objects/${obj.id}/zIndex`] = index;
    multiPathUpdate[`canvases/${canvasId}/objects/${obj.id}/updatedAt`] = timestamp;
  });

  const rootRef = ref(realtimeDb);
  await update(rootRef, multiPathUpdate);
}

/**
 * Execute multiple operations as a single transaction with rollback
 *
 * Executes a function that performs multiple operations. If any operation fails,
 * attempts to rollback by restoring previous state.
 *
 * @param operation - Async function to execute
 * @param rollback - Async function to call on failure
 * @returns Promise that resolves with operation result or throws on failure
 *
 * @example
 * ```typescript
 * await withRollback(
 *   async () => {
 *     await batchUpdateObjects('main', updates);
 *     await batchDeleteObjects('main', deletions);
 *   },
 *   async () => {
 *     // Restore previous state
 *     setObjects(snapshot);
 *   }
 * );
 * ```
 */
export async function withRollback<T>(
  operation: () => Promise<T>,
  rollback: () => Promise<void>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Transaction failed, attempting rollback:', error);
    try {
      await rollback();
      console.log('Rollback successful');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  }
}
