/**
 * Page Section Component
 *
 * Displays page settings in the default right panel layout:
 * - Background color picker
 * - Opacity slider with eye icon
 *
 * Only visible when no shape is selected.
 */

import { Eye } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { usePageStore } from '@/stores';

/**
 * PageSection Component
 *
 * Renders page configuration controls for background, opacity, and export settings.
 *
 * @example
 * ```tsx
 * <PageSection />
 * ```
 */
export function PageSection() {
  const { pageSettings, setBackgroundColor, setOpacity } =
    usePageStore();

  return (
    <div className="px-3 py-2 space-y-2 border-b border-gray-200">
      <h3 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
        Page
      </h3>

      {/* Background Color Picker */}
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] text-gray-500 min-w-[60px]">Background</label>
        <input
          type="color"
          value={pageSettings.backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          className="h-6 w-12 rounded border-0 cursor-pointer"
        />
        <span className="text-[11px] text-gray-600 font-mono">
          {pageSettings.backgroundColor.toUpperCase()}
        </span>
      </div>

      {/* Opacity Slider */}
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] text-gray-500 min-w-[60px]">Opacity</label>
        <Slider
          value={[pageSettings.opacity]}
          onValueChange={([value]) => setOpacity(value)}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-[11px] text-gray-600 min-w-[35px]">
          {pageSettings.opacity}%
        </span>
        <Eye className="w-3.5 h-3.5 text-gray-400" />
      </div>
    </div>
  );
}
