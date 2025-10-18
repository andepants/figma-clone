/**
 * Command Autocomplete Component
 *
 * Displays autocomplete suggestions when user types "/" in AI input.
 * Supports both mouse and keyboard navigation. Positioned absolutely
 * above the input field.
 *
 * Follows Apple HIG for visual design and interaction patterns.
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/macos/menus/menu-anatomy/
 */

import { cn } from '@/lib/utils';
import type { AICommand } from '../utils/commandParser';
import { Lock } from 'lucide-react';

interface CommandAutocompleteProps {
  /** Array of command suggestions to display */
  suggestions: Array<AICommand & { disabled?: boolean; disabledReason?: string }>;
  /** Index of currently selected suggestion (for keyboard navigation) */
  selectedIndex: number;
  /** Callback when suggestion is clicked or selected */
  onSelect: (command: string) => void;
  /** Optional className for positioning/styling */
  className?: string;
}

/**
 * Command autocomplete dropdown
 *
 * Shows when user types "/" in AI input. Renders nothing if no suggestions.
 * Positioned absolutely above input with bottom-full.
 *
 * Keyboard navigation:
 * - ArrowUp/ArrowDown: Navigate suggestions
 * - Tab/Enter: Select highlighted suggestion
 * - Escape: Close (handled by parent)
 *
 * Accessibility:
 * - role="listbox" for dropdown
 * - role="option" for each suggestion
 * - aria-selected for keyboard selection
 * - aria-activedescendant on input (managed by parent)
 */
export function CommandAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
  className,
}: CommandAutocompleteProps) {
  // Don't render if no suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      role="listbox"
      className={cn(
        // Positioning
        'absolute bottom-full left-0 right-0 mb-2',
        // Visual style
        'bg-white border border-gray-200 rounded-lg shadow-lg',
        // Layout
        'overflow-hidden',
        // Animation
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {suggestions.map((suggestion, index) => {
        const isSelected = selectedIndex === index;
        const isDisabled = suggestion.disabled ?? false;

        return (
          <button
            key={suggestion.command}
            role="option"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(suggestion.command)}
            disabled={isDisabled}
            className={cn(
              // Layout
              'w-full px-3 py-2 text-left',
              // Spacing
              'space-y-0.5',
              // Transitions
              'transition-colors duration-150',
              // Disabled state
              isDisabled && 'cursor-not-allowed opacity-60',
              // Hover state (matches shadcn/ui command)
              !isDisabled && 'hover:bg-gray-50',
              // Selected state (keyboard navigation)
              isSelected && !isDisabled && 'bg-blue-50 hover:bg-blue-50',
              // Focus visible (for keyboard users)
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'
            )}
          >
            {/* Command name with lock icon if disabled */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'font-medium text-sm',
                  isDisabled
                    ? 'text-gray-400'
                    : isSelected
                    ? 'text-blue-900'
                    : 'text-gray-900'
                )}
              >
                {suggestion.command}
              </div>
              {isDisabled && (
                <Lock className="w-3 h-3 text-gray-400" />
              )}
            </div>

            {/* Description or disabled reason */}
            <div className={cn(
              'text-xs',
              isDisabled ? 'text-red-500' : 'text-gray-500'
            )}>
              {isDisabled && suggestion.disabledReason
                ? suggestion.disabledReason
                : suggestion.description}
            </div>

            {/* Example usage - only show if not disabled */}
            {!isDisabled && (
              <div className="text-xs text-gray-400 font-mono mt-1">
                {suggestion.example}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
