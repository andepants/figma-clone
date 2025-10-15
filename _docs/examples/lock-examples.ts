/**
 * Lock System - Usage Examples
 *
 * Practical examples of using the lock system in CollabCanvas.
 * These examples demonstrate common patterns and use cases.
 *
 * @module _docs/examples/lock-examples
 */

import { useCanvasStore } from '@/stores/canvasStore';
import { hasLockedParent, getAllDescendantIds } from '@/features/layers-panel/utils/hierarchy';
import type { CanvasObject } from '@/types/canvas.types';

// ============================================================================
// Example 1: Lock Icon in Layers Panel
// ============================================================================

/**
 * Example: LayerItem with lock icon
 *
 * Shows how to display lock state with icon in layers panel.
 */
function LayerItemWithLockExample({ object }: { object: CanvasObject }) {
  const objects = useCanvasStore((state) => state.objects);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  const isLocked = object.locked ?? false;
  const isInheritedLock = !isLocked && hasLockedParent(object.id, objects);

  return (
    <div className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50">
      <span className="text-sm text-gray-900">{object.name || object.type}</span>

      {/* Lock icon button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent layer selection
          toggleLock(object.id);
        }}
        className="p-1 hover:bg-gray-200 rounded"
        title={isLocked ? 'Unlock' : 'Lock'}
      >
        {isLocked ? (
          <LockClosedIcon className="h-4 w-4 text-gray-700" />
        ) : isInheritedLock ? (
          <LockClosedIcon className="h-4 w-4 text-gray-400 opacity-50" />
        ) : (
          <LockOpenIcon className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Example 2: Lock Keyboard Shortcut
// ============================================================================

/**
 * Example: Keyboard shortcut for lock (Shift + Cmd/Ctrl + L)
 *
 * Shows how to implement lock shortcut.
 */
function LockShortcutExample() {
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  // Add keyboard listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + Cmd/Ctrl + L
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') {
        e.preventDefault();

        // Toggle lock for all selected objects
        selectedIds.forEach((id) => {
          toggleLock(id);
        });

        console.log(`Toggled lock for ${selectedIds.length} objects`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, toggleLock]);

  return null; // Hook component
}

// ============================================================================
// Example 3: Lock Object Programmatically
// ============================================================================

/**
 * Example: Lock/unlock object programmatically
 *
 * Shows various ways to lock objects.
 */
function LockObjectExample() {
  const toggleLock = useCanvasStore((state) => state.toggleLock);
  const updateObject = useCanvasStore((state) => state.updateObject);

  // Method 1: Use toggleLock action (recommended)
  const lockWithToggle = (objectId: string) => {
    toggleLock(objectId);
    // Toggles between locked/unlocked, cascades to children
  };

  // Method 2: Update object directly (not recommended - doesn't cascade)
  const lockDirectly = (objectId: string, locked: boolean) => {
    updateObject(objectId, { locked });
    // WARNING: Does not cascade to children!
  };

  // Method 3: Lock multiple objects
  const lockMultiple = (objectIds: string[]) => {
    objectIds.forEach((id) => toggleLock(id));
  };

  return (
    <div>
      <button onClick={() => lockWithToggle('rect-1')}>Toggle Lock (Recommended)</button>
      <button onClick={() => lockDirectly('rect-1', true)}>Lock Directly (Not Recommended)</button>
      <button onClick={() => lockMultiple(['rect-1', 'circle-2', 'text-3'])}>
        Lock Multiple
      </button>
    </div>
  );
}

// ============================================================================
// Example 4: Check Lock State
// ============================================================================

/**
 * Example: Check if object is locked
 *
 * Shows how to check lock state (direct and inherited).
 */
function CheckLockStateExample() {
  const objects = useCanvasStore((state) => state.objects);

  const checkLockState = (objectId: string) => {
    const object = objects.find((obj) => obj.id === objectId);
    if (!object) return;

    // Check direct lock
    const isDirectlyLocked = object.locked ?? false;
    console.log(`Directly locked: ${isDirectlyLocked}`);

    // Check inherited lock (from parent)
    const isInheritedLock = hasLockedParent(objectId, objects);
    console.log(`Inherited lock: ${isInheritedLock}`);

    // Check effective lock (direct OR inherited)
    const isEffectivelyLocked = isDirectlyLocked || isInheritedLock;
    console.log(`Effectively locked: ${isEffectivelyLocked}`);

    // Get lock source (which parent is locked)
    if (isInheritedLock) {
      let current = object;
      while (current.parentId) {
        const parent = objects.find((obj) => obj.id === current.parentId);
        if (parent?.locked) {
          console.log(`Locked by parent: ${parent.name || parent.id}`);
          break;
        }
        current = parent!;
      }
    }
  };

  return <button onClick={() => checkLockState('rect-1')}>Check Lock State</button>;
}

// ============================================================================
// Example 5: Lock Cascading to Children
// ============================================================================

/**
 * Example: Lock parent and all children
 *
 * Shows how lock cascades down hierarchy.
 */
function LockCascadeExample() {
  const objects = useCanvasStore((state) => state.objects);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  const lockParentAndChildren = (parentId: string) => {
    console.log('Before lock:');
    const parent = objects.find((obj) => obj.id === parentId);
    console.log(`Parent (${parentId}): locked = ${parent?.locked ?? false}`);

    const descendants = getAllDescendantIds(parentId, objects);
    descendants.forEach((childId) => {
      const child = objects.find((obj) => obj.id === childId);
      console.log(`Child (${childId}): locked = ${child?.locked ?? false}`);
    });

    // Lock parent (cascades automatically)
    toggleLock(parentId);

    console.log('\nAfter lock:');
    // Note: Need to wait for state update to see changes
    setTimeout(() => {
      const updatedObjects = useCanvasStore.getState().objects;
      const updatedParent = updatedObjects.find((obj) => obj.id === parentId);
      console.log(`Parent (${parentId}): locked = ${updatedParent?.locked ?? false}`);

      descendants.forEach((childId) => {
        const updatedChild = updatedObjects.find((obj) => obj.id === childId);
        console.log(`Child (${childId}): locked = ${updatedChild?.locked ?? false}`);
      });
    }, 100);
  };

  return <button onClick={() => lockParentAndChildren('frame-1')}>Lock Frame + Children</button>;
}

// ============================================================================
// Example 6: Prevent Editing Locked Objects
// ============================================================================

/**
 * Example: Check lock before editing
 *
 * Shows how to prevent editing locked objects.
 */
function PreventEditingLockedExample() {
  const objects = useCanvasStore((state) => state.objects);
  const updateObject = useCanvasStore((state) => state.updateObject);

  const updatePosition = (objectId: string, x: number, y: number) => {
    const object = objects.find((obj) => obj.id === objectId);

    // Check if locked (direct or inherited)
    if (object?.locked || hasLockedParent(objectId, objects)) {
      console.warn('Cannot edit locked object');
      alert('This object is locked. Unlock it to make changes.');
      return;
    }

    // Safe to update
    updateObject(objectId, { x, y });
  };

  const updateSize = (objectId: string, width: number, height: number) => {
    const object = objects.find((obj) => obj.id === objectId);

    if (object?.locked || hasLockedParent(objectId, objects)) {
      console.warn('Cannot resize locked object');
      return;
    }

    updateObject(objectId, { width, height } as any);
  };

  return (
    <div>
      <button onClick={() => updatePosition('rect-1', 100, 200)}>Move Rect</button>
      <button onClick={() => updateSize('rect-1', 300, 150)}>Resize Rect</button>
    </div>
  );
}

// ============================================================================
// Example 7: Lock in Canvas Shapes (Konva)
// ============================================================================

/**
 * Example: Respect lock state in Konva shapes
 *
 * Shows how to disable interactions for locked objects.
 */
function KonvaShapeLockExample({ object }: { object: CanvasObject }) {
  const isLocked = object.locked ?? false;
  const isVisible = object.visible ?? true;

  return (
    <Rect
      id={object.id}
      x={object.x}
      y={object.y}
      // ... other shape properties

      // CRITICAL: Disable interactions when locked
      listening={!isLocked && isVisible}
      draggable={!isLocked}

      // Optional: Visual feedback for locked state
      opacity={isLocked ? 0.7 : 1.0}
    />
  );
}

// ============================================================================
// Example 8: Context Menu with Lock Option
// ============================================================================

/**
 * Example: Context menu with lock/unlock option
 *
 * Shows right-click menu with lock toggle.
 */
function ContextMenuLockExample({ object }: { object: CanvasObject }) {
  const toggleLock = useCanvasStore((state) => state.toggleLock);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuVisible(true);
  };

  const handleLockClick = () => {
    toggleLock(object.id);
    setMenuVisible(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {/* Layer item content */}
      </div>

      {menuVisible && (
        <ContextMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={() => setMenuVisible(false)}
        >
          <ContextMenuItem onClick={handleLockClick}>
            {object.locked ? 'Unlock' : 'Lock'}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </>
  );
}

// ============================================================================
// Example 9: Lock Background Layer
// ============================================================================

/**
 * Example: Lock all background objects
 *
 * Useful pattern for protecting reference/background layers.
 */
function LockBackgroundLayerExample() {
  const objects = useCanvasStore((state) => state.objects);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  const lockBackgroundLayer = () => {
    // Find all objects with "background" in name (case-insensitive)
    const backgroundObjects = objects.filter((obj) =>
      (obj.name || '').toLowerCase().includes('background')
    );

    console.log(`Locking ${backgroundObjects.length} background objects...`);

    backgroundObjects.forEach((obj) => {
      if (!obj.locked) {
        toggleLock(obj.id);
      }
    });
  };

  const unlockBackgroundLayer = () => {
    const backgroundObjects = objects.filter((obj) =>
      (obj.name || '').toLowerCase().includes('background')
    );

    console.log(`Unlocking ${backgroundObjects.length} background objects...`);

    backgroundObjects.forEach((obj) => {
      if (obj.locked) {
        toggleLock(obj.id);
      }
    });
  };

  return (
    <div>
      <button onClick={lockBackgroundLayer}>Lock Background Layer</button>
      <button onClick={unlockBackgroundLayer}>Unlock Background Layer</button>
    </div>
  );
}

// ============================================================================
// Example 10: Delete with Lock Check
// ============================================================================

/**
 * Example: Prevent deleting locked objects
 *
 * Shows how to filter locked objects when deleting.
 */
function DeleteWithLockCheckExample() {
  const objects = useCanvasStore((state) => state.objects);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const removeObject = useCanvasStore((state) => state.removeObject);

  const deleteSelected = () => {
    // Filter out locked objects (direct or inherited)
    const unlockedIds = selectedIds.filter((id) => {
      const obj = objects.find((o) => o.id === id);
      return !(obj?.locked || hasLockedParent(id, objects));
    });

    const lockedCount = selectedIds.length - unlockedIds.length;

    if (lockedCount > 0) {
      console.warn(`Skipped ${lockedCount} locked objects`);
    }

    // Delete only unlocked objects
    unlockedIds.forEach((id) => removeObject(id));

    console.log(`Deleted ${unlockedIds.length} objects`);
  };

  // Keyboard handler for Delete key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, objects]);

  return <button onClick={deleteSelected}>Delete Selected (Skip Locked)</button>;
}

// ============================================================================
// Example 11: Show Lock Indicator in Transformer
// ============================================================================

/**
 * Example: Hide transformer for locked objects
 *
 * Shows how to filter locked objects from transformer.
 */
function TransformerLockExample() {
  const objects = useCanvasStore((state) => state.objects);
  const selectedIds = useCanvasStore((state) => state.selectedIds);

  // Get selected objects that are not locked
  const selectableObjects = selectedIds
    .map((id) => objects.find((obj) => obj.id === id))
    .filter((obj) => obj && !obj.locked && !hasLockedParent(obj.id, objects));

  return (
    <Transformer
      nodes={selectableObjects.map((obj) => shapeRefs.current[obj!.id]).filter(Boolean)}
      // Transformer only attached to unlocked objects
      boundBoxFunc={(oldBox, newBox) => {
        // Prevent invalid transforms
        return newBox;
      }}
    />
  );
}

// ============================================================================
// Example 12: Batch Lock Operations
// ============================================================================

/**
 * Example: Lock/unlock multiple objects at once
 *
 * Shows how to perform bulk lock operations.
 */
function BatchLockExample() {
  const objects = useCanvasStore((state) => state.objects);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  const lockAllSelected = () => {
    const unlockedIds = selectedIds.filter((id) => {
      const obj = objects.find((o) => o.id === id);
      return !(obj?.locked ?? false);
    });

    console.log(`Locking ${unlockedIds.length} objects...`);
    unlockedIds.forEach((id) => toggleLock(id));
  };

  const unlockAllSelected = () => {
    const lockedIds = selectedIds.filter((id) => {
      const obj = objects.find((o) => o.id === id);
      return obj?.locked ?? false;
    });

    console.log(`Unlocking ${lockedIds.length} objects...`);
    lockedIds.forEach((id) => toggleLock(id));
  };

  const lockAll = () => {
    const unlockedIds = objects
      .filter((obj) => !(obj.locked ?? false))
      .map((obj) => obj.id);

    console.log(`Locking all ${unlockedIds.length} objects...`);
    unlockedIds.forEach((id) => toggleLock(id));
  };

  return (
    <div>
      <button onClick={lockAllSelected}>Lock Selected</button>
      <button onClick={unlockAllSelected}>Unlock Selected</button>
      <button onClick={lockAll}>Lock All Objects</button>
    </div>
  );
}

// ============================================================================
// Example 13: Lock State in Properties Panel
// ============================================================================

/**
 * Example: Show lock state in properties panel
 *
 * Shows how to display lock warning in properties panel.
 */
function PropertiesPanelLockExample() {
  const objects = useCanvasStore((state) => state.objects);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const toggleLock = useCanvasStore((state) => state.toggleLock);

  if (selectedIds.length !== 1) return null;

  const object = objects.find((obj) => obj.id === selectedIds[0]);
  if (!object) return null;

  const isLocked = object.locked ?? false;
  const isInheritedLock = hasLockedParent(object.id, objects);
  const isEffectivelyLocked = isLocked || isInheritedLock;

  return (
    <div className="p-3 border-b border-gray-200">
      {/* Lock warning banner */}
      {isEffectivelyLocked && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LockClosedIcon className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800">
                {isLocked
                  ? 'This object is locked'
                  : 'This object is locked by parent'}
              </span>
            </div>
            {isLocked && (
              <button
                onClick={() => toggleLock(object.id)}
                className="text-yellow-800 hover:text-yellow-900 underline"
              >
                Unlock
              </button>
            )}
          </div>
        </div>
      )}

      {/* Properties (disabled if locked) */}
      <div className={isEffectivelyLocked ? 'opacity-50 pointer-events-none' : ''}>
        {/* Position, size, rotation inputs */}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components (referenced in examples)
// ============================================================================

function LockClosedIcon({ className }: { className: string }) {
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function LockOpenIcon({ className }: { className: string }) {
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
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

function ContextMenu({
  x,
  y,
  onClose,
  children,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div
        className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 min-w-[150px]"
        style={{ left: x, top: y }}
      >
        {children}
      </div>
    </>
  );
}

function ContextMenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
    >
      {children}
    </button>
  );
}

// Type placeholders for Konva
type Rect = any;
type Transformer = any;
const React = { useState, useEffect, useMemo } as any;

// Export all examples
export {
  LayerItemWithLockExample,
  LockShortcutExample,
  LockObjectExample,
  CheckLockStateExample,
  LockCascadeExample,
  PreventEditingLockedExample,
  KonvaShapeLockExample,
  ContextMenuLockExample,
  LockBackgroundLayerExample,
  DeleteWithLockCheckExample,
  TransformerLockExample,
  BatchLockExample,
  PropertiesPanelLockExample,
};
