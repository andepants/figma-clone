# Line Performance Testing - Complete Guide

**Task:** Section 2.4.11 - Performance Verification - Line Shapes

**Goal:** Verify 60 FPS rendering with 20+ line shapes

---

## Quick Navigation

### 🚀 Get Started Immediately
- **[Quick Start Guide](./line-performance-quick-start.md)** - 3 steps to start testing (2 min read)

### 📚 Complete Documentation
- **[Comprehensive Testing Guide](./line-performance-testing.md)** - Full details on all test scenarios (15 min read)

### 👁️ Visual Reference
- **[Visual Guide](./line-performance-visual-guide.md)** - Screenshots and visual examples of what to expect (5 min read)

### 📊 Implementation Details
- **[Implementation Summary](./line-performance-summary.md)** - Technical details of what was created (10 min read)

---

## What's Included

### 1. Performance Testing Utilities

**Location:** `/src/utils/performanceTestUtils.ts`

Functions available on `window` in development mode:

```javascript
// Generate 20 test lines
window.generateTestLines(20);

// Generate 10 rects + 10 circles + 10 lines
window.generateMixedShapes();

// Clear all test shapes
window.clearTestShapes();

// Measure FPS for 10 seconds
await window.measureFPS(10);

// Run full automated test
await window.runPerformanceTest(20, 10);
```

### 2. Complete Documentation

Four comprehensive guides:

1. **Quick Start** - Get testing in 3 steps
2. **Full Guide** - Detailed scenarios and Chrome DevTools usage
3. **Visual Guide** - What you'll see during testing
4. **Summary** - Implementation details and technical reference

---

## 30-Second Quick Start

```javascript
// 1. Open browser console
window.generateTestLines(20);

// 2. Open DevTools Performance tab, click Record

// 3. Pan/zoom/drag for 5-10 seconds, then Stop

// 4. Check results: Green bars = 60 FPS ✅

// 5. Clean up
window.clearTestShapes();
```

**Success:** Green bars, 60 FPS, < 16.67ms frame times

---

## Test Scenarios

| Scenario | Command | Action | Target |
|----------|---------|--------|--------|
| **Pan Test** | `generateTestLines(20)` | Drag canvas around | 60 FPS |
| **Zoom Test** | `generateTestLines(20)` | Scroll to zoom 10-15x | 60 FPS |
| **Drag Test** | `generateTestLines(20)` | Select & drag 5-10 lines | 60 FPS |
| **Mixed Test** | `generateMixedShapes()` | Pan/zoom 30 shapes | 60 FPS |

---

## Success Criteria

All tests must meet:

- ✅ **FPS:** 55-60 consistently
- ✅ **Frame Time:** < 18ms (target: < 16.67ms)
- ✅ **Dropped Frames:** 0% or minimal
- ✅ **Visual Smoothness:** No stuttering

---

## Files Overview

### Source Code
```
src/
└── utils/
    └── performanceTestUtils.ts    (Performance testing utilities)

src/
└── main.tsx                       (Modified: Auto-install utilities)
```

### Documentation
```
_docs/fixes/
├── README-performance-testing.md         (This file - index)
├── line-performance-quick-start.md       (3-step quick start)
├── line-performance-testing.md           (Complete guide)
├── line-performance-visual-guide.md      (Visual reference)
└── line-performance-summary.md           (Implementation details)
```

---

## When to Use Each Guide

### Use Quick Start When:
- You just want to run a test quickly
- You've done this before and need a reminder
- You want the condensed reference

### Use Comprehensive Guide When:
- First time testing line performance
- Need detailed Chrome DevTools instructions
- Want to understand all metrics
- Troubleshooting performance issues

### Use Visual Guide When:
- Want to know what to expect
- Need visual reference for good vs. bad performance
- Learning to read Performance profiler
- Showing someone else how to test

### Use Implementation Summary When:
- Need technical details
- Want to understand the code
- Looking for specific function signatures
- Documenting or extending the utilities

---

## Available Commands Reference

```javascript
// Basic testing
window.generateTestLines(20)        // Generate 20 test lines
window.generateTestLines(50)        // Generate 50 test lines
window.generateMixedShapes()        // Generate 10 + 10 + 10 shapes
window.clearTestShapes()            // Remove all test shapes

// Performance measurement
await window.measureFPS(10)         // Measure FPS for 10 seconds
await window.runPerformanceTest()   // Full automated test

// Custom automated test
await window.runPerformanceTest(
  20,  // Line count
  10   // Measure duration (seconds)
)
```

---

## Chrome DevTools Quick Reference

### Opening Performance Tab
1. `Cmd+Option+I` (Mac) or `F12` (Windows/Linux)
2. Click "Performance" tab
3. Click Record button
4. Interact with canvas
5. Stop recording

### Reading Results
- **Green bars:** 60 FPS ✅
- **Yellow bars:** 30-60 FPS ⚠️
- **Red bars:** < 30 FPS ❌
- **FPS counter (top-right):** Should show 55-60
- **Frame times:** Should be < 16.67ms

---

## Troubleshooting

### FPS below 50?
1. Check other browser tabs (close heavy ones)
2. Check for browser extensions (disable if needed)
3. Reduce test shape count
4. Check Main thread for long tasks (> 50ms)

### Specific actions lagging?
- **Pan lag:** Check pan event throttling
- **Zoom lag:** Check zoom calculation complexity
- **Drag lag:** Check drag throttling, batch updates
- **Select lag:** Check hit detection algorithm

### How to get help?
1. Check the **Comprehensive Guide** troubleshooting section
2. Look at **Visual Guide** for performance comparison
3. Review **Implementation Summary** for technical details

---

## Example Test Session

```javascript
// Complete test session in browser console

// 1. Generate test lines
window.generateTestLines(20);
// ✅ Generated 20 test lines
// 📊 Now start Performance recording...

// 2. Open DevTools Performance tab
// 3. Click Record button (red circle)

// 4. Test actions:
//    - Pan canvas by dragging
//    - Zoom with scroll wheel
//    - Select and drag some lines

// 5. Stop recording after 5-10 seconds

// 6. Verify results in profiler:
//    FPS: 60 ✅
//    Frame time: 14.2ms ✅
//    Dropped frames: 0% ✅

// 7. Clean up
window.clearTestShapes();
// ✅ Removed 20 test shapes

// OR run automated test:
await window.runPerformanceTest(20, 10);
// (automatically generates, measures, and cleans up)
```

---

## Performance Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| **FPS** | 60 | 55-60 | < 50 |
| **Frame Time** | < 16.67ms | < 20ms | > 25ms |
| **Dropped Frames** | 0% | < 5% | > 10% |
| **Layout Time** | < 5ms | < 8ms | > 10ms |
| **Paint Time** | < 5ms | < 8ms | > 10ms |
| **Script Time** | < 8ms | < 12ms | > 15ms |

---

## Next Steps

### To Start Testing:
1. ✅ Read the **[Quick Start Guide](./line-performance-quick-start.md)**
2. ✅ Open your app in development mode
3. ✅ Run test commands in browser console
4. ✅ Verify 60 FPS in all scenarios

### To Learn More:
1. 📚 Read **[Comprehensive Testing Guide](./line-performance-testing.md)**
2. 👁️ Check **[Visual Guide](./line-performance-visual-guide.md)** for examples
3. 📊 Review **[Implementation Summary](./line-performance-summary.md)** for details

### To Mark Complete:
- ✅ All 4 test scenarios pass (60 FPS)
- ✅ No performance issues found
- ✅ Documentation reviewed
- ✅ Section 2.4.11 marked complete in line.md

---

## Related Documentation

- **Line Implementation Plan:** `_docs/plan/line.md`
- **Line Test Guides:** `_docs/fixes/line-test-*.md`
- **Project Rules:** `CLAUDE.md`

---

## Summary

This performance testing suite provides:

1. ✅ **Utilities** - Easy-to-use test shape generators
2. ✅ **Documentation** - 4 comprehensive guides
3. ✅ **Automation** - Automated FPS measurement
4. ✅ **Integration** - Auto-installed in dev mode
5. ✅ **Validation** - Clear success criteria

**Goal:** Ensure line shapes maintain 60 FPS under all interaction scenarios.

**Status:** Implementation complete, ready for testing ✅

---

**Created:** 2025-10-14

**Task Reference:** Section 2.4.11 - Performance Verification - Line Shapes

**Documentation Version:** 1.0
