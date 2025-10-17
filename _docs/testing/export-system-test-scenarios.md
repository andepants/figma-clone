# Export System Test Scenarios

**Last Updated:** 2025-10-17
**Purpose:** Comprehensive test scenarios to verify export preview and export functionality with images, groups, and edge cases.

---

## Test Environment Setup

Before running tests, ensure:
- ✅ Canvas has at least 3 different image shapes loaded
- ✅ Canvas has at least 1 group containing images
- ✅ Canvas has nested groups (group within group)
- ✅ Some objects are hidden (`visible: false`)
- ✅ DevTools console is open to monitor errors

---

## Test Category 1: Image Export

### Test 1.1: Single Image Export
**Setup:**
1. Upload/create a single image on canvas
2. Wait for image to fully load (check preview shows image)
3. Select the image

**Actions:**
1. Open export modal (Shift+Cmd+E)
2. Verify preview shows the image clearly
3. Change resolution to 1x, 2x, 3x
4. Verify preview updates at each scale

**Expected Results:**
- ✅ Preview shows image at all scales
- ✅ Preview quality matches scale (2x/3x sharper than 1x)
- ✅ Export downloads PNG with correct image
- ✅ No console errors

**Pass/Fail:** ___

---

### Test 1.2: Multiple Images Export
**Setup:**
1. Add 3 different images to canvas
2. Select all 3 images (Shift+click or drag select)

**Actions:**
1. Open export modal
2. Verify preview shows all 3 images in correct positions
3. Export at 2x resolution

**Expected Results:**
- ✅ Preview shows all 3 images with correct spacing
- ✅ Bounding box is tight around all images
- ✅ Export contains all 3 images
- ✅ Transparent background between images

**Pass/Fail:** ___

---

### Test 1.3: Image Loading Race Condition
**Setup:**
1. Clear browser cache (to force fresh image load)
2. Refresh page
3. Immediately after page load, add a large image (>2MB)

**Actions:**
1. **Immediately** select the image and open export modal
2. Check if preview shows loading state or blank
3. Wait 2 seconds, check preview again
4. Export the image

**Expected Results:**
- ✅ If image not loaded: Preview shows "Generating preview..." or blank
- ✅ After load: Preview updates to show image
- ✅ Export waits for image to load (or warns user)
- ⚠️ **Known Issue:** May export blank if image not loaded yet

**Pass/Fail:** ___

---

## Test Category 2: Group Export

### Test 2.1: Simple Group with Images
**Setup:**
1. Create 2 rectangles and 1 image
2. Select all 3 objects
3. Group them (Cmd+G)
4. Select the group

**Actions:**
1. Open export modal
2. Verify preview shows all group contents (2 rects + 1 image)
3. Export at 2x

**Expected Results:**
- ✅ Preview shows ALL group children (not just group bounds)
- ✅ Image renders correctly within group
- ✅ Export includes all group descendants
- ✅ Group object itself is NOT visible (no visual representation)

**Pass/Fail:** ___

---

### Test 2.2: Nested Groups with Images
**Setup:**
1. Create Group A containing: 1 image + 1 rectangle
2. Create Group B containing: Group A + 1 circle
3. Select Group B (outer group)

**Actions:**
1. Open export modal
2. Verify preview shows: image, rectangle, circle (all descendants)
3. Check console for `getAllDescendantIds` calls
4. Export at 2x

**Expected Results:**
- ✅ Preview recursively expands ALL nested groups
- ✅ All descendants render (image from Group A visible)
- ✅ Export includes: image, rectangle, circle
- ✅ No group objects in export (only visual shapes)
- ✅ Console shows: `getAllDescendantIds` called for Group B and Group A

**Pass/Fail:** ___

---

### Test 2.3: Group with Hidden Image
**Setup:**
1. Create group with 2 images
2. Hide one image (set `visible: false` in properties or via store)
3. Group should appear to have only 1 visible image on canvas
4. Select the group

**Actions:**
1. Open export modal
2. Check preview - should show BOTH images (including hidden one)
3. Export at 2x
4. Open exported PNG in image viewer

**Expected Results:**
- ✅ Preview shows hidden image (Figma behavior)
- ✅ Export includes hidden image
- ⚠️ **Note:** This is intentional - hidden objects are included in exports
- ✅ If you don't want it exported, delete it (don't just hide)

**Pass/Fail:** ___

---

## Test Category 3: Group ID Changes

### Test 3.1: Group Descendant ID Tracking
**Setup:**
1. Create a deep hierarchy:
   - Group "A" (id: group-a)
     - Image "1" (id: img-1, parentId: group-a)
     - Group "B" (id: group-b, parentId: group-a)
       - Image "2" (id: img-2, parentId: group-b)
       - Rectangle "3" (id: rect-3, parentId: group-b)

**Actions:**
1. Open DevTools Console
2. Select Group "A"
3. Open export modal
4. In console, run:
   ```js
   // Check if getAllDescendantIds finds all descendants
   import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';
   const descendants = getAllDescendantIds('group-a', objects);
   console.log('Descendants:', descendants);
   // Should show: ['img-1', 'group-b', 'img-2', 'rect-3']
   ```

**Expected Results:**
- ✅ Console shows all 4 descendants: img-1, group-b, img-2, rect-3
- ✅ Preview shows 2 images + 1 rectangle (3 visual objects)
- ✅ Export includes all 3 visual objects
- ✅ Groups (A and B) are not in export (filtered out)

**Pass/Fail:** ___

---

## Test Category 4: Edge Cases

### Test 4.1: Empty Group
**Setup:**
1. Create a group
2. Remove all children (delete or move out)
3. Select empty group

**Actions:**
1. Try to open export modal

**Expected Results:**
- ✅ Modal shows "No selection" or similar message
- ✅ Export button disabled
- ✅ Or: Modal shows but export fails with helpful error

**Pass/Fail:** ___

---

### Test 4.2: Very Large Image (Memory Test)
**Setup:**
1. Upload a very large image (5000x5000px or larger)
2. Select the image

**Actions:**
1. Open export modal
2. Try 3x resolution export
3. Monitor browser memory usage

**Expected Results:**
- ✅ Preview generates (may be slow)
- ✅ Export succeeds (may take 5-10 seconds)
- ✅ No browser crash or freeze
- ✅ imagePool evicts old images if memory limit exceeded
- ⚠️ **Acceptable:** May show loading state for several seconds

**Pass/Fail:** ___

---

### Test 4.3: Mixed Selection (Group + Individual Objects)
**Setup:**
1. Create Group A with 2 rectangles
2. Create standalone Image B (not in any group)
3. Select BOTH Group A and Image B

**Actions:**
1. Open export modal
2. Verify preview shows: 2 rectangles (from Group A) + Image B

**Expected Results:**
- ✅ Preview includes all selected items
- ✅ Group descendants are expanded (2 rects visible)
- ✅ Individual image B is included
- ✅ Export contains all 3 visual objects

**Pass/Fail:** ___

---

### Test 4.4: Dimension Labels Not in Export
**Setup:**
1. Create any shape (rectangle, circle, etc.)
2. Select it (dimension label should appear on canvas)
3. Verify dimension label shows (e.g., "200 × 100")

**Actions:**
1. Open export modal with shape selected
2. Check preview - dimension label should NOT appear
3. Export the shape

**Expected Results:**
- ✅ Canvas shows dimension label (UI overlay)
- ✅ Preview does NOT show dimension label
- ✅ Export PNG does NOT include dimension label
- ✅ Console shows: dimension labels hidden during export (lines 179-183)

**Pass/Fail:** ___

---

### Test 4.5: Background Layer Not in Export
**Setup:**
1. Ensure canvas has background grid/pattern visible
2. Select any object

**Actions:**
1. Open export modal
2. Preview should have transparent background (checkerboard in viewer)
3. Export PNG

**Expected Results:**
- ✅ Canvas background is NOT in preview
- ✅ Export has transparent background
- ✅ Only objects layer is exported
- ✅ Console shows: background layer hidden (line 176)

**Pass/Fail:** ___

---

## Test Category 5: Scale & Quality

### Test 5.1: Scale Comparison
**Setup:**
1. Create a small text shape (font size 12px)
2. Select it

**Actions:**
1. Export at 1x, save as "text-1x.png"
2. Export at 2x, save as "text-2x.png"
3. Export at 3x, save as "text-3x.png"
4. Open all 3 PNGs and zoom in 400%

**Expected Results:**
- ✅ 1x: Text is readable but pixelated when zoomed
- ✅ 2x: Text is crisp and sharp when zoomed (recommended quality)
- ✅ 3x: Text is ultra-sharp, file size larger
- ✅ File sizes: 1x < 2x < 3x (roughly 1x → 2x = 4x file size, 2x → 3x = 2.25x file size)

**Pass/Fail:** ___

---

## Test Category 6: Real-time Preview Updates

### Test 6.1: Preview Updates with Scale Change
**Setup:**
1. Select any object with complex details (image or text)
2. Open export modal

**Actions:**
1. Click 1x resolution
2. Wait 1 second, observe preview
3. Click 2x resolution
4. Wait 1 second, observe preview
5. Click 3x resolution
6. Observe preview

**Expected Results:**
- ✅ Preview regenerates each time scale changes
- ✅ Preview quality visibly improves from 1x → 2x → 3x
- ✅ No "flash" or broken images during regeneration
- ✅ useEffect dependency includes `options.scale` (line 189)

**Pass/Fail:** ___

---

## Summary Checklist

After completing all tests, verify:

- [ ] All image exports work correctly
- [ ] All group exports expand descendants properly
- [ ] Nested groups work recursively
- [ ] Hidden images are included (Figma behavior)
- [ ] Dimension labels are excluded from exports
- [ ] Background layer is excluded from exports
- [ ] Scale changes update preview correctly
- [ ] No console errors during any export
- [ ] imagePool caching works (check cache hits in console)
- [ ] Memory usage is reasonable for large exports

---

## Known Issues & Expected Behavior

### ✅ Expected (Not Bugs)

1. **Hidden objects are included in exports**
   - This matches Figma behavior
   - If you don't want it exported, delete it

2. **Preview may not show for very large images**
   - If image hasn't loaded yet, preview is blank
   - Wait a few seconds for image to load from imagePool

3. **Large exports (3x resolution, many objects) are slow**
   - This is expected - rendering at 9x pixel count
   - Browser may freeze for 1-2 seconds (acceptable)

### ⚠️ Potential Bugs (Report These)

1. **Image shows on canvas but not in export**
   - Check: Is image in imagePool? (Run `imagePool.has(imageSrc)`)
   - Possible cause: Image failed to load, check console errors

2. **Group export missing descendants**
   - Check: Run `getAllDescendantIds(groupId, objects)` in console
   - Verify all children have correct `parentId`

3. **Preview doesn't update when scale changes**
   - Check: useEffect dependency array in ExportModal (line 189)
   - Should include: `options.scale`

---

## Debugging Commands

Open DevTools Console and run these for debugging:

```javascript
// Check if image is cached
import { imagePool } from '@/lib/utils/imagePool';
console.log('Image cached?', imagePool.has('your-image-src-here'));
console.log('Cache size:', imagePool.size);

// Check group descendants
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';
const descendants = getAllDescendantIds('group-id-here', objects);
console.log('Descendants:', descendants);

// Check object visibility
const obj = objects.find(o => o.id === 'object-id-here');
console.log('Visible?', obj.visible !== false);
console.log('Type:', obj.type);
console.log('ParentId:', obj.parentId);
```

---

## Performance Benchmarks

Expected performance (approximate):

| Scenario | Expected Time | Acceptable Range |
|----------|---------------|------------------|
| Preview generation (10 objects, 1x) | < 100ms | 50-200ms |
| Preview generation (10 objects, 2x) | < 200ms | 100-400ms |
| Preview generation (10 objects, 3x) | < 500ms | 200-800ms |
| Export (50 objects, 2x) | < 1000ms | 500-2000ms |
| Export (200 objects, 2x) | < 5000ms | 2000-8000ms |

If times exceed acceptable range:
- Check browser DevTools Performance tab
- Look for long tasks in main thread
- Check if imagePool is thrashing (too many evictions)
