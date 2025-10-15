# Line Rendering Test Guide

## Overview

This guide explains how to test line rendering functionality by programmatically adding test lines to the canvas. This allows verification that lines render correctly before the line tool is fully implemented.

**Status**: Section 2.4.10 - Line Rendering and Interaction Testing

## Test Utilities

### Location
`/Users/andre/coding/figma-clone/src/features/canvas-core/utils/testLines.ts`

### Available Functions

#### 1. `createTestLine(x1, y1, x2, y2, id, userId, overrides?)`
Creates a single test line with proper properties calculated from endpoints.

**Parameters:**
- `x1, y1`: First endpoint coordinates
- `x2, y2`: Second endpoint coordinates
- `id`: Unique line ID
- `userId`: User ID who created the line
- `overrides`: Optional property overrides (stroke, strokeWidth, etc.)

**Returns:** Complete `Line` object

#### 2. `generateTestLines(userId)`
Generates comprehensive set of test lines covering all angles.

**Returns:** Array of 9 test lines

#### 3. `addTestLines(addObject, userId)`
Convenience function to add all test lines to canvas store.

**Parameters:**
- `addObject`: Canvas store's addObject function
- `userId`: User ID who created the lines

#### 4. `clearTestLines(objects, removeObject)`
Removes all test lines from canvas (identified by 'test-line-' prefix).

**Parameters:**
- `objects`: Current canvas objects
- `removeObject`: Canvas store's removeObject function

---

## How to Test

### Step 1: Import Test Utilities

In `/Users/andre/coding/figma-clone/src/pages/CanvasPage.tsx`, add the import:

```typescript
import { addTestLines, clearTestLines } from '@/features/canvas-core/utils/testLines';
```

### Step 2: Add Test Lines on Page Load

Add this `useEffect` hook after the existing hooks in `CanvasPage.tsx`:

```typescript
/**
 * TEMPORARY: Add test lines to verify rendering
 * TODO: Remove this once line tool is implemented
 */
useEffect(() => {
  if (!currentUser) return;

  // Wait for initial load to complete
  if (isLoading) return;

  // Add test lines (only once)
  const { objects, addObject } = useCanvasStore.getState();

  // Check if test lines already exist
  const hasTestLines = objects.some(obj => obj.id.startsWith('test-line-'));

  if (!hasTestLines) {
    addTestLines(addObject, currentUser.uid);
  }
}, [currentUser, isLoading]);
```

### Step 3: Run the Application

```bash
npm run dev
```

Navigate to the canvas page. You should see 9 test lines appear automatically.

### Step 4: Verify Test Lines

Check that all lines render correctly according to the test cases below.

### Step 5: Clean Up (Optional)

To remove test lines, you can:

**Option A:** Call `clearTestLines` programmatically:
```typescript
const { objects, removeObject } = useCanvasStore.getState();
clearTestLines(objects, removeObject);
```

**Option B:** Remove the test effect from CanvasPage.tsx

**Option C:** Delete individual lines using the canvas UI (when delete functionality is implemented)

---

## Test Cases

The `generateTestLines()` function creates 9 test lines that verify different scenarios:

### Test 1: Horizontal Line (0°) - Red
- **Endpoints**: (100, 200) → (300, 200)
- **Expected Position**: x=100, y=200
- **Expected Rotation**: 0°
- **Expected Width**: 200
- **Visual**: Horizontal line going left to right

### Test 2: Vertical Line (90°) - Blue
- **Endpoints**: (400, 350) → (400, 150)
- **Expected Position**: x=400, y=150
- **Expected Rotation**: 90°
- **Expected Width**: 200
- **Visual**: Vertical line going bottom to top

### Test 3: Vertical Line (-90°) - Green
- **Endpoints**: (500, 150) → (500, 350)
- **Expected Position**: x=500, y=150
- **Expected Rotation**: -90°
- **Expected Width**: 200
- **Visual**: Vertical line going top to bottom

### Test 4: Diagonal Line (45°) - Orange
- **Endpoints**: (100, 550) → (250, 400)
- **Expected Position**: x=100, y=400
- **Expected Rotation**: 45°
- **Expected Width**: ~212.13
- **Visual**: Diagonal line going bottom-left to top-right

### Test 5: Diagonal Line (-135°) - Purple
- **Endpoints**: (300, 400) → (450, 550)
- **Expected Position**: x=300, y=400
- **Expected Rotation**: -135°
- **Expected Width**: ~212.13
- **Visual**: Diagonal line going top-left to bottom-right

### Test 6: Diagonal Line (135°) - Pink
- **Endpoints**: (700, 550) → (550, 400)
- **Expected Position**: x=550, y=400
- **Expected Rotation**: 135°
- **Expected Width**: ~212.13
- **Visual**: Diagonal line going bottom-right to top-left

### Test 7: Diagonal Line (-45°) - Teal
- **Endpoints**: (700, 150) → (550, 300)
- **Expected Position**: x=550, y=150
- **Expected Rotation**: -45°
- **Expected Width**: ~212.13
- **Visual**: Diagonal line going top-right to bottom-left

### Test 8: Slight Angle (~14°) - Gray
- **Endpoints**: (750, 200) → (900, 250)
- **Expected Position**: x=750, y=200
- **Expected Rotation**: ~18.43°
- **Expected Width**: ~158.11
- **Visual**: Nearly horizontal line with slight upward slope

### Test 9: 180° Normalized - Dark Red
- **Endpoints**: (900, 400) → (750, 400)
- **Expected Position**: x=750, y=400
- **Expected Rotation**: -180° (normalized from 180°)
- **Expected Width**: 150
- **Visual**: Horizontal line going right to left

---

## Verification Checklist

Use this checklist to verify line rendering works correctly:

### Visual Verification
- [ ] All 9 lines appear on canvas
- [ ] Lines have correct colors (red, blue, green, orange, purple, pink, teal, gray, dark red)
- [ ] Lines have appropriate thickness (most are thick strokeWidth=3, a few are thinner)
- [ ] Lines are positioned correctly (not overlapping unexpectedly)

### Position Verification
- [ ] Line position (x, y) is at the MIN of both endpoints
- [ ] Lines don't jump or shift position when rendered
- [ ] Horizontal lines are truly horizontal (0° or -180°)
- [ ] Vertical lines are truly vertical (90° or -90°)

### Rotation Verification
- [ ] Diagonal lines are at correct angles (45°, -45°, 135°, -135°)
- [ ] Rotation is in range -180° to 179° (never exactly 180°)
- [ ] 180° angle is normalized to -180° (Test 9)

### Interaction Verification (requires move tool)
- [ ] Lines can be selected when clicked (move tool active)
- [ ] Selection shows visual feedback (color change, glow)
- [ ] Lines can be dragged to new positions
- [ ] Multiple lines can be created and render independently

### Properties Panel Verification
- [ ] Selecting a line shows its properties (position, rotation, stroke, etc.)
- [ ] Properties display correct values matching expectations
- [ ] Width shows line length (calculated from points)
- [ ] Rotation shows normalized angle (-180 to 179)

---

## Expected Console Output

When test lines are added, you should see this in the browser console:

```
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
  // ... (7 more lines)
]
```

---

## Debugging Tips

### Lines Don't Appear
1. Check console for errors
2. Verify `isLoading` is false before adding lines
3. Check that `currentUser` exists
4. Verify Line component is imported in CanvasStage
5. Check that line layer is rendering in CanvasStage

### Lines Appear But Wrong Position
1. Check console output for actual x, y values
2. Verify `calculateLineProperties` is working correctly
3. Check that MIN calculation is correct (x = Math.min(x1, x2), y = Math.min(y1, y2))

### Lines Appear But Wrong Rotation
1. Check console output for actual rotation values
2. Verify rotation is in range -180 to 179
3. Check `normalizeLineRotation` function is working
4. Test specific angles manually with `createTestLine`

### Lines Render But Can't Interact
1. Verify move tool is active
2. Check Line component has click/drag handlers
3. Verify `activeTool === 'move'` in Line component
4. Check that line is not locked or disabled

---

## Performance Notes

- Test lines use optimized properties (React.memo, throttled updates)
- 9 test lines should render at 60 FPS with no lag
- Total memory impact should be negligible (<1KB per line)
- Lines should sync to Firebase Realtime DB if enabled

---

## Next Steps

After verifying line rendering works correctly:

1. ✅ **Section 2.4.10 Complete** - Lines render and can be interacted with
2. **Section 2.4.11** - Implement line tool for creating lines via drag
3. **Section 2.4.12** - Implement line endpoint resize handles
4. **Section 2.4.13** - Add line properties to properties panel

---

## Clean Up Instructions

Once line tool is fully implemented and tested:

1. Remove test utilities import from CanvasPage.tsx
2. Remove test effect that calls `addTestLines`
3. (Optional) Delete `/Users/andre/coding/figma-clone/src/features/canvas-core/utils/testLines.ts`
4. (Optional) Remove export from utils barrel export
5. (Optional) Delete this test guide document

**DO NOT** delete test utilities until line tool is complete and verified working!

---

## File References

- **Test Utilities**: `/Users/andre/coding/figma-clone/src/features/canvas-core/utils/testLines.ts`
- **Line Helpers**: `/Users/andre/coding/figma-clone/src/features/canvas-core/utils/lineHelpers.ts`
- **Line Component**: `/Users/andre/coding/figma-clone/src/features/canvas-core/shapes/Line.tsx`
- **Canvas Store**: `/Users/andre/coding/figma-clone/src/stores/canvasStore.ts`
- **Canvas Page**: `/Users/andre/coding/figma-clone/src/pages/CanvasPage.tsx`
- **Line Types**: `/Users/andre/coding/figma-clone/src/types/canvas.types.ts`
