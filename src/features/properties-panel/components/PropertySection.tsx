/**
 * Property Section Component
 *
 * A collapsible section wrapper for property groups with:
 * - Smooth expand/collapse animation
 * - Optional icon
 * - Persistent collapsed state (localStorage)
 * - Accessibility support
 */

import { useState, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PropertySectionProps {
  /** Section title */
  title: string;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Default open state (default: true) */
  defaultOpen?: boolean;
  /** Children to render inside the section */
  children: ReactNode;
  /** LocalStorage key for persisting collapsed state */
  storageKey?: string;
}

/**
 * PropertySection Component
 *
 * A collapsible section for grouping related properties in the properties panel.
 * Automatically persists its open/closed state to localStorage if storageKey is provided.
 *
 * @example
 * ```tsx
 * <PropertySection title="Position" icon={<Move />} storageKey="props-position">
 *   <PositionControls />
 * </PropertySection>
 * ```
 */
export function PropertySection({
  title,
  icon,
  defaultOpen = true,
  children,
  storageKey,
}: PropertySectionProps) {
  // Initialize state from localStorage or default
  const [isOpen, setIsOpen] = useState(() => {
    if (!storageKey) return defaultOpen;

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  // Save state to localStorage when it changes
  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(isOpen));
      } catch {
        // Silently fail if localStorage is not available
      }
    }
  }, [isOpen, storageKey]);

  /**
   * Toggle section open/closed
   */
  function handleToggle() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="border-b border-gray-200">
      {/* Header Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2',
          'hover:bg-gray-50 active:bg-gray-100',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
        )}
        aria-expanded={isOpen}
        aria-controls={storageKey ? `${storageKey}-content` : undefined}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>

        {/* Chevron indicator */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div
          id={storageKey ? `${storageKey}-content` : undefined}
          className="px-3 py-3 space-y-3 bg-white"
        >
          {children}
        </div>
      )}
    </div>
  );
}
