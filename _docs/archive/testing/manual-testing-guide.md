# Manual Testing Guide - Phase 6

**Development Server:** http://localhost:5181/
**Purpose:** Step-by-step manual testing of all Left Sidebar Enhancements features

---

## Prerequisites

1. ✅ Development server running on http://localhost:5181/
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Keep Console tab open to monitor warnings/errors
4. Clear browser cache if needed (Cmd+Shift+R)

---

## Testing Workflow

For each test:
1. ✅ Follow steps exactly as written
2. ✅ Verify expected behavior
3. ✅ Document actual behavior in test report
4. ❌ If bug found: Screenshot + describe in Bug section
5. ✅ Check off test in `/Users/andre/coding/figma-clone/_docs/testing/phase-6-test-report.md`

---

## Test Suite 1: Full-Item Dragging (Phase 1)

### Setup
1. Open http://localhost:5181/
2. Open layers panel (click layers icon top-left if closed)
3. Create 5 rectangles using toolbar

### Test 1.1: Drag from icon area ✅
**Steps:**
1. Hover over Rectangle 1 (bottom of list)
2. Click and hold on the square icon (left side)
3. Drag up to top of list
4. Release

**Expected:** Rectangle 1 moves to top (front of canvas)
**Check:** ✅ Smooth animation, ✅ z-order correct on canvas

### Test 1.2: Drag from name area ✅
**Steps:**
1. Click and hold on "Rectangle 2" text
2. Drag down to bottom of list
3. Release

**Expected:** Rectangle 2 moves to bottom (back of canvas)
**Check:** ✅ Text doesn't get selected during drag

### Test 1.3: Drag from padding area ✅
**Steps:**
1. Click and hold on empty space to right of layer name
2. Drag to middle position
3. Release

**Expected:** Layer reorders
**Check:** ✅ Works from any part of layer item

### Test 1.4: Rename input doesn't trigger drag ✅
**Steps:**
1. Double-click Rectangle 3 to rename
2. Click inside input field
3. Try to drag mouse
4. Type "My Rectangle"
5. Press Enter

**Expected:** No drag starts, text input works normally
**Check:** ✅ Can select text, ✅ Can type, ✅ Save works

### Test 1.5: Eye icon doesn't trigger drag ✅
**Steps:**
1. Hover Rectangle 4
2. Click eye icon (right side)

**Expected:** Visibility toggles, no drag starts
**Check:** ✅ Object hidden on canvas, ✅ Layer grayed out

### Test 1.6: Lock icon doesn't trigger drag ✅
**Steps:**
1. Hover Rectangle 5
2. Click unlock icon (appears on hover, left of eye)
3. Lock icon now always visible

**Expected:** Lock toggles, no drag starts, layer slightly dimmed
**Check:** ✅ Lock icon shows, ✅ Layer dimmed (opacity-60)

**✅ SUITE 1 COMPLETE - Document results in test report**

---

## Test Suite 2: Hierarchy System (Phase 2)

### Setup
1. Clear canvas (select all, delete)
2. Create 1 large rectangle (Frame 1)
3. Create 2 smaller rectangles (Rect 2, Rect 3)
4. Create 1 circle (Circle 4)

### Test 2.1: Create parent-child via drag-drop ✅
**Steps:**
1. Drag Rect 2 onto middle of Frame 1
2. Watch for blue box indicator around Frame 1
3. Drop

**Expected:** Rect 2 indented 16px under Frame 1
**Check:** ✅ Indentation correct, ✅ Hierarchy arrow appears on Frame 1

### Test 2.2: Collapse parent hides children ✅
**Steps:**
1. Click down-facing arrow next to Frame 1
2. Arrow rotates to right-facing

**Expected:** Rect 2 disappears from panel, Frame 1 remains
**Check:** ✅ Smooth rotation animation (150ms), ✅ Child hidden

### Test 2.3: Expand parent shows children ✅
**Steps:**
1. Click right-facing arrow
2. Arrow rotates to down-facing

**Expected:** Rect 2 reappears with indentation
**Check:** ✅ Smooth animation, ✅ Child visible

### Test 2.4: Select parent selects all children ✅
**Steps:**
1. Click Frame 1 in panel
2. Check canvas

**Expected:** Blue selection boxes on Frame 1 AND Rect 2
**Check:** ✅ Both highlighted in panel, ✅ Both selected on canvas

### Test 2.5: Deep nesting (3+ levels) ✅
**Steps:**
1. Drag Rect 3 onto middle of Rect 2 (Frame 1's child)
2. Rect 3 becomes grandchild
3. Drag Circle 4 onto middle of Rect 3
4. Circle 4 becomes great-grandchild

**Expected:**
- Frame 1 (depth 0, no indent)
- └─ Rect 2 (depth 1, 16px indent)
-    └─ Rect 3 (depth 2, 32px indent)
-       └─ Circle 4 (depth 3, 48px indent)

**Check:** ✅ All indents correct (measure with browser DevTools)

### Test 2.6: Prevent circular references ✅
**Steps:**
1. Try to drag Frame 1 onto its own child Rect 2
2. Try to drag Frame 1 onto its grandchild Rect 3

**Expected:** Drop not allowed, console warning shown
**Check:** ✅ Console shows "Cannot move object to its own descendant"

### Test 2.7: Reorder siblings ✅
**Steps:**
1. Create Text 5 at root level (sibling of Frame 1)
2. Drag Text 5 to TOP edge of Frame 1
3. Watch for blue line above Frame 1
4. Drop

**Expected:** Text 5 moves above Frame 1 (still root level, no indent)
**Check:** ✅ Blue line indicator, ✅ Remains at depth 0

### Test 2.8: Reorder children ✅
**Steps:**
1. Under Frame 1, create another root rectangle (Rect 6)
2. Drag Rect 6 onto middle of Frame 1 (make child)
3. Now Frame 1 has 2 children: Rect 2, Rect 6
4. Drag Rect 6 to bottom edge of Rect 2

**Expected:** Rect 6 reorders below Rect 2 (same depth 1)
**Check:** ✅ Both at 16px indent, ✅ Order changed

**✅ SUITE 2 COMPLETE - Document results in test report**

---

## Test Suite 3: Shift-Click Range Selection (Phase 3)

### Setup
1. Clear canvas
2. Create 7 rectangles (Rect 1-7)

### Test 3.1: Basic range selection (downward) ✅
**Steps:**
1. Click Rect 1 (top)
2. Hold Shift
3. Click Rect 5
4. Release Shift

**Expected:** Rect 1, 2, 3, 4, 5 all selected (blue highlights)
**Check:** ✅ All 5 highlighted in panel, ✅ All 5 selected on canvas

### Test 3.2: Range selection (upward) ✅
**Steps:**
1. Click Rect 7 (bottom)
2. Shift+click Rect 3

**Expected:** Rect 3, 4, 5, 6, 7 selected (bidirectional works)
**Check:** ✅ Range works in reverse direction

### Test 3.3: Range adds to existing selection ✅
**Steps:**
1. Click Rect 1
2. Cmd+click Rect 3 (add to selection)
3. Now have: Rect 1, 3 selected
4. Shift+click Rect 5

**Expected:** Rect 1, 3, 4, 5 selected (range 3-5 added, 1 kept)
**Check:** ✅ Original selection maintained, ✅ Range added

### Test 3.4: Range with hierarchies ✅
**Steps:**
1. Clear canvas
2. Create Frame 1
3. Create Rect 2 as child of Frame 1
4. Create Circle 3 at root level
5. Click Frame 1
6. Shift+click Circle 3

**Expected:** Frame 1, Rect 2 (child), Circle 3 selected
**Check:** ✅ Includes children in range

### Test 3.5: Range with collapsed parent ✅
**Steps:**
1. With Frame 1 expanded, click Frame 1
2. Collapse Frame 1 (Rect 2 disappears from panel)
3. Create Rect 4 below Frame 1
4. Click Frame 1
5. Shift+click Rect 4

**Expected:** Frame 1 and Rect 4 selected (NOT Rect 2, since it's hidden)
**Check:** ✅ Range uses display order (respects collapse)

**✅ SUITE 3 COMPLETE - Document results in test report**

---

## Test Suite 4: Lock Feature (Phase 4)

### Setup
1. Clear canvas
2. Create Rectangle 1
3. Create Circle 2

### Test 4.1: Lock prevents canvas selection ✅
**Steps:**
1. Lock Rectangle 1 (click lock icon in panel)
2. Click Rectangle 1 on canvas
3. Try to select it

**Expected:** Rectangle 1 NOT selected, click goes through
**Check:** ✅ No selection on click

### Test 4.2: Lock prevents drag ✅
**Steps:**
1. With Rectangle 1 locked, try to drag it on canvas
2. Try to move it

**Expected:** Rectangle 1 doesn't move
**Check:** ✅ Object stationary

### Test 4.3: Lock prevents resize ✅
**Steps:**
1. Select Rectangle 1 from panel (blue highlight)
2. Check canvas for resize handles

**Expected:** No resize handles, solid blue outline (NOT dashed gray)
**Check:** ✅ No handles, ✅ Blue outline (#0ea5e9, not dashed)

### Test 4.4: Lock prevents deletion ✅
**Steps:**
1. Select Rectangle 1 from panel
2. Press Delete or Backspace
3. Check console

**Expected:** Object NOT deleted, warning in console
**Check:** ✅ Object remains, ✅ Console: "Cannot delete locked object"

### Test 4.5: Lock icon appears correctly ✅
**Steps:**
1. Check Rectangle 1 in panel
2. Layer should be slightly dimmed

**Expected:** Solid Lock icon always visible, opacity-60
**Check:** ✅ Lock icon solid, ✅ Dimmed layer

### Test 4.6: Unlock icon on hover only ✅
**Steps:**
1. Hover Circle 2 (unlocked)
2. Check for Unlock icon (left of eye icon)
3. Move mouse away

**Expected:** Unlock icon appears on hover, disappears when mouse leaves
**Check:** ✅ Fade in/out works (opacity 0 → 100)

### Test 4.7: Context menu disables actions for locked ✅
**Steps:**
1. Right-click Rectangle 1 (locked)
2. Check menu items

**Expected:** Rename, Delete, Bring to Front, Send to Back grayed out
**Check:** ✅ Disabled items, ✅ Lock/Unlock available

### Test 4.8: Locked objects selectable from panel ✅
**Steps:**
1. Click Rectangle 1 in panel
2. Blue highlight appears
3. Can click Unlock icon to unlock

**Expected:** Selectable from panel (to unlock), NOT from canvas
**Check:** ✅ Panel selection works, ✅ Unlock icon clickable

### Test 4.9: Keyboard shortcut (Shift+Cmd/Ctrl+L) ✅
**Steps:**
1. Unlock all objects
2. Select Circle 2
3. Press Shift+Cmd+L (Mac) or Shift+Ctrl+L (Windows)
4. Circle 2 should lock
5. Press Shift+Cmd+L again
6. Circle 2 should unlock

**Expected:** Toggles lock state for selected objects
**Check:** ✅ Shortcut works, ✅ Visual feedback immediate

### Test 4.10: Parent-child lock cascading ✅
**Steps:**
1. Clear canvas
2. Create Frame 1 with child Rect 2 and child Circle 3
3. Lock Frame 1
4. Check Rect 2 and Circle 3

**Expected:** All children automatically locked (inherited)
**Check:** ✅ Children show dimmed lock icon, ✅ Can't select on canvas

### Test 4.11: Inherited lock indicator ✅
**Steps:**
1. With Frame 1 locked, check children in panel
2. Try to click unlock on Rect 2

**Expected:** Children show dimmed lock icon, unlock button disabled
**Check:** ✅ Dimmed icon (opacity-50), ✅ Can't unlock child while parent locked

### Test 4.12: Unlock parent unlocks children ✅
**Steps:**
1. Unlock Frame 1
2. Check Rect 2 and Circle 3

**Expected:** All children automatically unlocked
**Check:** ✅ Children unlocked, ✅ Unlock icons appear on hover

### Test 4.13: Selection outline is blue (not dashed gray) ✅
**Steps:**
1. Lock Rectangle 1
2. Select from panel
3. Check canvas outline carefully

**Expected:** Solid blue outline (#0ea5e9), NO dash pattern
**Check:** ✅ Blue color correct, ✅ Solid line (not dashed)

**✅ SUITE 4 COMPLETE - Document results in test report**

---

## Test Suite 5: Section Header (Phase 5)

### Setup
1. Ensure layers panel open

### Test 5.1: Section collapses ✅
**Steps:**
1. Click "LAYERS" header (has down arrow)
2. Arrow rotates to left (-90°)

**Expected:** Layer list disappears, arrow points left
**Check:** ✅ Smooth rotation (150ms), ✅ List hidden

### Test 5.2: Section expands ✅
**Steps:**
1. Click "LAYERS" header again
2. Arrow rotates to down (0°)

**Expected:** Layer list reappears
**Check:** ✅ Smooth rotation, ✅ List visible

### Test 5.3: Shows object count ✅
**Steps:**
1. Count objects on canvas (e.g., 5 objects)
2. Check "LAYERS" header right side

**Expected:** Shows "5" on right
**Check:** ✅ Count matches actual objects

### Test 5.4: Count updates dynamically ✅
**Steps:**
1. Create new rectangle
2. Check count

**Expected:** Count increments (e.g., 5 → 6)
**Check:** ✅ Updates immediately

### Test 5.5: State persists across refreshes ✅
**Steps:**
1. Collapse "LAYERS" section
2. Refresh page (Cmd+R)
3. Check section state

**Expected:** Section remains collapsed after refresh
**Check:** ✅ State persisted in localStorage

**✅ SUITE 5 COMPLETE - Document results in test report**

---

## Test Suite 6: Integration Tests

### Test 6.1: Lock parent → children accessibility ✅
**Steps:**
1. Create Frame 1 with children
2. Lock Frame 1
3. Try to select children on canvas

**Expected:** Children also locked (inherited), can't select
**Check:** ✅ Inherited lock works

### Test 6.2: Shift-select range including locked objects ✅
**Steps:**
1. Create 5 objects
2. Lock object 3
3. Click object 1, Shift+click object 5

**Expected:** All objects 1-5 selected (including locked)
**Check:** ✅ Range includes locked objects

### Test 6.3: Delete selection with locked objects ✅
**Steps:**
1. With range including locked object, press Delete
2. Check what happens

**Expected:** Only unlocked objects deleted, locked remains
**Check:** ✅ Locked object survives, ✅ Console warning

### Test 6.4: Drag locked object in panel ✅
**Steps:**
1. Lock object
2. Try to drag in panel

**Expected:** TBD - implementation decision needed
**Check:** Document behavior

### Test 6.5: Collapse parent with locked children ✅
**Steps:**
1. Lock child
2. Collapse parent

**Expected:** Works normally, lock state preserved
**Check:** ✅ Expand shows child still locked

**✅ SUITE 6 COMPLETE - Document results in test report**

---

## Performance Testing

### Setup
1. Open Chrome DevTools
2. Go to Performance tab
3. Click Record button (circle)

### Test P1: 100 flat objects ✅
**Steps:**
1. Create 100 rectangles (use loop in console if needed)
2. Start recording
3. Scroll layers panel up and down
4. Stop recording (5 seconds)
5. Check "Frame" section for FPS

**Expected:** 60 FPS (green bars), no red/yellow warnings
**Check:** ✅ Average FPS: ____, ✅ Frame time: ____ ms

### Test P2: 50 parents with 100 children ✅
**Steps:**
1. Clear canvas
2. Create 50 frames, each with 2 children (150 total)
3. Expand all
4. Record + scroll
5. Check FPS

**Expected:** 60 FPS maintained
**Check:** ✅ Average FPS: ____, ✅ No lag

### Test P3: Expand/collapse performance ✅
**Steps:**
1. Create parent with 10 children
2. Record
3. Click collapse/expand arrow 10 times rapidly
4. Check animation smoothness

**Expected:** Smooth 150ms transitions, no jank
**Check:** ✅ Smooth animation, ✅ FPS during transition

### Test P4: Drag performance ✅
**Steps:**
1. Create parent with 50 children
2. Record
3. Drag parent up and down rapidly
4. Check FPS

**Expected:** 60 FPS during drag
**Check:** ✅ Smooth drag, ✅ No frame drops

**✅ PERFORMANCE TESTS COMPLETE - Document metrics in test report**

---

## Accessibility Testing

### Test A1: Keyboard navigation ✅
**Steps:**
1. Click in browser (focus page)
2. Press Tab repeatedly
3. Navigate through all panel elements

**Expected:** Blue focus ring on each element
**Check:** ✅ Focus visible, ✅ Tab order logical

### Test A2: Keyboard shortcuts ✅
**Steps:**
1. Test all shortcuts:
   - Delete/Backspace (delete)
   - Cmd+A (select all)
   - Shift+Cmd+L (toggle lock)
   - Escape (deselect)

**Expected:** All work without mouse
**Check:** ✅ All shortcuts functional

### Test A3: ARIA labels ✅
**Steps:**
1. Right-click page → Inspect
2. Check elements for aria-label attributes
3. Enable VoiceOver (Cmd+F5 on Mac) or NVDA/JAWS

**Expected:** Screen reader announces actions
**Check:** ✅ All interactive elements have labels

**✅ ACCESSIBILITY TESTS COMPLETE - Document in test report**

---

## Bug Documentation Template

When you find a bug:

```markdown
### Bug #X: [Short description]

**Severity:** 🔴 Critical / 🟡 Minor / 🔵 Polish

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach if needed]

**Console Errors:**
[Copy any errors from DevTools Console]

**Browser:**
Chrome [version]

**Proposed Fix:**
[If known]
```

---

## Completion Checklist

- [ ] All Suite 1 tests complete (Full-Item Dragging)
- [ ] All Suite 2 tests complete (Hierarchy)
- [ ] All Suite 3 tests complete (Shift-Select)
- [ ] All Suite 4 tests complete (Lock Feature)
- [ ] All Suite 5 tests complete (Section Header)
- [ ] All Suite 6 tests complete (Integration)
- [ ] All Performance tests complete
- [ ] All Accessibility tests complete
- [ ] All bugs documented
- [ ] Test report updated with results
- [ ] Screenshots attached for bugs
- [ ] Ready for Phase 6.3 (Bug Fixes)

---

**Testing Guide Prepared By:** Claude Code (plan-coordinator)
**Last Updated:** 2025-10-15
