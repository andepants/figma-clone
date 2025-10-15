/**
 * Toolbar Component
 *
 * Floating toolbar for canvas tool selection.
 * Displays available tools with icons and handles tool switching.
 */

import { MousePointer2, Square, Circle as CircleIcon, Type, Minus, Trash2, Copy, HelpCircle } from 'lucide-react';
import { useToolStore, useCanvasStore } from '@/stores';
import { clearAllCanvasObjects, removeCanvasObject, addCanvasObject } from '@/lib/firebase';
import { duplicateObject } from '@/features/canvas-core/utils';
import { ToolButton, ToolbarDivider } from './';
import type { Tool, ToolType } from '@/types';
import { TooltipProvider } from '@/components/ui';

/**
 * Available tools configuration
 */
const TOOLS: Tool[] = [
  {
    id: 'move',
    name: 'Move',
    icon: MousePointer2,
    shortcut: 'V',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: Square,
    shortcut: 'R',
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: CircleIcon,
    shortcut: 'C',
  },
  {
    id: 'line',
    name: 'Line',
    icon: Minus,
    shortcut: 'L',
  },
  {
    id: 'text',
    name: 'Text',
    icon: Type,
    shortcut: 'T',
  },
];

interface ToolbarProps {
  /** Callback to open keyboard shortcuts modal */
  onShowShortcuts: () => void;
}

/**
 * Toolbar component
 *
 * Renders a floating toolbar with tool selection buttons.
 * Active tool is highlighted with primary color.
 *
 * @param {function} onShowShortcuts - Callback to show keyboard shortcuts modal
 *
 * @example
 * ```tsx
 * <Toolbar onShowShortcuts={() => setIsShortcutsOpen(true)} />
 * ```
 */
export function Toolbar({ onShowShortcuts }: ToolbarProps) {
  const { activeTool, setActiveTool } = useToolStore();
  const { clearObjects, selectedIds, removeObject, selectObjects, objects, addObject } = useCanvasStore();

  /**
   * Handle tool button click
   */
  function handleToolClick(toolId: ToolType) {
    setActiveTool(toolId);
  }

  /**
   * Handle duplicate selected objects (supports multi-select)
   * Creates copies of all selected objects with offset position
   */
  async function handleDuplicate() {
    if (selectedIds.length === 0) return;

    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    const newIds: string[] = [];

    // Create duplicates for all selected objects
    for (const selectedObject of selectedObjects) {
      const duplicate = duplicateObject(selectedObject);

      // Optimistic update - add to local store immediately
      addObject(duplicate);
      newIds.push(duplicate.id);

      // Sync to Realtime Database
      try {
        await addCanvasObject('main', duplicate);
      } catch {
        // Note: RTDB subscription will restore correct state if sync fails
      }
    }

    // Select the duplicates
    selectObjects(newIds);
  }

  /**
   * Handle delete selected objects (supports multi-select)
   * Removes all selected objects from canvas and syncs to Realtime Database
   */
  async function handleDelete() {
    if (selectedIds.length === 0) return;

    // Optimistic update - remove all from local store immediately
    selectedIds.forEach(id => removeObject(id));
    selectObjects([]);

    // Sync to Realtime Database
    for (const id of selectedIds) {
      try {
        await removeCanvasObject('main', id);
      } catch {
        // Note: RTDB subscription will restore correct state if sync fails
      }
    }
  }

  /**
   * Handle clear canvas button click
   * Clears all objects from canvas and syncs to Realtime Database
   *
   * Note: Migrated from Firestore to RTDB for atomic operation
   */
  async function handleClearCanvas() {
    if (window.confirm('Clear all shapes from the canvas?')) {
      // Optimistic update
      clearObjects();

      // Sync to Realtime Database (atomic clear operation)
      try {
        await clearAllCanvasObjects('main');
      } catch {
        // Note: Could add rollback logic here if needed
      }
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-row gap-0.5 md:gap-1 rounded-lg bg-white p-1.5 md:p-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Tool selection buttons */}
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.name}
            tooltip={`${tool.name} ${tool.shortcut}`}
            onClick={() => handleToolClick(tool.id)}
            isActive={activeTool === tool.id}
          />
        ))}

        <ToolbarDivider />

        {/* Duplicate selected objects button */}
        <ToolButton
          icon={Copy}
          label="Duplicate selected objects"
          tooltip="Duplicate ⌘D"
          onClick={handleDuplicate}
          disabled={selectedIds.length === 0}
        />

        {/* Delete selected objects button */}
        <ToolButton
          icon={Trash2}
          label="Delete selected objects"
          tooltip="Delete Del"
          onClick={handleDelete}
          disabled={selectedIds.length === 0}
        />

        <ToolbarDivider />

        {/* Clear canvas button */}
        <ToolButton
          icon={Trash2}
          label="Clear Canvas"
          tooltip="Clear Canvas"
          onClick={handleClearCanvas}
          variant="danger"
        />

        <ToolbarDivider />

        {/* Keyboard shortcuts help button */}
        <ToolButton
          icon={HelpCircle}
          label="Keyboard shortcuts help"
          tooltip="Keyboard shortcuts ?"
          onClick={onShowShortcuts}
        />
      </div>
    </TooltipProvider>
  );
}
