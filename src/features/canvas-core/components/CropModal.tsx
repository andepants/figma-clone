/**
 * Crop Modal Component
 *
 * Modal dialog for interactive image cropping with visual drag handles.
 * Provides Apply/Cancel/Reset controls and keyboard shortcuts.
 */

import { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import { CropEditor } from './CropEditor';
import { imagePool } from '@/lib/utils/imagePool';
import type { ImageObject } from '@/types';

interface CropModalProps {
  /** Image to crop */
  image: ImageObject;
  /** Callback when crop is applied */
  onApply: (cropData: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) => void;
  /** Callback when modal is canceled */
  onCancel: () => void;
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
 *   image={selectedImage}
 *   onApply={(crop) => updateImage(crop)}
 *   onCancel={() => setShowCropModal(false)}
 * />
 * ```
 */
export function CropModal({ image, onApply, onCancel }: CropModalProps) {
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
    function handleKeyDown(e: KeyboardEvent) {
      // Escape - Cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

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
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropData]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Failed to Load Image</h2>
          <p className="text-gray-600 mb-4">Could not load the image for cropping.</p>
          <Button onClick={onCancel} variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!htmlImage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  // Check if cropped
  const isCropped =
    cropData.cropX !== 0 ||
    cropData.cropY !== 0 ||
    cropData.cropWidth !== image.naturalWidth ||
    cropData.cropHeight !== image.naturalHeight;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Crop Image</h2>
            <p className="text-sm text-gray-500 mt-0.5">Drag the handles to adjust the crop area</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Editor */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <CropEditor
            image={image}
            htmlImage={htmlImage}
            crop={cropData}
            onCropChange={setCropData}
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
              onClick={onCancel}
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
      </div>
    </div>
  );
}
