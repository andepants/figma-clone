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

  const isDev = import.meta.env.DEV;

  try {
    if (isDev) {
      console.log('=== PREVIEW GENERATION START ===');
      console.log('Objects to export:', objectsToExport.map(obj => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        x: obj.x,
        y: obj.y,
        width: 'width' in obj ? obj.width : 'radius' in obj ? obj.radius * 2 : undefined,
        height: 'height' in obj ? obj.height : 'radius' in obj ? obj.radius * 2 : undefined,
      })));
    }

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

    if (isDev) {
      console.log('Visible objects for preview:', visibleObjects.map(obj => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        x: obj.x,
        y: obj.y,
        width: 'width' in obj ? obj.width : 'radius' in obj ? obj.radius * 2 : undefined,
        height: 'height' in obj ? obj.height : 'radius' in obj ? obj.radius * 2 : undefined,
      })));
    }

    // Calculate bounding box
    const bbox = calculateBoundingBox(visibleObjects, allObjects);

    if (isDev) {
      console.log('Preview bounding box:', bbox);
    }

    // Validate bounding box
    if (!isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
      return null;
    }

    // Get layers
    const layers = stage.getLayers();
    const backgroundLayer = layers[0];
    const objectsLayer = layers[1];
    const cursorsLayer = layers[2];

    // Store original visibility states
    const wasBackgroundVisible = backgroundLayer?.visible() ?? false;
    const wasCursorsVisible = cursorsLayer?.visible() ?? false;

    // Temporarily hide background and cursors layers
    if (isDev) console.log('Hiding background and cursors layers for preview...');
    backgroundLayer?.hide();
    cursorsLayer?.hide();

    // Hide all dimension labels (UI overlays that shouldn't appear in preview)
    // Dimension labels have name="dimension-label"
    const dimensionLabels = objectsLayer?.find('.dimension-label') || [];
    const dimensionLabelVisibility = dimensionLabels.map(label => label.visible());
    if (isDev) console.log(`Hiding ${dimensionLabels.length} dimension labels for preview...`);
    dimensionLabels.forEach(label => label.hide());

    // Force layer redraw
    if (isDev) console.log('Forcing layer redraw for preview...');
    objectsLayer?.batchDraw();

    // Generate preview with configurable quality
    // Use scale parameter to match export quality (1x = fast, 2x/3x = accurate)
    if (isDev) {
      console.log('Calling stage.toDataURL() with params:', {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        pixelRatio: scale,
      });
    }

    const dataURL = stage.toDataURL({
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      pixelRatio: scale, // Match export scale for accurate preview
      mimeType: 'image/png',
    });

    // Restore layer visibility
    if (isDev) console.log('Restoring layer visibility after preview...');
    if (wasBackgroundVisible) backgroundLayer?.show();
    if (wasCursorsVisible) cursorsLayer?.show();

    // Restore dimension labels visibility
    if (isDev) console.log('Restoring dimension labels after preview...');
    dimensionLabels.forEach((label, index) => {
      if (dimensionLabelVisibility[index]) {
        label.show();
      }
    });

    if (isDev) {
      console.log('Preview generated successfully, data URL length:', dataURL.length);
      console.log('=== PREVIEW GENERATION END ===');
    }

    return dataURL;
  } catch (error) {
    console.error('Failed to generate preview:', error);
    return null;
  }
}
