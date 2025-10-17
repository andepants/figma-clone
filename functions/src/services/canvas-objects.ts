/**
 * Canvas Objects Service
 *
 * Provides functions for creating, updating, and deleting canvas objects
 * in Firebase Realtime Database. All objects are written to:
 * canvases/{canvasId}/objects/{objectId}
 *
 * This service ensures:
 * - Proper object structure matching CanvasObject types
 * - UUID generation for new objects
 * - Timestamps and metadata
 * - Validation before writes
 * - Batch operations for multiple objects
 *
 * @module canvas-objects
 */

import { getCanvasObjectsRef, getCanvasObjectRef } from './firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import * as logger from 'firebase-functions/logger';

/**
 * Parameters for creating a canvas object
 * Matches the frontend CanvasObject types
 */
export interface CreateObjectParams {
  canvasId: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'image';
  position: { x: number; y: number };

  // Dimension-based properties (rectangle, text, image)
  dimensions?: { width: number; height: number };

  // Circle-specific
  radius?: number;

  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;

  // Line-specific
  points?: [number, number, number, number];

  // Image-specific
  imageUrl?: string;

  // Visual properties
  appearance: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };

  // Transform properties
  rotation?: number;

  // Metadata
  name?: string;
  userId: string;
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
  const now = Date.now();

  logger.info('Generated object ID and ref', {
    objectId,
    refPath: `canvases/${params.canvasId}/objects/${objectId}`,
  });

  // Build base object
  const canvasObject: Record<string, unknown> = {
    id: objectId,
    type: params.type,
    x: params.position.x,
    y: params.position.y,
    createdBy: params.userId,
    createdAt: now,
    updatedAt: now,
    name: params.name || `${params.type}_${now}`,
    visible: true,
    locked: false,
    aiGenerated: true, // Mark as AI-generated
  };

  // Add type-specific properties
  switch (params.type) {
    case 'rectangle':
      if (!params.dimensions) {
        throw new Error('Rectangle requires dimensions (width, height)');
      }
      canvasObject.width = params.dimensions.width;
      canvasObject.height = params.dimensions.height;
      canvasObject.fill = params.appearance.fill || '#cccccc';
      break;

    case 'circle':
      if (!params.radius) {
        throw new Error('Circle requires radius');
      }
      canvasObject.radius = params.radius;
      canvasObject.fill = params.appearance.fill || '#cccccc';
      break;

    case 'text':
      if (!params.text) {
        throw new Error('Text requires text content');
      }
      if (!params.dimensions) {
        throw new Error('Text requires dimensions (width, height)');
      }
      canvasObject.text = params.text;
      canvasObject.fontSize = params.fontSize || 24;
      canvasObject.fontFamily = params.fontFamily || 'Inter';
      canvasObject.width = params.dimensions.width;
      canvasObject.height = params.dimensions.height;
      canvasObject.fill = params.appearance.fill || '#000000';
      break;

    case 'line': {
      if (!params.points) {
        throw new Error('Line requires points array [x1, y1, x2, y2]');
      }
      canvasObject.points = params.points;
      // Calculate width (length) from points
      const [x1, y1, x2, y2] = params.points;
      canvasObject.width = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      canvasObject.stroke = params.appearance.stroke || '#000000';
      canvasObject.strokeWidth = params.appearance.strokeWidth || 2;
      break;
    }

    case 'image':
      if (!params.imageUrl) {
        throw new Error('Image requires imageUrl');
      }
      if (!params.dimensions) {
        throw new Error('Image requires dimensions (width, height)');
      }
      canvasObject.imageUrl = params.imageUrl;
      canvasObject.width = params.dimensions.width;
      canvasObject.height = params.dimensions.height;
      break;
  }

  // Add optional appearance properties
  if (params.appearance.stroke) {
    canvasObject.stroke = params.appearance.stroke;
  }
  if (params.appearance.strokeWidth !== undefined) {
    canvasObject.strokeWidth = params.appearance.strokeWidth;
  }
  if (params.appearance.opacity !== undefined) {
    canvasObject.opacity = params.appearance.opacity;
  }

  // Add optional transform properties
  if (params.rotation !== undefined) {
    canvasObject.rotation = params.rotation;
  }

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
 * Create multiple canvas objects in a single batch operation
 *
 * @param canvasId - The canvas ID
 * @param objects - Array of object creation parameters
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
  objects: Omit<CreateObjectParams, 'canvasId'>[]
): Promise<string[]> {
  logger.info('batchCreateObjects called', {
    canvasId,
    objectCount: objects.length,
  });

  const updates: Record<string, unknown> = {};
  const objectIds: string[] = [];
  const now = Date.now();

  for (const obj of objects) {
    const objectId = uuidv4();
    objectIds.push(objectId);

    // Build object (same logic as createCanvasObject)
    const canvasObject: Record<string, unknown> = {
      id: objectId,
      type: obj.type,
      x: obj.position.x,
      y: obj.position.y,
      createdBy: obj.userId,
      createdAt: now,
      updatedAt: now,
      name: obj.name || `${obj.type}_${now}`,
      visible: true,
      locked: false,
      aiGenerated: true,
    };

    // Add type-specific properties (same switch as above)
    switch (obj.type) {
      case 'rectangle':
        if (!obj.dimensions) throw new Error('Rectangle requires dimensions');
        canvasObject.width = obj.dimensions.width;
        canvasObject.height = obj.dimensions.height;
        canvasObject.fill = obj.appearance.fill || '#cccccc';
        break;

      case 'circle':
        if (!obj.radius) throw new Error('Circle requires radius');
        canvasObject.radius = obj.radius;
        canvasObject.fill = obj.appearance.fill || '#cccccc';
        break;

      case 'text':
        if (!obj.text) throw new Error('Text requires text content');
        if (!obj.dimensions) throw new Error('Text requires dimensions');
        canvasObject.text = obj.text;
        canvasObject.fontSize = obj.fontSize || 24;
        canvasObject.fontFamily = obj.fontFamily || 'Inter';
        canvasObject.width = obj.dimensions.width;
        canvasObject.height = obj.dimensions.height;
        canvasObject.fill = obj.appearance.fill || '#000000';
        break;

      case 'line': {
        if (!obj.points) throw new Error('Line requires points array');
        canvasObject.points = obj.points;
        const [x1, y1, x2, y2] = obj.points;
        canvasObject.width = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        canvasObject.stroke = obj.appearance.stroke || '#000000';
        canvasObject.strokeWidth = obj.appearance.strokeWidth || 2;
        break;
      }

      case 'image':
        if (!obj.imageUrl) throw new Error('Image requires imageUrl');
        if (!obj.dimensions) throw new Error('Image requires dimensions');
        canvasObject.imageUrl = obj.imageUrl;
        canvasObject.width = obj.dimensions.width;
        canvasObject.height = obj.dimensions.height;
        break;
    }

    // Add optional properties
    if (obj.appearance.stroke) canvasObject.stroke = obj.appearance.stroke;
    if (obj.appearance.strokeWidth !== undefined) canvasObject.strokeWidth = obj.appearance.strokeWidth;
    if (obj.appearance.opacity !== undefined) canvasObject.opacity = obj.appearance.opacity;
    if (obj.rotation !== undefined) canvasObject.rotation = obj.rotation;

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
  const ref = getCanvasObjectRef(canvasId, objectId);

  // Check if object exists
  const snapshot = await ref.once('value');
  if (!snapshot.exists()) {
    throw new Error(`Object ${objectId} not found in canvas ${canvasId}`);
  }

  // Add updatedAt timestamp
  const updateData = {
    ...updates,
    updatedAt: Date.now(),
  };

  await ref.update(updateData);
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
  const ref = getCanvasObjectRef(canvasId, objectId);

  // Check if object exists
  const snapshot = await ref.once('value');
  if (!snapshot.exists()) {
    throw new Error(`Object ${objectId} not found in canvas ${canvasId}`);
  }

  await ref.remove();
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
  const updates: Record<string, null> = {};

  // Set each object path to null (RTDB delete syntax)
  for (const objectId of objectIds) {
    updates[`canvases/${canvasId}/objects/${objectId}`] = null;
  }

  // Single multi-path update with null values deletes them
  await getCanvasObjectsRef(canvasId).root.update(updates);
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
  const ref = getCanvasObjectRef(canvasId, objectId);
  const snapshot = await ref.once('value');

  return snapshot.exists() ? snapshot.val() : null;
}
