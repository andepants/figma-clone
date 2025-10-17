# Export Fix Implementation Plan

**Time Estimate:** 3-4 hours
**Dependencies:** None
**Priority:** High

## Problem Statement

The current export system has two critical issues:

1. **Viewport-dependent export**: Export captures what the user is viewing on screen rather than exporting objects based on their actual canvas coordinates
2. **Incorrect bounding box**: Export may not be capturing the exact dimensions of the selected objects

### Root Cause Analysis

The issue stems from how Konva.js `stage.toDataURL()` handles coordinates:

- Our stage has transforms applied: `panX`, `panY` (position), and `zoom` (scale)
- When calling `stage.toDataURL({ x, y, width, height })`, these coordinates are in **stage space** (screen coordinates)
- Our bounding box is calculated in **canvas space** (object coordinates)
- This mismatch causes the export to capture the wrong area

**Current flow:**
```
Objects (canvas coords) → Calculate bbox → stage.toDataURL(bbox) → ❌ Wrong!
```

**Correct flow (Figma-style):**
```
Objects (canvas coords) → Create off-screen render → Export exact objects → ✓ Correct!
```

### How Figma Does It

Figma exports objects **independent of viewport**:
- Export is purely based on object data (position, size, properties)
- Viewport position/zoom has zero effect on export
- Always exports exact bounding box of selected objects
- No background, no extra space, perfect crop

### Konva.js Best Practice

According to Konva.js documentation, viewport-independent export requires:
1. Create temporary off-screen stage/layer
2. Clone objects to temporary container
3. Export from temporary container (no transforms applied)
4. Clean up temporary resources

## Phase 0: Research & Planning

### 0.1 Research - Konva Export Methods ✓

**Completed research:**
- ✓ Konva.js supports `layer.toDataURL()` for layer-specific exports
- ✓ Can clone nodes using `.clone()` method
- ✓ Off-screen stages/layers don't need to be attached to DOM
- ✓ `getClientRect()` method provides viewport-independent bounds
- ✓ Temporary stages need manual cleanup to prevent memory leaks

**Key findings:**
- `stage.toDataURL()` uses stage coordinates (affected by pan/zoom)
- `layer.toDataURL()` can export with absolute coordinates
- Best approach: Create temporary layer, clone objects, export, cleanup

### 0.2 Identify Files to Modify

**Files to update:**
- `src/lib/utils/export.ts` - Main export logic
- `src/features/export/utils/preview.ts` - Preview generation
- `src/lib/utils/geometry.ts` - Bounding box calculation (verify correctness)

**Files to review (no changes expected):**
- `src/features/export/components/ExportModal.tsx` - UI (should work as-is)
- `src/features/canvas-core/components/CanvasStage.tsx` - Stage setup (reference only)

### 0.3 Technical Decisions

**Decision 1: Export Method**
- ✓ Use **off-screen layer approach**
- Why: Most reliable, viewport-independent, matches Figma behavior
- Alternative rejected: Coordinate transformation (complex, error-prone)

**Decision 2: Object Cloning Strategy**
- ✓ Clone each object shape by shape
- Why: Preserves all properties (fill, stroke, shadows, etc.)
- Alternative rejected: Serialize to JSON (loses image data)

**Decision 3: Bounding Box Calculation**
- ✓ Keep existing `calculateBoundingBox()` utility
- Why: Already handles all object types, strokes, shadows correctly
- Need: Verify it's truly viewport-independent (uses object data only)

**Decision 4: Preview Strategy**
- ✓ Use same export logic for preview
- Why: Ensures preview exactly matches final export
- Optimization: Cache preview to avoid regenerating on every scale change

## Phase 1: Core Export Logic Refactor (2-3 hours)

### 1.1 Create Off-Screen Export Utility

#### 1.1.1 Create Off-Screen Stage Helper
- [ ] **Action:** Add `createOffScreenStage()` helper in `export.ts`
  - **Why:** Encapsulate temporary stage creation logic
  - **Implementation Details:**
    ```typescript
    /**
     * Create off-screen Konva stage for viewport-independent export
     * @param width - Stage width (from bounding box)
     * @param height - Stage height (from bounding box)
     * @returns Temporary stage and layer
     */
    function createOffScreenStage(width: number, height: number): {
      stage: Konva.Stage;
      layer: Konva.Layer;
      cleanup: () => void;
    } {
      // Create temporary container (not attached to DOM)
      const container = document.createElement('div');

      // Create stage with exact dimensions needed
      const stage = new Konva.Stage({
        container,
        width,
        height,
      });

      // Create layer for objects
      const layer = new Konva.Layer();
      stage.add(layer);

      // Cleanup function to prevent memory leaks
      const cleanup = () => {
        stage.destroy();
        container.remove();
      };

      return { stage, layer, cleanup };
    }
    ```
  - **Success Criteria:**
    - [ ] Function creates stage without DOM attachment
    - [ ] Returns stage, layer, and cleanup function
    - [ ] No memory leaks (verified with Chrome DevTools)
  - **Tests:**
    1. Call `createOffScreenStage(800, 600)`
    2. Verify stage dimensions: `stage.width() === 800`, `stage.height() === 600`
    3. Call `cleanup()`, verify stage is destroyed
    4. Check DevTools: no orphaned DOM nodes
  - **Edge Cases:**
    - ⚠️ Large dimensions (10000x10000): May hit canvas size limits, validate before creating

#### 1.1.2 Create Object Cloning Helper
- [ ] **Action:** Add `cloneObjectToLayer()` helper in `export.ts`
  - **Why:** Safely clone canvas objects to off-screen layer
  - **Files Modified:**
    - Update: `src/lib/utils/export.ts`
  - **Implementation Details:**
    ```typescript
    /**
     * Clone a canvas object to a Konva layer
     * Handles all object types: rectangle, circle, text, line, image
     * Positions relative to bounding box origin (0, 0)
     *
     * @param obj - Canvas object to clone
     * @param layer - Target Konva layer
     * @param bboxX - Bounding box x offset
     * @param bboxY - Bounding box y offset
     */
    function cloneObjectToLayer(
      obj: CanvasObject,
      layer: Konva.Layer,
      bboxX: number,
      bboxY: number
    ): void {
      // Skip groups (no visual representation)
      if (obj.type === 'group') return;

      // Skip hidden objects if visible === false
      // DECISION: Actually, include hidden objects (Figma behavior)
      // if (obj.visible === false) return;

      let shape: Konva.Shape;

      if (obj.type === 'rectangle') {
        shape = new Konva.Rect({
          x: obj.x - bboxX,
          y: obj.y - bboxY,
          width: obj.width,
          height: obj.height,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          cornerRadius: obj.cornerRadius,
          // ... all other properties
        });
      } else if (obj.type === 'circle') {
        shape = new Konva.Circle({
          x: obj.x - bboxX,
          y: obj.y - bboxY,
          radius: obj.radius,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          // ... all other properties
        });
      } else if (obj.type === 'text') {
        shape = new Konva.Text({
          x: obj.x - bboxX,
          y: obj.y - bboxY,
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fill: obj.fill,
          // ... all other properties
        });
      } else if (obj.type === 'line') {
        shape = new Konva.Line({
          x: obj.x - bboxX,
          y: obj.y - bboxY,
          points: obj.points,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          // ... all other properties
        });
      } else if (obj.type === 'image') {
        // Special handling for images (need to load image data)
        const imageNode = new Image();
        imageNode.src = obj.src;
        shape = new Konva.Image({
          x: obj.x - bboxX,
          y: obj.y - bboxY,
          image: imageNode,
          width: obj.width,
          height: obj.height,
          // ... all other properties
        });
      } else {
        return; // Unknown type, skip
      }

      // Apply common properties (shadows, opacity, etc.)
      if (obj.shadowEnabled !== false && obj.shadowColor) {
        shape.shadowColor(obj.shadowColor);
        shape.shadowBlur(obj.shadowBlur || 0);
        shape.shadowOffsetX(obj.shadowOffsetX || 0);
        shape.shadowOffsetY(obj.shadowOffsetY || 0);
        shape.shadowOpacity(obj.shadowOpacity ?? 1);
      }

      if (obj.opacity !== undefined) {
        shape.opacity(obj.opacity);
      }

      layer.add(shape);
    }
    ```
  - **Success Criteria:**
    - [ ] All object types cloned correctly
    - [ ] Positions adjusted relative to bounding box origin
    - [ ] All visual properties preserved (fill, stroke, shadow)
    - [ ] Images load correctly in cloned shapes
  - **Tests:**
    1. Create rectangle at (100, 100), bbox at (50, 50)
    2. Clone to layer: verify shape position is (50, 50)
    3. Verify all properties match original (fill, stroke, etc.)
  - **Edge Cases:**
    - ⚠️ Images not loaded yet: Add `onload` handler for image objects
    - ⚠️ Missing properties: Use sensible defaults

### 1.2 Refactor Main Export Function

#### 1.2.1 Update exportCanvasToPNG() to Use Off-Screen Export
- [ ] **Action:** Refactor `exportCanvasToPNG()` in `export.ts`
  - **Why:** Eliminate viewport dependency, ensure correct bounding box export
  - **Files Modified:**
    - Update: `src/lib/utils/export.ts`
  - **Implementation Details:**
    ```typescript
    export async function exportCanvasToPNG(
      stageRef: React.RefObject<Konva.Stage | null>, // Keep for compatibility, but won't use toDataURL
      selectedObjects: CanvasObject[],
      allObjects: CanvasObject[],
      options: ExportOptions = { format: 'png', scale: 2, scope: 'selection' }
    ): Promise<void> {
      const isDev = import.meta.env.DEV;

      // Existing validation logic (keep as-is)
      // ...

      // Determine objects to export (keep as-is)
      let objectsToExport: CanvasObject[];
      if (options.scope === 'selection') {
        objectsToExport = selectedObjects.length > 0 ? selectedObjects : allObjects;
      } else {
        objectsToExport = allObjects;
      }

      // Expand groups (keep as-is)
      // ...

      // Filter visible objects (keep as-is)
      // ...

      // Calculate bounding box (keep as-is)
      const bbox = calculateBoundingBox(visibleObjects, allObjects);

      // Validate bbox (keep as-is)
      // ...

      // === NEW LOGIC STARTS HERE ===

      // Create off-screen stage with exact bounding box dimensions
      const { stage: offScreenStage, layer: offScreenLayer, cleanup } =
        createOffScreenStage(bbox.width, bbox.height);

      try {
        // Clone all visible objects to off-screen layer
        for (const obj of visibleObjects) {
          cloneObjectToLayer(obj, offScreenLayer, bbox.x, bbox.y);
        }

        // Wait for images to load (if any image objects present)
        const hasImages = visibleObjects.some(obj => obj.type === 'image');
        if (hasImages) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
        }

        // Force layer draw to ensure all shapes are rendered
        offScreenLayer.batchDraw();

        // Export from off-screen stage
        // Since stage has no transforms, export entire stage
        const dataURL = offScreenStage.toDataURL({
          pixelRatio: options.scale,
          mimeType: 'image/png',
        });

        // Generate filename and trigger download (keep as-is)
        const now = new Date();
        const timestamp = now
          .toISOString()
          .slice(0, 19)
          .replace('T', '-')
          .replace(/:/g, '-');
        const filename = `collabcanvas-${timestamp}.png`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (isDev) {
          console.log('=== EXPORT COMPLETE ===');
          console.log('Successfully exported', visibleObjects.length, 'objects');
          console.log('Bounding box:', bbox);
          console.log('Export dimensions:', bbox.width, 'x', bbox.height);
          console.log('Export scale:', options.scale + 'x');
        }
      } finally {
        // Always cleanup, even if export fails
        cleanup();
      }
    }
    ```
  - **Success Criteria:**
    - [ ] Export works regardless of viewport position
    - [ ] Export captures exact bounding box of objects
    - [ ] Export includes all object properties (fill, stroke, shadow)
    - [ ] No memory leaks from off-screen stage
  - **Tests:**
    1. Create rectangle at (5000, 5000) far from viewport
    2. Select rectangle, trigger export
    3. Verify exported PNG shows complete rectangle with no extra space
    4. Pan/zoom canvas to different position
    5. Export again, verify identical output
  - **Edge Cases:**
    - ⚠️ Images not loaded: Add proper async/await for image loading
    - ⚠️ Export failure: Ensure cleanup() runs in finally block
    - ⚠️ Very large exports: Validate dimensions before creating stage

## Phase 2: Preview System Update (1 hour)

### 2.1 Update Preview Generation

#### 2.1.1 Refactor generateExportPreview()
- [ ] **Action:** Update `generateExportPreview()` in `preview.ts` to use same off-screen logic
  - **Why:** Ensure preview exactly matches export output
  - **Files Modified:**
    - Update: `src/features/export/utils/preview.ts`
  - **Implementation Details:**
    ```typescript
    export function generateExportPreview(
      stageRef: React.RefObject<Konva.Stage | null>,
      objectsToExport: CanvasObject[],
      allObjects: CanvasObject[],
      scale: number = 1
    ): string | null {
      const isDev = import.meta.env.DEV;

      try {
        // Same expansion logic as export (keep as-is)
        // ...

        // Same bounding box logic as export (keep as-is)
        const bbox = calculateBoundingBox(visibleObjects, allObjects);

        // === NEW LOGIC: Use off-screen rendering ===

        // Import helpers from export.ts (or extract to shared utils)
        const { stage: offScreenStage, layer: offScreenLayer, cleanup } =
          createOffScreenStage(bbox.width, bbox.height);

        try {
          // Clone objects to off-screen layer
          for (const obj of visibleObjects) {
            cloneObjectToLayer(obj, offScreenLayer, bbox.x, bbox.y);
          }

          // Wait briefly for images if needed
          const hasImages = visibleObjects.some(obj => obj.type === 'image');
          if (hasImages) {
            // For preview, we can't await, so just draw what we have
            // Images will appear in actual export
          }

          offScreenLayer.batchDraw();

          // Generate preview
          const dataURL = offScreenStage.toDataURL({
            pixelRatio: scale,
            mimeType: 'image/png',
          });

          return dataURL;
        } finally {
          cleanup();
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
        return null;
      }
    }
    ```
  - **Success Criteria:**
    - [ ] Preview matches export output exactly
    - [ ] Preview generation is viewport-independent
    - [ ] No memory leaks from preview generation
  - **Tests:**
    1. Select objects, open export modal
    2. Verify preview shows correct objects with tight bounding box
    3. Change resolution (1x/2x/3x), verify preview quality updates
    4. Pan/zoom main canvas, verify preview stays identical
  - **Edge Cases:**
    - ⚠️ Preview generation failure: Return null, show fallback UI

### 2.2 Extract Shared Utilities

#### 2.2.1 Create Shared Export Utils Module
- [ ] **Action:** Extract `createOffScreenStage()` and `cloneObjectToLayer()` to shared module
  - **Why:** Avoid code duplication between export and preview
  - **Files Modified:**
    - Create: `src/features/export/utils/offscreen.ts`
    - Update: `src/lib/utils/export.ts` (import from offscreen.ts)
    - Update: `src/features/export/utils/preview.ts` (import from offscreen.ts)
  - **Implementation Details:**
    ```typescript
    // src/features/export/utils/offscreen.ts
    /**
     * Off-screen rendering utilities for viewport-independent export
     */

    export { createOffScreenStage };
    export { cloneObjectToLayer };
    // ... move implementations here
    ```
  - **Success Criteria:**
    - [ ] Both export and preview import from offscreen.ts
    - [ ] No code duplication
    - [ ] All tests still pass
  - **Tests:**
    1. Run export: verify works as before
    2. Generate preview: verify works as before
    3. Check imports: both files use shared utilities

## Phase 3: Verification & Testing (30-45 min)

### 3.1 Manual Testing

#### 3.1.1 Test Viewport Independence
- [ ] **Action:** Verify export works regardless of viewport position/zoom
  - **Tests:**
    1. Create objects at (0, 0) - top left of canvas
    2. Pan viewport far away (5000, 5000)
    3. Zoom in to 3x
    4. Export objects
    5. Verify PNG shows objects with correct dimensions and no cropping
    6. Reset viewport to (0, 0), zoom to 1x
    7. Export again, verify identical output
  - **Success Criteria:**
    - [ ] Export output identical regardless of viewport
    - [ ] Bounding box tight around objects

#### 3.1.2 Test All Object Types
- [ ] **Action:** Verify all object types export correctly
  - **Tests:**
    1. Create one of each: rectangle, circle, text, line, image
    2. Apply properties: fill colors, strokes, shadows
    3. Select all, export
    4. Verify PNG shows all objects with all properties preserved
  - **Success Criteria:**
    - [ ] All shapes visible in export
    - [ ] All properties correct (colors, strokes, shadows)
    - [ ] Image objects load and display

#### 3.1.3 Test Groups
- [ ] **Action:** Verify grouped objects export correctly
  - **Tests:**
    1. Create 3 rectangles
    2. Group them (Cmd+G)
    3. Select group, export
    4. Verify PNG shows all 3 rectangles (group expanded)
  - **Success Criteria:**
    - [ ] Group descendants all exported
    - [ ] Bounding box includes all descendants

#### 3.1.4 Test Edge Cases
- [ ] **Action:** Test edge cases and error conditions
  - **Tests:**
    1. Export with no selection, no objects → Error message
    2. Export single pixel-sized object → Very small PNG
    3. Export 100 objects → Large PNG, no performance issues
    4. Export with large shadows → Shadow included in bbox
    5. Export with thick strokes → Stroke included in bbox
  - **Success Criteria:**
    - [ ] All edge cases handled gracefully
    - [ ] No crashes or memory leaks

### 3.2 Performance Testing

#### 3.2.1 Test Export Performance
- [ ] **Action:** Verify export performance is acceptable
  - **Tests:**
    1. Export 10 objects at 2x scale → < 1 second
    2. Export 100 objects at 2x scale → < 3 seconds
    3. Export 10 objects at 3x scale → < 2 seconds
  - **Success Criteria:**
    - [ ] No noticeable lag during export
    - [ ] Progress indicator shown if > 500ms

#### 3.2.2 Test Memory Usage
- [ ] **Action:** Verify no memory leaks
  - **Tests:**
    1. Open Chrome DevTools → Memory tab
    2. Take heap snapshot
    3. Export 10 times
    4. Take another heap snapshot
    5. Compare: should be no significant increase
  - **Success Criteria:**
    - [ ] No orphaned DOM nodes
    - [ ] No retained Konva stages
    - [ ] Memory usage stable across multiple exports

## Phase 4: Documentation (15-30 min)

### 4.1 Update Documentation

#### 4.1.1 Update CLAUDE.md Export Section
- [ ] **Action:** Document new export behavior
  - **Files Modified:**
    - Update: `CLAUDE.md` (Export System section)
  - **Updates:**
    - Add note about viewport-independent export
    - Explain off-screen rendering approach
    - Document that export matches Figma behavior

#### 4.1.2 Add JSDoc Comments
- [ ] **Action:** Ensure all new functions have JSDoc
  - **Files Modified:**
    - Update: `src/features/export/utils/offscreen.ts`
  - **Success Criteria:**
    - [ ] All functions have JSDoc headers
    - [ ] All parameters documented
    - [ ] All edge cases noted

## Rollback Strategy

If export breaks after changes:

1. **Immediate rollback:**
   ```bash
   git checkout HEAD~1 -- src/lib/utils/export.ts
   git checkout HEAD~1 -- src/features/export/utils/preview.ts
   ```

2. **Verify rollback:**
   - Test export with current main branch code
   - Confirm export works (even if viewport-dependent)

3. **Debug new implementation:**
   - Check browser console for errors
   - Verify off-screen stage creation
   - Check object cloning logic

## Success Metrics

- [ ] Export works identically from any viewport position/zoom
- [ ] Export captures exact bounding box (no extra space)
- [ ] All object types export correctly with all properties
- [ ] Export matches preview exactly
- [ ] No memory leaks (verified with DevTools)
- [ ] Performance acceptable (< 3s for 100 objects at 2x)

## Notes

- This is a critical fix that brings export behavior in line with Figma
- The off-screen rendering approach is more complex but eliminates viewport dependency entirely
- Preview and export share logic, so preview will also be viewport-independent
- Proper cleanup is essential to prevent memory leaks
