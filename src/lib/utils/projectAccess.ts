/**
 * Project Access Control Utilities
 *
 * Functions to check if a user has access to view/edit projects.
 * Enforces access control rules for private projects.
 *
 * Rules:
 * - Public projects: Anyone can view
 * - Private projects: Only owner and collaborators can view/edit
 * - Free users: Can view but not create projects
 * - Paid users: Full access to their own projects
 */

import type { Project } from '@/types/project.types';

/**
 * Check if user has view access to a project
 *
 * @param project - Project to check access for
 * @param userId - Current user ID (null if not authenticated)
 * @returns true if user can view the project
 */
export function canViewProject(
  project: Project,
  userId: string | null
): boolean {
  // Public projects are visible to everyone
  if (project.isPublic) {
    return true;
  }

  // Private projects require authentication
  if (!userId) {
    return false;
  }

  // Owner has access
  if (project.ownerId === userId) {
    return true;
  }

  // Collaborators have access
  if (project.collaborators.includes(userId)) {
    return true;
  }

  // No access
  return false;
}

/**
 * Check if user has edit access to a project
 *
 * @param project - Project to check access for
 * @param userId - Current user ID (null if not authenticated)
 * @returns true if user can edit the project
 */
export function canEditProject(
  project: Project,
  userId: string | null
): boolean {
  // Must be authenticated to edit
  if (!userId) {
    return false;
  }

  // Owner can always edit
  if (project.ownerId === userId) {
    return true;
  }

  // Collaborators can edit
  if (project.collaborators.includes(userId)) {
    return true;
  }

  // No edit access
  return false;
}

/**
 * Check if user can change project visibility (public/private)
 *
 * Only paid users can create private projects.
 * Only project owner can change visibility.
 *
 * @param project - Project to check access for
 * @param userId - Current user ID
 * @param isPaidUser - Whether user has paid subscription
 * @returns true if user can change visibility
 */
export function canChangeProjectVisibility(
  project: Project,
  userId: string | null,
  isPaidUser: boolean
): boolean {
  // Must be authenticated and paid
  if (!userId || !isPaidUser) {
    return false;
  }

  // Only owner can change visibility
  return project.ownerId === userId;
}

/**
 * Check if user can delete a project
 *
 * Only the project owner can delete projects.
 *
 * @param project - Project to check access for
 * @param userId - Current user ID
 * @returns true if user can delete the project
 */
export function canDeleteProject(
  project: Project,
  userId: string | null
): boolean {
  if (!userId) {
    return false;
  }

  return project.ownerId === userId;
}

/**
 * Get user's role in a project
 *
 * @param project - Project to check role for
 * @param userId - Current user ID
 * @returns 'owner' | 'collaborator' | 'viewer' | 'none'
 */
export function getUserProjectRole(
  project: Project,
  userId: string | null
): 'owner' | 'collaborator' | 'viewer' | 'none' {
  if (!userId) {
    return project.isPublic ? 'viewer' : 'none';
  }

  if (project.ownerId === userId) {
    return 'owner';
  }

  if (project.collaborators.includes(userId)) {
    return 'collaborator';
  }

  return project.isPublic ? 'viewer' : 'none';
}

/**
 * Filter projects based on user access
 *
 * @param projects - All projects
 * @param userId - Current user ID
 * @returns Projects that user has access to view
 */
export function filterAccessibleProjects(
  projects: Project[],
  userId: string | null
): Project[] {
  return projects.filter((project) => canViewProject(project, userId));
}

/**
 * Access denied error message generator
 *
 * @param projectName - Name of the project
 * @returns User-friendly error message
 */
export function getAccessDeniedMessage(projectName: string): string {
  return `You don't have access to "${projectName}". This is a private project.`;
}

/**
 * Upgrade required message for private projects
 */
export const PRIVATE_PROJECT_UPGRADE_MESSAGE = {
  title: 'Upgrade to Create Private Projects',
  description:
    'Private projects are available on paid plans. Keep your work private and share only with your team.',
  benefits: [
    'Create unlimited private projects',
    'Invite-only collaboration',
    'Full access control',
    'Priority support',
  ],
};
