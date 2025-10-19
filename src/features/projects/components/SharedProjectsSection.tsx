/**
 * SharedProjectsSection Component
 *
 * Shows all projects (public + private) that have been shared with the user.
 * Appears at top of pricing page for free users who have been invited to projects.
 *
 * Returns null if no projects provided (graceful hiding).
 */

import type { Project } from '@/types/project.types';
import { ProjectCard } from './ProjectCard';

interface SharedProjectsSectionProps {
  projects: Project[];
  currentUserId: string;
}

/**
 * Section that displays all projects a user has been invited to collaborate on.
 * Shows helpful messaging about shared projects and upgrading for own projects.
 *
 * @example
 * ```tsx
 * <SharedProjectsSection projects={sharedProjects} currentUserId={userId} />
 * ```
 */
export function SharedProjectsSection({ projects, currentUserId }: SharedProjectsSectionProps) {
  // Gracefully hide if no shared projects
  if (projects.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Projects Shared With You
      </h2>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            currentUserId={currentUserId}
            onRename={() => {}} // No-op for collaborators
            onDelete={() => {}} // No-op for collaborators
            // Note: readOnly prop not yet implemented in ProjectCard
          />
        ))}
      </div>

      {/* Helpful Messaging */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 mb-2">
          <strong>Note:</strong> These projects were shared with you by other users.
          You can collaborate on them but cannot create your own projects yet.
        </p>
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Others can add you to their projects by sharing your username.
          Upgrade below to create unlimited projects of your own.
        </p>
      </div>
    </section>
  );
}
