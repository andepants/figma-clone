/**
 * Rotation Section Component
 *
 * Displays and edits rotation angle for the selected shape.
 */

import { RotateCw } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';
import { normalizeRotation } from '@/lib/utils';

/**
 * RotationSection Component
 *
 * Shows rotation angle input for the selected shape.
 * Rotation is normalized to 0-360 degrees.
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

  function handleRotationChange(degrees: number) {
    if (!shape) return;
    const normalized = normalizeRotation(degrees);
    updateShapeProperty(shape.id, { rotation: normalized });
  }

  return (
    <PropertySection
      title="Rotation"
      icon={<RotateCw className="w-3.5 h-3.5" />}
      storageKey="props-rotation"
    >
      {/* Rotation Angle */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-0.5 block">Angle</Label>
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
    </PropertySection>
  );
}
