/**
 * PublicProjectsSection Component
 *
 * Shows public projects user is collaborating on.
 * Appears at top of pricing page for free users.
 *
 * Returns null if no projects provided (graceful hiding).
 */

import type { Project } from '@/types/project.types';
import { ProjectCard } from './ProjectCard';

interface PublicProjectsSectionProps {
  projects: Project[];
  currentUserId: string;
}

/**
 * Section that displays public projects a user is collaborating on.
 * Shows a helpful tip about username sharing for collaboration.
 *
 * @example
 * ```tsx
 * <PublicProjectsSection projects={publicProjects} currentUserId={userId} />
 * ```
 */
export function PublicProjectsSection({ projects, currentUserId }: PublicProjectsSectionProps) {
  // Gracefully hide if no public projects
  if (projects.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Public Projects You're In
      </h2>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            currentUserId={currentUserId}
            onRename={() => {}} // No-op for read-only mode
            onDelete={() => {}} // No-op for read-only mode
            // Note: readOnly prop not yet implemented in ProjectCard
          />
        ))}
      </div>

      {/* Helpful Tip */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Others can add you to projects by sharing your username.
          Upgrade to create unlimited projects of your own.
        </p>
      </div>
    </section>
  );
}
