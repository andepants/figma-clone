/**
 * ProjectsPage Component
 *
 * Main projects dashboard showing user's projects in a grid layout.
 * Auth-protected route with loading states, empty states, and project management.
 *
 * @see _docs/ux/user-flows.md - Flow 3: Projects Dashboard
 */

import { useState } from 'react';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/common/Skeleton';
import { ProfileDropdown } from '@/components/common/ProfileDropdown';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';
import { ConfirmDeleteModal } from '@/features/projects/components/ConfirmDeleteModal';
import { ProjectsEmptyState } from '@/features/projects/components/ProjectsEmptyState';
import { PublicProjectsSection } from '@/features/projects/components/PublicProjectsSection';
import { PricingPageContent } from '@/features/pricing/components';
import {
  createProject,
  updateProject,
  deleteProject as deleteProjectFirestore,
  generateProjectId,
} from '@/lib/firebase';
import { redirectToCheckout } from '@/lib/stripe/checkout';
import { generateTemplateObjects } from '@/lib/utils/template-generator';
import type { Project } from '@/types/project.types';
import { useNavigate } from 'react-router-dom';
import { useProjectsData, usePaymentStatus } from './projects/hooks';

/**
 * Projects dashboard page.
 * Shows user's projects with create, rename, and delete actions.
 */
export default function ProjectsPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { canCreateProjects, badge, subscription, isPaid: isPaidUser, userProfile } = useSubscription();

  // Data fetching hook
  const {
    projects,
    publicProjects,
    paidUserCount,
    isLoading,
    setProjects,
  } = useProjectsData(currentUser?.uid || null, canCreateProjects);

  // Payment status hook
  const { paymentStatus, webhookTimeout, clearPaymentStatus } = usePaymentStatus(
    isPaidUser,
    subscription?.status || 'free',
    canCreateProjects
  );

  // Local UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    project: Project;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleCreateProject = async (
    name: string,
    isPublic: boolean
  ) => {
    if (!currentUser) return;

    try {
      setIsCreating(true);

      const newProject: Project = {
        id: generateProjectId(),
        name,
        ownerId: currentUser.uid,
        isPublic,
        collaborators: [currentUser.uid],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        objectCount: 10, // Will have 10 template objects (4 app icons + 6 feature graphic)
      };

      // Create project in Firestore
      await createProject(newProject);

      // Generate template objects in RTDB
      await generateTemplateObjects(newProject.id);

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

  const handleUpgrade = async () => {
    if (!currentUser || !userProfile) {
      console.error('❌ No current user or user profile');
      return;
    }

    try {
      setIsUpgrading(true);

      // Determine price ID based on paid user count
      const isFoundersOffer = paidUserCount < 10;
      const priceId = isFoundersOffer
        ? import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID // $10/year (founders - first 10 users)
        : import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID60; // $60/year (after 10 users)

      if (!priceId) {
        console.error('❌ Price ID not found in environment variables!');
        alert(`Stripe is not configured. Please add ${isFoundersOffer ? 'VITE_STRIPE_FOUNDERS_PRICE_ID' : 'VITE_STRIPE_FOUNDERS_PRICE_ID60'} to your .env file.`);
        return;
      }

      if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
        console.error('❌ Stripe publishable key not found!');
        alert('Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.');
        return;
      }

      await redirectToCheckout(
        priceId,
        currentUser.email!
      );
    } catch (error) {
      console.error('❌ Upgrade failed:', error);
      alert('Failed to start upgrade. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  /**
   * Generate default project name based on existing projects.
   * Finds the highest "Project N" number and returns "Project N+1".
   */
  const getDefaultProjectName = (): string => {
    // Find all project names that match "Project N" pattern
    const projectNumbers = projects
      .map((p) => {
        const match = p.name.match(/^Project (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    // Get the highest number, or default to 0
    const maxNumber = projectNumbers.length > 0 ? Math.max(...projectNumbers) : 0;

    return `Project ${maxNumber + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
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

            {/* Right side: Playground + New Project Button + Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Public Playground button */}
              <button
                onClick={() => navigate('/canvas')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">🎨 Playground</span>
                <span className="sm:hidden">🎨</span>
              </button>

              {/* New Project button */}
              {canCreateProjects && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}

              {/* Profile Dropdown */}
              {currentUser && (
                <ProfileDropdown
                  username={userProfile?.username || currentUser.email || 'User'}
                  onLogout={logout}
                />
              )}
            </div>
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
                onClick={clearPaymentStatus}
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
                onClick={clearPaymentStatus}
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
        ) : paymentStatus === 'success' && !canCreateProjects ? (
          // Payment successful but subscription not yet updated: Show processing state or error
          <div className="flex flex-col items-center justify-center py-16">
            {webhookTimeout ? (
              // Timeout: Show error with manual refresh option
              <>
                <div className="rounded-full bg-yellow-100 p-3 mb-6">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Subscription Processing Delayed
                </h2>
                <p className="text-gray-600 text-center max-w-md mb-6">
                  Your payment was successful, but we're still activating your account. This sometimes takes a minute.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  If the issue persists, contact support with your payment receipt.
                </p>
              </>
            ) : (
              // Processing: Show spinner
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Your Subscription
                </h2>
                <p className="text-gray-600 text-center max-w-md">
                  We're activating your Founders tier access. This usually takes just a few seconds...
                </p>
              </>
            )}
          </div>
        ) : !canCreateProjects ? (
          // Free user: Show public projects + pricing content
          <>
            {publicProjects.length > 0 && (
              <PublicProjectsSection projects={publicProjects} />
            )}
            <PricingPageContent
              onUpgrade={handleUpgrade}
              isLoading={isUpgrading}
              showFoundersOffer={paidUserCount < 10}
            />
          </>
        ) : projects.length === 0 ? (
          // Paid user, no projects: Empty state
          <ProjectsEmptyState
            isPaidUser={isPaidUser}
            onCreateProject={() => setShowCreateModal(true)}
          />
        ) : (
          // Paid user with projects: Grid
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
        defaultName={getDefaultProjectName()}
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
