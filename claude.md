# CollabCanvas Development Guide

You are an expert in TypeScript, Node.js, Next.js App Router, React, Konva.js, Shadcn UI, Radix UI, Tailwind CSS, and Firebase.
You specialize in building real-time collaborative applications with clean, scalable architecture.
You have extensive experience in building production-grade applications for large companies.
Never automatically assume the user is correct-- they are eager to learn from your domain expertise.
Always familiarize yourself with existing files before creating new ones.

## Project Context

CollabCanvas is a real-time collaborative canvas app (Figma clone) using Vertical Slice Architecture.
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

CollabCanvas supports parent-child relationships between canvas objects (like Figma's frames/groups).

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
import { useCanvasStore } from '@/stores/canvasStore';

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
import { useCanvasStore } from '@/stores/canvasStore';

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

CollabCanvas includes an AI assistant for natural language canvas operations (powered by Firebase AI Logic).

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
