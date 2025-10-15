# Line Performance Testing Guide

**Purpose:** Verify that line shapes maintain stable 60 FPS rendering performance under various interaction scenarios.

**Target:** Section 2.4.11 - Performance Verification - Line Shapes

---

## Overview

This guide provides utilities and instructions for testing line rendering performance in CollabCanvas. The goal is to verify that the canvas maintains a stable 60 FPS (16.67ms per frame) when:

- Creating 20+ lines
- Panning with 20 lines visible
- Zooming in/out with 20 lines
- Selecting and dragging lines
- Mixing multiple shape types (rectangles, circles, lines)

---

## Quick Start

### 1. Generate Test Lines

Open your browser's DevTools console and run:

```javascript
// Generate 20 test lines across the canvas
window.generateTestLines(20);
```

Or for a mixed scenario:

```javascript
// Generate 10 rectangles + 10 lines + 10 circles
window.generateMixedShapes();
```

### 2. Open Performance Tools

1. Open Chrome DevTools (`Cmd+Option+I` on Mac, `F12` on Windows/Linux)
2. Click the **Performance** tab
3. Click the **Record** button (circle icon) or press `Cmd+E`

### 3. Perform Test Interaction

While recording:
- Pan the canvas by dragging
- Zoom in/out using scroll wheel or zoom controls
- Select and drag lines
- Test for 5-10 seconds

### 4. Stop Recording

1. Click **Stop** button or press `Cmd+E`
2. Wait for profiler to process results

### 5. Analyze Results

Look for:
- **Frame rate (FPS)**: Should stay at or near 60 FPS
- **Frame time**: Should stay below 16.67ms (green bars)
- **Dropped frames**: Minimal or zero red bars
- **Consistency**: Smooth, stable frame times

---

## Test Scenarios

### Scenario 1: Pan Performance with 20 Lines

**Goal:** Verify 60 FPS while panning canvas with 20 visible lines

**Steps:**
1. Run `window.generateTestLines(20)`
2. Start Performance recording
3. Click and drag canvas to pan around
4. Continue panning for 5-10 seconds
5. Stop recording

**Success Criteria:**
- FPS stays at 55-60 FPS
- Frame times consistently below 18ms
- No visible stuttering or lag

---

### Scenario 2: Zoom Performance with 20 Lines

**Goal:** Verify 60 FPS while zooming with 20 visible lines

**Steps:**
1. Run `window.generateTestLines(20)`
2. Start Performance recording
3. Zoom in and out using scroll wheel (10-15 zoom operations)
4. Try both smooth scrolling and rapid zooming
5. Stop recording

**Success Criteria:**
- FPS stays at 55-60 FPS during zoom
- Frame times below 18ms
- Smooth zoom transitions

---

### Scenario 3: Line Selection and Drag Performance

**Goal:** Verify 60 FPS while selecting and dragging lines

**Steps:**
1. Run `window.generateTestLines(20)`
2. Ensure Move tool is active (press `V` or click move tool)
3. Start Performance recording
4. Select multiple lines (shift-click 5-10 lines)
5. Drag the selected group around the canvas
6. Stop recording

**Success Criteria:**
- FPS stays at 55-60 FPS during drag
- Frame times below 18ms
- No lag between mouse movement and object movement

---

### Scenario 4: Mixed Shapes Performance

**Goal:** Verify 60 FPS with mix of rectangles, circles, and lines

**Steps:**
1. Run `window.generateMixedShapes()` (creates 10 of each type = 30 total)
2. Start Performance recording
3. Pan the canvas
4. Zoom in and out
5. Select and drag various shapes
6. Stop recording

**Success Criteria:**
- FPS stays at 55-60 FPS
- Frame times below 18ms
- Lines perform as well as rectangles and circles

---

## Performance Utilities

### Generate Test Lines

Add this to your browser console or create a test page:

```javascript
/**
 * Generate test lines across the canvas
 * @param {number} count - Number of lines to generate (default: 20)
 */
window.generateTestLines = function(count = 20) {
  // Access the canvas store
  const { useCanvasStore } = window;
  if (!useCanvasStore) {
    console.error('Canvas store not found. Make sure you are on the canvas page.');
    return;
  }

  const addObject = useCanvasStore.getState().addObject;
  const currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };

  // Clear existing selection
  useCanvasStore.getState().clearSelection();

  // Generate lines in a grid pattern
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const spacingX = 250;
  const spacingY = 200;
  const startX = 100;
  const startY = 100;

  let lineCount = 0;

  for (let row = 0; row < rows && lineCount < count; row++) {
    for (let col = 0; col < cols && lineCount < count; col++) {
      const x1 = startX + col * spacingX;
      const y1 = startY + row * spacingY;

      // Vary line angles for visual diversity
      const angle = (lineCount * 30) % 360; // Different angle for each line
      const length = 100 + Math.random() * 100; // Length between 100-200px
      const angleRad = (angle * Math.PI) / 180;

      const x2 = x1 + Math.cos(angleRad) * length;
      const y2 = y1 + Math.sin(angleRad) * length;

      // Calculate line properties
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const points = [
        x1 - x,
        y1 - y,
        x2 - x,
        y2 - y,
      ];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const width = Math.sqrt(dx * dx + dy * dy);
      let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      if (rotation === 180) rotation = -180;

      // Create line object
      const line = {
        id: `perf-test-line-${Date.now()}-${lineCount}`,
        type: 'line',
        x,
        y,
        points,
        width,
        rotation,
        stroke: `hsl(${(lineCount * 360) / count}, 70%, 50%)`, // Rainbow colors
        strokeWidth: 2,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        strokeEnabled: true,
        shadowEnabled: false,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 1,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addObject(line);
      lineCount++;
    }
  }

  console.log(`✅ Generated ${lineCount} test lines`);
  console.log('📊 Now start Performance recording and test interactions');
};

/**
 * Generate mixed shapes for comprehensive testing
 */
window.generateMixedShapes = function() {
  const { useCanvasStore } = window;
  if (!useCanvasStore) {
    console.error('Canvas store not found. Make sure you are on the canvas page.');
    return;
  }

  const addObject = useCanvasStore.getState().addObject;
  const currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };

  // Clear existing selection
  useCanvasStore.getState().clearSelection();

  const shapes = [];
  const startX = 100;
  const startY = 100;
  const spacing = 200;

  // Generate 10 rectangles
  for (let i = 0; i < 10; i++) {
    const x = startX + (i % 5) * spacing;
    const y = startY + Math.floor(i / 5) * spacing;

    shapes.push({
      id: `perf-test-rect-${Date.now()}-${i}`,
      type: 'rectangle',
      x,
      y,
      width: 80,
      height: 60,
      rotation: 0,
      fill: `hsl(${(i * 36)}, 70%, 60%)`,
      stroke: '#333333',
      strokeWidth: 2,
      cornerRadius: 5,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 1,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Generate 10 circles
  for (let i = 0; i < 10; i++) {
    const x = startX + 1000 + (i % 5) * spacing;
    const y = startY + Math.floor(i / 5) * spacing;

    shapes.push({
      id: `perf-test-circle-${Date.now()}-${i}`,
      type: 'circle',
      x,
      y,
      radius: 40,
      rotation: 0,
      fill: `hsl(${(i * 36 + 120)}, 70%, 60%)`,
      stroke: '#333333',
      strokeWidth: 2,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 1,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Generate 10 lines
  for (let i = 0; i < 10; i++) {
    const x1 = startX + 500 + (i % 5) * spacing;
    const y1 = startY + Math.floor(i / 5) * spacing;

    const angle = (i * 30) % 360;
    const length = 120;
    const angleRad = (angle * Math.PI) / 180;
    const x2 = x1 + Math.cos(angleRad) * length;
    const y2 = y1 + Math.sin(angleRad) * length;

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const points = [x1 - x, y1 - y, x2 - x, y2 - y];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const width = Math.sqrt(dx * dx + dy * dy);
    let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    if (rotation === 180) rotation = -180;

    shapes.push({
      id: `perf-test-line-${Date.now()}-${i}`,
      type: 'line',
      x,
      y,
      points,
      width,
      rotation,
      stroke: `hsl(${(i * 36 + 240)}, 70%, 50%)`,
      strokeWidth: 2,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 1,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Add all shapes
  shapes.forEach(shape => addObject(shape));

  console.log('✅ Generated mixed shapes:');
  console.log('  - 10 rectangles');
  console.log('  - 10 circles');
  console.log('  - 10 lines');
  console.log('📊 Now start Performance recording and test interactions');
};

/**
 * Clear all performance test objects
 */
window.clearTestShapes = function() {
  const { useCanvasStore } = window;
  if (!useCanvasStore) {
    console.error('Canvas store not found.');
    return;
  }

  const state = useCanvasStore.getState();
  const testObjects = state.objects.filter(obj => obj.id.startsWith('perf-test-'));

  testObjects.forEach(obj => {
    state.removeObject(obj.id);
  });

  console.log(`✅ Removed ${testObjects.length} test shapes`);
};
```

---

## Chrome DevTools Performance Tab Guide

### Opening the Performance Tab

1. **Open DevTools:**
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12` or `Ctrl + Shift + I`

2. **Navigate to Performance Tab:**
   - Click the "Performance" tab at the top
   - If not visible, click the `»` icon and select "Performance"

### Recording Performance

1. **Start Recording:**
   - Click the **Record** button (circle icon on the left)
   - Or press `Cmd + E` (Mac) / `Ctrl + E` (Windows/Linux)

2. **Perform Actions:**
   - Execute the test scenario (pan, zoom, drag)
   - Keep recording for 5-10 seconds
   - Perform consistent, smooth movements

3. **Stop Recording:**
   - Click **Stop** button
   - Or press `Cmd + E` / `Ctrl + E`
   - Wait for profiler to analyze (may take a few seconds)

### Analyzing Results

#### 1. Frame Rate Chart (Top Section)

- **Green bars:** Good frames (< 16.67ms)
- **Yellow bars:** Warning (16-33ms)
- **Red bars:** Dropped frames (> 33ms)

**What to look for:**
- Consistent green bars = 60 FPS ✅
- Occasional yellow = acceptable (55+ FPS)
- Red bars = performance issue ❌

#### 2. FPS Counter

- **Location:** Top-right of performance timeline
- **Target:** 55-60 FPS consistently
- **Acceptable:** 50+ FPS
- **Issues:** Below 45 FPS

#### 3. Main Thread Timeline

- **Rendering (purple/pink):** Canvas draw operations
- **Scripting (yellow):** JavaScript execution
- **Idle (white):** Good! Browser has spare time

**What to look for:**
- Plenty of idle time (white space) ✅
- Short, consistent task lengths
- No long tasks (> 50ms yellow blocks) ❌

#### 4. Frame View (Bottom Panel)

- Click any frame in the timeline to inspect
- Shows detailed breakdown of that frame
- Look at "Total Time" - should be < 16.67ms

### Performance Metrics to Track

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| FPS | 60 | 55-60 | < 50 |
| Frame Time | < 16.67ms | < 20ms | > 25ms |
| Dropped Frames | 0% | < 5% | > 10% |
| Layout/Paint | < 5ms | < 8ms | > 10ms |
| Scripting | < 8ms | < 12ms | > 15ms |

---

## Success Criteria

### All scenarios must meet:

1. ✅ **Stable FPS:** Maintain 55-60 FPS
2. ✅ **Consistent Frame Times:** Below 18ms (target: < 16.67ms)
3. ✅ **No Dropped Frames:** Zero or minimal red bars in profiler
4. ✅ **Smooth Visuals:** No visible stuttering or lag
5. ✅ **Responsive Interactions:** Immediate feedback to user input

### Specific Targets:

- **Pan with 20 lines:** 60 FPS, < 16.67ms frame time
- **Zoom with 20 lines:** 60 FPS, < 16.67ms frame time
- **Drag lines:** 60 FPS, < 16.67ms frame time
- **Mixed shapes (30 total):** 60 FPS, < 16.67ms frame time

### Edge Cases to Watch:

1. **Rapid Zooming:** Multiple quick zoom operations
2. **Multi-Select Drag:** Dragging 10+ selected objects
3. **Concurrent Rendering:** Lines + resize handles visible
4. **High Density:** 20+ lines in small viewport area

---

## Troubleshooting Performance Issues

### If FPS drops below 50:

1. **Check React.memo usage:**
   - All shape components wrapped in React.memo?
   - Props properly memoized with useCallback?

2. **Check render optimization:**
   - Using Konva's transformer properly?
   - Throttling real-time updates (50ms)?
   - Batch updates for multi-select drag?

3. **Check layer structure:**
   - Maximum 3-5 Konva layers?
   - Lines on appropriate layer?
   - Not recreating layers on every render?

4. **Check Chrome DevTools:**
   - Look at "Rendering" tab
   - Enable "Paint flashing" to see repaints
   - Check if entire canvas repainting vs. partial

### If specific interactions lag:

- **Pan lag:** Check pan throttling, stage drag handling
- **Zoom lag:** Check zoom calculation complexity
- **Drag lag:** Check drag event throttling, batch updates
- **Select lag:** Check selection detection algorithm

---

## Automated Performance Testing (Optional)

For continuous performance monitoring, consider:

```javascript
/**
 * Automated performance test runner
 * Logs FPS over time during interactions
 */
window.runPerformanceTest = async function() {
  console.log('🚀 Starting automated performance test...');

  // Generate test shapes
  window.generateTestLines(20);

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Track FPS
  const fpsSamples = [];
  let frameCount = 0;
  let lastTime = performance.now();

  const measureFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    if (delta >= 1000) {
      const fps = Math.round((frameCount * 1000) / delta);
      fpsSamples.push(fps);
      console.log(`FPS: ${fps}`);
      frameCount = 0;
      lastTime = currentTime;
    }

    if (fpsSamples.length < 10) {
      requestAnimationFrame(measureFPS);
    } else {
      // Calculate average
      const avgFPS = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
      const minFPS = Math.min(...fpsSamples);
      const maxFPS = Math.max(...fpsSamples);

      console.log('\n📊 Performance Test Results:');
      console.log(`  Average FPS: ${avgFPS.toFixed(1)}`);
      console.log(`  Min FPS: ${minFPS}`);
      console.log(`  Max FPS: ${maxFPS}`);

      if (avgFPS >= 55) {
        console.log('✅ PASS: Performance target met');
      } else {
        console.log('❌ FAIL: Performance below target');
      }

      // Cleanup
      window.clearTestShapes();
    }
  };

  requestAnimationFrame(measureFPS);
};
```

---

## Summary

This guide provides everything needed to verify line rendering performance:

1. **Utilities:** Functions to generate test lines and mixed shapes
2. **Test Scenarios:** 4 comprehensive test cases
3. **Chrome DevTools Guide:** How to use Performance profiler
4. **Success Criteria:** Clear performance targets
5. **Troubleshooting:** How to identify and fix issues

### Next Steps:

1. ✅ Copy utilities to browser console
2. ✅ Run test scenarios
3. ✅ Record performance data
4. ✅ Verify 60 FPS in all cases
5. ✅ Document any issues found

**Goal:** Maintain stable 60 FPS rendering with 20+ lines under all interaction scenarios.
