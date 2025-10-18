/**
 * Layout Section Component
 *
 * Adaptive dimension controls that work for all shape types:
 * - Rectangle: width × height with aspect ratio lock
 * - Circle: radius with diameter display
 * - Text: width × height (fixed dimensions, text wraps/clips within bounds)
 */

import { Maximize2, Lock, Unlock } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label, Button } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { useShapeDimensions } from '../hooks/useShapeDimensions';
import { hasRadius, isTextShape, isLineShape, isImageShape, getImageLocked } from '@/types/canvas.types';
import { useCanvasStore } from '@/stores/canvas';

/**
 * LayoutSection Component
 *
 * Shows adaptive dimension controls based on shape type:
 * - Rectangles: Width & Height inputs with aspect ratio lock toggle
 * - Circles: Radius input with diameter display (always 1:1)
 * - Text: Width & Height inputs (fixed dimensions, text wraps/clips within bounds)
 *
 * @example
 * ```tsx
 * <LayoutSection />
 * ```
 */
export function LayoutSection() {
  const shape = useSelectedShape();
  const dimensions = useShapeDimensions(shape);
  const updateObject = useCanvasStore((state) => state.updateObject);

  if (!shape) return null;

  // Render for lines - width (length) only
  if (isLineShape(shape)) {
    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-3.5 h-3.5" />}
        storageKey="props-layout"
      >
        {/* Width (Line Length) - Read Only */}
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Width (Length)</Label>
          <NumberInput
            value={Math.round(shape.width)}
            onChange={() => {}} // Read-only for now
            min={1}
            step={1}
            precision={0}
            unit="px"
            disabled
          />
        </div>

        {/* Info: Lines have no height */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 italic">
          <span>Lines are 1D shapes with no height</span>
        </div>
      </PropertySection>
    );
  }

  // Render for circles - radius-based
  if (hasRadius(shape)) {
    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-3.5 h-3.5" />}
        storageKey="props-layout"
      >
        {/* Radius Input */}
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Radius</Label>
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
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <span>Diameter:</span>
          <span className="font-mono">{Math.round(dimensions.diameter!)}</span>
          <span>px</span>
        </div>

        {/* Info: Circles always maintain aspect ratio */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 italic">
          <Lock className="w-2.5 h-2.5" />
          <span>Circles always maintain 1:1 ratio</span>
        </div>
      </PropertySection>
    );
  }

  // Render for text - fixed width and height (like rectangles)
  if (isTextShape(shape)) {
    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-3.5 h-3.5" />}
        storageKey="props-layout"
      >
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Dimensions</Label>
          <div className="flex gap-1.5 items-center">
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
          </div>
        </div>
      </PropertySection>
    );
  }

  // Render for images - layout bounds with lock
  if (isImageShape(shape)) {
    const imageLocked = getImageLocked(shape);

    return (
      <PropertySection
        title="Layout"
        icon={<Maximize2 className="w-3.5 h-3.5" />}
        storageKey="props-layout"
      >
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Dimensions</Label>
          <div className="flex gap-1.5 items-center">
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

            {/* Image Lock Toggle */}
            <Button
              variant={imageLocked ? 'default' : 'outline'}
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                // Toggle imageLocked property
                updateObject(shape.id, { imageLocked: !imageLocked });
              }}
              title={
                imageLocked
                  ? 'Unlock aspect ratio (fill mode)'
                  : 'Lock aspect ratio'
              }
            >
              {imageLocked ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                <Unlock className="w-2.5 h-2.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Info text explaining lock behavior */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 italic">
          {imageLocked ? (
            <span>Locked: maintains aspect ratio</span>
          ) : (
            <span>Unlocked: image fills layout bounds</span>
          )}
        </div>
      </PropertySection>
    );
  }

  // Render for rectangles - width and height
  return (
    <PropertySection
      title="Layout"
      icon={<Maximize2 className="w-3.5 h-3.5" />}
      storageKey="props-layout"
    >
      <div>
        <Label className="text-[11px] text-gray-600 mb-0.5 block">Dimensions</Label>
        <div className="flex gap-1.5 items-center">
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
              className="h-6 w-6 shrink-0"
              onClick={dimensions.toggleAspectRatioLock}
              title={
                dimensions.hasAspectRatioLock
                  ? 'Unlock aspect ratio'
                  : 'Lock aspect ratio'
              }
            >
              {dimensions.hasAspectRatioLock ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                <Unlock className="w-2.5 h-2.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </PropertySection>
  );
}
