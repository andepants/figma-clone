/**
 * useCanvasDropzone Hook
 *
 * React hook for handling drag-and-drop image uploads on canvas.
 * Integrates react-dropzone with canvas coordinate system.
 * Features:
 * - Accept image files only
 * - Calculate drop position in canvas coordinates
 * - Visual feedback during drag-over
 * - Automatic upload on drop
 */

import { useCallback } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { useImageUpload } from './useImageUpload';
import { createImageObject } from '../utils/imageFactory';
import { useCanvasStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import type Konva from 'konva';

/**
 * Hook options
 */
export interface UseCanvasDropzoneOptions {
  /** Konva stage ref for coordinate conversion */
  stageRef: React.RefObject<Konva.Stage | null>;
  /** Whether dropzone is disabled */
  disabled?: boolean;
  /** Project/canvas ID for Firebase storage (defaults to 'main' for legacy support) */
  projectId?: string;
}

/**
 * Hook return type
 */
export interface UseCanvasDropzoneReturn {
  /** react-dropzone props to spread on drop target */
  getRootProps: () => ReturnType<ReturnType<typeof useDropzone>['getRootProps']>;
  /** react-dropzone props for input element */
  getInputProps: () => ReturnType<ReturnType<typeof useDropzone>['getInputProps']>;
  /** Whether drag is currently over drop zone */
  isDragActive: boolean;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Upload progress (0-100) */
  uploadProgress: number;
  /** Upload error message */
  uploadError: string | null;
}

/**
 * Hook for canvas drag-and-drop image uploads
 *
 * Provides drag-and-drop functionality for uploading images to canvas.
 * Calculates drop position in canvas coordinates accounting for zoom and pan.
 * Only accepts image files (PNG, JPG, GIF, WebP, SVG).
 *
 * @param {UseCanvasDropzoneOptions} options - Hook options
 * @returns {UseCanvasDropzoneReturn} Dropzone props and state
 *
 * @example
 * ```tsx
 * function CanvasStage({ stageRef }: { stageRef: React.RefObject<Konva.Stage> }) {
 *   const { getRootProps, getInputProps, isDragActive, isUploading, uploadProgress } =
 *     useCanvasDropzone({ stageRef });
 *
 *   return (
 *     <div {...getRootProps()}>
 *       <input {...getInputProps()} />
 *       {isDragActive && <div>Drop image here...</div>}
 *       {isUploading && <div>Uploading: {uploadProgress}%</div>}
 *       <Stage ref={stageRef}>...</Stage>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCanvasDropzone({
  stageRef,
  disabled = false,
  projectId = 'main',
}: UseCanvasDropzoneOptions): UseCanvasDropzoneReturn {
  const { currentUser } = useAuth();
  const { objects, addObject } = useCanvasStore();
  const { uploadImage, isUploading, uploadProgress, uploadError } = useImageUpload({ projectId });

  /**
   * Convert screen coordinates to canvas coordinates
   * Accounts for stage zoom, pan, and container offset
   *
   * @param screenX - Screen X coordinate (from drop event)
   * @param screenY - Screen Y coordinate (from drop event)
   * @returns Canvas coordinates { x, y } or null if stage not available
   */
  const screenToCanvasCoords = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } | null => {
      const stage = stageRef.current;
      if (!stage) return null;

      // Get stage container position
      const container = stage.container();
      const rect = container.getBoundingClientRect();

      // Convert to stage coordinates (relative to container)
      const stageX = screenX - rect.left;
      const stageY = screenY - rect.top;

      // Get stage transform (zoom + pan)
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();

      // Transform to canvas coordinates
      const canvasPos = transform.point({ x: stageX, y: stageY });

      return {
        x: Math.round(canvasPos.x),
        y: Math.round(canvasPos.y),
      };
    },
    [stageRef]
  );

  /**
   * Handle file drop
   * Uploads file and creates canvas object at drop position
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[], _fileRejections: unknown, event: { clientX?: number; clientY?: number }) => {
      if (!currentUser) {
        console.error('User not authenticated');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Calculate drop position in canvas coordinates
      // Use center of viewport if drop position not available (e.g., file dialog upload)
      let position: { x: number; y: number };

      if (event?.clientX && event?.clientY) {
        // Drop event - use drop position
        const canvasPos = screenToCanvasCoords(event.clientX, event.clientY);
        position = canvasPos || { x: 400, y: 300 };
      } else {
        // File dialog - use center of canvas viewport
        position = { x: 400, y: 300 };
      }

      // Upload image
      const uploadedData = await uploadImage(file, position);
      if (!uploadedData) {
        return;
      }

      // Create canvas object
      const imageObject = createImageObject(uploadedData, position, currentUser.uid, objects);

      // Add to canvas store (optimistic update)
      addObject(imageObject);

      // Sync to Realtime Database (same pattern as rectangles/circles)
      // This ensures the image persists and can be moved/edited
      const { addCanvasObject } = await import('@/lib/firebase');
      try {
        await addCanvasObject(projectId, imageObject);
      } catch (error) {
        console.error('Failed to sync image to Firebase:', error);
        // Rollback optimistic update on error
        const { removeObject } = useCanvasStore.getState();
        removeObject(imageObject.id);
      }
    },
    [currentUser, screenToCanvasCoords, uploadImage, objects, addObject, projectId]
  );

  /**
   * Dropzone configuration
   */
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    disabled: disabled || isUploading,
    noClick: true, // Prevent opening file dialog on click (handled by toolbar button)
    noKeyboard: true, // Prevent keyboard activation
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isUploading,
    uploadProgress,
    uploadError,
  };
}
