/**
 * Global Manipulation Tracker
 *
 * Tracks which objects are currently being actively manipulated (dragged, resized, edited)
 * by the current user. This prevents Firebase subscription updates from overwriting
 * local optimistic updates during manipulation.
 *
 * Benefits:
 * - Instant local feedback (no lag from Firebase round-trip)
 * - Prevents flashing when remote updates arrive during local manipulation
 * - Atomic tracking (add/remove multiple objects at once)
 * - Works across all manipulation types (drag, resize, text edit)
 *
 * Usage Pattern:
 * 1. onDragStart/onResizeStart/onEditStart: Call markManipulated(objectIds)
 * 2. During manipulation: Local optimistic updates via Zustand
 * 3. onDragEnd/onResizeEnd/onEditEnd: Call unmarkManipulated(objectIds) AFTER Firebase write
 *
 * @module manipulationTracker
 */

/**
 * Global set of object IDs currently being manipulated by the current user
 * @private
 */
const activeManipulations = new Set<string>();

/**
 * Mark one or more objects as being actively manipulated
 *
 * Call this at the START of any manipulation (drag, resize, edit).
 * While marked, the object's local state takes precedence over Firebase updates.
 *
 * @param {string | string[]} objectIds - Single object ID or array of IDs
 *
 * @example
 * ```typescript
 * // Single object (drag start)
 * onDragStart() {
 *   markManipulated('rect-123');
 * }
 *
 * // Multiple objects (group drag start)
 * onGroupDragStart() {
 *   markManipulated(['rect-1', 'rect-2', 'circle-1']);
 * }
 * ```
 */
export function markManipulated(objectIds: string | string[]): void {
  const ids = Array.isArray(objectIds) ? objectIds : [objectIds];
  ids.forEach((id) => activeManipulations.add(id));
}

/**
 * Remove one or more objects from active manipulation tracking
 *
 * Call this at the END of any manipulation (drag, resize, edit),
 * AFTER the final Firebase write completes. This ensures the persisted
 * state in Firebase is current before allowing remote updates.
 *
 * @param {string | string[]} objectIds - Single object ID or array of IDs
 *
 * @example
 * ```typescript
 * // Single object (drag end)
 * async onDragEnd() {
 *   await updateCanvasObject('main', 'rect-123', position); // Write to Firebase
 *   unmarkManipulated('rect-123'); // AFTER write completes
 * }
 *
 * // Multiple objects (group drag end)
 * async onGroupDragEnd() {
 *   await batchUpdateCanvasObjects('main', updates); // Write to Firebase
 *   unmarkManipulated(['rect-1', 'rect-2', 'circle-1']); // AFTER write completes
 * }
 * ```
 */
export function unmarkManipulated(objectIds: string | string[]): void {
  const ids = Array.isArray(objectIds) ? objectIds : [objectIds];
  ids.forEach((id) => activeManipulations.delete(id));
}

/**
 * Check if an object is currently being manipulated
 *
 * Used in Firebase subscription merge logic to decide whether to use
 * local state or remote state for an object.
 *
 * @param {string} objectId - Object ID to check
 * @returns {boolean} - True if object is currently being manipulated
 *
 * @example
 * ```typescript
 * // In Firebase subscription callback
 * subscribeToCanvasObjects('main', (remoteObjects) => {
 *   const mergedObjects = remoteObjects.map(remoteObj => {
 *     if (isManipulated(remoteObj.id)) {
 *       // Use local version
 *       return localObjectsMap.get(remoteObj.id) || remoteObj;
 *     }
 *     // Use remote version
 *     return remoteObj;
 *   });
 *   setObjects(mergedObjects);
 * });
 * ```
 */
export function isManipulated(objectId: string): boolean {
  return activeManipulations.has(objectId);
}

