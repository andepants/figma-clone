/**
 * Tool Types
 *
 * Type definitions for canvas tools and toolbar functionality.
 * Defines available tools, their properties, and tool-related state.
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Available tool types in the application
 */
export type ToolType = 'move' | 'rectangle' | 'circle' | 'text' | 'line';

/**
 * Tool definition with metadata
 */
export interface Tool {
  /** Unique identifier matching ToolType */
  id: ToolType;
  /** Display name for the tool */
  name: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Keyboard shortcut key */
  shortcut: string;
}
