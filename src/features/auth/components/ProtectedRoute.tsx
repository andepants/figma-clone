/**
 * ProtectedRoute Component
 *
 * Wrapper component for routes that require authentication.
 * Shows loading state while checking auth, redirects unauthenticated users to home.
 */

import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Props for ProtectedRoute component
 * @interface ProtectedRouteProps
 * @property {React.ReactNode} children - Child components to render if authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper that requires authentication
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Protected content or redirect
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while determining auth state
  // This prevents flash of content before redirect
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className="w-10 h-10 border-3 border-neutral-200 border-t-primary-500 rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          />
          <p className="text-base text-neutral-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  // Use replace to prevent back button from returning to protected route
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}
