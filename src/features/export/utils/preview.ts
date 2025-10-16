/**
 * Export preview utilities
 *
 * Provides functions to generate low-quality previews of canvas exports.
 * Uses same logic as export but with optimized settings for speed.
 */

import type Konva from 'konva';
import type { CanvasObject } from '@/types';
import { calculateBoundingBox } from '@/lib/utils/geometry';
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';

/**
 * Generate export preview
 *
 * Creates a preview of what will be exported.
 * Uses same bounding box logic as actual export.
 * Returns data URL for immediate display (no download).
 *
 * @param stageRef - React ref to Konva Stage
 * @param objectsToExport - Objects to include in preview
 * @param allObjects - All canvas objects (for group expansion)
 * @param scale - Optional scale factor (1x, 2x, 3x). Defaults to 1x for performance
 * @returns Data URL of preview image, or null if generation fails
 *
 * @example
 * ```tsx
 * const previewUrl = generateExportPreview(stageRef, selectedObjects, allObjects, 2);
 * if (previewUrl) {
 *   setPreviewUrl(previewUrl);
 * }
 * ```
 */
export function generateExportPreview(
  stageRef: React.RefObject<Konva.Stage | null>,
  objectsToExport: CanvasObject[],
  allObjects: CanvasObject[],
  scale: number = 1
): string | null {
  // Validate stage ref
  if (!stageRef.current) {
    return null;
  }

  const stage = stageRef.current;

  if (objectsToExport.length === 0) {
    return null;
  }

  try {
    // Expand groups: if a group is in export list, include its descendants
    const expandedIds = new Set<string>();
    objectsToExport.forEach(obj => {
      expandedIds.add(obj.id);
      if (obj.type === 'group') {
        const descendantIds = getAllDescendantIds(obj.id, allObjects);
        descendantIds.forEach(id => expandedIds.add(id));
      }
    });

    // Get all objects to export (including expanded descendants)
    const expandedObjects = allObjects.filter(obj => expandedIds.has(obj.id));

    // Filter out group objects (they have no visual representation)
    const visibleObjects = expandedObjects.filter(obj => obj.type !== 'group');

    if (visibleObjects.length === 0) {
      return null;
    }

    // Calculate bounding box
    const bbox = calculateBoundingBox(visibleObjects, allObjects);

    // Validate bounding box
    if (!isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
      return null;
    }

    // Generate preview with configurable quality
    // Use scale parameter to match export quality (1x = fast, 2x/3x = accurate)
    const dataURL = stage.toDataURL({
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      pixelRatio: scale, // Match export scale for accurate preview
      mimeType: 'image/png',
    });

    return dataURL;
  } catch (error) {
    console.error('Failed to generate preview:', error);
    return null;
  }
}
