/**
 * ChatInput Component
 *
 * Input field for AI commands with submit button and autocomplete support.
 * Detects "/" commands and shows suggestions with keyboard navigation.
 * Integrated with useAIAgent hook for command processing.
 *
 * Keyboard shortcuts:
 * - /: Trigger autocomplete
 * - ArrowDown: Navigate to next suggestion
 * - ArrowUp: Navigate to previous suggestion
 * - Tab: Complete selected suggestion
 * - Enter: Submit (without Shift) or newline (with Shift)
 * - Escape: Close autocomplete
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAIAgent } from '../hooks/useAIAgent';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCommandSuggestions,
  parseCommand,
  hasCommandPrefix
} from '../utils/commandParser';
import { CommandAutocomplete } from './CommandAutocomplete';

/**
 * Chat input field component
 * @returns {JSX.Element} Input field with submit button and autocomplete
 */
export function ChatInput() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof getCommandSuggestions>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendCommand, isProcessing } = useAIAgent();

  /**
   * Update suggestions whenever input changes
   *
   * Resets selectedIndex to 0 when suggestions change to always
   * highlight first suggestion.
   */
  useEffect(() => {
    const newSuggestions = getCommandSuggestions(input);
    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [input]);

  /**
   * Handle keyboard navigation and submission
   *
   * Intercepts:
   * - ArrowDown: Next suggestion
   * - ArrowUp: Previous suggestion
   * - Tab: Complete selected suggestion
   * - Enter: Submit (unless Shift held)
   * - Escape: Close autocomplete
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const hasSuggestions = suggestions.length > 0;

    // Handle autocomplete navigation
    if (hasSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor movement
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault(); // Prevent focus loss
        const selected = suggestions[selectedIndex];
        setInput(selected.command + ' ');
        setSuggestions([]);

        // Focus textarea after completion
        textareaRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        setSelectedIndex(0);
        return;
      }
    }

    // Handle submission (Enter without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions, selectedIndex]);

  /**
   * Handle suggestion click selection
   *
   * Completes the command and appends a space so user can
   * immediately start typing description.
   */
  const handleSelectSuggestion = useCallback((command: string) => {
    setInput(command + ' ');
    setSuggestions([]);
    setSelectedIndex(0);

    // Focus textarea after selection
    textareaRef.current?.focus();
  }, []);

  /**
   * Handle form submission
   *
   * Validates input, sends command, and resets form.
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isProcessing) {
      return;
    }

    // Check if this is a command
    if (hasCommandPrefix(trimmed)) {
      const parsed = parseCommand(trimmed);

      if (!parsed) {
        // Invalid command, show error in console for now
        console.error('Invalid command format. Usage: /command description');
        return;
      }

      // Send the full command with description
      await sendCommand(`${parsed.command} ${parsed.description}`);
    } else {
      // Regular message
      await sendCommand(trimmed);
    }

    // Reset form
    setInput('');
    setSuggestions([]);
    setSelectedIndex(0);
  }, [input, isProcessing, sendCommand]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="p-3 relative" aria-label="AI command input form">
      {/* Autocomplete dropdown */}
      <CommandAutocomplete
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        onSelect={handleSelectSuggestion}
      />

      <div className="flex items-end gap-2">
        {/* Input Field */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type / for commands, or describe what you want to create..."
          disabled={isProcessing}
          rows={2}
          className={cn(
            'flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg',
            'resize-none outline-none focus:ring-2 focus:ring-blue-500',
            'placeholder:text-gray-400',
            'disabled:bg-gray-50 disabled:text-gray-500'
          )}
          aria-label="AI command input"
          aria-describedby={suggestions.length > 0 ? 'command-suggestions' : undefined}
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

      {/* Hidden ARIA live region for announcements */}
      {suggestions.length > 0 && (
        <div
          id="command-suggestions"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {suggestions.length} command{suggestions.length === 1 ? '' : 's'} available
        </div>
      )}
    </form>
  );
}
