/**
 * Sync Indicator Component
 *
 * Displays real-time sync status for collaborative editing operations.
 * Shows when changes are being synced to Firebase and provides offline status.
 */

import * as React from 'react';
import { Check, CloudOff, Loader2 } from 'lucide-react';

/**
 * Sync status states
 */
export type SyncStatus = 'synced' | 'syncing' | 'offline';

interface SyncIndicatorProps {
  /** Current sync status */
  status: SyncStatus;
  /** Optional callback when indicator is clicked */
  onClick?: () => void;
  /** Optional custom className for positioning */
  className?: string;
}

/**
 * Sync Indicator
 *
 * Small, subtle indicator showing sync status in the top-right corner.
 * Auto-hides the "Synced" state after 2 seconds.
 *
 * @example
 * ```tsx
 * <SyncIndicator status="syncing" />
 * <SyncIndicator status="synced" />
 * <SyncIndicator status="offline" />
 * ```
 */
export function SyncIndicator({ status, onClick, className }: SyncIndicatorProps) {
  const [visible, setVisible] = React.useState(true);

  // Auto-hide "synced" status after 2 seconds
  React.useEffect(() => {
    if (status === 'synced') {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [status]);

  // Don't render if not visible
  if (!visible && status === 'synced') {
    return null;
  }

  const statusConfig = {
    synced: {
      icon: Check,
      text: 'Synced',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    syncing: {
      icon: Loader2,
      text: 'Syncing...',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    offline: {
      icon: CloudOff,
      text: 'Offline',
      color: 'text-neutral-500',
      bgColor: 'bg-neutral-100',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed top-4 right-4 z-30
        flex items-center gap-2 px-3 py-2 rounded-md
        ${config.bgColor}
        animate-in fade-in slide-in-from-top-2 duration-200
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className || ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      aria-label={`Sync status: ${config.text}`}
    >
      <Icon
        size={14}
        className={`${config.color} ${status === 'syncing' ? 'animate-spin' : ''}`}
      />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
}
