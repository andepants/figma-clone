/**
 * Template Generator Utility
 *
 * Loads default template from JSON and generates canvas objects for new projects.
 * Template is exported from a source project using the export script.
 *
 * All templates are loaded client-side and written directly to Firebase RTDB.
 */

import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase/realtimedb';
import type { CanvasObject, ImageObject } from '@/types/canvas.types';
import defaultTemplate from '@/lib/templates/default-template.json';

/**
 * Template Image URLs
 *
 * Pre-uploaded to Firebase Storage with public read access.
 * These are the primary source for template images.
 */
const FIREBASE_STORAGE_URLS: Record<string, string> = {
  'adaptive-icon.png': 'https://firebasestorage.googleapis.com/v0/b/figma-clone-d33e3.firebasestorage.app/o/templates%2Fadaptive-icon.png?alt=media&token=dc615e96-5dcb-4906-b3f1-770cc7942d1a',
  'ios-dark.png': 'https://firebasestorage.googleapis.com/v0/b/figma-clone-d33e3.firebasestorage.app/o/templates%2Fios-dark.png?alt=media&token=6ee48427-19c5-47fb-bad8-d1c56662e36e',
  'ios-light.png': 'https://firebasestorage.googleapis.com/v0/b/figma-clone-d33e3.firebasestorage.app/o/templates%2Fios-light.png?alt=media&token=d29a356e-5008-4608-b6de-94303cc1d301',
};

/**
 * Get Template Image URL
 *
 * Returns local hosting URL in development, Firebase Storage in production.
 * This avoids CORS issues and ensures images load reliably in all environments.
 *
 * @param fileName - Template image filename
 * @returns Full URL to the template image
 */
function getTemplateImageUrl(fileName: string): string {
  // Use local hosting URL (works in both dev and production after build)
  // This avoids CORS issues with Firebase Storage in development
  return `${window.location.origin}/templates/${fileName}`;

  // Note: Firebase Storage URLs are kept above for reference but not used
  // If you need to use Firebase Storage in production, add environment check:
  // if (import.meta.env.PROD && FIREBASE_STORAGE_URLS[fileName]) {
  //   return FIREBASE_STORAGE_URLS[fileName];
  // }
}

/**
 * Load template objects from JSON
 *
 * Loads the default template exported from a source project.
 * Template includes all object types with proper hierarchy and z-index.
 *
 * @returns Array of template canvas objects
 */
function loadTemplateObjects(): CanvasObject[] {
  // Type assertion needed because JSON import doesn't preserve exact types
  return defaultTemplate.objects as CanvasObject[];
}

/**
 * Deep clone a canvas object with ID mapping
 *
 * Creates a deep copy of a canvas object with a new unique ID.
 * The ID mapping is stored in the provided map for later parentId remapping.
 * This ensures each project gets completely independent template objects
 * that won't affect other projects when edited.
 *
 * @param obj - Canvas object to clone
 * @param idMap - Map to store old ID -> new ID mapping
 * @returns Deep copy with new UUID
 */
function deepCloneCanvasObject(
  obj: CanvasObject,
  idMap: Map<string, string>
): CanvasObject {
  // Parse and stringify to create a deep copy
  const cloned = JSON.parse(JSON.stringify(obj)) as CanvasObject;

  // Generate new unique ID for the clone
  const newId = crypto.randomUUID();
  idMap.set(obj.id, newId);
  cloned.id = newId;

  return cloned;
}


/**
 * Generate Template Objects for New Project
 *
 * Loads template from JSON and creates starter canvas objects for every new project.
 * Template is exported from a source project using the export script.
 *
 * IMPORTANT: Each project gets completely independent copies of template objects.
 * Editing template objects in one project will NOT affect other projects.
 *
 * Template images use pre-uploaded Firebase Storage URLs (see TEMPLATE_IMAGE_URLS).
 * This ensures instant project creation with no upload delays.
 *
 * @param projectId - Firebase project ID
 * @param userId - Current user ID (for ownership)
 * @throws Error if Firebase write fails
 */
export async function generateTemplateObjects(
  projectId: string,
  userId: string
): Promise<void> {
  try {
    // Load template objects from JSON
    const templateObjects = loadTemplateObjects();

    // Pass 1: Deep clone all objects and build ID mapping
    // This guarantees that editing objects in one project won't affect templates
    const idMap = new Map<string, string>();
    const clonedObjects = templateObjects.map((obj) =>
      deepCloneCanvasObject(obj, idMap)
    );

    // Pass 2: Remap parentId references to new IDs
    clonedObjects.forEach((obj) => {
      // Remap parentId if it exists and has a new ID mapping
      if (obj.parentId && idMap.has(obj.parentId)) {
        obj.parentId = idMap.get(obj.parentId);
      }

      // Set ownership to actual user (not 'system')
      obj.createdBy = userId;
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });

    // Update image objects with pre-uploaded Firebase Storage URLs
    const imageObjects = clonedObjects.filter((obj): obj is ImageObject => obj.type === 'image');

    console.log(`📸 Found ${imageObjects.length} template images`);

    for (const imageObj of imageObjects) {
      const fileName = imageObj.fileName;

      if (!fileName) {
        console.warn(`⚠️ Image object ${imageObj.id} has no fileName, skipping`);
        continue;
      }

      // Use hosting URL (works in dev and production)
      imageObj.src = getTemplateImageUrl(fileName);
      imageObj.storageType = 'dataURL'; // Not actually a data URL, but not in Storage either
      delete imageObj.storagePath; // No storage path since it's served from hosting

      console.log(`✅ Using hosting URL for ${fileName}: ${imageObj.src}`);
    }

    console.log(`✅ Updated ${imageObjects.length} template images with hosting URLs`);

    // Convert array to Firebase object structure
    // Firebase RTDB stores objects as { [id]: object } not arrays
    const objectsMap: Record<string, CanvasObject> = {};
    clonedObjects.forEach((obj) => {
      objectsMap[obj.id] = obj;
    });

    // Write to Firebase RTDB: /canvases/{projectId}/objects
    const objectsRef = ref(realtimeDb, `canvases/${projectId}/objects`);
    await set(objectsRef, objectsMap);

    console.log(`✅ Template generation complete for project ${projectId}`);
  } catch (error) {
    console.error('❌ Failed to generate template objects:', error);
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
