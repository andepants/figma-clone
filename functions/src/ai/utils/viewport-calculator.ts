/**
 * Viewport Calculator Utility
 *
 * Calculates visible canvas bounds based on camera position and zoom level.
 * Used for prioritizing objects in the user's current view.
 */

export interface ViewportData {
  camera: { x: number; y: number };
  zoom: number;
}

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate viewport bounds from camera and zoom
 *
 * @param viewport - Viewport data (camera position, zoom)
 * @param windowSize - Browser window size (default: 1920x1080)
 * @returns Viewport bounds in canvas coordinates
 */
export function calculateViewportBounds(
  viewport: ViewportData,
  windowSize: { width: number; height: number } = { width: 1920, height: 1080 }
): ViewportBounds {
  const { camera, zoom } = viewport;

  // Guard against zero or negative zoom (prevent division by zero)
  const safeZoom = Math.max(0.1, zoom);

  // Calculate visible area dimensions (inverse of zoom)
  const visibleWidth = windowSize.width / safeZoom;
  const visibleHeight = windowSize.height / safeZoom;

  // Camera position is top-left of viewport in canvas coordinates
  const minX = camera.x;
  const minY = camera.y;
  const maxX = camera.x + visibleWidth;
  const maxY = camera.y + visibleHeight;

  // Calculate center point
  const centerX = camera.x + visibleWidth / 2;
  const centerY = camera.y + visibleHeight / 2;

  return { minX, maxX, minY, maxY, centerX, centerY };
}

/**
 * Check if object is within viewport bounds
 *
 * @param object - Canvas object with position
 * @param bounds - Viewport bounds
 * @param padding - Extra padding around viewport (default: 100px)
 * @returns True if object is visible or near viewport
 */
export function isObjectInViewport(
  object: { x: number; y: number; width?: number; height?: number; radius?: number },
  bounds: ViewportBounds,
  padding: number = 100
): boolean {
  // Calculate object bounds based on type
  let objWidth = 0;
  let objHeight = 0;

  if (object.radius !== undefined) {
    // Circle: use radius for both dimensions
    objWidth = object.radius * 2;
    objHeight = object.radius * 2;
  } else {
    // Rectangle/Text/Line: use width/height
    objWidth = object.width || 0;
    objHeight = object.height || 0;
  }

  // Object bounding box with padding
  const objMinX = object.x - padding;
  const objMaxX = object.x + objWidth + padding;
  const objMinY = object.y - padding;
  const objMaxY = object.y + objHeight + padding;

  // Check overlap with viewport (axis-aligned bounding box intersection)
  return !(
    objMaxX < bounds.minX ||
    objMinX > bounds.maxX ||
    objMaxY < bounds.minY ||
    objMinY > bounds.maxY
  );
}

/**
 * Calculate distance from point to viewport center
 *
 * @param point - Point in canvas coordinates
 * @param bounds - Viewport bounds
 * @returns Distance in pixels
 */
export function distanceFromViewportCenter(
  point: { x: number; y: number },
  bounds: ViewportBounds
): number {
  const dx = point.x - bounds.centerX;
  const dy = point.y - bounds.centerY;
  return Math.sqrt(dx * dx + dy * dy);
}
