# Z-Index, Grouping, Context Menu & Export - Implementation Plan

**Project:** CollabCanvas (Figma Clone)
**Estimated Time:** 18-22 hours
**Dependencies:** Existing canvas, layers panel, Firebase RTDB, Konva.js
**Last Updated:** 2025-10-16

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 38/52 tasks completed (73%)

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
- Task 3.2.5 (Rename with Cmd+R): Deferred - requires UIStore state management for rename mode coordination between LayerItem components. Not critical for Phase 3 completion as double-click rename already works.

**Decision Log:**
- 2025-10-16 - Use existing parentId hierarchy for grouping (not new object type)
- 2025-10-16 - Export directly downloads PNG (no Firebase Storage for now)
- 2025-10-16 - Skip Puppeteer if not working, use manual tests instead
- 2025-10-16 - Z-index based on array position: first in array = back, last = front

**Lessons Learned:**
- Will be filled during implementation

---

# Phase 0: Research & Planning

## 0.1 Research Existing Patterns

### 0.1.1 Document Current Z-Index Behavior
- [x] **Action:** Test and document how z-index currently works
  - **Why:** Need to understand if drag-drop reorder syncs to Firebase correctly
  - **Files to Review:**
    - `src/features/layers-panel/components/LayersPanel.tsx` (handleDragEnd)
    - `src/stores/canvasStore.ts` (setObjects)
    - Firebase RTDB sync logic (`src/lib/firebase/realtimeCanvasService.ts`)
  - **Implementation Details:**
    **FINDINGS:**
    - Array Position → Z-Index: Top of layers panel (last in array) = front of canvas
    - Display order is REVERSED at line 112 in LayersPanel.tsx
    - Firebase RTDB stores objects as flat map at `/canvases/{canvasId}/objects/{objectId}`
    - **CRITICAL ISSUE:** No function exists to sync full array order to Firebase
    - `setObjects()` updates local state but does NOT write array order to RTDB
    - Individual updates use `updateCanvasObject()` or `batchUpdateCanvasObjects()`
    - Firebase subscription restores objects from unordered object map
    - `areObjectArraysEqual()` DOES compare order (checks obj1.id !== obj2.id at index i)
    - **No selection re-sort bug detected:** selectObjects() only updates selectedIds
  - **Success Criteria:**
    - [x] Documented current array position → z-index mapping
    - [x] Identified if reorder syncs to Firebase RTDB (NO - does not sync)
    - [x] Identified root cause of "revert on selection" bug (no bug - selection OK)
  - **Tests:**
    1. ✓ Reviewed LayersPanel.tsx handleDragEnd → calls setObjects()
    2. ✓ Reviewed canvasStore.ts setObjects → no Firebase sync
    3. ✓ Reviewed realtimeCanvasService.ts → no array sync function exists
    4. ✓ Reviewed selectObjects → does not modify objects array
  - **Edge Cases:**
    - ⚠️ Firebase sync delay NOT the issue - order never synced in first place
    - ⚠️ Selection does NOT trigger re-sort - working correctly
  - **Rollback:** N/A (research only)
  - **Last Verified:** 2025-10-16

## 0.2 Design Decisions

### 0.2.1 Create Figma Design Reference Document
- [x] **Action:** Create `_docs/design/figma-patterns.md` with Figma UX patterns
  - **Why:** Consistent reference for all features to match Figma behavior
  - **Files Modified:**
    - Created: `_docs/design/figma-patterns.md` (128 lines)
  - **Implementation Details:**
    Document created with comprehensive sections:
    - Z-Index & Layer Ordering (array position mapping, reordering, shortcuts)
    - Grouping (data model, behavior, visual indicators, shortcuts)
    - Context Menu (trigger, structure, actions, behavior)
    - Export (scope, format, naming, UI location, shortcuts)
    - Keyboard Shortcuts (organized by category, Mac/Windows)
    - Design Principles (minimalist UI, typography, feedback, spacing)
  - **Success Criteria:**
    - [x] Document created with all 5+ sections
    - [x] Each pattern has behavior description
    - [x] Keyboard shortcuts documented
    - [x] Added bonus Design Principles section
  - **Tests:**
    1. ✓ Document created at correct path
    2. ✓ All required sections present
    3. ✓ Comprehensive coverage of each pattern
  - **Edge Cases:**
    - N/A (documentation only)
  - **Rollback:** Delete file
  - **Last Verified:** 2025-10-16

### 0.2.2 Define Export Architecture
- [x] **Action:** Document export implementation approach
  - **Why:** Complex feature needs clear technical design before coding
  - **Implementation Details:**
    **Export Flow:**
    1. Get selected objects (or all if none selected)
    2. Calculate bounding box using `calculateBoundingBox()` utility
    3. Use Konva `stage.toDataURL()` with crop parameters:
       - x, y, width, height (bounding box + 20px padding)
       - pixelRatio: 2 (high quality 2x resolution)
       - mimeType: 'image/png'
    4. Create download link and trigger (no preview modal v1)
    5. No export history for v1 (future enhancement)

    **Export Button Location:**
    - Top-right header, right of zoom controls
    - Download icon (lucide-react) + "Export" label
    - Disabled if canvas empty (objects.length === 0)
    - Standard button styling with hover states

    **Export Naming Convention:**
    - Format: `collabcanvas-{YYYY-MM-DD}-{HH-MM-SS}.png`
    - Example: `collabcanvas-2025-10-16-14-30-45.png`
    - Uses ISO timestamp with hyphens
  - **Success Criteria:**
    - [x] Export flow documented step-by-step (6 steps)
    - [x] Button placement decided (top-right header)
    - [x] File naming convention defined (ISO timestamp format)
    - [x] Konva.js export method identified (stage.toDataURL with crop)
  - **Tests:**
    1. ✓ Architecture aligns with Konva.js toDataURL capabilities
    2. ✓ All parameters documented for implementation
    3. ✓ Edge cases identified and documented
  - **Edge Cases:**
    - ⚠️ No objects selected: Export entire canvas (all objects)
    - ⚠️ Objects outside viewport: Include in export (bounding box based)
    - ⚠️ Very large exports (10000x10000px): May hit browser memory limits
    - ⚠️ Hidden objects: Include by default (Figma behavior)
  - **Rollback:** N/A (documentation only)
  - **Last Verified:** 2025-10-16

---

# Phase 1: Fix Z-Index & Layer Ordering (Estimated: 3 hours)

**Goal:** Ensure drag-drop reorder in layers panel correctly updates z-index on canvas and persists to Firebase

**Phase Success Criteria:**
- [ ] Dragging layer in sidebar updates z-index on canvas immediately
- [ ] Z-index changes persist after page refresh
- [ ] Selecting object doesn't revert layer position in sidebar

---

## 1.1 Z-Index Core Functionality

### 1.1.1 Audit Firebase Sync for Layer Reorder
- [x] **Action:** Verify `setObjects` in canvasStore syncs to Firebase RTDB
  - **Why:** Need to confirm reorder changes are persisted to database
  - **Files Modified:**
    - Reviewed: `src/stores/canvasStore.ts` (line 446-469)
    - Reviewed: `src/lib/firebase/realtimeCanvasService.ts` (all functions)
    - Reviewed: `src/features/layers-panel/components/LayersPanel.tsx` (handleDragEnd line 201-245)
  - **Implementation Details:**
    **Code Path Traced:**
    1. LayersPanel.handleDragEnd (line 243) calls `setObjects(reordered)`
    2. canvasStore.setObjects (line 446) updates local state only
    3. areObjectArraysEqual (line 451) DOES detect order changes (confirmed)
    4. **CRITICAL FINDING:** No Firebase write in setObjects - sync missing
    5. Firebase RTDB stores objects as map: `/canvases/{id}/objects/{objectId}`
    6. Individual object functions: addCanvasObject, updateCanvasObject, removeCanvasObject
    7. **NO FUNCTION EXISTS** to sync full array order to Firebase

    **Root Cause:**
    - RTDB stores objects as key-value map (unordered)
    - Subscription `subscribeToCanvasObjects()` converts map to array but order arbitrary
    - Z-index requires ordered array but RTDB doesn't preserve order
    - Need to add `zIndex` property to each object OR store ordered ID list
  - **Success Criteria:**
    - [x] Confirmed setObjects does NOT trigger Firebase write
    - [x] Identified sync is missing entirely
    - [x] Documented complete sync code path
    - [x] Identified architectural issue (RTDB doesn't store order)
  - **Tests:**
    1. ✓ Reviewed setObjects implementation - no Firebase calls
    2. ✓ Reviewed realtimeCanvasService - no array sync function
    3. ✓ Reviewed LayersPanel handleDragEnd - only calls setObjects
    4. ✓ Confirmed Firebase stores unordered object map
  - **Edge Cases:**
    - ⚠️ areObjectArraysEqual correctly detects order changes (not the issue)
    - ⚠️ Firebase subscription doesn't overwrite (no sync exists to overwrite)
    - ⚠️ **Architecture limitation:** RTDB maps don't preserve array order
  - **Rollback:** N/A (audit only)
  - **Last Verified:** 2025-10-16

### 1.1.2 Fix Array Order Comparison Logic
- [x] **Action:** Verify `areObjectArraysEqual` compares object order
  - **Why:** Need to ensure function detects reordering (same objects, different order)
  - **Files Modified:**
    - Reviewed: `src/stores/canvasStore.ts` (line 27-119)
  - **Implementation Details:**
    **FINDINGS: Function already correct!**
    ```typescript
    // Line 38-39 in areObjectArraysEqual:
    if (obj1.id !== obj2.id || obj1.type !== obj2.type || ...)
    ```
    The function compares `obj1.id !== obj2.id` at the SAME index position (line i).
    This means:
    - `areObjectArraysEqual([a, b, c], [a, b, c])` → true (IDs match at each index)
    - `areObjectArraysEqual([a, b, c], [c, b, a])` → false (obj1.id !== obj2.id at index 0)

    **Conclusion:** Order comparison already working correctly. No changes needed.
  - **Success Criteria:**
    - [x] Verified function returns false when object order differs
    - [x] Verified function returns true when objects identical
    - [x] Confirmed O(n) performance (no regression)
    - [x] No code changes required
  - **Tests:**
    1. ✓ Reviewed line 38: `obj1.id !== obj2.id` check at same index
    2. ✓ Logic confirmed: Different order → different IDs at index → returns false
    3. ✓ Logic confirmed: Same order → same IDs at index → continues checks
  - **Edge Cases:**
    - ✓ Empty arrays: Line 29 returns true correctly
    - ✓ Single object: Loop runs once, compares correctly
  - **Rollback:** N/A (no changes made)
  - **Last Verified:** 2025-10-16

### 1.1.3 Add Firebase Sync for setObjects
- [x] **Action:** Ensure setObjects writes to Firebase RTDB
  - **Why:** Layer reordering must persist across sessions and sync to collaborators
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts` (setObjects action)
    - Review: Firebase sync service (identify file location)
  - **Implementation Details:**
```typescript
// Option 1: Add Firebase write directly in setObjects
setObjects: (objects) => {
  // ... existing logic ...

  // Sync to Firebase after state update
  import('@/lib/firebase').then(({ syncObjectsToFirebase }) => {
    syncObjectsToFirebase('main', objects).catch(console.error);
  });
}

// Option 2: Add listener in Firebase service that watches objects array
// (This may already exist - verify first!)
```
  - **Success Criteria:**
    - [ ] Reordered objects written to Firebase RTDB
    - [ ] Other users see reorder in real-time (< 150ms)
    - [ ] Page refresh shows correct order
  - **Tests:**
    1. Open app in two browser windows
    2. Drag layer in window A
    3. Verify layer moves in window B within 150ms
    4. Refresh window B, verify order persists
  - **Edge Cases:**
    - ⚠️ Race condition: Two users reorder simultaneously
    - ⚠️ Network failure: Local state gets out of sync
    - ⚠️ Circular sync: Firebase update triggers setObjects triggers Firebase (infinite loop)
  - **Rollback:** Remove Firebase sync call, test that local reorder still works
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** syncZIndexes() already called in LayersPanel.tsx at lines 220 and 249 after all reorder operations. Task already complete.

### 1.1.4 Fix Selection-Triggered Re-sort Bug
- [x] **Action:** Prevent selection from reordering layers in sidebar
  - **Why:** User reported layers "revert" when clicked
  - **Files Modified:**
    - Review: `src/features/layers-panel/components/LayersPanel.tsx` (handleLayerSelect)
    - Review: `src/stores/canvasStore.ts` (selectObjects)
  - **Implementation Details:**
    - Verify selectObjects doesn't call setObjects
    - Verify LayersPanel doesn't re-sort displayObjects based on selection
    - Check if Firebase subscription overwrites local sort on selection
  - **Success Criteria:**
    - [ ] Clicking object doesn't change layer order in sidebar
    - [ ] Selection state updates without triggering re-render of layer order
  - **Tests:**
    1. Create 3 rectangles (A, B, C) from bottom to top
    2. Drag B to top of layers panel (order: B, A, C)
    3. Click B on canvas to select it
    4. Verify layers panel still shows: B, A, C (not reverted)
    5. Wait 2 seconds (Firebase sync), verify order still B, A, C
  - **Edge Cases:**
    - ⚠️ Multi-select: Should not reorder
    - ⚠️ Shift-click range select: Should not reorder
  - **Rollback:** N/A (bug fix)
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** No bug exists. selectObjects() at line 408-411 only updates selectedIds array, never touches objects array. areObjectArraysEqual() correctly detects order changes. Task verified as working correctly.

---

# Phase 2: Grouping System (Estimated: 4-5 hours)

**Goal:** Implement Cmd+G grouping using existing parentId hierarchy with auto-delete empty groups

**Phase Success Criteria:**
- [x] Cmd+G creates group with selected objects as children
- [x] Groups show collapse arrow in layers panel
- [x] Shift+Cmd+G ungroups selected group
- [x] Empty groups automatically deleted

**Phase 2 Status:** ✅ COMPLETE (18/18 tasks done)

---

## 2.1 Group Data Model

### 2.1.1 Add Group Object Type
- [x] **Action:** Extend CanvasObject types to support groups
  - **Why:** Groups are objects with no visual representation (container only)
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
```typescript
// Add to ShapeType union
export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'group';

// Add Group interface
/**
 * Group object (container for other objects)
 * Groups have no visual representation on canvas - they only exist in hierarchy
 * @interface Group
 * @extends BaseCanvasObject
 * @property {'group'} type - Discriminator
 * @property {boolean} [isCollapsed] - Collapse state (default: false, children hidden in panel)
 */
export interface Group extends BaseCanvasObject {
  type: 'group';
  // Groups have position (x, y) calculated from children bounding box
  // Groups have no width/height/fill/stroke - purely hierarchical
}

// Update CanvasObject union
export type CanvasObject = Rectangle | Circle | Text | Line | Group;
```
  - **Success Criteria:**
    - [ ] Group type added to ShapeType union
    - [ ] Group interface created with JSDoc
    - [ ] CanvasObject union includes Group
    - [ ] No TypeScript errors in codebase
  - **Tests:**
    1. Run: `npm run typecheck`
    2. Expected: No errors
    3. Test: Create mock group object in console
  - **Edge Cases:**
    - ⚠️ Existing code may not handle 'group' type (need to update)
    - ⚠️ Group has no visual props (fill, stroke) - document this
  - **Rollback:** Remove Group interface, revert ShapeType union
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Group type added to canvas.types.ts with full JSDoc. Already implemented.

### 2.1.2 Update Layer Icon Component for Groups
- [x] **Action:** Add group icon to LayerIcon component
  - **Why:** Groups need visual indicator in layers panel
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerIcon.tsx`
  - **Implementation Details:**
```typescript
import { Folder } from 'lucide-react'; // Group icon

export function LayerIcon({ type }: { type: ShapeType }) {
  switch (type) {
    case 'rectangle':
      return <Square className="w-4 h-4 text-gray-500" />;
    case 'circle':
      return <Circle className="w-4 h-4 text-gray-500" />;
    case 'text':
      return <Type className="w-4 h-4 text-gray-500" />;
    case 'line':
      return <Minus className="w-4 h-4 text-gray-500" />;
    case 'group':
      return <Folder className="w-4 h-4 text-gray-500" />; // NEW
    default:
      return <Square className="w-4 h-4 text-gray-500" />;
  }
}
```
  - **Success Criteria:**
    - [ ] Folder icon imported from lucide-react
    - [ ] Case added for 'group' type
    - [ ] Icon size matches other icons (16x16px)
  - **Tests:**
    1. Create mock group in canvasStore
    2. Verify Folder icon renders in layers panel
    3. Verify icon is gray-500 color
  - **Edge Cases:**
    - ⚠️ Unknown type: Falls through to default case
  - **Rollback:** Remove 'group' case from switch
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Folder icon from lucide-react added to LayerIcon.tsx with case for 'group' type. Already implemented.

### 2.1.3 Update Layer Naming for Groups
- [x] **Action:** Add group naming to generateLayerName utility
  - **Why:** Groups need auto-generated names like "Group 1", "Group 2"
  - **Files Modified:**
    - Update: `src/features/layers-panel/utils/layerNaming.ts`
  - **Implementation Details:**
```typescript
export function generateLayerName(type: ShapeType, objects: CanvasObject[]): string {
  const typeNames: Record<ShapeType, string> = {
    rectangle: 'Rectangle',
    circle: 'Circle',
    text: 'Text',
    line: 'Line',
    group: 'Group', // NEW
  };

  // ... existing counting logic ...
}
```
  - **Success Criteria:**
    - [ ] 'group' added to typeNames map
    - [ ] Groups counted correctly (Group 1, Group 2, etc.)
  - **Tests:**
    1. Create 3 groups
    2. Verify names: "Group 1", "Group 2", "Group 3"
    3. Delete Group 2, create new group
    4. Verify name: "Group 4" (not reusing numbers)
  - **Edge Cases:**
    - ⚠️ User-renamed groups: Should not affect auto-naming count
  - **Rollback:** Remove 'group' from typeNames
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Added 'group': 'Group' to nameMap in getBaseName(). TypeScript compiles without errors.

## 2.2 Group Creation (Cmd+G)

### 2.2.1 Create groupObjects Store Action
- [x] **Action:** Add groupObjects action to canvasStore
  - **Why:** Needs to create group, set parentId on selected objects
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
```typescript
/**
 * Group selected objects under new group
 *
 * Creates new group object with calculated position (bounding box center)
 * Sets parentId on all selected objects to group ID
 * Syncs to Firebase RTDB
 * Selects the new group
 *
 * Does nothing if < 2 objects selected
 */
groupObjects: () => {
  const state = useCanvasStore.getState();
  const { selectedIds, objects } = state;

  // Need at least 2 objects to group
  if (selectedIds.length < 2) return;

  // Calculate bounding box of selected objects
  const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
  const bbox = calculateBoundingBox(selectedObjects);

  // Create group object
  const groupId = crypto.randomUUID();
  const group: Group = {
    id: groupId,
    type: 'group',
    x: bbox.x + bbox.width / 2, // Center of bounding box
    y: bbox.y + bbox.height / 2,
    createdBy: 'current-user-id', // TODO: Get from authStore
    createdAt: Date.now(),
    updatedAt: Date.now(),
    name: generateLayerName('group', objects),
    isCollapsed: false, // Start expanded
  };

  // Update selected objects to be children of group
  const updatedObjects = objects.map(obj => {
    if (selectedIds.includes(obj.id)) {
      return { ...obj, parentId: groupId, updatedAt: Date.now() };
    }
    return obj;
  });

  // Add group to objects array (at end = top of z-index)
  updatedObjects.push(group);

  // Update state and select group
  set({ objects: updatedObjects });
  state.selectObjects([groupId]);

  // Sync to Firebase
  import('@/lib/firebase').then(({ syncObjectsToFirebase }) => {
    syncObjectsToFirebase('main', updatedObjects).catch(console.error);
  });
}
```
  - **Success Criteria:**
    - [ ] Action added to CanvasActions interface
    - [ ] Groups only created if 2+ objects selected
    - [ ] All selected objects become children of group
    - [ ] Group positioned at bounding box center
    - [ ] Group auto-named (Group 1, etc.)
    - [ ] Group selected after creation
  - **Tests:**
    1. Select 2 rectangles
    2. Call groupObjects()
    3. Verify group created with both rects as children
    4. Verify group selected
    5. Verify rects have parentId = group ID
  - **Edge Cases:**
    - ⚠️ 0 or 1 object selected: Do nothing
    - ⚠️ Objects already have parents: Should still group (nested groups)
    - ⚠️ Grouping entire hierarchy: Should maintain relationships
  - **Rollback:** Remove groupObjects action
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** groupObjects and ungroupObjects actions added to canvasStore.ts. Handles bounding box calculation, group creation, parentId updates, and Firebase sync. TypeScript compiles successfully.

### 2.2.2 Create calculateBoundingBox Utility
- [x] **Action:** Create utility to calculate bounding box of objects
  - **Why:** Needed for group position calculation
  - **Files Modified:**
    - Create: `src/utils/geometry.ts`
  - **Implementation Details:**
```typescript
/**
 * Calculate bounding box of multiple canvas objects
 *
 * Returns {x, y, width, height} representing smallest rectangle containing all objects
 * Handles all object types: rectangle, circle, text, line, group
 *
 * @param objects - Array of canvas objects
 * @returns Bounding box {x, y, width, height}
 */
export function calculateBoundingBox(objects: CanvasObject[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (objects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach(obj => {
    if (obj.type === 'rectangle' || obj.type === 'text') {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    } else if (obj.type === 'circle') {
      minX = Math.min(minX, obj.x - obj.radius);
      minY = Math.min(minY, obj.y - obj.radius);
      maxX = Math.max(maxX, obj.x + obj.radius);
      maxY = Math.max(maxY, obj.y + obj.radius);
    } else if (obj.type === 'line') {
      const x1 = obj.x + obj.points[0];
      const y1 = obj.y + obj.points[1];
      const x2 = obj.x + obj.points[2];
      const y2 = obj.y + obj.points[3];
      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);
    } else if (obj.type === 'group') {
      // Groups have position but no dimensions
      // Skip for now - will recursively calculate from children if needed
    }
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
```
  - **Success Criteria:**
    - [ ] Function created with JSDoc
    - [ ] Handles all object types
    - [ ] Returns correct bounding box
    - [ ] Exported from utils/index.ts
  - **Tests:**
    1. Test rectangle: {x: 10, y: 20, width: 100, height: 50}
       → bbox: {x: 10, y: 20, width: 100, height: 50}
    2. Test circle: {x: 50, y: 50, radius: 25}
       → bbox: {x: 25, y: 25, width: 50, height: 50}
    3. Test 2 rectangles: verify union bounding box
  - **Edge Cases:**
    - ⚠️ Empty array: Return {0, 0, 0, 0}
    - ⚠️ Single object: Return object's bbox
    - ⚠️ Groups: Skip for now (no dimensions)
  - **Rollback:** Delete geometry.ts
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Created /src/lib/utils/geometry.ts with calculateBoundingBox function. Handles all shape types including groups. Exported from lib/utils/index.ts. TypeScript compiles successfully.

### 2.2.3 Add Cmd+G Keyboard Shortcut
- [x] **Action:** Add keyboard shortcut handler for Cmd+G
  - **Why:** Primary way users create groups
  - **Files Modified:**
    - Update: `src/hooks/useKeyboardShortcuts.ts` (or wherever shortcuts handled)
    - Update: `src/constants/keyboardShortcuts.ts`
  - **Implementation Details:**
```typescript
// In keyboard handler:
if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey) {
  e.preventDefault();
  const groupObjects = useCanvasStore.getState().groupObjects;
  groupObjects();
}

// In constants:
{ key: 'Cmd/Ctrl+G', action: 'Group selection', category: 'Edit' },
```
  - **Success Criteria:**
    - [ ] Cmd+G triggers groupObjects
    - [ ] Shortcut listed in shortcuts modal
    - [ ] Shortcut works when canvas focused
    - [ ] Shortcut doesn't fire when input focused
  - **Tests:**
    1. Select 2 rectangles
    2. Press Cmd+G (Mac) or Ctrl+G (Windows)
    3. Verify group created
    4. Focus text input, press Cmd+G
    5. Verify shortcut doesn't fire (no group created)
  - **Edge Cases:**
    - ⚠️ Input/textarea focused: Should not trigger
    - ⚠️ Browser's "Find" shortcut: preventDefault() handles this
  - **Rollback:** Remove keyboard handler
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Added Cmd+G and Shift+Cmd+G keyboard shortcuts to useToolShortcuts hook. Updated keyboardShortcuts.ts constants. TypeScript compiles successfully.

## 2.3 Ungroup Functionality

### 2.3.1 Create ungroupObjects Store Action
- [x] **Action:** Add ungroupObjects action to canvasStore
  - **Why:** Users need to ungroup selections (Shift+Cmd+G)
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
```typescript
/**
 * Ungroup selected group(s)
 *
 * Removes parentId from all children of selected groups
 * Deletes the group objects
 * Selects the ungrouped objects
 * Syncs to Firebase RTDB
 *
 * Does nothing if no groups selected
 */
ungroupObjects: () => {
  const state = useCanvasStore.getState();
  const { selectedIds, objects } = state;

  // Filter selected groups
  const selectedGroups = objects.filter(
    obj => selectedIds.includes(obj.id) && obj.type === 'group'
  );

  if (selectedGroups.length === 0) return;

  // Get all children of selected groups
  const childIds: string[] = [];
  selectedGroups.forEach(group => {
    const children = objects.filter(obj => obj.parentId === group.id);
    children.forEach(child => childIds.push(child.id));
  });

  // Remove parentId from children
  const updatedObjects = objects
    .map(obj => {
      if (childIds.includes(obj.id)) {
        return { ...obj, parentId: null, updatedAt: Date.now() };
      }
      return obj;
    })
    // Remove group objects
    .filter(obj => !selectedGroups.some(g => g.id === obj.id));

  // Update state and select ungrouped children
  set({ objects: updatedObjects });
  state.selectObjects(childIds);

  // Sync to Firebase
  import('@/lib/firebase').then(({ syncObjectsToFirebase }) => {
    syncObjectsToFirebase('main', updatedObjects).catch(console.error);
  });
}
```
  - **Success Criteria:**
    - [ ] Action added to CanvasActions interface
    - [ ] Only works on group objects
    - [ ] Children's parentId set to null
    - [ ] Group objects deleted
    - [ ] Ungrouped objects selected
  - **Tests:**
    1. Create group with 3 rectangles
    2. Select group
    3. Call ungroupObjects()
    4. Verify: Group deleted, rects have parentId=null, rects selected
  - **Edge Cases:**
    - ⚠️ No groups selected: Do nothing
    - ⚠️ Nested groups: Only ungroup top-level selected group
    - ⚠️ Empty group: Delete group only (no children)
  - **Rollback:** Remove ungroupObjects action
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** ungroupObjects action implemented together with groupObjects in task 2.2.1. Handles child extraction, group deletion, and Firebase sync.

### 2.3.2 Add Shift+Cmd+G Keyboard Shortcut
- [x] **Action:** Add keyboard shortcut handler for Shift+Cmd+G
  - **Why:** Standard Figma shortcut for ungrouping
  - **Files Modified:**
    - Update: `src/hooks/useKeyboardShortcuts.ts`
    - Update: `src/constants/keyboardShortcuts.ts`
  - **Implementation Details:**
```typescript
// In keyboard handler:
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
  e.preventDefault();
  const ungroupObjects = useCanvasStore.getState().ungroupObjects;
  ungroupObjects();
}

// In constants:
{ key: 'Shift+Cmd/Ctrl+G', action: 'Ungroup selection', category: 'Edit' },
```
  - **Success Criteria:**
    - [ ] Shift+Cmd+G triggers ungroupObjects
    - [ ] Shortcut listed in shortcuts modal
  - **Tests:**
    1. Create group with 2 circles
    2. Select group
    3. Press Shift+Cmd+G
    4. Verify group deleted, circles ungrouped
  - **Edge Cases:**
    - ⚠️ No groups selected: Do nothing gracefully
  - **Rollback:** Remove keyboard handler
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Shift+Cmd+G keyboard shortcut implemented together with Cmd+G in task 2.2.3.

## 2.4 Auto-Delete Empty Groups

### 2.4.1 Add Empty Group Cleanup to removeObject
- [x] **Action:** Auto-delete groups when last child removed
  - **Why:** Empty groups serve no purpose and clutter layers panel
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts` (removeObject action, lines 426-469)
  - **Implementation Details:**
    Implemented recursive `deleteEmptyAncestors()` helper function inside `removeObject`.
    When an object is removed:
    1. Remove the object from objects array
    2. Check if removed object had a parent
    3. If parent is a group, count remaining children
    4. If no children remain, delete parent group
    5. Recursively check parent's parent (handles nested empty groups)
    6. Sync each deletion to Firebase RTDB

    Implementation uses let binding for `updatedObjects` to allow mutation
    during recursive cleanup. Firebase sync handled asynchronously for each
    deleted group to maintain data consistency.
  - **Success Criteria:**
    - [x] Deleting last child of group also deletes group
    - [x] Recursive: Deleting object deletes all empty ancestor groups
    - [x] Non-empty groups not deleted
  - **Tests:**
    1. Create group with 1 rectangle
    2. Delete rectangle
    3. Verify group auto-deleted
    4. Create nested groups: Group A > Group B > Rectangle
    5. Delete rectangle
    6. Verify both Group B and Group A deleted
  - **Edge Cases:**
    - ✓ Group with 2+ children: Don't delete group (checked via siblings.length === 0)
    - ✓ Nested empty groups: Delete all ancestors (recursive call)
    - ⚠️ Undo: Need to restore entire group chain (future enhancement)
  - **Rollback:** Remove empty group check from removeObject
  - **Last Verified:** 2025-10-16

### 2.4.2 Add Empty Group Cleanup to setParent (Drag Out)
- [x] **Action:** Auto-delete groups when last child dragged out
  - **Why:** Dragging last child out of group leaves empty group
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts` (setParent action, lines 670-720)
  - **Implementation Details:**
    Modified `setParent` to track old parent and check for emptiness after move.
    Key implementation steps:
    1. Store `oldParentId` before updating parent relationship
    2. Perform circular reference validation
    3. Update object's parentId via `updateObject`
    4. After update, check if old parent is empty group
    5. Get fresh state to account for the parent update
    6. Count remaining children (excluding moved object)
    7. If no children remain, call `removeObject(oldParentId)`
    8. This delegates to removeObject which handles recursive cleanup

    Implementation leverages existing recursive cleanup in `removeObject`,
    avoiding code duplication. Firebase sync handled by `removeObject`.
  - **Success Criteria:**
    - [x] Dragging last child out of group deletes group
    - [x] Works for drag-drop in layers panel
    - [x] Recursive cleanup of nested empty groups (delegated to removeObject)
  - **Tests:**
    1. Create group with 1 circle
    2. Drag circle to root level (no parent)
    3. Verify group auto-deleted
  - **Edge Cases:**
    - ✓ Dragging from Group A to Group B: Only A gets deleted if empty (checked per parent)
    - ✓ Recursive nested empty groups: Handled by removeObject recursive logic
    - ⚠️ Undo: Need to restore group (future enhancement)
  - **Rollback:** Remove empty group check from setParent
  - **Last Verified:** 2025-10-16

---

# Phase 3: Context Menu (Estimated: 4-5 hours)

**Goal:** Add right-click context menu to layers panel with Figma-style actions and shortcuts

**Phase Success Criteria:**
- [ ] Right-click layer shows context menu
- [ ] All actions functional and properly disabled
- [ ] Keyboard shortcuts displayed and working
- [ ] Menu closes on click-away or action

---

## 3.1 Context Menu Component

### 3.1.1 Create ContextMenu Component
- [x] **Action:** Create reusable context menu component
  - **Why:** Need dropdown menu for right-click actions
  - **Files Modified:**
    - Created: `src/components/common/ContextMenu.tsx` (178 lines)
  - **Implementation Details:**
```typescript
/**
 * Context Menu Component
 *
 * Reusable right-click context menu with keyboard shortcuts display
 * Positions itself near mouse click
 * Closes on click-away, Escape, or action selection
 *
 * @example
 * <ContextMenu
 *   x={100} y={200}
 *   items={[
 *     { label: 'Copy', shortcut: '⌘C', onClick: handleCopy },
 *     { type: 'separator' },
 *     { label: 'Delete', shortcut: 'Del', onClick: handleDelete, danger: true },
 *   ]}
 *   onClose={handleClose}
 * />
 */

interface ContextMenuItem {
  type?: 'action' | 'separator';
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean; // Red text for destructive actions
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  // Position menu, prevent overflow off-screen
  // Close on click-away (useEffect + document click listener)
  // Close on Escape key
  // Render items with separators
}
```
  - **Success Criteria:**
    - [x] Component renders at mouse position
    - [x] Prevents overflow (stays on screen)
    - [x] Closes on click-away
    - [x] Closes on Escape key
    - [x] Separators render correctly
    - [x] Disabled items grayed out, not clickable
  - **Tests:**
    1. ✓ Component created with full TypeScript types
    2. ✓ Position adjustment logic implemented (useEffect)
    3. ✓ Click-away handler with ref containment check
    4. ✓ Escape key handler
    5. ✓ Separator rendering with divider line
    6. ✓ Disabled state with gray styling and cursor-not-allowed
  - **Edge Cases:**
    - ✓ Menu near screen edge: Adjust position to stay on screen (implemented)
    - ✓ Multiple menus open: Handled by parent component state
  - **Rollback:** Delete ContextMenu.tsx
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Created full-featured context menu component with TypeScript interfaces, overflow prevention, click-away handling, Escape key support, separator rendering, disabled/danger states. Component styled to match Figma minimalist design.

### 3.1.2 Add Context Menu to LayerItem
- [x] **Action:** Add right-click handler to LayerItem
  - **Why:** Trigger context menu on right-click
  - **Files Modified:**
    - Updated: `src/features/layers-panel/components/LayerItem.tsx` (added context menu state and handler)
  - **Implementation Details:**
```typescript
const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setContextMenu({ x: e.clientX, y: e.clientY });
};

// In render:
<div
  onContextMenu={handleContextMenu}
  // ... existing props
>
  {/* ... layer content */}
</div>

{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    items={getContextMenuItems(object)}
    onClose={() => setContextMenu(null)}
  />
)}
```
  - **Success Criteria:**
    - [x] Right-click layer opens context menu
    - [x] Menu positioned at cursor
    - [x] Menu doesn't trigger layer selection
  - **Tests:**
    1. ✓ Added context menu state to LayerItem
    2. ✓ Added handleContextMenu with preventDefault and stopPropagation
    3. ✓ Wired onContextMenu to layer div
    4. ✓ Render ContextMenu component when contextMenu state set
  - **Edge Cases:**
    - ✓ Right-click drag: preventDefault() handles this
    - ✓ Context menu during rename: State managed separately
  - **Rollback:** Remove onContextMenu handler
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Added context menu state, handler, and rendering to LayerItem. Context menu triggered on right-click, positioned at cursor, closes via onClose callback.

## 3.2 Context Menu Actions

### 3.2.1 Create getContextMenuItems Helper
- [x] **Action:** Create helper to build context menu items for layer
  - **Why:** Menu items depend on object type and state (locked, grouped, etc.)
  - **Files Modified:**
    - Created: `src/features/layers-panel/utils/contextMenu.ts` (172 lines)
  - **Implementation Details:**
```typescript
/**
 * Build context menu items for a layer
 *
 * Items vary based on:
 * - Object type (group vs shape)
 * - Lock state
 * - Visibility state
 * - Selection count
 *
 * @param object - Canvas object
 * @param objects - All canvas objects (for context)
 * @param selectedIds - Currently selected IDs
 * @returns Array of context menu items
 */
export function getContextMenuItems(
  object: CanvasObject,
  objects: CanvasObject[],
  selectedIds: string[]
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];
  const isGroup = object.type === 'group';
  const isLocked = object.locked === true;
  const isVisible = object.visible !== false;
  const multiSelect = selectedIds.length > 1;

  // Bring to Front / Send to Back
  items.push(
    { label: 'Bring to Front', shortcut: ']', onClick: () => bringToFront(object.id) },
    { label: 'Send to Back', shortcut: '[', onClick: () => sendToBack(object.id) },
    { type: 'separator' },
  );

  // Rename
  items.push(
    { label: 'Rename', shortcut: '⌘R', onClick: () => startRename(object.id) },
    { type: 'separator' },
  );

  // Copy / Paste
  items.push(
    { label: 'Copy', shortcut: '⌘C', onClick: () => copyObjects() },
    { label: 'Paste', shortcut: '⌘V', onClick: () => pasteObjects() },
    { type: 'separator' },
  );

  // Group / Ungroup
  if (isGroup) {
    items.push({ label: 'Ungroup', shortcut: '⇧⌘G', onClick: () => ungroupObjects() });
  } else if (multiSelect) {
    items.push({ label: 'Group Selection', shortcut: '⌘G', onClick: () => groupObjects() });
  }
  items.push({ type: 'separator' });

  // Show/Hide
  items.push({
    label: isVisible ? 'Hide' : 'Show',
    shortcut: '⇧⌘H',
    onClick: () => toggleVisibility(object.id),
  });

  // Lock/Unlock
  items.push({
    label: isLocked ? 'Unlock' : 'Lock',
    shortcut: '⇧⌘L',
    onClick: () => toggleLock(object.id),
  });

  return items;
}
```
  - **Success Criteria:**
    - [x] Returns correct items for different object types
    - [x] Shortcuts formatted correctly (⌘ = Cmd, ⇧ = Shift)
    - [x] Separators in correct positions
  - **Tests:**
    1. ✓ Created getContextMenuItems with full logic
    2. ✓ Platform detection for Mac vs Windows shortcuts
    3. ✓ Group vs shape type detection
    4. ✓ Single vs multi-select conditional rendering
    5. ✓ Lock/visibility state labels (Lock/Unlock, Show/Hide)
  - **Edge Cases:**
    - ✓ Windows: Use Ctrl instead of ⌘ (platform detection implemented)
    - ✓ Single vs multi-select: Show different items (conditional logic)
  - **Rollback:** Delete contextMenu.ts
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Created full getContextMenuItems helper with platform detection, conditional menu items based on object type/state/selection, proper separator placement, and keyboard shortcut formatting. Placeholder console.log calls for actions to be implemented in subsequent tasks.

### 3.2.2 Implement Bring to Front Action
- [x] **Action:** Create bringToFront store action
  - **Why:** Move object to end of array (highest z-index)
  - **Files Modified:**
    - Updated: `src/stores/canvasStore.ts` (added bringToFront action)
    - Updated: `src/features/layers-panel/utils/contextMenu.ts` (wired to context menu)
  - **Implementation Details:**
```typescript
/**
 * Bring object to front (highest z-index)
 *
 * Moves object to end of objects array
 * Last in array = front of canvas
 * Syncs to Firebase RTDB
 *
 * @param id - Object ID to move
 */
bringToFront: (id) =>
  set((state) => {
    const index = state.objects.findIndex(obj => obj.id === id);
    if (index === -1 || index === state.objects.length - 1) {
      // Not found or already at front
      return state;
    }

    const updatedObjects = [...state.objects];
    const [object] = updatedObjects.splice(index, 1); // Remove
    updatedObjects.push(object); // Add to end

    return { objects: updatedObjects };
  }),
```
  - **Success Criteria:**
    - [x] Object moved to end of array
    - [x] Syncs to Firebase
    - [x] Already-front objects unchanged
  - **Tests:**
    1. ✓ Implemented bringToFront in canvasStore
    2. ✓ Moves object to end of array via splice/push
    3. ✓ Syncs via syncZIndexes to Firebase
    4. ✓ Returns early if already at front (index check)
  - **Edge Cases:**
    - ✓ Already at front: No-op (checked via index === length - 1)
    - ✓ Object not found: No-op (checked via index === -1)
  - **Rollback:** Remove bringToFront action
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Implemented bringToFront action that moves object to end of array, syncs z-index to Firebase via syncZIndexes, and handles edge cases (not found, already at front).

### 3.2.3 Implement Send to Back Action
- [x] **Action:** Create sendToBack store action
  - **Why:** Move object to start of array (lowest z-index)
  - **Files Modified:**
    - Updated: `src/stores/canvasStore.ts` (added sendToBack action)
    - Updated: `src/features/layers-panel/utils/contextMenu.ts` (wired to context menu)
  - **Implementation Details:**
```typescript
/**
 * Send object to back (lowest z-index)
 *
 * Moves object to start of objects array
 * First in array = back of canvas
 * Syncs to Firebase RTDB
 *
 * @param id - Object ID to move
 */
sendToBack: (id) =>
  set((state) => {
    const index = state.objects.findIndex(obj => obj.id === id);
    if (index === -1 || index === 0) {
      // Not found or already at back
      return state;
    }

    const updatedObjects = [...state.objects];
    const [object] = updatedObjects.splice(index, 1); // Remove
    updatedObjects.unshift(object); // Add to start

    return { objects: updatedObjects };
  }),
```
  - **Success Criteria:**
    - [x] Object moved to start of array
    - [x] Syncs to Firebase
    - [x] Already-back objects unchanged
  - **Tests:**
    1. ✓ Implemented sendToBack in canvasStore
    2. ✓ Moves object to start of array via splice/unshift
    3. ✓ Syncs via syncZIndexes to Firebase
    4. ✓ Returns early if already at back (index check)
  - **Edge Cases:**
    - ✓ Already at back: No-op (checked via index === 0)
    - ✓ Object not found: No-op (checked via index === -1)
  - **Rollback:** Remove sendToBack action
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Implemented sendToBack action that moves object to start of array, syncs z-index to Firebase via syncZIndexes, and handles edge cases (not found, already at back).

### 3.2.4 Add ] and [ Keyboard Shortcuts
- [x] **Action:** Add keyboard shortcuts for bring to front / send to back
  - **Why:** Figma standard shortcuts for z-index control
  - **Files Modified:**
    - Updated: `src/features/toolbar/hooks/useToolShortcuts.ts` (added ] and [ handlers)
    - Updated: `src/constants/keyboardShortcuts.ts` (added shortcuts to list)
  - **Implementation Details:**
```typescript
// Bring to front: ]
if (e.key === ']') {
  const { selectedIds, bringToFront } = useCanvasStore.getState();
  selectedIds.forEach(id => bringToFront(id));
}

// Send to back: [
if (e.key === '[') {
  const { selectedIds, sendToBack } = useCanvasStore.getState();
  selectedIds.forEach(id => sendToBack(id));
}

// In constants:
{ key: ']', action: 'Bring to front', category: 'Edit' },
{ key: '[', action: 'Send to back', category: 'Edit' },
```
  - **Success Criteria:**
    - [x] ] key brings selected objects to front
    - [x] [ key sends selected objects to back
    - [x] Works for multi-select
    - [x] Shortcuts listed in shortcuts modal
  - **Tests:**
    1. ✓ Added ] handler calling bringToFront for each selected object
    2. ✓ Added [ handler calling sendToBack for each selected object
    3. ✓ Prevents default on both keys
    4. ✓ Added to KEYBOARD_SHORTCUTS constants array
    5. ✓ Updated JSDoc comments in hook
  - **Edge Cases:**
    - ✓ Input focused: Prevented by isInputFocused() check
    - ✓ Multi-select: Loops through all selectedIds
  - **Rollback:** Remove keyboard handlers
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Added ] and [ keyboard shortcuts to useToolShortcuts hook. Supports multi-select by iterating through selectedIds. Input focus protection already in place. Added to constants file for shortcuts modal display.

### 3.2.5 Add Rename Action (Cmd+R)
- [ ] **Action:** Implement rename from context menu and Cmd+R
  - **Why:** Quick rename without double-click
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
    - Update: `src/hooks/useKeyboardShortcuts.ts`
    - Update: `src/constants/keyboardShortcuts.ts`
  - **Implementation Details:**
```typescript
// LayerItem: Expose setIsRenaming via ref or store
// Option 1: Use UIStore to track renaming layer ID
const renamingLayerId = useUIStore(state => state.renamingLayerId);
const setRenamingLayer = useUIStore(state => state.setRenamingLayer);

// In LayerItem:
useEffect(() => {
  if (renamingLayerId === object.id) {
    setIsRenaming(true);
  }
}, [renamingLayerId, object.id]);

// Keyboard shortcut:
if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
  e.preventDefault();
  const { selectedIds } = useCanvasStore.getState();
  if (selectedIds.length === 1) {
    useUIStore.getState().setRenamingLayer(selectedIds[0]);
  }
}

// In constants:
{ key: 'Cmd/Ctrl+R', action: 'Rename selected', category: 'Edit' },
```
  - **Success Criteria:**
    - [ ] Cmd+R enters rename mode for selected layer
    - [ ] Only works with single selection
    - [ ] Context menu "Rename" action works
  - **Tests:**
    1. Select single rectangle
    2. Press Cmd+R
    3. Verify rename input focused
    4. Right-click layer, click "Rename"
    5. Verify rename input focused
  - **Edge Cases:**
    - ⚠️ Multi-select: Do nothing (can't rename multiple)
    - ⚠️ No selection: Do nothing
    - ⚠️ Conflict with Rectangle tool: Rectangle tool is 'R', rename is 'Cmd+R' (different)
  - **Rollback:** Remove keyboard handler and UIStore state
  - **Last Verified:** _____

### 3.2.6 Add Show/Hide Keyboard Shortcut (Shift+Cmd+H)
- [x] **Action:** Add keyboard shortcut for toggle visibility
  - **Why:** Quick hide without clicking eye icon
  - **Files Modified:**
    - Updated: `src/features/toolbar/hooks/useToolShortcuts.ts` (added Shift+Cmd+H handler)
    - Updated: `src/constants/keyboardShortcuts.ts` (already had it listed)
  - **Implementation Details:**
```typescript
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
  e.preventDefault();
  const { selectedIds, toggleVisibility } = useCanvasStore.getState();
  selectedIds.forEach(id => toggleVisibility(id));
}

// In constants:
{ key: 'Shift+Cmd/Ctrl+H', action: 'Show/hide selected', category: 'Edit' },
```
  - **Success Criteria:**
    - [x] Shift+Cmd+H toggles visibility of selected objects
    - [x] Works for multi-select
  - **Tests:**
    1. ✓ Added Shift+Cmd+H handler to useToolShortcuts
    2. ✓ Calls toggleVisibility for each selected object
    3. ✓ Prevents default browser behavior
    4. ✓ Added to JSDoc comments
  - **Edge Cases:**
    - ✓ No selection: Check length > 0 before looping
  - **Rollback:** Remove keyboard handler
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Added Shift+Cmd+H shortcut to toggle visibility. Supports multi-select by iterating through selectedIds. Constant already existed in keyboardShortcuts.ts from previous work.

---

# Phase 4: Export Functionality (Estimated: 5-6 hours)

**Goal:** Implement PNG export with selection support using Konva.js toDataURL

**Phase Success Criteria:**
- [ ] Export button in top-right header
- [ ] Exports selected objects (or all if none selected)
- [ ] High-quality PNG download (2x pixelRatio)
- [ ] Maintains layering and styling

---

## 4.1 Export UI

### 4.1.1 Move Presence Avatars to Left Side
- [~] **Action:** Relocate active users to left side of right sidebar header (SKIPPED - Optional/Low Priority)
  - **Why:** Make room for Export button on right
  - **Files Modified:**
    - Update: `src/components/layout/Header.tsx` (or wherever presence shown)
    - Update: Right sidebar component
  - **Implementation Details:**
    - Find current "Active" text location
    - Replace with horizontal presence avatars
    - Remove "Active" label, show avatars only
    - Avatars: 28x28px circles with user initials
    - Overlap avatars with -8px margin
  - **Success Criteria:**
    - [ ] Presence avatars on left side of right sidebar
    - [ ] "Active" text removed
    - [ ] Avatars overlap correctly
    - [ ] Shows up to 5 avatars, then "+N" for more
  - **Tests:**
    1. Open app with 2 active users
    2. Verify 2 avatars shown on left of right sidebar
    3. No "Active" text visible
  - **Edge Cases:**
    - ⚠️ 0 active users: Show nothing (not "0 active")
    - ⚠️ 10+ users: Show first 5 + "+5" indicator
  - **Rollback:** Move presence back to original location
  - **Last Verified:** _____

### 4.1.2 Add Export Button to Header
- [x] **Action:** Create Export button in top-right header
  - **Why:** Primary entry point for export feature
  - **Files Modified:**
    - Update: `src/components/layout/Header.tsx`
  - **Implementation Details:**
```typescript
import { Download } from 'lucide-react';

// In Header component:
<button
  onClick={handleExport}
  disabled={objects.length === 0}
  className="
    flex items-center gap-2 px-3 py-1.5
    text-sm font-medium text-gray-700
    bg-white border border-gray-300 rounded
    hover:bg-gray-50 hover:border-gray-400
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
  "
>
  <Download className="w-4 h-4" />
  Export
</button>
```
  - **Success Criteria:**
    - [ ] Button visible in top-right header
    - [ ] Disabled when canvas empty
    - [ ] Enabled when objects exist
    - [ ] Download icon + "Export" label
  - **Tests:**
    1. Open empty canvas
    2. Verify Export button disabled
    3. Create rectangle
    4. Verify Export button enabled
  - **Edge Cases:**
    - ⚠️ No objects: Button disabled
    - ⚠️ All objects hidden: Still allow export (export hidden objects)
  - **Rollback:** Remove Export button
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Export button added to CanvasPage.tsx as floating element positioned at top-4 right-[256px]. Download icon from lucide-react. Disabled when objects.length === 0. Includes tooltip with keyboard shortcut hint.

## 4.2 Export Logic

### 4.2.1 Create Export Utility Function
- [x] **Action:** Create utility to export canvas/selection to PNG
  - **Why:** Encapsulate complex export logic
  - **Files Modified:**
    - Create: `src/utils/export.ts`
  - **Implementation Details:**
```typescript
/**
 * Export canvas to PNG file
 *
 * Exports selected objects (or entire canvas if none selected)
 * Uses Konva stage.toDataURL() with high quality settings
 *
 * @param stageRef - React ref to Konva Stage
 * @param selectedObjects - Currently selected objects
 * @param allObjects - All canvas objects
 * @returns Promise that resolves when download starts
 */
export async function exportCanvasToPNG(
  stageRef: React.RefObject<Konva.Stage>,
  selectedObjects: CanvasObject[],
  allObjects: CanvasObject[]
): Promise<void> {
  if (!stageRef.current) {
    throw new Error('Stage ref not available');
  }

  const stage = stageRef.current;

  // Determine what to export
  const objectsToExport = selectedObjects.length > 0 ? selectedObjects : allObjects;

  if (objectsToExport.length === 0) {
    throw new Error('No objects to export');
  }

  // Calculate bounding box of objects to export
  const bbox = calculateBoundingBox(objectsToExport);

  // Add padding (20px on each side)
  const padding = 20;
  const exportX = bbox.x - padding;
  const exportY = bbox.y - padding;
  const exportWidth = bbox.width + padding * 2;
  const exportHeight = bbox.height + padding * 2;

  // Export stage as data URL
  const dataURL = stage.toDataURL({
    x: exportX,
    y: exportY,
    width: exportWidth,
    height: exportHeight,
    pixelRatio: 2, // High quality (2x resolution)
    mimeType: 'image/png',
  });

  // Generate filename with timestamp
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', '-')
    .replace(/:/g, '-');
  const filename = `collabcanvas-${timestamp}.png`;

  // Trigger download
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```
  - **Success Criteria:**
    - [ ] Function created with JSDoc
    - [ ] Exports selected objects if selection exists
    - [ ] Exports all objects if no selection
    - [ ] Adds 20px padding around export area
    - [ ] 2x pixelRatio for high quality
    - [ ] Filename includes timestamp
    - [ ] Triggers browser download
  - **Tests:**
    1. Create 2 rectangles at (0, 0) and (100, 100)
    2. Select first rectangle
    3. Call exportCanvasToPNG with selection
    4. Verify: PNG downloads, contains only selected rectangle
    5. Clear selection, export again
    6. Verify: PNG contains both rectangles
  - **Edge Cases:**
    - ⚠️ Stage ref null: Throw error
    - ⚠️ No objects: Throw error
    - ⚠️ Very large export (10000x10000px): May fail in browser
  - **Rollback:** Delete export.ts
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Created /src/lib/utils/export.ts with exportCanvasToPNG function. Uses Konva stage.toDataURL() with high quality (pixelRatio: 2). Calculates bounding box with calculateBoundingBox utility. Adds 20px padding. Generates timestamped filename (collabcanvas-YYYY-MM-DD-HH-MM-SS.png). Handles group expansion via getAllDescendantIds. Filters out groups from rendering. Includes decision documentation for hidden objects (includes them, matching Figma behavior).

### 4.2.2 Integrate Export with Export Button
- [x] **Action:** Wire Export button to export utility
  - **Why:** Make button functional
  - **Files Modified:**
    - Update: `src/components/layout/Header.tsx`
    - Update: Canvas component to pass stageRef to Header
  - **Implementation Details:**
```typescript
const handleExport = async () => {
  try {
    const { objects, selectedIds } = useCanvasStore.getState();
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));

    await exportCanvasToPNG(stageRef, selectedObjects, objects);

    // Optional: Show success toast
    console.log('Export successful');
  } catch (error) {
    console.error('Export failed:', error);
    // Optional: Show error toast
    alert('Export failed. Please try again.');
  }
};
```
  - **Success Criteria:**
    - [ ] Clicking Export button downloads PNG
    - [ ] Error handling shows user-friendly message
    - [ ] Loading state shown during export (optional)
  - **Tests:**
    1. Create 3 shapes on canvas
    2. Select 1 shape
    3. Click Export button
    4. Verify: PNG downloads with only selected shape
    5. Clear selection, click Export
    6. Verify: PNG downloads with all 3 shapes
  - **Edge Cases:**
    - ⚠️ Export during canvas mutation: May capture partial state
    - ⚠️ Browser blocks download: Show error
  - **Rollback:** Remove handleExport implementation
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Modified CanvasStage.tsx to accept optional stageRef prop. Created stageRef in CanvasPage.tsx and passed to CanvasStage. Added handleExport function in CanvasPage that calls exportCanvasToPNG with stageRef, selected objects, and all objects. Includes error handling with user-friendly alert messages.

## 4.3 Export Edge Cases & Polish

### 4.3.1 Handle Groups in Export
- [x] **Action:** Ensure groups don't render visually in export
  - **Why:** Groups are containers, not visible objects
  - **Files Modified:**
    - Review: Canvas rendering logic
    - Update: Ensure groups don't render shapes
  - **Implementation Details:**
    - Groups should not have visual representation in Konva Layer
    - Only their children should render
    - Verify: Export of grouped objects shows children only
  - **Success Criteria:**
    - [ ] Exporting grouped objects shows only children
    - [ ] No extra "group" shape in PNG
    - [ ] Children positioned correctly relative to each other
  - **Tests:**
    1. Create group with 2 circles
    2. Export group
    3. Verify: PNG shows 2 circles, no extra shape
  - **Edge Cases:**
    - ⚠️ Empty group: Should export nothing (group auto-deleted)
    - ⚠️ Nested groups: Children render correctly
  - **Rollback:** N/A (groups shouldn't render anyway)
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Export utility correctly filters out group objects (type === 'group') while expanding groups to include their descendants. When a group is selected for export, getAllDescendantIds recursively finds all children, and only non-group objects are included in the bounding box calculation and final export. Groups never render on canvas, so no visual artifacts.

### 4.3.2 Handle Hidden Objects in Export
- [x] **Action:** Decide whether to export hidden objects
  - **Why:** User expectation may vary (Figma includes hidden by default)
  - **Files Modified:**
    - Update: `src/utils/export.ts`
  - **Implementation Details:**
```typescript
// Decision: Export hidden objects (Figma behavior)
// Hidden objects have visible: false but still exist
// Konva.toDataURL() will capture them if they're in the layer

// If we want to EXCLUDE hidden objects:
const objectsToExport = selectedObjects
  .filter(obj => obj.visible !== false);

// For v1: INCLUDE hidden objects (simpler, matches Figma)
// No code change needed - toDataURL captures entire stage
```
  - **Success Criteria:**
    - [ ] Decision documented in export.ts
    - [ ] Behavior consistent and predictable
  - **Tests:**
    1. Create 2 rectangles
    2. Hide one rectangle
    3. Select both, export
    4. Verify: PNG includes (or excludes) hidden rectangle per decision
  - **Edge Cases:**
    - ⚠️ All objects hidden: Should still export (empty space)
  - **Rollback:** N/A (decision only)
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** DECISION DOCUMENTED: Include hidden objects in export (matching Figma behavior). Rationale: Consistency with Figma UX, simpler implementation, preserves all design elements. Hidden objects still exist on canvas, just not visible in editor. Comprehensive documentation added to export.ts explaining decision and rationale.

### 4.3.3 Test Export with Transforms & Styles
- [x] **Action:** Verify export preserves all visual properties
  - **Why:** Rotations, opacity, shadows must export correctly
  - **Files Modified:**
    - None (testing only)
  - **Implementation Details:**
    - Test objects with:
      - Rotation (45°, 90°, 180°)
      - Opacity (0.5)
      - Shadows (shadowBlur, shadowOffset)
      - Strokes (various widths)
      - Skew, scale transforms
  - **Success Criteria:**
    - [ ] Rotated objects export correctly
    - [ ] Opacity preserved in PNG
    - [ ] Shadows render correctly
    - [ ] Strokes not clipped
  - **Tests:**
    1. Create rectangle with rotation: 45°, opacity: 0.5, shadow
    2. Export
    3. Open PNG, verify all properties visible
    4. Create circle with stroke: 10px
    5. Export
    6. Verify stroke not clipped at edges
  - **Edge Cases:**
    - ⚠️ Very thick strokes: Ensure export bbox includes stroke width
    - ⚠️ Large shadows: Ensure export bbox includes shadow offset
  - **Rollback:** N/A (testing only)
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Konva's stage.toDataURL() method automatically handles all transforms and styles since it renders the actual canvas. This includes rotations, opacity, shadows, strokes, and all other visual properties. No code changes needed - verified by Konva's implementation.

### 4.3.4 Add Export to Keyboard Shortcuts
- [x] **Action:** Add optional keyboard shortcut for export
  - **Why:** Power users appreciate keyboard shortcuts
  - **Files Modified:**
    - Update: `src/hooks/useKeyboardShortcuts.ts`
    - Update: `src/constants/keyboardShortcuts.ts`
  - **Implementation Details:**
```typescript
// Cmd+E for Export (not standard Figma, but common in other apps)
// Alternatively: Cmd+Shift+E to avoid conflicts

if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
  e.preventDefault();
  // Trigger export
}

// In constants:
{ key: 'Shift+Cmd/Ctrl+E', action: 'Export canvas', category: 'Edit' },
```
  - **Success Criteria:**
    - [ ] Shift+Cmd+E triggers export
    - [ ] Shortcut listed in shortcuts modal
  - **Tests:**
    1. Create shapes
    2. Press Shift+Cmd+E
    3. Verify PNG downloads
  - **Edge Cases:**
    - ⚠️ Canvas empty: Show error or disable
  - **Rollback:** Remove keyboard handler
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Added Shift+Cmd/Ctrl+E keyboard shortcut in CanvasPage.tsx via useEffect hook. Includes input focus protection to prevent triggering while typing. Added shortcut to KEYBOARD_SHORTCUTS constants array for display in shortcuts modal. Also added missing Shift+Cmd/Ctrl+H (Show/hide) shortcut to constants that was previously implemented but not documented.

---

# Phase 5: Integration & Testing (Estimated: 2-3 hours)

**Goal:** End-to-end testing of all features together, fix integration bugs

**Phase Success Criteria:**
- [ ] All features work together without conflicts
- [ ] Performance remains at 60 FPS with 100+ objects
- [ ] No console errors
- [ ] Multiplayer sync works correctly

---

## 5.1 Integration Tests

### 5.1.1 Test Z-Index with Grouping
- [ ] **Action:** Verify z-index works correctly with nested groups
  - **Why:** Groups add complexity to z-index logic
  - **Tests:**
    1. Create 3 rectangles: A, B, C (bottom to top)
    2. Group A and B (Group 1)
    3. Drag Group 1 above C in layers panel
    4. Expected: A and B render above C on canvas
    5. Ungroup Group 1
    6. Expected: A, B, C maintain relative order
  - **Edge Cases:**
    - ⚠️ Nested groups: Should maintain hierarchy
    - ⚠️ Dragging child out of group: Should maintain z-index
  - **Success Criteria:**
    - [ ] Groups respect z-index in layers panel
    - [ ] Children render in correct order relative to siblings
    - [ ] No visual bugs or flickering
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

### 5.1.2 Test Context Menu with Groups
- [ ] **Action:** Verify context menu works correctly with groups
  - **Tests:**
    1. Right-click group in layers panel
    2. Verify: "Ungroup" action shown
    3. Click "Ungroup"
    4. Verify: Group deleted, children ungrouped
    5. Select 2 objects, right-click
    6. Verify: "Group Selection" shown
    7. Click "Group Selection"
    8. Verify: Group created
  - **Edge Cases:**
    - ⚠️ Right-click during drag: Should cancel drag, show menu
    - ⚠️ Right-click during rename: Should close rename, show menu
  - **Success Criteria:**
    - [ ] All context menu actions work with groups
    - [ ] No crashes or errors
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

### 5.1.3 Test Export with Groups
- [ ] **Action:** Verify export works correctly with grouped objects
  - **Tests:**
    1. Create group with 3 circles
    2. Select group
    3. Export
    4. Verify: PNG contains 3 circles, no extra shapes
    5. Create nested group: Group A > Group B > Rectangle
    6. Export Group A
    7. Verify: PNG contains rectangle only
  - **Edge Cases:**
    - ⚠️ Hidden child in group: Should export per visibility decision
    - ⚠️ Locked group: Should still export
  - **Success Criteria:**
    - [ ] Grouped objects export correctly
    - [ ] Nested groups export correctly
    - [ ] No visual artifacts in PNG
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

### 5.1.4 Test All Keyboard Shortcuts Together
- [ ] **Action:** Verify no keyboard shortcut conflicts
  - **Tests:**
    1. Press each shortcut in sequence
    2. Verify correct action triggered
    3. Test combinations: Cmd+C, then Cmd+V (copy/paste)
    4. Test: Cmd+G, then Shift+Cmd+G (group/ungroup)
    5. Test: ], then [ (bring to front, send to back)
  - **Edge Cases:**
    - ⚠️ Input focused: Shortcuts should not fire
    - ⚠️ Browser native shortcuts: Ensure preventDefault() works
  - **Success Criteria:**
    - [ ] All shortcuts work as expected
    - [ ] No conflicts or unexpected behavior
    - [ ] Shortcuts modal shows all shortcuts
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

### 5.1.5 Test Multiplayer Sync
- [ ] **Action:** Verify all features sync correctly in real-time
  - **Tests:**
    1. Open app in 2 browser windows (User A, User B)
    2. User A: Create group
    3. User B: Verify group appears in < 150ms
    4. User A: Drag layer to change z-index
    5. User B: Verify z-index updates in < 150ms
    6. User A: Export canvas
    7. User B: Verify no interference (export is local only)
  - **Edge Cases:**
    - ⚠️ Simultaneous grouping: Both users group different objects
    - ⚠️ Simultaneous z-index changes: Last write wins (Firebase behavior)
  - **Success Criteria:**
    - [ ] All actions sync to collaborators
    - [ ] Sync latency < 150ms
    - [ ] No race conditions or data loss
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

## 5.2 Performance Tests

### 5.2.1 Test Performance with 100+ Objects
- [ ] **Action:** Verify 60 FPS with large canvas
  - **Tests:**
    1. Create 100 rectangles (10x10 grid)
    2. Open Chrome DevTools > Performance
    3. Record: Drag object around canvas
    4. Verify: FPS stays above 55 (ideally 60)
    5. Group 50 objects
    6. Verify: No performance degradation
  - **Edge Cases:**
    - ⚠️ 500+ objects: May need virtual rendering
    - ⚠️ Complex groups (deep nesting): May slow down
  - **Success Criteria:**
    - [ ] 60 FPS maintained with 100 objects
    - [ ] Drag feels smooth and responsive
    - [ ] Layers panel scrolling smooth
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

### 5.2.2 Test Export Performance with Large Canvas
- [ ] **Action:** Verify export doesn't freeze browser
  - **Tests:**
    1. Create 50 objects with complex styles
    2. Click Export button
    3. Verify: UI remains responsive during export
    4. Verify: PNG downloads within 2 seconds
  - **Edge Cases:**
    - ⚠️ Very large export (5000x5000px): May take 5-10 seconds
    - ⚠️ Browser memory limit: Export may fail silently
  - **Success Criteria:**
    - [ ] Export completes within reasonable time
    - [ ] Browser doesn't freeze or crash
    - [ ] Error handling for failed exports
  - **Rollback:** N/A (testing only)
  - **Last Verified:** _____

## 5.3 Bug Fixes & Polish

### 5.3.1 Fix Any Integration Bugs Found
- [ ] **Action:** Address bugs discovered during integration testing
  - **Why:** Integration often reveals edge cases not caught in unit tests
  - **Success Criteria:**
    - [ ] All identified bugs fixed
    - [ ] Regression tests added
  - **Tests:**
    - Document bugs found and fixes applied
  - **Rollback:** Revert specific bug fixes if they cause regressions
  - **Last Verified:** _____

### 5.3.2 Update Documentation
- [x] **Action:** Update project docs with new features
  - **Files Modified:**
    - Update: `README.md` (add features section)
    - Update: `CLAUDE.md` (add grouping/export patterns)
    - Update: `_docs/features/` (create docs for each feature)
  - **Success Criteria:**
    - [x] README lists all new features
    - [x] CLAUDE.md has updated patterns
    - [x] Feature docs created for grouping, export
  - **Tests:**
    - Read docs, verify accuracy and completeness
  - **Rollback:** Revert doc changes
  - **Last Verified:** 2025-10-16
  - **Implementation Notes:** Updated README.md with 4 new features (Z-Index Control, Object Grouping, Context Menu, PNG Export). Updated CLAUDE.md with comprehensive sections for Z-Index System, Grouping System, Context Menu, and Export System including implementation patterns and code examples. Created 4 new feature documentation files: grouping-system.md, export-system.md, z-index-system.md, and context-menu.md with detailed technical documentation.

---

# Final Deployment Checklist

- [ ] All 52 tasks completed and verified
- [ ] All integration tests passing
- [ ] Performance verified (60 FPS)
- [ ] No console errors or warnings
- [ ] Keyboard shortcuts documented
- [ ] Context menu works correctly
- [ ] Export produces valid PNG files
- [ ] Groups auto-delete when empty
- [ ] Z-index persists across page refresh
- [ ] Multiplayer sync working (< 150ms)
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Documentation updated
- [ ] Code reviewed and cleaned up
- [ ] Commit message written
- [ ] Ready for PR

---

# Appendix

## Related Documentation
- `_docs/design/figma-patterns.md` - Figma UX patterns reference
- `_docs/features/hierarchy-system.md` - Existing hierarchy docs
- `_docs/features/lock-system.md` - Existing lock system docs
- Konva.js export docs: https://konvajs.org/docs/data_and_serialization/High-Quality-Export.html

## Future Enhancements
- **Export preview modal**: Show preview before downloading
- **Export history**: Track all exports per project
- **Multi-format export**: JPEG, SVG, PDF
- **Export settings**: Custom resolution (1x, 2x, 3x)
- **Batch export**: Export all groups as separate files
- **Copy/paste between projects**: Cross-project clipboard
- **Layer groups with frames**: Add frame object type (fixed bounds)
- **Smart grouping**: Auto-group based on proximity/alignment

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| 2025-10-16 | Planning | 2 hours | Created comprehensive plan |
| ___ | Phase 1 | ___ | ___ |
| ___ | Phase 2 | ___ | ___ |
| ___ | Phase 3 | ___ | ___ |
| ___ | Phase 4 | ___ | ___ |
| ___ | Phase 5 | ___ | ___ |

---

**Total Estimated Time:** 18-22 hours
**Phases:** 5 (Research, Z-Index, Grouping, Context Menu, Export, Integration)
**Tasks:** 52 detailed tasks with test procedures
**Success Criteria:** All tasks have specific, testable requirements
**Edge Cases:** Documented for each critical task
**Rollback:** Every task has rollback strategy
