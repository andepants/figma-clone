/**
 * Image Section Component
 *
 * Shows image-specific properties like file info and aspect ratio lock.
 * Displays file name, size, dimensions, and provides option to replace image.
 */

import { ImageIcon, Lock, Unlock, Upload, Crop, Sparkles, Loader2 } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { Label, Button } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { useCanvasStore } from '@/stores';
import { useUIStore } from '@/stores';
import { isImageShape } from '@/types/canvas.types';
import { useState } from 'react';
import { ImageUploadModal } from '@/features/canvas-core/components/ImageUploadModal';
import { CropModal } from '@/features/canvas-core/components/CropModal';
import { updateCanvasObject } from '@/lib/firebase';
import { removeImageBackground } from '@/lib/firebase/backgroundRemovalService';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Format file size for display
 * Converts bytes to human-readable format (KB, MB)
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "234 KB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * ImageSection Component
 *
 * Displays image-specific properties:
 * - File name
 * - File size
 * - Natural dimensions (original resolution)
 * - Display dimensions (current size on canvas)
 * - Aspect ratio lock toggle
 * - Replace image button
 *
 * @example
 * ```tsx
 * <ImageSection />
 * ```
 */
export function ImageSection() {
  const shape = useSelectedShape();
  const { updateObject, projectId, createProcessedImage } = useCanvasStore();
  const { processingImages, addProcessingImage, removeProcessingImage } = useUIStore();
  const { currentUser } = useAuth();
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  if (!shape || !isImageShape(shape)) return null;

  const isProcessing = processingImages.has(shape.id);

  /**
   * Toggle aspect ratio lock
   * Maintains aspect ratio during resize when enabled
   * Syncs to Firebase for persistence
   */
  async function toggleAspectRatioLock() {
    if (!shape || !isImageShape(shape)) return;

    const newValue = !(shape.lockAspectRatio ?? true);

    // Optimistic local update (immediate)
    updateObject(shape.id, {
      lockAspectRatio: newValue,
    });

    // Sync to Firebase Realtime Database
    await updateCanvasObject(projectId, shape.id, {
      lockAspectRatio: newValue,
    });
  }

  /**
   * Handle crop apply
   * Updates image with new crop values
   * Syncs to Firebase so other users see the cropped image
   */
  async function handleCropApply(cropData: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) {
    if (!shape || !isImageShape(shape)) return;

    // Optimistic local update (immediate)
    updateObject(shape.id, cropData);

    // Sync to Firebase Realtime Database (persists and shares with collaborators)
    await updateCanvasObject(projectId, shape.id, cropData);

    setIsCropModalOpen(false);
  }

  /**
   * Handle background removal
   * Calls Firebase Function to process image through Replicate API
   * Creates new image object with processed result
   */
  async function handleRemoveBackground() {
    if (!shape || !isImageShape(shape)) return;

    // Ensure user is authenticated (required for createdBy field)
    if (!currentUser) {
      toast.error('Authentication required', {
        description: 'Please sign in to remove backgrounds',
        duration: 3000,
      });
      return;
    }

    // Mark image as processing
    addProcessingImage(shape.id);

    try {
      toast.info('Removing background...', {
        description: 'This may take 5-15 seconds',
        duration: 3000,
      });

      // Call Firebase Function to process image
      const result = await removeImageBackground(shape.src, projectId, shape.id);

      if (!result.success || !result.processedImageUrl || !result.storagePath) {
        throw new Error(result.error || 'Background removal failed');
      }

      // Get image dimensions from the processed image
      // We'll load it client-side to get naturalWidth/naturalHeight
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = result.processedImageUrl!;
      });

      // Create new image object next to original
      // This will sync to Firebase for persistence and real-time collaboration
      await createProcessedImage(shape, {
        url: result.processedImageUrl,
        storagePath: result.storagePath,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fileSize: result.fileSize || shape.fileSize,
      }, currentUser.uid);

      toast.success('Background removed!', {
        description: 'New image created next to original',
        duration: 3000,
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error('Failed to remove background', {
        description: error instanceof Error ? error.message : 'Please try again',
        duration: 5000,
      });
    } finally {
      // Remove from processing set
      removeProcessingImage(shape.id);
    }
  }

  return (
    <>
      <PropertySection
        title="Image"
        icon={<ImageIcon className="w-3.5 h-3.5" />}
        storageKey="props-image"
      >
        {/* File Info */}
        <div className="space-y-2">
          {/* File Name */}
          <div>
            <Label className="text-[11px] text-gray-600 mb-0.5 block">File</Label>
            <div className="text-[11px] text-gray-900 font-mono truncate" title={shape.fileName}>
              {shape.fileName}
            </div>
          </div>

          {/* File Size and MIME Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-600 mb-0.5 block">Size</Label>
              <div className="text-[11px] text-gray-900 font-mono">
                {formatFileSize(shape.fileSize)}
              </div>
            </div>
            <div>
              <Label className="text-[11px] text-gray-600 mb-0.5 block">Type</Label>
              <div className="text-[11px] text-gray-900 font-mono uppercase">
                {shape.mimeType.split('/')[1] || shape.mimeType}
              </div>
            </div>
          </div>

          {/* Natural Dimensions (Original Resolution) */}
          <div>
            <Label className="text-[11px] text-gray-600 mb-0.5 block">Original Size</Label>
            <div className="text-[11px] text-gray-900 font-mono">
              {shape.naturalWidth} × {shape.naturalHeight} px
            </div>
          </div>

          {/* Display Dimensions (Current Canvas Size) */}
          <div>
            <Label className="text-[11px] text-gray-600 mb-0.5 block">Display Size</Label>
            <div className="text-[11px] text-gray-900 font-mono">
              {Math.round(shape.width)} × {Math.round(shape.height)} px
            </div>
          </div>

          {/* Aspect Ratio Lock */}
          <div>
            <Label className="text-[11px] text-gray-600 mb-0.5 block">Aspect Ratio</Label>
            <Button
              variant={shape.lockAspectRatio ? 'default' : 'outline'}
              size="sm"
              className="w-full h-7 text-[11px] gap-1.5"
              onClick={toggleAspectRatioLock}
            >
              {shape.lockAspectRatio ? (
                <>
                  <Lock className="w-3 h-3" />
                  Locked
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  Unlocked
                </>
              )}
            </Button>
          </div>

          {/* Replace Image Button */}
          <div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px] gap-1.5"
              onClick={() => setIsReplaceModalOpen(true)}
            >
              <Upload className="w-3 h-3" />
              Replace Image
            </Button>
          </div>

          {/* Crop Image Button */}
          <div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px] gap-1.5"
              onClick={() => setIsCropModalOpen(true)}
            >
              <Crop className="w-3 h-3" />
              Crop Image...
            </Button>
          </div>

          {/* Remove Background Button */}
          <div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px] gap-1.5"
              onClick={handleRemoveBackground}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Remove Background
                </>
              )}
            </Button>
          </div>
        </div>
      </PropertySection>

      {/* Replace Image Modal */}
      <ImageUploadModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        position={{ x: shape.x, y: shape.y }}
      />

      {/* Crop Image Modal */}
      {isCropModalOpen && (
        <CropModal
          image={shape}
          onApply={handleCropApply}
          onCancel={() => setIsCropModalOpen(false)}
        />
      )}
    </>
  );
}
