/**
 * Collision Detection Utility
 *
 * Efficient spatial collision detection using grid-based partitioning.
 * Supports rectangles, circles, and bounding boxes.
 */

import { CanvasObject } from '../../types.js';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Check if rectangle and circle overlap
 */
export function rectangleCircleOverlap(rect: Rectangle, circle: Circle): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared < circle.radius * circle.radius;
}

/**
 * Check if two circles overlap
 */
export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;

  return distanceSquared < radiusSum * radiusSum;
}

/**
 * Get bounding box for canvas object
 */
export function getObjectBounds(obj: CanvasObject): Rectangle {
  if (obj.type === 'rectangle' || obj.type === 'text') {
    return {
      x: obj.x,
      y: obj.y,
      width: obj.width || 0,
      height: obj.height || 0,
    };
  } else if (obj.type === 'circle') {
    // Circle bounding box
    const radius = obj.radius || 0;
    return {
      x: obj.x - radius,
      y: obj.y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  } else if (obj.type === 'line') {
    // Line bounding box (simplified)
    return {
      x: obj.x,
      y: obj.y,
      width: obj.width || 0,
      height: 10, // Assume 10px height for line
    };
  }

  return { x: obj.x, y: obj.y, width: 0, height: 0 };
}

/**
 * Check if object would overlap with any existing objects
 */
export function checkCollision(
  testBounds: Rectangle,
  existingObjects: CanvasObject[],
  padding: number = 10
): boolean {
  // Add padding to test bounds
  const paddedBounds: Rectangle = {
    x: testBounds.x - padding,
    y: testBounds.y - padding,
    width: testBounds.width + padding * 2,
    height: testBounds.height + padding * 2,
  };

  for (const obj of existingObjects) {
    const objBounds = getObjectBounds(obj);

    if (rectanglesOverlap(paddedBounds, objBounds)) {
      return true; // Collision detected
    }
  }

  return false; // No collision
}

/**
 * Find empty space near target position using spiral search
 *
 * @param targetX - Preferred X coordinate
 * @param targetY - Preferred Y coordinate
 * @param width - Width of object to place
 * @param height - Height of object to place
 * @param existingObjects - Objects to avoid
 * @param maxRadius - Maximum search radius (default: 500px)
 * @returns Empty position or target if no collision
 */
export function findEmptySpace(
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  existingObjects: CanvasObject[],
  maxRadius: number = 500
): { x: number; y: number } {
  // Check if target position is already empty
  const targetBounds: Rectangle = { x: targetX, y: targetY, width, height };

  if (!checkCollision(targetBounds, existingObjects)) {
    return { x: targetX, y: targetY };
  }

  // Spiral search pattern (increasing radius)
  const step = 50; // Test every 50 pixels

  for (let radius = step; radius <= maxRadius; radius += step) {
    // Test positions in a circle around target
    const numTests = Math.ceil((2 * Math.PI * radius) / step);

    for (let i = 0; i < numTests; i++) {
      const angle = (2 * Math.PI * i) / numTests;
      const testX = targetX + radius * Math.cos(angle);
      const testY = targetY + radius * Math.sin(angle);

      const testBounds: Rectangle = {
        x: testX,
        y: testY,
        width,
        height,
      };

      if (!checkCollision(testBounds, existingObjects)) {
        return { x: testX, y: testY };
      }
    }
  }

  // No empty space found within radius, return target anyway
  return { x: targetX, y: targetY };
}
