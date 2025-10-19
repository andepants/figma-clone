/**
 * Public Playground Page
 *
 * Shared collaborative canvas accessible to all authenticated users.
 * Uses a special PUBLIC_PLAYGROUND project ID for universal access.
 * Auto-creates the playground project if it doesn't exist.
 * Automatically adds all users as collaborators when they access it.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { getProject, createProject, addCollaborator } from '@/lib/firebase/projectsService';
import { PUBLIC_PLAYGROUND_ID, PUBLIC_PLAYGROUND_NAME } from '@/config/constants';

/**
 * Public playground route wrapper
 * Auto-creates playground project if needed, auto-adds user as collaborator,
 * then redirects to canvas. Works like a regular project with automatic access.
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
          // First user: Create playground as their own project
          await createProject({
            id: PUBLIC_PLAYGROUND_ID,
            name: PUBLIC_PLAYGROUND_NAME,
            ownerId: currentUser.uid, // First user owns the playground
            isPublic: true, // Publicly accessible
            collaborators: { [currentUser.uid]: true }, // Add creator as collaborator
            objectCount: 0, // Start with empty canvas
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else {
          // Subsequent users: Auto-add as collaborator if not already
          const isCollaborator = existingProject.collaborators[currentUser.uid] === true;
          const isOwner = existingProject.ownerId === currentUser.uid;

          if (!isCollaborator && !isOwner) {
            // Auto-add user as collaborator
            await addCollaborator(PUBLIC_PLAYGROUND_ID, currentUser.uid);
          }
        }

        // Navigate to public playground canvas
        navigate(`/canvas/${PUBLIC_PLAYGROUND_ID}`, { replace: true });
      } catch (err) {
        console.error('Failed to initialize playground:', err);
        setError('Failed to load playground. Please try again.');
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
