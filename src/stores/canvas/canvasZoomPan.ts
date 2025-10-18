/**
 * Canvas Zoom/Pan Actions
 *
 * View management: zoom in/out, pan, zoom-to-fit, reset view.
 */

import type { StateCreator } from 'zustand';
import type { CanvasStore } from './types';

/**
 * Create canvas zoom/pan actions slice
 *
 * @param {StateCreator} set - Zustand state setter
 * @returns Partial canvas store with zoom/pan actions
 */
export function createCanvasZoomPan(set: Parameters<StateCreator<CanvasStore>>[0]) {
  return {
    setZoom: (zoom: number) =>
      set(() => ({
        zoom: Math.max(0.1, Math.min(5.0, zoom)),
      })),

    zoomIn: () =>
      set((state) => ({
        zoom: Math.max(0.1, Math.min(5.0, state.zoom * 1.1)),
      })),

    zoomOut: () =>
      set((state) => ({
        zoom: Math.max(0.1, Math.min(5.0, state.zoom / 1.1)),
      })),

    zoomTo: (percentage: number) =>
      set(() => ({
        zoom: Math.max(0.1, Math.min(5.0, percentage / 100)),
      })),

    zoomToFit: (viewportWidth = 1200, viewportHeight = 800) =>
      set((state) => {
        // If no objects, reset to 100%
        if (state.objects.length === 0) {
          return { zoom: 1.0, panX: 0, panY: 0 };
        }

        // Calculate bounding box of all objects
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        state.objects.forEach((obj) => {
          if (obj.type === 'rectangle') {
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + obj.width);
            maxY = Math.max(maxY, obj.y + obj.height);
          } else if (obj.type === 'circle') {
            minX = Math.min(minX, obj.x - obj.radius);
            minY = Math.min(minY, obj.y - obj.radius);
            maxX = Math.max(maxX, obj.x + obj.radius);
            maxY = Math.max(maxY, obj.y + obj.radius);
          } else if (obj.type === 'text') {
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + obj.width);
            maxY = Math.max(maxY, obj.y + obj.height);
          } else if (obj.type === 'image') {
            minX = Math.min(minX, obj.x);
            minY = Math.min(minY, obj.y);
            maxX = Math.max(maxX, obj.x + obj.width);
            maxY = Math.max(maxY, obj.y + obj.height);
          } else if (obj.type === 'line') {
            // Line points are relative to (x, y), so we need to calculate absolute positions
            const x1 = obj.x + obj.points[0];
            const y1 = obj.y + obj.points[1];
            const x2 = obj.x + obj.points[2];
            const y2 = obj.y + obj.points[3];
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
          }
        });

        // Calculate content dimensions
        const width = maxX - minX;
        const height = maxY - minY;

        // Guard against zero or invalid dimensions
        if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
          return { zoom: 1.0, panX: 0, panY: 0 };
        }

        // Add padding (20% of viewport)
        const padding = 0.2;

        // Calculate zoom to fit
        const scaleX = (viewportWidth * (1 - padding)) / width;
        const scaleY = (viewportHeight * (1 - padding)) / height;
        const newZoom = Math.max(0.1, Math.min(5.0, Math.min(scaleX, scaleY)));

        // Guard against NaN zoom
        if (!isFinite(newZoom)) {
          return { zoom: 1.0, panX: 0, panY: 0 };
        }

        // Calculate center position for the content
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Center the content in viewport
        const newPanX = viewportWidth / 2 - centerX * newZoom;
        const newPanY = viewportHeight / 2 - centerY * newZoom;

        return {
          zoom: newZoom,
          panX: newPanX,
          panY: newPanY,
        };
      }),

    setPan: (x: number, y: number) =>
      set(() => ({
        panX: x,
        panY: y,
      })),

    resetView: () =>
      set(() => ({
        zoom: 1.0,
        panX: 0,
        panY: 0,
      })),
  };
}
