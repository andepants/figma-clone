/**
 * Keyboard Shortcuts Reference
 *
 * Centralized list of all keyboard shortcuts in the application.
 * Used for the shortcuts help modal and documentation.
 */

export interface KeyboardShortcut {
  key: string;
  action: string;
  category: 'Tools' | 'Edit' | 'Canvas' | 'View' | 'Help';
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
  { key: 'Cmd/Ctrl+C', action: 'Copy selected', category: 'Edit' },
  { key: 'Cmd/Ctrl+V', action: 'Paste', category: 'Edit' },
  { key: 'Del / Backspace', action: 'Delete selected', category: 'Edit' },
  { key: 'Shift+Cmd/Ctrl+L', action: 'Lock/unlock selected', category: 'Edit' },
  { key: 'Esc', action: 'Deselect', category: 'Edit' },

  // Canvas Navigation
  { key: 'Space+Drag', action: 'Pan canvas', category: 'Canvas' },
  { key: 'Arrow Keys', action: 'Pan canvas (when nothing selected)', category: 'Canvas' },
  { key: 'Shift+Arrow Keys', action: 'Pan canvas faster', category: 'Canvas' },
  { key: 'Mouse Wheel', action: 'Zoom in/out', category: 'Canvas' },
  { key: 'Cmd/Ctrl+0', action: 'Reset zoom to 100%', category: 'Canvas' },
  { key: 'Cmd/Ctrl+1', action: 'Fit all objects in view', category: 'Canvas' },
  { key: 'Cmd/Ctrl+2', action: 'Zoom to selection', category: 'Canvas' },

  // View
  { key: 'Shift+Cmd/Ctrl+\\', action: 'Toggle left sidebar', category: 'View' },
  { key: 'Cmd/Ctrl+K', action: 'Toggle AI chat', category: 'View' },

  // Help
  { key: '?', action: 'Show shortcuts', category: 'Help' },
];
