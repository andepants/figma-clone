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

interface CommandAutocompleteProps {
  /** Array of command suggestions to display */
  suggestions: AICommand[];
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

        return (
          <button
            key={suggestion.command}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(suggestion.command)}
            className={cn(
              // Layout
              'w-full px-3 py-2 text-left',
              // Spacing
              'space-y-0.5',
              // Transitions
              'transition-colors duration-150',
              // Hover state (matches shadcn/ui command)
              'hover:bg-gray-50',
              // Selected state (keyboard navigation)
              isSelected && 'bg-blue-50 hover:bg-blue-50',
              // Focus visible (for keyboard users)
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'
            )}
          >
            {/* Command name */}
            <div
              className={cn(
                'font-medium text-sm',
                isSelected ? 'text-blue-900' : 'text-gray-900'
              )}
            >
              {suggestion.command}
            </div>

            {/* Description */}
            <div className="text-xs text-gray-500">
              {suggestion.description}
            </div>

            {/* Example usage */}
            <div className="text-xs text-gray-400 font-mono mt-1">
              {suggestion.example}
            </div>
          </button>
        );
      })}
    </div>
  );
}
