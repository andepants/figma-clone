/**
 * Context Optimization Utilities
 *
 * Reduces token usage by sending only relevant canvas objects to the LLM.
 * Prioritizes selected objects and visible/unlocked objects.
 */

import * as logger from 'firebase-functions/logger';
import {CanvasObject, CanvasState} from '../../types.js';

/**
 * Optimize canvas context for LLM consumption
 *
 * Reduces token count by:
 * - Limiting to 100 objects max
 * - Prioritizing selected objects
 * - Filtering visible/unlocked objects
 * - Removing unnecessary fields
 * - Rounding coordinates
 *
 * @param canvasState - Full canvas state
 * @returns Optimized canvas state with minimal tokens
 */
export function optimizeContext(canvasState: CanvasState): CanvasState {
  let objects = canvasState.objects || [];

  // Priority 1: Selected objects (always include)
  const selectedObjects = objects.filter((obj) =>
    canvasState.selectedObjectIds?.includes(obj.id)
  );

  // Priority 2: Visible, unlocked objects (most likely to be manipulated)
  const visibleObjects = objects
    .filter((obj) => obj.visible !== false && !obj.locked)
    .slice(0, 50); // Limit to 50 visible objects

  // Combine and deduplicate
  const relevantObjects = [
    ...selectedObjects,
    ...visibleObjects.filter(
      (obj) => !selectedObjects.find((s) => s.id === obj.id)
    ),
  ].slice(0, 100); // Hard limit: 100 objects total

  logger.info('Context optimization', {
    originalCount: objects.length,
    selectedCount: selectedObjects.length,
    optimizedCount: relevantObjects.length,
  });

  // Simplify objects to reduce token count
  const simplifiedObjects = relevantObjects.map(simplifyObject);

  return {
    ...canvasState,
    objects: simplifiedObjects,
  };
}

/**
 * Simplify object by removing unnecessary fields and rounding numbers
 *
 * @param obj - Full canvas object
 * @returns Simplified object with essential fields only
 */
function simplifyObject(obj: CanvasObject): CanvasObject {
  const simplified: CanvasObject = {
    id: obj.id,
    type: obj.type,
    x: Math.round(obj.x),
    y: Math.round(obj.y),
    visible: obj.visible ?? true,
    locked: obj.locked ?? false,
  };

  // Add dimensions if present
  if (obj.width !== undefined) {
    simplified.width = Math.round(obj.width);
  }
  if (obj.height !== undefined) {
    simplified.height = Math.round(obj.height);
  }
  if (obj.radius !== undefined) {
    simplified.radius = Math.round(obj.radius);
  }

  // Add name if present (helps LLM identify objects)
  if (obj.name) {
    simplified.name = obj.name;
  }

  // Add fill color (helps with color-based queries)
  if (obj.fill) {
    simplified.fill = obj.fill;
  }

  // Add locked/visible state if not default
  if (obj.locked) {
    simplified.locked = true;
  }
  if (obj.visible === false) {
    simplified.visible = false;
  }

  return simplified;
}

/**
 * Get object count summary for logging
 *
 * @param canvasState - Canvas state
 * @returns Summary of object counts by type
 */
export function getObjectSummary(canvasState: CanvasState): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const obj of canvasState.objects) {
    summary[obj.type] = (summary[obj.type] || 0) + 1;
  }

  return summary;
}
