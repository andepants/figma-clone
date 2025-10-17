/**
 * Upload Progress Component
 *
 * Displays upload progress bar with percentage and file name.
 */

import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

interface UploadProgressProps {
  /** File name being uploaded */
  fileName: string;
  /** Upload progress (0-100) */
  progress: number;
  /** Whether upload is active */
  isUploading: boolean;
  /** Optional cancel callback */
  onCancel?: () => void;
}

/**
 * Upload progress bar component
 */
export function UploadProgress({ fileName, progress, isUploading, onCancel }: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-lg border border-gray-200 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          <span className="text-sm font-medium text-gray-900">Uploading image...</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cancel upload"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-3 truncate" title={fileName}>
        {fileName}
      </p>

      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full bg-sky-500 transition-all duration-300 ease-out",
            progress === 100 && "bg-green-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2 text-right">
        {progress.toFixed(0)}%
      </p>
    </div>
  );
}
