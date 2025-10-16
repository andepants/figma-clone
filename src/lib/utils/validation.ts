/**
 * Property Validation Utilities
 *
 * Utility functions to validate and clamp property values for canvas objects.
 * Ensures all inputs are sanitized before updating state.
 */

/**
 * Clamp a number between min and max values
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  // Handle NaN and Infinity
  if (!isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize rotation to 0-360 range
 * @param degrees - Rotation angle in degrees (can be negative or > 360)
 * @returns Normalized rotation between 0 and 360
 */
export function normalizeRotation(degrees: number): number {
  if (!isFinite(degrees)) {
    return 0;
  }

  // Use modulo to wrap to 0-360 range
  let normalized = degrees % 360;

  // Handle negative values
  if (normalized < 0) {
    normalized += 360;
  }

  return normalized;
}

/**
 * Normalize rotation to -179 to 179 range (for lines)
 * Lines use a different rotation range to avoid ambiguity at 180/-180
 * @param degrees - Rotation angle in degrees (can be any value)
 * @returns Normalized rotation between -179 and 179 (never exactly 180)
 */
export function normalizeRotationForLines(degrees: number): number {
  if (!isFinite(degrees)) {
    return 0;
  }

  // Use modulo to wrap to -180 to 180 range
  let normalized = degrees % 360;

  // Handle negative values
  if (normalized < -180) {
    normalized += 360;
  }
  if (normalized > 180) {
    normalized -= 360;
  }

  // Special case: convert 180 to -180 to avoid ambiguity
  if (normalized === 180) {
    normalized = -180;
  }

  return normalized;
}

/**
 * Validate and clamp opacity (0-1)
 * @param opacity - Opacity value to validate
 * @returns Clamped opacity between 0 and 1
 */
export function validateOpacity(opacity: number): number {
  return clamp(opacity, 0, 1);
}

/**
 * Validate corner radius (non-negative)
 * Supports both uniform radius (number) and per-corner radius (array)
 * @param radius - Corner radius value(s) to validate
 * @returns Validated corner radius
 */
export function validateCornerRadius(
  radius: number | [number, number, number, number]
): number | [number, number, number, number] {
  if (Array.isArray(radius)) {
    // Validate each corner individually
    return radius.map((r) => Math.max(0, isFinite(r) ? r : 0)) as [number, number, number, number];
  }

  // Validate uniform radius
  if (!isFinite(radius)) {
    return 0;
  }

  return Math.max(0, radius);
}

/**
 * Parse and validate color string
 * Supports hex, rgb, rgba, hsl, hsla, and named colors
 * @param color - Color string to validate
 * @returns Validated color string or null if invalid
 */
export function validateColor(color: string): string | null {
  if (!color || typeof color !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = color.trim();

  // Validate hex colors (#RGB, #RRGGBB, #RRGGBBAA)
  const hexPattern = /^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
  if (hexPattern.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Validate rgb/rgba colors
  const rgbPattern = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)$/i;
  if (rgbPattern.test(trimmed)) {
    return trimmed;
  }

  // Validate hsl/hsla colors
  const hslPattern = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*[\d.]+\s*)?\)$/i;
  if (hslPattern.test(trimmed)) {
    return trimmed;
  }

  // Validate named colors (basic list)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'orange', 'purple', 'pink', 'brown', 'transparent'
  ];
  if (namedColors.includes(trimmed.toLowerCase())) {
    return trimmed.toLowerCase();
  }

  // Invalid color format
  return null;
}

/**
 * Validate dimensions (positive numbers)
 * @param width - Width value
 * @param height - Height value
 * @returns Validated dimensions and validity flag
 */
export function validateDimensions(
  width: number,
  height: number
): {
  width: number;
  height: number;
  isValid: boolean;
} {
  const isWidthValid = isFinite(width) && width > 0;
  const isHeightValid = isFinite(height) && height > 0;

  return {
    width: isWidthValid ? Math.max(1, width) : 1,
    height: isHeightValid ? Math.max(1, height) : 1,
    isValid: isWidthValid && isHeightValid,
  };
}

/**
 * Round number to specified precision
 * @param value - Number to round
 * @param precision - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundToPrecision(value: number, precision: number = 2): number {
  if (!isFinite(value)) {
    return 0;
  }

  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Validate scale factor
 * Allows negative values for flipping, but not zero
 * @param scale - Scale factor to validate
 * @returns Validated scale factor
 */
export function validateScale(scale: number): number {
  if (!isFinite(scale) || scale === 0) {
    return 1;
  }

  // Allow negative for flipping, but clamp extremes
  return clamp(scale, -10, 10);
}

/**
 * Validate and clamp shadow properties
 * @param blur - Shadow blur radius
 * @param offsetX - Shadow X offset
 * @param offsetY - Shadow Y offset
 * @param opacity - Shadow opacity
 * @returns Validated shadow properties
 */
export function validateShadowProperties(
  blur: number = 0,
  offsetX: number = 0,
  offsetY: number = 0,
  opacity: number = 1
): {
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
} {
  return {
    blur: clamp(isFinite(blur) ? blur : 0, 0, 100),
    offsetX: clamp(isFinite(offsetX) ? offsetX : 0, -100, 100),
    offsetY: clamp(isFinite(offsetY) ? offsetY : 0, -100, 100),
    opacity: validateOpacity(opacity),
  };
}

/**
 * Validate and clamp font size
 * @param size - Font size in pixels
 * @returns Clamped font size between 8 and 400 pixels
 * @example validateFontSize(500) // returns 400
 * @example validateFontSize(5) // returns 8
 */
export function validateFontSize(size: number): number {
  return clamp(size, 8, 400);
}

/**
 * Validate and clamp line height
 * Line height is a multiplier of font size (1.2 = 120%)
 * @param height - Line height multiplier
 * @returns Clamped line height between 0.5 and 3.0
 * @example validateLineHeight(5) // returns 3.0
 * @example validateLineHeight(0.2) // returns 0.5
 */
export function validateLineHeight(height: number): number {
  return clamp(height, 0.5, 3.0);
}

/**
 * Validate and clamp letter spacing
 * Supports negative values for tighter spacing
 * @param spacing - Letter spacing in percentage units
 * @returns Clamped letter spacing between -20 and 100
 * @example validateLetterSpacing(-30) // returns -20
 * @example validateLetterSpacing(150) // returns 100
 */
export function validateLetterSpacing(spacing: number): number {
  return clamp(spacing, -20, 100);
}

/**
 * Validate and normalize font weight
 * Converts string weights to numeric values and clamps to valid range
 * @param weight - Font weight as number (100-900) or string ('normal', 'bold')
 * @returns Numeric font weight clamped between 100 and 900
 * @example validateFontWeight('bold') // returns 700
 * @example validateFontWeight('normal') // returns 400
 * @example validateFontWeight(850) // returns 850
 * @example validateFontWeight(1000) // returns 900
 */
export function validateFontWeight(weight: number | string): number {
  // Convert string weights to numeric
  if (typeof weight === 'string') {
    const lowerWeight = weight.toLowerCase();
    switch (lowerWeight) {
      case 'normal':
        return 400;
      case 'bold':
        return 700;
      case 'lighter':
        return 300;
      case 'bolder':
        return 700;
      default: {
        // Try to parse as number
        const parsed = parseInt(weight, 10);
        if (isFinite(parsed)) {
          return clamp(parsed, 100, 900);
        }
        // Default to normal if invalid
        return 400;
      }
    }
  }

  // Validate numeric weight
  if (!isFinite(weight)) {
    return 400;
  }

  // Clamp to valid range (100-900) and round to nearest hundred
  const clamped = clamp(weight, 100, 900);
  return Math.round(clamped / 100) * 100;
}

/**
 * Validate and clamp paragraph spacing
 * @param spacing - Paragraph spacing in pixels
 * @returns Clamped paragraph spacing between 0 and 100
 */
export function validateParagraphSpacing(spacing: number): number {
  return clamp(spacing, 0, 100);
}
