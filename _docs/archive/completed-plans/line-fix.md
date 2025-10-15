# Line Disappearing Bug Fix Plan

**Status:** Not Started
**Priority:** P0 (Critical - feature is broken)
**Estimated Time:** 1-2 hours
**Created:** 2025-10-15

## Problem Summary

Lines are being created successfully (visible flash in sidebar showing "Line 1"), but immediately disappear from the canvas after creation. The line appears briefly and then vanishes, suggesting a rendering or visibility issue.

## Root Cause Investigation

Based on code analysis:

1. **Line Component Visibility Check** (`src/features/canvas-core/shapes/Line.tsx:68-70`):
   ```typescript
   if (line.visible === false) {
     return null;
   }
   ```

2. **Line Creation** (`src/features/canvas-core/hooks/useShapeCreation.ts:250-264`):
   - Lines are created WITHOUT a `visible` property
   - Rectangles, circles, and text also don't explicitly set `visible` on creation
   - Default assumption: shapes are visible unless explicitly hidden

3. **Potential Issues:**
   - Line rendering might be filtering out lines without explicit `visible: true`
   - CanvasStage might not be filtering based on visibility for lines
   - Type narrowing issues in TypeScript
   - Possible race condition during creation

## Phase 0: Research & Diagnosis

### 0.1 Verify Current Behavior
- [ ] **Action:** Test line creation in development mode
  - **Why:** Confirm the exact behavior and reproduction steps
  - **Tests:**
    1. Start dev server: `npm run dev`
    2. Open browser to localhost
    3. Press 'L' to activate line tool
    4. Click and drag to create a line
    5. Observe: Does line appear? Does it disappear? When?
    6. Check browser console for errors
    7. Check browser DevTools React components for line object
    8. Check sidebar - does "Line 1" appear?
  - **Success Criteria:**
    - [ ] Can reproduce the bug consistently
    - [ ] Documented exact timing of disappearance
    - [ ] Console errors (if any) documented
    - [ ] Sidebar shows line object

### 0.2 Compare with Working Shapes
- [ ] **Action:** Compare rectangle rendering with line rendering
  - **Why:** Rectangles work, lines don't - find the difference
  - **Files to Compare:**
    - `src/features/canvas-core/shapes/Rectangle.tsx`
    - `src/features/canvas-core/shapes/Line.tsx`
    - `src/features/canvas-core/components/CanvasStage.tsx` (rendering sections)
  - **What to Look For:**
    - Visibility handling differences
    - Prop validation differences
    - Render return conditions
  - **Success Criteria:**
    - [ ] Identified differences in visibility logic
    - [ ] Identified differences in render logic
    - [ ] Documented findings

### 0.3 Check Firebase RTDB Data
- [ ] **Action:** Inspect Firebase RTDB to see what data is persisted
  - **Why:** Verify if lines are being saved correctly
  - **Tests:**
    1. Create a line
    2. Open Firebase Console
    3. Navigate to Realtime Database
    4. Check `/canvases/main/objects`
    5. Find the line object
    6. Check if it has `visible` property
    7. Check all other properties
  - **Success Criteria:**
    - [ ] Line object exists in RTDB
    - [ ] Line properties match expected structure
    - [ ] Documented RTDB structure

---

## Phase 1: Quick Fixes (Test Each Solution)

### 1.1 Fix: Explicitly Set visible: true on Line Creation

**Root Cause Hypothesis:** Lines need explicit `visible: true` property

- [ ] **Action:** Add `visible: true` to line creation
  - **Why:** Ensure lines have explicit visibility state like other shapes might
  - **Files Modified:**
    - `src/features/canvas-core/hooks/useShapeCreation.ts`
  - **Implementation:**
    ```typescript
    // Line 250-264 - Add visible: true
    newShape = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'line',
      x,
      y,
      points,
      width,
      rotation,
      stroke: DEFAULT_LINE_STROKE,
      strokeWidth: DEFAULT_LINE_STROKE_WIDTH,
      visible: true, // ← ADD THIS
      name,
      createdBy: currentUser?.uid || 'unknown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Line;
    ```
  - **Also update:**
    - Line 265-275 (dragged line creation)
    - Line 143-165 (preview line creation - optional)
  - **Success Criteria:**
    - [ ] Code updated with `visible: true`
    - [ ] No TypeScript errors
    - [ ] Build succeeds
  - **Tests:**
    1. Start dev server
    2. Create a line with 'L' tool
    3. Expected: Line appears and stays visible
    4. Check RTDB: Line has `visible: true`
    5. Create 5 more lines → all visible
  - **Rollback:** Remove `visible: true` if this doesn't fix it

### 1.2 Fix: Update Line Type Definition

**Root Cause Hypothesis:** Type definition might be missing visibility

- [ ] **Action:** Verify Line interface includes visibility
  - **Why:** Ensure TypeScript type is correct
  - **Files to Check:**
    - `src/types/canvas.types.ts`
  - **Implementation:**
    - Line interface should extend `BaseCanvasObject` which likely has `visible?: boolean`
    - If not, add: `visible?: boolean;` to Line interface
  - **Success Criteria:**
    - [ ] Line type has visible property (optional)
    - [ ] Matches Rectangle and Circle types
  - **Tests:**
    1. Check type definition includes `visible?: boolean`
    2. Verify no TypeScript errors
  - **Rollback:** Revert type changes if breaking

### 1.3 Fix: Filter Lines by Visibility in CanvasStage

**Root Cause Hypothesis:** CanvasStage might be filtering lines incorrectly

- [ ] **Action:** Check CanvasStage line rendering section
  - **Why:** Ensure lines aren't being filtered out
  - **Files Modified:**
    - `src/features/canvas-core/components/CanvasStage.tsx`
  - **Current Code (lines 417-439):**
    ```typescript
    {objects
      .filter((obj) => obj.type === 'line')
      .map((obj) => { ...
    ```
  - **Check if should be:**
    ```typescript
    {objects
      .filter((obj) => obj.type === 'line' && obj.visible !== false)
      .map((obj) => { ...
    ```
  - **BUT:** Rectangles don't filter by visibility, so lines shouldn't either
  - **Success Criteria:**
    - [ ] Line rendering matches rectangle/circle pattern
    - [ ] No extra visibility filters
  - **Tests:**
    1. Compare line filter with rectangle filter
    2. Ensure consistency
  - **Edge Case:** Don't add visibility filter if other shapes don't have it

---

## Phase 2: Component-Level Fixes

### 2.1 Fix: Remove Visibility Check from Line Component

**Root Cause Hypothesis:** Line component's visibility check is incorrect

- [ ] **Action:** Update Line component visibility logic
  - **Why:** Align with other shape components
  - **Files Modified:**
    - `src/features/canvas-core/shapes/Line.tsx`
  - **Current Code (lines 67-70):**
    ```typescript
    // Don't render if hidden
    if (line.visible === false) {
      return null;
    }
    ```
  - **Option A - Change to match rectangles:**
    Check if rectangles have this check. If not, remove it from lines.
  - **Option B - Fix the logic:**
    ```typescript
    // Don't render if explicitly hidden (visible must be false, not undefined)
    if (line.visible === false) {
      return null;
    }
    // This works because:
    // - undefined !== false (renders)
    // - true !== false (renders)
    // - false === false (doesn't render)
    ```
  - **Decision:** Compare with Rectangle.tsx first
  - **Success Criteria:**
    - [ ] Line visibility logic matches rectangle logic
    - [ ] Lines render when visible is undefined
    - [ ] Lines hide when visible is false
  - **Tests:**
    1. Create line → should be visible
    2. Toggle visibility via sidebar eye icon → should hide
    3. Toggle again → should show
  - **Edge Case:** Ensure undefined is treated as visible

### 2.2 Verify Line Rendering Props

- [ ] **Action:** Check all required props are passed to Line component
  - **Why:** Missing props could cause rendering failure
  - **Files to Check:**
    - `src/features/canvas-core/components/CanvasStage.tsx` (lines 416-439)
  - **Required Props:**
    - `line` - the line object (as LineType)
    - `isSelected` - boolean
    - `isInMultiSelect` - boolean (optional)
    - `onSelect` - function
    - `remoteDragState` - optional
  - **Success Criteria:**
    - [ ] All props properly passed
    - [ ] Type casting correct: `obj as LineType`
  - **Tests:**
    1. Add console.log in Line component to log props
    2. Create line
    3. Verify all props received
  - **Edge Case:** Check for undefined or null props

---

## Phase 3: State Management Fixes

### 3.1 Check Canvas Store Object Management

- [ ] **Action:** Verify lines are added to canvasStore correctly
  - **Why:** Ensure lines persist in local state
  - **Files to Check:**
    - `src/stores/canvasStore.ts`
    - `src/features/canvas-core/hooks/useShapeCreation.ts` (line 285)
  - **Test Procedure:**
    1. Add console.log in canvasStore.addObject
    2. Create a line
    3. Verify line is added to objects array
    4. Check if line remains in array after 1 second
    5. Check if line remains after 5 seconds
  - **Success Criteria:**
    - [ ] Line added to objects array
    - [ ] Line persists in objects array
    - [ ] No removal or filtering after creation
  - **Edge Case:** Check for duplicate IDs causing conflicts

### 3.2 Verify Firebase RTDB Sync

- [ ] **Action:** Ensure RTDB sync doesn't remove lines
  - **Why:** RTDB sync might be overwriting with empty data
  - **Files to Check:**
    - `src/lib/firebase/realtimeCanvasService.ts`
    - `src/pages/CanvasPage.tsx` (RTDB subscription)
  - **Test Procedure:**
    1. Create a line
    2. Monitor Firebase Console
    3. Check if line is added to RTDB
    4. Check if line is immediately removed
    5. Check for any sync loops
  - **Success Criteria:**
    - [ ] Line added to RTDB within 50ms
    - [ ] Line persists in RTDB
    - [ ] No delete operations on line
  - **Edge Case:** Check for sync conflicts or race conditions

---

## Phase 4: Testing & Validation

### 4.1 Manual Testing Checklist

- [ ] **Test: Basic Line Creation**
  - Create line with 'L' tool
  - Expected: Line appears and stays visible
  - Check: Sidebar shows "Line 1"
  - Check: Can select line with move tool
  - Check: Can drag line

- [ ] **Test: Multiple Lines**
  - Create 5 lines
  - Expected: All 5 lines visible
  - Check: Sidebar shows Line 1-5
  - Check: Can select each independently

- [ ] **Test: Line Visibility Toggle**
  - Create line
  - Click eye icon in sidebar
  - Expected: Line disappears from canvas
  - Check: Sidebar shows line grayed out
  - Click eye icon again
  - Expected: Line reappears

- [ ] **Test: Line Selection**
  - Create line
  - Switch to move tool ('V')
  - Click line
  - Expected: Line selected (blue highlight)
  - Check: Properties panel shows line props

- [ ] **Test: Line Drag**
  - Select line
  - Drag line
  - Expected: Line moves smoothly
  - Check: Position updates in properties panel

- [ ] **Test: Line Resize**
  - Select line
  - Drag endpoint handle
  - Expected: Line length/rotation changes
  - Check: Width and rotation update in properties panel

- [ ] **Test: Multi-User Sync**
  - Open 2 browser windows
  - Window A: Create line
  - Window B: Should see line appear
  - Window B: Drag line
  - Window A: Should see line move

### 4.2 Performance Verification

- [ ] **Test: 20 Lines Performance**
  - Create 20 lines
  - Check FPS (should be 60)
  - Pan canvas → smooth?
  - Zoom in/out → smooth?
  - Expected: All operations at 60 FPS

### 4.3 Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Success Criteria Summary

Fix is complete when **ALL** of these pass:

1. ✅ Lines appear on canvas after creation
2. ✅ Lines persist (don't disappear)
3. ✅ Lines visible in sidebar
4. ✅ Lines can be selected with move tool
5. ✅ Lines can be dragged
6. ✅ Line endpoints can be resized
7. ✅ Line visibility toggle works (eye icon)
8. ✅ Lines sync across multiple users
9. ✅ No console errors
10. ✅ No TypeScript errors
11. ✅ Build succeeds
12. ✅ Performance maintained (60 FPS with 20+ lines)

---

## Debugging Commands

```bash
# Start dev server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Check build
npm run build

# Search for visibility references
grep -rn "visible" src/features/canvas-core/shapes/
grep -rn "visible === false" src/

# Check line creation
grep -rn "type: 'line'" src/features/canvas-core/hooks/

# Check line rendering
grep -rn ".filter.*line" src/features/canvas-core/components/
```

---

## Rollback Plan

If fix breaks other features:

1. Revert changes: `git diff HEAD` → identify changes
2. Run tests to verify other shapes still work
3. Document what didn't work for next attempt

---

## Notes

- Lines were implemented following the same pattern as rectangles/circles
- LayersPanel already supports lines (icon, naming)
- Line utility functions (lineHelpers.ts) tested and working
- Issue is likely in rendering or visibility logic, not core line implementation

---

## Time Estimates

- **Phase 0 (Research):** 15 minutes
- **Phase 1 (Quick Fixes):** 20 minutes (test each, likely one fixes it)
- **Phase 2 (Component Fixes):** 15 minutes
- **Phase 3 (State Fixes):** 15 minutes
- **Phase 4 (Testing):** 20 minutes

**Total:** ~1.5 hours maximum

---

## Next Steps

1. Start with Phase 0.1 - Verify current behavior
2. Document findings
3. Try Phase 1.1 first (most likely fix)
4. If that works, proceed to Phase 4 (testing)
5. If not, try Phase 1.2, then 1.3, etc.
