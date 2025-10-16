/**
 * Environment Indicator Component
 *
 * Shows which environment the app is running in (development/production).
 * Only visible in development mode for clarity.
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
        'fixed top-4 left-4 z-50 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm',
        'flex items-center gap-2',
        isDev
          ? 'bg-orange-100 text-orange-900 border border-orange-300'
          : 'bg-blue-100 text-blue-900 border border-blue-300'
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isDev ? 'bg-orange-500' : 'bg-blue-500'
        )}
      />
      <span className="uppercase tracking-wide">
        {environment} • Emulators
      </span>
    </div>
  );
}
