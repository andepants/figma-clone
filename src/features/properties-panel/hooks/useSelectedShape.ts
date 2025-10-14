/**
 * useSelectedShape Hook
 *
 * Returns the currently selected canvas objects.
 * Automatically re-renders when selection changes.
 * Returns null for multi-select, single object for single selection.
 */

import { useCanvasStore } from '@/stores';
import type { CanvasObject } from '@/types';

/**
 * Get the currently selected shape from the canvas store
 * @returns The selected canvas object (if single), or null if nothing selected or multi-select
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const shape = useSelectedShape();
 *
 *   if (!shape) return <div>No selection or multiple selected</div>;
 *   return <div>Selected: {shape.type}</div>;
 * }
 * ```
 */
export function useSelectedShape(): CanvasObject | null {
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const objects = useCanvasStore((state) => state.objects);

  // Return null if no selection or multi-select
  if (selectedIds.length !== 1) return null;

  return objects.find((obj) => obj.id === selectedIds[0]) || null;
}
