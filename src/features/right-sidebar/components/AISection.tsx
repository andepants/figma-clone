/**
 * AISection Component
 *
 * AI chat section in right sidebar.
 * Shows header, messages, and input. Supports collapse to input-only.
 */

import { useUIStore } from '@/stores/uiStore';
import { useAIStore } from '@/stores/aiStore';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { ChatMessages } from '@/features/ai-agent/components/ChatMessages';
import { ChatInput } from '@/features/ai-agent/components/ChatInput';
import { cn } from '@/lib/utils';

/**
 * AISection Component
 *
 * AI chat section integrated into right sidebar.
 * - Header with AI icon and collapse button
 * - Messages area (collapsible)
 * - Input area (always visible)
 *
 * @returns {JSX.Element} AI section UI
 */
export function AISection() {
  const { isAIChatCollapsed, toggleAIChatCollapse } = useUIStore();
  const { commandHistory } = useAIStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header with collapse button */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
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

      {/* Messages - only show when expanded */}
      <div
        className={cn(
          "overflow-y-auto transition-all duration-150 ease-out",
          isAIChatCollapsed ? "h-0 opacity-0" : "flex-1 opacity-100"
        )}
      >
        <ChatMessages />
      </div>

      {/* Input - always visible */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <ChatInput />
      </div>
    </div>
  );
}
