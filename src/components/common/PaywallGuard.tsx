/**
 * PaywallGuard Component
 *
 * Wrapper component that shows upgrade prompt when user tries to access
 * a paid feature without proper subscription.
 *
 * Used to gate access to:
 * - Project creation
 * - Private projects
 * - Premium templates
 *
 * @example
 * ```tsx
 * <PaywallGuard
 *   feature="create_projects"
 *   fallback={<UpgradePrompt />}
 * >
 *   <CreateProjectButton />
 * </PaywallGuard>
 * ```
 */

import * as React from 'react';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { UpgradePromptModal } from './UpgradePromptModal';

interface PaywallGuardProps {
  /** Feature to check access for */
  feature: 'create_projects' | 'private_projects' | 'templates';

  /** Children to render if user has access */
  children: React.ReactNode;

  /** Optional custom fallback when user doesn't have access */
  fallback?: React.ReactNode;

  /** Show upgrade modal instead of fallback */
  showUpgradeModal?: boolean;

  /** Callback when user clicks upgrade */
  onUpgrade?: () => void;
}

/**
 * Paywall guard component that conditionally renders children based on feature access.
 *
 * If user doesn't have access:
 * - Shows fallback UI (if provided)
 * - Shows upgrade modal (if showUpgradeModal is true)
 * - Hides children completely (default)
 */
export function PaywallGuard({
  feature,
  children,
  fallback,
  showUpgradeModal = false,
  onUpgrade,
}: PaywallGuardProps) {
  const hasAccess = useFeatureAccess(feature);
  const [showModal, setShowModal] = React.useState(false);

  // User has access - show children
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradeModal) {
    return (
      <>
        {/* Trigger element (could be disabled button) */}
        <div onClick={() => setShowModal(true)}>{children}</div>

        {/* Upgrade modal */}
        <UpgradePromptModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          onUpgrade={onUpgrade}
        />
      </>
    );
  }

  // Default: hide children entirely
  return null;
}

/**
 * Hook to check if user should see upgrade prompt for a feature
 *
 * @example
 * ```tsx
 * const shouldPrompt = useShowUpgradePrompt('create_projects');
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useShowUpgradePrompt(
  feature: 'create_projects' | 'private_projects' | 'templates'
): boolean {
  const hasAccess = useFeatureAccess(feature);
  return !hasAccess;
}
