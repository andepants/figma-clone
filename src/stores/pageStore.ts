/**
 * Page Store
 *
 * Zustand store for managing page settings (background, opacity, exports).
 * Used in the default right panel layout when no shape is selected.
 */

import { create } from 'zustand';
import type { PageSettings } from '@/types/page.types';

/**
 * Page store state
 */
interface PageState {
  /** Current page settings */
  pageSettings: PageSettings;
}

/**
 * Page store actions
 */
interface PageActions {
  /**
   * Set the page background color
   * @param color - Hex color string (e.g., '#FFFFFF')
   */
  setBackgroundColor: (color: string) => void;

  /**
   * Set the page opacity
   * @param opacity - Opacity percentage (0-100)
   */
  setOpacity: (opacity: number) => void;

  /**
   * Set whether to show page background in exports
   * @param show - Whether to include background in exports
   */
  setShowInExports: (show: boolean) => void;

  /**
   * Update multiple page settings at once
   * @param updates - Partial page settings to update
   */
  updatePageSettings: (updates: Partial<PageSettings>) => void;
}

/**
 * Combined page store type
 */
type PageStore = PageState & PageActions;

/**
 * Page store hook
 *
 * Provides access to page settings state and actions.
 *
 * @example
 * ```tsx
 * const { pageSettings, setBackgroundColor } = usePageStore();
 * setBackgroundColor('#1E1E1E');
 * ```
 */
export const usePageStore = create<PageStore>((set) => ({
  // State
  pageSettings: {
    backgroundColor: '#FFFFFF',
    opacity: 100,
    showInExports: true,
  },

  // Actions
  setBackgroundColor: (color) =>
    set((state) => ({
      pageSettings: { ...state.pageSettings, backgroundColor: color },
    })),

  setOpacity: (opacity) =>
    set((state) => ({
      pageSettings: {
        ...state.pageSettings,
        // Clamp opacity to 0-100 range
        opacity: Math.max(0, Math.min(100, opacity)),
      },
    })),

  setShowInExports: (show) =>
    set((state) => ({
      pageSettings: { ...state.pageSettings, showInExports: show },
    })),

  updatePageSettings: (updates) =>
    set((state) => ({
      pageSettings: { ...state.pageSettings, ...updates },
    })),
}));
