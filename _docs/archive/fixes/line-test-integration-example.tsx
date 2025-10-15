/**
 * Line Test Integration Example
 *
 * This file shows how to integrate line rendering tests into CanvasPage.tsx.
 * Copy the relevant code snippets into CanvasPage.tsx to enable testing.
 *
 * IMPORTANT: This is a TEMPORARY test integration - remove once line tool is complete!
 */

// ============================================================
// STEP 1: Add Import at Top of CanvasPage.tsx
// ============================================================

import { addTestLines, clearTestLines } from '@/features/canvas-core/utils/testLines';

// ============================================================
// STEP 2: Add State for Test Lines Control (Optional)
// ============================================================

// Add this with other useState declarations in CanvasPage component
const [testLinesAdded, setTestLinesAdded] = useState(false);

// ============================================================
// STEP 3: Add Test Lines Effect
// ============================================================

// Add this useEffect after the other effects in CanvasPage component
/**
 * TEMPORARY: Add test lines to verify line rendering
 * TODO: Remove this once line tool is fully implemented and tested
 *
 * This effect adds 9 test lines covering different angles:
 * - Horizontal (0°)
 * - Vertical (90°, -90°)
 * - Diagonal (45°, -45°, 135°, -135°)
 * - Edge cases (slight angle, 180° normalization)
 */
useEffect(() => {
  // Only run if user is authenticated
  if (!currentUser) return;

  // Wait for initial canvas load to complete
  if (isLoading) return;

  // Only add test lines once
  if (testLinesAdded) return;

  // Get canvas store methods
  const { objects, addObject } = useCanvasStore.getState();

  // Check if test lines already exist (prevent duplicates on re-renders)
  const hasTestLines = objects.some(obj => obj.id.startsWith('test-line-'));

  if (!hasTestLines) {
    // Add test lines to canvas
    addTestLines(addObject, currentUser.uid);
    setTestLinesAdded(true);

    console.log('📝 Line rendering test active - 9 test lines added');
    console.log('ℹ️  See _docs/fixes/line-rendering-test-guide.md for verification checklist');
  }

  // Cleanup function to remove test lines when component unmounts
  return () => {
    if (testLinesAdded) {
      const { objects, removeObject } = useCanvasStore.getState();
      clearTestLines(objects, removeObject);
      console.log('🧹 Test lines cleaned up');
    }
  };
}, [currentUser, isLoading, testLinesAdded]);

// ============================================================
// ALTERNATIVE: Manual Test Lines Control (Advanced)
// ============================================================

/**
 * If you want manual control over when test lines are added/removed,
 * use this approach instead of the automatic effect above.
 */

// Add buttons to UI (e.g., in a debug panel):
/*
<div className="absolute bottom-20 left-4 z-20 flex gap-2">
  <button
    onClick={() => {
      const { addObject } = useCanvasStore.getState();
      if (currentUser) {
        addTestLines(addObject, currentUser.uid);
        setTestLinesAdded(true);
      }
    }}
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
    disabled={testLinesAdded}
  >
    Add Test Lines
  </button>

  <button
    onClick={() => {
      const { objects, removeObject } = useCanvasStore.getState();
      clearTestLines(objects, removeObject);
      setTestLinesAdded(false);
    }}
    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
    disabled={!testLinesAdded}
  >
    Clear Test Lines
  </button>
</div>
*/

// ============================================================
// VERIFICATION CODE (Browser Console)
// ============================================================

/**
 * Run these commands in browser console to verify test lines:
 */

// 1. Check if test lines exist
// useCanvasStore.getState().objects.filter(obj => obj.id.startsWith('test-line-'))

// 2. Get specific test line properties
// useCanvasStore.getState().objects.find(obj => obj.id === 'test-line-horizontal')

// 3. Count test lines
// useCanvasStore.getState().objects.filter(obj => obj.id.startsWith('test-line-')).length

// 4. Log all test line rotations
// useCanvasStore.getState().objects
//   .filter(obj => obj.id.startsWith('test-line-'))
//   .forEach(line => console.log(line.id, 'rotation:', line.rotation))

// 5. Manually add a custom test line
/*
import { createTestLine } from '@/features/canvas-core/utils/testLines';
const { addObject } = useCanvasStore.getState();
const customLine = createTestLine(200, 200, 400, 300, 'custom-line', 'user123', {
  stroke: '#ff00ff',
  strokeWidth: 5
});
addObject(customLine);
*/

// ============================================================
// CLEANUP CHECKLIST
// ============================================================

/**
 * When line tool is complete and verified working, remove:
 *
 * [ ] Import statement for testLines utilities
 * [ ] testLinesAdded state variable
 * [ ] Test lines useEffect
 * [ ] Any manual control buttons/UI
 * [ ] This example file (_docs/fixes/line-test-integration-example.tsx)
 * [ ] (Optional) Test utilities file (src/features/canvas-core/utils/testLines.ts)
 * [ ] (Optional) Export from utils barrel (src/features/canvas-core/utils/index.ts)
 */
