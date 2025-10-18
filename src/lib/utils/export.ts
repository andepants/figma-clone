/**
 * Export utilities for canvas
 *
 * Provides functions to export canvas objects to PNG files using Konva.js
 * toDataURL() method with high-quality settings.
 */

import type Konva from 'konva';
import type { CanvasObject } from '@/types';
import type { ExportOptions, ExportFormat, ExportScale, ExportScope } from '@/features/export';
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';

/**
 * Export result data
 * Contains all information needed to save export to Firebase
 */
export interface ExportResult {
  /** Base64 data URL of exported PNG */
  dataUrl: string
  /** Generated filename */
  filename: string
  /** Export metadata */
  metadata: {
    /** Export format (currently always 'png') */
    format: ExportFormat
    /** Resolution multiplier (1x, 2x, 3x) */
    scale: ExportScale
    /** What was exported (selection or all objects) */
    scope: ExportScope
    /** Number of objects exported */
    objectCount: number
    /** Exported image width in pixels */
    width: number
    /** Exported image height in pixels */
    height: number
  }
}

/**
 * Export canvas to PNG file
 *
 * Exports canvas objects based on provided options.
 * Uses Konva stage.toDataURL() with configurable quality settings.
 * Automatically calculates tight bounding box around objects (no padding).
 * Accounts for stroke width, shadows, and line thickness in bounds calculation.
 * PNG exports have transparent background; empty space between objects is transparent.
 * Downloads PNG file with timestamped filename.
 *
 * @param stageRef - React ref to Konva Stage
 * @param selectedObjects - Currently selected objects (if any)
 * @param allObjects - All canvas objects (used for group expansion)
 * @param options - Export options (format, scale, scope)
 * @returns Promise resolving to export result data (dataUrl, filename, metadata)
 *
 * @throws {Error} If stage ref is not available
 * @throws {Error} If no objects to export
 * @throws {Error} If bounding box is invalid (non-finite or zero dimensions)
 *
 * @example
 * ```tsx
 * // Export selected objects at 2x resolution
 * const result = await exportCanvasToPNG(stageRef, selectedObjects, allObjects, {
 *   format: 'png',
 *   scale: 2,
 *   scope: 'selection'
 * });
 * console.log('Export result:', result);
 *
 * // Export entire canvas at 3x resolution
 * const result = await exportCanvasToPNG(stageRef, [], allObjects, {
 *   format: 'png',
 *   scale: 3,
 *   scope: 'all'
 * });
 * ```
 */
export async function exportCanvasToPNG(
  stageRef: React.RefObject<Konva.Stage | null>,
  selectedObjects: CanvasObject[],
  allObjects: CanvasObject[],
  options: ExportOptions = { format: 'png', scale: 2, scope: 'selection' }
): Promise<ExportResult> {
  // Validate stage ref
  if (!stageRef.current) {
    throw new Error('Stage ref not available');
  }

  const stage = stageRef.current;

  // Determine what to export based on scope option
  let objectsToExport: CanvasObject[];
  if (options.scope === 'selection') {
    // Export selection if available, otherwise all objects
    objectsToExport = selectedObjects.length > 0 ? selectedObjects : allObjects;
  } else {
    // Export all objects
    objectsToExport = allObjects;
  }

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

  // Get the objects layer (second layer, index 1)
  // Layer 0 = Background Layer (infinite canvas background)
  // Layer 1 = Objects Layer (shapes, selections, etc.)
  // Layer 2 = Cursors Layer (user cursors)
  const layers = stage.getLayers();
  const objectsLayer = layers[1]; // Objects layer

  if (!objectsLayer) {
    throw new Error('Objects layer not found');
  }

  /**
   * Calculate bounding box from actual Konva nodes
   *
   * CRITICAL: Use Konva's getClientRect() to get ACTUAL rendered bounds
   * This accounts for all transforms (rotation, scale, skew) automatically
   * and is not affected by viewport position/zoom.
   *
   * This is much more reliable than manual transform calculations!
   */

  // Get IDs of objects to export
  const idsToExport = new Set(visibleObjects.map(obj => obj.id));

  // Find all Konva nodes that match our object IDs
  // Nodes have id attribute that matches our object.id
  const nodesToExport: Konva.Node[] = [];
  objectsLayer.getChildren().forEach((node) => {
    const nodeId = node.id();
    if (nodeId && idsToExport.has(nodeId)) {
      nodesToExport.push(node);
    }
  });

  if (nodesToExport.length === 0) {
    throw new Error('No nodes found to export - shapes may not be rendered yet');
  }

  // Calculate bounding box from actual rendered nodes
  // Use getClientRect() which gives us the actual visual bounds including transforms
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodesToExport.forEach((node) => {
    // getClientRect() returns the bounding box in absolute coordinates
    // It includes all transforms (rotation, scale, skew, offset)
    // skipTransform: false means we want transformed bounds (default)
    // skipShadow: false means we want to include shadow in bounds (default)
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

  // Validate bounding box (handle edge case of invalid bounds)
  if (!isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
    throw new Error('Invalid bounding box - cannot export');
  }

  // Export stage as data URL
  // Use configurable quality settings from options.scale
  // PNG format automatically provides transparent background
  // Export only the bounding box without padding (exact screenshot)

  // CRITICAL FIX: Export from the entire stage, not just one layer
  // This ensures all shape properties (fill, stroke, etc.) are captured correctly.
  // We hide the background and cursors layers temporarily to avoid interference.

  // Temporarily hide background and cursors layers
  const backgroundLayer = layers[0];
  const cursorsLayer = layers[2];

  const wasBackgroundVisible = backgroundLayer?.visible() ?? false;
  const wasCursorsVisible = cursorsLayer?.visible() ?? false;

  backgroundLayer?.hide();
  cursorsLayer?.hide();

  // Hide all UI overlays that shouldn't appear in exports
  // - Dimension labels (name="dimension-label")
  // - Resize handles (name="resize-handles")
  // - Text selection boxes (Group nodes that are children of text shapes)
  const dimensionLabels = objectsLayer.find('.dimension-label');
  const dimensionLabelVisibility = dimensionLabels.map(label => label.visible());
  dimensionLabels.forEach(label => label.hide());

  const resizeHandles = objectsLayer.find('.resize-handles');
  const resizeHandlesVisibility = resizeHandles.map(handle => handle.visible());
  resizeHandles.forEach(handle => handle.hide());

  // Hide text selection boxes (TextSelectionBox components)
  // These are Group nodes that contain Rect and Line elements for text selection visualization
  // They appear as siblings to Text nodes in the objects layer
  const textSelectionBoxes: Konva.Node[] = [];
  const textSelectionBoxVisibility: boolean[] = [];
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

  // Temporarily remove selection styling from nodes being exported
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
    nodeStrokeBackup.push({
      node,
      stroke: shape.stroke(),
      strokeWidth: shape.strokeWidth(),
      shadowEnabled: shape.shadowEnabled(),
      shadowColor: shape.shadowColor(),
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

  // Force layer redraw to apply stroke changes before export
  objectsLayer.batchDraw();

  // Export the stage (now only includes objects layer)
  const dataURL = stage.toDataURL({
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    pixelRatio: options.scale, // Use scale from options (1x, 2x, or 3x)
    mimeType: 'image/png',
  });

  // Restore selection styling on exported nodes
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
  objectsLayer.batchDraw();

  // Generate filename with timestamp
  // Format: canvasicons-YYYY-MM-DD-HH-MM-SS.png
  const now = new Date();
  const timestamp = now
    .toISOString()
    .slice(0, 19)
    .replace('T', '-')
    .replace(/:/g, '-');
  const filename = `canvasicons-${timestamp}.png`;

  // Collect export result data (for Firebase upload)
  const result: ExportResult = {
    dataUrl: dataURL,
    filename,
    metadata: {
      format: 'png',
      scale: options.scale,
      scope: options.scope,
      objectCount: visibleObjects.length,
      width: Math.round(bbox.width * options.scale),
      height: Math.round(bbox.height * options.scale),
    }
  };

  // Trigger browser download
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Return result for Firebase upload
  return result;
}
