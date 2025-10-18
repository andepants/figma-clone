/**
 * Export History Tab Component
 *
 * Displays user's export history with thumbnails and action buttons.
 * Loads exports from Firestore on mount.
 */

import { useState, useEffect } from 'react';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserExportRecords, deleteExportRecord, deleteExportFromStorage, deleteAllExportRecords, type ExportRecord } from '@/lib/firebase';
import type { Timestamp } from 'firebase/firestore';

/**
 * Format Firestore timestamp to readable date
 */
function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

export function ExportHistoryTab() {
  const { currentUser } = useAuth();
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  /**
   * Handle download of export from history
   * Downloads from Storage URL for full quality
   */
  async function handleDownload(exp: ExportRecord) {
    try {
      // Download from Storage URL (not dataUrl, to get full quality)
      const link = document.createElement('a');
      link.download = exp.filename;
      link.href = exp.storageUrl;
      link.target = '_blank'; // Open in new tab (CORS workaround)
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download export');
    }
  }

  /**
   * Handle delete of single export
   * Deletes from Storage and Firestore, updates local state
   */
  async function handleDelete(exp: ExportRecord) {
    if (!currentUser) return;

    if (!confirm(`Delete export "${exp.filename}"?`)) {
      return;
    }

    try {
      // Add to deleting set (show loading state)
      setDeletingIds(prev => new Set(prev).add(exp.id));

      // Delete from Storage
      await deleteExportFromStorage(exp.storagePath);

      // Delete from Firestore
      await deleteExportRecord(currentUser.uid, exp.id);

      // Remove from local state
      setExports(prev => prev.filter(e => e.id !== exp.id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete export');
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(exp.id);
        return next;
      });
    }
  }

  /**
   * Handle delete all exports
   * Deletes all exports from Storage and Firestore
   */
  async function handleDeleteAll() {
    if (!currentUser) return;

    if (!confirm(`Delete all ${exports.length} exports? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeletingAll(true);

      // Delete all from Storage (parallel)
      await Promise.all(
        exports.map(exp => deleteExportFromStorage(exp.storagePath).catch(err => {
          console.warn(`Failed to delete ${exp.storagePath}:`, err);
          // Continue even if some fail
        }))
      );

      // Delete all from Firestore
      await deleteAllExportRecords(currentUser.uid);

      // Clear local state
      setExports([]);
    } catch (error) {
      console.error('Delete all failed:', error);
      alert('Failed to delete all exports');
    } finally {
      setIsDeletingAll(false);
    }
  }

  // Load exports on mount
  useEffect(() => {
    try {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      async function loadExports() {
        if (!currentUser) return; // Extra safety check for TypeScript

        try {
          setIsLoading(true);
          setError(null);
          const records = await getUserExportRecords(currentUser.uid);
          setExports(records);
        } catch (err) {
          console.error('Failed to load exports:', err);
          setError('Failed to load export history');
        } finally {
          setIsLoading(false);
        }
      }

      loadExports();
    } catch (err) {
      console.error('Render error in ExportHistoryTab:', err);
      setRenderError(err as Error);
    }
  }, [currentUser]);

  // Render error state - show error boundary UI
  if (renderError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-sm text-red-600 mb-2">Something went wrong</p>
        <p className="text-xs text-gray-500 mb-4">{renderError.message}</p>
        <button
          onClick={() => {
            setRenderError(null);
            setError(null);
            setIsLoading(true);
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#0ea5e9] rounded-md hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && exports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No exports yet</h3>
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Your export history will appear here after you export objects
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // History list
  return (
    <div className="p-6 max-h-[500px] overflow-y-auto">
      {/* Delete All button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleDeleteAll}
          disabled={isDeletingAll || exports.length === 0}
          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          {isDeletingAll ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              Deleting...
            </>
          ) : (
            'Delete All'
          )}
        </button>
      </div>

      {/* Export list */}
      <div className="space-y-3">
        {exports.map(exp => {
          const isDeleting = deletingIds.has(exp.id);

          return (
            <div
              key={exp.id}
              className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                <img
                  src={exp.dataUrl || exp.storageUrl}
                  alt={exp.filename}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Metadata */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {exp.filename}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {formatDate(exp.createdAt)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {exp.metadata.objectCount} objects · {exp.metadata.scale}x · {exp.metadata.width}×{exp.metadata.height}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(exp)}
                  disabled={isDeleting}
                  className="p-2 text-gray-600 hover:text-[#0ea5e9] hover:bg-gray-50 rounded transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
                  title="Download"
                  aria-label={`Download ${exp.filename}`}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exp)}
                  disabled={isDeleting}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  title="Delete"
                  aria-label={`Delete ${exp.filename}`}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
