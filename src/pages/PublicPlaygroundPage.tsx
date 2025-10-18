/**
 * Public Playground Page
 *
 * Shared collaborative canvas accessible to all authenticated users.
 * Uses a special PUBLIC_PLAYGROUND project ID for universal access.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { PUBLIC_PLAYGROUND_ID } from '@/config/constants';

/**
 * Public playground route wrapper
 * Redirects to /canvas/:projectId with PUBLIC_PLAYGROUND_ID
 * Requires authentication
 */
function PublicPlaygroundPage() {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Redirect to public playground project
    navigate(`/canvas/${PUBLIC_PLAYGROUND_ID}`, { replace: true });
  }, [currentUser, isLoading, navigate]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <div className="text-4xl">🎨</div>
        <p className="text-gray-600">Loading playground...</p>
      </div>
    </div>
  );
}

export default PublicPlaygroundPage;
