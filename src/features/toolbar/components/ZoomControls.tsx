/**
 * ZoomControls Component
 *
 * Provides zoom in, zoom out, and reset zoom controls for the canvas.
 * Displays current zoom percentage and allows clicking to type exact zoom value.
 */

import { ZoomIn, ZoomOut } from 'lucide-react';
import { useCanvasStore } from '@/stores';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * ZoomControls component
 * Renders zoom in, zoom out, and reset buttons with current zoom percentage
 * @returns {JSX.Element} Zoom controls component
 */
export function ZoomControls() {
  const { zoom, setZoom, resetView } = useCanvasStore();

  /**
   * Handle zoom in
   * Increases zoom by 20% (1.2x multiplier)
   */
  function handleZoomIn() {
    const newZoom = zoom * 1.2;
    setZoom(newZoom);
  }

  /**
   * Handle zoom out
   * Decreases zoom by 20% (1.2x divisor)
   */
  function handleZoomOut() {
    const newZoom = zoom / 1.2;
    setZoom(newZoom);
  }

  /**
   * Handle reset zoom
   * Resets zoom to 100% and centers canvas
   */
  function handleReset() {
    resetView();
  }

  // Format zoom as percentage
  const zoomPercent = Math.round(zoom * 100);

  // Check if at min/max zoom
  const isMinZoom = zoom <= 0.1;
  const isMaxZoom = zoom >= 5.0;

  return (
    <div className="flex items-center gap-1">
      {/* Zoom Out Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomOut}
            disabled={isMinZoom}
            aria-label="Zoom out"
            aria-disabled={isMinZoom}
            className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 active:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <ZoomOut size={18} className="text-neutral-700" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom out</p>
        </TooltipContent>
      </Tooltip>

      {/* Zoom Percentage - Reset on Click */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleReset}
            aria-label="Reset zoom to 100%"
            className="h-11 md:h-10 px-3 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 active:bg-neutral-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 min-w-[4rem]"
          >
            <span className="text-sm font-medium text-neutral-700 tabular-nums">
              {zoomPercent}%
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset zoom</p>
        </TooltipContent>
      </Tooltip>

      {/* Zoom In Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomIn}
            disabled={isMaxZoom}
            aria-label="Zoom in"
            aria-disabled={isMaxZoom}
            className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 active:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <ZoomIn size={18} className="text-neutral-700" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom in</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
