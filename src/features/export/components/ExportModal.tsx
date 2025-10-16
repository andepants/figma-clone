/**
 * Export Modal Component
 *
 * Ultra-clean export interface inspired by Figma's design principles.
 * Focuses exclusively on exporting selected objects with precision.
 * Shows live preview and minimal, functional controls.
 *
 * Design Principles:
 * - Minimalist: Only essential controls
 * - Focused: Selection-only export (no full canvas clutter)
 * - Visual: Large, clear preview of what will be exported
 * - Fast: Real-time preview updates, keyboard shortcuts
 */

import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExportOptions } from '../types';
import { generateExportPreview } from '../utils/preview';
import type Konva from 'konva';
import type { CanvasObject } from '@/types';

export interface ExportModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback to trigger export with options */
  onExport: (options: ExportOptions) => Promise<void>;
  /** Whether user has objects selected */
  hasSelection: boolean;
  /** Stage ref for preview generation */
  stageRef: React.RefObject<Konva.Stage | null>;
  /** Selected objects for preview */
  selectedObjects: CanvasObject[];
  /** All objects for preview */
  allObjects: CanvasObject[];
}

/**
 * ExportModal Component
 *
 * Ultra-clean, Figma-inspired export modal.
 * Only exports selected objects - keeps it simple and precise.
 *
 * @param {ExportModalProps} props - Component props
 * @returns {JSX.Element} Export modal dialog
 *
 * @example
 * ```tsx
 * <ExportModal
 *   isOpen={isExportModalOpen}
 *   onClose={() => setIsExportModalOpen(false)}
 *   onExport={handleExportWithOptions}
 *   hasSelection={selectedIds.length > 0}
 *   hasObjects={objects.length > 0}
 *   stageRef={stageRef}
 *   selectedObjects={selectedObjects}
 *   allObjects={objects}
 * />
 * ```
 */
export function ExportModal({
  isOpen,
  onClose,
  onExport,
  hasSelection,
  stageRef,
  selectedObjects,
  allObjects,
}: ExportModalProps) {
  // Export options state - always export selection only
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    scale: 2,
    scope: 'selection', // Always selection - no full canvas option
  });

  // Loading state during export
  const [isExporting, setIsExporting] = useState(false);

  // Preview state (single preview of selection)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Handle export button click
   * Calls onExport with current options, shows loading state
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onClose(); // Close modal on success
    } catch (error) {
      // Error handling done by parent (CanvasPage shows alert)
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [options, onExport, onClose]);

  /**
   * Reset options when modal opens
   */
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    } else {
      // Reset to defaults when opening
      setOptions({
        format: 'png',
        scale: 2,
        scope: 'selection',
      });
    }
  }

  /**
   * Generate preview when modal opens or selection changes
   * Shows real-time preview of selected objects
   * Cleans up old preview URLs to prevent memory leaks
   */
  useEffect(() => {
    if (!isOpen || !hasSelection || selectedObjects.length === 0) {
      // Cleanup: revoke old preview URL to free memory
      if (previewUrl) {
        setPreviewUrl(null);
      }
      return;
    }

    const isDev = import.meta.env.DEV;

    if (isDev) {
      console.log('Generating selection preview...', {
        selectedObjectsCount: selectedObjects.length,
      });
    }

    try {
      // Generate selection preview at current export scale
      // This ensures preview matches final export quality
      const preview = generateExportPreview(stageRef, selectedObjects, allObjects, options.scale);

      // Cleanup: revoke old preview URL before setting new one
      if (previewUrl && previewUrl !== preview) {
        setPreviewUrl(null);
      }

      setPreviewUrl(preview);
      if (isDev) console.log('Preview generated:', preview ? 'success' : 'failed');
    } catch (error) {
      if (isDev) console.error('Failed to generate preview:', error);
      setPreviewUrl(null);
    }
  }, [isOpen, hasSelection, selectedObjects, allObjects, stageRef, options.scale, previewUrl]);

  /**
   * Cleanup preview URL on unmount
   * Prevents memory leaks from base64 data URLs
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        setPreviewUrl(null);
      }
    };
  }, [previewUrl]);

  /**
   * Handle Enter key to trigger export
   * Only when modal is open and has selection
   */
  useEffect(() => {
    if (!isOpen || !hasSelection || isExporting) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleExport();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasSelection, isExporting, handleExport]);

  // Empty state when no selection
  if (!hasSelection) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Export Selection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No selection</h3>
            <p className="text-xs text-gray-500 text-center max-w-xs">
              Select objects on the canvas to export them as PNG
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200">
          <DialogTitle className="text-sm font-medium">Export Selection</DialogTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedObjects.length} object{selectedObjects.length !== 1 ? 's' : ''} selected
          </p>
        </DialogHeader>

        {/* Preview Section */}
        <div className="p-6" style={{ opacity: isExporting ? 0.5 : 1 }} aria-busy={isExporting}>
          <div className="bg-[#f5f5f5] rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '400px' }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Export preview"
                className="max-w-full max-h-full object-contain p-4"
                aria-label={`Preview of ${selectedObjects.length} selected object${selectedObjects.length !== 1 ? 's' : ''}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400" role="status" aria-live="polite">
                <Download className="w-12 h-12" />
                <span className="text-xs">Generating preview...</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="px-6 pb-6 space-y-4" style={{ pointerEvents: isExporting ? 'none' : 'auto' }}>
          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Resolution</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(scale => (
                <button
                  key={scale}
                  onClick={() => setOptions(prev => ({ ...prev, scale }))}
                  className={`
                    flex-1 px-4 py-2.5 text-xs font-medium rounded-md border transition-all
                    ${options.scale === scale
                      ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-semibold">{scale}x</span>
                    <span className="text-[10px] opacity-75">
                      {scale === 1 ? 'Standard' : scale === 2 ? 'Recommended' : 'Ultra'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Format</label>
            <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-md">
              <span className="text-xs text-gray-600">PNG (Transparent)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-300 rounded shadow-sm">⏎</kbd> to export
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0ea5e9] rounded-md hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-busy={isExporting}
                aria-label={isExporting ? 'Exporting PNG file' : 'Export selection as PNG'}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Export PNG
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
