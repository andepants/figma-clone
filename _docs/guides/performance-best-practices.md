# Performance Best Practices

**Last Updated:** 2025-10-18
**Applies To:** Canvas Icons v1.0+
**Optimization Results:** 5-10x improvement (Phases 1-3 complete)

This guide documents performance best practices learned from optimizing Canvas Icons from 5-10 FPS to 60 FPS with 500+ objects.

---

## Table of Contents

1. [Canvas Rendering](#canvas-rendering)
2. [React Patterns](#react-patterns)
3. [Data Structures](#data-structures)
4. [Firebase Realtime Database](#firebase-realtime-database)
5. [Memory Management](#memory-management)
6. [Testing & Profiling](#testing--profiling)

---

## Canvas Rendering

### Viewport Culling

✅ **DO:**
- Filter objects by viewport before rendering
- Use bounding box intersection for visibility checks
- Add padding (100px) for smooth object appearance
- Account for stroke width, shadows, and rotation in bounds

```typescript
// GOOD: Only render visible objects
const visibleObjects = useMemo(() => {
  return filterVisibleObjects(objects, stageRef)
}, [objects, stageRef, zoom, pan])

return visibleObjects.map(obj => <Shape key={obj.id} {...obj} />)
```

❌ **DON'T:**
- Render all objects unconditionally
- Forget to account for zoom/pan changes
- Use tight bounding boxes (causes flickering)

```typescript
// BAD: Renders all 500 objects even if only 50 visible
return objects.map(obj => <Shape key={obj.id} {...obj} />)
```

### Konva Layer Management

✅ **DO:**
- Use 3-5 layers maximum (background, objects, overlays, UI, preview)
- Disable listening on layers that don't need events
- Call `layer.batchDraw()` instead of `layer.draw()` for multiple updates

```typescript
// GOOD: Optimized layer structure
<Layer listening={false}>  {/* Background */}
<Layer listening={true}>   {/* Interactive objects */}
<Layer listening={false}>  {/* Remote selections */}
<Layer listening={false}>  {/* Preview shapes */}
```

❌ **DON'T:**
- Create one layer per object
- Enable listening on all layers
- Call `draw()` in tight loops

---

## React Patterns

### Component Memoization

✅ **DO:**
- Wrap list components in `React.memo` with custom comparison
- Memoize expensive calculations with `useMemo`
- Memoize callbacks with `useCallback`
- Use reference equality for props

```typescript
// GOOD: Memoized component prevents unnecessary re-renders
export const StageObjects = memo(
  function StageObjects({ objects, selectedIds, dragStates }) {
    // Component logic
  },
  (prev, next) => {
    return (
      prev.objects === next.objects &&
      prev.selectedIds === next.selectedIds &&
      prev.dragStates === next.dragStates
    )
  }
)

// GOOD: Memoize expensive state calculations
const shapeState = useMemo(() => {
  if (obj.locked) return 'locked'
  if (isSelected) return 'selected'
  return 'default'
}, [obj.locked, isSelected])
```

❌ **DON'T:**
- Create new objects/functions in render
- Deep compare complex objects
- Forget memo dependencies

```typescript
// BAD: Creates new function every render
const handleClick = () => updateObject(obj.id, { selected: true })

// GOOD: Memoized callback
const handleClick = useCallback(
  () => updateObject(obj.id, { selected: true }),
  [obj.id]
)
```

### Effect Dependencies

✅ **DO:**
- Include all values used inside effect
- Use ESLint exhaustive-deps rule
- Split effects if dependencies differ

❌ **DON'T:**
- Disable exhaustive-deps warnings
- Use empty dependency array unless truly needed
- Include functions that change every render

---

## Data Structures

### Lookups: Use Maps, Not Arrays

✅ **DO:**
- Convert arrays to `Map<string, T>` for O(1) lookups
- Use `Set<string>` for membership checks
- Memoize Map/Set conversions

```typescript
// GOOD: O(1) lookup
const dragStatesMap = useMemo(
  () => new Map(dragStates.map(d => [d.objectId, d])),
  [dragStates]
)
const dragState = dragStatesMap.get(obj.id)

// GOOD: O(1) membership check
const objectIds = useMemo(
  () => new Set(objects.map(o => o.id)),
  [objects]
)
const exists = objectIds.has(searchId)
```

❌ **DON'T:**
- Use `array.find()` in render loops (O(n))
- Use `array.some()` for existence checks (O(n))
- Use nested loops (O(n²))

```typescript
// BAD: O(n) lookup in O(n) loop = O(n²)
objects.map(obj => {
  const dragState = dragStates.find(d => d.objectId === obj.id)
  return <Shape dragState={dragState} />
})

// BAD: O(n×m) double loop
const validIds = selectedIds.filter(id =>
  objects.some(obj => obj.id === id)
)
```

### Reference Equality

✅ **DO:**
- Use reference equality (`===`) for array/object comparisons
- Ensure services return new references on updates
- Rely on React's shallow comparison

```typescript
// GOOD: O(1) reference check
if (state.objects === objects) {
  return state // No change
}

// GOOD: Firebase service returns new array
const objectsArray = Object.entries(data || {})
  .map(([id, obj]) => ({ ...obj, id }))
  .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
```

❌ **DON'T:**
- Deep compare large arrays (O(n×m))
- Mutate objects/arrays in place
- Use custom equality functions unless necessary

```typescript
// BAD: O(n×m) deep comparison
function areObjectArraysEqual(a, b) {
  return a.every((objA, i) =>
    Object.keys(objA).every(key => objA[key] === b[i]?.[key])
  )
}
```

---

## Firebase Realtime Database

### Throttling & Batching

✅ **DO:**
- Throttle all real-time updates to 50ms (20 updates/sec)
- Batch multiple object updates into single write
- Use optimistic updates for local state
- Implement stale state cleanup

```typescript
// GOOD: Throttled updates prevent spam
const throttledUpdate = useRef(
  throttle(async (id, updates) => {
    await updateCanvasObject(projectId, id, updates)
  }, 50)
).current

// GOOD: Batch updates reduce network calls
await batchUpdateCanvasObjects(projectId, {
  'obj-1': { x: 100 },
  'obj-2': { x: 200 },
  'obj-3': { x: 300 },
})
```

❌ **DON'T:**
- Update Firebase more than 20x per second
- Send individual updates for group operations
- Skip optimistic updates (causes lag)

```typescript
// BAD: No throttle = 60 updates/second
function handleDrag(e) {
  updateCanvasObject(projectId, obj.id, { x: e.x, y: e.y })
}

// BAD: 3 network calls instead of 1
objects.forEach(obj => {
  updateCanvasObject(projectId, obj.id, { x: obj.x + 10 })
})
```

### Subscription Management

✅ **DO:**
- Clean up subscriptions in `useEffect` return
- Use `onDisconnect()` for presence cleanup
- Implement automatic stale state removal
- Consolidate duplicate subscriptions

```typescript
// GOOD: Proper cleanup
useEffect(() => {
  const unsubscribe = subscribeToCanvasObjects(
    projectId,
    (objects) => setObjects(objects)
  )
  return () => unsubscribe()
}, [projectId])
```

❌ **DON'T:**
- Forget to unsubscribe
- Subscribe to same data in multiple places
- Leave stale data in database

---

## Memory Management

### Image Caching

✅ **DO:**
- Use LRU cache with size limit (100 images)
- Preload images before rendering
- Share image cache across components
- Clear cache on unmount if needed

```typescript
// GOOD: LRU cache prevents memory leaks
class ImagePool {
  private cache = new LRUCache<string, HTMLImageElement>(100)

  async getImage(url: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(url)
    if (cached) return cached

    const img = await loadImage(url)
    this.cache.set(url, img)
    return img
  }
}
```

❌ **DON'T:**
- Use unbounded Map/object for cache
- Load same image multiple times
- Forget to handle load errors

```typescript
// BAD: Unbounded cache causes memory leak
const imageCache = new Map<string, HTMLImageElement>()
// After loading 1000 images = out of memory
```

### Event Listeners

✅ **DO:**
- Remove event listeners in cleanup
- Use `AbortController` for fetch requests
- Cancel animations on unmount

```typescript
// GOOD: Cleanup event listener
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [handleKeyDown])

// GOOD: Cancel animation
useEffect(() => {
  let rafId = requestAnimationFrame(animate)
  return () => cancelAnimationFrame(rafId)
}, [])
```

---

## Testing & Profiling

### Performance Testing

✅ **DO:**
- Test with 500+ objects before shipping
- Use Chrome DevTools Performance tab
- Measure FPS with `window.measureFPS()`
- Profile memory with heap snapshots
- Test on target devices (not just dev machine)

```typescript
// Test canvas performance
window.generateTestLines(500)
await window.measureFPS(10) // 10 second measurement
window.clearTestShapes()

// Expected: 55+ FPS sustained
```

❌ **DON'T:**
- Only test with 10-50 objects
- Skip performance profiling
- Optimize without measuring first
- Assume all devices perform equally

### Profiling Workflow

1. **Baseline:** Measure FPS before optimization
2. **Profile:** Use Chrome DevTools to find bottlenecks
3. **Optimize:** Implement targeted fixes
4. **Verify:** Re-measure to confirm improvement
5. **Repeat:** Continue until target met

```bash
# Before optimization
FPS: 7 FPS (500 objects)
Frame time: 85ms avg

# After viewport culling
FPS: 35 FPS (500 objects)
Frame time: 20ms avg

# After memoization
FPS: 56 FPS (500 objects)
Frame time: 12ms avg
```

---

## Performance Checklist

Before shipping canvas features:

- [ ] Viewport culling implemented for object lists
- [ ] Components wrapped in `React.memo`
- [ ] Expensive calculations in `useMemo`
- [ ] Callbacks in `useCallback`
- [ ] Array lookups converted to `Map.get()`
- [ ] Firebase updates throttled to 50ms
- [ ] Batch operations for multi-object updates
- [ ] Image cache has size limit (LRU)
- [ ] Event listeners cleaned up
- [ ] Tested with 500+ objects
- [ ] FPS measured (target: 55+ sustained)
- [ ] Memory stable (no leaks)
- [ ] Cross-browser tested

---

## Common Anti-Patterns

### 1. Rendering Everything

```typescript
// ❌ BAD: Renders 5000 objects even if only 50 visible
{objects.map(obj => <Shape key={obj.id} {...obj} />)}

// ✅ GOOD: Only renders visible objects
{visibleObjects.map(obj => <Shape key={obj.id} {...obj} />)}
```

### 2. Creating Functions in Render

```typescript
// ❌ BAD: New function every render
<button onClick={() => updateObject(obj.id, { selected: true })}>

// ✅ GOOD: Memoized callback
const handleClick = useCallback(() => {
  updateObject(obj.id, { selected: true })
}, [obj.id])
<button onClick={handleClick}>
```

### 3. O(n²) Lookups

```typescript
// ❌ BAD: 250,000 comparisons for 500 objects
objects.map(obj => {
  const state = states.find(s => s.objectId === obj.id)
})

// ✅ GOOD: 500 Map lookups
const stateMap = new Map(states.map(s => [s.objectId, s]))
objects.map(obj => {
  const state = stateMap.get(obj.id)
})
```

### 4. Unbounded Caches

```typescript
// ❌ BAD: Grows forever
const cache = new Map<string, T>()

// ✅ GOOD: Limited size with LRU
const cache = new LRUCache<string, T>(100)
```

### 5. Missing Cleanup

```typescript
// ❌ BAD: Subscription leak
useEffect(() => {
  subscribeToData(callback)
}, [])

// ✅ GOOD: Proper cleanup
useEffect(() => {
  const unsubscribe = subscribeToData(callback)
  return () => unsubscribe()
}, [])
```

---

## Performance Targets

### Frame Rate
- **Minimum:** 30 FPS (usable)
- **Target:** 55+ FPS (smooth)
- **Ideal:** 60 FPS (perfect)

### Render Time
- **Minimum:** <33ms per frame
- **Target:** <18ms per frame
- **Ideal:** <5ms per frame

### Memory
- **Limit:** <200MB for 500 objects
- **Cache:** Max 100 images
- **Stable:** No growth over time

### Network
- **Throttle:** 50ms (20 updates/sec)
- **Batch:** Multi-object operations
- **Latency:** <150ms total (50ms throttle + 100ms network)

---

## References

- **Optimization Plan:** `/_docs/plans/optimize.md`
- **Performance Audit:** `/_docs/performance/AUDIT_SUMMARY.md`
- **Analysis Summary:** `/_docs/performance/SUMMARY.md`
- **Project Guidelines:** `/CLAUDE.md`

---

## Conclusion

Performance optimization is an iterative process. Always measure before optimizing, focus on critical issues first, and verify improvements with real-world testing.

The optimizations documented in this guide achieved a **5-10x performance improvement** in Canvas Icons, taking frame rate from 5-10 FPS to 55+ FPS with 500 objects.

**Key Takeaway:** Viewport culling, component memoization, and O(1) data structures are essential for canvas applications at scale.
