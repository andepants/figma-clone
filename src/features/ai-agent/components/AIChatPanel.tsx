/**
 * AIChatPanel Component
 *
 * Bottom-right chat panel for AI canvas agent.
 * Collapsible interface with toggle button and expandable panel.
 */

import { useAIStore } from '@/stores';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatPanel } from './ChatPanel';

/**
 * AI chat panel component
 * Renders collapsed button or expanded panel based on state
 * @returns {JSX.Element} Chat panel UI
 */
export function AIChatPanel() {
  const { isChatPanelOpen, toggleChatPanel, commandHistory } = useAIStore();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Collapsed State: Toggle Button */}
      {!isChatPanelOpen ? (
        <button
          onClick={toggleChatPanel}
          className={cn(
            'p-3 bg-blue-500 text-white rounded-full shadow-lg',
            'hover:bg-blue-600 hover:shadow-xl transition-all',
            'flex items-center gap-2'
          )}
          title="AI Chat (⌘K)"
          aria-label="Open AI chat"
        >
          <Sparkles className="w-5 h-5" />
          {/* Badge showing unread/recent commands */}
          {commandHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {Math.min(commandHistory.length, 9)}
            </span>
          )}
        </button>
      ) : (
        /* Expanded State: Chat Panel */
        <ChatPanel />
      )}
    </div>
  );
}
