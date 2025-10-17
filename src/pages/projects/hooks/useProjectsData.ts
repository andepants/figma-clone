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
  getUserProjects,
  getPublicProjectsForUser,
  getFoundersDealConfig,
} from '@/lib/firebase';
import type { Project } from '@/types/project.types';

interface UseProjectsDataReturn {
  /** User's owned projects (paid users only) */
  projects: Project[];
  /** Public/collaborative projects (free users) */
  publicProjects: Project[];
  /** Number of users who have paid for founders offer */
  paidUserCount: number;
  /** Loading state for initial data fetch */
  isLoading: boolean;
  /** Update projects state */
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  /** Update public projects state */
  setPublicProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

/**
 * Fetches and manages projects data for current user.
 *
 * Behavior:
 * - Paid users: fetch owned projects
 * - Free users: fetch public/collaborative projects
 * - Always fetches founders deal configuration
 *
 * @param currentUserId - Current user's ID (null if not authenticated)
 * @param canCreateProjects - Whether user has paid subscription
 * @returns Projects data and loading state
 *
 * @example
 * ```tsx
 * const { projects, publicProjects, isLoading, paidUserCount } = useProjectsData(
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

  // Fetch user's projects based on subscription status
  useEffect(() => {
    async function fetchProjects() {
      if (!currentUserId) return;

      try {
        setIsLoading(true);

        if (canCreateProjects) {
          // Paid user: fetch owned projects
          const userProjects = await getUserProjects(currentUserId);
          setProjects(userProjects);
          setPublicProjects([]); // Clear public projects
        } else {
          // Free user: fetch public projects they're in
          const collabProjects = await getPublicProjectsForUser(currentUserId);
          setPublicProjects(collabProjects);
          setProjects([]); // No owned projects
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [currentUserId, canCreateProjects]);

  return {
    projects,
    publicProjects,
    paidUserCount,
    isLoading,
    setProjects,
    setPublicProjects,
  };
}
