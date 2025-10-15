/**
 * ChatPanel Component
 *
 * Expanded chat panel UI showing messages and input.
 * Includes header with close button, message list, and input field.
 * Supports ESC key to close panel.
 */

import { useEffect } from 'react';
import { useAIStore } from '@/stores';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

/**
 * Expanded chat panel component
 * @returns {JSX.Element} Expanded panel UI
 */
export function ChatPanel() {
  const { toggleChatPanel } = useAIStore();

  /**
   * Handle ESC key to close panel
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleChatPanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [toggleChatPanel]);

  return (
    <div
      className={cn(
        'w-96 h-[32rem] bg-white rounded-lg shadow-2xl',
        'border border-gray-200 flex flex-col',
        'animate-in slide-in-from-bottom-4 fade-in duration-200'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800">AI Assistant</h3>
        </div>
        <button
          onClick={toggleChatPanel}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Close (⌘K)"
          aria-label="Close AI chat"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200">
        <ChatInput />
      </div>
    </div>
  );
}
