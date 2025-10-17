/**
 * Common Components - Barrel Export
 *
 * Export all common/shared components.
 */

// Export common components here as they are created
export { ErrorBoundary } from './ErrorBoundary';
export { ShortcutsModal } from './ShortcutsModal';
export { SyncIndicator } from './SyncIndicator';
export type { SyncStatus } from './SyncIndicator';
export { EnvironmentIndicator } from './EnvironmentIndicator';
export { PaywallGuard, useShowUpgradePrompt } from './PaywallGuard';
export { UpgradePromptModal, InlineUpgradePrompt } from './UpgradePromptModal';
export { AccessDenied, PrivateProjectAccessDenied, SubscriptionRequiredAccessDenied } from './AccessDenied';
export { EmptyState } from './EmptyState';
export { Spinner } from './Spinner';
export { Skeleton } from './Skeleton';
export { AccountModal } from './AccountModal';
export { ProfileDropdown } from './ProfileDropdown';
