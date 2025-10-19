# Cropped Image Preprocessing for Background Removal - Implementation Plan

**Project:** Canvas Icons (Figma Clone)
**Estimated Time:** 1.5-2 hours
**Dependencies:** Existing export utilities, Firebase Storage, Replicate API
**Last Updated:** 2025-10-18

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 0/9 tasks completed (0%)

---

## Legend

- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Completed and verified
- `[!]` = Blocked (see Blockers section)
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task
- **Files Modified:** Track what files changed
- **Rollback:** How to undo if needed

---

## Blockers & Notes

**Active Blockers:**
- None currently

**Decision Log:**
- 2025-10-18 - Mirror export pattern for canvas rendering (proven, reliable)
- 2025-10-18 - Upload temp cropped image to Firebase Storage (reuse existing upload infrastructure)
- 2025-10-18 - Clean up temp file after Replicate processes it (avoid storage bloat)

**Lessons Learned:**
- (To be filled during implementation)

---

# Phase 0: Research & Planning

## Problem Statement

**Current Issue:**
When a user crops an image on the canvas using the Crop tool, only the crop properties (`cropX`, `cropY`, `cropWidth`, `cropHeight`) are updated. The `src` URL still points to the original uncropped image. When "Remove Background" is clicked, Replicate API receives the **original uncropped image** instead of the cropped portion.

**Desired Behavior:**
1. User crops image → crop properties saved
2. User clicks "Remove Background"
3. **System detects crop** → renders cropped portion → uploads to Firebase → sends cropped URL to Replicate
4. Replicate processes the **cropped image**, not the original
5. New image created with background removed from cropped portion

---

## 0.1 Research Context

### Existing Patterns Found

**1. Export Pattern** (`src/lib/utils/export.ts:77`)
- Uses off-screen canvas rendering to capture specific portions
- Handles bounding boxes, transforms, and image crops
- Converts canvas to data URL for download
- **Pattern to mirror:** Canvas rendering approach

**2. Upload Pattern** (`src/lib/firebase/imageUploadService.ts:84`)
- Handles File → Firebase Storage upload
- Returns `{ url, storagePath }` for later reference
- Supports progress callbacks and abort signals
- **Pattern to reuse:** Upload infrastructure

**3. Background Removal Flow** (`src/features/properties-panel/components/ImageSection.tsx:116`)
- Current flow: `shape.src` → Replicate API → create new image
- We need to insert preprocessing step BEFORE calling Replicate
- **No changes needed:** Backend Replicate service stays the same

### Key Files Identified

- `src/lib/utils/export.ts` - Canvas rendering patterns
- `src/lib/firebase/storage.ts` - Upload utilities
- `src/features/properties-panel/components/ImageSection.tsx` - Background removal handler
- `src/types/canvas.types.ts:230` - ImageProperties with crop fields

---

## 0.2 Design Decisions

### Technical Approach

**Decision 1: Create New Utility File**
- **File:** `src/lib/utils/cropRenderer.ts`
- **Why:** Keep crop rendering logic separate, reusable, testable
- **Contains:** `isCropped()`, `renderCroppedImage()`

**Decision 2: Upload Temp Cropped Image to Firebase**
- **Why:** Replicate needs a public URL (can't use data URLs)
- **Pattern:** Reuse existing `uploadImageToStorage()`
- **Cleanup:** Delete temp file after Replicate finishes

**Decision 3: Minimal Changes to Existing Flow**
- **Why:** Reduce risk, keep backend unchanged
- **Approach:** Preprocess → swap URL → continue existing flow
- **Benefit:** Easy to test, easy to rollback

### Architecture Overview

```
User clicks "Remove Background"
    ↓
Check: isCropped(image)?
    ↓ YES                          ↓ NO
Render cropped portion        Use original src
    ↓                              ↓
Upload to Firebase            [Skip preprocessing]
    ↓                              ↓
Get temp URL                       ↓
    ↓                              ↓
    └──────────────┬───────────────┘
                   ↓
    Send to Replicate API (existing flow)
                   ↓
    Replicate processes image
                   ↓
    Delete temp file (cleanup)
                   ↓
    Create new image object (existing flow)
```

---

# Phase 1: Utility Functions (Estimated: 45 minutes)

**Goal:** Create reusable utilities to detect and render cropped images

**Phase Success Criteria:**
- [ ] `isCropped()` correctly identifies cropped images
- [ ] `renderCroppedImage()` produces valid PNG blobs
- [ ] Functions exported and importable

---

## 1.1 Create Crop Detection Helper

### 1.1.1 Create `isCropped()` Function
- [ ] **Action:** Create `src/lib/utils/cropRenderer.ts` with `isCropped()` helper
  - **Why:** Need reliable way to detect if image has crop properties applied
  - **Files Modified:**
    - Create: `src/lib/utils/cropRenderer.ts`
  - **Implementation Details:**
```typescript
import type { ImageObject } from '@/types';

/**
 * Crop Renderer Utilities
 *
 * Provides functions to detect and render cropped portions of images.
 * Used for preprocessing cropped images before background removal.
 */

/**
 * Check if image has crop properties applied
 *
 * An image is considered cropped if:
 * - cropX or cropY is set and non-zero, OR
 * - cropWidth/cropHeight differs from naturalWidth/naturalHeight
 *
 * @param image - Image object to check
 * @returns True if image is cropped
 *
 * @example
 * ```ts
 * if (isCropped(imageObject)) {
 *   // Render cropped portion
 * } else {
 *   // Use original image
 * }
 * ```
 */
export function isCropped(image: ImageObject): boolean {
  // Check if crop position is non-zero
  const hasCropX = image.cropX !== undefined && image.cropX !== 0;
  const hasCropY = image.cropY !== undefined && image.cropY !== 0;

  // Check if crop dimensions differ from natural dimensions
  const hasCropWidth =
    image.cropWidth !== undefined &&
    image.cropWidth !== image.naturalWidth;
  const hasCropHeight =
    image.cropHeight !== undefined &&
    image.cropHeight !== image.naturalHeight;

  return hasCropX || hasCropY || hasCropWidth || hasCropHeight;
}
```
  - **Success Criteria:**
    - [ ] File created at `src/lib/utils/cropRenderer.ts`
    - [ ] Function has JSDoc comments
    - [ ] Returns boolean
    - [ ] Handles undefined crop properties
  - **Tests:**
    1. Create test image: `{ naturalWidth: 800, naturalHeight: 600 }`
    2. Test uncropped: `isCropped({ ...img })` → expect `false`
    3. Test with cropX: `isCropped({ ...img, cropX: 100 })` → expect `true`
    4. Test with cropWidth: `isCropped({ ...img, cropWidth: 400 })` → expect `true`
    5. Test matching dimensions: `isCropped({ ...img, cropWidth: 800, cropHeight: 600 })` → expect `false`
  - **Edge Cases:**
    - ⚠️ All crop properties undefined → Return false (uncropped)
    - ⚠️ Crop at 0,0 with full dimensions → Return false (no effective crop)
    - ⚠️ Only cropX=0, cropY=0 set → Return false (zero offset = no crop)
  - **Rollback:** Delete `src/lib/utils/cropRenderer.ts`
  - **Last Verified:** [Date when tested]

---

## 1.2 Create Crop Rendering Function

### 1.2.1 Create `renderCroppedImage()` Function
- [ ] **Action:** Add `renderCroppedImage()` to `src/lib/utils/cropRenderer.ts`
  - **Why:** Need to render cropped portion as standalone image blob
  - **Files Modified:**
    - Update: `src/lib/utils/cropRenderer.ts`
  - **Implementation Details:**
```typescript
/**
 * Load image element from URL
 * Helper function to load HTMLImageElement with promise
 */
async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));
    img.src = src;
  });
}

/**
 * Render cropped portion of image to PNG blob
 *
 * Creates an off-screen canvas, draws the cropped portion,
 * and converts to PNG blob for upload.
 *
 * @param imageSrc - Image source URL (data URL or Firebase Storage URL)
 * @param cropX - X position to start crop from source image
 * @param cropY - Y position to start crop from source image
 * @param cropWidth - Width of crop area from source image
 * @param cropHeight - Height of crop area from source image
 * @returns Promise resolving to PNG blob
 *
 * @throws {Error} If image fails to load
 * @throws {Error} If blob creation fails
 *
 * @example
 * ```ts
 * const blob = await renderCroppedImage(
 *   imageUrl,
 *   100, 50,  // Start at x=100, y=50
 *   400, 300  // Crop 400x300 area
 * );
 * // blob is ready to upload
 * ```
 */
export async function renderCroppedImage(
  imageSrc: string,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
): Promise<Blob> {
  // Step 1: Load image
  const img = await loadImageElement(imageSrc);

  // Step 2: Create off-screen canvas sized to crop dimensions
  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Step 3: Draw cropped portion
  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight, // Source crop area
    0,
    0,
    cropWidth,
    cropHeight // Destination (full canvas)
  );

  // Step 4: Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      1.0 // Max quality
    );
  });
}
```
  - **Success Criteria:**
    - [ ] Function accepts 5 parameters (src, cropX, cropY, cropWidth, cropHeight)
    - [ ] Returns Promise<Blob>
    - [ ] JSDoc comments complete
    - [ ] Handles image loading errors
    - [ ] Handles blob creation errors
  - **Tests:**
    1. Create test image (use a small data URL)
    2. Call: `renderCroppedImage(testUrl, 0, 0, 100, 100)`
    3. Expected: Blob with size > 0
    4. Verify: Blob type is 'image/png'
    5. Test error: Invalid URL → expect rejection
  - **Edge Cases:**
    - ⚠️ Image fails to load → Reject promise with error
    - ⚠️ Canvas context unavailable → Throw error
    - ⚠️ Blob creation fails → Reject promise
    - ⚠️ Crop dimensions larger than source → Canvas will show partial image (browser handles gracefully)
  - **Rollback:** Remove `renderCroppedImage()` function
  - **Last Verified:** [Date when tested]

---

## 1.3 Export Utilities

### 1.3.1 Add Exports and Type Imports
- [ ] **Action:** Add proper exports to `src/lib/utils/cropRenderer.ts`
  - **Why:** Make functions available to ImageSection component
  - **Files Modified:**
    - Update: `src/lib/utils/cropRenderer.ts` (ensure exports are correct)
  - **Implementation Details:**
```typescript
// At top of file
import type { ImageObject } from '@/types';

// Functions already have 'export' keyword, verify they're present:
// export function isCropped(image: ImageObject): boolean { ... }
// export async function renderCroppedImage(...): Promise<Blob> { ... }
```
  - **Success Criteria:**
    - [ ] Both functions have `export` keyword
    - [ ] Type imports work correctly
    - [ ] No TypeScript errors
  - **Tests:**
    1. Create test file: `src/test-crop-utils.ts`
    2. Import: `import { isCropped, renderCroppedImage } from '@/lib/utils/cropRenderer'`
    3. Verify no import errors
    4. Delete test file
  - **Edge Cases:**
    - ⚠️ Type import fails → Check ImageObject export from @/types
  - **Rollback:** N/A (just exports)
  - **Last Verified:** [Date when tested]

---

# Phase 2: Integration (Estimated: 45 minutes)

**Goal:** Integrate crop preprocessing into background removal flow

**Phase Success Criteria:**
- [ ] Cropped images processed correctly
- [ ] Uncropped images use original flow (regression test passes)
- [ ] Temp files cleaned up after processing

---

## 2.1 Update Background Removal Handler

### 2.1.1 Add Preprocessing Logic to `handleRemoveBackground()`
- [ ] **Action:** Update `src/features/properties-panel/components/ImageSection.tsx`
  - **Why:** Add preprocessing step to detect and render cropped images
  - **Files Modified:**
    - Update: `src/features/properties-panel/components/ImageSection.tsx`
  - **Implementation Details:**

**First, add imports at top of file (around line 20):**
```typescript
import { isCropped, renderCroppedImage } from '@/lib/utils/cropRenderer';
import { uploadImageToStorage, deleteImageFromStorage } from '@/lib/firebase/storage';
```

**Then, update `handleRemoveBackground()` function (starts at line 116):**
```typescript
async function handleRemoveBackground() {
  if (!shape || !isImageShape(shape)) return;

  // Ensure user is authenticated (required for createdBy field)
  if (!currentUser) {
    toast.error('Authentication required', {
      description: 'Please sign in to remove backgrounds',
      duration: 3000,
    });
    return;
  }

  // Mark image as processing
  addProcessingImage(shape.id);

  try {
    toast.info('Removing background...', {
      description: 'This may take 5-15 seconds',
      duration: 3000,
    });

    // **NEW: Preprocessing for cropped images**
    let imageUrlToProcess = shape.src;
    let tempStoragePath: string | undefined;

    // Check if image is cropped
    if (isCropped(shape)) {
      // Image has crop properties - render and upload cropped version
      toast.info('Preparing cropped image...', {
        description: 'Rendering cropped portion',
        duration: 2000,
      });

      // Get crop values (with fallbacks to full image)
      const cropX = shape.cropX ?? 0;
      const cropY = shape.cropY ?? 0;
      const cropWidth = shape.cropWidth ?? shape.naturalWidth;
      const cropHeight = shape.cropHeight ?? shape.naturalHeight;

      // Render cropped portion to blob
      const croppedBlob = await renderCroppedImage(
        shape.src,
        cropX,
        cropY,
        cropWidth,
        cropHeight
      );

      // Convert blob to File for upload
      const croppedFile = new File(
        [croppedBlob],
        `cropped-temp-${Date.now()}-${shape.fileName}`,
        { type: 'image/png' }
      );

      // Upload to Firebase Storage
      const uploadResult = await uploadImageToStorage(
        croppedFile,
        projectId,
        currentUser.uid
      );

      imageUrlToProcess = uploadResult.url;
      tempStoragePath = uploadResult.storagePath;

      console.log('Cropped image uploaded:', {
        tempUrl: imageUrlToProcess,
        tempPath: tempStoragePath,
        cropDimensions: { cropX, cropY, cropWidth, cropHeight },
      });
    }

    // Call Firebase Function to process image (original or cropped)
    const result = await removeImageBackground(imageUrlToProcess, projectId, shape.id);

    // **NEW: Cleanup temp cropped image if we created one**
    if (tempStoragePath) {
      try {
        await deleteImageFromStorage(tempStoragePath);
        console.log('Temp cropped image deleted:', tempStoragePath);
      } catch (error) {
        console.warn('Failed to cleanup temp cropped image:', error);
        // Don't fail the whole operation if cleanup fails
      }
    }

    if (!result.success || !result.processedImageUrl || !result.storagePath) {
      throw new Error(result.error || 'Background removal failed');
    }

    // Get image dimensions from the processed image
    // We'll load it client-side to get naturalWidth/naturalHeight
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = result.processedImageUrl!;
    });

    // Create new image object next to original
    // This will sync to Firebase for persistence and real-time collaboration
    await createProcessedImage(
      shape,
      {
        url: result.processedImageUrl,
        storagePath: result.storagePath,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fileSize: result.fileSize || shape.fileSize,
      },
      currentUser.uid
    );

    toast.success('Background removed!', {
      description: 'New image created next to original',
      duration: 3000,
    });
  } catch (error) {
    console.error('Background removal failed:', error);
    toast.error('Failed to remove background', {
      description: error instanceof Error ? error.message : 'Please try again',
      duration: 5000,
    });
  } finally {
    // Remove from processing set
    removeProcessingImage(shape.id);
  }
}
```
  - **Success Criteria:**
    - [ ] Imports added at top of file
    - [ ] `isCropped()` check added before Replicate call
    - [ ] Cropped image rendered and uploaded
    - [ ] Temp file cleanup after Replicate
    - [ ] Console logs for debugging
    - [ ] No TypeScript errors
  - **Tests:**
    1. **Test with cropped image:**
       - Upload image to canvas
       - Open Crop tool, crop to half size
       - Click "Remove Background"
       - Verify toast: "Preparing cropped image..."
       - Verify console log: "Cropped image uploaded"
       - Wait for completion
       - Verify new image shows cropped portion with bg removed
       - Check Firebase Storage: Temp file should be deleted
    2. **Test with uncropped image (regression):**
       - Upload image to canvas
       - Do NOT crop it
       - Click "Remove Background"
       - Verify NO "Preparing cropped image..." toast
       - Verify background removed from full image
       - Verify original behavior unchanged
  - **Edge Cases:**
    - ⚠️ Render fails → Error caught, user sees error toast
    - ⚠️ Upload fails → Error caught, user sees error toast
    - ⚠️ Replicate fails → Temp file still cleaned up (in finally block)
    - ⚠️ Cleanup fails → Logged as warning, doesn't fail operation
    - ⚠️ User deletes image while processing → Processing completes anyway, creates result
  - **Rollback:** Revert `handleRemoveBackground()` to original version
  - **Last Verified:** [Date when tested]

---

# Phase 3: Testing (Estimated: 30 minutes)

**Goal:** Thoroughly test all scenarios and edge cases

**Phase Success Criteria:**
- [ ] Cropped images process correctly
- [ ] Uncropped images still work (no regression)
- [ ] Edge cases handled gracefully
- [ ] No console errors

---

## 3.1 Test Cropped Image Flow

### 3.1.1 Test Standard Crop
- [ ] **Action:** Test with normally cropped image
  - **Test Procedure:**
    1. Upload test image (e.g., photo with person and background)
    2. Click "Crop Image..." button
    3. Drag crop frame to select only center portion (e.g., 50% of image)
    4. Click "Apply Crop"
    5. Verify image appears cropped on canvas
    6. Click "Remove Background"
    7. Observe toasts:
       - "Removing background..."
       - "Preparing cropped image..."
    8. Wait for completion (5-15 seconds)
    9. Verify new image created next to original
    10. Verify new image shows ONLY cropped portion with transparent background
    11. Open browser DevTools → Network tab
    12. Verify temp file uploaded to Firebase Storage
    13. Check console logs for "Temp cropped image deleted"
  - **Expected Result:**
    - New image contains only cropped portion
    - Background removed from cropped area only
    - Original image unchanged
    - Temp file cleaned up
  - **Success Criteria:**
    - [ ] Cropped portion rendered correctly
    - [ ] Background removed from cropped area
    - [ ] No console errors
    - [ ] Temp file deleted
  - **Last Verified:** [Date when tested]

### 3.1.2 Test Edge Crop (0, 0 position)
- [ ] **Action:** Test crop starting at 0,0
  - **Test Procedure:**
    1. Upload test image
    2. Crop from top-left corner (cropX=0, cropY=0) with smaller dimensions
    3. Click "Remove Background"
    4. Verify crop detected (toast appears)
    5. Verify correct portion processed
  - **Expected Result:**
    - Crop detected even with 0,0 position
    - Correct portion processed
  - **Success Criteria:**
    - [ ] `isCropped()` returns true
    - [ ] Correct top-left portion processed
  - **Last Verified:** [Date when tested]

### 3.1.3 Test Tiny Crop
- [ ] **Action:** Test with very small crop area
  - **Test Procedure:**
    1. Upload test image
    2. Crop to very small area (e.g., 50x50 pixels)
    3. Click "Remove Background"
    4. Verify processing completes
    5. Verify new image shows small cropped area
  - **Expected Result:**
    - Small crop processed successfully
    - No errors from Replicate (handles small images)
  - **Success Criteria:**
    - [ ] Tiny crop renders correctly
    - [ ] Replicate processes small image
    - [ ] Result appears on canvas
  - **Last Verified:** [Date when tested]

---

## 3.2 Test Uncropped Image Flow (Regression)

### 3.2.1 Test Uncropped Image
- [ ] **Action:** Verify original flow still works
  - **Test Procedure:**
    1. Upload test image
    2. Do NOT crop it (leave crop properties undefined)
    3. Click "Remove Background"
    4. Verify NO "Preparing cropped image..." toast
    5. Verify processing completes
    6. Verify background removed from full original image
  - **Expected Result:**
    - Original flow unchanged
    - Full image processed
    - No preprocessing step
  - **Success Criteria:**
    - [ ] `isCropped()` returns false
    - [ ] No temp file created
    - [ ] Full image processed
    - [ ] Background removed successfully
  - **Last Verified:** [Date when tested]

### 3.2.2 Test Full-Image Crop (No Effective Crop)
- [ ] **Action:** Test crop that matches full dimensions
  - **Test Procedure:**
    1. Upload test image (e.g., 800x600)
    2. Open Crop tool
    3. Set crop to full dimensions: cropX=0, cropY=0, cropWidth=800, cropHeight=600
    4. Click "Apply Crop"
    5. Click "Remove Background"
    6. Verify treated as uncropped (no preprocessing toast)
  - **Expected Result:**
    - `isCropped()` returns false
    - Uses original flow
    - No temp upload
  - **Success Criteria:**
    - [ ] Full-image crop detected as "not cropped"
    - [ ] Original flow used
    - [ ] Processing succeeds
  - **Last Verified:** [Date when tested]

---

## 3.3 Test Error Handling

### 3.3.1 Test Render Failure
- [ ] **Action:** Test with invalid crop parameters
  - **Test Procedure:**
    1. Manually set invalid crop via browser console:
       ```js
       useCanvasStore.getState().updateObject(selectedId, {
         cropX: -100,  // Invalid
         cropY: -100,
         cropWidth: 9999,  // Larger than natural
         cropHeight: 9999
       })
       ```
    2. Click "Remove Background"
    3. Verify error handled gracefully
    4. Verify user sees error toast
  - **Expected Result:**
    - Error caught
    - User-friendly error message
    - No crash
  - **Success Criteria:**
    - [ ] Error caught in try/catch
    - [ ] Toast shows error
    - [ ] Processing state cleaned up
  - **Last Verified:** [Date when tested]

### 3.3.2 Test Upload Failure
- [ ] **Action:** Simulate upload failure
  - **Test Procedure:**
    1. Disconnect internet or block Firebase Storage in DevTools
    2. Upload and crop an image
    3. Click "Remove Background"
    4. Verify upload error caught
    5. Verify user sees error message
  - **Expected Result:**
    - Upload error caught
    - User-friendly error
    - Processing state cleaned up
  - **Success Criteria:**
    - [ ] Error caught
    - [ ] Error toast shown
    - [ ] No hanging state
  - **Last Verified:** [Date when tested]

### 3.3.3 Test Cleanup Failure (Non-Critical)
- [ ] **Action:** Verify cleanup failure doesn't break flow
  - **Test Procedure:**
    1. Add temporary error in cleanup (or mock deleteImageFromStorage to fail)
    2. Process cropped image
    3. Verify warning logged
    4. Verify operation still completes successfully
  - **Expected Result:**
    - Cleanup failure logged as warning
    - Background removal still succeeds
    - New image created
  - **Success Criteria:**
    - [ ] Warning in console
    - [ ] Operation completes
    - [ ] User sees success toast
  - **Last Verified:** [Date when tested]

---

# Final Integration & Testing

## Integration Tests

- [ ] **End-to-End Flow Test**
  - **Scenario:** Complete user workflow from upload to background removal
  - **Steps:**
    1. Start with fresh canvas
    2. Upload image (e.g., person with solid background)
    3. Crop to select person only
    4. Click "Remove Background"
    5. Verify cropped person appears with transparent background
    6. Verify original cropped image unchanged
    7. Verify temp file cleaned up in Firebase Storage
  - **Expected:** Complete flow works smoothly, no errors
  - **Test Data:** Use test image from `_docs/test-assets/` (if available)

- [ ] **Multiple Images Test**
  - **Scenario:** Process multiple cropped images in sequence
  - **Steps:**
    1. Upload 3 different images
    2. Crop each differently
    3. Process background removal on each
    4. Verify all 3 processed correctly
    5. Verify no temp file accumulation
  - **Expected:** All images process independently, no interference

- [ ] **Collaborative Test (If Applicable)**
  - **Scenario:** Two users processing images simultaneously
  - **Steps:**
    1. Open canvas in two browser windows (different users)
    2. Each user uploads and crops an image
    3. Both click "Remove Background" at same time
    4. Verify both process successfully
  - **Expected:** No conflicts, both operations complete

---

## Performance Tests

- [ ] **Rendering Performance**
  - **Metric:** Time to render cropped image
  - **Target:** < 500ms for typical image sizes
  - **How to Test:**
    1. Add console.time/timeEnd in renderCroppedImage
    2. Test with various image sizes:
       - Small: 500x500 → expect < 100ms
       - Medium: 2000x2000 → expect < 300ms
       - Large: 4000x4000 → expect < 500ms
    3. Verify no frame drops

- [ ] **Upload Performance**
  - **Metric:** Time to upload temp cropped file
  - **Target:** < 3 seconds for typical crops
  - **How to Test:**
    1. Monitor Network tab in DevTools
    2. Typical crop (1000x1000) → expect < 2s
    3. Large crop (3000x3000) → expect < 5s

---

## Error Handling Verification

- [ ] **All Error Paths Tested**
  - [ ] Image load failure → User sees error
  - [ ] Render failure → User sees error
  - [ ] Upload failure → User sees error
  - [ ] Replicate API error → User sees error
  - [ ] Cleanup failure → Logged as warning, operation succeeds

- [ ] **No Uncaught Exceptions**
  - [ ] Check browser console for errors
  - [ ] Verify all promises have .catch() or try/catch

- [ ] **Processing State Cleanup**
  - [ ] Success: Processing state removed
  - [ ] Error: Processing state removed
  - [ ] User navigates away: Processing state removed

---

# Deployment Checklist

- [ ] All 9 tasks completed and verified
- [ ] All integration tests passing
- [ ] All performance tests meeting targets
- [ ] All error handling verified
- [ ] No console errors in any test scenario
- [ ] Tested with both cropped and uncropped images
- [ ] Tested edge cases (tiny crop, 0,0 position, full-image crop)
- [ ] Temp file cleanup verified in Firebase Storage console
- [ ] Code follows project style (JSDoc comments, TypeScript types)
- [ ] No ESLint warnings
- [ ] Ready for git commit

---

# Appendix

## Related Documentation

- **Export utilities:** `src/lib/utils/export.ts` (canvas rendering pattern)
- **Upload service:** `src/lib/firebase/imageUploadService.ts` (upload infrastructure)
- **Background removal:** `src/features/properties-panel/components/ImageSection.tsx`
- **Image types:** `src/types/canvas.types.ts` (ImageObject interface)

## Future Enhancements

- **Optimize for large images:** Downscale before rendering if > 4000px
- **Progress indicator:** Show upload progress for large crops
- **Batch processing:** Allow multiple images to be processed at once
- **Preview cropped area:** Show preview before processing
- **Retry logic:** Auto-retry if upload fails once

## Technical Notes

**Why not use data URLs?**
- Replicate API requires public HTTP URLs
- Data URLs can be very large (> 1MB) and fail in API calls
- Firebase Storage provides reliable public URLs

**Why upload then delete?**
- Need public URL for Replicate
- Don't want to clutter user's storage with temp files
- Cleanup ensures storage costs stay low

**Why not modify Replicate service?**
- Existing backend works perfectly
- Less risk to change only frontend
- Easy to test and rollback

## Time Log

| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| [Date] | Phase 0 | [Hours] | Research existing patterns |
| [Date] | Phase 1 | [Hours] | Create utility functions |
| [Date] | Phase 2 | [Hours] | Integration |
| [Date] | Phase 3 | [Hours] | Testing |
