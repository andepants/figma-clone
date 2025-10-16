# Multi-User Line Sync - Visual Testing Guide

## Overview

This guide provides visual references for what you should see during multi-user line synchronization testing.

---

## Test Setup: Side-by-Side Windows

```
┌────────────────────────────┐  ┌────────────────────────────┐
│      Window A (User 1)     │  │      Window B (User 2)     │
│                            │  │                            │
│  ┌──────────────────────┐  │  │  ┌──────────────────────┐  │
│  │                      │  │  │  │                      │  │
│  │                      │  │  │  │                      │  │
│  │    Canvas Area       │  │  │  │    Canvas Area       │  │
│  │                      │  │  │  │                      │  │
│  │                      │  │  │  │                      │  │
│  └──────────────────────┘  │  │  └──────────────────────┘  │
│                            │  │                            │
│  User: alice@example.com   │  │  User: bob@example.com     │
└────────────────────────────┘  └────────────────────────────┘
```

---

## Test 1: Basic Line Creation Sync

### Step 1: Window A Creates Line

**Window A (Before):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│    Cursor at (200, 200)        │
│      ↓                         │
│      ●                         │
│                                │
│                                │
│  Tool: [Line] selected         │
└────────────────────────────────┘
```

**Window A (Dragging):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●─────────────→           │
│    (200,200)    (400,300)      │
│                                │
│  Blue dashed preview line      │
│                                │
│  Tool: [Line] active           │
└────────────────────────────────┘
```

**Window A (After Release):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●─────────────●           │
│    (200,200)    (400,300)      │
│                                │
│  Black solid line              │
│  Rotation: ~26.57°             │
│  Tool: [Move] (auto-switched)  │
└────────────────────────────────┘
```

### Step 2: Window B Sees Line Appear

**Window B (Before - Empty):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│    (Empty canvas)              │
│                                │
│                                │
│                                │
│                                │
│  Tool: [Move]                  │
└────────────────────────────────┘
```

**Window B (After - Line Appears <50ms):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●─────────────●           │
│    (200,200)    (400,300)      │
│                                │
│  Black line (created by User1) │
│                                │
│  ✓ Synced from Window A        │
└────────────────────────────────┘
```

**Expected Visual:**
- Line appears instantly (within 50ms)
- Line is at exact same position as Window A
- Line has same color, thickness, angle
- No visual glitches or flashing

---

## Test 2: Line Drag Sync

### Window B Drags Line

**Window B (Selecting Line):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●─────────────●           │
│    (200,200)    (400,300)      │
│    └─ Blue selection border    │
│                                │
│  ○ Endpoint handles visible    │
│  Tool: [Move]                  │
└────────────────────────────────┘
```

**Window B (Dragging):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│                    ●───────────●
│                  (300,300) (500,400)
│                  └─ Being dragged
│                                │
│  Cursor: grabbing              │
│  Tool: [Move]                  │
└────────────────────────────────┘
```

**Window B (After Drag):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│                    ●───────────●
│                  (300,300) (500,400)
│                  └─ New position
│                                │
│  Line moved +100px right/down  │
│  Rotation: unchanged (~26.57°) │
└────────────────────────────────┘
```

### Window A Sees Real-Time Update

**Window A (During Drag - Throttled Updates):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│    Update 1 (t=0ms):           │
│      ●─────────────●           │
│    (200,200)    (400,300)      │
│                                │
│    Update 2 (t=50ms):          │
│        ●─────────────●         │
│      (225,225)    (425,325)    │
│                                │
│    Update 3 (t=100ms):         │
│          ●─────────────●       │
│        (250,250)    (450,350)  │
│                                │
│  ... (continues every 50ms)    │
└────────────────────────────────┘
```

**Window A (Final Position):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│                    ●───────────●
│                  (300,300) (500,400)
│                                │
│  ✓ Synced from Window B        │
│  Final atomic update           │
│  Matches Window B exactly      │
└────────────────────────────────┘
```

**Expected Visual:**
- Line moves smoothly in Window A
- Updates occur approximately every 50ms
- No jitter or jumping
- Final position matches exactly
- Line rotation/length unchanged

---

## Test 3: Endpoint Resize Sync

### Window B Resizes Line Endpoint

**Window B (Line Selected):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ○─────────────○           │
│      │             │           │
│      ●─────────────●           │
│    (100,100)    (300,100)      │
│                                │
│  ○ Endpoint handles (white)    │
│  Horizontal line (rotation: 0°)│
└────────────────────────────────┘
```

**Window B (Dragging Right Endpoint):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●─────────────○           │
│    (100,100)       │           │
│                    │           │
│                    ●           │
│                 (300,200)      │
│                 └─ Dragging    │
│  Cursor: grabbing              │
└────────────────────────────────┘
```

**Window B (After Resize):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●                         │
│    (100,100)                   │
│       \                        │
│        \                       │
│         \                      │
│          ●                     │
│       (300,200)                │
│                                │
│  Diagonal line now             │
│  Rotation: ~-26.57°            │
│  Width: ~223.6px               │
└────────────────────────────────┘
```

### Window A Sees Resize in Real-Time

**Window A (During Resize):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│  Frame 1 (t=0ms):              │
│      ●─────────────●           │
│    Horizontal                  │
│                                │
│  Frame 2 (t=50ms):             │
│      ●────────────●            │
│           \                    │
│  Slight angle                  │
│                                │
│  Frame 3 (t=100ms):            │
│      ●                         │
│       \────────●               │
│  More diagonal                 │
└────────────────────────────────┘
```

**Window A (Final):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│      ●                         │
│    (100,100)                   │
│       \                        │
│        \                       │
│         \                      │
│          ●                     │
│       (300,200)                │
│                                │
│  ✓ Synced from Window B        │
│  Rotation: ~-26.57°            │
│  Width: ~223.6px               │
└────────────────────────────────┘
```

**Expected Visual:**
- Line angle changes smoothly
- Line width/length changes
- Position may recalculate (if MIN endpoint changes)
- Updates throttled to ~50ms
- Final properties match exactly

---

## Test 4: Rapid Concurrent Creation

### Both Users Creating Lines Simultaneously

**Window A - Creating 5 Lines:**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│  Line 1: ●───────●             │
│        (100,100)(200,150)      │
│                                │
│  Line 2: ●───────●             │
│        (100,200)(200,250)      │
│                                │
│  Line 3: ●───────●             │
│        (100,300)(200,350)      │
│                                │
│  Line 4: ●───────●             │
│        (100,400)(200,450)      │
│                                │
│  Line 5: ●───────●             │
│        (100,500)(200,550)      │
│                                │
│  User A's lines (left side)    │
└────────────────────────────────┘
```

**Window B - Creating 5 Lines:**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│           Line 1: ●───────●    │
│                (500,100)(600,150)
│                                │
│           Line 2: ●───────●    │
│                (500,200)(600,250)
│                                │
│           Line 3: ●───────●    │
│                (500,300)(600,350)
│                                │
│           Line 4: ●───────●    │
│                (500,400)(600,450)
│                                │
│           Line 5: ●───────●    │
│                (500,500)(600,550)
│                                │
│  User B's lines (right side)   │
└────────────────────────────────┘
```

**Both Windows - Final State (10 Lines Total):**
```
┌────────────────────────────────┐
│  Canvas                        │
│                                │
│  Line 1: ●───────●     ●───────●  Line 1
│        (100,100) │     │ (500,100)
│                  │     │         │
│  Line 2: ●───────●     ●───────●  Line 2
│        (100,200) │     │ (500,200)
│                  │     │         │
│  Line 3: ●───────●     ●───────●  Line 3
│        (100,300) │     │ (500,300)
│                  │     │         │
│  Line 4: ●───────●     ●───────●  Line 4
│        (100,400) │     │ (500,400)
│                  │     │         │
│  Line 5: ●───────●     ●───────●  Line 5
│        (100,500) │     │ (500,500)
│                                │
│  User A (left)  User B (right) │
│  Total: 10 lines               │
└────────────────────────────────┘
```

**Expected Visual:**
- All 10 lines visible in both windows
- No overlapping or duplicate lines
- Lines grouped by creator (left vs right)
- No visual glitches or flashing
- Smooth appearance as lines sync

---

## Firebase Console - Expected Data Structure

### Lines in Realtime Database

```
canvases/
  main/
    objects/
      line-1234567890-abc/
        ├─ id: "line-1234567890-abc"
        ├─ type: "line"
        ├─ x: 200
        ├─ y: 200
        ├─ points: [0, 0, 200, 100]
        ├─ width: 223.6
        ├─ rotation: 26.57
        ├─ stroke: "#000000"
        ├─ strokeWidth: 2
        ├─ createdBy: "user-a-uid"
        ├─ createdAt: 1234567890123
        └─ updatedAt: 1234567890123

      line-1234567891-def/
        ├─ id: "line-1234567891-def"
        ├─ type: "line"
        ├─ x: 300
        ├─ y: 300
        ├─ points: [0, 0, 200, 100]
        ├─ width: 223.6
        ├─ rotation: 26.57
        ├─ stroke: "#000000"
        ├─ strokeWidth: 2
        ├─ createdBy: "user-b-uid"
        ├─ createdAt: 1234567891456
        └─ updatedAt: 1234567891456
```

**Visual in Firebase Console:**
```
┌─────────────────────────────────────────┐
│ Firebase Console - Realtime Database   │
├─────────────────────────────────────────┤
│ canvases                                │
│   └─ main                               │
│       └─ objects                        │
│           ├─ line-1234567890-abc ✓      │
│           │   ├─ id: "line-1234..."     │
│           │   ├─ type: "line"           │
│           │   ├─ x: 200                 │
│           │   ├─ y: 200                 │
│           │   ├─ points: [0,0,200,100]  │
│           │   ├─ width: 223.6           │
│           │   ├─ rotation: 26.57        │
│           │   ├─ stroke: "#000000"      │
│           │   ├─ strokeWidth: 2         │
│           │   ├─ createdBy: "user-a..." │
│           │   ├─ createdAt: 123456...   │
│           │   └─ updatedAt: 123456...   │
│           │                             │
│           └─ line-1234567891-def ✓      │
│               ├─ id: "line-1234..."     │
│               └─ ...                    │
└─────────────────────────────────────────┘
```

---

## Console Output Examples

### Window A - Creating Line

```javascript
// Console log during line creation
console.log('[Window A] Starting line creation');
console.log('[Window A] Start point:', { x: 200, y: 200 });
console.log('[Window A] End point:', { x: 400, y: 300 });

// After line created
console.log('[Window A] Line created:', {
  id: 'line-1234567890-abc',
  type: 'line',
  x: 200,
  y: 200,
  points: [0, 0, 200, 100],
  width: 223.6,
  rotation: 26.57,
  createdBy: 'user-a-uid',
  createdAt: 1234567890123
});

// After sync to RTDB
console.log('[Window A] Line synced to RTDB');
console.log('[Window A] Tool auto-switched to: move');
```

### Window B - Receiving Line

```javascript
// Console log when line appears
console.log('[Window B] New object received from RTDB');
console.log('[Window B] Object type:', 'line');
console.log('[Window B] Line data:', {
  id: 'line-1234567890-abc',
  type: 'line',
  x: 200,
  y: 200,
  points: [0, 0, 200, 100],
  width: 223.6,
  rotation: 26.57,
  createdBy: 'user-a-uid',
  createdAt: 1234567890123
});
console.log('[Window B] Line rendered on canvas');
console.log('[Window B] Sync latency: 47ms ✓');
```

### Window B - Dragging Line

```javascript
// Console log during drag
console.log('[Window B] Drag started on line:', 'line-1234567890-abc');
console.log('[Window B] Initial position:', { x: 200, y: 200 });

// Throttled updates
console.log('[Window B] Drag update 1 (t=50ms):', { x: 225, y: 225 });
console.log('[Window B] Drag update 2 (t=100ms):', { x: 250, y: 250 });
console.log('[Window B] Drag update 3 (t=150ms):', { x: 275, y: 275 });

// Drag ended
console.log('[Window B] Drag ended');
console.log('[Window B] Final position:', { x: 300, y: 300 });
console.log('[Window B] Synced to RTDB');
```

### Window A - Receiving Drag Updates

```javascript
// Console log during drag from Window B
console.log('[Window A] Line update received from RTDB');
console.log('[Window A] Line position update 1:', { x: 225, y: 225 });

console.log('[Window A] Line update received from RTDB');
console.log('[Window A] Line position update 2:', { x: 250, y: 250 });

console.log('[Window A] Line update received from RTDB');
console.log('[Window A] Line position update 3:', { x: 275, y: 275 });

// Final update
console.log('[Window A] Line final position:', { x: 300, y: 300 });
console.log('[Window A] Drag completed by user-b-uid');
```

---

## Visual Indicators of Success

### ✅ Successful Sync

**Characteristics:**
- Line appears instantly (<50ms)
- Smooth, gradual updates during drag
- No jumping or snapping
- Both windows show identical state
- No console errors
- Console shows sync latency <150ms

**Visual Cues:**
```
Window A                    Window B
   ●───────●                   ●───────●
   (same position)             (same position)
   (same angle)                (same angle)
   (same color)                (same color)
   ✓ Synced                    ✓ Synced
```

### ❌ Failed Sync

**Characteristics:**
- Line appears slowly (>150ms)
- Jerky, stuttering updates
- Jumping or teleporting
- Windows show different states
- Console errors present
- Long sync latency

**Visual Cues:**
```
Window A                    Window B
   ●───────●                   ●───────
   (position 1)                (position 2)
   ❌ Different                ❌ Different
```

---

## Troubleshooting Visual Issues

### Issue: Line Appears But Wrong Angle

**Expected:**
```
┌────────────────────┐
│                    │
│   ●────────────●   │
│   45° angle        │
└────────────────────┘
```

**Actual:**
```
┌────────────────────┐
│                    │
│   ●                │
│    \               │
│     \              │
│      ●             │
│   135° angle (wrong)│
└────────────────────┘
```

**Cause:** Rotation calculation error
**Solution:** Check `calculateLineProperties()` function

### Issue: Line Jumps During Drag

**Expected (Smooth):**
```
Frame 1:  ●────●
Frame 2:   ●────●
Frame 3:    ●────●
Frame 4:     ●────●
```

**Actual (Jumping):**
```
Frame 1:  ●────●
Frame 2:      ●────●  ← Jumped!
Frame 3:  ●────●      ← Jumped back!
Frame 4:     ●────●   ← Jumping around!
```

**Cause:** Throttling not working or conflicting updates
**Solution:** Verify `throttledUpdateCanvasObject()` is used

### Issue: Duplicate Lines

**Expected:**
```
┌────────────────────┐
│                    │
│   ●────────●       │
│   Single line      │
└────────────────────┘
```

**Actual:**
```
┌────────────────────┐
│                    │
│   ●────────●       │
│   ●────────●       │
│   Duplicate! ❌    │
└────────────────────┘
```

**Cause:** Line added to store AND synced from RTDB
**Solution:** Check subscription logic, avoid double-adding

---

## Performance Visual Indicators

### Good Performance (60 FPS)

```
┌─────────────────────────────────┐
│ Chrome DevTools Performance     │
├─────────────────────────────────┤
│ FPS: ████████████████████ 60fps │
│                                 │
│ Frame time: 16ms                │
│ ✓ Smooth, consistent            │
└─────────────────────────────────┘
```

### Poor Performance (<30 FPS)

```
┌─────────────────────────────────┐
│ Chrome DevTools Performance     │
├─────────────────────────────────┤
│ FPS: ██████░░░░░░░░░░░░░ 28fps  │
│                                 │
│ Frame time: 35ms                │
│ ❌ Stuttering, laggy            │
└─────────────────────────────────┘
```

---

## Summary: Visual Success Criteria

### During Line Creation
- [ ] Preview line shows in blue dashed style
- [ ] Final line shows in black solid style
- [ ] Line appears in other window within 50ms
- [ ] Both windows show identical line

### During Line Drag
- [ ] Line moves smoothly (not jumping)
- [ ] Throttled updates visible (~every 50ms)
- [ ] Both windows show synchronized movement
- [ ] Final position matches exactly

### During Endpoint Resize
- [ ] Endpoint handles visible when selected
- [ ] Line angle changes smoothly
- [ ] Line width changes appropriately
- [ ] Both windows show synchronized resize

### Overall Canvas
- [ ] 60 FPS maintained during all operations
- [ ] No visual glitches or artifacts
- [ ] No flickering or flashing
- [ ] Smooth collaborative experience

---

**Visual Testing Complete:** All diagrams match your testing experience

**Next Step:** Run actual tests and compare to these visual references
