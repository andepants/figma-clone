# Image Cropping System - Implementation Plan

**Project:** Canvas Icons - Image Cropping Feature
**Estimated Time:** 18-22 hours
**Dependencies:** Konva.js, React, Zustand, Firebase RTDB
**Last Updated:** 2025-10-18

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 0/32 tasks completed (0%)

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
- 2025-10-18 - Using layout bounds (x, y, width, height) as the crop frame, image fills within it
- 2025-10-18 - Added `imageLocked` property (true = maintain aspect ratio, false = fill mode)
- 2025-10-18 - Image offset (imageX, imageY) and size (imageWidth, imageHeight) track actual image position within layout
- 2025-10-18 - Cmd/Ctrl modifier enables crop mode (layout changes, image stays fixed)

**Lessons Learned:**
- [Things discovered during implementation]

---

# Phase 0: Research & Planning

## 0.1 Research Context
- [x] Document existing patterns in codebase
  - **What to find:** Image handling, resize logic, properties panel patterns, lock button implementation
  - **Where to look:**
    - `src/features/properties-panel/components/LayoutSection.tsx` - Layout controls
    - `src/features/canvas-core/shapes/ImageShape.tsx` - Image rendering
    - `src/features/canvas-core/hooks/useResize.ts` - Resize logic
    - `src/types/canvas.types.ts` - Type definitions
  - **Success:** Create summary of findings
  - **Files to Review:**
    - ✓ LayoutSection.tsx - Lock button pattern exists for rectangles
    - ✓ ImageShape.tsx - ResizeHandles component used
    - ✓ canvas.types.ts - ImageObject has lockAspectRatio, naturalWidth/Height
    - ✓ imageFactory.ts - Default properties for new images

## 0.2 Design Decisions
- [x] Define technical approach
  - **Success:** Document architecture decisions
  - **Output:** Architecture diagram/notes in this section

### Summary of Findings

**Existing Patterns:**
1. **Lock Button** (LayoutSection.tsx:181-200):
   - Already implemented for rectangles
   - Uses `Lock` and `Unlock` icons from lucide-react
   - Toggles `lockAspectRatio` property
   - Styled with variant='default' (locked) vs 'outline' (unlocked)

2. **Image Object Properties** (canvas.types.ts:257-269):
   ```typescript
   interface ImageObject {
     // Layout bounds (visible crop frame)
     x, y, width, height

     // Original image data
     src, naturalWidth, naturalHeight

     // Current properties
     lockAspectRatio?: boolean (default: true)
   }
   ```

3. **Resize Logic** (ImageShape.tsx:527-544):
   - Uses `<ResizeHandles>` component with 8 handles (4 corners + 4 edges)
   - `useResize` hook handles resize calculations
   - Currently respects `lockAspectRatio` for proportional scaling

**Figma Cropping Behavior (from Context7 docs):**
- Images can be cropped using 8 handles (4 corners + 4 edges)
- Hold Cmd/Ctrl during drag to maintain aspect ratio while cropping
- Images have "Fill" mode that scales to fill container
- Edge dragging resizes in one dimension, corner dragging resizes in both

**Architecture Decisions:**

1. **Data Model - Add to ImageObject:**
   ```typescript
   interface ImageObject {
     // Existing layout bounds (crop frame)
     x, y, width, height  // The visible area

     // NEW: Image lock mode
     imageLocked?: boolean  // true = maintain aspect, false = fill mode (default: true)

     // NEW: Actual image rendering within layout
     imageWidth?: number    // Rendered image width (can exceed layout for crop)
     imageHeight?: number   // Rendered image height (can exceed layout for crop)
     imageX?: number        // Image offset within layout (0 = flush left, negative = cropped)
     imageY?: number        // Image offset within layout (0 = flush top, negative = cropped)

     // Existing
     naturalWidth, naturalHeight  // Original pixels (immutable)
     lockAspectRatio (DEPRECATED - keeping for backward compat)
   }
   ```

2. **Layout = Crop Frame:**
   - `x, y, width, height` defines the visible rectangle (what gets exported)
   - Image can extend beyond layout bounds (cropped out)
   - Image can be smaller than layout (transparent/background visible)

3. **Lock Mode Behavior:**
   - **Locked (`imageLocked: true`)**: Maintain aspect ratio, both dimensions scale together
   - **Unlocked (`imageLocked: false`)**: Fill mode, image stretches to fill layout bounds

4. **Crop Mode (Cmd/Ctrl held):**
   - Layout bounds change (crop frame moves/resizes)
   - Image position/size stays fixed
   - Creates cropping effect (layout reveals different portion of image)

5. **Edge Dragging:**
   - Hover detection: 8px from edge shows resize cursor
   - 4 edges: `ew-resize` (left/right), `ns-resize` (top/bottom)
   - 4 corners: `nwse-resize` (TL/BR), `nesw-resize` (TR/BL)

---

# Phase 1: Data Model & Migration (Estimated: 3 hours)

**Goal:** Update ImageObject type and migrate existing images to new structure

**Phase Success Criteria:**
- [ ] ImageObject type includes new crop properties
- [ ] Existing images auto-migrate on load
- [ ] No breaking changes to existing functionality

---

## 1.1 Type Definitions

### 1.1.1 Update ImageObject Type
- [ ] **Action:** Add new crop properties to ImageObject interface
  - **Why:** Store image position/size within layout bounds for cropping
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
```typescript
export interface ImageObject extends BaseCanvasObject, VisualProperties, ImageProperties {
  type: 'image';
  src: string;
  naturalWidth: number;
  naturalHeight: number;

  // Layout bounds (visible crop frame)
  width: number;
  height: number;

  // NEW: Image lock mode (default: true for new images)
  imageLocked?: boolean;  // true = maintain aspect, false = fill mode

  // NEW: Actual image rendering (defaults to match layout)
  imageWidth?: number;    // Rendered image width (can exceed layout for crop)
  imageHeight?: number;   // Rendered image height
  imageX?: number;        // Image offset within layout (default: 0)
  imageY?: number;        // Image offset within layout (default: 0)

  // Existing properties
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: ImageStorageType;
  storagePath?: string;
  lockAspectRatio?: boolean;  // DEPRECATED but kept for backward compatibility
}
```
  - **Success Criteria:**
    - [ ] Type compiles without errors
    - [ ] JSDoc comments explain each new property
    - [ ] Backward compatible with existing ImageObject instances
  - **Tests:**
    1. Run TypeScript compiler: `npm run type-check`
    2. Verify no type errors in IDE
    3. Check that existing image objects still load
  - **Edge Cases:**
    - ⚠️ Existing images without new properties: Migration handled in Phase 1.2
    - ⚠️ Negative offsets allowed for cropping: imageX/Y can be negative
  - **Rollback:** Revert changes to canvas.types.ts
  - **Last Verified:** [Date/time]

### 1.1.2 Add Type Guards
- [ ] **Action:** Create helper functions to work with image crop properties
  - **Why:** Type-safe access to optional crop properties with defaults
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
```typescript
/**
 * Get image lock state (defaults to true for images)
 */
export function getImageLocked(image: ImageObject): boolean {
  return image.imageLocked ?? true;
}

/**
 * Get image render dimensions (defaults to layout size)
 */
export function getImageDimensions(image: ImageObject): {
  imageWidth: number;
  imageHeight: number;
  imageX: number;
  imageY: number;
} {
  return {
    imageWidth: image.imageWidth ?? image.width,
    imageHeight: image.imageHeight ?? image.height,
    imageX: image.imageX ?? 0,
    imageY: image.imageY ?? 0,
  };
}
```
  - **Success Criteria:**
    - [ ] Helper functions provide correct defaults
    - [ ] JSDoc comments explain default behavior
    - [ ] Functions are exported from types module
  - **Tests:**
    1. Test with minimal image object: `getImageLocked({ type: 'image', ... })` returns `true`
    2. Test with explicit values: `getImageLocked({ imageLocked: false })` returns `false`
    3. Test dimensions with defaults: `getImageDimensions({ width: 200, height: 100 })`
  - **Edge Cases:**
    - ⚠️ Undefined vs null: Treat both as "use default"
  - **Rollback:** Remove helper functions
  - **Last Verified:** [Date/time]

---

## 1.2 Migration Logic

### 1.2.1 Add Migration to Image Factory
- [ ] **Action:** Update `createImageObject` to set new properties for newly uploaded images
  - **Why:** New images should have imageLocked=true and matching layout/image dimensions
  - **Files Modified:**
    - Update: `src/features/canvas-core/utils/imageFactory.ts`
  - **Implementation Details:**
```typescript
export function createImageObject(
  uploadedData: UploadedImageData,
  position: { x: number; y: number },
  userId: string,
  existingObjects: any[] = []
): ImageObject {
  const now = Date.now();

  return {
    // ... existing properties ...

    // NEW: Image crop properties
    imageLocked: true,  // Auto-lock for new images
    imageWidth: uploadedData.width,   // Match layout initially
    imageHeight: uploadedData.height,
    imageX: 0,  // No offset initially
    imageY: 0,

    // Keep for backward compatibility
    lockAspectRatio: true,
  };
}
```
  - **Success Criteria:**
    - [ ] New images have all crop properties set
    - [ ] imageLocked defaults to true
    - [ ] imageWidth/Height match width/height initially
    - [ ] imageX/Y start at 0
  - **Tests:**
    1. Upload new image
    2. Inspect object in Zustand DevTools
    3. Verify `imageLocked: true`, `imageX: 0`, `imageY: 0`
    4. Verify `imageWidth === width` and `imageHeight === height`
  - **Edge Cases:**
    - ⚠️ Large images: Ensure properties don't cause RTDB size issues
  - **Rollback:** Remove new property assignments
  - **Last Verified:** [Date/time]

### 1.2.2 Add Migration Hook for Existing Images
- [ ] **Action:** Create utility to auto-migrate existing images when loaded from Firebase
  - **Why:** Existing images need new properties added without breaking
  - **Files Modified:**
    - Create: `src/lib/utils/imageMigration.ts`
    - Update: `src/stores/canvas.ts` (apply migration on load)
  - **Implementation Details:**
```typescript
// src/lib/utils/imageMigration.ts

/**
 * Migrate legacy ImageObject to include new crop properties
 *
 * @param image - Existing image object (may be missing new properties)
 * @returns Migrated image with all crop properties
 */
export function migrateImageObject(image: ImageObject): ImageObject {
  // If already migrated, return as-is
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
 */
export function migrateCanvasObjects(objects: CanvasObject[]): CanvasObject[] {
  return objects.map(obj => {
    if (obj.type === 'image') {
      return migrateImageObject(obj);
    }
    return obj;
  });
}
```

```typescript
// In src/stores/canvas.ts - apply migration when loading objects

import { migrateCanvasObjects } from '@/lib/utils/imageMigration';

// In setObjects or wherever objects are loaded from Firebase:
setObjects: (objects) => {
  const migrated = migrateCanvasObjects(objects);
  set({ objects: migrated });
}
```
  - **Success Criteria:**
    - [ ] Migration function detects legacy images
    - [ ] All images have new properties after migration
    - [ ] Migration is idempotent (safe to run multiple times)
    - [ ] No console errors during migration
  - **Tests:**
    1. Load canvas with existing images (without new properties)
    2. Check console for migration log messages
    3. Verify all images have `imageLocked`, `imageWidth`, etc.
    4. Reload page, verify migration doesn't run again (already migrated)
  - **Edge Cases:**
    - ⚠️ Partially migrated images: Check all properties, not just one
    - ⚠️ Firebase RTDB undefined handling: Use ?? operator for defaults
  - **Rollback:** Remove migration utility and store integration
  - **Last Verified:** [Date/time]

---

# Phase 2: Properties Panel UI (Estimated: 3 hours)

**Goal:** Show layout controls for images with lock button

**Phase Success Criteria:**
- [ ] LayoutSection displays for images
- [ ] Lock button controls `imageLocked` property
- [ ] Width/height inputs control layout bounds
- [ ] Lock button is visually active when locked

---

## 2.1 Layout Section for Images

### 2.1.1 Add Image Support to LayoutSection
- [ ] **Action:** Update LayoutSection to display for images with lock button
  - **Why:** Users need to see and control layout dimensions and lock state
  - **Files Modified:**
    - Update: `src/features/properties-panel/components/LayoutSection.tsx`
  - **Implementation Details:**
```typescript
import { isImageShape } from '@/types/canvas.types';
import { getImageLocked, getImageDimensions } from '@/types/canvas.types';

export function LayoutSection() {
  const shape = useSelectedShape();
  const dimensions = useShapeDimensions(shape);

  if (!shape) return null;

  // ... existing code for lines, circles, text, rectangles ...

  // NEW: Render for images - layout bounds with lock
  if (isImageShape(shape)) {
    const imageLocked = getImageLocked(shape);

    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-3.5 h-3.5" />}
        storageKey="props-layout"
      >
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Dimensions</Label>
          <div className="flex gap-1.5 items-center">
            <div className="flex-1">
              <NumberInput
                value={shape.width}
                onChange={(value) => dimensions.updateWidth?.(value)}
                min={1}
                step={1}
                precision={0}
                unit="px"
                placeholder="W"
              />
            </div>

            <span className="text-gray-400">×</span>

            <div className="flex-1">
              <NumberInput
                value={shape.height}
                onChange={(value) => dimensions.updateHeight?.(value)}
                min={1}
                step={1}
                precision={0}
                unit="px"
                placeholder="H"
              />
            </div>

            {/* Image Lock Toggle */}
            <Button
              variant={imageLocked ? 'default' : 'outline'}
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                // Toggle imageLocked property
                const { updateObject } = useCanvasStore.getState();
                updateObject(shape.id, { imageLocked: !imageLocked });
              }}
              title={
                imageLocked
                  ? 'Unlock aspect ratio (fill mode)'
                  : 'Lock aspect ratio'
              }
            >
              {imageLocked ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                <Unlock className="w-2.5 h-2.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Info text explaining lock behavior */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 italic">
          {imageLocked ? (
            <span>Locked: maintains aspect ratio</span>
          ) : (
            <span>Unlocked: image fills layout bounds</span>
          )}
        </div>
      </PropertySection>
    );
  }

  // ... rest of function ...
}
```
  - **Success Criteria:**
    - [ ] LayoutSection renders for images
    - [ ] Lock button appears next to dimensions
    - [ ] Lock button shows filled style when locked
    - [ ] Lock button shows outline style when unlocked
    - [ ] Info text updates based on lock state
  - **Tests:**
    1. Select an image on canvas
    2. Verify LayoutSection appears in properties panel
    3. Click lock button, verify it toggles between locked/unlocked
    4. Check Zustand DevTools for `imageLocked` property change
    5. Verify info text changes ("Locked: ..." vs "Unlocked: ...")
  - **Edge Cases:**
    - ⚠️ Newly uploaded image: Should be locked by default
    - ⚠️ Migrated legacy image: Should be locked by default
  - **Rollback:** Remove image-specific section from LayoutSection
  - **Last Verified:** [Date/time]

### 2.1.2 Update useShapeDimensions Hook for Images
- [ ] **Action:** Add image dimension update logic to support layout changes
  - **Why:** Width/height inputs need to update layout bounds (not image size)
  - **Files Modified:**
    - Update: `src/features/properties-panel/hooks/useShapeDimensions.ts`
  - **Implementation Details:**
```typescript
import { isImageShape, getImageLocked, getImageDimensions } from '@/types/canvas.types';

export function useShapeDimensions(shape: CanvasObject | null) {
  // ... existing code ...

  // NEW: Image dimension handling
  if (isImageShape(shape)) {
    const imageLocked = getImageLocked(shape);
    const { imageWidth, imageHeight, imageX, imageY } = getImageDimensions(shape);

    return {
      width: shape.width,
      height: shape.height,

      // Update layout width
      updateWidth: (newWidth: number) => {
        if (imageLocked) {
          // Locked: scale height proportionally
          const aspectRatio = shape.height / shape.width;
          const newHeight = newWidth * aspectRatio;

          // Also scale image proportionally
          const imageScale = newWidth / shape.width;
          updateObject(shape.id, {
            width: newWidth,
            height: newHeight,
            imageWidth: imageWidth * imageScale,
            imageHeight: imageHeight * imageScale,
          });
        } else {
          // Unlocked: only change width, image stretches to fill
          updateObject(shape.id, {
            width: newWidth,
            // Recalculate image size to fill new layout
            imageWidth: newWidth,
            imageHeight: shape.height, // Keep height same
          });
        }
      },

      // Update layout height
      updateHeight: (newHeight: number) => {
        if (imageLocked) {
          // Locked: scale width proportionally
          const aspectRatio = shape.width / shape.height;
          const newWidth = newHeight * aspectRatio;

          // Also scale image proportionally
          const imageScale = newHeight / shape.height;
          updateObject(shape.id, {
            width: newWidth,
            height: newHeight,
            imageWidth: imageWidth * imageScale,
            imageHeight: imageHeight * imageScale,
          });
        } else {
          // Unlocked: only change height, image stretches to fill
          updateObject(shape.id, {
            height: newHeight,
            // Recalculate image size to fill new layout
            imageWidth: shape.width, // Keep width same
            imageHeight: newHeight,
          });
        }
      },

      supportsAspectRatioLock: false, // Use imageLocked instead
      hasAspectRatioLock: imageLocked,
      toggleAspectRatioLock: undefined, // Handled by button in LayoutSection
    };
  }

  // ... rest of function ...
}
```
  - **Success Criteria:**
    - [ ] Changing width updates layout and image proportionally when locked
    - [ ] Changing height updates layout and image proportionally when locked
    - [ ] Changing width only affects width when unlocked (image fills)
    - [ ] Changing height only affects height when unlocked (image fills)
  - **Tests:**
    1. Select locked image (imageLocked: true)
    2. Change width to 400px, verify height scales proportionally
    3. Verify imageWidth and imageHeight also scale
    4. Unlock image (imageLocked: false)
    5. Change width to 600px, verify height stays same
    6. Verify imageWidth = 600, imageHeight stays same
  - **Edge Cases:**
    - ⚠️ Very small dimensions: Prevent width/height < 1px
    - ⚠️ Aspect ratio calculation: Handle divide by zero
  - **Rollback:** Remove image dimension handling from hook
  - **Last Verified:** [Date/time]

---

# Phase 3: Edge Hover Detection (Estimated: 4 hours)

**Goal:** Detect when cursor hovers over image edges/corners and show appropriate resize cursors

**Phase Success Criteria:**
- [ ] Cursor changes when hovering near edges (8px detection zone)
- [ ] Different cursors for horizontal, vertical, and diagonal edges
- [ ] No interference with existing drag/select behavior

---

## 3.1 Edge Detection Utilities

### 3.1.1 Create Edge Detection Utility
- [ ] **Action:** Create utility to detect which edge/corner is under cursor
  - **Why:** Need to determine hover zones for resize cursors
  - **Files Modified:**
    - Create: `src/features/canvas-core/utils/edgeDetection.ts`
  - **Implementation Details:**
```typescript
/**
 * Edge/corner types for resize operations
 */
export type EdgeType =
  | 'top' | 'right' | 'bottom' | 'left'           // Edges
  | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'  // Corners
  | null;  // No edge

/**
 * Cursor styles for each edge type
 */
export const EDGE_CURSORS: Record<NonNullable<EdgeType>, string> = {
  'top': 'ns-resize',
  'bottom': 'ns-resize',
  'left': 'ew-resize',
  'right': 'ew-resize',
  'top-left': 'nwse-resize',
  'top-right': 'nesw-resize',
  'bottom-right': 'nwse-resize',
  'bottom-left': 'nesw-resize',
};

/**
 * Detect which edge/corner of a rectangle is under the cursor
 *
 * @param cursorX - Cursor X position in canvas coordinates
 * @param cursorY - Cursor Y position in canvas coordinates
 * @param rect - Rectangle bounds { x, y, width, height }
 * @param threshold - Detection distance from edge in pixels (default: 8)
 * @returns Edge type or null if not near any edge
 */
export function detectEdge(
  cursorX: number,
  cursorY: number,
  rect: { x: number; y: number; width: number; height: number },
  threshold: number = 8
): EdgeType {
  const { x, y, width, height } = rect;

  // Check if cursor is within the overall bounds + threshold
  const inHorizontalRange = cursorX >= x - threshold && cursorX <= x + width + threshold;
  const inVerticalRange = cursorY >= y - threshold && cursorY <= y + height + threshold;

  if (!inHorizontalRange || !inVerticalRange) {
    return null;  // Not near rectangle
  }

  // Detect proximity to each edge
  const nearTop = Math.abs(cursorY - y) <= threshold;
  const nearBottom = Math.abs(cursorY - (y + height)) <= threshold;
  const nearLeft = Math.abs(cursorX - x) <= threshold;
  const nearRight = Math.abs(cursorX - (x + width)) <= threshold;

  // Corners take priority (check corners first)
  if (nearTop && nearLeft) return 'top-left';
  if (nearTop && nearRight) return 'top-right';
  if (nearBottom && nearLeft) return 'bottom-left';
  if (nearBottom && nearRight) return 'bottom-right';

  // Edges
  if (nearTop) return 'top';
  if (nearBottom) return 'bottom';
  if (nearLeft) return 'left';
  if (nearRight) return 'right';

  return null;  // Inside rectangle, not near edge
}

/**
 * Get cursor style for an edge type
 */
export function getCursorForEdge(edge: EdgeType): string | null {
  return edge ? EDGE_CURSORS[edge] : null;
}
```
  - **Success Criteria:**
    - [ ] Function correctly identifies corners
    - [ ] Function correctly identifies edges
    - [ ] Function returns null when not near edge
    - [ ] Threshold parameter controls detection distance
  - **Tests:**
    1. Test corner detection: `detectEdge(10, 10, { x: 10, y: 10, width: 100, height: 100 }, 8)` returns `'top-left'`
    2. Test edge detection: `detectEdge(50, 10, { x: 10, y: 10, width: 100, height: 100 }, 8)` returns `'top'`
    3. Test inside rect: `detectEdge(50, 50, { x: 10, y: 10, width: 100, height: 100 }, 8)` returns `null`
    4. Test outside rect: `detectEdge(200, 200, { x: 10, y: 10, width: 100, height: 100 }, 8)` returns `null`
  - **Edge Cases:**
    - ⚠️ Very small images: Threshold might be larger than image, corners overlap
    - ⚠️ Rotated images: Edge detection assumes axis-aligned rectangle (rotation handled later)
  - **Rollback:** Delete edgeDetection.ts file
  - **Last Verified:** [Date/time]

---

## 3.2 Image Shape Edge Hover

### 3.2.1 Add Edge Hover State to ImageShape
- [ ] **Action:** Track edge hover state and update cursor
  - **Why:** Visual feedback when user can resize from edge
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
import { detectEdge, getCursorForEdge, type EdgeType } from '../utils/edgeDetection';

export const ImageShape = memo(function ImageShape({ /* ... */ }) {
  // ... existing state ...

  // NEW: Track hovered edge
  const [hoveredEdge, setHoveredEdge] = useState<EdgeType>(null);

  /**
   * Handle mouse move over image
   * Detect if cursor is near edge and update cursor style
   */
  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    // Only detect edges when move tool is active
    if (activeTool !== 'move') return;

    // Skip if locked (can't resize locked images)
    if (isLocked) return;

    const stage = e.target.getStage();
    if (!stage) return;

    // Get cursor position in stage coordinates
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert to canvas coordinates
    const canvasCoords = screenToCanvasCoords(stage, pointerPos);

    // Detect which edge is hovered
    const edge = detectEdge(
      canvasCoords.x,
      canvasCoords.y,
      {
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
      },
      8  // 8px threshold
    );

    setHoveredEdge(edge);

    // Update cursor based on edge
    if (edge) {
      const cursor = getCursorForEdge(edge);
      if (cursor) {
        stage.container().style.cursor = cursor;
      }
    } else if (!isSelected) {
      // Reset to move cursor when not near edge
      stage.container().style.cursor = 'move';
    }
  }

  // ... existing handlers ...

  return (
    <Fragment>
      <Image
        {/* ... existing props ... */}
        onMouseMove={handleMouseMove}
        {/* ... rest of props ... */}
      />
      {/* ... rest of component ... */}
    </Fragment>
  );
});
```
  - **Success Criteria:**
    - [ ] Cursor changes to `ns-resize` when hovering top/bottom edges
    - [ ] Cursor changes to `ew-resize` when hovering left/right edges
    - [ ] Cursor changes to `nwse-resize` when hovering TL/BR corners
    - [ ] Cursor changes to `nesw-resize` when hovering TR/BL corners
    - [ ] Cursor resets to `move` when not near edge
  - **Tests:**
    1. Select image on canvas
    2. Move cursor to top edge (within 8px), verify cursor = `ns-resize`
    3. Move cursor to left edge, verify cursor = `ew-resize`
    4. Move cursor to top-left corner, verify cursor = `nwse-resize`
    5. Move cursor inside image (not near edge), verify cursor = `move`
  - **Edge Cases:**
    - ⚠️ Locked images: No cursor change, edge detection disabled
    - ⚠️ Non-selected images: Only show hover cursor, no resize handles
  - **Rollback:** Remove onMouseMove handler and hoveredEdge state
  - **Last Verified:** [Date/time]

### 3.2.2 Add Visual Edge Hover Feedback
- [ ] **Action:** Highlight edge when hovered (optional enhancement)
  - **Why:** Clearer visual feedback for resize zones
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
{/* Edge hover indicators - show when hovering near edge */}
{hoveredEdge && !isSelected && (
  <Rect
    listening={false}
    {...getEdgeHighlightRect(hoveredEdge, image)}
    stroke="#0ea5e9"
    strokeWidth={2}
    dash={[4, 4]}
    opacity={0.6}
  />
)}

// Helper function to get rectangle for edge highlight
function getEdgeHighlightRect(edge: EdgeType, img: ImageObject) {
  const thickness = 2;

  switch (edge) {
    case 'top':
      return { x: img.x, y: img.y - thickness, width: img.width, height: thickness };
    case 'bottom':
      return { x: img.x, y: img.y + img.height, width: img.width, height: thickness };
    case 'left':
      return { x: img.x - thickness, y: img.y, width: thickness, height: img.height };
    case 'right':
      return { x: img.x + img.width, y: img.y, width: thickness, height: img.height };
    // Corners: small squares
    case 'top-left':
      return { x: img.x - 4, y: img.y - 4, width: 8, height: 8 };
    case 'top-right':
      return { x: img.x + img.width - 4, y: img.y - 4, width: 8, height: 8 };
    case 'bottom-right':
      return { x: img.x + img.width - 4, y: img.y + img.height - 4, width: 8, height: 8 };
    case 'bottom-left':
      return { x: img.x - 4, y: img.y + img.height - 4, width: 8, height: 8 };
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}
```
  - **Success Criteria:**
    - [ ] Edge highlight appears when hovering edge (not selected)
    - [ ] Highlight is subtle (dashed blue line)
    - [ ] Highlight disappears when moving away from edge
  - **Tests:**
    1. Hover over image edge (image not selected)
    2. Verify subtle blue dashed line appears on hovered edge
    3. Move cursor away, verify highlight disappears
  - **Edge Cases:**
    - ⚠️ Performance: Ensure highlight doesn't cause lag (it's just a Rect)
  - **Rollback:** Remove edge highlight rendering
  - **Last Verified:** [Date/time]

---

# Phase 4: Edge Dragging Logic (Estimated: 5 hours)

**Goal:** Implement edge dragging for resizing/cropping images

**Phase Success Criteria:**
- [ ] Dragging edges resizes layout bounds
- [ ] Locked mode maintains aspect ratio
- [ ] Unlocked mode stretches image to fill
- [ ] Cmd/Ctrl modifier enables crop mode

---

## 4.1 Edge Resize Hook

### 4.1.1 Create Edge Resize Hook
- [ ] **Action:** Create hook to handle edge resize logic
  - **Why:** Centralized logic for edge dragging with lock/crop modes
  - **Files Modified:**
    - Create: `src/features/canvas-core/hooks/useEdgeResize.ts`
  - **Implementation Details:**
```typescript
/**
 * Edge Resize Hook
 *
 * Handles edge/corner dragging for image resize and crop operations.
 * Supports three modes:
 * 1. Locked mode (imageLocked=true): Maintains aspect ratio, scales from opposite edge
 * 2. Unlocked mode (imageLocked=false): Stretches layout, image fills
 * 3. Crop mode (Cmd/Ctrl held): Changes layout bounds, image stays fixed size
 */

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvas';
import { getImageLocked, getImageDimensions, type ImageObject } from '@/types/canvas.types';
import type { EdgeType } from '../utils/edgeDetection';

interface EdgeResizeState {
  objectId: string;
  edgeType: EdgeType;
  startX: number;      // Initial cursor position
  startY: number;
  startBounds: {       // Initial layout bounds
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startImage: {        // Initial image position/size
    imageX: number;
    imageY: number;
    imageWidth: number;
    imageHeight: number;
  };
  imageLocked: boolean;
  isCropMode: boolean; // Cmd/Ctrl held during drag
}

export function useEdgeResize(projectId: string) {
  const [resizeState, setResizeState] = useState<EdgeResizeState | null>(null);
  const updateObject = useCanvasStore((state) => state.updateObject);

  const startEdgeResize = useCallback((
    objectId: string,
    edgeType: EdgeType,
    cursorX: number,
    cursorY: number,
    image: ImageObject,
    isCropMode: boolean
  ) => {
    if (!edgeType) return;

    const imageLocked = getImageLocked(image);
    const { imageX, imageY, imageWidth, imageHeight } = getImageDimensions(image);

    setResizeState({
      objectId,
      edgeType,
      startX: cursorX,
      startY: cursorY,
      startBounds: {
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
      },
      startImage: {
        imageX,
        imageY,
        imageWidth,
        imageHeight,
      },
      imageLocked,
      isCropMode,
    });
  }, []);

  const moveEdgeResize = useCallback((
    cursorX: number,
    cursorY: number
  ) => {
    if (!resizeState) return;

    const { edgeType, startX, startY, startBounds, startImage, imageLocked, isCropMode } = resizeState;

    // Calculate delta from start position
    const dx = cursorX - startX;
    const dy = cursorY - startY;

    // Calculate new bounds based on edge type
    let newBounds = { ...startBounds };
    let newImage = { ...startImage };

    if (isCropMode) {
      // CROP MODE: Layout changes, image stays fixed
      newBounds = calculateCropBounds(edgeType, startBounds, dx, dy);
      newImage = { ...startImage }; // Image size/position unchanged
    } else if (imageLocked) {
      // LOCKED MODE: Maintain aspect ratio, scale both dimensions
      const result = calculateLockedResize(edgeType, startBounds, startImage, dx, dy);
      newBounds = result.bounds;
      newImage = result.image;
    } else {
      // UNLOCKED MODE: Stretch layout, image fills
      newBounds = calculateUnlockedBounds(edgeType, startBounds, dx, dy);
      newImage = {
        imageX: 0,
        imageY: 0,
        imageWidth: newBounds.width,
        imageHeight: newBounds.height,
      };
    }

    // Update object
    updateObject(resizeState.objectId, {
      x: newBounds.x,
      y: newBounds.y,
      width: newBounds.width,
      height: newBounds.height,
      imageX: newImage.imageX,
      imageY: newImage.imageY,
      imageWidth: newImage.imageWidth,
      imageHeight: newImage.imageHeight,
    });
  }, [resizeState, updateObject]);

  const endEdgeResize = useCallback(() => {
    setResizeState(null);
  }, []);

  return {
    isResizing: !!resizeState,
    startEdgeResize,
    moveEdgeResize,
    endEdgeResize,
  };
}

// Helper: Calculate new bounds in crop mode (layout changes, image fixed)
function calculateCropBounds(
  edge: EdgeType,
  startBounds: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number
) {
  let { x, y, width, height } = startBounds;

  // Adjust based on edge
  switch (edge) {
    case 'top':
      y += dy;
      height -= dy;
      break;
    case 'bottom':
      height += dy;
      break;
    case 'left':
      x += dx;
      width -= dx;
      break;
    case 'right':
      width += dx;
      break;
    case 'top-left':
      x += dx;
      y += dy;
      width -= dx;
      height -= dy;
      break;
    case 'top-right':
      y += dy;
      width += dx;
      height -= dy;
      break;
    case 'bottom-right':
      width += dx;
      height += dy;
      break;
    case 'bottom-left':
      x += dx;
      width -= dx;
      height += dy;
      break;
  }

  return { x, y, width, height };
}

// Helper: Calculate locked resize (maintain aspect ratio)
function calculateLockedResize(
  edge: EdgeType,
  startBounds: { x: number; y: number; width: number; height: number },
  startImage: { imageX: number; imageY: number; imageWidth: number; imageHeight: number },
  dx: number,
  dy: number
) {
  const aspectRatio = startBounds.width / startBounds.height;
  let { x, y, width, height } = startBounds;

  // For edges: use the dimension being dragged, calculate other dimension
  // For corners: use larger delta to determine scale

  if (edge === 'right' || edge === 'left') {
    // Horizontal edge: change width, calculate height
    const delta = edge === 'right' ? dx : -dx;
    width = startBounds.width + delta;
    height = width / aspectRatio;

    // Adjust position if left edge (opposite edge stays fixed)
    if (edge === 'left') {
      x = startBounds.x + startBounds.width - width;
    }
  } else if (edge === 'top' || edge === 'bottom') {
    // Vertical edge: change height, calculate width
    const delta = edge === 'bottom' ? dy : -dy;
    height = startBounds.height + delta;
    width = height * aspectRatio;

    // Adjust position if top edge
    if (edge === 'top') {
      y = startBounds.y + startBounds.height - height;
    }
  } else {
    // Corner: use dominant delta
    const deltaX = Math.abs(dx);
    const deltaY = Math.abs(dy);

    if (deltaX > deltaY) {
      // Width drives resize
      const delta = edge.includes('right') ? dx : -dx;
      width = startBounds.width + delta;
      height = width / aspectRatio;
    } else {
      // Height drives resize
      const delta = edge.includes('bottom') ? dy : -dy;
      height = startBounds.height + delta;
      width = height * aspectRatio;
    }

    // Adjust position for top/left corners
    if (edge.includes('left')) {
      x = startBounds.x + startBounds.width - width;
    }
    if (edge.includes('top')) {
      y = startBounds.y + startBounds.height - height;
    }
  }

  // Scale image proportionally
  const scaleX = width / startBounds.width;
  const scaleY = height / startBounds.height;
  const scale = Math.min(scaleX, scaleY); // Use uniform scale to maintain aspect

  return {
    bounds: { x, y, width, height },
    image: {
      imageX: startImage.imageX * scale,
      imageY: startImage.imageY * scale,
      imageWidth: startImage.imageWidth * scale,
      imageHeight: startImage.imageHeight * scale,
    },
  };
}

// Helper: Calculate unlocked resize (stretch to fill)
function calculateUnlockedBounds(
  edge: EdgeType,
  startBounds: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number
) {
  // Same as crop mode but image will fill (handled in moveEdgeResize)
  return calculateCropBounds(edge, startBounds, dx, dy);
}
```
  - **Success Criteria:**
    - [ ] Hook tracks resize state correctly
    - [ ] Crop mode changes layout only
    - [ ] Locked mode maintains aspect ratio
    - [ ] Unlocked mode stretches dimensions independently
  - **Tests:**
    1. Start edge resize on right edge, locked mode
    2. Move cursor right 100px, verify width increases and height scales proportionally
    3. Start edge resize on bottom edge, crop mode (Cmd held)
    4. Move cursor down 50px, verify only layout height increases
  - **Edge Cases:**
    - ⚠️ Minimum dimensions: Ensure width/height don't go below 1px
    - ⚠️ Aspect ratio edge case: Prevent divide by zero
    - ⚠️ Negative dimensions: Clamp to positive values
  - **Rollback:** Delete useEdgeResize.ts
  - **Last Verified:** [Date/time]

---

## 4.2 Integrate Edge Resize into ImageShape

### 4.2.1 Add Edge Resize to ImageShape
- [ ] **Action:** Integrate useEdgeResize hook into ImageShape component
  - **Why:** Enable edge dragging on images
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
import { useEdgeResize } from '../hooks/useEdgeResize';

export const ImageShape = memo(function ImageShape({ /* ... */ }) {
  // ... existing hooks ...

  const { isResizing: isEdgeResizing, startEdgeResize, moveEdgeResize, endEdgeResize } = useEdgeResize(effectiveProjectId);

  // NEW: Track if drag is an edge resize vs object drag
  const [isDraggingEdge, setIsDraggingEdge] = useState(false);

  /**
   * Handle mouse down on image
   * Detect if clicking on edge to start edge resize
   */
  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'move') return;
    if (isLocked) return;

    // Detect if clicking on edge
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const canvasCoords = screenToCanvasCoords(stage, pointerPos);
    const edge = detectEdge(
      canvasCoords.x,
      canvasCoords.y,
      { x: image.x, y: image.y, width: image.width, height: image.height },
      8
    );

    if (edge) {
      // Start edge resize
      e.cancelBubble = true; // Prevent drag
      setIsDraggingEdge(true);

      const isCropMode = e.evt.metaKey || e.evt.ctrlKey; // Cmd (Mac) or Ctrl (Win)
      startEdgeResize(image.id, edge, canvasCoords.x, canvasCoords.y, image, isCropMode);
    }
  }

  /**
   * Handle mouse move during edge resize
   */
  function handleEdgeDragMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDraggingEdge) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const canvasCoords = screenToCanvasCoords(stage, pointerPos);
    moveEdgeResize(canvasCoords.x, canvasCoords.y);
  }

  /**
   * Handle mouse up after edge resize
   */
  function handleEdgeDragEnd() {
    if (!isDraggingEdge) return;

    setIsDraggingEdge(false);
    endEdgeResize();
  }

  return (
    <Fragment>
      <Image
        {/* ... existing props ... */}
        onMouseDown={handleMouseDown}
        onMouseMove={isDraggingEdge ? handleEdgeDragMove : handleMouseMove}
        onMouseUp={handleEdgeDragEnd}
        draggable={!isLocked && !isDraggingEdge && (isSelected || isHovered) && activeTool === 'move'}
        {/* ... rest of props ... */}
      />
      {/* ... rest of component ... */}
    </Fragment>
  );
});
```
  - **Success Criteria:**
    - [ ] Clicking on edge starts edge resize (not object drag)
    - [ ] Edge resize works for all 4 edges and 4 corners
    - [ ] Object drag works when clicking inside (not on edge)
  - **Tests:**
    1. Click on right edge of image and drag right
    2. Verify image width increases (not object position)
    3. Click inside image (not near edge) and drag
    4. Verify object position moves (not resizing)
  - **Edge Cases:**
    - ⚠️ Edge vs drag conflict: Ensure edge takes priority when within 8px
    - ⚠️ Multi-select: Disable edge resize during multi-select
  - **Rollback:** Remove edge resize handlers from ImageShape
  - **Last Verified:** [Date/time]

### 4.2.2 Add Keyboard Modifier Tracking
- [ ] **Action:** Track Cmd/Ctrl key state for crop mode
  - **Why:** Need to know if crop mode is active during resize
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
// Track modifier key state for crop mode
const [isCropModeActive, setIsCropModeActive] = useState(false);

useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) {
      setIsCropModeActive(true);
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (!e.metaKey && !e.ctrlKey) {
      setIsCropModeActive(false);
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);

// Update handleMouseDown to use isCropModeActive
function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
  // ... existing code ...

  if (edge) {
    // ... existing code ...
    startEdgeResize(image.id, edge, canvasCoords.x, canvasCoords.y, image, isCropModeActive);
  }
}
```
  - **Success Criteria:**
    - [ ] Holding Cmd (Mac) or Ctrl (Windows) enables crop mode
    - [ ] Releasing key disables crop mode
    - [ ] Crop mode state updates during drag
  - **Tests:**
    1. Start dragging right edge without modifier
    2. Verify layout and image both resize
    3. Start dragging right edge WITH Cmd/Ctrl held
    4. Verify only layout resizes (image stays same size)
  - **Edge Cases:**
    - ⚠️ Key released during drag: Behavior should switch mid-drag
  - **Rollback:** Remove keyboard event listeners
  - **Last Verified:** [Date/time]

---

# Phase 5: Image Rendering with Crop (Estimated: 3 hours)

**Goal:** Render image correctly within layout bounds using imageX/Y/Width/Height

**Phase Success Criteria:**
- [ ] Image renders at correct size/position within layout
- [ ] Cropped areas are clipped (not visible)
- [ ] Fill mode stretches image to fill layout
- [ ] Export uses layout bounds

---

## 5.1 Image Rendering

### 5.1.1 Update ImageShape Rendering
- [ ] **Action:** Modify Image component to use crop properties
  - **Why:** Render image at correct size/position within layout frame
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
import { getImageDimensions } from '@/types/canvas.types';

export const ImageShape = memo(function ImageShape({ /* ... */ }) {
  // ... existing code ...

  // Get image crop dimensions
  const { imageX, imageY, imageWidth, imageHeight } = getImageDimensions(image);

  return (
    <Fragment>
      {/* Clipping Group - defines visible layout bounds */}
      <Group
        clipFunc={(ctx) => {
          // Clip to layout bounds (crop frame)
          ctx.rect(0, 0, width, height);
        }}
        x={displayX}
        y={displayY}
      >
        {/* Image within clip - can extend beyond layout */}
        <Image
          id={image.id}
          ref={shapeRef}
          image={htmlImage}
          // Position relative to group (layout bounds)
          x={imageX}
          y={imageY}
          width={imageWidth}
          height={imageHeight}
          // Transform properties
          rotation={image.rotation ?? 0}
          opacity={(image.opacity ?? 1) * getOpacity()}
          scaleX={image.scaleX ?? 1}
          scaleY={image.scaleY ?? 1}
          skewX={image.skewX ?? 0}
          skewY={image.skewY ?? 0}
          // No offset needed - image is positioned relative to group
          // Stroke, shadow, interaction props remain the same
          {/* ... existing props ... */}
        />
      </Group>

      {/* Selection rectangle - shows layout bounds */}
      {isSelected && (
        <Rect
          x={displayX}
          y={displayY}
          width={width}
          height={height}
          stroke="#0ea5e9"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* ... ResizeHandles, DimensionLabel ... */}
    </Fragment>
  );
});
```
  - **Success Criteria:**
    - [ ] Image renders within layout bounds
    - [ ] Cropped portions are not visible
    - [ ] Selection shows layout rectangle
    - [ ] Image can extend beyond layout (crop effect)
  - **Tests:**
    1. Upload image, verify renders correctly
    2. Use properties panel to shrink layout width
    3. Verify right portion of image is cropped (not visible)
    4. Expand layout width beyond image
    5. Verify transparent area appears on right
  - **Edge Cases:**
    - ⚠️ Negative offsets: Image starts outside layout (left/top cropped)
    - ⚠️ Very large offsets: Entire image outside layout (nothing visible)
  - **Rollback:** Revert to original Image rendering without Group clip
  - **Last Verified:** [Date/time]

### 5.1.2 Update Resize Handles for Layout Bounds
- [ ] **Action:** Ensure resize handles use layout bounds (not image bounds)
  - **Why:** Handles should resize visible frame, not underlying image
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/ResizeHandles.tsx`
  - **Implementation Details:**
```typescript
// Verify ResizeHandles uses object.x, object.y, object.width, object.height
// These represent layout bounds for images

// If ResizeHandles needs any changes, update here:
export function ResizeHandles({ object, /* ... */ }: ResizeHandlesProps) {
  // Handles positioned at layout bounds
  const bounds = {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
  };

  // ... render handles at bounds corners/edges ...
}
```
  - **Success Criteria:**
    - [ ] Resize handles appear at layout corners (not image corners)
    - [ ] Dragging handles resizes layout frame
  - **Tests:**
    1. Select image with crop applied
    2. Verify handles appear at layout bounds (visible rectangle)
    3. Drag corner handle, verify layout resizes
  - **Edge Cases:**
    - ⚠️ Image extends beyond layout: Handles still at layout edges
  - **Rollback:** No changes needed if already using object bounds
  - **Last Verified:** [Date/time]

---

# Phase 6: Testing & Polish (Estimated: 3 hours)

**Goal:** Comprehensive testing and bug fixes

**Phase Success Criteria:**
- [ ] All resize modes work correctly (locked, unlocked, crop)
- [ ] Edge cases handled (min dimensions, aspect ratio)
- [ ] No performance issues or visual glitches
- [ ] Export includes crop

---

## 6.1 Integration Testing

### 6.1.1 Test All Resize Modes
- [ ] **Action:** Manually test all resize scenarios
  - **Why:** Ensure all combinations work correctly
  - **Files Modified:** None (testing only)
  - **Tests:**
    1. **Locked mode, edge drag:**
       - Upload square image (400x400)
       - Lock aspect ratio (should be locked by default)
       - Drag right edge right 100px
       - Expected: Width becomes 500px, height becomes 500px
       - Verify: Image scales proportionally

    2. **Unlocked mode, edge drag:**
       - Use same image from test 1
       - Unlock aspect ratio (click lock button)
       - Drag bottom edge down 100px
       - Expected: Height becomes 600px, width stays 500px
       - Verify: Image stretches to fill (not proportional)

    3. **Crop mode, edge drag:**
       - Use same image
       - Hold Cmd/Ctrl and drag right edge left 100px
       - Expected: Width becomes 400px, height stays 600px, image size unchanged
       - Verify: Right portion of image is cropped out

    4. **Crop mode, extend beyond:**
       - Hold Cmd/Ctrl and drag right edge right 100px
       - Expected: Width becomes 500px, transparent area visible on right
       - Verify: Image doesn't scale, just reveals more space

    5. **Corner drag, locked:**
       - Lock aspect ratio
       - Drag bottom-right corner diagonally
       - Expected: Both dimensions scale proportionally
       - Verify: Aspect ratio maintained

    6. **Corner drag, unlocked:**
       - Unlock aspect ratio
       - Drag bottom-right corner diagonally
       - Expected: Both dimensions change independently
       - Verify: Image stretches in both directions

    7. **Properties panel resize:**
       - Change width input to 300
       - Expected: If locked, height changes proportionally
       - Expected: If unlocked, only width changes
  - **Success Criteria:**
    - [ ] All 7 test scenarios pass
    - [ ] No visual glitches or flickering
    - [ ] Dimensions update smoothly
  - **Edge Cases:**
    - ⚠️ Very small drags: Should still work (>1px min)
    - ⚠️ Rapid dragging: No lag or stuttering
  - **Rollback:** N/A (testing phase)
  - **Last Verified:** [Date/time]

### 6.1.2 Test Edge Cases
- [ ] **Action:** Test edge cases and error conditions
  - **Why:** Ensure robustness
  - **Files Modified:** None (testing only)
  - **Tests:**
    1. **Minimum dimensions:**
       - Drag edge to make width < 1px
       - Expected: Clamps to 1px minimum

    2. **Very large crop offset:**
       - Crop so image is entirely outside layout
       - Expected: Blank canvas area (nothing visible)
       - Should still allow dragging back

    3. **Keyboard modifier during drag:**
       - Start dragging edge without Cmd/Ctrl
       - Press Cmd/Ctrl mid-drag
       - Expected: Switches to crop mode mid-drag

    4. **Multi-select:**
       - Select multiple objects including image
       - Verify: Edge resize disabled during multi-select

    5. **Locked image:**
       - Lock image (lock system, not aspect ratio)
       - Verify: No edge cursors, no resize possible

    6. **Export:**
       - Crop an image (Cmd+drag edge)
       - Export canvas
       - Expected: Export shows cropped version only
  - **Success Criteria:**
    - [ ] All edge cases handled gracefully
    - [ ] No console errors
    - [ ] No crashes or freezes
  - **Edge Cases:**
    - ⚠️ Negative dimensions: Should clamp to positive
  - **Rollback:** N/A (testing phase)
  - **Last Verified:** [Date/time]

---

## 6.2 Bug Fixes & Polish

### 6.2.1 Performance Optimization
- [ ] **Action:** Ensure smooth performance during resize
  - **Why:** Prevent lag during edge dragging
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useEdgeResize.ts` (if needed)
  - **Implementation Details:**
```typescript
// Throttle edge resize updates to 16ms (60 FPS)
import { throttle } from 'lodash-es';

const moveEdgeResizeThrottled = throttle((cursorX: number, cursorY: number) => {
  // ... existing logic ...
}, 16);

const moveEdgeResize = useCallback((cursorX: number, cursorY: number) => {
  moveEdgeResizeThrottled(cursorX, cursorY);
}, []);
```
  - **Success Criteria:**
    - [ ] Edge dragging is smooth at 60 FPS
    - [ ] No frame drops during resize
  - **Tests:**
    1. Drag edge rapidly
    2. Open browser DevTools Performance tab
    3. Verify FPS stays above 55-60
  - **Edge Cases:**
    - ⚠️ Large images: May need additional optimization
  - **Rollback:** Remove throttling
  - **Last Verified:** [Date/time]

### 6.2.2 Visual Polish
- [ ] **Action:** Improve visual feedback and styling
  - **Why:** Better user experience
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
// Add subtle visual feedback during crop mode
{isCropModeActive && isSelected && (
  <Text
    text="Crop Mode"
    x={image.x + image.width / 2}
    y={image.y - 20}
    fontSize={12}
    fill="#0ea5e9"
    fontFamily="Inter"
    align="center"
    offsetX={30} // Center text
    listening={false}
  />
)}
```
  - **Success Criteria:**
    - [ ] "Crop Mode" label appears when Cmd/Ctrl held
    - [ ] Label is subtle and non-intrusive
  - **Tests:**
    1. Select image
    2. Hold Cmd/Ctrl
    3. Verify "Crop Mode" label appears above image
    4. Release key, verify label disappears
  - **Edge Cases:**
    - ⚠️ Label positioning: Ensure doesn't overlap other UI
  - **Rollback:** Remove crop mode label
  - **Last Verified:** [Date/time]

---

# Final Integration & Testing

## Integration Tests
- [ ] Test complete feature end-to-end
  - **Scenario 1:** Upload new image → Lock aspect ratio (default) → Resize via edge drag → Verify proportional
  - **Expected:** Image maintains aspect ratio during resize
  - **Test Data:** Any image file (PNG, JPG)

- [ ] Test cropping workflow
  - **Scenario 2:** Upload image → Hold Cmd/Ctrl → Drag edges to crop → Verify image content cropped
  - **Expected:** Layout bounds change, image stays same size, cropped portions not visible
  - **Test Data:** Image with distinct features in corners

- [ ] Test fill mode
  - **Scenario 3:** Upload image → Unlock aspect ratio → Drag edge → Verify stretch
  - **Expected:** Image stretches to fill new layout bounds
  - **Test Data:** Square image stretched to rectangle

## Performance Tests
- [ ] Verify performance requirements
  - **Metric:** FPS during edge drag
  - **Target:** 60 FPS (or above 55 FPS)
  - **How to Test:** Chrome DevTools Performance tab while dragging edge

- [ ] Test with large images
  - **Metric:** Resize responsiveness with 4K image
  - **Target:** No visible lag (<100ms delay)
  - **How to Test:** Upload 4K image, drag edges rapidly

## Cross-Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac only)
  - **Verify:** Cmd key works for crop mode
  - **Verify:** Edge cursors display correctly

---

# Deployment Checklist

- [ ] All tasks completed and verified
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Code reviewed (self-review of all changes)
- [ ] Performance verified (60 FPS)
- [ ] TypeScript compiles without errors
- [ ] Tested in Chrome and Firefox
- [ ] Export functionality works with cropped images
- [ ] Migration tested with existing images
- [ ] Commit message written
- [ ] Ready for production

---

# Appendix

## Related Documentation
- Figma Help: Crop an image - https://help.figma.com/hc/en-us/articles/360040675194-Crop-an-image
- Konva.js Group clipping - https://konvajs.org/docs/clipping/Clipping_Function.html
- Canvas Icons lock system - `_docs/features/lock-system.md`
- Canvas Icons hierarchy system - `_docs/features/hierarchy-system.md`

## Future Enhancements
- Rotate during crop (crop frame rotates with image)
- Crop presets (square, 16:9, 4:3, etc.)
- Crop with visual guides (rule of thirds grid)
- Undo/redo for crop operations
- Animated crop transitions

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| [Date] | Phase 0 | [Hours] | Research and planning |
| [Date] | Phase 1 | [Hours] | Data model updates |
| [Date] | Phase 2 | [Hours] | Properties panel UI |
| [Date] | Phase 3 | [Hours] | Edge hover detection |
| [Date] | Phase 4 | [Hours] | Edge dragging logic |
| [Date] | Phase 5 | [Hours] | Image rendering |
| [Date] | Phase 6 | [Hours] | Testing and polish |
