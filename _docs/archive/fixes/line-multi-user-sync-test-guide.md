# Multi-User Line Synchronization Testing Guide

## Overview

This guide provides comprehensive instructions for testing real-time multi-user line synchronization in CollabCanvas. Verify that line creation, selection, dragging, and endpoint resizing sync across multiple users within 50ms with no conflicts.

**Status**: Section 2.5.7 - Multi-User Line Sync Test

**Target Sync Latency**: <50ms throttle + <100ms network = <150ms total

---

## Prerequisites

Before testing multi-user sync:

- [ ] Line tool is implemented and working locally (Section 2.5.1-2.5.6 complete)
- [ ] Firebase Realtime Database is configured and accessible
- [ ] Application is deployed or running on network-accessible URL
- [ ] You have access to 2+ browser windows/devices

---

## Test Environment Setup

### Option 1: Same Computer (Recommended for Quick Testing)

**Method A: Regular + Incognito Window**
1. Open browser in regular mode (Window A)
2. Open same browser in incognito/private mode (Window B)
3. Sign in with different user accounts in each window
4. Navigate both to canvas page

**Method B: Two Different Browsers**
1. Open Chrome (Window A)
2. Open Firefox/Safari/Edge (Window B)
3. Sign in with same or different accounts
4. Navigate both to canvas page

**Advantages:**
- Fast setup
- Easy to see both windows side-by-side
- Good for initial verification

**Limitations:**
- Single network connection (can't test true network latency)
- Both windows share same machine resources

### Option 2: Multiple Devices (Recommended for Production Testing)

**Setup:**
1. Device A: Desktop/laptop
2. Device B: Another laptop, tablet, or phone
3. Ensure both devices are on same network (for local testing)
4. Sign in with different accounts on each device
5. Navigate both to canvas page

**Advantages:**
- Tests true multi-user experience
- Tests network latency
- Tests different screen sizes/resolutions

**Configuration:**
```bash
# On development machine, get local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example: 192.168.1.100
# Access from other device: http://192.168.1.100:5173
```

---

## Test Cases

### Test 1: Basic Line Creation Sync

**Objective:** Verify line appears on other user's screen immediately after creation.

**Steps:**

1. **Window A: Create a line**
   - Select line tool (press 'L' or click line tool button)
   - Click at position (200, 200)
   - Drag to position (400, 300)
   - Release mouse button

2. **Window B: Observe**
   - Line should appear within 50ms
   - Line should have correct color (user A's default)
   - Line should be at exact position: (200, 200) to (400, 300)
   - Line should have correct rotation/angle

3. **Verify in both windows:**
   - Open browser console (F12)
   - Run: `useCanvasStore.getState().objects.filter(obj => obj.type === 'line')`
   - Verify both windows show same line object
   - Check timestamps match (createdAt, updatedAt)

**Success Criteria:**
- [ ] Line appears in Window B within 50ms
- [ ] Line properties match exactly (x, y, points, rotation, width)
- [ ] No console errors in either window
- [ ] createdBy field shows Window A's user ID

**Expected Console Output (Window B):**
```javascript
[
  {
    id: 'line-1234567890-xyz',
    type: 'line',
    x: 200,
    y: 200,
    points: [0, 0, 200, 100],
    width: 223.6,  // √(200² + 100²)
    rotation: 26.57,  // Math.atan2(100, 200) in degrees
    stroke: '#000000',
    strokeWidth: 2,
    createdBy: 'user-a-uid',
    createdAt: 1234567890123,
    updatedAt: 1234567890123
  }
]
```

---

### Test 2: Line Selection Sync

**Objective:** Verify selection state syncs across users.

**Steps:**

1. **Window A: Create a line**
   - Create line from (100, 100) to (300, 200)
   - Line tool auto-switches to move tool

2. **Window B: Select the line**
   - Ensure move tool is active
   - Click on the line created by Window A
   - Line should show selection indicator (blue border)

3. **Window A: Observe**
   - Window A should NOT see selection (selection is local per user)
   - Window A should see line remain unselected

4. **Verify selection service:**
   - Open Firebase RTDB console
   - Navigate to: `/selections/main/{userB-uid}`
   - Verify it shows the line ID

**Success Criteria:**
- [ ] Selection is LOCAL per user (not synced)
- [ ] Other user's line can be selected
- [ ] Selection service tracks selection correctly
- [ ] No interference between users' selections

**Note:** Selection state should NOT sync across users - each user has independent selection.

---

### Test 3: Line Drag Sync

**Objective:** Verify dragging a line syncs position to other users in real-time.

**Steps:**

1. **Window A: Create a line**
   - Create line from (100, 100) to (300, 200)
   - Note the initial position

2. **Window B: Select and drag the line**
   - Click line to select it
   - Drag line to new position (200, 200)
   - Release mouse

3. **Window A: Observe in real-time**
   - Line should move smoothly during drag (throttled updates)
   - Line should update position approximately every 50ms
   - Final position should match exactly when drag ends

4. **Verify drag state:**
   - During drag, check: `/dragStates/main/{lineId}`
   - Should show Window B's user info and current position
   - After drag ends, drag state should clear

5. **Verify final position:**
   ```javascript
   // In both windows
   const line = useCanvasStore.getState().objects.find(obj => obj.id === 'line-...');
   console.log({ x: line.x, y: line.y, points: line.points });
   ```

**Success Criteria:**
- [ ] Line moves in Window A while Window B drags
- [ ] Throttled updates occur ~every 50ms (20 fps)
- [ ] Final position matches exactly in both windows
- [ ] Drag state shows correct user info during drag
- [ ] Drag state clears after drag ends
- [ ] Line rotation and width unchanged after drag

**Expected Behavior:**
- **During drag:** Position updates throttled to 50ms
- **After drag:** Final atomic update with exact position
- **Network latency:** Total perceived lag <150ms

---

### Test 4: Endpoint Resize Sync

**Objective:** Verify dragging line endpoints syncs resize to other users.

**Steps:**

1. **Window A: Create a line**
   - Create horizontal line from (100, 100) to (300, 100)
   - Line should have rotation = 0°, width = 200

2. **Window B: Select the line**
   - Click line to select it
   - Line should show 2 endpoint handles (white circles with blue border)

3. **Window B: Drag endpoint 2 (right endpoint)**
   - Hover over right endpoint handle at (300, 100)
   - Drag handle to new position (300, 200)
   - Release mouse

4. **Window A: Observe in real-time**
   - Line should update during drag (throttled)
   - Line should resize, changing angle and width
   - Final result: line from (100, 100) to (300, 200)

5. **Verify line properties updated:**
   ```javascript
   // In both windows
   const line = useCanvasStore.getState().objects.find(obj => obj.id === 'line-...');
   console.log({
     x: line.x,      // Should be 100
     y: line.y,      // Should be 100
     width: line.width,  // Should be ~223.6
     rotation: line.rotation,  // Should be ~-26.57°
     points: line.points  // Should be [0, 0, 200, 100]
   });
   ```

**Success Criteria:**
- [ ] Endpoint drag updates line in real-time (Window A)
- [ ] Line rotation updates correctly
- [ ] Line width updates correctly
- [ ] Line position recalculates if needed (when MIN endpoint changes)
- [ ] Final properties match exactly in both windows
- [ ] Throttled updates during drag (~50ms)
- [ ] No jitter or visual artifacts

**Expected Property Changes:**
```typescript
// Before resize
{
  x: 100, y: 100,
  points: [0, 0, 200, 0],
  width: 200,
  rotation: 0
}

// After resize (dragged right endpoint down 100px)
{
  x: 100, y: 100,  // MIN stays same
  points: [0, 0, 200, 100],
  width: 223.6,  // √(200² + 100²)
  rotation: -26.57  // Math.atan2(100, 200) in degrees
}
```

---

### Test 5: Rapid Concurrent Line Creation

**Objective:** Verify multiple users can create lines simultaneously without conflicts.

**Steps:**

1. **Setup:** Position windows side-by-side
   - Window A on left side of screen
   - Window B on right side of screen
   - Both users ready with line tool selected

2. **Simultaneous creation (5 lines in 5 seconds):**
   - **Second 1:**
     - Window A: Create line at (100, 100) to (200, 150)
     - Window B: Create line at (500, 100) to (600, 150)

   - **Second 2:**
     - Window A: Create line at (100, 200) to (200, 250)
     - Window B: Create line at (500, 200) to (600, 250)

   - **Second 3:**
     - Window A: Create line at (100, 300) to (200, 350)
     - Window B: Create line at (500, 300) to (600, 350)

   - **Second 4:**
     - Window A: Create line at (100, 400) to (200, 450)
     - Window B: Create line at (500, 400) to (600, 450)

   - **Second 5:**
     - Window A: Create line at (100, 500) to (200, 550)
     - Window B: Create line at (500, 500) to (600, 550)

3. **Verify all lines exist:**
   ```javascript
   // In both windows
   const lines = useCanvasStore.getState().objects.filter(obj => obj.type === 'line');
   console.log(`Total lines: ${lines.length}`);  // Should be 10

   // Check created by each user
   const userALines = lines.filter(line => line.createdBy === 'user-a-uid');
   const userBLines = lines.filter(line => line.createdBy === 'user-b-uid');
   console.log(`User A created: ${userALines.length}`);  // Should be 5
   console.log(`User B created: ${userBLines.length}`);  // Should be 5
   ```

4. **Check for conflicts:**
   - Open browser console in both windows
   - Look for sync errors, race conditions, or warnings
   - Verify no duplicate line IDs
   - Verify all lines render correctly

**Success Criteria:**
- [ ] All 10 lines created successfully (5 per user)
- [ ] No duplicate line IDs
- [ ] No console errors in either window
- [ ] All lines visible in both windows
- [ ] No visual glitches or flickering
- [ ] Each line has correct createdBy user ID
- [ ] No sync conflicts or race conditions

**Common Issues:**
- Duplicate IDs → Check ID generation uses timestamp + random
- Missing lines → Check Firebase permissions
- Flickering → Check throttling is working correctly

---

### Test 6: Complex Multi-Operation Sync

**Objective:** Verify multiple operations happening simultaneously across users.

**Scenario:** Real-world collaborative editing

**Steps:**

1. **Window A: Create 3 lines**
   - Line 1: (100, 100) to (300, 100) - horizontal
   - Line 2: (100, 200) to (300, 200) - horizontal
   - Line 3: (100, 300) to (300, 300) - horizontal

2. **Window B: While Window A is creating lines**
   - Select and drag Line 1 (as soon as it appears)
   - Move it to position (400, 150)

3. **Window A: Immediately after creating lines**
   - Select Line 2
   - Drag right endpoint to (300, 250) - make it diagonal

4. **Window B: Simultaneously**
   - Select Line 3
   - Delete it (press Delete/Backspace)

5. **Both windows: Create new line together**
   - Window A: Create line at (500, 100) to (600, 200)
   - Window B: Create line at (500, 300) to (600, 400)

6. **Verify final state:**
   ```javascript
   const lines = useCanvasStore.getState().objects.filter(obj => obj.type === 'line');
   console.log(`Total lines: ${lines.length}`);  // Should be 4

   // Line 1: moved by Window B
   const line1 = lines.find(l => l.id.includes('...')); // Find by ID
   console.log({ x: line1.x, y: line1.y });  // Should be (400, 150)

   // Line 2: resized by Window A
   const line2 = lines.find(l => l.id.includes('...')); // Find by ID
   console.log({ rotation: line2.rotation });  // Should be ~-14°

   // Line 3: deleted by Window B - should NOT exist

   // 2 new lines created simultaneously
   ```

**Success Criteria:**
- [ ] All operations sync correctly
- [ ] No operations lost or overwritten
- [ ] Deleted line disappears from both windows
- [ ] Moved line appears at new position in both windows
- [ ] Resized line shows new rotation in both windows
- [ ] New lines created by both users appear correctly
- [ ] No console errors
- [ ] No visual glitches

---

## Firebase RTDB Verification

### How to Check Firebase Console

1. **Open Firebase Console:**
   - Navigate to: https://console.firebase.google.com
   - Select your project
   - Click "Realtime Database" in left sidebar

2. **Navigate to canvas objects:**
   ```
   canvases/
     main/
       objects/
         line-1234567890-xyz/  ← Your line objects
           id: "line-1234567890-xyz"
           type: "line"
           x: 200
           y: 200
           points: [0, 0, 200, 100]
           width: 223.6
           rotation: 26.57
           stroke: "#000000"
           strokeWidth: 2
           createdBy: "user-a-uid"
           createdAt: 1234567890123
           updatedAt: 1234567890123
   ```

3. **Verify line data structure:**
   - Check all required fields exist
   - Verify position (x, y) is MIN of endpoints
   - Verify points array is relative to (x, y)
   - Verify rotation is in range -180° to 179°
   - Verify width is correct Euclidean distance
   - Verify timestamps are present

4. **Check for sync issues:**
   - Look for null values (indicates deletion)
   - Look for NaN or undefined values (indicates calculation error)
   - Check updatedAt timestamp updates during drag
   - Verify createdBy shows correct user ID

### Live Monitoring During Tests

**Watch real-time updates:**
1. Keep Firebase Console open during tests
2. Expand the objects node
3. Watch values update as users drag/resize lines
4. Look for throttled updates (~50ms apart)
5. Verify atomic final update when drag ends

**Example Console View:**
```
canvases/main/objects/line-123/
  updatedAt: 1234567890100  → 1234567890150  → 1234567890200
  x: 200                     → 205            → 210
  y: 200                     → 205            → 210
```

---

## Troubleshooting Guide

### Issue: Line doesn't appear in other window

**Symptoms:**
- Window A creates line
- Window B doesn't see it

**Possible Causes:**

1. **Firebase permissions issue**
   ```javascript
   // Check console for permission errors
   // Should see: "PERMISSION_DENIED: Permission denied"
   ```
   **Solution:** Verify Firebase RTDB rules allow read/write

2. **Line didn't sync to RTDB**
   ```javascript
   // In Window A, check if line was added
   const line = useCanvasStore.getState().objects.find(obj => obj.type === 'line' && obj.id === '...');
   console.log('Line in store:', line);

   // Check if addCanvasObject was called
   ```
   **Solution:** Verify `addCanvasObject()` is called after line creation

3. **Subscription not active**
   ```javascript
   // In Window B, check subscription
   // Should see console log: "Subscribed to canvas objects"
   ```
   **Solution:** Verify `subscribeToCanvasObjects()` is called on page load

### Issue: Line position wrong in other window

**Symptoms:**
- Line appears but at wrong position
- Line appears rotated incorrectly

**Possible Causes:**

1. **Position calculation error**
   ```javascript
   // Check if x, y is MIN of endpoints
   const line = useCanvasStore.getState().objects.find(obj => obj.id === '...');
   const { x, y, points } = line;

   // Endpoint 1: (x + points[0], y + points[1])
   const endpoint1 = { x: x + points[0], y: y + points[1] };
   // Endpoint 2: (x + points[2], y + points[3])
   const endpoint2 = { x: x + points[2], y: y + points[3] };

   // Verify x === min(endpoint1.x, endpoint2.x)
   // Verify y === min(endpoint1.y, endpoint2.y)
   ```
   **Solution:** Check `calculateLineProperties()` function

2. **Rotation normalization error**
   ```javascript
   // Check rotation range
   const line = useCanvasStore.getState().objects.find(obj => obj.id === '...');
   console.log('Rotation:', line.rotation);
   // Should be -180 to 179, never 180 to 360
   ```
   **Solution:** Verify `normalizeLineRotation()` is called

### Issue: Line jumps during drag

**Symptoms:**
- Line moves erratically while being dragged
- Line jumps to different positions

**Possible Causes:**

1. **Throttling not working**
   ```javascript
   // Check if throttledUpdateCanvasObject is used
   // Should see updates ~every 50ms, not every frame
   ```
   **Solution:** Use `throttledUpdateCanvasObject()` in drag handler

2. **Conflicting updates**
   ```javascript
   // Check for multiple users dragging same line
   // Check drag lock service
   ```
   **Solution:** Implement drag lock to prevent concurrent drags

3. **Position calculation changing**
   ```javascript
   // During drag, position (x, y) should change but points array stays same
   // Check if points array is being modified during drag
   ```
   **Solution:** Only update x, y during drag, keep points unchanged

### Issue: Endpoint resize doesn't sync

**Symptoms:**
- Dragging endpoint works locally but doesn't sync

**Possible Causes:**

1. **Resize not updating RTDB**
   ```javascript
   // Check if updateCanvasObject is called on resize end
   // Look for console errors during resize
   ```
   **Solution:** Verify `onResizeEnd` callback updates RTDB

2. **Properties not recalculated**
   ```javascript
   // After resize, check all properties updated
   const line = useCanvasStore.getState().objects.find(obj => obj.id === '...');
   console.log({
     x: line.x,
     y: line.y,
     points: line.points,
     width: line.width,
     rotation: line.rotation
   });
   // All should reflect new endpoint positions
   ```
   **Solution:** Call `calculateLineProperties()` after endpoint drag

### Issue: Console errors during sync

**Common Errors:**

1. **"Cannot read property 'x' of undefined"**
   - Line object doesn't exist in store
   - Check if line was deleted
   - Verify line ID is correct

2. **"PERMISSION_DENIED"**
   - Firebase RTDB rules too restrictive
   - Verify user is authenticated
   - Check rules in Firebase Console

3. **"NaN in line properties"**
   - Position or rotation calculation error
   - Check `calculateLineProperties()` input values
   - Verify endpoints are valid numbers

4. **"Throttle function called too frequently"**
   - Throttling might be misconfigured
   - Should throttle to 50ms minimum
   - Check throttle implementation

### Issue: Slow sync (>150ms latency)

**Symptoms:**
- Line appears slowly in other window
- Noticeable lag during drag

**Debugging Steps:**

1. **Measure network latency**
   ```javascript
   // In browser console
   const start = Date.now();
   fetch('https://your-firebase-db.firebaseio.com/.json')
     .then(() => console.log(`Latency: ${Date.now() - start}ms`));
   ```

2. **Check throttling settings**
   ```javascript
   // Verify throttle is 50ms
   // Check throttle function implementation
   ```

3. **Check Firebase region**
   - Firebase RTDB should be in region close to users
   - Check `databaseURL` in Firebase config
   - Consider using regional RTDB instance

4. **Profile performance**
   - Open Chrome DevTools Performance tab
   - Record during line creation/drag
   - Look for slow functions or excessive re-renders

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| **Line creation sync** | <50ms | <100ms | >150ms |
| **Drag update rate** | 20 fps (50ms) | 15 fps (67ms) | <10 fps |
| **Endpoint resize sync** | <50ms | <100ms | >150ms |
| **Concurrent line creation** | No conflicts | Rare conflicts | Frequent conflicts |
| **Canvas FPS during sync** | 60 fps | 45+ fps | <30 fps |

### How to Measure

**1. Sync Latency:**
```javascript
// In Window A (creating line)
console.time('line-sync');
// Create line...
console.log('Line created at:', Date.now());

// In Window B (receiving line)
// Add to subscription callback:
console.log('Line received at:', Date.now());
console.timeEnd('line-sync');
```

**2. Drag Update Rate:**
```javascript
// In drag handler
let lastUpdate = Date.now();
onDragMove: (e) => {
  const now = Date.now();
  const delta = now - lastUpdate;
  console.log(`Drag update delta: ${delta}ms`);
  lastUpdate = now;

  throttledUpdateCanvasObject(...);
}
```

**3. Canvas FPS:**
```javascript
// Use browser DevTools
// Chrome: Rendering → FPS meter
// Or use Performance API:
let lastFrame = performance.now();
function measureFPS() {
  const now = performance.now();
  const fps = 1000 / (now - lastFrame);
  console.log(`FPS: ${fps.toFixed(2)}`);
  lastFrame = now;
  requestAnimationFrame(measureFPS);
}
measureFPS();
```

---

## Success Criteria Checklist

Mark all items before considering Section 2.5.7 complete:

### Line Creation
- [ ] Window A creates line → Window B sees it within 50ms
- [ ] Line properties match exactly in both windows
- [ ] No console errors during creation
- [ ] Line ID is unique and consistent

### Line Selection
- [ ] Each user can select lines independently
- [ ] Selection is local (doesn't sync across users)
- [ ] Selection service tracks correctly
- [ ] No interference between users

### Line Drag
- [ ] Dragging line syncs position in real-time
- [ ] Throttled updates occur ~every 50ms
- [ ] Final position matches exactly after drag ends
- [ ] Drag state service shows correct user info
- [ ] Rotation and width unchanged during drag

### Endpoint Resize
- [ ] Dragging endpoint syncs resize in real-time
- [ ] Line rotation updates correctly
- [ ] Line width updates correctly
- [ ] Line position recalculates if MIN endpoint changes
- [ ] Final properties match exactly in both windows

### Concurrent Operations
- [ ] Multiple users can create lines simultaneously
- [ ] 10 lines created in 5 seconds with no conflicts
- [ ] No duplicate line IDs
- [ ] All lines visible in both windows
- [ ] No sync errors or race conditions

### Performance
- [ ] Sync latency <150ms
- [ ] Canvas maintains 60 FPS during sync
- [ ] Drag updates at 20 fps (50ms throttle)
- [ ] No visual glitches or flickering
- [ ] No memory leaks during extended testing

### Firebase RTDB
- [ ] Line objects visible in Firebase Console
- [ ] All properties have correct values
- [ ] No null, NaN, or undefined values
- [ ] Timestamps update correctly
- [ ] Deleted lines remove cleanly

---

## Test Report Template

Use this template to document your test results:

```markdown
# Multi-User Line Sync Test Report

**Date:** [Date]
**Tester:** [Your Name]
**Environment:** [Development / Production]
**Devices:** [Browser A, Browser B, etc.]

## Test Results Summary

- **Total Tests:** 6
- **Passed:** __/6
- **Failed:** __/6
- **Overall Status:** [PASS / FAIL]

## Test 1: Basic Line Creation Sync
- **Status:** [PASS / FAIL]
- **Sync Latency:** __ms
- **Notes:** [Any observations]

## Test 2: Line Selection Sync
- **Status:** [PASS / FAIL]
- **Notes:** [Any observations]

## Test 3: Line Drag Sync
- **Status:** [PASS / FAIL]
- **Sync Latency:** __ms
- **Update Rate:** __fps
- **Notes:** [Any observations]

## Test 4: Endpoint Resize Sync
- **Status:** [PASS / FAIL]
- **Sync Latency:** __ms
- **Notes:** [Any observations]

## Test 5: Rapid Concurrent Line Creation
- **Status:** [PASS / FAIL]
- **Lines Created:** __/10
- **Conflicts:** [Yes / No]
- **Notes:** [Any observations]

## Test 6: Complex Multi-Operation Sync
- **Status:** [PASS / FAIL]
- **Notes:** [Any observations]

## Performance Metrics

- **Average Sync Latency:** __ms
- **Canvas FPS:** __fps
- **Drag Update Rate:** __fps
- **Memory Usage:** __ MB

## Issues Found

1. [Issue description]
   - **Severity:** [Critical / High / Medium / Low]
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]

## Recommendations

[Any recommendations for improvements]

## Conclusion

[Overall assessment of multi-user line sync functionality]
```

---

## Next Steps

After successful multi-user sync testing:

1. ✅ **Section 2.5.7 Complete** - Multi-user line sync verified
2. **Section 2.5.8** - Add line tool keyboard shortcut ('L' key)
3. **Section 2.6** - Line properties panel integration
4. **Section 2.7** - Line edge cases and polish

---

## Additional Resources

### Documentation References
- **Line Implementation Plan:** `_docs/plan/line.md`
- **Line Rendering Test:** `_docs/fixes/line-rendering-test-guide.md`
- **Firebase RTDB Service:** `src/lib/firebase/realtimeCanvasService.ts`
- **Canvas Store:** `src/stores/canvasStore.ts`

### Firebase Documentation
- **Realtime Database:** https://firebase.google.com/docs/database
- **Security Rules:** https://firebase.google.com/docs/database/security
- **Performance:** https://firebase.google.com/docs/database/usage/optimize

### Browser Tools
- **Chrome DevTools Performance:** F12 → Performance tab
- **Chrome DevTools Network:** F12 → Network tab
- **Firefox Performance Tools:** F12 → Performance tab

---

## Notes

- Multi-user sync is the most critical feature for a collaborative canvas app
- Test thoroughly with realistic scenarios (not just happy path)
- Real-world usage involves concurrent operations, network delays, and conflicts
- Firebase RTDB is optimized for real-time sync but requires proper configuration
- Throttling is essential to prevent excessive updates and bandwidth usage
- Always verify sync works across different network conditions

---

**Testing Status**: Ready for execution

**Last Updated**: 2025-10-14
