/**
 * useTouchGestures Hook
 *
 * Custom hook that handles touch gestures for mobile devices.
 * Specifically handles pinch-to-zoom gesture.
 */

import { useRef } from 'react';
import type Konva from 'konva';

/**
 * Position interface
 * @interface Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */
interface Position {
  x: number;
  y: number;
}

/**
 * TouchGestureHandlers interface
 * @interface TouchGestureHandlers
 * @property {(e: Konva.KonvaEventObject<TouchEvent>) => void} handleTouchStart - Touch start handler
 * @property {(e: Konva.KonvaEventObject<TouchEvent>) => void} handleTouchMove - Touch move handler
 * @property {(e: Konva.KonvaEventObject<TouchEvent>) => void} handleTouchEnd - Touch end handler
 */
export interface TouchGestureHandlers {
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

/**
 * useTouchGestures hook
 * Manages pinch-to-zoom gesture state and handlers
 * @param {React.RefObject<Konva.Stage>} stageRef - Reference to Konva stage
 * @param {(scale: number) => void} setZoom - Function to update zoom level
 * @param {(x: number, y: number) => void} setPan - Function to update pan position
 * @returns {TouchGestureHandlers} Touch gesture event handlers
 */
export function useTouchGestures(
  stageRef: React.RefObject<Konva.Stage>,
  setZoom: (scale: number) => void,
  setPan: (x: number, y: number) => void
): TouchGestureHandlers {
  // Touch gesture state for pinch-to-zoom
  const lastDist = useRef<number>(0);
  const lastCenter = useRef<Position | null>(null);

  /**
   * Get distance between two touch points
   * Helper function for pinch-to-zoom gesture
   * @param {Touch} p1 - First touch point
   * @param {Touch} p2 - Second touch point
   * @returns {number} Distance in pixels
   */
  function getTouchDistance(p1: Touch, p2: Touch): number {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get center point between two touch points
   * Helper function for pinch-to-zoom gesture
   * @param {Touch} p1 - First touch point
   * @param {Touch} p2 - Second touch point
   * @returns {Position} Center point
   */
  function getTouchCenter(p1: Touch, p2: Touch): Position {
    return {
      x: (p1.clientX + p2.clientX) / 2,
      y: (p1.clientY + p2.clientY) / 2,
    };
  }

  /**
   * Handle touch start for pinch-to-zoom gesture
   * Records initial touch positions and distance
   * @param {Konva.KonvaEventObject<TouchEvent>} e - Touch event
   */
  function handleTouchStart(e: Konva.KonvaEventObject<TouchEvent>) {
    const touch = e.evt;

    // Check if this is a two-finger gesture (pinch)
    if (touch.touches.length === 2) {
      // Prevent default browser behaviors (like page zoom)
      e.evt.preventDefault();

      const p1 = touch.touches[0];
      const p2 = touch.touches[1];

      // Record initial distance and center point
      lastDist.current = getTouchDistance(p1, p2);
      lastCenter.current = getTouchCenter(p1, p2);
    }
  }

  /**
   * Handle touch move for pinch-to-zoom gesture
   * Calculates zoom level based on distance change between touches
   * @param {Konva.KonvaEventObject<TouchEvent>} e - Touch event
   */
  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const touch = e.evt;

    // Check if this is a two-finger gesture (pinch)
    if (touch.touches.length === 2) {
      // Prevent default browser behaviors
      e.evt.preventDefault();

      const p1 = touch.touches[0];
      const p2 = touch.touches[1];

      // Calculate current distance and center
      const newDist = getTouchDistance(p1, p2);
      const newCenter = getTouchCenter(p1, p2);

      // Skip if we don't have initial values
      if (lastDist.current === 0 || !lastCenter.current) {
        lastDist.current = newDist;
        lastCenter.current = newCenter;
        return;
      }

      // Calculate scale change based on distance change
      const distRatio = newDist / lastDist.current;
      const oldScale = stage.scaleX();
      const newScale = oldScale * distRatio;

      // Clamp scale between 0.1x and 5.0x
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      // Calculate new position to zoom towards center of pinch
      const centerPoint = {
        x: (newCenter.x - stage.x()) / oldScale,
        y: (newCenter.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: newCenter.x - centerPoint.x * clampedScale,
        y: newCenter.y - centerPoint.y * clampedScale,
      };

      // Update zoom and pan
      setZoom(clampedScale);
      setPan(newPos.x, newPos.y);

      // Update last values for next move
      lastDist.current = newDist;
      lastCenter.current = newCenter;
    }
  }

  /**
   * Handle touch end for pinch-to-zoom gesture
   * Cleans up gesture state
   * @param {Konva.KonvaEventObject<TouchEvent>} e - Touch event
   */
  function handleTouchEnd(e: Konva.KonvaEventObject<TouchEvent>) {
    const touch = e.evt;

    // Reset gesture state when touches are released
    if (touch.touches.length < 2) {
      lastDist.current = 0;
      lastCenter.current = null;
    }
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
