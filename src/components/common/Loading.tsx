/**
 * Loading component
 *
 * Displays a spinner with optional message for loading states
 */

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

/**
 * Loading spinner component
 *
 * @param message - Optional loading message to display
 * @param size - Size of the spinner (sm, md, lg)
 * @param fullScreen - If true, centers spinner in full screen
 */
export function Loading({
  message = 'Loading...',
  size = 'md',
  fullScreen = false
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-neutral-200 border-t-primary-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className={`${textSizeClasses[size]} text-neutral-600`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
