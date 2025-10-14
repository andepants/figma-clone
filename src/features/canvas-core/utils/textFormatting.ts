/**
 * Text Formatting Utilities
 *
 * Utilities for formatting and transforming text properties for Konva rendering.
 */

import type { Text } from '@/types';

/**
 * Build fontStyle string for Konva (combines weight and style)
 *
 * Konva expects format like "italic bold" or "normal" or "bold"
 *
 * @param fontWeight - Font weight (400, 700, 'bold', etc.)
 * @param fontStyle - Font style ('normal' or 'italic')
 * @returns Formatted font style string for Konva
 *
 * @example
 * ```ts
 * getFontStyle(700, 'italic') // 'italic bold'
 * getFontStyle(400, 'normal') // 'normal'
 * ```
 */
export function getFontStyle(
  fontWeight: number | string = 400,
  fontStyle: string = 'normal'
): string {
  const parts: string[] = [];
  if (fontStyle === 'italic') parts.push('italic');
  if ((typeof fontWeight === 'number' && fontWeight >= 700) || fontWeight === 'bold') {
    parts.push('bold');
  }

  return parts.length > 0 ? parts.join(' ') : 'normal';
}

/**
 * Apply text transform to text content
 *
 * Supports uppercase, lowercase, capitalize, and none transformations.
 *
 * @param text - Original text string
 * @param transform - Transform type
 * @returns Transformed text
 *
 * @example
 * ```ts
 * applyTextTransform('hello world', 'uppercase') // 'HELLO WORLD'
 * applyTextTransform('HELLO WORLD', 'capitalize') // 'Hello World'
 * ```
 */
export function applyTextTransform(
  text: string,
  transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' = 'none'
): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case 'none':
    default:
      return text;
  }
}

/**
 * Get shadow properties for Konva Text from text object
 *
 * Extracts and formats shadow properties for Konva rendering.
 *
 * @param text - Text object with shadow properties
 * @returns Shadow properties object for Konva
 */
export function getTextShadowProps(text: Text) {
  return {
    shadowColor: text.shadowColor,
    shadowBlur: text.shadowBlur ?? 0,
    shadowOffsetX: text.shadowOffsetX ?? 0,
    shadowOffsetY: text.shadowOffsetY ?? 0,
    shadowOpacity: text.shadowOpacity ?? 1,
    shadowEnabled: text.shadowEnabled ?? false,
  };
}
