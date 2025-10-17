/**
 * ProjectCard Component
 *
 * Displays a single project card with thumbnail, metadata, and actions.
 * Includes hover states for rename, delete, and open actions.
 *
 * @see _docs/ux/user-flows.md - Flow 3: Projects Dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, MoreVertical, Lock, Globe } from 'lucide-react';
import type { Project } from '@/types/project.types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onRename: (projectId: string, newName: string) => void;
  onDelete: (projectId: string) => void;
  onToggleVisibility?: (projectId: string, isPublic: boolean) => void;
}

/**
 * Project card with thumbnail, metadata, and hover actions.
 * Click to navigate to canvas editor. Hover for quick actions.
 *
 * @example
 * ```tsx
 * <ProjectCard
 *   project={project}
 *   onRename={handleRename}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function ProjectCard({ project, onRename, onDelete, onToggleVisibility }: ProjectCardProps) {
  const navigate = useNavigate();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [showActions, setShowActions] = useState(false);

  const handleCardClick = () => {
    if (!isRenaming) {
      navigate(`/canvas/${project.id}`);
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newName.trim() && newName !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setShowActions(false);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVisibility) {
      onToggleVisibility(project.id, !project.isPublic);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg border border-gray-200 overflow-hidden transition-all',
        'hover:shadow-lg hover:border-gray-300 cursor-pointer',
        isRenaming && 'ring-2 ring-blue-500'
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !isRenaming && setShowActions(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-300">
              <svg
                className="w-16 h-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Visibility Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm shadow-sm">
          {project.isPublic ? (
            <>
              <Globe className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Public</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Private</span>
            </>
          )}
        </div>

        {/* Hover Actions */}
        {showActions && !isRenaming && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={handleRenameClick}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Rename project"
            >
              <Pencil className="w-4 h-4 text-gray-700" />
            </button>
            {onToggleVisibility && (
              <button
                onClick={handleToggleVisibility}
                className="p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                aria-label={project.isPublic ? 'Make private' : 'Make public'}
                title={project.isPublic ? 'Make private' : 'Make public'}
              >
                {project.isPublic ? (
                  <Lock className="w-4 h-4 text-gray-700" />
                ) : (
                  <Globe className="w-4 h-4 text-blue-600" />
                )}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="p-4">
        {isRenaming ? (
          <form onSubmit={handleRename} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setNewName(project.name);
                  setIsRenaming(false);
                }
              }}
              className="w-full px-2 py-1 text-sm font-medium text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              maxLength={100}
            />
          </form>
        ) : (
          <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
            {project.name}
          </h3>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Modified {formatDate(project.updatedAt)}</span>
          <span>{project.objectCount} objects</span>
        </div>

        {/* Collaborators count (if applicable) */}
        {project.collaborators.length > 1 && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{project.collaborators.length} collaborators</span>
          </div>
        )}
      </div>
    </div>
  );
}
