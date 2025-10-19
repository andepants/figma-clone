# Canvas Icons Development Guide

You are an expert in TypeScript, Node.js, Next.js App Router, React, Konva.js, Shadcn UI, Radix UI, Tailwind CSS, and Firebase.
You specialize in building real-time collaborative applications with clean, scalable architecture.
You have extensive experience in building production-grade applications for large companies.
Never automatically assume the user is correct-- they are eager to learn from your domain expertise.
Always familiarize yourself with existing files before creating new ones.

## Project Context

Canvas Icons is a real-time collaborative canvas app (Figma clone) using Vertical Slice Architecture.
The codebase is AI-first: modular, scalable, highly navigable, and easy to understand.

## Code Organization

- **Max 500 lines per file** - Split into smaller modules if exceeded
- **Descriptive names** - Files, functions, and variables clearly indicate their purpose
- **JSDoc comments** - All files have headers; all functions have proper documentation
- **Functional patterns** - Use `function` keyword for pure functions; avoid classes
- **Feature-based structure** - Organize by feature (canvas, collaboration, toolbar), not by type

## Code Style

- Write concise, technical code with functional and declarative patterns
- Throw errors instead of adding fallback values
- Use descriptive variable names with auxiliary verbs (isLoading, hasError)
- Avoid enums; use maps or union types instead
- Avoid unnecessary curly braces in conditionals
- Prefer iteration and modularization over code duplication

## Architecture

- **Vertical Slices**: Features → Stores → Services (no circular dependencies)
- **State**: Multiple focused Zustand stores (canvas, auth, ui, ai)
- **Real-time**: Firebase Realtime DB for all data (objects, cursors, presence - 50ms throttle)
- **Rendering**: Konva.js with 3-5 optimized layers, React.memo, throttle/debounce

## Design Principles

- **Canvas-first**: Workspace dominates, minimal UI chrome
- **Figma-inspired**: Minimalist, subtle shadows, soft borders, neutral colors
- **Fast feedback**: Optimistic updates, <150ms sync, 60 FPS always
- **Functional color**: 90% neutral grays, color for actions/states only
- **Inter font**: Clean typography with clear hierarchy

## Tech Stack

- React 18+ (functional components, hooks only)
- Konva.js for canvas rendering (3-5 layers max)
- Tailwind CSS (utility-first, canvas bg: #f5f5f5, primary: #0ea5e9)
- Firebase (Auth, Realtime DB for all real-time data)
- Zustand (lightweight state management)

## Performance

- Maintain 60 FPS canvas rendering
- Throttle all real-time updates (50ms for cursors and objects)
- Use React.memo, useCallback, useMemo appropriately
- Virtual rendering for 500+ objects
- Target: <150ms total sync latency (50ms throttle + 50-100ms network)

## Hierarchy System

Canvas Icons supports parent-child relationships between canvas objects (like Figma's frames/groups).

### Key Concepts

- **parentId**: Reference to parent object (null/undefined = root level)
- **isCollapsed**: Controls visibility of children in layers panel
- **Circular references**: Always validated before setting parentId

### Core Utilities

Located in `/src/features/layers-panel/utils/hierarchy.ts`:

```typescript
import {
  buildHierarchyTree,      // Flat array → nested tree
  flattenHierarchyTree,    // Nested tree → flat array (respects collapse)
  getAllDescendantIds,     // Get all child/grandchild IDs
  hasChildren,             // Check if object has children
  hasLockedParent,         // Check if ancestor is locked
  moveToParent,            // Move object with validation
} from '@/features/layers-panel/utils/hierarchy';
```

### Store Actions

```typescript
import { useCanvasStore } from '@/stores/canvas';

// Set parent-child relationship (validates circular refs)
setParent(objectId, newParentId);

// Select object and all descendants
selectWithDescendants(objectId);

// Toggle collapse state (hide/show children in panel)
toggleCollapse(objectId);
```

### Best Practices

- Always use `setParent` or `moveToParent` to prevent circular references
- Use `buildHierarchyTree` + `flattenHierarchyTree` for display
- Use `getAllDescendantIds` when operating on entire groups
- Check `hasChildren` before showing collapse arrow

See: `_docs/features/hierarchy-system.md` for full documentation

## Lock System

Locked objects cannot be selected, dragged, or edited on the canvas (matches Figma behavior).

### Key Concepts

- **locked**: Boolean flag (default: false)
- **Canvas behavior**: locked objects have `listening: false` (non-interactive)
- **Panel behavior**: Can still be selected/unlocked from layers panel
- **Cascading**: Locking parent locks all descendants

### Store Actions

```typescript
import { useCanvasStore } from '@/stores/canvas';

// Toggle lock state (cascades to descendants)
toggleLock(objectId);
```

### Lock Shortcuts

- **Mac**: Shift + Cmd + L
- **Windows/Linux**: Shift + Ctrl + L

### Checking Lock State

```typescript
import { hasLockedParent } from '@/features/layers-panel/utils/hierarchy';

// Check direct lock
const isLocked = object.locked ?? false;

// Check inherited lock (from parent)
const isInheritedLock = hasLockedParent(object.id, objects);

// Check effective lock (direct or inherited)
const isEffectivelyLocked = isLocked || isInheritedLock;
```

### Canvas Shape Pattern

All shapes must respect lock state:

```typescript
<Shape
  listening={!object.locked && object.visible !== false}
  draggable={!object.locked}
  // ... other props
/>
```

See: `_docs/features/lock-system.md` for full documentation

## AI Assistant

Canvas Icons includes an AI assistant for natural language canvas operations (powered by Firebase AI Logic).

### Key Concepts

- **Chat panel**: Bottom-right floating panel (toggleable)
- **Command history**: Last 50 commands stored in aiStore
- **Status tracking**: pending, success, error states for each command
- **Toggle shortcut**: Cmd+K (Mac) / Ctrl+K (Windows/Linux)

## UI Patterns

### Section Headers

For collapsible panel sections (properties, layers, etc.):

```typescript
<div className="border-b border-gray-200">
  <button
    onClick={() => setExpanded(!expanded)}
    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
  >
    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
      Section Title
    </span>
    <ChevronRightIcon
      className={cn(
        "h-3 w-3 text-gray-500 transition-transform",
        expanded && "rotate-90"
      )}
    />
  </button>
  {expanded && (
    <div className="p-3 space-y-2">
      {/* Section content */}
    </div>
  )}
</div>
```

**Style Guidelines:**
- Uppercase section titles with tracking-wide
- 3px horizontal padding, 2px vertical padding
- Gray-50 hover background
- Chevron rotates 90deg when expanded
- Border-bottom separator between sections

## Z-Index System

Canvas Icons uses array position to control layer order (like Figma).

### Key Concepts

- **Array position = Z-index**: First in array = back, last in array = front
- **Layers panel display**: Reversed order (top of panel = front of canvas)
- **Firebase sync**: Z-index stored as numeric property on each object
- **Drag to reorder**: Layers panel drag-drop updates z-index immediately

### Store Actions

```typescript
import { useCanvasStore } from '@/stores/canvas';

// Bring object to front (highest z-index)
bringToFront(objectId);

// Send object to back (lowest z-index)
sendToBack(objectId);
```

### Z-Index Shortcuts

- **Bring to Front**: ] (right bracket)
- **Send to Back**: [ (left bracket)

### Implementation Pattern

When reordering objects, always sync z-index to Firebase:

```typescript
// After reordering objects array
const reordered = [...objects];
// ... reorder logic ...
setObjects(reordered); // Updates local state
syncZIndexes(reordered); // Syncs to Firebase RTDB
```

## Grouping System

Canvas Icons supports grouping objects using the existing parentId hierarchy (like Figma frames).

### Key Concepts

- **Group type**: Special object type with no visual representation
- **Container only**: Groups don't render on canvas, only organize hierarchy
- **Auto-delete**: Empty groups automatically deleted when last child removed
- **Nested groups**: Full support for group-within-group hierarchies

### Store Actions

```typescript
import { useCanvasStore } from '@/stores/canvas';

// Group selected objects (minimum 2 objects)
groupObjects();

// Ungroup selected groups
ungroupObjects();
```

### Grouping Shortcuts

- **Group Selection**: Cmd/Ctrl + G
- **Ungroup Selection**: Shift + Cmd/Ctrl + G

### Group Object Type

```typescript
export interface Group extends BaseCanvasObject {
  type: 'group';
  // Groups have position (x, y) calculated from children bounding box
  // Groups have no width/height/fill/stroke - purely hierarchical
  isCollapsed?: boolean; // Collapse state in layers panel
}
```

### Implementation Pattern

Creating groups:

```typescript
// Calculate bounding box of selected objects
const bbox = calculateBoundingBox(selectedObjects);

// Create group at center of bounding box
const group: Group = {
  id: crypto.randomUUID(),
  type: 'group',
  x: bbox.x + bbox.width / 2,
  y: bbox.y + bbox.height / 2,
  name: generateLayerName('group', objects),
  isCollapsed: false,
  // ... base properties
};

// Set parentId on children
const updatedObjects = objects.map(obj =>
  selectedIds.includes(obj.id)
    ? { ...obj, parentId: group.id }
    : obj
);
```

## Context Menu

Right-click context menu in layers panel provides quick access to common actions.

### Key Concepts

- **Trigger**: Right-click on layer item in layers panel
- **Positioning**: Menu positioned at cursor, adjusts to stay on screen
- **Dynamic items**: Menu items vary based on object type and state
- **Keyboard shortcuts**: Displayed alongside each action

### Context Menu Actions

Available actions (varies by selection):

- Bring to Front / Send to Back
- Rename (double-click also works)
- Copy / Paste
- Group Selection (multi-select) / Ungroup (groups only)
- Show / Hide
- Lock / Unlock
- Delete

### Implementation Pattern

Using the context menu helper:

```typescript
import { getContextMenuItems } from '@/features/layers-panel/utils/contextMenu';
import { ContextMenu } from '@/components/common/ContextMenu';

// In component
const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setContextMenu({ x: e.clientX, y: e.clientY });
};

// In render
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    items={getContextMenuItems(object, objects, selectedIds)}
    onClose={() => setContextMenu(null)}
  />
)}
```

## Export System

PNG export with configurable options through a professional modal interface.

### Key Concepts

- **Modal-based workflow**: Export button opens configuration modal (matches Figma UX)
- **Configurable options**: Format (PNG), resolution (1x/2x/3x), scope (selection/all)
- **High quality exports**: 2x pixelRatio recommended, 3x for ultra-high quality
- **Selection-based**: Exports selected objects or entire canvas
- **Tight bounding box**: Calculates exact bounds around objects
- **Transparent background**: PNG format with transparent background
- **Group handling**: Automatically expands groups to include descendants
- **Hidden objects**: Includes hidden objects in export (Figma behavior)
- **Stroke & shadow aware**: Accounts for stroke width, shadows, and line thickness

### Export Options

```typescript
interface ExportOptions {
  format: 'png';              // Currently PNG only (future: SVG, JPG)
  scale: 1 | 2 | 3;           // Resolution multiplier (1x, 2x, 3x)
  scope: 'selection' | 'all'; // Export selected or all objects
}
```

### Using the Export Modal

```typescript
import { ExportModal } from '@/features/export';

// In component with export functionality
<ExportModal
  isOpen={isExportModalOpen}
  onClose={() => setIsExportModalOpen(false)}
  onExport={handleExportWithOptions}
  hasSelection={selectedIds.length > 0}
  hasObjects={objects.length > 0}
/>

// Export handler
async function handleExportWithOptions(options: ExportOptions) {
  await exportCanvasToPNG(stageRef, selectedObjects, allObjects, options);
}
```

### Export Function

```typescript
import { exportCanvasToPNG } from '@/lib/utils/export';

// Export with options
await exportCanvasToPNG(stageRef, selectedObjects, allObjects, {
  format: 'png',
  scale: 2,
  scope: 'selection'
});
```

### Export Shortcut

- **Open Export Modal**: Shift + Cmd/Ctrl + E
- **Trigger Export (in modal)**: Enter

### Export File Naming

Format: `canvasicons-YYYY-MM-DD-HH-MM-SS.png`

Example: `canvasicons-2025-10-16-14-30-45.png`

### Export Location

- Properties panel top-right (persistent across all states)
- Tooltip: "Export Canvas... (Shift+Cmd+E)"
- Disabled when canvas has no objects

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
