/**
 * Authorization Service
 *
 * Verifies user permissions for canvas operations.
 * Checks canvas ownership and explicit permissions.
 */

import { db } from './firebase-admin';
import * as logger from 'firebase-functions/logger';

export type CanvasPermission = 'owner' | 'edit' | 'view';

/**
 * Check if user has permission to modify a canvas
 *
 * @param userId - Firebase auth user ID
 * @param canvasId - Canvas identifier
 * @returns true if user can modify canvas, false otherwise
 */
export async function canUserModifyCanvas(
  userId: string,
  canvasId: string
): Promise<boolean> {
  try {
    // Check explicit permissions first
    const permissionRef = db.ref(`canvases/${canvasId}/permissions/${userId}`);
    const permissionSnapshot = await permissionRef.once('value');
    const permission = permissionSnapshot.val() as CanvasPermission | null;

    if (permission === 'owner' || permission === 'edit') {
      return true;
    }

    if (permission === 'view') {
      return false;
    }

    // If no explicit permission, check if user is owner
    const ownerRef = db.ref(`canvases/${canvasId}/ownerId`);
    const ownerSnapshot = await ownerRef.once('value');
    const ownerId = ownerSnapshot.val();

    if (!ownerId) {
      logger.warn('Canvas has no owner', { canvasId });
      return false;
    }

    return ownerId === userId;
  } catch (error) {
    logger.error('Error checking canvas permissions', {
      error,
      userId,
      canvasId,
    });
    return false;
  }
}

/**
 * Check if user has any access to a canvas (including view-only)
 *
 * @param userId - Firebase auth user ID
 * @param canvasId - Canvas identifier
 * @returns true if user can view canvas, false otherwise
 */
export async function canUserViewCanvas(
  userId: string,
  canvasId: string
): Promise<boolean> {
  try {
    // Check explicit permissions
    const permissionRef = db.ref(`canvases/${canvasId}/permissions/${userId}`);
    const permissionSnapshot = await permissionRef.once('value');
    const permission = permissionSnapshot.val() as CanvasPermission | null;

    if (permission) {
      return true; // Any permission grants view access
    }

    // Check if user is owner
    const ownerRef = db.ref(`canvases/${canvasId}/ownerId`);
    const ownerSnapshot = await ownerRef.once('value');
    const ownerId = ownerSnapshot.val();

    return ownerId === userId;
  } catch (error) {
    logger.error('Error checking canvas view permissions', {
      error,
      userId,
      canvasId,
    });
    return false;
  }
}

/**
 * Get user's permission level for a canvas
 *
 * @param userId - Firebase auth user ID
 * @param canvasId - Canvas identifier
 * @returns permission level or null if no access
 */
export async function getUserPermission(
  userId: string,
  canvasId: string
): Promise<CanvasPermission | null> {
  try {
    // Check explicit permissions
    const permissionRef = db.ref(`canvases/${canvasId}/permissions/${userId}`);
    const permissionSnapshot = await permissionRef.once('value');
    const permission = permissionSnapshot.val() as CanvasPermission | null;

    if (permission) {
      return permission;
    }

    // Check if user is owner
    const ownerRef = db.ref(`canvases/${canvasId}/ownerId`);
    const ownerSnapshot = await ownerRef.once('value');
    const ownerId = ownerSnapshot.val();

    if (ownerId === userId) {
      return 'owner';
    }

    return null;
  } catch (error) {
    logger.error('Error getting user permission', {
      error,
      userId,
      canvasId,
    });
    return null;
  }
}
