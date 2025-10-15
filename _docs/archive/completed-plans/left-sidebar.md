# Left Sidebar (Layers Panel) - Implementation Plan

**Goal:** Build a production-quality layers panel with Figma-inspired UX, featuring automatic layer naming, bidirectional hover sync, drag-to-reorder, visibility toggles, and full real-time collaboration support.

**Estimated Time:** 20-25 hours

**Key Features:**
- Toggle sidebar (240px width, smooth animations)
- Hierarchical layer list with type-specific icons
- Auto-generated layer names with gap-filling ("Rectangle 1", "Rectangle 2")
- Inline rename with double-click
- Bidirectional hover (panel ↔ canvas)
- Multi-select integration (Shift/Cmd+click)
- Drag-to-reorder (updates z-index)
- Visibility toggle (eye icon)
- Context menu (rename, duplicate, delete, reorder)
- Keyboard shortcuts
- 60 FPS with 100+ layers (virtual scrolling)

**Progress Tracker:** Track every task as you complete it. Each task is tested individually before moving forward.

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

**Figma Layers Panel Patterns (from documentation):**
- Hierarchical structure with collapse/expand functionality
- Each layer has an icon indicating its type (frame, group, component, text, shape)
- Layers can be selected, renamed, reordered (affects z-index)
- Visibility toggle (eye icon) for each layer
- Lock/unlock functionality
- Hover states highlight both layer in panel and object on canvas
- Panel width is adjustable
- Keyboard shortcuts for navigation

**Current Codebase Structure:**
- Right sidebar: PropertiesPanel (240px width) at `/features/properties-panel`
- Canvas: CanvasStage with objects rendered in layers
- Store: canvasStore manages objects, selection, zoom, pan
- Objects: Rectangle, Circle, Text, Line types with BaseCanvasObject interface
- No existing sidebar infrastructure on the left side

**Design Constraints:**
- Match right sidebar width (240px) for visual consistency
- Use same styling patterns (border-gray-200, text-xs, etc.)
- Maintain 60 FPS performance with 100+ objects
- Real-time sync with Firebase Realtime DB

**Architecture Decisions:**
- Use vertical slice architecture: `/features/layers-panel/`
- Centralize UI state in new `uiStore` (sidebar open/close, hover state)
- Layer naming utility with gap-filling algorithm
- Virtual scrolling with `react-window` for 100+ layers
- `@dnd-kit` for drag-and-drop reordering

---

# Phase 1: Core Infrastructure (3-4 hours)

**Goal:** Create basic left sidebar structure with toggle functionality and layer list display.

---

## 1.1 Create UI Store for Sidebar State

**Estimated Time:** 30-45 minutes

### 1.1.1 Create UI Store

- [ ] **Action:** Create `src/stores/uiStore.ts` with sidebar and hover state management
  - **Why:** Centralize UI state separate from canvas data state
  - **Files Modified:**
    - Create: `src/stores/uiStore.ts`
  - **Implementation Details:**
    ```typescript
    import { create } from 'zustand';
    import { persist } from 'zustand/middleware';

    interface UIStore {
      // Sidebar state
      leftSidebarOpen: boolean;
      rightSidebarOpen: boolean;

      // Hover state for bidirectional sync
      hoveredObjectId: string | null;

      // Actions
      toggleLeftSidebar: () => void;
      toggleRightSidebar: () => void;
      setLeftSidebarOpen: (isOpen: boolean) => void;
      setRightSidebarOpen: (isOpen: boolean) => void;
      setHoveredObject: (id: string | null) => void;
    }

    export const useUIStore = create<UIStore>()(
      persist(
        (set) => ({
          leftSidebarOpen: true,
          rightSidebarOpen: true,
          hoveredObjectId: null,

          toggleLeftSidebar: () =>
            set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
          toggleRightSidebar: () =>
            set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
          setLeftSidebarOpen: (isOpen) => set({ leftSidebarOpen: isOpen }),
          setRightSidebarOpen: (isOpen) => set({ rightSidebarOpen: isOpen }),
          setHoveredObject: (id) => set({ hoveredObjectId: id }),
        }),
        {
          name: 'ui-storage', // localStorage key
          partialize: (state) => ({
            leftSidebarOpen: state.leftSidebarOpen,
            rightSidebarOpen: state.rightSidebarOpen,
          }),
        }
      )
    );
    ```
  - **Success Criteria:**
    - [ ] Store created with full TypeScript support
    - [ ] All methods have JSDoc comments
    - [ ] State persists to localStorage
    - [ ] No TypeScript errors
  - **Tests:**
    1. Import in console: `import { useUIStore } from '@/stores/uiStore'`
    2. Toggle sidebar: `useUIStore.getState().toggleLeftSidebar()`
    3. Check state: `useUIStore.getState().leftSidebarOpen === false`
    4. Refresh page: State persists from localStorage
  - **Edge Cases:**
    - ⚠️ LocalStorage full: Zustand persist handles gracefully
    - ⚠️ Invalid localStorage data: Middleware resets to defaults

### 1.1.2 Add Store to Barrel Export

- [ ] **Action:** Update `src/stores/index.ts` to export uiStore
  - **Why:** Enable clean imports throughout the app
  - **Files Modified:**
    - Update: `src/stores/index.ts`
  - **Implementation Details:**
    ```typescript
    export { useCanvasStore } from './canvasStore';
    export { useAuthStore } from './authStore';
    export { useUIStore } from './uiStore'; // Add this line
    ```
  - **Success Criteria:**
    - [ ] Import works: `import { useUIStore } from '@/stores'`
    - [ ] No circular dependencies
    - [ ] TypeScript autocomplete works
  - **Tests:**
    1. In any file: `import { useUIStore } from '@/stores'`
    2. Verify TypeScript shows autocomplete for all UIStore methods
    3. No import errors in console
  - **Edge Cases:**
    - ⚠️ None expected for barrel export

---

## 1.2 Create Left Sidebar Feature Slice

**Estimated Time:** 15-20 minutes

### 1.2.1 Create Feature Directory Structure

- [ ] **Action:** Create complete directory structure for layers-panel feature
  - **Why:** Follow vertical slice architecture pattern from CLAUDE.md
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/index.ts`
    - Create: `src/features/layers-panel/hooks/index.ts`
    - Create: `src/features/layers-panel/utils/index.ts`
    - Create: `src/features/layers-panel/index.ts`
  - **Implementation Details:**
    ```bash
    mkdir -p src/features/layers-panel/components
    mkdir -p src/features/layers-panel/hooks
    mkdir -p src/features/layers-panel/utils
    touch src/features/layers-panel/components/index.ts
    touch src/features/layers-panel/hooks/index.ts
    touch src/features/layers-panel/utils/index.ts
    touch src/features/layers-panel/index.ts
    ```

    Each `index.ts` starts as empty barrel export:
    ```typescript
    // Barrel exports - add exports as components are created
    ```
  - **Success Criteria:**
    - [ ] All directories created
    - [ ] All index.ts files exist
    - [ ] Structure matches vertical slice pattern
  - **Tests:**
    1. Run: `ls -la src/features/layers-panel`
    2. Verify: components/, hooks/, utils/, index.ts all exist
    3. Check: Each subdirectory has index.ts file
  - **Edge Cases:**
    - ⚠️ None expected for directory creation

---

## 1.3 Implement Basic LayersPanel Component

**Estimated Time:** 1.5-2 hours

### 1.3.1 Create LayersPanel Component

- [ ] **Action:** Create `LayersPanel.tsx` with header, toggle, and layer list container
  - **Why:** Main container component for the layers panel feature
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    'use client';

    import { useCanvasStore } from '@/stores/canvasStore';
    import { useUIStore } from '@/stores/uiStore';
    import { ChevronLeft } from 'lucide-react';

    /**
     * Layers Panel Component
     *
     * Displays a hierarchical list of all canvas objects with controls for:
     * - Selection, renaming, reordering
     * - Visibility toggling
     * - Bidirectional hover sync with canvas
     *
     * @component
     */
    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);
      const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);
      const toggleLeftSidebar = useUIStore((state) => state.toggleLeftSidebar);

      return (
        <aside
          className={`
            fixed left-0 top-0 bottom-0 z-20
            w-[240px] bg-white border-r border-gray-200
            transition-transform duration-200 ease-in-out
            ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Header */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-900">
              Playground Canvas
            </h2>
            <button
              onClick={toggleLeftSidebar}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Toggle layers panel"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Layers List Container */}
          <div className="flex-1 overflow-y-auto">
            {objects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No objects on canvas</p>
              </div>
            ) : (
              <div className="p-2">
                {/* LayerItem components will be rendered here */}
                {objects.slice().reverse().map((obj) => (
                  <div key={obj.id} className="h-8 px-2 flex items-center text-xs">
                    {obj.type} - {obj.id.slice(0, 8)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Component renders with correct styling
    - [ ] Header shows "Playground Canvas" title
    - [ ] Toggle button collapses/expands panel
    - [ ] Empty state shows when no objects
    - [ ] Panel is 240px wide
    - [ ] Smooth slide animation (200ms)
    - [ ] File under 200 lines
  - **Tests:**
    1. Import and render component in CanvasPage
    2. Click toggle button → panel slides out
    3. Click toggle button again → panel slides in
    4. Create object on canvas → verify it appears in list
    5. Delete all objects → see empty state
  - **Edge Cases:**
    - ⚠️ Panel should not cover canvas when closed (use negative translate)
    - ⚠️ Z-index must be below modals but above canvas

### 1.3.2 Update CanvasPage Layout

- [ ] **Action:** Integrate LayersPanel into CanvasPage with responsive layout
  - **Why:** Panel needs to adjust canvas positioning when open/closed
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx` (or equivalent page file)
  - **Implementation Details:**
    ```typescript
    import { LayersPanel } from '@/features/layers-panel';
    import { useUIStore } from '@/stores';

    export function CanvasPage() {
      const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);

      return (
        <div className="h-screen w-screen overflow-hidden">
          {/* Layers Panel */}
          <LayersPanel />

          {/* Canvas Container - shifts when sidebar opens */}
          <div
            className={`
              h-full transition-[margin-left] duration-200
              ${leftSidebarOpen ? 'ml-[240px]' : 'ml-0'}
            `}
          >
            {/* Existing CanvasStage component */}
            <CanvasStage />
          </div>

          {/* Right sidebar remains fixed on right */}
        </div>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] LayersPanel renders on left side
    - [ ] Canvas shifts smoothly when panel toggles
    - [ ] No overlap between left sidebar (240px) and right sidebar
    - [ ] Smooth transition matches panel animation
  - **Tests:**
    1. Open app → panel visible by default
    2. Toggle panel closed → canvas expands to full width
    3. Toggle panel open → canvas shrinks, no overlap with right sidebar
    4. Verify transition is smooth (200ms, no jank)
  - **Edge Cases:**
    - ⚠️ Both sidebars open: Canvas should fit in remaining space
    - ⚠️ Mobile viewport: Consider hiding layers panel by default

### 1.3.3 Add External Toggle Button

- [ ] **Action:** Create floating toggle button outside panel (always visible)
  - **Why:** Users need way to open panel when closed
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { Layers, ChevronLeft } from 'lucide-react';

    export function LayersPanel() {
      // ... existing code ...

      return (
        <>
          {/* Floating Toggle Button (always visible) */}
          <button
            onClick={toggleLeftSidebar}
            className={`
              fixed top-4 left-4 z-30
              w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm
              flex items-center justify-center
              hover:bg-gray-50 transition-colors
            `}
            aria-label={leftSidebarOpen ? 'Close layers panel' : 'Open layers panel'}
          >
            {leftSidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            ) : (
              <Layers className="w-4 h-4 text-gray-700" />
            )}
          </button>

          {/* Panel (existing code) */}
          <aside className="...">
            {/* ... */}
          </aside>
        </>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Button floats in top-left corner (fixed position)
    - [ ] Button shows Layers icon when closed, ChevronLeft when open
    - [ ] Button z-index (30) is above panel (20)
    - [ ] Hover state works (bg-gray-50)
  - **Tests:**
    1. Panel open → click button → panel closes, button shows Layers icon
    2. Panel closed → click button → panel opens, button shows ChevronLeft
    3. Button always visible regardless of panel state
  - **Edge Cases:**
    - ⚠️ Ensure button doesn't overlap with MenuButton or other controls
    - ⚠️ Adjust MenuButton position if needed (move down or right)

### 1.3.4 Update Barrel Exports

- [ ] **Action:** Export LayersPanel from feature index files
  - **Why:** Enable clean imports: `import { LayersPanel } from '@/features/layers-panel'`
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/index.ts`
    - Update: `src/features/layers-panel/index.ts`
  - **Implementation Details:**
    ```typescript
    // src/features/layers-panel/components/index.ts
    export { LayersPanel } from './LayersPanel';

    // src/features/layers-panel/index.ts
    export { LayersPanel } from './components';
    ```
  - **Success Criteria:**
    - [ ] Import works: `import { LayersPanel } from '@/features/layers-panel'`
    - [ ] TypeScript autocomplete shows LayersPanel
  - **Tests:**
    1. In CanvasPage: `import { LayersPanel } from '@/features/layers-panel'`
    2. Verify no import errors
  - **Edge Cases:**
    - ⚠️ None expected

---

## 1.4 Layer List Display

**Estimated Time:** 1-1.5 hours

### 1.4.1 Create LayerIcon Component

- [ ] **Action:** Create type-specific icon component for each shape type
  - **Why:** Visual distinction between rectangles, circles, text, lines
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/LayerIcon.tsx`
  - **Implementation Details:**
    ```typescript
    import { Square, Circle, Type, Minus } from 'lucide-react';
    import type { ShapeType } from '@/types/canvas.types';

    interface LayerIconProps {
      type: ShapeType;
      className?: string;
    }

    /**
     * Layer Icon Component
     *
     * Renders type-specific icon for canvas objects
     *
     * @param type - Shape type (rectangle, circle, text, line)
     * @param className - Optional additional classes
     */
    export function LayerIcon({ type, className = '' }: LayerIconProps) {
      const iconProps = {
        className: `w-4 h-4 text-gray-600 ${className}`,
        strokeWidth: 2,
      };

      switch (type) {
        case 'rectangle':
          return <Square {...iconProps} />;
        case 'circle':
          return <Circle {...iconProps} />;
        case 'text':
          return <Type {...iconProps} />;
        case 'line':
          return <Minus {...iconProps} />;
        default:
          // Fallback for unknown types
          return <Square {...iconProps} className={`${iconProps.className} opacity-30`} />;
      }
    }
    ```
  - **Success Criteria:**
    - [ ] Icon renders for each type (rectangle, circle, text, line)
    - [ ] Icon size is 16x16px (w-4 h-4)
    - [ ] Icon color is gray-600
    - [ ] Unknown types show faded square icon
  - **Tests:**
    1. Render with type="rectangle" → see Square icon
    2. Render with type="circle" → see Circle icon
    3. Render with type="text" → see Type icon
    4. Render with type="line" → see Minus icon
    5. Render with type="unknown" → see faded Square icon
  - **Edge Cases:**
    - ⚠️ Handle undefined/null type gracefully with fallback

### 1.4.2 Create LayerItem Component

- [ ] **Action:** Create individual layer row component with selection and hover states
  - **Why:** Reusable component for each layer in the list
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { memo } from 'react';
    import type { CanvasObject } from '@/types/canvas.types';
    import { LayerIcon } from './LayerIcon';

    interface LayerItemProps {
      object: CanvasObject;
      isSelected: boolean;
      isHovered: boolean;
      onSelect: () => void;
      onHover: () => void;
      onHoverEnd: () => void;
    }

    /**
     * Layer Item Component
     *
     * Individual row in layers panel representing one canvas object
     *
     * @component
     */
    export const LayerItem = memo(function LayerItem({
      object,
      isSelected,
      isHovered,
      onSelect,
      onHover,
      onHoverEnd,
    }: LayerItemProps) {
      return (
        <div
          onClick={onSelect}
          onMouseEnter={onHover}
          onMouseLeave={onHoverEnd}
          className={`
            h-8 px-2 py-1 flex items-center gap-2 cursor-pointer
            transition-colors duration-75
            ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
            ${!isSelected && isHovered ? 'bg-gray-50' : ''}
          `}
        >
          <LayerIcon type={object.type} />
          <span className={`
            text-xs truncate max-w-[160px]
            ${isSelected ? 'font-medium text-gray-900' : 'font-normal text-gray-700'}
          `}>
            {object.name || `${object.type} ${object.id.slice(0, 4)}`}
          </span>
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Layer row is 32px tall (h-8)
    - [ ] Selected state shows blue background + blue left border
    - [ ] Hover state shows gray background (when not selected)
    - [ ] Layer name truncates at 160px with ellipsis
    - [ ] Component wrapped in React.memo for performance
  - **Tests:**
    1. Render with isSelected=true → see blue background, blue border
    2. Render with isSelected=false, isHovered=true → see gray background
    3. Render with long name (50 chars) → see truncation with ellipsis
    4. Click layer → onSelect callback fires
    5. Hover layer → onHover callback fires
  - **Edge Cases:**
    - ⚠️ Missing name property → show fallback: "{type} {id}"
    - ⚠️ Selected AND hovered → selected style takes priority

### 1.4.3 Render Layer List in LayersPanel

- [ ] **Action:** Update LayersPanel to render LayerItem for each object
  - **Why:** Connect LayerItem components to canvas data
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { LayerItem } from './LayerItem';
    import { useCanvasStore } from '@/stores/canvasStore';
    import { useUIStore } from '@/stores/uiStore';

    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);
      const selectedIds = useCanvasStore((state) => state.selectedIds);
      const selectObjects = useCanvasStore((state) => state.selectObjects);
      const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);
      const setHoveredObject = useUIStore((state) => state.setHoveredObject);

      return (
        <aside className="...">
          {/* Header */}

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto">
            {objects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No objects on canvas</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {/* Reverse array: top of list = front of canvas */}
                {objects.slice().reverse().map((obj) => (
                  <LayerItem
                    key={obj.id}
                    object={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    isHovered={hoveredObjectId === obj.id}
                    onSelect={() => selectObjects([obj.id])}
                    onHover={() => setHoveredObject(obj.id)}
                    onHoverEnd={() => setHoveredObject(null)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] All canvas objects appear in layers list
    - [ ] Z-order is correct (top of list = front of canvas)
    - [ ] Selection state syncs with canvas
    - [ ] Clicking layer selects object on canvas
  - **Tests:**
    1. Create 5 shapes on canvas → see 5 layers in panel
    2. Most recent shape appears at top of list
    3. Click layer → object selects on canvas (shows selection box)
    4. Click object on canvas → layer highlights in panel
    5. Delete object → layer disappears from panel
  - **Edge Cases:**
    - ⚠️ Empty array: Show empty state
    - ⚠️ Array reverse doesn't mutate original (use .slice() first)

### 1.4.4 Update Barrel Exports

- [ ] **Action:** Export LayerIcon and LayerItem from components index
  - **Why:** Enable imports within the feature
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/index.ts`
  - **Implementation Details:**
    ```typescript
    export { LayersPanel } from './LayersPanel';
    export { LayerIcon } from './LayerIcon';
    export { LayerItem } from './LayerItem';
    ```
  - **Success Criteria:**
    - [ ] All exports work from barrel
  - **Tests:**
    1. Import all three components from '@/features/layers-panel/components'
    2. No import errors
  - **Edge Cases:**
    - ⚠️ None expected

---

# Phase 2: Layer Naming System (2-3 hours)

**Goal:** Implement automatic layer naming with duplicate numbering and gap-filling (e.g., "Rectangle 1", "Rectangle 2").

---

## 2.1 Layer Name Generation

**Estimated Time:** 1.5-2 hours

### 2.1.1 Add Name Property to Canvas Objects

- [ ] **Action:** Update `BaseCanvasObject` interface to include optional `name` property
  - **Why:** Store custom and auto-generated layer names
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
    ```typescript
    export interface BaseCanvasObject {
      id: string;
      type: ShapeType;
      x: number;
      y: number;
      createdBy: string;
      createdAt: number;
      updatedAt: number;
      name?: string; // Add this property (optional)
    }
    ```
  - **Success Criteria:**
    - [ ] Property added to interface
    - [ ] No TypeScript errors in project
    - [ ] Existing objects without name still work
  - **Tests:**
    1. Run: `npm run type-check` (or `tsc --noEmit`)
    2. Verify: No errors related to name property
    3. Create object without name → no errors
    4. Create object with name → name persists
  - **Edge Cases:**
    - ⚠️ Optional property: Defaults to undefined if not provided
    - ⚠️ Backward compatible with existing objects

### 2.1.2 Create Layer Naming Utility

- [ ] **Action:** Create `layerNaming.ts` with smart name generation and gap-filling
  - **Why:** Auto-generate names like "Rectangle 1", "Rectangle 2" with gap filling
  - **Files Modified:**
    - Create: `src/features/layers-panel/utils/layerNaming.ts`
  - **Implementation Details:**
    ```typescript
    import type { CanvasObject, ShapeType } from '@/types/canvas.types';

    /**
     * Get base name for shape type
     *
     * @param type - Shape type
     * @returns Human-readable base name
     */
    export function getBaseName(type: ShapeType): string {
      const nameMap: Record<ShapeType, string> = {
        rectangle: 'Rectangle',
        circle: 'Circle',
        text: 'Text',
        line: 'Line',
      };
      return nameMap[type] || 'Object';
    }

    /**
     * Parse layer number from name
     *
     * @param name - Layer name (e.g., "Rectangle 5")
     * @returns Number or null if not auto-generated
     *
     * @example
     * parseLayerNumber("Rectangle 5") // returns 5
     * parseLayerNumber("My Shape") // returns null
     */
    export function parseLayerNumber(name: string | undefined): number | null {
      if (!name) return null;

      // Match pattern: "Word Number" (e.g., "Rectangle 5")
      const match = name.match(/^[A-Za-z]+\s+(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    }

    /**
     * Generate layer name with gap-filling
     *
     * Finds the lowest available number for this shape type.
     * If layers "Rectangle 1", "Rectangle 3" exist, returns "Rectangle 2"
     *
     * @param type - Shape type
     * @param objects - All canvas objects
     * @returns Generated name (e.g., "Rectangle 2")
     *
     * @example
     * // Existing: Rectangle 1, Rectangle 3
     * generateLayerName('rectangle', objects) // "Rectangle 2" (fills gap)
     *
     * // Existing: Rectangle 1, Rectangle 2, Rectangle 3
     * generateLayerName('rectangle', objects) // "Rectangle 4" (next)
     */
    export function generateLayerName(
      type: ShapeType,
      objects: CanvasObject[]
    ): string {
      const baseName = getBaseName(type);

      // Filter to same type
      const sameTypeObjects = objects.filter((obj) => obj.type === type);

      // Extract existing numbers (only from auto-generated names)
      const existingNumbers = sameTypeObjects
        .map((obj) => parseLayerNumber(obj.name))
        .filter((num): num is number => num !== null)
        .sort((a, b) => a - b);

      // Find lowest available number (including gaps)
      let nextNumber = 1;
      for (const num of existingNumbers) {
        if (num === nextNumber) {
          nextNumber++;
        } else if (num > nextNumber) {
          break; // Found a gap
        }
      }

      return `${baseName} ${nextNumber}`;
    }
    ```
  - **Success Criteria:**
    - [ ] All functions have JSDoc comments
    - [ ] Functions handle edge cases (empty array, gaps, duplicates)
    - [ ] TypeScript strict mode passes
    - [ ] File under 150 lines
  - **Tests:**
    1. **Test: No objects**
       - Input: `generateLayerName('rectangle', [])`
       - Expected: `"Rectangle 1"`
    2. **Test: Sequential objects**
       - Objects: Rectangle 1, Rectangle 2, Rectangle 3
       - Input: `generateLayerName('rectangle', objects)`
       - Expected: `"Rectangle 4"`
    3. **Test: Gap in numbering**
       - Objects: Rectangle 1, Rectangle 3
       - Input: `generateLayerName('rectangle', objects)`
       - Expected: `"Rectangle 2"` (fills gap)
    4. **Test: Custom names ignored**
       - Objects: Rectangle 1, "My Shape", Rectangle 3
       - Input: `generateLayerName('rectangle', objects)`
       - Expected: `"Rectangle 2"` (ignores "My Shape")
    5. **Test: Mixed types**
       - Objects: Rectangle 1, Circle 1, Rectangle 2
       - Input: `generateLayerName('rectangle', objects)`
       - Expected: `"Rectangle 3"`
    6. **Test: Parse layer number**
       - Input: `parseLayerNumber("Rectangle 5")`
       - Expected: `5`
       - Input: `parseLayerNumber("My Custom Name")`
       - Expected: `null`
  - **Edge Cases:**
    - ⚠️ Empty array → "Rectangle 1"
    - ⚠️ Custom names → ignore in numbering (parseLayerNumber returns null)
    - ⚠️ Large numbers (100+) → still performant (array sorting is O(n log n))

### 2.1.3 Update Barrel Exports

- [ ] **Action:** Export layer naming utilities
  - **Why:** Enable imports from utils index
  - **Files Modified:**
    - Update: `src/features/layers-panel/utils/index.ts`
  - **Implementation Details:**
    ```typescript
    export {
      generateLayerName,
      getBaseName,
      parseLayerNumber,
    } from './layerNaming';
    ```
  - **Success Criteria:**
    - [ ] Imports work from '@/features/layers-panel/utils'
  - **Tests:**
    1. Import functions from utils
    2. No import errors
  - **Edge Cases:**
    - ⚠️ None expected

---

## 2.2 Integrate Naming into Object Creation

**Estimated Time:** 30-45 minutes

### 2.2.1 Update useShapeCreation Hook

- [ ] **Action:** Add auto-name generation to shape creation logic
  - **Why:** New objects get auto-generated names on creation
  - **Files Modified:**
    - Update: `src/features/canvas-core/hooks/useShapeCreation.ts`
  - **Implementation Details:**
    ```typescript
    import { generateLayerName } from '@/features/layers-panel/utils';

    // In onMouseUp or finalize function, when creating new object:
    const objects = useCanvasStore.getState().objects;
    const name = generateLayerName(type, objects);

    const newObject = {
      id: `${type}-${Date.now()}`,
      type,
      x, y, width, height,
      name, // Add auto-generated name
      // ...other properties
    };

    addObject(newObject);
    ```
  - **Success Criteria:**
    - [ ] New objects have auto-generated names
    - [ ] Names follow pattern: "{Type} {number}"
    - [ ] Gap filling works when objects deleted
  - **Tests:**
    1. Create 5 rectangles → Names: "Rectangle 1" through "Rectangle 5"
    2. Delete "Rectangle 3"
    3. Create new rectangle → Name: "Rectangle 3" (fills gap)
    4. Create circle → Name: "Circle 1" (independent numbering)
  - **Edge Cases:**
    - ⚠️ Rapid creation: Each object gets unique number (based on current state)

### 2.2.2 Update LayerItem to Display Name

- [ ] **Action:** Show object name with fallback in LayerItem
  - **Why:** Display auto-generated or custom names in layer list
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    // In LayerItem component:
    const displayName = object.name || generateLayerName(object.type, [object]);

    <span className="...">
      {displayName}
    </span>
    ```
  - **Success Criteria:**
    - [ ] Objects with name show custom name
    - [ ] Objects without name show fallback
    - [ ] Names truncate with ellipsis if > 20 chars
  - **Tests:**
    1. Object with name="My Shape" → shows "My Shape"
    2. Object without name → shows auto-generated name
    3. Long name (50 chars) → truncates with ellipsis
  - **Edge Cases:**
    - ⚠️ Old objects without name property → fallback works
    - ⚠️ Empty string name → treated as falsy, shows fallback

---

## 2.3 Layer Renaming (Inline Edit)

**Estimated Time:** 45-60 minutes

### 2.3.1 Add Rename Mode to LayerItem

- [ ] **Action:** Enable double-click inline editing in LayerItem
  - **Why:** Users can rename layers by double-clicking
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { useState, useRef, useEffect } from 'react';
    import { useCanvasStore } from '@/stores';

    export const LayerItem = memo(function LayerItem({ object, ... }) {
      const [isRenaming, setIsRenaming] = useState(false);
      const [editedName, setEditedName] = useState(object.name || '');
      const inputRef = useRef<HTMLInputElement>(null);
      const updateObject = useCanvasStore((state) => state.updateObject);

      // Focus input when entering rename mode
      useEffect(() => {
        if (isRenaming && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, [isRenaming]);

      const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRenaming(true);
        setEditedName(object.name || generateLayerName(object.type, []));
      };

      const handleSave = () => {
        const trimmedName = editedName.trim();
        if (trimmedName) {
          updateObject(object.id, { name: trimmedName });
        } else {
          // Empty name: revert to auto-generated
          const autoName = generateLayerName(object.type, [object]);
          updateObject(object.id, { name: autoName });
        }
        setIsRenaming(false);
      };

      const handleCancel = () => {
        setEditedName(object.name || '');
        setIsRenaming(false);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleSave();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      };

      return (
        <div onDoubleClick={handleDoubleClick} className="...">
          <LayerIcon type={object.type} />

          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-xs border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
            />
          ) : (
            <span className="...">{object.name || '...'}</span>
          )}
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Double-click enters rename mode
    - [ ] Input auto-focuses and selects text
    - [ ] Enter key saves and exits
    - [ ] Escape key cancels and reverts
    - [ ] Blur (click away) saves
    - [ ] Empty name reverts to auto-generated
  - **Tests:**
    1. Double-click layer → input appears with text selected
    2. Type new name → press Enter → name updates
    3. Double-click → press Escape → name reverts
    4. Double-click → clear text → press Enter → auto-generated name
    5. Double-click → click away → name saves
  - **Edge Cases:**
    - ⚠️ Empty name after trim → revert to auto-generated
    - ⚠️ stopPropagation prevents layer selection on double-click
    - ⚠️ Very long names → input grows to fit (or limit characters)

### 2.3.2 Verify RTDB Sync for Name Changes

- [ ] **Action:** Test that name changes sync to Firebase RTDB
  - **Why:** Collaborative features require name sync
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] Name change syncs to RTDB within 50ms
    - [ ] Other users see updated name
    - [ ] Name persists after refresh
  - **Tests:**
    1. Open 2 browser windows
    2. Window A: Rename layer to "My Test"
    3. Window B: See name update to "My Test" (within 100ms)
    4. Refresh both windows → name persists
    5. Check Firebase console → name field updated
  - **Edge Cases:**
    - ⚠️ Concurrent renames: Last write wins (RTDB behavior)
    - ⚠️ Network latency: May take up to 200ms in poor conditions

---

# Phase 3: Bidirectional Hover Sync (2-3 hours)

**Goal:** Hovering over layer in panel highlights object on canvas, and vice versa.

---

## 3.1 Canvas Hover → Panel Highlight

**Estimated Time:** 45-60 minutes

### 3.1.1 Update Shape Components to Track Hover

- [ ] **Action:** Add hover handlers to all shape components (Rectangle, Circle, Text, Line)
  - **Why:** Track which object is being hovered on canvas
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
  - **Implementation Details:**
    ```typescript
    import { useUIStore } from '@/stores';

    export function Rectangle({ rectangle, ... }) {
      const setHoveredObject = useUIStore((state) => state.setHoveredObject);

      return (
        <Rect
          {...props}
          onMouseEnter={() => setHoveredObject(rectangle.id)}
          onMouseLeave={() => {
            // Only clear if this object is still hovered
            const current = useUIStore.getState().hoveredObjectId;
            if (current === rectangle.id) {
              setHoveredObject(null);
            }
          }}
          // ... other props
        />
      );
    }
    ```
    Apply same pattern to Circle, TextShape, Line components.
  - **Success Criteria:**
    - [ ] All shape components call setHoveredObject on mouseEnter/Leave
    - [ ] Hover state updates in UIStore
    - [ ] Conditional clear prevents race conditions
  - **Tests:**
    1. Hover rectangle on canvas → check `useUIStore.getState().hoveredObjectId`
    2. Verify ID matches hovered rectangle
    3. Move mouse away → ID becomes null
    4. Rapidly hover multiple shapes → no flicker
  - **Edge Cases:**
    - ⚠️ Rapid hover: Only clear if current hover matches this object
    - ⚠️ Overlapping shapes: Last hovered wins

### 3.1.2 Update LayerItem to Show Hover State

- [ ] **Action:** Apply hover styling in LayerItem when canvas object hovered
  - **Why:** Bidirectional sync: canvas hover → panel highlight
  - **Files Modified:**
    - Already done in previous task (LayerItem receives isHovered prop)
  - **Success Criteria:**
    - [ ] Hovering canvas shape highlights layer in panel
    - [ ] Gray background appears on layer (bg-gray-50)
  - **Tests:**
    1. Hover rectangle on canvas → layer in panel shows gray background
    2. Move mouse away → gray background disappears
    3. Hover circle → corresponding layer highlights
  - **Edge Cases:**
    - ⚠️ Selected AND hovered → selected style takes priority

---

## 3.2 Panel Hover → Canvas Highlight

**Estimated Time:** 1-1.5 hours

### 3.2.1 Add Hover Outline to Canvas Shapes

- [ ] **Action:** Show dashed outline on canvas when layer hovered in panel
  - **Why:** Bidirectional sync: panel hover → canvas highlight
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
  - **Implementation Details:**
    ```typescript
    import { useUIStore } from '@/stores';

    export function Rectangle({ rectangle, isSelected, ... }) {
      const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);
      const isHovered = hoveredObjectId === rectangle.id && !isSelected;

      return (
        <>
          {/* Main shape */}
          <Rect {...props} />

          {/* Hover outline (only when hovered, not selected) */}
          {isHovered && (
            <Rect
              x={rectangle.x}
              y={rectangle.y}
              width={rectangle.width}
              height={rectangle.height}
              stroke="#9ca3af" // gray-400
              strokeWidth={1.5}
              dash={[4, 4]}
              fill="transparent"
              listening={false} // Don't intercept events
            />
          )}

          {/* Selection outline (when selected) */}
          {isSelected && (
            <Rect {...} /> // existing selection outline
          )}
        </>
      );
    }
    ```
    Apply same pattern to all shape components.
  - **Success Criteria:**
    - [ ] Hovering layer in panel shows dashed outline on canvas
    - [ ] Outline is gray-400 (#9ca3af)
    - [ ] Outline is dashed ([4, 4] pattern)
    - [ ] Outline does NOT appear when shape is selected
    - [ ] Outline does NOT intercept mouse events (listening={false})
  - **Tests:**
    1. Hover layer in panel → see dashed outline on canvas
    2. Move mouse away from layer → outline disappears
    3. Select shape → hover layer in panel → NO outline (selection takes priority)
    4. Click on hover outline → event passes through to shape below
  - **Edge Cases:**
    - ⚠️ Selected shapes: No hover outline (isSelected takes priority)
    - ⚠️ listening={false}: Outline doesn't block interaction

### 3.2.2 Test Bidirectional Hover Sync

- [ ] **Action:** Comprehensive testing of hover sync in both directions
  - **Why:** Verify both directions work smoothly
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] Canvas hover → panel highlight (< 16ms)
    - [ ] Panel hover → canvas outline (< 16ms)
    - [ ] No flicker during rapid hover
    - [ ] Hover clears correctly on mouse leave
  - **Tests:**
    1. **Canvas to Panel:**
       - Hover rectangle on canvas → layer highlights in panel
       - Move to circle → rectangle layer unhighlights, circle layer highlights
    2. **Panel to Canvas:**
       - Hover "Rectangle 1" layer → rectangle shows dashed outline
       - Move to "Circle 1" layer → outline moves to circle
    3. **Rapid hover:**
       - Rapidly move mouse over 5 shapes → no visual glitches
       - Hover state always matches last hovered
    4. **Edge cases:**
       - Hover selected shape layer → see highlight but NO outline
       - Hover off-screen object layer → no visible outline (but state updates)
  - **Edge Cases:**
    - ⚠️ Off-screen objects: Hover state updates but nothing visible
    - ⚠️ Future enhancement: Auto-scroll canvas to show hovered object

---

# Phase 4: Layer Selection Integration (1-2 hours)

**Goal:** Clicking layer in panel selects object on canvas, fully integrated with existing multi-select.

---

## 4.1 Multi-Select in Layers Panel

**Estimated Time:** 45-60 minutes

### 4.1.1 Implement Multi-Select Logic in LayersPanel

- [ ] **Action:** Add Shift/Cmd/Ctrl+click multi-select support to layer selection
  - **Why:** Match canvas multi-select behavior (Shift = add, Cmd/Ctrl = toggle)
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { useCanvasStore } from '@/stores';

    export function LayersPanel() {
      const selectedIds = useCanvasStore((state) => state.selectedIds);
      const selectObjects = useCanvasStore((state) => state.selectObjects);
      const toggleSelection = useCanvasStore((state) => state.toggleSelection);

      const handleLayerSelect = (objectId: string, e: React.MouseEvent) => {
        if (e.shiftKey) {
          // Shift+click: Add to selection
          if (selectedIds.includes(objectId)) {
            toggleSelection(objectId); // Remove if already selected
          } else {
            selectObjects([...selectedIds, objectId]); // Add to selection
          }
        } else if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl+click: Toggle selection
          toggleSelection(objectId);
        } else {
          // Normal click: Replace selection
          selectObjects([objectId]);
        }
      };

      return (
        <aside className="...">
          {/* ... */}
          {objects.slice().reverse().map((obj) => (
            <LayerItem
              key={obj.id}
              object={obj}
              isSelected={selectedIds.includes(obj.id)}
              isHovered={hoveredObjectId === obj.id}
              onSelect={(e) => handleLayerSelect(obj.id, e)}
              onHover={() => setHoveredObject(obj.id)}
              onHoverEnd={() => setHoveredObject(null)}
            />
          ))}
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Normal click replaces selection
    - [ ] Shift+click adds to selection
    - [ ] Cmd/Ctrl+click toggles selection
    - [ ] Multi-select syncs with canvas
  - **Tests:**
    1. Click layer → selects (replaces existing selection)
    2. Shift+click another layer → both selected
    3. Cmd+click selected layer → deselects
    4. Shift+click 3 layers → all 3 selected
    5. Canvas selection syncs → select shape on canvas, see layer highlight
  - **Edge Cases:**
    - ⚠️ Shift+click already selected → removes from selection
    - ⚠️ Cmd/Ctrl+click toggles (add if not selected, remove if selected)

### 4.1.2 Update LayerItem Props

- [ ] **Action:** Update LayerItem to accept MouseEvent in onSelect
  - **Why:** Need event to check modifier keys (Shift, Cmd, Ctrl)
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    interface LayerItemProps {
      object: CanvasObject;
      isSelected: boolean;
      isHovered: boolean;
      onSelect: (e: React.MouseEvent) => void; // Accept event
      onHover: () => void;
      onHoverEnd: () => void;
    }

    export const LayerItem = memo(function LayerItem({ onSelect, ... }) {
      return (
        <div
          onClick={onSelect} // Pass event to parent
          className="..."
        >
          {/* ... */}
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] LayerItem passes MouseEvent to onSelect callback
    - [ ] No breaking changes to existing functionality
  - **Tests:**
    1. Click layer → event fires with correct properties
    2. Shift+click → e.shiftKey === true
    3. Cmd+click → e.metaKey === true (Mac) or e.ctrlKey === true (Windows)
  - **Edge Cases:**
    - ⚠️ None expected

---

## 4.2 Selection Synchronization Test

**Estimated Time:** 15-30 minutes

### 4.2.1 Comprehensive Selection Sync Testing

- [ ] **Action:** Test all selection scenarios in both directions
  - **Why:** Verify selection perfectly syncs between panel and canvas
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] Click shape on canvas → layer highlights in panel
    - [ ] Click layer in panel → shape selects on canvas
    - [ ] Shift+click shape → layers update
    - [ ] Shift+click layer → canvas updates
    - [ ] Click background → all layers deselect
    - [ ] Multi-select state consistent in both views
  - **Tests:**
    1. **Canvas to Panel:**
       - Click rectangle on canvas → layer shows blue background
       - Shift+click circle → both layers show blue background
       - Click background → both layers deselect
    2. **Panel to Canvas:**
       - Click "Rectangle 1" layer → rectangle shows selection box on canvas
       - Shift+click "Circle 1" layer → both show selection boxes
       - Click background → both deselect
    3. **Mixed:**
       - Click layer → Shift+click canvas shape → both selected
       - Cmd+click layer → toggles selection on canvas too
  - **Edge Cases:**
    - ⚠️ Rapid selection changes: No lag or desync
    - ⚠️ 10+ objects selected: Performance stays smooth

---

# Phase 5: Layer Reordering (Z-Index) (2-3 hours)

**Goal:** Drag layers in panel to reorder them, updates z-index on canvas.

---

## 5.1 Drag-and-Drop Setup

**Estimated Time:** 1.5-2 hours

### 5.1.1 Install Drag-and-Drop Library

- [ ] **Action:** Install @dnd-kit packages for drag-and-drop functionality
  - **Why:** Robust drag-and-drop with accessibility support
  - **Files Modified:**
    - Update: `package.json`
  - **Implementation Details:**
    ```bash
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
    ```
  - **Success Criteria:**
    - [ ] Packages installed successfully
    - [ ] No dependency conflicts
    - [ ] Can import in components
  - **Tests:**
    1. Run: `npm install`
    2. Verify: `node_modules/@dnd-kit` exists
    3. Import in component: `import { DndContext } from '@dnd-kit/core'`
    4. No import errors
  - **Edge Cases:**
    - ⚠️ Check for peer dependency warnings (should be none)

### 5.1.2 Make LayerItem Draggable

- [ ] **Action:** Wrap LayerItem with useSortable hook
  - **Why:** Enable dragging individual layers
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { useSortable } from '@dnd-kit/sortable';
    import { CSS } from '@dnd-kit/utilities';
    import { GripVertical } from 'lucide-react';

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
          className={`
            h-8 px-2 py-1 flex items-center gap-2 cursor-pointer
            ${isDragging ? 'opacity-50 z-10' : ''}
            ${/* ... other classes */}
          `}
          onClick={onSelect}
          onMouseEnter={onHover}
          onMouseLeave={onHoverEnd}
        >
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>

          <LayerIcon type={object.type} />
          <span className="...">{object.name}</span>
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Drag handle (6 dots icon) appears on left
    - [ ] Dragging layer shows visual feedback (opacity-50)
    - [ ] Cursor changes to grab/grabbing
  - **Tests:**
    1. Hover layer → see grip icon
    2. Click and drag grip → layer becomes semi-transparent
    3. Release → layer returns to normal opacity
  - **Edge Cases:**
    - ⚠️ Click grip shouldn't trigger layer selection
    - ⚠️ Drag only works from grip, not entire row (for rename support)

### 5.1.3 Implement Drop Logic in LayersPanel

- [ ] **Action:** Wrap layer list in DndContext and handle reordering
  - **Why:** Enable dropping and reordering layers
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import {
      DndContext,
      closestCenter,
      KeyboardSensor,
      PointerSensor,
      useSensor,
      useSensors,
      DragEndEvent,
    } from '@dnd-kit/core';
    import {
      SortableContext,
      verticalListSortingStrategy,
      arrayMove,
    } from '@dnd-kit/sortable';
    import { useCanvasStore } from '@/stores';

    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);
      const setObjects = useCanvasStore((state) => state.setObjects);

      const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
      );

      const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = objects.findIndex((obj) => obj.id === active.id);
        const newIndex = objects.findIndex((obj) => obj.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Reorder array
          const reordered = arrayMove(objects, oldIndex, newIndex);

          // Update store (syncs to RTDB)
          setObjects(reordered);
        }
      };

      // Reverse for display (top = front)
      const displayObjects = [...objects].reverse();
      const displayIds = displayObjects.map((obj) => obj.id);

      return (
        <aside className="...">
          {/* Header */}

          <div className="flex-1 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2 space-y-0.5">
                  {displayObjects.map((obj) => (
                    <LayerItem key={obj.id} object={obj} /* ... */ />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Layers can be dragged up and down
    - [ ] Drop reorders the list
    - [ ] Z-index on canvas updates (top of list = front)
    - [ ] Reorder syncs to RTDB
  - **Tests:**
    1. Create 3 shapes (Rectangle, Circle, Text)
    2. Drag "Rectangle" layer to bottom → rectangle moves to back on canvas
    3. Drag "Text" layer to top → text moves to front on canvas
    4. Check RTDB → object array order matches new z-index
  - **Edge Cases:**
    - ⚠️ Drag to same position: No update triggered
    - ⚠️ Display array is reversed but storage array is not (important!)

---

## 5.2 Z-Index Verification

**Estimated Time:** 30 minutes

### 5.2.1 Verify Canvas Rendering Order

- [ ] **Action:** Confirm CanvasStage renders objects in array order
  - **Why:** Ensure z-index matches array order
  - **Files Modified:**
    - None (verification only, CanvasStage should already render in order)
  - **Success Criteria:**
    - [ ] Konva renders in array order (first = bottom, last = top)
    - [ ] Reordering in panel changes z-index on canvas
  - **Tests:**
    1. Create 3 overlapping shapes
    2. Drag layer to top of panel → shape moves to front on canvas
    3. Drag layer to bottom of panel → shape moves to back on canvas
    4. Visual stacking matches layer order
  - **Edge Cases:**
    - ⚠️ Konva Layer order: Objects within same Konva.Layer render in order

### 5.2.2 Add Visual Feedback During Drag

- [ ] **Action:** Show insertion indicator (blue line) where layer will drop
  - **Why:** Clear visual feedback for drop position
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx` (optional)
    - Or create custom drag overlay component
  - **Implementation Details:**
    ```typescript
    // In LayerItem:
    const { isOver, setNodeRef } = useDroppable({ id: object.id });

    return (
      <div className="relative">
        {/* Insertion indicator */}
        {isOver && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
        )}

        {/* Layer content */}
        <div className="...">{/* ... */}</div>
      </div>
    );
    ```
    Or use DndContext's DragOverlay for custom preview.
  - **Success Criteria:**
    - [ ] Blue line shows where layer will drop
    - [ ] Line position updates as drag moves
  - **Tests:**
    1. Drag layer → see blue line indicating drop position
    2. Move drag up/down → line follows
    3. Release → layer drops at indicated position
  - **Edge Cases:**
    - ⚠️ Optional enhancement: Can skip if basic drag-drop works well

---

# Phase 6: Layer Visibility Toggle (1-2 hours)

**Goal:** Eye icon next to each layer to hide/show objects on canvas.

---

## 6.1 Visibility Property

**Estimated Time:** 30 minutes

### 6.1.1 Add Visible Property to Canvas Objects

- [ ] **Action:** Add `visible` boolean to BaseCanvasObject interface
  - **Why:** Track visibility state for each object
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
    ```typescript
    export interface BaseCanvasObject {
      id: string;
      type: ShapeType;
      x: number;
      y: number;
      name?: string;
      visible?: boolean; // Add this property (default: true)
      createdBy: string;
      createdAt: number;
      updatedAt: number;
    }
    ```
  - **Success Criteria:**
    - [ ] Property added to interface
    - [ ] Optional (defaults to true if undefined)
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run: `npm run type-check`
    2. Verify: No errors
    3. Object without visible property → treated as visible
  - **Edge Cases:**
    - ⚠️ Backward compatible: undefined = visible

### 6.1.2 Add Toggle Visibility Action to CanvasStore

- [ ] **Action:** Add `toggleVisibility` method to canvasStore
  - **Why:** Convenient action for toggling visibility
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
    ```typescript
    interface CanvasStore {
      // ... existing state and actions ...

      /**
       * Toggle visibility of an object
       *
       * @param id - Object ID to toggle
       */
      toggleVisibility: (id: string) => void;
    }

    export const useCanvasStore = create<CanvasStore>((set, get) => ({
      // ... existing implementation ...

      toggleVisibility: (id) => {
        const object = get().objects.find((obj) => obj.id === id);
        if (object) {
          const newVisible = !(object.visible ?? true); // Default true
          get().updateObject(id, { visible: newVisible });
        }
      },
    }));
    ```
  - **Success Criteria:**
    - [ ] toggleVisibility method works
    - [ ] Updates visible property
    - [ ] Syncs to RTDB
  - **Tests:**
    1. Call: `toggleVisibility('rect-1')`
    2. Check: `objects.find(obj => obj.id === 'rect-1').visible === false`
    3. Call again: `visible === true`
  - **Edge Cases:**
    - ⚠️ Default true: undefined treated as visible

---

## 6.2 Eye Icon in LayerItem

**Estimated Time:** 45-60 minutes

### 6.2.1 Add Eye Icon to LayerItem

- [ ] **Action:** Render Eye/EyeOff icon with click handler in LayerItem
  - **Why:** Toggle visibility from layers panel
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { Eye, EyeOff } from 'lucide-react';
    import { useCanvasStore } from '@/stores';

    export const LayerItem = memo(function LayerItem({ object, ... }) {
      const toggleVisibility = useCanvasStore((state) => state.toggleVisibility);
      const isVisible = object.visible !== false; // Default true

      const handleVisibilityClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger layer selection
        toggleVisibility(object.id);
      };

      return (
        <div className={`
          ...
          ${!isVisible ? 'opacity-50' : ''}
        `}>
          <GripVertical {...} />
          <LayerIcon type={object.type} />
          <span className={`... ${!isVisible ? 'text-gray-400' : ''}`}>
            {object.name}
          </span>

          {/* Eye icon */}
          <button
            onClick={handleVisibilityClick}
            className="ml-auto p-0.5 hover:bg-gray-100 rounded transition-colors"
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
    - [ ] Eye icon appears on right side of layer
    - [ ] Click toggles between Eye and EyeOff
    - [ ] Click doesn't trigger layer selection (stopPropagation)
    - [ ] Hidden layers appear grayed out (opacity-50)
  - **Tests:**
    1. Click eye icon → icon changes to EyeOff, layer grays out
    2. Click again → icon changes to Eye, layer returns to normal
    3. Clicking eye doesn't select layer
  - **Edge Cases:**
    - ⚠️ stopPropagation prevents layer selection on eye click

### 6.2.2 Update Canvas to Respect Visibility

- [ ] **Action:** Hide invisible objects in shape components
  - **Why:** Implement visibility behavior on canvas
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
  - **Implementation Details:**
    ```typescript
    export function Rectangle({ rectangle, ... }) {
      // Don't render if hidden
      if (rectangle.visible === false) {
        return null;
      }

      return (
        <Rect {...} />
      );
    }
    ```
    Apply to all shape components.
  - **Success Criteria:**
    - [ ] Hidden objects don't render on canvas
    - [ ] Visible objects render normally
    - [ ] Default (visible=undefined) renders
  - **Tests:**
    1. Hide rectangle → disappears from canvas
    2. Show rectangle → reappears
    3. Object without visible property → renders (default visible)
  - **Edge Cases:**
    - ⚠️ Hidden objects still in store, can be toggled back
    - ⚠️ Can still select hidden objects from panel (for unhiding)

---

# Phase 7: Context Menu & Actions (2-3 hours)

**Goal:** Right-click layer for actions: Duplicate, Delete, Rename, Bring to Front, Send to Back.

---

## 7.1 Context Menu Component

**Estimated Time:** 1.5-2 hours

### 7.1.1 Create ContextMenu Component

- [ ] **Action:** Create right-click context menu with all layer actions
  - **Why:** Provide quick access to common layer operations
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/LayerContextMenu.tsx`
  - **Implementation Details:**
    ```typescript
    import {
      ContextMenu,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuTrigger,
    } from '@/components/ui/context-menu';
    import {
      Edit2,
      Copy,
      Trash2,
      ArrowUp,
      ArrowDown,
    } from 'lucide-react';

    interface LayerContextMenuProps {
      children: React.ReactNode;
      objectId: string;
      onRename: () => void;
      onDuplicate: () => void;
      onDelete: () => void;
      onBringToFront: () => void;
      onSendToBack: () => void;
    }

    export function LayerContextMenu({
      children,
      objectId,
      onRename,
      onDuplicate,
      onDelete,
      onBringToFront,
      onSendToBack,
    }: LayerContextMenuProps) {
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {children}
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={onRename}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onBringToFront}>
              <ArrowUp className="w-4 h-4 mr-2" />
              Bring to Front
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendToBack}>
              <ArrowDown className="w-4 h-4 mr-2" />
              Send to Back
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Context menu appears on right-click
    - [ ] All menu items present with icons
    - [ ] Menu positioned at cursor
    - [ ] Delete item is red
  - **Tests:**
    1. Right-click layer → menu appears
    2. Click outside → menu closes
    3. Click menu item → action fires, menu closes
  - **Edge Cases:**
    - ⚠️ Menu positioning: Handle near screen edges

### 7.1.2 Integrate Context Menu into LayerItem

- [ ] **Action:** Wrap LayerItem in LayerContextMenu with action handlers
  - **Why:** Enable right-click actions on layers
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    // In LayersPanel.tsx:
    import { LayerContextMenu } from './LayerContextMenu';
    import { useCanvasStore } from '@/stores';

    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);
      const setObjects = useCanvasStore((state) => state.setObjects);
      const removeObject = useCanvasStore((state) => state.removeObject);
      const addObject = useCanvasStore((state) => state.addObject);

      const handleDuplicate = (objectId: string) => {
        const object = objects.find((obj) => obj.id === objectId);
        if (object) {
          const duplicate = {
            ...object,
            id: `${object.type}-${Date.now()}`,
            name: `${object.name} copy`,
            x: object.x + 10,
            y: object.y + 10,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addObject(duplicate);
        }
      };

      const handleDelete = (objectId: string) => {
        removeObject(objectId);
      };

      const handleBringToFront = (objectId: string) => {
        const index = objects.findIndex((obj) => obj.id === objectId);
        if (index !== -1) {
          const reordered = [
            ...objects.slice(0, index),
            ...objects.slice(index + 1),
            objects[index], // Move to end (front)
          ];
          setObjects(reordered);
        }
      };

      const handleSendToBack = (objectId: string) => {
        const index = objects.findIndex((obj) => obj.id === objectId);
        if (index !== -1) {
          const reordered = [
            objects[index], // Move to start (back)
            ...objects.slice(0, index),
            ...objects.slice(index + 1),
          ];
          setObjects(reordered);
        }
      };

      return (
        <aside>
          {/* ... */}
          {displayObjects.map((obj) => (
            <LayerContextMenu
              key={obj.id}
              objectId={obj.id}
              onRename={() => {/* Trigger rename mode in LayerItem */}}
              onDuplicate={() => handleDuplicate(obj.id)}
              onDelete={() => handleDelete(obj.id)}
              onBringToFront={() => handleBringToFront(obj.id)}
              onSendToBack={() => handleSendToBack(obj.id)}
            >
              <LayerItem object={obj} /* ... */ />
            </LayerContextMenu>
          ))}
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] All context menu actions work
    - [ ] Rename triggers inline edit mode
    - [ ] Duplicate creates copy with " copy" suffix
    - [ ] Delete removes object
    - [ ] Bring to Front moves to top of list and front of canvas
    - [ ] Send to Back moves to bottom of list and back of canvas
  - **Tests:**
    1. Right-click layer → click "Rename" → enters edit mode
    2. Right-click layer → click "Duplicate" → copy appears offset by 10px
    3. Right-click layer → click "Delete" → object disappears
    4. Right-click middle layer → click "Bring to Front" → moves to top
    5. Right-click top layer → click "Send to Back" → moves to bottom
  - **Edge Cases:**
    - ⚠️ Delete selected object → clear selection
    - ⚠️ Duplicate preserves all properties except id, position, name

---

## 7.2 Keyboard Shortcuts

**Estimated Time:** 45-60 minutes

### 7.2.1 Create Layer Shortcuts Hook

- [ ] **Action:** Create hook for layer-specific keyboard shortcuts
  - **Why:** Power users can use keyboard for common actions
  - **Files Modified:**
    - Create: `src/features/layers-panel/hooks/useLayerShortcuts.ts`
  - **Implementation Details:**
    ```typescript
    import { useEffect } from 'react';
    import { useCanvasStore } from '@/stores';

    /**
     * Layer Keyboard Shortcuts Hook
     *
     * Handles keyboard shortcuts for layer actions:
     * - Delete/Backspace: Delete selected layers
     * - Cmd+D / Ctrl+D: Duplicate selected layers
     * - Cmd+] / Ctrl+]: Bring to front
     * - Cmd+[ / Ctrl+[: Send to back
     * - Cmd+Shift+] / Ctrl+Shift+]: Bring forward
     * - Cmd+Shift+[ / Ctrl+Shift+[: Send backward
     */
    export function useLayerShortcuts() {
      const selectedIds = useCanvasStore((state) => state.selectedIds);
      const objects = useCanvasStore((state) => state.objects);
      const setObjects = useCanvasStore((state) => state.setObjects);
      const removeObject = useCanvasStore((state) => state.removeObject);
      const addObject = useCanvasStore((state) => state.addObject);

      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          // Don't trigger when typing in input
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
          }

          const isMac = navigator.platform.toUpperCase().includes('MAC');
          const modKey = isMac ? e.metaKey : e.ctrlKey;

          // Delete
          if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
            e.preventDefault();
            selectedIds.forEach((id) => removeObject(id));
          }

          // Duplicate (Cmd+D / Ctrl+D)
          if (modKey && e.key === 'd' && selectedIds.length > 0) {
            e.preventDefault();
            selectedIds.forEach((id) => {
              const object = objects.find((obj) => obj.id === id);
              if (object) {
                const duplicate = {
                  ...object,
                  id: `${object.type}-${Date.now()}-${Math.random()}`,
                  name: `${object.name} copy`,
                  x: object.x + 10,
                  y: object.y + 10,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                addObject(duplicate);
              }
            });
          }

          // Bring to Front (Cmd+] / Ctrl+])
          if (modKey && e.key === ']' && !e.shiftKey && selectedIds.length > 0) {
            e.preventDefault();
            // Move all selected to end (front)
            const selected = objects.filter((obj) => selectedIds.includes(obj.id));
            const unselected = objects.filter((obj) => !selectedIds.includes(obj.id));
            setObjects([...unselected, ...selected]);
          }

          // Send to Back (Cmd+[ / Ctrl+[)
          if (modKey && e.key === '[' && !e.shiftKey && selectedIds.length > 0) {
            e.preventDefault();
            // Move all selected to start (back)
            const selected = objects.filter((obj) => selectedIds.includes(obj.id));
            const unselected = objects.filter((obj) => !selectedIds.includes(obj.id));
            setObjects([...selected, ...unselected]);
          }

          // Bring Forward (Cmd+Shift+] / Ctrl+Shift+])
          if (modKey && e.shiftKey && e.key === ']' && selectedIds.length === 1) {
            e.preventDefault();
            const index = objects.findIndex((obj) => obj.id === selectedIds[0]);
            if (index < objects.length - 1) {
              const reordered = [...objects];
              [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
              setObjects(reordered);
            }
          }

          // Send Backward (Cmd+Shift+[ / Ctrl+Shift+[)
          if (modKey && e.shiftKey && e.key === '[' && selectedIds.length === 1) {
            e.preventDefault();
            const index = objects.findIndex((obj) => obj.id === selectedIds[0]);
            if (index > 0) {
              const reordered = [...objects];
              [reordered[index], reordered[index - 1]] = [reordered[index - 1], reordered[index]];
              setObjects(reordered);
            }
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [selectedIds, objects, setObjects, removeObject, addObject]);
    }
    ```
  - **Success Criteria:**
    - [ ] All shortcuts work as documented
    - [ ] Shortcuts don't trigger when typing in inputs
    - [ ] Cmd key on Mac, Ctrl on Windows
  - **Tests:**
    1. Select layer → press Delete → layer deleted
    2. Select layer → press Cmd+D → duplicate appears
    3. Select layer → press Cmd+] → moves to front
    4. Select layer → press Cmd+[ → moves to back
    5. Select layer → press Cmd+Shift+] → moves forward one
    6. Type in rename input → shortcuts don't trigger
  - **Edge Cases:**
    - ⚠️ Don't trigger when focus in input/textarea
    - ⚠️ Platform detection: Mac uses metaKey, Windows uses ctrlKey

### 7.2.2 Use Hook in LayersPanel

- [ ] **Action:** Call useLayerShortcuts in LayersPanel component
  - **Why:** Enable shortcuts for layers panel
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { useLayerShortcuts } from '../hooks/useLayerShortcuts';

    export function LayersPanel() {
      useLayerShortcuts(); // Enable shortcuts

      // ... rest of component
    }
    ```
  - **Success Criteria:**
    - [ ] Shortcuts active when panel rendered
  - **Tests:**
    1. All shortcut tests from previous task
  - **Edge Cases:**
    - ⚠️ None expected

---

# Phase 8: Performance Optimization (1-2 hours)

**Goal:** Maintain 60 FPS with 100+ layers in panel.

---

## 8.1 Virtual Scrolling

**Estimated Time:** 45-60 minutes

### 8.1.1 Install and Implement Virtual Scrolling

- [ ] **Action:** Add react-window for virtual scrolling with large layer lists
  - **Why:** Render only visible layers for performance with 100+ objects
  - **Files Modified:**
    - Update: `package.json`
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```bash
    npm install react-window @types/react-window
    ```

    ```typescript
    import { FixedSizeList } from 'react-window';

    export function LayersPanel() {
      const displayObjects = [...objects].reverse();

      const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const obj = displayObjects[index];
        return (
          <div style={style}>
            <LayerContextMenu {...}>
              <LayerItem object={obj} {...} />
            </LayerContextMenu>
          </div>
        );
      };

      return (
        <aside className="...">
          {/* Header */}

          {objects.length === 0 ? (
            <div className="...">No objects</div>
          ) : (
            <FixedSizeList
              height={window.innerHeight - 40} // Subtract header height
              itemCount={displayObjects.length}
              itemSize={32} // 32px per layer
              width="100%"
            >
              {Row}
            </FixedSizeList>
          )}
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Only visible layers rendered (check with React DevTools)
    - [ ] Smooth scrolling with 500+ layers
    - [ ] Selection, hover, drag-drop still work
  - **Tests:**
    1. Create 100 layers programmatically
    2. Scroll through list → 60 FPS (check DevTools Performance)
    3. Select layer mid-list → works
    4. Drag layer → works
    5. React DevTools → only ~10-15 LayerItem components rendered (not 100)
  - **Edge Cases:**
    - ⚠️ Virtual scrolling may complicate drag-drop (test thoroughly)
    - ⚠️ Height calculation needs to account for header

---

## 8.2 Memoization

**Estimated Time:** 30 minutes

### 8.2.1 Optimize LayerItem Re-Renders

- [ ] **Action:** Ensure LayerItem is properly memoized with custom comparator
  - **Why:** Prevent unnecessary re-renders when other layers change
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { memo, useCallback } from 'react';

    // Custom comparator
    function areEqual(prevProps: LayerItemProps, nextProps: LayerItemProps) {
      return (
        prevProps.object.id === nextProps.object.id &&
        prevProps.object.name === nextProps.object.name &&
        prevProps.object.type === nextProps.object.type &&
        prevProps.object.visible === nextProps.object.visible &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isHovered === nextProps.isHovered
      );
    }

    export const LayerItem = memo(function LayerItem(props: LayerItemProps) {
      // ... component implementation ...
    }, areEqual);
    ```
  - **Success Criteria:**
    - [ ] LayerItem only re-renders when its props change
    - [ ] Changing one layer doesn't re-render others
  - **Tests:**
    1. Open React DevTools Profiler
    2. Record while renaming one layer
    3. Verify: Only that LayerItem re-renders (not all 100)
  - **Edge Cases:**
    - ⚠️ Ensure comparator checks all relevant props

---

# Phase 9: Polish & Edge Cases (2-3 hours)

**Goal:** Handle all edge cases, add polish, match Figma UX.

---

## 9.1 Empty State Enhancement

**Estimated Time:** 15-30 minutes

### 9.1.1 Improve Empty State Styling

- [ ] **Action:** Add icon and helpful text to empty state
  - **Why:** Better UX when canvas is empty
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { Layers } from 'lucide-react';

    // In LayersPanel empty state:
    <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
      <Layers className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-500">No objects on canvas</p>
      <p className="text-xs text-gray-400 mt-1">Create a shape to get started</p>
    </div>
    ```
  - **Success Criteria:**
    - [ ] Large icon, clear text, helpful subtext
    - [ ] Centered and visually appealing
  - **Tests:**
    1. Delete all objects → see beautiful empty state
  - **Edge Cases:**
    - ⚠️ None expected

---

## 9.2 Search/Filter Layers

**Estimated Time:** 45-60 minutes

### 9.2.1 Add Search Input

- [ ] **Action:** Add search bar to filter layers by name
  - **Why:** Quickly find layers in large documents
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { useState } from 'react';
    import { Search, X } from 'lucide-react';

    export function LayersPanel() {
      const [searchQuery, setSearchQuery] = useState('');

      const filteredObjects = objects.filter((obj) => {
        const name = obj.name || generateLayerName(obj.type, [obj]);
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });

      return (
        <aside>
          {/* Header */}

          {/* Search Bar */}
          <div className="px-2 py-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search layers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Filtered Layer List */}
          {filteredObjects.length === 0 ? (
            searchQuery ? (
              <div className="...">No layers match "{searchQuery}"</div>
            ) : (
              <div className="...">No objects on canvas</div>
            )
          ) : (
            // Render filteredObjects instead of objects
          )}
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Search input below header
    - [ ] Filters layers by name (case-insensitive)
    - [ ] Clear button (X) when query not empty
    - [ ] Shows "No matches" when search has no results
  - **Tests:**
    1. Type "rect" → only rectangles shown
    2. Type "Circle 2" → only Circle 2 shown
    3. Type "xyz" → "No layers match" message
    4. Click X button → search clears, all layers shown
  - **Edge Cases:**
    - ⚠️ Search while hovering → hover state maintained
    - ⚠️ Case-insensitive matching

---

# Phase 10: Testing & Validation (2-3 hours)

**Goal:** Comprehensive testing across all features.

---

## 10.1 Manual Testing Checklist

**Estimated Time:** 1.5-2 hours

### 10.1.1 Comprehensive Feature Testing

- [ ] **Action:** Test all layer panel features systematically
  - **Why:** Verify everything works together
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] All items in checklist pass
  - **Tests:**
    1. **Panel Toggle:**
       - Click toggle → panel opens/closes smoothly
       - Canvas adjusts position correctly
       - No overlap with right sidebar
       - Animation smooth (200ms)
    2. **Layer Display:**
       - All canvas objects appear in list
       - Z-order correct (top = front)
       - Icons correct for each type
       - Names display correctly
    3. **Layer Naming:**
       - Create 5 rectangles → Names "Rectangle 1-5"
       - Delete "Rectangle 3", create new → Name "Rectangle 3"
       - Create circles → Names "Circle 1-3"
       - Rename layer → name persists
    4. **Selection:**
       - Click layer → selects on canvas
       - Click canvas → highlights in panel
       - Shift+click → multi-select
       - Cmd+click → toggle selection
    5. **Hover:**
       - Hover layer → dashed outline on canvas
       - Hover canvas → layer highlights in panel
    6. **Reordering:**
       - Drag layer up → z-index increases
       - Drag layer down → z-index decreases
    7. **Visibility:**
       - Click eye → object hides
       - Click again → object shows
       - Hidden layer grayed out
    8. **Context Menu:**
       - Right-click → menu appears
       - Duplicate → copy created
       - Delete → object removed
       - Bring to Front → moves to top
       - Send to Back → moves to bottom
    9. **Keyboard Shortcuts:**
       - Delete → removes
       - Cmd+D → duplicates
       - Cmd+] → to front
       - Cmd+[ → to back
    10. **Search:**
        - Type "rect" → filters to rectangles
        - Clear → shows all
  - **Edge Cases:**
    - ⚠️ All features work together without conflicts

---

## 10.2 Performance Tests

**Estimated Time:** 30-45 minutes

### 10.2.1 Large Canvas Performance

- [ ] **Action:** Test performance with 100+ layers
  - **Why:** Verify 60 FPS target met
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] 60 FPS with 100+ layers
    - [ ] Smooth scrolling
    - [ ] All interactions responsive
  - **Tests:**
    1. Create 100 rectangles programmatically
    2. Open Chrome DevTools Performance tab
    3. Record while:
       - Scrolling layer panel
       - Selecting layers
       - Dragging layers
       - Hovering layers
    4. Verify: Frame time < 16ms (60 FPS)
    5. Test with 500 layers: FPS > 30 (acceptable)
  - **Edge Cases:**
    - ⚠️ Virtual scrolling essential for 100+ layers

---

## 10.3 Multi-User Testing

**Estimated Time:** 30 minutes

### 10.3.1 Collaborative Features

- [ ] **Action:** Test real-time sync with multiple users
  - **Why:** Verify collaborative features work
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] User A creates object → User B sees layer appear
    - [ ] User A renames → User B sees name update
    - [ ] User A reorders → User B sees new order
    - [ ] User A toggles visibility → User B sees hide/show
  - **Tests:**
    1. Open 2 browser windows, both logged in
    2. Window A: Create rectangle → Window B sees new layer
    3. Window A: Rename to "Test" → Window B sees name change
    4. Window A: Drag to reorder → Window B sees new position
    5. Window A: Hide object → Window B sees eye icon change
  - **Edge Cases:**
    - ⚠️ Network latency: May take 50-200ms to sync
    - ⚠️ Concurrent edits: Last write wins

---

# Phase 11: Enhanced Drag-and-Drop (Full Layer Dragging) (1-1.5 hours)

**Goal:** Make entire layer row draggable (not just grip icon) for better UX.

---

## 11.1 Full Row Draggable

**Estimated Time:** 45-60 minutes

### 11.1.1 Update LayerItem Drag Behavior

- [ ] **Action:** Apply drag listeners to entire LayerItem instead of just grip icon
  - **Why:** More intuitive UX - users expect to drag anywhere on the row
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { useSortable } from '@dnd-kit/sortable';
    import { CSS } from '@dnd-kit/utilities';

    export const LayerItem = memo(function LayerItem({ object, ... }) {
      const [isRenaming, setIsRenaming] = useState(false);

      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
      } = useSortable({
        id: object.id,
        disabled: isRenaming, // Disable drag while renaming
      });

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
      };

      return (
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners} // Apply listeners to entire div
          onClick={(e) => {
            if (!isRenaming) {
              onSelect(e);
            }
          }}
          onDoubleClick={(e) => {
            if (!isRenaming) {
              handleDoubleClick(e);
            }
          }}
          className={`
            h-8 px-2 py-1 flex items-center gap-2
            ${!isRenaming ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
            ${isDragging ? 'opacity-50 z-10' : ''}
            ${/* ... other classes */}
          `}
        >
          <LayerIcon type={object.type} />

          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()} // Prevent drag during rename
              className="..."
            />
          ) : (
            <span className="...">{object.name}</span>
          )}

          <button
            onClick={handleVisibilityClick}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking eye
            className="..."
          >
            {isVisible ? <Eye /> : <EyeOff />}
          </button>
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Entire layer row is draggable
    - [ ] Cursor changes to grab/grabbing on entire row
    - [ ] Drag disabled during rename mode
    - [ ] Eye icon click doesn't trigger drag
    - [ ] Selection still works on single click
  - **Tests:**
    1. Click anywhere on layer (not just icon) and drag → layer moves
    2. Double-click to rename → drag disabled, cursor normal
    3. Click eye icon → visibility toggles, no drag
    4. Single click layer → selects (doesn't drag)
    5. Click and hold 200ms, then move → drag starts
  - **Edge Cases:**
    - ⚠️ Disable drag during rename to prevent conflicts
    - ⚠️ stopPropagation on eye icon to prevent drag
    - ⚠️ Distinguish between click (select) and drag

### 11.1.2 Remove Grip Icon

- [ ] **Action:** Remove GripVertical icon since entire row is now draggable
  - **Why:** Simplifies UI, more space for layer name
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    // Remove this:
    // <GripVertical className="w-3 h-3 text-gray-400" />

    // Layer structure becomes:
    <div className="...">
      <LayerIcon type={object.type} />
      <span className="...">{object.name}</span>
      <button>Eye icon</button>
    </div>
    ```
  - **Success Criteria:**
    - [ ] No grip icon visible
    - [ ] Layer name has more space
    - [ ] Layout still clean and aligned
  - **Tests:**
    1. Verify no grip icon shows
    2. Layer name can be longer before truncating
  - **Edge Cases:**
    - ⚠️ None expected

---

# Phase 12: Hierarchy System with Dropdown (4-6 hours)

**Goal:** Add dropdown arrows and grouping/hierarchy support for organizing layers.

---

## 12.1 Group Data Structure

**Estimated Time:** 1-1.5 hours

### 12.1.1 Add Group Type to Canvas Types

- [ ] **Action:** Extend canvas types to support groups/frames
  - **Why:** Groups are containers that hold other objects
  - **Files Modified:**
    - Update: `src/types/canvas.types.ts`
  - **Implementation Details:**
    ```typescript
    export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'group';

    export interface BaseCanvasObject {
      id: string;
      type: ShapeType;
      x: number;
      y: number;
      name?: string;
      visible?: boolean;
      locked?: boolean;
      parentId?: string; // NEW: ID of parent group (undefined = root level)
      createdBy: string;
      createdAt: number;
      updatedAt: number;
    }

    export interface GroupObject extends BaseCanvasObject {
      type: 'group';
      width: number;
      height: number;
      childIds: string[]; // Array of child object IDs
      collapsed?: boolean; // For layers panel collapsed state
    }

    export type CanvasObject =
      | RectangleObject
      | CircleObject
      | TextObject
      | LineObject
      | GroupObject;
    ```
  - **Success Criteria:**
    - [ ] GroupObject type added
    - [ ] parentId property added to BaseCanvasObject
    - [ ] collapsed property for UI state
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run `npm run type-check`
    2. Create test group object → type checks pass
  - **Edge Cases:**
    - ⚠️ parentId undefined = root level object
    - ⚠️ childIds must reference valid object IDs

### 12.1.2 Add Hierarchy Helper Utilities

- [ ] **Action:** Create utility functions for hierarchy operations
  - **Why:** Reusable logic for tree operations
  - **Files Modified:**
    - Create: `src/features/layers-panel/utils/hierarchy.ts`
  - **Implementation Details:**
    ```typescript
    import type { CanvasObject, GroupObject } from '@/types/canvas.types';

    /**
     * Get children of a group
     */
    export function getChildren(
      groupId: string,
      objects: CanvasObject[]
    ): CanvasObject[] {
      return objects.filter((obj) => obj.parentId === groupId);
    }

    /**
     * Get all descendants (recursive)
     */
    export function getDescendants(
      groupId: string,
      objects: CanvasObject[]
    ): CanvasObject[] {
      const children = getChildren(groupId, objects);
      const descendants = [...children];

      children.forEach((child) => {
        if (child.type === 'group') {
          descendants.push(...getDescendants(child.id, objects));
        }
      });

      return descendants;
    }

    /**
     * Get root level objects (no parent)
     */
    export function getRootObjects(objects: CanvasObject[]): CanvasObject[] {
      return objects.filter((obj) => !obj.parentId);
    }

    /**
     * Build hierarchical tree structure
     */
    export interface TreeNode {
      object: CanvasObject;
      children: TreeNode[];
      depth: number;
    }

    export function buildTree(
      objects: CanvasObject[],
      parentId?: string,
      depth = 0
    ): TreeNode[] {
      const children = objects.filter((obj) => obj.parentId === parentId);

      return children.map((object) => ({
        object,
        depth,
        children: object.type === 'group'
          ? buildTree(objects, object.id, depth + 1)
          : [],
      }));
    }

    /**
     * Check if object is ancestor of another
     */
    export function isAncestor(
      ancestorId: string,
      descendantId: string,
      objects: CanvasObject[]
    ): boolean {
      const descendants = getDescendants(ancestorId, objects);
      return descendants.some((obj) => obj.id === descendantId);
    }
    ```
  - **Success Criteria:**
    - [ ] All functions have JSDoc comments
    - [ ] All functions type-safe
    - [ ] Handles empty arrays
    - [ ] Handles deep nesting (10+ levels)
  - **Tests:**
    1. Test getChildren with group containing 3 objects
    2. Test getDescendants with nested groups (3 levels deep)
    3. Test getRootObjects filters correctly
    4. Test buildTree creates correct structure
    5. Test isAncestor with nested hierarchy
  - **Edge Cases:**
    - ⚠️ Circular references: Prevented by only allowing downward parent→child links
    - ⚠️ Orphaned objects: parentId references deleted group → treat as root

---

## 12.2 Collapsible Layer Groups

**Estimated Time:** 2-3 hours

### 12.2.1 Create CollapsibleLayerItem Component

- [ ] **Action:** Create new component for layers that can collapse/expand
  - **Why:** Show hierarchy with dropdown arrows like Figma
  - **Files Modified:**
    - Create: `src/features/layers-panel/components/CollapsibleLayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { memo, useState } from 'react';
    import { ChevronRight, ChevronDown } from 'lucide-react';
    import type { CanvasObject, TreeNode } from '@/types/canvas.types';
    import { LayerIcon } from './LayerIcon';
    import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

    interface CollapsibleLayerItemProps {
      node: TreeNode;
      isSelected: boolean;
      isHovered: boolean;
      onSelect: (e: React.MouseEvent) => void;
      onHover: () => void;
      onHoverEnd: () => void;
      onToggleCollapse?: () => void;
      collapsed?: boolean;
    }

    export const CollapsibleLayerItem = memo(function CollapsibleLayerItem({
      node,
      isSelected,
      isHovered,
      onSelect,
      onHover,
      onHoverEnd,
      onToggleCollapse,
      collapsed = false,
    }: CollapsibleLayerItemProps) {
      const { object, depth, children } = node;
      const hasChildren = children.length > 0;
      const isVisible = object.visible !== false;
      const isLocked = object.locked === true;

      // Indent based on depth (12px per level)
      const paddingLeft = `${8 + depth * 12}px`;

      return (
        <div>
          {/* Layer row */}
          <div
            onClick={onSelect}
            onMouseEnter={onHover}
            onMouseLeave={onHoverEnd}
            style={{ paddingLeft }}
            className={`
              h-8 pr-2 py-1 flex items-center gap-1.5 cursor-pointer
              transition-colors duration-75
              ${isSelected ? 'bg-blue-50 border-r-2 border-r-blue-500' : 'border-r-2 border-r-transparent'}
              ${!isSelected && isHovered ? 'bg-gray-50' : ''}
            `}
          >
            {/* Collapse arrow (only for groups with children) */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {collapsed ? (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-4" /> // Spacer for alignment
            )}

            <LayerIcon type={object.type} />

            <span className={`
              text-xs truncate flex-1
              ${isSelected ? 'font-medium text-gray-900' : 'font-normal text-gray-700'}
            `}>
              {object.name || `${object.type} ${object.id.slice(0, 4)}`}
            </span>

            {/* Actions: Lock and Visibility */}
            <div className="flex items-center gap-1">
              {/* Lock button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // onToggleLock();
                }}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {/* Visibility button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // onToggleVisibility();
                }}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              >
                {isVisible ? (
                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Arrow icon appears for groups with children
    - [ ] Clicking arrow toggles collapse/expand
    - [ ] Indentation increases with depth (12px per level)
    - [ ] Lock and visibility icons on right
    - [ ] Spacer aligns non-group items
  - **Tests:**
    1. Render group with children → see ChevronDown
    2. Click arrow → changes to ChevronRight
    3. Render at depth=2 → indentation is 32px (8 + 2*12)
    4. Render non-group → spacer maintains alignment
  - **Edge Cases:**
    - ⚠️ stopPropagation on arrow prevents layer selection
    - ⚠️ Deep nesting: Limit to 10 levels to prevent excessive indent

### 12.2.2 Update LayersPanel to Render Tree

- [ ] **Action:** Update LayersPanel to use hierarchical tree structure
  - **Why:** Display nested structure instead of flat list
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { buildTree, TreeNode } from '../utils/hierarchy';
    import { CollapsibleLayerItem } from './CollapsibleLayerItem';
    import { useCanvasStore, useUIStore } from '@/stores';

    export function LayersPanel() {
      const objects = useCanvasStore((state) => state.objects);
      const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

      // Build hierarchical tree
      const tree = buildTree(objects);

      // Flatten tree for rendering (respecting collapsed state)
      const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
        const result: TreeNode[] = [];

        nodes.forEach((node) => {
          result.push(node);

          // Only include children if not collapsed
          if (node.children.length > 0 && !collapsedGroups.has(node.object.id)) {
            result.push(...flattenTree(node.children));
          }
        });

        return result;
      };

      const flatTree = flattenTree(tree);

      const handleToggleCollapse = (groupId: string) => {
        setCollapsedGroups((prev) => {
          const next = new Set(prev);
          if (next.has(groupId)) {
            next.delete(groupId);
          } else {
            next.add(groupId);
          }
          return next;
        });
      };

      return (
        <aside className="...">
          {/* Header */}

          <div className="flex-1 overflow-y-auto">
            {flatTree.length === 0 ? (
              <div className="...">No objects</div>
            ) : (
              <div className="py-1">
                {flatTree.map((node) => (
                  <CollapsibleLayerItem
                    key={node.object.id}
                    node={node}
                    isSelected={selectedIds.includes(node.object.id)}
                    isHovered={hoveredObjectId === node.object.id}
                    onSelect={(e) => handleLayerSelect(node.object.id, e)}
                    onHover={() => setHoveredObject(node.object.id)}
                    onHoverEnd={() => setHoveredObject(null)}
                    onToggleCollapse={() => handleToggleCollapse(node.object.id)}
                    collapsed={collapsedGroups.has(node.object.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Tree structure renders correctly
    - [ ] Collapsed groups hide children
    - [ ] Expanding shows children
    - [ ] Nested groups work (3+ levels)
  - **Tests:**
    1. Create group with 3 shapes → see 4 items (1 group + 3 children)
    2. Collapse group → see 1 item (only group)
    3. Expand group → see 4 items again
    4. Create nested group (group in group) → correct indentation
  - **Edge Cases:**
    - ⚠️ Empty groups: Show arrow but no children
    - ⚠️ Collapsed state persists in local state (not synced to DB)

---

## 12.3 Group Selection

**Estimated Time:** 1-1.5 hours

### 12.3.1 Implement Group Selection Logic

- [ ] **Action:** Clicking group selects all children
  - **Why:** Figma behavior - selecting group selects all contents
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { getDescendants } from '../utils/hierarchy';

    export function LayersPanel() {
      const handleLayerSelect = (objectId: string, e: React.MouseEvent) => {
        const object = objects.find((obj) => obj.id === objectId);

        // If group, select group + all descendants
        let idsToSelect = [objectId];
        if (object?.type === 'group') {
          const descendants = getDescendants(objectId, objects);
          idsToSelect = [objectId, ...descendants.map((obj) => obj.id)];
        }

        if (e.shiftKey) {
          // Shift: Add to selection
          const newSelection = [...new Set([...selectedIds, ...idsToSelect])];
          selectObjects(newSelection);
        } else if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl: Toggle
          const isSelected = idsToSelect.every((id) => selectedIds.includes(id));
          if (isSelected) {
            // Remove all from selection
            selectObjects(selectedIds.filter((id) => !idsToSelect.includes(id)));
          } else {
            // Add all to selection
            selectObjects([...new Set([...selectedIds, ...idsToSelect])]);
          }
        } else {
          // Normal: Replace selection
          selectObjects(idsToSelect);
        }
      };

      // ... rest of component
    }
    ```
  - **Success Criteria:**
    - [ ] Clicking group selects group + all children
    - [ ] Works with nested groups
    - [ ] Shift+click adds entire group
    - [ ] Cmd+click toggles entire group
  - **Tests:**
    1. Click group with 3 shapes → all 4 selected
    2. Click nested group → parent + all descendants selected
    3. Shift+click group → adds to selection
    4. Cmd+click selected group → deselects all
  - **Edge Cases:**
    - ⚠️ Empty groups: Only group itself selected
    - ⚠️ Partial selection: If some children selected, clicking group adds remaining

### 12.3.2 Research Figma Lock Implementation

- [ ] **Action:** Research Figma's lock functionality via documentation
  - **Why:** Ensure our implementation matches expected UX
  - **Files Modified:**
    - None (research only)
  - **Implementation Details:**
    - Search Figma help docs for "lock layers"
    - Search for "lock object" or "prevent editing"
    - Document findings in this task
  - **Success Criteria:**
    - [ ] Understand Figma's lock behavior
    - [ ] Document where lock icon appears
    - [ ] Document what lock prevents (selection, editing, deletion)
  - **Tests:**
    1. Search https://help.figma.com for "lock"
    2. Document key findings:
       - Lock icon location (layers panel)
       - Lock prevents: selection, dragging, editing, deletion
       - Lock icon: padlock (closed when locked)
       - Locked objects still visible
       - Locked objects can be unlocked from layers panel
  - **Edge Cases:**
    - ⚠️ Locked groups: Children also locked
    - ⚠️ Keyboard shortcuts: Work on locked objects? (research needed)

---

# Phase 13: Multi-Select Enhancement (Shift-Click Range Selection) (1-1.5 hours)

**Goal:** Implement shift-click range selection (like Figma) in layers panel.

---

## 13.1 Range Selection

**Estimated Time:** 1-1.5 hours

### 13.1.1 Implement Shift-Click Range Selection

- [ ] **Action:** Shift-click selects all layers between last selected and clicked
  - **Why:** Faster multi-selection for adjacent layers
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    export function LayersPanel() {
      const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

      const handleLayerSelect = (objectId: string, e: React.MouseEvent) => {
        const object = objects.find((obj) => obj.id === objectId);

        // Get IDs to select (including descendants if group)
        let idsToSelect = [objectId];
        if (object?.type === 'group') {
          const descendants = getDescendants(objectId, objects);
          idsToSelect = [objectId, ...descendants.map((obj) => obj.id)];
        }

        if (e.shiftKey && lastSelectedId) {
          // SHIFT-CLICK RANGE SELECTION
          // Find range between lastSelectedId and objectId in flat tree
          const flatTree = flattenTree(buildTree(objects));
          const ids = flatTree.map((node) => node.object.id);

          const lastIndex = ids.indexOf(lastSelectedId);
          const currentIndex = ids.indexOf(objectId);

          if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);

            // Select all layers in range (including groups' children)
            const rangeIds = ids.slice(start, end + 1);
            const expandedIds = new Set<string>();

            rangeIds.forEach((id) => {
              expandedIds.add(id);
              const obj = objects.find((o) => o.id === id);
              if (obj?.type === 'group') {
                const descendants = getDescendants(id, objects);
                descendants.forEach((d) => expandedIds.add(d.id));
              }
            });

            selectObjects([...expandedIds]);
            setLastSelectedId(objectId);
            return;
          }
        }

        if (e.shiftKey) {
          // Shift without range: Add to selection
          const newSelection = [...new Set([...selectedIds, ...idsToSelect])];
          selectObjects(newSelection);
        } else if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl: Toggle
          const isSelected = idsToSelect.every((id) => selectedIds.includes(id));
          if (isSelected) {
            selectObjects(selectedIds.filter((id) => !idsToSelect.includes(id)));
          } else {
            selectObjects([...new Set([...selectedIds, ...idsToSelect])]);
          }
        } else {
          // Normal: Replace selection
          selectObjects(idsToSelect);
        }

        setLastSelectedId(objectId);
      };

      // ... rest of component
    }
    ```
  - **Success Criteria:**
    - [ ] Shift-click selects range between last clicked and current
    - [ ] Works with flat and nested hierarchies
    - [ ] Range respects visible items (collapsed groups don't select hidden children)
    - [ ] Visual feedback: All items in range show selected state
  - **Tests:**
    1. Click "Rectangle 1" → Shift+click "Rectangle 5" → all 5 selected
    2. Click "Circle 2" → Shift+click "Rectangle 1" (above) → range selected (works backwards)
    3. With nested groups: Shift-click includes all visible layers
    4. Collapse group → Shift-click across it → only visible layers selected
  - **Edge Cases:**
    - ⚠️ First shift-click without prior selection: Treat as normal click
    - ⚠️ Shift-click on already selected: Keep range selection
    - ⚠️ Collapsed groups: Don't include hidden children in range

---

# Phase 14: Lock Functionality (2-3 hours)

**Goal:** Add lock icon and locked state to prevent object interaction.

---

## 14.1 Lock State Implementation

**Estimated Time:** 1-1.5 hours

### 14.1.1 Add Lock Icon to LayerItem

- [ ] **Action:** Add lock/unlock icon to CollapsibleLayerItem
  - **Why:** Toggle lock state from layers panel
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/CollapsibleLayerItem.tsx`
  - **Implementation Details:**
    ```typescript
    import { Lock, Unlock } from 'lucide-react';
    import { useCanvasStore } from '@/stores';

    export const CollapsibleLayerItem = memo(function CollapsibleLayerItem({ node, ... }) {
      const toggleLock = useCanvasStore((state) => state.toggleLock);
      const isLocked = node.object.locked === true;

      const handleLockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLock(node.object.id);
      };

      return (
        <div>
          <div className="... group">
            {/* ... existing elements ... */}

            <div className="flex items-center gap-1">
              {/* Lock icon - show on hover or when locked */}
              <button
                onClick={handleLockClick}
                className={`
                  p-0.5 hover:bg-gray-100 rounded transition-colors
                  ${isLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                aria-label={isLocked ? 'Unlock object' : 'Lock object'}
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-gray-600" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {/* Eye icon */}
              <button onClick={handleVisibilityClick} className="...">
                {isVisible ? <Eye /> : <EyeOff />}
              </button>
            </div>
          </div>
        </div>
      );
    });
    ```
  - **Success Criteria:**
    - [ ] Lock icon appears on hover or when locked
    - [ ] Clicking toggles between Lock and Unlock
    - [ ] Locked layers show lock icon persistently
    - [ ] Icon positioned left of eye icon
  - **Tests:**
    1. Hover layer → see unlock icon appear
    2. Click lock → icon changes to Lock, stays visible
    3. Click again → unlocks, icon hides on mouse leave
    4. Locked layer shows lock icon without hover
  - **Edge Cases:**
    - ⚠️ stopPropagation prevents layer selection on click
    - ⚠️ group-hover class reveals icon on row hover

### 14.1.2 Add toggleLock to CanvasStore

- [ ] **Action:** Add toggleLock action to canvasStore
  - **Why:** Manage locked state
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
    ```typescript
    interface CanvasStore {
      // ... existing state ...

      /**
       * Toggle lock state of an object
       *
       * @param id - Object ID to toggle
       */
      toggleLock: (id: string) => void;
    }

    export const useCanvasStore = create<CanvasStore>((set, get) => ({
      // ... existing implementation ...

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
    - [ ] Default false if undefined
  - **Tests:**
    1. Call toggleLock('rect-1')
    2. Verify object.locked === true
    3. Call again → object.locked === false
  - **Edge Cases:**
    - ⚠️ Default false: undefined treated as unlocked

---

## 14.2 Enforce Lock Behavior

**Estimated Time:** 1-1.5 hours

### 14.2.1 Prevent Canvas Interaction with Locked Objects

- [ ] **Action:** Update shape components to prevent interaction when locked
  - **Why:** Locked objects cannot be selected, dragged, edited, or deleted
  - **Files Modified:**
    - Update: `src/features/canvas-core/shapes/Rectangle.tsx`
    - Update: `src/features/canvas-core/shapes/Circle.tsx`
    - Update: `src/features/canvas-core/shapes/TextShape.tsx`
    - Update: `src/features/canvas-core/shapes/Line.tsx`
  - **Implementation Details:**
    ```typescript
    export function Rectangle({ rectangle, isSelected, onSelect }) {
      const isLocked = rectangle.locked === true;

      return (
        <>
          <Rect
            {...props}
            // Disable interaction when locked
            listening={!isLocked} // Locked objects don't respond to events
            opacity={isLocked ? 0.6 : 1} // Visual indication
            onClick={isLocked ? undefined : onSelect}
            onTap={isLocked ? undefined : onSelect}
            onDragStart={isLocked ? (e) => e.target.stopDrag() : undefined}
            draggable={!isLocked}
          />

          {/* Show lock icon on canvas when locked */}
          {isLocked && (
            <Group x={rectangle.x} y={rectangle.y}>
              <Circle
                x={8}
                y={8}
                radius={10}
                fill="white"
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <Path
                x={8}
                y={8}
                data="M-3,-1 L3,-1 L3,2 L-3,2 Z M-2,-1 L-2,-3 C-2,-4 -1,-4 0,-4 C1,-4 2,-4 2,-3 L2,-1"
                fill="#9ca3af"
                scale={{ x: 0.6, y: 0.6 }}
              />
            </Group>
          )}

          {/* Selection outline only if not locked */}
          {isSelected && !isLocked && (
            <Rect {...} /> // existing selection outline
          )}
        </>
      );
    }
    ```
    Apply to all shape components.
  - **Success Criteria:**
    - [ ] Locked objects don't respond to clicks
    - [ ] Locked objects can't be dragged
    - [ ] Locked objects show visual indication (opacity or icon)
    - [ ] Locked objects can't be selected from canvas
    - [ ] Selection outline doesn't appear on locked objects
  - **Tests:**
    1. Lock rectangle → click on canvas → not selected
    2. Try to drag locked object → doesn't move
    3. Locked object shows reduced opacity or lock icon
    4. Select unlocked object → works normally
  - **Edge Cases:**
    - ⚠️ listening={false} prevents all interaction
    - ⚠️ Can still select from layers panel (for unlocking)

### 14.2.2 Prevent Deletion of Locked Objects

- [ ] **Action:** Check lock state before deleting
  - **Why:** Locked objects should not be deletable
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
    - Update: `src/features/layers-panel/hooks/useLayerShortcuts.ts`
  - **Implementation Details:**
    ```typescript
    // In canvasStore.ts:
    removeObject: (id) => {
      const object = get().objects.find((obj) => obj.id === id);
      if (object?.locked) {
        console.warn('Cannot delete locked object:', id);
        return; // Silently fail or show toast
      }

      // ... existing delete logic ...
    },

    // In useLayerShortcuts.ts:
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
      e.preventDefault();
      selectedIds.forEach((id) => {
        const object = objects.find((obj) => obj.id === id);
        if (!object?.locked) {
          removeObject(id);
        }
      });
    }
    ```
  - **Success Criteria:**
    - [ ] Locked objects cannot be deleted via Delete key
    - [ ] Locked objects cannot be deleted via context menu
    - [ ] Attempting deletion shows warning or silently fails
    - [ ] Unlocked objects in multi-select still delete
  - **Tests:**
    1. Lock rectangle → press Delete → object remains
    2. Select 2 objects (1 locked, 1 unlocked) → Delete → only unlocked deleted
    3. Right-click locked object → Delete option disabled or grayed out
  - **Edge Cases:**
    - ⚠️ Show user feedback when trying to delete locked object
    - ⚠️ Multi-delete: Filter out locked objects, delete rest

### 14.2.3 Disable Context Menu Actions for Locked Objects

- [ ] **Action:** Disable or hide context menu actions for locked objects
  - **Why:** Prevent unintended modifications
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
      onToggleLock: () => void; // Add this action
    }

    export function LayerContextMenu({ isLocked, onToggleLock, ... }: LayerContextMenuProps) {
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {children}
          </ContextMenuTrigger>
          <ContextMenuContent>
            {/* Lock/Unlock always available */}
            <ContextMenuItem onClick={onToggleLock}>
              {isLocked ? <Unlock className="..." /> : <Lock className="..." />}
              {isLocked ? 'Unlock' : 'Lock'}
            </ContextMenuItem>
            <ContextMenuSeparator />

            {/* Disable editing actions when locked */}
            <ContextMenuItem
              onClick={onRename}
              disabled={isLocked}
              className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Edit2 className="..." />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate}>
              <Copy className="..." />
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onDelete}
              disabled={isLocked}
              className={isLocked ? 'opacity-50 cursor-not-allowed text-red-400' : 'text-red-600'}
            >
              <Trash2 className="..." />
              Delete
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onBringToFront}
              disabled={isLocked}
              className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ArrowUp className="..." />
              Bring to Front
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onSendToBack}
              disabled={isLocked}
              className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ArrowDown className="..." />
              Send to Back
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Lock/Unlock always available
    - [ ] Rename, Delete, Reorder disabled for locked objects
    - [ ] Duplicate always available (creates unlocked copy)
    - [ ] Disabled items grayed out
  - **Tests:**
    1. Right-click locked object → Rename/Delete grayed out
    2. Click disabled item → no action
    3. Click Lock → becomes unlocked, actions enabled
    4. Duplicate locked object → copy is unlocked
  - **Edge Cases:**
    - ⚠️ Duplicate should create unlocked copy
    - ⚠️ Lock/Unlock always available

---

# Phase 15: Collapsible Layers Tab (1-2 hours)

**Goal:** Add collapsible section header to layers panel, matching right sidebar style.

---

## 15.1 Collapsible Section Header

**Estimated Time:** 1-1.5 hours

### 15.1.1 Create CollapsibleSection Component

- [ ] **Action:** Create reusable collapsible section component
  - **Why:** Match right sidebar (PropertiesPanel) collapsible sections
  - **Files Modified:**
    - Create: `src/components/ui/collapsible-section.tsx`
  - **Implementation Details:**
    ```typescript
    import { useState } from 'react';
    import { ChevronDown, ChevronRight } from 'lucide-react';
    import { cn } from '@/lib/utils';

    interface CollapsibleSectionProps {
      title: string;
      defaultOpen?: boolean;
      children: React.ReactNode;
      className?: string;
    }

    /**
     * Collapsible Section Component
     *
     * Expandable/collapsible section with header and content
     * Used in sidebars for organizing panels
     */
    export function CollapsibleSection({
      title,
      defaultOpen = true,
      children,
      className,
    }: CollapsibleSectionProps) {
      const [isOpen, setIsOpen] = useState(defaultOpen);

      return (
        <div className={cn('border-b border-gray-200', className)}>
          {/* Section Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              w-full h-8 px-3 flex items-center justify-between
              hover:bg-gray-50 transition-colors
              text-xs font-semibold text-gray-900
            "
          >
            <span>{title}</span>
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>

          {/* Section Content */}
          {isOpen && (
            <div className="py-1">
              {children}
            </div>
          )}
        </div>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] Header shows title and arrow
    - [ ] Clicking header toggles collapse/expand
    - [ ] Smooth visual transition
    - [ ] Matches PropertiesPanel section style
  - **Tests:**
    1. Render with title="Test" → see header
    2. Click header → content collapses
    3. Click again → content expands
    4. defaultOpen=false → starts collapsed
  - **Edge Cases:**
    - ⚠️ None expected

### 15.1.2 Wrap Layers List in CollapsibleSection

- [ ] **Action:** Add "Layers" collapsible section to LayersPanel
  - **Why:** Prepare for future "Pages" section, match right sidebar UX
  - **Files Modified:**
    - Update: `src/features/layers-panel/components/LayersPanel.tsx`
  - **Implementation Details:**
    ```typescript
    import { CollapsibleSection } from '@/components/ui/collapsible-section';

    export function LayersPanel() {
      return (
        <aside className="...">
          {/* Header with panel title and toggle */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-900">
              Playground Canvas
            </h2>
            <button onClick={toggleLeftSidebar} className="...">
              <ChevronLeft className="..." />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-2 py-2 border-b border-gray-200">
            {/* ... search input ... */}
          </div>

          {/* Collapsible Layers Section */}
          <div className="flex-1 overflow-y-auto">
            <CollapsibleSection title="Layers" defaultOpen={true}>
              {flatTree.length === 0 ? (
                <div className="...">No objects</div>
              ) : (
                <div className="space-y-0">
                  {flatTree.map((node) => (
                    <CollapsibleLayerItem key={node.object.id} node={node} {...} />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Future: Pages section can be added here */}
            {/* <CollapsibleSection title="Pages" defaultOpen={false}>
              ...
            </CollapsibleSection> */}
          </div>
        </aside>
      );
    }
    ```
  - **Success Criteria:**
    - [ ] "Layers" section header appears
    - [ ] Clicking collapses/expands layers list
    - [ ] Matches right sidebar section style
    - [ ] Easy to add new sections (Pages, Assets, etc.)
  - **Tests:**
    1. See "Layers" header with arrow
    2. Click "Layers" → list collapses
    3. Click again → list expands
    4. Visual style matches PropertiesPanel sections
  - **Edge Cases:**
    - ⚠️ Overflow-y-auto on parent container for scrolling

---

# Phase 16: Final Integration & Testing (2-3 hours)

**Goal:** Test all new features together, fix bugs, polish UX.

---

## 16.1 Integration Testing

**Estimated Time:** 1.5-2 hours

### 16.1.1 Test All New Features Together

- [ ] **Action:** Comprehensive testing of all enhancements
  - **Why:** Ensure features work together without conflicts
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] All feature checklist items pass
  - **Tests:**
    1. **Full Row Dragging:**
       - Drag layer by name area → reorders correctly
       - Drag by icon area → reorders correctly
       - Rename mode → drag disabled
    2. **Hierarchy:**
       - Create group → see arrow icon
       - Add shapes to group → indentation correct
       - Collapse group → children hidden
       - Select group → all children selected
       - Nested groups work (3 levels)
    3. **Shift-Click Range:**
       - Click layer 1 → Shift+click layer 5 → all 5 selected
       - Works with groups in range
       - Works backwards (high to low)
    4. **Lock Functionality:**
       - Lock object → cannot select on canvas
       - Lock object → cannot drag
       - Lock object → cannot delete
       - Lock icon shows in panel
       - Context menu actions disabled
       - Can unlock from panel
    5. **Collapsible Section:**
       - "Layers" section collapses/expands
       - Content hidden when collapsed
       - Arrow icon rotates
    6. **Combined Scenarios:**
       - Lock object in group → group selection excludes locked? (test)
       - Drag group → reorders correctly
       - Shift-select across collapsed group → correct range
       - Search while group collapsed → finds children
  - **Edge Cases:**
    - ⚠️ All features work together
    - ⚠️ No performance degradation

---

## 16.2 Bug Fixes & Polish

**Estimated Time:** 30-45 minutes

### 16.2.1 Fix Any Issues Found in Testing

- [ ] **Action:** Address bugs, edge cases, and UX issues
  - **Why:** Production-ready quality
  - **Files Modified:**
    - Various (based on issues found)
  - **Success Criteria:**
    - [ ] All known bugs fixed
    - [ ] Edge cases handled gracefully
    - [ ] UX smooth and intuitive
  - **Tests:**
    - Re-run all feature tests
    - Verify fixes work
  - **Edge Cases:**
    - Document any remaining limitations

### 16.2.2 Performance Verification

- [ ] **Action:** Verify 60 FPS performance maintained
  - **Why:** Ensure enhancements didn't degrade performance
  - **Files Modified:**
    - None (testing only)
  - **Success Criteria:**
    - [ ] 60 FPS with 100+ objects
    - [ ] Smooth dragging, scrolling, interactions
  - **Tests:**
    1. Create 100 objects in hierarchy
    2. Chrome DevTools Performance → Record
    3. Interact with panel (scroll, drag, select)
    4. Verify frame time < 16ms
  - **Edge Cases:**
    - ⚠️ Deep hierarchies may need optimization

---

## 16.3 Documentation Updates

**Estimated Time:** 15-30 minutes

### 16.3.1 Update README or Docs

- [ ] **Action:** Document new features for future developers
  - **Why:** Knowledge transfer and maintainability
  - **Files Modified:**
    - Update: Project documentation
  - **Implementation Details:**
    - Document hierarchy system
    - Document lock functionality
    - Document shift-click range selection
    - Update architecture diagrams if needed
  - **Success Criteria:**
    - [ ] All new features documented
    - [ ] Code examples provided
    - [ ] Edge cases noted
  - **Tests:**
    - Review docs for clarity
  - **Edge Cases:**
    - ⚠️ Keep docs in sync with code

---

# Summary

This enhanced implementation plan adds:

1. **Full row dragging** - More intuitive UX
2. **Hierarchy with groups** - Organize layers like Figma
3. **Shift-click range selection** - Faster multi-selection
4. **Lock functionality** - Prevent accidental edits
5. **Collapsible sections** - Scalable for future features (Pages)

**Total Additional Time:** 12-18 hours

**New Phases:** 11-16 (6 phases)

**Key Benefits:**
- Professional UX matching Figma
- Better organization for complex documents
- Protection against accidental changes
- Scalable architecture for future features

**Ready for Execution:**
Each task has clear success criteria, test procedures, and edge cases documented following the implementation plan template.
    - [ ] All changes sync < 500ms
  - **Tests:**
    1. Open 2 browser windows
    2. Window A: Create rectangle → Window B sees layer
    3. Window A: Rename to "Test" → Window B sees "Test"
    4. Window A: Drag to top → Window B sees new order
    5. Window A: Hide layer → Window B sees object disappear
    6. All syncs within 500ms
  - **Edge Cases:**
    - ⚠️ Concurrent edits: Last write wins

---

# Phase 11: Final Validation & Deployment

**Goal:** Final checks before shipping.

---

## 11.1 Code Quality Checks

**Estimated Time:** 30 minutes

### 11.1.1 Final Code Review

- [ ] **Action:** Verify all code meets quality standards
  - **Why:** Ensure clean, maintainable code
  - **Files Modified:**
    - None (review only)
  - **Success Criteria:**
    - [ ] All files < 500 lines
    - [ ] All functions have JSDoc
    - [ ] No console.log statements
    - [ ] All imports use @ alias
    - [ ] TypeScript strict mode passes
    - [ ] No 'any' types used
    - [ ] ESLint passes with 0 warnings
  - **Tests:**
    1. Run: `npm run lint`
    2. Run: `npm run type-check`
    3. Search codebase for "console.log"
    4. Check file sizes: `find src/features/layers-panel -name "*.tsx" -o -name "*.ts" | xargs wc -l`
  - **Edge Cases:**
    - ⚠️ Split files > 500 lines into smaller modules

---

## 11.2 Build and Deploy

**Estimated Time:** 15-30 minutes

### 11.2.1 Production Build

- [ ] **Action:** Build and test production bundle
  - **Why:** Verify no build errors
  - **Files Modified:**
    - None (build only)
  - **Success Criteria:**
    - [ ] Build succeeds
    - [ ] No TypeScript errors
    - [ ] All features work in production build
  - **Tests:**
    1. Run: `npm run build`
    2. Run: `npm run preview`
    3. Test all features in preview
  - **Edge Cases:**
    - ⚠️ Fix any production-only issues

---

# Success Criteria

Feature is complete when:

1. ✅ **All checklist items pass**
2. ✅ **Demo-ready:** "Toggle panel → See layers → Click to select → Hover to highlight → Drag to reorder → Right-click for actions"
3. ✅ **Performance:** 60 FPS with 100+ layers, < 50ms hover sync
4. ✅ **No console errors**
5. ✅ **Code quality:** Vertical slice architecture, max 500 lines/file, full JSDoc coverage
6. ✅ **Matches Figma UX:** Similar look and feel

**When all complete, commit with:**
`feat: Add layers panel with auto-naming, drag-to-reorder, visibility toggle, and real-time collaboration`

---

# Dependencies to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-window @types/react-window
```

---

# File Structure (Complete)

```
src/features/layers-panel/
├── components/
│   ├── LayersPanel.tsx
│   ├── LayerItem.tsx
│   ├── LayerIcon.tsx
│   ├── LayerContextMenu.tsx
│   └── index.ts
├── hooks/
│   ├── useLayerShortcuts.ts
│   └── index.ts
├── utils/
│   ├── layerNaming.ts
│   └── index.ts
└── index.ts

src/stores/
└── uiStore.ts (new)
```

---

**Estimated Total Time:** 20-25 hours

**Priority Order:**
1. Phase 1 (Infrastructure) - Critical foundation
2. Phase 2 (Naming) - Core UX
3. Phase 3 (Hover) - Key interaction
4. Phase 4 (Selection) - Essential
5. Phase 5 (Reordering) - Advanced
6. Phase 6-11 (Polish, Testing) - Quality assurance
