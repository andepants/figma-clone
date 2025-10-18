/**
 * Hierarchy Migration Utilities
 *
 * One-time migration to enforce group-only parent-child relationships.
 * Flattens any existing hierarchies where non-group objects have children.
 *
 * @module lib/utils/hierarchyMigration
 */

import type { CanvasObject } from '@/types/canvas.types';

/**
 * Migration result with updated objects and statistics
 */
export interface MigrationResult {
  /** Updated objects array with flattened hierarchies */
  objects: CanvasObject[];
  /** Number of objects that had their parentId removed */
  flattenedCount: number;
  /** IDs of objects that were flattened */
  flattenedIds: string[];
}

/**
 * Flatten non-group hierarchies
 *
 * Iterates through all canvas objects and removes parentId from any object
 * whose parent is NOT a group type. This enforces the rule that only groups
 * can have children.
 *
 * Migration behavior:
 * - Objects with parentId pointing to a group: unchanged
 * - Objects with parentId pointing to non-group: parentId set to null (moved to root)
 * - Objects with parentId pointing to non-existent parent: already handled by hierarchy.ts (treated as orphans)
 *
 * @param objects - Array of canvas objects to migrate
 * @returns Migration result with updated objects and statistics
 *
 * @example
 * ```typescript
 * const result = flattenNonGroupHierarchies(objects);
 * console.log(`Flattened ${result.flattenedCount} objects`);
 * setObjects(result.objects);
 * ```
 */
export function flattenNonGroupHierarchies(objects: CanvasObject[]): MigrationResult {
  const flattenedIds: string[] = [];
  let flattenedCount = 0;

  // Create a map for O(1) parent lookups
  const objectMap = new Map<string, CanvasObject>();
  objects.forEach((obj) => {
    objectMap.set(obj.id, obj);
  });

  // Check each object and flatten if parent is not a group
  const updatedObjects = objects.map((obj) => {
    // Skip objects without parents (already at root level)
    if (!obj.parentId) {
      return obj;
    }

    // Check if parent exists and is a group
    const parent = objectMap.get(obj.parentId);

    // If parent doesn't exist, hierarchy.ts will treat as orphan (no action needed)
    if (!parent) {
      return obj;
    }

    // If parent is not a group, flatten to root level
    if (parent.type !== 'group') {
      flattenedIds.push(obj.id);
      flattenedCount++;
      return {
        ...obj,
        parentId: null,
        updatedAt: Date.now(),
      };
    }

    // Parent is a group - keep hierarchy intact
    return obj;
  });

  return {
    objects: updatedObjects,
    flattenedCount,
    flattenedIds,
  };
}

/**
 * Check if migration is needed
 *
 * Scans objects to determine if any have invalid parent-child relationships
 * (non-group parents). Useful for conditional migration execution.
 *
 * @param objects - Array of canvas objects to check
 * @returns True if migration would change any objects
 *
 * @example
 * ```typescript
 * if (needsMigration(objects)) {
 *   const result = flattenNonGroupHierarchies(objects);
 *   // ... apply migration
 * }
 * ```
 */
export function needsMigration(objects: CanvasObject[]): boolean {
  const objectMap = new Map<string, CanvasObject>();
  objects.forEach((obj) => {
    objectMap.set(obj.id, obj);
  });

  return objects.some((obj) => {
    if (!obj.parentId) return false;
    const parent = objectMap.get(obj.parentId);
    return parent && parent.type !== 'group';
  });
}
