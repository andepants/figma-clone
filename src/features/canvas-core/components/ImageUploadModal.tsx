/**
 * Image Upload Modal Component
 *
 * Modal dialog for uploading images to canvas.
 * Provides file selection interface with drag-and-drop support.
 */

import { useState, useRef, useCallback } from 'react';
import { X, Upload, ImageIcon, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';
import { createImageObject } from '../utils/imageFactory';
import { useCanvasStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

/**
 * ImageUploadModal component props
 */
interface ImageUploadModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Optional position on canvas to place image */
  position?: { x: number; y: number };
}

/**
 * Image upload modal component
 *
 * Allows users to upload images via file picker or drag-and-drop.
 * Shows upload progress and error states.
 * Creates canvas object upon successful upload.
 *
 * @param {ImageUploadModalProps} props - Component props
 * @returns {JSX.Element | null} ImageUploadModal component or null if closed
 *
 * @example
 * ```tsx
 * <ImageUploadModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   position={{ x: 100, y: 100 }}
 * />
 * ```
 */
export function ImageUploadModal({ isOpen, onClose, position }: ImageUploadModalProps) {
  const { currentUser } = useAuth();
  const { objects, addObject } = useCanvasStore();
  const { uploadImage, isUploading, uploadProgress, uploadError, cancelUpload, resetUploadState } =
    useImageUpload();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   * Uploads file and creates canvas object on success
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!currentUser) {
        return;
      }

      // Default position (center of viewport if not specified)
      const uploadPosition = position || { x: 400, y: 300 };

      // Upload image
      const uploadedData = await uploadImage(file, uploadPosition);
      if (!uploadedData) {
        return;
      }

      // Create canvas object
      const imageObject = createImageObject(uploadedData, uploadPosition, currentUser.uid, objects);

      // Add to canvas
      addObject(imageObject);

      // Close modal after successful upload
      setTimeout(() => {
        onClose();
        resetUploadState();
      }, 500); // Small delay to show success state
    },
    [currentUser, position, uploadImage, objects, addObject, onClose, resetUploadState]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle click on upload area
   * Opens file picker
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle drag over event
   * Prevents default to allow drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * Handle drop event
   * Extracts file from drop and initiates upload
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle modal close
   * Cancels upload if in progress
   */
  const handleClose = useCallback(() => {
    if (isUploading) {
      cancelUpload();
    }
    resetUploadState();
    onClose();
  }, [isUploading, cancelUpload, resetUploadState, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Image</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Area */}
          <div
            onClick={!isUploading ? handleClick : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
              isDragOver && 'border-blue-500 bg-blue-50',
              !isDragOver && !isUploading && 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
              isUploading && 'border-gray-300 bg-gray-50 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              /* Upload Progress */
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Uploading...</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{uploadProgress}%</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Cancel
                </button>
              </div>
            ) : uploadError ? (
              /* Error State */
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Upload failed</p>
                  <p className="text-xs text-red-600">{uploadError}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetUploadState();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              /* Default State */
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Drag and drop an image, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PNG, JPG, GIF, WebP, SVG (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
