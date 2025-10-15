# Line Performance Testing - Visual Guide

**Task:** Section 2.4.11 - Performance Verification - Line Shapes

This guide shows what you'll see when testing line performance.

---

## Test Setup Visual

### When you run `window.generateTestLines(20)`

You'll see:
```
20 lines arranged in a grid pattern:

🔴━━━━━━  🟠━━━━━━  🟡━━━━━━  🟢━━━━━━  🔵━━━━━━
   30°        60°        90°       120°       150°

🟣━━━━━━  🔴━━━━━━  🟠━━━━━━  🟡━━━━━━  🟢━━━━━━
  180°       210°       240°       270°       300°

🔵━━━━━━  🟣━━━━━━  🔴━━━━━━  🟠━━━━━━  🟡━━━━━━
  330°        0°         30°        60°        90°

🟢━━━━━━  🔵━━━━━━  🟣━━━━━━  🔴━━━━━━  🟠━━━━━━
  120°       150°       180°       210°       240°
```

- **Rainbow colors:** Each line has unique HSL color
- **Different angles:** Lines rotate through 30° increments
- **Grid layout:** Organized in rows and columns
- **Varied lengths:** Random 100-200px for visual diversity

---

## Chrome DevTools Performance Tab

### Timeline View (Normal Operation)

```
FPS ████████████████████████████████████████ 60 FPS ✅
    └─ Green bars = 60 FPS, no dropped frames

Frame Times
┌─────────────────────────────────────────┐
│ 16ms ████████████████████████████████   │  ✅ Below 16.67ms
│ 14ms ███████████████████████████        │  ✅ Below 16.67ms
│ 15ms ████████████████████████████       │  ✅ Below 16.67ms
└─────────────────────────────────────────┘

Main Thread
┌──────────────────────────────────────────────────┐
│ Rendering  Script   Idle   Rendering   Idle      │
│ ████       ███      ░░░░   ████        ░░░░      │  ✅ Plenty of idle time
└──────────────────────────────────────────────────┘
```

**What you want to see:**
- ✅ Consistent green bars (60 FPS)
- ✅ Frame times below 16.67ms
- ✅ Plenty of white/idle time
- ✅ FPS counter shows 60

---

### Timeline View (Performance Issues)

```
FPS ████████░░██░░░░████░░░░░░████ 45 FPS ❌
    └─ Yellow/red bars = dropped frames

Frame Times
┌─────────────────────────────────────────┐
│ 28ms ██████████████████████████████████ │  ❌ Above 16.67ms
│ 35ms ████████████████████████████████   │  ❌ Dropped frame (> 33ms)
│ 22ms ████████████████████████████       │  ⚠️  Slow frame
└─────────────────────────────────────────┘

Main Thread
┌──────────────────────────────────────────────────┐
│ Rendering  Script  Script  Rendering  Script     │
│ ████████   ██████  ██████  ████████   ██████     │  ❌ No idle time
└──────────────────────────────────────────────────┘
```

**What indicates problems:**
- ❌ Yellow/red bars (dropped frames)
- ❌ Frame times above 16.67ms
- ❌ No idle time (no white space)
- ❌ FPS counter below 50

---

## Console Output Examples

### Successful Test Run

```javascript
window.generateTestLines(20);

// Console output:
✅ Generated 20 test lines
📊 Now start Performance recording and test interactions:
   1. Open Chrome DevTools (Cmd+Option+I)
   2. Click Performance tab
   3. Click Record button
   4. Pan, zoom, or drag lines
   5. Stop recording after 5-10 seconds
   6. Verify 60 FPS and < 16.67ms frame times
```

### Automated Test Run

```javascript
await window.runPerformanceTest(20, 10);

// Console output:
🚀 Starting automated performance test...

1️⃣ Generating 20 test lines...
✅ Generated 20 test lines
📊 Now start Performance recording and test interactions
2️⃣ Waiting for initial render...
3️⃣ Measuring FPS...
📊 Measuring FPS for 10 seconds...
FPS: 60
FPS: 60
FPS: 59
FPS: 60
FPS: 60
FPS: 59
FPS: 60
FPS: 60
FPS: 60
FPS: 60

📊 Performance Results:
  Average FPS: 59.8
  Min FPS: 59
  Max FPS: 60
  Samples: 60, 60, 59, 60, 60, 59, 60, 60, 60, 60
✅ PASS: Performance target met (55+ FPS)

4️⃣ Cleaning up...
✅ Removed 20 test shapes

✅ Performance test complete!
```

### Failed Test Run

```javascript
await window.runPerformanceTest(20, 10);

// Console output:
🚀 Starting automated performance test...

1️⃣ Generating 20 test lines...
✅ Generated 20 test lines
2️⃣ Waiting for initial render...
3️⃣ Measuring FPS...
📊 Measuring FPS for 10 seconds...
FPS: 48
FPS: 42
FPS: 45
FPS: 43
FPS: 46
FPS: 44
FPS: 47
FPS: 43
FPS: 45
FPS: 44

📊 Performance Results:
  Average FPS: 44.7
  Min FPS: 42
  Max FPS: 48
  Samples: 48, 42, 45, 43, 46, 44, 47, 43, 45, 44
❌ FAIL: Performance below acceptable threshold (< 45 FPS)

4️⃣ Cleaning up...
✅ Removed 20 test shapes

✅ Performance test complete!
```

---

## Mixed Shapes Visual

### When you run `window.generateMixedShapes()`

You'll see:
```
Rectangles         Lines            Circles
┌─────┐            🔴━━━━━━          ●●●●●
│ red │            🟠━━━━━━          ●●●●●
├─────┤            🟡━━━━━━          ●●●●●
│ org │            🟢━━━━━━          ●●●●●
├─────┤            🔵━━━━━━          ●●●●●
│ yel │
└─────┘

Total: 30 shapes (10 + 10 + 10)
```

- **Left area:** 10 rectangles with rainbow colors
- **Middle area:** 10 lines with various angles
- **Right area:** 10 circles with rainbow colors
- **Purpose:** Test performance with mixed shape types

---

## Test Interaction Patterns

### Pan Test Pattern
```
Start → → → → → → → → → → → → → End
        (drag canvas left/right/up/down)

Movement: Smooth, continuous panning
Duration: 5-10 seconds
Expected: 60 FPS throughout
```

### Zoom Test Pattern
```
Zoom In  → → → → → → Zoom Out ← ← ← ← ←
100%     200%  400%  200%     100%   50%

Movement: Scroll wheel or pinch gesture
Duration: 5-10 seconds, 10-15 zoom operations
Expected: 60 FPS throughout
```

### Drag Test Pattern
```
Select lines → Drag → → → → → → Release
(shift-click)  (smooth movement)

Movement: Select 5-10 lines, drag as group
Duration: 5-10 seconds
Expected: 60 FPS throughout
```

---

## Performance Metrics Display

### Good Performance (60 FPS)

```
┌─────────────────────────────────────┐
│  Performance Recording               │
├─────────────────────────────────────┤
│  FPS: 60                        ✅  │
│  Frame Time: 14.2ms             ✅  │
│  Dropped Frames: 0%             ✅  │
│                                      │
│  Timeline:                           │
│  ████████████████████████████        │
│  └─ All green bars                   │
│                                      │
│  Main Thread:                        │
│  ████ ░░░ ████ ░░░ ████ ░░░         │
│  └─ Plenty of idle time (white)      │
└─────────────────────────────────────┘
```

### Poor Performance (45 FPS)

```
┌─────────────────────────────────────┐
│  Performance Recording               │
├─────────────────────────────────────┤
│  FPS: 45                        ❌  │
│  Frame Time: 24.8ms             ❌  │
│  Dropped Frames: 15%            ❌  │
│                                      │
│  Timeline:                           │
│  ████░░██░░░░████░░                  │
│  └─ Yellow/red bars (dropped)        │
│                                      │
│  Main Thread:                        │
│  ████████████████████████████        │
│  └─ No idle time (all busy)          │
└─────────────────────────────────────┘
```

---

## Frame View Detail (Click on any frame)

### Good Frame (< 16.67ms)

```
┌────────────────────────────────────────┐
│  Frame #1234 (14.2ms)              ✅  │
├────────────────────────────────────────┤
│  Layout                   2.1ms        │
│  Paint                    3.8ms        │
│  Composite Layers         1.9ms        │
│  Script Execution         4.2ms        │
│  Idle                     2.2ms        │
│  ────────────────────────────          │
│  Total                   14.2ms    ✅  │
└────────────────────────────────────────┘
```

### Slow Frame (> 16.67ms)

```
┌────────────────────────────────────────┐
│  Frame #5678 (28.4ms)              ❌  │
├────────────────────────────────────────┤
│  Layout                   8.3ms    ⚠️  │
│  Paint                   12.1ms    ❌  │
│  Composite Layers         4.2ms        │
│  Script Execution         3.8ms        │
│  Idle                     0.0ms    ❌  │
│  ────────────────────────────          │
│  Total                   28.4ms    ❌  │
└────────────────────────────────────────┘
```

---

## Cleanup Confirmation

```javascript
window.clearTestShapes();

// Console output:
✅ Removed 20 test shapes

// Canvas is now clean - no test objects remain
```

---

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════╗
║  LINE PERFORMANCE TESTING QUICK REFERENCE             ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Generate Test Lines:                                 ║
║  > window.generateTestLines(20)                       ║
║                                                       ║
║  Start Recording:                                     ║
║  1. Open DevTools (Cmd+Opt+I)                        ║
║  2. Performance tab                                   ║
║  3. Record button (red circle)                        ║
║                                                       ║
║  Test Actions:                                        ║
║  • Pan canvas (drag)                                  ║
║  • Zoom (scroll wheel)                                ║
║  • Select & drag lines                                ║
║                                                       ║
║  Success Criteria:                                    ║
║  ✅ Green bars (60 FPS)                               ║
║  ✅ Frame time < 16.67ms                              ║
║  ✅ No dropped frames                                 ║
║                                                       ║
║  Cleanup:                                             ║
║  > window.clearTestShapes()                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## Expected Timeline Patterns

### Pan Performance
```
Time: 0s────────5s─────────10s
FPS:  ████████████████████████  60 FPS ✅
      (should be flat at 60)
```

### Zoom Performance
```
Time: 0s────────5s─────────10s
FPS:  ████████████████████████  60 FPS ✅
      (small dips OK, avg >55)
```

### Drag Performance
```
Time: 0s────────5s─────────10s
FPS:  ████████████████████████  60 FPS ✅
      (consistent throughout)
```

---

## Summary

This visual guide shows what to expect when testing line performance:

1. **Test Setup:** Colorful grid of lines at various angles
2. **DevTools View:** Green bars = good, yellow/red = issues
3. **Console Output:** Clear feedback on test results
4. **Performance Metrics:** Visual representation of FPS/frame times
5. **Test Patterns:** Expected interaction sequences

**Target:** Maintain 60 FPS (green bars) in all scenarios ✅
