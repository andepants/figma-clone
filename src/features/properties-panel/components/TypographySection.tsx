/**
 * Typography Section Component
 *
 * Controls for text typography properties:
 * - Font family and weight
 * - Font size
 * - Line height and letter spacing
 * - Text alignment (horizontal and vertical)
 */

import { Type, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { NumberInput, Label } from '@/components/ui';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { usePropertyUpdate } from '../hooks/usePropertyUpdate';
import { isTextShape } from '@/types/canvas.types';
import {
  TEXT_DEFAULTS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  FONT_SIZE_LIMITS,
  LINE_HEIGHT_LIMITS,
  LETTER_SPACING_LIMITS,
} from '@/constants';
import {
  validateFontSize,
  validateLineHeight,
  validateLetterSpacing,
  validateFontWeight,
} from '@/lib/utils';

/**
 * TypographySection Component
 *
 * Shows typography controls for text shapes only.
 * Includes font family, weight, size, spacing, and alignment options.
 *
 * @example
 * ```tsx
 * <TypographySection />
 * ```
 */
export function TypographySection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  // Only show for text shapes
  if (!shape || !isTextShape(shape)) return null;

  // Get current values with defaults
  const fontFamily = shape.fontFamily || TEXT_DEFAULTS.fontFamily;
  const fontWeight = shape.fontWeight || TEXT_DEFAULTS.fontWeight;
  const fontSize = shape.fontSize || TEXT_DEFAULTS.fontSize;
  const lineHeight = shape.lineHeight || TEXT_DEFAULTS.lineHeight;
  const letterSpacing = shape.letterSpacing || TEXT_DEFAULTS.letterSpacing;
  const textAlign = shape.textAlign || shape.align || TEXT_DEFAULTS.textAlign;
  const verticalAlign = shape.verticalAlign || TEXT_DEFAULTS.verticalAlign;
  const textTransform = shape.textTransform || TEXT_DEFAULTS.textTransform;
  const paragraphSpacing = shape.paragraphSpacing ?? TEXT_DEFAULTS.paragraphSpacing;

  return (
    <PropertySection
      title="Typography"
      icon={<Type className="w-3.5 h-3.5" />}
      storageKey="props-typography"
    >
      {/* Font Family */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-0.5 block">Font</Label>
        <select
          value={fontFamily}
          onChange={(e) => updateShapeProperty(shape.id, { fontFamily: e.target.value })}
          className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          style={{ fontFamily }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Weight and Size (2 columns) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Weight</Label>
          <select
            value={typeof fontWeight === 'number' ? fontWeight : validateFontWeight(fontWeight)}
            onChange={(e) => updateShapeProperty(shape.id, { fontWeight: Number(e.target.value) })}
            className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Size</Label>
          <NumberInput
            value={fontSize}
            onChange={(value) => updateShapeProperty(shape.id, { fontSize: validateFontSize(value) })}
            min={FONT_SIZE_LIMITS.min}
            max={FONT_SIZE_LIMITS.max}
            step={FONT_SIZE_LIMITS.step}
            precision={0}
            unit="px"
          />
        </div>
      </div>

      {/* Line Height and Letter Spacing (2 columns) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Line height</Label>
          <NumberInput
            value={lineHeight}
            onChange={(value) => updateShapeProperty(shape.id, { lineHeight: validateLineHeight(value) })}
            min={LINE_HEIGHT_LIMITS.min}
            max={LINE_HEIGHT_LIMITS.max}
            step={LINE_HEIGHT_LIMITS.step}
            precision={1}
          />
        </div>

        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Letter spacing</Label>
          <NumberInput
            value={letterSpacing}
            onChange={(value) => updateShapeProperty(shape.id, { letterSpacing: validateLetterSpacing(value) })}
            min={LETTER_SPACING_LIMITS.min}
            max={LETTER_SPACING_LIMITS.max}
            step={LETTER_SPACING_LIMITS.step}
            precision={1}
            unit="%"
          />
        </div>
      </div>

      {/* Alignment Controls */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-1 block">Alignment</Label>

        {/* Horizontal Alignment */}
        <div className="mb-1.5">
          <div className="flex gap-1">
            <button
              onClick={() => updateShapeProperty(shape.id, { textAlign: 'left', align: 'left' })}
              className={`flex-1 h-6 flex items-center justify-center border rounded transition-colors ${
                textAlign === 'left'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Align left"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateShapeProperty(shape.id, { textAlign: 'center', align: 'center' })}
              className={`flex-1 h-6 flex items-center justify-center border rounded transition-colors ${
                textAlign === 'center'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Align center"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateShapeProperty(shape.id, { textAlign: 'right', align: 'right' })}
              className={`flex-1 h-6 flex items-center justify-center border rounded transition-colors ${
                textAlign === 'right'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Align right"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Vertical Alignment */}
        <div>
          <div className="flex gap-1">
            <button
              onClick={() => updateShapeProperty(shape.id, { verticalAlign: 'top' })}
              className={`flex-1 h-6 flex items-center justify-center border rounded transition-colors ${
                verticalAlign === 'top'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Align top"
            >
              <AlignVerticalJustifyStart className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateShapeProperty(shape.id, { verticalAlign: 'middle' })}
              className={`flex-1 h-6 flex items-center justify-center border rounded transition-colors ${
                verticalAlign === 'middle'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Align middle"
            >
              <AlignVerticalJustifyCenter className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateShapeProperty(shape.id, { verticalAlign: 'bottom' })}
              className={`flex-1 h-6 flex items-center justify-center border rounded transition-colors ${
                verticalAlign === 'bottom'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Align bottom"
            >
              <AlignVerticalJustifyEnd className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Text Transform */}
      <div>
        <Label className="text-[11px] text-gray-600 mb-0.5 block">Text transform</Label>
        <select
          value={textTransform}
          onChange={(e) => updateShapeProperty(shape.id, {
            textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize'
          })}
          className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </div>

      {/* Paragraph Spacing - Only show for multi-line text */}
      {shape.text && shape.text.includes('\n') && (
        <div>
          <Label className="text-[11px] text-gray-600 mb-0.5 block">Paragraph spacing</Label>
          <NumberInput
            value={paragraphSpacing}
            onChange={(value) => updateShapeProperty(shape.id, { paragraphSpacing: Math.max(0, Math.min(100, value)) })}
            min={0}
            max={100}
            step={1}
            precision={0}
            unit="px"
          />
        </div>
      )}
    </PropertySection>
  );
}
