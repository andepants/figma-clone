/**
 * Connection Status Component
 *
 * Displays Firebase connection status banner when not connected.
 * Figma-style banner that appears at the top-center of the viewport.
 * Auto-hides when connection is established.
 */

import * as React from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import type { ConnectionStatus as ConnectionStatusType } from '@/lib/firebase';

interface ConnectionStatusProps {
  /** Current connection status */
  status: ConnectionStatusType;
  /** Optional custom className for positioning */
  className?: string;
}

/**
 * Connection Status Banner
 *
 * Displays connection status when not connected to Firebase RTDB.
 * Shows different states:
 * - 'connecting': Initial connection attempt (spinner)
 * - 'disconnected': Connection lost (shows offline message)
 * - 'connected': Auto-hides (no banner shown)
 *
 * Features:
 * - Auto-hides when connected
 * - Non-intrusive top-center positioning
 * - Figma-style design with subtle shadows
 * - Smooth fade-in/out animations
 *
 * @example
 * ```tsx
 * <ConnectionStatus status="connecting" />
 * <ConnectionStatus status="disconnected" />
 * ```
 */
export function ConnectionStatus({ status, className = '' }: ConnectionStatusProps) {
  const [dismissed, setDismissed] = React.useState(false);

  // Reset dismissed state when connection status changes
  React.useEffect(() => {
    setDismissed(false);
  }, [status]);

  // Don't render if connected or dismissed
  if (status === 'connected' || dismissed) {
    return null;
  }

  const statusConfig = {
    connecting: {
      icon: Loader2,
      text: 'Connecting to server...',
      subtext: 'Establishing real-time connection',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconSpin: true,
    },
    disconnected: {
      icon: WifiOff,
      text: 'Connection lost',
      subtext: 'Changes will sync when connection is restored',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconSpin: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        flex items-start gap-3 px-4 py-3 rounded-lg
        ${config.bgColor} ${config.borderColor}
        border shadow-sm
        animate-in fade-in slide-in-from-top-2 duration-300
        min-w-[320px] max-w-md
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-label={`Connection status: ${config.text}`}
    >
      {/* Icon */}
      <Icon
        size={20}
        className={`${config.color} flex-shrink-0 mt-0.5 ${config.iconSpin ? 'animate-spin' : ''}`}
      />

      {/* Content */}
      <div className="flex-1 space-y-0.5">
        <div className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </div>
        <div className="text-xs text-gray-600">
          {config.subtext}
        </div>
      </div>

      {/* Dismiss button (only for disconnected state) */}
      {status === 'disconnected' && (
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Dismiss banner"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
