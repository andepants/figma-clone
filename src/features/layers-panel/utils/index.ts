/**
 * Layers Panel Utility Exports
 *
 * Barrel exports for layers panel utilities.
 */

export { getBaseName, parseLayerNumber, generateLayerName } from './layerNaming';

export {
  buildHierarchyTree,
  flattenHierarchyTree,
  getAllDescendantIds,
  hasChildren,
  hasLockedParent,
  moveToParent,
} from './hierarchy';

export {
  validateAndFixOrphans,
  validateAndFixParentTypes,
  wouldCreateCircularReference,
  isValidParent,
  objectExists,
  allObjectsExist,
  validateAndFixHierarchy,
  validateDragDrop,
} from './validation';

export {
  batchUpdateObjects,
  batchDeleteObjects,
  atomicMoveWithZIndexes,
  cascadeDeleteGroup,
  atomicReorderObjects,
  withRollback,
} from './transactions';
