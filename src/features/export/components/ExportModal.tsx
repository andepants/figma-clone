/**
 * Export Modal Component
 *
 * Modal for configuring and triggering canvas exports.
 * Provides two clear options: Whole Canvas or Selection Only.
 * Shows side-by-side previews for both export modes.
 * Matches Figma's minimalist export workflow.
 */

import { useState, useEffect } from 'react';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';
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
  stageRef: React.RefObject<Konva.Stage | null>;
  /** Selected objects for preview */
  selectedObjects: CanvasObject[];
  /** All objects for preview */
  allObjects: CanvasObject[];
}

/**
 * ExportModal Component
 *
 * Enhanced export modal with two clear options:
 * 1. Whole Canvas - Exports everything on the canvas
 * 2. Selection Only - Exports only selected objects (ultra-precise)
 *
 * Shows side-by-side previews for both options.
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

  // Preview state (data URLs for both previews)
  const [wholeCanvasPreview, setWholeCanvasPreview] = useState<string | null>(null);
  const [selectionPreview, setSelectionPreview] = useState<string | null>(null);

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
   * Generate both previews when modal opens
   * Shows side-by-side previews for whole canvas and selection
   */
  useEffect(() => {
    if (!isOpen || !hasObjects) {
      setWholeCanvasPreview(null);
      setSelectionPreview(null);
      return;
    }

    console.log('Generating previews...', {
      hasSelection,
      selectedObjectsCount: selectedObjects.length,
      allObjectsCount: allObjects.length,
    });

    try {
      // Generate whole canvas preview
      const wholePreview = generateExportPreview(stageRef, allObjects, allObjects);
      setWholeCanvasPreview(wholePreview);
      console.log('Whole canvas preview generated:', wholePreview ? 'success' : 'failed');

      // Generate selection preview (if has selection)
      if (hasSelection && selectedObjects.length > 0) {
        const selPreview = generateExportPreview(stageRef, selectedObjects, allObjects);
        setSelectionPreview(selPreview);
        console.log('Selection preview generated:', selPreview ? 'success' : 'failed');
      } else {
        setSelectionPreview(null);
      }
    } catch (error) {
      console.error('Failed to generate previews:', error);
      setWholeCanvasPreview(null);
      setSelectionPreview(null);
    }
  }, [isOpen, hasObjects, hasSelection, stageRef, selectedObjects, allObjects]);

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
      <DialogContent className="sm:max-w-4xl p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200">
          <DialogTitle className="text-base font-semibold">Export Canvas</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">Choose what to export and configure settings</p>
        </DialogHeader>

        <div className="p-6 space-y-6" style={{ opacity: isExporting ? 0.6 : 1 }}>
          {/* Two-Option Preview Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Whole Canvas Option */}
            <button
              onClick={() => setOptions(prev => ({ ...prev, scope: 'all' }))}
              disabled={isExporting}
              className={`
                group relative flex flex-col p-4 rounded-lg border-2 transition-all
                ${options.scope === 'all'
                  ? 'border-[#0ea5e9] bg-[#0ea5e9]/5 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className={`w-4 h-4 ${options.scope === 'all' ? 'text-[#0ea5e9]' : 'text-gray-600'}`} />
                  <span className={`text-sm font-semibold ${options.scope === 'all' ? 'text-[#0ea5e9]' : 'text-gray-900'}`}>
                    Whole Canvas
                  </span>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  options.scope === 'all'
                    ? 'border-[#0ea5e9] bg-[#0ea5e9]'
                    : 'border-gray-300'
                }`}>
                  {options.scope === 'all' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="aspect-video bg-[#f5f5f5] rounded-md border border-gray-200 overflow-hidden flex items-center justify-center mb-2">
                {wholeCanvasPreview ? (
                  <img
                    src={wholeCanvasPreview}
                    alt="Whole canvas preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No preview</span>
                )}
              </div>

              <p className="text-xs text-gray-500 text-left">
                Export all {allObjects.length} object{allObjects.length !== 1 ? 's' : ''} on canvas
              </p>
            </button>

            {/* Selection Only Option */}
            <button
              onClick={() => setOptions(prev => ({ ...prev, scope: 'selection' }))}
              disabled={!hasSelection || isExporting}
              className={`
                group relative flex flex-col p-4 rounded-lg border-2 transition-all
                ${options.scope === 'selection'
                  ? 'border-[#0ea5e9] bg-[#0ea5e9]/5 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className={`w-4 h-4 ${options.scope === 'selection' ? 'text-[#0ea5e9]' : 'text-gray-600'}`} />
                  <span className={`text-sm font-semibold ${options.scope === 'selection' ? 'text-[#0ea5e9]' : 'text-gray-900'}`}>
                    Selection Only
                  </span>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  options.scope === 'selection'
                    ? 'border-[#0ea5e9] bg-[#0ea5e9]'
                    : 'border-gray-300'
                }`}>
                  {options.scope === 'selection' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="aspect-video bg-[#f5f5f5] rounded-md border border-gray-200 overflow-hidden flex items-center justify-center mb-2">
                {selectionPreview ? (
                  <img
                    src={selectionPreview}
                    alt="Selection preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : hasSelection ? (
                  <span className="text-xs text-gray-400">No preview</span>
                ) : (
                  <span className="text-xs text-gray-400">No selection</span>
                )}
              </div>

              <p className="text-xs text-gray-500 text-left">
                {hasSelection
                  ? `Export ${selectedObjects.length} selected object${selectedObjects.length !== 1 ? 's' : ''} (ultra-precise)`
                  : 'Select objects to enable'
                }
              </p>
            </button>
          </div>

          {/* Export Settings */}
          <div className="flex items-center gap-6 pt-2 border-t border-gray-200">
            {/* Scale Selection */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 min-w-[60px]">Resolution:</label>
              <div className="flex gap-1.5">
                {([1, 2, 3] as const).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setOptions(prev => ({ ...prev, scale }))}
                    disabled={isExporting}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded border
                      transition-colors
                      ${options.scale === scale
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {options.scale === 1 ? 'Standard' : options.scale === 2 ? 'High (Recommended)' : 'Ultra High'}
              </span>
            </div>

            {/* Format (always PNG for now) */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700">Format:</label>
              <span className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded border border-gray-200">
                PNG
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-5 pt-0 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded">Enter</kbd> to export
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={!hasObjects || isExporting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0ea5e9] rounded hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
