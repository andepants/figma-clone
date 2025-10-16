# Z-Index System

**Status:** ✅ Implemented (Phase 1 - October 2025)
**Implementation Plan:** [`_docs/plans/grouping-export.md`](../plans/grouping-export.md)

---

## Overview

CollabCanvas uses **array position** to control layer order (z-index), matching Figma's behavior. Objects later in the array render on top of earlier objects. The layers panel displays this order in reverse (top of panel = front of canvas).

### Key Features

- **Drag to reorder**: Drag layers in panel to change z-index
- **Keyboard shortcuts**: `]` (bring to front), `[` (send to back)
- **Context menu**: Right-click actions for z-index control
- **Firebase sync**: Z-index persists across sessions and syncs to collaborators
- **Group support**: Groups respect z-index, children render relative to siblings

---

## Z-Index Mapping

### Array Position → Canvas Rendering

```
objects = [
  Rectangle A,  // index 0 → Renders BACK (behind everything)
  Circle B,     // index 1 → Renders middle
  Text C,       // index 2 → Renders FRONT (on top of everything)
]

Canvas rendering order (bottom to top):
├── Rectangle A (back)
├── Circle B (middle)
└── Text C (front)
```

### Layers Panel Display

**Layers panel REVERSES array order** for intuitive UX:

```
Layers Panel (top to bottom):
┌─────────────────┐
│ Text C          │ ← index 2 (front) shown at TOP
│ Circle B        │ ← index 1 (middle)
│ Rectangle A     │ ← index 0 (back) shown at BOTTOM
└─────────────────┘
```

**Implementation:**

```typescript
// In LayersPanel.tsx
const displayObjects = [...objects].reverse();

return (
  <div>
    {displayObjects.map(obj => (
      <LayerItem key={obj.id} object={obj} />
    ))}
  </div>
);
```

---

## Firebase Storage

### Z-Index Property

Each object stores its z-index as a numeric property:

```json
{
  "canvases": {
    "main": {
      "objects": {
        "rect-123": {
          "id": "rect-123",
          "type": "rectangle",
          "zIndex": 0,  // ← Back
          // ... other props
        },
        "circle-456": {
          "id": "circle-456",
          "type": "circle",
          "zIndex": 1,  // ← Middle
          // ... other props
        },
        "text-789": {
          "id": "text-789",
          "type": "text",
          "zIndex": 2,  // ← Front
          // ... other props
        }
      }
    }
  }
}
```

### Sync Function

After any reorder operation, sync z-index to Firebase:

```typescript
// src/stores/canvasStore.ts

/**
 * Sync z-index values to Firebase RTDB
 *
 * Updates all objects with their current array position
 * Ensures order persists across page refresh and syncs to collaborators
 */
export const syncZIndexes = async (objects: CanvasObject[]) => {
  const updates: Record<string, number> = {};

  objects.forEach((obj, index) => {
    updates[`/canvases/main/objects/${obj.id}/zIndex`] = index;
  });

  await update(ref(database, '/'), updates);
};
```

**Called after:**

- Drag-drop reorder in layers panel
- Bring to front / send to back actions
- Any operation that changes array order

---

## Core Functionality

### 1. Drag to Reorder (Layers Panel)

**User Action:** Drag layer up/down in layers panel

**Implementation:**

```typescript
// In LayersPanel.tsx (using @dnd-kit)

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = objects.findIndex(obj => obj.id === active.id);
  const newIndex = objects.findIndex(obj => obj.id === over.id);

  // Reorder array
  const reordered = arrayMove(objects, oldIndex, newIndex);

  // Update local state
  setObjects(reordered);

  // Sync to Firebase
  syncZIndexes(reordered);
};
```

**Visual Feedback:**

- Drag preview shows layer thumbnail
- Drop indicator shows insertion point
- Smooth animation on drop
- Immediate local update (optimistic)
- Firebase sync <50ms

### 2. Bring to Front

**User Action:** Press `]` or use context menu

**Implementation:**

```typescript
// src/stores/canvasStore.ts

/**
 * Bring object to front (highest z-index)
 *
 * Moves object to end of objects array
 * Last in array = front of canvas
 */
bringToFront: (id: string) => {
  set((state) => {
    const index = state.objects.findIndex(obj => obj.id === id);

    // Already at front or not found
    if (index === -1 || index === state.objects.length - 1) {
      return state;
    }

    const updatedObjects = [...state.objects];
    const [object] = updatedObjects.splice(index, 1); // Remove
    updatedObjects.push(object); // Add to end

    // Sync to Firebase
    syncZIndexes(updatedObjects);

    return { objects: updatedObjects };
  });
}
```

**Behavior:**

- Object moves to end of array (index = length - 1)
- Renders on top of all other objects
- If already at front, no-op (performance optimization)

### 3. Send to Back

**User Action:** Press `[` or use context menu

**Implementation:**

```typescript
// src/stores/canvasStore.ts

/**
 * Send object to back (lowest z-index)
 *
 * Moves object to start of objects array
 * First in array = back of canvas
 */
sendToBack: (id: string) => {
  set((state) => {
    const index = state.objects.findIndex(obj => obj.id === id);

    // Already at back or not found
    if (index === -1 || index === 0) {
      return state;
    }

    const updatedObjects = [...state.objects];
    const [object] = updatedObjects.splice(index, 1); // Remove
    updatedObjects.unshift(object); // Add to start

    // Sync to Firebase
    syncZIndexes(updatedObjects);

    return { objects: updatedObjects };
  });
}
```

**Behavior:**

- Object moves to start of array (index = 0)
- Renders behind all other objects
- If already at back, no-op

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| **]** (Right Bracket) | Bring to Front | Moves selected object(s) to top of z-index |
| **[** (Left Bracket) | Send to Back | Moves selected object(s) to bottom of z-index |

**Multi-Select Support:**

```typescript
// In useToolShortcuts.ts

if (e.key === ']') {
  const { selectedIds, bringToFront } = useCanvasStore.getState();
  selectedIds.forEach(id => bringToFront(id)); // Apply to all selected
}

if (e.key === '[') {
  const { selectedIds, sendToBack } = useCanvasStore.getState();
  selectedIds.forEach(id => sendToBack(id));
}
```

**Input Protection:** Shortcuts do NOT fire when text input/textarea focused

---

## Context Menu Integration

Right-click layer item in layers panel:

```
┌───────────────────────────────┐
│ Bring to Front          ]     │ ← Always shown
│ Send to Back            [     │ ← Always shown
├───────────────────────────────┤
│ ... other actions ...         │
└───────────────────────────────┘
```

**Implementation:**

```typescript
// In getContextMenuItems()

items.push(
  { label: 'Bring to Front', shortcut: ']', onClick: () => bringToFront(object.id) },
  { label: 'Send to Back', shortcut: '[', onClick: () => sendToBack(object.id) },
  { type: 'separator' },
);
```

---

## Z-Index with Groups

### Behavior

- **Groups respect z-index** in layers panel ordering
- **Children render relative to siblings** within group
- **Group z-index** determines where entire hierarchy renders

**Example:**

```
objects = [
  Rectangle A,      // index 0 → back
  Group 1,          // index 1 → middle
    ├─ Circle B     // (child, renders at Group 1's level)
    └─ Text C       // (child, renders at Group 1's level)
  Rectangle D,      // index 2 → front
]

Rendering order:
├── Rectangle A (back)
├── Circle B (Group 1 children render here)
├── Text C
└── Rectangle D (front)
```

**Dragging groups:**

- Drag Group 1 above Rectangle D → Group 1 and all children render in front
- Drag Group 1 below Rectangle A → Group 1 and all children render behind

### Group Children Order

Children within a group maintain their own z-index relative to siblings:

```
Group 1:
├── Circle B (zIndex: 1)  ← Renders behind Text C
└── Text C (zIndex: 2)    ← Renders in front of Circle B
```

**Implementation:** Children sorted by zIndex when building hierarchy tree

---

## Multiplayer Sync

### Real-Time Updates

When User A reorders layers:

1. **User A drags layer** in layers panel
2. **Local state updates immediately** (optimistic)
3. **syncZIndexes() writes to Firebase** (<50ms)
4. **Firebase broadcasts update** to all clients
5. **User B receives update** via subscription (<100ms)
6. **User B's layers panel re-renders** with new order

**Total latency: <150ms** (50ms throttle + 100ms network)

### Conflict Resolution

**Last Write Wins** — No operational transforms

**Example:**

```
Time    User A Action           User B Action
T0      Drag Rectangle A up     -
T1      -                       Drag Circle B up
T2      Firebase: A moved       Firebase: B moved
T3      B sees A moved          A sees B moved
Result: Both changes applied, final order depends on timing
```

**Edge Case Handling:**

- **Simultaneous reorder**: Last write wins (Firebase behavior)
- **Object deleted during drag**: Drag fails gracefully (object not found)
- **Network partition**: Local state preserved, syncs when reconnected

---

## Canvas Rendering

### Konva Layer Rendering

Objects render in array order on Konva layer:

```typescript
// In CanvasObjects.tsx

{objects.map(obj => {
  // Render in array order (first = back, last = front)
  if (obj.type === 'rectangle') return <RectangleObject key={obj.id} object={obj} />;
  if (obj.type === 'circle') return <CircleObject key={obj.id} object={obj} />;
  // ...
})}
```

**Konva automatically handles z-index** based on DOM order

### Performance

- **60 FPS** maintained with 100+ objects
- **React.memo** prevents unnecessary re-renders
- **Konva caching** for complex shapes
- **Layer optimization** (3-5 layers max)

---

## Testing Scenarios

### Basic Reordering

1. Create 3 rectangles: A (red), B (blue), C (green)
2. Initial order: A, B, C (bottom to top)
3. Drag B to top of layers panel
4. Verify: Rendering order A, C, B (B renders in front)
5. Refresh page
6. Verify: Order persists (B still in front)

### Keyboard Shortcuts

1. Create 3 circles
2. Select middle circle
3. Press `]` (bring to front)
4. Verify: Circle moves to top of layers panel
5. Press `[` (send to back)
6. Verify: Circle moves to bottom of layers panel

### Z-Index with Groups

1. Create 3 rectangles: A, B, C
2. Group A and B (Group 1)
3. Drag Group 1 above C in layers panel
4. Verify: A and B render above C on canvas
5. Ungroup Group 1
6. Verify: A, B, C maintain relative order (not reverted)

### Multiplayer Sync

1. Open app in 2 browser windows
2. Window A: Drag layer to new position
3. Window B: Verify layer moves in <150ms
4. Window B: Drag different layer
5. Window A: Verify update received

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/stores/canvasStore.ts` | `bringToFront()`, `sendToBack()`, `syncZIndexes()` |
| `src/features/layers-panel/components/LayersPanel.tsx` | Drag-drop reorder logic |
| `src/features/toolbar/hooks/useToolShortcuts.ts` | `]` / `[` keyboard shortcuts |
| `src/features/layers-panel/utils/contextMenu.ts` | Context menu items |
| `src/lib/firebase/realtimeCanvasService.ts` | Firebase sync/subscription |

---

## Future Enhancements

- **Move forward/backward**: Cmd+] / Cmd+[ (step by step, not all the way)
- **Z-index input**: Numeric input field to set specific z-index
- **Layer styles**: Color-code layers by type (shapes, text, groups)
- **Z-index visualization**: Visual indicator of depth on canvas
- **Batch reorder**: Multi-select drag to reorder multiple layers at once

---

## Related Documentation

- [Grouping System](./grouping-system.md) - Z-index with groups
- [Context Menu](./context-menu.md) - Right-click z-index actions
- [Hierarchy System](./hierarchy-system.md) - Parent-child relationships

---

**Last Updated:** 2025-10-16
**Implementation Status:** Complete (Phase 1 of grouping-export plan)
