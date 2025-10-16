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
import * as logger from 'firebase-functions/logger';

/**
 * Initialize Firebase Admin SDK
 * Only initializes once, safe to call multiple times
 *
 * Environment Detection:
 * - Production: Uses production RTDB (figma-clone-d33e3)
 * - Local Dev (Emulator): Uses local RTDB emulator on port 9000
 *
 * The emulator is automatically detected via FIREBASE_DATABASE_EMULATOR_HOST
 * environment variable set by Firebase Functions emulator.
 */
function ensureInitialized() {
  logger.info('ensureInitialized called', {
    appsLength: admin.apps.length,
    hasDefaultApp: admin.apps.length > 0,
  });

  // Check if app exists AND is properly configured
  if (admin.apps.length > 0) {
    try {
      // Test if the app is actually usable by trying to access it
      const app = admin.app();
      logger.info('Testing existing admin app', {
        projectId: app.options.projectId,
        databaseURL: app.options.databaseURL,
      });

      // If we can access it without error, it's initialized correctly
      logger.info('Admin app already initialized and working, skipping');
      return;
    } catch (testError) {
      // App exists but is broken - delete it and reinitialize
      logger.warn('Existing admin app is broken, deleting and reinitializing', {
        error: testError,
      });
      try {
        admin.app().delete();
        logger.info('Deleted broken admin app');
      } catch (deleteError) {
        logger.error('Failed to delete broken app', {error: deleteError});
      }
    }
  }

  try {
    const isEmulator = process.env.FIREBASE_DATABASE_EMULATOR_HOST !== undefined;
    logger.info('Environment check', {isEmulator});

    if (isEmulator) {
      // Running in emulator - use local database
      logger.info('🔧 Firebase Admin: Initializing with RTDB Emulator');
      admin.initializeApp({
        projectId: 'figma-clone-d33e3',
        databaseURL: 'http://127.0.0.1:9000/?ns=figma-clone-d33e3-default-rtdb',
      });
    } else {
      // Production - use Application Default Credentials
      // When running in Firebase Functions, admin.initializeApp() with no params
      // automatically uses the service account and project settings
      logger.info('🚀 Firebase Admin: Initializing with Production (ADC)');
      admin.initializeApp();
    }
    logger.info('✅ Firebase Admin SDK initialized successfully', {
      apps: admin.apps.length,
      projectId: admin.app().options.projectId,
      databaseURL: admin.app().options.databaseURL,
    });
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Get Firebase Realtime Database instance
 * Used for real-time canvas object synchronization
 */
export function getDatabase() {
  ensureInitialized();
  return admin.database();
}

/**
 * Get Firestore instance
 * Used for metadata and configuration storage
 */
export function getFirestore() {
  ensureInitialized();
  return admin.firestore();
}

/**
 * Get Firebase Auth instance
 * Used for user authentication and management
 */
export function getAuth() {
  ensureInitialized();
  return admin.auth();
}

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
  return getDatabase().ref(`canvases/${canvasId}`);
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
  return getDatabase().ref(`canvases/${canvasId}/objects`);
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
  return getDatabase().ref(`canvases/${canvasId}/objects/${objectId}`);
}
