/**
 * Export Modal Component
 *
 * Modal for configuring and triggering canvas exports.
 * Provides options for format, resolution, and scope with live preview.
 * Matches Figma's minimalist export workflow.
 */

import { useState, useEffect } from 'react';
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
  /** Whether canvas has any objects */
  hasObjects: boolean;
  /** Stage ref for preview generation */
  stageRef: React.RefObject<Konva.Stage>;
  /** Selected objects for preview */
  selectedObjects: CanvasObject[];
  /** All objects for preview */
  allObjects: CanvasObject[];
}

/**
 * ExportModal Component
 *
 * Minimalist export configuration modal with live preview.
 * Allows users to customize export settings and see preview before downloading.
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
  hasObjects,
  stageRef,
  selectedObjects,
  allObjects,
}: ExportModalProps) {
  // Export options state
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    scale: 2,
    scope: hasSelection ? 'selection' : 'all',
  });

  // Loading state during export
  const [isExporting, setIsExporting] = useState(false);

  // Preview state (data URL of low-quality preview)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Handle export button click
   * Calls onExport with current options, shows loading state
   */
  async function handleExport() {
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
  }

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
        scope: hasSelection ? 'selection' : 'all',
      });
    }
  }

  /**
   * Generate preview when options change or modal opens
   * Uses low-quality settings for fast preview generation
   */
  useEffect(() => {
    if (!isOpen || !hasObjects) {
      setPreviewUrl(null);
      return;
    }

    try {
      const preview = generateExportPreview(
        stageRef,
        options.scope === 'selection' ? selectedObjects : allObjects,
        allObjects
      );
      setPreviewUrl(preview);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreviewUrl(null);
    }
  }, [isOpen, options.scope, hasObjects, stageRef, selectedObjects, allObjects]);

  /**
   * Handle Enter key to trigger export
   * Only when modal is open and export is possible
   */
  useEffect(() => {
    if (!isOpen || !hasObjects || isExporting) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleExport();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasObjects, isExporting]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-200">
          <DialogTitle className="text-sm font-medium">Export</DialogTitle>
        </DialogHeader>

        {/* Main content: preview + options */}
        <div className="flex gap-4 p-4" style={{ opacity: isExporting ? 0.6 : 1 }}>
          {/* Preview (left side) */}
          <div className="flex-shrink-0 w-64">
            <div className="aspect-video bg-[#f5f5f5] rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-400">No preview</span>
              )}
            </div>
          </div>

          {/* Options (right side) */}
          <div className="flex-1 space-y-3" style={{ pointerEvents: isExporting ? 'none' : 'auto' }}>
            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Format</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOptions(prev => ({ ...prev, format: 'png' }))}
                  className={`
                    flex-1 px-2.5 py-1.5 text-xs font-medium rounded border
                    transition-colors
                    ${options.format === 'png'
                      ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  PNG
                </button>
              </div>
            </div>

            {/* Scale/Resolution Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Scale</label>
              <div className="flex gap-1.5">
                {([1, 2, 3] as const).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setOptions(prev => ({ ...prev, scale }))}
                    className={`
                      flex-1 px-2.5 py-1.5 text-xs font-medium rounded border
                      transition-colors
                      ${options.scale === scale
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Contents</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOptions(prev => ({ ...prev, scope: 'selection' }))}
                  disabled={!hasSelection}
                  className={`
                    flex-1 px-2.5 py-1.5 text-xs font-medium rounded border
                    transition-colors
                    ${options.scope === 'selection'
                      ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                  `}
                >
                  Selection
                </button>
                <button
                  onClick={() => setOptions(prev => ({ ...prev, scope: 'all' }))}
                  className={`
                    flex-1 px-2.5 py-1.5 text-xs font-medium rounded border
                    transition-colors
                    ${options.scope === 'all'
                      ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-4 pb-4 pt-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!hasObjects || isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0ea5e9] rounded hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
