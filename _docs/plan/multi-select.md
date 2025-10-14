# Multi-Select Implementation Plan

**Progress Tracker:** Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:** Check off `[ ]` boxes as you complete and verify each task. Don't skip ahead—each task builds foundation for the next.

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

# Multi-Select Feature (8-12 hours)

**Goal:** Implement Figma-style multi-select with shift+click and drag-to-select rectangle, allowing users to select and manipulate multiple objects as a group.

**Key Features:**
- Shift+click to add/remove objects from selection
- Drag-to-select rectangle (visual feedback as you drag)
- Selected objects maintain relative positions during group operations
- Properties panel shows only common editable properties
- Real-time sync of multi-select state across users

---

## 3.1 Update Canvas Types for Multi-Select (30 minutes)

### 3.1.1 Add Multi-Select State to Canvas Store
- [ ] Update `src/stores/canvasStore.ts`
  - Change `selectedId: string | null` to `selectedIds: string[]`
  - Add JSDoc comment explaining multi-select behavior
  - Update initial state: `selectedIds: []`
  - **Success:** Store now supports array of selected IDs
  - **Test:** No TypeScript errors after change
  - **Edge Case:** All existing code referencing `selectedId` will need updates

### 3.1.2 Update Canvas Store Actions for Multi-Select
- [ ] Update `canvasStore.ts` actions
  - Rename `selectObject(id: string | null)` → `selectObjects(ids: string[])`
  - Add `toggleSelection(id: string)`: adds if not in array, removes if present
  - Add `addToSelection(id: string)`: adds to selection without clearing
  - Add `removeFromSelection(id: string)`: removes from selection
  - Update `clearSelection()`: sets `selectedIds: []`
  - Update `removeObject(id)`: filter out from selectedIds if present
  - **Success:** All selection methods support multi-select
  - **Test:** Call each action, verify state updates correctly
  - **Edge Case:** Deleting an object should remove it from selection

### 3.1.3 Create Helper Functions for Multi-Select
- [ ] Create `src/features/canvas-core/utils/multiSelect.ts`
  - `isSelected(objectId: string, selectedIds: string[]): boolean`
  - `isMultiSelect(selectedIds: string[]): boolean` (returns true if length > 1)
  - `getSelectionBounds(objects: CanvasObject[], selectedIds: string[]): { x, y, width, height } | null`
    - Calculate bounding box containing all selected objects
    - Handle rectangles (x, y, width, height)
    - Handle circles (x - radius, y - radius, radius * 2, radius * 2)
    - Handle text (x, y, width, height)
    - Returns null if no selection
  - `getSelectedObjects(objects: CanvasObject[], selectedIds: string[]): CanvasObject[]`
  - Add JSDoc comments for all functions
  - **Success:** Helper functions exported and documented
  - **Test:** Call functions with test data, verify correct outputs
  - **Edge Case:** Mixed shape types in selection, empty selection

### 3.1.4 Update Firebase Selection Sync Types
- [ ] Update `src/types/canvas.types.ts`
  - Change `SelectionState.objectId: string | null` → `objectIds: string[]`
  - Add JSDoc explaining multi-select in remote selections
  - **Success:** Types support multi-select
  - **Test:** No TypeScript errors
  - **Edge Case:** Backward compatibility with existing Firebase data

### 3.1.5 Update Firebase Selection Service
- [ ] Update `src/lib/firebase/selectionService.ts` (or create if doesn't exist)
  - Update `updateSelection(canvasId, userId, objectIds: string[]): Promise<void>`
  - Change from single objectId to array of objectIds
  - **Success:** Selection service syncs arrays
  - **Test:** Update selection → check Realtime DB → array stored
  - **Edge Case:** Empty array (no selection) should sync correctly

### 3.1.6 Update Remote Selection Hook
- [ ] Update `features/collaboration/hooks/useRemoteSelections.ts`
  - Parse `objectIds: string[]` instead of single objectId
  - Return array of selections (user can select multiple objects)
  - Filter out own user's selection
  - **Success:** Hook returns multi-select data
  - **Test:** Log remote selections, verify arrays
  - **Edge Case:** User with no selection (empty array)

---

## 3.2 Update Shape Components for Multi-Select (1-2 hours)

### 3.2.1 Update Rectangle Component Selection Logic
- [ ] Update `features/canvas-core/shapes/Rectangle.tsx`
  - Change prop from `isSelected: boolean` to `isSelected: boolean` (keep same, compute in parent)
  - Add new prop: `isInMultiSelect: boolean` (true if multiple objects selected)
  - Update onClick handler:
    ```typescript
    onClick: (e) => {
      e.cancelBubble = true;
      if (e.evt.shiftKey) {
        toggleSelection(rectangle.id);
      } else {
        selectObjects([rectangle.id]);
      }
    }
    ```
  - Update selection border color:
    - If `isInMultiSelect === true`: use lighter blue (#38bdf8) to indicate group
    - If `isSelected && !isInMultiSelect`: use primary blue (#0ea5e9)
  - **Success:** Rectangle supports shift+click
  - **Test:** Shift+click rectangle → adds to selection
  - **Edge Case:** Shift+click already selected object → deselects it

### 3.2.2 Update Circle Component Selection Logic
- [ ] Update `features/canvas-core/shapes/Circle.tsx`
  - Same changes as Rectangle (add isInMultiSelect prop)
  - Same onClick logic with shift+click
  - Same selection border colors
  - **Success:** Circle supports multi-select
  - **Test:** Shift+click circle → adds to selection
  - **Edge Case:** Mix rectangles and circles in selection

### 3.2.3 Update TextShape Component Selection Logic
- [ ] Update `features/canvas-core/shapes/TextShape.tsx`
  - Same changes as Rectangle and Circle
  - Same onClick logic
  - Same selection border colors
  - **Success:** Text supports multi-select
  - **Test:** Shift+click text → adds to selection
  - **Edge Case:** Mix all three shape types

### 3.2.4 Update CanvasStage to Pass Multi-Select Props
- [ ] Update `features/canvas-core/components/CanvasStage.tsx`
  - Get `selectedIds` from store (not selectedId)
  - Create helper: `const isInMultiSelect = selectedIds.length > 1`
  - Pass to each shape:
    - `isSelected={selectedIds.includes(obj.id)}`
    - `isInMultiSelect={isInMultiSelect && selectedIds.includes(obj.id)}`
  - **Success:** All shapes receive correct props
  - **Test:** Select multiple → all show multi-select border
  - **Edge Case:** Single selection should not show multi-select styling

---

## 3.3 Implement Drag-to-Select Rectangle (2-3 hours)

### 3.3.1 Create Drag-to-Select Hook
- [ ] Create `features/canvas-core/hooks/useDragToSelect.ts`
  - State:
    - `isSelecting: boolean` (true during drag)
    - `selectionStart: { x: number; y: number } | null`
    - `selectionEnd: { x: number; y: number } | null`
    - `selectionRect: { x, y, width, height } | null`
  - Logic:
    - `startSelection(canvasCoords: { x, y })`: sets start point, isSelecting = true
    - `updateSelection(canvasCoords: { x, y })`: updates end point, calculates rect
    - `finishSelection()`: finds objects in rect, updates selection, resets state
    - `cancelSelection()`: resets state without selecting
  - **Selection Rectangle Calculation:**
    ```typescript
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    ```
  - Export hook: `export function useDragToSelect()`
  - **Success:** Hook manages drag-to-select state
  - **Test:** Log state during drag, verify rect calculations
  - **Edge Case:** Drag in all 4 directions (up-left, up-right, down-left, down-right)

### 3.3.2 Implement Collision Detection
- [ ] Add to `useDragToSelect.ts`
  - Create `isObjectInSelectionRect(object: CanvasObject, rect: { x, y, width, height }): boolean`
  - For rectangles:
    ```typescript
    // Check if rectangles overlap
    return !(
      object.x + object.width < rect.x ||
      object.x > rect.x + rect.width ||
      object.y + object.height < rect.y ||
      object.y > rect.y + rect.height
    );
    ```
  - For circles:
    ```typescript
    // Check if circle overlaps with rectangle
    const closestX = Math.max(rect.x, Math.min(object.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(object.y, rect.y + rect.height));
    const distX = object.x - closestX;
    const distY = object.y - closestY;
    return (distX * distX + distY * distY) < (object.radius * object.radius);
    ```
  - For text: same as rectangles
  - **Success:** Collision detection works for all shape types
  - **Test:** Create selection rect, verify correct objects detected
  - **Edge Case:** Partially overlapping objects (should select if any overlap)

### 3.3.3 Integrate Drag-to-Select into CanvasStage
- [ ] Update `CanvasStage.tsx`
  - Import useDragToSelect hook
  - Call hook: `const { isSelecting, selectionRect, startSelection, updateSelection, finishSelection } = useDragToSelect()`
  - Update handleStageMouseDown:
    ```typescript
    // Only start selection if:
    // - Move/select tool is active
    // - NOT shift key (shift is for adding to selection)
    // - Clicked on empty canvas (not on object)
    if (activeTool === 'move' && !e.evt.shiftKey && clickedOnEmpty) {
      const canvasCoords = screenToCanvasCoords(stage, pointerPos);
      startSelection(canvasCoords);
    }
    ```
  - Update handleMouseMove:
    ```typescript
    if (isSelecting) {
      const canvasCoords = screenToCanvasCoords(stage, pointerPos);
      updateSelection(canvasCoords);
    }
    ```
  - Update handleMouseUp:
    ```typescript
    if (isSelecting) {
      finishSelection();
    }
    ```
  - **Success:** Drag-to-select triggers on canvas drag
  - **Test:** Click-drag on empty canvas → selection starts
  - **Edge Case:** Should not trigger when dragging objects, should not trigger with shift key

### 3.3.4 Render Selection Rectangle Visual
- [ ] Update `CanvasStage.tsx` rendering
  - In Objects Layer, add selection rectangle:
    ```tsx
    {isSelecting && selectionRect && (
      <Rect
        x={selectionRect.x}
        y={selectionRect.y}
        width={selectionRect.width}
        height={selectionRect.height}
        fill="rgba(14, 165, 233, 0.1)"  // Light blue fill
        stroke="#0ea5e9"
        strokeWidth={2 / zoom}  // Maintain width at different zoom levels
        dash={[5 / zoom, 5 / zoom]}
        listening={false}
      />
    )}
    ```
  - **Success:** Blue dashed rectangle shows during drag
  - **Test:** Drag on canvas → see blue selection box
  - **Edge Case:** Rectangle should render correctly at any zoom level

### 3.3.5 Highlight Objects as Selection Rectangle Overlaps Them
- [ ] Update `useDragToSelect.ts`
  - State: `hoveredIds: string[]` (objects currently inside selection rect)
  - During updateSelection:
    ```typescript
    const objectsInRect = objects.filter(obj =>
      isObjectInSelectionRect(obj, calculatedRect)
    );
    setHoveredIds(objectsInRect.map(obj => obj.id));
    ```
  - Export hoveredIds from hook
  - **Success:** Hook tracks which objects are hovered
  - **Test:** Drag over objects → hoveredIds updates

- [ ] Update `CanvasStage.tsx` to pass hover state
  - Get hoveredIds from useDragToSelect
  - Pass to each shape: `isHovered={hoveredIds.includes(obj.id)}`
  - **Success:** Shapes know when they're hovered by selection

- [ ] Update shape components (Rectangle, Circle, TextShape)
  - Add prop: `isHovered?: boolean`
  - When isHovered === true:
    - Add subtle highlight: stroke with light blue, opacity 0.5
  - **Success:** Objects highlight as selection rect passes over them
  - **Test:** Drag selection rect over shapes → they highlight
  - **Edge Case:** Highlight should be different from selection border

### 3.3.6 Finalize Selection on Mouse Up
- [ ] Update `useDragToSelect.ts` finishSelection
  - Implementation:
    ```typescript
    function finishSelection() {
      if (!selectionRect) {
        resetState();
        return;
      }

      // Find all objects in final selection rect
      const objectsInRect = objects.filter(obj =>
        isObjectInSelectionRect(obj, selectionRect)
      );

      // Update selection
      if (objectsInRect.length > 0) {
        selectObjects(objectsInRect.map(obj => obj.id));
      } else {
        clearSelection();
      }

      resetState();
    }
    ```
  - **Success:** Mouse up selects all objects in rectangle
  - **Test:** Drag over 3 objects → release → all 3 selected
  - **Edge Case:** Drag with no objects → clears selection

### 3.3.7 Test Drag-to-Select Thoroughly
- [ ] Manual testing checklist:
  - Click-drag on empty canvas → selection rectangle appears
  - Drag over 1 object → object highlights → release → object selected
  - Drag over 5 objects → all highlight → release → all selected
  - Drag in all 4 directions (up-left, up-right, down-left, down-right) → works
  - Drag over mix of rectangles, circles, text → all selected
  - Drag with very small rectangle (< 10px) → still works
  - Drag-to-select while zoomed in (2x) → works correctly
  - Drag-to-select while zoomed out (0.5x) → works correctly
  - Drag-to-select with canvas panned → coordinates correct
  - **Success:** All drag-to-select scenarios work perfectly
  - **Test:** 60 FPS during drag, selection rect smooth
  - **Edge Case:** Partially overlapping objects should be selected

---

## 3.4 Group Operations - Move Multiple Objects (1-2 hours)

### 3.4.1 Calculate Group Bounding Box
- [ ] Update `multiSelect.ts` helper
  - Implement `getSelectionBounds()` fully:
    ```typescript
    export function getSelectionBounds(
      objects: CanvasObject[],
      selectedIds: string[]
    ): { x: number; y: number; width: number; height: number } | null {
      const selected = objects.filter(obj => selectedIds.includes(obj.id));
      if (selected.length === 0) return null;

      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      selected.forEach(obj => {
        if (obj.type === 'rectangle') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + obj.width);
          maxY = Math.max(maxY, obj.y + obj.height);
        } else if (obj.type === 'circle') {
          minX = Math.min(minX, obj.x - obj.radius);
          minY = Math.min(minY, obj.y - obj.radius);
          maxX = Math.max(maxX, obj.x + obj.radius);
          maxY = Math.max(maxY, obj.y + obj.radius);
        } else if (obj.type === 'text') {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
          maxX = Math.max(maxX, obj.x + obj.width);
          maxY = Math.max(maxY, obj.y + obj.height);
        }
      });

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
    ```
  - **Success:** Bounding box calculated correctly
  - **Test:** Select 3 objects → log bounds → correct min/max
  - **Edge Case:** Mixed shape types, objects at negative coordinates

### 3.4.2 Render Group Bounding Box
- [ ] Update `CanvasStage.tsx`
  - Import getSelectionBounds helper
  - Calculate bounds when multiple objects selected:
    ```typescript
    const selectionBounds = isInMultiSelect
      ? getSelectionBounds(objects, selectedIds)
      : null;
    ```
  - Render bounding box in Objects Layer:
    ```tsx
    {selectionBounds && (
      <Rect
        x={selectionBounds.x}
        y={selectionBounds.y}
        width={selectionBounds.width}
        height={selectionBounds.height}
        stroke="#0ea5e9"
        strokeWidth={2 / zoom}
        dash={[10 / zoom, 5 / zoom]}
        listening={false}
      />
    )}
    ```
  - **Success:** Blue dashed box appears around multi-selection
  - **Test:** Select 3 objects → see bounding box
  - **Edge Case:** Bounding box updates when objects move

### 3.4.3 Create Group Drag Handler
- [ ] Create `features/canvas-core/hooks/useGroupDrag.ts`
  - State:
    - `isDragging: boolean`
    - `dragStart: { x, y } | null` (canvas coords)
    - `initialPositions: Map<string, { x, y }>` (store each object's start position)
  - Functions:
    - `startGroupDrag(canvasCoords, selectedObjects)`
    - `updateGroupDrag(canvasCoords)`: calculates delta, updates all objects
    - `endGroupDrag()`: syncs to Firebase
  - **Delta Calculation:**
    ```typescript
    const deltaX = currentPos.x - dragStart.x;
    const deltaY = currentPos.y - dragStart.y;

    selectedObjects.forEach(obj => {
      const initialPos = initialPositions.get(obj.id);
      updateObject(obj.id, {
        x: initialPos.x + deltaX,
        y: initialPos.y + deltaY,
      });
    });
    ```
  - **Success:** Hook manages group drag
  - **Test:** Log delta during drag
  - **Edge Case:** Objects maintain relative positions

### 3.4.4 Add Invisible Drag Target for Group
- [ ] Update `CanvasStage.tsx`
  - Import useGroupDrag hook
  - When `isInMultiSelect === true`, render invisible Rect over bounding box:
    ```tsx
    {selectionBounds && (
      <Rect
        x={selectionBounds.x}
        y={selectionBounds.y}
        width={selectionBounds.width}
        height={selectionBounds.height}
        fill="transparent"
        draggable={activeTool === 'move'}
        onDragStart={(e) => {
          const canvasCoords = screenToCanvasCoords(stage, { x: e.target.x(), y: e.target.y() });
          startGroupDrag(canvasCoords, getSelectedObjects(objects, selectedIds));
        }}
        onDragMove={(e) => {
          const canvasCoords = screenToCanvasCoords(stage, { x: e.target.x(), y: e.target.y() });
          updateGroupDrag(canvasCoords);
        }}
        onDragEnd={() => {
          endGroupDrag();
        }}
      />
    )}
    ```
  - **Success:** Dragging bounding box moves all objects together
  - **Test:** Select 3 objects → drag → all move, maintain spacing
  - **Edge Case:** Individual objects should not be draggable when in multi-select

### 3.4.5 Disable Individual Drag in Multi-Select
- [ ] Update Rectangle.tsx, Circle.tsx, TextShape.tsx
  - Change draggable logic:
    ```typescript
    draggable={isSelected && !isInMultiSelect && activeTool === 'move'}
    ```
  - **Success:** Can't drag individual objects in group
  - **Test:** Select 3 objects → try dragging one → doesn't move
  - **Edge Case:** Single-selected object should still be individually draggable

### 3.4.6 Test Group Movement
- [ ] Manual testing:
  - Select 2 rectangles → drag group → both move together
  - Select 1 rectangle + 1 circle → drag → both move, spacing maintained
  - Select 5 mixed shapes → drag → all move as unit
  - Drag group 100px right → verify all moved exactly 100px
  - Drag group while zoomed in/out → works correctly
  - Drag group with canvas panned → coordinates correct
  - **Success:** Group movement perfect, objects never drift apart
  - **Test:** After drag, measure distances between objects → unchanged
  - **Edge Case:** Rapid drag movements, drag near canvas edge

---

## 3.5 Group Operations - Delete & Duplicate (1 hour)

### 3.5.1 Update Delete Operation for Multi-Select
- [ ] Update `features/toolbar/components/Toolbar.tsx` (or wherever delete handler is)
  - Update handleDelete:
    ```typescript
    const handleDelete = () => {
      if (selectedIds.length === 0) return;

      // Delete all selected objects
      selectedIds.forEach(id => removeObject(id));
      clearSelection();

      // Sync to Firebase
      debouncedSyncCanvas();
    };
    ```
  - Update delete button disabled state:
    ```typescript
    disabled={selectedIds.length === 0}
    ```
  - **Success:** Delete button removes all selected objects
  - **Test:** Select 3 objects → click delete → all removed
  - **Edge Case:** Delete while objects are being dragged

### 3.5.2 Update Delete Keyboard Shortcut
- [ ] Update `features/toolbar/hooks/useToolShortcuts.ts`
  - Update Delete/Backspace handler:
    ```typescript
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => removeObject(id));
        clearSelection();
        e.preventDefault();
      }
    }
    ```
  - **Success:** Delete key removes all selected objects
  - **Test:** Select 5 objects → press Delete → all removed
  - **Edge Case:** Don't trigger when typing in input

### 3.5.3 Update Duplicate Operation for Multi-Select
- [ ] Update `Toolbar.tsx` handleDuplicate
  - Implementation:
    ```typescript
    const handleDuplicate = () => {
      if (selectedIds.length === 0) return;

      const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
      const newIds: string[] = [];

      selectedObjects.forEach(obj => {
        const duplicate = duplicateObject(obj);
        addObject(duplicate);
        newIds.push(duplicate.id);
      });

      // Select the duplicates
      selectObjects(newIds);

      // Sync to Firebase
      debouncedSyncCanvas();
    };
    ```
  - **Success:** Duplicate creates copies of all selected objects
  - **Test:** Select 3 objects → click duplicate → 3 copies appear, offset by 20,20
  - **Edge Case:** Duplicated objects maintain relative positions

### 3.5.4 Update Duplicate Keyboard Shortcut
- [ ] Update `useToolShortcuts.ts`
  - Update Cmd/Ctrl+D handler for multi-select
  - Same logic as button handler
  - **Success:** Cmd+D duplicates all selected objects
  - **Test:** Select 4 objects → Cmd+D → 4 copies appear
  - **Edge Case:** Duplicates should be selected, originals deselected

### 3.5.5 Test Delete and Duplicate with Multi-Select
- [ ] Manual testing:
  - Select 1 object → delete → removed
  - Select 5 objects → delete → all removed
  - Select 3 objects → duplicate → 3 copies, offset correctly
  - Select 10 objects → Cmd+D → 10 copies appear
  - Select mix of shapes → duplicate → all types duplicated correctly
  - **Success:** Delete and duplicate work flawlessly with multi-select
  - **Test:** Operations sync to Firebase, other users see changes
  - **Edge Case:** Duplicate near canvas edge (copies should still be visible)

---

## 3.6 Properties Panel for Multi-Select (2-3 hours)

### 3.6.1 Analyze Common Properties Across Selected Objects
- [ ] Create `features/canvas-core/utils/commonProperties.ts`
  - Function: `getCommonProperties(objects: CanvasObject[], selectedIds: string[]): CommonProperties | null`
  - Return type:
    ```typescript
    interface CommonProperties {
      // Position (always available)
      position: 'Mixed' | { x: number; y: number };

      // Properties available when all selected are same type
      type: ShapeType | 'mixed';

      // Fill color (if all have same fill)
      fill?: string | 'Mixed';

      // Opacity (if all have same opacity)
      opacity?: number | 'Mixed';

      // Stroke (if all have stroke enabled)
      stroke?: string | 'Mixed';
      strokeWidth?: number | 'Mixed';

      // Rotation (if all have rotation)
      rotation?: number | 'Mixed';
    }
    ```
  - Logic:
    - If all selected objects have same property value → return value
    - If selected objects have different values → return 'Mixed'
    - If property not applicable to all shapes → undefined
  - **Success:** Function identifies common properties
  - **Test:** Select 3 rectangles with same fill → fill returned, Select 3 shapes with different fills → 'Mixed'
  - **Edge Case:** Mixed shape types (rectangle + circle), empty selection

### 3.6.2 Create Multi-Select Properties Panel Component
- [ ] Create `features/toolbar/components/MultiSelectProperties.tsx`
  - Component structure:
    ```tsx
    export function MultiSelectProperties({
      selectedObjects,
      onUpdate,
    }: {
      selectedObjects: CanvasObject[];
      onUpdate: (updates: Partial<CanvasObject>) => void;
    }) {
      const commonProps = getCommonProperties(selectedObjects);

      return (
        <div className="space-y-4">
          <div className="text-sm font-medium">
            {selectedObjects.length} objects selected
          </div>

          {/* Position section - always available */}
          <PropertySection title="Position">
            <PropertyInput
              label="X"
              value={commonProps.position === 'Mixed' ? 'Mixed' : commonProps.position.x}
              onChange={(x) => {/* update all */}}
              disabled={commonProps.position === 'Mixed'}
            />
            <PropertyInput
              label="Y"
              value={commonProps.position === 'Mixed' ? 'Mixed' : commonProps.position.y}
              onChange={(y) => {/* update all */}}
              disabled={commonProps.position === 'Mixed'}
            />
          </PropertySection>

          {/* Fill - if available */}
          {commonProps.fill !== undefined && (
            <PropertySection title="Fill">
              <ColorPicker
                value={commonProps.fill}
                onChange={(fill) => onUpdate({ fill })}
              />
            </PropertySection>
          )}

          {/* Opacity - if available */}
          {commonProps.opacity !== undefined && (
            <PropertySection title="Opacity">
              <Slider
                value={commonProps.opacity === 'Mixed' ? 50 : commonProps.opacity * 100}
                onChange={(opacity) => onUpdate({ opacity: opacity / 100 })}
              />
            </PropertySection>
          )}

          {/* Operations always available */}
          <PropertySection title="Operations">
            <Button onClick={handleDuplicate}>Duplicate</Button>
            <Button onClick={handleDelete} variant="destructive">Delete</Button>
          </PropertySection>
        </div>
      );
    }
    ```
  - **Success:** Panel shows appropriate properties
  - **Test:** Render with different selections
  - **Edge Case:** All same type vs mixed types

### 3.6.3 Handle Property Updates for Multiple Objects
- [ ] Update `MultiSelectProperties.tsx` with update logic
  - onUpdate handler:
    ```typescript
    function onUpdate(updates: Partial<CanvasObject>) {
      selectedObjects.forEach(obj => {
        updateObject(obj.id, updates);
      });

      // Sync to Firebase
      debouncedSyncCanvas();
    }
    ```
  - **Success:** Changing property updates all selected objects
  - **Test:** Select 3 rectangles → change fill to red → all turn red
  - **Edge Case:** Update should preserve object-specific properties

### 3.6.4 Show "Mixed" State for Differing Values
- [ ] Update `MultiSelectProperties.tsx` inputs
  - When value === 'Mixed':
    - Input shows placeholder "Mixed"
    - Input is slightly dimmed (opacity-70)
    - Tooltip: "Selected objects have different values"
  - User can still edit:
    - Typing new value applies to all objects
    - Editing mixed value unifies all to new value
  - **Success:** Mixed state clearly indicated
  - **Test:** Select objects with different fills → shows "Mixed"
  - **Edge Case:** Editing mixed value should confirm with user (optional)

### 3.6.5 Integrate Multi-Select Panel into PropertiesPanel
- [ ] Update `features/toolbar/components/PropertiesPanel.tsx` (or main properties component)
  - Conditional rendering:
    ```tsx
    {selectedIds.length === 0 && (
      <EmptyState />
    )}

    {selectedIds.length === 1 && (
      <SingleObjectProperties object={selectedObject} />
    )}

    {selectedIds.length > 1 && (
      <MultiSelectProperties
        selectedObjects={selectedObjects}
        onUpdate={handleBulkUpdate}
      />
    )}
    ```
  - **Success:** Panel switches based on selection count
  - **Test:** Select 0 → empty, select 1 → single props, select 3 → multi props
  - **Edge Case:** Panel should update immediately when selection changes

### 3.6.6 Simplify Properties for Multi-Select (Figma-style)
- [ ] Review and remove complex properties from multi-select
  - **Always show:**
    - Position (X, Y) - if all same, shows value; if different, shows "Mixed"
    - Duplicate button
    - Delete button
  - **Show only if all selected are same type:**
    - Rectangle: Fill, Stroke, Corner Radius, Dimensions (W, H)
    - Circle: Fill, Stroke, Radius
    - Text: Fill, Font Size, Font Family (simplified)
  - **Never show in multi-select:**
    - Layout/alignment (too complex for MVP)
    - Advanced typography (line height, letter spacing)
    - Effects (shadows, etc.)
  - **Success:** Clean, simple multi-select panel
  - **Test:** Select mixed types → only position + operations shown
  - **Edge Case:** All rectangles → show rectangle-specific properties

### 3.6.7 Test Properties Panel with Multi-Select
- [ ] Manual testing:
  - Select 1 object → see full properties
  - Select 2 rectangles with same fill → fill shown
  - Select 2 rectangles with different fills → "Mixed" shown
  - Change fill in multi-select → both update
  - Select circle + rectangle → only position + operations shown
  - Select 5 text objects → change font size → all update
  - **Success:** Properties panel adapts perfectly to selection
  - **Test:** All updates sync to Firebase
  - **Edge Case:** Rapid property changes on large selection (10+ objects)

---

## 3.7 Real-Time Multi-Select Sync (1-2 hours)

### 3.7.1 Update Firebase Selection Service for Arrays
- [ ] Verify `lib/firebase/selectionService.ts` handles arrays
  - Function: `updateSelection(canvasId, userId, objectIds: string[])`
  - Realtime DB structure:
    ```
    /canvases/main/selections/{userId}/
      objectIds: string[]  // Array of selected IDs
      timestamp: number
    ```
  - **Success:** Arrays sync to Realtime DB
  - **Test:** Select 3 objects → check Firebase → see array [id1, id2, id3]
  - **Edge Case:** Empty array (no selection) should sync

### 3.7.2 Sync Local Multi-Select to Firebase
- [ ] Update `CanvasStage.tsx` or create useEffect
  - Watch selectedIds changes:
    ```typescript
    useEffect(() => {
      if (!currentUser) return;

      updateSelection('main', currentUser.uid, selectedIds);
    }, [selectedIds, currentUser]);
    ```
  - **Success:** Every selection change syncs
  - **Test:** Select objects → check Realtime DB → array matches
  - **Edge Case:** Rapid selection changes (throttle if needed)

### 3.7.3 Render Remote Multi-Select Overlays
- [ ] Update `features/collaboration/components/SelectionOverlay.tsx`
  - Handle multiple objects from same user:
    - Render overlay for each selected object
    - Show user badge only on first object or bounding box
  - Bounding box option:
    - Calculate bounds of user's entire selection
    - Render dashed box in user's color
  - **Success:** Other users' multi-selections visible
  - **Test:** User A selects 3 objects → User B sees 3 selection overlays
  - **Edge Case:** Overlays should not interfere with local selection

### 3.7.4 Add User Badge to Multi-Select Bounding Box
- [ ] Update `SelectionOverlay.tsx` for group selections
  - When user has multiple objects selected:
    - Calculate bounding box
    - Render box in user's color (dashed, lighter opacity)
    - Show user badge in top-right corner of bounding box
    - Badge contains username and count: "John (3)"
  - **Success:** Clear visual of who selected what
  - **Test:** User A selects 5 → User B sees "User A (5)" badge
  - **Edge Case:** Badge positioning at different zoom levels

### 3.7.5 Test Real-Time Multi-Select Sync
- [ ] Open 2 browser windows:
  - Window A (User A):
    - Select 3 objects
    - Window B should see User A's selection overlay on all 3
  - Window B (User B):
    - Select 2 different objects
    - Window A should see User B's selection
  - Both users:
    - Both select overlapping objects
    - Each should see own selection + other's overlay
  - User A:
    - Deselect all (Escape)
    - Window B should see overlays disappear
  - **Success:** Multi-select syncs perfectly across users
  - **Test:** <100ms latency for selection changes
  - **Edge Case:** Both users selecting same objects simultaneously

---

## 3.8 Keyboard Shortcuts for Multi-Select (30 minutes)

### 3.8.1 Add Select All Shortcut
- [ ] Update `features/toolbar/hooks/useToolShortcuts.ts`
  - Add Cmd/Ctrl+A handler:
    ```typescript
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      const allIds = objects.map(obj => obj.id);
      selectObjects(allIds);
    }
    ```
  - **Success:** Cmd+A selects all objects
  - **Test:** Press Cmd+A → all objects selected
  - **Edge Case:** Don't trigger when input focused

### 3.8.2 Update Escape to Deselect All
- [ ] Verify Escape key handler clears all selections
  - Should call `clearSelection()` (which sets selectedIds to [])
  - **Success:** Escape clears multi-select
  - **Test:** Select 5 objects → Escape → all deselected
  - **Edge Case:** Should work from any state

### 3.8.3 Update Keyboard Shortcuts Documentation
- [ ] Update `src/constants/keyboardShortcuts.ts`
  - Add new shortcuts:
    ```typescript
    { key: 'Shift+Click', action: 'Add/remove from selection', category: 'Selection' },
    { key: 'Click+Drag', action: 'Drag to select multiple', category: 'Selection' },
    { key: 'Cmd/Ctrl+A', action: 'Select all', category: 'Selection' },
    { key: 'Esc', action: 'Deselect all', category: 'Selection' },
    ```
  - **Success:** Documentation updated
  - **Test:** Shortcuts modal shows new shortcuts
  - **Edge Case:** Keep shortcuts organized by category

### 3.8.4 Test All Multi-Select Shortcuts
- [ ] Manual testing:
  - Shift+click object 1 → selected
  - Shift+click object 2 → both selected
  - Shift+click object 1 again → deselected, object 2 still selected
  - Cmd+A → all objects selected
  - Escape → all deselected
  - Delete with multi-select → all deleted
  - Cmd+D with multi-select → all duplicated
  - **Success:** All shortcuts work with multi-select
  - **Test:** Shortcuts don't conflict with other features
  - **Edge Case:** Shortcuts should work at any zoom/pan level

---

## 3.9 Performance Optimization for Large Selections (1 hour)

### 3.9.1 Optimize Group Drag Performance
- [ ] Update `useGroupDrag.ts`
  - Batch state updates:
    ```typescript
    // Instead of individual updateObject calls:
    const updates = selectedObjects.map(obj => ({
      id: obj.id,
      x: initialPositions.get(obj.id).x + deltaX,
      y: initialPositions.get(obj.id).y + deltaY,
    }));

    // Batch update in store
    batchUpdateObjects(updates);
    ```
  - Add to canvasStore: `batchUpdateObjects(updates: Array<{id, ...}>)`
  - **Success:** Single state update instead of N updates
  - **Test:** Drag 50 selected objects → smooth 60 FPS
  - **Edge Case:** Very large selections (100+ objects)

### 3.9.2 Throttle Selection Rectangle Updates
- [ ] Update `useDragToSelect.ts`
  - Throttle updateSelection to 16ms (60 FPS):
    ```typescript
    const throttledUpdateSelection = throttle(updateSelection, 16);
    ```
  - **Success:** Selection rect updates smoothly without lag
  - **Test:** Drag selection over 100 objects → maintains 60 FPS
  - **Edge Case:** Very fast mouse movements

### 3.9.3 Optimize Selection Overlay Rendering
- [ ] Update `SelectionOverlay.tsx`
  - Wrap in React.memo
  - Use shallow comparison for props
  - Only re-render when selection or object changes
  - **Success:** Overlays don't re-render unnecessarily
  - **Test:** Select/deselect objects → no extra renders
  - **Edge Case:** Multiple users with large selections

### 3.9.4 Performance Testing with Large Selections
- [ ] Performance benchmarks:
  - Create 100 objects on canvas
  - Cmd+A to select all
  - Drag group → measure FPS (target: 60 FPS)
  - Drag-to-select over 50 objects → measure FPS
  - Multi-user: Both users select 50 objects → measure FPS
  - Change property on 100 selected objects → measure update time (<100ms)
  - **Success:** Maintains 60 FPS in all scenarios
  - **Test:** Chrome DevTools Performance profiler
  - **Edge Case:** 200+ objects (should gracefully degrade, not crash)

---

## 3.10 Edge Cases & Polish (1-2 hours)

### 3.10.1 Handle Multi-Select During Shape Creation
- [ ] Test and fix:
  - Creating new shape should deselect current selection
  - Update `useShapeCreation.ts` onMouseDown:
    ```typescript
    // When starting to create a shape
    if (activeTool !== 'move' && activeTool !== 'select') {
      clearSelection();
    }
    ```
  - **Success:** Creating shape clears selection
  - **Test:** Select 3 objects → switch to rectangle tool → create → selection cleared
  - **Edge Case:** Shouldn't affect drag-to-select

### 3.10.2 Handle Selection While Zooming/Panning
- [ ] Test edge cases:
  - Select objects → zoom in → selection should remain
  - Select objects → pan canvas → selection should remain
  - Drag-to-select while zoomed in → coordinates correct
  - Shift+click while panned → selection works
  - **Success:** Selection persists through view changes
  - **Test:** All scenarios work correctly
  - **Edge Case:** Extreme zoom levels (0.1x, 5.0x)

### 3.10.3 Handle Deleted Objects in Selection
- [ ] Update store to auto-remove deleted IDs
  - When removeObject called:
    ```typescript
    removeObject: (id) =>
      set((state) => ({
        objects: state.objects.filter((obj) => obj.id !== id),
        selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
      })),
    ```
  - **Success:** Deleted objects removed from selection
  - **Test:** Select 3 → delete 1 → 2 remain selected
  - **Edge Case:** Delete all selected objects → selection empty

### 3.10.4 Handle Shift+Click Edge Cases
- [ ] Test shift+click scenarios:
  - Shift+click already selected object → deselects it (toggle)
  - Shift+click with no prior selection → selects object
  - Shift+click while drag-to-select box is open → cancels box, adds to selection
  - Shift+click on empty canvas → does nothing
  - **Success:** All shift+click cases handled
  - **Test:** All scenarios work intuitively
  - **Edge Case:** Rapid shift+clicking

### 3.10.5 Test Multi-Select with Undo/Redo (Future-Proofing)
- [ ] Document behavior for future undo/redo:
  - Undo group move → all objects return to previous positions
  - Undo multi-delete → all objects restored
  - Undo multi-select → selection state restored
  - Add comments in code for future undo implementation
  - **Success:** Documented for Phase 3
  - **Test:** N/A (undo not implemented yet)
  - **Edge Case:** Note: selection state should be part of undo stack

### 3.10.6 Accessibility for Multi-Select
- [ ] Add ARIA labels and keyboard navigation:
  - Properties panel announces: "3 objects selected"
  - Screen reader announces selection changes
  - Keyboard-only users can:
    - Tab to select objects (if not using canvas)
    - Use arrow keys to move selection (future enhancement)
  - **Success:** Screen reader users can use multi-select
  - **Test:** VoiceOver/NVDA announces selection count
  - **Edge Case:** Screen reader should announce "Mixed" state

### 3.10.7 Visual Polish for Multi-Select
- [ ] Fine-tune visuals:
  - Selection rectangle: smooth anti-aliased edges
  - Multi-select border: slightly different color (#38bdf8 vs #0ea5e9)
  - Group bounding box: longer dashes, more subtle
  - Hover highlights during drag-to-select: 0.3 opacity
  - Remote multi-select overlays: user's color at 0.4 opacity
  - **Success:** Multi-select looks polished and professional
  - **Test:** Compare to Figma's multi-select styling
  - **Edge Case:** Visuals should work on both light and dark backgrounds

---

## 3.11 Final Testing & Validation (1 hour)

### 3.11.1 Comprehensive Multi-Select Testing
- [ ] Complete test scenarios:
  - **Shift+Click:**
    - Shift+click 5 objects individually → all selected
    - Shift+click selected object → deselects
    - Shift+click mix of rectangles, circles, text → all work
  - **Drag-to-Select:**
    - Drag over 10 objects → all selected
    - Drag small box touching 1 object → selected
    - Drag over partially overlapping objects → selected
    - Drag in all 4 directions → works
  - **Group Operations:**
    - Select 5 → drag as group → all move together
    - Select 10 → delete all → removed
    - Select 3 → duplicate → 3 copies appear
  - **Properties Panel:**
    - Select 3 same-type → see type-specific properties
    - Select mixed types → see only common properties
    - Change property → all update
  - **Multi-User:**
    - User A selects 5 → User B sees overlays
    - User B selects 3 → User A sees overlays
    - Both select overlapping objects → both overlays visible
  - **Performance:**
    - Select 50 objects → 60 FPS
    - Drag 50 objects → smooth movement
    - Drag-to-select over 100 objects → no lag
  - **Edge Cases:**
    - Select all (Cmd+A) → all selected
    - Deselect all (Esc) → all deselected
    - Select → zoom → selection persists
    - Select → pan → selection persists
    - Delete object in selection → removed from selection
  - **Success:** All scenarios pass
  - **Test:** No console errors, no visual glitches
  - **Edge Case:** Test with 200+ objects on canvas

### 3.11.2 Cross-Browser Testing
- [ ] Test in multiple browsers:
  - Chrome (primary)
  - Firefox
  - Safari
  - Edge
  - Test shift+click, drag-to-select, shortcuts
  - **Success:** Works consistently across browsers
  - **Test:** All keyboard shortcuts work (platform differences)
  - **Edge Case:** Safari may have different Cmd key behavior

### 3.11.3 Mobile/Touch Testing (if applicable)
- [ ] Test multi-select on mobile:
  - Long-press to start selection?
  - Multi-touch gestures?
  - Properties panel usability on small screens
  - **Success:** Basic multi-select works on mobile
  - **Test:** Touch-friendly selection methods
  - **Edge Case:** May need alternative to shift+click for mobile

### 3.11.4 Performance Profiling
- [ ] Use Chrome DevTools:
  - Record performance while:
    - Selecting 100 objects with drag-to-select
    - Dragging 50 objects as group
    - Changing properties on 50 objects
  - Check:
    - FPS maintains 60
    - No memory leaks
    - No excessive re-renders
  - **Success:** Performance targets met
  - **Test:** Flame chart shows efficient rendering
  - **Edge Case:** Identify any performance bottlenecks

### 3.11.5 Code Quality Review
- [ ] Review all new code:
  - All files under 500 lines
  - All functions have JSDoc comments
  - No console.log statements left
  - TypeScript strict mode passes
  - No 'any' types used
  - All imports use @ alias
  - Barrel exports updated (index.ts files)
  - **Success:** Code meets quality standards
  - **Test:** `npm run build` succeeds with no warnings
  - **Edge Case:** Check for unused imports, unused variables

### 3.11.6 Firebase Sync Validation
- [ ] Verify all Firebase operations:
  - Multi-select syncs to Realtime DB
  - Group move syncs to Firestore/Realtime DB
  - Multi-delete syncs correctly
  - Multi-duplicate syncs correctly
  - Remote multi-selections display correctly
  - **Success:** All sync operations work
  - **Test:** Check Firebase console during operations
  - **Edge Case:** Offline mode, network interruptions

---

## Multi-Select Completion Checklist

**Must pass ALL before feature complete:**

### Functionality
- [ ] Shift+click adds/removes objects from selection
- [ ] Drag-to-select rectangle selects multiple objects
- [ ] Selection rectangle shows visual feedback during drag
- [ ] Objects highlight as selection rectangle overlaps them
- [ ] Selected objects can be dragged as a group, maintaining relative positions
- [ ] Delete removes all selected objects
- [ ] Duplicate creates copies of all selected objects
- [ ] Cmd/Ctrl+A selects all objects
- [ ] Escape deselects all objects
- [ ] Properties panel shows appropriate properties for multi-select
- [ ] "Mixed" state shown when property values differ
- [ ] Changing property in multi-select updates all objects

### Visual & UX
- [ ] Multi-select border uses lighter blue (#38bdf8)
- [ ] Group bounding box rendered with dashed outline
- [ ] Selection rectangle has semi-transparent blue fill
- [ ] Remote multi-selections show user color overlays
- [ ] User badge shows "Username (count)" on multi-select
- [ ] Hover highlights during drag-to-select are subtle
- [ ] Individual objects not draggable when in multi-select

### Performance
- [ ] 60 FPS when selecting 50+ objects
- [ ] 60 FPS when dragging group of 50 objects
- [ ] Drag-to-select over 100 objects maintains 60 FPS
- [ ] Property changes on large selections < 100ms
- [ ] No memory leaks after extended use
- [ ] Batch updates used for group operations

### Real-Time Collaboration
- [ ] Local multi-select syncs to Firebase within 100ms
- [ ] Remote multi-selections display correctly
- [ ] Multiple users can have different multi-selections simultaneously
- [ ] Remote selection overlays show user color and count
- [ ] Selection state persists across page refreshes

### Edge Cases
- [ ] Drag-to-select works in all 4 directions
- [ ] Drag-to-select works at different zoom levels
- [ ] Drag-to-select works with canvas panned
- [ ] Partially overlapping objects are selected
- [ ] Deleting object removes it from selection
- [ ] Creating new shape clears current selection
- [ ] Selection persists during zoom/pan
- [ ] Shift+click already selected object deselects it
- [ ] Empty drag-to-select clears selection
- [ ] Works with mix of rectangles, circles, and text

### Code Quality
- [ ] All files under 500 lines
- [ ] All functions have JSDoc comments
- [ ] TypeScript strict mode passes, no 'any' types
- [ ] All imports use @ alias
- [ ] Barrel exports updated
- [ ] No console.log or console.error statements
- [ ] `npm run build` succeeds with no errors

### Cross-Browser & Accessibility
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Keyboard shortcuts work (platform-specific)
- [ ] Screen reader announces selection count
- [ ] Properties panel accessible via keyboard
- [ ] ARIA labels for multi-select UI elements

### Deployment
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] Deploy succeeds: `firebase deploy`
- [ ] All features work in production
- [ ] Multi-user testing in production environment

---

## Success Criteria

Multi-select is complete when:

1. ✅ **All checklist items above pass**
2. ✅ **Demo-ready:** Can demonstrate: "Shift+click 5 objects → drag as group → change fill color → all update"
3. ✅ **Performance:** 60 FPS with 50+ object selections, <100ms property updates
4. ✅ **Real-time sync:** Other users see multi-selections within 100ms
5. ✅ **No console errors** in development or production
6. ✅ **Code quality:** Follows architecture, max 500 lines/file, proper imports, full documentation

**When all complete, commit with:**
```bash
git add .
git commit -m "feat: Add multi-select with shift+click and drag-to-select"
```

---

## Implementation Notes

### Multi-Select State Pattern
```typescript
// Store state
selectedIds: string[]  // Array of selected object IDs

// Actions
selectObjects(ids: string[])        // Replace selection
toggleSelection(id: string)          // Add or remove from selection
addToSelection(id: string)           // Add to existing selection
removeFromSelection(id: string)      // Remove from selection
clearSelection()                     // Clear all (selectedIds = [])
```

### Drag-to-Select Pattern
```typescript
// On mouse down (move tool, no shift, on empty canvas)
startSelection(canvasCoords)

// On mouse move (while selecting)
updateSelection(canvasCoords)
// Calculate rect, find overlapping objects, highlight them

// On mouse up
finishSelection()
// Select all objects in final rectangle
```

### Group Drag Pattern
```typescript
// Store initial positions of all selected objects
initialPositions: Map<string, {x, y}>

// On drag move
deltaX = currentX - startX
deltaY = currentY - startY

selectedObjects.forEach(obj => {
  updateObject(obj.id, {
    x: initialPositions.get(obj.id).x + deltaX,
    y: initialPositions.get(obj.id).y + deltaY,
  })
})
```

### Collision Detection (Rectangle-Rectangle)
```typescript
function isRectOverlapping(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}
```

### Collision Detection (Circle-Rectangle)
```typescript
function isCircleOverlappingRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const distX = circle.x - closestX;
  const distY = circle.y - closestY;
  return (distX * distX + distY * distY) < (circle.radius * circle.radius);
}
```

### Firebase Sync Structure
```
/canvases/main/selections/{userId}/
  objectIds: string[]      // Array of selected IDs
  timestamp: number        // Last update time
```

---

## Future Enhancements (Phase 3+)

- [ ] Alignment tools for multi-select (align left, center, right, etc.)
- [ ] Distribution tools (distribute horizontally, vertically)
- [ ] Group creation (convert multi-select to persistent group)
- [ ] Arrow keys to nudge multi-selection (1px or 10px with Shift)
- [ ] Rubber band selection with threshold (hold for 200ms before activating)
- [ ] Multi-select undo/redo support
- [ ] Copy/paste multi-selection
- [ ] Multi-select resize (scale all objects proportionally)
- [ ] Multi-select rotate (rotate around group center)
- [ ] Smart suggestions (select all of same type, select similar fill color)

---

## File Structure (After Multi-Select)

```
src/
├── features/
│   ├── canvas-core/
│   │   ├── components/
│   │   │   ├── CanvasStage.tsx (updated: drag-to-select, group drag)
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useDragToSelect.ts (new)
│   │   │   ├── useGroupDrag.ts (new)
│   │   │   └── index.ts
│   │   ├── shapes/
│   │   │   ├── Rectangle.tsx (updated: multi-select support)
│   │   │   ├── Circle.tsx (updated: multi-select support)
│   │   │   ├── TextShape.tsx (updated: multi-select support)
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── multiSelect.ts (new)
│   │       ├── commonProperties.ts (new)
│   │       └── index.ts
│   ├── toolbar/
│   │   ├── components/
│   │   │   ├── Toolbar.tsx (updated: multi-select delete/duplicate)
│   │   │   ├── PropertiesPanel.tsx (updated: multi-select properties)
│   │   │   ├── MultiSelectProperties.tsx (new)
│   │   │   └── index.ts
│   │   └── hooks/
│   │       ├── useToolShortcuts.ts (updated: Cmd+A, updated delete/duplicate)
│   │       └── index.ts
│   └── collaboration/
│       ├── components/
│       │   ├── SelectionOverlay.tsx (updated: multi-select overlays)
│       │   └── index.ts
│       └── hooks/
│           ├── useRemoteSelections.ts (updated: array support)
│           └── index.ts
├── stores/
│   ├── canvasStore.ts (updated: selectedIds array, new actions)
│   └── index.ts
├── types/
│   ├── canvas.types.ts (updated: SelectionState with objectIds array)
│   └── index.ts
├── lib/
│   └── firebase/
│       ├── selectionService.ts (updated: array support)
│       └── index.ts
└── constants/
    ├── keyboardShortcuts.ts (updated: new shortcuts)
    └── index.ts
```
