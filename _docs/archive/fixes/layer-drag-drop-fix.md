# Layer Panel Drag-and-Drop Fix

**Date:** 2025-10-19
**Issue:** Layers panel drag-and-drop was inconsistent - items would snap back to original position, group dropping was unreliable, and multi-user scenarios caused conflicts.

## Problems Fixed

### 1. Items Snapping Back After Drag
**Root Cause:** Race condition between local state updates and Firebase sync. The subscription would overwrite local changes before sync completed.

**Solution:**
- Implemented drag state locking system (`layerPanelDragService.ts`)
- Block Firebase subscription updates during active drag operations
- Proper await/error handling for `syncZIndexes` with rollback on failure
- Release lock only after sync completes

### 2. Inconsistent Group Drop Detection
**Root Cause:** Drop zone calculation used dragged item's center position instead of mouse cursor position, causing visual misalignment.

**Solution:**
- Updated `handleDragOver` to use mouse Y position from `activatorEvent.clientY`
- Expanded "child" drop zone from 25%-75% to 35%-65% for easier group drops
- Fallback to item center if event unavailable (backwards compatibility)

### 3. Missing Validation in handleDragEnd
**Root Cause:** Target object validation only happened in `handleDragOver`, not re-checked in `handleDragEnd`. Objects could be deleted or changed type between hover and drop.

**Solution:**
- Re-validate target object exists before proceeding
- Re-validate target is a group before making child relationship
- Early return with warnings if validation fails

### 4. Multi-User Conflicts
**Root Cause:** No coordination between users - last-write-wins semantics caused data loss.

**Solution:**
- Acquire lock before drag operation starts
- Only one user can drag at a time (5-second timeout for stale locks)
- Lock release on drag end (success or cancel)
- Automatic cleanup of stale locks

## Implementation Details

### New Files

#### `/src/lib/firebase/layerPanelDragService.ts`
Firebase service for managing layer panel drag locks:
- `acquireLayerDragLock()` - Acquire exclusive lock for reordering
- `releaseLayerDragLock()` - Release lock after operation
- `subscribeToLayerDragLock()` - Real-time lock state subscription
- `isLayerDragLocked()` - Check if locked by another user

Lock structure:
```typescript
interface LayerDragState {
  userId: string;
  username: string;
  timestamp: number;
  objectIds: string[];
}
```

### Modified Files

#### `/src/features/layers-panel/components/LayersPanel.tsx`
**Changes:**
1. Added `handleDragStart()` - Acquires drag lock when drag begins
2. Updated `handleDragOver()` - Uses mouse position from `activatorEvent.clientY`
3. Updated `handleDragEnd()` - Re-validates targets, awaits sync, handles rollback
4. Added drag state tracking (`isDragging`, `dragLockAcquired`)
5. Added `onDragStart` to `DndContext`

**Key Improvements:**
```typescript
// Before: Fire-and-forget sync
syncZIndexes(projectId, updated).catch(console.error);

// After: Proper await with rollback
try {
  await syncZIndexes(projectId, updated);
} catch (error) {
  console.error('Failed to sync z-indexes:', error);
  setObjects(objects); // Rollback to previous state
}
```

#### `/src/pages/canvas/hooks/useCanvasSubscriptions.ts`
**Changes:**
1. Added `subscribeToLayerDragLock()` subscription
2. Added `isLayerDragActiveRef` to track active drag operations
3. Block canvas object updates when `isLayerDragActiveRef.current === true`

**Lock Behavior:**
- Subscription skips updates if ANY user is dragging in layers panel
- Prevents race conditions during reordering operations
- Only blocks non-initial updates (first load always proceeds)

## Testing Scenarios

### Single User Testing

#### Test 1: Basic Reordering
1. Create 5+ objects on canvas
2. Drag an object from bottom to top of layers panel
3. **Expected:** Object moves smoothly, stays at new position
4. **Before:** Object might snap back to original position

#### Test 2: Group Dropping
1. Create a group and several other objects
2. Drag an object and hover over the group
3. Move mouse to center 35%-65% zone of group item
4. **Expected:** Visual indicator shows "into group", drop works on first try
5. **Before:** Required multiple attempts, zone was too small (25%-75%)

#### Test 3: Drag Between Group Siblings
1. Create a group with 3 children
2. Drag middle child to top position within group
3. **Expected:** Reordering works, stays within group
4. **Before:** Might jump out of group or snap back

#### Test 4: Nested Group Operations
1. Create group A with child group B
2. Create objects in group B
3. Drag objects between groups and root level
4. **Expected:** All operations work consistently
5. **Before:** Inconsistent behavior with nested groups

### Error Recovery Testing

#### Test 5: Firebase Sync Failure
1. Simulate network error during drag (browser DevTools offline mode)
2. Drag an object to new position
3. **Expected:** Object rolls back to original position with console error
4. **Before:** Object position becomes inconsistent

#### Test 6: Deleted Target During Drag
1. Open two browser tabs with same project
2. In tab 1: Start dragging object A
3. In tab 2: Delete the target group before dropping in tab 1
4. **Expected:** Tab 1 shows warning, operation cancelled
5. **Before:** Could cause undefined reference errors

### Multi-User Testing

#### Test 7: Concurrent Drag Prevention
1. Open two browser tabs with same project
2. User 1: Start dragging object (hold mouse button)
3. User 2: Try to drag another object
4. **Expected:** User 2's drag is blocked (log message in console)
5. **Before:** Both drags could proceed, causing conflicts

#### Test 8: Stale Lock Cleanup
1. User 1: Start drag operation
2. Close tab/browser mid-drag (don't release properly)
3. Wait 5+ seconds
4. User 2: Try to drag
5. **Expected:** User 2 can drag (stale lock auto-released)
6. **Before:** Lock would persist indefinitely

#### Test 9: Lock Release After Drag
1. User 1: Complete drag operation
2. User 2: Immediately try to drag
3. **Expected:** User 2's drag succeeds (lock released)
4. **Before:** Could remain locked temporarily

### Performance Testing

#### Test 10: Large Object Count
1. Generate 100+ objects on canvas
2. Drag objects in layers panel
3. **Expected:** Smooth drag with no lag, drop works consistently
4. **Before:** Drop zone detection could become unreliable

## Drop Zone Behavior

### Updated Zones
```
┌─────────────────────┐
│  Before (0-35%)    │ ← Drop ABOVE target
├─────────────────────┤
│                     │
│   Child (35-65%)   │ ← Drop INTO group (if group)
│                     │
├─────────────────────┤
│  After (65-100%)   │ ← Drop BELOW target
└─────────────────────┘
```

**Previous (problematic):**
- Before: 0-25%
- Child: 25-75%
- After: 75-100%

**Current (improved):**
- Before: 0-35%
- Child: 35-65%
- After: 65-100%

## Technical Details

### Firebase Structure

```
projects/
  {projectId}/
    layerDragLock:           # Lock for layer panel operations
      userId: "user-123"
      username: "Alice"
      timestamp: 1697654321000
      objectIds: ["obj-1"]

    objects/                  # Canvas objects
      {objectId}/
        x: 100
        y: 200
        zIndex: 5
        parentId: "group-1"   # Parent reference
        # ... other properties
```

### Sync Flow

**Before (Race Condition):**
```
1. User drags in panel
2. setObjects(reordered)           ← Local update
3. syncZIndexes(reordered)         ← Firebase write (async)
4. [Subscription triggers]
5. setObjects(fromFirebase)        ← Overwrites step 2!
```

**After (With Lock):**
```
1. User drags in panel
2. acquireLayerDragLock()          ← Acquire lock
3. setObjects(reordered)           ← Local update
4. await syncZIndexes(reordered)   ← Firebase write (awaited)
5. releaseLayerDragLock()          ← Release lock
6. [Subscription triggers]
7. (Blocked - lock still held OR sync already complete)
```

## Browser Compatibility

Tested on:
- Chrome 118+ ✅
- Firefox 119+ ✅
- Safari 17+ ✅
- Edge 118+ ✅

## Known Limitations

1. **Single concurrent drag:** Only one user can reorder layers at a time (by design)
2. **5-second lock timeout:** Very slow networks might hit timeout (configurable)
3. **Mouse position fallback:** Touch devices use item center if `clientY` unavailable

## Future Enhancements

- [ ] Optimistic multi-user support (operational transforms)
- [ ] Drag preview improvements (ghost layer during drag)
- [ ] Keyboard-based reordering (arrow keys)
- [ ] Batch operations (drag multiple selected items)
- [ ] Undo/redo for layer reordering

## References

- Original issue: Inconsistent layer panel drag-and-drop
- Related: Canvas drag locking (`dragStateService.ts`)
- Pattern: Similar to text editing lock (`textEditingService.ts`)
