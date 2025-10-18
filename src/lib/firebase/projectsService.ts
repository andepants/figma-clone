/**
 * Firestore Projects Service
 *
 * Manages CRUD operations for projects in Firestore.
 * Handles project creation, fetching, updating, and deletion.
 *
 * @see _docs/database/firestore-schema.md
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
  orderBy,
  limit as queryLimit,
} from 'firebase/firestore';
import { firestore } from './config';
import type { Project } from '@/types/project.types';

/**
 * Create a new project in Firestore
 *
 * @param project - Project data (must include id, name, ownerId, template)
 * @throws Error if project creation fails
 */
export async function createProject(project: Project): Promise<void> {
  const projectRef = doc(firestore, 'projects', project.id);
  await setDoc(projectRef, {
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
  const projectRef = doc(firestore, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    return null;
  }

  return projectSnap.data() as Project;
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
  const projectsRef = collection(firestore, 'projects');
  const constraints = [
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc'),
  ];

  if (limit) {
    constraints.push(queryLimit(limit));
  }

  const q = query(projectsRef, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Project);
}

/**
 * Get all public projects
 *
 * @param limit - Optional limit on number of results
 * @returns Array of public projects sorted by updatedAt (newest first)
 */
export async function getPublicProjects(limit?: number): Promise<Project[]> {
  const projectsRef = collection(firestore, 'projects');
  const constraints = [
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc'),
  ];

  if (limit) {
    constraints.push(queryLimit(limit));
  }

  const q = query(projectsRef, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Project);
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
  const projectsRef = collection(firestore, 'projects');
  const q = query(
    projectsRef,
    where('isPublic', '==', true),
    where('collaborators', 'array-contains', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Project);
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
  const projectRef = doc(firestore, 'projects', projectId);
  await updateDoc(projectRef, {
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
  const projectRef = doc(firestore, 'projects', projectId);
  await deleteDoc(projectRef);
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
  const projectRef = doc(firestore, 'projects', projectId);

  return onSnapshot(projectRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Project);
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
  const projectsRef = collection(firestore, 'projects');
  const q = query(
    projectsRef,
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map((doc) => doc.data() as Project);
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
