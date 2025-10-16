/**
 * Hierarchy System - Usage Examples
 *
 * Practical examples of using the hierarchy system in CollabCanvas.
 * These examples demonstrate common patterns and use cases.
 *
 * @module _docs/examples/hierarchy-examples
 */

import React from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import {
  buildHierarchyTree,
  flattenHierarchyTree,
  getAllDescendantIds,
  hasChildren,
  moveToParent,
} from '@/features/layers-panel/utils/hierarchy';
import type { CanvasObject } from '@/types/canvas.types';

// ============================================================================
// Example 1: Display Hierarchy in Layers Panel
// ============================================================================

/**
 * Example: LayersPanel component that displays hierarchy
 *
 * Shows how to build and flatten hierarchy tree for display.
 */
function LayersPanelExample() {
  const objects = useCanvasStore((state) => state.objects);

  // Build tree from flat array
  const tree = buildHierarchyTree(objects);

  // Flatten tree for display (hide collapsed children)
  const displayList = flattenHierarchyTree(tree, false);

  return (
    <div className="w-64 bg-white border-l border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Layers</h2>
      </div>

      <div className="overflow-y-auto">
        {displayList.map((obj) => (
          <LayerItemExample
            key={obj.id}
            object={obj}
            depth={obj.depth}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example: LayerItem component with hierarchy indentation
 *
 * Shows how to render items with depth-based indentation.
 */
function LayerItemExample({
  object,
  depth,
}: {
  object: CanvasObject & { depth: number };
  depth: number;
}) {
  const objects = useCanvasStore((state) => state.objects);
  const toggleCollapse = useCanvasStore((state) => state.toggleCollapse);
  const selectObjects = useCanvasStore((state) => state.selectObjects);

  const isParent = hasChildren(object.id, objects);

  return (
    <div
      className="flex items-center px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
      style={{ paddingLeft: `${12 + depth * 16}px` }}
      onClick={() => selectObjects([object.id])}
    >
      {/* Collapse arrow for parents */}
      {isParent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(object.id);
          }}
          className="mr-1"
        >
          <ChevronRightIcon
            className={`h-3 w-3 text-gray-500 transition-transform ${
              object.isCollapsed ? '' : 'rotate-90'
            }`}
          />
        </button>
      )}

      {/* Object name */}
      <span className="text-sm text-gray-900">
        {object.name || `${object.type} ${object.id.slice(0, 4)}`}
      </span>
    </div>
  );
}

// ============================================================================
// Example 2: Create Parent-Child Relationship via Drag-Drop
// ============================================================================

/**
 * Example: Drag and drop to create hierarchy
 *
 * Shows how to implement drag-drop for creating parent-child relationships.
 */
function DragDropHierarchyExample() {
  const setParent = useCanvasStore((state) => state.setParent);

  const handleDragStart = (e: React.DragEvent, objectId: string) => {
    // Store dragged object ID
    e.dataTransfer.setData('application/canvas-object-id', objectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetObjectId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData('application/canvas-object-id');

    // Create parent-child relationship
    if (draggedId && draggedId !== targetObjectId) {
      setParent(draggedId, targetObjectId);
      // setParent validates circular references automatically
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, 'object-1')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'object-1')}
    >
      {/* Layer item content */}
    </div>
  );
}

// ============================================================================
// Example 3: Select Entire Group (Parent + All Descendants)
// ============================================================================

/**
 * Example: Select collapsed parent and all children
 *
 * When clicking collapsed parent, select entire group.
 */
function SelectGroupExample() {
  const objects = useCanvasStore((state) => state.objects);
  const selectObjects = useCanvasStore((state) => state.selectObjects);
  const selectWithDescendants = useCanvasStore((state) => state.selectWithDescendants);

  const handleLayerClick = (objectId: string) => {
    const object = objects.find((obj) => obj.id === objectId);

    if (object?.isCollapsed) {
      // Select entire group when collapsed
      selectWithDescendants(objectId);
    } else {
      // Select single object when expanded
      selectObjects([objectId]);
    }
  };

  return <div onClick={() => handleLayerClick('frame-1')}>Frame 1</div>;
}

/**
 * Example: Manual group selection with getAllDescendantIds
 *
 * Alternative approach using utility function directly.
 */
function ManualSelectGroupExample() {
  const objects = useCanvasStore((state) => state.objects);
  const selectObjects = useCanvasStore((state) => state.selectObjects);

  const selectGroup = (parentId: string) => {
    // Get all child/grandchild IDs
    const descendants = getAllDescendantIds(parentId, objects);

    // Select parent + all descendants
    selectObjects([parentId, ...descendants]);
  };

  return <button onClick={() => selectGroup('frame-1')}>Select Frame 1 Group</button>;
}

// ============================================================================
// Example 4: Move Object to Parent with Validation
// ============================================================================

/**
 * Example: Move object to new parent with error handling
 *
 * Shows validation and error handling for circular references.
 */
function MoveObjectExample() {
  const objects = useCanvasStore((state) => state.objects);
  const setObjects = useCanvasStore((state) => state.setObjects);

  const moveObjectWithValidation = (objectId: string, newParentId: string | null) => {
    // Use moveToParent utility for validation
    const updatedObjects = moveToParent(objectId, newParentId, objects);

    if (updatedObjects) {
      // Success - update objects
      setObjects(updatedObjects);
      console.log(`Moved ${objectId} to parent ${newParentId}`);
    } else {
      // Failed - circular reference detected
      console.error('Cannot move object: circular reference detected');
      alert('Cannot move object into its own child');
    }
  };

  return (
    <button onClick={() => moveObjectWithValidation('rect-1', 'frame-1')}>
      Move Rect to Frame
    </button>
  );
}

/**
 * Example: Alternative using store action (auto-validates)
 *
 * Simpler approach using built-in validation.
 */
function MoveObjectStoreExample() {
  const setParent = useCanvasStore((state) => state.setParent);

  const moveObject = (objectId: string, newParentId: string | null) => {
    // setParent validates automatically
    setParent(objectId, newParentId);
    // Logs error to console if circular reference detected
  };

  return (
    <button onClick={() => moveObject('rect-1', 'frame-1')}>Move Rect to Frame</button>
  );
}

// ============================================================================
// Example 5: Create Nested Frame Structure Programmatically
// ============================================================================

/**
 * Example: Create nested frame structure
 *
 * Shows how to build complex hierarchies programmatically.
 */
function CreateNestedFramesExample() {
  const addObject = useCanvasStore((state) => state.addObject);
  const setParent = useCanvasStore((state) => state.setParent);

  const createNestedFrames = () => {
    // Create parent frame
    const parentFrame = {
      id: `frame-${Date.now()}`,
      type: 'rectangle' as const,
      name: 'Parent Frame',
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      fill: '#f0f0f0',
      stroke: '#999999',
      strokeWidth: 2,
      cornerRadius: 8,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      strokeEnabled: true,
      shadowEnabled: false,
      createdBy: 'user-123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addObject(parentFrame);

    // Create child frame
    const childFrame = {
      ...parentFrame,
      id: `frame-${Date.now() + 1}`,
      name: 'Child Frame',
      x: 150,
      y: 150,
      width: 300,
      height: 300,
      fill: '#e0e0e0',
    };

    addObject(childFrame);
    setParent(childFrame.id, parentFrame.id);

    // Create grandchild rectangle
    const grandchildRect = {
      ...childFrame,
      id: `rect-${Date.now() + 2}`,
      name: 'Grandchild Rect',
      x: 200,
      y: 200,
      width: 200,
      height: 100,
      fill: '#3b82f6',
    };

    addObject(grandchildRect);
    setParent(grandchildRect.id, childFrame.id);

    console.log('Created nested structure: Parent → Child → Grandchild');
  };

  return <button onClick={createNestedFrames}>Create Nested Frames</button>;
}

// ============================================================================
// Example 6: Delete Parent and Handle Children
// ============================================================================

/**
 * Example: Delete parent and all descendants
 *
 * Option 1: Delete entire group.
 */
function DeleteGroupExample() {
  const objects = useCanvasStore((state) => state.objects);
  const removeObject = useCanvasStore((state) => state.removeObject);

  const deleteGroup = (parentId: string) => {
    // Get all descendants
    const descendants = getAllDescendantIds(parentId, objects);

    // Delete parent and all children
    [parentId, ...descendants].forEach((id) => {
      removeObject(id);
    });

    console.log(`Deleted ${descendants.length + 1} objects`);
  };

  return <button onClick={() => deleteGroup('frame-1')}>Delete Frame and Children</button>;
}

/**
 * Example: Delete parent and move children to root
 *
 * Option 2: Preserve children by moving to root level.
 */
function DeleteParentKeepChildrenExample() {
  const objects = useCanvasStore((state) => state.objects);
  const removeObject = useCanvasStore((state) => state.removeObject);
  const setParent = useCanvasStore((state) => state.setParent);

  const deleteParentKeepChildren = (parentId: string) => {
    // Move direct children to root
    const children = objects.filter((obj) => obj.parentId === parentId);

    children.forEach((child) => {
      setParent(child.id, null); // Move to root
    });

    // Delete parent
    removeObject(parentId);

    console.log(`Deleted parent, moved ${children.length} children to root`);
  };

  return (
    <button onClick={() => deleteParentKeepChildren('frame-1')}>
      Delete Frame (Keep Children)
    </button>
  );
}

// ============================================================================
// Example 7: Toggle Collapse State
// ============================================================================

/**
 * Example: Toggle collapse state for hierarchy
 *
 * Shows/hides children in layers panel.
 */
function CollapseExample() {
  const objects = useCanvasStore((state) => state.objects);
  const toggleCollapse = useCanvasStore((state) => state.toggleCollapse);

  const handleToggleCollapse = (objectId: string) => {
    const object = objects.find((obj) => obj.id === objectId);

    if (hasChildren(objectId, objects)) {
      toggleCollapse(objectId);
      console.log(
        `${object?.isCollapsed ? 'Expanded' : 'Collapsed'} ${object?.name || objectId}`
      );
    }
  };

  return (
    <button onClick={() => handleToggleCollapse('frame-1')}>Toggle Collapse Frame 1</button>
  );
}

// ============================================================================
// Example 8: Check Parent-Child Relationships
// ============================================================================

/**
 * Example: Various hierarchy checks
 *
 * Shows how to check relationships and states.
 */
function HierarchyChecksExample() {
  const objects = useCanvasStore((state) => state.objects);

  const checkRelationships = (objectId: string) => {
    const object = objects.find((obj) => obj.id === objectId);

    // Check if object is a parent
    const isParent = hasChildren(objectId, objects);
    console.log(`Is parent: ${isParent}`);

    // Get all children
    const children = objects.filter((obj) => obj.parentId === objectId);
    console.log(`Direct children: ${children.length}`);

    // Get all descendants (recursive)
    const descendants = getAllDescendantIds(objectId, objects);
    console.log(`Total descendants: ${descendants.length}`);

    // Check collapse state
    console.log(`Is collapsed: ${object?.isCollapsed ?? false}`);

    // Check if object has parent
    const hasParent = !!object?.parentId;
    console.log(`Has parent: ${hasParent}`);

    // Find parent
    if (hasParent) {
      const parent = objects.find((obj) => obj.id === object.parentId);
      console.log(`Parent: ${parent?.name || parent?.id}`);
    }

    // Get depth in hierarchy
    let depth = 0;
    let currentObj = object;
    while (currentObj?.parentId) {
      depth++;
      currentObj = objects.find((obj) => obj.id === currentObj!.parentId);
    }
    console.log(`Depth in hierarchy: ${depth}`);
  };

  return <button onClick={() => checkRelationships('rect-1')}>Check Relationships</button>;
}

// ============================================================================
// Example 9: Build and Display Hierarchy Tree
// ============================================================================

/**
 * Example: Build and log hierarchy tree
 *
 * Shows tree structure for debugging.
 */
function BuildTreeExample() {
  const objects = useCanvasStore((state) => state.objects);

  const logHierarchyTree = () => {
    const tree = buildHierarchyTree(objects);

    console.log('=== Hierarchy Tree ===');

    const printNode = (node: CanvasObject & { children: unknown[]; depth: number}, prefix: string = '') => {
      const name = node.name || `${node.type} ${node.id.slice(0, 4)}`;
      const childCount = node.children.length;
      const collapsed = node.isCollapsed ? ' [collapsed]' : '';

      console.log(`${prefix}├─ ${name} (${childCount} children)${collapsed}`);

      node.children.forEach((child: CanvasObject & { children: unknown[]; depth: number}, index: number) => {
        const isLast = index === node.children.length - 1;
        const childPrefix = prefix + (isLast ? '   ' : '│  ');
        printNode(child, childPrefix);
      });
    };

    tree.forEach((node) => printNode(node));
  };

  return <button onClick={logHierarchyTree}>Log Hierarchy Tree</button>;
}

// ============================================================================
// Example 10: Prevent Circular References
// ============================================================================

/**
 * Example: Circular reference validation
 *
 * Shows how validation prevents invalid hierarchies.
 */
function CircularReferenceExample() {
  const objects = useCanvasStore((state) => state.objects);
  const setParent = useCanvasStore((state) => state.setParent);

  const demonstrateCircularPrevention = () => {
    // Scenario: frame1 → rect2 → circle3
    // Try to set: frame1.parentId = circle3 (creates cycle!)

    console.log('Attempting to create circular reference...');

    // This will fail silently (logs error to console)
    setParent('frame-1', 'circle-3');

    console.log('Circular reference prevented!');

    // Alternative: Use moveToParent for explicit null check
    const result = moveToParent('frame-1', 'circle-3', objects);

    if (result === null) {
      console.log('moveToParent returned null (validation failed)');
    }
  };

  return (
    <button onClick={demonstrateCircularPrevention}>
      Demonstrate Circular Prevention
    </button>
  );
}

// ============================================================================
// Helper Components (referenced in examples)
// ============================================================================

function ChevronRightIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

// Export all examples
export {
  LayersPanelExample,
  LayerItemExample,
  DragDropHierarchyExample,
  SelectGroupExample,
  ManualSelectGroupExample,
  MoveObjectExample,
  MoveObjectStoreExample,
  CreateNestedFramesExample,
  DeleteGroupExample,
  DeleteParentKeepChildrenExample,
  CollapseExample,
  HierarchyChecksExample,
  BuildTreeExample,
  CircularReferenceExample,
};
