/**
 * Public Playground Page
 *
 * Shared collaborative canvas accessible to all authenticated users.
 * Uses a special PUBLIC_PLAYGROUND project ID with ownerId: 'system'.
 * Auto-creates the playground project if it doesn't exist.
 * No collaborator management needed - fully public for any authenticated user.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { getProject, createProject } from '@/lib/firebase/projectsService';
import { PUBLIC_PLAYGROUND_ID, PUBLIC_PLAYGROUND_NAME } from '@/config/constants';

/**
 * Public playground route wrapper
 * Auto-creates playground project with ownerId: 'system' if needed,
 * then redirects to canvas. Fully public - no collaborator checks.
 * Requires authentication.
 */
function PublicPlaygroundPage() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializePlayground() {
      // Wait for auth to load
      if (loading) return;

      // Redirect to login if not authenticated
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        // Check if playground project exists
        const existingProject = await getProject(PUBLIC_PLAYGROUND_ID);

        if (!existingProject) {
          // Create playground with system ownership (no individual owner)
          await createProject({
            id: PUBLIC_PLAYGROUND_ID,
            name: PUBLIC_PLAYGROUND_NAME,
            ownerId: 'system', // System-owned, not user-owned
            isPublic: true, // Publicly accessible
            collaborators: {}, // Empty - not needed for public playground
            objectCount: 0, // Start with empty canvas
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }

        // Navigate to public playground canvas
        navigate(`/canvas/${PUBLIC_PLAYGROUND_ID}`, { replace: true });
      } catch (err) {
        console.error('Failed to initialize playground:', err);
        // Include error details for debugging
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error details:', errorMessage);
        setError(`Failed to load playground: ${errorMessage}`);
      }
    }

    initializePlayground();
  }, [currentUser, loading, navigate]);

  // Show error or loading state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

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
