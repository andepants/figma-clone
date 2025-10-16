/**
 * ChatInput Component
 *
 * Input field for AI commands with submit button.
 * Integrated with useAIAgent hook for command processing.
 */

import { useState } from 'react';
import { useAIAgent } from '../hooks/useAIAgent';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Chat input field component
 * @returns {JSX.Element} Input field with submit button
 */
export function ChatInput() {
  const [input, setInput] = useState('');
  const { sendCommand, isProcessing } = useAIAgent();

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    await sendCommand(input);
    setInput(''); // Clear input after sending
  };

  return (
    <form onSubmit={handleSubmit} className="p-3" aria-label="AI command input form">
      <div className="flex items-end gap-2">
        {/* Input Field */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Create a blue circle at 200, 200..."
          disabled={isProcessing}
          rows={2}
          className={cn(
            'flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg',
            'resize-none outline-none focus:ring-2 focus:ring-blue-500',
            'placeholder:text-gray-400',
            'disabled:bg-gray-50 disabled:text-gray-500'
          )}
          aria-label="AI command input"
          onKeyDown={(e) => {
            // Submit on Enter (without Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className={cn(
            'p-2 bg-blue-500 text-white rounded-lg',
            'hover:bg-blue-600 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center'
          )}
          title="Send (Enter)"
          aria-label={isProcessing ? 'Sending command' : 'Send command'}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
}
