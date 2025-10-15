/**
 * Hierarchy Arrow Component
 *
 * Dropdown arrow for collapsing/expanding children in layer hierarchy.
 * Shows right-facing arrow when collapsed, down-facing when expanded.
 * Only visible if object has children.
 *
 * @module features/layers-panel/components/HierarchyArrow
 */

import { ChevronRight } from 'lucide-react';
import { memo } from 'react';

/**
 * Props for HierarchyArrow component
 *
 * @interface HierarchyArrowProps
 * @property {boolean} isCollapsed - Whether children are hidden
 * @property {boolean} hasChildren - Whether object has any children
 * @property {(e: React.MouseEvent) => void} onToggle - Callback when arrow clicked
 */
interface HierarchyArrowProps {
  isCollapsed: boolean;
  hasChildren: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

/**
 * Hierarchy Arrow Component
 *
 * Renders a chevron arrow that:
 * - Points right (→) when collapsed
 * - Points down (↓) when expanded (90° rotation)
 * - Shows hover background (gray-200)
 * - Only appears if object has children
 * - Prevents drag when clicked (stopPropagation)
 *
 * When object has no children, renders a spacer to maintain alignment.
 *
 * @param {HierarchyArrowProps} props - Component props
 * @returns {JSX.Element} Rendered hierarchy arrow or spacer
 *
 * @example
 * ```tsx
 * <HierarchyArrow
 *   isCollapsed={true}
 *   hasChildren={true}
 *   onToggle={(e) => {
 *     e.stopPropagation();
 *     toggleCollapse(object.id);
 *   }}
 * />
 * ```
 */
export const HierarchyArrow = memo(function HierarchyArrow({
  isCollapsed,
  hasChildren,
  onToggle,
}: HierarchyArrowProps) {
  if (!hasChildren) {
    // Spacer to maintain alignment when no children
    return <div className="w-4" />;
  }

  return (
    <button
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()} // Prevent drag
      className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
      aria-label={isCollapsed ? 'Expand children' : 'Collapse children'}
    >
      <ChevronRight
        className={`
          w-3 h-3 text-gray-600 transition-transform duration-150
          ${isCollapsed ? 'rotate-0' : 'rotate-90'}
        `}
      />
    </button>
  );
});
