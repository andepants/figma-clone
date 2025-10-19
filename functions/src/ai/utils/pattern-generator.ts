/**
 * Pattern Generation Utilities
 *
 * Provides mathematical pattern helpers for arranging objects in complex layouts.
 * Used by AI tools to generate positions for circular arrangements, spirals, etc.
 */

/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Generate positions for objects arranged in a circle
 *
 * @param count - Number of objects to arrange
 * @param centerX - X coordinate of circle center
 * @param centerY - Y coordinate of circle center
 * @param radius - Radius of the circle
 * @param startAngle - Starting angle in degrees (0 = right, 90 = top)
 * @returns Array of positions in circular arrangement
 *
 * @example
 * // Arrange 8 circles around a point
 * const positions = generateCirclePattern(8, 500, 500, 200);
 */
export function generateCirclePattern(
  count: number,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number = 0
): Position[] {
  const positions: Position[] = [];
  const angleStep = (2 * Math.PI) / count;
  const startRadians = (startAngle * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    const angle = startRadians + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    positions.push({
      x: Math.round(x),
      y: Math.round(y),
    });
  }

  return positions;
}

/**
 * Generate positions for objects arranged in a spiral
 *
 * @param count - Number of objects to arrange
 * @param centerX - X coordinate of spiral center
 * @param centerY - Y coordinate of spiral center
 * @param startRadius - Initial radius of spiral
 * @param spacing - Space between each revolution
 * @param rotations - Number of full rotations (default: auto-calculated)
 * @returns Array of positions in spiral arrangement
 *
 * @example
 * // Create a spiral of 20 objects
 * const positions = generateSpiralPattern(20, 500, 500, 50, 30);
 */
export function generateSpiralPattern(
  count: number,
  centerX: number,
  centerY: number,
  startRadius: number,
  spacing: number,
  rotations?: number
): Position[] {
  const positions: Position[] = [];
  const totalRotations = rotations || Math.ceil(count / 6); // ~6 items per rotation
  const angleStep = (2 * Math.PI * totalRotations) / count;
  const radiusStep = spacing / (count / totalRotations);

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const radius = startRadius + i * radiusStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    positions.push({
      x: Math.round(x),
      y: Math.round(y),
    });
  }

  return positions;
}

/**
 * Generate positions for objects in a wave pattern
 *
 * @param count - Number of objects to arrange
 * @param startX - Starting X coordinate
 * @param startY - Starting Y coordinate (centerline)
 * @param spacing - Horizontal spacing between objects
 * @param amplitude - Height of wave (peak to centerline)
 * @param frequency - Number of complete waves across all objects
 * @returns Array of positions in wave pattern
 *
 * @example
 * // Create a sine wave of 30 objects
 * const positions = generateWavePattern(30, 100, 500, 40, 100, 2);
 */
export function generateWavePattern(
  count: number,
  startX: number,
  startY: number,
  spacing: number,
  amplitude: number,
  frequency: number = 1
): Position[] {
  const positions: Position[] = [];
  const step = (2 * Math.PI * frequency) / count;

  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const y = startY + amplitude * Math.sin(i * step);

    positions.push({
      x: Math.round(x),
      y: Math.round(y),
    });
  }

  return positions;
}

/**
 * Generate positions for objects in a hexagonal grid (honeycomb)
 *
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @param centerX - X coordinate of grid center
 * @param centerY - Y coordinate of grid center
 * @param spacing - Distance between adjacent hexagon centers
 * @returns Array of positions in hexagonal arrangement
 *
 * @example
 * // Create 3 rows of 5 hexagons each
 * const positions = generateHexPattern(3, 5, 500, 500, 80);
 */
export function generateHexPattern(
  rows: number,
  cols: number,
  centerX: number,
  centerY: number,
  spacing: number
): Position[] {
  const positions: Position[] = [];
  const horizontalSpacing = spacing;
  const verticalSpacing = spacing * Math.sqrt(3) / 2;

  // Calculate total grid dimensions to center it
  const totalWidth = (cols - 1) * horizontalSpacing;
  const totalHeight = (rows - 1) * verticalSpacing;
  const startX = centerX - totalWidth / 2;
  const startY = centerY - totalHeight / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Offset every other row
      const xOffset = row % 2 === 1 ? horizontalSpacing / 2 : 0;
      const x = startX + col * horizontalSpacing + xOffset;
      const y = startY + row * verticalSpacing;

      positions.push({
        x: Math.round(x),
        y: Math.round(y),
      });
    }
  }

  return positions;
}

/**
 * Generate positions in a random scatter pattern within bounds
 *
 * @param count - Number of objects to place
 * @param minX - Minimum X coordinate
 * @param minY - Minimum Y coordinate
 * @param maxX - Maximum X coordinate
 * @param maxY - Maximum Y coordinate
 * @param minDistance - Minimum distance between objects (0 = no constraint)
 * @returns Array of scattered positions
 *
 * @example
 * // Scatter 20 objects within viewport
 * const positions = generateScatterPattern(20, 0, 0, 1000, 1000, 50);
 */
export function generateScatterPattern(
  count: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  minDistance: number = 0
): Position[] {
  const positions: Position[] = [];
  const maxAttempts = 100;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    let x = 0;
    let y = 0;

    while (!validPosition && attempts < maxAttempts) {
      x = Math.round(minX + Math.random() * (maxX - minX));
      y = Math.round(minY + Math.random() * (maxY - minY));

      // Check minimum distance constraint
      if (minDistance === 0) {
        validPosition = true;
      } else {
        validPosition = positions.every((pos) => {
          const dx = pos.x - x;
          const dy = pos.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance >= minDistance;
        });
      }

      attempts++;
    }

    // Add position even if we couldn't satisfy minDistance after max attempts
    positions.push({x, y});
  }

  return positions;
}

/**
 * Calculate bounding box for a set of positions
 *
 * @param positions - Array of positions
 * @returns Bounding box coordinates
 */
export function calculateBoundingBox(positions: Position[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  if (positions.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  const minX = Math.min(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxX = Math.max(...positions.map((p) => p.x));
  const maxY = Math.max(...positions.map((p) => p.y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
