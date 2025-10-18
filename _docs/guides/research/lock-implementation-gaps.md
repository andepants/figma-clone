# Lock Implementation Gaps - Phase 4.4.2

**Date:** 2025-10-15
**Current Status:** Phase 4.1-4.3 complete, now implementing 4.4.2

Based on Figma research, here are the implementation gaps to address:

---

## 1. Keyboard Shortcut: Shift+Cmd+L ⭐ HIGH PRIORITY

### Current State
- ❌ No keyboard shortcut for lock/unlock

### Required Implementation
- ✅ Add `Shift+Cmd+L` (Mac) / `Shift+Ctrl+L` (Windows) to toggle lock
- ✅ Works on currently selected object(s)
- ✅ Toggle behavior: If any selected are locked, unlock all; if all unlocked, lock all

### Files to Modify
1. `src/constants/keyboardShortcuts.ts` - Add shortcut to list
2. Create or update keyboard shortcut hook for layer actions
3. Connect to `toggleLock` store action

### Implementation Plan
```typescript
// In src/features/layers-panel/hooks/useLayerShortcuts.ts (or create new)
import { useEffect } from 'react';
import { useCanvasStore } from '@/stores';

export function useLayerShortcuts() {
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const objects = useCanvasStore((state) => state.objects);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Shift+Cmd+L / Shift+Ctrl+L - Toggle lock
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();

        if (selectedIds.length === 0) return;

        // Check if any are locked
        const anyLocked = selectedIds.some(id => {
          const obj = objects.find(o => o.id === id);
          return obj?.locked === true;
        });

        // If any locked, unlock all; otherwise lock all
        selectedIds.forEach(id => {
          const obj = objects.find(o => o.id === id);
          const shouldLock = !anyLocked;

          if ((obj?.locked ?? false) !== shouldLock) {
            toggleLock(id);
          }
        });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, objects, toggleLock]);
}
```

### Testing
- [ ] Select object → Shift+Cmd+L → locks
- [ ] Press again → unlocks
- [ ] Select 3 objects → Shift+Cmd+L → all lock
- [ ] Select 2 locked, 1 unlocked → Shift+Cmd+L → all unlock
- [ ] Works from layers panel selection
- [ ] Works from canvas selection (if not locked already)

---

## 2. Parent-Child Lock Behavior ⭐ HIGH PRIORITY

### Current State
- ❌ Each object locks independently
- ❌ Parent and child lock states are separate

### Required Implementation (Matching Figma)
- ✅ Locking parent automatically locks all descendants
- ✅ Unlocking parent automatically unlocks all descendants
- ✅ Cannot individually unlock child while parent is locked
- ✅ Visual indication in layers panel for inherited lock

### Files to Modify
1. `src/stores/canvasStore.ts` - Update `toggleLock` logic
2. `src/features/layers-panel/components/LayerItem.tsx` - Show inherited lock state
3. Lock icon behavior needs to reflect inherited vs direct lock

### Implementation Plan

```typescript
// In canvasStore.ts - Update toggleLock
toggleLock: (id) => {
  const state = useCanvasStore.getState();
  const object = state.objects.find((obj) => obj.id === id);
  if (!object) return;

  const newLocked = !(object.locked ?? false);

  // Helper function (inline to avoid circular import)
  const getAllDescendantIds = (nodeId: string): string[] => {
    const objects = state.objects;
    const descendants: string[] = [];
    const children = objects.filter((obj) => obj.parentId === nodeId);
    children.forEach((child) => {
      descendants.push(child.id);
      descendants.push(...getAllDescendantIds(child.id));
    });
    return descendants;
  };

  // Update this object
  state.updateObject(id, { locked: newLocked });

  // Update all descendants to match parent's lock state
  const descendants = getAllDescendantIds(id);
  descendants.forEach(descendantId => {
    state.updateObject(descendantId, { locked: newLocked });
  });
},

// New helper function: Check if object has locked parent
export function hasLockedParent(objectId: string, objects: CanvasObject[]): boolean {
  const object = objects.find(obj => obj.id === objectId);
  if (!object || !object.parentId) return false;

  const parent = objects.find(obj => obj.id === object.parentId);
  if (!parent) return false;

  if (parent.locked) return true;

  // Recursively check ancestors
  return hasLockedParent(parent.id, objects);
}
```

```typescript
// In LayerItem.tsx - Show inherited lock
import { hasLockedParent } from '../utils/hierarchy';

export const LayerItem = memo(function LayerItem({ object, ... }) {
  const objects = useCanvasStore((state) => state.objects);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  const isDirectlyLocked = object.locked === true;
  const hasInheritedLock = !isDirectlyLocked && hasLockedParent(object.id, objects);
  const isEffectivelyLocked = isDirectlyLocked || hasInheritedLock;

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent unlocking child if parent is locked
    if (hasInheritedLock) {
      console.warn('Cannot unlock: parent is locked');
      return;
    }

    toggleLock(object.id);
  };

  return (
    <div className={`
      ${isEffectivelyLocked ? 'opacity-60' : ''}
    `}>
      {/* ... other elements ... */}

      <button
        onClick={handleLockClick}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={hasInheritedLock} // Disable if parent locked
        className={`
          ${hasInheritedLock ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        {isEffectivelyLocked ? (
          <Lock className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <Unlock className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100" />
        )}
      </button>
    </div>
  );
});
```

### Testing
- [ ] Lock parent → all children auto-lock
- [ ] Unlock parent → all children auto-unlock
- [ ] Try to unlock child with locked parent → prevented (shows warning)
- [ ] Lock icon shows for inherited lock (but disabled)
- [ ] Deep hierarchy (3+ levels) works correctly
- [ ] RTDB syncs parent-child lock correctly

---

## 3. Selection Outline Style 🔸 MEDIUM PRIORITY

### Current State
- ❌ Using dashed gray outline for locked objects
- Figma uses normal blue outline (just no handles)

### Required Implementation
- ✅ Normal blue selection outline for locked objects
- ✅ No transform handles (resize/rotate)
- ✅ Visual distinction: Outline only, no interaction

### Files to Modify
1. All shape components (Rectangle, Circle, Text, Line)
2. Selection visualization logic

### Implementation Plan

```typescript
// In Rectangle.tsx (apply to all shapes)
export function Rectangle({ rectangle, isSelected, ... }) {
  const isLocked = rectangle.locked === true;

  return (
    <>
      <Rect
        {...props}
        draggable={!isLocked}
        listening={!isLocked}
      />

      {isSelected && (
        <>
          {/* Selection outline - same color for locked and unlocked */}
          <Rect
            x={rectangle.x}
            y={rectangle.y}
            width={rectangle.width}
            height={rectangle.height}
            stroke="#0ea5e9" // Same blue for both
            strokeWidth={1.5}
            fill="transparent"
            listening={false}
          />

          {/* Transform handles - only if NOT locked */}
          {!isLocked && (
            <>
              {/* Resize handles */}
              {/* Rotation handle */}
            </>
          )}
        </>
      )}
    </>
  );
}
```

### Testing
- [ ] Select locked object from panel → see normal blue outline
- [ ] No resize handles visible
- [ ] No rotation handle visible
- [ ] Cannot drag
- [ ] Visual consistency with unlocked selection (just missing handles)

---

## 4. Multi-Select Lock Toggle 🔸 MEDIUM PRIORITY

### Current State
- ⚠️ Needs testing: Does toggleLock work with multiple selected?

### Required Implementation
- ✅ Select multiple objects
- ✅ Shift+Cmd+L locks/unlocks all
- ✅ Toggle logic: If any locked, unlock all; if all unlocked, lock all

### Implementation
Already covered in #1 (keyboard shortcut), just needs testing.

### Testing
- [ ] Select 3 unlocked → Shift+Cmd+L → all lock
- [ ] Select 3 locked → Shift+Cmd+L → all unlock
- [ ] Select 2 locked, 1 unlocked → Shift+Cmd+L → all unlock
- [ ] Works with parent-child hierarchies

---

## 5. Context Menu "Select Layer" 🔹 LOW PRIORITY

### Current State
- ✅ Can select locked objects from layers panel (already works)
- ❌ No "Select layer" option in canvas context menu for locked objects

### Required Implementation
- When right-clicking on canvas, add "Select layer" option
- This is low priority since layers panel selection already works

### Skip for Now
This is a nice-to-have but not critical for MVP. Our implementation already allows selection from layers panel, which is the primary method.

---

## 6. Properties Panel Behavior 🔹 DEFERRED

### Current State
- ⚠️ Unknown: Do locked objects allow property edits in properties panel?

### Figma Behavior (Unclear)
- Some sources say properties can be adjusted
- Contradicts "prevents editing" description
- Needs manual testing in Figma to confirm

### Recommendation
- **Defer to user testing**: After implementing above features, test actual behavior
- **Current approach**: Keep properties panel read-only for locked objects (safer)
- **Alternative**: Allow property edits but prevent drag/resize/delete

---

## Implementation Order (Phase 4.4.2)

### Task 1: Keyboard Shortcut (30 min)
1. Add Shift+Cmd+L shortcut
2. Connect to toggleLock
3. Test with single and multiple selections

### Task 2: Parent-Child Lock (45 min)
1. Update toggleLock to cascade to descendants
2. Add hasLockedParent utility
3. Update LayerItem to show inherited lock
4. Prevent unlocking child with locked parent
5. Test with deep hierarchies

### Task 3: Selection Outline (15 min)
1. Remove dashed gray outline for locked
2. Use normal blue outline
3. Ensure handles are hidden
4. Test visual consistency

### Task 4: Testing (30 min)
1. Comprehensive testing of all lock behaviors
2. Multi-user sync testing
3. Edge case testing (deep hierarchies, mixed selections)

**Total Estimated Time:** 2 hours

---

## Summary of Changes

### Files to Create
- [ ] `src/features/layers-panel/hooks/useLayerShortcuts.ts` (or update existing)
- [ ] `src/features/layers-panel/utils/lockHelpers.ts` (for hasLockedParent)

### Files to Modify
- [ ] `src/constants/keyboardShortcuts.ts` - Add Shift+Cmd+L
- [ ] `src/stores/canvasStore.ts` - Update toggleLock to cascade
- [ ] `src/features/layers-panel/components/LayerItem.tsx` - Show inherited lock
- [ ] `src/features/canvas-core/shapes/Rectangle.tsx` - Normal blue outline
- [ ] `src/features/canvas-core/shapes/Circle.tsx` - Normal blue outline
- [ ] `src/features/canvas-core/shapes/TextShape.tsx` - Normal blue outline
- [ ] `src/features/canvas-core/shapes/Line.tsx` - Normal blue outline

### Barrel Exports to Update
- [ ] `src/features/layers-panel/utils/index.ts` - Export hasLockedParent

---

## After Implementation

Update plan document:
- [ ] Mark Phase 4.4.1 complete
- [ ] Mark Phase 4.4.2 complete
- [ ] Continue to Phase 5: Collapsible Sections
