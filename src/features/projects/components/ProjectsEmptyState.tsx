/**
 * ProjectsEmptyState Component
 *
 * Empty states for projects dashboard based on user subscription status.
 * Shows different messages and CTAs for free vs paid users.
 *
 * @see _docs/ux/empty-states.md
 */

import { EmptyState } from '@/components/common/EmptyState';

interface ProjectsEmptyStateProps {
  isPaidUser: boolean;
  onCreateProject?: () => void;
}

/**
 * Empty state for projects dashboard.
 * Shows different content based on user subscription status.
 *
 * @example
 * ```tsx
 * <ProjectsEmptyState
 *   isPaidUser={user?.subscription?.status !== 'free'}
 *   onCreateProject={() => setShowCreateModal(true)}
 * />
 * ```
 */
export function ProjectsEmptyState({
  isPaidUser,
  onCreateProject,
}: ProjectsEmptyStateProps) {
  if (isPaidUser) {
    // Paid user - encourage creation
    return (
      <EmptyState
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        heading="Create Your First Project"
        description="Start designing professional app icons and graphics with templates optimized for iOS and Android. Make it public to share with the community!"
        primaryAction={
          onCreateProject
            ? {
                label: 'Create Project',
                onClick: onCreateProject,
              }
            : undefined
        }
      />
    );
  }

  // Free user - show upgrade prompt
  return (
    <EmptyState
      icon={
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
      }
      heading="Unlock Project Creation"
      description="Free accounts can browse and collaborate on public projects. Upgrade to CanvasIcons Founders for just $10/year to create unlimited public and private projects."
      primaryAction={{
        label: 'Upgrade to Founders ($10/year)',
        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      }}
    />
  );
}
