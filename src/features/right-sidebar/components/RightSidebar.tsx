/**
 * RightSidebar Component
 *
 * Unified right sidebar containing properties panel and AI chat.
 * Supports resizable split between sections.
 */

import { useUIStore } from '@/stores';
import { PropertiesPanel } from '@/features/properties-panel';
import { ResizeHandle } from './ResizeHandle';
import { AISection } from './AISection';

/**
 * RightSidebar Component
 *
 * Container for properties panel and AI chat with resizable split.
 * Width: 240px (matches current properties panel)
 * Layout: Flexbox with dynamic height allocation
 *
 * @returns {JSX.Element} Right sidebar container
 */
export function RightSidebar() {
  const { aiPanelHeight } = useUIStore();

  return (
    <div
      className="fixed right-0 top-0 bottom-0 w-[240px] bg-white border-l border-gray-200 flex flex-col"
      data-sidebar
    >
      {/* Properties Section - grows/shrinks based on AI panel height */}
      <div
        className="flex-shrink-0 overflow-y-auto transition-all duration-150 ease-out"
        style={{ height: `${100 - aiPanelHeight}%` }}
      >
        <PropertiesPanel />
      </div>

      {/* Resize Handle */}
      <ResizeHandle />

      {/* AI Chat Section - grows/shrinks based on height state */}
      <div
        className="flex-shrink-0 overflow-hidden border-t border-gray-200 transition-all duration-150 ease-out"
        style={{ height: `${aiPanelHeight}%` }}
      >
        <AISection />
      </div>
    </div>
  );
}
