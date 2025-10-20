/**
 * Context Optimization Utilities
 *
 * Reduces token usage by sending only relevant canvas objects to the LLM.
 * Prioritizes viewport-visible objects, selected objects, and recent AI creations.
 */

import * as logger from 'firebase-functions/logger';
import {CanvasObject, CanvasState} from '../../types.js';
import {
  calculateViewportBounds,
  isObjectInViewport,
  distanceFromViewportCenter,
  ViewportBounds,
} from './viewport-calculator.js';

/**
 * Optimize canvas context for LLM consumption with viewport awareness
 *
 * Priority order:
 * 1. Selected objects (always include)
 * 2. Objects in viewport (visible to user)
 * 3. Recently created AI objects (last 5 minutes)
 * 4. Other visible, unlocked objects
 *
 * Reduces token count by:
 * - Limiting to 100 objects max
 * - Prioritizing viewport-visible objects
 * - Removing unnecessary fields
 * - Rounding coordinates
 *
 * @param canvasState - Full canvas state
 * @returns Optimized canvas state with minimal tokens
 */
export function optimizeContext(canvasState: CanvasState): CanvasState {
  const objects = canvasState.objects || [];

  // Skip optimization for small canvases (<20 objects)
  if (objects.length < 20) {
    logger.info('Skipping context optimization (small canvas)', {
      objectCount: objects.length,
    });
    return canvasState;
  }

  // Calculate viewport bounds if provided
  let viewportBounds: ViewportBounds | null = null;
  if (canvasState.viewport) {
    viewportBounds = calculateViewportBounds(canvasState.viewport);
    logger.info('Viewport bounds calculated', {
      bounds: viewportBounds,
      zoom: canvasState.viewport.zoom,
    });
  }

  // Priority 1: Selected objects (always include)
  const selectedObjects = objects.filter((obj) =>
    canvasState.selectedObjectIds?.includes(obj.id)
  );

  // Priority 2: Viewport-visible objects (sorted by distance from center)
  const viewportObjects = viewportBounds
    ? objects
        .filter((obj) => isObjectInViewport(obj, viewportBounds))
        .sort((a, b) => {
          // Sort by distance from viewport center (closest first)
          const distA = distanceFromViewportCenter(a, viewportBounds!);
          const distB = distanceFromViewportCenter(b, viewportBounds!);
          return distA - distB;
        })
        .slice(0, 30) // Limit to 30 viewport objects
    : [];

  // Priority 3: Recently created AI objects (last 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentAIObjects = objects.filter(
    (obj) =>
      obj.aiGenerated &&
      obj.createdAt &&
      obj.createdAt > fiveMinutesAgo
  );

  // Priority 4: Other visible, unlocked objects
  const visibleObjects = objects
    .filter((obj) => obj.visible !== false && !obj.locked)
    .slice(0, 30); // Limit to 30 other objects

  // Combine and deduplicate (preserve priority order)
  const seenIds = new Set<string>();
  const relevantObjects: CanvasObject[] = [];

  const addUnique = (obj: CanvasObject) => {
    if (!seenIds.has(obj.id)) {
      seenIds.add(obj.id);
      relevantObjects.push(obj);
    }
  };

  // Add in priority order
  selectedObjects.forEach(addUnique);
  viewportObjects.forEach(addUnique);
  recentAIObjects.forEach(addUnique);
  visibleObjects.forEach(addUnique);

  // Hard limit: 100 objects total
  const limitedObjects = relevantObjects.slice(0, 100);

  logger.info('Context optimization complete', {
    originalCount: objects.length,
    selectedCount: selectedObjects.length,
    viewportCount: viewportObjects.length,
    recentAICount: recentAIObjects.length,
    optimizedCount: limitedObjects.length,
    hasViewport: !!viewportBounds,
  });

  // Simplify objects to reduce token count
  const simplifiedObjects = limitedObjects.map(simplifyObject);

  return {
    ...canvasState,
    objects: simplifiedObjects,
    // Include viewport bounds in optimized state for tool context
    _viewportBounds: viewportBounds,
  } as CanvasState;
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
