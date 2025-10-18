/**
 * RightSidebar Component
 *
 * Unified right sidebar containing properties panel and AI chat.
 * Supports resizable split between sections.
 * ChatInput is absolutely positioned at bottom and never moves.
 */

import { useUIStore } from '@/stores';
import { PropertiesPanel } from '@/features/properties-panel';
import { ResizeHandle } from './ResizeHandle';
import { AISection } from './AISection';
import { ChatInput } from '@/features/ai-agent/components/ChatInput';
import { SidebarWidthResizeHandle } from './SidebarWidthResizeHandle';

// Fixed heights for consistent layout
const CHAT_INPUT_HEIGHT = 90; // Input area height (padding + textarea + button)
const AI_HEADER_HEIGHT = 40;  // AI section header height

export interface RightSidebarProps {
  onExport: () => void;
  hasObjects: boolean;
  hasSelection: boolean;
  projectId?: string;
}

/**
 * RightSidebar Component
 *
 * Container for properties panel and AI chat with resizable split.
 * Width: Resizable (240px min, 480px max, default 240px)
 * Layout: Flexbox with dynamic height allocation
 *
 * ChatInput is absolutely positioned at bottom (never moves):
 * - Fixed height: 90px
 * - Always visible at bottom of sidebar
 * - Has subtle box-shadow for depth separation
 *
 * When AI chat is collapsed:
 * - AI section shows only header (40px)
 * - Header sits directly above fixed input
 * - Properties panel expands to fill remaining space
 * - Resize handle is hidden
 * - Smooth max-height animation on messages area
 *
 * @param {RightSidebarProps} props - Component props
 * @param {Function} props.onExport - Export handler function
 * @param {boolean} props.hasObjects - Whether canvas has objects to export
 * @param {boolean} props.hasSelection - Whether user has objects selected
 * @param {string} [props.projectId] - Current project ID (optional, used to block AI features in playground)
 * @returns {JSX.Element} Right sidebar container
 */
export function RightSidebar({ onExport, hasObjects, hasSelection, projectId }: RightSidebarProps) {
  const { aiPanelHeight, isAIChatCollapsed, isResizingAIPanel, rightSidebarWidth } = useUIStore();

  return (
    <div
      className="fixed right-0 top-0 bottom-0 bg-white border-l border-gray-200 flex flex-col"
      data-sidebar
      style={{
        paddingBottom: `${CHAT_INPUT_HEIGHT}px`,
        width: `${rightSidebarWidth}px`
      }}
    >
      {/* Width Resize Handle - on left edge for horizontal resizing */}
      <SidebarWidthResizeHandle />

      {/* Properties Section - animates when collapsing, instant during resize drag */}
      <div
        className={`overflow-y-auto flex-1 ${
          isResizingAIPanel ? '' : 'transition-all duration-300 ease-out'
        }`}
        style={{
          maxHeight: isAIChatCollapsed
            ? `calc(100% - ${AI_HEADER_HEIGHT}px)`
            : `${100 - aiPanelHeight}%`,
          willChange: isResizingAIPanel ? 'max-height' : 'auto',
        }}
      >
        <PropertiesPanel onExport={onExport} hasObjects={hasObjects} hasSelection={hasSelection} />
      </div>

      {/* Resize Handle - hidden when AI chat is collapsed */}
      {!isAIChatCollapsed && <ResizeHandle />}

      {/* AI Chat Section (header + messages) - positioned above fixed input */}
      <div
        className="flex-shrink-0 overflow-hidden border-t border-gray-200"
        style={{
          height: isAIChatCollapsed ? `${AI_HEADER_HEIGHT}px` : `${aiPanelHeight}%`,
        }}
      >
        <AISection />
      </div>

      {/* Chat Input - absolutely positioned at bottom, never moves */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
        style={{
          height: `${CHAT_INPUT_HEIGHT}px`,
          zIndex: 10,
        }}
      >
        <ChatInput projectId={projectId} />
      </div>
    </div>
  );
}
