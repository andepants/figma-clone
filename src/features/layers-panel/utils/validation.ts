/**
 * Hierarchy Validation Utilities
 *
 * Functions for validating and auto-fixing hierarchy issues such as:
 * - Orphaned objects (parentId points to non-existent object)
 * - Invalid parents (parentId points to non-group object)
 * - Circular references
 * - Stale object references
 *
 * @module features/layers-panel/utils/validation
 */

import type { CanvasObject } from '@/types/canvas.types';
import { getAllDescendantIds } from './hierarchy';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fixed: CanvasObject[] | null;
}

/**
 * Validate and auto-fix orphaned objects
 *
 * Finds objects with parentId pointing to non-existent objects
 * and promotes them to root level (parentId = null).
 *
 * @param objects - All canvas objects
 * @returns Validation result with fixed objects if issues found
 */
export function validateAndFixOrphans(objects: CanvasObject[]): ValidationResult {
  const errors: string[] = [];
  const objectIds = new Set(objects.map((obj) => obj.id));
  let needsFix = false;

  const fixed = objects.map((obj) => {
    if (obj.parentId && !objectIds.has(obj.parentId)) {
      errors.push(`Object ${obj.id} has non-existent parent ${obj.parentId}`);
      needsFix = true;
      return { ...obj, parentId: null };
    }
    return obj;
  });

  return {
    isValid: !needsFix,
    errors,
    fixed: needsFix ? fixed : null,
  };
}

/**
 * Validate and auto-fix invalid parent types
 *
 * Finds objects with parentId pointing to non-group objects
 * and promotes them to root level (parentId = null).
 *
 * @param objects - All canvas objects
 * @returns Validation result with fixed objects if issues found
 */
export function validateAndFixParentTypes(objects: CanvasObject[]): ValidationResult {
  const errors: string[] = [];
  const objectMap = new Map(objects.map((obj) => [obj.id, obj]));
  let needsFix = false;

  const fixed = objects.map((obj) => {
    if (obj.parentId) {
      const parent = objectMap.get(obj.parentId);
      if (parent && parent.type !== 'group') {
        errors.push(`Object ${obj.id} has non-group parent ${obj.parentId} (type: ${parent.type})`);
        needsFix = true;
        return { ...obj, parentId: null };
      }
    }
    return obj;
  });

  return {
    isValid: !needsFix,
    errors,
    fixed: needsFix ? fixed : null,
  };
}

/**
 * Validate circular references
 *
 * Checks if an object is trying to become a child of one of its descendants.
 * This would create an invalid hierarchy loop.
 *
 * @param objectId - Object being moved
 * @param newParentId - Proposed new parent
 * @param objects - All canvas objects
 * @returns true if circular reference would be created
 */
export function wouldCreateCircularReference(
  objectId: string,
  newParentId: string | null,
  objects: CanvasObject[]
): boolean {
  if (!newParentId) return false;

  const descendants = getAllDescendantIds(objectId, objects);
  return descendants.includes(newParentId);
}

/**
 * Validate parent exists and is a group
 *
 * Checks that a proposed parent:
 * 1. Exists in the objects array
 * 2. Is of type 'group'
 *
 * @param parentId - Parent ID to validate
 * @param objects - All canvas objects
 * @returns true if parent is valid
 */
export function isValidParent(
  parentId: string | null,
  objects: CanvasObject[]
): boolean {
  if (!parentId) return true; // null parent (root level) is valid

  const parent = objects.find((obj) => obj.id === parentId);

  // Parent must exist
  if (!parent) return false;

  // Parent must be a group
  if (parent.type !== 'group') return false;

  return true;
}

/**
 * Validate object still exists
 *
 * Checks if an object ID is still present in the objects array.
 * Used to detect if objects were deleted during operations.
 *
 * @param objectId - Object ID to validate
 * @param objects - All canvas objects
 * @returns true if object exists
 */
export function objectExists(objectId: string, objects: CanvasObject[]): boolean {
  return objects.some((obj) => obj.id === objectId);
}

/**
 * Validate multiple objects exist
 *
 * Checks if all object IDs are still present in the objects array.
 *
 * @param objectIds - Object IDs to validate
 * @param objects - All canvas objects
 * @returns true if all objects exist
 */
export function allObjectsExist(objectIds: string[], objects: CanvasObject[]): boolean {
  const objectIdSet = new Set(objects.map((obj) => obj.id));
  return objectIds.every((id) => objectIdSet.has(id));
}

/**
 * Comprehensive hierarchy validation and fix
 *
 * Runs all validation checks and returns fixed objects if any issues found.
 * Validation order:
 * 1. Fix orphaned objects (non-existent parents)
 * 2. Fix invalid parent types (parents that aren't groups)
 *
 * @param objects - All canvas objects
 * @returns Validation result with combined fixes
 */
export function validateAndFixHierarchy(objects: CanvasObject[]): ValidationResult {
  const allErrors: string[] = [];
  let currentObjects = objects;

  // Fix orphaned objects first
  const orphansResult = validateAndFixOrphans(currentObjects);
  if (orphansResult.fixed) {
    currentObjects = orphansResult.fixed;
    allErrors.push(...orphansResult.errors);
  }

  // Then fix invalid parent types
  const typesResult = validateAndFixParentTypes(currentObjects);
  if (typesResult.fixed) {
    currentObjects = typesResult.fixed;
    allErrors.push(...typesResult.errors);
  }

  const needsFix = orphansResult.fixed !== null || typesResult.fixed !== null;

  return {
    isValid: !needsFix,
    errors: allErrors,
    fixed: needsFix ? currentObjects : null,
  };
}

/**
 * Validate drag-drop target at drop time
 *
 * Comprehensive validation for drag-drop operations including:
 * 1. Both objects still exist
 * 2. Target is valid (null or existing group)
 * 3. No circular references would be created
 * 4. Parent object (if target is sibling) is valid
 *
 * @param draggedId - Object being dragged
 * @param targetId - Drop target (null for root, ID for parent or sibling)
 * @param targetParentId - Parent of target (for sibling drops)
 * @param objects - Current objects array
 * @returns Validation result
 */
export function validateDragDrop(
  draggedId: string,
  targetId: string | null,
  targetParentId: string | null | undefined,
  objects: CanvasObject[]
): ValidationResult {
  const errors: string[] = [];

  // Check dragged object exists
  if (!objectExists(draggedId, objects)) {
    errors.push(`Dragged object ${draggedId} no longer exists`);
  }

  // Check target exists (if not null)
  if (targetId && !objectExists(targetId, objects)) {
    errors.push(`Target object ${targetId} no longer exists`);
  }

  // Check target is valid parent (if being dropped as child)
  if (targetId && !isValidParent(targetId, objects)) {
    errors.push(`Target ${targetId} is not a valid parent (must be a group)`);
  }

  // Check for circular reference (if dropping as child)
  if (targetId && wouldCreateCircularReference(draggedId, targetId, objects)) {
    errors.push(`Cannot move ${draggedId} into its own descendant ${targetId}`);
  }

  // Check target parent is valid (if dropping as sibling)
  if (targetParentId && !isValidParent(targetParentId, objects)) {
    errors.push(`Target parent ${targetParentId} is not a valid parent (must be a group or null)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fixed: null,
  };
}
