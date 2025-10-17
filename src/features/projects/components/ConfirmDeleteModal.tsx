/**
 * ConfirmDeleteModal Component
 *
 * Confirmation modal for destructive delete actions.
 * Prevents accidental project deletions.
 *
 * @see _docs/ux/error-catalog.md
 */

import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

/**
 * Confirmation modal for deleting projects.
 * Shows project name and requires explicit confirmation.
 *
 * @example
 * ```tsx
 * <ConfirmDeleteModal
 *   isOpen={showConfirm}
 *   projectName={project.name}
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 *   isDeleting={loading}
 * />
 * ```
 */
export function ConfirmDeleteModal({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        {/* Content */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Delete Project?
        </h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{projectName}</span>? This action
          cannot be undone. All canvas objects will be permanently deleted.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
