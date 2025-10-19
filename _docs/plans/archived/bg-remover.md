# Implementation Plan: Background Removal Feature

**Feature Name:** Image Background Removal via Replicate rembg API
**Estimated Time:** 6-8 hours
**Dependencies:** Replicate API token, Firebase Functions, Firebase Storage
**Target Completion:** Single session

## Architecture Overview

```
User selects image → Properties panel "Remove Background" button
    ↓
Frontend calls removeImageBackground(imageUrl, projectId, imageId)
    ↓
Firebase Function validates request & calls Replicate API
    ↓
Replicate processes image (5-15s) & returns processed image URL
    ↓
Firebase Function downloads result → uploads to Storage → tracks usage
    ↓
Frontend receives processed URL → creates new ImageObject next to original
    ↓
User sees new image with transparent background on canvas
```

## Phase 0: Research & Planning ✅

**Existing Patterns:**
- Image upload: `src/lib/firebase/imageUploadService.ts` + `functions/src/services/storage-upload.ts`
- Firebase callable functions: `functions/src/index.ts` (processAICommand, createCheckoutSession)
- Image generation: `functions/src/services/image-generation.ts` (DALL-E pattern)
- ImageObject type: `src/types/canvas.types.ts:269` (has all needed properties)

**Technical Decisions:**
1. **Non-destructive**: Create new image object (user choice)
2. **UI trigger**: Properties panel button (user choice)
3. **Processing UX**: Optimistic update with badge (user choice)
4. **Usage tracking**: Track but don't limit (user choice)
5. **Storage path**: `processed-images/{projectId}/{timestamp}-{uuid}.png`
6. **Timeout**: 60s max (Replicate allows up to 60s with Prefer: wait)

---

## Phase 1: Backend - Firebase Function (3-4 hours)

### 1.1 Setup Replicate API Secret

#### 1.1.1 Add Secret to Firebase
- [ ] **Action:** Add REPLICATE_API_TOKEN to Firebase secrets
  - **Why:** Secure storage of API credentials
  - **Files Modified:** None (Firebase secrets stored remotely)
  - **Command:** `firebase functions:secrets:set REPLICATE_API_TOKEN`
  - **Success Criteria:**
    - [ ] Secret stored in Firebase project
    - [ ] Can be accessed via `firebase functions:secrets:access REPLICATE_API_TOKEN`
  - **Tests:**
    1. Run: `firebase functions:secrets:access REPLICATE_API_TOKEN`
    2. Expected: API token value displayed
  - **Edge Cases:**
    - ⚠️ Token already exists: Confirm overwrite
  - **Rollback:** `firebase functions:secrets:destroy REPLICATE_API_TOKEN`

### 1.2 Create Types

#### 1.2.1 Add Request/Response Types
- [ ] **Action:** Add background removal types to `functions/src/types.ts`
  - **Why:** Type safety for callable function
  - **Files Modified:**
    - Update: `functions/src/types.ts`
  - **Implementation:**
```typescript
/**
 * Remove background from image request
 */
export interface RemoveBackgroundRequest {
  imageUrl: string;      // URL of image to process (Storage URL or data URL)
  projectId: string;     // Project ID for organizing storage
  originalImageId: string; // Original image object ID (for tracking)
}

/**
 * Remove background from image response
 */
export interface RemoveBackgroundResponse {
  success: boolean;
  processedImageUrl?: string;  // Firebase Storage URL of processed image
  storagePath?: string;         // Storage path for cleanup
  naturalWidth?: number;        // Dimensions of processed image
  naturalHeight?: number;
  fileSize?: number;            // Size of processed file
  error?: string;
  errorCode?: 'api_error' | 'download_failed' | 'upload_failed' | 'invalid_url' | 'timeout';
}
```
  - **Success Criteria:**
    - [ ] Types added with JSDoc comments
    - [ ] Exported from types.ts
    - [ ] No TypeScript errors
  - **Tests:**
    1. Import types in test file
    2. Create mock objects with types
    3. Verify type checking works
  - **Rollback:** Remove type definitions

### 1.3 Create Replicate Service

#### 1.3.1 Create Background Removal Service
- [ ] **Action:** Create `functions/src/services/replicate-background-removal.ts`
  - **Why:** Encapsulate Replicate API logic with error handling
  - **Files Modified:**
    - Create: `functions/src/services/replicate-background-removal.ts`
  - **Implementation:** Service with `removeBackground(imageUrl: string)` function using node-fetch, Prefer: wait header, 60s timeout, retry logic for transient errors
  - **Success Criteria:**
    - [ ] Service created with JSDoc header
    - [ ] removeBackground function with full error handling
    - [ ] Retry logic for network errors (max 2 retries)
    - [ ] Comprehensive logging
  - **Tests:**
    1. Call with valid image URL
    2. Verify returns processed image URL
    3. Test with invalid URL (expect error)
    4. Test timeout handling
  - **Edge Cases:**
    - ⚠️ Replicate API timeout: Return timeout error code
    - ⚠️ Invalid image: Return api_error with message
    - ⚠️ Network failure: Retry up to 2 times
  - **Rollback:** Delete file

### 1.4 Create Handler

#### 1.4.1 Create removeImageBackground Handler
- [ ] **Action:** Create `functions/src/handlers/removeImageBackground.ts`
  - **Why:** Main callable function handler coordinating full flow
  - **Files Modified:**
    - Create: `functions/src/handlers/removeImageBackground.ts`
  - **Implementation:** Handler validates auth → validates URL → calls Replicate → downloads result → uploads to Storage → tracks usage → returns response
  - **Success Criteria:**
    - [ ] Auth validation (reject if not authenticated)
    - [ ] URL validation (check format and accessibility)
    - [ ] Calls replicate service
    - [ ] Uploads result to Storage at `processed-images/{projectId}/{timestamp}-{uuid}.png`
    - [ ] Tracks usage at `/usage/{userId}/backgroundRemoval/{timestamp}`
    - [ ] Returns typed response
  - **Tests:**
    1. Call with valid auth and image URL
    2. Verify processed image uploaded to Storage
    3. Verify usage tracked in RTDB
    4. Test unauthorized request (expect error)
  - **Edge Cases:**
    - ⚠️ Unauthenticated user: Throw HttpsError('unauthenticated')
    - ⚠️ Invalid URL: Return error response
    - ⚠️ Storage upload fails: Return upload_failed error
  - **Rollback:** Delete file

### 1.5 Export Function

#### 1.5.1 Add to functions/src/index.ts
- [ ] **Action:** Export removeImageBackground callable function
  - **Why:** Make function available to frontend
  - **Files Modified:**
    - Update: `functions/src/index.ts`
  - **Implementation:**
```typescript
import { removeImageBackgroundHandler } from './handlers/removeImageBackground.js';
const replicateApiToken = defineSecret('REPLICATE_API_TOKEN');

export const removeImageBackground = onCall<RemoveBackgroundRequest>(
  {
    secrets: [replicateApiToken],
    timeoutSeconds: 120, // 2 minutes (Replicate can take 60s+ processing)
    memory: "512MiB",
  },
  removeImageBackgroundHandler
);
```
  - **Success Criteria:**
    - [ ] Function exported with correct type
    - [ ] Secret dependency declared
    - [ ] Timeout set to 120s
  - **Tests:**
    1. Deploy functions: `firebase deploy --only functions:removeImageBackground`
    2. Verify function appears in Firebase console
  - **Rollback:** Remove export

---

## Phase 2: Frontend - Service & Store (2-3 hours)

### 2.1 Create Frontend Service

#### 2.1.1 Create backgroundRemovalService.ts
- [ ] **Action:** Create `src/lib/firebase/backgroundRemovalService.ts`
  - **Why:** Frontend service to call Firebase Function
  - **Files Modified:**
    - Create: `src/lib/firebase/backgroundRemovalService.ts`
  - **Implementation:**
```typescript
import { functions } from './config';
import { httpsCallable } from 'firebase/functions';

export async function removeImageBackground(
  imageUrl: string,
  projectId: string,
  imageId: string
): Promise<RemoveBackgroundResponse> {
  const callable = httpsCallable(functions, 'removeImageBackground');
  const result = await callable({
    imageUrl,
    projectId,
    originalImageId: imageId,
  });
  return result.data as RemoveBackgroundResponse;
}
```
  - **Success Criteria:**
    - [ ] Service created with JSDoc
    - [ ] Function properly typed
    - [ ] Error handling included
  - **Tests:**
    1. Import in test component
    2. Call with test image URL
    3. Verify response typed correctly
  - **Rollback:** Delete file

### 2.2 Add Canvas Store Action

#### 2.2.1 Add createProcessedImage Action
- [ ] **Action:** Add action to `src/stores/canvas/canvasActions.ts`
  - **Why:** Reusable action to create processed image object
  - **Files Modified:**
    - Update: `src/stores/canvas/canvasActions.ts`
  - **Implementation:**
```typescript
createProcessedImage: (
  originalImage: ImageObject,
  processedData: { url: string; storagePath: string; naturalWidth: number; naturalHeight: number; fileSize: number }
) => {
  const newImage: ImageObject = {
    ...originalImage,
    id: crypto.randomUUID(),
    name: `${originalImage.name || 'Image'} (no bg)`,
    src: processedData.url,
    storagePath: processedData.storagePath,
    storageType: 'storage',
    naturalWidth: processedData.naturalWidth,
    naturalHeight: processedData.naturalHeight,
    fileSize: processedData.fileSize,
    x: originalImage.x + 20,
    y: originalImage.y + 20,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  get().addObject(newImage);
  get().selectObject(newImage.id);
}
```
  - **Success Criteria:**
    - [ ] Action added to store
    - [ ] Creates new image with offset position
    - [ ] Selects new image after creation
    - [ ] Preserves all visual properties from original
  - **Tests:**
    1. Call action with test image
    2. Verify new image created
    3. Verify position offset by (20, 20)
    4. Verify new image selected
  - **Edge Cases:**
    - ⚠️ Original image has no name: Default to 'Image (no bg)'
  - **Rollback:** Remove action

---

## Phase 3: Frontend - UI Integration (1-2 hours)

### 3.1 Add Processing State

#### 3.1.1 Add Processing Tracking to UI Store
- [ ] **Action:** Add processing state to `src/stores/uiStore.ts`
  - **Why:** Track which images are being processed globally
  - **Files Modified:**
    - Update: `src/stores/uiStore.ts`
  - **Implementation:**
```typescript
interface UIState {
  // ... existing state
  processingImages: Set<string>;
}

// Actions
addProcessingImage: (id: string) => {
  set((state) => ({ processingImages: new Set(state.processingImages).add(id) }));
},
removeProcessingImage: (id: string) => {
  const newSet = new Set(get().processingImages);
  newSet.delete(id);
  set({ processingImages: newSet });
},
```
  - **Success Criteria:**
    - [ ] State added with Set type
    - [ ] Add/remove actions work correctly
  - **Tests:**
    1. Call addProcessingImage('test-id')
    2. Verify 'test-id' in set
    3. Call removeProcessingImage('test-id')
    4. Verify set empty
  - **Rollback:** Remove state and actions

### 3.2 Update Properties Panel

#### 3.2.1 Add Remove Background Button to ImageSection
- [ ] **Action:** Update `src/features/properties-panel/components/ImageSection.tsx`
  - **Why:** Provide UI trigger for background removal
  - **Files Modified:**
    - Update: `src/features/properties-panel/components/ImageSection.tsx`
  - **Implementation:** Add button below filters section, add loading state, call service on click, show success/error toasts, create new image on success
  - **Success Criteria:**
    - [ ] Button renders in properties panel
    - [ ] Button disabled when processing
    - [ ] Shows small loading badge during processing
    - [ ] Calls removeImageBackground service on click
    - [ ] Creates new image on success
    - [ ] Shows error toast on failure
  - **Tests:**
    1. Select image on canvas
    2. Click "Remove Background" in properties panel
    3. Verify button shows loading state
    4. Wait for processing (5-15s)
    5. Verify new image created next to original
    6. Verify new image selected
  - **Edge Cases:**
    - ⚠️ User deselects image while processing: Continue processing but don't select result
    - ⚠️ User deletes original while processing: Continue processing, create result anyway
    - ⚠️ Network error: Show user-friendly error toast
  - **Rollback:** Remove button and handlers

---

## Phase 4: Testing & Polish (1 hour)

### 4.1 End-to-End Testing

#### 4.1.1 Test Full Flow
- [ ] **Action:** Test complete user journey
  - **Tests:**
    1. Upload test image with solid background
    2. Select image
    3. Click "Remove Background"
    4. Verify processing indicator shows
    5. Wait for completion
    6. Verify new image created with transparent background
    7. Verify original image unchanged
    8. Verify usage tracked in Firebase
  - **Edge Cases to Test:**
    - ⚠️ Small data URL image (< 100KB)
    - ⚠️ Large Storage image (> 1MB)
    - ⚠️ Invalid image format
    - ⚠️ User logs out during processing
    - ⚠️ Network timeout

### 4.2 Error Handling Verification

#### 4.2.1 Test Error Scenarios
- [ ] **Action:** Verify all error paths work correctly
  - **Tests:**
    1. Test with invalid URL: Expect error toast
    2. Test with unauthenticated request: Expect auth error
    3. Test timeout (mock slow API): Expect timeout error
    4. Test Replicate API error: Expect friendly error message
  - **Success Criteria:**
    - [ ] All errors show user-friendly messages
    - [ ] No crashes or uncaught exceptions
    - [ ] Processing state cleaned up on error

---

## Deployment Strategy

1. **Deploy Backend First:**
   - Set REPLICATE_API_TOKEN secret
   - Deploy functions: `firebase deploy --only functions:removeImageBackground`
   - Test via Firebase console or Postman

2. **Test in Emulator:**
   - Run emulator suite
   - Test with local images
   - Verify Storage uploads work

3. **Deploy Frontend:**
   - Build: `npm run build`
   - Deploy: `firebase deploy --only hosting`

4. **Monitor:**
   - Watch Firebase Functions logs for first 24h
   - Check usage tracking data
   - Monitor error rates

## Success Metrics

- [ ] Background removal completes in < 20s for typical images
- [ ] Error rate < 5% (excluding user cancellations)
- [ ] No crashes or uncaught exceptions
- [ ] User can create multiple processed images from same original
- [ ] Storage costs reasonable (processed images compressed)
