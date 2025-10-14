/**
 * Position Section Component
 *
 * Displays and edits X, Y coordinates of the selected shape.
 */

import { Move } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';

/**
 * PositionSection Component
 *
 * Shows X and Y coordinate inputs for the selected shape.
 * Updates are applied optimistically and synced to Firebase.
 *
 * @example
 * ```tsx
 * <PositionSection />
 * ```
 */
export function PositionSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;

  function handleXChange(x: number) {
    updateShapeProperty(shape.id, { x });
  }

  function handleYChange(y: number) {
    updateShapeProperty(shape.id, { y });
  }

  return (
    <PropertySection title="Position" icon={<Move className="w-4 h-4" />} storageKey="props-position">
      {/* X, Y Position */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs text-gray-600 mb-1 block">X</Label>
          <NumberInput
            value={Math.round(shape.x)}
            onChange={handleXChange}
            step={1}
            precision={0}
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-gray-600 mb-1 block">Y</Label>
          <NumberInput
            value={Math.round(shape.y)}
            onChange={handleYChange}
            step={1}
            precision={0}
          />
        </div>
      </div>
    </PropertySection>
  );
}
