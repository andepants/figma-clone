/**
 * Toolbar Component
 *
 * Floating toolbar for canvas tool selection.
 * Displays available tools with icons and handles tool switching.
 */

import { MousePointer2, Square, Circle as CircleIcon, Type, Minus, HelpCircle } from 'lucide-react';
import { useToolStore } from '@/stores';
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

  /**
   * Handle tool button click
   */
  function handleToolClick(toolId: ToolType) {
    setActiveTool(toolId);
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
