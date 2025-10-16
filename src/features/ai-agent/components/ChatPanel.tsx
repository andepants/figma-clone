/**
 * ChatPanel Component
 *
 * Chat panel UI showing messages and input.
 * Includes header with icon, message list, and input field.
 * Designed to be embedded in RightSidebar (always visible).
 */

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

/**
 * Chat panel component
 * @returns {JSX.Element} Chat panel UI
 */
export function ChatPanel() {
  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'border border-gray-200 bg-white'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-800">AI Assistant</h3>
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
