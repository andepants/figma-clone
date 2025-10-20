/**
 * Spacing Calculator Utility
 *
 * Provides consistent spacing values for different component types.
 * Ensures visual consistency across all AI-generated layouts.
 */

/**
 * Component types with specific spacing requirements
 */
export type ComponentType =
  | 'form-field'      // 12px spacing between fields
  | 'form-section'    // 24px spacing between form sections
  | 'grid-cell'       // 16px gap between grid cells
  | 'card-internal'   // 8px padding inside cards
  | 'card-external'   // 20px margin around cards
  | 'navbar-item'     // 12px spacing between navbar items
  | 'default';        // 20px default spacing

/**
 * Get spacing value for a component type
 *
 * @param type - Component type
 * @returns Spacing value in pixels
 */
export function getSpacing(type: ComponentType): number {
  const spacingMap: Record<ComponentType, number> = {
    'form-field': 12,
    'form-section': 24,
    'grid-cell': 16,
    'card-internal': 8,
    'card-external': 20,
    'navbar-item': 12,
    'default': 20,
  };

  return spacingMap[type];
}

/**
 * Calculate total size for a layout with spacing
 *
 * Useful for calculating form heights, grid dimensions, etc.
 *
 * @param itemSizes - Array of item sizes (width or height)
 * @param spacing - Spacing type or custom pixel value
 * @returns Total size including items and gaps
 *
 * @example
 * // Form with 3 fields of 40px each with 12px spacing
 * calculateLayoutSize([40, 40, 40], 'form-field')
 * // Returns: 40 + 12 + 40 + 12 + 40 = 144
 *
 * @example
 * // Grid row with 4 cells of 100px each with 16px gaps
 * calculateLayoutSize([100, 100, 100, 100], 'grid-cell')
 * // Returns: 100 + 16 + 100 + 16 + 100 + 16 + 100 = 448
 */
export function calculateLayoutSize(
  itemSizes: number[],
  spacing: ComponentType | number
): number {
  // Handle empty array
  if (itemSizes.length === 0) {
    return 0;
  }

  // Get spacing value
  const gap = typeof spacing === 'number' ? spacing : getSpacing(spacing);

  // Clamp negative spacing to 0
  const clampedGap = Math.max(0, gap);

  // Sum all item sizes
  const totalItemSize = itemSizes.reduce((sum, size) => sum + size, 0);

  // Calculate total gap size (n-1 gaps for n items)
  const totalGaps = Math.max(0, itemSizes.length - 1) * clampedGap;

  return totalItemSize + totalGaps;
}

/**
 * Calculate positions for evenly-spaced items
 *
 * @param startPos - Starting position (x or y)
 * @param itemSizes - Array of item sizes
 * @param spacing - Spacing type or custom pixel value
 * @returns Array of positions for each item
 *
 * @example
 * // Position 3 buttons starting at x=100 with 12px spacing
 * calculateItemPositions(100, [80, 80, 80], 'navbar-item')
 * // Returns: [100, 192, 284]
 */
export function calculateItemPositions(
  startPos: number,
  itemSizes: number[],
  spacing: ComponentType | number
): number[] {
  const gap = typeof spacing === 'number' ? spacing : getSpacing(spacing);
  const clampedGap = Math.max(0, gap);

  const positions: number[] = [];
  let currentPos = startPos;

  for (const size of itemSizes) {
    positions.push(currentPos);
    currentPos += size + clampedGap;
  }

  return positions;
}
