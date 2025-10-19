/**
 * useProjectAccess Hook
 *
 * Monitors project collaborators map in real-time.
 * Redirects user to /projects if removed from project.
 *
 * Uses Firebase Realtime Database to detect when current user
 * is removed from a project's collaborators map and immediately
 * disconnects them with a redirect.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { realtimeDb } from '@/lib/firebase/config'
import type { Project } from '@/types/project.types'

/**
 * Hook to monitor project access and redirect if removed
 *
 * Subscribes to project data in Firebase Realtime Database and checks
 * if current user still has access (is owner or collaborator).
 * Redirects to /projects with error message if access is revoked.
 *
 * @param projectId - Current project ID
 * @param currentUserId - Current user ID
 *
 * @example
 * ```tsx
 * function CanvasPage() {
 *   const { projectId } = useParams()
 *   const { currentUser } = useAuth()
 *
 *   // Monitor access - will redirect if removed
 *   useProjectAccess(projectId, currentUser?.uid || null)
 *
 *   return <Canvas />
 * }
 * ```
 */
export function useProjectAccess(
  projectId: string | undefined,
  currentUserId: string | null
) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUserId || !projectId) return

    // Subscribe to project in Realtime DB
    const projectRef = ref(realtimeDb, `projects/${projectId}`)

    const unsubscribe = onValue(projectRef, (snapshot) => {
      if (!snapshot.exists()) {
        // Project deleted - redirect to projects list
        navigate('/projects')
        return
      }

      const project = snapshot.val() as Project

      // Check if current user still has access
      const hasAccess =
        project.ownerId === currentUserId ||
        project.collaborators[currentUserId] === true

      if (!hasAccess) {
        // User was removed from project - redirect to projects list
        navigate('/projects')
      }
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [projectId, currentUserId, navigate])
}
