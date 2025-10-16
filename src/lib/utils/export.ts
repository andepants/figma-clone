/**
 * Export utilities for canvas
 *
 * Provides functions to export canvas objects to PNG files using Konva.js
 * toDataURL() method with high-quality settings.
 */

import type Konva from 'konva';
import type { CanvasObject } from '@/types';
import { calculateBoundingBox } from './geometry';
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';

/**
 * Export canvas to PNG file
 *
 * Exports selected objects (or entire canvas if none selected).
 * Uses Konva stage.toDataURL() with high quality settings (2x pixelRatio).
 * Automatically calculates bounding box and adds 20px padding.
 * Downloads PNG file with timestamped filename.
 *
 * @param stageRef - React ref to Konva Stage
 * @param selectedObjects - Currently selected objects (if any)
 * @param allObjects - All canvas objects
 * @returns Promise that resolves when download starts
 *
 * @throws {Error} If stage ref is not available
 * @throws {Error} If no objects to export
 *
 * @example
 * ```tsx
 * // Export selected objects
 * await exportCanvasToPNG(stageRef, selectedObjects, allObjects);
 *
 * // Export entire canvas
 * await exportCanvasToPNG(stageRef, [], allObjects);
 * ```
 */
export async function exportCanvasToPNG(
  stageRef: React.RefObject<Konva.Stage>,
  selectedObjects: CanvasObject[],
  allObjects: CanvasObject[]
): Promise<void> {
  // Validate stage ref
  if (!stageRef.current) {
    throw new Error('Stage ref not available');
  }

  const stage = stageRef.current;

  // Determine what to export: selected objects or all objects
  let objectsToExport = selectedObjects.length > 0 ? selectedObjects : allObjects;

  if (objectsToExport.length === 0) {
    throw new Error('No objects to export');
  }

  // Expand groups: if a group is selected, include its descendants
  // This ensures exporting a group exports its children
  const expandedIds = new Set<string>();
  objectsToExport.forEach(obj => {
    expandedIds.add(obj.id);
    if (obj.type === 'group') {
      // Add all descendants of this group
      const descendantIds = getAllDescendantIds(obj.id, allObjects);
      descendantIds.forEach(id => expandedIds.add(id));
    }
  });

  // Get all objects to export (including expanded descendants)
  const expandedObjects = allObjects.filter(obj => expandedIds.has(obj.id));

  // Filter out group objects (they have no visual representation)
  // Only export actual shapes with visual properties
  // Groups are purely hierarchical - their children render directly on canvas
  //
  // DECISION: Include hidden objects in export (Figma behavior)
  // Hidden objects (visible: false) are included in the export.
  // This matches Figma's behavior where hiding an object in the editor
  // doesn't exclude it from exports. Users can delete objects if they
  // don't want them exported.
  //
  // Rationale:
  // - Consistency with Figma UX
  // - Simpler implementation (no additional filtering)
  // - Preserves all design elements
  // - Hidden objects still exist on canvas, just not visible in editor
  const visibleObjects = expandedObjects.filter(obj => obj.type !== 'group');

  if (visibleObjects.length === 0) {
    throw new Error('No visible objects to export');
  }

  // Calculate bounding box of objects to export
  const bbox = calculateBoundingBox(visibleObjects);

  // Add padding (20px on each side)
  const padding = 20;
  const exportX = bbox.x - padding;
  const exportY = bbox.y - padding;
  const exportWidth = bbox.width + padding * 2;
  const exportHeight = bbox.height + padding * 2;

  // Export stage as data URL
  // Use high quality settings: 2x pixelRatio for crisp export
  const dataURL = stage.toDataURL({
    x: exportX,
    y: exportY,
    width: exportWidth,
    height: exportHeight,
    pixelRatio: 2, // High quality (2x resolution)
    mimeType: 'image/png',
  });

  // Generate filename with timestamp
  // Format: collabcanvas-YYYY-MM-DD-HH-MM-SS.png
  const now = new Date();
  const timestamp = now
    .toISOString()
    .slice(0, 19)
    .replace('T', '-')
    .replace(/:/g, '-');
  const filename = `collabcanvas-${timestamp}.png`;

  // Trigger browser download
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
