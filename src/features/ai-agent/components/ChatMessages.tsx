/**
 * ChatMessages Component
 *
 * Scrollable list of chat messages from command history.
 * Shows recent messages by default, with option to show all.
 * Auto-scrolls to bottom when new messages arrive.
 */

import { useEffect, useRef } from 'react';
import { useAIStore } from '@/stores';
import { ChatMessage } from './ChatMessage';
import { ChevronDown, Sparkles } from 'lucide-react';

/**
 * Chat messages list component
 * @returns {JSX.Element} Message list
 */
export function ChatMessages() {
  const { commandHistory, showFullHistory, toggleFullHistory } = useAIStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandHistory.length]);

  // Show last 5 messages if not showing full history
  const visibleMessages = showFullHistory
    ? commandHistory
    : commandHistory.slice(0, 5);

  const hasMoreMessages = commandHistory.length > 5 && !showFullHistory;

  return (
    <div
      className="h-full overflow-y-auto p-3 space-y-3"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {/* Empty State */}
      {commandHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <Sparkles className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No messages yet</p>
          <p className="text-xs mt-1">
            Type a command below to get started
          </p>
        </div>
      ) : (
        <>
          {/* Show All Button */}
          {hasMoreMessages && (
            <button
              onClick={toggleFullHistory}
              className="w-full py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
              aria-label={`Show ${commandHistory.length - 5} older messages`}
            >
              <ChevronDown className="w-3 h-3" />
              Show {commandHistory.length - 5} older messages
            </button>
          )}

          {/* Message List (newest first) */}
          {visibleMessages.map((cmd) => (
            <ChatMessage key={cmd.id} command={cmd} />
          ))}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
