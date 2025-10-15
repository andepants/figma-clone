# Line Rendering Test - Quick Start

## 1. Add Test Code to CanvasPage.tsx

**Location**: `/Users/andre/coding/figma-clone/src/pages/CanvasPage.tsx`

### Add Import (top of file):
```typescript
import { addTestLines } from '@/features/canvas-core/utils/testLines';
```

### Add State (with other useState):
```typescript
const [testLinesAdded, setTestLinesAdded] = useState(false);
```

### Add Effect (after existing useEffect hooks):
```typescript
/**
 * TEMPORARY: Test line rendering
 * TODO: Remove when line tool is complete
 */
useEffect(() => {
  if (!currentUser || isLoading || testLinesAdded) return;

  const { objects, addObject } = useCanvasStore.getState();
  const hasTestLines = objects.some(obj => obj.id.startsWith('test-line-'));

  if (!hasTestLines) {
    addTestLines(addObject, currentUser.uid);
    setTestLinesAdded(true);
    console.log('📝 Line test active - see _docs/fixes/line-rendering-test-guide.md');
  }
}, [currentUser, isLoading, testLinesAdded]);
```

---

## 2. Run Application

```bash
npm run dev
```

Navigate to canvas page → Test lines should appear automatically.

---

## 3. Verify Test Lines

You should see **9 colored lines**:

| Line | Color | Angle | Position |
|------|-------|-------|----------|
| 1 | Red | 0° | (100, 200) horizontal |
| 2 | Blue | 90° | (400, 150) vertical up |
| 3 | Green | -90° | (500, 150) vertical down |
| 4 | Orange | 45° | (100, 400) diagonal NE |
| 5 | Purple | -135° | (300, 400) diagonal SE |
| 6 | Pink | 135° | (550, 400) diagonal NW |
| 7 | Teal | -45° | (550, 150) diagonal SW |
| 8 | Gray | ~18° | (750, 200) slight angle |
| 9 | Dark Red | -180° | (750, 400) horizontal (reverse) |

---

## 4. Quick Verification Checklist

- [ ] All 9 lines visible
- [ ] Lines have correct colors
- [ ] Lines at correct positions (no overlap)
- [ ] Horizontal lines are horizontal (0° or -180°)
- [ ] Vertical lines are vertical (±90°)
- [ ] Diagonal lines at 45° or 135° angles
- [ ] Lines can be selected (with move tool)
- [ ] Lines can be dragged
- [ ] Properties panel shows correct values

---

## 5. Browser Console Commands

Check test lines:
```javascript
// Count test lines
useCanvasStore.getState().objects.filter(obj => obj.id.startsWith('test-line-')).length

// List all test lines
useCanvasStore.getState().objects
  .filter(obj => obj.id.startsWith('test-line-'))
  .map(line => ({
    id: line.id,
    x: line.x,
    y: line.y,
    rotation: line.rotation,
    color: line.stroke
  }))

// Remove test lines manually
import { clearTestLines } from '@/features/canvas-core/utils/testLines';
const { objects, removeObject } = useCanvasStore.getState();
clearTestLines(objects, removeObject);
```

---

## 6. Clean Up (After Testing)

In `CanvasPage.tsx`, remove:
1. Import for `addTestLines`
2. `testLinesAdded` state
3. Test effect with `addTestLines` call

---

## Full Documentation

- **Detailed Guide**: `_docs/fixes/line-rendering-test-guide.md`
- **Expected Results**: `_docs/fixes/line-test-expected-results.md`
- **Integration Example**: `_docs/fixes/line-test-integration-example.tsx`
- **Test Utilities**: `src/features/canvas-core/utils/testLines.ts`
- **Line Helpers**: `src/features/canvas-core/utils/lineHelpers.ts`

---

## Success Criteria

✅ Section 2.4.10 Complete when:
- All test lines render correctly
- Lines at correct positions (x, y = MIN of endpoints)
- Lines at correct rotations (-180 to 179)
- Lines can be selected and dragged
- Properties panel shows correct values
- Multiple lines work independently
