/**
 * Crop Modal Component
 *
 * Modal dialog for interactive image cropping with visual drag handles.
 * Provides Apply/Cancel/Reset controls and keyboard shortcuts.
 */

import { useState, useEffect } from 'react';
import { RotateCcw, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CropEditor } from './CropEditor';
import { imagePool } from '@/lib/utils/imagePool';
import type { ImageObject } from '@/types';

interface CropModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Image to crop */
  image: ImageObject;
  /** Callback when crop is applied */
  onApply: (cropData: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) => void;
  /** Callback when modal is closed/canceled */
  onClose: () => void;
}

/**
 * CropModal Component
 *
 * Full-screen modal for cropping images with:
 * - Visual crop editor with drag handles
 * - Real-time dimension display
 * - Reset, Cancel, and Apply buttons
 * - Keyboard shortcuts (Escape, Enter, R)
 *
 * @example
 * ```tsx
 * <CropModal
 *   isOpen={isCropModalOpen}
 *   image={selectedImage}
 *   onApply={(crop) => updateImage(crop)}
 *   onClose={() => setIsCropModalOpen(false)}
 * />
 * ```
 */
export function CropModal({ isOpen, image, onApply, onClose }: CropModalProps) {
  // Load image
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Current crop values (local state, applied on "Apply" button)
  const [cropData, setCropData] = useState({
    cropX: image.cropX ?? 0,
    cropY: image.cropY ?? 0,
    cropWidth: image.cropWidth ?? image.naturalWidth,
    cropHeight: image.cropHeight ?? image.naturalHeight,
  });

  // Aspect ratio lock state
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);

  /**
   * Load image from cache
   */
  useEffect(() => {
    imagePool
      .getImage(image.src)
      .then((img) => {
        setHtmlImage(img);
        setImageLoadError(false);
      })
      .catch((error) => {
        console.error('[CropModal] Failed to load image:', error);
        setImageLoadError(true);
      });
  }, [image.src]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Escape - handled by Dialog component
      // Enter - Apply
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }

      // R - Reset
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      }

      // L - Toggle aspect ratio lock
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsAspectRatioLocked((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cropData]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Reset crop to full image
   */
  function handleReset() {
    setCropData({
      cropX: 0,
      cropY: 0,
      cropWidth: image.naturalWidth,
      cropHeight: image.naturalHeight,
    });
  }

  /**
   * Apply crop and close modal
   */
  function handleApply() {
    onApply(cropData);
  }

  // Show error if image failed to load
  if (imageLoadError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Failed to Load Image</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mb-4">Could not load the image for cropping.</p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Show loading state
  if (!htmlImage) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <p className="text-gray-600">Loading image...</p>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if cropped
  const isCropped =
    cropData.cropX !== 0 ||
    cropData.cropY !== 0 ||
    cropData.cropWidth !== image.naturalWidth ||
    cropData.cropHeight !== image.naturalHeight;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl p-0 gap-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900">Crop Image</DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">Drag the handles to adjust the crop area</p>
          </div>
        </DialogHeader>

        {/* Crop Editor */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <CropEditor
            image={image}
            htmlImage={htmlImage}
            crop={cropData}
            onCropChange={setCropData}
            keepRatio={isAspectRatioLocked}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          {/* Info row */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-4">
              <span>
                Original: <span className="font-mono">{image.naturalWidth} × {image.naturalHeight}</span>
              </span>
              <span>
                Crop: <span className="font-mono">{cropData.cropWidth} × {cropData.cropHeight}</span>
              </span>
              <button
                onClick={() => setIsAspectRatioLocked((prev) => !prev)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                title="Lock aspect ratio (L)"
              >
                {isAspectRatioLocked ? (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlocked</span>
                  </>
                )}
              </button>
            </div>
            {isCropped && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset (R)
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2"
            >
              Cancel (Esc)
            </Button>
            <Button
              onClick={handleApply}
              className="px-4 py-2"
            >
              Apply Crop (Enter)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
