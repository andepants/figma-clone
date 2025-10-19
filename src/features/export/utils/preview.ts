/**
 * Export preview utilities
 *
 * Provides functions to generate low-quality previews of canvas exports.
 * Uses same logic as export but with optimized settings for speed.
 */

import type Konva from 'konva';
import type { CanvasObject } from '@/types';
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
 * @param padding - Optional padding around export in pixels. Defaults to 0
 * @returns Data URL of preview image, or null if generation fails
 *
 * @example
 * ```tsx
 * const previewUrl = generateExportPreview(stageRef, selectedObjects, allObjects, 2, 10);
 * if (previewUrl) {
 *   setPreviewUrl(previewUrl);
 * }
 * ```
 */
export function generateExportPreview(
  stageRef: React.RefObject<Konva.Stage | null>,
  objectsToExport: CanvasObject[],
  allObjects: CanvasObject[],
  scale: number = 1,
  padding: number = 0
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

    // Get layers
    const layers = stage.getLayers();
    const backgroundLayer = layers[0];
    const objectsLayer = layers[1];
    const cursorsLayer = layers[2];

    if (!objectsLayer) {
      return null;
    }

    /**
     * Calculate bounding box from actual Konva nodes
     *
     * Use Konva's getClientRect() to get ACTUAL rendered bounds
     * This matches the export logic exactly!
     */

    // Get IDs of objects to export
    const idsToExport = new Set(visibleObjects.map(obj => obj.id));

    // Find all Konva nodes that match our object IDs
    const nodesToExport: Konva.Node[] = [];
    objectsLayer.getChildren().forEach((node) => {
      const nodeId = node.id();
      if (nodeId && idsToExport.has(nodeId)) {
        nodesToExport.push(node);
      }
    });

    if (nodesToExport.length === 0) {
      return null;
    }

    // Calculate bounding box from actual rendered nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodesToExport.forEach((node) => {
      const rect = node.getClientRect({
        skipTransform: false,
        skipShadow: false,
        skipStroke: false,
      });

      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    });

    const bbox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Validate bounding box
    if (!isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
      return null;
    }

    // Apply padding to bounding box (same logic as export)
    const paddedBbox = {
      x: bbox.x - padding,
      y: bbox.y - padding,
      width: bbox.width + (padding * 2),
      height: bbox.height + (padding * 2),
    };

    // Store original visibility states
    const wasBackgroundVisible = backgroundLayer?.visible() ?? false;
    const wasCursorsVisible = cursorsLayer?.visible() ?? false;

    // Temporarily hide background and cursors layers
    backgroundLayer?.hide();
    cursorsLayer?.hide();

    // Hide all dimension labels (UI overlays that shouldn't appear in preview)
    // Dimension labels have name="dimension-label"
    const dimensionLabels = objectsLayer?.find('.dimension-label') || [];
    const dimensionLabelVisibility = dimensionLabels.map(label => label.visible());
    dimensionLabels.forEach(label => label.hide());

    // Hide all resize handles (UI overlays that shouldn't appear in preview)
    // Resize handles have name="resize-handles"
    const resizeHandles = objectsLayer?.find('.resize-handles') || [];
    const resizeHandlesVisibility = resizeHandles.map(handle => handle.visible());
    resizeHandles.forEach(handle => handle.hide());

    // Hide text selection boxes (TextSelectionBox components)
    // These are Group nodes that contain Rect and Line elements for text selection visualization
    const textSelectionBoxes: Konva.Node[] = [];
    const textSelectionBoxVisibility: boolean[] = [];
    if (objectsLayer) {
      objectsLayer.getChildren().forEach((node) => {
        // TextSelectionBox is a Group with specific structure (contains Rect/Line for selection)
        if (node.getClassName() === 'Group') {
          // Check if this group is a text selection box by examining its children
          const children = (node as Konva.Group).getChildren();
          const hasRect = children.some(child => child.getClassName() === 'Rect');
          const hasLine = children.some(child => child.getClassName() === 'Line');
          // TextSelectionBox has both Rect (bounding box) and Line (underline)
          if (hasRect && hasLine) {
            textSelectionBoxes.push(node);
            textSelectionBoxVisibility.push(node.visible());
            node.hide();
          }
        }
      });
    }

    // Temporarily remove selection styling from nodes in preview
    // Store original stroke properties and reset to base values
    const nodeStrokeBackup: Array<{
      node: Konva.Node;
      stroke: string | undefined;
      strokeWidth: number | undefined;
      shadowEnabled: boolean | undefined;
      shadowColor: string | undefined;
    }> = [];

    nodesToExport.forEach((node) => {
      // Get the shape's methods (they're Konva.Shape instances)
      const shape = node as Konva.Shape;

      // Backup current stroke properties (selection styling)
      const currentStroke = shape.stroke();
      const currentShadowColor = shape.shadowColor();
      nodeStrokeBackup.push({
        node,
        stroke: typeof currentStroke === 'string' ? currentStroke : undefined,
        strokeWidth: shape.strokeWidth(),
        shadowEnabled: shape.shadowEnabled(),
        shadowColor: typeof currentShadowColor === 'string' ? currentShadowColor : undefined,
      });

      // Find the original object data to get base stroke values
      const objectId = node.id();
      const originalObject = visibleObjects.find(obj => obj.id === objectId);

      if (originalObject) {
        // Reset to base stroke (remove selection blue outline)
        // If object has its own stroke, use it; otherwise, no stroke
        if ('stroke' in originalObject && originalObject.stroke && originalObject.strokeEnabled !== false) {
          shape.stroke(originalObject.stroke);
          shape.strokeWidth(originalObject.strokeWidth ?? 0);
        } else {
          // No base stroke - remove selection outline entirely
          shape.stroke(undefined);
          shape.strokeWidth(0);
        }

        // Remove selection glow (shadows added for selection feedback)
        // Only keep shadow if it's part of the original object design
        if ('shadowEnabled' in originalObject) {
          shape.shadowEnabled(originalObject.shadowEnabled ?? false);
          if (originalObject.shadowColor) {
            shape.shadowColor(originalObject.shadowColor);
          }
        } else {
          shape.shadowEnabled(false);
        }
      }
    });

    // Force layer redraw to apply stroke changes before preview
    objectsLayer?.batchDraw();

    // Generate preview with configurable quality
    // Use scale parameter to match export quality (1x = fast, 2x/3x = accurate)
    // Use padded bounding box to match export with padding
    const dataURL = stage.toDataURL({
      x: paddedBbox.x,
      y: paddedBbox.y,
      width: paddedBbox.width,
      height: paddedBbox.height,
      pixelRatio: scale, // Match export scale for accurate preview
      mimeType: 'image/png',
    });

    // Restore selection styling on nodes
    nodeStrokeBackup.forEach(({ node, stroke, strokeWidth, shadowEnabled, shadowColor }) => {
      const shape = node as Konva.Shape;
      shape.stroke(stroke);
      shape.strokeWidth(strokeWidth ?? 0);
      shape.shadowEnabled(shadowEnabled ?? false);
      if (shadowColor) {
        shape.shadowColor(shadowColor);
      }
    });

    // Restore layer visibility
    if (wasBackgroundVisible) backgroundLayer?.show();
    if (wasCursorsVisible) cursorsLayer?.show();

    // Restore dimension labels visibility
    dimensionLabels.forEach((label, index) => {
      if (dimensionLabelVisibility[index]) {
        label.show();
      }
    });

    // Restore resize handles visibility
    resizeHandles.forEach((handle, index) => {
      if (resizeHandlesVisibility[index]) {
        handle.show();
      }
    });

    // Restore text selection boxes visibility
    textSelectionBoxes.forEach((box, index) => {
      if (textSelectionBoxVisibility[index]) {
        box.show();
      }
    });

    // Force redraw to restore selection visuals
    objectsLayer?.batchDraw();

    return dataURL;
  } catch (error) {
    console.error('Failed to generate preview:', error);
    return null;
  }
}
