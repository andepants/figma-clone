/**
 * UI Store
 *
 * Zustand store for managing UI state including sidebar visibility and hover state.
 * Persists sidebar preferences to localStorage for consistent user experience.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI store state interface
 * @interface UIState
 * @property {boolean} leftSidebarOpen - Whether left sidebar is open
 * @property {boolean} rightSidebarOpen - Whether right sidebar is open
 * @property {string | null} hoveredObjectId - ID of currently hovered object for bidirectional sync
 * @property {boolean} layersSectionCollapsed - Whether layers section is collapsed
 * @property {boolean} pagesSectionCollapsed - Whether pages section is collapsed (future use)
 * @property {number} aiPanelHeight - AI panel height as percentage (0-100) of sidebar
 * @property {boolean} isAIChatCollapsed - Whether AI chat panel is collapsed
 * @property {number} rightSidebarWidth - Right sidebar width in pixels (240-480, default 240)
 * @property {boolean} isResizingRightSidebar - Whether user is actively resizing right sidebar
 * @property {Set<string>} processingImages - Set of image IDs currently being processed (background removal, etc.)
 */
interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  hoveredObjectId: string | null;
  layersSectionCollapsed: boolean;
  pagesSectionCollapsed: boolean;
  aiPanelHeight: number;
  isAIChatCollapsed: boolean;
  isResizingAIPanel: boolean;
  rightSidebarWidth: number;
  isResizingRightSidebar: boolean;
  processingImages: Set<string>;
}

/**
 * UI store actions interface
 * @interface UIActions
 */
interface UIActions {
  /**
   * Toggle left sidebar visibility
   */
  toggleLeftSidebar: () => void;

  /**
   * Toggle right sidebar visibility
   */
  toggleRightSidebar: () => void;

  /**
   * Set left sidebar open state
   * @param {boolean} isOpen - Whether sidebar should be open
   */
  setLeftSidebarOpen: (isOpen: boolean) => void;

  /**
   * Set right sidebar open state
   * @param {boolean} isOpen - Whether sidebar should be open
   */
  setRightSidebarOpen: (isOpen: boolean) => void;

  /**
   * Set hovered object ID for bidirectional sync between sidebar and canvas
   * @param {string | null} id - Object ID being hovered, or null if none
   */
  setHoveredObject: (id: string | null) => void;

  /**
   * Toggle layers section collapsed state
   */
  toggleLayersSection: () => void;

  /**
   * Toggle pages section collapsed state (future use)
   */
  togglePagesSection: () => void;

  /**
   * Set AI panel height as percentage of sidebar
   * @param {number} height - Height percentage (0-100), will be clamped to valid range
   */
  setAIPanelHeight: (height: number) => void;

  /**
   * Toggle AI chat panel collapsed state
   */
  toggleAIChatCollapse: () => void;

  /**
   * Set AI panel resizing state (used to disable transitions during drag)
   * @param {boolean} isResizing - Whether user is actively resizing the panel
   */
  setIsResizingAIPanel: (isResizing: boolean) => void;

  /**
   * Set right sidebar width in pixels
   * @param {number} width - Width in pixels (240-480), will be clamped to valid range
   */
  setRightSidebarWidth: (width: number) => void;

  /**
   * Set right sidebar resizing state (used to disable transitions during drag)
   * @param {boolean} isResizing - Whether user is actively resizing the sidebar
   */
  setIsResizingRightSidebar: (isResizing: boolean) => void;

  /**
   * Add image ID to processing set (e.g., background removal in progress)
   * @param {string} id - Image object ID
   */
  addProcessingImage: (id: string) => void;

  /**
   * Remove image ID from processing set (processing complete or failed)
   * @param {string} id - Image object ID
   */
  removeProcessingImage: (id: string) => void;
}

/**
 * UI store type combining state and actions
 */
type UIStore = UIState & UIActions;

/**
 * UI store hook
 * Provides access to UI state and actions with localStorage persistence
 * @returns {UIStore} UI store instance
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      hoveredObjectId: null,
      layersSectionCollapsed: false,
      pagesSectionCollapsed: false,
      aiPanelHeight: 40,
      isAIChatCollapsed: false,
      isResizingAIPanel: false,
      rightSidebarWidth: 240,
      isResizingRightSidebar: false,
      processingImages: new Set<string>(),

      // Actions
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),

      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

      setLeftSidebarOpen: (isOpen) => set({ leftSidebarOpen: isOpen }),

      setRightSidebarOpen: (isOpen) => set({ rightSidebarOpen: isOpen }),

      setHoveredObject: (id) => set({ hoveredObjectId: id }),

      toggleLayersSection: () =>
        set((state) => ({ layersSectionCollapsed: !state.layersSectionCollapsed })),

      togglePagesSection: () =>
        set((state) => ({ pagesSectionCollapsed: !state.pagesSectionCollapsed })),

      setAIPanelHeight: (height) => {
        // Clamp between 0 and 100
        const clampedHeight = Math.min(100, Math.max(0, height));
        set({ aiPanelHeight: clampedHeight });
      },

      toggleAIChatCollapse: () =>
        set((state) => ({ isAIChatCollapsed: !state.isAIChatCollapsed })),

      setIsResizingAIPanel: (isResizing) => set({ isResizingAIPanel: isResizing }),

      setRightSidebarWidth: (width) => {
        // Clamp between 240 and 480 pixels
        const clampedWidth = Math.min(480, Math.max(240, width));
        set({ rightSidebarWidth: clampedWidth });
      },

      setIsResizingRightSidebar: (isResizing) => set({ isResizingRightSidebar: isResizing }),

      addProcessingImage: (id) => {
        const newSet = new Set(get().processingImages);
        newSet.add(id);
        set({ processingImages: newSet });
      },

      removeProcessingImage: (id) => {
        const newSet = new Set(get().processingImages);
        newSet.delete(id);
        set({ processingImages: newSet });
      },
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        layersSectionCollapsed: state.layersSectionCollapsed,
        pagesSectionCollapsed: state.pagesSectionCollapsed,
        aiPanelHeight: state.aiPanelHeight,
        isAIChatCollapsed: state.isAIChatCollapsed,
        rightSidebarWidth: state.rightSidebarWidth,
      }),
    }
  )
);
