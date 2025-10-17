# Project Rules: CollabCanvas

## Overview

CollabCanvas is built as an **AI-first codebase**, meaning it prioritizes modularity, scalability, and readability to maximize compatibility with modern AI development tools. Every file, function, and component is designed to be easily understood by both humans and AI assistants.

---

## Core Principles

### 1. AI-First Development
- **Modular**: Each file has a single, clear responsibility
- **Scalable**: Structure supports growth without refactoring
- **Readable**: Code is self-documenting with clear names and comments
- **Navigable**: Directory structure is logical and intuitive
- **Discoverable**: Files are easy to find based on their purpose

### 2. File Size Limit
- **Maximum 500 lines per file**
- If a file exceeds 500 lines, split it into smaller modules
- Prefer multiple focused files over large monolithic files

### 3. Documentation Standard
- Every file must have a header comment explaining its purpose
- All functions must have JSDoc/TSDoc documentation
- Complex logic must include inline comments
- Type definitions should be self-explanatory with descriptive names

---

## Project Directory Structure

```
collabcanvas/
├── _docs/                          # Project documentation
│   ├── project-overview.md
│   ├── user-flow.md
│   ├── tech-stack.md
│   ├── ui-rules.md
│   ├── theme-rules.md
│   ├── project-rules.md
│   └── phases/                     # Development phase documents
│       ├── phase-1-setup.md
│       └── phase-2-mvp.md
│
├── public/                         # Static assets
│   ├── favicon.ico
│   └── fonts/
│
├── src/
│   ├── main.tsx                    # Application entry point
│   ├── App.tsx                     # Root component with routing
│   │
│   ├── components/                 # React components
│   │   ├── canvas/                 # Canvas-specific components
│   │   │   ├── CanvasStage.tsx    # Main Konva Stage wrapper
│   │   │   ├── CanvasLayer.tsx    # Konva Layer component
│   │   │   ├── CanvasObject.tsx   # Base canvas object renderer
│   │   │   ├── Rectangle.tsx      # Rectangle shape component
│   │   │   ├── Circle.tsx         # Circle shape component
│   │   │   ├── Text.tsx           # Text shape component
│   │   │   └── index.ts           # Barrel export
│   │   │
│   │   ├── collaboration/          # Multiplayer features
│   │   │   ├── Cursor.tsx         # Other users' cursors
│   │   │   ├── CursorLabel.tsx    # Username label above cursor
│   │   │   ├── PresenceIndicator.tsx  # Online users list
│   │   │   ├── UserAvatar.tsx     # User avatar circle
│   │   │   └── index.ts
│   │   │
│   │   ├── toolbar/                # Toolbar components
│   │   │   ├── Toolbar.tsx        # Main toolbar container
│   │   │   ├── ShapeButton.tsx    # Shape creation button
│   │   │   ├── ZoomControls.tsx   # Zoom in/out buttons
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/                   # Authentication components
│   │   │   ├── AuthModal.tsx      # Login/signup modal
│   │   │   ├── LoginForm.tsx      # Login form
│   │   │   ├── SignupForm.tsx     # Signup form
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── PageLayout.tsx     # Main page wrapper
│   │   │   ├── Header.tsx         # Page header (if needed)
│   │   │   └── index.ts
│   │   │
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── label.tsx
│   │   │   └── card.tsx
│   │   │
│   │   └── common/                 # Shared/common components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── index.ts
│   │
│   ├── pages/                      # Page components
│   │   ├── LandingPage.tsx        # Public landing page
│   │   ├── CanvasPage.tsx         # Main canvas workspace
│   │   └── NotFoundPage.tsx       # 404 page
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hook
│   │   ├── useCanvas.ts           # Canvas state and operations
│   │   ├── useCursors.ts          # Real-time cursor sync
│   │   ├── usePresence.ts         # User presence tracking
│   │   ├── useCanvasObjects.ts    # Canvas objects CRUD
│   │   ├── useZoom.ts             # Zoom/pan functionality
│   │   ├── useFirestore.ts        # Firestore operations
│   │   ├── useRealtimeDB.ts       # Realtime DB operations
│   │   └── index.ts               # Barrel export
│   │
│   ├── stores/                     # Zustand stores
│   │   ├── canvasStore.ts         # Canvas objects state
│   │   ├── authStore.ts           # Auth state
│   │   ├── uiStore.ts             # UI state (modals, etc)
│   │   └── index.ts
│   │
│   ├── lib/                        # Library code and utilities
│   │   ├── firebase/               # Firebase configuration
│   │   │   ├── config.ts          # Firebase initialization
│   │   │   ├── auth.ts            # Auth helpers
│   │   │   ├── firestore.ts       # Firestore helpers
│   │   │   ├── realtimedb.ts      # Realtime DB helpers
│   │   │   └── index.ts
│   │   │
│   │   ├── canvas/                 # Canvas utilities
│   │   │   ├── coordinates.ts     # Coordinate transformations
│   │   │   ├── colors.ts          # Color utilities
│   │   │   ├── shapes.ts          # Shape helpers
│   │   │   └── index.ts
│   │   │
│   │   └── utils/                  # General utilities
│   │       ├── throttle.ts        # Throttle utility
│   │       ├── debounce.ts        # Debounce utility
│   │       ├── generateId.ts      # ID generation
│   │       └── index.ts
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── canvas.types.ts        # Canvas-related types
│   │   ├── user.types.ts          # User-related types
│   │   ├── auth.types.ts          # Auth-related types
│   │   ├── firebase.types.ts      # Firebase-related types
│   │   └── index.ts               # Barrel export
│   │
│   ├── constants/                  # Constants and configuration
│   │   ├── colors.ts              # Color constants
│   │   ├── canvas.ts              # Canvas config (size, etc)
│   │   ├── routes.ts              # Route paths
│   │   └── index.ts
│   │
│   ├── styles/                     # Global styles
│   │   ├── globals.css            # Global CSS (Tailwind imports)
│   │   └── theme.css              # Theme variables
│   │
│   └── __tests__/                  # Test files (mirror src structure)
│       ├── components/
│       ├── hooks/
│       └── lib/
│
├── .env.local                      # Local environment variables
├── .env.example                    # Example env variables
├── .gitignore
├── package.json
├── tsconfig.json                   # TypeScript config
├── tailwind.config.js              # Tailwind config
├── vite.config.ts                  # Vite config
├── firebase.json                   # Firebase config
└── README.md
```

---

## File Naming Conventions

### General Rules
- Use **PascalCase** for React components: `CanvasStage.tsx`, `UserAvatar.tsx`
- Use **camelCase** for utilities and hooks: `useAuth.ts`, `throttle.ts`
- Use **kebab-case** for CSS files: `globals.css`, `theme.css`
- Use **.tsx** extension for files containing JSX
- Use **.ts** extension for pure TypeScript files
- Use **descriptive names** that clearly indicate purpose

### Component Files
```typescript
// ✅ Good
CanvasStage.tsx
CursorLabel.tsx
AuthModal.tsx

// ❌ Bad
stage.tsx
cl.tsx
modal.tsx
```

### Hook Files
```typescript
// ✅ Good - Must start with "use"
useAuth.ts
useCanvasObjects.ts
useFirestore.ts

// ❌ Bad
auth.ts (not a hook name)
canvas.ts (not descriptive enough)
```

### Utility Files
```typescript
// ✅ Good - Verb or noun describing function
throttle.ts
generateId.ts
coordinates.ts

// ❌ Bad
utils.ts (too generic)
helpers.ts (not descriptive)
```

### Type Files
```typescript
// ✅ Good - Ends with .types.ts
canvas.types.ts
user.types.ts

// ❌ Bad
types.ts (too generic)
canvasTypes.ts (doesn't follow convention)
```

### Barrel Exports (index.ts)
- Every directory with multiple files should have an `index.ts`
- Barrel files export all public APIs from that directory
- Simplifies imports: `import { useAuth } from '@/hooks'`

```typescript
// hooks/index.ts
export { useAuth } from './useAuth';
export { useCanvas } from './useCanvas';
export { useCursors } from './useCursors';
```

---

## File Structure Standards

### File Header Documentation

Every file must start with a documentation block explaining its purpose.

```typescript
/**
 * @fileoverview Canvas Stage component - Main Konva Stage wrapper that handles
 * pan, zoom, and renders all canvas layers.
 *
 * This component manages the root Konva Stage and coordinates between
 * the static canvas layer and the dynamic objects layer.
 *
 * @module components/canvas/CanvasStage
 */
```

### Component File Structure

```typescript
/**
 * @fileoverview [Component name and purpose]
 */

// 1. Imports - External libraries first, then internal
import { useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasStore } from '@/stores';
import type { CanvasObject } from '@/types';

// 2. Types/Interfaces specific to this file
interface CanvasStageProps {
  width: number;
  height: number;
  onObjectClick?: (id: string) => void;
}

// 3. Constants specific to this file
const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

// 4. Main Component
/**
 * Canvas Stage - Main container for the Konva canvas
 *
 * Manages zoom, pan, and renders all canvas objects.
 *
 * @param {CanvasStageProps} props - Component props
 * @returns {JSX.Element} Rendered canvas stage
 */
export function CanvasStage({
  width,
  height,
  onObjectClick
}: CanvasStageProps) {
  // 5. Hooks - State first, then effects, then custom hooks
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const objects = useCanvasStore((state) => state.objects);

  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 6. Event handlers
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  };

  // 7. Render
  return (
    <Stage width={width} height={height}>
      {/* Component JSX */}
    </Stage>
  );
}

// 8. Helper functions (if any) - Should be moved to separate file if >50 lines
function helperFunction() {
  // Helper logic
}
```

### Hook File Structure

```typescript
/**
 * @fileoverview [Hook name and purpose]
 */

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

/**
 * Authentication hook - Manages user authentication state
 *
 * Listens to Firebase auth state changes and provides current user info.
 *
 * @returns {Object} Auth state and methods
 * @returns {User | null} returns.currentUser - Currently authenticated user
 * @returns {boolean} returns.loading - Whether auth state is loading
 * @returns {Function} returns.login - Login function
 * @returns {Function} returns.logout - Logout function
 *
 * @example
 * const { currentUser, loading, login, logout } = useAuth();
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Implementation

  return { currentUser, loading, login, logout };
}
```

### Utility File Structure

```typescript
/**
 * @fileoverview [Utility purpose]
 */

/**
 * Throttle function - Limits function execution frequency
 *
 * Ensures a function is called at most once per specified time period.
 * Useful for performance optimization with high-frequency events.
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### Type Definition File Structure

```typescript
/**
 * @fileoverview Canvas-related TypeScript type definitions
 *
 * Defines all types and interfaces related to canvas objects,
 * shapes, and canvas state management.
 */

/**
 * Shape type - Supported canvas shape types
 */
export type ShapeType = 'rectangle' | 'circle' | 'text';

/**
 * Base canvas object - Common properties for all canvas objects
 */
export interface BaseCanvasObject {
  /** Unique identifier */
  id: string;

  /** Shape type */
  type: ShapeType;

  /** X coordinate on canvas */
  x: number;

  /** Y coordinate on canvas */
  y: number;

  /** Fill color (hex format) */
  color: string;

  /** User who created this object */
  createdBy: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Rectangle object - Represents a rectangle on the canvas
 */
export interface Rectangle extends BaseCanvasObject {
  type: 'rectangle';
  width: number;
  height: number;
}

// More types...
```

---

## Code Organization Rules

### 1. Single Responsibility Principle
- Each file should have ONE clear purpose
- If a file does multiple things, split it
- Components should handle UI only, logic goes in hooks

**Example:**
```typescript
// ❌ Bad - Component handles both UI and Firebase logic
export function CanvasPage() {
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(firestore, 'canvas', 'main'), (snap) => {
      setObjects(snap.data().objects);
    });
    return unsubscribe;
  }, []);

  return <div>...</div>;
}

// ✅ Good - Logic in hook, component for UI
export function CanvasPage() {
  const { objects } = useCanvasObjects();
  return <div>...</div>;
}
```

### 2. Import Organization

Organize imports in this order:
1. External libraries (React, Firebase, etc)
2. Internal aliases (@/...)
3. Relative imports (./, ../)
4. Type imports (separate at bottom)

```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';

// 2. Internal - absolute imports with @/ alias
import { useCanvasStore } from '@/stores';
import { throttle } from '@/lib/utils';
import { CANVAS_SIZE } from '@/constants';

// 3. Relative imports
import { CanvasObject } from './CanvasObject';

// 4. Type imports
import type { CanvasObject as CanvasObjectType } from '@/types';
```

### 3. Export Standards

Prefer **named exports** over default exports for better refactoring and IDE support.

```typescript
// ✅ Good - Named export
export function CanvasStage() { ... }

// ❌ Bad - Default export
export default function CanvasStage() { ... }

// Exception: Page components can use default export
// pages/CanvasPage.tsx
export default function CanvasPage() { ... }
```

### 4. Prop Destructuring

Always destructure props in function signature for clarity.

```typescript
// ✅ Good
export function Button({ label, onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

// ❌ Bad
export function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### 5. Type Safety

- Always define types for props, function parameters, and return values
- Use `interface` for object shapes
- Use `type` for unions, primitives, and complex types
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// ✅ Good
interface UserAvatarProps {
  userId: string;
  username: string;
  color: string;
}

export function UserAvatar({ userId, username, color }: UserAvatarProps) {
  // ...
}

// ❌ Bad
export function UserAvatar(props: any) {
  // ...
}
```

---

## Documentation Standards

### JSDoc/TSDoc Comments

All exported functions, components, and hooks must have documentation comments.

**Required Elements:**
- Brief description (one line)
- Detailed description (if needed)
- `@param` for each parameter
- `@returns` for return value
- `@example` for complex usage (recommended)

```typescript
/**
 * Transform screen coordinates to canvas coordinates
 *
 * Converts mouse position from screen space to canvas space,
 * accounting for zoom and pan transformations.
 *
 * @param {number} screenX - X coordinate in screen space
 * @param {number} screenY - Y coordinate in screen space
 * @param {number} zoom - Current zoom level
 * @param {number} panX - Pan offset X
 * @param {number} panY - Pan offset Y
 * @returns {Object} Canvas coordinates
 * @returns {number} returns.x - X coordinate in canvas space
 * @returns {number} returns.y - Y coordinate in canvas space
 *
 * @example
 * const canvasPos = screenToCanvas(100, 200, 1.5, 50, 50);
 * console.log(canvasPos); // { x: 33.33, y: 100 }
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  zoom: number,
  panX: number,
  panY: number
): { x: number; y: number } {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  };
}
```

### Inline Comments

Use inline comments for:
- Complex logic that isn't immediately obvious
- Workarounds or non-intuitive solutions
- TODO items (with GitHub issue reference if applicable)

```typescript
// Throttle cursor updates to 50ms to prevent Firebase write spam
// See: https://github.com/org/repo/issues/123
const throttledUpdate = throttle(updateCursor, 50);

// TODO: Implement proper conflict resolution for simultaneous edits
// Current approach is "last write wins"
if (isEditingConflict) {
  resolveConflict(localEdit, remoteEdit);
}
```

**Don't over-comment obvious code:**
```typescript
// ❌ Bad - Obvious comment
// Set the user to null
setUser(null);

// ✅ Good - Explains WHY
// Clear user data on logout to prevent stale auth state
setUser(null);
```

---

## Module Boundaries

### When to Create a New File

Create a new file when:
- Current file exceeds 400 lines (aim to split before hitting 500)
- A component/function has distinct, reusable logic
- Multiple components need the same helper functions
- Types are shared across multiple files

### When to Keep Code Together

Keep code in the same file when:
- It's tightly coupled (e.g., component and its prop types)
- It's only used in one place
- Splitting would hurt readability
- File is under 300 lines and cohesive

---

## State Management Rules

### Zustand Store Organization

- One store per domain (canvas, auth, ui)
- Keep stores focused and small
- Store only serializable data
- Derived state should be computed, not stored

```typescript
/**
 * @fileoverview Canvas store - Manages canvas objects and selection state
 */

import { create } from 'zustand';
import type { CanvasObject } from '@/types';

interface CanvasStore {
  // State
  objects: CanvasObject[];
  selectedId: string | null;

  // Actions
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;

  // Computed/Derived state should be selector functions, not stored
  getSelectedObject: () => CanvasObject | null;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  objects: [],
  selectedId: null,

  addObject: (object) => set((state) => ({
    objects: [...state.objects, object]
  })),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    )
  })),

  removeObject: (id) => set((state) => ({
    objects: state.objects.filter(obj => obj.id !== id)
  })),

  selectObject: (id) => set({ selectedId: id }),

  getSelectedObject: () => {
    const { objects, selectedId } = get();
    return objects.find(obj => obj.id === selectedId) || null;
  },
}));
```

---

## Performance Considerations

### Code Splitting

- Use React.lazy for page components
- Split large libraries (Firebase, Konva) into separate chunks
- Lazy load non-critical features

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const CanvasPage = lazy(() => import('./pages/CanvasPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/canvas" element={<CanvasPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

- Use React.memo for expensive components
- Use useMemo for expensive computations
- Use useCallback for functions passed to children

```typescript
// Only re-render when userId or username changes
export const UserAvatar = React.memo(({
  userId,
  username,
  color
}: UserAvatarProps) => {
  return <div>...</div>;
});
```

---

## Git Workflow

### Branch Naming

- `main` - Production code
- `feature/[feature-name]` - New features
- `fix/[bug-name]` - Bug fixes
- `refactor/[scope]` - Code refactoring
- `docs/[topic]` - Documentation updates

### Commit Messages

Follow conventional commits format:

```
type(scope): brief description

Longer description if needed

- Bullet points for details
- More details here
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `style` - Formatting, styling
- `test` - Tests
- `chore` - Build, dependencies

**Examples:**
```
feat(canvas): add circle shape support
fix(auth): resolve login redirect loop
refactor(hooks): split useCanvas into smaller hooks
docs(readme): update setup instructions
```

---

## Testing Standards

### Test File Location

- Mirror source structure in `__tests__/` directory
- Name test files: `[filename].test.ts` or `[filename].test.tsx`

```
src/
  components/
    canvas/
      CanvasStage.tsx

__tests__/
  components/
    canvas/
      CanvasStage.test.tsx
```

### Test Structure

```typescript
/**
 * @fileoverview Tests for CanvasStage component
 */

import { render, screen } from '@testing-library/react';
import { CanvasStage } from '@/components/canvas/CanvasStage';

describe('CanvasStage', () => {
  it('renders without crashing', () => {
    render(<CanvasStage width={800} height={600} />);
    expect(screen.getByRole('canvas')).toBeInTheDocument();
  });

  it('applies zoom transformation', () => {
    // Test implementation
  });
});
```

---

## Environment Variables

### Naming Convention

- Prefix all variables with `VITE_`
- Use SCREAMING_SNAKE_CASE
- Group by service/feature

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_REALTIME_DB_URL=your_db_url
```

### Usage

```typescript
// lib/firebase/config.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ...
};
```

---

## Error Handling

### Error Boundary

- Wrap application in ErrorBoundary component
- Log errors to console (and monitoring service in production)
- Show user-friendly error messages

### Try-Catch Blocks

Use try-catch for:
- Async operations (Firebase, API calls)
- File operations
- Parsing operations

```typescript
/**
 * Update canvas object in Firestore
 *
 * @throws {Error} If update fails
 */
async function updateCanvasObject(
  id: string,
  updates: Partial<CanvasObject>
): Promise<void> {
  try {
    const docRef = doc(firestore, 'canvases', 'main');
    await updateDoc(docRef, {
      [`objects.${id}`]: updates
    });
  } catch (error) {
    console.error('Failed to update canvas object:', error);
    throw new Error('Failed to update object. Please try again.');
  }
}
```

---

## TypeScript Configuration

### Path Aliases

Configure path aliases in `tsconfig.json` for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/lib/*": ["src/lib/*"],
      "@/stores/*": ["src/stores/*"],
      "@/types/*": ["src/types/*"],
      "@/constants/*": ["src/constants/*"]
    }
  }
}
```

**Usage:**
```typescript
// ✅ Good - Path alias
import { useAuth } from '@/hooks';
import { CanvasStage } from '@/components/canvas';

// ❌ Bad - Relative paths
import { useAuth } from '../../../hooks/useAuth';
import { CanvasStage } from '../../components/canvas/CanvasStage';
```

---

## Code Style

### General Rules

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Use semicolons
- Max line length: 80-100 characters (flexible)

### Function Style

```typescript
// ✅ Good - Arrow functions for utilities
export const generateId = (): string => {
  return crypto.randomUUID();
};

// ✅ Good - Function keyword for components and hooks
export function useAuth() {
  // ...
}

export function CanvasStage() {
  // ...
}
```

### Conditional Rendering

```typescript
// ✅ Good - Early return for loading states
if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

return <CanvasStage />;

// ❌ Bad - Nested ternaries
return loading ? <LoadingSpinner /> : error ? <ErrorMessage /> : <CanvasStage />;
```

---

## AI Tool Optimization

### Make Code AI-Friendly

1. **Descriptive Names**: Use full words, avoid abbreviations
   - ✅ `userAuthentication` ❌ `userAuth` ❌ `ua`

2. **Consistent Patterns**: Follow same patterns throughout codebase
   - Same hook patterns: `use[Thing]`
   - Same component patterns: `[Thing]Component` or just `[Thing]`

3. **Clear Hierarchy**: Organize by feature, not by type
   ```
   ✅ components/canvas/...   (feature-based)
   ❌ components/all stuff... (type-based, scattered)
   ```

4. **Documentation**: Write for someone (or something) unfamiliar with code
   - Explain WHY, not just WHAT
   - Include examples in JSDoc

5. **Small Files**: Keep files under 500 lines
   - Easier for AI to understand context
   - Easier to generate/modify code

---

## Checklist: Before Committing Code

- [ ] File is under 500 lines
- [ ] File has header documentation comment
- [ ] All exported functions have JSDoc comments
- [ ] Types are defined for all props and parameters
- [ ] Imports are organized correctly
- [ ] No `any` types (use `unknown` if needed)
- [ ] Complex logic has inline comments
- [ ] Component follows single responsibility principle
- [ ] File naming follows conventions
- [ ] No console.logs in production code
- [ ] Error handling is implemented
- [ ] Tests pass (if applicable)

---

## Quick Reference

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `camelCase.types.ts`

### Import Order
1. External libraries
2. Internal (@/ aliases)
3. Relative imports
4. Type imports

### Documentation
- All files: Header comment
- All exports: JSDoc/TSDoc
- Complex logic: Inline comments

### File Size
- Max: 500 lines
- Target: 200-300 lines
- Split if exceeds 400 lines

---

**Remember: This codebase is designed for both human and AI collaboration. Clear structure, descriptive names, and good documentation benefit everyone.**