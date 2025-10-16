# Multi-Select Debugging & Fix Plan

**Date**: 2025-10-14
**Status**: Current implementation has critical issues
**Priority**: High - Core feature blocking

## Executive Summary

Multi-select functionality is partially implemented but has two critical failures:

1. **Group Drag Broken**: Multiple selected objects cannot be moved together
2. **Drag-to-Select Missing**: Marquee/box selection (Figma-style) doesn't exist

This document provides root cause analysis, detailed fix plans, and edge case handling for both issues.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Konva.js Documentation Reference](#konvajs-documentation-reference)
4. [Firebase Realtime Database Considerations](#firebase-realtime-database-considerations)
5. [Detailed Fix Plan: Group Drag](#detailed-fix-plan-group-drag)
6. [Detailed Fix Plan: Drag-to-Select](#detailed-fix-plan-drag-to-select)
7. [Edge Cases & Testing](#edge-cases--testing)
8. [Performance & Efficiency](#performance--efficiency)

---

## Current State Analysis

### What Works ✅

- **Shift+click selection**: Users can shift+click to add/remove objects from selection
- **Visual feedback**: Multi-selected objects show lighter blue stroke (`#38bdf8`)
- **Store structure**: `selectedIds: string[]` array-based selection in Zustand
- **Firebase sync**: Selection state syncs as `objectIds: string[]` to RTDB
- **Remote selections**: Other users' multi-selections render correctly
- **Delete/Duplicate**: Toolbar buttons work on multiple objects

### What's Broken ❌

#### 1. Group Drag Failure

**Symptom**: When multiple objects are selected, dragging one object only moves that object, not the group.

**Observed Behavior**:
- User shift+clicks 3 rectangles → all 3 show light blue stroke
- User drags any of the 3 → only that one moves
- Other 2 remain stationary
- Expected: All 3 should move together maintaining relative positions

**Code Location**:
- `src/features/canvas-core/shapes/Rectangle.tsx:341`
- `src/features/canvas-core/shapes/Circle.tsx:341`
- `src/features/canvas-core/shapes/TextShape.tsx:341`

```typescript
// Current problematic code:
draggable={(isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging}
```

**Problem**: Individual shapes remain `draggable={true}` even when in multi-select.

#### 2. Drag-to-Select Missing

**Symptom**: Click-drag marquee selection (blue box) doesn't work at all.

**Expected Behavior** (per Figma):
1. User clicks background and drags → blue selection rectangle appears
2. As user drags, rectangle grows/shrinks
3. Objects overlapping rectangle get selected
4. On mouse up, selection finalizes

**Current Behavior**: Nothing happens. No visual feedback, no selection.

**Code Location**: `src/features/canvas-core/components/CanvasStage.tsx`

**Problem**: Feature not implemented at all. No mouse tracking, no rectangle rendering, no collision detection.

---

## Root Cause Analysis

### Issue 1: Individual Shape Dragging Conflicts with Group Logic

**Root Cause Chain**:

1. **Konva's drag system is per-node**: Each `Konva.Rect`, `Konva.Circle`, `Konva.Text` has its own `draggable` property
2. **Individual draggable=true**: When `isSelected` is true, each shape gets `draggable={true}`
3. **No group container**: Konva's event bubbling means individual shapes capture drag events first
4. **No group drag handler**: There's no code intercepting individual drags to convert them to group drags

**From Konva Docs** (see [Event Handling](#konvajs-documentation-reference)):

```javascript
// Konva event bubbling:
// 1. Event fires on target shape (e.g., Rectangle)
// 2. Event bubbles to parent Group (if exists)
// 3. Event bubbles to Layer
// 4. Event bubbles to Stage

// Our problem: We handle drag at Shape level, not Group level
```

**Why This Fails**:
- When user drags a selected shape, Konva's drag handler on that shape activates
- The drag handler only knows about its own shape's position
- No mechanism exists to synchronize positions of other selected shapes
- Other shapes' positions aren't updated during drag

**Critical Code Path** (Rectangle.tsx:341):

```typescript
// CURRENT: Enables individual drag
draggable={(isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging}

// SHOULD BE: Disable individual drag in multi-select
draggable={
  (isSelected || isHovered) &&
  activeTool === 'move' &&
  !isRemoteDragging &&
  !isInMultiSelect  // ← Missing this check
}
```

### Issue 2: No Drag-to-Select Implementation

**Root Cause**: Feature never implemented. No code exists for:

1. **Mouse tracking**: Tracking mousedown → mousemove → mouseup for drag detection
2. **Selection rectangle**: Rendering a Konva.Rect during drag
3. **Collision detection**: Checking which objects overlap with selection rectangle
4. **Coordinate transformation**: Converting screen coords → canvas coords (accounting for zoom/pan)

**Required Components** (currently missing):

```typescript
// 1. State tracking
interface DragSelectState {
  isActive: boolean;
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
}

// 2. Selection rectangle (Konva.Rect with dashed stroke)
// 3. Collision detection functions
// 4. Integration with CanvasStage mouse handlers
```

---

## Konva.js Documentation Reference

### Key Concepts from Konva Docs

#### 1. Drag and Drop System

**From Konva Documentation**:

```javascript
// Enable dragging
rect.draggable(true);

// Drag event lifecycle
rect.on('dragstart', (e) => {
  console.log('Drag started');
  rect.opacity(0.5);
});

rect.on('dragmove', (e) => {
  console.log('Dragging to:', rect.position());
});

rect.on('dragend', (e) => {
  console.log('Drag ended');
  rect.opacity(1);
});

// Constrain drag boundaries
rect.dragBoundFunc((pos) => {
  return {
    x: Math.max(0, Math.min(stage.width() - rect.width(), pos.x)),
    y: Math.max(0, Math.min(stage.height() - rect.height(), pos.y))
  };
});
```

**Application to Our Problem**:
- We need to disable individual `draggable` for multi-select shapes
- Instead, create a "virtual group" that tracks drag deltas
- Apply same delta to all selected shapes simultaneously

#### 2. Groups and Transformations

**From Konva Documentation**:

```javascript
// Create a group to transform multiple shapes together
const group = new Konva.Group({
  x: 100,
  y: 100,
  draggable: true  // Group is draggable
});
layer.add(group);

// Add shapes to group
group.add(rect1, rect2, rect3);

// Transform entire group
group.rotation(45);
group.scale({ x: 1.5, y: 1.5 });

// Group events
group.on('dragmove', (e) => {
  console.log('Group moved to:', group.position());
});
```

**Application to Our Problem**:
- We CAN'T use real Konva Groups (objects already exist individually)
- Instead, create a "virtual group" concept:
  - One selected shape acts as "anchor" (the one user drags)
  - Calculate delta: `newPos - oldPos`
  - Apply same delta to all other selected shapes
  - Sync all positions to Firebase in single batch

#### 3. Event Handling and Bubbling

**From Konva Documentation**:

```javascript
// Event bubbling
rect.on('click', (e) => {
  // Stop event from bubbling to parent
  e.cancelBubble = true;
});

// Event delegation
layer.on('click', (e) => {
  if (e.target.hasName('clickable')) {
    console.log('Clickable shape clicked');
  }
});

// Check if currently dragging
if (Konva.isDragging()) {
  console.log('Something is being dragged');
}
```

**Application to Our Problem**:
- During group drag, we need to:
  - Cancel individual shape drag events with `e.cancelBubble = true`
  - Handle drag at a higher level (custom hook)
  - Prevent conflicts with selection clicks

#### 4. Collision Detection

**From Konva Documentation**:

```javascript
// Get shape at specific coordinates
const shape = stage.getIntersection({ x: 50, y: 50 });

// Get all shapes in layer
layer.children.forEach((child) => {
  // Check custom collision logic
});
```

**Application to Drag-to-Select**:
- Need to implement AABB (Axis-Aligned Bounding Box) collision:
  ```typescript
  function rectIntersects(r1, r2) {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }
  ```

- For circles: Circle-rectangle overlap detection
  ```typescript
  function circleRectIntersects(circle, rect) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Check if closest point is within circle radius
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
  }
  ```

#### 5. Performance Optimization

**From Konva Documentation**:

```javascript
// Batch draw (more efficient than draw())
layer.batchDraw();

// Disable listening for non-interactive layers
layer.listening(false);

// Transform optimization
rect.transformsEnabled = 'position';  // Only allow position changes
rect.perfectDrawEnabled = false;  // Skip pixel-perfect rendering
```

**Application to Multi-Select**:
- Use `layer.batchDraw()` during group drag (not `layer.draw()`)
- Disable individual shape event listeners during group drag
- Re-enable after drag ends

---

## Firebase Realtime Database Considerations

### Current Sync Pattern

**Single Object Update** (`src/lib/firebase/realtimeCanvasService.ts`):

```typescript
export async function updateCanvasObject(
  canvasId: string,
  objectId: string,
  updates: Partial<CanvasObject>
): Promise<void> {
  const objectRef = ref(db, `canvases/${canvasId}/objects/${objectId}`);
  await update(objectRef, updates);
}
```

**Problem with Multi-Select**:
- Moving 5 objects = 5 separate Firebase calls
- Each call triggers a network round-trip (~50-100ms)
- Other users receive 5 separate updates → flickering/drift
- Non-atomic: If connection drops mid-drag, some objects update but not others

### Atomic Batch Updates (Solution)

**Firebase RTDB supports multi-path updates**:

```typescript
// EFFICIENT: Single atomic update for multiple objects
export async function batchUpdateCanvasObjects(
  canvasId: string,
  updates: Record<string, Partial<CanvasObject>>
): Promise<void> {
  const dbRef = ref(db);

  // Build multi-path update object
  const multiPathUpdates: Record<string, any> = {};

  for (const [objectId, objectUpdates] of Object.entries(updates)) {
    for (const [key, value] of Object.entries(objectUpdates)) {
      multiPathUpdates[`canvases/${canvasId}/objects/${objectId}/${key}`] = value;
    }
  }

  // Single atomic update
  await update(dbRef, multiPathUpdates);
}
```

**Benefits**:
- **1 network call** instead of N
- **Atomic**: All objects update together or none do
- **No drift**: Other users receive single consistent update
- **Faster**: ~100ms total instead of N × 100ms

**Usage During Group Drag**:

```typescript
async function syncGroupDragToFirebase(
  selectedIds: string[],
  deltaX: number,
  deltaY: number
) {
  const updates: Record<string, Partial<CanvasObject>> = {};

  for (const id of selectedIds) {
    const obj = objects.find(o => o.id === id);
    if (!obj) continue;

    updates[id] = {
      x: obj.x + deltaX,
      y: obj.y + deltaY,
      lastModified: Date.now()
    };
  }

  await batchUpdateCanvasObjects('main', updates);
}
```

### Throttling Strategy

**Current Throttling**:
- Cursors: 50ms throttle (`throttledUpdateCursor`)
- Objects: 500ms debounce (assumed)

**For Group Drag**:

```typescript
// Throttle group drag sync to 100ms (balance between responsiveness and efficiency)
const throttledGroupDragSync = throttle(
  (selectedIds, deltaX, deltaY) => {
    syncGroupDragToFirebase(selectedIds, deltaX, deltaY);
  },
  100  // 100ms throttle = 10 updates/second max
);
```

**Why 100ms?**
- More responsive than 500ms (feels real-time)
- Less chatty than 50ms (reduces load)
- Still < 150ms (threshold for "instantaneous" perception)

### Optimistic Updates

**Pattern** (already used in codebase):

```typescript
// 1. Update local state immediately (optimistic)
selectedIds.forEach(id => {
  const obj = objects.find(o => o.id === id);
  if (obj) {
    updateObject(id, { x: obj.x + deltaX, y: obj.y + deltaY });
  }
});

// 2. Sync to Firebase (asynchronous)
try {
  await syncGroupDragToFirebase(selectedIds, deltaX, deltaY);
} catch (error) {
  console.error('Failed to sync group drag:', error);
  // RTDB subscription will restore correct state if sync fails
}
```

**Benefits**:
- Zero perceived latency for local user
- UI updates immediately
- Firebase sync happens in background
- Subscription restores consistency if sync fails

---

## Detailed Fix Plan: Group Drag

### Phase 1: Disable Individual Dragging in Multi-Select

**Objective**: Prevent individual shapes from being dragged when multiple objects are selected.

#### Step 1.1: Update Rectangle Component

**File**: `src/features/canvas-core/shapes/Rectangle.tsx`

**Change** (Line 341):

```typescript
// BEFORE:
draggable={(isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging}

// AFTER:
draggable={
  (isSelected || isHovered) &&
  activeTool === 'move' &&
  !isRemoteDragging &&
  !isInMultiSelect  // ← Add this check
}
```

**Reasoning**:
- When `isInMultiSelect` is true (passed from parent), shape should NOT be draggable
- User interaction will be handled at group level instead
- Individual shapes remain interactive (clickable for selection) but not draggable

#### Step 1.2: Update Circle Component

**File**: `src/features/canvas-core/shapes/Circle.tsx`

**Change**: Same as Rectangle (Line 341)

#### Step 1.3: Update TextShape Component

**File**: `src/features/canvas-core/shapes/TextShape.tsx`

**Change**: Same as Rectangle (Line 341)

**Verification**:
- [ ] After changes, shift+click 3 objects
- [ ] Try to drag any object
- [ ] Expected: Object doesn't drag (cursor shows "no drag" or remains pointer)

---

### Phase 2: Implement Group Drag Logic

**Objective**: Create custom drag handling for multiple selected objects.

#### Step 2.1: Create useGroupDrag Hook

**File**: `src/features/canvas-core/hooks/useGroupDrag.ts` (NEW)

```typescript
/**
 * useGroupDrag Hook
 *
 * Handles dragging multiple selected objects together.
 * - Tracks drag state (start position, current delta)
 * - Updates all selected objects' positions synchronously
 * - Syncs to Firebase RTDB with atomic batch update
 */

import { useState, useRef, useCallback } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores';
import { batchUpdateCanvasObjects } from '@/lib/firebase';
import { throttle } from '@/lib/utils';

interface GroupDragState {
  isDragging: boolean;
  dragAnchorId: string | null;  // The object user is dragging
  startPositions: Map<string, { x: number; y: number }>;  // Initial positions
}

/**
 * Hook to enable group dragging for multi-selected objects
 *
 * @returns {Object} Group drag handlers and state
 *
 * @example
 * ```tsx
 * const { handleGroupDragStart, handleGroupDragMove, handleGroupDragEnd, isGroupDragging } = useGroupDrag();
 *
 * <Rectangle
 *   onDragStart={(e) => handleGroupDragStart(e, rectangle.id)}
 *   onDragMove={handleGroupDragMove}
 *   onDragEnd={handleGroupDragEnd}
 * />
 * ```
 */
export function useGroupDrag() {
  const { selectedIds, objects, updateObject } = useCanvasStore();
  const [groupDragState, setGroupDragState] = useState<GroupDragState>({
    isDragging: false,
    dragAnchorId: null,
    startPositions: new Map(),
  });

  /**
   * Throttled Firebase sync (100ms throttle)
   */
  const syncToFirebase = useRef(
    throttle(async (updates: Record<string, { x: number; y: number }>) => {
      try {
        await batchUpdateCanvasObjects('main', updates);
      } catch (error) {
        console.error('Failed to sync group drag to RTDB:', error);
      }
    }, 100)
  ).current;

  /**
   * Handle drag start for group
   * Captures initial positions of all selected objects
   */
  const handleGroupDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, anchorId: string) => {
      // Only handle if this object is part of multi-select
      if (selectedIds.length <= 1) return;
      if (!selectedIds.includes(anchorId)) return;

      // Cancel event bubbling to prevent stage drag
      e.cancelBubble = true;

      // Capture start positions
      const startPositions = new Map<string, { x: number; y: number }>();
      selectedIds.forEach(id => {
        const obj = objects.find(o => o.id === id);
        if (obj) {
          startPositions.set(id, { x: obj.x, y: obj.y });
        }
      });

      setGroupDragState({
        isDragging: true,
        dragAnchorId: anchorId,
        startPositions,
      });
    },
    [selectedIds, objects]
  );

  /**
   * Handle drag move for group
   * Calculates delta from anchor object and applies to all selected objects
   */
  const handleGroupDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!groupDragState.isDragging || !groupDragState.dragAnchorId) return;

      // Cancel event bubbling
      e.cancelBubble = true;

      // Get current position of anchor object
      const anchorObj = objects.find(o => o.id === groupDragState.dragAnchorId);
      const startPos = groupDragState.startPositions.get(groupDragState.dragAnchorId);

      if (!anchorObj || !startPos) return;

      // Calculate delta from start position
      const deltaX = anchorObj.x - startPos.x;
      const deltaY = anchorObj.y - startPos.y;

      // Apply delta to all selected objects (optimistic update)
      const updates: Record<string, { x: number; y: number }> = {};

      selectedIds.forEach(id => {
        const startPosition = groupDragState.startPositions.get(id);
        if (!startPosition) return;

        const newX = startPosition.x + deltaX;
        const newY = startPosition.y + deltaY;

        // Update local store immediately
        updateObject(id, { x: newX, y: newY });

        // Track for Firebase sync
        updates[id] = { x: newX, y: newY };
      });

      // Throttled sync to Firebase
      syncToFirebase(updates);
    },
    [groupDragState, selectedIds, objects, updateObject, syncToFirebase]
  );

  /**
   * Handle drag end for group
   * Performs final Firebase sync and resets drag state
   */
  const handleGroupDragEnd = useCallback(
    async (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!groupDragState.isDragging) return;

      // Cancel event bubbling
      e.cancelBubble = true;

      // Final sync to Firebase (non-throttled)
      const updates: Record<string, { x: number; y: number }> = {};

      selectedIds.forEach(id => {
        const obj = objects.find(o => o.id === id);
        if (obj) {
          updates[id] = { x: obj.x, y: obj.y };
        }
      });

      try {
        await batchUpdateCanvasObjects('main', updates);
      } catch (error) {
        console.error('Failed final sync for group drag:', error);
      }

      // Reset drag state
      setGroupDragState({
        isDragging: false,
        dragAnchorId: null,
        startPositions: new Map(),
      });
    },
    [groupDragState, selectedIds, objects]
  );

  return {
    handleGroupDragStart,
    handleGroupDragMove,
    handleGroupDragEnd,
    isGroupDragging: groupDragState.isDragging,
  };
}
```

#### Step 2.2: Add Batch Update to Firebase Service

**File**: `src/lib/firebase/realtimeCanvasService.ts`

**Add Function**:

```typescript
/**
 * Atomic batch update for multiple canvas objects
 * Updates multiple objects in a single Firebase transaction
 *
 * @param canvasId - Canvas identifier
 * @param updates - Map of objectId → partial updates
 *
 * @example
 * ```typescript
 * await batchUpdateCanvasObjects('main', {
 *   'rect1': { x: 100, y: 200 },
 *   'rect2': { x: 150, y: 250 },
 *   'circle1': { x: 300, y: 100 }
 * });
 * ```
 */
export async function batchUpdateCanvasObjects(
  canvasId: string,
  updates: Record<string, Partial<CanvasObject>>
): Promise<void> {
  const dbRef = ref(db);

  // Build multi-path update object
  const multiPathUpdates: Record<string, any> = {};

  for (const [objectId, objectUpdates] of Object.entries(updates)) {
    for (const [key, value] of Object.entries(objectUpdates)) {
      multiPathUpdates[`canvases/${canvasId}/objects/${objectId}/${key}`] = value;
    }
  }

  // Single atomic update
  await update(dbRef, multiPathUpdates);
}
```

**Export**:

```typescript
// Add to exports in src/lib/firebase/index.ts
export { batchUpdateCanvasObjects } from './realtimeCanvasService';
```

#### Step 2.3: Integrate Group Drag into CanvasStage

**File**: `src/features/canvas-core/components/CanvasStage.tsx`

**Changes**:

```typescript
// Add import
import { useGroupDrag } from '../hooks';

// Inside CanvasStage component:
export function CanvasStage() {
  // ... existing code ...

  // Add group drag handlers
  const {
    handleGroupDragStart,
    handleGroupDragMove,
    handleGroupDragEnd,
    isGroupDragging
  } = useGroupDrag();

  // ... existing code ...

  // Update shape rendering to pass group drag handlers
  {objects
    .filter((obj) => obj.type === 'rectangle')
    .map((obj) => {
      const remoteDragState = dragStates.find((state) => state.objectId === obj.id);

      return (
        <Rectangle
          key={obj.id}
          rectangle={obj as RectangleType}
          isSelected={selectedIds.includes(obj.id)}
          isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
          onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.evt.shiftKey) {
              toggleSelection(obj.id);
            } else {
              selectObjects([obj.id]);
            }
          }}
          remoteDragState={remoteDragState}
          // Add group drag handlers
          onGroupDragStart={(e) => handleGroupDragStart(e, obj.id)}
          onGroupDragMove={handleGroupDragMove}
          onGroupDragEnd={handleGroupDragEnd}
        />
      );
    })}

  // Repeat for circles and text shapes...
}
```

#### Step 2.4: Update Shape Component Interfaces

**Files**:
- `src/features/canvas-core/shapes/Rectangle.tsx`
- `src/features/canvas-core/shapes/Circle.tsx`
- `src/features/canvas-core/shapes/TextShape.tsx`

**Changes to Interface**:

```typescript
interface RectangleProps {
  rectangle: Rectangle;
  isSelected: boolean;
  isInMultiSelect?: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  remoteDragState?: RemoteDragState;
  // Add group drag handlers
  onGroupDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onGroupDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onGroupDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}
```

**Changes to Component** (Rectangle example):

```typescript
export function Rectangle({
  rectangle,
  isSelected,
  isInMultiSelect = false,
  onSelect,
  remoteDragState,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
}: RectangleProps) {
  // ... existing code ...

  // Attach group drag handlers
  function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    if (isInMultiSelect && onGroupDragStart) {
      onGroupDragStart(e);
    }
    // ... existing drag start logic ...
  }

  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    if (isInMultiSelect && onGroupDragMove) {
      onGroupDragMove(e);
      return; // Skip individual drag logic
    }
    // ... existing drag move logic ...
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    if (isInMultiSelect && onGroupDragEnd) {
      onGroupDragEnd(e);
      return; // Skip individual drag logic
    }
    // ... existing drag end logic ...
  }

  return (
    <Rect
      // ... existing props ...
      draggable={
        (isSelected || isHovered) &&
        activeTool === 'move' &&
        !isRemoteDragging &&
        !isInMultiSelect  // ← Disable in multi-select
      }
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    />
  );
}
```

#### Step 2.5: Export Hook

**File**: `src/features/canvas-core/hooks/index.ts`

```typescript
export { useGroupDrag } from './useGroupDrag';
```

**Verification Checklist**:
- [ ] Shift+click 3 objects → all 3 selected
- [ ] Drag any of the 3 → all 3 move together
- [ ] Relative positions maintained during drag
- [ ] No flickering or "snapping"
- [ ] Firebase shows single atomic update (check Network tab)
- [ ] Other users see smooth synchronized movement
- [ ] Works for rectangles, circles, AND text shapes

---

### Phase 3: Visual Feedback for Group Selection

**Objective**: Add visual indicator showing which objects are being dragged as a group.

#### Step 3.1: Create Group Bounding Box Component

**File**: `src/features/canvas-core/components/GroupBoundingBox.tsx` (NEW)

```typescript
/**
 * GroupBoundingBox Component
 *
 * Renders a dashed bounding box around all selected objects during group drag.
 * Provides visual feedback that objects are being moved together.
 */

import { Rect } from 'react-konva';
import { useCanvasStore } from '@/stores';
import { getSelectionBounds } from '../utils';

interface GroupBoundingBoxProps {
  /** Whether group drag is active */
  isGroupDragging: boolean;
}

/**
 * Renders a dashed bounding box around multi-selected objects
 * Only visible during active group drag
 *
 * @example
 * ```tsx
 * <Layer>
 *   <GroupBoundingBox isGroupDragging={isGroupDragging} />
 * </Layer>
 * ```
 */
export function GroupBoundingBox({ isGroupDragging }: GroupBoundingBoxProps) {
  const { selectedIds, objects } = useCanvasStore();

  // Don't render if not dragging or single selection
  if (!isGroupDragging || selectedIds.length <= 1) {
    return null;
  }

  // Calculate bounding box
  const bounds = getSelectionBounds(objects, selectedIds);

  if (!bounds) {
    return null;
  }

  return (
    <Rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      stroke="#0ea5e9"
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}
```

#### Step 3.2: Add to CanvasStage

**File**: `src/features/canvas-core/components/CanvasStage.tsx`

```typescript
import { GroupBoundingBox } from './GroupBoundingBox';

// Inside <Layer> (after shape rendering):
<Layer>
  {/* ... shape rendering ... */}

  {/* Group bounding box (visible during group drag) */}
  <GroupBoundingBox isGroupDragging={isGroupDragging} />
</Layer>
```

**Verification**:
- [ ] During group drag, dashed blue box appears around all selected objects
- [ ] Box updates in real-time as objects move
- [ ] Box disappears when drag ends
- [ ] No performance impact (< 5ms render time)

---

## Detailed Fix Plan: Drag-to-Select

### Phase 4: Implement Drag-to-Select Hook

**Objective**: Create marquee selection (Figma-style blue rectangle) for selecting multiple objects.

#### Step 4.1: Create useDragToSelect Hook

**File**: `src/features/canvas-core/hooks/useDragToSelect.ts` (NEW)

```typescript
/**
 * useDragToSelect Hook
 *
 * Implements drag-to-select (marquee selection) functionality.
 * - Tracks mouse down → drag → mouse up on stage background
 * - Renders selection rectangle during drag
 * - Performs collision detection to select overlapping objects
 * - Accounts for zoom and pan transformations
 */

import { useState, useCallback } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores';
import { screenToCanvasCoords } from '../utils';
import type { CanvasObject } from '@/types';

interface DragSelectState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}

/**
 * Get normalized selection rectangle (handles all 4 drag directions)
 */
function getSelectionRect(
  start: { x: number; y: number },
  current: { x: number; y: number }
) {
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  };
}

/**
 * Check if rectangle intersects with object
 * Handles rectangles, circles, and text shapes
 */
function objectIntersectsRect(
  obj: CanvasObject,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  if (obj.type === 'rectangle' || obj.type === 'text') {
    // AABB collision for rectangles and text
    return !(
      obj.x + obj.width < rect.x ||
      rect.x + rect.width < obj.x ||
      obj.y + obj.height < rect.y ||
      rect.y + rect.height < obj.y
    );
  } else if (obj.type === 'circle') {
    // Circle-rectangle collision
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(obj.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(obj.y, rect.y + rect.height));

    // Check if closest point is within circle radius
    const dx = obj.x - closestX;
    const dy = obj.y - closestY;
    return (dx * dx + dy * dy) <= (obj.radius * obj.radius);
  }

  return false;
}

/**
 * Hook to enable drag-to-select functionality
 *
 * @returns {Object} Drag-to-select handlers and state
 *
 * @example
 * ```tsx
 * const {
 *   handleStageMouseDown,
 *   handleStageMouseMove,
 *   handleStageMouseUp,
 *   selectionRect
 * } = useDragToSelect(stageRef);
 *
 * <Stage
 *   onMouseDown={handleStageMouseDown}
 *   onMouseMove={handleStageMouseMove}
 *   onMouseUp={handleStageMouseUp}
 * >
 *   <Layer>
 *     {selectionRect && (
 *       <Rect {...selectionRect} stroke="blue" />
 *     )}
 *   </Layer>
 * </Stage>
 * ```
 */
export function useDragToSelect(stageRef: React.RefObject<Konva.Stage>) {
  const [dragSelectState, setDragSelectState] = useState<DragSelectState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
  });

  const { objects, selectObjects } = useCanvasStore();

  /**
   * Handle mouse down on stage background
   * Starts drag-to-select if clicking on empty space
   */
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Only start drag-to-select if clicking stage background (not a shape)
      const clickedOnEmpty = e.target === e.target.getStage();
      if (!clickedOnEmpty) return;

      // Don't start if shift is pressed (shift+click is for toggle selection)
      if (e.evt.shiftKey) return;

      // Get canvas coordinates (accounting for zoom/pan)
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const canvasCoords = screenToCanvasCoords(stage, pointerPos);

      setDragSelectState({
        isActive: true,
        startPoint: canvasCoords,
        currentPoint: canvasCoords,
      });
    },
    [stageRef]
  );

  /**
   * Handle mouse move during drag
   * Updates selection rectangle
   */
  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!dragSelectState.isActive) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const canvasCoords = screenToCanvasCoords(stage, pointerPos);

      setDragSelectState(prev => ({
        ...prev,
        currentPoint: canvasCoords,
      }));
    },
    [dragSelectState.isActive, stageRef]
  );

  /**
   * Handle mouse up - finalize selection
   * Performs collision detection and selects overlapping objects
   */
  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!dragSelectState.isActive) return;
      if (!dragSelectState.startPoint || !dragSelectState.currentPoint) return;

      // Get normalized selection rectangle
      const selectionRect = getSelectionRect(
        dragSelectState.startPoint,
        dragSelectState.currentPoint
      );

      // Find all objects that intersect with selection rectangle
      const selectedIds = objects
        .filter(obj => objectIntersectsRect(obj, selectionRect))
        .map(obj => obj.id);

      // Update selection (replace existing selection unless shift is held)
      if (e.evt.shiftKey) {
        // Shift+drag: Add to existing selection
        // (Would need to modify selectObjects to support additive mode)
        selectObjects(selectedIds);
      } else {
        // Regular drag: Replace selection
        selectObjects(selectedIds);
      }

      // Reset drag state
      setDragSelectState({
        isActive: false,
        startPoint: null,
        currentPoint: null,
      });
    },
    [dragSelectState, objects, selectObjects]
  );

  // Calculate selection rectangle for rendering
  const selectionRect = dragSelectState.isActive &&
    dragSelectState.startPoint &&
    dragSelectState.currentPoint
      ? getSelectionRect(dragSelectState.startPoint, dragSelectState.currentPoint)
      : null;

  return {
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    selectionRect,
    isDragSelecting: dragSelectState.isActive,
  };
}
```

#### Step 4.2: Integrate into CanvasStage

**File**: `src/features/canvas-core/components/CanvasStage.tsx`

**Changes**:

```typescript
// Add import
import { useDragToSelect } from '../hooks';

// Inside CanvasStage component:
export function CanvasStage() {
  // ... existing code ...

  // Add drag-to-select handlers
  const {
    handleStageMouseDown: handleDragSelectMouseDown,
    handleStageMouseMove: handleDragSelectMouseMove,
    handleStageMouseUp: handleDragSelectMouseUp,
    selectionRect,
    isDragSelecting
  } = useDragToSelect(stageRef);

  // Combine with existing stage mouse handlers
  function handleStageMouseDownCombined(e: Konva.KonvaEventObject<MouseEvent>) {
    // Track for click detection (existing)
    const pointerPos = stage.getPointerPosition();
    if (pointerPos) {
      mouseDownPos.current = { x: pointerPos.x, y: pointerPos.y };
    }

    // Shape creation (existing)
    handleMouseDown(e);

    // Drag-to-select (new)
    handleDragSelectMouseDown(e);
  }

  function handleStageMouseMoveCombined(e: Konva.KonvaEventObject<MouseEvent>) {
    // Shape creation (existing)
    handleMouseMove(e);

    // Cursor tracking (existing)
    handleCursorMove();

    // Drag-to-select (new)
    handleDragSelectMouseMove(e);
  }

  function handleStageMouseUpCombined(e: Konva.KonvaEventObject<MouseEvent>) {
    // Shape creation (existing)
    handleMouseUp(e);

    // Drag-to-select (new)
    handleDragSelectMouseUp(e);
  }

  return (
    <Stage
      ref={stageRef}
      // ... existing props ...
      onMouseDown={handleStageMouseDownCombined}
      onMouseMove={handleStageMouseMoveCombined}
      onMouseUp={handleStageMouseUpCombined}
    >
      <Layer>
        {/* ... existing shape rendering ... */}

        {/* Drag-to-select rectangle */}
        {selectionRect && (
          <Rect
            x={selectionRect.x}
            y={selectionRect.y}
            width={selectionRect.width}
            height={selectionRect.height}
            fill="rgba(14, 165, 233, 0.1)"  // Light blue fill
            stroke="#0ea5e9"  // Blue border
            strokeWidth={1}
            dash={[5, 5]}
            listening={false}
            perfectDrawEnabled={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
```

#### Step 4.3: Export Hook

**File**: `src/features/canvas-core/hooks/index.ts`

```typescript
export { useDragToSelect } from './useDragToSelect';
```

**Verification Checklist**:
- [ ] Click and drag on empty canvas → blue selection rectangle appears
- [ ] Rectangle grows/shrinks correctly in all 4 directions
- [ ] Release mouse → objects overlapping rectangle get selected
- [ ] Works with zoom (selection rectangle scales correctly)
- [ ] Works with pan (selection rectangle positions correctly)
- [ ] Doesn't interfere with shape creation tools
- [ ] Doesn't interfere with clicking individual shapes

---

### Phase 5: Collision Detection Refinement

**Objective**: Ensure accurate collision detection for all shape types.

#### Step 5.1: Add Collision Utilities

**File**: `src/features/canvas-core/utils/collision.ts` (NEW)

```typescript
/**
 * Collision Detection Utilities
 *
 * Provides collision detection functions for various shape types.
 * Used primarily for drag-to-select functionality.
 */

import type { CanvasObject, Rectangle as RectangleType, Circle as CircleType, Text as TextType } from '@/types';

/**
 * Rectangle (AABB) intersection test
 *
 * @param r1 - First rectangle
 * @param r2 - Second rectangle
 * @returns True if rectangles overlap
 *
 * @example
 * ```typescript
 * const overlaps = rectanglesIntersect(
 *   { x: 0, y: 0, width: 100, height: 100 },
 *   { x: 50, y: 50, width: 100, height: 100 }
 * );
 * // overlaps = true
 * ```
 */
export function rectanglesIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Circle-rectangle intersection test
 *
 * Uses closest point algorithm:
 * 1. Find closest point on rectangle to circle center
 * 2. Check if that point is within circle radius
 *
 * @param circle - Circle with center (x, y) and radius
 * @param rect - Rectangle bounds
 * @returns True if circle and rectangle overlap
 *
 * @example
 * ```typescript
 * const overlaps = circleRectIntersects(
 *   { x: 150, y: 150, radius: 50 },
 *   { x: 100, y: 100, width: 100, height: 100 }
 * );
 * ```
 */
export function circleRectIntersects(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  // Check if distance is less than radius
  return distanceSquared <= (circle.radius * circle.radius);
}

/**
 * Generic object-rectangle intersection test
 * Routes to appropriate collision function based on object type
 *
 * @param obj - Canvas object (rectangle, circle, or text)
 * @param rect - Selection rectangle
 * @returns True if object intersects with rectangle
 *
 * @example
 * ```typescript
 * const objects = canvasStore.objects;
 * const selectionRect = { x: 0, y: 0, width: 200, height: 200 };
 *
 * const selectedObjects = objects.filter(obj =>
 *   objectIntersectsRect(obj, selectionRect)
 * );
 * ```
 */
export function objectIntersectsRect(
  obj: CanvasObject,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  switch (obj.type) {
    case 'rectangle':
    case 'text': {
      // Treat text as rectangle for collision purposes
      const objRect = {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };
      return rectanglesIntersect(objRect, rect);
    }

    case 'circle': {
      return circleRectIntersects(
        { x: obj.x, y: obj.y, radius: obj.radius },
        rect
      );
    }

    default:
      // Unknown type - assume no intersection
      console.warn(`Unknown object type: ${(obj as any).type}`);
      return false;
  }
}

/**
 * Point-in-rectangle test
 *
 * @param point - Point coordinates
 * @param rect - Rectangle bounds
 * @returns True if point is inside rectangle
 */
export function pointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Point-in-circle test
 *
 * @param point - Point coordinates
 * @param circle - Circle center and radius
 * @returns True if point is inside circle
 */
export function pointInCircle(
  point: { x: number; y: number },
  circle: { x: number; y: number; radius: number }
): boolean {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
}
```

#### Step 5.2: Export Utilities

**File**: `src/features/canvas-core/utils/index.ts`

```typescript
export * from './collision';
```

#### Step 5.3: Update useDragToSelect to Use Collision Utils

**File**: `src/features/canvas-core/hooks/useDragToSelect.ts`

**Change**:

```typescript
// Remove local objectIntersectsRect function

// Import from utils instead
import { objectIntersectsRect } from '../utils/collision';

// Rest of hook remains the same
```

**Verification**:
- [ ] Drag-to-select correctly selects rectangles
- [ ] Drag-to-select correctly selects circles (including partial overlap)
- [ ] Drag-to-select correctly selects text shapes
- [ ] Edge cases: Very small selection rectangles work
- [ ] Edge cases: Selecting objects that are partially off-screen works

---

## Edge Cases & Testing

### Edge Case 1: Group Drag with One Object Already Being Dragged Remotely

**Scenario**:
- User A selects 3 objects
- User B starts dragging one of those 3 objects
- User A tries to group drag

**Expected Behavior**:
- User A's group drag should NOT include the object being dragged by User B
- OR: User A's group drag should be blocked entirely with visual feedback

**Implementation**:

```typescript
// In useGroupDrag.ts, modify handleGroupDragStart:
const handleGroupDragStart = useCallback(
  (e: Konva.KonvaEventObject<DragEvent>, anchorId: string) => {
    // ... existing checks ...

    // Check if any selected object is being remotely dragged
    const hasRemoteDrag = selectedIds.some(id =>
      dragStates.find(state => state.objectId === id)
    );

    if (hasRemoteDrag) {
      // Block group drag with console warning
      console.warn('Cannot group drag: One or more objects are being edited by another user');
      return;
    }

    // ... rest of logic ...
  },
  [selectedIds, objects, dragStates]  // Add dragStates to deps
);
```

### Edge Case 2: Drag-to-Select While Shape Creation Tool Is Active

**Scenario**:
- User has Rectangle tool selected
- User clicks and drags on canvas

**Expected Behavior**:
- Should create rectangle (shape creation takes precedence)
- Should NOT trigger drag-to-select

**Implementation**:

```typescript
// In useDragToSelect.ts, modify handleStageMouseDown:
const handleStageMouseDown = useCallback(
  (e: Konva.KonvaEventObject<MouseEvent>) => {
    const { activeTool } = useToolStore.getState();

    // Only allow drag-to-select when 'move' tool is active
    if (activeTool !== 'move') return;

    // ... rest of logic ...
  },
  [stageRef]
);
```

### Edge Case 3: Empty Selection Rectangle (Click Without Drag)

**Scenario**:
- User clicks on empty canvas
- User releases immediately (no drag)

**Expected Behavior**:
- Should clear selection (existing behavior)
- Should NOT show selection rectangle flash

**Implementation**:

```typescript
// In useDragToSelect.ts, modify handleStageMouseUp:
const handleStageMouseUp = useCallback(
  (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!dragSelectState.isActive) return;
    if (!dragSelectState.startPoint || !dragSelectState.currentPoint) return;

    const selectionRect = getSelectionRect(
      dragSelectState.startPoint,
      dragSelectState.currentPoint
    );

    // Minimum drag threshold (5px) - ignore tiny movements
    const MIN_DRAG_DISTANCE = 5;
    if (selectionRect.width < MIN_DRAG_DISTANCE && selectionRect.height < MIN_DRAG_DISTANCE) {
      // Treat as click, not drag - clear selection
      selectObjects([]);
      setDragSelectState({
        isActive: false,
        startPoint: null,
        currentPoint: null,
      });
      return;
    }

    // ... rest of logic ...
  },
  [dragSelectState, objects, selectObjects]
);
```

### Edge Case 4: Group Drag with Extreme Zoom Levels

**Scenario**:
- User zooms out to 0.1x (10% scale)
- User group drags 50 objects

**Expected Behavior**:
- Drag should be smooth (60 FPS)
- No visual glitches or "jumping"

**Implementation**:

```typescript
// In useGroupDrag.ts, ensure screen-to-canvas coordinate conversion:
const handleGroupDragMove = useCallback(
  (e: Konva.KonvaEventObject<DragEvent>) => {
    // ... existing checks ...

    // Get stage for coordinate conversion
    const stage = e.target.getStage();
    if (!stage) return;

    // Use stage's transform to get accurate canvas coordinates
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const canvasCoords = screenToCanvasCoords(stage, pointerPos);

    // Calculate delta using canvas coordinates (not screen coordinates)
    const startPos = groupDragState.startPositions.get(groupDragState.dragAnchorId);
    if (!startPos) return;

    const deltaX = canvasCoords.x - startPos.x;
    const deltaY = canvasCoords.y - startPos.y;

    // ... rest of logic ...
  },
  [groupDragState, selectedIds, objects, updateObject, syncToFirebase]
);
```

### Edge Case 5: Drag-to-Select Across Page Boundaries

**Scenario**:
- User drags selection rectangle from inside canvas to outside window
- OR: User drags very quickly causing mouseup to fire outside stage

**Expected Behavior**:
- Selection should finalize based on last known position
- Should not cause errors or state corruption

**Implementation**:

```typescript
// In useDragToSelect.ts, add cleanup effect:
useEffect(() => {
  // Global mouseup listener to catch mouseup outside stage
  function handleGlobalMouseUp() {
    if (dragSelectState.isActive) {
      // Finalize selection with current position
      setDragSelectState({
        isActive: false,
        startPoint: null,
        currentPoint: null,
      });
    }
  }

  window.addEventListener('mouseup', handleGlobalMouseUp);
  return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
}, [dragSelectState.isActive]);
```

### Edge Case 6: Network Disconnection During Group Drag

**Scenario**:
- User starts group dragging 10 objects
- Network disconnects mid-drag
- User finishes drag

**Expected Behavior**:
- Local state updates immediately (optimistic)
- Firebase sync fails silently
- When connection restores, RTDB subscription re-syncs correct state
- User sees their changes persist (if they were the last writer)

**Implementation**:

```typescript
// In useGroupDrag.ts, add error handling:
const handleGroupDragEnd = useCallback(
  async (e: Konva.KonvaEventObject<DragEvent>) => {
    // ... existing checks ...

    try {
      await batchUpdateCanvasObjects('main', updates);
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        console.error('Failed to sync: Permission denied');
        // Could show user notification here
      } else if (error.code === 'NETWORK_ERROR') {
        console.warn('Failed to sync: Network error. Will retry when connection restores.');
        // RTDB will auto-retry on reconnection
      } else {
        console.error('Failed to sync group drag:', error);
      }
    }

    // Reset drag state regardless of sync success
    setGroupDragState({
      isDragging: false,
      dragAnchorId: null,
      startPositions: new Map(),
    });
  },
  [groupDragState, selectedIds, objects]
);
```

### Edge Case 7: Rapid Multi-Select Operations

**Scenario**:
- User rapidly shift+clicks 20 objects in 2 seconds
- Each click updates `selectedIds` array
- Each update triggers Firebase sync

**Expected Behavior**:
- Local selection updates instantly
- Firebase syncs are throttled (not 20 separate calls)
- No visual lag or "stuttering"

**Implementation**:

```typescript
// In CanvasStage.tsx, throttle selection sync:
const throttledSelectionSync = useRef(
  throttle((selectedIds: string[]) => {
    if (currentUser) {
      updateSelection('main', currentUser.uid, selectedIds);
    }
  }, 100)  // 100ms throttle
).current;

useEffect(() => {
  throttledSelectionSync(selectedIds);
}, [selectedIds]);
```

---

## Performance & Efficiency

### Benchmark Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Group drag (10 objects) | 60 FPS | Chrome DevTools Performance tab |
| Group drag (50 objects) | 45 FPS | Chrome DevTools Performance tab |
| Drag-to-select (100 objects checked) | < 16ms | `console.time()` in collision loop |
| Firebase batch update (10 objects) | < 200ms | Network tab latency |
| Selection rectangle render | < 5ms | React Profiler |

### Optimization Strategies

#### 1. Use `batchDraw()` Instead of `draw()`

**Current** (inefficient):

```typescript
layer.draw();  // Immediately redraws entire layer
```

**Optimized**:

```typescript
layer.batchDraw();  // Schedules redraw on next frame (60 FPS throttled)
```

**Why**: `batchDraw()` coalesces multiple draw calls into single render frame.

#### 2. Disable `perfectDrawEnabled` for Performance

**Current** (slower):

```typescript
<Rect
  // ... props ...
  perfectDrawEnabled={true}  // Default: Pixel-perfect rendering
/>
```

**Optimized**:

```typescript
<Rect
  // ... props ...
  perfectDrawEnabled={false}  // Faster: Skips sub-pixel alignment
/>
```

**Why**: `perfectDrawEnabled={false}` improves render speed by ~20% with minimal visual difference.

#### 3. Use `transformsEnabled` to Limit Transform Calculations

**Current** (calculates all transforms):

```typescript
<Rect
  // No transformsEnabled specified
/>
```

**Optimized**:

```typescript
<Rect
  transformsEnabled="position"  // Only calculate position, skip rotation/scale
/>
```

**Why**: Reduces matrix calculations during drag operations.

#### 4. Memoize Collision Detection Results

**Current** (recalculates every frame):

```typescript
const selectedIds = objects.filter(obj =>
  objectIntersectsRect(obj, selectionRect)
).map(obj => obj.id);
```

**Optimized**:

```typescript
// Only recalculate when selectionRect changes significantly
const selectedIds = useMemo(() => {
  if (!selectionRect) return [];

  return objects
    .filter(obj => objectIntersectsRect(obj, selectionRect))
    .map(obj => obj.id);
}, [
  objects,
  selectionRect?.x,
  selectionRect?.y,
  selectionRect?.width,
  selectionRect?.height
]);
```

#### 5. Throttle Firebase Syncs

**Current** (syncs every mousemove):

```typescript
function handleGroupDragMove(e) {
  // ... position updates ...
  await batchUpdateCanvasObjects('main', updates);  // Every frame!
}
```

**Optimized**:

```typescript
const throttledSync = throttle(
  (updates) => batchUpdateCanvasObjects('main', updates),
  100  // Max 10 syncs/second
);

function handleGroupDragMove(e) {
  // ... position updates ...
  throttledSync(updates);  // Throttled
}
```

#### 6. Use React.memo for Shape Components

**File**: `src/features/canvas-core/shapes/Rectangle.tsx`

```typescript
export const Rectangle = React.memo(function Rectangle({
  rectangle,
  isSelected,
  isInMultiSelect,
  onSelect,
  remoteDragState,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
}: RectangleProps) {
  // ... component logic ...
}, (prevProps, nextProps) => {
  // Custom comparison for re-render optimization
  return (
    prevProps.rectangle.id === nextProps.rectangle.id &&
    prevProps.rectangle.x === nextProps.rectangle.x &&
    prevProps.rectangle.y === nextProps.rectangle.y &&
    prevProps.rectangle.width === nextProps.rectangle.width &&
    prevProps.rectangle.height === nextProps.rectangle.height &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isInMultiSelect === nextProps.isInMultiSelect &&
    prevProps.remoteDragState?.userId === nextProps.remoteDragState?.userId
  );
});
```

---

## Testing Checklist

### Unit Tests

- [ ] `rectanglesIntersect()` correctly detects AABB collision
- [ ] `circleRectIntersects()` correctly detects circle-rect collision
- [ ] `getSelectionBounds()` correctly calculates multi-object bounds
- [ ] `batchUpdateCanvasObjects()` constructs correct Firebase multi-path update

### Integration Tests

- [ ] Shift+click adds/removes objects from selection
- [ ] Group drag moves all selected objects together
- [ ] Group drag maintains relative positions
- [ ] Group drag syncs to Firebase as single atomic update
- [ ] Drag-to-select creates selection rectangle
- [ ] Drag-to-select selects overlapping objects
- [ ] Drag-to-select works with zoom
- [ ] Drag-to-select works with pan

### Collaboration Tests

- [ ] User A's group drag visible to User B in real-time
- [ ] User B sees smooth interpolation (no flickering)
- [ ] User A's drag-to-select doesn't affect User B's selection
- [ ] Remote user indicator shows during group drag

### Performance Tests

- [ ] Group drag 10 objects: 60 FPS maintained
- [ ] Group drag 50 objects: > 45 FPS maintained
- [ ] Drag-to-select with 100 objects: < 16ms collision check
- [ ] Firebase batch update latency: < 200ms

### Edge Case Tests

- [ ] Group drag with remote drag in progress: Blocked or filtered
- [ ] Drag-to-select with shape creation tool: Shape creation takes precedence
- [ ] Empty selection rectangle (click without drag): Selection cleared
- [ ] Group drag at 0.1x zoom: Smooth performance
- [ ] Drag-to-select extending outside stage: Handled gracefully
- [ ] Network disconnection during group drag: Recovers on reconnection
- [ ] Rapid multi-select (20 objects in 2s): No lag or stuttering

---

## Implementation Timeline

### Phase 1: Group Drag Foundation (2-3 hours)
- Disable individual dragging in multi-select
- Create `useGroupDrag` hook
- Add `batchUpdateCanvasObjects` to Firebase service
- Basic integration into CanvasStage

### Phase 2: Group Drag Polish (1-2 hours)
- Visual feedback (bounding box)
- Edge case handling
- Performance optimization

### Phase 3: Drag-to-Select Foundation (2-3 hours)
- Create `useDragToSelect` hook
- Collision detection utilities
- Basic integration into CanvasStage

### Phase 4: Drag-to-Select Polish (1-2 hours)
- Accurate collision for all shape types
- Zoom/pan coordinate transformation
- Edge case handling

### Phase 5: Testing & Refinement (2-3 hours)
- Unit tests
- Integration tests
- Performance benchmarking
- Bug fixes

**Total Estimated Time**: 8-13 hours

---

## Success Criteria

### Group Drag
- ✅ Multiple selected objects move together as a unit
- ✅ Relative positions maintained during drag
- ✅ Single atomic Firebase update (visible in Network tab)
- ✅ No flickering or "snapping" for other users
- ✅ 60 FPS maintained for ≤ 20 objects

### Drag-to-Select
- ✅ Blue selection rectangle appears during drag
- ✅ Overlapping objects get selected on mouseup
- ✅ Works correctly with zoom/pan transformations
- ✅ Doesn't interfere with shape creation tools
- ✅ < 16ms collision detection for 100 objects

### Collaboration
- ✅ Other users see smooth real-time updates
- ✅ No sync conflicts or drift
- ✅ Graceful handling of network issues

---

## References

### Figma Behavior Documentation
- Multi-select: Shift+click or drag-to-select
- Group drag: All objects move together maintaining relative positions
- Selection rectangle: Blue dashed box, semi-transparent fill
- Priority: Shift+click > drag-to-select > shape creation

### Konva.js Documentation
- Drag and Drop: https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html
- Event Handling: https://konvajs.org/docs/events/Binding_Events.html
- Groups: https://konvajs.org/docs/groups_and_layers/Groups.html
- Performance: https://konvajs.org/docs/performance/All_Performance_Tips.html

### Firebase Realtime Database
- Multi-path Updates: https://firebase.google.com/docs/database/web/read-and-write#update_multiple_locations
- Best Practices: https://firebase.google.com/docs/database/usage/optimize

---

**Last Updated**: 2025-10-14
**Author**: CollabCanvas Development Team
**Status**: Ready for Implementation
