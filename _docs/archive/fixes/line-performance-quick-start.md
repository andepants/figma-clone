# Line Performance Testing - Quick Start Guide

**Task:** Section 2.4.11 - Performance Verification - Line Shapes

**Goal:** Verify 60 FPS rendering with 20+ line shapes

---

## Quick Start (3 Steps)

### 1. Generate Test Lines

Open browser console (`Cmd+Option+I` or `F12`) and run:

```javascript
window.generateTestLines(20);
```

You'll see 20 colorful lines arranged in a grid pattern.

### 2. Record Performance

1. Open Chrome DevTools Performance tab
2. Click the **Record** button (red circle)
3. Pan, zoom, or drag lines for 5-10 seconds
4. Click **Stop** button

### 3. Check Results

Look for:
- **Green bars** at top = 60 FPS ✅
- **FPS counter** in top-right = should show 55-60
- **No red bars** = no dropped frames ✅

---

## Test Scenarios

### Scenario 1: Pan Test
```javascript
window.generateTestLines(20);
```
- Start recording
- Click and drag canvas to pan
- Should maintain 60 FPS

### Scenario 2: Zoom Test
```javascript
window.generateTestLines(20);
```
- Start recording
- Scroll to zoom in/out 10-15 times
- Should maintain 60 FPS

### Scenario 3: Drag Test
```javascript
window.generateTestLines(20);
```
- Press `V` to activate Move tool
- Shift-click to select 5-10 lines
- Start recording
- Drag selected lines around
- Should maintain 60 FPS

### Scenario 4: Mixed Shapes Test
```javascript
window.generateMixedShapes();
```
Creates 10 rectangles + 10 circles + 10 lines (30 total)
- Start recording
- Pan, zoom, and drag various shapes
- Should maintain 60 FPS

---

## Available Commands

All utilities are available on `window` in development mode:

```javascript
// Generate 20 test lines (default)
window.generateTestLines(20);

// Generate 50 test lines
window.generateTestLines(50);

// Generate mixed shapes (10 each of rect, circle, line)
window.generateMixedShapes();

// Clear all test shapes
window.clearTestShapes();

// Measure FPS for 10 seconds
await window.measureFPS(10);

// Run full automated test
await window.runPerformanceTest(20, 10);
```

---

## Success Criteria

For all scenarios:
- ✅ **FPS:** 55-60 FPS consistently
- ✅ **Frame time:** < 18ms (target: < 16.67ms)
- ✅ **Dropped frames:** 0% or minimal
- ✅ **Visual smoothness:** No stuttering or lag

---

## Reading the Performance Profiler

### Frame Rate Chart (Top)
- **Green bars:** Good frames (< 16.67ms) = 60 FPS ✅
- **Yellow bars:** Slower frames (16-33ms) = 30-60 FPS ⚠️
- **Red bars:** Dropped frames (> 33ms) = < 30 FPS ❌

### FPS Counter (Top-Right)
- **60 FPS:** Perfect ✅
- **55-59 FPS:** Acceptable ✅
- **45-54 FPS:** Needs investigation ⚠️
- **< 45 FPS:** Performance issue ❌

### What to Look For
1. Consistent green bars throughout recording
2. FPS counter stays at 55-60
3. Plenty of white space (idle time) in Main thread
4. No long yellow blocks (tasks > 50ms)

---

## Cleanup

After testing:

```javascript
window.clearTestShapes();
```

Removes all performance test objects from canvas.

---

## Troubleshooting

### If FPS drops below 50:

1. Check if too many shapes (reduce count)
2. Check for other browser tabs consuming resources
3. Check Chrome DevTools "Rendering" tab
4. Enable "Paint flashing" to see what's repainting

### If specific actions lag:

- **Pan lag:** Check throttling in pan handler
- **Zoom lag:** Check zoom calculation
- **Drag lag:** Check drag event throttling
- **Select lag:** Check hit detection algorithm

---

## Automated Testing

For continuous monitoring:

```javascript
// Run full automated test (generates lines, measures FPS, cleans up)
await window.runPerformanceTest(20, 10);
```

This will:
1. Generate 20 test lines
2. Measure FPS for 10 seconds
3. Report average, min, max FPS
4. Clean up test shapes
5. Report PASS/FAIL

---

## Example Session

```javascript
// 1. Generate test lines
window.generateTestLines(20);
// ✅ Generated 20 test lines

// 2. Start Performance recording in DevTools
// (Click Record button in Performance tab)

// 3. Interact with canvas (pan, zoom, drag) for 5-10 seconds

// 4. Stop recording

// 5. Verify results:
//    - Green bars across timeline ✅
//    - FPS counter shows 60 ✅
//    - Frame times < 16.67ms ✅

// 6. Clean up
window.clearTestShapes();
// ✅ Removed 20 test shapes
```

---

## Next Steps

1. ✅ Test all 4 scenarios
2. ✅ Verify 60 FPS in each
3. ✅ Document any issues
4. ✅ Mark task 2.4.11 as complete

For detailed documentation, see: `_docs/fixes/line-performance-testing.md`
