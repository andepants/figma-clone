/**
 * PublicProjectsPage Component
 *
 * Browse public projects gallery.
 * Shows all public projects from all users in a grid layout.
 * No authentication required - accessible to all users.
 *
 * @see _docs/ux/user-flows.md - Flow 1: Free User Journey
 */

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/common/Skeleton';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { getPublicProjects, updateProject } from '@/lib/firebase';
import type { Project } from '@/types/project.types';
import { useAuth } from '@/features/auth/hooks';

/**
 * Public projects gallery page.
 * Shows all public projects with ability to open and collaborate.
 */
export default function PublicProjectsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch public projects on mount
  useEffect(() => {
    async function fetchPublicProjects() {
      try {
        setIsLoading(true);
        const publicProjects = await getPublicProjects();
        setProjects(publicProjects);
      } catch (error) {
        console.error('Failed to fetch public projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicProjects();
  }, []);

  const handleRenameProject = async (projectId: string, newName: string) => {
    // Only allow owner to rename
    const project = projects.find((p) => p.id === projectId);
    if (!project || !currentUser || project.ownerId !== currentUser.uid) {
      return;
    }

    try {
      await updateProject(projectId, { name: newName });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, name: newName, updatedAt: Date.now() }
            : p
        )
      );
    } catch (error) {
      console.error('Failed to rename project:', error);
      alert('Failed to rename project. Please try again.');
    }
  };

  const handleDeleteProject = () => {
    // Delete not allowed in public gallery - user must go to their projects page
    alert('To delete a project, go to your Projects page.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Public Projects
              </h1>
              <p className="text-gray-600 mt-2">
                Explore and collaborate on projects shared by the community
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
              {projects.length} public project{projects.length !== 1 ? 's' : ''}
            </span>
            {!currentUser && (
              <button
                onClick={() => navigate('/projects')}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In to Create
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 mb-6 text-gray-300">
              <Globe className="w-full h-full" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No public projects yet
            </h2>
            <p className="text-gray-600 max-w-md mb-8">
              Be the first to create and share a public project with the community!
            </p>
            {currentUser ? (
              <button
                onClick={() => navigate('/projects')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to My Projects
              </button>
            ) : (
              <button
                onClick={() => navigate('/projects')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In to Get Started
              </button>
            )}
          </div>
        ) : (
          // Projects grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUserId={currentUser?.uid || ''}
                onRename={handleRenameProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Info Footer */}
      {projects.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-100 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Want to share your own project?
            </h3>
            <p className="text-gray-600 mb-4">
              Create a project and toggle it to "Public" to share it with the community
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentUser ? 'Go to My Projects' : 'Sign In to Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
