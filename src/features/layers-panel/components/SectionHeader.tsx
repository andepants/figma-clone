/**
 * Section Header Component
 *
 * Collapsible section header for layers panel sections (Layers, Pages, etc.)
 * Matches Figma's section header UX with arrow toggle and item count.
 *
 * Features:
 * - Collapsible with animated chevron arrow (rotates -90° when collapsed)
 * - Shows optional item count on right side
 * - Uppercase title with tracking for visual consistency
 * - Hover state for better UX feedback
 * - 8px height with bottom border
 *
 * @component
 */

import { ChevronDown } from 'lucide-react';
import { memo } from 'react';

interface SectionHeaderProps {
  /** Section title (e.g., "Layers", "Pages") - will be uppercased */
  title: string;
  /** Whether section is collapsed */
  isCollapsed: boolean;
  /** Callback when toggle clicked */
  onToggle: () => void;
  /** Optional number of items in section */
  count?: number;
}

/**
 * Section Header Component
 *
 * Collapsible section header for layers panel sections (Layers, Pages, etc.)
 * Matches Figma's section header UX with arrow toggle and item count.
 *
 * @param title - Section title (e.g., "Layers", "Pages")
 * @param isCollapsed - Whether section is collapsed
 * @param onToggle - Callback when toggle clicked
 * @param count - Optional number of items in section
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Layers"
 *   isCollapsed={false}
 *   onToggle={() => setCollapsed(!collapsed)}
 *   count={5}
 * />
 * ```
 */
export const SectionHeader = memo(function SectionHeader({
  title,
  isCollapsed,
  onToggle,
  count,
}: SectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full h-8 px-2 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-200"
      aria-expanded={!isCollapsed}
      aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title} section`}
    >
      {/* Toggle arrow */}
      <ChevronDown
        className={`
          w-3.5 h-3.5 text-gray-600 transition-transform duration-150
          ${isCollapsed ? '-rotate-90' : 'rotate-0'}
        `}
        aria-hidden="true"
      />

      {/* Section title */}
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </span>

      {/* Item count (optional) */}
      {count !== undefined && (
        <span className="text-xs text-gray-400 ml-auto" aria-label={`${count} items`}>
          {count}
        </span>
      )}
    </button>
  );
});
