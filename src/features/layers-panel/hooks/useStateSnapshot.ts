/**
 * useStateSnapshot Hook
 *
 * Provides state snapshot functionality for rollback on operation failures.
 * Captures state before operations and allows reverting if Firebase sync fails.
 */

import { useRef, useCallback } from 'react';
import type { CanvasObject } from '@/types/canvas.types';

interface SnapshotManager {
  capture: (objects: CanvasObject[]) => void;
  rollback: () => CanvasObject[] | null;
  clear: () => void;
  hasSnapshot: () => boolean;
}

/**
 * Hook to manage state snapshots for rollback functionality
 *
 * @returns Snapshot manager with capture, rollback, clear, and hasSnapshot methods
 */
export function useStateSnapshot(): SnapshotManager {
  const snapshotRef = useRef<CanvasObject[] | null>(null);

  /**
   * Capture current state as a snapshot
   */
  const capture = useCallback((objects: CanvasObject[]) => {
    // Deep clone to prevent mutations affecting snapshot
    snapshotRef.current = JSON.parse(JSON.stringify(objects));
  }, []);

  /**
   * Rollback to captured snapshot and return it
   * Returns null if no snapshot exists
   */
  const rollback = useCallback((): CanvasObject[] | null => {
    if (!snapshotRef.current) {
      console.warn('No snapshot available for rollback');
      return null;
    }

    const snapshot = snapshotRef.current;
    snapshotRef.current = null; // Clear snapshot after use
    return snapshot;
  }, []);

  /**
   * Clear the snapshot without rolling back
   */
  const clear = useCallback(() => {
    snapshotRef.current = null;
  }, []);

  /**
   * Check if a snapshot exists
   */
  const hasSnapshot = useCallback((): boolean => {
    return snapshotRef.current !== null;
  }, []);

  return {
    capture,
    rollback,
    clear,
    hasSnapshot,
  };
}
