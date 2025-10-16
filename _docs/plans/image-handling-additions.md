# Image Handling System - Critical Additions & Updates

**Project:** CollabCanvas Image Support - Missing Edge Cases & Security
**Date Created:** 2025-10-16
**Based On:** image-handling.md comprehensive review

---

## Executive Summary

This document contains **critical additions** to the main image-handling.md implementation plan. These items were identified during comprehensive review and **must be completed** before considering the image feature production-ready.

**Key Categories:**
1. Firebase Configuration (CRITICAL - blocking)
2. Missing Edge Cases (HIGH priority)
3. Security & Performance Tests (HIGH priority)
4. Memory Management (MEDIUM priority)
5. Upload Cancellation & Retry (MEDIUM priority)

---

# Phase 0: Firebase Configuration (CRITICAL - Must Complete First)

## 0.3 Firebase Configuration Updates

### 0.3.1 Verify Firebase Configuration Files Updated
- [x] **Action:** Verify storage.rules updated with 10MB limit and image path validation
  - **Why:** Production security and file size limits enforced
  - **Files Modified:**
    - ✅ Updated: `storage.rules`
  - **Changes Made:**
    ```javascript
    // New path-specific rule for images
    match /images/{roomId}/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size <= 10 * 1024 * 1024  // 10MB
                   && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    ```
  - **Success Criteria:**
    - [x] Path structure validates `/images/{roomId}/{userId}/{fileName}`
    - [x] MIME type validates `image/*` only
    - [x] User ownership validated (uid == userId)
    - [x] 10MB limit enforced
    - [x] Delete restricted to owner
  - **Rollback:** Revert to previous storage.rules

### 0.3.2 Verify Database Rules Include Image Type
- [x] **Action:** Verify database.rules.json includes 'image' type and image-specific fields
  - **Why:** RTDB will reject image objects without this
  - **Files Modified:**
    - ✅ Updated: `database.rules.json`
  - **Changes Made:**
    ```json
    // Line 15: Added 'image' to type validation
    "type": {
      ".validate": "... || newData.val() == 'image'"
    },
    // Lines 71-97: Added image-specific field validation
    "src": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500000" },
    "naturalWidth": { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 50000" },
    "naturalHeight": { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 50000" },
    "fileName": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500" },
    "fileSize": { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 10485760" },
    "mimeType": { ".validate": "newData.isString() && newData.val().matches(/^image\\/(png|jpeg|jpg|gif|webp|svg\\+xml)$/)" },
    "storageType": { ".validate": "newData.isString() && (newData.val() == 'dataURL' || newData.val() == 'storage')" },
    "storagePath": { ".validate": "newData.isString() && newData.val().length <= 1000" },
    "lockAspectRatio": { ".validate": "newData.isBoolean()" }
    ```
  - **Success Criteria:**
    - [x] 'image' type accepted in type field
    - [x] src validates (max 500KB for data URLs)
    - [x] Dimensions validated (1-50000px)
    - [x] File size validated (max 10MB = 10485760 bytes)
    - [x] MIME type validated (png|jpeg|jpg|gif|webp|svg+xml)
    - [x] storageType enum validated
  - **Tests:**
    1. Upload image object to RTDB → validates successfully
    2. Try invalid MIME type → rejected
    3. Try fileSize > 10MB → rejected
  - **Rollback:** Revert database.rules.json changes

### 0.3.3 Verify Storage Service Initialized
- [x] **Action:** Verify Firebase Storage initialized and emulator connected
  - **Why:** Storage module depends on this being exported from config
  - **Files Modified:**
    - ✅ Updated: `src/lib/firebase/config.ts`
  - **Changes Made:**
    ```typescript
    // Added import
    import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage'

    // Added export
    export const storage: FirebaseStorage = getStorage(app)

    // Added emulator connection (DEV only)
    if (import.meta.env.DEV) {
      console.log('   → Storage: localhost:9199')
      connectStorageEmulator(storage, 'localhost', 9199)
    }
    ```
  - **Success Criteria:**
    - [x] Storage instance exported
    - [x] Emulator connection in DEV mode
    - [x] No TypeScript errors
    - [x] Console log shows Storage emulator URL
  - **Tests:**
    1. Import storage from config → no errors
    2. Start dev server → see "Storage: localhost:9199" in console
    3. Upload to emulator → file appears in emulator UI
  - **Rollback:** Remove storage exports and emulator connection

### 0.3.4 Test Firebase Rules in Emulator
- [ ] **Action:** Test all Firebase rules locally before deploying
  - **Why:** Prevent production rule deployment failures
  - **Files Modified:**
    - None (testing only)
  - **Implementation Details:**
    ```bash
    # Start emulators
    firebase emulators:start

    # In another terminal, run test script
    npm run test:firebase-rules
    ```
  - **Success Criteria:**
    - [ ] Storage rules allow authenticated user uploads
    - [ ] Storage rules block unauthenticated uploads
    - [ ] Storage rules block >10MB files
    - [ ] Storage rules block non-image MIME types
    - [ ] Storage rules block user A deleting user B's files
    - [ ] RTDB rules allow image type objects
    - [ ] RTDB rules validate all image-specific fields
  - **Tests:**
    1. **Storage Rules:**
       - Authenticated user uploads 5MB PNG → success
       - Unauthenticated upload → fails with permission-denied
       - Upload 15MB file → fails with permission-denied
       - Upload PDF to /images path → fails (MIME type)
       - User A deletes User B's image → fails (ownership)
    2. **RTDB Rules:**
       - Create image object with all fields → success
       - Create image with invalid MIME type → fails
       - Create image with fileSize > 10MB → fails
       - Create image with src > 500KB → fails
  - **Edge Cases:**
    - ⚠️ Rules syntax errors - validate before deploying
    - ⚠️ Regex escaping in JSON - double backslashes required
  - **Rollback:** N/A (testing only)

### 0.3.5 Deploy Firebase Rules to Production
- [ ] **Action:** Deploy updated rules to production Firebase project
  - **Why:** Enable image uploads in production
  - **Files Modified:**
    - None (deployment only)
  - **Implementation Details:**
    ```bash
    # Deploy storage rules only
    firebase deploy --only storage

    # Deploy database rules only
    firebase deploy --only database

    # Or deploy both
    firebase deploy --only storage,database
    ```
  - **Success Criteria:**
    - [ ] Deployment succeeds
    - [ ] No production errors
    - [ ] Existing objects still readable
    - [ ] New image objects can be created
  - **Tests:**
    1. Deploy rules → success message
    2. Upload test image in production → works
    3. Verify existing canvas objects still load → works
  - **Edge Cases:**
    - ⚠️ Deployment during active usage - schedule during low traffic
    - ⚠️ Rule validation errors - test in emulator first (step 0.3.4)
  - **Rollback:**
    ```bash
    git revert <commit>
    firebase deploy --only storage,database
    ```

---

# Phase 1.5: Additional Edge Cases for Core Infrastructure

## 1.5 Image Utilities Enhancements

### 1.5.1 Add HEIF/HEIC Format Detection
- [ ] **Action:** Detect and handle iPhone HEIF/HEIC photos
  - **Why:** iPhone photos are often HEIF format, not supported by all browsers
  - **Files Modified:**
    - Update: `src/lib/utils/image.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Check if file is HEIF/HEIC format (iPhone photos)
     */
    function isHEIFFormat(file: File): boolean {
      return file.type === 'image/heif' ||
             file.type === 'image/heic' ||
             file.name.toLowerCase().endsWith('.heif') ||
             file.name.toLowerCase().endsWith('.heic');
    }

    /**
     * Validate image file (updated)
     */
    export function validateImageFile(file: File): ImageValidationResult {
      // Check for HEIF format
      if (isHEIFFormat(file)) {
        return {
          isValid: false,
          error: 'HEIF/HEIC format not supported. Please convert to JPG or PNG first.',
        };
      }

      // ... existing validation ...
    }
    ```
  - **Success Criteria:**
    - [ ] HEIF files detected
    - [ ] Clear error message shown
    - [ ] Suggests conversion to JPG/PNG
  - **Tests:**
    1. Upload HEIF file → error: "HEIF/HEIC format not supported"
    2. Upload standard PNG → works
  - **Edge Cases:**
    - ⚠️ Future browser support - revisit if Safari adds HEIF support
  - **Rollback:** Remove HEIF detection

### 1.5.2 Add Compression Fallback Logic
- [ ] **Action:** Detect when compression increases file size
  - **Why:** Some optimized images get larger when re-compressed
  - **Files Modified:**
    - Update: `src/lib/utils/image.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Compress image file (updated with fallback)
     */
    export async function compressImage(file: File): Promise<File> {
      // Skip compression for small files
      if (file.size < STORAGE_THRESHOLD) {
        return file;
      }

      // Skip compression for SVG
      if (file.type === 'image/svg+xml') {
        return file;
      }

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        };

        const compressedFile = await imageCompression(file, options);

        // Check if compression increased size (rare but possible)
        if (compressedFile.size > file.size) {
          console.log(`Compression increased size, using original: ${file.name}`);
          return file; // Use original
        }

        console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
        return compressedFile;
      } catch (error) {
        console.error('Compression failed, using original file:', error);
        return file;
      }
    }
    ```
  - **Success Criteria:**
    - [ ] Compression increase detected
    - [ ] Original file used when compression increases size
    - [ ] Log message indicates fallback
  - **Tests:**
    1. Compress highly-optimized PNG → uses original if larger
    2. Compress standard JPG → compresses normally
  - **Rollback:** Remove size check

### 1.5.3 Fix calculateDisplayDimensions Edge Case
- [ ] **Action:** Handle extreme aspect ratios (prevent 0px dimensions)
  - **Why:** 10000×1 images could round to 0 height
  - **Files Modified:**
    - Update: `src/lib/utils/image.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Calculate display dimensions (updated with minimum)
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

      // Ensure minimum dimensions (prevent 0px)
      const MIN_DIMENSION = 1;
      width = Math.max(MIN_DIMENSION, Math.round(width));
      height = Math.max(MIN_DIMENSION, Math.round(height));

      return { width, height };
    }
    ```
  - **Success Criteria:**
    - [ ] No dimensions < 1px
    - [ ] Extreme aspect ratios handled
    - [ ] Rounds to integers
  - **Tests:**
    1. Calculate for 10000×1 → minimum 1px height
    2. Calculate for 1×10000 → minimum 1px width
    3. Calculate for 100×100 → normal behavior
  - **Rollback:** Remove minimum dimension check

### 1.5.4 Add Filename Uniqueness Check
- [ ] **Action:** Handle duplicate filenames at same timestamp
  - **Why:** Rapid uploads could have same millisecond timestamp
  - **Files Modified:**
    - Update: `src/lib/firebase/storage.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Create a storage reference for an image (updated with uniqueness)
     */
    export function createImageRef(roomId: string, userId: string, fileName: string): StorageReference {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8); // 6 random chars
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `images/${roomId}/${userId}/${timestamp}_${randomSuffix}_${sanitizedFileName}`;
      return ref(storage, path);
    }
    ```
  - **Success Criteria:**
    - [ ] No duplicate paths
    - [ ] Random suffix ensures uniqueness
    - [ ] Still human-readable
  - **Tests:**
    1. Upload 2 files in rapid succession → both succeed with unique paths
    2. Upload same filename twice → different paths
  - **Rollback:** Remove random suffix

---

# Phase 2.5: Upload Cancellation & Retry

## 2.5 Upload Cancellation & Cleanup

### 2.5.1 Add AbortController for Upload Cancellation
- [ ] **Action:** Allow users to cancel in-progress uploads
  - **Why:** User may navigate away or change mind during upload
  - **Files Modified:**
    - Update: `src/lib/firebase/imageUploadService.ts`
    - Update: `src/features/canvas-core/hooks/useImageUpload.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Upload an image file to Firebase Storage (with cancellation)
     */
    export async function uploadImageToStorage(
      file: File,
      roomId: string,
      userId: string,
      onProgress?: UploadProgressCallback,
      abortSignal?: AbortSignal  // NEW: Cancellation support
    ): Promise<{ url: string; storagePath: string }> {
      const storageRef = createImageRef(roomId, userId, file.name);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      // NEW: Listen for abort signal
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          uploadTask.cancel();
        });
      }

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            // Check if cancelled
            if (error.code === 'storage/canceled') {
              reject(new Error('Upload cancelled'));
            } else {
              reject(new Error(`Upload failed: ${error.message}`));
            }
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              storagePath: storageRef.fullPath,
            });
          }
        );
      });
    }
    ```
  - **Success Criteria:**
    - [ ] Upload can be cancelled mid-progress
    - [ ] Partial uploads cleaned up
    - [ ] Error message indicates cancellation
  - **Tests:**
    1. Start upload, cancel after 50% → upload stops
    2. Cancelled upload → no orphaned files in Storage
    3. Upload completes before cancel → succeeds normally
  - **Edge Cases:**
    - ⚠️ Cancel after upload complete but before RTDB write - clean up Storage file
  - **Rollback:** Remove AbortController logic

### 2.5.2 Add Upload Hook Cancellation on Unmount
- [ ] **Action:** Clean up uploads when component unmounts
  - **Why:** Prevent memory leaks and orphaned files
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useImageUpload.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * useImageUpload Hook (with cleanup)
     */
    export function useImageUpload() {
      const { currentUser } = useAuth();
      const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
      });

      // NEW: Track abort controller
      const abortControllerRef = useRef<AbortController | null>(null);

      /**
       * Upload an image file
       */
      const uploadImage = useCallback(async (
        file: File,
        position?: { x: number; y: number }
      ): Promise<UploadedImageData | null> => {
        if (!currentUser) {
          setUploadState({ isUploading: false, progress: 0, error: 'Not authenticated' });
          return null;
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        setUploadState({ isUploading: true, progress: 0, error: null });

        try {
          // ... validation, compression ...

          // Upload with cancellation support
          const result = await uploadImageToStorage(
            compressedFile,
            'main',
            currentUser.uid,
            (progress) => {
              setUploadState(prev => ({ ...prev, progress: 10 + progress * 0.8 }));
            },
            abortControllerRef.current.signal  // Pass abort signal
          );

          // ... rest of upload logic ...
        } catch (error) {
          if (error instanceof Error && error.message === 'Upload cancelled') {
            setUploadState({ isUploading: false, progress: 0, error: null });
            return null;
          }
          // ... existing error handling ...
        }
      }, [currentUser]);

      /**
       * Cancel current upload
       */
      const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      }, []);

      /**
       * Cleanup on unmount
       */
      useEffect(() => {
        return () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        };
      }, []);

      return {
        uploadImage,
        cancelUpload,  // NEW
        isUploading: uploadState.isUploading,
        uploadProgress: uploadState.progress,
        uploadError: uploadState.error,
        resetUploadState,
      };
    }
    ```
  - **Success Criteria:**
    - [ ] Unmounting component cancels upload
    - [ ] No memory leaks
    - [ ] No orphaned Storage files
  - **Tests:**
    1. Start upload, unmount component → upload cancelled
    2. Start upload, navigate away → upload cancelled
    3. Upload completes before unmount → succeeds normally
  - **Rollback:** Remove cleanup logic

### 2.5.3 Add Retry Logic for Failed Uploads
- [ ] **Action:** Automatically retry failed uploads (network errors)
  - **Why:** Temporary network issues shouldn't require user action
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useImageUpload.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Upload with retry logic
     */
    async function uploadWithRetry(
      file: File,
      roomId: string,
      userId: string,
      onProgress: UploadProgressCallback,
      maxRetries: number = 3
    ): Promise<{ url: string; storagePath: string }> {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await uploadImageToStorage(
            file,
            roomId,
            userId,
            onProgress
          );
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Upload failed');

          // Don't retry if cancelled or invalid file
          if (lastError.message.includes('cancelled') ||
              lastError.message.includes('Invalid') ||
              lastError.message.includes('too large')) {
            throw lastError;
          }

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`Upload failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError || new Error('Upload failed after retries');
    }
    ```
  - **Success Criteria:**
    - [ ] Network failures trigger retry
    - [ ] Exponential backoff (1s, 2s, 4s)
    - [ ] Max 3 retry attempts
    - [ ] User errors (invalid file) don't retry
  - **Tests:**
    1. Simulate network failure → retries 3 times
    2. Invalid file type → no retry, immediate error
    3. Cancelled upload → no retry
  - **Edge Cases:**
    - ⚠️ Retry during navigation - cancel retries on unmount
  - **Rollback:** Remove retry logic

---

# Phase 3.5: Canvas Integration Edge Cases

## 3.5 ImageShape Enhancements

### 3.5.1 Add Image Load Timeout
- [ ] **Action:** Add 10-second timeout for image loading
  - **Why:** Prevent infinite loading on slow networks or broken URLs
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
    ```typescript
    /**
     * Load image from src (with timeout)
     */
    useEffect(() => {
      let mounted = true;
      let timeoutId: NodeJS.Timeout;

      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Image load timeout (10s)'));
        }, 10000); // 10 second timeout
      });

      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = image.src;
      });

      Promise.race([loadPromise, timeoutPromise])
        .then((loadedImg) => {
          if (mounted) {
            clearTimeout(timeoutId);
            setHtmlImage(loadedImg as HTMLImageElement);
            requestAnimationFrame(() => {
              const node = shapeRef.current;
              if (node) node.cache();
            });
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error('Failed to load image:', image.fileName, error);
          // TODO: Show placeholder or error icon
        });

      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        if (image.storageType === 'dataURL' && image.src.startsWith('blob:')) {
          URL.revokeObjectURL(image.src);
        }
      };
    }, [image.src, image.fileName, image.storageType]);
    ```
  - **Success Criteria:**
    - [ ] Images timeout after 10 seconds
    - [ ] Error logged to console
    - [ ] Component doesn't crash
    - [ ] Cleanup happens on timeout
  - **Tests:**
    1. Load broken image URL → times out after 10s
    2. Load slow image (simulate 3G) → loads before timeout
    3. Load valid image → no timeout
  - **Edge Cases:**
    - ⚠️ Component unmounts during timeout - cleanup properly
  - **Rollback:** Remove timeout logic

### 3.5.2 Add Minimum Resize Dimensions
- [ ] **Action:** Prevent resizing images below 5×5 pixels
  - **Why:** Extremely small images are not useful and can cause rendering issues
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useResize.ts`
  - **Implementation Details:**
    ```typescript
    // In handleResizeMove:
    const MIN_DIMENSION = 5; // Minimum 5px for both width and height

    // Calculate new dimensions
    let newWidth = /* ...calculation... */;
    let newHeight = /* ...calculation... */;

    // For images with locked aspect ratio
    if (object && object.type === 'image' && object.lockAspectRatio !== false) {
      const aspectRatio = object.naturalWidth / object.naturalHeight;

      // Maintain aspect ratio while enforcing minimums
      if (newWidth < MIN_DIMENSION) {
        newWidth = MIN_DIMENSION;
        newHeight = newWidth / aspectRatio;
      }
      if (newHeight < MIN_DIMENSION) {
        newHeight = MIN_DIMENSION;
        newWidth = newHeight * aspectRatio;
      }
    } else {
      // For other shapes or unlocked images, enforce minimums independently
      newWidth = Math.max(MIN_DIMENSION, newWidth);
      newHeight = Math.max(MIN_DIMENSION, newHeight);
    }
    ```
  - **Success Criteria:**
    - [ ] Cannot resize below 5×5px
    - [ ] Aspect ratio maintained at minimum
    - [ ] Visual feedback (cursor changes at limit)
  - **Tests:**
    1. Resize image to very small size → stops at 5×5px
    2. Resize rectangle to small size → stops at 5×5px
    3. Resize with aspect ratio locked → maintains ratio at limit
  - **Rollback:** Remove minimum dimension check

### 3.5.3 Handle Dynamic Image Source Changes
- [ ] **Action:** Re-load image when src changes
  - **Why:** User might upload new version of same image object
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
    ```typescript
    /**
     * Load image from src (with src change detection)
     */
    useEffect(() => {
      let mounted = true;

      // Clear existing image before loading new one
      setHtmlImage(null);

      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (mounted) {
          setHtmlImage(img);
          requestAnimationFrame(() => {
            const node = shapeRef.current;
            if (node) {
              node.clearCache(); // Clear old cached version
              node.cache();
            }
          });
        }
      };

      img.onerror = (error) => {
        console.error('Failed to load image:', image.fileName, error);
      };

      img.src = image.src;

      return () => {
        mounted = false;
        // Cleanup previous image
        if (image.storageType === 'dataURL' && image.src.startsWith('blob:')) {
          URL.revokeObjectURL(image.src);
        }
      };
    }, [image.src, image.fileName, image.storageType]); // Re-run when src changes
    ```
  - **Success Criteria:**
    - [ ] Changing src triggers reload
    - [ ] Cache cleared before reload
    - [ ] No visual flicker during reload
  - **Tests:**
    1. Update image.src → image reloads
    2. Rapid src changes → handles correctly
  - **Rollback:** N/A (already in plan, just ensure src in dependencies)

---

# Phase 6.5: Memory Management

## 6.5 LRU Cache for Image Pool

### 6.5.1 Implement LRU Cache with Size Limit
- [ ] **Action:** Add LRU cache with max 50 images or 200MB limit
  - **Why:** Prevent memory leaks with many images
  - **Files Modified:**
    - Update: `src/lib/utils/imagePool.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Image Element Pool with LRU Cache
     *
     * Maintains a pool of loaded HTMLImageElements with:
     * - Max 50 images
     * - Max 200MB total memory
     * - LRU eviction policy
     */

    interface CacheEntry {
      image: HTMLImageElement;
      size: number; // Estimated size in bytes
      lastAccessed: number;
    }

    const MAX_CACHE_ENTRIES = 50;
    const MAX_CACHE_SIZE_MB = 200;
    const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

    const imageCache = new Map<string, CacheEntry>();
    let totalCacheSize = 0;

    /**
     * Estimate image size in memory
     */
    function estimateImageSize(img: HTMLImageElement): number {
      // Rough estimate: width × height × 4 bytes (RGBA)
      return img.naturalWidth * img.naturalHeight * 4;
    }

    /**
     * Evict least recently used entries
     */
    function evictLRU(): void {
      if (imageCache.size === 0) return;

      // Sort by last accessed (oldest first)
      const entries = Array.from(imageCache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      // Evict oldest entry
      const [oldestKey, oldestEntry] = entries[0];
      imageCache.delete(oldestKey);
      totalCacheSize -= oldestEntry.size;

      console.log(`Evicted image from cache: ${oldestKey} (${(oldestEntry.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    /**
     * Get or create an HTMLImageElement for a given src
     */
    export function getImageElement(src: string): Promise<HTMLImageElement> {
      // Check cache first
      if (imageCache.has(src)) {
        const entry = imageCache.get(src)!;
        entry.lastAccessed = Date.now();

        if (entry.image.complete) {
          return Promise.resolve(entry.image);
        }
      }

      // Create new image
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          const size = estimateImageSize(img);

          // Evict entries if needed
          while (
            (imageCache.size >= MAX_CACHE_ENTRIES ||
             totalCacheSize + size > MAX_CACHE_SIZE_BYTES) &&
            imageCache.size > 0
          ) {
            evictLRU();
          }

          // Add to cache
          imageCache.set(src, {
            image: img,
            size,
            lastAccessed: Date.now(),
          });
          totalCacheSize += size;

          console.log(`Cached image: ${src.substring(0, 50)}... (${(size / 1024 / 1024).toFixed(2)}MB, total: ${(totalCacheSize / 1024 / 1024).toFixed(2)}MB)`);

          resolve(img);
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${src}`));
        };

        img.src = src;
      });
    }

    /**
     * Remove image from cache
     */
    export function removeImageFromCache(src: string): void {
      const entry = imageCache.get(src);
      if (entry) {
        totalCacheSize -= entry.size;
        imageCache.delete(src);
      }
    }

    /**
     * Clear entire image cache
     */
    export function clearImageCache(): void {
      imageCache.clear();
      totalCacheSize = 0;
    }

    /**
     * Get cache statistics (for debugging)
     */
    export function getCacheStats() {
      return {
        entries: imageCache.size,
        totalSizeMB: totalCacheSize / 1024 / 1024,
        maxEntries: MAX_CACHE_ENTRIES,
        maxSizeMB: MAX_CACHE_SIZE_MB,
      };
    }
    ```
  - **Success Criteria:**
    - [ ] Cache limited to 50 images
    - [ ] Cache limited to 200MB
    - [ ] LRU eviction works correctly
    - [ ] No memory leaks
  - **Tests:**
    1. Load 60 images → oldest 10 evicted
    2. Load images totaling 250MB → evicts to stay under 200MB
    3. Access old image → moves to end of LRU queue
    4. getCacheStats() → returns accurate statistics
  - **Edge Cases:**
    - ⚠️ Very large image (100MB) - evicts multiple old entries
    - ⚠️ Image larger than max cache size - still loads, just not cached
  - **Rollback:** Revert to simple cache without LRU

### 6.5.2 Add Low Memory Event Handler
- [ ] **Action:** Listen for browser low memory events and clear cache
  - **Why:** Prevent browser crashes on low-memory devices
  - **Files Modified:**
    - Update: `src/lib/utils/imagePool.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Handle low memory events
     */
    if (typeof window !== 'undefined') {
      // Listen for memory pressure events (experimental API)
      if ('memory' in performance && 'addEventListener' in (performance as any)) {
        (performance as any).addEventListener('memorypressure', (event: any) => {
          console.warn('Low memory detected, clearing image cache');
          clearImageCache();
        });
      }

      // Fallback: Clear cache periodically on mobile
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        setInterval(() => {
          const stats = getCacheStats();
          if (stats.entries > 30 || stats.totalSizeMB > 150) {
            console.log('Mobile device: Proactively clearing old cache entries');
            // Evict oldest 20% of entries
            const entriesToEvict = Math.floor(stats.entries * 0.2);
            for (let i = 0; i < entriesToEvict; i++) {
              evictLRU();
            }
          }
        }, 60000); // Check every minute
      }
    }
    ```
  - **Success Criteria:**
    - [ ] Low memory events trigger cache clear
    - [ ] Mobile devices proactively clear cache
    - [ ] No browser crashes
  - **Tests:**
    1. Trigger low memory event → cache cleared
    2. On mobile, wait 1 minute with 40 cached images → some evicted
  - **Edge Cases:**
    - ⚠️ Memory pressure API not supported - fallback to timer
  - **Rollback:** Remove event listeners

---

# Phase 7.5: Security & Advanced Testing

## 7.5 Security Tests

### 7.5.1 Test Firebase Storage Rules Enforcement
- [ ] **Action:** Verify all storage security rules work correctly
  - **Why:** Prevent unauthorized access and data leaks
  - **Files Modified:**
    - Create: `src/tests/firebase/storage-rules.test.ts` (if testing framework exists)
  - **Test Scenarios:**
    ```typescript
    describe('Firebase Storage Rules', () => {
      test('Authenticated user can upload image to own folder', async () => {
        // Test: userA uploads to /images/main/userA_uid/file.png → success
      });

      test('User cannot upload to another user folder', async () => {
        // Test: userA uploads to /images/main/userB_uid/file.png → fails
      });

      test('Unauthenticated user cannot upload', async () => {
        // Test: anonymous upload → fails with permission-denied
      });

      test('File size limit enforced (10MB)', async () => {
        // Test: upload 15MB file → fails
      });

      test('MIME type validation enforced', async () => {
        // Test: upload PDF to /images path → fails
        // Test: upload PNG to /images path → success
      });

      test('User can delete own images', async () => {
        // Test: userA deletes /images/main/userA_uid/file.png → success
      });

      test('User cannot delete other user images', async () => {
        // Test: userA deletes /images/main/userB_uid/file.png → fails
      });
    });
    ```
  - **Success Criteria:**
    - [ ] All security rules tests pass
    - [ ] No unauthorized access possible
    - [ ] File size and MIME type validated server-side
  - **Manual Tests (if no test framework):**
    1. Try all scenarios above manually in browser console
    2. Check Firebase Storage emulator logs for rule violations
  - **Rollback:** N/A (tests only)

### 7.5.2 Test Firebase RTDB Rules for Images
- [ ] **Action:** Verify database rules validate image objects correctly
  - **Why:** Prevent malformed or malicious data in RTDB
  - **Test Scenarios:**
    ```typescript
    describe('Firebase RTDB Rules - Image Objects', () => {
      test('Valid image object accepted', async () => {
        // Test: create image with all required fields → success
      });

      test('Image type must be "image"', async () => {
        // Test: create object with type="notimage" → fails
      });

      test('MIME type validation', async () => {
        // Test: mimeType="image/png" → success
        // Test: mimeType="application/pdf" → fails
        // Test: mimeType="image/invalid" → fails
      });

      test('File size limit (10MB = 10485760 bytes)', async () => {
        // Test: fileSize=10485760 → success
        // Test: fileSize=10485761 → fails
      });

      test('Dimensions within limits', async () => {
        // Test: width=5000, height=5000 → success
        // Test: width=50001 → fails
      });

      test('src length limit (500KB)', async () => {
        // Test: src with 100KB data URL → success
        // Test: src with 600KB data URL → fails
      });
    });
    ```
  - **Success Criteria:**
    - [ ] All RTDB rules tests pass
    - [ ] Invalid data rejected
    - [ ] Valid data accepted
  - **Rollback:** N/A (tests only)

### 7.5.3 Test CORS and Crossorigin
- [ ] **Action:** Verify images load with CORS correctly
  - **Why:** Prevent canvas tainting errors
  - **Test Scenarios:**
    1. **Data URL Images:**
       - Load image from data URL → no CORS issues
       - Draw to Konva canvas → no tainting
    2. **Firebase Storage Images:**
       - Load image with crossOrigin='anonymous' → success
       - Verify CORS headers present in response
       - Draw to Konva canvas → no tainting
    3. **External Images (if supported):**
       - Load external image without CORS → canvas tainted, cache() fails
       - Load external image with CORS → success
  - **Success Criteria:**
    - [ ] All images load without CORS errors
    - [ ] Canvas not tainted
    - [ ] Konva cache() works
  - **Tests:**
    1. Upload image, cache it → no errors
    2. Check browser console → no CORS warnings
    3. Export canvas with image → works
  - **Edge Cases:**
    - ⚠️ Safari CORS quirks - test specifically in Safari
  - **Rollback:** N/A (tests only)

## 7.6 Performance & Stress Tests

### 7.6.1 Test Upload with 3G Network Simulation
- [ ] **Action:** Verify upload works on slow networks
  - **Why:** Many users have slow connections
  - **Test Procedure:**
    ```
    1. Open Chrome DevTools → Network tab
    2. Set throttling to "Slow 3G"
    3. Upload 500KB image
    4. Monitor:
       - Progress bar updates smoothly
       - Upload completes within reasonable time (<60s)
       - No timeout errors
    5. Test with 2MB image
    6. Verify retry logic works if connection drops
    ```
  - **Success Criteria:**
    - [ ] 500KB image uploads in <30s on Slow 3G
    - [ ] 2MB image uploads in <90s on Slow 3G
    - [ ] Progress bar updates every 1-2 seconds
    - [ ] Retry works if connection drops
  - **Performance Targets:**
    - Upload time (Slow 3G, 500KB): < 30 seconds
    - Upload time (Fast 3G, 2MB): < 20 seconds
    - Upload time (4G, 5MB): < 10 seconds
  - **Rollback:** N/A (tests only)

### 7.6.2 Test Memory Leaks After Upload/Delete Cycles
- [ ] **Action:** Verify no memory leaks after many operations
  - **Why:** Memory leaks cause browser slowdown over time
  - **Test Procedure:**
    ```
    1. Open Chrome DevTools → Memory tab
    2. Take heap snapshot (baseline)
    3. Upload 10 images
    4. Delete all 10 images
    5. Repeat 10 times (100 total uploads/deletes)
    6. Force garbage collection (DevTools)
    7. Take second heap snapshot
    8. Compare snapshots:
       - Detached DOM nodes should be ~0
       - Total heap size should be similar to baseline (+/- 10MB)
       - No growing arrays or maps
    ```
  - **Success Criteria:**
    - [ ] Heap size returns to baseline after GC
    - [ ] No detached DOM nodes
    - [ ] Image cache size stable
    - [ ] No growing memory allocations
  - **Acceptable Thresholds:**
    - Heap size increase: < 20MB after 100 cycles
    - Detached DOM nodes: < 10
    - Image cache: auto-evicts old entries
  - **Rollback:** N/A (tests only)

### 7.6.3 Test FPS Impact During Upload
- [ ] **Action:** Verify uploads don't block rendering
  - **Why:** App should stay responsive during uploads
  - **Test Procedure:**
    ```
    1. Open Chrome DevTools → Performance tab
    2. Start recording
    3. Pan/zoom canvas while uploading large image
    4. Stop recording after upload completes
    5. Analyze:
       - FPS during upload should stay > 30
       - Long tasks (<50ms) should be rare
       - Main thread not blocked by upload
    ```
  - **Success Criteria:**
    - [ ] FPS stays above 30 during upload
    - [ ] Canvas interactions responsive (<100ms)
    - [ ] Upload uses Web Workers (browser-image-compression)
  - **Performance Targets:**
    - FPS during upload: > 30 FPS
    - Canvas drag latency: < 100ms
    - Image compression: uses Web Workers (non-blocking)
  - **Rollback:** N/A (tests only)

---

# Deployment Checklist Additions

Add these items to the main plan's deployment checklist:

## Additional Deployment Checks

- [ ] **Firebase Configuration:**
  - [ ] storage.rules deployed with 10MB limit
  - [ ] database.rules.json deployed with 'image' type
  - [ ] Storage emulator working locally
  - [ ] Rules tested in emulator (Phase 0.3.4)
  - [ ] Rules deployed to production (Phase 0.3.5)

- [ ] **Code Quality:**
  - [ ] All edge cases handled (Phases 1.5, 2.5, 3.5)
  - [ ] Upload cancellation works (Phase 2.5)
  - [ ] Retry logic tested (Phase 2.5)
  - [ ] LRU cache implemented (Phase 6.5)
  - [ ] Memory leak tests passed (Phase 7.6.2)

- [ ] **Security:**
  - [ ] Storage rules security tests passed (Phase 7.5.1)
  - [ ] RTDB rules validation tests passed (Phase 7.5.2)
  - [ ] CORS tested in all browsers (Phase 7.5.3)
  - [ ] No unauthorized access possible

- [ ] **Performance:**
  - [ ] 3G upload test passed (Phase 7.6.1)
  - [ ] FPS during upload > 30 (Phase 7.6.3)
  - [ ] Cache eviction working (Phase 6.5)
  - [ ] No memory leaks (Phase 7.6.2)

- [ ] **Browser Compatibility:**
  - [ ] Tested in Chrome, Firefox, Safari, Edge
  - [ ] CORS works in Safari (Phase 7.5.3)
  - [ ] Mobile touch tested (original plan 7.3.2)
  - [ ] HEIF detection working (Phase 1.5.1)

---

# Priority Matrix

## CRITICAL (Must complete before any deployment)
1. Phase 0.3: Firebase Configuration (all tasks)
2. Phase 7.5.1: Storage Rules Security Tests
3. Phase 7.5.2: RTDB Rules Validation Tests

## HIGH (Complete before production)
4. Phase 2.5.2: Upload Cancellation on Unmount
5. Phase 6.5.1: LRU Cache Implementation
6. Phase 3.5.1: Image Load Timeout
7. Phase 7.6.2: Memory Leak Tests

## MEDIUM (Important but can be deferred)
8. Phase 2.5.3: Retry Logic
9. Phase 3.5.2: Minimum Resize Dimensions
10. Phase 1.5.1: HEIF Format Detection
11. Phase 7.6.1: 3G Network Tests

## LOW (Nice to have)
12. Phase 1.5.2: Compression Fallback
13. Phase 6.5.2: Low Memory Events
14. Phase 7.6.3: FPS Impact Tests

---

# Known Limitations (Additions)

Add these to the main plan's limitations section:

8. **HEIF/HEIC Format:** iPhone photos in HEIF format not supported - user must convert first
9. **Cache Size:** Image cache limited to 50 images or 200MB to prevent memory issues
10. **Mobile Uploads:** iOS Safari has stricter file size limits (varies by iOS version)
11. **Retry Limit:** Failed uploads retry max 3 times with exponential backoff
12. **Upload Cancellation:** Cancelled uploads may leave temporary files in Storage (cleaned up by Firebase after 24h)
13. **Minimum Dimensions:** Images cannot be resized below 5×5 pixels
14. **Load Timeout:** Images that take >10 seconds to load will fail with timeout error

---

**End of Additions Document**

This document should be used alongside the main image-handling.md plan. Complete all CRITICAL items before first deployment, and HIGH priority items before production release.
