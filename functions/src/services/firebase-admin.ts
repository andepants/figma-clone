/**
 * Firebase Admin SDK Initialization
 *
 * Provides centralized access to Firebase Admin services including:
 * - Realtime Database for canvas objects
 * - Firestore for metadata
 * - Authentication for user management
 *
 * This module ensures the Firebase Admin SDK is initialized only once
 * and provides helper functions to access common database references.
 *
 * @module firebase-admin
 */

import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * Only initializes once, safe to import multiple times
 *
 * Environment Detection:
 * - Production: Uses production RTDB (figma-clone-d33e3)
 * - Local Dev (Emulator): Uses local RTDB emulator on port 9000
 *
 * The emulator is automatically detected via FIREBASE_DATABASE_EMULATOR_HOST
 * environment variable set by Firebase Functions emulator.
 */
if (!admin.apps.length) {
  const isEmulator = process.env.FIREBASE_DATABASE_EMULATOR_HOST !== undefined;

  if (isEmulator) {
    // Running in emulator - use local database
    console.log('🔧 Firebase Admin: Using RTDB Emulator');
    admin.initializeApp({
      projectId: 'figma-clone-d33e3',
      databaseURL: 'http://127.0.0.1:9000/?ns=figma-clone-d33e3-default-rtdb',
    });
  } else {
    // Production - use real database
    console.log('🚀 Firebase Admin: Using Production RTDB');
    admin.initializeApp({
      databaseURL: 'https://figma-clone-d33e3-default-rtdb.firebaseio.com',
    });
  }
}

/**
 * Firebase Realtime Database instance
 * Used for real-time canvas object synchronization
 */
export const db = admin.database();

/**
 * Firestore instance
 * Used for metadata and configuration storage
 */
export const firestore = admin.firestore();

/**
 * Firebase Auth instance
 * Used for user authentication and management
 */
export const auth = admin.auth();

/**
 * Get a reference to a specific canvas in RTDB
 *
 * @param canvasId - The canvas ID
 * @returns Database reference to the canvas
 *
 * @example
 * const canvasRef = getCanvasRef('canvas-123');
 * const snapshot = await canvasRef.once('value');
 */
export function getCanvasRef(canvasId: string) {
  return db.ref(`canvases/${canvasId}`);
}

/**
 * Get a reference to all objects in a canvas
 *
 * @param canvasId - The canvas ID
 * @returns Database reference to the canvas objects collection
 *
 * @example
 * const objectsRef = getCanvasObjectsRef('canvas-123');
 * const snapshot = await objectsRef.once('value');
 * const objects = snapshot.val();
 */
export function getCanvasObjectsRef(canvasId: string) {
  return db.ref(`canvases/${canvasId}/objects`);
}

/**
 * Get a reference to a specific object in a canvas
 *
 * @param canvasId - The canvas ID
 * @param objectId - The object ID
 * @returns Database reference to the specific object
 *
 * @example
 * const objectRef = getCanvasObjectRef('canvas-123', 'object-456');
 * await objectRef.update({ x: 100, y: 200 });
 */
export function getCanvasObjectRef(canvasId: string, objectId: string) {
  return db.ref(`canvases/${canvasId}/objects/${objectId}`);
}
