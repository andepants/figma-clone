/**
 * CreateProjectModal Component
 *
 * Modal for creating new projects.
 * All projects auto-generate starter templates (app icons + feature graphic).
 * Only available for paid users (founders tier).
 *
 * @see _docs/ux/user-flows.md - Flow 2: Paid User Journey
 */

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { validateProjectName } from '@/types/project.types';
import { cn } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isPublic: boolean) => void;
  isCreating?: boolean;
  defaultName?: string;
}

/**
 * Modal for creating new projects.
 * Validates project name and collects visibility preference.
 * All projects automatically receive starter templates.
 *
 * @example
 * ```tsx
 * <CreateProjectModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onCreate={handleCreate}
 *   isCreating={loading}
 * />
 * ```
 */
export function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
  defaultName = 'Project 1',
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select text when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use setTimeout to ensure the input is focused and visible
      setTimeout(() => {
        inputRef.current?.select();
      }, 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate project name
    const validation = validateProjectName(projectName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid project name');
      return;
    }

    // Clear error and create project
    setError('');
    onCreate(projectName, isPublic);
  };

  const handleClose = () => {
    if (!isCreating) {
      setProjectName(defaultName);
      setIsPublic(false);
      setError('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Project
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Project Name Input */}
          <div className="mb-6">
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Project Name
            </label>
            <input
              ref={inputRef}
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError('');
              }}
              placeholder="My Awesome Project"
              maxLength={100}
              disabled={isCreating}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                error ? 'border-red-500' : 'border-gray-300'
              )}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {projectName.length}/100 characters
            </p>
          </div>

          {/* Visibility Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Visibility
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Private Option */}
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                disabled={isCreating}
                className={cn(
                  'p-4 border-2 rounded-lg text-left transition-all',
                  'hover:border-blue-500 hover:bg-blue-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  !isPublic
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Private
                    </h3>
                    <p className="text-xs text-gray-600">
                      Only you and invited collaborators can access this project
                    </p>
                  </div>
                </div>
              </button>

              {/* Public Option */}
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                disabled={isCreating}
                className={cn(
                  'p-4 border-2 rounded-lg text-left transition-all',
                  'hover:border-blue-500 hover:bg-blue-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isPublic
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Public
                    </h3>
                    <p className="text-xs text-gray-600">
                      Anyone can view and collaborate on this project
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !projectName.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
