/**
 * EmptyState Component - Reusable empty state with icon, heading, description, and actions
 *
 * @see _docs/ux/empty-states.md
 */

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  heading: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component for when there's no data to display.
 * Guides users to next action with clear messaging and CTAs.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderIcon />}
 *   heading="No Projects Yet"
 *   description="Create your first project to get started"
 *   primaryAction={{ label: 'Create Project', onClick: handleCreate }}
 *   secondaryAction={{ label: 'Browse Templates', onClick: handleBrowse }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  heading,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-96 text-center px-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="w-20 h-20 mb-6 text-gray-300" aria-hidden="true">
        {icon}
      </div>

      {/* Heading */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">{heading}</h3>

      {/* Description */}
      <p className="text-gray-600 mb-8 max-w-md">{description}</p>

      {/* Primary Action */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-colors mb-4',
            primaryAction.variant === 'secondary'
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {primaryAction.label}
        </button>
      )}

      {/* Secondary Action */}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          {secondaryAction.label} →
        </button>
      )}
    </div>
  );
}
