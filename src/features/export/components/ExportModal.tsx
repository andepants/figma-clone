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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExportOptions } from '../types';
import { generateExportPreview } from '../utils/preview';
import type Konva from 'konva';
import type { CanvasObject } from '@/types';
import { saveExportToFirebase } from '../utils/saveExport';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';
import type { ExportResult } from '@/lib/utils/export';
import { ExportHistoryTab } from './ExportHistoryTab';

/**
 * Tab types for export modal
 */
type TabType = 'export' | 'history';

export interface ExportModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback to trigger export with options */
  onExport: (options: ExportOptions) => Promise<ExportResult>;
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
  // Get current user from auth context
  const { currentUser } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('export');

  // Export options state - always export selection only
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    scale: 2,
    scope: 'selection', // Always selection - no full canvas option
    padding: 0,
  });

  // Separate padding state for input control
  const [padding, setPadding] = useState<number>(0);

  // Loading state during export - use state machine for better UX
  const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'uploading' | 'complete'>('idle');

  // Preview state (single preview of selection)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Dimension state (calculated from bounding box)
  const [dimensions, setDimensions] = useState<{
    contentWidth: number;
    contentHeight: number;
    finalWidth: number;
    finalHeight: number;
  } | null>(null);

  /**
   * Calculate dimensions from bounding box
   * Updates dimensions state based on current selection, scale, and padding
   */
  const calculateDimensions = useCallback(() => {
    if (!stageRef.current || selectedObjects.length === 0) {
      setDimensions(null);
      return;
    }

    try {
      const stage = stageRef.current;
      const layers = stage.getLayers();
      const objectsLayer = layers[1];

      if (!objectsLayer) {
        setDimensions(null);
        return;
      }

      // Get IDs of selected objects (including group descendants)
      const expandedIds = new Set<string>();
      selectedObjects.forEach(obj => {
        expandedIds.add(obj.id);
        if (obj.type === 'group') {
          const descendantIds = getAllDescendantIds(obj.id, allObjects);
          descendantIds.forEach((id: string) => expandedIds.add(id));
        }
      });

      // Find Konva nodes
      const nodesToExport: Konva.Node[] = [];
      objectsLayer.getChildren().forEach((node) => {
        const nodeId = node.id();
        if (nodeId && expandedIds.has(nodeId)) {
          nodesToExport.push(node);
        }
      });

      if (nodesToExport.length === 0) {
        setDimensions(null);
        return;
      }

      // Calculate bounding box
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodesToExport.forEach((node) => {
        const rect = node.getClientRect({
          skipTransform: false,
          skipShadow: false,
          skipStroke: false,
        });

        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);
      });

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      // Apply padding and scale
      const finalWidth = (contentWidth + padding * 2) * options.scale;
      const finalHeight = (contentHeight + padding * 2) * options.scale;

      setDimensions({
        contentWidth: Math.round(contentWidth * options.scale),
        contentHeight: Math.round(contentHeight * options.scale),
        finalWidth: Math.round(finalWidth),
        finalHeight: Math.round(finalHeight),
      });
    } catch (error) {
      console.error('Failed to calculate dimensions:', error);
      setDimensions(null);
    }
  }, [stageRef, selectedObjects, allObjects, options.scale, padding]);

  /**
   * Handle export button click
   * Calls onExport with current options, saves to Firebase, shows loading state
   */
  const handleExport = useCallback(async () => {
    if (!currentUser) {
      console.error('Cannot export: user not authenticated');
      return;
    }

    try {
      // Phase 1: Generate PNG
      setExportStatus('generating');
      const exportResult = await onExport(options);

      // Phase 2: Upload to Firebase
      setExportStatus('uploading');
      await saveExportToFirebase(currentUser.uid, exportResult);

      // Phase 3: Complete
      setExportStatus('complete');
      setActiveTab('history');

      // Close modal after short delay (user sees History tab first)
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      // Error handling done by parent (CanvasPage shows alert)
      console.error('Export failed:', error);
      setExportStatus('idle'); // Reset on error
    }
  }, [options, onExport, onClose, currentUser, setActiveTab]);

  /**
   * Reset options and tab when modal opens or closes
   * This ensures clean state for each export session
   */
  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset state when closing (critical for next export)
      setExportStatus('idle');
      setActiveTab('export');
      onClose();
    } else {
      // Reset to Export tab when opening
      setActiveTab('export');

      // Reset export status to idle (fixes loading state bug on reopen)
      setExportStatus('idle');

      // Reset to defaults when opening
      setOptions({
        format: 'png',
        scale: 2,
        scope: 'selection',
        padding: 0,
      });
      setPadding(0);
      setDimensions(null);
    }
  }

  /**
   * Update padding value in options when padding state changes
   */
  useEffect(() => {
    setOptions(prev => ({ ...prev, padding }));
  }, [padding]);


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
      setDimensions(null);
      return;
    }

    try {
      // Generate selection preview at current export scale with padding
      // This ensures preview matches final export quality
      const preview = generateExportPreview(stageRef, selectedObjects, allObjects, options.scale, padding);

      // Cleanup: revoke old preview URL before setting new one
      if (previewUrl && previewUrl !== preview) {
        setPreviewUrl(null);
      }

      setPreviewUrl(preview);

      // Calculate dimensions for display
      calculateDimensions();
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreviewUrl(null);
      setDimensions(null);
    }
  }, [isOpen, hasSelection, selectedObjects, allObjects, stageRef, options.scale, padding, previewUrl, calculateDimensions]);

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
   * Handle keyboard shortcuts
   * - Enter: trigger export (when on Export tab and idle)
   * - Cmd/Ctrl+1: switch to Export tab
   * - Cmd/Ctrl+2: switch to History tab
   */
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Enter to export (only on Export tab when idle)
      if (event.key === 'Enter' && activeTab === 'export' && hasSelection && exportStatus === 'idle') {
        event.preventDefault();
        handleExport();
        return;
      }

      // Cmd/Ctrl+1 for Export tab
      if ((event.metaKey || event.ctrlKey) && event.key === '1') {
        event.preventDefault();
        setActiveTab('export');
        return;
      }

      // Cmd/Ctrl+2 for History tab
      if ((event.metaKey || event.ctrlKey) && event.key === '2') {
        event.preventDefault();
        setActiveTab('history');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, hasSelection, exportStatus, handleExport]);

  // Empty state when no selection
  if (!hasSelection) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Export Selection</DialogTitle>
            <DialogDescription>
              Select objects on the canvas to export them
            </DialogDescription>
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
        {/* Header with Tab Navigation */}
        <DialogHeader className="px-6 pt-5 pb-0 border-b border-gray-200">
          <DialogTitle className="text-sm font-medium mb-3">Export Selection</DialogTitle>
          <DialogDescription className="sr-only">
            Export your selected objects as PNG images with configurable resolution
          </DialogDescription>

          {/* Tab Navigation */}
          <div className="flex gap-1 -mb-px" role="tablist" aria-label="Export options">
            <button
              role="tab"
              aria-selected={activeTab === 'export'}
              aria-controls="export-panel"
              id="export-tab"
              onClick={() => setActiveTab('export')}
              className={`
                px-4 py-2 text-xs font-medium transition-colors
                border-b-2 hover:text-gray-900
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2
                ${activeTab === 'export'
                  ? 'border-[#0ea5e9] text-[#0ea5e9]'
                  : 'border-transparent text-gray-500'
                }
              `}
            >
              Export
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="history-panel"
              id="history-tab"
              onClick={() => setActiveTab('history')}
              className={`
                px-4 py-2 text-xs font-medium transition-colors
                border-b-2 hover:text-gray-900
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2
                ${activeTab === 'history'
                  ? 'border-[#0ea5e9] text-[#0ea5e9]'
                  : 'border-transparent text-gray-500'
                }
              `}
            >
              History
            </button>
          </div>
        </DialogHeader>

        {/* Tab Content */}
        {activeTab === 'export' ? (
          <div role="tabpanel" id="export-panel" aria-labelledby="export-tab">
            {/* Preview Section */}
            <div className="p-6" style={{ opacity: exportStatus !== 'idle' ? 0.5 : 1 }} aria-busy={exportStatus !== 'idle'}>
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

              {/* Dimension Display */}
              {dimensions && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-600">
                    {padding > 0 ? (
                      <>
                        Content: <span className="font-medium text-gray-900">{dimensions.contentWidth} × {dimensions.contentHeight} px</span>
                        {' '}&rarr;{' '}
                        Export: <span className="font-medium text-gray-900">{dimensions.finalWidth} × {dimensions.finalHeight} px</span>
                        {' '}
                        <span className="text-gray-500">({padding}px padding)</span>
                      </>
                    ) : (
                      <span className="font-medium text-gray-900">{dimensions.contentWidth} × {dimensions.contentHeight} px</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Settings Section */}
            <div className="px-6 pb-6 space-y-4" style={{ pointerEvents: exportStatus !== 'idle' ? 'none' : 'auto' }}>
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
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2
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

              {/* Padding */}
              <div className="space-y-2">
                <label htmlFor="padding-input" className="text-xs font-medium text-gray-700">Padding</label>
                <div className="relative">
                  <input
                    id="padding-input"
                    type="number"
                    min="0"
                    max="200"
                    value={padding}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 0 && value <= 200) {
                        setPadding(value);
                      } else if (e.target.value === '') {
                        setPadding(0);
                      }
                    }}
                    className="w-full h-10 px-3 pr-10 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9]"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                    px
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Transparent space around content (0-200px)
                </p>
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
                    disabled={exportStatus !== 'idle'}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exportStatus !== 'idle'}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0ea5e9] rounded-md hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                    aria-busy={exportStatus !== 'idle'}
                    aria-label={
                      exportStatus === 'generating' ? 'Generating PNG file' :
                      exportStatus === 'uploading' ? 'Uploading to Firebase' :
                      exportStatus === 'complete' ? 'Export complete' :
                      'Export selection as PNG'
                    }
                  >
                    {exportStatus === 'generating' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Generating...
                      </>
                    ) : exportStatus === 'uploading' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Uploading...
                      </>
                    ) : exportStatus === 'complete' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Complete!
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
          </div>
        ) : (
          <div role="tabpanel" id="history-panel" aria-labelledby="history-tab">
            <ExportHistoryTab />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
