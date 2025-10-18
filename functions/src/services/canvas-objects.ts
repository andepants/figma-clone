/**
 * Canvas Objects Service
 *
 * Provides functions for single-object operations on canvas objects
 * in Firebase Realtime Database. All objects are written to:
 * canvases/{canvasId}/objects/{objectId}
 *
 * This service ensures:
 * - Proper object structure matching CanvasObject types
 * - UUID generation for new objects
 * - Timestamps and metadata
 * - Validation before writes
 *
 * For batch operations, see batch-operations.ts
 * For object building logic, see objectBuilder.ts
 *
 * @module canvas-objects
 */

import { getCanvasObjectRef } from './firebase-admin';
import { buildCanvasObject, BuildObjectParams } from './objectBuilder';
import { v4 as uuidv4 } from 'uuid';
import * as logger from 'firebase-functions/logger';

/**
 * Parameters for creating a canvas object
 * Re-export from objectBuilder for backward compatibility
 */
export interface CreateObjectParams extends BuildObjectParams {
  canvasId: string;
}

/**
 * Standard result returned by all canvas object operations
 */
export interface CanvasObjectResult {
  success: boolean;
  objectId?: string;
  objectIds?: string[];
  error?: string;
}

/**
 * Create a single canvas object in RTDB
 *
 * @param params - Object creation parameters
 * @returns Object ID of created object
 * @throws Error if RTDB write fails
 *
 * @example
 * const objectId = await createCanvasObject({
 *   canvasId: 'canvas-123',
 *   type: 'rectangle',
 *   position: { x: 100, y: 100 },
 *   dimensions: { width: 200, height: 150 },
 *   appearance: { fill: '#3b82f6' },
 *   userId: 'user-456',
 * });
 */
export async function createCanvasObject(params: CreateObjectParams): Promise<string> {
  logger.info('createCanvasObject called', {
    canvasId: params.canvasId,
    type: params.type,
    position: params.position,
    userId: params.userId,
  });

  const objectId = uuidv4();
  const ref = getCanvasObjectRef(params.canvasId, objectId);

  logger.info('Generated object ID and ref', {
    objectId,
    refPath: `canvases/${params.canvasId}/objects/${objectId}`,
  });

  // Build canvas object using shared builder
  const canvasObject = buildCanvasObject(params, objectId);

  logger.info('About to write to RTDB', {
    objectId,
    canvasId: params.canvasId,
    objectKeys: Object.keys(canvasObject),
    objectPreview: JSON.stringify(canvasObject).substring(0, 200),
  });

  try {
    // Write to RTDB
    await ref.set(canvasObject);

    logger.info('✅ Successfully wrote to RTDB', {
      objectId,
      canvasId: params.canvasId,
      type: params.type,
    });
  } catch (error) {
    logger.error('❌ Failed to write to RTDB', {
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      objectId,
      canvasId: params.canvasId,
      refPath: `canvases/${params.canvasId}/objects/${objectId}`,
    });
    throw error;
  }

  return objectId;
}

/**
 * Update properties of an existing canvas object
 *
 * @param canvasId - The canvas ID
 * @param objectId - The object ID
 * @param updates - Partial object properties to update
 * @throws Error if object doesn't exist or update fails
 *
 * @example
 * await updateCanvasObject('canvas-123', 'object-456', {
 *   x: 200,
 *   y: 300,
 *   fill: '#ef4444',
 * });
 */
export async function updateCanvasObject(
  canvasId: string,
  objectId: string,
  updates: Record<string, unknown>
): Promise<void> {
  logger.info('updateCanvasObject called', {
    canvasId,
    objectId,
    updateKeys: Object.keys(updates),
  });

  const ref = getCanvasObjectRef(canvasId, objectId);

  // Check if object exists
  const snapshot = await ref.once('value');
  if (!snapshot.exists()) {
    const errorMsg = `Object ${objectId} not found in canvas ${canvasId}`;
    logger.error('❌ Object not found', { canvasId, objectId });
    throw new Error(errorMsg);
  }

  // Add updatedAt timestamp
  const updateData = {
    ...updates,
    updatedAt: Date.now(),
  };

  try {
    await ref.update(updateData);

    logger.info('✅ Successfully updated object', {
      canvasId,
      objectId,
      updateKeys: Object.keys(updateData),
    });
  } catch (error) {
    logger.error('❌ Failed to update object', {
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      canvasId,
      objectId,
    });
    throw error;
  }
}

/**
 * Delete a canvas object from RTDB
 *
 * @param canvasId - The canvas ID
 * @param objectId - The object ID to delete
 * @throws Error if object doesn't exist or delete fails
 *
 * @example
 * await deleteCanvasObject('canvas-123', 'object-456');
 */
export async function deleteCanvasObject(
  canvasId: string,
  objectId: string
): Promise<void> {
  logger.info('deleteCanvasObject called', {
    canvasId,
    objectId,
  });

  const ref = getCanvasObjectRef(canvasId, objectId);

  // Check if object exists
  const snapshot = await ref.once('value');
  if (!snapshot.exists()) {
    const errorMsg = `Object ${objectId} not found in canvas ${canvasId}`;
    logger.error('❌ Object not found', { canvasId, objectId });
    throw new Error(errorMsg);
  }

  try {
    await ref.remove();

    logger.info('✅ Successfully deleted object', {
      canvasId,
      objectId,
    });
  } catch (error) {
    logger.error('❌ Failed to delete object', {
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      canvasId,
      objectId,
    });
    throw error;
  }
}

/**
 * Get a canvas object by ID
 *
 * @param canvasId - The canvas ID
 * @param objectId - The object ID
 * @returns Object data or null if not found
 *
 * @example
 * const object = await getCanvasObject('canvas-123', 'object-456');
 * if (object) {
 *   console.log('Object type:', object.type);
 * }
 */
export async function getCanvasObject(
  canvasId: string,
  objectId: string
): Promise<Record<string, unknown> | null> {
  logger.info('getCanvasObject called', {
    canvasId,
    objectId,
  });

  const ref = getCanvasObjectRef(canvasId, objectId);
  const snapshot = await ref.once('value');

  const exists = snapshot.exists();
  logger.info(`${exists ? '✅' : '❌'} Object ${exists ? 'found' : 'not found'}`, {
    canvasId,
    objectId,
  });

  return exists ? snapshot.val() : null;
}

// Re-export batch operations for convenience
export { batchCreateObjects, batchDeleteObjects } from './batch-operations';

// Re-export types from objectBuilder
export type { BuildObjectParams } from './objectBuilder';
