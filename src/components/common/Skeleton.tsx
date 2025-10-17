/**
 * Skeleton Component - Loading placeholder with shimmer effect
 *
 * @see _docs/ux/loading-patterns.md
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

/**
 * Skeleton loading placeholder with optional shimmer animation.
 * Used for loading states to prevent blank pages.
 *
 * @example
 * ```tsx
 * // Basic skeleton
 * <Skeleton className="h-4 w-32" />
 *
 * // Without shimmer
 * <Skeleton className="h-8 w-48" shimmer={false} />
 * ```
 */
export function Skeleton({ className = '', shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded',
        shimmer && 'relative overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
}
