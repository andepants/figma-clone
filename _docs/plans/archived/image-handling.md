# Image Handling System - Implementation Plan

**Project:** CollabCanvas Image Support
**Estimated Time:** 18-24 hours
**Dependencies:** Firebase Storage SDK, react-dropzone, browser-image-compression
**Last Updated:** 2025-10-16

---

## Progress Tracker

**Overall Progress:** 0/87 tasks completed (0%)

**Phase Breakdown:**
- Phase 0: Research & Planning - 0/6 tasks
- Phase 1: Core Infrastructure - 0/15 tasks
- Phase 2: Image Upload System - 0/12 tasks
- Phase 3: Canvas Integration - 0/18 tasks
- Phase 4: Toolbar & UI - 0/10 tasks
- Phase 5: Drag & Drop - 0/12 tasks
- Phase 6: Performance & Optimization - 0/8 tasks
- Phase 7: Testing & Polish - 0/6 tasks

---

## Legend

- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Completed and verified
- `[!]` = Blocked (see Blockers section)

---

## Blockers & Notes

**Active Blockers:**
- None currently

**Decision Log:**
- 2025-10-16 - **Storage Strategy**: Use Firebase Storage for files >200KB, base64 data URLs for smaller images (faster, no extra fetch)
- 2025-10-16 - **Performance**: Implement Konva cache() for images to prevent re-rendering on every frame
- 2025-10-16 - **Compression**: Use browser-image-compression library to compress images client-side before upload
- 2025-10-16 - **Max File Size**: 10MB limit to prevent memory issues and long upload times
- 2025-10-16 - **Accepted Formats**: PNG, JPG, JPEG, GIF, WEBP, SVG (common web formats)

**Lessons Learned:**
- [To be filled during implementation]

---

# Phase 0: Research & Planning

## 0.1 Research Context

### 0.1.1 Document Existing Patterns
- [ ] **Action:** Review canvas object types and understand the BaseCanvasObject pattern
  - **Why:** Images need to follow the same architecture as Rectangle, Circle, Text, Line
  - **Files to Review:**
    - `src/types/canvas.types.ts` - Type definitions
    - `src/features/canvas-core/shapes/Rectangle.tsx` - Shape component pattern
    - `src/stores/canvasStore.ts` - Object management
    - `src/lib/firebase/realtimeCanvasService.ts` - Real-time sync
  - **Success Criteria:**
    - [ ] Understand BaseCanvasObject interface
    - [ ] Understand VisualProperties pattern
    - [ ] Understand how shapes sync to Firebase RTDB
    - [ ] Understand drag, resize, and selection patterns
  - **Tests:**
    1. Explain how a Rectangle is created, rendered, and synced
    2. Describe the lifecycle of a canvas object from creation to Firebase
  - **Findings:** [Document here after review]

### 0.1.2 Analyze Firebase Storage Integration
- [ ] **Action:** Research Firebase Storage setup and SDK usage
  - **Why:** Need to understand upload, download, and URL generation
  - **Files to Review:**
    - `src/lib/firebase/config.ts` - Firebase initialization
    - Documentation from Context7 research
  - **Success Criteria:**
    - [ ] Understand getStorage() initialization
    - [ ] Understand uploadBytesResumable() for progress tracking
    - [ ] Understand getDownloadURL() for retrieving URLs
    - [ ] Understand storage security rules needed
  - **Tests:**
    1. Explain the flow: File → Firebase Storage → Download URL
    2. Describe error handling for upload failures
  - **Findings:** [Document here after review]

## 0.2 Design Decisions

### Summary of Architecture Decisions

**1. Image Canvas Object Type:**
```typescript
export interface ImageObject extends BaseCanvasObject, VisualProperties {
  type: 'image';
  src: string;                    // Base64 data URL or Firebase Storage URL
  width: number;                  // Display width on canvas
  height: number;                 // Display height on canvas
  naturalWidth: number;           // Original image width
  naturalHeight: number;          // Original image height
  fileName: string;               // Original file name
  fileSize: number;               // File size in bytes
  mimeType: string;               // image/png, image/jpeg, etc.
  storageType: 'dataURL' | 'storage'; // Where image is stored
  storagePath?: string;           // Firebase Storage path (if using storage)
  lockAspectRatio?: boolean;      // Maintain aspect ratio when resizing
}
```

**2. Storage Strategy Decision Tree:**
```
File Upload
  ├─ Size < 200KB?
  │    ├─ YES → Convert to base64 data URL
  │    │         Store in RTDB directly (fast, no extra fetch)
  │    └─ NO  → Upload to Firebase Storage
  │              Store download URL in RTDB (scalable)
  └─ Always store metadata (fileName, fileSize, dimensions)
```

**3. Performance Optimizations:**
- **Konva Cache:** Call image.cache() after load to cache rendered bitmap
- **HTMLImageElement Pool:** Reuse image elements when possible
- **Lazy Loading:** Load images on-demand as they enter viewport
- **Compression:** Client-side compression before upload (target: 80% quality)
- **Max File Size:** 10MB hard limit to prevent memory issues

**4. User Experience Flow:**
```
Option A: Toolbar Button Upload
  User clicks Image tool → File picker → Select file → Upload → Place on canvas

Option B: Drag & Drop Upload
  User drags file from desktop → Drop on canvas → Upload → Place at drop position
```

**5. Firebase Storage Structure:**
```
storage/
└── images/
    └── {roomId}/              // "main" for now
        └── {userId}/
            └── {timestamp}_{filename}
```

---

# Phase 1: Core Infrastructure (Estimated: 3-4 hours)

**Goal:** Set up type definitions, Firebase Storage service, and image utilities

## 1.1 Type Definitions

### 1.1.1 Add Image Type to Canvas Types
- [ ] **Action:** Add ImageObject interface to `src/types/canvas.types.ts`
  - **Why:** Images need a proper TypeScript interface like other shapes
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
```typescript
/**
 * Image-specific properties
 */
export interface ImageProperties {
  lockAspectRatio?: boolean;   // Maintain aspect ratio when resizing (default: true)
}

/**
 * Image canvas object
 * @interface ImageObject
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends ImageProperties
 * @property {'image'} type - Discriminator for type checking
 * @property {string} src - Image source (base64 data URL or Firebase Storage URL)
 * @property {number} width - Display width on canvas (pixels)
 * @property {number} height - Display height on canvas (pixels)
 * @property {number} naturalWidth - Original image width (pixels)
 * @property {number} naturalHeight - Original image height (pixels)
 * @property {string} fileName - Original file name (e.g., "photo.jpg")
 * @property {number} fileSize - File size in bytes
 * @property {string} mimeType - MIME type (e.g., "image/png")
 * @property {'dataURL' | 'storage'} storageType - Storage strategy used
 * @property {string} [storagePath] - Firebase Storage path (only if storageType === 'storage')
 */
export interface ImageObject extends BaseCanvasObject, VisualProperties, ImageProperties {
  type: 'image';
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
```
  - **Success Criteria:**
    - [ ] ImageObject interface added with all properties
    - [ ] ImageProperties interface created
    - [ ] Type is properly exported
    - [ ] No TypeScript errors
  - **Tests:**
    1. Import ImageObject in a test file
    2. Create a mock ImageObject and verify all properties are type-checked
    3. Verify union type CanvasObject includes ImageObject
  - **Edge Cases:**
    - ⚠️ Ensure storagePath is optional (only needed when storageType === 'storage')
  - **Rollback:** Remove ImageObject interface and ImageProperties

### 1.1.2 Update CanvasObject Union Type
- [ ] **Action:** Add ImageObject to CanvasObject union in `src/types/canvas.types.ts`
  - **Why:** TypeScript needs to know about the new image type
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
```typescript
// Update ShapeType union
export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'group' | 'image';

// Update CanvasObject union
export type CanvasObject = Rectangle | Circle | Text | Line | Group | ImageObject;
```
  - **Success Criteria:**
    - [ ] ShapeType includes 'image'
    - [ ] CanvasObject union includes ImageObject
    - [ ] No TypeScript errors in dependent files
  - **Tests:**
    1. Type check: `const obj: CanvasObject = { type: 'image', ... }` should work
    2. Discriminated union should work: `if (obj.type === 'image') { obj.src }`
  - **Edge Cases:**
    - ⚠️ Existing type guards may need updates
  - **Rollback:** Remove 'image' from unions

### 1.1.3 Add Image Type Guards
- [ ] **Action:** Add type guard functions for ImageObject
  - **Why:** Runtime type checking for discriminated unions
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
```typescript
/**
 * Type guard: Check if object is an image
 */
export function isImageShape(shape: CanvasObject): shape is ImageObject {
  return shape.type === 'image';
}

/**
 * Type guard: Check if shape has dimensional properties (width, height)
 * Updated to include ImageObject
 */
export function hasDimensions(shape: CanvasObject): shape is Rectangle | Text | ImageObject {
  return shape.type === 'rectangle' || shape.type === 'text' || shape.type === 'image';
}
```
  - **Success Criteria:**
    - [ ] isImageShape function added
    - [ ] hasDimensions updated to include ImageObject
    - [ ] supportsAspectRatioLock updated if needed
    - [ ] No TypeScript errors
  - **Tests:**
    1. `isImageShape({ type: 'image', ... })` returns true
    2. `isImageShape({ type: 'rectangle', ... })` returns false
    3. `hasDimensions({ type: 'image', ... })` returns true
  - **Rollback:** Remove isImageShape and revert hasDimensions changes

## 1.2 Firebase Storage Service

### 1.2.1 Create Firebase Storage Module
- [ ] **Action:** Create `src/lib/firebase/storage.ts` with Firebase Storage initialization
  - **Why:** Centralized Firebase Storage service for image uploads
  - **Files Modified:**
    - Create: `src/lib/firebase/storage.ts`
  - **Implementation Details:**
```typescript
/**
 * Firebase Storage Module
 *
 * Provides Firebase Storage initialization and utility functions for image uploads.
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, type StorageReference, type UploadTask } from 'firebase/storage';
import { app } from './config';

/**
 * Firebase Storage instance
 */
export const storage = getStorage(app);

/**
 * Create a storage reference for an image
 *
 * Structure: images/{roomId}/{userId}/{timestamp}_{filename}
 *
 * @param roomId - Room/canvas ID (e.g., "main")
 * @param userId - User ID
 * @param fileName - Original file name
 * @returns Storage reference
 */
export function createImageRef(roomId: string, userId: string, fileName: string): StorageReference {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_'); // Remove special chars
  const path = `images/${roomId}/${userId}/${timestamp}_${sanitizedFileName}`;
  return ref(storage, path);
}

// Re-export Firebase Storage functions
export {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type StorageReference,
  type UploadTask,
};
```
  - **Success Criteria:**
    - [ ] Storage instance exported
    - [ ] createImageRef creates proper path structure
    - [ ] File name sanitization works correctly
    - [ ] All Firebase Storage functions re-exported
  - **Tests:**
    1. Call `createImageRef('main', 'user123', 'photo.jpg')`
    2. Verify path matches pattern: `images/main/user123/{timestamp}_photo.jpg`
    3. Test special characters: `'my photo!@#.jpg'` → `'my_photo___.jpg'`
  - **Edge Cases:**
    - ⚠️ Very long file names (>100 chars) - truncate if needed
    - ⚠️ File names with no extension - handle gracefully
    - ⚠️ Unicode characters in file names - sanitize properly
  - **Rollback:** Delete storage.ts file

### 1.2.2 Create Image Upload Service
- [ ] **Action:** Create `src/lib/firebase/imageUploadService.ts` with upload logic
  - **Why:** Centralized service for handling image uploads with progress tracking
  - **Files Modified:**
    - Create: `src/lib/firebase/imageUploadService.ts`
  - **Implementation Details:**
```typescript
/**
 * Image Upload Service
 *
 * Handles image uploads to Firebase Storage with progress tracking and error handling.
 */

import { createImageRef, uploadBytesResumable, getDownloadURL, deleteObject } from './storage';

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Upload an image file to Firebase Storage
 *
 * @param file - Image file to upload
 * @param roomId - Room/canvas ID
 * @param userId - User ID
 * @param onProgress - Optional progress callback (0-100)
 * @returns Promise resolving to download URL
 * @throws Error if upload fails
 */
export async function uploadImageToStorage(
  file: File,
  roomId: string,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; storagePath: string }> {
  // Create storage reference
  const storageRef = createImageRef(roomId, userId, file.name);

  // Start upload with resumable upload (supports progress tracking)
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  // Return promise that resolves when upload completes
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      // Progress handler
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      // Error handler
      (error) => {
        console.error('Upload failed:', error);
        reject(new Error(`Upload failed: ${error.message}`));
      },
      // Complete handler
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            storagePath: storageRef.fullPath,
          });
        } catch (error) {
          reject(new Error('Failed to get download URL'));
        }
      }
    );
  });
}

/**
 * Delete an image from Firebase Storage
 *
 * @param storagePath - Full storage path (from ImageObject.storagePath)
 */
export async function deleteImageFromStorage(storagePath: string): Promise<void> {
  try {
    const { storage } = await import('./storage');
    const { ref } = await import('firebase/storage');
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Failed to delete image from storage:', error);
    // Don't throw - image might already be deleted
  }
}
```
  - **Success Criteria:**
    - [ ] Upload function works with progress tracking
    - [ ] Download URL returned on success
    - [ ] Storage path returned for deletion later
    - [ ] Error handling for failed uploads
    - [ ] Delete function removes images from storage
  - **Tests:**
    1. Upload a test file and verify download URL is valid
    2. Progress callback is called with values 0-100
    3. Error is thrown if upload fails
    4. Delete function removes file from storage
  - **Edge Cases:**
    - ⚠️ Network interruption during upload - resumable upload handles this
    - ⚠️ Deleting non-existent image - catch error silently
    - ⚠️ Storage quota exceeded - surface error to user
  - **Rollback:** Delete imageUploadService.ts

### 1.2.3 Export Storage Services
- [ ] **Action:** Add storage exports to `src/lib/firebase/index.ts`
  - **Why:** Centralized Firebase exports for easy imports
  - **Files Modified:**
    - Update: `src/lib/firebase/index.ts`
  - **Implementation Details:**
```typescript
// Add to existing exports
export {
  storage,
  createImageRef,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type StorageReference,
  type UploadTask,
} from './storage';

export {
  uploadImageToStorage,
  deleteImageFromStorage,
  type UploadProgressCallback,
} from './imageUploadService';
```
  - **Success Criteria:**
    - [ ] All storage functions exported
    - [ ] No duplicate exports
    - [ ] TypeScript types exported
  - **Tests:**
    1. Import in test file: `import { uploadImageToStorage } from '@/lib/firebase'`
    2. Verify no TypeScript errors
  - **Rollback:** Remove storage exports from index.ts

## 1.3 Image Processing Utilities

### 1.3.1 Create Image Utilities Module
- [ ] **Action:** Create `src/lib/utils/image.ts` with image processing utilities
  - **Why:** Helper functions for file validation, compression, and data URL conversion
  - **Files Modified:**
    - Create: `src/lib/utils/image.ts`
  - **Implementation Details:**
```typescript
/**
 * Image Utilities
 *
 * Helper functions for image processing, validation, and conversion.
 */

import imageCompression from 'browser-image-compression';

/**
 * Image file validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Accepted image MIME types
 */
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Storage threshold - files below this use data URL, above use Firebase Storage
 */
export const STORAGE_THRESHOLD = 200 * 1024; // 200KB in bytes

/**
 * Validate an image file
 *
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Convert file to data URL
 *
 * @param file - Image file
 * @returns Promise resolving to base64 data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Load image and get dimensions
 *
 * @param src - Image source (data URL or URL)
 * @returns Promise resolving to image dimensions
 */
export function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Compress image file
 *
 * Reduces file size while maintaining quality.
 * Target: 80% quality, max 1920px width/height
 *
 * @param file - Image file to compress
 * @returns Promise resolving to compressed file
 */
export async function compressImage(file: File): Promise<File> {
  // Skip compression for small files
  if (file.size < STORAGE_THRESHOLD) {
    return file;
  }

  // Skip compression for SVG (already optimized)
  if (file.type === 'image/svg+xml') {
    return file;
  }

  try {
    const options = {
      maxSizeMB: 1,                    // Max file size after compression
      maxWidthOrHeight: 1920,           // Max dimension
      useWebWorker: true,               // Use web worker for better performance
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    };

    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);

    return compressedFile;
  } catch (error) {
    console.error('Compression failed, using original file:', error);
    return file; // Fallback to original file
  }
}

/**
 * Calculate display dimensions to fit within max bounds while maintaining aspect ratio
 *
 * @param naturalWidth - Original width
 * @param naturalHeight - Original height
 * @param maxWidth - Maximum width (default: 400)
 * @param maxHeight - Maximum height (default: 400)
 * @returns Display dimensions
 */
export function calculateDisplayDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number = 400,
  maxHeight: number = 400
): { width: number; height: number } {
  const aspectRatio = naturalWidth / naturalHeight;

  let width = naturalWidth;
  let height = naturalHeight;

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
}
```
  - **Success Criteria:**
    - [ ] File validation works correctly
    - [ ] Data URL conversion works
    - [ ] Image dimensions can be loaded
    - [ ] Compression reduces file size
    - [ ] Display dimensions calculated correctly
  - **Tests:**
    1. Validate valid image file (PNG) - should pass
    2. Validate invalid file (PDF) - should fail
    3. Validate oversized file (15MB) - should fail
    4. Convert small file to data URL - should work
    5. Load dimensions from data URL - should return correct size
    6. Compress 2MB image - should reduce size
    7. Calculate display for 4000×3000 image - should fit in 400×400
  - **Edge Cases:**
    - ⚠️ Corrupt image files - loadImageDimensions will fail, catch error
    - ⚠️ SVG files - skip compression, handle dimensions differently
    - ⚠️ Animated GIFs - compression may break animation
    - ⚠️ Very small images (10×10) - don't scale up, use natural size
  - **Rollback:** Delete image.ts

### 1.3.2 Export Image Utilities
- [ ] **Action:** Add image utilities export to `src/lib/utils/index.ts`
  - **Why:** Centralized utility exports
  - **Files Modified:**
    - Update: `src/lib/utils/index.ts`
  - **Implementation Details:**
```typescript
// Add to existing exports
export * from './image';
```
  - **Success Criteria:**
    - [ ] Image utilities exported
    - [ ] Can import from `@/lib/utils`
  - **Tests:**
    1. `import { validateImageFile } from '@/lib/utils'` works
  - **Rollback:** Remove export

## 1.4 Install Dependencies

### 1.4.1 Install browser-image-compression
- [ ] **Action:** Install browser-image-compression package
  - **Why:** Client-side image compression before upload
  - **Files Modified:**
    - Update: `package.json`
  - **Implementation Details:**
```bash
npm install browser-image-compression
```
  - **Success Criteria:**
    - [ ] Package installed successfully
    - [ ] No dependency conflicts
    - [ ] TypeScript types available
  - **Tests:**
    1. Import works: `import imageCompression from 'browser-image-compression'`
    2. Run `npm list browser-image-compression` - should show installed
  - **Edge Cases:**
    - ⚠️ Version conflicts - use latest stable version
  - **Rollback:** `npm uninstall browser-image-compression`

### 1.4.2 Install react-dropzone
- [ ] **Action:** Install react-dropzone package
  - **Why:** Drag-and-drop file upload functionality
  - **Files Modified:**
    - Update: `package.json`
  - **Implementation Details:**
```bash
npm install react-dropzone
npm install --save-dev @types/react-dropzone
```
  - **Success Criteria:**
    - [ ] Package installed successfully
    - [ ] TypeScript types available
  - **Tests:**
    1. Import works: `import { useDropzone } from 'react-dropzone'`
  - **Rollback:** `npm uninstall react-dropzone @types/react-dropzone`

---

# Phase 2: Image Upload System (Estimated: 3-4 hours)

**Goal:** Build the image upload pipeline with Firebase Storage integration

## 2.1 Upload Hook

### 2.1.1 Create useImageUpload Hook
- [ ] **Action:** Create `src/features/canvas-core/hooks/useImageUpload.ts`
  - **Why:** Encapsulate image upload logic with state management
  - **Files Modified:**
    - Create: `src/features/canvas-core/hooks/useImageUpload.ts`
  - **Implementation Details:**
```typescript
/**
 * useImageUpload Hook
 *
 * Handles image file upload with validation, compression, and storage.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks';
import {
  validateImageFile,
  compressImage,
  fileToDataURL,
  loadImageDimensions,
  calculateDisplayDimensions,
  STORAGE_THRESHOLD
} from '@/lib/utils';
import { uploadImageToStorage } from '@/lib/firebase';
import type { ImageObject } from '@/types';

/**
 * Upload state
 */
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Uploaded image data
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
 * Image upload hook
 */
export function useImageUpload() {
  const { currentUser } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  /**
   * Upload an image file
   *
   * @param file - Image file to upload
   * @param position - Optional position on canvas { x, y }
   * @returns Uploaded image data or null on error
   */
  const uploadImage = useCallback(async (
    file: File,
    position?: { x: number; y: number }
  ): Promise<UploadedImageData | null> => {
    if (!currentUser) {
      setUploadState({ isUploading: false, progress: 0, error: 'Not authenticated' });
      return null;
    }

    // Reset state
    setUploadState({ isUploading: true, progress: 0, error: null });

    try {
      // 1. Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 2. Compress image
      setUploadState(prev => ({ ...prev, progress: 10 }));
      const compressedFile = await compressImage(file);

      // 3. Determine storage strategy
      const useDataURL = compressedFile.size < STORAGE_THRESHOLD;
      let src: string;
      let storagePath: string | undefined;

      if (useDataURL) {
        // Small file - convert to data URL
        setUploadState(prev => ({ ...prev, progress: 50 }));
        src = await fileToDataURL(compressedFile);
      } else {
        // Large file - upload to Firebase Storage
        const result = await uploadImageToStorage(
          compressedFile,
          'main', // Room ID
          currentUser.uid,
          (progress) => {
            // Progress: 10% (compression) + 80% (upload) = 10-90%
            setUploadState(prev => ({ ...prev, progress: 10 + progress * 0.8 }));
          }
        );
        src = result.url;
        storagePath = result.storagePath;
      }

      // 4. Load image to get dimensions
      setUploadState(prev => ({ ...prev, progress: 95 }));
      const dimensions = await loadImageDimensions(src);

      // 5. Calculate display dimensions (max 400×400 for initial placement)
      const displayDimensions = calculateDisplayDimensions(
        dimensions.width,
        dimensions.height,
        400,
        400
      );

      // Success!
      setUploadState({ isUploading: false, progress: 100, error: null });

      return {
        src,
        width: displayDimensions.width,
        height: displayDimensions.height,
        naturalWidth: dimensions.width,
        naturalHeight: dimensions.height,
        fileName: file.name,
        fileSize: compressedFile.size,
        mimeType: file.type,
        storageType: useDataURL ? 'dataURL' : 'storage',
        storagePath,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({ isUploading: false, progress: 0, error: errorMessage });
      console.error('Image upload failed:', error);
      return null;
    }
  }, [currentUser]);

  /**
   * Reset upload state
   */
  const resetUploadState = useCallback(() => {
    setUploadState({ isUploading: false, progress: 0, error: null });
  }, []);

  return {
    uploadImage,
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.progress,
    uploadError: uploadState.error,
    resetUploadState,
  };
}
```
  - **Success Criteria:**
    - [ ] Hook validates files before upload
    - [ ] Small files convert to data URL
    - [ ] Large files upload to Firebase Storage
    - [ ] Progress tracking works (0-100%)
    - [ ] Dimensions calculated correctly
    - [ ] Error handling works
  - **Tests:**
    1. Upload small file (100KB PNG) → should use data URL
    2. Upload large file (500KB JPG) → should use Firebase Storage
    3. Upload invalid file (PDF) → should error
    4. Monitor progress callback → should update 0-100
    5. Upload without auth → should error
  - **Edge Cases:**
    - ⚠️ Network failure during upload - error state
    - ⚠️ Invalid image (corrupt) - loadImageDimensions fails
    - ⚠️ User logs out mid-upload - cancel upload
  - **Rollback:** Delete useImageUpload.ts

### 2.1.2 Export Upload Hook
- [ ] **Action:** Add export to hooks index
  - **Why:** Centralized hook exports
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/index.ts`
  - **Implementation Details:**
```typescript
// Add to existing exports
export { useImageUpload, type UploadedImageData } from './useImageUpload';
```
  - **Success Criteria:**
    - [ ] Hook exported
    - [ ] Can import from `@/features/canvas-core/hooks`
  - **Tests:**
    1. `import { useImageUpload } from '@/features/canvas-core/hooks'` works
  - **Rollback:** Remove export

## 2.2 Image Creation Logic

### 2.2.1 Create Image Factory Function
- [ ] **Action:** Create `src/features/canvas-core/utils/imageFactory.ts`
  - **Why:** Standardized way to create ImageObject with all required properties
  - **Files Modified:**
    - Create: `src/features/canvas-core/utils/imageFactory.ts`
  - **Implementation Details:**
```typescript
/**
 * Image Factory
 *
 * Creates ImageObject instances with proper defaults and metadata.
 */

import type { ImageObject } from '@/types';
import type { UploadedImageData } from '../hooks/useImageUpload';
import { generateLayerName } from '@/features/layers-panel/utils/layerNaming';

/**
 * Create an ImageObject from uploaded image data
 *
 * @param uploadedData - Data from useImageUpload hook
 * @param position - Position on canvas { x, y }
 * @param userId - Current user ID
 * @param existingObjects - Existing canvas objects (for name generation)
 * @returns Complete ImageObject
 */
export function createImageObject(
  uploadedData: UploadedImageData,
  position: { x: number; y: number },
  userId: string,
  existingObjects: unknown[] = []
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
    stroke: undefined,
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
    storagePath: uploadedData.storagePath,
    lockAspectRatio: true, // Default to locked aspect ratio

    // Organizational properties
    visible: true,
    locked: false,
    parentId: undefined,
    isCollapsed: false,
  };
}
```
  - **Success Criteria:**
    - [ ] Creates valid ImageObject
    - [ ] All required properties present
    - [ ] Proper defaults applied
    - [ ] Layer name generated
  - **Tests:**
    1. Create image object with minimal data
    2. Verify all properties are set
    3. Verify layer name is generated (e.g., "Image 1")
    4. Create multiple images - names increment ("Image 1", "Image 2")
  - **Edge Cases:**
    - ⚠️ Missing optional data - use sensible defaults
  - **Rollback:** Delete imageFactory.ts

### 2.2.2 Add Image Deletion Cleanup
- [ ] **Action:** Update `canvasStore.ts` removeObject to clean up Firebase Storage
  - **Why:** Delete images from storage when object is deleted
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
```typescript
// In removeObject action, after removing object from array:
removeObject: (id) =>
  set((state) => {
    const objectToRemove = state.objects.find((obj) => obj.id === id);
    if (!objectToRemove) return state;

    // NEW: Clean up image from Firebase Storage if needed
    if (objectToRemove.type === 'image' && objectToRemove.storageType === 'storage') {
      // Dynamic import to avoid circular dependency
      import('@/lib/firebase').then(async ({ deleteImageFromStorage }) => {
        if (objectToRemove.storagePath) {
          try {
            await deleteImageFromStorage(objectToRemove.storagePath);
          } catch (error) {
            console.error('Failed to delete image from storage:', error);
          }
        }
      });
    }

    // ... rest of existing removeObject logic ...
```
  - **Success Criteria:**
    - [ ] Images deleted from storage when object removed
    - [ ] Data URL images skip storage deletion
    - [ ] No errors if image already deleted
  - **Tests:**
    1. Delete image object with storageType='storage' → file deleted from Firebase Storage
    2. Delete image object with storageType='dataURL' → no storage deletion
    3. Delete already-deleted image → no error
  - **Edge Cases:**
    - ⚠️ Network failure during deletion - log error, don't block
    - ⚠️ Image already deleted manually - catch error silently
  - **Rollback:** Revert canvasStore changes

## 2.3 Progress UI

### 2.3.1 Create Upload Progress Component
- [ ] **Action:** Create `src/components/common/UploadProgress.tsx`
  - **Why:** Visual feedback for image upload progress
  - **Files Modified:**
    - Create: `src/components/common/UploadProgress.tsx`
  - **Implementation Details:**
```typescript
/**
 * Upload Progress Component
 *
 * Displays upload progress bar with percentage and file name.
 */

import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

interface UploadProgressProps {
  /** File name being uploaded */
  fileName: string;
  /** Upload progress (0-100) */
  progress: number;
  /** Whether upload is active */
  isUploading: boolean;
  /** Optional cancel callback */
  onCancel?: () => void;
}

/**
 * Upload progress bar component
 */
export function UploadProgress({ fileName, progress, isUploading, onCancel }: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-lg border border-gray-200 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          <span className="text-sm font-medium text-gray-900">Uploading image...</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cancel upload"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-3 truncate" title={fileName}>
        {fileName}
      </p>

      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full bg-sky-500 transition-all duration-300 ease-out",
            progress === 100 && "bg-green-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2 text-right">
        {progress.toFixed(0)}%
      </p>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Progress bar animates smoothly
    - [ ] File name displayed and truncated if long
    - [ ] Cancel button works (if provided)
    - [ ] Auto-hides when not uploading
  - **Tests:**
    1. Render with progress=0 → bar at 0%
    2. Render with progress=50 → bar at 50%
    3. Render with progress=100 → bar turns green
    4. Long file name → truncates with ellipsis
    5. Click cancel button → callback fires
  - **Edge Cases:**
    - ⚠️ Very long file names - truncate with CSS
  - **Rollback:** Delete UploadProgress.tsx

### 2.3.2 Create Error Toast Component
- [ ] **Action:** Create `src/components/common/ErrorToast.tsx`
  - **Why:** Display upload errors to user
  - **Files Modified:**
    - Create: `src/components/common/ErrorToast.tsx`
  - **Implementation Details:**
```typescript
/**
 * Error Toast Component
 *
 * Displays error messages with auto-dismiss.
 */

import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorToastProps {
  /** Error message to display */
  message: string;
  /** Whether toast is visible */
  isVisible: boolean;
  /** Callback to dismiss toast */
  onDismiss: () => void;
  /** Auto-dismiss duration in ms (default: 5000) */
  duration?: number;
}

/**
 * Error toast notification
 */
export function ErrorToast({ message, isVisible, onDismiss, duration = 5000 }: ErrorToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-red-50 p-4 shadow-lg border border-red-200 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900 mb-1">Upload Failed</p>
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Toast displays error message
    - [ ] Auto-dismisses after 5 seconds
    - [ ] Manual dismiss works
    - [ ] Smooth animations
  - **Tests:**
    1. Show toast → visible with message
    2. Wait 5 seconds → auto-dismisses
    3. Click X button → dismisses immediately
  - **Rollback:** Delete ErrorToast.tsx

---

# Phase 3: Canvas Integration (Estimated: 4-5 hours)

**Goal:** Render images on canvas with Konva.Image component

## 3.1 Image Shape Component

### 3.1.1 Create Image Shape Component
- [ ] **Action:** Create `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Why:** Render ImageObject on canvas with drag, resize, and selection
  - **Files Modified:**
    - Create: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
/**
 * Image Shape Component
 *
 * Renders an image on the canvas with selection and drag capabilities.
 * Pattern matches Rectangle.tsx for consistency.
 */

import { useState, useEffect, useRef, memo, Fragment } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { ImageObject } from '@/types';
import { useToolStore, useCanvasStore, useUIStore } from '@/stores';
import {
  updateCanvasObject,
  throttledUpdateCanvasObject,
  startDragging,
  throttledUpdateDragPosition,
  throttledUpdateCursor,
  endDragging,
} from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '@/features/collaboration/utils';
import { screenToCanvasCoords } from '../utils';
import { ResizeHandles, DimensionLabel } from '../components';
import { useResize } from '../hooks';

/**
 * Image component props
 */
interface ImageShapeProps {
  /** Image data */
  image: ImageObject;
  /** Whether this image is currently selected */
  isSelected: boolean;
  /** Whether this image is part of a multi-select */
  isInMultiSelect?: boolean;
  /** Callback when image is selected */
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Optional drag state from another user */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
}

/**
 * Image shape component
 *
 * Renders image with HTMLImageElement, caches for performance.
 * Follows same pattern as Rectangle component.
 */
export const ImageShape = memo(function ImageShape({
  image,
  isSelected,
  isInMultiSelect = false,
  onSelect,
  remoteDragState,
}: ImageShapeProps) {
  // Don't render if hidden
  if (image.visible === false) {
    return null;
  }

  const { activeTool } = useToolStore();
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();
  const setHoveredObject = useUIStore((state) => state.setHoveredObject);
  const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);

  // Check if object is locked
  const isLocked = image.locked === true;

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();

  // Hover state
  const [isHovered, setIsHovered] = useState(false);

  // HTMLImageElement for Konva.Image
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);

  // Refs
  const shapeRef = useRef<Konva.Image>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Remote drag state
  const isRemoteDragging = !!remoteDragState;

  // Sidebar hover
  const isHoveredFromSidebar = hoveredObjectId === image.id && !isSelected;

  // Display position
  const displayX = remoteDragState?.x ?? image.x;
  const displayY = remoteDragState?.y ?? image.y;

  // Dimensions
  const width = image.width || 100;
  const height = image.height || 100;

  /**
   * Load image from src
   * Creates HTMLImageElement and caches it
   */
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for Firebase Storage images
    img.onload = () => {
      setHtmlImage(img);

      // Cache image for performance (prevents re-rendering)
      // Wait for next frame to ensure image is rendered
      requestAnimationFrame(() => {
        const node = shapeRef.current;
        if (node) {
          node.cache();
        }
      });
    };
    img.onerror = (error) => {
      console.error('Failed to load image:', image.fileName, error);
    };
    img.src = image.src;

    return () => {
      // Cleanup: revoke object URL if data URL
      if (image.storageType === 'dataURL' && image.src.startsWith('blob:')) {
        URL.revokeObjectURL(image.src);
      }
    };
  }, [image.src, image.fileName, image.storageType]);

  /**
   * Clear cache when dimensions change (resize)
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (node && htmlImage) {
      node.clearCache();
      node.cache();
    }
  }, [width, height, htmlImage]);

  /**
   * Animate selection changes
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }

    if (isSelected) {
      node.to({
        scaleX: (image.scaleX ?? 1) * 1.01,
        scaleY: (image.scaleY ?? 1) * 1.01,
        duration: 0.1,
        onFinish: () => {
          node.to({
            scaleX: image.scaleX ?? 1,
            scaleY: image.scaleY ?? 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected, image.scaleX, image.scaleY]);

  /**
   * Handle click
   */
  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (isLocked) return;
    if (activeTool === 'move') {
      onSelect(e);
    }
  }

  /**
   * Handle drag start
   */
  async function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    e.cancelBubble = true;

    if (!currentUser) return;

    if (!isSelected) {
      const fakeEvent = {
        evt: { shiftKey: false },
      } as Konva.KonvaEventObject<MouseEvent>;
      onSelect(fakeEvent);
    }

    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canDrag = await startDragging(
      'main',
      image.id,
      currentUser.uid,
      { x: image.x, y: image.y },
      username,
      color
    );

    if (!canDrag) {
      e.target.stopDrag();
      return;
    }
  }

  /**
   * Handle drag move
   */
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const stage = node.getStage();
    const position = {
      x: node.x() - width / 2,
      y: node.y() - height / 2,
    };

    updateObject(image.id, position);

    throttledUpdateDragPosition('main', image.id, position);
    throttledUpdateCanvasObject('main', image.id, position);

    if (stage && currentUser) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasCoords = screenToCanvasCoords(stage, pointerPosition);
        const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
        const color = getUserColor(currentUser.uid);
        throttledUpdateCursor('main', currentUser.uid, canvasCoords, username, color);
      }
    }
  }

  /**
   * Handle drag end
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    e.cancelBubble = true;

    const node = e.target;
    const position = {
      x: node.x() - width / 2,
      y: node.y() - height / 2,
    };

    updateObject(image.id, position);

    await updateCanvasObject('main', image.id, position);
    await endDragging('main', image.id);
  }

  /**
   * Handle mouse enter
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    if (activeTool === 'move') {
      setIsHovered(true);
      stage.container().style.cursor = 'move';
      setHoveredObject(image.id);
    }
  }

  /**
   * Handle mouse leave
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    setIsHovered(false);
    stage.container().style.cursor = activeTool === 'move' ? 'pointer' : 'crosshair';

    const current = useUIStore.getState().hoveredObjectId;
    if (current === image.id) {
      setHoveredObject(null);
    }
  }

  // Styling based on state
  const getStroke = () => {
    if (isLocked && isSelected) return '#0ea5e9';
    if (isRemoteDragging) return remoteDragState.color;
    if (isInMultiSelect) return '#38bdf8';
    if (isSelected) return '#0ea5e9';
    if (isHovered && activeTool === 'move') return '#94a3b8';
    return undefined;
  };

  const getStrokeWidth = () => {
    if (isLocked && isSelected) return 3;
    if (isRemoteDragging) return 2;
    if (isSelected) return 3;
    if (isHovered && activeTool === 'move') return 2;
    return undefined;
  };

  const getOpacity = () => {
    if (isRemoteDragging) return 0.85;
    return image.opacity ?? 1;
  };

  const getShadow = () => {
    if (isSelected) {
      return {
        shadowColor: '#0ea5e9',
        shadowBlur: 5,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0.5,
        shadowEnabled: true,
      };
    }
    return {
      shadowColor: image.shadowColor,
      shadowBlur: image.shadowBlur ?? 0,
      shadowOffsetX: image.shadowOffsetX ?? 0,
      shadowOffsetY: image.shadowOffsetY ?? 0,
      shadowOpacity: image.shadowOpacity ?? 1,
      shadowEnabled: image.shadowEnabled ?? false,
    };
  };

  // Don't render until image is loaded
  if (!htmlImage) {
    return null; // Could show placeholder/loader here
  }

  return (
    <Fragment>
      <KonvaImage
        ref={shapeRef}
        image={htmlImage}
        // Position at center
        x={displayX + width / 2}
        y={displayY + height / 2}
        width={width}
        height={height}
        // Transform properties
        rotation={image.rotation ?? 0}
        opacity={getOpacity()}
        scaleX={image.scaleX ?? 1}
        scaleY={image.scaleY ?? 1}
        skewX={image.skewX ?? 0}
        skewY={image.skewY ?? 0}
        // Center offset
        offsetX={width / 2}
        offsetY={height / 2}
        // Stroke (selection border)
        stroke={getStroke()}
        strokeWidth={getStrokeWidth()}
        dash={isRemoteDragging ? [5, 5] : undefined}
        // Shadow
        {...getShadow()}
        // Interaction
        listening={!isLocked}
        onClick={handleClick}
        onTap={handleClick}
        draggable={!isLocked && (isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging && !isInMultiSelect}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover outline from sidebar */}
      {isHoveredFromSidebar && (
        <KonvaImage
          image={htmlImage}
          x={displayX + width / 2}
          y={displayY + height / 2}
          width={width}
          height={height}
          stroke="#9ca3af"
          strokeWidth={1.5}
          dash={[4, 4]}
          opacity={0.5}
          listening={false}
          rotation={image.rotation ?? 0}
          scaleX={image.scaleX ?? 1}
          scaleY={image.scaleY ?? 1}
          skewX={image.skewX ?? 0}
          skewY={image.skewY ?? 0}
          offsetX={width / 2}
          offsetY={height / 2}
        />
      )}

      {/* Resize handles */}
      {!isLocked && (
        <ResizeHandles
          object={image}
          isSelected={isSelected && activeTool === 'move'}
          isResizing={isResizing}
          onResizeStart={(handleType) =>
            handleResizeStart(image.id, handleType, {
              x: image.x,
              y: image.y,
              width: width,
              height: height,
            })
          }
          onResizeMove={(_handleType, x, y) => handleResizeMove(image.id, x, y)}
          onResizeEnd={() => handleResizeEnd(image.id)}
        />
      )}

      {/* Dimension label */}
      {!isLocked && (
        <DimensionLabel object={image} visible={isSelected && activeTool === 'move'} />
      )}
    </Fragment>
  );
});
```
  - **Success Criteria:**
    - [ ] Image renders from data URL
    - [ ] Image renders from Firebase Storage URL
    - [ ] Drag and drop works
    - [ ] Resize works with aspect ratio lock
    - [ ] Selection border shows
    - [ ] Konva cache applied for performance
  - **Tests:**
    1. Render image with data URL → displays correctly
    2. Render image with Storage URL → loads and displays
    3. Select image → border appears
    4. Drag image → position updates
    5. Resize image → maintains aspect ratio (if locked)
    6. Failed image load → error logged, no crash
  - **Edge Cases:**
    - ⚠️ CORS issues with external URLs - crossOrigin set
    - ⚠️ Large images (5000×5000px) - cache helps performance
    - ⚠️ Image load failure - show placeholder or hide
    - ⚠️ Animated GIFs - only first frame renders (Konva limitation)
  - **Rollback:** Delete ImageShape.tsx

### 3.1.2 Export Image Shape
- [ ] **Action:** Add export to shapes index
  - **Why:** Centralized shape exports
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/index.ts`
  - **Implementation Details:**
```typescript
// Add to existing exports
export { ImageShape } from './ImageShape';
```
  - **Success Criteria:**
    - [ ] ImageShape exported
    - [ ] Can import from `@/features/canvas-core/shapes`
  - **Tests:**
    1. `import { ImageShape } from '@/features/canvas-core/shapes'` works
  - **Rollback:** Remove export

## 3.2 Canvas Stage Integration

### 3.2.1 Add Image Rendering to CanvasStage
- [ ] **Action:** Update `CanvasStage.tsx` to render ImageShape components
  - **Why:** Images need to appear on canvas alongside other shapes
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/CanvasStage.tsx`
  - **Implementation Details:**
```typescript
// Add import
import { ImageShape } from '../shapes';
import type { ImageObject } from '@/types';

// In the objects.map() loop, add before the "Skip unknown types" comment:
} else if (obj.type === 'image') {
  return (
    <ImageShape
      key={obj.id}
      image={obj as ImageObject}
      isSelected={selectedIds.includes(obj.id)}
      isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
      onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.shiftKey) {
          toggleSelection(obj.id);
        } else {
          selectObjects([obj.id]);
        }
      }}
      remoteDragState={remoteDragState}
    />
  );
```
  - **Success Criteria:**
    - [ ] Images render in z-index order
    - [ ] Images can be selected
    - [ ] Images can be multi-selected
    - [ ] Images work with remote drag states
  - **Tests:**
    1. Add image object to canvas → renders
    2. Select image → selection works
    3. Shift-click multiple objects including image → multi-select works
    4. Another user drags image → shows remote drag state
  - **Edge Cases:**
    - ⚠️ Image not yet loaded - ImageShape returns null until loaded
  - **Rollback:** Remove image rendering code

### 3.2.2 Update Geometry Utils for Images
- [ ] **Action:** Update `src/lib/utils/geometry.ts` to handle ImageObject
  - **Why:** Bounding box calculations need to account for images
  - **Files Modified:**
    - Update: `src/lib/utils/geometry.ts`
  - **Implementation Details:**
```typescript
// In calculateBoundingBox function, add image case:
} else if (obj.type === 'image') {
  const imageObj = obj as ImageObject;
  minX = Math.min(minX, imageObj.x);
  minY = Math.min(minY, imageObj.y);
  maxX = Math.max(maxX, imageObj.x + imageObj.width);
  maxY = Math.max(maxY, imageObj.y + imageObj.height);
```
  - **Success Criteria:**
    - [ ] Bounding box includes images
    - [ ] Group operations work with images
  - **Tests:**
    1. Select rectangle + image → bounding box encompasses both
    2. Group with image → bounding box correct
  - **Rollback:** Remove image case from geometry utils

### 3.2.3 Update ZoomToFit for Images
- [ ] **Action:** Update `canvasStore.ts` zoomToFit to include images
  - **Why:** Zoom to fit should consider image dimensions
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
```typescript
// In zoomToFit action, add image case:
} else if (obj.type === 'image') {
  minX = Math.min(minX, obj.x);
  minY = Math.min(minY, obj.y);
  maxX = Math.max(maxX, obj.x + obj.width);
  maxY = Math.max(maxY, obj.y + obj.height);
```
  - **Success Criteria:**
    - [ ] Zoom to fit includes images in bounds calculation
  - **Tests:**
    1. Add image far from other objects
    2. Click zoom to fit → camera includes image
  - **Rollback:** Remove image case

## 3.3 Image-Specific Resize Logic

### 3.3.1 Update useResize Hook for Aspect Ratio Lock
- [ ] **Action:** Update `src/features/canvas-core/hooks/useResize.ts` to respect lockAspectRatio
  - **Why:** Images should maintain aspect ratio by default when resizing
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useResize.ts`
  - **Implementation Details:**
```typescript
// In handleResizeMove, check if object is image with locked aspect ratio:
const object = objects.find(obj => obj.id === objectId);
if (object && object.type === 'image' && object.lockAspectRatio !== false) {
  // Calculate new dimensions maintaining aspect ratio
  const aspectRatio = resizeState.startWidth / resizeState.startHeight;

  // Adjust based on resize handle type
  if (handleType === 'top-left' || handleType === 'top-right' ||
      handleType === 'bottom-left' || handleType === 'bottom-right') {
    // Corner handles - maintain aspect ratio
    const newWidth = Math.abs(deltaX) > Math.abs(deltaY / aspectRatio)
      ? Math.abs(deltaX)
      : Math.abs(deltaY) * aspectRatio;
    const newHeight = newWidth / aspectRatio;

    // Apply constrained dimensions
    // ... (implementation details)
  }
}
```
  - **Success Criteria:**
    - [ ] Images resize with locked aspect ratio by default
    - [ ] Unlocking aspect ratio allows free resize
    - [ ] Other shapes unaffected
  - **Tests:**
    1. Resize image from corner → aspect ratio maintained
    2. Unlock aspect ratio, resize → can stretch freely
    3. Resize rectangle → works as before
  - **Edge Cases:**
    - ⚠️ Very thin images (1px wide) - prevent negative dimensions
  - **Rollback:** Revert useResize changes

### 3.3.2 Add Aspect Ratio Lock Toggle
- [ ] **Action:** Create aspect ratio lock toggle in properties panel
  - **Why:** Users should be able to unlock aspect ratio if needed
  - **Files Modified:**
    - Update: `src/features/properties-panel/components/ImageProperties.tsx` (to be created in Phase 4)
  - **Implementation Details:**
```typescript
// This will be implemented in Phase 4 when we create the properties panel
// Placeholder for now - toggle button to set lockAspectRatio property
```
  - **Success Criteria:**
    - [ ] Toggle button changes lockAspectRatio property
    - [ ] Resize behavior updates immediately
  - **Tests:**
    1. Toggle lock → property updates
    2. Resize after unlock → free resize works
  - **Rollback:** Remove toggle (defer to Phase 4)

---

# Phase 4: Toolbar & UI (Estimated: 2-3 hours)

**Goal:** Add image upload button to toolbar and properties panel

## 4.1 Toolbar Integration

### 4.1.1 Add Image Tool to Toolbar
- [ ] **Action:** Add image tool to `TOOLS` array in `Toolbar.tsx`
  - **Why:** Users need a way to access image upload
  - **Files Modified:**
    - Update: `src/features/toolbar/components/Toolbar.tsx`
  - **Implementation Details:**
```typescript
// Add import
import { Image as ImageIcon } from 'lucide-react';

// Add to TOOLS array (after text tool):
{
  id: 'image',
  name: 'Image',
  icon: ImageIcon,
  shortcut: 'I',
},
```
  - **Success Criteria:**
    - [ ] Image tool appears in toolbar
    - [ ] Icon displays correctly
    - [ ] Tooltip shows "Image I"
  - **Tests:**
    1. Check toolbar → Image button visible
    2. Hover image button → tooltip appears
    3. Click image button → tool becomes active
  - **Rollback:** Remove image tool from TOOLS array

### 4.1.2 Add Image Upload Modal
- [ ] **Action:** Create `src/components/common/ImageUploadModal.tsx`
  - **Why:** Modal dialog for selecting image files
  - **Files Modified:**
    - Create: `src/components/common/ImageUploadModal.tsx`
  - **Implementation Details:**
```typescript
/**
 * Image Upload Modal
 *
 * Modal dialog for uploading images to canvas.
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/utils';

interface ImageUploadModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
}

/**
 * Image upload modal with drag-and-drop
 */
export function ImageUploadModal({ isOpen, onClose, onFileSelect }: ImageUploadModalProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
      onClose();
    }
  }, [onFileSelect, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
    multiple: false,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-sky-500 bg-sky-50"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              {isDragActive ? 'Drop image here' : 'Drag and drop an image'}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF, WEBP, SVG (max 10MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Modal opens when image tool clicked
    - [ ] Drag-and-drop works
    - [ ] Click to browse works
    - [ ] Only accepts image files
    - [ ] Closes after file selection
  - **Tests:**
    1. Click image tool → modal opens
    2. Drag image file → dropzone highlights
    3. Drop image → callback fires, modal closes
    4. Click dropzone → file picker opens
    5. Try dropping PDF → rejected
  - **Edge Cases:**
    - ⚠️ Multiple files dropped - only accept first
    - ⚠️ Click outside modal - close modal
  - **Rollback:** Delete ImageUploadModal.tsx

### 4.1.3 Wire Up Image Upload Flow
- [ ] **Action:** Connect image tool to upload modal and canvas placement
  - **Why:** Complete the upload-to-canvas flow
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx` (or wherever toolbar is rendered)
  - **Implementation Details:**
```typescript
// Add state for image upload modal
const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

// Add upload hook
const { uploadImage, isUploading, uploadProgress, uploadError } = useImageUpload();

// Handle image tool click
useEffect(() => {
  if (activeTool === 'image') {
    setIsImageUploadOpen(true);
  }
}, [activeTool]);

// Handle file selection
async function handleImageFileSelect(file: File) {
  const uploadedData = await uploadImage(file);

  if (uploadedData) {
    // Create image object at center of viewport
    const imageObj = createImageObject(
      uploadedData,
      { x: 500, y: 300 }, // Center of typical viewport
      currentUser.uid,
      objects
    );

    // Add to canvas
    addObject(imageObj);

    // Sync to Firebase
    await addCanvasObject('main', imageObj);

    // Select the new image
    selectObjects([imageObj.id]);
  }

  // Reset tool to move
  setActiveTool('move');
}

// Render
<>
  <ImageUploadModal
    isOpen={isImageUploadOpen}
    onClose={() => {
      setIsImageUploadOpen(false);
      setActiveTool('move');
    }}
    onFileSelect={handleImageFileSelect}
  />

  <UploadProgress
    fileName={currentFileName}
    progress={uploadProgress}
    isUploading={isUploading}
  />

  <ErrorToast
    message={uploadError || ''}
    isVisible={!!uploadError}
    onDismiss={() => resetUploadState()}
  />
</>
```
  - **Success Criteria:**
    - [ ] Clicking image tool opens modal
    - [ ] Selecting file uploads and creates object
    - [ ] Image appears on canvas
    - [ ] Progress bar shows during upload
    - [ ] Errors display in toast
  - **Tests:**
    1. Click image tool → modal opens
    2. Select small image → uploads, appears on canvas
    3. Select large image → progress bar shows
    4. Select invalid file → error toast appears
    5. Image syncs to Firebase RTDB
  - **Edge Cases:**
    - ⚠️ User not logged in - show error
    - ⚠️ Upload fails - show error toast
    - ⚠️ Close modal mid-upload - cancel upload
  - **Rollback:** Revert CanvasPage changes

### 4.1.4 Add Keyboard Shortcut
- [ ] **Action:** Add 'I' keyboard shortcut for image tool
  - **Why:** Faster access to image upload
  - **Files Modified:**
    - Update: `src/features/keyboard-shortcuts/hooks/useKeyboardShortcuts.ts` (or wherever shortcuts are defined)
  - **Implementation Details:**
```typescript
// Add to keyboard shortcuts handler:
case 'i':
case 'I':
  if (!isEditingText) {
    setActiveTool('image');
  }
  break;
```
  - **Success Criteria:**
    - [ ] Pressing 'I' activates image tool
    - [ ] Shortcut shown in toolbar tooltip
    - [ ] Works when not editing text
  - **Tests:**
    1. Press 'I' key → image tool activates
    2. Press 'I' while editing text → no effect
  - **Rollback:** Remove keyboard shortcut

## 4.2 Properties Panel

### 4.2.1 Create Image Properties Component
- [ ] **Action:** Create `src/features/properties-panel/components/ImageProperties.tsx`
  - **Why:** Image-specific properties (aspect ratio lock, file info)
  - **Files Modified:**
    - Create: `src/features/properties-panel/components/ImageProperties.tsx`
  - **Implementation Details:**
```typescript
/**
 * Image Properties Component
 *
 * Displays and allows editing of image-specific properties.
 */

import { Lock, Unlock, File } from 'lucide-react';
import type { ImageObject } from '@/types';
import { useCanvasStore } from '@/stores';
import { updateCanvasObject } from '@/lib/firebase';
import { PropertySection, PropertyRow } from './PropertySection';

interface ImagePropertiesProps {
  image: ImageObject;
}

/**
 * Image properties panel section
 */
export function ImageProperties({ image }: ImagePropertiesProps) {
  const { updateObject } = useCanvasStore();

  /**
   * Toggle aspect ratio lock
   */
  async function handleToggleAspectRatioLock() {
    const newLocked = !(image.lockAspectRatio ?? true);

    // Optimistic update
    updateObject(image.id, { lockAspectRatio: newLocked });

    // Sync to Firebase
    await updateCanvasObject('main', image.id, { lockAspectRatio: newLocked });
  }

  const isLocked = image.lockAspectRatio ?? true;
  const fileSizeKB = (image.fileSize / 1024).toFixed(1);

  return (
    <PropertySection title="Image">
      {/* File name */}
      <PropertyRow label="File">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <File className="h-4 w-4" />
          <span className="truncate" title={image.fileName}>
            {image.fileName}
          </span>
        </div>
      </PropertyRow>

      {/* File size */}
      <PropertyRow label="Size">
        <span className="text-sm text-gray-600">{fileSizeKB} KB</span>
      </PropertyRow>

      {/* Dimensions */}
      <PropertyRow label="Dimensions">
        <span className="text-sm text-gray-600">
          {image.naturalWidth} × {image.naturalHeight}
        </span>
      </PropertyRow>

      {/* Aspect ratio lock */}
      <PropertyRow label="Aspect Ratio">
        <button
          onClick={handleToggleAspectRatioLock}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors",
            isLocked
              ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          )}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4" />
              <span>Locked</span>
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4" />
              <span>Unlocked</span>
            </>
          )}
        </button>
      </PropertyRow>
    </PropertySection>
  );
}
```
  - **Success Criteria:**
    - [ ] File name displayed
    - [ ] File size displayed
    - [ ] Natural dimensions displayed
    - [ ] Aspect ratio lock toggle works
  - **Tests:**
    1. Select image → properties show correct info
    2. Click lock toggle → property updates
    3. Resize after unlock → free resize works
  - **Rollback:** Delete ImageProperties.tsx

### 4.2.2 Add Image Properties to Properties Panel
- [ ] **Action:** Update properties panel to show ImageProperties for images
  - **Why:** Image properties should appear when image is selected
  - **Files Modified:**
    - Update: `src/features/properties-panel/components/PropertiesPanel.tsx`
  - **Implementation Details:**
```typescript
// Add import
import { ImageProperties } from './ImageProperties';

// In render, add image case:
{selectedObject.type === 'image' && (
  <ImageProperties image={selectedObject as ImageObject} />
)}
```
  - **Success Criteria:**
    - [ ] Image properties show when image selected
    - [ ] Properties update when image changes
  - **Tests:**
    1. Select image → ImageProperties component renders
    2. Select rectangle → RectangleProperties renders
  - **Rollback:** Remove image properties rendering

---

# Phase 5: Drag & Drop to Canvas (Estimated: 3-4 hours)

**Goal:** Enable dragging images directly onto canvas from desktop

## 5.1 Canvas Drop Zone

### 5.1.1 Create useCanvasDropzone Hook
- [ ] **Action:** Create `src/features/canvas-core/hooks/useCanvasDropzone.ts`
  - **Why:** Handle file drops directly on canvas
  - **Files Modified:**
    - Create: `src/features/canvas-core/hooks/useCanvasDropzone.ts`
  - **Implementation Details:**
```typescript
/**
 * useCanvasDropzone Hook
 *
 * Handles drag-and-drop of image files onto canvas.
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/utils';

interface DropPosition {
  x: number;
  y: number;
}

interface UseCanvasDropzoneProps {
  /** Callback when file is dropped with position */
  onFileDrop: (file: File, position: DropPosition) => void;
  /** Whether dropzone is enabled */
  enabled?: boolean;
}

/**
 * Canvas dropzone hook
 *
 * Provides dropzone handlers for canvas element.
 * Calculates drop position in canvas coordinates.
 */
export function useCanvasDropzone({ onFileDrop, enabled = true }: UseCanvasDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[], _fileRejections: unknown, event: DropEvent) => {
    if (acceptedFiles.length === 0 || !enabled) return;

    // Get drop position from event
    const dropEvent = event as unknown as React.DragEvent;
    const position = {
      x: dropEvent.clientX,
      y: dropEvent.clientY,
    };

    // Call callback with first file and position
    onFileDrop(acceptedFiles[0], position);
  }, [onFileDrop, enabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
    multiple: false,
    noClick: true,        // Don't open file picker on click
    noKeyboard: true,     // Don't open file picker on keyboard
    disabled: !enabled,
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
```
  - **Success Criteria:**
    - [ ] Hook provides dropzone props
    - [ ] Drop position captured correctly
    - [ ] Only accepts image files
    - [ ] Doesn't interfere with canvas interactions
  - **Tests:**
    1. Drag image over canvas → isDragActive = true
    2. Drop image → callback fires with file and position
    3. Drop PDF → rejected
    4. Click canvas → file picker doesn't open
  - **Edge Cases:**
    - ⚠️ Drop outside canvas bounds - handle gracefully
    - ⚠️ Drop while another upload in progress - queue or reject
  - **Rollback:** Delete useCanvasDropzone.ts

### 5.1.2 Add Dropzone to CanvasStage
- [ ] **Action:** Integrate dropzone with CanvasStage component
  - **Why:** Make entire canvas a drop target
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/CanvasStage.tsx`
  - **Implementation Details:**
```typescript
// Add imports
import { useCanvasDropzone } from '../hooks/useCanvasDropzone';
import { useImageUpload } from '../hooks/useImageUpload';
import { createImageObject } from '../utils/imageFactory';

// Inside CanvasStage component:
const { uploadImage } = useImageUpload();
const { addObject, objects, selectObjects } = useCanvasStore();

/**
 * Handle file drop on canvas
 */
async function handleCanvasDrop(file: File, screenPosition: { x: number; y: number }) {
  if (!currentUser) return;

  // Convert screen position to canvas coordinates
  const stage = stageRef.current;
  if (!stage) return;

  const canvasPosition = screenToCanvasCoords(stage, screenPosition);

  // Upload image
  const uploadedData = await uploadImage(file);

  if (uploadedData) {
    // Create image object at drop position
    const imageObj = createImageObject(
      uploadedData,
      canvasPosition,
      currentUser.uid,
      objects
    );

    // Add to canvas
    addObject(imageObj);

    // Sync to Firebase
    await addCanvasObject('main', imageObj);

    // Select the new image
    selectObjects([imageObj.id]);
  }
}

// Get dropzone props
const { getRootProps, isDragActive } = useCanvasDropzone({
  onFileDrop: handleCanvasDrop,
  enabled: activeTool === 'move', // Only allow drops when move tool active
});

// Apply dropzone props to Stage container
// Update the Stage component's wrapper div:
return (
  <div {...getRootProps()} style={{ width: '100%', height: '100%' }}>
    <Stage
      ref={stageRef}
      // ... existing props ...
    >
      {/* ... existing layers ... */}
    </Stage>

    {/* Drop overlay */}
    {isDragActive && (
      <div className="absolute inset-0 bg-sky-500/10 border-2 border-dashed border-sky-500 pointer-events-none flex items-center justify-center">
        <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
          <p className="text-lg font-medium text-gray-900">Drop image here</p>
        </div>
      </div>
    )}
  </div>
);
```
  - **Success Criteria:**
    - [ ] Dragging image over canvas shows overlay
    - [ ] Dropping image uploads and places at cursor
    - [ ] Canvas coordinates calculated correctly
    - [ ] Works with pan and zoom
  - **Tests:**
    1. Drag image from desktop → overlay appears
    2. Drop at position (100, 200) → image placed at correct canvas coords
    3. Pan canvas, then drop → position still correct
    4. Zoom in, then drop → position still correct
    5. Drop while different tool active → no effect (if disabled)
  - **Edge Cases:**
    - ⚠️ Drop at edge of viewport - ensure image visible
    - ⚠️ Drop while panning - cancel pan or drop
    - ⚠️ Multiple rapid drops - handle queue
  - **Rollback:** Revert CanvasStage changes

### 5.1.3 Add Visual Feedback for Drop
- [ ] **Action:** Enhance drop overlay with better UX
  - **Why:** Clear visual indication of drop zone
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/CanvasStage.tsx`
  - **Implementation Details:**
```typescript
// Enhanced drop overlay (already in previous task, ensure it looks good):
{isDragActive && (
  <div className="absolute inset-0 bg-sky-500/10 border-4 border-dashed border-sky-500 pointer-events-none flex items-center justify-center z-50 animate-in fade-in duration-200">
    <div className="bg-white px-8 py-6 rounded-lg shadow-2xl border border-gray-200">
      <div className="flex items-center gap-3">
        <Upload className="h-8 w-8 text-sky-500" />
        <div>
          <p className="text-lg font-semibold text-gray-900">Drop image here</p>
          <p className="text-sm text-gray-600">Release to add to canvas</p>
        </div>
      </div>
    </div>
  </div>
)}
```
  - **Success Criteria:**
    - [ ] Overlay animates smoothly
    - [ ] Clear messaging
    - [ ] Doesn't interfere with cursor
  - **Tests:**
    1. Drag image → overlay fades in
    2. Move cursor while dragging → overlay stays visible
    3. Drop → overlay fades out
  - **Rollback:** Use simple overlay

## 5.2 Drop Position Calculation

### 5.2.1 Update screenToCanvasCoords for Drop Events
- [ ] **Action:** Ensure screenToCanvasCoords works with drop events
  - **Why:** Accurate positioning when dropping images
  - **Files Modified:**
    - Update: `src/features/canvas-core/utils/coordinates.ts` (or wherever screenToCanvasCoords is)
  - **Implementation Details:**
```typescript
// Verify screenToCanvasCoords handles drop events correctly
// It should already work since it takes { x, y } screen coordinates
// and converts to canvas coordinates accounting for pan and zoom

/**
 * Convert screen coordinates to canvas coordinates
 * Accounts for pan (stage position) and zoom (stage scale)
 *
 * @param stage - Konva stage
 * @param screenCoords - Screen coordinates { x, y }
 * @returns Canvas coordinates { x, y }
 */
export function screenToCanvasCoords(
  stage: Konva.Stage,
  screenCoords: { x: number; y: number }
): { x: number; y: number } {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert(); // Invert to go from screen to canvas

  return transform.point(screenCoords);
}
```
  - **Success Criteria:**
    - [ ] Drop position matches cursor position
    - [ ] Works at any zoom level
    - [ ] Works at any pan position
  - **Tests:**
    1. Drop at center with no pan/zoom → position correct
    2. Pan right 200px, drop → position correct
    3. Zoom to 2x, drop → position correct
    4. Pan + zoom, drop → position correct
  - **Edge Cases:**
    - ⚠️ Extreme zoom (0.1x or 5x) - still accurate
  - **Rollback:** N/A (util should already work)

### 5.2.2 Center Image on Drop Point
- [ ] **Action:** Adjust drop position to center image on cursor
  - **Why:** Better UX - image centered where user drops
  - **Files Modified:**
    - Update: `handleCanvasDrop` in CanvasStage
  - **Implementation Details:**
```typescript
// In handleCanvasDrop, after getting uploadedData:
const canvasPosition = screenToCanvasCoords(stage, screenPosition);

// Adjust position to center image on drop point
const centeredPosition = {
  x: canvasPosition.x - uploadedData.width / 2,
  y: canvasPosition.y - uploadedData.height / 2,
};

const imageObj = createImageObject(
  uploadedData,
  centeredPosition, // Use centered position
  currentUser.uid,
  objects
);
```
  - **Success Criteria:**
    - [ ] Image centered on drop cursor
    - [ ] Feels natural and intuitive
  - **Tests:**
    1. Drop image → center aligns with cursor
    2. Drop small image → still centered
    3. Drop large image → still centered
  - **Rollback:** Use top-left positioning

---

# Phase 6: Performance & Optimization (Estimated: 2-3 hours)

**Goal:** Optimize image rendering and loading performance

## 6.1 Image Caching

### 6.1.1 Implement Image Element Pool
- [ ] **Action:** Create reusable HTMLImageElement pool
  - **Why:** Avoid creating new Image elements for every render
  - **Files Modified:**
    - Create: `src/lib/utils/imagePool.ts`
  - **Implementation Details:**
```typescript
/**
 * Image Element Pool
 *
 * Maintains a pool of loaded HTMLImageElements to avoid redundant loading.
 */

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Get or create an HTMLImageElement for a given src
 *
 * @param src - Image source (data URL or URL)
 * @returns Promise resolving to loaded image element
 */
export function getImageElement(src: string): Promise<HTMLImageElement> {
  // Check cache first
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete) {
      return Promise.resolve(cached);
    }
  }

  // Create new image
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };

    img.onerror = (error) => {
      reject(new Error(`Failed to load image: ${src}`));
    };

    img.src = src;
  });
}

/**
 * Remove image from cache
 *
 * @param src - Image source to remove
 */
export function removeImageFromCache(src: string): void {
  imageCache.delete(src);
}

/**
 * Clear entire image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}
```
  - **Success Criteria:**
    - [ ] Images cached after first load
    - [ ] Subsequent renders use cached element
    - [ ] Cache cleared when image deleted
  - **Tests:**
    1. Load image → cached
    2. Render same image again → uses cache (instant)
    3. Delete image → cache cleared
  - **Edge Cases:**
    - ⚠️ Memory leaks - clear cache on unmount
    - ⚠️ Updated images (same URL) - add cache busting if needed
  - **Rollback:** Delete imagePool.ts

### 6.1.2 Update ImageShape to Use Image Pool
- [ ] **Action:** Use image pool in ImageShape component
  - **Why:** Avoid loading same image multiple times
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
// Replace direct Image() creation with pool:
import { getImageElement, removeImageFromCache } from '@/lib/utils/imagePool';

// In useEffect:
useEffect(() => {
  let mounted = true;

  getImageElement(image.src)
    .then(img => {
      if (mounted) {
        setHtmlImage(img);

        // Cache for performance
        requestAnimationFrame(() => {
          const node = shapeRef.current;
          if (node) {
            node.cache();
          }
        });
      }
    })
    .catch(error => {
      console.error('Failed to load image:', image.fileName, error);
    });

  return () => {
    mounted = false;
    // Remove from cache when component unmounts
    removeImageFromCache(image.src);
  };
}, [image.src, image.fileName]);
```
  - **Success Criteria:**
    - [ ] Images load from pool
    - [ ] No duplicate image loads
    - [ ] Cache cleared on unmount
  - **Tests:**
    1. Add 2 copies of same image → image loaded once
    2. Delete image → cache entry removed
    3. Re-add same image → loads from pool
  - **Rollback:** Revert to direct Image() creation

## 6.2 Lazy Loading

### 6.2.1 Add Viewport-Based Lazy Loading
- [ ] **Action:** Only load images when visible in viewport
  - **Why:** Performance for canvases with many images
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
// Add viewport check before loading image:
import { useEffect, useState, useRef } from 'react';

/**
 * Check if image is in viewport
 */
function isInViewport(
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  stageX: number,
  stageY: number,
  stageScale: number,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  // Transform image bounds to screen coordinates
  const screenX = imageX * stageScale + stageX;
  const screenY = imageY * stageScale + stageY;
  const screenWidth = imageWidth * stageScale;
  const screenHeight = imageHeight * stageScale;

  // Check if any part of image is visible
  return (
    screenX + screenWidth > 0 &&
    screenX < viewportWidth &&
    screenY + screenHeight > 0 &&
    screenY < viewportHeight
  );
}

// In ImageShape component:
const [shouldLoad, setShouldLoad] = useState(false);

useEffect(() => {
  // Check if image is in viewport
  const stage = shapeRef.current?.getStage();
  if (!stage) return;

  const container = stage.container();
  const isVisible = isInViewport(
    image.x,
    image.y,
    image.width,
    image.height,
    stage.x(),
    stage.y(),
    stage.scaleX(),
    container.offsetWidth,
    container.offsetHeight
  );

  setShouldLoad(isVisible);
}, [image.x, image.y, image.width, image.height, zoom, panX, panY]);

// Only load image if should load:
useEffect(() => {
  if (!shouldLoad) return;
  // ... existing load logic ...
}, [shouldLoad, image.src]);
```
  - **Success Criteria:**
    - [ ] Images only load when in viewport
    - [ ] Panning brings images into view and loads them
    - [ ] Performance improved with many images
  - **Tests:**
    1. Add 100 images off-screen → not loaded
    2. Pan to reveal images → load as they enter viewport
    3. Zoom out → more images load
  - **Edge Cases:**
    - ⚠️ Images near viewport edge - add buffer zone
    - ⚠️ Rapid panning - debounce viewport check
  - **Rollback:** Remove viewport check (load all images)
  - **Note:** This optimization can be deferred if causing complexity

## 6.3 Thumbnail Preview

### 6.3.1 Create Thumbnail Generator
- [ ] **Action:** Generate low-res thumbnails for layer panel
  - **Why:** Faster rendering in layers panel sidebar
  - **Files Modified:**
    - Create: `src/lib/utils/thumbnail.ts`
  - **Implementation Details:**
```typescript
/**
 * Thumbnail Generator
 *
 * Creates low-resolution thumbnails for layer panel previews.
 */

/**
 * Generate thumbnail data URL from image source
 *
 * @param src - Original image source
 * @param maxSize - Maximum width/height (default: 32)
 * @returns Promise resolving to thumbnail data URL
 */
export async function generateThumbnail(
  src: string,
  maxSize: number = 32
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate thumbnail dimensions
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);

      canvas.width = width;
      canvas.height = height;

      // Draw thumbnail
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = src;
  });
}
```
  - **Success Criteria:**
    - [ ] Thumbnails generated at 32×32 max
    - [ ] Aspect ratio maintained
    - [ ] Fast generation
  - **Tests:**
    1. Generate thumbnail from 1000×1000 image → 32×32 result
    2. Generate from 100×500 image → 6×32 result (maintains ratio)
  - **Edge Cases:**
    - ⚠️ Very small images - don't upscale
  - **Rollback:** Delete thumbnail.ts
  - **Note:** Can be deferred if layers panel not showing image previews

---

# Phase 7: Testing & Polish (Estimated: 2-3 hours)

**Goal:** Comprehensive testing and edge case handling

## 7.1 Integration Tests

### 7.1.1 Test Complete Upload Flow
- [ ] **Action:** Test end-to-end image upload and rendering
  - **Why:** Ensure all pieces work together
  - **Tests:**
    1. **Small Image Upload (Data URL)**
       - Select 100KB PNG from toolbar
       - Verify upload progress shows
       - Verify image appears on canvas
       - Verify syncs to Firebase RTDB
       - Verify image has correct data URL src
    2. **Large Image Upload (Firebase Storage)**
       - Select 500KB JPG from toolbar
       - Verify compression occurs
       - Verify upload progress shows 0-100%
       - Verify image appears on canvas
       - Verify syncs to Firebase RTDB with Storage URL
       - Verify image loads from Storage URL
    3. **Drag & Drop Upload**
       - Drag image from desktop onto canvas
       - Verify drop overlay appears
       - Verify image placed at cursor position
       - Verify upload and sync work
  - **Success Criteria:**
    - [ ] All upload paths work correctly
    - [ ] No errors in console
    - [ ] Images persist across page reload
  - **Edge Cases:**
    - ⚠️ Refresh during upload - upload cancels, no partial objects
    - ⚠️ Network disconnection - error shown, can retry

### 7.1.2 Test Multi-User Collaboration
- [ ] **Action:** Test images in real-time collaboration
  - **Why:** Ensure images work with Firebase real-time sync
  - **Tests:**
    1. User A uploads image → User B sees it appear
    2. User A drags image → User B sees real-time drag
    3. User A resizes image → User B sees resize
    4. User A deletes image → User B sees deletion
    5. User A selects image → User B sees selection overlay
  - **Success Criteria:**
    - [ ] All operations sync in real-time
    - [ ] No conflicts or race conditions
    - [ ] Images load correctly for both users
  - **Edge Cases:**
    - ⚠️ Both users upload at same time - both images created
    - ⚠️ User A deletes while User B drags - delete wins

### 7.1.3 Test Performance with Many Images
- [ ] **Action:** Test canvas with 50+ images
  - **Why:** Verify performance optimizations work
  - **Tests:**
    1. Add 50 small images to canvas
    2. Verify FPS stays above 30
    3. Pan and zoom smoothly
    4. Select and drag images without lag
    5. Check memory usage (< 500MB for 50 images)
  - **Success Criteria:**
    - [ ] Smooth performance with many images
    - [ ] No memory leaks
    - [ ] Images load progressively
  - **Edge Cases:**
    - ⚠️ 100+ images - may need virtual rendering

## 7.2 Error Handling

### 7.2.1 Test Error Scenarios
- [ ] **Action:** Verify all error paths handled gracefully
  - **Why:** Robust error handling prevents crashes
  - **Tests:**
    1. **Invalid File Type**
       - Upload PDF → Error toast shows "Invalid file type"
    2. **File Too Large**
       - Upload 15MB image → Error toast shows "File too large"
    3. **Network Failure**
       - Disconnect network, upload image → Error toast shows upload failed
    4. **Corrupt Image**
       - Upload corrupt JPEG → Error shows, no crash
    5. **Storage Quota Exceeded**
       - Fill Firebase Storage quota → Error shows
    6. **Not Authenticated**
       - Log out, try upload → Error shows "Not authenticated"
  - **Success Criteria:**
    - [ ] All errors show user-friendly messages
    - [ ] No console errors
    - [ ] App doesn't crash
  - **Edge Cases:**
    - ⚠️ Multiple errors in sequence - all displayed

### 7.2.2 Test Edge Cases
- [ ] **Action:** Test unusual but valid scenarios
  - **Why:** Handle all valid use cases
  - **Tests:**
    1. **Very Small Image (10×10px)**
       - Upload → Renders correctly, doesn't scale up
    2. **Very Large Image (5000×5000px)**
       - Upload → Compresses correctly, renders
    3. **SVG Upload**
       - Upload SVG → Renders as raster image
    4. **Transparent PNG**
       - Upload PNG with transparency → Alpha channel preserved
    5. **Animated GIF**
       - Upload GIF → First frame renders (Konva limitation)
    6. **Unicode Filename**
       - Upload "图片.png" → Filename sanitized, works
  - **Success Criteria:**
    - [ ] All edge cases handled
    - [ ] No crashes or errors
  - **Edge Cases:**
    - ⚠️ SVG with external resources - may not render correctly

## 7.3 Browser Compatibility

### 7.3.1 Test Cross-Browser
- [ ] **Action:** Test in Chrome, Firefox, Safari, Edge
  - **Why:** Ensure consistent behavior across browsers
  - **Tests:**
    1. Upload image in each browser
    2. Drag and drop in each browser
    3. Resize images in each browser
    4. Verify CORS works (Firebase Storage images)
  - **Success Criteria:**
    - [ ] Works in all modern browsers
    - [ ] No browser-specific bugs
  - **Edge Cases:**
    - ⚠️ Safari CORS issues - crossOrigin='anonymous' should fix

### 7.3.2 Test Mobile/Touch
- [ ] **Action:** Test on mobile devices
  - **Why:** Ensure touch interactions work
  - **Tests:**
    1. Upload image on mobile (if file picker supported)
    2. Drag image with touch
    3. Resize with pinch gesture
    4. Verify images render correctly
  - **Success Criteria:**
    - [ ] Touch interactions work
    - [ ] Images display correctly on mobile
  - **Note:** Mobile file upload may have limitations

---

# Final Integration & Testing

## Integration Tests
- [ ] **End-to-End Flow Test**
  - **Scenario 1:** Upload small image via toolbar
    - Click image tool → Select 100KB PNG → Verify appears on canvas → Refresh page → Verify persists
  - **Scenario 2:** Upload large image via drag-drop
    - Drag 500KB JPG onto canvas → Verify upload progress → Verify appears at cursor → Verify syncs
  - **Scenario 3:** Collaborative editing
    - User A uploads image → User B sees it → User A drags → User B sees drag → User A resizes → User B sees resize
  - **Scenario 4:** Image deletion
    - Select image → Press Delete → Verify removed from canvas → Verify removed from Firebase RTDB → Verify removed from Firebase Storage (if applicable)
  - **Expected:** All flows work smoothly, no errors

## Performance Tests
- [ ] **Verify performance requirements**
  - **Metric:** Canvas FPS with 10 images
  - **Target:** 60 FPS
  - **How to Test:** Add 10 images, pan/zoom canvas, monitor FPS in devtools
  - **Metric:** Upload time for 500KB image
  - **Target:** < 5 seconds on average network
  - **How to Test:** Upload 500KB image, time from selection to canvas appearance
  - **Metric:** Memory usage with 50 images
  - **Target:** < 500MB total
  - **How to Test:** Add 50 images, check Memory in Chrome devtools

## Accessibility Tests
- [ ] **Keyboard navigation works**
  - Press 'I' → Image upload modal opens
  - Tab through modal → Focus visible
  - Esc → Modal closes
- [ ] **Screen reader compatibility**
  - Upload button has aria-label
  - Progress bar has aria-live region
  - Error messages announced
- [ ] **Color contrast requirements met**
  - Upload overlay has sufficient contrast
  - Error messages readable

---

# Deployment Checklist

- [ ] All tasks completed and verified
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Code reviewed (self-review at minimum)
- [ ] Performance verified (60 FPS with images)
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Firebase Storage rules configured
- [ ] Firebase RTDB rules allow image objects
- [ ] browser-image-compression dependency added
- [ ] react-dropzone dependency added
- [ ] Documentation updated (if needed)
- [ ] Commit message written
- [ ] PR created (if applicable)

---

# Appendix

## Related Documentation
- Firebase Storage Docs: https://firebase.google.com/docs/storage
- Konva Image Node: https://konvajs.org/api/Konva.Image.html
- react-dropzone: https://react-dropzone.js.org/
- browser-image-compression: https://github.com/Donaldcwl/browser-image-compression

## Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{roomId}/{userId}/{fileName} {
      // Allow read for authenticated users
      allow read: if request.auth != null;

      // Allow write only for the owning user
      allow write: if request.auth != null && request.auth.uid == userId;

      // Validate file size (max 10MB)
      allow write: if request.resource.size <= 10 * 1024 * 1024;

      // Validate file type (images only)
      allow write: if request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Firebase RTDB Security Rules (Update)

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        "objects": {
          "$objectId": {
            ".write": "auth != null",
            ".read": "auth != null",
            ".validate": "newData.child('type').val() === 'rectangle' || newData.child('type').val() === 'circle' || newData.child('type').val() === 'text' || newData.child('type').val() === 'line' || newData.child('type').val() === 'group' || newData.child('type').val() === 'image'"
          }
        }
      }
    }
  }
}
```

## Future Enhancements
- **Image Filters:** Apply filters like grayscale, blur, brightness
- **Image Cropping:** Crop images within canvas
- **Multiple File Upload:** Upload multiple images at once
- **Image Library:** Save frequently used images for reuse
- **Image Placeholders:** Show placeholder while loading
- **Undo/Redo:** Support undo/redo for image operations
- **Export with Images:** Include images in canvas export
- **SVG Rendering:** Proper SVG support with vector rendering
- **GIF Animation:** Support animated GIFs with animation playback
- **Image Effects:** Shadows, borders, masks
- **Smart Cropping:** AI-powered cropping suggestions
- **Background Removal:** Remove image backgrounds automatically

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| [Date] | [Phase] | [Hours] | [What was accomplished] |

## Performance Benchmarks

### Target Metrics
- Upload time (100KB image): < 1 second
- Upload time (500KB image): < 3 seconds
- Upload time (2MB image): < 10 seconds
- First render (10 images): < 500ms
- FPS with 10 images: 60 FPS
- FPS with 50 images: 30+ FPS
- Memory usage (50 images): < 500MB

### Actual Metrics
[To be filled during testing]

## Known Limitations
1. **Animated GIFs:** Only first frame renders (Konva limitation)
2. **SVG External Resources:** External links in SVG may not load
3. **Very Large Images:** >10,000×10,000 pixels may cause performance issues
4. **Mobile Upload:** File picker support varies by mobile browser
5. **CORS:** External images require CORS headers
6. **Max File Size:** Hard limit of 10MB to prevent memory issues

---

**End of Implementation Plan**

This plan provides a comprehensive roadmap for implementing image handling in CollabCanvas. Each task is granular, testable, and includes edge case considerations. The plan prioritizes performance, user experience, and real-time collaboration.
