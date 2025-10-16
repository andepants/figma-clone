# Left Sidebar Enhancements - Implementation Plan

**Goal:** Enhance the layers panel with hierarchy system, full-item dragging, lock feature, shift-select, and collapsible sections to match Figma's UX patterns.

**Estimated Time:** 18-22 hours

**Key Features:**
- Full layer item dragging (not just grip icon)
- Hierarchy system with dropdown arrows and parent-child relationships
- Shift-click range selection in sidebar
- Lock/unlock objects with lock icon
- Collapsible "Layers" section header
- Export selected hierarchy groups

**Dependencies:**
- Base left sidebar implementation (left-sidebar.md Phases 1-7)
- @dnd-kit packages already installed
- Canvas store with selection management

**Progress Tracker:** Mark each task complete after testing.

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Action:** What to do
- **Why:** Reason for this task
- **Files Modified:** Specific file paths
- **Implementation Details:** Code snippets/specifics
- **Success Criteria:** How to verify completion
- **Tests:** Step-by-step verification
- **Edge Cases:** Potential issues to watch for

---

# Phase 0: Research & Planning

## Summary of Findings

**Figma Hierarchy Patterns (from documentation research needed):**
- Frames act as parent containers
- Dropdown arrow (chevron) collapses/expands children
- Selecting parent selects all children
- Indent level shows hierarchy depth
- Drag entire item (not just grip) for reordering
- Lock icon prevents selection, editing, deletion

**Current Codebase Structure:**
- LayersPanel at `/features/layers-panel/components/LayersPanel.tsx`
- LayerItem component for individual layers
- @dnd-kit used for drag-drop (currently grip-only)
- UIStore tracks hover state
- CanvasStore manages objects and selection
- No parent/child relationships yet

**Design Constraints:**
- Maintain 60 FPS with 100+ layers
- Real-time sync via Firebase RTDB
- Hierarchies must sync across users
- Lock state must persist and sync

**Architecture Decisions:**
- Add `parentId` and `children` properties to canvas objects
- Store hierarchy in object array order (not nested structure for RTDB efficiency)
- Lock property similar to visibility toggle
- Section headers use accordion pattern
- Shift-click uses range selection based on display order

---

# Phase 1: Full-Item Dragging (1-2 hours)

**Goal:** Make entire layer item draggable, remove grip icon restriction.

---

## 1.1 Update Drag Handle

**Estimated Time:** 45-60 minutes

### 1.1.1 Remove Grip Icon and Apply Drag to Entire Item

- [x] **Action:** Move drag listeners from grip icon to entire LayerItem container
  - **Why:** Match Figma UX - drag from anywhere on layer
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { useSortable } from '@dnd-kit/sortable';
    import { CSS } from '@dnd-kit/utilities';
    // Remove GripVertical import

    export const LayerItem = memo(function LayerItem({ object, ... }) {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
      } = useSortable({ id: object.id });

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
      };

      return (
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners} // Apply to entire container
          className={`
            h-8 px-2 py-1 flex items-center gap-2 cursor-grab active:cursor-grabbing
            transition-colors duration-75
            ${isDragging ? 'opacity-50 z-10' : ''}
            ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
            ${!isSelected && isHovered ? 'bg-gray-50' : ''}
          `}
          onClick={onSelect}
          onMouseEnter={onHover}
          onMouseLeave={onHoverEnd}
        >
          {/* Remove grip icon div */}

          <LayerIcon type={object.type} />
          <span className={`
            text-xs truncate flex-1
            ${isSelected ? 'font-medium text-gray-900' : 'font-normal text-gray-700'}
            ${!object.visible ? 'text-gray-400' : ''}
          `}>
            {object.name || `${object.type} ${object.id.slice(0, 4)}`}
          </span>

          {/* Eye and Lock icons on right */}
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Entire layer item is draggable
    - [ ] Cursor shows grab/grabbing on hover/drag
    - [ ] No grip icon visible
    - [ ] Drag still works smoothly
  - **Tests:**
    1. Hover any part of layer → cursor becomes grab
    2. Click and drag from layer name → layer moves
    3. Click and drag from icon → layer moves
    4. Release → layer drops at new position
  - **Edge Cases:**
    - ⚠️ Inline rename input needs to prevent drag (handled in next task)
    - ⚠️ Eye/Lock icons need stopPropagation to prevent drag on click

### 1.1.2 Fix Rename Input Drag Conflict

- [x] **Action:** Prevent drag when clicking rename input
  - **Why:** Typing in input shouldn't trigger drag
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    // In LayerItem component, rename input needs special handling:
    {isRenaming ? (
      <input
        ref={inputRef}
        type="text"
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag
        className="text-xs border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
      />
    ) : (
      <span className="..." onDoubleClick={handleDoubleClick}>
        {object.name || '...'}
      </span>
    )}
    ```
  - **Success Criteria:**
    - [ ] Double-click enters rename mode
    - [ ] Clicking input doesn't start drag
    - [ ] Typing doesn't trigger drag
    - [ ] Can still select text in input
  - **Tests:**
    1. Double-click layer → enters rename mode
    2. Click inside input → no drag starts
    3. Type characters → no drag starts
    4. Select text with mouse → no drag starts
  - **Edge Cases:**
    - ⚠️ Both mouseDown and pointerDown needed for cross-browser support

---

## 1.2 Test Full-Item Dragging

**Estimated Time:** 15-20 minutes

### 1.2.1 Comprehensive Drag Testing

- [ ] **Action:** Verify dragging works from all parts of layer item
  - **Why:** Ensure no regressions in drag functionality
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] Drag from icon → works
    - [ ] Drag from name → works
    - [ ] Drag from padding → works
    - [ ] Rename input doesn't trigger drag
    - [ ] Eye/Lock buttons don't trigger drag
  - **Tests:**
    1. Create 5 layers
    2. Drag layer from left side (icon area) → reorders
    3. Drag layer from middle (name area) → reorders
    4. Drag layer from right side (padding) → reorders
    5. Double-click to rename → drag doesn't start
    6. Click eye icon → visibility toggles, no drag
  - **Edge Cases:**
    - ⚠️ All interactive elements (input, buttons) prevent drag propagation

---

# Phase 2: Hierarchy System (6-8 hours)

**Goal:** Implement Figma-style hierarchy with parent-child relationships, dropdown arrows, and group selection.

---

## 2.1 Data Model for Hierarchy

**Estimated Time:** 1-1.5 hours

### 2.1.1 Add Parent-Child Properties to Canvas Objects

- [ ] **Action:** Extend BaseCanvasObject interface with hierarchy properties
  - **Why:** Store parent-child relationships
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
    ```typescript
    export interface BaseCanvasObject {
      id: string;
      type: ShapeType;
      x: number;
      y: number;
      width: number;
      height: number;
      name?: string;
      visible?: boolean;
      locked?: boolean; // Add for Phase 4

      // Hierarchy properties
      parentId?: string | null; // ID of parent object (null = root level)
      isCollapsed?: boolean; // If true, children are hidden in panel

      createdBy: string;
      createdAt: number;
      updatedAt: number;
    }

    /**
     * Helper type for objects with resolved children
     * Used in UI layer for rendering hierarchy
     */
    export interface CanvasObjectWithChildren extends CanvasObject {
      children: CanvasObjectWithChildren[];
      depth: number; // 0 = root, 1 = child, 2 = grandchild, etc.
    }
    ```
  - **Success Criteria:**
    - [ ] Properties added to interface
    - [ ] Optional (backward compatible)
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run: `npm run type-check`
    2. Verify: No errors
    3. Create object without parentId → works (defaults to null/undefined)
  - **Edge Cases:**
    - ⚠️ Backward compatible: existing objects without hierarchy properties still work

### 2.1.2 Create Hierarchy Utility Functions

- [ ] **Action:** Create utilities to build and manipulate hierarchy tree
  - **Why:** Convert flat object array to hierarchical structure for display
  - **Files Modified:**
    - Create: `src/features/layers-panel/utils/hierarchy.ts`
  - **Implementation Details:**
    ```typescript
    import type { CanvasObject, CanvasObjectWithChildren } from '@/types/canvas.types';

    /**
     * Build hierarchy tree from flat object array
     *
     * Converts flat array with parentId references into nested tree structure.
     * Maintains insertion order within each hierarchy level.
     *
     * @param objects - Flat array of canvas objects
     * @returns Tree structure with children arrays and depth
     *
     * @example
     * // Input: [frameA, rectB, circleC] where rectB.parentId = frameA.id
     * // Output: [{ ...frameA, children: [{ ...rectB, children: [], depth: 1 }], depth: 0 }]
     */
    export function buildHierarchyTree(objects: CanvasObject[]): CanvasObjectWithChildren[] {
      const objectMap = new Map<string, CanvasObjectWithChildren>();

      // Initialize all objects with empty children arrays
      objects.forEach((obj) => {
        objectMap.set(obj.id, { ...obj, children: [], depth: 0 });
      });

      const roots: CanvasObjectWithChildren[] = [];

      // Build tree structure
      objects.forEach((obj) => {
        const node = objectMap.get(obj.id)!;

        if (!obj.parentId) {
          // Root level object
          roots.push(node);
        } else {
          // Child object - add to parent's children
          const parent = objectMap.get(obj.parentId);
          if (parent) {
            node.depth = parent.depth + 1;
            parent.children.push(node);
          } else {
            // Parent not found - treat as root (orphan)
            roots.push(node);
          }
        }
      });

      return roots;
    }

    /**
     * Flatten hierarchy tree back to array
     *
     * Converts nested tree structure back to flat array while preserving hierarchy.
     * Used for display order in layers panel (depth-first traversal).
     *
     * @param tree - Hierarchical tree structure
     * @param includeCollapsed - If false, skip children of collapsed nodes
     * @returns Flat array in display order
     */
    export function flattenHierarchyTree(
      tree: CanvasObjectWithChildren[],
      includeCollapsed = true
    ): CanvasObjectWithChildren[] {
      const result: CanvasObjectWithChildren[] = [];

      function traverse(nodes: CanvasObjectWithChildren[]) {
        nodes.forEach((node) => {
          result.push(node);

          // Add children if not collapsed or if includeCollapsed is true
          if (node.children.length > 0 && (includeCollapsed || !node.isCollapsed)) {
            traverse(node.children);
          }
        });
      }

      traverse(tree);
      return result;
    }

    /**
     * Get all descendant IDs of a node
     *
     * Returns all child, grandchild, etc. IDs recursively.
     * Used for selecting entire groups.
     *
     * @param nodeId - Parent node ID
     * @param objects - All canvas objects
     * @returns Array of all descendant IDs
     */
    export function getAllDescendantIds(nodeId: string, objects: CanvasObject[]): string[] {
      const descendants: string[] = [];
      const children = objects.filter((obj) => obj.parentId === nodeId);

      children.forEach((child) => {
        descendants.push(child.id);
        descendants.push(...getAllDescendantIds(child.id, objects));
      });

      return descendants;
    }

    /**
     * Check if object has any children
     *
     * @param objectId - Object ID to check
     * @param objects - All canvas objects
     * @returns True if object has at least one child
     */
    export function hasChildren(objectId: string, objects: CanvasObject[]): boolean {
      return objects.some((obj) => obj.parentId === objectId);
    }

    /**
     * Move object to new parent
     *
     * Updates parentId and validates no circular references.
     *
     * @param objectId - Object to move
     * @param newParentId - New parent ID (null for root)
     * @param objects - All canvas objects
     * @returns Updated objects array, or null if circular reference detected
     */
    export function moveToParent(
      objectId: string,
      newParentId: string | null,
      objects: CanvasObject[]
    ): CanvasObject[] | null {
      // Prevent circular references
      if (newParentId) {
        const descendants = getAllDescendantIds(objectId, objects);
        if (descendants.includes(newParentId)) {
          console.warn('Cannot move object to its own descendant (circular reference)');
          return null;
        }
      }

      return objects.map((obj) =>
        obj.id === objectId ? { ...obj, parentId: newParentId } : obj
      );
    }
    ```
  - **Success Criteria:**
    - [ ] All functions have JSDoc comments
    - [ ] buildHierarchyTree handles orphans (missing parent)
    - [ ] flattenHierarchyTree respects collapsed state
    - [ ] getAllDescendantIds works recursively
    - [ ] moveToParent prevents circular references
  - **Tests:**
    1. **Test: Build flat hierarchy (no parents)**
       - Input: `[rect1, rect2, circle1]` (all parentId = null)
       - Output: `[{ ...rect1, children: [], depth: 0 }, ...]`
    2. **Test: Build nested hierarchy**
       - Input: `[frame1, rect2 (parent: frame1), circle3 (parent: rect2)]`
       - Output: `[{ ...frame1, children: [{ ...rect2, children: [circle3], depth: 1 }], depth: 0 }]`
    3. **Test: Flatten with collapsed**
       - Input: Tree with frame1 (collapsed) containing rect2
       - Output: `[frame1]` (rect2 hidden)
    4. **Test: Get descendants**
       - Input: frame1 with rect2, rect2 with circle3
       - Output: `['rect2-id', 'circle3-id']`
    5. **Test: Prevent circular reference**
       - Try to move frame1 inside its own child rect2
       - Output: `null` (prevented)
  - **Edge Cases:**
    - ⚠️ Orphans (parentId points to non-existent object) → treat as root
    - ⚠️ Circular references → prevent in moveToParent
    - ⚠️ Deep nesting (10+ levels) → still performant

### 2.1.3 Update Store with Hierarchy Actions

- [ ] **Action:** Add hierarchy management actions to canvasStore
  - **Why:** Centralize hierarchy mutations
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
    ```typescript
    interface CanvasStore {
      // ... existing properties ...

      /**
       * Toggle collapse state of object
       *
       * When collapsed, children are hidden in layers panel
       */
      toggleCollapse: (id: string) => void;

      /**
       * Set parent of object
       *
       * Validates no circular references before updating
       */
      setParent: (objectId: string, newParentId: string | null) => void;

      /**
       * Select object and all descendants
       *
       * Used when clicking collapsed parent
       */
      selectWithDescendants: (id: string) => void;
    }

    export const useCanvasStore = create<CanvasStore>((set, get) => ({
      // ... existing implementation ...

      toggleCollapse: (id) => {
        const object = get().objects.find((obj) => obj.id === id);
        if (object) {
          get().updateObject(id, { isCollapsed: !object.isCollapsed });
        }
      },

      setParent: (objectId, newParentId) => {
        const objects = get().objects;
        const updated = moveToParent(objectId, newParentId, objects);

        if (updated) {
          set({ objects: updated });
        } else {
          console.error('Cannot set parent: circular reference detected');
        }
      },

      selectWithDescendants: (id) => {
        const objects = get().objects;
        const descendants = getAllDescendantIds(id, objects);
        get().selectObjects([id, ...descendants]);
      },
    }));
    ```
  - **Success Criteria:**
    - [ ] toggleCollapse updates isCollapsed property
    - [ ] setParent prevents circular references
    - [ ] selectWithDescendants selects parent and all children
    - [ ] All actions sync to RTDB
  - **Tests:**
    1. Call `toggleCollapse('frame-1')` → isCollapsed becomes true
    2. Call again → isCollapsed becomes false
    3. Call `setParent('rect-1', 'frame-1')` → rect-1.parentId = 'frame-1'
    4. Call `setParent('frame-1', 'rect-1')` → fails (circular reference)
    5. Call `selectWithDescendants('frame-1')` → selects frame-1, rect-1, circle-1
  - **Edge Cases:**
    - ⚠️ Circular reference validation in setParent
    - ⚠️ RTDB sync: hierarchy changes sync to all users

### 2.1.4 Update Barrel Exports

- [ ] **Action:** Export hierarchy utilities
  - **Why:** Enable imports from utils
  - **Files Modified:**
    - Update: `src/features/layers-panel/utils/index.ts`
  - **Implementation Details:**
    ```typescript
    export {
      generateLayerName,
      getBaseName,
      parseLayerNumber,
    } from './layerNaming';

    export {
      buildHierarchyTree,
      flattenHierarchyTree,
      getAllDescendantIds,
      hasChildren,
      moveToParent,
    } from './hierarchy';
    ```
  - **Success Criteria:**
    - [ ] All exports work from utils index
  - **Tests:**
    1. Import: `import { buildHierarchyTree } from '@/features/layers-panel/utils'`
    2. No import errors
  - **Edge Cases:**
    - ⚠️ None expected

---

## 2.2 Hierarchy UI Components

**Estimated Time:** 2-3 hours

### 2.2.1 Create Dropdown Arrow Component

- [ ] **Action:** Create collapsible arrow component for parent objects
  - **Why:** Toggle visibility of children in layers panel
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/HierarchyArrow.tsx`
  - **Implementation Details:**
    ```typescript
    import { ChevronRight } from 'lucide-react';
    import { memo } from 'react';

    interface HierarchyArrowProps {
      isCollapsed: boolean;
      hasChildren: boolean;
      onToggle: (e: React.MouseEvent) => void;
    }

    /**
     * Hierarchy Arrow Component
     *
     * Dropdown arrow for collapsing/expanding children in layer hierarchy.
     * Shows right-facing arrow when collapsed, down-facing when expanded.
     * Only visible if object has children.
     *
     * @param isCollapsed - Whether children are hidden
     * @param hasChildren - Whether object has any children
     * @param onToggle - Callback when arrow clicked
     */
    export const HierarchyArrow = memo(function HierarchyArrow({
      isCollapsed,
      hasChildren,
      onToggle,
    }: HierarchyArrowProps) {
      if (!hasChildren) {
        // Spacer to maintain alignment when no children
        return <div className="w-4" />;
      }

      return (
        <button
          onClick={onToggle}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag
          className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
          aria-label={isCollapsed ? 'Expand children' : 'Collapse children'}
        >
          <ChevronRight
            className={`
              w-3 h-3 text-gray-600 transition-transform duration-150
              ${isCollapsed ? 'rotate-0' : 'rotate-90'}
            `}
          />
        </button>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Arrow only visible when hasChildren = true
    - [ ] Arrow rotates 90° when expanded
    - [ ] Click toggles collapse state
    - [ ] Click doesn't trigger layer drag
    - [ ] Spacer maintains alignment for childless objects
  - **Tests:**
    1. Render with hasChildren=false → see empty spacer (no arrow)
    2. Render with hasChildren=true, isCollapsed=true → see right-facing arrow
    3. Click arrow → onToggle fires
    4. Render with isCollapsed=false → see down-facing arrow (rotated 90°)
    5. Hover arrow → background becomes gray-200
  - **Edge Cases:**
    - ⚠️ stopPropagation prevents drag when clicking arrow
    - ⚠️ Spacer ensures icons align across all layers

### 2.2.2 Update LayerItem with Hierarchy Support

- [x] **Action:** Add indentation, arrow, and depth styling to LayerItem
  - **Why:** Visualize hierarchy structure
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { HierarchyArrow } from './HierarchyArrow';
    import { useCanvasStore } from '@/stores';
    import { hasChildren } from '../utils/hierarchy';

    interface LayerItemProps {
      object: CanvasObjectWithChildren; // Now includes children and depth
      isSelected: boolean;
      isHovered: boolean;
      onSelect: (e: React.MouseEvent) => void;
      onHover: () => void;
      onHoverEnd: () => void;
    }

    export const LayerItem = memo(function LayerItem({
      object,
      isSelected,
      isHovered,
      onSelect,
      onHover,
      onHoverEnd,
    }: LayerItemProps) {
      const toggleCollapse = useCanvasStore((state) => state.toggleCollapse);
      const objects = useCanvasStore((state) => state.objects);

      const hasChildObjects = hasChildren(object.id, objects);
      const indentWidth = object.depth * 16; // 16px per level

      const handleArrowClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger selection
        toggleCollapse(object.id);
      };

      return (
        <div
          ref={setNodeRef}
          style={{ ...style, paddingLeft: `${indentWidth + 8}px` }} // Indent based on depth
          {...attributes}
          {...listeners}
          className={`
            h-8 pr-2 py-1 flex items-center gap-1 cursor-grab active:cursor-grabbing
            transition-colors duration-75
            ${isDragging ? 'opacity-50 z-10' : ''}
            ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
            ${!isSelected && isHovered ? 'bg-gray-50' : ''}
          `}
          onClick={onSelect}
          onMouseEnter={onHover}
          onMouseLeave={onHoverEnd}
        >
          {/* Hierarchy arrow */}
          <HierarchyArrow
            isCollapsed={object.isCollapsed || false}
            hasChildren={hasChildObjects}
            onToggle={handleArrowClick}
          />

          <LayerIcon type={object.type} />

          <span className={`
            text-xs truncate flex-1
            ${isSelected ? 'font-medium text-gray-900' : 'font-normal text-gray-700'}
            ${!object.visible ? 'text-gray-400' : ''}
          `}>
            {object.name || `${object.type} ${object.id.slice(0, 4)}`}
          </span>

          {/* Lock icon (Phase 4) */}
          {/* Eye icon */}
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Indentation increases 16px per depth level
    - [ ] Arrow shows for parents, spacer for childless objects
    - [ ] Click arrow collapses/expands children
    - [ ] Selection and hover still work
  - **Tests:**
    1. Root object (depth 0) → no indent
    2. Child object (depth 1) → 16px indent
    3. Grandchild (depth 2) → 32px indent
    4. Parent with children → see arrow
    5. Click arrow → children disappear (collapsed)
    6. Click arrow again → children reappear (expanded)
  - **Edge Cases:**
    - ⚠️ Deep nesting (depth 5+) → still visible, may need max-depth limit
    - ⚠️ Arrow click doesn't trigger selection or drag

### 2.2.3 Update LayersPanel with Hierarchy Rendering

- [x] **Action:** Use hierarchy utilities to render tree structure
  - **Why:** Display hierarchy in collapsed/expanded state
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { buildHierarchyTree, flattenHierarchyTree } from '../utils/hierarchy';
    import type { CanvasObjectWithChildren } from '@/types/canvas.types';

    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);

      // Build hierarchy tree
      const hierarchyTree = useMemo(() => {
        return buildHierarchyTree(objects);
      }, [objects]);

      // Flatten for display (respects collapse state)
      const displayObjects = useMemo(() => {
        const flattened = flattenHierarchyTree(hierarchyTree, false); // Don't include collapsed children
        return flattened.reverse(); // Reverse for z-order (top = front)
      }, [hierarchyTree]);

      return (
        <aside className="...">
          {/* Header */}

          <div className="flex-1 overflow-y-auto">
            {displayObjects.length === 0 ? (
              <div className="...">No objects on canvas</div>
            ) : (
              <DndContext {...}>
                <SortableContext items={displayObjects.map((obj) => obj.id)} {...}>
                  <div className="p-2 space-y-0.5">
                    {displayObjects.map((obj) => (
                      <LayerContextMenu key={obj.id} {...}>
                        <LayerItem
                          object={obj}
                          isSelected={selectedIds.includes(obj.id)}
                          isHovered={hoveredObjectId === obj.id}
                          onSelect={(e) => handleLayerSelect(obj.id, e)}
                          onHover={() => setHoveredObject(obj.id)}
                          onHoverEnd={() => setHoveredObject(null)}
                        />
                      </LayerContextMenu>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Hierarchy displays with proper indentation
    - [ ] Collapsed children are hidden
    - [ ] Expanded children are visible
    - [ ] Re-renders efficiently with useMemo
  - **Tests:**
    1. Create frame → rect inside frame → see indented rect
    2. Click frame's arrow → rect disappears
    3. Click arrow again → rect reappears
    4. Create deep hierarchy (3 levels) → all display correctly
  - **Edge Cases:**
    - ⚠️ useMemo prevents unnecessary hierarchy recalculations
    - ⚠️ Collapsed state syncs across users

### 2.2.4 Update Barrel Exports

- [x] **Action:** Export HierarchyArrow component
  - **Why:** Enable imports within feature
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/index.ts`
  - **Implementation Details:**
    ```typescript
    export { LayersPanel } from './LayersPanel';
    export { LayerIcon } from './LayerIcon';
    export { LayerItem } from './LayerItem';
    export { HierarchyArrow } from './HierarchyArrow';
    export { LayerContextMenu } from './LayerContextMenu';
    ```
  - **Success Criteria:**
    - [ ] Import works from components index
  - **Tests:**
    1. Import HierarchyArrow from components index
    2. No errors
  - **Edge Cases:**
    - ⚠️ None expected

---

## 2.3 Group Selection

**Estimated Time:** 1-1.5 hours

### 2.3.1 Implement Select-With-Descendants

- [x] **Action:** Click parent selects all children (like Figma)
  - **Why:** Enable selecting entire groups
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { getAllDescendantIds } from '../utils/hierarchy';

    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);
      const selectedIds = useCanvasStore((state) => state.selectedIds);
      const selectObjects = useCanvasStore((state) => state.selectObjects);
      const toggleSelection = useCanvasStore((state) => state.toggleSelection);

      const handleLayerSelect = (objectId: string, e: React.MouseEvent) => {
        const object = objects.find((obj) => obj.id === objectId);
        const descendants = getAllDescendantIds(objectId, objects);

        if (e.shiftKey) {
          // Shift+click: Add to selection (including descendants if parent)
          const idsToAdd = [objectId, ...descendants];
          const newSelection = [...new Set([...selectedIds, ...idsToAdd])];
          selectObjects(newSelection);
        } else if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl+click: Toggle selection (including descendants if parent)
          const idsToToggle = [objectId, ...descendants];

          // If any are selected, deselect all; otherwise select all
          const anySelected = idsToToggle.some((id) => selectedIds.includes(id));

          if (anySelected) {
            const newSelection = selectedIds.filter((id) => !idsToToggle.includes(id));
            selectObjects(newSelection);
          } else {
            const newSelection = [...new Set([...selectedIds, ...idsToToggle])];
            selectObjects(newSelection);
          }
        } else {
          // Normal click: Replace selection (including descendants if parent)
          selectObjects([objectId, ...descendants]);
        }
      };

      // ... rest of component
    }
    ```
  - **Success Criteria:**
    - [ ] Click parent → selects parent and all children
    - [ ] Children highlight in panel
    - [ ] Children show selection boxes on canvas
    - [ ] Shift+click parent → adds parent and children to selection
    - [ ] Cmd+click parent → toggles parent and children
  - **Tests:**
    1. Click frame with 2 children → all 3 selected
    2. Canvas shows 3 selection boxes
    3. Panel shows 3 blue highlights
    4. Shift+click another frame → both groups selected
    5. Cmd+click first frame → first group deselected, second remains
  - **Edge Cases:**
    - ⚠️ Selecting collapsed parent → children selected but hidden in panel
    - ⚠️ Deep hierarchy → all descendants selected regardless of depth

### 2.3.2 Visual Feedback for Group Selection

- [x] **Action:** Show visual indication when parent and children selected
  - **Why:** Clear feedback that entire group is selected
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    export const LayerItem = memo(function LayerItem({ object, isSelected, ... }) {
      const selectedIds = useCanvasStore((state) => state.selectedIds);
      const objects = useCanvasStore((state) => state.objects);

      // Check if all descendants are selected
      const descendants = getAllDescendantIds(object.id, objects);
      const allDescendantsSelected = descendants.length > 0 &&
        descendants.every((id) => selectedIds.includes(id));

      return (
        <div
          className={`
            ...
            ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
            ${allDescendantsSelected && !isSelected ? 'bg-blue-25' : ''} // Subtle highlight
          `}
        >
          {/* ... */}
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Parent selected → strong blue highlight
    - [ ] Children selected → strong blue highlight
    - [ ] Parent with all children selected → consistent highlight
  - **Tests:**
    1. Select parent → parent and children have blue highlight
    2. Manually select only children → children highlighted, parent shows subtle blue
    3. Deselect one child → parent loses subtle highlight
  - **Edge Cases:**
    - ⚠️ Partial selection: Some children selected, some not

---

## 2.4 Drag-Drop with Hierarchy

**Estimated Time:** 2-3 hours

### 2.4.1 Update Drag-Drop to Create Parent-Child Relationships

- [x] **Action:** Drag layer onto another to make it a child
  - **Why:** Enable building hierarchy through drag-drop
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { DndContext, DragOverlay, DragOverEvent } from '@dnd-kit/core';
    import { setParent } from '../utils/hierarchy';

    export function LayersPanel() {
      const [overId, setOverId] = useState<string | null>(null);

      const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string | null);
      };

      const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setOverId(null);

        if (!over || active.id === over.id) return;

        const draggedObj = objects.find((obj) => obj.id === active.id);
        const targetObj = objects.find((obj) => obj.id === over.id);

        if (!draggedObj || !targetObj) return;

        // Determine if making child or reordering
        // Strategy: Drag onto target = make child; drag between targets = reorder

        // For now, implement reordering (Phase 1 behavior)
        // Later, add modifier key (e.g., hold Opt/Alt) to make child
        const oldIndex = objects.findIndex((obj) => obj.id === active.id);
        const newIndex = objects.findIndex((obj) => obj.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(objects, oldIndex, newIndex);
          setObjects(reordered);
        }
      };

      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* ... */}
        </DndContext>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Drag layer onto another → TBD: make child or reorder
    - [ ] Visual feedback during drag (highlight potential parent)
    - [ ] Prevent circular references
  - **Tests:**
    1. Drag rect onto frame → becomes child of frame
    2. Try drag frame onto its own child → prevented
    3. Drag to reorder within same level → reorders
  - **Edge Cases:**
    - ⚠️ Need UX decision: How to distinguish "make child" vs "reorder"?
    - ⚠️ Option 1: Drag onto = child, drag between = reorder
    - ⚠️ Option 2: Hold modifier key (Opt/Alt) to make child
    - ⚠️ Defer to Phase 2.4.2 for implementation decision

### 2.4.2 Add Visual Drop Indicator for Hierarchy

- [x] **Action:** Show visual feedback for where object will be dropped (child vs sibling)
  - **Why:** Clear indication of drop result
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    // DECISION: Use Figma's approach:
    // - Drag onto center of target = make child
    // - Drag onto top/bottom edge = reorder as sibling

    // In LayerItem, show different drop indicators:
    export const LayerItem = memo(function LayerItem({ object, dropPosition, ... }) {
      return (
        <div className="relative">
          {/* Top edge indicator (reorder above) */}
          {dropPosition === 'before' && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}

          {/* Center indicator (make child) */}
          {dropPosition === 'child' && (
            <div className="absolute inset-0 bg-blue-100 border border-blue-500 rounded opacity-50" />
          )}

          {/* Bottom edge indicator (reorder below) */}
          {dropPosition === 'after' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}

          {/* Layer content */}
          <div className="...">{/* ... */}</div>
        </div>
      );
    });

    // In LayersPanel, detect drop position:
    const handleDragOver = (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setDropPosition(null);
        return;
      }

      // Get mouse position relative to target element
      const overRect = over.rect;
      const mouseY = event.activatorEvent.clientY;
      const relativeY = mouseY - overRect.top;
      const height = overRect.height;

      // Top 25% = before, middle 50% = child, bottom 25% = after
      if (relativeY < height * 0.25) {
        setDropPosition({ id: over.id, position: 'before' });
      } else if (relativeY > height * 0.75) {
        setDropPosition({ id: over.id, position: 'after' });
      } else {
        setDropPosition({ id: over.id, position: 'child' });
      }
    };
    ```
  - **Success Criteria:**
    - [ ] Hover over top 25% → blue line at top (reorder above)
    - [ ] Hover over middle 50% → blue box (make child)
    - [ ] Hover over bottom 25% → blue line at bottom (reorder below)
    - [ ] Clear visual distinction
  - **Tests:**
    1. Drag layer, hover over top of target → see top line
    2. Move to middle → see blue box
    3. Move to bottom → see bottom line
    4. Drop in middle → becomes child
    5. Drop at edge → reorders as sibling
  - **Edge Cases:**
    - ⚠️ Complex implementation - may defer to future enhancement
    - ⚠️ Alternative: Use simple modifier key (hold Opt to make child)

### 2.4.3 Implement Drop Logic with Parent Assignment

- [x] **Action:** Execute drop action based on position (child vs sibling reorder)
  - **Why:** Create parent-child relationships via drag-drop
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !dropPosition) return;

      const draggedId = active.id as string;
      const targetId = over.id as string;

      if (dropPosition.position === 'child') {
        // Make child of target
        const updated = setParent(draggedId, targetId, objects);
        if (updated) {
          setObjects(updated);
        }
      } else {
        // Reorder as sibling (before or after target)
        const oldIndex = objects.findIndex((obj) => obj.id === draggedId);
        const targetIndex = objects.findIndex((obj) => obj.id === targetId);

        let newIndex = targetIndex;
        if (dropPosition.position === 'after') {
          newIndex = targetIndex + 1;
        }

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(objects, oldIndex, newIndex);

          // Inherit parent from target if reordering
          const targetObj = objects[targetIndex];
          reordered[newIndex] = { ...reordered[newIndex], parentId: targetObj.parentId };

          setObjects(reordered);
        }
      }

      setDropPosition(null);
    };
    ```
  - **Success Criteria:**
    - [ ] Drop in middle → becomes child
    - [ ] Drop at edge → reorders as sibling at same hierarchy level
    - [ ] Siblings inherit parent from target
    - [ ] RTDB syncs changes
  - **Tests:**
    1. Drag rect onto middle of frame → rect becomes child of frame
    2. Drag rect onto top edge of another rect → reorders above, same level
    3. Drag rect onto bottom edge → reorders below
    4. Check RTDB → parentId updated correctly
  - **Edge Cases:**
    - ⚠️ Circular reference prevention still works
    - ⚠️ Complex implementation - may simplify to modifier key approach

---

# Phase 3: Shift-Click Range Selection (1-2 hours)

**Goal:** Implement shift-click to select range of layers (like Figma).

---

## 3.1 Range Selection Logic

**Estimated Time:** 45-60 minutes

### 3.1.1 Implement Shift-Click Range Selection

- [x] **Action:** Shift-click selects all layers between first and second click
  - **Why:** Efficient multi-selection for consecutive layers
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    export function LayersPanel() {
      const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

      const handleLayerSelect = (objectId: string, e: React.MouseEvent) => {
        const descendants = getAllDescendantIds(objectId, objects);

        if (e.shiftKey && lastSelectedId) {
          // Range selection: Select all layers between last and current
          const lastIndex = displayObjects.findIndex((obj) => obj.id === lastSelectedId);
          const currentIndex = displayObjects.findIndex((obj) => obj.id === objectId);

          if (lastIndex !== -1 && currentIndex !== -1) {
            const startIndex = Math.min(lastIndex, currentIndex);
            const endIndex = Math.max(lastIndex, currentIndex);

            const rangeIds = displayObjects
              .slice(startIndex, endIndex + 1)
              .map((obj) => obj.id);

            // Add range to selection (don't replace)
            const newSelection = [...new Set([...selectedIds, ...rangeIds])];
            selectObjects(newSelection);
            return;
          }
        }

        if (e.shiftKey) {
          // Shift without range: Add to selection (existing behavior)
          const idsToAdd = [objectId, ...descendants];
          const newSelection = [...new Set([...selectedIds, ...idsToAdd])];
          selectObjects(newSelection);
          setLastSelectedId(objectId);
        } else if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl: Toggle selection
          const idsToToggle = [objectId, ...descendants];
          const anySelected = idsToToggle.some((id) => selectedIds.includes(id));

          if (anySelected) {
            const newSelection = selectedIds.filter((id) => !idsToToggle.includes(id));
            selectObjects(newSelection);
          } else {
            const newSelection = [...new Set([...selectedIds, ...idsToToggle])];
            selectObjects(newSelection);
          }
          setLastSelectedId(objectId);
        } else {
          // Normal click: Replace selection
          selectObjects([objectId, ...descendants]);
          setLastSelectedId(objectId);
        }
      };

      // ... rest of component
    }
    ```
  - **Success Criteria:**
    - [ ] Click layer 1 → Shift+click layer 5 → selects layers 1-5
    - [ ] Works in both directions (up and down)
    - [ ] Respects hierarchy (includes parents in range)
    - [ ] Adds to existing selection (doesn't replace)
  - **Tests:**
    1. Click "Rectangle 1" → Shift+click "Rectangle 5" → all 5 selected
    2. Click "Circle 3" → Shift+click "Rectangle 1" (above) → range selected
    3. Have 2 selected → Shift+click → adds range, keeps existing
    4. Range includes collapsed parent → parent selected but not visible children
  - **Edge Cases:**
    - ⚠️ Range selection uses display order (flattened hierarchy)
    - ⚠️ Collapsed children not included in visible range (expected)
    - ⚠️ Range selection with hierarchies can be complex

### 3.1.2 Visual Feedback for Range Selection

- [ ] **Action:** Highlight potential range on shift-hover
  - **Why:** Show what will be selected before clicking
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    // In LayersPanel:
    export function LayersPanel() {
      const [shiftHoverId, setShiftHoverId] = useState<string | null>(null);

      // Calculate range IDs for preview
      const rangePreviewIds = useMemo(() => {
        if (!shiftHoverId || !lastSelectedId) return [];

        const lastIndex = displayObjects.findIndex((obj) => obj.id === lastSelectedId);
        const hoverIndex = displayObjects.findIndex((obj) => obj.id === shiftHoverId);

        if (lastIndex === -1 || hoverIndex === -1) return [];

        const startIndex = Math.min(lastIndex, hoverIndex);
        const endIndex = Math.max(lastIndex, hoverIndex);

        return displayObjects.slice(startIndex, endIndex + 1).map((obj) => obj.id);
      }, [shiftHoverId, lastSelectedId, displayObjects]);

      const handleLayerHover = (objectId: string, e: React.MouseEvent) => {
        if (e.shiftKey) {
          setShiftHoverId(objectId);
        } else {
          setShiftHoverId(null);
        }
        // ... existing hover logic
      };

      // Pass rangePreview to LayerItem
      <LayerItem
        isInRangePreview={rangePreviewIds.includes(obj.id)}
        // ... other props
      />
    }

    // In LayerItem:
    export const LayerItem = memo(function LayerItem({ isInRangePreview, ... }) {
      return (
        <div
          className={`
            ...
            ${isInRangePreview ? 'bg-blue-25 border-l-2 border-l-blue-300' : ''}
          `}
        >
          {/* ... */}
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Hold Shift + hover → range preview highlights
    - [ ] Subtle blue background on range preview
    - [ ] Preview updates as mouse moves
    - [ ] Click executes selection
  - **Tests:**
    1. Click layer 1 → hold Shift → hover layer 5 → see range preview (1-5)
    2. Move mouse to layer 3 → preview updates to range 1-3
    3. Click → all previewed layers selected
    4. Release Shift → preview disappears
  - **Edge Cases:**
    - ⚠️ Range preview only shows when Shift held and lastSelected exists
    - ⚠️ Optional enhancement - may defer if complex

---

# Phase 4: Lock Feature (2-3 hours)

**Goal:** Add lock/unlock functionality to prevent selection, editing, and deletion of objects.

---

## 4.1 Lock Property and Store Actions

**Estimated Time:** 30-45 minutes

### 4.1.1 Add Locked Property to Canvas Objects

- [ ] **Action:** Add `locked` boolean to BaseCanvasObject (already in Phase 2.1.1)
  - **Why:** Track lock state for each object
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts` (if not done in Phase 2)
  - **Implementation Details:**
    ```typescript
    export interface BaseCanvasObject {
      // ... existing properties ...
      locked?: boolean; // Default: false (unlocked)
    }
    ```
  - **Success Criteria:**
    - [ ] Property added to interface
    - [ ] Optional (default false)
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run: `npm run type-check`
    2. Object without locked → treated as unlocked
  - **Edge Cases:**
    - ⚠️ Backward compatible: undefined = unlocked

### 4.1.2 Add Toggle Lock Action to CanvasStore

- [ ] **Action:** Add `toggleLock` method to canvasStore
  - **Why:** Convenient action for locking/unlocking
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
    ```typescript
    interface CanvasStore {
      // ... existing ...

      /**
       * Toggle lock state of an object
       *
       * Locked objects cannot be selected, edited, or deleted on canvas
       */
      toggleLock: (id: string) => void;
    }

    export const useCanvasStore = create<CanvasStore>((set, get) => ({
      // ... existing ...

      toggleLock: (id) => {
        const object = get().objects.find((obj) => obj.id === id);
        if (object) {
          const newLocked = !(object.locked ?? false);
          get().updateObject(id, { locked: newLocked });
        }
      },
    }));
    ```
  - **Success Criteria:**
    - [ ] toggleLock updates locked property
    - [ ] Syncs to RTDB
  - **Tests:**
    1. Call: `toggleLock('rect-1')`
    2. Check: `objects.find(obj => obj.id === 'rect-1').locked === true`
    3. Call again: `locked === false`
  - **Edge Cases:**
    - ⚠️ Default false: undefined treated as unlocked

---

## 4.2 Lock Icon UI

**Estimated Time:** 45-60 minutes

### 4.2.1 Add Lock Icon to LayerItem

- [ ] **Action:** Render Lock/Unlock icon with click handler in LayerItem
  - **Why:** Toggle lock state from layers panel
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
    import { useCanvasStore } from '@/stores';

    export const LayerItem = memo(function LayerItem({ object, ... }) {
      const toggleLock = useCanvasStore((state) => state.toggleLock);
      const toggleVisibility = useCanvasStore((state) => state.toggleVisibility);

      const isLocked = object.locked === true;
      const isVisible = object.visible !== false;

      const handleLockClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger layer selection
        toggleLock(object.id);
      };

      const handleVisibilityClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleVisibility(object.id);
      };

      return (
        <div className={`
          ...
          ${isLocked ? 'opacity-60' : ''} // Subtle dimming for locked layers
        `}>
          <HierarchyArrow {...} />
          <LayerIcon type={object.type} />
          <span className={`...`}>{object.name}</span>

          {/* Lock icon */}
          <button
            onClick={handleLockClick}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag
            className="ml-auto p-0.5 hover:bg-gray-100 rounded transition-colors"
            aria-label={isLocked ? 'Unlock object' : 'Lock object'}
          >
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100" />
            )}
          </button>

          {/* Eye icon (existing) */}
          <button
            onClick={handleVisibilityClick}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            aria-label={isVisible ? 'Hide object' : 'Show object'}
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Lock icon appears to left of eye icon
    - [ ] Locked: Shows solid Lock icon
    - [ ] Unlocked: Shows Unlock icon on hover only (opacity-0 → opacity-100)
    - [ ] Click toggles lock state
    - [ ] Locked layers appear slightly dimmed
  - **Tests:**
    1. Hover layer → see Unlock icon appear
    2. Click Unlock → changes to Lock icon (always visible)
    3. Click Lock → changes back to Unlock (hover only)
    4. Locked layer appears slightly dimmed
  - **Edge Cases:**
    - ⚠️ stopPropagation prevents drag/selection on icon click
    - ⚠️ group-hover requires parent div to have 'group' class

### 4.2.2 Add 'group' Class to LayerItem Container

- [ ] **Action:** Add 'group' class to LayerItem for hover effects
  - **Why:** Enable group-hover for Lock icon
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    return (
      <div
        className={`
          group // Add this
          h-8 pr-2 py-1 flex items-center gap-1 cursor-grab active:cursor-grabbing
          ...
        `}
      >
        {/* ... */}
      </div>
    );
    ```
  - **Success Criteria:**
    - [ ] Unlock icon appears on layer hover
    - [ ] Lock icon always visible when locked
  - **Tests:**
    1. Hover unlocked layer → Unlock icon appears
    2. Move mouse away → Unlock icon disappears
    3. Lock layer → Lock icon always visible (no hover effect)
  - **Edge Cases:**
    - ⚠️ None expected

---

## 4.3 Prevent Interaction with Locked Objects

**Estimated Time:** 1-1.5 hours

### 4.3.1 Prevent Canvas Selection of Locked Objects

- [ ] **Action:** Update shape components to ignore clicks when locked
  - **Why:** Locked objects cannot be selected on canvas
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
  - **Implementation Details:**
    ```typescript
    export function Rectangle({ rectangle, isSelected, ... }) {
      const selectObjects = useCanvasStore((state) => state.selectObjects);

      const handleClick = (e: KonvaEventObject<MouseEvent>) => {
        // Ignore if locked
        if (rectangle.locked) {
          return;
        }

        e.cancelBubble = true;

        if (e.evt.shiftKey) {
          // Shift+click: Add to selection
          const current = useCanvasStore.getState().selectedIds;
          selectObjects([...current, rectangle.id]);
        } else {
          // Normal click: Replace selection
          selectObjects([rectangle.id]);
        }
      };

      return (
        <Rect
          {...props}
          onClick={handleClick}
          listening={!rectangle.locked} // Don't listen to events if locked
          // ... other props
        />
      );
    }
    ```
    Apply same pattern to all shape components.
  - **Success Criteria:**
    - [ ] Locked objects don't respond to clicks
    - [ ] Cursor doesn't change on hover (no pointer)
    - [ ] Can click through locked objects to select unlocked ones behind
  - **Tests:**
    1. Lock rectangle → click it → nothing happens (not selected)
    2. Create circle behind locked rectangle → click locked area → circle selects
    3. Unlock rectangle → click → selects normally
  - **Edge Cases:**
    - ⚠️ `listening={false}` makes object completely non-interactive
    - ⚠️ Locked objects can still be selected from layers panel (to unlock)

### 4.3.2 Prevent Transform/Drag of Locked Objects

- [ ] **Action:** Disable transform handles and dragging for locked objects
  - **Why:** Locked objects cannot be moved or resized
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx` (and others)
    - Update: `src/features/canvas-core/hooks/useResize.ts` (if exists)
  - **Implementation Details:**
    ```typescript
    export function Rectangle({ rectangle, isSelected, ... }) {
      const isLocked = rectangle.locked === true;

      return (
        <>
          <Rect
            {...props}
            draggable={!isLocked} // Disable drag if locked
            listening={!isLocked}
          />

          {/* Selection outline - show even if locked, but no transforms */}
          {isSelected && (
            <>
              {/* Selection box (visual only) */}
              <Rect
                x={rectangle.x}
                y={rectangle.y}
                width={rectangle.width}
                height={rectangle.height}
                stroke={isLocked ? '#9ca3af' : '#0ea5e9'} // Gray if locked
                strokeWidth={1.5}
                fill="transparent"
                listening={false}
                dash={isLocked ? [4, 4] : undefined} // Dashed if locked
              />

              {/* Transform handles - only if not locked */}
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
  - **Success Criteria:**
    - [ ] Locked objects cannot be dragged
    - [ ] Locked objects show selection outline (dashed gray) but no handles
    - [ ] Properties panel shows read-only values for locked objects
  - **Tests:**
    1. Select and lock rectangle → selection outline becomes dashed gray
    2. Try to drag → doesn't move
    3. No resize handles visible
    4. Select from panel → can see it's selected but can't modify
  - **Edge Cases:**
    - ⚠️ Can still select locked objects from panel (to unlock them)
    - ⚠️ Properties panel should disable inputs for locked objects

### 4.3.3 Prevent Deletion of Locked Objects

- [ ] **Action:** Filter locked objects from delete operations
  - **Why:** Locked objects cannot be deleted
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
    - Update: `src/features/layers-panel/hooks/useLayerShortcuts.ts`
  - **Implementation Details:**
    ```typescript
    // In canvasStore:
    removeObject: (id) => {
      const object = get().objects.find((obj) => obj.id === id);

      // Prevent deletion of locked objects
      if (object?.locked) {
        console.warn('Cannot delete locked object');
        return;
      }

      set((state) => ({
        objects: state.objects.filter((obj) => obj.id !== id),
        selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
      }));
    },

    // In useLayerShortcuts:
    // Delete
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
      e.preventDefault();

      const objects = useCanvasStore.getState().objects;

      // Filter out locked objects
      const unlocked = selectedIds.filter((id) => {
        const obj = objects.find((o) => o.id === id);
        return !obj?.locked;
      });

      unlocked.forEach((id) => removeObject(id));

      if (unlocked.length < selectedIds.length) {
        console.warn('Some locked objects were not deleted');
      }
    }
    ```
  - **Success Criteria:**
    - [ ] Delete key skips locked objects
    - [ ] Context menu "Delete" disabled for locked objects
    - [ ] Warning message if trying to delete locked
  - **Tests:**
    1. Select 3 objects (1 locked, 2 unlocked) → press Delete → only 2 deleted
    2. Lock object → right-click → "Delete" grayed out
    3. Try to delete locked via context menu → shows warning
  - **Edge Cases:**
    - ⚠️ Multi-select with mixed locked/unlocked → delete only unlocked
    - ⚠️ User feedback: Show warning when trying to delete locked

### 4.3.4 Update Context Menu for Locked Objects

- [ ] **Action:** Disable context menu actions for locked objects
  - **Why:** Provide visual feedback that actions are unavailable
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerContextMenu.tsx`
  - **Implementation Details:**
    ```typescript
    interface LayerContextMenuProps {
      children: React.ReactNode;
      objectId: string;
      isLocked: boolean; // Add this prop
      onRename: () => void;
      onDuplicate: () => void;
      onDelete: () => void;
      onBringToFront: () => void;
      onSendToBack: () => void;
      onToggleLock: () => void; // Add lock action
    }

    export function LayerContextMenu({
      isLocked,
      onToggleLock,
      ...
    }: LayerContextMenuProps) {
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {children}
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={onRename} disabled={isLocked}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem onClick={onDelete} disabled={isLocked} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onToggleLock}>
              {isLocked ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Lock
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onBringToFront} disabled={isLocked}>
              <ArrowUp className="w-4 h-4 mr-2" />
              Bring to Front
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendToBack} disabled={isLocked}>
              <ArrowDown className="w-4 h-4 mr-2" />
              Send to Back
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Locked objects: Rename, Delete, Reorder disabled
    - [ ] Lock/Unlock action always available
    - [ ] Duplicate always available (creates unlocked copy)
  - **Tests:**
    1. Right-click locked object → Rename, Delete, Reorder grayed out
    2. Click "Unlock" → object unlocked, menu items enabled
    3. Right-click unlocked → all items enabled
  - **Edge Cases:**
    - ⚠️ Duplicate creates unlocked copy (intentional)

---

## 4.4 Research Figma Lock Behavior

**Estimated Time:** 30 minutes

### 4.4.1 Document Figma Lock Patterns

- [x] **Action:** Research how Figma handles locks in different contexts
  - **Why:** Match industry-standard UX expectations
  - **Files Modified:**
    - Create: `_docs/research/figma-lock-behavior.md` ✅
    - Create: `_docs/research/lock-implementation-gaps.md` ✅
  - **Implementation Details:**
    Research and document:
    1. Where does lock icon appear? (Layers panel, canvas, properties panel?) ✅
    2. What actions are prevented? (Selection, drag, resize, delete, property edits?) ✅
    3. Can locked objects be selected from layers panel? ✅
    4. What visual indicators show locked state? (Icon, opacity, outline style?) ✅
    5. Do keyboard shortcuts work on locked objects? ✅
    6. Can locked parents have unlocked children? ✅
    7. Does locking parent lock all children? ✅
  - **Success Criteria:**
    - [x] Comprehensive understanding of Figma's lock behavior
    - [x] Identify any gaps in our implementation
  - **Tests:**
    1. Open Figma, lock an object ✅
    2. Try to select, drag, resize, delete → document what's prevented ✅
    3. Test with hierarchies → document parent/child lock behavior ✅
    4. Test keyboard shortcuts → document which work/don't work ✅
  - **Edge Cases:**
    - ⚠️ May discover additional requirements for Phase 4 ✅
    - ⚠️ Implement findings in Phase 4.4.2 if needed ✅
  - **Research Findings:**
    - **Keyboard Shortcut:** Shift+Cmd+L (not just Cmd+L) - NOT IMPLEMENTED YET
    - **Parent-Child Lock:** Locking parent locks ALL children - NOT IMPLEMENTED YET
    - **Selection Outline:** Normal blue outline (not dashed gray) - NEEDS FIX
    - **Lock Icon:** Shows in layers panel only (not on canvas) - ✅ CORRECT
    - **Selection Method:** Can select from layers panel but not canvas - ✅ CORRECT
    - **Prevented Actions:** Selection, drag, resize, delete - ✅ CORRECT

### 4.4.2 Implement Missing Lock Behaviors

- [x] **Action:** Add any lock behaviors discovered in Figma research
  - **Why:** Complete feature parity with Figma
  - **Files Modified:**
    - Updated: `src/features/toolbar/hooks/useToolShortcuts.ts` - Added Shift+Cmd/Ctrl+L keyboard shortcut
    - Updated: `src/constants/keyboardShortcuts.ts` - Added shortcut to documentation
    - Updated: `src/stores/canvasStore.ts` - Implemented parent-child lock cascading in toggleLock
    - Updated: `src/features/layers-panel/utils/hierarchy.ts` - Added hasLockedParent utility
    - Updated: `src/features/layers-panel/utils/index.ts` - Exported hasLockedParent
    - Updated: `src/features/layers-panel/components/LayerItem.tsx` - Added inherited lock indicator
    - Updated: `src/features/canvas-core/shapes/Rectangle.tsx` - Changed lock outline to solid blue
    - Updated: `src/features/canvas-core/shapes/Circle.tsx` - Changed lock outline to solid blue
    - Updated: `src/features/canvas-core/shapes/TextShape.tsx` - Changed lock outline to solid blue
    - Updated: `src/features/canvas-core/shapes/Line.tsx` - Changed lock outline to solid blue
  - **Implementation Details:**
    Implemented all 3 missing behaviors from research:
    1. **Keyboard Shortcut:** Shift+Cmd/Ctrl+L toggles lock for all selected objects with smart toggle (if any locked, unlock all; otherwise lock all)
    2. **Parent-Child Lock Cascading:** Locking parent automatically locks all descendants; unlocking parent unlocks all descendants; children show inherited lock state with dimmed icon
    3. **Selection Outline Style:** Changed from dashed gray (#9ca3af with dash) to solid blue (#0ea5e9 no dash) to match Figma behavior
  - **Success Criteria:**
    - [x] All discovered behaviors implemented
    - [x] Matches Figma UX patterns
  - **Tests:**
    - Keyboard shortcut: Select objects → Shift+Cmd+L → toggles lock state
    - Cascading: Lock parent → all children locked; unlock parent → all children unlocked
    - Outline: Select locked object → shows solid blue outline (no dash)
  - **Edge Cases:**
    - ✅ Keyboard shortcut works with multi-select
    - ✅ Inherited lock prevents unlocking child when parent is locked
    - ✅ All shape types (Rectangle, Circle, TextShape, Line) updated consistently

---

# Phase 5: Collapsible Layers Section (1-2 hours)

**Goal:** Add collapsible "Layers" header section to prepare for future pages feature.

---

## 5.1 Section Header Component

**Estimated Time:** 45-60 minutes

### 5.1.1 Create Collapsible Section Header

- [ ] **Action:** Create reusable section header component with collapse toggle
  - **Why:** Structure for future "Layers" vs "Pages" sections
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/SectionHeader.tsx`
  - **Implementation Details:**
    ```typescript
    import { ChevronDown } from 'lucide-react';
    import { memo } from 'react';

    interface SectionHeaderProps {
      title: string;
      isCollapsed: boolean;
      onToggle: () => void;
      count?: number; // Optional item count
    }

    /**
     * Section Header Component
     *
     * Collapsible section header for layers panel sections (Layers, Pages, etc.)
     * Matches Figma's section header UX with arrow toggle and item count.
     *
     * @param title - Section title (e.g., "Layers", "Pages")
     * @param isCollapsed - Whether section is collapsed
     * @param onToggle - Callback when toggle clicked
     * @param count - Optional number of items in section
     */
    export const SectionHeader = memo(function SectionHeader({
      title,
      isCollapsed,
      onToggle,
      count,
    }: SectionHeaderProps) {
      return (
        <button
          onClick={onToggle}
          className="w-full h-8 px-2 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-200"
        >
          {/* Toggle arrow */}
          <ChevronDown
            className={`
              w-3.5 h-3.5 text-gray-600 transition-transform duration-150
              ${isCollapsed ? '-rotate-90' : 'rotate-0'}
            `}
          />

          {/* Section title */}
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {title}
          </span>

          {/* Item count (optional) */}
          {count !== undefined && (
            <span className="text-xs text-gray-400 ml-auto">
              {count}
            </span>
          )}
        </button>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Header shows title and count
    - [ ] Arrow rotates when collapsed (-90°)
    - [ ] Click toggles collapse state
    - [ ] Hover shows gray background
  - **Tests:**
    1. Render with title="Layers", count=5 → see "LAYERS" and "5"
    2. Click → onToggle fires
    3. Render with isCollapsed=true → arrow points right
    4. Render with isCollapsed=false → arrow points down
    5. Hover → background becomes gray-50
  - **Edge Cases:**
    - ⚠️ Count is optional - don't show if undefined
    - ⚠️ Uppercase title for consistency with Figma

### 5.1.2 Integrate Section Header into LayersPanel

- [ ] **Action:** Add "Layers" section header with collapse functionality
  - **Why:** Organize panel, prepare for future "Pages" section
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { SectionHeader } from './SectionHeader';
    import { useState } from 'react';

    export function LayersPanel() {
      const [layersSectionCollapsed, setLayersSectionCollapsed] = useState(false);
      const objects = useCanvasStore((state) => state.objects);

      return (
        <aside className="...">
          {/* Main header */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-900">
              Playground Canvas
            </h2>
            <button onClick={toggleLeftSidebar} className="...">
              <ChevronLeft className="..." />
            </button>
          </div>

          {/* Search bar (if implemented) */}

          {/* Layers Section */}
          <SectionHeader
            title="Layers"
            isCollapsed={layersSectionCollapsed}
            onToggle={() => setLayersSectionCollapsed(!layersSectionCollapsed)}
            count={objects.length}
          />

          {/* Layer list - hidden if section collapsed */}
          {!layersSectionCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {/* ... existing layer list ... */}
            </div>
          )}

          {/* Future: Pages section */}
          {/*
          <SectionHeader
            title="Pages"
            isCollapsed={pagesSectionCollapsed}
            onToggle={...}
            count={pages.length}
          />
          */}
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] "LAYERS" header appears above layer list
    - [ ] Shows count of objects
    - [ ] Click collapses/expands layer list
    - [ ] Collapsed state hides layer list content
  - **Tests:**
    1. See "LAYERS" header with count
    2. Click header → layer list disappears
    3. Click again → layer list reappears
    4. Create/delete objects → count updates
  - **Edge Cases:**
    - ⚠️ Collapsed state is local (not persisted) - can add persistence later
    - ⚠️ Leave room for future "Pages" section below

### 5.1.3 Update Barrel Exports

- [ ] **Action:** Export SectionHeader component
  - **Why:** Enable imports
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/index.ts`
  - **Implementation Details:**
    ```typescript
    export { LayersPanel } from './LayersPanel';
    export { LayerIcon } from './LayerIcon';
    export { LayerItem } from './LayerItem';
    export { HierarchyArrow } from './HierarchyArrow';
    export { LayerContextMenu } from './LayerContextMenu';
    export { SectionHeader } from './SectionHeader';
    ```
  - **Success Criteria:**
    - [ ] Import works from components index
  - **Tests:**
    1. Import SectionHeader from components
    2. No errors
  - **Edge Cases:**
    - ⚠️ None expected

---

## 5.2 Persist Section State

**Estimated Time:** 15-30 minutes

### 5.2.1 Add Section State to UIStore

- [ ] **Action:** Persist collapse state in UIStore
  - **Why:** Remember user's section preferences
  - **Files Modified:**
    - Update: `src/stores/uiStore.ts`
  - **Implementation Details:**
    ```typescript
    interface UIStore {
      // ... existing ...

      // Section collapse states
      layersSectionCollapsed: boolean;
      pagesSectionCollapsed: boolean;

      // Actions
      toggleLayersSection: () => void;
      togglePagesSection: () => void;
    }

    export const useUIStore = create<UIStore>()(
      persist(
        (set) => ({
          // ... existing ...

          layersSectionCollapsed: false,
          pagesSectionCollapsed: false,

          toggleLayersSection: () =>
            set((state) => ({ layersSectionCollapsed: !state.layersSectionCollapsed })),
          togglePagesSection: () =>
            set((state) => ({ pagesSectionCollapsed: !state.pagesSectionCollapsed })),
        }),
        {
          name: 'ui-storage',
          partialize: (state) => ({
            leftSidebarOpen: state.leftSidebarOpen,
            rightSidebarOpen: state.rightSidebarOpen,
            layersSectionCollapsed: state.layersSectionCollapsed,
            pagesSectionCollapsed: state.pagesSectionCollapsed,
          }),
        }
      )
    );
    ```
  - **Success Criteria:**
    - [ ] Section state persists to localStorage
    - [ ] State survives page refresh
  - **Tests:**
    1. Collapse layers section → refresh page → still collapsed
    2. Expand → refresh → still expanded
  - **Edge Cases:**
    - ⚠️ LocalStorage full: Gracefully handled by Zustand persist

### 5.2.2 Use Persisted State in LayersPanel

- [ ] **Action:** Replace local state with UIStore state
  - **Why:** Persist across sessions
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { useUIStore } from '@/stores';

    export function LayersPanel() {
      // Remove: const [layersSectionCollapsed, setLayersSectionCollapsed] = useState(false);

      // Use UIStore:
      const layersSectionCollapsed = useUIStore((state) => state.layersSectionCollapsed);
      const toggleLayersSection = useUIStore((state) => state.toggleLayersSection);

      return (
        <aside>
          <SectionHeader
            title="Layers"
            isCollapsed={layersSectionCollapsed}
            onToggle={toggleLayersSection}
            count={objects.length}
          />
          {/* ... */}
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Uses UIStore state
    - [ ] Persists across refreshes
  - **Tests:**
    1. Collapse section → refresh → still collapsed
  - **Edge Cases:**
    - ⚠️ None expected

---

# Phase 6: Testing & Polish (2-3 hours)

**Goal:** Comprehensive testing of all new features, fix bugs, polish UX.

---

## 6.1 Comprehensive Feature Testing

**Estimated Time:** 1.5-2 hours

### 6.1.1 Test All Enhancements Together

- [ ] **Action:** Systematic testing of all new features
  - **Why:** Ensure everything works together without conflicts
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] All features work individually
    - [ ] All features work together
    - [ ] No regressions in existing features
  - **Tests:**
    1. **Full-Item Dragging:**
       - Drag layer from any part → reorders
       - Drag from name → works
       - Drag from icon → works
       - Rename input doesn't trigger drag
    2. **Hierarchy:**
       - Create parent-child relationships
       - Collapse parent → children hide
       - Expand parent → children show
       - Select parent → all children selected
       - Drag to create hierarchy (if implemented)
       - Deep nesting (3+ levels) works
    3. **Shift-Click Selection:**
       - Click layer 1 → Shift+click layer 5 → range selected
       - Works in both directions
       - Adds to existing selection
       - Works with hierarchies
    4. **Lock Feature:**
       - Lock object → can't select on canvas
       - Lock object → can't drag/resize
       - Lock object → can't delete
       - Lock icon appears/disappears correctly
       - Context menu disables actions for locked
       - Locked objects selectable from panel (to unlock)
    5. **Section Header:**
       - "Layers" section collapses/expands
       - Shows object count
       - State persists across refreshes
    6. **Integration:**
       - Lock parent → can't select, children still accessible?
       - Shift-select range including locked → only unlocked selected?
       - Drag locked object in panel → ???
       - Search with hierarchy → filters correctly?
  - **Edge Cases:**
    - ⚠️ Complex interactions need thorough testing
    - ⚠️ Document any unexpected behaviors

### 6.1.2 Multi-User Testing

- [ ] **Action:** Test real-time sync of new features
  - **Why:** Ensure collaborative features work
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] Hierarchy changes sync across users
    - [ ] Lock state syncs across users
    - [ ] Collapse state is local (doesn't sync - intended)
    - [ ] Selection syncs (existing behavior)
  - **Tests:**
    1. User A creates hierarchy → User B sees hierarchy
    2. User A collapses parent → User B's view unchanged (local state)
    3. User A locks object → User B can't select it
    4. User A unlocks → User B can select again
    5. User A renames → User B sees new name
  - **Edge Cases:**
    - ⚠️ Concurrent edits: Last write wins (RTDB behavior)
    - ⚠️ Network latency: Changes may take up to 200ms

---

## 6.2 Performance Testing

**Estimated Time:** 30 minutes

### 6.2.1 Test Performance with Large Datasets

- [ ] **Action:** Verify performance with 100+ objects and hierarchies
  - **Why:** Ensure 60 FPS target met with new features
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] 60 FPS with 100 flat objects
    - [ ] 60 FPS with 50 parents, 100 children (150 total)
    - [ ] Smooth expand/collapse animations
    - [ ] No lag in drag-drop
  - **Tests:**
    1. Create 100 flat objects → scroll panel → 60 FPS
    2. Create 10 parents with 10 children each → expand all → 60 FPS
    3. Collapse all → 60 FPS
    4. Drag layer with 50 children → smooth drag
    5. Chrome DevTools Performance tab → verify frame time < 16ms
  - **Edge Cases:**
    - ⚠️ Deep hierarchies (10+ levels) may impact performance
    - ⚠️ Virtual scrolling (from base plan) should handle large lists

---

## 6.3 Bug Fixes and Polish

**Estimated Time:** 30-45 minutes

### 6.3.1 Fix Any Discovered Issues

- [ ] **Action:** Address bugs found during testing
  - **Why:** Production-ready quality
  - **Files Modified:**
    - TBD based on bugs found
  - **Implementation Details:**
    Document bugs as they're found:
    1. [Bug description]
       - Steps to reproduce
       - Expected behavior
       - Actual behavior
       - Fix applied
  - **Success Criteria:**
    - [ ] All critical bugs fixed
    - [ ] No regressions
  - **Tests:**
    Re-run all test cases after fixes
  - **Edge Cases:**
    - ⚠️ May uncover additional tasks

### 6.3.2 Polish UX Details

- [ ] **Action:** Fine-tune animations, spacing, colors
  - **Why:** Professional, polished feel
  - **Files Modified:**
    - Various component files
  - **Implementation Details:**
    - Smooth transitions (200ms standard)
    - Consistent spacing (8px, 16px, 24px grid)
    - Subtle hover states (gray-50 backgrounds)
    - Clear focus indicators (blue rings)
    - Proper ARIA labels for accessibility
  - **Success Criteria:**
    - [ ] All animations smooth
    - [ ] Consistent spacing throughout
    - [ ] Hover states feel responsive
    - [ ] Keyboard navigation works
  - **Tests:**
    1. Tab through all interactive elements → focus visible
    2. Screen reader announces all actions correctly
    3. Animations at 60 FPS
  - **Edge Cases:**
    - ⚠️ Accessibility: Test with keyboard only
    - ⚠️ Accessibility: Test with screen reader

---

# Phase 7: Documentation (1 hour)

**Goal:** Document new features for future reference and onboarding.

---

## 7.1 Update Documentation

**Estimated Time:** 30-45 minutes

### 7.1.1 Document Hierarchy System

- [x] **Action:** Add hierarchy documentation to codebase
  - **Why:** Help future developers understand system
  - **Files Modified:**
    - Create: `_docs/features/hierarchy-system.md`
  - **Implementation Details:**
    Document:
    - Data model (parentId, isCollapsed)
    - Utility functions (buildHierarchyTree, flattenHierarchyTree)
    - How to create hierarchy (drag-drop or setParent)
    - How to select groups (selectWithDescendants)
    - How to prevent circular references
    - Performance considerations
  - **Success Criteria:**
    - [ ] Clear documentation with examples
    - [ ] Code snippets for common operations
  - **Tests:**
    Ask another developer to review for clarity
  - **Edge Cases:**
    - ⚠️ None expected

### 7.1.2 Document Lock System

- [x] **Action:** Add lock feature documentation
  - **Why:** Document lock behavior and edge cases
  - **Files Modified:**
    - Create: `_docs/features/lock-system.md`
  - **Implementation Details:**
    Document:
    - How lock works (prevents selection, drag, edit, delete)
    - How to lock/unlock (icon, context menu, keyboard?)
    - What's allowed when locked (can still select from panel, toggle visibility)
    - Multi-user behavior (lock syncs)
    - Figma parity notes (from research)
  - **Success Criteria:**
    - [ ] Comprehensive lock behavior documentation
  - **Tests:**
    Review for completeness
  - **Edge Cases:**
    - ⚠️ None expected

### 7.1.3 Update CLAUDE.md with New Patterns

- [x] **Action:** Add hierarchy and lock patterns to project guide
  - **Why:** Ensure Claude Code generates consistent code
  - **Files Modified:**
    - Update: `CLAUDE.md`
  - **Implementation Details:**
    Add sections:
    - Hierarchy utilities (buildHierarchyTree, etc.)
    - Lock behavior (how to check locked state)
    - Section header pattern (for future features)
  - **Success Criteria:**
    - [ ] Future AI-generated code follows these patterns
  - **Tests:**
    Ask Claude Code to generate hierarchy-related code, verify it uses utilities
  - **Edge Cases:**
    - ⚠️ None expected

---

## 7.2 Create Usage Examples

**Estimated Time:** 15-20 minutes

### 7.2.1 Add Example Code Snippets

- [x] **Action:** Create example snippets for common operations
  - **Why:** Quick reference for developers
  - **Files Modified:**
    - Create: `_docs/examples/hierarchy-examples.ts`
    - Create: `_docs/examples/lock-examples.ts`
  - **Implementation Details:**
    ```typescript
    // hierarchy-examples.ts

    // Example 1: Create parent-child relationship
    import { useCanvasStore } from '@/stores';

    function makeChild(childId: string, parentId: string) {
      const setParent = useCanvasStore.getState().setParent;
      setParent(childId, parentId);
    }

    // Example 2: Select entire group
    function selectGroup(parentId: string) {
      const selectWithDescendants = useCanvasStore.getState().selectWithDescendants;
      selectWithDescendants(parentId);
    }

    // Example 3: Build and display hierarchy
    import { buildHierarchyTree, flattenHierarchyTree } from '@/features/layers-panel/utils';

    function getDisplayLayers() {
      const objects = useCanvasStore.getState().objects;
      const tree = buildHierarchyTree(objects);
      const flattened = flattenHierarchyTree(tree, false); // Hide collapsed children
      return flattened.reverse(); // Top = front
    }
    ```
  - **Success Criteria:**
    - [ ] Examples cover common use cases
    - [ ] Code is tested and works
  - **Tests:**
    Run example code, verify it works
  - **Edge Cases:**
    - ⚠️ None expected

---

# Summary & Next Steps

## Completion Checklist

Before marking this plan complete, verify:

- [ ] All tasks have checkboxes marked [x]
- [ ] All tests have passed
- [ ] No critical bugs remain
- [ ] Performance meets 60 FPS target
- [ ] Multi-user sync works correctly
- [ ] Documentation is complete
- [ ] Code follows project style guide (CLAUDE.md)

## Known Limitations

Document any features not implemented:
1. Advanced drag-drop (drop zones for child vs sibling) - May be simplified to modifier key
2. Deep hierarchy performance optimization (if > 10 levels needed)
3. Shift-hover range preview - May be deferred if complex
4. Keyboard shortcut for lock toggle - Not in initial scope

## Future Enhancements

Ideas for later:
1. Multi-level undo/redo for hierarchy changes
2. Drag multiple selected objects while maintaining hierarchy
3. Copy/paste hierarchy groups
4. Collapse/expand all shortcut
5. Search filters hierarchy (show matching + parents)
6. Export hierarchy as JSON/SVG/PNG
7. Lock parent locks all children (optional behavior)
8. Pages section (uses same section header pattern)

## Estimated Total Time

| Phase | Estimated Time |
|-------|----------------|
| Phase 0: Research & Planning | 30-45 min |
| Phase 1: Full-Item Dragging | 1-2 hours |
| Phase 2: Hierarchy System | 6-8 hours |
| Phase 3: Shift-Click Selection | 1-2 hours |
| Phase 4: Lock Feature | 2-3 hours |
| Phase 5: Collapsible Sections | 1-2 hours |
| Phase 6: Testing & Polish | 2-3 hours |
| Phase 7: Documentation | 1 hour |
| **Total** | **18-22 hours** |

---

## Execution Notes

When ready to execute:
```bash
# In Claude Code terminal
/execute-plan @_docs/plan/left-sidebar-enhancements.md
```

The plan-coordinator will:
1. Parse this plan
2. Execute each task via task-executor
3. Update checkboxes as tasks complete
4. Report progress and blockers
5. Ask for clarification when needed

Your role:
- Monitor progress
- Respond to blocker questions
- Approve UX decisions (e.g., drag-drop child vs sibling strategy)
- Test integration at phase boundaries
- Provide feedback on polish details
