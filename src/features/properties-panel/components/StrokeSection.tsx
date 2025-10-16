/**
 * Stroke Section Component
 *
 * Controls for stroke properties:
 * - Stroke color picker (lines)
 * - Stroke width (lines)
 */

import { Pen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PropertySection } from './PropertySection';
import { ColorPicker, NumberInput, Label } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';
import { isLineShape } from '@/types/canvas.types';

/**
 * StrokeSection Component
 *
 * Shows stroke color and width controls for shapes that support stroke.
 * Currently only lines have stroke as their primary visual property.
 *
 * @example
 * ```tsx
 * <StrokeSection />
 * ```
 */
export function StrokeSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();
  const [colorHistory, setColorHistory] = useState<string[]>([]);

  // Load color history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stroke-color-history');
      if (stored) {
        setColorHistory(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }, []);

  if (!shape) return null;

  // Only show for shapes with stroke property
  if (!isLineShape(shape)) return null;

  const stroke = shape.stroke;
  const strokeWidth = shape.strokeWidth;

  function handleStrokeColorChange(color: string) {
    if (!shape) return;
    updateShapeProperty(shape.id, { stroke: color });

    // Add to color history (max 10 recent colors)
    setColorHistory((prev) => {
      const updated = [color, ...prev.filter((c) => c !== color)].slice(0, 10);

      // Save to localStorage
      try {
        localStorage.setItem('stroke-color-history', JSON.stringify(updated));
      } catch {
        // Silently fail
      }

      return updated;
    });
  }

  function handleStrokeWidthChange(width: number) {
    if (!shape) return;
    // Clamp stroke width to reasonable range
    const clamped = Math.max(1, Math.min(100, width));
    updateShapeProperty(shape.id, { strokeWidth: clamped });
  }

  return (
    <PropertySection
      title="Stroke"
      icon={<Pen className="w-3.5 h-3.5" />}
      storageKey="props-stroke"
    >
      {/* Stroke Color Picker */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-1 block">Color</Label>
        <ColorPicker value={stroke} onChange={handleStrokeColorChange} />
      </div>

      {/* Recent Colors */}
      {colorHistory.length > 0 && (
        <div>
          <Label className="text-[11px] text-gray-600 mb-1 block">Recent</Label>
          <div className="flex gap-1 flex-wrap">
            {colorHistory.map((color) => (
              <button
                key={color}
                onClick={() => handleStrokeColorChange(color)}
                className="w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Width */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-0.5 block">Width</Label>
        <NumberInput
          value={strokeWidth}
          onChange={handleStrokeWidthChange}
          min={1}
          max={100}
          step={1}
          precision={0}
          unit="px"
        />
      </div>
    </PropertySection>
  );
}
