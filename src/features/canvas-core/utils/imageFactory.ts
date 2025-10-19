/**
 * Image Factory
 *
 * Creates ImageObject instances with proper defaults and metadata.
 */

import type { ImageObject } from '@/types/canvas.types';
import { generateLayerName } from '@/features/layers-panel/utils/layerNaming';

/**
 * Uploaded image data from useImageUpload hook
 */
export interface UploadedImageData {
  src: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: 'dataURL' | 'storage';
  storagePath?: string;
}

/**
 * Create an ImageObject from uploaded image data
 *
 * @param uploadedData - Data from useImageUpload hook
 * @param position - Position on canvas { x, y }
 * @param userId - Current user ID
 * @param existingObjects - Existing canvas objects (for name generation)
 * @returns Complete ImageObject with all required properties
 *
 * @example
 * ```typescript
 * const imageData = await uploadImage(file);
 * const imageObject = createImageObject(
 *   imageData,
 *   { x: 100, y: 100 },
 *   currentUser.uid,
 *   canvasStore.objects
 * );
 * canvasStore.addObject(imageObject);
 * ```
 */
export function createImageObject(
  uploadedData: UploadedImageData,
  position: { x: number; y: number },
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existingObjects: any[] = []
): ImageObject {
  const now = Date.now();

  return {
    // Base properties
    id: crypto.randomUUID(),
    type: 'image',
    x: position.x,
    y: position.y,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    name: generateLayerName('image', existingObjects),

    // Visual properties (defaults)
    rotation: 0,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    // Note: stroke omitted - images don't need stroke by default
    strokeWidth: 0,
    strokeEnabled: false,
    shadowColor: 'black',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 1,
    shadowEnabled: false,

    // Image-specific properties
    src: uploadedData.src,
    width: uploadedData.width,
    height: uploadedData.height,
    naturalWidth: uploadedData.naturalWidth,
    naturalHeight: uploadedData.naturalHeight,
    fileName: uploadedData.fileName,
    fileSize: uploadedData.fileSize,
    mimeType: uploadedData.mimeType,
    storageType: uploadedData.storageType,
    // Note: storagePath omitted when undefined - Firebase RTDB doesn't accept undefined values
    ...(uploadedData.storagePath ? { storagePath: uploadedData.storagePath } : {}),
    lockAspectRatio: true, // Default to locked aspect ratio

    // Organizational properties
    visible: true,
    locked: false,
    // Note: parentId omitted - Firebase RTDB doesn't accept undefined values
    isCollapsed: false,
  };
}
