/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import * as React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches React errors and displays fallback UI
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Handle error caught by boundary
   */
  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Error is stored in state via getDerivedStateFromError
    // Additional error tracking could be added here (e.g., error reporting service)
  }

  /**
   * Reset error state to retry rendering
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-error-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Something went wrong
              </h2>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              An unexpected error occurred. Please try refreshing the page or contact support if
              the problem persists.
            </p>

            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-700">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-neutral-50 rounded text-xs text-neutral-700 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors text-sm font-medium"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
