/**
 * AIInput Component
 *
 * Input panel for AI canvas agent commands. Displays at bottom center of canvas
 * with loading states and submit functionality.
 */

import { useState } from 'react';
import { useAIStore } from '@/stores';
import { useAIAgent } from '../hooks/useAIAgent';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AI input panel component
 * Allows users to enter natural language commands for the AI canvas agent
 * @returns {JSX.Element} AI input panel
 */
export function AIInput() {
  const [input, setInput] = useState('');
  const { isInputVisible } = useAIStore();
  const { sendCommand, isProcessing, error, clearError } = useAIAgent();

  /**
   * Handle form submission
   * Sends command to AI agent via hook
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    clearError(); // Clear any previous errors
    await sendCommand(input);
    setInput(''); // Clear input on successful submission
  };

  // Only render if visible
  if (!isInputVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <form onSubmit={handleSubmit} className="relative space-y-2">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Field */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
          {/* AI Icon */}
          <Sparkles className="w-5 h-5 text-blue-500 ml-2 flex-shrink-0" />

          {/* Input Field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to create... (e.g., 'Create a red square at 100, 100')"
            disabled={isProcessing}
            className={cn(
              'flex-1 px-2 py-2 text-sm outline-none',
              'placeholder:text-gray-400',
              'disabled:bg-gray-50 disabled:text-gray-500'
            )}
            autoFocus
          />

          {/* Loading Spinner */}
          {isProcessing && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded transition-colors',
              'bg-blue-500 text-white hover:bg-blue-600',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500',
              'flex-shrink-0'
            )}
          >
            Generate
          </button>
        </div>
      </form>
    </div>
  );
}
