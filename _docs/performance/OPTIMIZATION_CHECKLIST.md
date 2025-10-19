# Canvas Performance Optimization Checklist

## Quick Reference

This checklist tracks all identified performance issues and their remediation status.

## Critical Issues (HIGH SEVERITY)

### 1. No Viewport Culling
- [ ] **Implement AABB frustum culling**
  - [ ] Add getObjectBounds() utility
  - [ ] Add isInViewport() check
  - [ ] Filter objects in StageObjects render
  - Expected improvement: 5-10x with 500+ objects
  - Priority: CRITICAL
  - Files affected: `/src/features/canvas-core/components/stage/StageObjects.tsx`

### 2. StageObjects Not Memoized
- [ ] **Wrap with React.memo**
  - [ ] Add React.memo wrapper
  - [ ] Fix prop array references causing re-renders
  - [ ] Use useMemo for derived props
  - Expected improvement: 3-5x interaction responsiveness
  - Priority: CRITICAL
  - Files affected: `/src/features/canvas-core/components/stage/StageObjects.tsx`

### 3. dragStates.find() is O(n²)
- [ ] **Convert dragStates to Map**
  - [ ] Convert array to Map in useMemo
  - [ ] Replace .find() with Map.get()
  - [ ] Apply same to remoteSelections
  - Expected improvement: 50-100ms render time
  - Priority: CRITICAL
  - Files affected: `/src/features/canvas-core/components/stage/StageObjects.tsx`

---

## High Priority Issues

### 4. areObjectArraysEqual is O(n) Linear Scan
- [ ] **Optimize array comparison**
  - [ ] Check length first (quick fail)
  - [ ] Use object identity for immutable comparisons
  - [ ] Implement Map-based diff for large arrays (>200 objects)
  - [ ] Cache comparison result
  - Priority: HIGH
  - Files affected: `/src/stores/canvas/utils.ts`

### 5. Group Drag Throttle Too Aggressive
- [ ] **Reduce throttle from 100ms to 50ms**
  - [ ] Change in useGroupDrag.ts line 75
  - [ ] Verify Firebase quota not exceeded
  - Priority: HIGH
  - Files affected: `/src/features/canvas-core/hooks/useGroupDrag.ts`

### 6. Shape State Functions Create Objects
- [ ] **Memoize getStroke/getShadow logic**
  - [ ] Extract getShadow() object creation
  - [ ] Use useMemo wrapper
  - [ ] Share logic between shapes
  - Priority: HIGH
  - Files affected: All shape components (Rectangle, Circle, ImageShape, Line)

### 7. StagePreviewShapes Not Memoized
- [ ] **Add React.memo wrapper**
  - [ ] Wrap component with React.memo
  - [ ] Memoize selection bounds calculation
  - Priority: HIGH
  - Files affected: `/src/features/canvas-core/components/stage/StagePreviewShapes.tsx`

---

## Medium Priority Issues

### 8. Image Pool Memory Leak
- [ ] **Implement cache eviction**
  - [ ] Add LRU (Least Recently Used) policy
  - [ ] Set max cache size (e.g., 100 images)
  - [ ] Add TTL (Time To Live) for stale images
  - [ ] Monitor cache size in DevTools
  - Priority: MEDIUM
  - Files affected: `/src/lib/utils/imagePool.ts`

### 9. Heavy Computation in handleDragMove
- [ ] **Optimize screenToCanvasCoords calls**
  - [ ] Cache coordinate transforms
  - [ ] Only update when position changed
  - [ ] Separate cursor updates from position updates
  - Priority: MEDIUM
  - Files affected: `/src/features/canvas-core/shapes/Rectangle.tsx` and other shapes

### 10. Selected IDs Cleanup Every Update
- [ ] **Optimize cleanup logic**
  - [ ] Only run when objects count changes
  - [ ] Use Set for O(1) ID lookup
  - [ ] Batch cleanup operations
  - Priority: MEDIUM
  - Files affected: `/src/stores/canvas/canvasStore.ts`

### 11. Animation Dependency Arrays
- [ ] **Fix selection animation dependencies**
  - [ ] Depend only on isSelected, not scale values
  - [ ] Fix in all shape components
  - Priority: MEDIUM
  - Files affected: All shape components

### 12. Remote Selections Need Culling
- [ ] **Apply viewport culling to overlays**
  - [ ] Only render visible selection overlays
  - [ ] Filter by viewport like objects
  - Priority: MEDIUM
  - Files affected: `/src/features/canvas-core/components/stage/StageObjects.tsx`

---

## Low Priority Issues

### 13. Duplicate Hover Outline Rendering
- [ ] **Consolidate hover rendering**
  - [ ] Use single shape with conditional stroke
  - [ ] Eliminate duplicate Rect components
  - Priority: LOW
  - Files affected: All shape components

### 14. Shared Stroke Logic Duplication
- [ ] **Extract to shared utility**
  - [ ] Create getShapeStroke() utility hook
  - [ ] Create getShapeShadow() utility hook
  - [ ] Reduce 5x code duplication
  - Priority: LOW (maintainability, not performance)
  - Files affected: `/src/features/canvas-core/utils/`

### 15. Cursor Move Event Frequency
- [ ] **Optimize handleCursorMove**
  - [ ] Skip updates if cursor didn't move
  - [ ] Use delta check before throttle
  - Priority: LOW
  - Files affected: `/src/features/canvas-core/components/stage/useStageHandlers.ts`

---

## Implementation Roadmap

### Phase 1: CRITICAL (Week 1)
- [ ] Issue #1: Viewport Culling
- [ ] Issue #2: StageObjects Memo
- [ ] Issue #3: dragStates Map

**Expected Result**: 5-10x performance improvement on large canvases

### Phase 2: HIGH (Week 2)
- [ ] Issue #4: areObjectArraysEqual optimization
- [ ] Issue #5: Group drag throttle
- [ ] Issue #6: Shape functions memoization
- [ ] Issue #7: StagePreviewShapes memo

**Expected Result**: Smoother interactions, less jank during collaboration

### Phase 3: MEDIUM (Week 3-4)
- [ ] Issue #8: Image pool eviction
- [ ] Issue #9: screenToCanvasCoords optimization
- [ ] Issue #10: Selected IDs cleanup
- [ ] Issue #11: Animation dependencies
- [ ] Issue #12: Remote selections culling

**Expected Result**: Better memory management, stable 60fps performance

### Phase 4: LOW (As time permits)
- [ ] Issue #13-15: Code cleanup and refactoring

---

## Testing & Validation

### Performance Metrics to Track

- [ ] **Frame rate**: Target 60fps during drag
  - Use Chrome DevTools Performance tab
  - Record 30-second drag session
  - Verify no frame drops below 50fps

- [ ] **Render time**: Target <16ms per frame
  - React DevTools Profiler
  - Measure shape component render time
  - Should decrease significantly after memo fixes

- [ ] **Memory usage**: Monitor for leaks
  - Chrome DevTools Memory tab
  - Take heap snapshot before/after dragging 100+ objects
  - Memory should stabilize, not grow unbounded

- [ ] **Collaboration latency**: Target <100ms round-trip
  - Firebase update time
  - Remote cursor movement smoothness
  - Verify no lag between users

### Load Testing Scenarios

1. **Small canvas** (50 objects)
   - Drag single object
   - Drag 10 objects
   - Expected: 60fps solid

2. **Medium canvas** (200 objects)
   - Drag single object
   - Drag 20 objects
   - Pan and zoom
   - Expected: 50+ fps, minor frame drops acceptable

3. **Large canvas** (500+ objects)
   - Drag single object
   - Drag multi-select
   - Zoom out to see entire canvas
   - Expected: 30-50fps after culling (was 5-10fps before)

4. **With images** (100+ image objects)
   - Load canvas with many images
   - Monitor memory usage
   - Scroll through layers panel
   - Expected: Stable memory after image eviction implemented

---

## Performance Baselines (Before Optimization)

Record these before starting optimization:

- [ ] Frame rate during drag: _____ fps
- [ ] Memory usage after loading 500 objects: _____ MB
- [ ] Render time per frame: _____ ms
- [ ] Firebase update latency: _____ ms
- [ ] Collaboration cursor lag: _____ ms

## Performance Targets (After Optimization)

Goals after completing Phase 1-3:

- [ ] Frame rate during drag: 60 fps
- [ ] Memory usage for 500 objects: <200 MB
- [ ] Render time per frame: <5 ms (avg)
- [ ] Firebase update latency: <50 ms
- [ ] Collaboration cursor lag: <50 ms

---

## Notes

### Known Good Patterns (Keep These!)
- ✅ Throttling at 50ms for cursor/drag updates
- ✅ Dual sync (drag state + object position)
- ✅ Shallow equality comparison for objects
- ✅ onDisconnect cleanup in Firebase

### High-Risk Areas (Test Thoroughly!)
- Viewport culling: Must handle zoom/pan edge cases
- Memo optimization: Need custom equality checks
- Map conversion: Must preserve insertion order for z-index
- Cache eviction: Must not delete images still in use

---

## Related Documentation

- See: `/src/features/canvas-core/README.md` (if exists)
- See: `/_docs/features/hierarchy-system.md`
- See: `/_docs/features/lock-system.md`
- See: `CLAUDE.md` project guidelines
