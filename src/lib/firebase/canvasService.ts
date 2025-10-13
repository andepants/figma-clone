/**
 * Canvas Service
 *
 * Handles Firestore operations for canvas objects:
 * - Real-time subscription to canvas changes
 * - Updating canvas objects with debouncing
 */

import {
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './config';
import { debounce } from '@/lib/utils';
import type { CanvasObject } from '@/types';

/**
 * Canvas document structure in Firestore
 */
interface CanvasDocument {
  objects: CanvasObject[];
  metadata: {
    createdAt: number;
    lastModified: number;
  };
}

/**
 * Subscribe to real-time canvas updates
 *
 * Listens to changes in the canvas document and invokes the callback
 * whenever objects are updated.
 *
 * @param {string} canvasId - The canvas document ID (e.g., 'main')
 * @param {function} callback - Function called with updated objects array
 * @returns {Unsubscribe} Function to unsubscribe from updates
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToCanvas('main', (objects) => {
 *   console.log('Canvas updated:', objects);
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribeToCanvas(
  canvasId: string,
  callback: (objects: CanvasObject[]) => void
): Unsubscribe {
  const canvasRef = doc(firestore, 'canvases', canvasId);

  return onSnapshot(
    canvasRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CanvasDocument;
        callback(data.objects || []);
      } else {
        // Document doesn't exist yet, return empty array
        callback([]);
      }
    },
    (error) => {
      console.error('Error subscribing to canvas:', error);
      // Still call callback with empty array on error
      callback([]);
    }
  );
}

/**
 * Update canvas objects in Firestore
 *
 * Writes the entire objects array to Firestore with metadata.
 * This function is typically wrapped with debouncing to avoid
 * excessive writes during rapid user interactions.
 *
 * @param {string} canvasId - The canvas document ID
 * @param {CanvasObject[]} objects - Array of canvas objects to persist
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await updateCanvasObjects('main', [
 *   { id: '1', type: 'rectangle', x: 100, y: 100, ... }
 * ]);
 * ```
 */
export async function updateCanvasObjects(
  canvasId: string,
  objects: CanvasObject[]
): Promise<void> {
  const canvasRef = doc(firestore, 'canvases', canvasId);

  const canvasDoc: CanvasDocument = {
    objects,
    metadata: {
      createdAt: Date.now(),
      lastModified: Date.now(),
    },
  };

  try {
    // Use setDoc with merge to preserve createdAt if it exists
    await setDoc(canvasRef, canvasDoc, { merge: true });
  } catch (error) {
    console.error('Error updating canvas objects:', error);
    throw error;
  }
}

/**
 * Debounced version of updateCanvasObjects
 *
 * Delays Firestore writes by 500ms to avoid excessive writes
 * during rapid user interactions (e.g., dragging shapes).
 *
 * @example
 * ```typescript
 * // Multiple rapid calls
 * debouncedUpdateCanvas('main', objects1);
 * debouncedUpdateCanvas('main', objects2);
 * debouncedUpdateCanvas('main', objects3);
 * // Only the last call executes after 500ms
 * ```
 */
export const debouncedUpdateCanvas = debounce(updateCanvasObjects, 500);
