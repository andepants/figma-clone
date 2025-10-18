/**
 * Batch Canvas Operations
 *
 * Provides functions for batch operations on canvas objects in Firebase
 * Realtime Database. Batch operations are more efficient for multiple
 * objects as they use a single multi-path update.
 *
 * This service handles:
 * - Batch object creation (multiple objects in one write)
 * - Batch object deletion (multiple objects in one write)
 * - Transaction management for atomic updates
 *
 * @module batch-operations
 */

import { getCanvasObjectsRef } from './firebase-admin';
import { buildCanvasObject, BuildObjectParams } from './objectBuilder';
import { v4 as uuidv4 } from 'uuid';
import * as logger from 'firebase-functions/logger';

/**
 * Create multiple canvas objects in a single batch operation
 *
 * @param canvasId - The canvas ID
 * @param objects - Array of object build parameters
 * @returns Array of created object IDs
 * @throws Error if batch write fails
 *
 * @example
 * const objectIds = await batchCreateObjects('canvas-123', [
 *   { type: 'rectangle', position: { x: 0, y: 0 }, ... },
 *   { type: 'circle', position: { x: 100, y: 100 }, ... },
 * ]);
 */
export async function batchCreateObjects(
  canvasId: string,
  objects: BuildObjectParams[]
): Promise<string[]> {
  logger.info('batchCreateObjects called', {
    canvasId,
    objectCount: objects.length,
  });

  const updates: Record<string, unknown> = {};
  const objectIds: string[] = [];
  const now = Date.now();

  // Build all objects
  for (const obj of objects) {
    const objectId = uuidv4();
    objectIds.push(objectId);

    // Use shared object builder
    const canvasObject = buildCanvasObject(obj, objectId, now);

    // Add to updates map
    updates[`canvases/${canvasId}/objects/${objectId}`] = canvasObject;
  }

  logger.info('About to batch write to RTDB', {
    canvasId,
    objectCount: objectIds.length,
    updatePaths: Object.keys(updates),
  });

  try {
    // Single multi-path update
    await getCanvasObjectsRef(canvasId).root.update(updates);

    logger.info('✅ Successfully batch wrote to RTDB', {
      canvasId,
      objectCount: objectIds.length,
      objectIds,
    });
  } catch (error) {
    logger.error('❌ Failed to batch write to RTDB', {
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      canvasId,
      objectCount: objectIds.length,
    });
    throw error;
  }

  return objectIds;
}

/**
 * Delete multiple canvas objects in a single batch operation
 *
 * @param canvasId - The canvas ID
 * @param objectIds - Array of object IDs to delete
 * @throws Error if batch delete fails
 *
 * @example
 * await batchDeleteObjects('canvas-123', ['obj1', 'obj2', 'obj3']);
 */
export async function batchDeleteObjects(
  canvasId: string,
  objectIds: string[]
): Promise<void> {
  logger.info('batchDeleteObjects called', {
    canvasId,
    objectCount: objectIds.length,
    objectIds,
  });

  const updates: Record<string, null> = {};

  // Set each object path to null (RTDB delete syntax)
  for (const objectId of objectIds) {
    updates[`canvases/${canvasId}/objects/${objectId}`] = null;
  }

  logger.info('About to batch delete from RTDB', {
    canvasId,
    objectCount: objectIds.length,
    updatePaths: Object.keys(updates),
  });

  try {
    // Single multi-path update with null values deletes them
    await getCanvasObjectsRef(canvasId).root.update(updates);

    logger.info('✅ Successfully batch deleted from RTDB', {
      canvasId,
      objectCount: objectIds.length,
      objectIds,
    });
  } catch (error) {
    logger.error('❌ Failed to batch delete from RTDB', {
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      canvasId,
      objectCount: objectIds.length,
    });
    throw error;
  }
}
