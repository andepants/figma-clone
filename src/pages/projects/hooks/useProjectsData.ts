/**
 * useProjectsData Hook
 *
 * Manages data fetching for projects page:
 * - User's owned projects (for paid users)
 * - Public/collaborative projects (for free users)
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
  /** Public/collaborative projects (deprecated - kept for backwards compatibility) */
  publicProjects: Project[];
  /** Number of users who have paid for founders offer */
  paidUserCount: number;
  /** Loading state for initial data fetch */
  isLoading: boolean;
  /** Update projects state */
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  /** Update public projects state (deprecated - kept for backwards compatibility) */
  setPublicProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

/**
 * Fetches and manages projects data for current user.
 *
 * Behavior:
 * - Fetches all projects accessible by user (owned + collaborated)
 * - Always fetches founders deal configuration
 * - canCreateProjects parameter kept for backwards compatibility but not used
 *
 * @param currentUserId - Current user's ID (null if not authenticated)
 * @param canCreateProjects - (Deprecated) Kept for backwards compatibility
 * @returns Projects data and loading state
 *
 * @example
 * ```tsx
 * const { projects, isLoading, paidUserCount } = useProjectsData(
 *   currentUser?.uid || null,
 *   canCreateProjects
 * );
 * ```
 */
export function useProjectsData(
  currentUserId: string | null,
  canCreateProjects: boolean
): UseProjectsDataReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
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
        setPublicProjects([]); // Clear deprecated public projects
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
    publicProjects,
    paidUserCount,
    isLoading,
    setProjects,
    setPublicProjects,
  };
}
