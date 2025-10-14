# Circle Resize Testing Checklist

**Date:** 2025-10-14
**Feature:** Circle resize handles with real-time collaboration
**Phase:** 5.2 - Make Resize Handles Reusable

---

## Implementation Status

✅ **Completed:**
- Generic `getBounds()` function handles circle coordinate conversion
- `useResize` hook converts bounds back to center point + radius
- ResizeHandles component integrated into Circle component
- JSDoc documentation added with examples

---

## Manual Testing Checklist

### Test 1: Basic Circle Resize
- [ ] Create circle on canvas (click circle tool, click/drag on canvas)
- [ ] Select circle → 4 corner handles appear
- [ ] Hover handle → tooltip shows directional arrow (↖ ↗ ↙ ↘)
- [ ] Drag NW handle → circle resizes from top-left
- [ ] Drag NE handle → circle resizes from top-right
- [ ] Drag SW handle → circle resizes from bottom-left
- [ ] Drag SE handle → circle resizes from bottom-right
- [ ] Verify opposite corner stays anchored (doesn't move)
- [ ] Circle maintains circular shape (doesn't become oval)

### Test 2: Circle Properties
- [ ] Check that circle uses center point (x, y) not top-left
- [ ] Verify radius updates correctly (not width/height)
- [ ] Handles positioned at bounding box corners (not circle edge)
- [ ] Circle renders correctly after resize

### Test 3: Minimum Size Constraint
- [ ] Drag handle to make circle very small
- [ ] Verify minimum size enforced (10x10 = 5px radius minimum)
- [ ] Circle never becomes negative size
- [ ] Handles still visible at minimum size

### Test 4: Keyboard Modifiers
- [ ] Hold Shift + drag handle → aspect ratio locked
- [ ] Circle stays perfectly circular (not oval)
- [ ] Hold Alt + drag → resize from center
- [ ] Center point stays fixed while resizing
- [ ] Shift + Alt together → both effects work

### Test 5: Visual Feedback
- [ ] Handles appear at correct positions
- [ ] Handles move smoothly during resize
- [ ] No jumps or glitches in position
- [ ] Cursor changes to resize cursor (nwse-resize, nesw-resize)
- [ ] Selection border updates during resize

### Test 6: Compare with Rectangle
- [ ] Create rectangle and circle side by side
- [ ] Resize both shapes
- [ ] Verify both work correctly
- [ ] Verify rectangle uses top-left corner, circle uses center

### Test 7: Edge Cases
- [ ] Resize circle near canvas edge → handles visible
- [ ] Resize at different zoom levels (zoom in/out)
- [ ] Resize while canvas is panned
- [ ] Rapid handle switching (NW → SE → NW)
- [ ] Deselect → handles disappear
- [ ] Select again → handles reappear at new corners

---

## Known Issues

None yet - testing needed!

---

## Next Steps

After completing manual testing above:
1. If all tests pass → Mark Phase 5.2 complete
2. If issues found → Document bugs and fix them
3. Move to Phase 6: Real-Time Collaboration (remote resize overlays)
