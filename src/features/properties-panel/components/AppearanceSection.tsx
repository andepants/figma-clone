/**
 * Appearance Section Component
 *
 * Controls for visual appearance:
 * - Opacity slider (0-100%)
 * - Corner radius (rectangles only)
 */

import { Eye } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';
import { hasCornerRadius, isLineShape } from '@/types/canvas.types';
import { validateOpacity, validateCornerRadius } from '@/lib/utils';

/**
 * AppearanceSection Component
 *
 * Shows opacity slider for all shapes and corner radius input for rectangles.
 *
 * @example
 * ```tsx
 * <AppearanceSection />
 * ```
 */
export function AppearanceSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;

  const opacity = (shape.opacity ?? 1) * 100; // Convert to percentage
  const cornerRadius =
    hasCornerRadius(shape) && typeof shape.cornerRadius === 'number'
      ? shape.cornerRadius
      : 0;

  function handleOpacityChange(value: number) {
    if (!shape) return;
    const opacityDecimal = value / 100;
    const clamped = validateOpacity(opacityDecimal);
    updateShapeProperty(shape.id, { opacity: clamped });
  }

  function handleCornerRadiusChange(radius: number) {
    if (!shape) return;
    const validated = validateCornerRadius(radius);
    updateShapeProperty(shape.id, { cornerRadius: validated });
  }

  return (
    <PropertySection
      title="Appearance"
      icon={<Eye className="w-3.5 h-3.5" />}
      storageKey="props-appearance"
    >
      {/* Opacity Slider */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <Label className="text-[11px] text-gray-600">Opacity</Label>
          <span className="text-[11px] text-gray-500 font-mono">
            {Math.round(opacity)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Corner Radius (rectangles only - not lines) */}
      {hasCornerRadius(shape) && !isLineShape(shape) && (
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">
            Corner radius
          </Label>
          <NumberInput
            value={cornerRadius}
            onChange={handleCornerRadiusChange}
            min={0}
            max={Math.min(shape.width, shape.height) / 2}
            step={1}
            precision={0}
            unit="px"
          />
        </div>
      )}
    </PropertySection>
  );
}
