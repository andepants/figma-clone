/**
 * Project Types
 *
 * Type definitions for projects and public project listings.
 *
 * @see _docs/database/firestore-schema.md
 */

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  collaborators: string[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  objectCount: number;
}

export interface PublicProject {
  projectId: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  thumbnail?: string;
  updatedAt: number;
  objectCount: number;
}

/**
 * Validation functions
 */
export function validateProjectName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  if (name.length > 100) {
    return {
      valid: false,
      error: 'Project name must be 100 characters or less',
    };
  }

  return { valid: true };
}

/**
 * Helper functions
 */
export function canUserAccessProject(
  project: Project,
  userId: string
): boolean {
  // Public projects accessible by anyone
  if (project.isPublic) return true;

  // Owner and collaborators can access private projects
  return (
    project.ownerId === userId || project.collaborators.includes(userId)
  );
}

export function canUserModifyProject(
  project: Project,
  userId: string
): boolean {
  // Only owner can modify project settings
  return project.ownerId === userId;
}
