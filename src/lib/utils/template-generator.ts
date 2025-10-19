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
import { uploadImageToStorage } from '@/lib/firebase/storage';

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
 * Deep clone a canvas object
 *
 * Creates a deep copy of a canvas object with a new unique ID.
 * This ensures each project gets completely independent template objects
 * that won't affect other projects when edited.
 *
 * @param obj - Canvas object to clone
 * @returns Deep copy with new UUID
 */
function deepCloneCanvasObject(obj: CanvasObject): CanvasObject {
  // Parse and stringify to create a deep copy
  const cloned = JSON.parse(JSON.stringify(obj)) as CanvasObject;

  // Generate new unique ID for the clone
  cloned.id = crypto.randomUUID();

  return cloned;
}

/**
 * Upload Template Image to Firebase Storage
 *
 * Fetches a template image from the public folder and uploads it to Firebase Storage.
 * Each project gets its own copy of template images in Storage.
 *
 * @param fileName - Image filename (e.g., "adaptive-icon.png")
 * @param projectId - Firebase project ID
 * @returns Promise resolving to Storage URL and path
 * @throws Error if fetch or upload fails
 */
async function uploadTemplateImage(
  fileName: string,
  projectId: string
): Promise<{ src: string; storagePath: string }> {
  try {
    // Fetch image from public folder
    const publicUrl = `${window.location.origin}/templates/${fileName}`;
    const response = await fetch(publicUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch template image: ${response.statusText}`);
    }

    // Convert to Blob
    const blob = await response.blob();

    // Create File object (uploadImageToStorage expects File)
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });

    // Upload to Firebase Storage
    // Path: projects/{projectId}/template-images/{fileName}
    const result = await uploadImageToStorage(
      file,
      projectId, // roomId
      'system', // userId (system-generated)
      undefined, // no progress callback needed
      undefined // no abort signal
    );

    console.log(`✅ Uploaded template image: ${fileName} → ${result.storagePath}`);

    return {
      src: result.url,
      storagePath: result.storagePath,
    };
  } catch (error) {
    console.error(`❌ Failed to upload template image ${fileName}:`, error);
    throw error;
  }
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
 * Template images are uploaded to Firebase Storage when the project is created.
 * This ensures images work correctly with the ImageShape component.
 *
 * @param projectId - Firebase project ID
 * @throws Error if Firebase write fails
 */
export async function generateTemplateObjects(projectId: string): Promise<void> {
  try {
    // Load template objects from JSON
    const templateObjects = loadTemplateObjects();

    // Deep clone all objects to ensure complete independence
    // This guarantees that editing objects in one project won't affect templates
    const clonedObjects = templateObjects.map(deepCloneCanvasObject);

    // Upload template images to Firebase Storage
    // This ensures images load correctly in ImageShape component
    const imageObjects = clonedObjects.filter((obj): obj is ImageObject => obj.type === 'image');

    console.log(`📸 Found ${imageObjects.length} template images to upload...`);

    // Upload each image to Firebase Storage
    for (const imageObj of imageObjects) {
      try {
        // Extract filename from the template object
        const fileName = imageObj.fileName;

        if (!fileName) {
          console.warn(`⚠️ Image object ${imageObj.id} has no fileName, skipping upload`);
          continue;
        }

        // Upload image to Firebase Storage
        const { src, storagePath } = await uploadTemplateImage(fileName, projectId);

        // Update the image object with Firebase Storage URL
        imageObj.src = src;
        imageObj.storageType = 'storage';
        imageObj.storagePath = storagePath;

        console.log(`✅ Updated image object ${imageObj.id}: ${fileName}`);
      } catch (error) {
        // Log error but continue with other images
        console.error(`❌ Failed to upload image ${imageObj.fileName}:`, error);
        // Keep the original src as fallback (will likely fail to load, but won't crash)
      }
    }

    console.log(`✅ Uploaded ${imageObjects.length} template images to Firebase Storage`);

    // Convert array to Firebase object structure
    // Firebase RTDB stores objects as { [id]: object } not arrays
    const objectsMap: Record<string, CanvasObject> = {};
    clonedObjects.forEach((obj) => {
      objectsMap[obj.id] = obj;
    });

    // Write to Firebase RTDB: /canvases/{projectId}/objects
    const objectsRef = ref(realtimeDb, `canvases/${projectId}/objects`);
    await set(objectsRef, objectsMap);
  } catch (error) {
    console.error('❌ Failed to generate template objects:', error);
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
