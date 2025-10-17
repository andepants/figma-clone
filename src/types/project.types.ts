/**
 * Project Types
 *
 * Type definitions for projects, templates, and public project listings.
 *
 * @see _docs/database/firestore-schema.md
 */

export type ProjectTemplate = 'blank' | 'feature-graphic' | 'app-icon';

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  template: ProjectTemplate;
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
 * Type guards
 */
export function isProjectTemplate(value: string): value is ProjectTemplate {
  return ['blank', 'feature-graphic', 'app-icon'].includes(value);
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

/**
 * Template metadata
 */
export interface TemplateMetadata {
  id: ProjectTemplate;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  previewImage?: string;
}

export const TEMPLATES: Record<ProjectTemplate, TemplateMetadata> = {
  blank: {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty canvas',
    dimensions: { width: 1024, height: 1024 },
  },
  'feature-graphic': {
    id: 'feature-graphic',
    name: 'Feature Graphic',
    description: 'Google Play Store feature graphic (1024x500)',
    dimensions: { width: 1024, height: 500 },
  },
  'app-icon': {
    id: 'app-icon',
    name: 'App Icon',
    description: 'iOS/Android app icon (1024x1024)',
    dimensions: { width: 1024, height: 1024 },
  },
};
