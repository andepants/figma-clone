# Line Rendering Test - Expected Results

## Overview

This document describes the expected visual output when test lines are added to the canvas using the `addTestLines()` utility.

**Test Script**: `/Users/andre/coding/figma-clone/src/features/canvas-core/utils/testLines.ts`

---

## Expected Visual Layout

When test lines are rendered, you should see 9 distinct colored lines arranged on the canvas:

```
Canvas Layout (approximate positions):

     100   300   400   500       700   900
  ────────────────────────────────────────
150│                 │GREEN      TEAL\
   │                 │             \
200│RED━━━━━━━━━━━━━▶│              \
   │                 │               \550
250│                 │                 │
   │                 │                 │
300│                 │               GRAY━━━▶
   │                 │
350│              BLUE│
   │                 ▼
400│◥ORANGE      │    PURPLE╲
   │  ╲       750│           ╲
   │   ╲      ◀━━━━━━DARK RED │
450│    ╲         │             ╲
   │     ╲        │              ╲
500│      ╲       │               ╲
   │       ╲      │                ╲PINK
550│        ▼     │                 ▼

Legend:
━  Horizontal line
│  Vertical line
╲  Diagonal line (positive slope)
╱  Diagonal line (negative slope)
```

---

## Individual Test Line Details

### 1. Horizontal Line (Red, 0°)
```
Position: (100, 200) → (300, 200)
Color: Red (#ef4444)
Stroke Width: 3px
Direction: Left to right →

Expected Properties:
- x: 100
- y: 200
- rotation: 0°
- width: 200
- points: [0, 0, 200, 0]
```

### 2. Vertical Line Up (Blue, 90°)
```
Position: (400, 350) → (400, 150)
Color: Blue (#3b82f6)
Stroke Width: 3px
Direction: Bottom to top ↑

Expected Properties:
- x: 400
- y: 150 (MIN of endpoints)
- rotation: 90°
- width: 200
- points: [0, 200, 0, 0]
```

### 3. Vertical Line Down (Green, -90°)
```
Position: (500, 150) → (500, 350)
Color: Green (#10b981)
Stroke Width: 3px
Direction: Top to bottom ↓

Expected Properties:
- x: 500
- y: 150 (MIN of endpoints)
- rotation: -90°
- width: 200
- points: [0, 0, 0, 200]
```

### 4. Diagonal 45° (Orange, NE direction)
```
Position: (100, 550) → (250, 400)
Color: Orange (#f59e0b)
Stroke Width: 3px
Direction: Bottom-left to top-right ↗

Expected Properties:
- x: 100 (MIN of x-coords)
- y: 400 (MIN of y-coords)
- rotation: 45°
- width: ~212.13 (√(150² + 150²))
- points: [0, 150, 150, 0]
```

### 5. Diagonal -135° (Purple, SE direction)
```
Position: (300, 400) → (450, 550)
Color: Purple (#8b5cf6)
Stroke Width: 3px
Direction: Top-left to bottom-right ↘

Expected Properties:
- x: 300 (MIN of x-coords)
- y: 400 (MIN of y-coords)
- rotation: -135°
- width: ~212.13 (√(150² + 150²))
- points: [0, 0, 150, 150]
```

### 6. Diagonal 135° (Pink, NW direction)
```
Position: (700, 550) → (550, 400)
Color: Pink (#ec4899)
Stroke Width: 3px
Direction: Bottom-right to top-left ↖

Expected Properties:
- x: 550 (MIN of x-coords)
- y: 400 (MIN of y-coords)
- rotation: 135°
- width: ~212.13 (√(150² + 150²))
- points: [150, 150, 0, 0]
```

### 7. Diagonal -45° (Teal, SW direction)
```
Position: (700, 150) → (550, 300)
Color: Teal (#14b8a6)
Stroke Width: 3px
Direction: Top-right to bottom-left ↙

Expected Properties:
- x: 550 (MIN of x-coords)
- y: 150 (MIN of y-coords)
- rotation: -45°
- width: ~212.13 (√(150² + 150²))
- points: [150, 0, 0, 150]
```

### 8. Slight Angle (Gray, ~18°)
```
Position: (750, 200) → (900, 250)
Color: Gray (#64748b)
Stroke Width: 2px (thinner than others)
Direction: Left to right with slight upward slope

Expected Properties:
- x: 750
- y: 200
- rotation: ~18.43° (atan2(50, 150) * 180/π)
- width: ~158.11 (√(150² + 50²))
- points: [0, 0, 150, 50]
```

### 9. 180° Normalized (Dark Red, -180°)
```
Position: (900, 400) → (750, 400)
Color: Dark Red (#dc2626)
Stroke Width: 4px (thickest)
Direction: Right to left ←

Expected Properties:
- x: 750 (MIN of x-coords)
- y: 400
- rotation: -180° (normalized from 180°)
- width: 150
- points: [150, 0, 0, 0]

IMPORTANT: This tests the edge case where rotation is
exactly 180° and should be normalized to -180°.
```

---

## Visual Verification Checklist

### Color Verification
- [ ] Red line is horizontal at top
- [ ] Blue line is vertical (pointing up)
- [ ] Green line is vertical (pointing down)
- [ ] Orange line is diagonal (45° upward)
- [ ] Purple line is diagonal (135° downward)
- [ ] Pink line is diagonal (135° upward)
- [ ] Teal line is diagonal (45° downward)
- [ ] Gray line is nearly horizontal with slight slope
- [ ] Dark red line is horizontal (thickest)

### Position Verification
- [ ] No lines overlap incorrectly
- [ ] All lines are visible on canvas
- [ ] Lines maintain proper spacing
- [ ] Position (x, y) is at MIN of endpoints for all lines

### Stroke Width Verification
- [ ] Most lines are thick (3px)
- [ ] Gray line is medium (2px)
- [ ] Dark red line is thickest (4px)

### Rotation Verification
- [ ] Horizontal lines are perfectly horizontal (0° or -180°)
- [ ] Vertical lines are perfectly vertical (±90°)
- [ ] Diagonal lines are at correct 45° or 135° angles
- [ ] Slight angle line has small rotation (~18°)

---

## Console Output

When test lines are added, you should see:

```javascript
✅ Added 9 test lines to canvas
Test lines: [
  {
    id: 'test-line-horizontal',
    x: 100,
    y: 200,
    rotation: 0,
    points: [0, 0, 200, 0],
    width: 200,
    color: '#ef4444'
  },
  {
    id: 'test-line-vertical-up',
    x: 400,
    y: 150,
    rotation: 90,
    points: [0, 200, 0, 0],
    width: 200,
    color: '#3b82f6'
  },
  {
    id: 'test-line-vertical-down',
    x: 500,
    y: 150,
    rotation: -90,
    points: [0, 0, 0, 200],
    width: 200,
    color: '#10b981'
  },
  {
    id: 'test-line-diagonal-45',
    x: 100,
    y: 400,
    rotation: 45,
    points: [0, 150, 150, 0],
    width: 212.13203435596427,
    color: '#f59e0b'
  },
  {
    id: 'test-line-diagonal-neg135',
    x: 300,
    y: 400,
    rotation: -135,
    points: [0, 0, 150, 150],
    width: 212.13203435596427,
    color: '#8b5cf6'
  },
  {
    id: 'test-line-diagonal-135',
    x: 550,
    y: 400,
    rotation: 135,
    points: [150, 150, 0, 0],
    width: 212.13203435596427,
    color: '#ec4899'
  },
  {
    id: 'test-line-diagonal-neg45',
    x: 550,
    y: 150,
    rotation: -45,
    points: [150, 0, 0, 150],
    width: 212.13203435596427,
    color: '#14b8a6'
  },
  {
    id: 'test-line-slight-angle',
    x: 750,
    y: 200,
    rotation: 18.43494882292201,
    points: [0, 0, 150, 50],
    width: 158.11388300841898,
    color: '#64748b'
  },
  {
    id: 'test-line-180-normalized',
    x: 750,
    y: 400,
    rotation: -180,
    points: [150, 0, 0, 0],
    width: 150,
    color: '#dc2626'
  }
]
```

---

## Interaction Testing

Once lines are visible, test these interactions (with move tool active):

### Selection
- [ ] Click on a line to select it
- [ ] Selected line changes color to blue (#0ea5e9)
- [ ] Selected line shows subtle glow effect
- [ ] Shift+click to multi-select lines
- [ ] Multi-selected lines show lighter blue (#38bdf8)

### Dragging
- [ ] Drag a selected line to move it
- [ ] Line follows cursor smoothly
- [ ] Line position updates in real-time
- [ ] Other users see the line move (if in collaborative session)

### Hover
- [ ] Hover over line changes cursor to 'move'
- [ ] Hovered line shows subtle color change (#94a3b8)
- [ ] Hovered line becomes slightly thicker

### Properties Panel
- [ ] Select line to see properties
- [ ] Properties show correct x, y position
- [ ] Properties show correct rotation
- [ ] Properties show correct stroke color
- [ ] Properties show correct stroke width

---

## Troubleshooting

### Lines Don't Appear
**Check:**
1. Canvas is loaded (`isLoading === false`)
2. User is authenticated (`currentUser` exists)
3. Line component is imported in CanvasStage
4. Lines layer is rendering in CanvasStage
5. Console for errors

### Lines Appear at Wrong Position
**Check:**
1. Console output for actual x, y values
2. Verify MIN calculation is correct
3. Check calculateLineProperties function
4. Inspect line.points array

### Lines Appear at Wrong Angle
**Check:**
1. Console output for actual rotation values
2. Verify rotation is in range -180 to 179
3. Check normalizeLineRotation function
4. Test specific angles manually

### Lines Can't Be Interacted With
**Check:**
1. Move tool is active
2. Line component has interaction handlers
3. Line is not locked
4. hitStrokeWidth is set correctly (min 10px)

---

## Success Criteria

Test is successful when:

- ✅ All 9 lines render correctly
- ✅ Lines are at correct positions (x, y is MIN of endpoints)
- ✅ Lines are at correct rotations (-180 to 179 range)
- ✅ Lines have correct colors and stroke widths
- ✅ Lines can be selected, dragged, and interact normally
- ✅ Properties panel shows correct values
- ✅ Multiple lines can exist independently
- ✅ No console errors or warnings

---

## Next Steps

After successful testing:

1. Mark Section 2.4.10 as complete ✅
2. Proceed to Section 2.4.11 (Line Tool Implementation)
3. Keep test utilities for regression testing
4. Document any issues found for future reference
