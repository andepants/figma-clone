/**
 * Shape Creation Firebase Operations
 *
 * Handles Firebase Realtime Database operations for shape creation.
 * Provides optimistic updates with rollback on error.
 */

import { addCanvasObject, startEditing } from '@/lib/firebase';
import { useCanvasStore } from '@/stores';
import type { CanvasObject, Text } from '@/types';

/**
 * Add shape to Firebase with optimistic update and rollback
 *
 * @param projectId - Project ID for Firebase path
 * @param shape - Shape object to add
 * @param addObject - Function to add object to local store
 * @returns Promise that resolves when Firebase sync completes
 */
export async function addShapeToFirebase(
  projectId: string,
  shape: CanvasObject,
  addObject: (obj: CanvasObject) => void
): Promise<void> {
  // Add to canvas store (optimistic update)
  addObject(shape);

  try {
    // Sync to Realtime Database (atomic add)
    await addCanvasObject(projectId, shape);
  } catch {
    // Rollback optimistic update on error
    const { removeObject } = useCanvasStore.getState();
    removeObject(shape.id);
    throw new Error('Failed to sync shape to Firebase');
  }
}

/**
 * Acquire editing lock for text object
 *
 * Attempts to acquire an editing lock in Firebase for the given text object.
 * If lock acquisition fails, closes the editor gracefully.
 *
 * @param projectId - Project ID for Firebase path
 * @param textId - Text object ID to acquire lock for
 * @param userId - User ID attempting to edit
 * @param username - Username for lock metadata
 * @param color - User color for lock metadata
 * @param setEditingText - Function to update editing state
 * @returns Promise that resolves when lock acquisition completes
 */
export async function acquireTextEditingLock(
  projectId: string,
  textId: string,
  userId: string,
  username: string,
  color: string,
  setEditingText: (id: string | null) => void
): Promise<void> {
  try {
    const canEdit = await startEditing(projectId, textId, userId, username, color);

    if (!canEdit) {
      // Failed to acquire lock (another user somehow has it)
      // Close the editor gracefully
      setEditingText(null);
      // Optionally show a toast notification here
    }
  } catch {
    // Failed to acquire edit lock - close editor
    setEditingText(null);
  }
}

/**
 * Create text object with optimistic editing lock
 *
 * Creates text object in Firebase and immediately enters edit mode.
 * Lock acquisition happens asynchronously in parallel.
 *
 * @param projectId - Project ID for Firebase path
 * @param text - Text object to create
 * @param userId - User ID creating the text
 * @param username - Username for lock metadata
 * @param color - User color for lock metadata
 * @param addObject - Function to add object to local store
 * @param setEditingText - Function to update editing state
 * @returns Promise that resolves when creation and lock acquisition complete
 */
export async function createTextWithEditingLock(
  projectId: string,
  text: Text,
  userId: string,
  username: string,
  color: string,
  addObject: (obj: CanvasObject) => void,
  setEditingText: (id: string | null) => void
): Promise<void> {
  // Add to canvas store (optimistic update)
  addObject(text);

  // Enter edit mode IMMEDIATELY (optimistically) so textarea appears instantly
  setEditingText(text.id);

  // Sync to Realtime Database in parallel
  const syncPromise = addCanvasObject(projectId, text).catch(() => {
    // Rollback optimistic update on error
    const { removeObject } = useCanvasStore.getState();
    removeObject(text.id);
  });

  // Acquire editing lock asynchronously in parallel
  const lockPromise = acquireTextEditingLock(
    projectId,
    text.id,
    userId,
    username,
    color,
    setEditingText
  );

  // Wait for both operations to complete
  await Promise.all([syncPromise, lockPromise]);
}
