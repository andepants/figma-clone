/**
 * useSelectedShape Hook
 *
 * Returns the currently selected canvas object.
 * Automatically re-renders when selection changes.
 */

import { useCanvasStore } from '@/stores';
import type { CanvasObject } from '@/types';

/**
 * Get the currently selected shape from the canvas store
 * @returns The selected canvas object, or null if nothing is selected
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const shape = useSelectedShape();
 *
 *   if (!shape) return <div>No selection</div>;
 *   return <div>Selected: {shape.type}</div>;
 * }
 * ```
 */
export function useSelectedShape(): CanvasObject | null {
  const selectedId = useCanvasStore((state) => state.selectedId);
  const objects = useCanvasStore((state) => state.objects);

  if (!selectedId) return null;

  return objects.find((obj) => obj.id === selectedId) || null;
}
