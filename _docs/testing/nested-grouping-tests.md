# Nested Grouping Testing Guide

Comprehensive test cases for the multi-level grouping system in CollabCanvas.

## Test Environment Setup

1. **Clear existing canvas**: Delete all objects to start fresh
2. **Create test objects**: Add 5-6 rectangles with different colors/sizes
3. **Open layers panel**: Ensure left sidebar is visible
4. **Open browser console**: Check for any errors during testing

## Test Suite 1: Single-Level Grouping

### Test 1.1: Group Multiple Objects (Cmd+G)

**Steps:**
1. Select 2 rectangles by clicking while holding Cmd/Ctrl
2. Press `Cmd+G` (Mac) or `Ctrl+G` (Windows)

**Expected:**
- New "Group 1" appears in layers panel
- Group appears BELOW its children (at lower position in panel)
- Both rectangles are indented 16px under the group
- Group has a folder icon
- Group has a collapse arrow (chevron)

**Verify:**
- Check browser console for Firebase sync logs
- Verify in Firebase Realtime Database that both objects have `parentId` set to group ID
- Group object exists with `type: 'group'`

### Test 1.2: Group Single Object

**Steps:**
1. Select 1 rectangle
2. Press `Cmd+G`

**Expected:**
- New "Group 2" appears in layers panel
- Rectangle is indented 16px under the group
- Group appears BELOW the rectangle

**Verify:**
- Single object can be grouped (no error)
- Firebase shows correct `parentId` relationship

### Test 1.3: Collapse/Expand Group

**Steps:**
1. Click the chevron arrow next to "Group 1"
2. Click it again to expand

**Expected:**
- Children disappear when collapsed (chevron points right)
- Children reappear when expanded (chevron points down)
- Indentation remains correct

**Verify:**
- `isCollapsed` property updates in Firebase
- Canvas rendering unaffected (objects remain visible)

## Test Suite 2: Nested Grouping (Group Inside Group)

### Test 2.1: Create 2-Level Nesting

**Steps:**
1. Select "Group 1" (contains 2 rectangles from Test 1.1)
2. Select "Group 2" (contains 1 rectangle from Test 1.2) while holding Cmd/Ctrl
3. Press `Cmd+G`

**Expected:**
- New "Group 3" appears in layers panel
- "Group 1" and "Group 2" are both indented 16px under "Group 3"
- Children of "Group 1" and "Group 2" are indented 32px (16px + 16px)
- Hierarchy display:
  ```
  Group 3 (folder icon, chevron)
    Group 1 (16px indent, folder icon, chevron)
      Rectangle 1 (32px indent)
      Rectangle 2 (32px indent)
    Group 2 (16px indent, folder icon, chevron)
      Rectangle 3 (32px indent)
  ```

**Verify:**
- `depth` property: Group 1/2 = 1, Rectangle 1/2/3 = 2
- Firebase `parentId`: Group 1/2 → Group 3, Rectangles → Group 1/2
- Bounding box calculation includes all descendants

### Test 2.2: Create 3-Level Nesting

**Steps:**
1. Create a new rectangle (Rectangle 4)
2. Group it alone (`Cmd+G`) → "Group 4"
3. Select "Group 3" and "Group 4"
4. Press `Cmd+G` → "Group 5"

**Expected:**
- Hierarchy display:
  ```
  Group 5 (depth 0)
    Group 3 (depth 1, 16px indent)
      Group 1 (depth 2, 32px indent)
        Rectangle 1 (depth 3, 48px indent)
        Rectangle 2 (depth 3, 48px indent)
      Group 2 (depth 2, 32px indent)
        Rectangle 3 (depth 3, 48px indent)
    Group 4 (depth 1, 16px indent)
      Rectangle 4 (depth 2, 32px indent)
  ```

**Verify:**
- Maximum depth = 3 (Rectangle 1/2/3)
- Indentation: 0px, 16px, 32px, 48px for depths 0, 1, 2, 3
- All collapse arrows work at every level

### Test 2.3: Collapse at Different Levels

**Steps:**
1. Collapse "Group 5" (top level)
2. Expand "Group 5", then collapse "Group 3" (middle level)
3. Expand "Group 3", then collapse "Group 1" (bottom level)

**Expected:**
- Collapsing "Group 5" hides everything except "Group 5"
- Collapsing "Group 3" hides Group 1, Group 2, and all their children
- Collapsing "Group 1" hides only Rectangle 1 and Rectangle 2
- Expanding restores visibility at each level

**Verify:**
- Each level's `isCollapsed` state independent
- Nested collapse states don't conflict
- Canvas rendering unaffected

## Test Suite 3: Grouping Operations

### Test 3.1: Ungroup Nested Group (Shift+Cmd+G)

**Steps:**
1. Select "Group 3" (contains Group 1 and Group 2)
2. Press `Shift+Cmd+G`

**Expected:**
- "Group 3" deleted from layers panel
- "Group 1" and "Group 2" become top-level (depth 0)
- Their children maintain their parent relationships
- New hierarchy:
  ```
  Group 5 (if still exists)
    Group 1 (depth 1, was depth 2)
      Rectangle 1 (depth 2, was depth 3)
      Rectangle 2 (depth 2, was depth 3)
    Group 2 (depth 1, was depth 2)
      Rectangle 3 (depth 2, was depth 3)
    Group 4 (depth 1)
      Rectangle 4 (depth 2)
  ```

**Verify:**
- Firebase removes Group 3 object
- Firebase updates `parentId` for Group 1/2 to Group 5 (or null if no parent)
- Depth recalculated correctly

### Test 3.2: Rename Group (Cmd+R)

**Steps:**
1. Select any group
2. Press `Cmd+R`
3. Type "My Custom Group"
4. Press Enter

**Expected:**
- Group name changes immediately
- Name displays in layers panel
- Firebase updates `name` property

**Verify:**
- Renaming works at any nesting level
- Empty names revert to auto-generated names

### Test 3.3: Delete Nested Group (Delete/Backspace)

**Steps:**
1. Create a fresh 2-level nested group
2. Select the child group
3. Press `Delete`

**Expected:**
- Child group deleted
- All descendants of child group also deleted
- Parent group remains but may become empty

**Verify:**
- Firebase removes group and all descendants
- If parent group becomes empty, it auto-deletes
- Cascade deletion works correctly

## Test Suite 4: Context Menu

### Test 4.1: Right-Click on Group

**Steps:**
1. Right-click on any group in layers panel

**Expected:**
- Context menu appears at cursor position
- Menu shows:
  - Bring to Front / Send to Back
  - Rename (if single selection)
  - Copy / Paste
  - **Ungroup** (Shift+Cmd+G)
  - Show / Hide
  - Lock / Unlock

**Verify:**
- "Ungroup" option appears (not "Group Selection")
- All actions work correctly

### Test 4.2: Right-Click on Multiple Objects

**Steps:**
1. Select 2-3 objects (any type)
2. Right-click on one of them

**Expected:**
- Context menu shows:
  - Bring to Front / Send to Back
  - Copy / Paste
  - **Group Selection** (Cmd+G)
  - Show / Hide
  - Lock / Unlock

**Verify:**
- "Group Selection" appears for 1+ objects
- Works with objects at different nesting levels

## Test Suite 5: Edge Cases

### Test 5.1: Circular Reference Prevention

**Steps:**
1. Create "Group A" containing Rectangle 1
2. Create "Group B" containing Group A
3. Try to manually set Group B as child of Group A (requires code modification)

**Expected:**
- System prevents circular reference
- Error logged or operation rejected
- No infinite loops

**Verify:**
- `setParent()` validation logic works
- `moveToParent()` checks for circular refs

### Test 5.2: Empty Group Auto-Delete

**Steps:**
1. Create a group with 1 rectangle
2. Delete the rectangle

**Expected:**
- Group automatically deleted when last child removed
- Layers panel updates immediately

**Verify:**
- Firebase removes empty group
- No orphaned groups remain

### Test 5.3: Lock Nested Group

**Steps:**
1. Create a 2-level nested group
2. Lock the parent group (Shift+Cmd+L)
3. Try to select child objects on canvas

**Expected:**
- Parent group locked (lock icon visible)
- All descendants inherit lock (grayed out lock icons)
- Cannot select/drag children on canvas
- Can still select from layers panel

**Verify:**
- `hasLockedParent()` returns true for descendants
- Canvas shapes have `listening: false`

### Test 5.4: Hide Nested Group

**Steps:**
1. Create a 2-level nested group
2. Hide the parent group (Shift+Cmd+H)

**Expected:**
- All descendants become invisible on canvas
- Eye-off icons appear for all descendants
- Layers panel items grayed out

**Verify:**
- Canvas rendering respects visibility cascade
- Firebase syncs `visible: false` property

## Test Suite 6: Bounding Box Calculation

### Test 6.1: Group Bounding Box

**Steps:**
1. Create 2 rectangles far apart (e.g., x: 0, y: 0 and x: 500, y: 500)
2. Group them
3. Inspect group position in layers panel

**Expected:**
- Group's `x, y` positioned at center of bounding box
- Bounding box includes both rectangles fully

**Verify:**
- `calculateBoundingBox()` includes all descendants
- Group coordinates calculated correctly

### Test 6.2: Nested Group Bounding Box

**Steps:**
1. Create a nested group (group inside group)
2. Check parent group's bounding box

**Expected:**
- Parent group's bounding box includes ALL descendants (recursive)
- Grandchildren included in calculation

**Verify:**
- `getAllDescendants()` recursive expansion works
- Bounding box spans entire hierarchy

## Test Suite 7: Z-Index and Ordering

### Test 7.1: Group Z-Index Positioning

**Steps:**
1. Create 3 rectangles
2. Group the middle one
3. Check layers panel order

**Expected:**
- Group appears BELOW its child in panel
- Group maintains correct z-index relative to other objects

**Verify:**
- `splice(minIndex, 0, group)` inserts at correct position
- Z-index synced to Firebase

### Test 7.2: Bring Group to Front

**Steps:**
1. Create a group with 2 rectangles
2. Create another rectangle
3. Select the group
4. Press `]` (bring to front)

**Expected:**
- Group and all children move to front of canvas
- Layers panel shows group at top

**Verify:**
- `bringToFront()` works on groups
- All descendants maintain relative z-order

## Test Suite 8: Multi-User Collaboration

### Test 8.1: Real-Time Group Creation

**Steps:**
1. Open canvas in 2 browser windows (simulate 2 users)
2. In Window 1: Create objects and group them
3. Observe Window 2

**Expected:**
- Window 2 shows group appear immediately
- Hierarchy structure matches Window 1
- No sync delays or conflicts

**Verify:**
- Firebase Realtime Database propagates changes
- Subscription updates trigger re-render

### Test 8.2: Concurrent Grouping

**Steps:**
1. Window 1: Select objects A and B
2. Window 2: Select objects C and D
3. Both press `Cmd+G` simultaneously

**Expected:**
- Both groups created successfully
- No data corruption or lost updates
- Each group has unique ID

**Verify:**
- Firebase handles concurrent writes
- Optimistic UI updates correctly

## Test Suite 9: Performance

### Test 9.1: Large Hierarchy

**Steps:**
1. Create 50 rectangles
2. Group them in sets of 10 (5 groups)
3. Group those 5 groups into 1 parent group
4. Collapse and expand parent group

**Expected:**
- Layers panel renders within 100ms
- No lag when collapsing/expanding
- Smooth scrolling in layers panel

**Verify:**
- React.memo prevents unnecessary re-renders
- `useMemo` optimizes hierarchy calculations

### Test 9.2: Deep Nesting (10 Levels)

**Steps:**
1. Create 1 rectangle
2. Group it 10 times (group inside group inside group...)
3. Expand all levels

**Expected:**
- Hierarchy displays correctly with increasing indentation
- Indentation: 0px, 16px, 32px, 48px, 64px, 80px, 96px, 112px, 128px, 144px
- No performance degradation

**Verify:**
- `buildHierarchyTree()` handles deep nesting
- No stack overflow errors

## Test Suite 10: Export with Groups

### Test 10.1: Export Selected Group

**Steps:**
1. Create a group with 3 rectangles
2. Select the group
3. Press `Shift+Cmd+E`

**Expected:**
- Exported PNG includes all children of group
- Bounding box calculated correctly
- Hidden children included in export

**Verify:**
- `exportCanvasToPNG()` expands groups
- Export file downloads successfully

### Test 10.2: Export Nested Group

**Steps:**
1. Create a 3-level nested group
2. Select the top-level group
3. Export

**Expected:**
- All descendants included in export (recursive)
- Bounding box spans entire hierarchy
- Export quality 2x pixelRatio

**Verify:**
- Nested groups fully expanded
- Export filename format: `collabcanvas-YYYY-MM-DD-HH-MM-SS.png`

## Success Criteria

All tests must pass with:
- ✅ No console errors
- ✅ Firebase sync completes within 150ms
- ✅ UI updates feel instant (<50ms optimistic update)
- ✅ Hierarchy display matches Figma behavior exactly
- ✅ Collapse/expand works at all nesting levels
- ✅ Indentation correct at all depths (16px per level)
- ✅ Groups appear BELOW children in layers panel
- ✅ Context menu shows correct actions
- ✅ Keyboard shortcuts work for all operations
- ✅ Multi-user collaboration has no conflicts

## Regression Testing

After any grouping-related code changes, re-run:
1. Test 2.2 (3-level nesting)
2. Test 2.3 (Collapse at different levels)
3. Test 5.1 (Circular reference prevention)
4. Test 6.2 (Nested group bounding box)
5. Test 8.1 (Real-time group creation)

## Known Limitations

- Maximum practical nesting depth: ~20 levels (UI constraint, not technical limit)
- Groups with 100+ direct children may show slight lag in layers panel
- Firebase Realtime Database has 32MB total size limit per database

## Testing Checklist

- [ ] All Test Suite 1 tests pass (Single-level grouping)
- [ ] All Test Suite 2 tests pass (Nested grouping)
- [ ] All Test Suite 3 tests pass (Grouping operations)
- [ ] All Test Suite 4 tests pass (Context menu)
- [ ] All Test Suite 5 tests pass (Edge cases)
- [ ] All Test Suite 6 tests pass (Bounding box)
- [ ] All Test Suite 7 tests pass (Z-index)
- [ ] All Test Suite 8 tests pass (Multi-user)
- [ ] All Test Suite 9 tests pass (Performance)
- [ ] All Test Suite 10 tests pass (Export)

## Bug Reporting Template

If any test fails, report using this format:

```
**Test:** [Test number and name]
**Steps:** [Exact reproduction steps]
**Expected:** [Expected behavior]
**Actual:** [What actually happened]
**Browser:** [Chrome/Firefox/Safari + version]
**Console errors:** [Copy any error messages]
**Screenshots:** [Attach if applicable]
**Firebase state:** [Check RTDB for data corruption]
```
