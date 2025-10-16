/**
 * Layer Icon Component
 *
 * Renders type-specific icons for canvas objects in the layers panel.
 * Each shape type (rectangle, circle, text, line) has a corresponding icon.
 *
 * @module features/layers-panel/components/LayerIcon
 */

import { Square, Circle, Type, Minus } from 'lucide-react';
import type { ShapeType } from '@/types/canvas.types';

/**
 * Props for LayerIcon component
 *
 * @interface LayerIconProps
 * @property {ShapeType} type - Shape type to render icon for
 * @property {string} [className] - Optional additional CSS classes
 */
interface LayerIconProps {
  type: ShapeType;
  className?: string;
}

/**
 * Layer Icon Component
 *
 * Renders type-specific icon for canvas objects:
 * - Rectangle: Square icon
 * - Circle: Circle icon
 * - Text: Type icon
 * - Line: Minus icon
 * - Unknown: Faded square icon (fallback)
 *
 * Icons are 16x16px (w-4 h-4) with gray-600 color.
 *
 * @param {LayerIconProps} props - Component props
 * @returns {JSX.Element} Rendered icon component
 *
 * @example
 * ```tsx
 * <LayerIcon type="rectangle" />
 * <LayerIcon type="circle" className="custom-class" />
 * ```
 */
export function LayerIcon({ type, className = '' }: LayerIconProps) {
  const iconProps = {
    className: `w-4 h-4 text-gray-600 ${className}`,
    strokeWidth: 2,
  };

  switch (type) {
    case 'rectangle':
      return <Square {...iconProps} />;
    case 'circle':
      return <Circle {...iconProps} />;
    case 'text':
      return <Type {...iconProps} />;
    case 'line':
      return <Minus {...iconProps} />;
    default:
      // Fallback for unknown types - faded square icon
      return <Square {...iconProps} className={`${iconProps.className} opacity-30`} />;
  }
}
