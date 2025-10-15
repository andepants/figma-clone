// Barrel exports - add exports as components are created
export { getBaseName, parseLayerNumber, generateLayerName } from './layerNaming';

export {
  buildHierarchyTree,
  flattenHierarchyTree,
  getAllDescendantIds,
  hasChildren,
  hasLockedParent,
  moveToParent,
} from './hierarchy';
