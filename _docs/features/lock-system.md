# Lock System

## Overview

The Lock System prevents accidental modifications to canvas objects by restricting certain interactions. Locked objects:

- **Cannot** be selected or dragged on the canvas
- **Cannot** be edited (position, size, rotation, style, etc.)
- **Cannot** be deleted via keyboard shortcuts
- **Can** still be selected from the layers panel
- **Can** still have visibility toggled
- **Can** still be locked/unlocked

This matches Figma's lock behavior and is useful for protecting finalized designs, background elements, or reference objects.

## Data Model

### Core Property

```typescript
interface CanvasObject {
  // ... other properties

  /** Lock state (default: false) - Locked objects cannot be selected/edited on canvas */
  locked?: boolean;
}
```

### Default Value

Objects are unlocked by default:
```typescript
// These are equivalent:
{ id: '1', locked: false }
{ id: '1', locked: undefined }
{ id: '1' } // No locked property
```

## How Lock Works

### On Canvas (Konva Layer)

Locked objects:
- **Are not listening for events** - `listening: false` on Konva shape
- **Cannot be selected** - Click-through to canvas below
- **Cannot be dragged** - `draggable: false`
- **Cannot be transformed** - Transformer ignores them

**Implementation:**
```typescript
// In Rectangle.tsx, Circle.tsx, TextShape.tsx, Line.tsx
<Shape
  listening={!object.locked && object.visible !== false}
  draggable={!object.locked}
  // ... other props
/>
```

### In Layers Panel

Locked objects:
- **Show lock icon** - Visual indicator
- **Can be selected** - Clicking row selects object
- **Can be locked/unlocked** - Click lock icon to toggle
- **Show inherited lock** - If parent is locked, children show inherited state

**Implementation:**
```typescript
// In LayerItem.tsx
<button onClick={() => toggleLock(object.id)}>
  {object.locked ? <LockClosedIcon /> : <LockOpenIcon />}
</button>
```

## Locking and Unlocking

### Method 1: Lock Icon (Layers Panel)

Click the lock icon in the layers panel:

```typescript
// In LayerItem.tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    toggleLock(object.id);
  }}
>
  {object.locked ? <LockClosedIcon /> : <LockOpenIcon />}
</button>
```

### Method 2: Context Menu (Layers Panel)

Right-click object in layers panel:

```typescript
// In LayerItem.tsx
<ContextMenu>
  <ContextMenuItem onClick={() => toggleLock(object.id)}>
    {object.locked ? 'Unlock' : 'Lock'}
  </ContextMenuItem>
</ContextMenu>
```

### Method 3: Keyboard Shortcut

- **Mac:** `Shift + Cmd + L`
- **Windows/Linux:** `Shift + Ctrl + L`

```typescript
// In useToolShortcuts.ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') {
      e.preventDefault();
      selectedIds.forEach(id => toggleLock(id));
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedIds]);
```

### Method 4: Programmatic

Use the canvas store's `toggleLock` action:

```typescript
import { useCanvasStore } from '@/stores/canvasStore';

const toggleLock = useCanvasStore((state) => state.toggleLock);

// Lock object
toggleLock('rect-1');

// Lock multiple objects
selectedIds.forEach(id => toggleLock(id));
```

## What's Allowed When Locked

### Allowed Actions

✅ **Select from layers panel** - Click row to select
✅ **Toggle visibility** - Hide/show via eye icon
✅ **Toggle lock** - Unlock via lock icon
✅ **Rename** - Change object name (if feature exists)
✅ **View properties** - See properties in panel
✅ **Reorder in layers** - Drag to change Z-index (if unlocked)

### Disallowed Actions

❌ **Select on canvas** - Click-through (listening: false)
❌ **Drag on canvas** - Cannot move
❌ **Resize on canvas** - Cannot scale
❌ **Rotate on canvas** - Cannot rotate
❌ **Edit properties** - Cannot change x, y, width, etc.
❌ **Delete via keyboard** - Delete key ignored
❌ **Text editing** - Cannot enter edit mode (for text shapes)

## Parent-Child Lock Cascading

### Behavior

When a parent is locked, **all descendants are also locked** (inherited lock).

**Example:**
```typescript
// frame-1 contains rect-2, rect-2 contains circle-3
toggleLock('frame-1'); // Lock frame

// Result:
// frame-1: locked = true
// rect-2: locked = true (inherited)
// circle-3: locked = true (inherited)
```

### Implementation

Lock cascades to all descendants:

```typescript
// In canvasStore.ts - toggleLock
toggleLock: (id) => {
  const objects = state.objects;
  const object = objects.find((obj) => obj.id === id);
  if (!object) return;

  const newLocked = !(object.locked ?? false);

  // Get all descendants
  const descendants = getAllDescendantIds(id, objects);

  // Update object and all descendants
  const updatedObjects = objects.map((obj) => {
    if (obj.id === id || descendants.includes(obj.id)) {
      return { ...obj, locked: newLocked, updatedAt: Date.now() };
    }
    return obj;
  });

  set({ objects: updatedObjects });
}
```

### Visual Indicator

Layers panel shows inherited lock state:

```typescript
// In LayerItem.tsx
const isInheritedLock = !object.locked && hasLockedParent(object.id, objects);

<LockClosedIcon
  className={isInheritedLock ? 'opacity-50' : 'opacity-100'}
/>
```

- **Full opacity** - Directly locked
- **50% opacity** - Inherited lock from parent

### Unlocking Descendants

When unlocking a parent, all descendants are also unlocked:

```typescript
// frame-1 contains rect-2 (both locked)
toggleLock('frame-1'); // Unlock frame

// Result:
// frame-1: locked = false
// rect-2: locked = false (inherited unlock)
```

## Multi-User Behavior

### Lock State Syncs

Lock state syncs via Firebase Realtime DB:

```typescript
// User A locks object
toggleLock('rect-1');
// → Firebase: { id: 'rect-1', locked: true }

// User B sees lock immediately
// → Object becomes non-interactive on User B's canvas
```

### Optimistic Updates

Lock updates are optimistic (instant local feedback):

```typescript
// 1. Update local state immediately
toggleLock('rect-1'); // Instant UI update

// 2. Sync to Firebase (async)
// → updateObjectInFirebase('rect-1', { locked: true })

// 3. Firebase broadcasts to all users
// → User B receives update
```

### Conflict Resolution

Lock conflicts are resolved by "last write wins":

```typescript
// User A locks at 10:00:00.000
// User B unlocks at 10:00:00.001

// Result: Unlocked (User B's write is newer)
```

## Checking Lock State

### Check Single Object

```typescript
const object = objects.find(obj => obj.id === 'rect-1');
const isLocked = object?.locked ?? false;

if (isLocked) {
  // Show lock indicator
}
```

### Check Inherited Lock

```typescript
import { hasLockedParent } from '@/features/layers-panel/utils/hierarchy';

const hasInheritedLock = hasLockedParent('rect-1', objects);

if (hasInheritedLock) {
  // Show inherited lock indicator
}
```

### Check Effective Lock (Direct or Inherited)

```typescript
const isEffectivelyLocked = object.locked || hasLockedParent(object.id, objects);

if (isEffectivelyLocked) {
  // Treat as locked (disable interactions)
}
```

## Figma Parity

### Matches Figma Behavior ✅

- ✅ Locked objects cannot be selected on canvas
- ✅ Locked objects can be selected from layers panel
- ✅ Lock cascades to children
- ✅ Visibility can be toggled while locked
- ✅ Lock icon shows in layers panel
- ✅ Keyboard shortcut (Shift + Cmd/Ctrl + L)

### Differences from Figma

- ⚠️ **No partial lock** - Figma supports locking only position or only rotation
- ⚠️ **No lock on paste** - Figma can preserve lock state when copying
- ⚠️ **No lock indicator on canvas** - Figma shows subtle border on hover

### Future Enhancements

Potential features to match Figma more closely:

1. **Lock Position Only** - Lock position but allow resizing/rotation
2. **Lock on Canvas Indicator** - Show subtle border on hover for locked objects
3. **Bulk Lock Operations** - Lock all objects in selection with one click
4. **Lock State in Clipboard** - Preserve lock when copying/pasting

## Usage Patterns

### Pattern 1: Lock Background Layer

```typescript
function lockBackgroundLayer() {
  const objects = useCanvasStore.getState().objects;
  const backgroundLayer = objects.find(obj => obj.name === 'Background');

  if (backgroundLayer) {
    useCanvasStore.getState().toggleLock(backgroundLayer.id);
  }
}
```

### Pattern 2: Lock Selected Objects

```typescript
function lockSelection() {
  const { selectedIds, toggleLock } = useCanvasStore.getState();

  selectedIds.forEach(id => toggleLock(id));
}
```

### Pattern 3: Check Before Edit

```typescript
function updatePosition(objectId: string, x: number, y: number) {
  const objects = useCanvasStore.getState().objects;
  const object = objects.find(obj => obj.id === objectId);

  if (object?.locked || hasLockedParent(objectId, objects)) {
    console.warn('Cannot edit locked object');
    return;
  }

  useCanvasStore.getState().updateObject(objectId, { x, y });
}
```

### Pattern 4: Lock All Children When Creating Group

```typescript
function createLockedFrame(childIds: string[]) {
  const { addObject, setParent, toggleLock } = useCanvasStore.getState();

  // Create frame
  const frameId = `frame-${Date.now()}`;
  addObject({
    id: frameId,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    // ... other properties
  });

  // Move children to frame
  childIds.forEach(id => setParent(id, frameId));

  // Lock frame (cascades to children)
  toggleLock(frameId);
}
```

## Edge Cases and Gotchas

### 1. Selecting Locked Objects from Panel

Locked objects can be selected from the layers panel, but they're not interactive on the canvas:

```typescript
// User selects locked object from layers panel
selectObjects(['locked-rect-1']);

// Selection exists, but object is not draggable on canvas
// Transformer may show handles, but interactions are disabled
```

**Solution:** Hide transformer handles for locked objects:

```typescript
// In CanvasStage.tsx
const selectableObjects = selectedObjects.filter(obj => !obj.locked);

<Transformer
  nodes={selectableObjects.map(obj => shapeRefs.current[obj.id])}
/>
```

### 2. Deleting Locked Objects

Delete key should ignore locked objects:

```typescript
// In useToolShortcuts.ts
const handleDelete = () => {
  const { selectedIds, objects, removeObject } = useCanvasStore.getState();

  const unlockedIds = selectedIds.filter(id => {
    const obj = objects.find(o => o.id === id);
    return !(obj?.locked || hasLockedParent(id, objects));
  });

  unlockedIds.forEach(id => removeObject(id));
};
```

### 3. Inherited Lock Not Updating

If inherited lock state isn't updating, ensure `hasLockedParent` is called with latest objects:

```typescript
// BAD - Stale objects reference
const objects = useCanvasStore(state => state.objects); // Captured once
const isInheritedLock = hasLockedParent(object.id, objects); // May be stale

// GOOD - Always use latest objects
const isInheritedLock = useMemo(() => {
  const objects = useCanvasStore.getState().objects;
  return hasLockedParent(object.id, objects);
}, [object.id, useCanvasStore.getState().objects]);
```

### 4. Lock Icon Not Responding

If lock icon click isn't working, ensure event propagation is stopped:

```typescript
// BAD - Click bubbles to parent (selects object instead)
<button onClick={() => toggleLock(object.id)}>
  <LockIcon />
</button>

// GOOD - Stop propagation
<button onClick={(e) => {
  e.stopPropagation(); // Prevent parent onClick
  toggleLock(object.id);
}}>
  <LockIcon />
</button>
```

### 5. Firebase Sync Issues

Lock state must sync to Firebase to work multi-user:

```typescript
// In Firebase sync (useFirebaseSync.ts)
useEffect(() => {
  // Subscribe to objects changes
  const unsubscribe = subscribeToObjects((objects) => {
    setObjects(objects); // Must include locked property
  });

  return unsubscribe;
}, []);

// When updating lock state
updateObject(id, { locked: true }); // Syncs to Firebase
```

## Performance Considerations

### Cascade Updates

Locking a parent with many descendants triggers multiple updates:

```typescript
// frame-1 has 100 children
toggleLock('frame-1');
// → Updates 101 objects (1 parent + 100 children)
```

**Optimization:** Use `batchUpdateObjects` for large hierarchies:

```typescript
toggleLock: (id) => {
  // ... get descendants

  // Single state update instead of N updates
  const updates = [id, ...descendants].map(objId => ({
    id: objId,
    updates: { locked: newLocked }
  }));

  batchUpdateObjects(updates);
}
```

### hasLockedParent Performance

`hasLockedParent` traverses up the hierarchy (O(depth)):

```typescript
// For deeply nested objects (10+ levels), this could be slow
const isInheritedLock = hasLockedParent(object.id, objects);
```

**Optimization:** Cache results in component state:

```typescript
const [isInheritedLock, setIsInheritedLock] = useState(false);

useEffect(() => {
  setIsInheritedLock(hasLockedParent(object.id, objects));
}, [object.id, object.parentId, objects]);
```

## Related Files

- `/src/stores/canvasStore.ts` - `toggleLock` action
- `/src/features/layers-panel/utils/hierarchy.ts` - `hasLockedParent` utility
- `/src/features/layers-panel/components/LayerItem.tsx` - Lock icon UI
- `/src/features/canvas-core/shapes/` - `listening` property on all shapes
- `/src/types/canvas.types.ts` - `locked` property definition

## See Also

- [Hierarchy System](./hierarchy-system.md) - How lock interacts with parent-child relationships
- [Layers Panel](../examples/lock-examples.ts) - Usage examples
