/**
 * ProjectsPage Component
 *
 * Main projects dashboard showing user's projects in a grid layout.
 * Auth-protected route with loading states, empty states, and project management.
 *
 * @see _docs/ux/user-flows.md - Flow 3: Projects Dashboard
 */

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/common/Skeleton';
import { InlineUpgradePrompt } from '@/components/common';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';
import { ConfirmDeleteModal } from '@/features/projects/components/ConfirmDeleteModal';
import { ProjectsEmptyState } from '@/features/projects/components/ProjectsEmptyState';
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject as deleteProjectFirestore,
  generateProjectId,
} from '@/lib/firebase';
import type { Project, ProjectTemplate } from '@/types/project.types';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Projects dashboard page.
 * Shows user's projects with create, rename, and delete actions.
 */
export default function ProjectsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canCreateProjects, badge, subscription, isPaid: isPaidUser } = useSubscription();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    project: Project;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Payment status from URL query params
  const paymentStatus = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');

  // Fetch user's projects on mount
  useEffect(() => {
    async function fetchProjects() {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const userProjects = await getUserProjects(currentUser.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [currentUser]);

  // Auto-dismiss payment success banner when subscription updates
  useEffect(() => {
    if (paymentStatus === 'success' && isPaidUser && subscription?.status !== 'free') {
      // Clear URL params after subscription is confirmed active
      const timer = setTimeout(() => {
        setSearchParams({});
      }, 3000); // Show success message for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, isPaidUser, subscription, setSearchParams]);

  const handleCreateProject = async (
    name: string,
    template: ProjectTemplate,
    isPublic: boolean
  ) => {
    if (!currentUser) return;

    try {
      setIsCreating(true);

      const newProject: Project = {
        id: generateProjectId(),
        name,
        ownerId: currentUser.uid,
        template,
        isPublic,
        collaborators: [currentUser.uid],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        objectCount: 0,
      };

      await createProject(newProject);
      setProjects((prev) => [newProject, ...prev]);
      setShowCreateModal(false);

      // Navigate to canvas editor
      navigate(`/canvas/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
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

  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;

    try {
      setIsDeleting(true);
      await deleteProjectFirestore(deleteConfirm.project.id);
      setProjects((prev) =>
        prev.filter((p) => p.id !== deleteConfirm.project.id)
      );
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVisibility = async (projectId: string, isPublic: boolean) => {
    try {
      await updateProject(projectId, { isPublic });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, isPublic, updatedAt: Date.now() }
            : p
        )
      );
    } catch (error) {
      console.error('Failed to toggle project visibility:', error);
      alert('Failed to update project visibility. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  My Projects
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
              </div>
              {badge && (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    badge.color === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : badge.color === 'green'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {badge.text}
                </span>
              )}
            </div>
            {canCreateProjects && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Payment Status Banners */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900">
                  Payment Successful!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Your account is being upgraded to Founders tier. This may take a few seconds...
                </p>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="text-green-600 hover:text-green-800"
                aria-label="Dismiss"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentStatus === 'cancelled' && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900">
                  Payment Cancelled
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your payment was cancelled. No charges were made.{' '}
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="underline hover:no-underline font-medium"
                  >
                    Try again
                  </button>
                </p>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="text-yellow-600 hover:text-yellow-800"
                aria-label="Dismiss"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
          canCreateProjects ? (
            <ProjectsEmptyState
              isPaidUser={isPaidUser}
              onCreateProject={() => setShowCreateModal(true)}
            />
          ) : (
            <InlineUpgradePrompt feature="create_projects" />
          )
        ) : (
          // Projects grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRename={handleRenameProject}
                onDelete={(projectId) => {
                  const project = projects.find((p) => p.id === projectId);
                  if (project) {
                    setDeleteConfirm({ project });
                  }
                }}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
        isCreating={isCreating}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        projectName={deleteConfirm?.project.name || ''}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteConfirm(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
