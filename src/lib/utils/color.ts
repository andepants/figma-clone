/**
 * Color Utilities
 *
 * Utilities for color manipulation and conversion.
 */

/**
 * Convert hex color to rgba format
 *
 * @param hex - Hex color string (e.g., '#FFFFFF')
 * @param alpha - Alpha value (0-1)
 * @returns RGBA color string
 *
 * @example
 * ```ts
 * hexToRgba('#FFFFFF', 0.5) // 'rgba(255, 255, 255, 0.5)'
 * ```
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
