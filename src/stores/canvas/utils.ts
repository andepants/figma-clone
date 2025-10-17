/**
 * Canvas Store Utilities
 *
 * Utility functions for canvas store operations.
 */

import type { CanvasObject, Rectangle, Circle, Text, Line } from '@/types';

/**
 * Compare two canvas object arrays for shallow equality
 *
 * Compares all properties that affect rendering and organization:
 * - Visual: Position (x, y), dimensions, transform, style, content
 * - Organizational: parentId, name, isCollapsed, visible, locked
 * - Type-specific: width/height/radius, text properties, line points
 *
 * This prevents unnecessary re-renders when Firebase subscription
 * creates a new array reference with identical values.
 *
 * @param {CanvasObject[]} arr1 - First array
 * @param {CanvasObject[]} arr2 - Second array
 * @returns {boolean} - True if arrays are shallowly equal
 */
export function areObjectArraysEqual(arr1: CanvasObject[], arr2: CanvasObject[]): boolean {
  // Quick length check
  if (arr1.length !== arr2.length) return false;

  // Compare each object's properties
  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i];
    const obj2 = arr2[i];

    // Compare common properties
    if (
      obj1.id !== obj2.id ||
      obj1.type !== obj2.type ||
      obj1.x !== obj2.x ||
      obj1.y !== obj2.y ||
      obj1.rotation !== obj2.rotation ||
      obj1.opacity !== obj2.opacity ||
      obj1.scaleX !== obj2.scaleX ||
      obj1.scaleY !== obj2.scaleY ||
      obj1.skewX !== obj2.skewX ||
      obj1.skewY !== obj2.skewY ||
      obj1.stroke !== obj2.stroke ||
      obj1.strokeWidth !== obj2.strokeWidth ||
      obj1.strokeEnabled !== obj2.strokeEnabled ||
      obj1.shadowColor !== obj2.shadowColor ||
      obj1.shadowBlur !== obj2.shadowBlur ||
      obj1.shadowOffsetX !== obj2.shadowOffsetX ||
      obj1.shadowOffsetY !== obj2.shadowOffsetY ||
      obj1.shadowOpacity !== obj2.shadowOpacity ||
      obj1.shadowEnabled !== obj2.shadowEnabled ||
      obj1.createdBy !== obj2.createdBy ||
      obj1.zIndex !== obj2.zIndex ||
      // Organizational properties (hierarchy, naming, visibility, lock)
      obj1.parentId !== obj2.parentId ||
      obj1.name !== obj2.name ||
      obj1.isCollapsed !== obj2.isCollapsed ||
      obj1.visible !== obj2.visible ||
      obj1.locked !== obj2.locked
    ) {
      return false;
    }

    // Compare fill property (only exists on Rectangle, Circle, Text - not Line)
    if ('fill' in obj1 && 'fill' in obj2 && obj1.fill !== obj2.fill) {
      return false;
    }

    // Type-specific comparisons
    if (obj1.type === 'rectangle' && obj2.type === 'rectangle') {
      const rect1 = obj1 as Rectangle;
      const rect2 = obj2 as Rectangle;
      if (
        rect1.width !== rect2.width ||
        rect1.height !== rect2.height ||
        rect1.cornerRadius !== rect2.cornerRadius
      ) {
        return false;
      }
    } else if (obj1.type === 'circle' && obj2.type === 'circle') {
      const circle1 = obj1 as Circle;
      const circle2 = obj2 as Circle;
      if (circle1.radius !== circle2.radius) {
        return false;
      }
    } else if (obj1.type === 'text' && obj2.type === 'text') {
      const text1 = obj1 as Text;
      const text2 = obj2 as Text;
      if (
        text1.text !== text2.text ||
        text1.width !== text2.width ||
        text1.height !== text2.height ||
        text1.fontSize !== text2.fontSize ||
        text1.fontFamily !== text2.fontFamily ||
        text1.fontStyle !== text2.fontStyle ||
        text1.textDecoration !== text2.textDecoration ||
        text1.align !== text2.align ||
        text1.verticalAlign !== text2.verticalAlign ||
        text1.lineHeight !== text2.lineHeight ||
        text1.letterSpacing !== text2.letterSpacing ||
        text1.wrap !== text2.wrap
      ) {
        return false;
      }
    } else if (obj1.type === 'line' && obj2.type === 'line') {
      const line1 = obj1 as Line;
      const line2 = obj2 as Line;
      if (
        line1.points[0] !== line2.points[0] ||
        line1.points[1] !== line2.points[1] ||
        line1.points[2] !== line2.points[2] ||
        line1.points[3] !== line2.points[3] ||
        line1.width !== line2.width
      ) {
        return false;
      }
    } else if (obj1.type === 'image' && obj2.type === 'image') {
      // Compare image-specific properties
      if (
        obj1.src !== obj2.src ||
        obj1.width !== obj2.width ||
        obj1.height !== obj2.height ||
        obj1.naturalWidth !== obj2.naturalWidth ||
        obj1.naturalHeight !== obj2.naturalHeight ||
        obj1.fileName !== obj2.fileName ||
        obj1.fileSize !== obj2.fileSize ||
        obj1.mimeType !== obj2.mimeType ||
        obj1.storageType !== obj2.storageType ||
        obj1.storagePath !== obj2.storagePath ||
        obj1.lockAspectRatio !== obj2.lockAspectRatio
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get all descendant IDs of a node
 *
 * Recursively collects IDs of all children and their descendants.
 * Used for hierarchy operations (group/ungroup, lock, etc).
 *
 * @param {string} nodeId - Parent node ID
 * @param {CanvasObject[]} objects - All canvas objects
 * @returns {string[]} - Array of descendant IDs
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
 * Check if a group has only empty groups (no actual renderable objects)
 *
 * Recursively checks if a group contains only empty groups.
 * Used for auto-deleting empty groups.
 *
 * @param {string} groupId - Group ID to check
 * @param {CanvasObject[]} objects - All canvas objects
 * @returns {boolean} - True if group has only empty groups
 */
export function hasOnlyEmptyGroups(groupId: string, objects: CanvasObject[]): boolean {
  const children = objects.filter((obj) => obj.parentId === groupId);

  // No children = empty
  if (children.length === 0) return true;

  // If any child is NOT a group, then we have a real object
  const hasNonGroupChild = children.some((child) => child.type !== 'group');
  if (hasNonGroupChild) return false;

  // All children are groups - recursively check if they're all empty
  return children.every((child) => hasOnlyEmptyGroups(child.id, objects));
}
