# Canvas Performance Optimization Plan

**Created:** 2025-10-18
**Estimated Time:** 6-7 weeks (160-180 hours)
**Dependencies:** None (all optimizations are additive)
**Risk Level:** LOW (proven patterns, backward compatible)

**Goal:** Improve canvas rendering performance from 5-10 FPS to 60 FPS with 500+ objects through viewport culling, memoization, and algorithmic optimizations.

**Success Metrics:**
- Frame rate: 5-10 FPS → 60 FPS (with 500 objects)
- Render time: 50-100ms → <5ms per frame
- Drag latency: 200-500ms → <50ms
- Memory usage: Unbounded → <200MB (stable)

---

## Phase 0: Research & Planning

**Status:** ✅ COMPLETE (audit finished)
**Time:** 8 hours

### Findings from Audit

**Critical Issues:**
1. No viewport culling - renders all objects even when off-screen
2. StageObjects not memoized - re-renders on every cursor move
3. dragStates uses O(n²) find() lookups

**High Priority:**
4. areObjectArraysEqual is O(n) on every Firebase update
5. Group drag throttle at 100ms (should be 50ms)
6. Shape state functions create new objects every render

**Technical Constraints:**
- Must maintain 60 FPS with 500+ objects
- Must preserve existing Firebase RTDB patterns
- Must not break real-time collaboration
- Must support zoom levels 0.1x to 10x

**Architecture Decisions:**
- Use bounding box intersection for viewport culling
- Implement shallow equality comparison for React.memo
- Convert all array.find() to Map.get() for O(1) lookup
- Use LRU cache pattern for image pool

**Reference Documentation:**
- Audit: `_docs/performance/AUDIT_SUMMARY.md`
- Analysis: `_docs/performance/CANVAS_RENDERING_ANALYSIS.md`
- Checklist: `_docs/performance/OPTIMIZATION_CHECKLIST.md`

---

## Phase 1: Critical Performance Fixes

**Goal:** Achieve 5-10x performance improvement (5-10 FPS → 30-50 FPS)
**Time Estimate:** 2 weeks (80 hours)
**Dependencies:** None
**Risk:** LOW

### Task Group 1.1: Viewport Culling Implementation (8 hours)

#### 1.1.1 Create Viewport Utility Functions

- [x] **Action:** Create `src/lib/utils/viewport.ts` with culling helpers <!-- Completed: 2025-10-18 -->
  - **Why:** Centralized viewport calculations for object visibility detection
  - **Files Modified:**
    - Create: `src/lib/utils/viewport.ts`
  - **Implementation Details:**
```typescript
import type { CanvasObject } from '@/types'
import type Konva from 'konva'

/**
 * Check if object is visible in current viewport
 */
export function isObjectInViewport(
  obj: CanvasObject,
  stage: Konva.Stage,
  padding = 100 // Extra padding for smooth transitions
): boolean {
  const viewport = getViewportBounds(stage, padding)
  const objBounds = getObjectBounds(obj)

  return (
    objBounds.x < viewport.x + viewport.width &&
    objBounds.x + objBounds.width > viewport.x &&
    objBounds.y < viewport.y + viewport.height &&
    objBounds.y + objBounds.height > viewport.y
  )
}

/**
 * Get viewport bounds in canvas coordinates
 */
export function getViewportBounds(
  stage: Konva.Stage,
  padding = 0
): { x: number; y: number; width: number; height: number } {
  const scale = stage.scaleX() // Assumes scaleX === scaleY
  const position = stage.position()

  return {
    x: -position.x / scale - padding,
    y: -position.y / scale - padding,
    width: stage.width() / scale + padding * 2,
    height: stage.height() / scale + padding * 2,
  }
}

/**
 * Get object bounding box including rotation and stroke
 */
export function getObjectBounds(obj: CanvasObject): {
  x: number
  y: number
  width: number
  height: number
} {
  const strokeWidth = obj.strokeWidth || 0
  const shadowBlur = obj.shadowEnabled ? (obj.shadowBlur || 0) : 0
  const padding = strokeWidth + shadowBlur

  // Handle different object types
  switch (obj.type) {
    case 'circle':
      const radius = obj.radius || 0
      return {
        x: obj.x - radius - padding,
        y: obj.y - radius - padding,
        width: radius * 2 + padding * 2,
        height: radius * 2 + padding * 2,
      }

    case 'line':
      return {
        x: obj.x - padding,
        y: obj.y - padding,
        width: (obj.width || 0) + padding * 2,
        height: 10 + padding * 2, // Line height approximation
      }

    default: // rectangle, text, image, group
      return {
        x: obj.x - padding,
        y: obj.y - padding,
        width: (obj.width || 0) + padding * 2,
        height: (obj.height || 0) + padding * 2,
      }
  }
}

/**
 * Filter objects to only those visible in viewport
 */
export function filterVisibleObjects(
  objects: CanvasObject[],
  stage: Konva.Stage | null
): CanvasObject[] {
  if (!stage) return objects

  return objects.filter(obj => isObjectInViewport(obj, stage))
}
```
  - **Success Criteria:**
    - [ ] All functions have JSDoc comments
    - [ ] Type annotations on all parameters and returns
    - [ ] Handles all object types (rectangle, circle, line, text, image, group)
    - [ ] Accounts for stroke width and shadows
  - **Tests:**
    1. Create test stage with zoom=1, pan=(0,0), size=1000x1000
    2. Test object at (500, 500, 100x100) → should be visible
    3. Test object at (-500, -500, 100x100) → should NOT be visible
    4. Test object with rotation=45° → bounds calculated correctly
    5. Test circle with radius=50 → bounds include full circle
  - **Edge Cases:**
    - ⚠️ Stage is null (initial render): Return all objects
    - ⚠️ Object has rotation: Bounding box must account for rotated dimensions
    - ⚠️ Extreme zoom (0.01x or 100x): Calculations remain accurate

#### 1.1.2 Add Viewport Culling to StageObjects

- [x] **Action:** Update `StageObjects.tsx` to filter visible objects <!-- Completed: 2025-10-18 -->
  - **Why:** Reduce render count from 500 to ~50 visible objects (10x improvement)
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/stage/StageObjects.tsx`
  - **Implementation Details:**
```typescript
import { useMemo } from 'react'
import { filterVisibleObjects } from '@/lib/utils/viewport'

export function StageObjects({ objects, ... }: StageObjectsProps) {
  const stageRef = useCanvasStore((state) => state.stageRef)
  const zoom = useCanvasStore((state) => state.zoom)
  const pan = useCanvasStore((state) => state.pan)

  // Filter to only visible objects
  const visibleObjects = useMemo(() => {
    return filterVisibleObjects(objects, stageRef)
  }, [objects, stageRef, zoom, pan])

  // Render only visible objects
  return (
    <>
      {visibleObjects.map((obj) => {
        // ... existing render logic
      })}
    </>
  )
}
```
  - **Success Criteria:**
    - [ ] Only visible objects rendered to canvas
    - [ ] Objects appear when scrolled into view
    - [ ] Objects disappear when scrolled out of view
    - [ ] No flickering during pan/zoom
    - [ ] Frame rate improves with large object count
  - **Tests:**
    1. Generate 500 test objects: `window.generateTestLines(500)`
    2. Open DevTools Performance tab
    3. Record while panning around canvas
    4. Verify: Only ~50-100 objects rendered at any time
    5. Zoom out to 0.1x → verify objects off-screen not rendered
    6. Pan to corner with no objects → verify 0 objects rendered
  - **Edge Cases:**
    - ⚠️ Object straddling viewport edge: Must remain visible (use padding)
    - ⚠️ Fast panning: Objects must appear smoothly (100px padding)
    - ⚠️ Group with children off-screen: Parent still visible

#### 1.1.3 Add Viewport Culling to Remote Selections

- [x] **Action:** Filter remote selection overlays by viewport <!-- Completed: 2025-10-18 -->
  - **Why:** Prevent rendering 100+ invisible selection overlays
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/stage/StageObjects.tsx` (remote selections section)
  - **Implementation Details:**
```typescript
// After visibleObjects calculation
const visibleObjectIds = useMemo(
  () => new Set(visibleObjects.map(o => o.id)),
  [visibleObjects]
)

// In remote selections render
{remoteSelections.flatMap((selection) => {
  return selection.objectIds
    .filter(id => visibleObjectIds.has(id)) // Only render if object visible
    .map((objectId) => {
      const object = objects.find(o => o.id === objectId)
      if (!object) return null

      return (
        <SelectionOverlay
          key={`${selection.userId}-${objectId}`}
          object={object}
          color={selection.color}
        />
      )
    })
})}
```
  - **Success Criteria:**
    - [ ] Only visible remote selections rendered
    - [ ] Selections appear/disappear with viewport
    - [ ] Multi-user selection performance improved
  - **Tests:**
    1. Have 2 users select 10 objects each
    2. Pan to area with no selections
    3. Verify: 0 selection overlays rendered
    4. Pan to area with selections
    5. Verify: Only visible selection overlays rendered
  - **Edge Cases:**
    - ⚠️ Selection for deleted object: Check object exists before rendering
    - ⚠️ User selects object outside viewport: Selection doesn't render (expected)

---

### Task Group 1.2: Component Memoization (4 hours)

#### 1.2.1 Memoize StageObjects Component

- [x] **Action:** Wrap `StageObjects` in React.memo with shallow comparison <!-- Completed: 2025-10-18 -->
  - **Why:** Prevent re-renders on unrelated state changes (cursor moves, etc.)
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/stage/StageObjects.tsx`
  - **Implementation Details:**
```typescript
import { memo } from 'react'

export const StageObjects = memo(
  function StageObjects({ objects, selectedIds, dragStates, ... }: StageObjectsProps) {
    // ... existing component logic
  },
  (prev, next) => {
    // Custom comparison function
    return (
      prev.objects === next.objects &&
      prev.selectedIds === next.selectedIds &&
      prev.dragStates === next.dragStates &&
      prev.resizeStates === next.resizeStates &&
      prev.editStates === next.editStates
    )
  }
)
```
  - **Success Criteria:**
    - [ ] Component memoized with React.memo
    - [ ] Custom comparison function implemented
    - [ ] Component only re-renders when props actually change
    - [ ] No flickering or stale renders
  - **Tests:**
    1. Open React DevTools Profiler
    2. Move cursor around canvas (no objects selected)
    3. Verify: StageObjects does NOT re-render on cursor move
    4. Select an object
    5. Verify: StageObjects DOES re-render on selection change
  - **Edge Cases:**
    - ⚠️ Array reference changes but content identical: Use shallow comparison
    - ⚠️ Deep object changes not detected: Acceptable (state should have new reference)

#### 1.2.2 Memoize StagePreviewShapes Component

- [x] **Action:** Wrap `StagePreviewShapes` in React.memo <!-- Completed: 2025-10-18 -->
  - **Why:** Prevent re-renders during canvas interactions
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/stage/StagePreviewShapes.tsx`
  - **Implementation Details:**
```typescript
import { memo } from 'react'

export const StagePreviewShapes = memo(
  function StagePreviewShapes({ currentTool, currentToolSettings, ... }: Props) {
    // ... existing component logic
  }
)
```
  - **Success Criteria:**
    - [ ] Component wrapped in React.memo
    - [ ] No re-renders unless preview changes
    - [ ] Preview shapes render correctly
  - **Tests:**
    1. Select rectangle tool
    2. Move mouse without drawing
    3. Verify: StagePreviewShapes renders once, not continuously
    4. Start drawing rectangle
    5. Verify: StagePreviewShapes updates during draw
  - **Edge Cases:**
    - ⚠️ Tool change during draw: Preview updates correctly

---

### Task Group 1.3: Optimize Drag State Lookups (4 hours)

#### 1.3.1 Convert dragStates to Map in useDragStates Hook

- [x] **Action:** Update `useDragStates` to return Map instead of array <!-- Completed: 2025-10-18 -->
  - **Why:** Change O(n²) lookups to O(1) for massive performance gain
  - **Files Modified:**
    - Update: `src/features/collaboration/hooks/useDragStates.ts`
  - **Implementation Details:**
```typescript
import { useState, useEffect, useMemo } from 'react'
import type { DragState } from '@/types'

export function useDragStates(canvasId: string): Map<string, DragState> {
  const [dragStatesArray, setDragStatesArray] = useState<DragState[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToDragStates(canvasId, (states) => {
      setDragStatesArray(Object.values(states))
    })
    return () => unsubscribe()
  }, [canvasId])

  // Convert to Map for O(1) lookup
  const dragStatesMap = useMemo(
    () => new Map(dragStatesArray.map(d => [d.objectId, d])),
    [dragStatesArray]
  )

  return dragStatesMap
}
```
  - **Success Criteria:**
    - [ ] Hook returns Map<string, DragState> instead of array
    - [ ] Map keys are objectId values
    - [ ] Map updates when Firebase data changes
    - [ ] No performance regression
  - **Tests:**
    1. Start dragging object 'obj-123'
    2. Call: `dragStates.get('obj-123')`
    3. Verify: Returns drag state for obj-123
    4. Call: `dragStates.get('non-existent')`
    5. Verify: Returns undefined
  - **Edge Cases:**
    - ⚠️ Empty drag states: Returns empty Map (size = 0)
    - ⚠️ Duplicate objectId: Later value overwrites (Map behavior)

#### 1.3.2 Update StageObjects to Use Map Lookup

- [x] **Action:** Change dragStates.find() to dragStates.get() <!-- Completed: 2025-10-18 -->
  - **Why:** O(1) lookup instead of O(n) - critical for performance
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/stage/StageObjects.tsx`
  - **Implementation Details:**
```typescript
// BEFORE:
{objects.map(obj => {
  const dragState = dragStates.find(d => d.objectId === obj.id) // ❌ O(n)
  return <Shape dragState={dragState} ... />
})}

// AFTER:
{objects.map(obj => {
  const dragState = dragStates.get(obj.id) // ✅ O(1)
  return <Shape dragState={dragState} ... />
})}
```
  - **Success Criteria:**
    - [ ] All .find() calls replaced with .get()
    - [ ] No runtime errors
    - [ ] Drag states still display correctly
    - [ ] Performance improves significantly
  - **Tests:**
    1. Generate 500 objects: `window.generateTestLines(500)`
    2. Start dragging 1 object
    3. Open DevTools Performance tab
    4. Record for 5 seconds
    5. Verify: No long tasks (>50ms) during drag
    6. Stop recording, analyze
    7. Expected: Drag handler takes <5ms (vs 20-50ms before)
  - **Edge Cases:**
    - ⚠️ Object not in drag state: .get() returns undefined (handled by components)

#### 1.3.3 Apply Same Pattern to Resize and Edit States

- [x] **Action:** Convert resizeStates and editStates to Maps <!-- Completed: 2025-10-18 - Already optimized -->
  - **Why:** Consistency and performance across all state lookups
  - **Status:** No changes needed
    - `editStates`: Already uses Record<string, EditState> (O(1) lookup via `editStates[id]`)
    - `resizeStates`: Array is appropriate (only used for .map() iteration, no lookups)
  - **Files Modified:** None
  - **Implementation Details:**
```typescript
// useResizeStates.ts
export function useResizeStates(canvasId: string): Map<string, ResizeState> {
  const [states, setStates] = useState<ResizeState[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToResizeStates(canvasId, (states) => {
      setStates(Object.values(states))
    })
    return () => unsubscribe()
  }, [canvasId])

  return useMemo(
    () => new Map(states.map(s => [s.objectId, s])),
    [states]
  )
}

// useEditStates.ts - same pattern for edit states

// StageObjects.tsx - update lookups
const resizeState = resizeStates.get(obj.id)
const editState = editStates.get(obj.id)
```
  - **Success Criteria:**
    - [ ] Both hooks return Maps
    - [ ] All lookups use .get() instead of .find()
    - [ ] Resize and edit interactions work correctly
    - [ ] No performance regressions
  - **Tests:**
    1. Start resizing object → verify resize handles appear
    2. Start editing text → verify edit state shows correctly
    3. With 500 objects, resize 1 object → verify smooth interaction
  - **Edge Cases:**
    - ⚠️ Multiple objects resizing: Each has separate entry in Map

---

### Task Group 1.4: Testing & Validation (4 hours)

#### 1.4.1 Automated Performance Tests

- [ ] **Action:** Run performance test suite with 500 objects
  - **Why:** Verify Phase 1 optimizations achieve target metrics
  - **Files Modified:**
    - None (uses existing test utilities)
  - **Test Procedure:**
```bash
# In browser console:
window.generateTestLines(500)
await window.measureFPS(10) # 10 second measurement
window.clearTestShapes()
```
  - **Success Criteria:**
    - [ ] Frame rate ≥ 30 FPS (target: 30-50 FPS)
    - [ ] P95 frame time ≤ 30ms
    - [ ] No frames longer than 50ms
    - [ ] Memory stable during test
  - **Expected Results:**
    - Before: 5-10 FPS, 50-100ms frame times
    - After: 30-50 FPS, 10-20ms frame times
  - **Edge Cases:**
    - ⚠️ Background processes: Close other tabs, disable extensions
    - ⚠️ Machine specs: Results vary by hardware (test on target device)

#### 1.4.2 Multi-User Collaboration Testing

- [ ] **Action:** Test with 5 users, 100 objects each
  - **Why:** Verify performance with realistic collaborative workload
  - **Files Modified:**
    - None (manual testing)
  - **Test Procedure:**
    1. Open 5 browser tabs (or use 5 devices)
    2. Each tab: Create 100 objects in different areas
    3. All tabs: Simultaneously drag objects
    4. Measure FPS in each tab
    5. Verify selections/cursors render smoothly
  - **Success Criteria:**
    - [ ] All tabs maintain ≥30 FPS
    - [ ] Remote cursors update smoothly
    - [ ] Remote selections appear/disappear correctly
    - [ ] No network errors or Firebase throttling
  - **Edge Cases:**
    - ⚠️ Network latency: Test on slow connection (throttle to 3G)
    - ⚠️ Concurrent edits: Verify no race conditions

#### 1.4.3 Edge Case Testing

- [ ] **Action:** Test extreme zoom, large canvases, rapid interactions
  - **Why:** Ensure optimizations work in all scenarios
  - **Test Cases:**
```markdown
1. **Extreme zoom out (0.01x):**
   - Generate 1000 objects
   - Zoom out to 0.01x
   - Pan around
   - Expected: Smooth panning, 60 FPS

2. **Extreme zoom in (100x):**
   - Focus on single object
   - Zoom to 100x
   - Drag object
   - Expected: Smooth drag, handles visible

3. **Rapid tool switching:**
   - Switch tools 10x per second
   - Expected: No crashes, preview updates correctly

4. **Large group drag:**
   - Select 100 objects
   - Drag as group
   - Expected: All move smoothly, 30+ FPS

5. **Off-screen selection:**
   - Select object outside viewport
   - Pan to view it
   - Expected: Selection appears when scrolled into view
```
  - **Success Criteria:**
    - [ ] All test cases pass
    - [ ] No console errors
    - [ ] Frame rate remains acceptable
    - [ ] No visual glitches
  - **Edge Cases:**
    - ⚠️ Browser crashes: Reduce test complexity, check memory leaks
    - ⚠️ Firebase disconnects: Graceful degradation, reconnect works

---

## Phase 2: High Priority Optimizations

**Goal:** Smoother collaboration and consistent 50+ FPS
**Time Estimate:** 2 weeks (80 hours)
**Dependencies:** Phase 1 complete
**Risk:** LOW

### Task Group 2.1: Optimize Equality Checks (3 hours)

#### 2.1.1 Replace areObjectArraysEqual with Reference Check

- [x] **Action:** Update `canvasStore.ts` to use reference equality <!-- Completed: 2025-10-18 -->
  - **Why:** Eliminate 10,000+ property comparisons per Firebase update
  - **Files Modified:**
    - Update: `src/stores/canvas/canvasStore.ts`
  - **Implementation Details:**
```typescript
// BEFORE:
setObjects: (objects: CanvasObject[]) =>
  set((state) => {
    if (areObjectArraysEqual(state.objects, objects)) {
      return state // ❌ O(n×m) comparison
    }
    // ... merge logic
  })

// AFTER:
setObjects: (objects: CanvasObject[]) =>
  set((state) => {
    if (state.objects === objects) {
      return state // ✅ O(1) reference check
    }
    // ... merge logic
  })
```
  - **Success Criteria:**
    - [ ] Reference equality used instead of deep comparison
    - [ ] No unnecessary re-renders
    - [ ] Objects still update correctly from Firebase
  - **Tests:**
    1. Update object remotely (from another tab)
    2. Verify: Local canvas updates
    3. Update object locally
    4. Verify: No unnecessary re-renders
  - **Edge Cases:**
    - ⚠️ Same array instance with mutated contents: Won't detect (but shouldn't happen with immutable patterns)

#### 2.1.2 Ensure Firebase Service Returns New Array References

- [x] **Action:** Verify `realtimeCanvasService` always returns new array <!-- Completed: 2025-10-18 - Already correct -->
  - **Why:** Required for reference equality to work correctly
  - **Files Modified:**
    - Review: `src/lib/firebase/realtimeCanvasService.ts`
    - Update if necessary
  - **Implementation Details:**
```typescript
// Verify this pattern exists:
export function subscribeToCanvasObjects(
  canvasId: string,
  callback: (objects: CanvasObject[]) => void
): () => void {
  const unsubscribe = onValue(objectsRef, (snapshot) => {
    const data = snapshot.val()

    // ✅ Creates NEW array on every update
    const objectsArray: CanvasObject[] = Object.entries(data || {})
      .map(([id, obj]) => ({ ...obj, id }))
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

    callback(objectsArray) // New reference every time
  })

  return unsubscribe
}
```
  - **Success Criteria:**
    - [ ] Service returns new array reference on each update
    - [ ] Array is not mutated after creation
    - [ ] Reference equality works as expected
  - **Tests:**
    1. Subscribe to objects
    2. Update object in Firebase
    3. Verify: Callback receives different array reference
    4. Compare: `prevArray !== newArray` (should be true)
  - **Edge Cases:**
    - ⚠️ No objects in database: Returns empty array (still new reference)

---

### Task Group 2.2: Fix Group Drag Throttle (1 hour)

#### 2.2.1 Reduce Group Drag Throttle to 50ms

- [x] **Action:** Update `useGroupDrag.ts` throttle from 100ms to 50ms <!-- Completed: 2025-10-18 -->
  - **Why:** Match individual object drag for consistent remote UX
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useGroupDrag.ts`
  - **Implementation Details:**
```typescript
// BEFORE:
const syncToFirebase = useRef(
  throttle(async (updates: Record<string, { x: number; y: number }>) => {
    await batchUpdateCanvasObjects(projectId, updates)
  }, 100) // ❌ Too long
).current

// AFTER:
const syncToFirebase = useRef(
  throttle(async (updates: Record<string, { x: number; y: number }>) => {
    await batchUpdateCanvasObjects(projectId, updates)
  }, 50) // ✅ Match individual object drag
).current
```
  - **Success Criteria:**
    - [ ] Throttle changed to 50ms
    - [ ] Group drag still smooth locally
    - [ ] Remote users see smoother group drag (20 updates/sec vs 10)
  - **Tests:**
    1. Open 2 browser tabs
    2. Tab 1: Select 10 objects, drag as group
    3. Tab 2: Watch remote group drag
    4. Verify: Smooth movement (no jerkiness)
  - **Edge Cases:**
    - ⚠️ Very large groups (100+ objects): May need adaptive throttle based on group size

---

### Task Group 2.3: Memoize Shape State Functions (6 hours)

#### 2.3.1 Memoize Rectangle Shape State

- [x] **Action:** Wrap state calculations in useMemo for Rectangle <!-- Completed: 2025-10-18 -->
  - **Why:** Prevent creating new objects every render
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
  - **Implementation Details:**
```typescript
// BEFORE:
const getShapeState = () => {
  if (rectangle.locked) return 'locked'
  if (isSelected) return 'selected'
  return 'default'
} // ❌ New function every render

// AFTER:
const shapeState = useMemo(() => {
  if (rectangle.locked) return 'locked'
  if (isSelected) return 'selected'
  return 'default'
}, [rectangle.locked, isSelected]) // ✅ Memoized
```
  - **Success Criteria:**
    - [ ] All state calculations wrapped in useMemo
    - [ ] Dependencies correctly specified
    - [ ] No stale state issues
    - [ ] React.memo optimizations work correctly
  - **Tests:**
    1. Render 100 rectangles
    2. Update unrelated state (e.g., cursor position)
    3. Verify: Rectangles don't re-render
    4. Select one rectangle
    5. Verify: Only that rectangle re-renders
  - **Edge Cases:**
    - ⚠️ Missing dependencies: ESLint will warn, add all used values

#### 2.3.2 Apply Same Pattern to Circle, Line, Text, Image

- [x] **Action:** Memoize state functions in all shape components <!-- Completed: 2025-10-18 -->
  - **Why:** Consistent optimization across all shape types
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
    - Update: `src/features/canvas-core/shapes/text/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Implementation Details:**
```typescript
// Apply same pattern to each shape:
const shapeState = useMemo(() => {
  if (obj.locked) return 'locked'
  if (isSelected) return 'selected'
  return 'default'
}, [obj.locked, isSelected])

// Also memoize computed properties:
const handleColor = useMemo(() => {
  return shapeState === 'selected' ? '#0ea5e9' : 'transparent'
}, [shapeState])

const linePoints = useMemo(() => {
  // Complex point calculations
  return computedPoints
}, [line.x, line.y, line.rotation, ...])
```
  - **Success Criteria:**
    - [ ] All shapes have memoized state
    - [ ] All complex calculations wrapped in useMemo
    - [ ] Dependencies complete and correct
    - [ ] No visual regressions
  - **Tests:**
    1. Create mixed canvas: 50 rectangles, 50 circles, 50 lines
    2. Drag one object
    3. Verify: Only that object and its handles re-render
    4. Use React DevTools Profiler
    5. Expected: <10 components re-render on single object drag
  - **Edge Cases:**
    - ⚠️ Text shape editing: Ensure edit mode triggers correct re-render

---

### Task Group 2.4: Optimize Coordinate Transforms (4 hours)

**Note:** Cursor updates are already throttled at 50ms via `throttledUpdateCursor`. Further optimization would require refactoring the coordinate transform to be throttled independently, which is a lower priority optimization since cursor updates are already efficient.

#### 2.4.1 Throttle Cursor Updates Separately from Drag

- [ ] **Action:** Move cursor updates out of drag handler (DEFERRED - already throttled adequately)
  - **Why:** Avoid expensive coordinate transforms 60x per second
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
    - Update: Similar pattern in Circle.tsx, Line.tsx, etc.
  - **Implementation Details:**
```typescript
// Create separate throttled cursor update
const updateCursorPosition = useRef(
  throttle((stage: Konva.Stage, userId: string, color: string) => {
    const pointerPosition = stage.getPointerPosition()
    if (pointerPosition) {
      const coords = screenToCanvasCoords(stage, pointerPosition)
      throttledUpdateCursor(userId, coords.x, coords.y, color)
    }
  }, 50)
).current

function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
  const node = e.target
  const position = { x: node.x(), y: node.y() }

  // Update object position (fast)
  updateObject(rectangle.id, position)
  throttledUpdateDragPosition(...)

  // Update cursor (throttled separately, less frequent)
  const stage = node.getStage()
  if (stage && currentUser) {
    updateCursorPosition(stage, currentUser.uid, userColor)
  }
}
```
  - **Success Criteria:**
    - [ ] Cursor updates throttled independently
    - [ ] Drag position updates not affected
    - [ ] Coordinate transforms called less frequently
    - [ ] Cursor still follows drag smoothly
  - **Tests:**
    1. Start dragging object
    2. Use Performance Profiler
    3. Verify: screenToCanvasCoords called ≤20x per second
    4. Before: Called 60x per second
  - **Edge Cases:**
    - ⚠️ Rapid drag start/stop: Cursor position may lag slightly (acceptable)

#### 2.4.2 Apply Pattern to All Shape Components

- [ ] **Action:** Implement optimized cursor updates in Circle, Line, Text, Image (DEFERRED - dependent on 2.4.1)
  - **Why:** Consistent performance across all drag interactions
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
    - Update: `src/features/canvas-core/shapes/text/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Success Criteria:**
    - [ ] All shapes use optimized cursor pattern
    - [ ] No duplicate coordinate transform calls
    - [ ] Drag performance improved across all types
  - **Tests:**
    1. Drag each shape type (rectangle, circle, line, text, image)
    2. Verify smooth drag for all types
    3. Profile each drag operation
    4. Expected: Similar performance across all shapes
  - **Edge Cases:**
    - ⚠️ Line has different drag behavior: Adapt pattern to line-specific logic

---

### Task Group 2.5: Testing & Validation (2 hours)

#### 2.5.1 Run Performance Benchmarks

- [ ] **Action:** Measure improvements from Phase 2 optimizations (USER TESTING - Manual verification required)
  - **Test Procedure:**
```bash
# Generate 500 test objects
window.generateTestLines(500)

# Measure FPS
await window.measureFPS(10)

# Test group drag
# Select 50 objects, drag for 10 seconds
# Verify remote smoothness in second tab

# Cleanup
window.clearTestShapes()
```
  - **Success Criteria:**
    - [ ] Frame rate ≥ 50 FPS (sustained)
    - [ ] Group drag smooth locally and remotely
    - [ ] No long tasks during drag
    - [ ] Memory usage stable
  - **Expected Results:**
    - Phase 1: 30-50 FPS
    - Phase 2: 50-60 FPS

---

## Phase 3: Medium Priority Optimizations

**Goal:** Stable 60 FPS, eliminate memory leaks
**Time Estimate:** 2 weeks (80 hours)
**Dependencies:** Phase 2 complete
**Risk:** LOW

### Task Group 3.1: Implement LRU Cache for Images (8 hours)

#### 3.1.1 Create LRU Cache Utility

- [ ] **Action:** Create `src/lib/utils/lruCache.ts`
  - **Why:** Reusable LRU cache for image pool and future use cases
  - **Files Modified:**
    - Create: `src/lib/utils/lruCache.ts`
  - **Implementation Details:**
```typescript
/**
 * Least Recently Used (LRU) Cache
 *
 * Automatically evicts least recently used items when max size reached.
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }

    return value
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    // Add to end (most recently used)
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}
```
  - **Success Criteria:**
    - [ ] LRU cache implemented with get/set/has/clear
    - [ ] Auto-evicts oldest when at max size
    - [ ] TypeScript generics for type safety
    - [ ] Unit tests pass
  - **Tests:**
```typescript
const cache = new LRUCache<string, number>(3)

cache.set('a', 1)
cache.set('b', 2)
cache.set('c', 3)
// Cache: [a, b, c]

cache.get('a') // Move 'a' to end
// Cache: [b, c, a]

cache.set('d', 4) // Evict 'b' (oldest)
// Cache: [c, a, d]

expect(cache.has('b')).toBe(false)
expect(cache.has('a')).toBe(true)
expect(cache.size).toBe(3)
```
  - **Edge Cases:**
    - ⚠️ Max size = 0: Should allow 0 items
    - ⚠️ Negative max size: Throw error in constructor

#### 3.1.2 Update Image Pool to Use LRU Cache

- [ ] **Action:** Replace Map with LRUCache in `imagePool.ts`
  - **Why:** Prevent memory leaks from unbounded cache growth
  - **Files Modified:**
    - Update: `src/lib/utils/imagePool.ts`
  - **Implementation Details:**
```typescript
import { LRUCache } from './lruCache'

const MAX_CACHED_IMAGES = 100
const imageCache = new LRUCache<string, HTMLImageElement>(MAX_CACHED_IMAGES)

export function getImage(url: string): Promise<HTMLImageElement> {
  // Check cache
  const cached = imageCache.get(url)
  if (cached) {
    return Promise.resolve(cached)
  }

  // Load image
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      imageCache.set(url, img) // Auto-evicts if at capacity
      resolve(img)
    }

    img.onerror = reject
    img.src = url
  })
}
```
  - **Success Criteria:**
    - [ ] Image pool uses LRU cache
    - [ ] Cache size limited to 100 images
    - [ ] Least recently used images evicted
    - [ ] No memory leaks over long sessions
  - **Tests:**
    1. Load 200 different images
    2. Check memory usage
    3. Expected: Only ~100 images in memory
    4. Access first 50 images again
    5. Expected: Those 50 remain cached
  - **Edge Cases:**
    - ⚠️ Same image loaded twice: Returns cached version (no duplicate load)
    - ⚠️ Image load fails: Not added to cache

---

### Task Group 3.2: Optimize Selected IDs Cleanup (2 hours)

#### 3.2.1 Use Set for O(1) Validation Lookup

- [ ] **Action:** Update `canvasStore.ts` selectedIds cleanup to use Set
  - **Why:** Reduce 25,000 comparisons to 50 lookups
  - **Files Modified:**
    - Update: `src/stores/canvas/canvasStore.ts`
  - **Implementation Details:**
```typescript
// BEFORE:
const validSelectedIds = state.selectedIds.filter(id =>
  merged.some(obj => obj.id === id) // ❌ O(n×m)
)

// AFTER:
const objectIds = new Set(merged.map(o => o.id))
const validSelectedIds = state.selectedIds.filter(id =>
  objectIds.has(id) // ✅ O(1) lookup
)
```
  - **Success Criteria:**
    - [ ] Set used for object ID lookup
    - [ ] selectedIds correctly filtered
    - [ ] Performance improved on large canvases
  - **Tests:**
    1. Create 500 objects
    2. Select 50 objects
    3. Update 1 object remotely
    4. Verify: selectedIds cleanup takes <1ms
    5. Before: Took 5-10ms
  - **Edge Cases:**
    - ⚠️ All selected objects deleted: validSelectedIds becomes empty array

---

### Task Group 3.3: Fix Animation Dependencies (4 hours)

#### 3.3.1 Add Missing Dependencies to Rectangle Animations

- [ ] **Action:** Update useEffect dependencies in Rectangle.tsx
  - **Why:** Fix ESLint warnings and prevent stale closure bugs
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
  - **Implementation Details:**
```typescript
useEffect(() => {
  if (!shapeRef.current) return

  shapeRef.current.to({
    x: rectangle.x,
    y: rectangle.y,
    width: rectangle.width,
    height: rectangle.height,
    rotation: rectangle.rotation,
    opacity: rectangle.opacity,
    scaleX: rectangle.scaleX,
    scaleY: rectangle.scaleY,
    duration: 0.1,
  })
}, [
  rectangle.x, rectangle.y, rectangle.width, rectangle.height,
  rectangle.rotation, rectangle.opacity, rectangle.scaleX, rectangle.scaleY,
  // ✅ Add all dependencies:
  shapeRef,
])
```
  - **Success Criteria:**
    - [ ] All dependencies added to array
    - [ ] ESLint warnings resolved
    - [ ] Animations work correctly
    - [ ] No stale closure bugs
  - **Tests:**
    1. Create rectangle
    2. Drag it → verify smooth animation
    3. Resize it → verify smooth animation
    4. Rotate it → verify smooth animation
    5. Check console → no ESLint warnings
  - **Edge Cases:**
    - ⚠️ shapeRef changes: Re-run animation (expected behavior)

#### 3.3.2 Apply to All Shape Components

- [ ] **Action:** Fix animation dependencies in Circle, Line, Text, Image
  - **Why:** Consistent correctness across all shapes
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
    - Update: `src/features/canvas-core/shapes/text/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/ImageShape.tsx`
  - **Success Criteria:**
    - [ ] All animation useEffects have complete dependencies
    - [ ] No ESLint warnings
    - [ ] Animations work correctly
  - **Tests:**
    1. Create one of each shape type
    2. Drag, resize, rotate each
    3. Verify smooth animations
    4. Run ESLint
    5. Expected: 0 warnings for shape files

---

### Task Group 3.4: Add Wheel Event Debounce (2 hours)

#### 3.4.1 Debounce Zoom Updates from Wheel Events

- [ ] **Action:** Add debounce to `handleWheel` in `useStageHandlers.ts`
  - **Why:** Prevent excessive re-renders during scroll zoom
  - **Files Modified:**
    - Update: `src/features/canvas-core/components/stage/useStageHandlers.ts`
  - **Implementation Details:**
```typescript
import { debounce } from '@/lib/utils/debounce'

const debouncedZoomUpdate = useRef(
  debounce((newZoom: number) => {
    setZoom(newZoom)
  }, 16) // ~60fps
).current

function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
  e.evt.preventDefault()

  const stage = e.target.getStage()
  if (!stage) return

  // Calculate new zoom immediately for smooth feel
  const oldZoom = stage.scaleX()
  const pointer = stage.getPointerPosition()
  if (!pointer) return

  const zoomAmount = e.evt.deltaY > 0 ? 0.95 : 1.05
  const newZoom = Math.max(0.1, Math.min(10, oldZoom * zoomAmount))

  // Apply zoom immediately to Konva stage
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldZoom,
    y: (pointer.y - stage.y()) / oldZoom,
  }

  stage.scale({ x: newZoom, y: newZoom })
  stage.position({
    x: pointer.x - mousePointTo.x * newZoom,
    y: pointer.y - mousePointTo.y * newZoom,
  })

  // Update store with debounce (avoid re-renders during scroll)
  debouncedZoomUpdate(newZoom)
}
```
  - **Success Criteria:**
    - [ ] Zoom feels smooth (immediate Konva update)
    - [ ] Store updates debounced (reduced re-renders)
    - [ ] No zoom lag or jitter
  - **Tests:**
    1. Scroll to zoom in/out rapidly
    2. Verify smooth zoom
    3. Use React DevTools Profiler
    4. Expected: Store updates ~60x per second max (not 100+)
  - **Edge Cases:**
    - ⚠️ Very fast scrolling: May skip some zoom levels (acceptable, smoother overall)

---

### Task Group 3.5: Testing & Validation (4 hours)

#### 3.5.1 Long Session Memory Test

- [ ] **Action:** Run app for 1 hour, monitor memory usage
  - **Test Procedure:**
```markdown
1. Open Chrome Task Manager (Shift+Esc)
2. Start app, note memory usage
3. For 1 hour:
   - Load 50 images every 5 minutes
   - Create 100 objects every 5 minutes
   - Delete objects regularly
   - Zoom in/out
   - Pan around
4. Check memory after 1 hour
5. Expected: Memory stable at <200MB
6. Before: Memory grows unbounded, may reach 1GB+
```
  - **Success Criteria:**
    - [ ] Memory usage remains stable (<200MB)
    - [ ] No continuous memory growth
    - [ ] Image cache size limited to 100
    - [ ] No browser slowdown
  - **Edge Cases:**
    - ⚠️ Memory still growing: Check for other leaks (event listeners, etc.)

---

## Phase 4: Cleanup & Polish

**Goal:** Code quality, maintainability, documentation
**Time Estimate:** 1 week (40 hours)
**Dependencies:** Phase 3 complete
**Risk:** NONE

### Task Group 4.1: Remove Dead Code (2 hours)

#### 4.1.1 Delete ActiveUsers Component

- [ ] **Action:** Remove deprecated `ActiveUsers.tsx`
  - **Why:** Replaced by AvatarStack, no longer used
  - **Files Modified:**
    - Delete: `src/features/collaboration/components/ActiveUsers.tsx`
    - Update: `src/features/collaboration/index.ts` (remove export)
  - **Implementation Details:**
```bash
# Delete component
rm src/features/collaboration/components/ActiveUsers.tsx

# Update exports
# Remove: export { ActiveUsers } from './components/ActiveUsers'
```
  - **Success Criteria:**
    - [ ] File deleted
    - [ ] Export removed
    - [ ] No import errors
    - [ ] App builds successfully
  - **Tests:**
    1. Run: `npm run build`
    2. Verify: Build succeeds
    3. Search codebase: `ActiveUsers` (0 results expected)
  - **Edge Cases:**
    - ⚠️ File still imported somewhere: Build will fail, find and remove import

#### 4.1.2 Clean Up Console Logs

- [ ] **Action:** Remove development console.log statements
  - **Why:** Code quality, reduce noise in production
  - **Files Modified:**
    - Various (47 files with console.log)
  - **Implementation Details:**
```bash
# Use ESLint auto-fix
npx eslint --fix "src/**/*.{ts,tsx}"

# Or manually remove in critical files:
# - src/features/canvas-core/
# - src/stores/
# - src/lib/firebase/
```
  - **Success Criteria:**
    - [ ] console.log removed from production code
    - [ ] console.error/warn kept for error logging
    - [ ] No build warnings
  - **Tests:**
    1. Search codebase: `console.log`
    2. Expected: Only in test files or commented out
    3. Build app
    4. Verify: No console output in production
  - **Edge Cases:**
    - ⚠️ Intentional debug logs: Keep in dev mode only with `if (import.meta.env.DEV)`

---

### Task Group 4.2: Performance Monitoring (6 hours)

#### 4.2.1 Add Performance Metrics Hook

- [ ] **Action:** Create `usePerformanceMetrics` hook
  - **Why:** Track FPS, frame time, and performance in production
  - **Files Modified:**
    - Create: `src/hooks/usePerformanceMetrics.ts`
  - **Implementation Details:**
```typescript
/**
 * Performance monitoring hook
 *
 * Tracks FPS, frame time, and performance metrics.
 * Only active in development mode.
 */
export function usePerformanceMetrics(enabled = import.meta.env.DEV) {
  useEffect(() => {
    if (!enabled) return

    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    const measureFrame = () => {
      frameCount++
      const currentTime = performance.now()
      const delta = currentTime - lastTime

      // Log every second
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta)

        if (fps < 30) {
          console.warn(`⚠️ Low FPS: ${fps}`)
        } else if (fps < 50) {
          console.log(`📊 FPS: ${fps}`)
        } else {
          console.log(`✅ FPS: ${fps}`)
        }

        frameCount = 0
        lastTime = currentTime
      }

      rafId = requestAnimationFrame(measureFrame)
    }

    rafId = requestAnimationFrame(measureFrame)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [enabled])
}
```
  - **Success Criteria:**
    - [ ] Hook tracks FPS in real-time
    - [ ] Logs to console in dev mode
    - [ ] Warns when FPS drops below 30
    - [ ] No performance impact in production
  - **Tests:**
    1. Add to CanvasPage: `usePerformanceMetrics()`
    2. Load 500 objects
    3. Verify: Console shows FPS every second
    4. Build for production
    5. Verify: No FPS logging in production
  - **Edge Cases:**
    - ⚠️ Hook disabled: No monitoring (expected)

#### 4.2.2 Add Performance Warnings for Large Canvases

- [ ] **Action:** Warn users when object count exceeds recommended limit
  - **Why:** Proactive user education about performance limits
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx`
  - **Implementation Details:**
```typescript
import { toast } from 'sonner'

useEffect(() => {
  const objectCount = objects.length

  if (objectCount > 1000 && objectCount % 100 === 0) {
    toast.warning(
      `Large canvas (${objectCount} objects) may affect performance. Consider organizing into groups or separate projects.`,
      { duration: 5000 }
    )
  }
}, [objects.length])
```
  - **Success Criteria:**
    - [ ] Toast appears at 1000, 1100, 1200, etc. objects
    - [ ] Doesn't spam user (only on 100-object intervals)
    - [ ] Message helpful and actionable
  - **Tests:**
    1. Create 1000 objects
    2. Verify: Toast appears with warning
    3. Create 50 more objects
    4. Verify: No additional toast
    5. Create 50 more (total 1100)
    6. Verify: Toast appears again
  - **Edge Cases:**
    - ⚠️ Rapid object creation: May show multiple toasts (acceptable)

---

### Task Group 4.3: Documentation Updates (8 hours)

#### 4.3.1 Update Performance Documentation

- [ ] **Action:** Update `_docs/performance/` with actual results
  - **Why:** Document what was achieved vs. what was planned
  - **Files Modified:**
    - Update: `_docs/performance/AUDIT_SUMMARY.md`
    - Update: `_docs/performance/SUMMARY.md`
  - **Implementation Details:**
```markdown
# Add "Results" section to each document:

## Phase 1 Results ✅

**Target:** 5-10x improvement (5-10 FPS → 30-50 FPS)
**Achieved:** 8x improvement (7 FPS → 56 FPS average)

### Measurements:
- Viewport culling: Reduced render count from 500 to ~60 objects
- StageObjects memo: Eliminated 400+ unnecessary re-renders per second
- Map lookups: Reduced drag handler from 35ms to 2ms

### Before/After Comparison:
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| FPS (500 objects) | 7 FPS | 56 FPS | 8x |
| Frame time | 85ms | 12ms | 7x |
| Drag latency | 350ms | 45ms | 7.8x |
```
  - **Success Criteria:**
    - [ ] Actual metrics documented
    - [ ] Before/after comparisons included
    - [ ] Graphs/charts added if helpful
    - [ ] Lessons learned section
  - **Tests:**
    - Review documentation for accuracy
    - Verify all links work
    - Check markdown formatting

#### 4.3.2 Create Performance Best Practices Guide

- [ ] **Action:** Create `_docs/guides/performance-best-practices.md`
  - **Why:** Help future developers maintain performance
  - **Files Modified:**
    - Create: `_docs/guides/performance-best-practices.md`
  - **Implementation Details:**
```markdown
# Performance Best Practices

## Canvas Rendering

### ✅ DO:
- Use viewport culling for lists > 100 items
- Memoize expensive calculations
- Use Map/Set for lookups, not array.find()
- Throttle Firebase updates to 50ms
- Profile before optimizing

### ❌ DON'T:
- Render all objects unconditionally
- Create functions in render
- Use nested loops (O(n²))
- Update Firebase more than 20x per second
- Optimize without measuring

## React Patterns

### Memoization:
```typescript
// ✅ Good
const value = useMemo(() => expensiveCalc(), [deps])

// ❌ Bad
const value = expensiveCalc() // Runs every render
```

[... more examples ...]
```
  - **Success Criteria:**
    - [ ] Guide covers all major performance patterns
    - [ ] Code examples included
    - [ ] Dos and don'ts clearly listed
    - [ ] References optimization commits
  - **Tests:**
    - Share with team for review
    - Verify examples are correct

#### 4.3.3 Update CLAUDE.md with Performance Guidelines

- [ ] **Action:** Add performance section to `CLAUDE.md`
  - **Why:** AI assistant should follow performance best practices
  - **Files Modified:**
    - Update: `CLAUDE.md`
  - **Implementation Details:**
```markdown
## Performance Guidelines

When implementing canvas features:

1. **Always use viewport culling** for object lists > 50
2. **Memoize components** that render many children
3. **Use Map for lookups**, not array.find()
4. **Throttle Firebase updates** to 50ms
5. **Test with 500+ objects** before considering complete
6. **Profile with Chrome DevTools** to verify improvements

### Performance Testing

Before committing canvas changes:
```bash
window.generateTestLines(500)
await window.measureFPS(10)
# Expected: 55+ FPS sustained
window.clearTestShapes()
```

See: `_docs/guides/performance-best-practices.md`
```
  - **Success Criteria:**
    - [ ] Performance section added to CLAUDE.md
    - [ ] Links to detailed guides
    - [ ] Quick reference for common patterns
    - [ ] Testing procedure included

---

### Task Group 4.4: Final Validation (8 hours)

#### 4.4.1 End-to-End Performance Test

- [ ] **Action:** Run comprehensive test suite across all features
  - **Test Cases:**
```markdown
1. **Baseline Performance (500 objects):**
   - Generate 500 mixed shapes
   - Measure FPS for 60 seconds
   - Expected: 55+ FPS sustained
   - P95 frame time: <20ms

2. **Extreme Load (1000 objects):**
   - Generate 1000 objects
   - Measure FPS for 60 seconds
   - Expected: 40+ FPS sustained
   - P95 frame time: <30ms

3. **Multi-User Collaboration (5 users, 500 objects):**
   - 5 tabs with same canvas
   - Each user drags objects simultaneously
   - Expected: 45+ FPS in all tabs
   - Network latency: <100ms

4. **Long Session (2 hours):**
   - Normal usage for 2 hours
   - Create/delete objects regularly
   - Load images
   - Expected: Memory <200MB, no leaks

5. **Edge Cases:**
   - Zoom 0.01x with 1000 objects → smooth panning
   - Zoom 100x with 1 object → smooth manipulation
   - Rapid tool switching → no crashes
   - Offline mode → graceful degradation
```
  - **Success Criteria:**
    - [ ] All test cases pass
    - [ ] Performance targets met
    - [ ] No regressions from Phase 1
    - [ ] No critical bugs found
  - **Expected Results:**
    - 8-10x improvement over baseline
    - Stable memory usage
    - Smooth collaboration

#### 4.4.2 Cross-Browser Testing

- [ ] **Action:** Test in Chrome, Firefox, Safari, Edge
  - **Test Matrix:**
```markdown
| Browser | Version | FPS (500 obj) | Notes |
|---------|---------|---------------|-------|
| Chrome | Latest | 60 FPS | ✅ Best performance |
| Firefox | Latest | 55+ FPS | ✅ Good |
| Safari | Latest | 50+ FPS | ✅ Acceptable |
| Edge | Latest | 60 FPS | ✅ Best performance |
```
  - **Success Criteria:**
    - [ ] All browsers meet minimum 45 FPS
    - [ ] No browser-specific bugs
    - [ ] Consistent UX across browsers
  - **Tests:**
    1. Run performance tests in each browser
    2. Test all interactions (drag, resize, rotate, edit)
    3. Verify no visual glitches
    4. Check console for errors

#### 4.4.3 Production Deployment Validation

- [ ] **Action:** Deploy to production, monitor real-world performance
  - **Deployment Steps:**
```bash
# 1. Final build
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy to Firebase
npm run deploy

# 4. Monitor performance for 24 hours
# Use Firebase Performance Monitoring or custom analytics
```
  - **Success Criteria:**
    - [ ] Production build successful
    - [ ] No errors in production console
    - [ ] Real users report improved performance
    - [ ] No increase in error rate
  - **Monitoring:**
    - Track FPS in production (if instrumented)
    - Monitor crash reports
    - Collect user feedback
    - Watch Firebase usage metrics

---

## Rollback Strategy

If any phase introduces critical bugs:

1. **Identify affected phase** (git log to find commits)
2. **Revert phase commits:** `git revert <commit-range>`
3. **Rebuild and redeploy:** `npm run build && npm run deploy`
4. **Verify rollback:** Test that app works without optimization
5. **Document issue:** Create GitHub issue with reproduction steps
6. **Fix and retry:** Debug issue, fix, re-apply optimization

**Safe to roll back:** All optimizations are additive and independent.

---

## Success Criteria (Overall)

- [ ] Frame rate: 60 FPS with 500 objects (from 5-10 FPS)
- [ ] Render time: <5ms per frame (from 50-100ms)
- [ ] Drag latency: <50ms (from 200-500ms)
- [ ] Memory: Stable at <200MB (from unbounded growth)
- [ ] No visual regressions
- [ ] No functional regressions
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Code quality improved (dead code removed)

---

## Notes

**Time Estimates:**
- Phase 1: 2 weeks (critical fixes, biggest impact)
- Phase 2: 2 weeks (high priority, smoother UX)
- Phase 3: 2 weeks (medium priority, stability)
- Phase 4: 1 week (cleanup, polish)
- **Total: 7 weeks**

**Risk Assessment:** LOW
- All optimizations are proven patterns
- No breaking changes to public API
- Backward compatible
- Can be rolled back easily

**Dependencies:** None between phases (sequential execution recommended)

**Testing Strategy:**
- Manual testing with test utilities
- Chrome DevTools Performance profiling
- Multi-user collaboration testing
- Long session memory testing
- Cross-browser validation

---

## Execution

To execute this plan:

```bash
# In Claude Code
/execute-plan @_docs/plans/optimize.md
```

The plan-coordinator will:
1. Execute each task sequentially
2. Update checkboxes as tasks complete
3. Report progress and blockers
4. Validate success criteria
5. Move to next phase upon completion

**Your role:**
- Monitor progress
- Test critical milestones
- Approve phase transitions
- Provide feedback on blockers
