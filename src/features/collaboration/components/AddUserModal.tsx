/**
 * AddUserModal Component
 *
 * Modal for adding collaborators to a project by email or username.
 * Shows search input, found user preview, and add button.
 * Validates user exists and is not already a collaborator.
 *
 * @see src/lib/firebase/authService.ts - findUserByEmailOrUsername
 * @see src/lib/firebase/projectsService.ts - addCollaborator
 */

import { useState, useRef, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { findUserByEmailOrUsername } from '@/lib/firebase';
import { addCollaborator } from '@/lib/firebase';
import { UserAvatar } from './UserAvatar';
import { getUserColor } from '../utils';
import { cn } from '@/lib/utils';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentCollaborators: Record<string, boolean>; // Map of userId -> true for existing collaborators
  onUserAdded: () => void; // Callback after successful add
}

/**
 * Modal for adding collaborators to a project.
 * Searches for users by email or username, displays preview, and adds to project.
 *
 * @example
 * ```tsx
 * <AddUserModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   projectId={project.id}
 *   currentCollaborators={project.collaborators}
 *   onUserAdded={() => console.log('User added')}
 * />
 * ```
 */
export function AddUserModal({
  isOpen,
  onClose,
  projectId,
  currentCollaborators,
  onUserAdded,
}: AddUserModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<{
    uid: string;
    username: string;
    email: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFoundUser(null);
      setError('');
      setIsSearching(false);
      setIsAdding(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter an email or username');
      return;
    }

    setIsSearching(true);
    setError('');
    setFoundUser(null);

    try {
      const user = await findUserByEmailOrUsername(searchQuery.trim());

      if (!user) {
        setError('User not found');
        setIsSearching(false);
        return;
      }

      // Check if user is already a collaborator
      if (currentCollaborators[user.uid] === true) {
        setError('User is already a collaborator on this project');
        setIsSearching(false);
        return;
      }

      // User found and not a collaborator
      setFoundUser(user);
      setError('');
    } catch (err) {
      console.error('Error searching for user:', err);
      setError('Failed to search for user. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async () => {
    if (!foundUser) return;

    setIsAdding(true);
    setError('');

    try {
      await addCollaborator(projectId, foundUser.uid);
      onUserAdded(); // Notify parent component
      onClose(); // Close modal
    } catch (err) {
      console.error('Error adding collaborator:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add user. Please try again.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isSearching && !isAdding) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Collaborator
          </h2>
          <button
            onClick={handleClose}
            disabled={isSearching || isAdding}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <label
              htmlFor="user-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email or Username
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="user-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setError('');
                  setFoundUser(null);
                }}
                placeholder="user@example.com or username"
                disabled={isSearching || isAdding}
                className={cn(
                  'flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  error && !foundUser ? 'border-red-500' : 'border-gray-300'
                )}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isSearching || isAdding || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </form>

          {/* Found User Preview */}
          {foundUser && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                User Found
              </h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <UserAvatar
                  username={foundUser.username}
                  color={getUserColor(foundUser.uid)}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {foundUser.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {foundUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSearching || isAdding}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddUser}
              disabled={!foundUser || isSearching || isAdding}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add to Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
