/**
 * Toolbar Component
 *
 * Floating toolbar for canvas tool selection.
 * Displays available tools with icons and handles tool switching.
 */

import { MousePointer2, Square, Circle as CircleIcon, Type, Trash2, Copy, HelpCircle } from 'lucide-react';
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
  const { clearObjects, selectedId, removeObject, selectObject, objects, addObject } = useCanvasStore();

  /**
   * Handle tool button click
   */
  function handleToolClick(toolId: ToolType) {
    setActiveTool(toolId);
  }

  /**
   * Handle duplicate selected object
   * Creates a copy of the selected object with offset position
   */
  async function handleDuplicate() {
    const selectedObject = objects.find(obj => obj.id === selectedId);
    if (!selectedObject) return;

    // Create duplicate with new ID and offset position
    const duplicate = duplicateObject(selectedObject);

    // Optimistic update - add to local store immediately
    addObject(duplicate);
    selectObject(duplicate.id);

    // Sync to Realtime Database
    try {
      await addCanvasObject('main', duplicate);
    } catch (error) {
      console.error('Failed to sync duplicate to RTDB:', error);
      // Note: RTDB subscription will restore correct state if sync fails
    }
  }

  /**
   * Handle delete selected object
   * Removes the currently selected object from canvas and syncs to Realtime Database
   */
  async function handleDelete() {
    if (selectedId) {
      // Optimistic update - remove from local store immediately
      removeObject(selectedId);
      selectObject(null);

      // Sync to Realtime Database
      try {
        await removeCanvasObject('main', selectedId);
      } catch (error) {
        console.error('Failed to sync deletion to RTDB:', error);
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
      } catch (error) {
        console.error('Failed to clear canvas objects:', error);
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

        {/* Duplicate selected object button */}
        <ToolButton
          icon={Copy}
          label="Duplicate selected object"
          tooltip="Duplicate ⌘D"
          onClick={handleDuplicate}
          disabled={!selectedId}
        />

        {/* Delete selected object button */}
        <ToolButton
          icon={Trash2}
          label="Delete selected object"
          tooltip="Delete Del"
          onClick={handleDelete}
          disabled={!selectedId}
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
