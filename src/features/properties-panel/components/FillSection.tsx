/**
 * Fill Section Component
 *
 * Color picker for shape fill with:
 * - Color swatch and hex input
 * - Preset color palette
 * - Recent color history (localStorage)
 */

import { Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PropertySection } from './PropertySection';
import { ColorPicker, Label } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';

/**
 * FillSection Component
 *
 * Shows color picker for fill color with history and presets.
 * Color history is persisted to localStorage.
 *
 * @example
 * ```tsx
 * <FillSection />
 * ```
 */
export function FillSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();
  const [colorHistory, setColorHistory] = useState<string[]>([]);

  // Load color history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('color-history');
      if (stored) {
        setColorHistory(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }, []);

  if (!shape || !('fill' in shape)) return null;

  const fill = shape.fill;

  function handleFillChange(color: string) {
    if (!shape) return;
    updateShapeProperty(shape.id, { fill: color });

    // Add to color history (max 10 recent colors)
    setColorHistory((prev) => {
      const updated = [color, ...prev.filter((c) => c !== color)].slice(0, 10);

      // Save to localStorage
      try {
        localStorage.setItem('color-history', JSON.stringify(updated));
      } catch {
        // Silently fail
      }

      return updated;
    });
  }

  return (
    <PropertySection
      title="Fill"
      icon={<Palette className="w-3.5 h-3.5" />}
      storageKey="props-fill"
    >
      {/* Color Picker */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-1 block">Color</Label>
        <ColorPicker value={fill} onChange={handleFillChange} />
      </div>

      {/* Recent Colors */}
      {colorHistory.length > 0 && (
        <div>
          <Label className="text-[11px] text-gray-600 mb-1 block">Recent</Label>
          <div className="flex gap-1 flex-wrap">
            {colorHistory.map((color) => (
              <button
                key={color}
                onClick={() => handleFillChange(color)}
                className="w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </PropertySection>
  );
}
