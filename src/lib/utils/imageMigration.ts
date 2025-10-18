/**
 * Image Migration Utility
 *
 * Migrates legacy ImageObject instances to include new crop properties.
 * Runs automatically when objects are loaded from Firebase RTDB.
 */

import type { ImageObject, CanvasObject } from '@/types/canvas.types';

/**
 * Migrate legacy ImageObject to include new crop properties
 *
 * @param image - Existing image object (may be missing new properties)
 * @returns Migrated image with all crop properties
 *
 * @remarks
 * This migration is idempotent - safe to run multiple times on same object.
 * If all crop properties are already present, returns object unchanged.
 *
 * Default behavior:
 * - imageLocked defaults to true (maintain aspect ratio)
 * - imageWidth/Height default to layout width/height (no crop initially)
 * - imageX/Y default to 0 (image aligned to top-left of layout)
 */
export function migrateImageObject(image: ImageObject): ImageObject {
  // If already migrated (all properties present), return as-is
  if (
    image.imageLocked !== undefined &&
    image.imageWidth !== undefined &&
    image.imageHeight !== undefined &&
    image.imageX !== undefined &&
    image.imageY !== undefined
  ) {
    return image;
  }

  console.log('[Migration] Adding crop properties to image:', image.id);

  return {
    ...image,
    // Default to locked (maintain aspect ratio)
    imageLocked: image.imageLocked ?? true,

    // Image dimensions match layout initially (no crop)
    imageWidth: image.imageWidth ?? image.width,
    imageHeight: image.imageHeight ?? image.height,

    // No offset initially (image aligned to top-left of layout)
    imageX: image.imageX ?? 0,
    imageY: image.imageY ?? 0,
  };
}

/**
 * Migrate all images in an array of canvas objects
 *
 * @param objects - Array of canvas objects (may contain images needing migration)
 * @returns Array with all images migrated
 *
 * @remarks
 * Only processes objects with type === 'image'.
 * Non-image objects pass through unchanged.
 */
export function migrateCanvasObjects(objects: CanvasObject[]): CanvasObject[] {
  return objects.map(obj => {
    if (obj.type === 'image') {
      return migrateImageObject(obj);
    }
    return obj;
  });
}
