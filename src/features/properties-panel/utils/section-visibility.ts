/**
 * Section Visibility Logic
 *
 * Determines which property sections should be shown
 * based on the selected shape type.
 */

import type { CanvasObject } from '@/types/canvas.types';

export interface SectionVisibility {
  position: boolean;   // X, Y coordinates and alignment
  rotation: boolean;   // Rotation angle and flip
  layout: boolean;     // Dimensions (width/height/radius)
  appearance: boolean; // Opacity and shape-specific appearance
  fill: boolean;       // Fill color
  stroke: boolean;     // Stroke properties (future)
  text: boolean;       // Text-specific properties
  effects: boolean;    // Shadow and effects (future)
}

/**
 * Get section visibility for a given shape
 * Returns which sections should be displayed in the properties panel
 *
 * @param shape - The canvas object to determine visibility for (null if no selection)
 * @returns Object mapping section names to their visibility
 *
 * @example
 * ```ts
 * const visibility = getSectionVisibility(selectedShape);
 * if (visibility.position) {
 *   return <PositionSection />;
 * }
 * ```
 */
export function getSectionVisibility(shape: CanvasObject | null): SectionVisibility {
  // No selection - hide all sections
  if (!shape) {
    return {
      position: false,
      rotation: false,
      layout: false,
      appearance: false,
      fill: false,
      stroke: false,
      text: false,
      effects: false,
    };
  }

  // Common sections for all shapes
  const commonSections = {
    position: true,  // All shapes have position
    rotation: true,  // All shapes can be rotated
    fill: true,      // All shapes have fill
    stroke: false,   // All shapes can have stroke (future implementation)
    effects: false,  // All shapes can have effects (future implementation)
  };

  // Shape-specific visibility
  switch (shape.type) {
    case 'rectangle':
      return {
        ...commonSections,
        layout: true,      // Show width × height
        appearance: true,  // Show opacity + corner radius
        text: false,       // No text properties
      };

    case 'circle':
      return {
        ...commonSections,
        layout: true,      // Show radius/diameter
        appearance: true,  // Show opacity only (no corner radius)
        text: false,       // No text properties
      };

    case 'text':
      return {
        ...commonSections,
        layout: true,      // Show text box width
        appearance: true,  // Show opacity
        text: true,        // Show font, alignment, etc.
      };

    case 'line':
      return {
        ...commonSections,
        layout: true,      // Show width (line length)
        appearance: true,  // Show opacity only (no corner radius)
        stroke: true,      // Show stroke color and width
        text: false,       // No text properties
        fill: false,       // Lines don't have fill
      };

    default:
      // Unknown shape type - show common sections only
      return {
        ...commonSections,
        layout: true,
        appearance: true,
        text: false,
      };
  }
}

/**
 * Get section visibility for specific section
 * Useful for individual section checks
 *
 * @param shape - The canvas object
 * @param section - The section name to check
 * @returns Whether the section should be visible
 *
 * @example
 * ```ts
 * if (isSectionVisible(shape, 'appearance')) {
 *   return <AppearanceSection />;
 * }
 * ```
 */
export function isSectionVisible(
  shape: CanvasObject | null,
  section: keyof SectionVisibility
): boolean {
  const visibility = getSectionVisibility(shape);
  return visibility[section];
}

/**
 * Get list of visible section names
 * Useful for rendering order or debugging
 *
 * @param shape - The canvas object
 * @returns Array of visible section names
 *
 * @example
 * ```ts
 * const visibleSections = getVisibleSectionNames(shape);
 * // visibleSections: ['position', 'layout', 'fill']
 * ```
 */
export function getVisibleSectionNames(shape: CanvasObject | null): string[] {
  const visibility = getSectionVisibility(shape);
  return Object.entries(visibility)
    .filter(([, isVisible]) => isVisible)
    .map(([name]) => name);
}
