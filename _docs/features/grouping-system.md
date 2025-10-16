# Grouping System

**Status:** ✅ Implemented (Phase 2 - October 2025)
**Implementation Plan:** [`_docs/plans/grouping-export.md`](../plans/grouping-export.md)

---

## Overview

CollabCanvas supports **Figma-style object grouping** using the existing `parentId` hierarchy. Groups are container objects with no visual representation—they exist purely for organizational purposes in the layers panel and hierarchy.

### Key Features

- **Cmd/Ctrl+G**: Group 2+ selected objects
- **Shift+Cmd/Ctrl+G**: Ungroup selected groups
- **Auto-delete**: Empty groups automatically removed when last child deleted/moved
- **Nested groups**: Full support for group-within-group hierarchies
- **Context menu**: Right-click actions (Group Selection / Ungroup)

---

## Data Model

### Group Object Type

Groups are a special object type defined in `src/types/canvas.types.ts`:

```typescript
export interface Group extends BaseCanvasObject {
  type: 'group';
  x: number;           // Position calculated from children bounding box center
  y: number;
  isCollapsed?: boolean; // Controls visibility in layers panel
  // No width, height, fill, stroke - purely hierarchical
}
```

**Key characteristics:**

- Groups have `type: 'group'` for identification
- Groups have position (x, y) but no dimensions
- Groups do NOT render on canvas (no Konva shape)
- Groups appear in layers panel with Folder icon
- Children reference parent via `parentId` field

### Hierarchy Representation

```
Root Level
├── Rectangle A (parentId: null)
├── Group 1 (parentId: null)
│   ├── Rectangle B (parentId: group1Id)
│   ├── Circle C (parentId: group1Id)
│   └── Group 2 (parentId: group1Id)      ← Nested group
│       └── Text D (parentId: group2Id)
└── Rectangle E (parentId: null)
```

---

## Core Functionality

### 1. Creating Groups

**User Action:** Select 2+ objects, press Cmd/Ctrl+G or use context menu

**Implementation:**

```typescript
// src/stores/canvasStore.ts - groupObjects()

1. Validate: At least 2 objects selected
2. Calculate bounding box of selected objects
3. Create Group object at bounding box center
4. Generate auto-name (Group 1, Group 2, etc.)
5. Set parentId on all selected objects to group ID
6. Add group to objects array
7. Select the new group
8. Sync to Firebase RTDB
```

**Example:**

```typescript
// User selects Rectangle A and Circle B
groupObjects();

// Result:
// - Group 1 created at center of A + B bounding box
// - Rectangle A: { ...props, parentId: 'group1-id' }
// - Circle B: { ...props, parentId: 'group1-id' }
// - Group 1 selected in layers panel
```

### 2. Ungrouping

**User Action:** Select group(s), press Shift+Cmd/Ctrl+G or use context menu

**Implementation:**

```typescript
// src/stores/canvasStore.ts - ungroupObjects()

1. Validate: At least 1 group selected
2. Find all children of selected groups
3. Set parentId to null on all children (unparent)
4. Delete group objects
5. Select the ungrouped children
6. Sync to Firebase RTDB
```

**Edge Cases:**

- **Multiple groups selected**: Ungroups all simultaneously
- **Nested groups**: Only ungroups the selected level (children become orphans)
- **Empty group**: Just deletes the group (no children to select)

### 3. Auto-Delete Empty Groups

Groups automatically delete when their last child is removed or moved out.

**Triggers:**

1. **removeObject()**: When deleting a child
2. **setParent()**: When dragging last child out of group

**Implementation:**

```typescript
// Recursive cleanup in removeObject()
function deleteEmptyAncestors(parentId: string | null | undefined) {
  if (!parentId) return;

  const parent = objects.find(o => o.id === parentId);
  if (parent?.type !== 'group') return;

  const siblings = objects.filter(o => o.parentId === parentId);
  if (siblings.length === 0) {
    removeObject(parentId); // Recursive: checks parent's parent
  }
}
```

**Edge Cases:**

- **Nested empty groups**: Recursively deletes all ancestors if empty
- **Group with 2+ children**: Not deleted (siblings remain)
- **Undo**: Future enhancement (need to restore entire group chain)

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Cmd/Ctrl+G** | Group Selection | Creates group from 2+ selected objects |
| **Shift+Cmd/Ctrl+G** | Ungroup Selection | Ungroups selected group(s) |

**Input Protection:** Shortcuts do NOT fire when text input/textarea focused

---

## Context Menu Integration

Right-click layer item in layers panel:

- **Single object selected**: No group option (need 2+)
- **2+ objects selected**: Shows "Group Selection" action
- **Group selected**: Shows "Ungroup" action

---

## Layers Panel Behavior

### Visual Indicators

- **Icon**: Folder icon (lucide-react `Folder` component)
- **Name**: Auto-generated "Group 1", "Group 2", etc. (user-renameable)
- **Collapse arrow**: Standard hierarchy collapse UI
- **Indentation**: Children indented under group

### Drag & Drop

- **Drag object into group**: Sets parentId to group ID
- **Drag object out of group**: Sets parentId to null (or new parent)
- **Drag group**: Moves entire hierarchy
- **Empty group after drag-out**: Auto-deleted

### Selection

- **Click group**: Selects group only
- **Cmd/Ctrl+click child**: Multi-select (can select group + children)
- **Select group + descendants**: Use `selectWithDescendants(groupId)`

---

## Bounding Box Calculation

Groups don't have width/height, so bounding box calculated from children:

```typescript
// src/lib/utils/geometry.ts

export function calculateBoundingBox(objects: CanvasObject[]): BoundingBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  objects.forEach(obj => {
    if (obj.type === 'rectangle' || obj.type === 'text') {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    } else if (obj.type === 'circle') {
      minX = Math.min(minX, obj.x - obj.radius);
      minY = Math.min(minY, obj.y - obj.radius);
      maxX = Math.max(maxX, obj.x + obj.radius);
      maxY = Math.max(maxY, obj.y + obj.radius);
    } else if (obj.type === 'line') {
      const x1 = obj.x + obj.points[0];
      const y1 = obj.y + obj.points[1];
      const x2 = obj.x + obj.points[2];
      const y2 = obj.y + obj.points[3];
      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);
    }
    // Groups skipped (no dimensions)
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
```

Used for:

- Group creation position
- Export bounding box
- Group selection bounds (future enhancement)

---

## Firebase Sync

### Structure

Groups stored in Firebase RTDB like any other object:

```json
{
  "canvases": {
    "main": {
      "objects": {
        "group-123": {
          "id": "group-123",
          "type": "group",
          "x": 250,
          "y": 150,
          "name": "Group 1",
          "isCollapsed": false,
          "createdBy": "user-456",
          "createdAt": 1729084800000,
          "updatedAt": 1729084800000
        },
        "rect-789": {
          "id": "rect-789",
          "type": "rectangle",
          "x": 200,
          "y": 100,
          "width": 100,
          "height": 100,
          "parentId": "group-123",  // ← Child references parent
          // ... other props
        }
      }
    }
  }
}
```

### Sync Strategy

- **Group creation**: Batched update (group + all children parentId changes)
- **Ungroup**: Batched update (delete group + clear children parentId)
- **Auto-delete**: Individual delete (recursive if nested)
- **Real-time**: All collaborators see group changes in <150ms

---

## Canvas Rendering

**Groups do NOT render shapes on canvas.**

Implementation in `src/features/canvas/components/CanvasObjects.tsx`:

```typescript
{objects.map(obj => {
  if (obj.type === 'group') return null; // ← Skip groups

  if (obj.type === 'rectangle') return <RectangleObject key={obj.id} object={obj} />;
  // ... other types
})}
```

Only the children of groups render. Groups exist purely in the hierarchy.

---

## Export Integration

When exporting a group:

1. Expand group to get all descendant IDs (recursive)
2. Filter descendant objects (exclude nested groups)
3. Calculate bounding box of children
4. Export children only (groups don't render)

See [`_docs/features/export-system.md`](./export-system.md) for details.

---

## Testing Scenarios

### Basic Grouping

1. Create 2 rectangles
2. Select both, press Cmd+G
3. Verify: Group created, rects become children
4. Verify: Group selected in layers panel
5. Verify: Folder icon shown
6. Press Shift+Cmd+G
7. Verify: Group deleted, rects become root-level

### Nested Groups

1. Create Group A with 2 circles
2. Create Rectangle C
3. Select Group A + Rectangle C, press Cmd+G
4. Verify: Group B created, Group A and Rect C are children
5. Ungroup Group B
6. Verify: Group B deleted, Group A and Rect C root-level
7. Verify: Group A still contains 2 circles

### Auto-Delete

1. Create group with 1 rectangle
2. Delete rectangle (or drag out of group)
3. Verify: Group auto-deleted
4. Create Group A > Group B > Rectangle
5. Delete rectangle
6. Verify: Both Group B and Group A auto-deleted

### Multiplayer Sync

1. Open app in 2 browser windows
2. Window A: Create group
3. Window B: Verify group appears <150ms
4. Window A: Ungroup
5. Window B: Verify group deleted <150ms

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/types/canvas.types.ts` | Group type definition |
| `src/stores/canvasStore.ts` | `groupObjects()`, `ungroupObjects()` |
| `src/lib/utils/geometry.ts` | `calculateBoundingBox()` |
| `src/features/layers-panel/components/LayerIcon.tsx` | Folder icon for groups |
| `src/features/layers-panel/utils/layerNaming.ts` | Auto-naming (Group 1, etc.) |
| `src/features/toolbar/hooks/useToolShortcuts.ts` | Cmd+G / Shift+Cmd+G shortcuts |
| `src/features/layers-panel/utils/contextMenu.ts` | Context menu items |

---

## Future Enhancements

- **Drag group on canvas**: Move all children together (currently layers panel only)
- **Select group bounds**: Click group on canvas selects entire group
- **Group transform**: Rotate/scale entire group as unit
- **Frame groups**: Add fixed-bounds groups (like Figma frames)
- **Smart grouping**: Auto-group based on proximity/alignment
- **Group styles**: Apply fill/stroke to entire group

---

## Related Documentation

- [Hierarchy System](./hierarchy-system.md) - Parent-child relationships
- [Lock System](./lock-system.md) - Cascading locks through groups
- [Export System](./export-system.md) - Exporting grouped objects
- [Z-Index System](./z-index-system.md) - Layer ordering with groups
- [Context Menu](./context-menu.md) - Right-click actions

---

**Last Updated:** 2025-10-16
**Implementation Status:** Complete (37/52 tasks in grouping-export plan)
