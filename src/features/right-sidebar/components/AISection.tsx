/**
 * AISection Component
 *
 * AI chat section in right sidebar.
 * Shows header and messages only. Input is separately positioned.
 * Supports collapse to header-only.
 */

import { useUIStore } from '@/stores/uiStore';
import { useAIStore } from '@/stores/aiStore';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { ChatMessages } from '@/features/ai-agent/components/ChatMessages';
import { cn } from '@/lib/utils';

// Fixed header height for consistent layout
const HEADER_HEIGHT = 40;

/**
 * AISection Component
 *
 * AI chat section integrated into right sidebar.
 * - Header with AI icon and collapse button (fixed height, no animation)
 * - Messages area (collapsible with smooth max-height animation)
 * - Input is rendered separately in RightSidebar as absolute positioned element
 *
 * @returns {JSX.Element} AI section UI
 */
export function AISection() {
  const { isAIChatCollapsed, toggleAIChatCollapse } = useUIStore();
  const { commandHistory } = useAIStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header with collapse button - fixed height, no animation */}
      <div
        className="flex-shrink-0 px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-white"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">AI Assistant</span>
          {/* Badge showing message count */}
          {commandHistory.length > 0 && (
            <span className="text-[10px] text-gray-500">
              ({commandHistory.length})
            </span>
          )}
        </div>
        <button
          onClick={toggleAIChatCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isAIChatCollapsed ? "Expand chat" : "Collapse chat"}
          aria-label={isAIChatCollapsed ? "Expand chat" : "Collapse chat"}
        >
          {isAIChatCollapsed ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Messages - smooth max-height animation, only visible when expanded */}
      <div
        className={cn(
          "overflow-y-auto transition-[max-height] duration-300 ease-out",
          isAIChatCollapsed && "overflow-hidden"
        )}
        style={{
          maxHeight: isAIChatCollapsed ? 0 : `calc(100% - ${HEADER_HEIGHT}px)`,
          willChange: isAIChatCollapsed ? 'auto' : 'max-height'
        }}
      >
        <ChatMessages />
      </div>
    </div>
  );
}
