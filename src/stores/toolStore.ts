/**
 * Tool Store
 *
 * Zustand store for managing the active tool state.
 * Tracks which tool is currently selected (select, rectangle, circle, text).
 */

import { create } from 'zustand';
import type { ToolType } from '@/types';

/**
 * Tool store state
 */
interface ToolState {
  /** Currently active tool */
  activeTool: ToolType;
}

/**
 * Tool store actions
 */
interface ToolActions {
  /**
   * Set the active tool
   * @param tool - The tool to activate
   */
  setActiveTool: (tool: ToolType) => void;
}

/**
 * Combined tool store type
 */
type ToolStore = ToolState & ToolActions;

/**
 * Tool store hook
 *
 * Provides access to the active tool state and actions.
 *
 * @example
 * ```tsx
 * const { activeTool, setActiveTool } = useToolStore();
 * setActiveTool('rectangle');
 * ```
 */
export const useToolStore = create<ToolStore>((set) => ({
  // State
  activeTool: 'move',

  // Actions
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
