/**
 * Toolbar Component
 *
 * Floating toolbar for canvas tool selection.
 * Displays available tools with icons and handles tool switching.
 */

import { MousePointer2, Square, Trash2 } from 'lucide-react';
import { useToolStore, useCanvasStore } from '@/stores';
import { debouncedUpdateCanvas } from '@/lib/firebase';
import type { Tool, ToolType } from '@/types';

/**
 * Available tools configuration
 */
const TOOLS: Tool[] = [
  {
    id: 'select',
    name: 'Select',
    icon: MousePointer2,
    shortcut: 'V',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: Square,
    shortcut: 'R',
  },
];

/**
 * Toolbar component
 *
 * Renders a floating toolbar with tool selection buttons.
 * Active tool is highlighted with primary color.
 *
 * @example
 * ```tsx
 * <Toolbar />
 * ```
 */
export function Toolbar() {
  const { activeTool, setActiveTool } = useToolStore();
  const { clearObjects } = useCanvasStore();

  /**
   * Handle tool button click
   */
  function handleToolClick(toolId: ToolType) {
    setActiveTool(toolId);
  }

  /**
   * Handle clear canvas button click
   * Clears all objects from canvas and syncs to Firestore
   */
  function handleClearCanvas() {
    if (window.confirm('Clear all shapes from the canvas?')) {
      clearObjects();
      // Sync empty canvas to Firestore
      debouncedUpdateCanvas('main', []);
    }
  }

  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 rounded-lg bg-white p-2 shadow-lg">
      {/* Tool selection buttons */}
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`
              group relative flex h-10 w-10 items-center justify-center rounded-md
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }
            `}
            title={`${tool.name} (${tool.shortcut})`}
            aria-label={tool.name}
            aria-pressed={isActive}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* Divider */}
      <div className="my-1 h-px bg-neutral-200" />

      {/* Clear canvas button */}
      <button
        onClick={handleClearCanvas}
        className="
          group relative flex h-10 w-10 items-center justify-center rounded-md
          text-red-500 hover:bg-red-50
          transition-colors duration-150
        "
        title="Clear Canvas"
        aria-label="Clear Canvas"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
