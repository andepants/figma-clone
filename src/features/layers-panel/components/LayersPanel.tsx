/**
 * Layers Panel Component
 *
 * Displays a hierarchical list of all canvas objects with controls for:
 * - Selection, renaming, drag-and-drop reordering
 * - Visibility toggling
 * - Bidirectional hover sync with canvas
 * - Parent-child hierarchy with collapse/expand
 *
 * Hierarchy:
 * - Builds tree structure from flat objects array using buildHierarchyTree
 * - Flattens for display using flattenHierarchyTree (respects collapse state)
 * - Collapsed parents hide their children in the panel
 * - Indentation shows hierarchy depth (16px per level)
 *
 * Drag & Drop:
 * - Uses @dnd-kit for smooth drag-and-drop layer reordering
 * - Pointer sensor has 200ms activation delay (prevents click interference)
 * - Quick click selects layer, press-and-hold (200ms) starts drag
 * - Supports both pointer and keyboard sensors
 * - Reordering syncs to canvasStore and Firebase RTDB
 * - Top of list = front of canvas (objects array reversed for display)
 *
 * @component
 */

'use client';

import { useMemo, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useUIStore } from '@/stores/uiStore';
import { LayerItem } from './LayerItem';
import { SectionHeader } from './SectionHeader';
import { buildHierarchyTree, flattenHierarchyTree, getAllDescendantIds, moveToParent } from '../utils/hierarchy';
import { MenuButton, SidebarToggleButton } from '@/features/navigation/components';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

/**
 * LayersPanel component
 *
 * Renders a collapsible sidebar on the left displaying all canvas objects.
 * Features:
 * - 240px fixed width with smooth slide animation (200ms)
 * - Header with title and toggle button
 * - Empty state when no objects exist
 * - Drag-and-drop layer reordering with @dnd-kit
 * - Bidirectional sync with canvas hover state
 * - Automatic sync to Firebase RTDB on reorder
 * - Hierarchical tree display with collapse/expand functionality
 * - Efficient memoization for performance (useMemo on tree building and flattening)
 *
 * @returns {JSX.Element} Layers panel sidebar
 */
export function LayersPanel() {
  const objects = useCanvasStore((state) => state.objects);
  const setObjects = useCanvasStore((state) => state.setObjects);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const selectObjects = useCanvasStore((state) => state.selectObjects);
  const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);
  const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);
  const setHoveredObject = useUIStore((state) => state.setHoveredObject);

  // Drop position state for drag-drop with hierarchy
  const [dropPosition, setDropPosition] = useState<{
    id: string;
    position: 'before' | 'child' | 'after';
  } | null>(null);

  // Track last selected ID for shift-click range selection
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Persisted section collapse state from UIStore
  const layersSectionCollapsed = useUIStore((state) => state.layersSectionCollapsed);
  const toggleLayersSection = useUIStore((state) => state.toggleLayersSection);

  // Setup sensors for drag and drop
  // PointerSensor has a 200ms delay to prevent interfering with click-to-select
  // This allows quick clicks to select layers, while press-and-hold initiates drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,        // 200ms press before drag starts
        tolerance: 5,      // Allow 5px movement during delay without canceling
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Build hierarchy tree from flat objects array
  const hierarchyTree = useMemo(() => {
    return buildHierarchyTree(objects);
  }, [objects]);

  // Flatten hierarchy for display (respects collapse state)
  const displayObjects = useMemo(() => {
    const flattened = flattenHierarchyTree(hierarchyTree, false); // Don't include collapsed children
    return flattened.reverse(); // Reverse for z-order (top = front)
  }, [hierarchyTree]);

  const displayIds = displayObjects.map((obj) => obj.id);

  /**
   * Handle drag over event to determine drop position
   *
   * Calculates where the dragged item will be dropped based on mouse position:
   * - Top 25% of target = reorder ABOVE target (sibling)
   * - Middle 50% of target = make CHILD of target
   * - Bottom 25% of target = reorder BELOW target (sibling)
   *
   * Updates dropPosition state to show visual indicators.
   *
   * @param {DragOverEvent} event - The drag over event from @dnd-kit
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    if (!over || !active) {
      setDropPosition(null);
      return;
    }

    // Don't allow dropping on self
    if (active.id === over.id) {
      setDropPosition(null);
      return;
    }

    // Get the DOM element being hovered over
    const overElement = document.querySelector(`[data-layer-id="${over.id}"]`);
    if (!overElement) {
      setDropPosition(null);
      return;
    }

    // Get mouse position using delta from drag event
    // We need to use a different approach - get the center of active and over elements
    const rect = overElement.getBoundingClientRect();

    // Use the over.rect if available from dnd-kit
    const overRect = over.rect;
    if (!overRect) {
      setDropPosition(null);
      return;
    }

    // Calculate position based on the active item's position relative to target
    // This is a simpler approach that works with dnd-kit's coordinate system
    const activeElement = document.querySelector(`[data-layer-id="${active.id}"]`);
    if (!activeElement) {
      setDropPosition(null);
      return;
    }

    const activeRect = activeElement.getBoundingClientRect();
    const activeCenterY = activeRect.top + activeRect.height / 2;

    const relativeY = activeCenterY - rect.top;
    const height = rect.height;
    const percentage = relativeY / height;

    // Determine drop position based on position
    let position: 'before' | 'child' | 'after';
    if (percentage < 0.25) {
      position = 'before';
    } else if (percentage > 0.75) {
      position = 'after';
    } else {
      position = 'child';
    }

    setDropPosition({ id: over.id as string, position });
  };

  /**
   * Handle drag end event to reorder layers or create parent-child relationships
   *
   * When a layer is dropped, this function:
   * 1. Determines drop intent based on dropPosition (before/child/after)
   * 2. If 'child' position: Makes dragged object a child of target
   * 3. If 'before' or 'after': Reorders as sibling at same hierarchy level
   * 4. Prevents circular references (can't make parent a child of its descendant)
   * 5. Syncs the updated array to canvasStore (which syncs to RTDB)
   *
   * @param {DragEndEvent} event - The drag end event from @dnd-kit
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drop position visual indicator
    setDropPosition(null);

    if (!over || active.id === over.id || !dropPosition) return;

    const draggedId = active.id as string;
    const targetId = over.id as string;

    if (dropPosition.position === 'child') {
      // Make child of target
      const updated = moveToParent(draggedId, targetId, objects);

      if (updated) {
        setObjects(updated);
      }
      // Circular reference detected - silently prevented
    } else {
      // Reorder as sibling (before or after target)
      const oldIndex = objects.findIndex((obj) => obj.id === draggedId);
      const targetIndex = objects.findIndex((obj) => obj.id === targetId);

      if (oldIndex === -1 || targetIndex === -1) return;

      let newIndex = targetIndex;
      if (dropPosition.position === 'after') {
        newIndex = targetIndex + 1;
      }

      // Reorder in array
      const reordered = arrayMove(objects, oldIndex, newIndex);

      // Inherit parent from target (to maintain hierarchy level)
      const targetObj = objects[targetIndex];
      const adjustedIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
      reordered[adjustedIndex] = {
        ...reordered[adjustedIndex],
        parentId: targetObj.parentId,
      };

      setObjects(reordered);
    }
  };

  /**
   * Handle layer selection with hierarchy support and range selection
   *
   * When a parent object is selected, all its descendants are also selected.
   * Supports modifier keys for multi-selection:
   * - Shift+click: Range selection - selects all layers between last selected and current
   * - Cmd/Ctrl+click: Toggle selection (including descendants if parent)
   * - Normal click: Replace selection with object and descendants
   *
   * Range selection uses display order (flattened hierarchy) and works bidirectionally.
   *
   * @param {string} objectId - ID of the clicked object
   * @param {React.MouseEvent} e - Mouse event with modifier keys
   */
  const handleLayerSelect = (objectId: string, e: React.MouseEvent) => {
    // Get all descendants of the clicked object
    const descendants = getAllDescendantIds(objectId, objects);

    if (e.shiftKey && lastSelectedId) {
      // Range selection: Select all layers between last and current
      const lastIndex = displayObjects.findIndex((obj) => obj.id === lastSelectedId);
      const currentIndex = displayObjects.findIndex((obj) => obj.id === objectId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const startIndex = Math.min(lastIndex, currentIndex);
        const endIndex = Math.max(lastIndex, currentIndex);

        // Get all IDs in the range
        const rangeIds = displayObjects
          .slice(startIndex, endIndex + 1)
          .map((obj) => obj.id);

        // Add range to selection (don't replace - maintain existing selection)
        const newSelection = [...new Set([...selectedIds, ...rangeIds])];
        selectObjects(newSelection);
        return;
      }
    }

    if (e.shiftKey) {
      // Shift+click without range: Add to selection (including descendants if parent)
      const idsToAdd = [objectId, ...descendants];
      const newSelection = [...new Set([...selectedIds, ...idsToAdd])];
      selectObjects(newSelection);
      setLastSelectedId(objectId);
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
      setLastSelectedId(objectId);
    } else {
      // Normal click: Replace selection (including descendants if parent)
      selectObjects([objectId, ...descendants]);
      setLastSelectedId(objectId);
    }
  };

  return (
    <>
      {/* Floating buttons when sidebar is closed */}
      {!leftSidebarOpen && (
        <div className="fixed left-4 top-4 z-30 flex items-center gap-2">
          <MenuButton />
          <SidebarToggleButton />
        </div>
      )}

      {/* Panel */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-20
          w-[240px] bg-white border-r border-gray-200
          transition-transform duration-200 ease-in-out
          ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header with Navigation Icons - separated when sidebar open */}
        <div className="h-12 px-3 flex items-center justify-between border-b border-gray-200">
          <MenuButton />
          <SidebarToggleButton />
        </div>

        {/* Layers Section Header */}
        <SectionHeader
          title="Layers"
          isCollapsed={layersSectionCollapsed}
          onToggle={toggleLayersSection}
          count={objects.length}
        />

        {/* Layers List Container - hidden if section collapsed */}
        {!layersSectionCollapsed && (
          <div className="flex-1 overflow-y-auto">
          {objects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No objects on canvas</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2 space-y-0.5">
                  {/* Reverse array: top of list = front of canvas */}
                  {displayObjects.map((obj) => (
                    <LayerItem
                      key={obj.id}
                      object={obj}
                      isSelected={selectedIds.includes(obj.id)}
                      isHovered={hoveredObjectId === obj.id}
                      onSelect={(e) => handleLayerSelect(obj.id, e)}
                      onHover={() => setHoveredObject(obj.id)}
                      onHoverEnd={() => setHoveredObject(null)}
                      dropPosition={
                        dropPosition && dropPosition.id === obj.id ? dropPosition.position : null
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          </div>
        )}
      </aside>
    </>
  );
}
