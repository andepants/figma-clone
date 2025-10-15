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
 */
interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  hoveredObjectId: string | null;
  layersSectionCollapsed: boolean;
  pagesSectionCollapsed: boolean;
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
    (set) => ({
      // Initial state
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      hoveredObjectId: null,
      layersSectionCollapsed: false,
      pagesSectionCollapsed: false,

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
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        layersSectionCollapsed: state.layersSectionCollapsed,
        pagesSectionCollapsed: state.pagesSectionCollapsed,
      }),
    }
  )
);
