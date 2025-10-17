/**
 * Layer Item Component
 *
 * Individual row in layers panel representing one canvas object.
 * Displays layer icon, name, and handles selection/hover states.
 *
 * Features:
 * - Full layer item draggable for reordering (no grip icon needed)
 * - Press-and-hold (200ms) to start drag, quick click to select
 * - Visual feedback during drag (opacity-50, z-10)
 * - Cursor changes to grab/grabbing during drag interaction
 * - Blue background + blue left border when selected
 * - Gray background on hover (when not selected)
 * - Name truncation at 160px with ellipsis
 * - Double-click inline editing with auto-focus and text selection
 * - Enter to save, Escape to cancel, blur to save
 * - Empty names revert to auto-generated names
 * - Eye icon to toggle visibility (Eye/EyeOff)
 * - Hidden layers appear grayed out (opacity-50, text-gray-400)
 * - Eye icon click doesn't trigger layer selection (stopPropagation)
 * - Lock icon to toggle locked state (Lock/Unlock)
 * - Locked layers appear dimmed (opacity-60)
 * - Lock icon always visible when locked, Unlock shows on hover only
 * - Lock icon click doesn't trigger layer selection or drag (stopPropagation)
 * - Hierarchy support with indentation (16px per depth level)
 * - Dropdown arrow for parent objects (collapses/expands children)
 * - Arrow shows for parents, spacer for childless objects
 * - Memoized for performance optimization
 *
 * @module features/layers-panel/components/LayerItem
 */

import { memo, useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import type { CanvasObjectWithChildren } from '@/types/canvas.types';
import { LayerIcon } from './LayerIcon';
import { HierarchyArrow } from './HierarchyArrow';
import { generateLayerName } from '@/features/layers-panel/utils';
import { hasChildren, getAllDescendantIds, hasLockedParent } from '@/features/layers-panel/utils/hierarchy';
import { useCanvasStore } from '@/stores/canvas';
import { ContextMenu } from '@/components/common/ContextMenu';
import { getContextMenuItems } from '@/features/layers-panel/utils/contextMenu';
import { updateCanvasObject } from '@/lib/firebase';

/**
 * Props for LayerItem component
 *
 * @interface LayerItemProps
 * @property {CanvasObjectWithChildren} object - Canvas object to display (includes children and depth)
 * @property {boolean} isSelected - Whether layer is currently selected
 * @property {boolean} isHovered - Whether layer is currently hovered
 * @property {(e: React.MouseEvent) => void} onSelect - Callback when layer is clicked (receives mouse event for modifier keys)
 * @property {() => void} onHover - Callback when mouse enters layer
 * @property {() => void} onHoverEnd - Callback when mouse leaves layer
 * @property {'before' | 'child' | 'after' | null} dropPosition - Drop position indicator for drag-drop
 */
interface LayerItemProps {
  object: CanvasObjectWithChildren;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onHover: () => void;
  onHoverEnd: () => void;
  dropPosition?: 'before' | 'child' | 'after' | null;
}

/**
 * Layer Item Component
 *
 * Renders individual layer row with:
 * - Full item draggable for layer reordering (Figma-style)
 * - Visual feedback during drag (opacity-50, z-10)
 * - Cursor changes (grab → grabbing) during drag interaction
 * - Type-specific icon (16x16px)
 * - Layer name (truncated at 160px with ellipsis)
 * - Selection state (blue bg + blue 2px left border)
 * - Hover state (gray bg when not selected)
 * - 32px height (h-8)
 * - 75ms transition for smooth state changes
 * - Inline rename on double-click
 * - Hierarchy indentation (16px per depth level)
 * - Dropdown arrow for parent objects (collapses/expands children)
 *
 * Drag & Drop:
 * - Uses @dnd-kit/sortable for drag-and-drop functionality
 * - Entire layer item acts as drag handle (no grip icon)
 * - 200ms press delay before drag starts (prevents click interference)
 * - Transform and transition applied via CSS.Transform
 * - isDragging state controls visual feedback
 * - Interactive elements (input, buttons, arrow) prevent drag propagation
 *
 * Hierarchy:
 * - Indentation increases 16px per depth level (depth 0 = no indent, depth 1 = 16px, depth 2 = 32px, etc.)
 * - HierarchyArrow shows for parents with children, spacer for childless objects
 * - Arrow click toggles collapse state (doesn't trigger selection or drag)
 * - Collapsed parents hide their children in the layers panel
 *
 * Name Display:
 * - If object.name exists → shows custom name
 * - If no name → auto-generates fallback using generateLayerName
 *   (e.g., "Rectangle 1", "Circle 1", "Text 1", "Line 1")
 * - Names truncate with ellipsis if longer than 160px
 *
 * Rename Behavior:
 * - Double-click enters rename mode
 * - Input auto-focuses and selects all text
 * - Enter key saves and exits rename mode
 * - Escape key cancels and reverts to original name
 * - Blur (click away) saves the new name
 * - Empty names revert to auto-generated names
 *
 * @param {LayerItemProps} props - Component props
 * @returns {JSX.Element} Rendered layer item
 *
 * @example
 * ```tsx
 * <LayerItem
 *   object={rectangleWithChildren} // CanvasObjectWithChildren includes depth and children
 *   isSelected={true}
 *   isHovered={false}
 *   onSelect={handleSelect}
 *   onHover={handleHover}
 *   onHoverEnd={handleHoverEnd}
 * />
 * ```
 */
export const LayerItem = memo(function LayerItem({
  object,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onHoverEnd,
  dropPosition = null,
}: LayerItemProps) {
  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: object.id });

  // Rename mode state
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedName, setEditedName] = useState(object.name || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Store actions
  const updateObject = useCanvasStore((state) => state.updateObject);
  const toggleVisibility = useCanvasStore((state) => state.toggleVisibility);
  const toggleCollapse = useCanvasStore((state) => state.toggleCollapse);
  const toggleLock = useCanvasStore((state) => state.toggleLock);
  const objects = useCanvasStore((state) => state.objects);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const projectId = useCanvasStore((state) => state.projectId);

  // Hierarchy support
  const hasChildObjects = hasChildren(object.id, objects);
  const indentWidth = object.depth * 16; // 16px per hierarchy level

  // Check if all descendants are selected (for visual feedback)
  const descendants = getAllDescendantIds(object.id, objects);
  const allDescendantsSelected =
    descendants.length > 0 && descendants.every((id) => selectedIds.includes(id));

  // Use custom name if available, otherwise generate fallback name
  const displayName = object.name || generateLayerName(object.type, [object]);

  // Visibility state (defaults to true if not set)
  const isVisible = object.visible !== false;

  // Lock state (defaults to false if not set)
  const isLocked = object.locked === true;

  // Check if object has inherited lock from parent
  const hasInheritedLock = !isLocked && hasLockedParent(object.id, objects);

  // Apply drag transform and transition
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Listen for rename trigger from keyboard shortcut (Cmd+R)
  useEffect(() => {
    const handleRenameEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      if (customEvent.detail.id === object.id) {
        setIsRenaming(true);
        setEditedName(object.name || generateLayerName(object.type, []));
      }
    };

    window.addEventListener('trigger-rename', handleRenameEvent);
    return () => {
      window.removeEventListener('trigger-rename', handleRenameEvent);
    };
  }, [object.id, object.name, object.type]);

  /**
   * Handle double-click to enter rename mode
   * Stops propagation to prevent triggering parent click handlers
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setEditedName(object.name || generateLayerName(object.type, []));
  };

  /**
   * Save the edited name
   * - Trims whitespace
   * - If empty, reverts to auto-generated name
   * - Updates object in store (optimistic)
   * - Syncs to Firebase RTDB
   * - Exits rename mode
   */
  const handleSave = () => {
    const trimmedName = editedName.trim();
    const finalName = trimmedName || generateLayerName(object.type, [object]);

    // Optimistic local update (immediate)
    updateObject(object.id, { name: finalName });

    // Sync to Firebase RTDB (async)
    updateCanvasObject(projectId, object.id, { name: finalName }).catch(() => {
      // Silently fail - Firebase subscription will restore correct state if needed
    });

    setIsRenaming(false);
  };

  /**
   * Cancel editing and revert to original name
   */
  const handleCancel = () => {
    setEditedName(object.name || '');
    setIsRenaming(false);
  };

  /**
   * Handle keyboard shortcuts in rename mode
   * - Enter: save and exit
   * - Escape: cancel and revert
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  /**
   * Handle visibility toggle
   * Stops propagation to prevent triggering layer selection
   */
  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleVisibility(object.id);
  };

  /**
   * Handle lock toggle
   * Stops propagation to prevent triggering layer selection
   * Prevents unlocking child when parent is locked
   */
  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent unlocking if parent is locked
    if (hasInheritedLock) {
      return;
    }

    toggleLock(object.id);
  };

  /**
   * Handle hierarchy arrow click
   * Stops propagation to prevent triggering layer selection or drag
   */
  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCollapse(object.id);
  };

  /**
   * Handle right-click to open context menu
   * Stops propagation and prevents default browser context menu
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative">
      {/* Drop indicator: Blue line at top (reorder before) */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-20" />
      )}

      {/* Drop indicator: Blue box (make child) */}
      {dropPosition === 'child' && (
        <div className="absolute inset-0 bg-blue-100 border border-blue-500 rounded opacity-50 z-10" />
      )}

      {/* Drop indicator: Blue line at bottom (reorder after) */}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-20" />
      )}

      {/* Layer content */}
      <div
        ref={setNodeRef}
        data-layer-id={object.id}
        style={{
          ...style,
          paddingLeft: `${indentWidth + 4}px`, // Reduced base padding from 8px to 4px
        }}
        {...attributes}
        {...listeners}
        onClick={(e) => onSelect(e)}
        onContextMenu={handleContextMenu}
        onMouseEnter={onHover}
        onMouseLeave={onHoverEnd}
        className={`
          group
          h-7 pr-1.5 py-0.5 flex items-center gap-1 cursor-grab active:cursor-grabbing
          transition-colors duration-75
          ${isDragging ? 'opacity-50 z-10' : ''}
          ${!isVisible ? 'opacity-50' : ''}
          ${isLocked ? 'opacity-60' : ''}
          ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
          ${!isSelected && allDescendantsSelected ? 'bg-blue-50/30' : ''}
          ${!isSelected && !allDescendantsSelected && isHovered ? 'bg-gray-50' : ''}
        `}
      >
      {/* Hierarchy arrow */}
      <HierarchyArrow
        isCollapsed={object.isCollapsed || false}
        hasChildren={hasChildObjects}
        onToggle={handleArrowClick}
      />

      <LayerIcon type={object.type} />

      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-[11px] border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={`
            text-[11px] truncate max-w-[160px] cursor-text
            ${isSelected ? 'font-medium text-gray-900' : 'font-normal text-gray-700'}
            ${!isVisible ? 'text-gray-400' : ''}
          `}
        >
          {displayName}
        </span>
      )}

        {/* Lock icon */}
        <button
          onClick={handleLockClick}
          onPointerDown={(e) => e.stopPropagation()}
          className={`ml-auto p-0.5 rounded transition-colors ${hasInheritedLock ? 'cursor-not-allowed' : 'hover:bg-gray-100'}`}
          aria-label={isLocked ? 'Unlock object' : hasInheritedLock ? 'Locked by parent' : 'Lock object'}
          disabled={hasInheritedLock}
        >
          {isLocked ? (
            <Lock className="w-3.5 h-3.5 text-gray-500" />
          ) : hasInheritedLock ? (
            <Lock className="w-3.5 h-3.5 text-gray-400 opacity-50" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Eye icon - shows on hover or when hidden */}
        <button
          onClick={handleVisibilityClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          aria-label={isVisible ? 'Hide object' : 'Show object'}
        >
          {isVisible ? (
            <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(object, objects, selectedIds)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});
