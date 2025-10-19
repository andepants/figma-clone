/**
 * useProjectsData Hook
 *
 * Manages data fetching for projects page:
 * - All accessible projects (owned + collaborated)
 * - Shared projects (where user is collaborator, not owner)
 * - Founders deal configuration
 *
 * Extracted from ProjectsPage.tsx to improve modularity and testability.
 */

import { useState, useEffect } from 'react';
import {
  getAllUserProjects,
  getFoundersDealConfig,
} from '@/lib/firebase';
import type { Project } from '@/types/project.types';

interface UseProjectsDataReturn {
  /** All projects accessible by user (owned + collaborated) */
  projects: Project[];
  /** Projects shared with user (where user is collaborator, not owner) */
  sharedProjects: Project[];
  /** Number of users who have paid for founders offer */
  paidUserCount: number;
  /** Loading state for initial data fetch */
  isLoading: boolean;
  /** Update projects state */
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

/**
 * Fetches and manages projects data for current user.
 *
 * Behavior:
 * - Fetches all projects accessible by user (owned + collaborated)
 * - Always fetches founders deal configuration
 *
 * @param currentUserId - Current user's ID (null if not authenticated)
 * @returns Projects data and loading state
 *
 * @example
 * ```tsx
 * const { projects, isLoading, paidUserCount } = useProjectsData(
 *   currentUser?.uid || null
 * );
 * ```
 */
export function useProjectsData(
  currentUserId: string | null
): UseProjectsDataReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paidUserCount, setPaidUserCount] = useState<number>(0);

  // Fetch founders deal config on mount
  useEffect(() => {
    async function fetchFoundersDealConfig() {
      try {
        const config = await getFoundersDealConfig();
        // Calculate paid users (total spots - remaining spots)
        const paidUsers = config.spotsTotal - config.spotsRemaining;
        setPaidUserCount(paidUsers);
      } catch (error) {
        console.error('Failed to fetch founders deal config:', error);
        // Default to 0 (show founders pricing on error)
        setPaidUserCount(0);
      }
    }

    fetchFoundersDealConfig();
  }, []);

  // Fetch all user's projects (owned + collaborated)
  useEffect(() => {
    async function fetchProjects() {
      if (!currentUserId) return;

      try {
        setIsLoading(true);

        // Fetch all projects accessible by user (owned + collaborated)
        const allProjects = await getAllUserProjects(currentUserId);
        setProjects(allProjects);

        // Filter projects where user is collaborator (not owner)
        // This includes both public and private projects they've been invited to
        const collaboratedProjects = allProjects.filter(
          project => project.ownerId !== currentUserId
        );
        setSharedProjects(collaboratedProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [currentUserId]);

  return {
    projects,
    sharedProjects,
    paidUserCount,
    isLoading,
    setProjects,
  };
}
