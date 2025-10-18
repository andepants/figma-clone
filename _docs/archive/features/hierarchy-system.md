# Hierarchy System

## Overview

The Hierarchy System enables parent-child relationships between canvas objects, allowing objects to be grouped and organized hierarchically (like Figma's frame/group system). This system supports:

- Nested parent-child relationships (unlimited depth)
- Drag-and-drop to create hierarchy
- Group selection (select parent + all descendants)
- Collapsible hierarchy in layers panel
- Circular reference prevention

## Data Model

### Core Properties

Each `CanvasObject` has three hierarchy-related properties:

```typescript
interface CanvasObject {
  // ... other properties

  /** ID of parent object for hierarchy (null or undefined = root level) */
  parentId?: string | null;

  /** Collapse state for hierarchy (default: false) */
  isCollapsed?: boolean;

  /** Lock state (default: false) - Locked objects cannot be selected/edited */
  locked?: boolean;
}
```

### Extended Type for Display

When building the hierarchy tree for display, objects are extended with `children` and `depth`:

```typescript
interface CanvasObjectWithChildren extends CanvasObject {
  /** Child objects in hierarchy */
  children: CanvasObjectWithChildren[];

  /** Depth in hierarchy tree (0 = root level) */
  depth: number;
}
```

## Utility Functions

All hierarchy utilities are in `/src/features/layers-panel/utils/hierarchy.ts`.

### buildHierarchyTree

Converts a flat array of objects into a nested tree structure.

**Usage:**
```typescript
import { buildHierarchyTree } from '@/features/layers-panel/utils/hierarchy';

const tree = buildHierarchyTree(objects);
// Returns: CanvasObjectWithChildren[] with nested children arrays
```

**Behavior:**
- Maintains insertion order within each hierarchy level
- Orphaned objects (parentId points to non-existent object) are treated as root-level
- Calculates depth for each node (0 = root, 1 = first level child, etc.)

**Example:**
```typescript
// Input: [frameA, rectB, circleC] where rectB.parentId = frameA.id
const tree = buildHierarchyTree([frameA, rectB, circleC]);

// Output:
// [
//   { ...frameA, children: [{ ...rectB, children: [], depth: 1 }], depth: 0 },
//   { ...circleC, children: [], depth: 0 }
// ]
```

### flattenHierarchyTree

Converts a tree structure back into a flat array for display.

**Usage:**
```typescript
import { flattenHierarchyTree } from '@/features/layers-panel/utils/hierarchy';

const tree = buildHierarchyTree(objects);
const flat = flattenHierarchyTree(tree, false); // Hide collapsed children
```

**Parameters:**
- `tree` - Hierarchical tree structure
- `includeCollapsed` - If false, skip children of collapsed nodes (default: true)

**Behavior:**
- Depth-first traversal (parent, then children)
- Respects collapse state when `includeCollapsed = false`
- Preserves depth information

### getAllDescendantIds

Gets all descendant IDs of a node (children, grandchildren, etc.).

**Usage:**
```typescript
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';

// frame1 contains rect2, rect2 contains circle3
const descendants = getAllDescendantIds('frame1', objects);
// Returns: ['rect2', 'circle3']
```

**Use Cases:**
- Selecting entire groups
- Preventing circular references
- Cascading lock/unlock operations

### hasChildren

Checks if an object has any children.

**Usage:**
```typescript
import { hasChildren } from '@/features/layers-panel/utils/hierarchy';

if (hasChildren('frame-1', objects)) {
  // Show dropdown arrow in layers panel
}
```

### hasLockedParent

Checks if an object has a locked ancestor.

**Usage:**
```typescript
import { hasLockedParent } from '@/features/layers-panel/utils/hierarchy';

if (hasLockedParent('rect-1', objects)) {
  // Show inherited lock indicator
}
```

**Behavior:**
- Traverses up the hierarchy recursively
- Returns true if any ancestor is locked
- Returns false if at root level or no locked ancestors

### moveToParent

Moves an object to a new parent with circular reference validation.

**Usage:**
```typescript
import { moveToParent } from '@/features/layers-panel/utils/hierarchy';

const updated = moveToParent('rect-1', 'frame-1', objects);
if (updated) {
  setObjects(updated);
} else {
  console.error('Circular reference prevented');
}
```

**Validation:**
- Prevents circular references (cannot move object to its own descendant)
- Returns `null` if validation fails
- Returns updated objects array on success

## Creating Hierarchy

### Method 1: Drag and Drop (Layers Panel)

Users can drag objects onto other objects in the layers panel to create parent-child relationships.

**Implementation:**
```typescript
// In LayerItem.tsx
const handleDrop = (e: React.DragEvent) => {
  const draggedId = e.dataTransfer.getData('application/canvas-object-id');
  if (draggedId && draggedId !== object.id) {
    setParent(draggedId, object.id);
  }
};
```

### Method 2: Programmatic (setParent)

Use the canvas store's `setParent` action:

```typescript
import { useCanvasStore } from '@/stores/canvasStore';

const setParent = useCanvasStore((state) => state.setParent);

// Move rect-1 to be a child of frame-1
setParent('rect-1', 'frame-1');

// Move rect-1 to root level
setParent('rect-1', null);
```

**Validation:**
- Automatically prevents circular references
- Logs error to console if validation fails
- No-op if circular reference detected

## Selecting Groups

### Select Entire Group

Use `selectWithDescendants` to select a parent and all its descendants:

```typescript
import { useCanvasStore } from '@/stores/canvasStore';

const selectWithDescendants = useCanvasStore((state) => state.selectWithDescendants);

// Select frame and all its children/grandchildren
selectWithDescendants('frame-1');
```

**Behavior:**
- Selects the specified object
- Recursively selects all descendants
- Used when clicking collapsed parent in layers panel

### Collapsed Objects

When an object is collapsed (`isCollapsed: true`), clicking it in the layers panel selects the entire group:

```typescript
// In LayerItem.tsx
const handleClick = () => {
  if (object.isCollapsed) {
    selectWithDescendants(object.id);
  } else {
    selectObjects([object.id]);
  }
};
```

## Preventing Circular References

Circular references occur when an object becomes its own ancestor (e.g., A → B → C → A).

### Validation in setParent

The `setParent` action automatically validates:

```typescript
// In canvasStore.ts
setParent: (objectId, newParentId) => {
  if (newParentId) {
    const descendants = getAllDescendantIds(objectId, objects);
    if (descendants.includes(newParentId)) {
      console.error('Cannot set parent: circular reference detected');
      return; // Early return - no update
    }
  }

  // Safe to update
  state.updateObject(objectId, { parentId: newParentId });
}
```

### Validation in moveToParent

The `moveToParent` utility function also validates:

```typescript
if (newParentId) {
  const descendants = getAllDescendantIds(objectId, objects);
  if (descendants.includes(newParentId)) {
    console.warn('Cannot move object to its own descendant');
    return null; // Validation failed
  }
}
```

## Performance Considerations

### Recursive Operations

Functions like `getAllDescendantIds` and `buildHierarchyTree` use recursion. For deeply nested hierarchies (10+ levels), consider:

- Limiting maximum depth
- Adding depth checks to prevent stack overflow
- Caching hierarchy calculations

### Current Performance

For typical use cases (2-5 levels deep, 100-500 objects):
- `buildHierarchyTree`: O(n) where n = number of objects
- `flattenHierarchyTree`: O(n) where n = number of nodes in tree
- `getAllDescendantIds`: O(n * d) where n = objects, d = depth
- `hasChildren`: O(n) linear search
- `hasLockedParent`: O(d) where d = depth

### Optimization Opportunities

For large canvases (1000+ objects):
1. **Cache hierarchy tree** - Rebuild only when parentId changes
2. **Index by parentId** - Use Map<parentId, childIds[]> for O(1) lookups
3. **Memoize descendants** - Cache `getAllDescendantIds` results
4. **Virtual scrolling** - Render only visible layers in panel

## Usage Patterns

### Pattern 1: Display Hierarchy in Layers Panel

```typescript
import { buildHierarchyTree, flattenHierarchyTree } from '@/features/layers-panel/utils/hierarchy';

function LayersPanel() {
  const objects = useCanvasStore((state) => state.objects);

  // Build tree and flatten for display
  const tree = buildHierarchyTree(objects);
  const displayList = flattenHierarchyTree(tree, false); // Hide collapsed

  return (
    <div>
      {displayList.map((obj) => (
        <LayerItem
          key={obj.id}
          object={obj}
          depth={obj.depth}
        />
      ))}
    </div>
  );
}
```

### Pattern 2: Check Parent-Child Relationship

```typescript
import { hasChildren } from '@/features/layers-panel/utils/hierarchy';

function LayerItem({ object }: { object: CanvasObjectWithChildren }) {
  const objects = useCanvasStore((state) => state.objects);
  const isParent = hasChildren(object.id, objects);

  return (
    <div>
      {isParent && <ChevronIcon />}
      {object.name}
    </div>
  );
}
```

### Pattern 3: Select Entire Group

```typescript
function selectGroup(parentId: string) {
  const { selectWithDescendants } = useCanvasStore.getState();
  selectWithDescendants(parentId);
}
```

### Pattern 4: Move Object in Hierarchy

```typescript
function moveObjectToParent(objectId: string, newParentId: string | null) {
  const { setParent } = useCanvasStore.getState();
  setParent(objectId, newParentId);
}
```

## Edge Cases and Gotchas

### 1. Orphaned Objects

If `parentId` points to a non-existent object, the object is treated as root-level:

```typescript
// If 'parent-id' doesn't exist in objects array:
{ id: 'child-1', parentId: 'parent-id' } // Treated as root level
```

### 2. Circular References

Always validate before setting parentId:

```typescript
// BAD - Can create circular reference
object1.parentId = object2.id;
object2.parentId = object1.id; // Circular!

// GOOD - Use setParent which validates
setParent(object1.id, object2.id); // Safe
```

### 3. Deleting Parents

When a parent is deleted, children become orphans (root-level). Consider:

```typescript
// Option 1: Delete parent and all children
const descendants = getAllDescendantIds(parentId, objects);
[parentId, ...descendants].forEach(id => removeObject(id));

// Option 2: Move children to root before deleting parent
objects.filter(obj => obj.parentId === parentId)
  .forEach(child => setParent(child.id, null));
removeObject(parentId);
```

### 4. Collapsed State Persistence

Collapsed state is stored in the object itself, so it persists across sessions:

```typescript
// Collapse state syncs via Firebase
toggleCollapse('frame-1'); // isCollapsed: true
// Other users see collapsed state
```

## Related Files

- `/src/features/layers-panel/utils/hierarchy.ts` - All hierarchy utilities
- `/src/stores/canvasStore.ts` - Store actions (setParent, selectWithDescendants, toggleCollapse)
- `/src/features/layers-panel/components/LayerItem.tsx` - Hierarchy UI (drag-drop, collapse)
- `/src/types/canvas.types.ts` - Type definitions (parentId, isCollapsed, CanvasObjectWithChildren)

## See Also

- [Lock System](./lock-system.md) - How lock interacts with hierarchy
- [Layers Panel](../examples/hierarchy-examples.ts) - Usage examples
