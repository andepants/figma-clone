/**
 * Keyboard Shortcuts Reference
 *
 * Centralized list of all keyboard shortcuts in the application.
 * Used for the shortcuts help modal and documentation.
 */

export interface KeyboardShortcut {
  key: string;
  action: string;
  category: 'Tools' | 'Edit' | 'Canvas' | 'Help';
  disabled?: boolean;
}

/**
 * All keyboard shortcuts available in the application
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Tools
  { key: 'V', action: 'Move tool', category: 'Tools' },
  { key: 'R', action: 'Rectangle tool', category: 'Tools' },
  { key: 'C', action: 'Circle tool', category: 'Tools' },
  { key: 'L', action: 'Line tool', category: 'Tools' },
  { key: 'T', action: 'Text tool', category: 'Tools' },

  // Edit Operations
  { key: 'Cmd/Ctrl+D', action: 'Duplicate selected', category: 'Edit' },
  { key: 'Del / Backspace', action: 'Delete selected', category: 'Edit' },
  { key: 'Shift+Cmd/Ctrl+L', action: 'Lock/unlock selected', category: 'Edit' },
  { key: 'Esc', action: 'Deselect', category: 'Edit' },

  // Canvas Navigation
  { key: 'Space+Drag', action: 'Pan canvas', category: 'Canvas' },
  { key: 'Mouse Wheel', action: 'Zoom in/out', category: 'Canvas' },

  // Help
  { key: '?', action: 'Show shortcuts', category: 'Help' },
];
