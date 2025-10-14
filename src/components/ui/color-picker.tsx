/**
 * Color Picker Component
 *
 * A color picker component with:
 * - Color swatch button
 * - Hex color input
 * - Native color picker dialog
 * - Preset color palette
 * - Color validation
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';

export interface ColorPickerProps {
  /** Current color value (hex format) */
  value: string;
  /** Callback when color changes */
  onChange: (color: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show alpha channel support */
  showAlpha?: boolean;
  /** Preset colors to display */
  presets?: string[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default preset colors (Material Design inspired)
 */
const defaultPresets = [
  '#000000',
  '#FFFFFF',
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
];

/**
 * Validate hex color format
 */
function validateHex(hex: string): boolean {
  return /^#[0-9A-F]{3}$|^#[0-9A-F]{6}$|^#[0-9A-F]{8}$/i.test(hex);
}

/**
 * Normalize 3-char hex to 6-char
 */
function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.toUpperCase();
}

export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ value, onChange, disabled, presets = defaultPresets, className }, ref) => {
    const [hexInput, setHexInput] = React.useState(value);
    const colorInputRef = React.useRef<HTMLInputElement>(null);

    // Sync hex input when value changes externally
    React.useEffect(() => {
      setHexInput(value);
    }, [value]);

    /**
     * Handle hex input change
     */
    function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
      let inputValue = e.target.value;

      // Auto-add # if missing
      if (inputValue && !inputValue.startsWith('#')) {
        inputValue = '#' + inputValue;
      }

      setHexInput(inputValue);

      // Validate and update if valid
      if (validateHex(inputValue)) {
        onChange(normalizeHex(inputValue));
      }
    }

    /**
     * Handle hex input blur - normalize or restore
     */
    function handleHexBlur() {
      if (validateHex(hexInput)) {
        const normalized = normalizeHex(hexInput);
        setHexInput(normalized);
        onChange(normalized);
      } else {
        // Restore previous valid value
        setHexInput(value);
      }
    }

    /**
     * Handle native color picker change
     */
    function handleColorPickerChange(e: React.ChangeEvent<HTMLInputElement>) {
      const newColor = e.target.value.toUpperCase();
      onChange(newColor);
      setHexInput(newColor);
    }

    /**
     * Handle preset color click
     */
    function handlePresetClick(preset: string) {
      onChange(preset);
      setHexInput(preset);
    }

    /**
     * Open native color picker
     */
    function handleSwatchClick() {
      if (!disabled && colorInputRef.current) {
        colorInputRef.current.click();
      }
    }

    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        {/* Swatch and Hex Input */}
        <div className="flex items-center gap-2">
          {/* Color Swatch Button */}
          <button
            type="button"
            onClick={handleSwatchClick}
            disabled={disabled}
            className={cn(
              'w-10 h-10 rounded-md border-2 border-input',
              'transition-all hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              'relative overflow-hidden'
            )}
            style={{ backgroundColor: value }}
            aria-label="Pick color"
          >
            {/* Checkered background for transparency */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            />

            {/* Hidden native color input */}
            <input
              ref={colorInputRef}
              type="color"
              value={value}
              onChange={handleColorPickerChange}
              disabled={disabled}
              className="sr-only"
              aria-hidden="true"
            />
          </button>

          {/* Hex Input */}
          <div className="flex-1">
            <Input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              onBlur={handleHexBlur}
              disabled={disabled}
              placeholder="#000000"
              maxLength={7}
              className="font-mono text-xs uppercase"
            />
          </div>
        </div>

        {/* Preset Colors */}
        {presets && presets.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
            <div className="grid grid-cols-9 gap-1">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  disabled={disabled}
                  className={cn(
                    'w-6 h-6 rounded border-2',
                    'transition-all hover:scale-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    preset === value ? 'border-primary ring-2 ring-primary' : 'border-input'
                  )}
                  style={{ backgroundColor: preset }}
                  title={preset}
                  aria-label={`Select color ${preset}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';
