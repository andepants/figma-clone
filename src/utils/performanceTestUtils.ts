/**
 * Performance Testing Utilities
 *
 * Utilities for generating test shapes and measuring canvas performance.
 * Used for verifying 60 FPS rendering with lines and other shapes.
 *
 * Usage:
 * 1. Open browser console
 * 2. Run: window.generateTestLines(20)
 * 3. Open Chrome DevTools Performance tab
 * 4. Record while interacting (pan, zoom, drag)
 * 5. Verify 60 FPS and < 16.67ms frame times
 */

import type { Line, Rectangle, Circle, CanvasObject } from '@/types';
import { useCanvasStore } from '@/stores/canvas';

/**
 * Generate test lines across the canvas for performance testing
 *
 * Creates lines in a grid pattern with varying angles for visual diversity.
 * Lines are colored with rainbow hues for easy identification.
 *
 * @param {number} count - Number of lines to generate (default: 20)
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Generate 20 test lines
 * generateTestLines(20);
 *
 * // Generate 50 test lines
 * generateTestLines(50);
 * ```
 */
export function generateTestLines(count = 20): void {
  const addObject = useCanvasStore.getState().addObject;
  const currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };

  // Clear existing selection
  useCanvasStore.getState().clearSelection();

  // Generate lines in a grid pattern
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const spacingX = 250;
  const spacingY = 200;
  const startX = 100;
  const startY = 100;

  let lineCount = 0;

  for (let row = 0; row < rows && lineCount < count; row++) {
    for (let col = 0; col < cols && lineCount < count; col++) {
      const x1 = startX + col * spacingX;
      const y1 = startY + row * spacingY;

      // Vary line angles for visual diversity
      const angle = (lineCount * 30) % 360; // Different angle for each line
      const length = 100 + Math.random() * 100; // Length between 100-200px
      const angleRad = (angle * Math.PI) / 180;

      const x2 = x1 + Math.cos(angleRad) * length;
      const y2 = y1 + Math.sin(angleRad) * length;

      // Calculate line properties
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const points: [number, number, number, number] = [
        x1 - x,
        y1 - y,
        x2 - x,
        y2 - y,
      ];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const width = Math.sqrt(dx * dx + dy * dy);
      let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      if (rotation === 180) rotation = -180;

      // Create line object
      const line: Line = {
        id: `perf-test-line-${Date.now()}-${lineCount}`,
        type: 'line',
        x,
        y,
        points,
        width,
        rotation,
        stroke: `hsl(${(lineCount * 360) / count}, 70%, 50%)`, // Rainbow colors
        strokeWidth: 2,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        strokeEnabled: true,
        shadowEnabled: false,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 1,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addObject(line);
      lineCount++;
    }
  }

}

/**
 * Generate mixed shapes for comprehensive performance testing
 *
 * Creates 10 rectangles, 10 circles, and 10 lines (30 total shapes)
 * to verify performance with multiple shape types.
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Generate mixed test shapes
 * generateMixedShapes();
 * ```
 */
export function generateMixedShapes(): void {
  const addObject = useCanvasStore.getState().addObject;
  const currentUser = { uid: 'test-user', email: 'test@test.com', displayName: 'Test User' };

  // Clear existing selection
  useCanvasStore.getState().clearSelection();

  const shapes: CanvasObject[] = [];
  const startX = 100;
  const startY = 100;
  const spacing = 200;

  // Generate 10 rectangles
  for (let i = 0; i < 10; i++) {
    const x = startX + (i % 5) * spacing;
    const y = startY + Math.floor(i / 5) * spacing;

    const rect: Rectangle = {
      id: `perf-test-rect-${Date.now()}-${i}`,
      type: 'rectangle',
      x,
      y,
      width: 80,
      height: 60,
      rotation: 0,
      fill: `hsl(${i * 36}, 70%, 60%)`,
      stroke: '#333333',
      strokeWidth: 2,
      cornerRadius: 5,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 1,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    shapes.push(rect);
  }

  // Generate 10 circles
  for (let i = 0; i < 10; i++) {
    const x = startX + 1000 + (i % 5) * spacing;
    const y = startY + Math.floor(i / 5) * spacing;

    const circle: Circle = {
      id: `perf-test-circle-${Date.now()}-${i}`,
      type: 'circle',
      x,
      y,
      radius: 40,
      rotation: 0,
      fill: `hsl(${i * 36 + 120}, 70%, 60%)`,
      stroke: '#333333',
      strokeWidth: 2,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 1,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    shapes.push(circle);
  }

  // Generate 10 lines
  for (let i = 0; i < 10; i++) {
    const x1 = startX + 500 + (i % 5) * spacing;
    const y1 = startY + Math.floor(i / 5) * spacing;

    const angle = (i * 30) % 360;
    const length = 120;
    const angleRad = (angle * Math.PI) / 180;
    const x2 = x1 + Math.cos(angleRad) * length;
    const y2 = y1 + Math.sin(angleRad) * length;

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const points: [number, number, number, number] = [x1 - x, y1 - y, x2 - x, y2 - y];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const width = Math.sqrt(dx * dx + dy * dy);
    let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    if (rotation === 180) rotation = -180;

    const line: Line = {
      id: `perf-test-line-${Date.now()}-${i}`,
      type: 'line',
      x,
      y,
      points,
      width,
      rotation,
      stroke: `hsl(${i * 36 + 240}, 70%, 50%)`,
      strokeWidth: 2,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 1,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    shapes.push(line);
  }

  // Add all shapes
  shapes.forEach((shape) => addObject(shape));
}

/**
 * Clear all performance test objects from the canvas
 *
 * Removes all shapes that were created by test utilities
 * (identified by 'perf-test-' prefix in ID).
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Clear test shapes
 * clearTestShapes();
 * ```
 */
export function clearTestShapes(): void {
  const state = useCanvasStore.getState();
  const testObjects = state.objects.filter((obj) => obj.id.startsWith('perf-test-'));

  testObjects.forEach((obj) => {
    state.removeObject(obj.id);
  });
}

/**
 * Measure FPS over a period of time
 *
 * Logs FPS samples every second for the specified duration.
 * Useful for automated performance monitoring.
 *
 * @param {number} durationSeconds - How long to measure (default: 10 seconds)
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Measure FPS for 10 seconds
 * await measureFPS(10);
 * ```
 */
export async function measureFPS(durationSeconds = 10): Promise<void> {
  const fpsSamples: number[] = [];
  let frameCount = 0;
  let lastTime = performance.now();
  let running = true;

  const measureFrame = () => {
    frameCount++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    if (delta >= 1000) {
      const fps = Math.round((frameCount * 1000) / delta);
      fpsSamples.push(fps);
      frameCount = 0;
      lastTime = currentTime;
    }

    if (running && fpsSamples.length < durationSeconds) {
      requestAnimationFrame(measureFrame);
    } else if (fpsSamples.length >= durationSeconds) {
      running = false;
    }
  };

  requestAnimationFrame(measureFrame);

  // Wait for measurement to complete
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (!running) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

/**
 * Run automated performance test suite
 *
 * Generates test lines, measures FPS, and cleans up.
 * Provides a complete automated test run.
 *
 * @param {number} lineCount - Number of lines to test with (default: 20)
 * @param {number} measureDuration - How long to measure FPS (default: 10 seconds)
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Run full performance test
 * await runPerformanceTest(20, 10);
 * ```
 */
export async function runPerformanceTest(
  lineCount = 20,
  measureDuration = 10
): Promise<void> {
  // Generate test shapes
  generateTestLines(lineCount);

  // Wait for render
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Measure FPS
  await measureFPS(measureDuration);

  // Cleanup
  clearTestShapes();
}

/**
 * Install performance utilities on window object for console access
 *
 * Call this in development mode to make utilities available in browser console.
 * Should only be used in development environment.
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * // In your main app file (development only):
 * if (import.meta.env.DEV) {
 *   installPerformanceUtils();
 * }
 * ```
 */
export function installPerformanceUtils(): void {
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Adding to window for console access
    window.generateTestLines = generateTestLines;
    // @ts-expect-error - Adding to window for console access
    window.generateMixedShapes = generateMixedShapes;
    // @ts-expect-error - Adding to window for console access
    window.clearTestShapes = clearTestShapes;
    // @ts-expect-error - Adding to window for console access
    window.measureFPS = measureFPS;
    // @ts-expect-error - Adding to window for console access
    window.runPerformanceTest = runPerformanceTest;
  }
}
