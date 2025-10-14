/**
 * Properties Panel Component
 *
 * Main container for the properties panel.
 * Shows property sections for the selected shape.
 */

import { Square, Circle as CircleIcon, Type, Layers } from 'lucide-react';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { getSectionVisibility } from '../utils/section-visibility';
import { PositionSection } from './PositionSection';
import { RotationSection } from './RotationSection';
import { LayoutSection } from './LayoutSection';
import { TypographySection } from './TypographySection';
import { AppearanceSection } from './AppearanceSection';
import { FillSection } from './FillSection';

/**
 * PropertiesPanel Component
 *
 * Fixed right sidebar that displays property controls for the selected shape.
 * Shows different sections based on the shape type.
 * Shows empty state when nothing is selected.
 *
 * @example
 * ```tsx
 * <PropertiesPanel />
 * ```
 */
export function PropertiesPanel() {
  const shape = useSelectedShape();
  const visibility = getSectionVisibility(shape);

  // Empty state - no selection
  if (!shape) {
    return (
      <div className="fixed right-0 top-16 bottom-0 w-[300px] bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-400 px-4">
          <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a shape to view properties</p>
        </div>
      </div>
    );
  }

  // Get shape icon
  function getShapeIcon() {
    switch (shape.type) {
      case 'rectangle':
        return <Square className="w-4 h-4 text-gray-600" />;
      case 'circle':
        return <CircleIcon className="w-4 h-4 text-gray-600" />;
      case 'text':
        return <Type className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
      {/* Shape Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          {getShapeIcon()}
          <span className="font-medium text-sm capitalize">{shape.type}</span>
        </div>
      </div>

      {/* Property Sections - conditionally rendered based on shape type */}
      <div className="divide-y divide-gray-200">
        {visibility.position && <PositionSection />}
        {visibility.rotation && <RotationSection />}
        {visibility.layout && <LayoutSection />}
        {visibility.text && <TypographySection />}
        {visibility.appearance && <AppearanceSection />}
        {visibility.fill && <FillSection />}
      </div>
    </div>
  );
}
