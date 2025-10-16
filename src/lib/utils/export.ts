/**
 * Export utilities for canvas
 *
 * Provides functions to export canvas objects to PNG files using Konva.js
 * toDataURL() method with high-quality settings.
 */

import type Konva from 'konva';
import type { CanvasObject } from '@/types';
import type { ExportOptions } from '@/features/export';
import { calculateBoundingBox } from './geometry';
import { getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';

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
 * @returns Promise that resolves when download starts
 *
 * @throws {Error} If stage ref is not available
 * @throws {Error} If no objects to export
 * @throws {Error} If bounding box is invalid (non-finite or zero dimensions)
 *
 * @example
 * ```tsx
 * // Export selected objects at 2x resolution
 * await exportCanvasToPNG(stageRef, selectedObjects, allObjects, {
 *   format: 'png',
 *   scale: 2,
 *   scope: 'selection'
 * });
 *
 * // Export entire canvas at 3x resolution
 * await exportCanvasToPNG(stageRef, [], allObjects, {
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
): Promise<void> {
  console.log('=== EXPORT START ===');
  console.log('Export options:', options);
  console.log('Selected objects count:', selectedObjects.length);
  console.log('All objects count:', allObjects.length);

  // Validate stage ref
  if (!stageRef.current) {
    console.error('Export failed: Stage ref not available');
    throw new Error('Stage ref not available');
  }

  const stage = stageRef.current;
  console.log('Stage found:', stage);

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
    console.error('Export failed: No objects to export');
    throw new Error('No objects to export');
  }

  console.log('Objects to export (before group expansion):', objectsToExport.length);

  // Expand groups: if a group is selected, include its descendants
  // This ensures exporting a group exports its children
  const expandedIds = new Set<string>();
  objectsToExport.forEach(obj => {
    expandedIds.add(obj.id);
    if (obj.type === 'group') {
      // Add all descendants of this group
      const descendantIds = getAllDescendantIds(obj.id, allObjects);
      console.log(`Group ${obj.id} has ${descendantIds.length} descendants`);
      descendantIds.forEach(id => expandedIds.add(id));
    }
  });

  // Get all objects to export (including expanded descendants)
  const expandedObjects = allObjects.filter(obj => expandedIds.has(obj.id));
  console.log('Objects after group expansion:', expandedObjects.length);

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
  console.log('Visible objects (excluding groups):', visibleObjects.length);

  if (visibleObjects.length === 0) {
    console.error('Export failed: No visible objects to export (all objects are groups)');
    throw new Error('No visible objects to export');
  }

  // Calculate bounding box of objects to export
  console.log('Calculating bounding box...');
  const bbox = calculateBoundingBox(visibleObjects, allObjects);
  console.log('Calculated bbox:', bbox);

  // Validate bounding box (handle edge case of invalid bounds)
  if (!isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
    console.error('Export failed: Invalid bounding box', bbox);
    throw new Error('Invalid bounding box - cannot export');
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

  // Export stage as data URL
  // Use configurable quality settings from options.scale
  // PNG format automatically provides transparent background
  // Export only the bounding box without padding (exact screenshot)
  console.log('Preparing to export with params:', {
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    pixelRatio: options.scale,
  });

  // CRITICAL FIX: Export from the entire stage, not just one layer
  // This ensures all shape properties (fill, stroke, etc.) are captured correctly.
  // We hide the background and cursors layers temporarily to avoid interference.

  // Temporarily hide background and cursors layers
  const backgroundLayer = layers[0];
  const cursorsLayer = layers[2];

  const wasBackgroundVisible = backgroundLayer?.visible() ?? false;
  const wasCursorsVisible = cursorsLayer?.visible() ?? false;

  console.log('Hiding background and cursors layers...');
  backgroundLayer?.hide();
  cursorsLayer?.hide();

  // Force layer redraw to ensure all shapes are fully rendered
  console.log('Forcing layer redraw...');
  objectsLayer.batchDraw();

  // Export the stage (now only includes objects layer)
  console.log('Calling stage.toDataURL()...');
  const dataURL = stage.toDataURL({
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    pixelRatio: options.scale, // Use scale from options (1x, 2x, or 3x)
    mimeType: 'image/png',
  });

  console.log('toDataURL() successful, data URL length:', dataURL.length);

  // Restore layer visibility
  console.log('Restoring layer visibility...');
  if (wasBackgroundVisible) backgroundLayer?.show();
  if (wasCursorsVisible) cursorsLayer?.show();

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
  console.log('Triggering download with filename:', filename);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log('=== EXPORT COMPLETE ===');
  console.log('Successfully exported', visibleObjects.length, 'objects');
  console.log('Export scope:', options.scope);
  console.log('Export scale:', options.scale + 'x');
  console.log('Filename:', filename);
  console.log('=======================');
}
