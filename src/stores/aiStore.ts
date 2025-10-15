/**
 * AI Store
 *
 * Zustand store for managing AI agent state including command processing,
 * command history, loading states, and error handling.
 */

import { create } from 'zustand';

/**
 * AI command entry in history
 * @interface AICommand
 * @property {string} id - Unique command ID
 * @property {string} command - User's natural language command
 * @property {number} timestamp - When command was issued (ms since epoch)
 * @property {'pending' | 'success' | 'error'} status - Current status of command
 * @property {string} [response] - Success message from AI
 * @property {string} [error] - Error message if command failed
 */
export interface AICommand {
  id: string;
  command: string;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  response?: string;
  error?: string;
}

/**
 * AI store state interface
 * @interface AIState
 * @property {boolean} isProcessing - Whether AI is currently processing a command
 * @property {string | null} currentCommand - Currently processing command text
 * @property {AICommand[]} commandHistory - History of commands (max 50, newest first)
 * @property {string | null} error - Current error message
 * @property {boolean} isInputVisible - Whether AI input panel is visible (deprecated, use isChatPanelOpen)
 * @property {boolean} isChatPanelOpen - Whether AI chat panel is open
 * @property {boolean} showFullHistory - Whether to show all history or just recent messages
 */
interface AIState {
  isProcessing: boolean;
  currentCommand: string | null;
  commandHistory: AICommand[];
  error: string | null;
  isInputVisible: boolean; // Deprecated: kept for backwards compatibility during migration
  isChatPanelOpen: boolean;
  showFullHistory: boolean;
}

/**
 * AI store actions interface
 * @interface AIActions
 */
interface AIActions {
  /**
   * Set processing state
   * @param {boolean} processing - Whether AI is processing
   */
  setProcessing: (processing: boolean) => void;

  /**
   * Set current command being processed
   * @param {string | null} command - Command text or null
   */
  setCurrentCommand: (command: string | null) => void;

  /**
   * Add command to history
   * Limits history to last 50 commands for performance
   * @param {AICommand} command - Command to add
   */
  addCommand: (command: AICommand) => void;

  /**
   * Update existing command in history
   * @param {string} id - Command ID to update
   * @param {Partial<AICommand>} updates - Fields to update
   */
  updateCommand: (id: string, updates: Partial<AICommand>) => void;

  /**
   * Set error message
   * @param {string | null} error - Error message or null to clear
   */
  setError: (error: string | null) => void;

  /**
   * Clear error message
   */
  clearError: () => void;

  /**
   * Clear command history
   */
  clearHistory: () => void;

  /**
   * Toggle AI input panel visibility (deprecated, use toggleChatPanel)
   */
  toggleInputVisibility: () => void;

  /**
   * Set AI input panel visibility (deprecated, use setChatPanelOpen)
   * @param {boolean} visible - Whether panel should be visible
   */
  setInputVisibility: (visible: boolean) => void;

  /**
   * Toggle AI chat panel open/closed state
   */
  toggleChatPanel: () => void;

  /**
   * Set AI chat panel open state
   * @param {boolean} open - Whether chat panel should be open
   */
  setChatPanelOpen: (open: boolean) => void;

  /**
   * Toggle full history view (show all vs recent messages)
   */
  toggleFullHistory: () => void;

  /**
   * Set full history view state
   * @param {boolean} show - Whether to show all history
   */
  setShowFullHistory: (show: boolean) => void;
}

/**
 * AI store type combining state and actions
 */
type AIStore = AIState & AIActions;

/**
 * AI store hook
 * Provides access to AI agent state and actions
 * @returns {AIStore} AI store instance
 */
export const useAIStore = create<AIStore>((set) => ({
  // Initial state
  isProcessing: false,
  currentCommand: null,
  commandHistory: [],
  error: null,
  isInputVisible: false, // Deprecated: kept for backwards compatibility
  isChatPanelOpen: false,
  showFullHistory: false,

  // Actions
  setProcessing: (processing) =>
    set({ isProcessing: processing }),

  setCurrentCommand: (command) =>
    set({ currentCommand: command }),

  addCommand: (command) =>
    set((state) => ({
      commandHistory: [command, ...state.commandHistory].slice(0, 50), // Keep last 50
    })),

  updateCommand: (id, updates) =>
    set((state) => ({
      commandHistory: state.commandHistory.map((cmd) =>
        cmd.id === id ? { ...cmd, ...updates } : cmd
      ),
    })),

  setError: (error) =>
    set({ error }),

  clearError: () =>
    set({ error: null }),

  clearHistory: () =>
    set({ commandHistory: [] }),

  toggleInputVisibility: () =>
    set((state) => ({
      isInputVisible: !state.isInputVisible,
      isChatPanelOpen: !state.isInputVisible // Sync with new state during migration
    })),

  setInputVisibility: (visible) =>
    set({
      isInputVisible: visible,
      isChatPanelOpen: visible // Sync with new state during migration
    }),

  toggleChatPanel: () =>
    set((state) => ({
      isChatPanelOpen: !state.isChatPanelOpen,
      isInputVisible: !state.isChatPanelOpen // Sync with old state during migration
    })),

  setChatPanelOpen: (open) =>
    set({
      isChatPanelOpen: open,
      isInputVisible: open // Sync with old state during migration
    }),

  toggleFullHistory: () =>
    set((state) => ({ showFullHistory: !state.showFullHistory })),

  setShowFullHistory: (show) =>
    set({ showFullHistory: show }),
}));
