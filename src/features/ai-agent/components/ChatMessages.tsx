/**
 * ChatMessages Component
 *
 * Scrollable list of all chat messages from command history.
 * Auto-scrolls to bottom when new messages arrive.
 */

import { useEffect, useRef } from 'react';
import { useAIStore } from '@/stores';
import { ChatMessage } from './ChatMessage';
import { Sparkles } from 'lucide-react';

/**
 * Chat messages list component
 * @returns {JSX.Element} Message list
 */
export function ChatMessages() {
  const { commandHistory } = useAIStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandHistory.length]);

  // Show all messages (oldest to newest)
  const visibleMessages = [...commandHistory].reverse();

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
          {/* Message List (oldest to newest) */}
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
