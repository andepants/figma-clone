/**
 * Realtime Database Projects Service
 *
 * Manages CRUD operations for projects in Firebase Realtime Database.
 * Handles project creation, fetching, updating, and deletion.
 *
 * @see _docs/database/database-structure.md
 */

import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  type Unsubscribe,
} from 'firebase/database';
import { realtimeDb } from './config';
import type { Project } from '@/types/project.types';

/**
 * Create a new project in Realtime Database
 *
 * @param project - Project data (must include id, name, ownerId)
 * @throws Error if project creation fails
 */
export async function createProject(project: Project): Promise<void> {
  const projectRef = ref(realtimeDb, `projects/${project.id}`);
  await set(projectRef, {
    ...project,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Get a single project by ID
 *
 * @param projectId - Project ID
 * @returns Project data or null if not found
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectRef = ref(realtimeDb, `projects/${projectId}`);
  const snapshot = await get(projectRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Project;
}

/**
 * Get all projects owned by a user
 *
 * @param userId - User ID (owner)
 * @param limit - Optional limit on number of results
 * @returns Array of projects sorted by updatedAt (newest first)
 */
export async function getUserProjects(
  userId: string,
  limit?: number
): Promise<Project[]> {
  const projectsRef = ref(realtimeDb, 'projects');
  const snapshot = await get(projectsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const projectsData = snapshot.val() as Record<string, Project>;
  const projects = Object.values(projectsData)
    .filter((project) => project.ownerId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return limit ? projects.slice(0, limit) : projects;
}

/**
 * Get all public projects
 *
 * @param limit - Optional limit on number of results
 * @returns Array of public projects sorted by updatedAt (newest first)
 */
export async function getPublicProjects(limit?: number): Promise<Project[]> {
  const projectsRef = ref(realtimeDb, 'projects');
  const snapshot = await get(projectsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const projectsData = snapshot.val() as Record<string, Project>;
  const projects = Object.values(projectsData)
    .filter((project) => project.isPublic === true)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return limit ? projects.slice(0, limit) : projects;
}

/**
 * Get public projects where user is a collaborator
 *
 * @param userId - User ID to check collaborator status
 * @returns Array of public projects where user is a collaborator
 */
export async function getPublicProjectsForUser(
  userId: string
): Promise<Project[]> {
  const projectsRef = ref(realtimeDb, 'projects');
  const snapshot = await get(projectsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const projectsData = snapshot.val() as Record<string, Project>;
  return Object.values(projectsData)
    .filter(
      (project) =>
        project.isPublic === true && project.collaborators.includes(userId)
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Update project metadata
 *
 * @param projectId - Project ID
 * @param updates - Partial project data to update
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<void> {
  const projectRef = ref(realtimeDb, `projects/${projectId}`);
  await update(projectRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a project
 *
 * @param projectId - Project ID
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = ref(realtimeDb, `projects/${projectId}`);
  await remove(projectRef);
}

/**
 * Subscribe to real-time updates for a single project
 *
 * @param projectId - Project ID
 * @param callback - Function called with updated project data
 * @returns Unsubscribe function
 */
export function subscribeToProject(
  projectId: string,
  callback: (project: Project | null) => void
): Unsubscribe {
  const projectRef = ref(realtimeDb, `projects/${projectId}`);

  return onValue(projectRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Project);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to real-time updates for user's projects
 *
 * @param userId - User ID (owner)
 * @param callback - Function called with updated projects array
 * @returns Unsubscribe function
 */
export function subscribeToUserProjects(
  userId: string,
  callback: (projects: Project[]) => void
): Unsubscribe {
  const projectsRef = ref(realtimeDb, 'projects');

  return onValue(projectsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const projectsData = snapshot.val() as Record<string, Project>;
    const projects = Object.values(projectsData)
      .filter((project) => project.ownerId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    callback(projects);
  });
}

/**
 * Check if user can access project
 *
 * @param project - Project data
 * @param userId - User ID
 * @returns True if user has access (owner, collaborator, or public)
 */
export function canUserAccessProject(
  project: Project,
  userId: string
): boolean {
  if (project.isPublic) return true;
  if (project.ownerId === userId) return true;
  if (project.collaborators.includes(userId)) return true;
  return false;
}

/**
 * Check if user can modify project
 *
 * @param project - Project data
 * @param userId - User ID
 * @returns True if user is the owner
 */
export function canUserModifyProject(
  project: Project,
  userId: string
): boolean {
  return project.ownerId === userId;
}

/**
 * Generate a unique project ID
 *
 * @returns UUID v4 string
 */
export function generateProjectId(): string {
  return crypto.randomUUID();
}

/**
 * Create default project for a new user
 *
 * @param userId - User ID
 * @param username - User's display name
 * @returns Created project
 */
export async function createDefaultProject(
  userId: string,
  username: string
): Promise<Project> {
  const project: Project = {
    id: generateProjectId(),
    name: `${username}'s First Project`,
    ownerId: userId,
    isPublic: false,
    collaborators: [userId],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    objectCount: 0,
  };

  await createProject(project);
  return project;
}
