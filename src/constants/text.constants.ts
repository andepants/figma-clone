/**
 * Text Constants
 *
 * Default values, limits, and available options for text properties.
 * Used by the text rendering system and properties panel.
 */

/**
 * Default values for all text properties
 * Applied when creating new text objects or when properties are undefined
 */
export const TEXT_DEFAULTS = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 400,
  fontStyle: 'normal' as const,
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  letterSpacing: 0,
  lineHeight: 1.2,
  paragraphSpacing: 0,
  textDecoration: 'none' as const,
  textTransform: 'none' as const,
  opacity: 1,
  rotation: 0,
} as const;

/**
 * Common web fonts available in the font family dropdown
 * Includes modern system fonts and classic web-safe fonts
 */
export const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
] as const;

/**
 * Font weight options with numeric values and display labels
 * Covers the full range from Thin (100) to Black (900)
 */
export const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
] as const;

/**
 * Font size constraints and defaults
 * Enforced in UI inputs and validation functions
 */
export const FONT_SIZE_LIMITS = {
  min: 8,
  max: 400,
  default: 16,
  step: 1,
} as const;

/**
 * Line height constraints and defaults
 * Value is a multiplier of font size (1.2 = 120% of font size)
 */
export const LINE_HEIGHT_LIMITS = {
  min: 0.5,
  max: 3.0,
  default: 1.2,
  step: 0.1,
} as const;

/**
 * Letter spacing constraints and defaults
 * Value in percentage units, can be negative for tighter spacing
 */
export const LETTER_SPACING_LIMITS = {
  min: -20,
  max: 100,
  default: 0,
  step: 0.1,
} as const;

/**
 * Paragraph spacing constraints
 * Value in pixels, only applies to multi-paragraph text
 */
export const PARAGRAPH_SPACING_LIMITS = {
  min: 0,
  max: 100,
  default: 0,
  step: 1,
} as const;

/**
 * Edge case: Font fallback chain
 * Used when primary font is not available on the system
 */
export const FONT_FALLBACK_CHAIN = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/**
 * Edge case: Map of font families to available weights
 * Some fonts may not support all weight values
 * If a font is not in this map, assume all weights are available
 */
export const FONT_WEIGHT_AVAILABILITY: Record<string, number[]> = {
  'Arial': [400, 700],
  'Helvetica': [400, 700],
  'Times New Roman': [400, 700],
  'Georgia': [400, 700],
  'Courier New': [400, 700],
  // Modern fonts typically support full range (100-900)
  'Inter': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Roboto': [100, 300, 400, 500, 700, 900],
  'Open Sans': [300, 400, 600, 700, 800],
  'Lato': [100, 300, 400, 700, 900],
  'Montserrat': [100, 200, 300, 400, 500, 600, 700, 800, 900],
};

/**
 * Get available font weights for a specific font family
 * Returns all weights if font is not in the availability map
 */
export function getAvailableFontWeights(fontFamily: string): number[] {
  return FONT_WEIGHT_AVAILABILITY[fontFamily] || FONT_WEIGHTS.map(w => w.value);
}

/**
 * Check if a font weight is available for a given font family
 */
export function isFontWeightAvailable(fontFamily: string, weight: number): boolean {
  const availableWeights = getAvailableFontWeights(fontFamily);
  return availableWeights.includes(weight);
}

/**
 * Get the closest available font weight for a font family
 * Useful when switching fonts and the current weight is not available
 */
export function getClosestFontWeight(fontFamily: string, desiredWeight: number): number {
  const availableWeights = getAvailableFontWeights(fontFamily);

  // Find the closest weight
  return availableWeights.reduce((closest, weight) => {
    return Math.abs(weight - desiredWeight) < Math.abs(closest - desiredWeight)
      ? weight
      : closest;
  });
}
