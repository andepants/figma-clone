/**
 * Rotation Section Component
 *
 * Displays and edits rotation angle and flip controls for the selected shape.
 */

import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label, Button } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';
import { normalizeRotation } from '@/lib/utils';

/**
 * RotationSection Component
 *
 * Shows rotation angle input and flip horizontal/vertical buttons.
 * Rotation is normalized to 0-360 degrees.
 * Flip is achieved using negative scale values.
 *
 * @example
 * ```tsx
 * <RotationSection />
 * ```
 */
export function RotationSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;

  const rotation = shape.rotation ?? 0;
  const scaleX = shape.scaleX ?? 1;
  const scaleY = shape.scaleY ?? 1;

  function handleRotationChange(degrees: number) {
    const normalized = normalizeRotation(degrees);
    updateShapeProperty(shape.id, { rotation: normalized });
  }

  function handleFlipHorizontal() {
    updateShapeProperty(shape.id, { scaleX: -scaleX });
  }

  function handleFlipVertical() {
    updateShapeProperty(shape.id, { scaleY: -scaleY });
  }

  return (
    <PropertySection
      title="Rotation"
      icon={<RotateCw className="w-4 h-4" />}
      storageKey="props-rotation"
    >
      {/* Rotation Angle */}
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Angle</Label>
        <NumberInput
          value={rotation}
          onChange={handleRotationChange}
          min={0}
          max={360}
          step={1}
          precision={1}
          unit="°"
        />
      </div>

      {/* Flip Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlipHorizontal}
          className="flex-1"
        >
          <FlipHorizontal className="w-4 h-4 mr-1" />
          Flip H
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlipVertical}
          className="flex-1"
        >
          <FlipVertical className="w-4 h-4 mr-1" />
          Flip V
        </Button>
      </div>
    </PropertySection>
  );
}
