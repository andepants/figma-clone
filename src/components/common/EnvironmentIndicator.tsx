/**
 * Environment Indicator Component
 *
 * Shows which environment the app is running in (development/production).
 * Only visible in development mode for clarity.
 * Displays at the bottom of the left sidebar.
 */

import { cn } from '@/lib/utils';

export function EnvironmentIndicator() {
  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  const isDev = environment === 'development';

  return (
    <div
      className={cn(
        'px-2 py-1.5 text-[10px] font-medium',
        'flex items-center gap-1.5 border-t border-gray-200',
        isDev
          ? 'bg-orange-50 text-orange-700'
          : 'bg-blue-50 text-blue-700'
      )}
    >
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          isDev ? 'bg-orange-500' : 'bg-blue-500'
        )}
      />
      <span className="capitalize tracking-wide truncate">
        {environment} · Emulators
      </span>
    </div>
  );
}
