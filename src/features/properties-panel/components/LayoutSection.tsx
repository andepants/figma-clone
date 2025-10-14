/**
 * Layout Section Component
 *
 * Adaptive dimension controls that work for all shape types:
 * - Rectangle: width × height with aspect ratio lock
 * - Circle: radius with diameter display
 * - Text: width (optional) with auto-height
 */

import { Maximize2, Lock, Unlock } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label, Button } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { useShapeDimensions } from '../hooks/useShapeDimensions';
import { hasRadius, isTextShape } from '@/types/canvas.types';

/**
 * LayoutSection Component
 *
 * Shows adaptive dimension controls based on shape type:
 * - Rectangles: Width & Height inputs with aspect ratio lock toggle
 * - Circles: Radius input with diameter display (always 1:1)
 * - Text: Width input (optional) with auto-calculated height
 *
 * @example
 * ```tsx
 * <LayoutSection />
 * ```
 */
export function LayoutSection() {
  const shape = useSelectedShape();
  const dimensions = useShapeDimensions(shape);

  if (!shape) return null;

  // Render for circles - radius-based
  if (hasRadius(shape)) {
    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-4 h-4" />}
        storageKey="props-layout"
      >
        {/* Radius Input */}
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Radius</Label>
          <NumberInput
            value={dimensions.radius!}
            onChange={dimensions.updateRadius}
            min={1}
            step={1}
            precision={0}
            unit="px"
          />
        </div>

        {/* Diameter Display (read-only) */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Diameter:</span>
          <span className="font-mono">{Math.round(dimensions.diameter!)}</span>
          <span>px</span>
        </div>

        {/* Info: Circles always maintain aspect ratio */}
        <div className="flex items-center gap-1 text-xs text-gray-400 italic">
          <Lock className="w-3 h-3" />
          <span>Circles always maintain 1:1 ratio</span>
        </div>
      </PropertySection>
    );
  }

  // Render for text - optional width, auto height
  if (isTextShape(shape)) {
    const hasFixedWidth = shape.width !== undefined;

    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-4 h-4" />}
        storageKey="props-layout"
      >
        {/* Width Input (optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-gray-600">Text Box Width</Label>
            <button
              onClick={() => {
                if (hasFixedWidth) {
                  // Remove width to enable auto-width
                  dimensions.updateWidth(0); // Will be handled by component
                } else {
                  // Set default fixed width
                  dimensions.updateWidth(200);
                }
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              {hasFixedWidth ? 'Auto' : 'Fixed'}
            </button>
          </div>

          {hasFixedWidth ? (
            <NumberInput
              value={dimensions.width!}
              onChange={dimensions.updateWidth}
              min={1}
              step={1}
              precision={0}
              unit="px"
            />
          ) : (
            <div className="text-xs text-gray-400 italic py-2">
              Auto-width (wraps to content)
            </div>
          )}
        </div>

        {/* Height Display (always calculated) */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Height:</span>
          <span className="font-mono">{Math.round(dimensions.height!)}</span>
          <span>px (auto-calculated)</span>
        </div>
      </PropertySection>
    );
  }

  // Render for rectangles - width and height
  return (
    <PropertySection
      title="Layout"
      icon={<Maximize2 className="w-4 h-4" />}
      storageKey="props-layout"
    >
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Dimensions</Label>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <NumberInput
              value={dimensions.width!}
              onChange={dimensions.updateWidth}
              min={1}
              step={1}
              precision={0}
              unit="px"
              placeholder="W"
            />
          </div>

          <span className="text-gray-400">×</span>

          <div className="flex-1">
            <NumberInput
              value={dimensions.height!}
              onChange={dimensions.updateHeight}
              min={1}
              step={1}
              precision={0}
              unit="px"
              placeholder="H"
            />
          </div>

          {/* Aspect Ratio Lock Toggle */}
          {dimensions.supportsAspectRatioLock && (
            <Button
              variant={dimensions.hasAspectRatioLock ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={dimensions.toggleAspectRatioLock}
              title={
                dimensions.hasAspectRatioLock
                  ? 'Unlock aspect ratio'
                  : 'Lock aspect ratio'
              }
            >
              {dimensions.hasAspectRatioLock ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </PropertySection>
  );
}
