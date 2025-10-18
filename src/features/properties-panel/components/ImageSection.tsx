/**
 * Image Section Component
 *
 * Shows image-specific properties like file info and aspect ratio lock.
 * Displays file name, size, dimensions, and provides option to replace image.
 */

import { ImageIcon, Lock, Unlock, Upload, Crop } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { Label, Button } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { useCanvasStore } from '@/stores';
import { isImageShape } from '@/types/canvas.types';
import { useState } from 'react';
import { ImageUploadModal } from '@/features/canvas-core/components/ImageUploadModal';
import { CropModal } from '@/features/canvas-core/components/CropModal';

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
  const { updateObject } = useCanvasStore();
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  if (!shape || !isImageShape(shape)) return null;

  /**
   * Toggle aspect ratio lock
   * Maintains aspect ratio during resize when enabled
   */
  function toggleAspectRatioLock() {
    if (!shape || !isImageShape(shape)) return;
    updateObject(shape.id, {
      lockAspectRatio: !(shape.lockAspectRatio ?? true),
    });
  }

  /**
   * Handle crop apply
   * Updates image with new crop values
   */
  function handleCropApply(cropData: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) {
    if (!shape || !isImageShape(shape)) return;
    updateObject(shape.id, cropData);
    setIsCropModalOpen(false);
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
