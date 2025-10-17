# Export History Feature - Implementation Plan

**Project:** Canvas Icons
**Estimated Time:** 8-10 hours
**Dependencies:**
- Existing Firebase Storage setup
- Existing Firestore/RTDB configuration
- Existing ExportModal component
- Existing export utilities
**Last Updated:** 2025-10-17

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 28/28 tasks completed (100%)

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
- [2025-10-17] - Use Firestore for export metadata (structured queries, better for user-based data)
- [2025-10-17] - Use Firebase Storage for exported images (optimized for large binary files)
- [2025-10-17] - Add tabs to ExportModal instead of separate page (maintains context, better UX)
- [2025-10-17] - Store base64 data URL alongside Storage URL (faster initial load, fallback if Storage URL expires)

**Lessons Learned:**
- [To be filled during implementation]

---

# Phase 0: Research & Planning

## 0.1 Research Context
- [x] Document existing patterns in codebase
  - **What to find:** Export modal structure, Firebase usage patterns, storage patterns
  - **Where to look:** `src/features/export/`, `src/lib/firebase/`
  - **Success:** Create summary of findings
  - **Files to Review:**
    - ✅ `src/features/export/components/ExportModal.tsx`
    - ✅ `src/lib/firebase/storage.ts`
    - ✅ `src/lib/firebase/index.ts`
    - ✅ `src/lib/utils/export.ts`

## 0.2 Design Decisions
- [x] Define technical approach
  - **Success:** Document architecture decisions
  - **Output:** Architecture diagram/notes in this section

### Summary of Findings

**Existing Export System:**
- ExportModal at `src/features/export/components/ExportModal.tsx`
- Single-purpose modal with resolution/format controls
- Uses Konva `stage.toDataURL()` for PNG generation
- Direct browser download (no server/storage involved currently)
- Export filename format: `canvasicons-YYYY-MM-DD-HH-MM-SS.png`

**Firebase Infrastructure:**
- Storage service exists at `src/lib/firebase/storage.ts`
- Already has utilities for uploading images with progress tracking
- Path structure: `/images/{roomId}/{userId}/{timestamp}_{fileName}`
- Firestore available for metadata storage
- Storage exports available in barrel file

**Architecture Decisions:**

1. **Storage Structure:**
   ```
   Firebase Storage:
   /exports/{userId}/{exportId}.png

   Firestore:
   /users/{userId}/exports/{exportId}
   {
     id: string (exportId)
     userId: string
     filename: string (original filename)
     createdAt: timestamp
     storagePath: string (path in Storage)
     storageUrl: string (download URL)
     dataUrl: string (base64, for quick preview)
     metadata: {
       format: 'png'
       scale: 1 | 2 | 3
       scope: 'selection' | 'all'
       objectCount: number
       width: number (exported image dimensions)
       height: number
     }
   }
   ```

2. **UI Structure:**
   - Add tabs to ExportModal: "Export" (current) and "History"
   - History tab shows list of past exports with thumbnails
   - Each item has download and delete buttons
   - "Delete All" button at top of history tab
   - Empty state when no history

3. **Export Flow:**
   ```
   User clicks "Export PNG" button
   ↓
   1. Generate PNG data URL (existing behavior)
   2. Upload PNG to Firebase Storage (/exports/{userId}/{exportId}.png)
   3. Save metadata to Firestore (/users/{userId}/exports/{exportId})
   4. Download file to user's computer (existing behavior)
   5. Switch to History tab to show success
   ```

4. **History Features:**
   - Load user's export history on tab open
   - Show thumbnail previews (using dataUrl)
   - Download from history (use Storage URL)
   - Delete single export (Storage + Firestore)
   - Delete all exports (batch delete Storage + Firestore)
   - Auto-cleanup: delete exports older than 30 days (optional, Phase 6)

---

# Phase 1: Firebase Infrastructure (Estimated: 2 hours)

**Goal:** Set up Firebase Storage and Firestore structure for export history

**Phase Success Criteria:**
- [x] Storage service can upload export PNGs
- [x] Firestore service can CRUD export metadata
- [x] TypeScript types defined for export records

---

## 1.1 Export Storage Service

### 1.1.1 Create Export Storage Functions
- [x] **Action:** Create storage functions for exports in `src/lib/firebase/storage.ts`
  - **Why:** Need specialized functions for uploading/deleting export images
  - **Files Modified:**
    - Update: `src/lib/firebase/storage.ts`
  - **Implementation Details:**
```typescript
/**
 * Create storage reference for an export
 * Path: /exports/{userId}/{exportId}.png
 */
export function createExportRef(userId: string, exportId: string): StorageReference {
  const path = `exports/${userId}/${exportId}.png`
  return ref(storage, path)
}

/**
 * Upload export PNG to Firebase Storage
 *
 * @param dataUrl - Base64 data URL from canvas export
 * @param userId - User ID
 * @param exportId - Unique export ID
 * @returns Promise with download URL and storage path
 */
export async function uploadExportToStorage(
  dataUrl: string,
  userId: string,
  exportId: string
): Promise<UploadResult> {
  const storageRef = createExportRef(userId, exportId)

  // Convert data URL to Blob
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  // Upload to Storage
  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType: 'image/png',
  })

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null, // No progress tracking needed
      (error) => reject(new Error(`Export upload failed: ${error.message}`)),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({
          url: downloadURL,
          storagePath: storageRef.fullPath,
        })
      }
    )
  })
}

/**
 * Delete export from Firebase Storage
 */
export async function deleteExportFromStorage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath)
  await deleteObject(storageRef)
}
```
  - **Success Criteria:**
    - [x] `createExportRef` returns correct path format
    - [x] `uploadExportToStorage` successfully uploads PNG blobs
    - [x] `deleteExportFromStorage` successfully removes files
    - [x] Functions have JSDoc comments
    - [x] Functions exported from storage.ts
  - **Tests:**
    1. Test `createExportRef('user123', 'export456')` returns `/exports/user123/export456.png`
    2. Mock data URL, call `uploadExportToStorage`, verify Storage contains file
    3. Call `deleteExportFromStorage` with path, verify file deleted
    4. Test error handling (invalid data URL, network failure)
  - **Edge Cases:**
    - ⚠️ Large data URLs (10MB+): May timeout, add timeout handling
    - ⚠️ Invalid data URLs: Validate data URL format before fetch
    - ⚠️ Storage quota exceeded: Catch quota errors, show user-friendly message
  - **Rollback:** Remove added functions, export statements
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 1.1.2 Update Firebase Storage Exports
- [x] **Action:** Export new storage functions in `src/lib/firebase/index.ts`
  - **Why:** Make storage functions available throughout app
  - **Files Modified:**
    - Update: `src/lib/firebase/index.ts`
  - **Implementation Details:**
```typescript
// In storage export section, add:
export {
  createImageRef,
  uploadImageToStorage,
  deleteImageFromStorage,
  getImageDownloadURL,
  createExportRef,         // NEW
  uploadExportToStorage,   // NEW
  deleteExportFromStorage, // NEW
  type UploadProgressCallback,
  type UploadResult,
} from './storage'
```
  - **Success Criteria:**
    - [x] New functions exported in barrel file
    - [x] No TypeScript errors
    - [x] Can import functions from `@/lib/firebase`
  - **Tests:**
    1. Import statement: `import { uploadExportToStorage } from '@/lib/firebase'`
    2. Verify no TypeScript errors
    3. Verify autocomplete suggests new functions
  - **Edge Cases:**
    - ⚠️ None (simple export)
  - **Rollback:** Remove added export lines
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

## 1.2 Export Metadata Service

### 1.2.1 Create Export Metadata Types
- [x] **Action:** Create types for export records in `src/features/export/types.ts`
  - **Why:** Type-safe export metadata structure
  - **Files Modified:**
    - Update: `src/features/export/types.ts`
  - **Implementation Details:**
```typescript
import type { Timestamp } from 'firebase/firestore'

/**
 * Export record metadata
 * Stored in Firestore at /users/{userId}/exports/{exportId}
 */
export interface ExportRecord {
  /** Unique export ID (same as document ID) */
  id: string
  /** User ID who created the export */
  userId: string
  /** Original filename (e.g., 'canvasicons-2025-10-17-14-30-45.png') */
  filename: string
  /** Timestamp when export was created */
  createdAt: Timestamp
  /** Storage path in Firebase Storage (e.g., 'exports/user123/export456.png') */
  storagePath: string
  /** Download URL from Firebase Storage */
  storageUrl: string
  /** Base64 data URL for quick preview (optional, can be large) */
  dataUrl?: string
  /** Export metadata */
  metadata: {
    /** Export format (currently always 'png') */
    format: ExportFormat
    /** Resolution multiplier (1x, 2x, 3x) */
    scale: ExportScale
    /** What was exported (selection or all objects) */
    scope: ExportScope
    /** Number of objects exported */
    objectCount: number
    /** Exported image width in pixels */
    width: number
    /** Exported image height in pixels */
    height: number
  }
}

/**
 * Export record creation input
 * Omits server-generated fields (id, createdAt)
 */
export type CreateExportInput = Omit<ExportRecord, 'id' | 'createdAt'>
```
  - **Success Criteria:**
    - [x] Types compile without errors
    - [x] JSDoc comments added
    - [x] All fields properly typed
    - [x] Timestamp uses Firebase Firestore type
  - **Tests:**
    1. Create mock `ExportRecord` object, verify all fields type-check
    2. Create mock `CreateExportInput`, verify omitted fields cause errors
    3. Verify `Timestamp` imports from 'firebase/firestore'
  - **Edge Cases:**
    - ⚠️ None (just types)
  - **Rollback:** Remove added types
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 1.2.2 Create Export Metadata Service
- [x] **Action:** Create `src/lib/firebase/exportsService.ts` with CRUD operations
  - **Why:** Centralized service for managing export metadata in Firestore
  - **Files Modified:**
    - Create: `src/lib/firebase/exportsService.ts`
  - **Implementation Details:**
```typescript
/**
 * Firebase Exports Service
 *
 * Manages export metadata in Firestore.
 * Collection path: /users/{userId}/exports/{exportId}
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from './config'
import type { ExportRecord, CreateExportInput } from '@/features/export/types'

/**
 * Get exports collection reference for a user
 */
function getExportsCollection(userId: string) {
  return collection(firestore, 'users', userId, 'exports')
}

/**
 * Create a new export record
 *
 * @param exportData - Export metadata (without id/createdAt)
 * @returns Promise resolving to export ID
 */
export async function createExportRecord(exportData: CreateExportInput): Promise<string> {
  const exportsCol = getExportsCollection(exportData.userId)
  const newExportRef = doc(exportsCol)
  const exportId = newExportRef.id

  const exportRecord: Omit<ExportRecord, 'createdAt'> & { createdAt: unknown } = {
    ...exportData,
    id: exportId,
    createdAt: serverTimestamp(),
  }

  await setDoc(newExportRef, exportRecord)
  return exportId
}

/**
 * Get a single export record
 *
 * @param userId - User ID
 * @param exportId - Export ID
 * @returns Promise resolving to export record or null if not found
 */
export async function getExportRecord(
  userId: string,
  exportId: string
): Promise<ExportRecord | null> {
  const exportsCol = getExportsCollection(userId)
  const exportRef = doc(exportsCol, exportId)
  const exportDoc = await getDoc(exportRef)

  if (!exportDoc.exists()) {
    return null
  }

  return exportDoc.data() as ExportRecord
}

/**
 * Get all export records for a user
 * Sorted by creation date (newest first)
 *
 * @param userId - User ID
 * @param limitCount - Maximum number of records to return (default: 50)
 * @returns Promise resolving to array of export records
 */
export async function getUserExportRecords(
  userId: string,
  limitCount: number = 50
): Promise<ExportRecord[]> {
  const exportsCol = getExportsCollection(userId)
  const exportsQuery = query(
    exportsCol,
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  )

  const querySnapshot = await getDocs(exportsQuery)
  return querySnapshot.docs.map(doc => doc.data() as ExportRecord)
}

/**
 * Delete a single export record
 *
 * @param userId - User ID
 * @param exportId - Export ID
 * @returns Promise resolving when deletion completes
 */
export async function deleteExportRecord(userId: string, exportId: string): Promise<void> {
  const exportsCol = getExportsCollection(userId)
  const exportRef = doc(exportsCol, exportId)
  await deleteDoc(exportRef)
}

/**
 * Delete all export records for a user
 *
 * @param userId - User ID
 * @returns Promise resolving to number of deleted records
 */
export async function deleteAllExportRecords(userId: string): Promise<number> {
  const exports = await getUserExportRecords(userId, 1000) // Get all (reasonable limit)

  // Delete all records in parallel
  await Promise.all(
    exports.map(exp => deleteExportRecord(userId, exp.id))
  )

  return exports.length
}
```
  - **Success Criteria:**
    - [x] All CRUD functions implemented
    - [x] JSDoc comments on all functions
    - [x] Uses serverTimestamp() for createdAt
    - [x] Queries sorted by createdAt desc
    - [x] Error handling for missing documents
  - **Tests:**
    1. Call `createExportRecord` with mock data, verify Firestore document created
    2. Call `getExportRecord`, verify returns correct data
    3. Call `getUserExportRecords`, verify returns sorted array
    4. Call `deleteExportRecord`, verify document deleted
    5. Call `deleteAllExportRecords`, verify all documents deleted
  - **Edge Cases:**
    - ⚠️ User has no exports: `getUserExportRecords` returns empty array
    - ⚠️ Export doesn't exist: `getExportRecord` returns null
    - ⚠️ Firestore quota exceeded: Catch and throw user-friendly error
    - ⚠️ Large batch deletes (1000+): May timeout, consider batching
  - **Rollback:** Delete file
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 1.2.3 Export Exports Service Functions
- [x] **Action:** Export service functions in `src/lib/firebase/index.ts`
  - **Why:** Make service available throughout app
  - **Files Modified:**
    - Update: `src/lib/firebase/index.ts`
  - **Implementation Details:**
```typescript
// Add after Users Service export:
// Export Exports Service
export {
  createExportRecord,
  getExportRecord,
  getUserExportRecords,
  deleteExportRecord,
  deleteAllExportRecords,
} from './exportsService'
```
  - **Success Criteria:**
    - [x] Functions exported in barrel file
    - [x] No TypeScript errors
    - [x] Can import from `@/lib/firebase`
  - **Tests:**
    1. Import: `import { createExportRecord } from '@/lib/firebase'`
    2. Verify no TypeScript errors
  - **Edge Cases:**
    - ⚠️ None (simple export)
  - **Rollback:** Remove export block
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

# Phase 2: Export Modal UI - Tab System (Estimated: 2 hours)

**Goal:** Add tab navigation to ExportModal (Export tab and History tab)

**Phase Success Criteria:**
- [ ] Modal has tabs: "Export" and "History"
- [ ] Tab switching works correctly
- [ ] Current export UI moved to "Export" tab
- [ ] Empty History tab renders placeholder

---

## 2.1 Tab Navigation

### 2.1.1 Add Tabs Component to ExportModal
- [ ] **Action:** Add tab navigation UI to ExportModal header
  - **Why:** Users need to switch between Export and History views
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
  - **Implementation Details:**
```typescript
// Add after imports
type TabType = 'export' | 'history'

// Add to component state (after isExporting state)
const [activeTab, setActiveTab] = useState<TabType>('export')

// Add tab navigation in DialogHeader (replace existing header content)
<DialogHeader className="px-6 pt-5 pb-0 border-b border-gray-200">
  <DialogTitle className="text-sm font-medium mb-3">Export Selection</DialogTitle>

  {/* Tab Navigation */}
  <div className="flex gap-1 -mb-px">
    <button
      onClick={() => setActiveTab('export')}
      className={`
        px-4 py-2 text-xs font-medium transition-colors
        border-b-2 hover:text-gray-900
        ${activeTab === 'export'
          ? 'border-[#0ea5e9] text-[#0ea5e9]'
          : 'border-transparent text-gray-500'
        }
      `}
    >
      Export
    </button>
    <button
      onClick={() => setActiveTab('history')}
      className={`
        px-4 py-2 text-xs font-medium transition-colors
        border-b-2 hover:text-gray-900
        ${activeTab === 'history'
          ? 'border-[#0ea5e9] text-[#0ea5e9]'
          : 'border-transparent text-gray-500'
        }
      `}
    >
      History
    </button>
  </div>
</DialogHeader>
```
  - **Success Criteria:**
    - [ ] Tabs render in modal header
    - [ ] Active tab has blue underline
    - [ ] Clicking tabs updates activeTab state
    - [ ] Tab styling matches Figma design (subtle, minimal)
  - **Tests:**
    1. Open modal, verify "Export" tab is active by default
    2. Click "History" tab, verify blue underline moves
    3. Verify hover states work on inactive tabs
    4. Test keyboard navigation (Tab key)
  - **Edge Cases:**
    - ⚠️ None (simple UI state)
  - **Rollback:** Revert to original DialogHeader
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 2.1.2 Add Tab Content Rendering
- [ ] **Action:** Conditionally render tab content based on activeTab
  - **Why:** Show different content for Export vs History tabs
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
  - **Implementation Details:**
```typescript
// Wrap existing preview/settings/footer sections
return (
  <Dialog open={isOpen} onOpenChange={handleOpenChange}>
    <DialogContent className="sm:max-w-2xl p-0 gap-0">
      {/* Header with tabs */}
      <DialogHeader>
        {/* ... tab navigation from previous task ... */}
      </DialogHeader>

      {/* Tab Content */}
      {activeTab === 'export' ? (
        <>
          {/* Existing export UI: preview, settings, footer */}
          <div className="p-6">
            {/* ... existing preview section ... */}
          </div>
          <div className="px-6 pb-6 space-y-4">
            {/* ... existing settings section ... */}
          </div>
          <DialogFooter className="px-6 pb-5 pt-4 border-t border-gray-200">
            {/* ... existing footer ... */}
          </DialogFooter>
        </>
      ) : (
        <>
          {/* History tab content (placeholder for now) */}
          <div className="p-6 min-h-[400px]">
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">History tab - Coming soon</p>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
)
```
  - **Success Criteria:**
    - [ ] Export tab shows existing export UI
    - [ ] History tab shows placeholder text
    - [ ] Switching tabs updates content correctly
    - [ ] No layout shift when switching tabs
  - **Tests:**
    1. Open modal, verify Export tab shows preview/settings
    2. Click History tab, verify placeholder text appears
    3. Click Export tab again, verify export UI returns
    4. Test rapid tab switching (no flickering)
  - **Edge Cases:**
    - ⚠️ None (simple conditional rendering)
  - **Rollback:** Remove conditional, restore flat structure
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 2.1.3 Reset Tab on Modal Open
- [ ] **Action:** Reset to Export tab when modal opens
  - **Why:** Users expect Export tab to be default each time
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
  - **Implementation Details:**
```typescript
// Update handleOpenChange function
function handleOpenChange(open: boolean) {
  if (!open) {
    onClose()
  } else {
    // Reset to Export tab when opening
    setActiveTab('export')

    // Reset to defaults when opening
    setOptions({
      format: 'png',
      scale: 2,
      scope: 'selection',
    })
  }
}
```
  - **Success Criteria:**
    - [ ] Modal always opens to Export tab
    - [ ] Previous tab selection doesn't persist
  - **Tests:**
    1. Open modal, switch to History tab, close modal
    2. Open modal again, verify Export tab is active
  - **Edge Cases:**
    - ⚠️ None (simple state reset)
  - **Rollback:** Remove setActiveTab call
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

# Phase 3: Export Integration - Save to Firebase (Estimated: 2 hours)

**Goal:** Update export flow to save exports to Firebase Storage and Firestore

**Phase Success Criteria:**
- [ ] Exports saved to Firebase Storage
- [ ] Export metadata saved to Firestore
- [ ] Local download still works (existing behavior)
- [ ] Success notification shown after export

---

## 3.1 Update Export Function

### 3.1.1 Update exportCanvasToPNG to Return Data
- [ ] **Action:** Modify `exportCanvasToPNG` to return data URL and metadata
  - **Why:** Need data URL for Storage upload and metadata for Firestore
  - **Files Modified:**
    - Update: `src/lib/utils/export.ts`
  - **Implementation Details:**
```typescript
// Add return type
export interface ExportResult {
  dataUrl: string
  filename: string
  metadata: {
    format: 'png'
    scale: number
    scope: 'selection' | 'all'
    objectCount: number
    width: number
    height: number
  }
}

// Update function signature
export async function exportCanvasToPNG(
  stageRef: React.RefObject<Konva.Stage | null>,
  selectedObjects: CanvasObject[],
  allObjects: CanvasObject[],
  options: ExportOptions = { format: 'png', scale: 2, scope: 'selection' }
): Promise<ExportResult> {
  // ... existing export logic ...

  // Before browser download, collect result data
  const result: ExportResult = {
    dataUrl,
    filename,
    metadata: {
      format: 'png',
      scale: options.scale,
      scope: options.scope,
      objectCount: visibleObjects.length,
      width: Math.round(bbox.width * options.scale),
      height: Math.round(bbox.height * options.scale),
    }
  }

  // Trigger browser download (existing behavior)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Return result for Firebase upload
  return result
}
```
  - **Success Criteria:**
    - [ ] Function returns ExportResult object
    - [ ] Browser download still works
    - [ ] TypeScript types updated
    - [ ] Metadata includes all required fields
  - **Tests:**
    1. Call `exportCanvasToPNG`, verify returns ExportResult
    2. Verify dataUrl is valid base64 PNG
    3. Verify filename matches expected format
    4. Verify metadata.objectCount matches exported objects
    5. Verify metadata.width/height match bbox dimensions
    6. Verify browser download still triggers
  - **Edge Cases:**
    - ⚠️ Large data URLs (10MB+): May cause memory issues, monitor
  - **Rollback:** Revert to void return type, remove result object
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 3.1.2 Create saveExportToFirebase Function
- [ ] **Action:** Create utility function to save export to Firebase
  - **Why:** Encapsulate Firebase upload logic for reuse
  - **Files Modified:**
    - Create: `src/features/export/utils/saveExport.ts`
  - **Implementation Details:**
```typescript
/**
 * Save Export to Firebase Utilities
 *
 * Handles uploading exports to Firebase Storage and Firestore.
 */

import {
  uploadExportToStorage,
  createExportRecord,
  type CreateExportInput,
} from '@/lib/firebase'
import type { ExportResult } from '@/lib/utils/export'

/**
 * Save export to Firebase Storage and Firestore
 *
 * 1. Uploads PNG to Storage (/exports/{userId}/{exportId}.png)
 * 2. Saves metadata to Firestore (/users/{userId}/exports/{exportId})
 *
 * @param userId - Current user ID
 * @param exportResult - Export result from exportCanvasToPNG
 * @returns Promise resolving to export ID
 *
 * @throws Error if upload or save fails
 *
 * @example
 * ```ts
 * const exportId = await saveExportToFirebase('user123', exportResult)
 * console.log('Export saved:', exportId)
 * ```
 */
export async function saveExportToFirebase(
  userId: string,
  exportResult: ExportResult
): Promise<string> {
  const isDev = import.meta.env.DEV

  if (isDev) console.log('Saving export to Firebase...', exportResult.filename)

  // Generate unique export ID
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Upload PNG to Storage
  if (isDev) console.log('Uploading to Storage...')
  const { url: storageUrl, storagePath } = await uploadExportToStorage(
    exportResult.dataUrl,
    userId,
    exportId
  )
  if (isDev) console.log('Storage upload complete:', storageUrl)

  // Save metadata to Firestore
  if (isDev) console.log('Saving metadata to Firestore...')
  const exportData: CreateExportInput = {
    userId,
    filename: exportResult.filename,
    storagePath,
    storageUrl,
    dataUrl: exportResult.dataUrl, // Store for quick preview
    metadata: exportResult.metadata,
  }

  const savedExportId = await createExportRecord(exportData)
  if (isDev) console.log('Firestore save complete:', savedExportId)

  return savedExportId
}
```
  - **Success Criteria:**
    - [ ] Function uploads to Storage successfully
    - [ ] Function saves to Firestore successfully
    - [ ] Returns export ID
    - [ ] JSDoc comments complete
    - [ ] Error handling for both uploads
  - **Tests:**
    1. Call with mock exportResult, verify Storage contains file
    2. Verify Firestore document created with correct data
    3. Verify returns exportId
    4. Test error handling (Storage fails, Firestore fails)
    5. Test with large data URLs (10MB+)
  - **Edge Cases:**
    - ⚠️ Storage upload fails: Should throw error, don't create Firestore record
    - ⚠️ Firestore save fails: Should cleanup Storage file (rollback)
    - ⚠️ User offline: Show user-friendly error message
  - **Rollback:** Delete file
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 3.1.3 Update ExportModal to Save Exports
- [x] **Action:** Update ExportModal handleExport to save to Firebase
  - **Why:** Integrate Firebase save into export flow
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
  - **Implementation Details:**
```typescript
// Add import
import { saveExportToFirebase } from '../utils/saveExport'
import { useAuthStore } from '@/stores/authStore'

// In component, get current user
const currentUser = useAuthStore((state) => state.currentUser)

// Update handleExport function
const handleExport = useCallback(async () => {
  if (!currentUser) {
    console.error('Cannot export: user not authenticated')
    return
  }

  setIsExporting(true)
  try {
    // Call onExport with current options
    // onExport now returns ExportResult instead of void
    const exportResult = await onExport(options)

    // Save to Firebase
    await saveExportToFirebase(currentUser.uid, exportResult)

    // Switch to History tab to show success
    setActiveTab('history')

    // Close modal after short delay (user sees History tab first)
    setTimeout(() => {
      onClose()
    }, 1500)
  } catch (error) {
    // Error handling done by parent (CanvasPage shows alert)
    console.error('Export failed:', error)
  } finally {
    setIsExporting(false)
  }
}, [options, onExport, onClose, currentUser])
```
  - **Success Criteria:**
    - [ ] Export saves to Firebase after download
    - [ ] Modal switches to History tab after save
    - [ ] Error handling works correctly
    - [ ] Loading state shown during upload
  - **Tests:**
    1. Export object, verify Storage + Firestore updated
    2. Verify modal switches to History tab
    3. Verify modal closes after 1.5s
    4. Test with no user (should fail gracefully)
    5. Test with network error (should show error)
  - **Edge Cases:**
    - ⚠️ User logs out during export: Check currentUser before save
    - ⚠️ Firebase quota exceeded: Catch and show user-friendly message
    - ⚠️ Slow network: Show progress indicator
  - **Rollback:** Remove saveExportToFirebase call, revert to original behavior
  - **Last Verified:** 2025-10-17 (Task completed successfully)

### 3.1.4 Update Parent Component (CanvasPage)
- [x] **Action:** Update CanvasPage's handleExportWithOptions to return ExportResult
  - **Why:** ExportModal now expects onExport to return ExportResult
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx` (or wherever ExportModal is used)
  - **Implementation Details:**
```typescript
// Find handleExportWithOptions function, update to return result
async function handleExportWithOptions(options: ExportOptions): Promise<ExportResult> {
  try {
    // exportCanvasToPNG now returns ExportResult
    const result = await exportCanvasToPNG(
      stageRef,
      selectedObjects,
      objects,
      options
    )

    // Return result for Firebase upload in ExportModal
    return result
  } catch (error) {
    console.error('Export failed:', error)
    // Show error alert to user
    alert('Export failed. Please try again.')
    throw error // Re-throw for ExportModal error handling
  }
}
```
  - **Success Criteria:**
    - [ ] Function returns ExportResult
    - [ ] TypeScript types match
    - [ ] Error handling preserved
  - **Tests:**
    1. Trigger export, verify returns ExportResult
    2. Test error case, verify alert shown
  - **Edge Cases:**
    - ⚠️ None (simple return type change)
  - **Rollback:** Revert to void return type
  - **Last Verified:** 2025-10-17 (Task completed successfully)

---

# Phase 4: History Tab UI (Estimated: 2.5 hours)

**Goal:** Build History tab UI with list of past exports, thumbnails, and action buttons

**Phase Success Criteria:**
- [ ] History tab loads and displays exports
- [ ] Each export shows thumbnail, date, metadata
- [ ] Download and delete buttons functional
- [ ] Delete all button functional
- [ ] Empty state when no exports

---

## 4.1 History List Component

### 4.1.1 Create ExportHistoryTab Component
- [x] **Action:** Create new component for History tab content
  - **Why:** Separate component for cleaner code organization
  - **Files Modified:**
    - Create: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
/**
 * Export History Tab Component
 *
 * Displays user's export history with thumbnails and action buttons.
 * Loads exports from Firestore on mount.
 */

import { useState, useEffect } from 'react'
import { Download, Trash2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getUserExportRecords, type ExportRecord } from '@/lib/firebase'
import type { Timestamp } from 'firebase/firestore'

export interface ExportHistoryTabProps {
  /** Callback when delete all is clicked */
  onDeleteAll: () => void
}

/**
 * Format Firestore timestamp to readable date
 */
function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

export function ExportHistoryTab({ onDeleteAll }: ExportHistoryTabProps) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const [exports, setExports] = useState<ExportRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load exports on mount
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    async function loadExports() {
      try {
        setIsLoading(true)
        setError(null)
        const records = await getUserExportRecords(currentUser.uid)
        setExports(records)
      } catch (err) {
        console.error('Failed to load exports:', err)
        setError('Failed to load export history')
      } finally {
        setIsLoading(false)
      }
    }

    loadExports()
  }, [currentUser])

  // Empty state
  if (!isLoading && exports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No exports yet</h3>
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Your export history will appear here after you export objects
        </p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  // History list
  return (
    <div className="p-6 max-h-[500px] overflow-y-auto">
      {/* Delete All button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onDeleteAll}
          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
        >
          Delete All
        </button>
      </div>

      {/* Export list */}
      <div className="space-y-3">
        {exports.map(exp => (
          <div
            key={exp.id}
            className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden">
              <img
                src={exp.dataUrl || exp.storageUrl}
                alt={exp.filename}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metadata */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {exp.filename}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {formatDate(exp.createdAt)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {exp.metadata.objectCount} objects · {exp.metadata.scale}x · {exp.metadata.width}×{exp.metadata.height}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* TODO: Download handler */}}
                className="p-2 text-gray-600 hover:text-[#0ea5e9] hover:bg-gray-50 rounded transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {/* TODO: Delete handler */}}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```
  - **Success Criteria:**
    - [ ] Component renders without errors
    - [ ] Loads exports from Firestore
    - [ ] Shows loading state while fetching
    - [ ] Shows empty state when no exports
    - [ ] Shows error state on failure
    - [ ] Displays thumbnails correctly
    - [ ] Formats dates readably
    - [ ] Shows metadata (object count, scale, dimensions)
  - **Tests:**
    1. Render with no exports, verify empty state
    2. Mock Firestore with exports, verify list displays
    3. Verify thumbnails load from dataUrl
    4. Verify dates format correctly
    5. Verify metadata displays correctly
    6. Test loading state (delay response)
    7. Test error state (mock Firestore error)
  - **Edge Cases:**
    - ⚠️ User not authenticated: Don't load exports
    - ⚠️ Firestore permission denied: Show error state
    - ⚠️ Missing dataUrl: Fall back to storageUrl
    - ⚠️ Very long filenames: Truncate with ellipsis
    - ⚠️ Large list (100+ exports): Virtualize or paginate
  - **Rollback:** Delete file
  - **Last Verified:** 2025-10-17 (Task completed successfully - component created with all features)

### 4.1.2 Integrate ExportHistoryTab into ExportModal
- [x] **Action:** Replace placeholder with ExportHistoryTab component
  - **Why:** Show actual history instead of "Coming soon" text
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
  - **Implementation Details:**
```typescript
// Add import
import { ExportHistoryTab } from './ExportHistoryTab'

// Replace history placeholder
{activeTab === 'history' && (
  <ExportHistoryTab
    onDeleteAll={handleDeleteAll}
  />
)}

// Add handleDeleteAll function
async function handleDeleteAll() {
  // TODO: Implement in next task
  console.log('Delete all clicked')
}
```
  - **Success Criteria:**
    - [ ] History tab shows ExportHistoryTab component
    - [ ] Component renders correctly in modal
    - [ ] No layout issues
  - **Tests:**
    1. Switch to History tab, verify ExportHistoryTab renders
    2. Verify no console errors
    3. Verify layout looks correct
  - **Edge Cases:**
    - ⚠️ None (simple component swap)
  - **Rollback:** Revert to placeholder
  - **Last Verified:** 2025-10-17 (Task completed successfully - component integrated into modal)

---

## 4.2 Download and Delete Actions

### 4.2.1 Implement Download Handler
- [x] **Action:** Add download functionality to History tab
  - **Why:** Users can re-download past exports
  - **Files Modified:**
    - Update: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
// Add handler function
async function handleDownload(exp: ExportRecord) {
  try {
    // Download from Storage URL (not dataUrl, to get full quality)
    const link = document.createElement('a')
    link.download = exp.filename
    link.href = exp.storageUrl
    link.target = '_blank' // Open in new tab (CORS workaround)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Download failed:', error)
    alert('Failed to download export')
  }
}

// Update button onClick
<button
  onClick={() => handleDownload(exp)}
  className="..."
  title="Download"
>
  <Download className="w-4 h-4" />
</button>
```
  - **Success Criteria:**
    - [ ] Clicking download triggers file download
    - [ ] Uses storageUrl (not dataUrl)
    - [ ] Opens in new tab (CORS workaround)
    - [ ] Error handling for failed downloads
  - **Tests:**
    1. Click download button, verify file downloads
    2. Verify downloads full-quality PNG (not thumbnail)
    3. Test with CORS-blocked URL (verify fallback works)
    4. Test error handling
  - **Edge Cases:**
    - ⚠️ Storage URL expired: Show error, prompt re-export
    - ⚠️ CORS blocked: Open in new tab instead
    - ⚠️ User blocks pop-ups: Show warning message
  - **Rollback:** Remove handler, restore TODO comment
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 4.2.2 Implement Delete Single Handler
- [x] **Action:** Add delete functionality for individual exports
  - **Why:** Users can remove unwanted exports
  - **Files Modified:**
    - Update: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
// Add import
import { deleteExportRecord, deleteExportFromStorage } from '@/lib/firebase'

// Add state for deleting
const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

// Add handler function
async function handleDelete(exp: ExportRecord) {
  if (!currentUser) return

  if (!confirm(`Delete export "${exp.filename}"?`)) {
    return
  }

  try {
    // Add to deleting set (show loading state)
    setDeletingIds(prev => new Set(prev).add(exp.id))

    // Delete from Storage
    await deleteExportFromStorage(exp.storagePath)

    // Delete from Firestore
    await deleteExportRecord(currentUser.uid, exp.id)

    // Remove from local state
    setExports(prev => prev.filter(e => e.id !== exp.id))
  } catch (error) {
    console.error('Delete failed:', error)
    alert('Failed to delete export')
  } finally {
    // Remove from deleting set
    setDeletingIds(prev => {
      const next = new Set(prev)
      next.delete(exp.id)
      return next
    })
  }
}

// Update button onClick and disabled state
const isDeleting = deletingIds.has(exp.id)

<button
  onClick={() => handleDelete(exp)}
  disabled={isDeleting}
  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
  title="Delete"
>
  {isDeleting ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Trash2 className="w-4 h-4" />
  )}
</button>
```
  - **Success Criteria:**
    - [ ] Clicking delete shows confirmation dialog
    - [ ] Delete removes from Storage and Firestore
    - [ ] UI updates immediately after delete
    - [ ] Loading indicator shown during deletion
    - [ ] Error handling for failed deletes
  - **Tests:**
    1. Click delete, confirm, verify export removed
    2. Verify Storage file deleted
    3. Verify Firestore document deleted
    4. Verify UI updates correctly
    5. Test cancel confirmation (should not delete)
    6. Test error handling (Storage delete fails)
  - **Edge Cases:**
    - ⚠️ Storage delete fails: Should still delete Firestore (orphaned data OK)
    - ⚠️ Firestore delete fails: Show error, don't remove from UI
    - ⚠️ User spam-clicks delete: Disable button while deleting
  - **Rollback:** Remove handler, restore TODO comment
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 4.2.3 Implement Delete All Handler
- [x] **Action:** Add delete all functionality
  - **Why:** Users can bulk-delete export history
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
    - Update: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
// In ExportHistoryTab.tsx

// Add import
import { deleteAllExportRecords, deleteExportFromStorage } from '@/lib/firebase'

// Add state for delete all
const [isDeletingAll, setIsDeletingAll] = useState(false)

// Add handler (passed as prop from ExportModal)
async function handleDeleteAll() {
  if (!currentUser) return

  if (!confirm(`Delete all ${exports.length} exports? This cannot be undone.`)) {
    return
  }

  try {
    setIsDeletingAll(true)

    // Delete all from Storage (parallel)
    await Promise.all(
      exports.map(exp => deleteExportFromStorage(exp.storagePath).catch(err => {
        console.warn(`Failed to delete ${exp.storagePath}:`, err)
        // Continue even if some fail
      }))
    )

    // Delete all from Firestore
    await deleteAllExportRecords(currentUser.uid)

    // Clear local state
    setExports([])
  } catch (error) {
    console.error('Delete all failed:', error)
    alert('Failed to delete all exports')
  } finally {
    setIsDeletingAll(false)
  }
}

// Update Delete All button
<button
  onClick={handleDeleteAll}
  disabled={isDeletingAll || exports.length === 0}
  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors disabled:opacity-50"
>
  {isDeletingAll ? (
    <>
      <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
      Deleting...
    </>
  ) : (
    'Delete All'
  )}
</button>

// In ExportModal.tsx, update prop
<ExportHistoryTab />
// (handleDeleteAll is now defined in ExportHistoryTab itself)
```
  - **Success Criteria:**
    - [ ] Clicking Delete All shows confirmation
    - [ ] Confirmation shows count of exports to delete
    - [ ] Deletes all Storage files in parallel
    - [ ] Deletes all Firestore documents
    - [ ] Shows loading state during deletion
    - [ ] Shows empty state after deletion
    - [ ] Button disabled when no exports
  - **Tests:**
    1. Create 5 exports, click Delete All, confirm
    2. Verify all Storage files deleted
    3. Verify all Firestore documents deleted
    4. Verify empty state shown after deletion
    5. Test cancel confirmation (should not delete)
    6. Test partial failure (some Storage deletes fail)
  - **Edge Cases:**
    - ⚠️ Large batch (100+ exports): May timeout, show progress indicator
    - ⚠️ Some Storage deletes fail: Continue with Firestore delete
    - ⚠️ User navigates away during delete: Abort remaining deletes
  - **Rollback:** Remove handler, disable button
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

# Phase 5: Polish & Edge Cases (Estimated: 1.5 hours)

**Goal:** Add loading states, error handling, and polish UI/UX

**Phase Success Criteria:**
- [ ] Loading states for all async operations
- [ ] Error messages for all failure cases
- [ ] Graceful handling of edge cases
- [ ] Keyboard shortcuts work correctly

---

## 5.1 Loading and Error States

### 5.1.1 Add Loading State to Export
- [x] **Action:** Show loading indicator during Firebase upload
  - **Why:** Users need feedback during slow uploads
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
  - **Implementation Details:**
```typescript
// Update isExporting state to show different messages
const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'uploading' | 'complete'>('idle')

// Update handleExport
const handleExport = useCallback(async () => {
  if (!currentUser) {
    console.error('Cannot export: user not authenticated')
    return
  }

  try {
    setExportStatus('generating')
    const exportResult = await onExport(options)

    setExportStatus('uploading')
    await saveExportToFirebase(currentUser.uid, exportResult)

    setExportStatus('complete')
    setActiveTab('history')

    setTimeout(() => {
      onClose()
    }, 1500)
  } catch (error) {
    console.error('Export failed:', error)
    setExportStatus('idle')
    alert('Export failed. Please try again.')
  }
}, [options, onExport, onClose, currentUser])

// Update Export button text based on status
{exportStatus === 'generating' && 'Generating...'}
{exportStatus === 'uploading' && 'Uploading...'}
{exportStatus === 'complete' && 'Complete!'}
{exportStatus === 'idle' && 'Export PNG'}
```
  - **Success Criteria:**
    - [ ] Button shows "Generating..." during PNG creation
    - [ ] Button shows "Uploading..." during Firebase upload
    - [ ] Button shows "Complete!" after success
    - [ ] Button disabled during all phases
  - **Tests:**
    1. Export with slow network, verify status messages appear
    2. Verify button disabled during export
    3. Verify status resets on error
  - **Edge Cases:**
    - ⚠️ Very fast exports: May not see intermediate states (OK)
  - **Rollback:** Revert to simple isExporting boolean
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 5.1.2 Add Error Boundaries
- [x] **Action:** Add error handling for component errors
  - **Why:** Prevent entire modal from crashing on errors
  - **Files Modified:**
    - Update: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
// Wrap component in try-catch for render errors
// Add error state
const [renderError, setRenderError] = useState<Error | null>(null)

// Catch errors in useEffect
useEffect(() => {
  try {
    // ... existing load logic ...
  } catch (err) {
    setRenderError(err as Error)
  }
}, [currentUser])

// Show error UI if render error
if (renderError) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <p className="text-sm text-red-600 mb-2">Something went wrong</p>
      <p className="text-xs text-gray-500">{renderError.message}</p>
      <button
        onClick={() => setRenderError(null)}
        className="mt-4 px-3 py-1.5 text-xs font-medium text-white bg-[#0ea5e9] rounded-md"
      >
        Try Again
      </button>
    </div>
  )
}
```
  - **Success Criteria:**
    - [ ] Component catches and displays errors
    - [ ] Try Again button resets error state
    - [ ] User-friendly error messages
  - **Tests:**
    1. Mock Firestore error, verify error UI shown
    2. Click Try Again, verify error clears
    3. Test various error types (network, permissions, etc.)
  - **Edge Cases:**
    - ⚠️ Persistent errors: Don't retry infinitely
  - **Rollback:** Remove error boundary logic
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

## 5.2 Keyboard and Accessibility

### 5.2.1 Add Keyboard Navigation
- [x] **Action:** Ensure all buttons are keyboard accessible
  - **Why:** Users should be able to use modal with keyboard only
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
    - Update: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
// Verify all buttons have proper focus states
// Add focus-visible ring to all interactive elements

// Example for tab buttons:
className={`
  px-4 py-2 text-xs font-medium transition-colors
  border-b-2 hover:text-gray-900
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2
  ${activeTab === 'export' ? '...' : '...'}
`}

// Add keyboard handler for Tab navigation
useEffect(() => {
  if (!isOpen) return

  function handleKeyDown(e: KeyboardEvent) {
    // Ctrl/Cmd + 1 = Export tab
    if ((e.metaKey || e.ctrlKey) && e.key === '1') {
      e.preventDefault()
      setActiveTab('export')
    }
    // Ctrl/Cmd + 2 = History tab
    if ((e.metaKey || e.ctrlKey) && e.key === '2') {
      e.preventDefault()
      setActiveTab('history')
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isOpen])
```
  - **Success Criteria:**
    - [ ] All buttons have visible focus rings
    - [ ] Tab key navigates through modal correctly
    - [ ] Cmd/Ctrl+1 switches to Export tab
    - [ ] Cmd/Ctrl+2 switches to History tab
    - [ ] Enter key triggers focused button
  - **Tests:**
    1. Tab through modal, verify focus order makes sense
    2. Press Cmd+1, verify switches to Export
    3. Press Cmd+2, verify switches to History
    4. Press Enter on focused button, verify action triggers
    5. Test with screen reader (VoiceOver/NVDA)
  - **Edge Cases:**
    - ⚠️ Modal closed: Don't listen for keyboard events
  - **Rollback:** Remove keyboard handlers, focus styles
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 5.2.2 Add ARIA Labels
- [x] **Action:** Add accessibility labels to all interactive elements
  - **Why:** Screen reader users need context
  - **Files Modified:**
    - Update: `src/features/export/components/ExportModal.tsx`
    - Update: `src/features/export/components/ExportHistoryTab.tsx`
  - **Implementation Details:**
```typescript
// Add aria-labels to icon-only buttons
<button
  onClick={() => handleDownload(exp)}
  className="..."
  title="Download"
  aria-label={`Download ${exp.filename}`}
>
  <Download className="w-4 h-4" />
</button>

<button
  onClick={() => handleDelete(exp)}
  className="..."
  title="Delete"
  aria-label={`Delete ${exp.filename}`}
>
  <Trash2 className="w-4 h-4" />
</button>

// Add role and aria-label to tab navigation
<div className="flex gap-1 -mb-px" role="tablist" aria-label="Export options">
  <button
    role="tab"
    aria-selected={activeTab === 'export'}
    aria-controls="export-panel"
    onClick={() => setActiveTab('export')}
    className="..."
  >
    Export
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 'history'}
    aria-controls="history-panel"
    onClick={() => setActiveTab('history')}
    className="..."
  >
    History
  </button>
</div>

// Add role to tab panels
<div role="tabpanel" id="export-panel" aria-labelledby="export-tab">
  {/* Export content */}
</div>

<div role="tabpanel" id="history-panel" aria-labelledby="history-tab">
  {/* History content */}
</div>
```
  - **Success Criteria:**
    - [ ] All buttons have descriptive aria-labels
    - [ ] Tab navigation uses proper ARIA roles
    - [ ] Tab panels have proper ARIA attributes
    - [ ] Screen reader announces tab changes
  - **Tests:**
    1. Test with VoiceOver (Mac) or NVDA (Windows)
    2. Verify tab role announced correctly
    3. Verify button labels read correctly
    4. Verify tab panel content announced
  - **Edge Cases:**
    - ⚠️ None (accessibility enhancement)
  - **Rollback:** Remove ARIA attributes
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

# Phase 6: Testing & Integration (Estimated: 1 hour)

**Goal:** End-to-end testing and final integration

**Phase Success Criteria:**
- [ ] Full export flow works end-to-end
- [ ] History persists across sessions
- [ ] All edge cases handled gracefully
- [ ] No console errors or warnings

---

## 6.1 Integration Tests

### 6.1.1 Test Complete Export Flow
- [x] **Action:** Test full flow from export to history
  - **Why:** Ensure all pieces work together
  - **Files Modified:**
    - None (testing only)
  - **Implementation Details:**
```
Test Procedure:
1. Open canvas, create 3 objects (rect, circle, text)
2. Select all objects
3. Click Export button (Shift+Cmd+E)
4. Verify Export modal opens to Export tab
5. Select 3x resolution
6. Click "Export PNG"
7. Verify "Generating..." status shown
8. Verify "Uploading..." status shown
9. Verify file downloads to browser
10. Verify modal switches to History tab
11. Verify new export appears in history
12. Verify thumbnail matches exported objects
13. Verify metadata correct (3 objects, 3x, dimensions)
14. Click download button in history
15. Verify file downloads again
16. Close modal, reopen modal
17. Click History tab
18. Verify export still present (persisted to Firestore)
19. Click delete button on export
20. Confirm deletion
21. Verify export removed from history
22. Verify empty state shown
```
  - **Success Criteria:**
    - [ ] All steps complete without errors
    - [ ] Export appears in history immediately
    - [ ] History persists across sessions
    - [ ] Downloads work from history
    - [ ] Deletes work correctly
  - **Tests:**
    1. Follow procedure above
    2. Check browser console for errors
    3. Check Firestore for correct documents
    4. Check Storage for correct files
  - **Edge Cases:**
    - ⚠️ Already covered in individual tasks
  - **Rollback:** N/A (testing only)
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

### 6.1.2 Test Edge Cases
- [x] **Action:** Test boundary conditions and error cases
  - **Why:** Ensure robustness
  - **Files Modified:**
    - None (testing only)
  - **Implementation Details:**
```
Edge Case Tests:

1. User Not Authenticated:
   - Sign out
   - Try to export
   - Verify graceful failure (no crash)

2. No Objects on Canvas:
   - Clear canvas
   - Try to export
   - Verify error message or disabled button

3. Large Export (100+ objects):
   - Create 100 objects
   - Export at 3x
   - Verify doesn't timeout
   - Verify uploads successfully

4. Slow Network:
   - Throttle network to 3G
   - Export objects
   - Verify loading states shown
   - Verify upload completes

5. Offline:
   - Disconnect network
   - Try to export
   - Verify error message shown

6. Storage Quota Exceeded:
   - Mock quota error
   - Try to export
   - Verify user-friendly error

7. Very Long Filename:
   - Export at specific timestamp with long name
   - Verify filename truncates correctly in history

8. Delete While Modal Closed:
   - Export object
   - Close modal
   - Open Firebase Console, delete export
   - Open modal, switch to History
   - Verify export gone (not showing stale data)
```
  - **Success Criteria:**
    - [ ] All edge cases handled gracefully
    - [ ] No crashes or unhandled errors
    - [ ] User-friendly error messages
    - [ ] No data corruption
  - **Tests:**
    1. Run through each edge case
    2. Document any issues found
    3. Fix issues if possible
  - **Edge Cases:**
    - ⚠️ See individual test cases above
  - **Rollback:** N/A (testing only)
  - **Last Verified:** 2025-10-17 (Tasks 4.2.1-4.2.3 completed successfully)

---

# Final Integration & Testing

## Integration Tests
- [ ] Test complete feature end-to-end
  - **Scenario 1:** New user exports for first time
    - Open modal (Shift+Cmd+E)
    - Export objects
    - Verify appears in history
    - Download from history
    - Delete from history
  - **Scenario 2:** Returning user with existing history
    - Export new objects
    - Verify appears at top of history (sorted newest first)
    - Delete all exports
    - Verify empty state
  - **Scenario 3:** Multiple exports in one session
    - Export objects 5 times
    - Verify all 5 appear in history
    - Delete 2 exports
    - Verify 3 remain
    - Delete all
    - Verify empty state

## Performance Tests
- [ ] Verify performance requirements
  - **Metric:** Export upload time
  - **Target:** < 5 seconds for typical export (2x, 10 objects)
  - **How to Test:**
    1. Create 10 objects
    2. Export at 2x
    3. Measure time from "Export PNG" click to History tab switch
    4. Should be < 5 seconds on normal network

  - **Metric:** History load time
  - **Target:** < 2 seconds for 50 exports
  - **How to Test:**
    1. Create 50 exports
    2. Switch to History tab
    3. Measure time until list renders
    4. Should be < 2 seconds

  - **Metric:** Delete all time
  - **Target:** < 10 seconds for 50 exports
  - **How to Test:**
    1. Create 50 exports
    2. Click "Delete All"
    3. Measure time until completion
    4. Should be < 10 seconds

## Accessibility Tests
- [ ] Keyboard navigation works
  - Tab through entire modal
  - Verify focus order: Tabs → Settings → Buttons → History items
  - Test Cmd+1 (Export tab) and Cmd+2 (History tab)
  - Test Enter key on Export button

- [ ] Screen reader compatibility
  - Test with VoiceOver (Mac) or NVDA (Windows)
  - Verify tab announcements
  - Verify button labels
  - Verify export status announcements

- [ ] Color contrast requirements met
  - Verify all text has sufficient contrast (WCAG AA)
  - Test with color blindness simulator
  - Verify focus indicators visible

---

# Deployment Checklist

- [ ] All tasks completed and verified
- [ ] All tests passing
- [ ] Documentation updated (CLAUDE.md Export System section)
- [ ] Code reviewed (self-review checklist below)
- [ ] Performance verified (< 5s export, < 2s history load)
- [ ] No console errors or warnings
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Tested on mobile (responsive)
- [ ] Firebase rules updated (if needed)
- [ ] Commit message written
- [ ] PR created with description

## Self-Review Checklist
- [ ] All functions have JSDoc comments
- [ ] All TypeScript types defined
- [ ] No `any` types used
- [ ] Error handling on all async operations
- [ ] Loading states on all async operations
- [ ] No hardcoded strings (use constants)
- [ ] No console.logs in production code (only behind `isDev`)
- [ ] All imports organized (React, external, internal)
- [ ] Components under 500 lines
- [ ] Functions under 50 lines

---

# Appendix

## Related Documentation
- CLAUDE.md Export System section (to be updated)
- Firebase Storage structure documentation
- Firestore security rules for exports collection

## Future Enhancements
1. **Auto-cleanup**: Delete exports older than 30 days automatically
2. **Export naming**: Allow custom filenames before export
3. **Export formats**: Add SVG, JPG, PDF support
4. **Batch export**: Export multiple selections at once
5. **Export templates**: Save export settings as templates
6. **Share exports**: Generate shareable links for exports
7. **Export analytics**: Track export usage stats
8. **Export compression**: Compress PNGs for faster uploads
9. **Export watermarks**: Add optional branding to exports
10. **Export presets**: 1x/2x/3x presets with descriptions

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| [Date] | Phase 0 | [Hours] | Research and planning complete |
| [Date] | Phase 1 | [Hours] | Firebase infrastructure complete |
| [Date] | Phase 2 | [Hours] | Tab system complete |
| [Date] | Phase 3 | [Hours] | Firebase integration complete |
| [Date] | Phase 4 | [Hours] | History UI complete |
| [Date] | Phase 5 | [Hours] | Polish and error handling complete |
| [Date] | Phase 6 | [Hours] | Testing and integration complete |
