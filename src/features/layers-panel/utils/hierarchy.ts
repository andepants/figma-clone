/**
 * Hierarchy Utilities
 *
 * Functions for building and manipulating hierarchical relationships between canvas objects.
 * Converts flat object arrays with parentId references into nested tree structures
 * for display in the layers panel.
 *
 * @module features/layers-panel/utils/hierarchy
 */

import type { CanvasObject, CanvasObjectWithChildren } from '@/types/canvas.types';

/**
 * Build hierarchy tree from flat object array
 *
 * Converts flat array with parentId references into nested tree structure.
 * Maintains insertion order within each hierarchy level.
 * Orphaned objects (parentId points to non-existent object) are treated as root-level.
 *
 * @param objects - Flat array of canvas objects
 * @returns Tree structure with children arrays and depth
 *
 * @example
 * ```typescript
 * // Input: [frameA, rectB, circleC] where rectB.parentId = frameA.id
 * const tree = buildHierarchyTree([frameA, rectB, circleC]);
 * // Output: [
 * //   { ...frameA, children: [{ ...rectB, children: [], depth: 1 }], depth: 0 },
 * //   { ...circleC, children: [], depth: 0 }
 * // ]
 * ```
 */
export function buildHierarchyTree(objects: CanvasObject[]): CanvasObjectWithChildren[] {
  const objectMap = new Map<string, CanvasObjectWithChildren>();

  // Initialize all objects with empty children arrays
  objects.forEach((obj) => {
    objectMap.set(obj.id, { ...obj, children: [], depth: 0 });
  });

  const roots: CanvasObjectWithChildren[] = [];

  // Build tree structure
  objects.forEach((obj) => {
    const node = objectMap.get(obj.id);
    if (!node) return;

    if (!obj.parentId) {
      // Root level object
      roots.push(node);
    } else {
      // Child object - add to parent's children
      const parent = objectMap.get(obj.parentId);
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        // Parent not found - treat as root (orphan)
        roots.push(node);
      }
    }
  });

  return roots;
}

/**
 * Flatten hierarchy tree back to array
 *
 * Converts nested tree structure back to flat array while preserving hierarchy.
 * Used for display order in layers panel (depth-first traversal).
 * Optionally excludes children of collapsed nodes.
 *
 * @param tree - Hierarchical tree structure
 * @param includeCollapsed - If false, skip children of collapsed nodes
 * @returns Flat array in display order
 *
 * @example
 * ```typescript
 * const tree = buildHierarchyTree(objects);
 * const flat = flattenHierarchyTree(tree, false); // Hide collapsed children
 * ```
 */
export function flattenHierarchyTree(
  tree: CanvasObjectWithChildren[],
  includeCollapsed = true
): CanvasObjectWithChildren[] {
  const result: CanvasObjectWithChildren[] = [];

  function traverse(nodes: CanvasObjectWithChildren[]) {
    nodes.forEach((node) => {
      result.push(node);

      // Add children if not collapsed or if includeCollapsed is true
      if (node.children.length > 0 && (includeCollapsed || !node.isCollapsed)) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return result;
}

/**
 * Get all descendant IDs of a node
 *
 * Returns all child, grandchild, etc. IDs recursively.
 * Used for selecting entire groups.
 *
 * @param nodeId - Parent node ID
 * @param objects - All canvas objects
 * @returns Array of all descendant IDs
 *
 * @example
 * ```typescript
 * // frame1 contains rect2, rect2 contains circle3
 * const descendants = getAllDescendantIds('frame1', objects);
 * // Returns: ['rect2', 'circle3']
 * ```
 */
export function getAllDescendantIds(nodeId: string, objects: CanvasObject[]): string[] {
  const descendants: string[] = [];
  const children = objects.filter((obj) => obj.parentId === nodeId);

  children.forEach((child) => {
    descendants.push(child.id);
    descendants.push(...getAllDescendantIds(child.id, objects));
  });

  return descendants;
}

/**
 * Check if object has any children
 *
 * @param objectId - Object ID to check
 * @param objects - All canvas objects
 * @returns True if object has at least one child
 *
 * @example
 * ```typescript
 * if (hasChildren('frame-1', objects)) {
 *   // Show dropdown arrow
 * }
 * ```
 */
export function hasChildren(objectId: string, objects: CanvasObject[]): boolean {
  return objects.some((obj) => obj.parentId === objectId);
}

/**
 * Check if object has a locked parent
 *
 * Traverses up the hierarchy to check if any ancestor is locked.
 * Used to show inherited lock state in LayerItem.
 *
 * @param objectId - Object ID to check
 * @param objects - All canvas objects
 * @returns True if object has at least one locked ancestor
 *
 * @example
 * ```typescript
 * if (hasLockedParent('rect-1', objects)) {
 *   // Show inherited lock indicator
 * }
 * ```
 */
export function hasLockedParent(objectId: string, objects: CanvasObject[]): boolean {
  const object = objects.find((obj) => obj.id === objectId);
  if (!object || !object.parentId) return false;

  const parent = objects.find((obj) => obj.id === object.parentId);
  if (!parent) return false;

  // If parent is locked, return true
  if (parent.locked) return true;

  // Otherwise, check parent's parent recursively
  return hasLockedParent(parent.id, objects);
}

/**
 * Move object to new parent
 *
 * Updates parentId and validates no circular references.
 * Returns null if circular reference detected.
 *
 * @param objectId - Object to move
 * @param newParentId - New parent ID (null for root)
 * @param objects - All canvas objects
 * @returns Updated objects array, or null if circular reference detected
 *
 * @example
 * ```typescript
 * const updated = moveToParent('rect-1', 'frame-1', objects);
 * if (updated) {
 *   setObjects(updated);
 * } else {
 *   // Circular reference prevented
 * }
 * ```
 */
export function moveToParent(
  objectId: string,
  newParentId: string | null,
  objects: CanvasObject[]
): CanvasObject[] | null {
  // Prevent circular references
  if (newParentId) {
    const descendants = getAllDescendantIds(objectId, objects);
    if (descendants.includes(newParentId)) {
      return null;
    }
  }

  return objects.map((obj) =>
    obj.id === objectId ? { ...obj, parentId: newParentId } : obj
  );
}
