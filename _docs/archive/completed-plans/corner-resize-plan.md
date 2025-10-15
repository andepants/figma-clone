# CollabCanvas - Corner Resize Handles Implementation Plan

**Feature:** Interactive corner resize handles with real-time collaboration support

**How to use:** Check off `[ ]` boxes as you complete and verify each task. Don't skip ahead—each task builds foundation for the next.

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

## Overview

**Goal:** Implement 4 corner resize handles (NW, NE, SW, SE) for canvas objects with:
- Visual feedback (tooltips with directional arrows)
- Real-time collaboration (other users see resizing in progress)
- Opposite corner anchored (fixed) during resize
- Reusable for all shape types (rectangles, circles, text, etc.)
- Consistent with Figma's resize behavior

**Time Estimate:** 8-12 hours

**Architecture:**
- `ResizeHandle` component: Individual corner handle (reusable)
- `ResizeHandles` component: Group of 4 handles (wrapper)
- `useResize` hook: Resize logic and state management
- `resizeService.ts`: Firebase RTDB sync for real-time resize states
- Generic interface: Works with any `CanvasObject` type

---

# Phase 1: Core Types and Infrastructure (1-2 hours)

**Goal:** Set up TypeScript types, constants, and utility functions for resize system.

## 1.1 Define Resize Types

### 1.1.1 Create Resize Types File
- [x] Create `src/types/resize.types.ts`
  - Define `ResizeHandle` enum: `'nw' | 'ne' | 'sw' | 'se'` (4 corners)
  - Define `ResizeAnchor` type: `{ x: number; y: number }` (fixed opposite corner)
  - Define `ResizeState` interface:
    ```typescript
    {
      objectId: string;
      userId: string;
      username: string;
      color: string;
      handle: ResizeHandle;
      startBounds: { x: number; y: number; width: number; height: number };
      currentBounds: { x: number; y: number; width: number; height: number };
      anchor: ResizeAnchor;
      timestamp: number;
    }
    ```
  - Define `ResizeStateMap` type: `Record<string, ResizeState>` (objectId → state)
  - Add JSDoc comments for all types
  - **Success:** All resize types defined with full TypeScript support
  - **Test:** Import types in another file, no TS errors
  - **Edge Case:** ResizeState tracks both start and current bounds for smooth interpolation

### 1.1.2 Add Resize Types to Barrel Export
- [x] Update `src/types/index.ts`
  - Add: `export * from './resize.types'`
  - **Success:** Can import resize types from `@/types`
  - **Test:** `import { ResizeHandle, ResizeState } from '@/types'` works
  - **Edge Case:** No naming conflicts with existing types

### 1.1.3 Create Resize Constants
- [x] Create `src/constants/resize.constants.ts`
  - Define `RESIZE_HANDLE_SIZE = 8` (8x8px squares, like Figma)
  - Define `RESIZE_HANDLE_OFFSET = 4` (4px outside object bounds)
  - Define `RESIZE_MIN_SIZE = 10` (minimum width/height after resize)
  - Define `RESIZE_THROTTLE_MS = 50` (throttle resize updates to RTDB)
  - Define handle positions map:
    ```typescript
    export const RESIZE_HANDLE_POSITIONS: Record<ResizeHandle, { xAlign: 'left' | 'right', yAlign: 'top' | 'bottom' }> = {
      nw: { xAlign: 'left', yAlign: 'top' },
      ne: { xAlign: 'right', yAlign: 'top' },
      sw: { xAlign: 'left', yAlign: 'bottom' },
      se: { xAlign: 'right', yAlign: 'bottom' },
    };
    ```
  - Define cursor styles map:
    ```typescript
    export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
      nw: 'nwse-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      se: 'nwse-resize',
    };
    ```
  - Add JSDoc comments
  - **Success:** Constants defined and documented
  - **Test:** Import and use constants in test file
  - **Edge Case:** Handle size matches Figma's visual style

### 1.1.4 Update Barrel Export for Constants
- [x] Update `src/constants/index.ts`
  - Add: `export * from './resize.constants'`
  - **Success:** Can import resize constants from `@/constants`
  - **Test:** `import { RESIZE_HANDLE_SIZE } from '@/constants'` works

---

## 1.2 Create Resize Utility Functions

### 1.2.1 Create Resize Math Utilities
- [x] Create `src/lib/utils/resize.ts`
  - **Function:** `calculateResizedBounds(handle, anchor, currentPointer): Bounds`
    - Given a handle, fixed anchor point, and current mouse position
    - Calculate new bounds (x, y, width, height) while keeping anchor fixed
    - Enforce minimum size (RESIZE_MIN_SIZE)
    - Handle all 4 corners correctly
    - JSDoc with examples
  - **Function:** `getAnchorPoint(handle, bounds): ResizeAnchor`
    - Given a resize handle and object bounds
    - Return the opposite corner coordinates (anchor point)
    - Examples:
      - `nw` handle → anchor is `{ x: bounds.x + bounds.width, y: bounds.y + bounds.height }` (SE corner)
      - `se` handle → anchor is `{ x: bounds.x, y: bounds.y }` (NW corner)
    - JSDoc with examples
  - **Function:** `getHandlePosition(handle, bounds): { x, y }`
    - Given a handle and object bounds
    - Calculate handle center position for rendering
    - Account for handle size and offset
    - JSDoc with examples
  - **Function:** `isValidResize(bounds): boolean`
    - Check if resized bounds are valid (width/height >= RESIZE_MIN_SIZE)
    - Prevent negative dimensions
    - JSDoc
  - Add comprehensive JSDoc comments with ASCII diagrams showing anchor/handle relationship
  - **Success:** All resize math functions defined and documented
  - **Test:** Unit tests for each function with various bounds/handles
  - **Edge Case:** Handle all 4 corners, negative drags, minimum size enforcement

### 1.2.2 Test Resize Math Functions
- [x] Manual testing in browser console:
  - Test `getAnchorPoint`:
    - `nw` handle on 100x100 rect at (0,0) → anchor (100, 100)
    - `se` handle on 100x100 rect at (0,0) → anchor (0, 0)
    - `ne` handle on 100x100 rect at (0,0) → anchor (0, 100)
    - `sw` handle on 100x100 rect at (0,0) → anchor (100, 0)
  - Test `calculateResizedBounds`:
    - Drag NW handle left → x decreases, width increases, anchor stays fixed
    - Drag NW handle down → y increases, height decreases, anchor stays fixed
    - Drag SE handle right → width increases, x stays fixed
    - Minimum size: drag to make 5x5 → clamped to 10x10
  - **Success:** All math functions work correctly
  - **Test:** No NaN values, no negative dimensions, anchor never moves
  - **Edge Case:** Extreme drags (1000px away) should still work

### 1.2.3 Add Resize Utils to Barrel Export
- [x] Update `src/lib/utils/index.ts`
  - Add: `export * from './resize'`
  - **Success:** Can import resize utils from `@/lib/utils`
  - **Test:** `import { calculateResizedBounds } from '@/lib/utils'` works

---

# Phase 2: Firebase Resize Service (1-2 hours)

**Goal:** Create service for syncing resize states to Firebase Realtime Database.

## 2.1 Design Resize State Structure

### 2.1.1 Document RTDB Resize Structure
- [x] Document in `resizeService.ts` file header:
  ```
  /canvases/{canvasId}/resize-states/{objectId}/
    objectId: string
    userId: string
    username: string
    color: string
    handle: 'nw' | 'ne' | 'sw' | 'se'
    startBounds: { x, y, width, height }
    currentBounds: { x, y, width, height }
    anchor: { x, y }
    timestamp: number
  ```
  - **Success:** Structure documented clearly
  - **Test:** Can visualize data structure
  - **Edge Case:** Structure supports multiple simultaneous resizes (different objects)

### 2.1.2 Update Firebase Realtime Database Rules
- [x] Update `database.rules.json`
  - Add rules for `/canvases/$canvasId/resize-states/`:
    ```json
    "resize-states": {
      ".read": "auth != null",
      "$objectId": {
        ".write": "auth != null"
      }
    }
    ```
  - **Success:** Rules allow authenticated users to read/write resize states
  - **Test:** Rules validate successfully
  - **Edge Case:** Any user can write any object's resize state (Figma-style, no hard locks)

### 2.1.3 Deploy Database Rules
- [x] Deploy updated rules to Firebase:
  - Run: `firebase deploy --only database`
  - **Success:** Rules deployed successfully
  - **Test:** Check Firebase console shows new rules
  - **Edge Case:** Backup old rules before deploying

---

## 2.2 Implement Resize Service Functions

### 2.2.1 Create Resize Service File
- [x] Create `src/lib/firebase/resizeService.ts`
  - File header JSDoc explaining resize state synchronization
  - Import Firebase RTDB functions: `ref`, `set`, `remove`, `onValue`, `onDisconnect`
  - Import types: `ResizeState`, `ResizeStateMap`
  - Import throttle utility for updates
  - **Success:** File created with imports
  - **Test:** No import errors

### 2.2.2 Implement startResizing Function
- [x] Add `startResizing` function to `resizeService.ts`
  - **Signature:** `startResizing(canvasId, objectId, userId, handle, bounds, username, color): Promise<void>`
  - Set initial resize state in RTDB at `/canvases/{canvasId}/resize-states/{objectId}`
  - Calculate anchor point using `getAnchorPoint` utility
  - Set `startBounds` and `currentBounds` to current bounds
  - Set up `onDisconnect().remove()` to auto-cleanup on disconnect
  - Add try/catch with error logging
  - JSDoc with example
  - **Success:** Function defined and documented
  - **Test:** Call function manually, check RTDB in Firebase console
  - **Edge Case:** Overwrite existing resize state (last-writer-wins, no hard locks)

### 2.2.3 Implement updateResizePosition Function
- [x] Add `updateResizePosition` function to `resizeService.ts`
  - **Signature:** `updateResizePosition(canvasId, objectId, currentBounds): Promise<void>`
  - Update only `currentBounds` and `timestamp` fields
  - Keep `startBounds` and `anchor` unchanged (immutable during resize)
  - Add try/catch with error logging
  - JSDoc with example
  - **Success:** Function updates only position fields
  - **Test:** Call function, verify only currentBounds updated in RTDB
  - **Edge Case:** No-op if resize state doesn't exist

### 2.2.4 Implement throttledUpdateResizePosition
- [x] Wrap `updateResizePosition` with throttle
  - Use `throttle` utility from `@/lib/utils/throttle`
  - Throttle interval: `RESIZE_THROTTLE_MS` (50ms)
  - Export as `throttledUpdateResizePosition`
  - JSDoc noting throttle behavior
  - **Success:** Throttled function exported
  - **Test:** Rapid calls only execute every 50ms
  - **Edge Case:** Ensure final call is not dropped (flush on resize end)

### 2.2.5 Implement endResizing Function
- [x] Add `endResizing` function to `resizeService.ts`
  - **Signature:** `endResizing(canvasId, objectId): Promise<void>`
  - Cancel onDisconnect handler: `onDisconnect(resizeRef).cancel()`
  - Remove resize state: `remove(resizeRef)`
  - Add try/catch with error logging
  - JSDoc with example
  - **Success:** Function clears resize state
  - **Test:** Call function, verify state removed from RTDB
  - **Edge Case:** No error if state doesn't exist

### 2.2.6 Implement subscribeToResizeStates Function
- [x] Add `subscribeToResizeStates` function to `resizeService.ts`
  - **Signature:** `subscribeToResizeStates(canvasId, callback): () => void`
  - Listen to `/canvases/{canvasId}/resize-states` with `onValue`
  - Convert snapshot to `ResizeStateMap` (objectId → ResizeState)
  - Call callback with map
  - Return unsubscribe function
  - Handle errors gracefully (call callback with empty map)
  - JSDoc with example
  - **Success:** Function subscribes to resize states
  - **Test:** Add/remove states in RTDB, callback fires
  - **Edge Case:** Handle null snapshot (no active resizes)

### 2.2.7 Add Resize Service to Barrel Export
- [x] Update `src/lib/firebase/index.ts`
  - Add export:
    ```typescript
    export {
      startResizing,
      throttledUpdateResizePosition,
      endResizing,
      subscribeToResizeStates,
    } from './resizeService';
    ```
  - **Success:** Can import from `@/lib/firebase`
  - **Test:** `import { startResizing } from '@/lib/firebase'` works

### 2.2.8 Test Resize Service End-to-End
- [x] Manual testing in browser console:
  - Call `startResizing` → check RTDB shows state
  - Call `updateResizePosition` → check currentBounds updates
  - Call `endResizing` → check state removed
  - Test `subscribeToResizeStates` → callback fires on changes
  - Test onDisconnect → close tab, state auto-removed
  - **Success:** All service functions work correctly
  - **Test:** No errors in console, RTDB updates as expected
  - **Edge Case:** Multiple objects can have active resize states simultaneously

---

# Phase 3: Resize Handle Components (2-3 hours)

**Goal:** Create visual resize handle components with tooltips and hover effects.

## 3.1 Create ResizeHandle Component

### 3.1.1 Create ResizeHandle Component File
- [x] Create `src/features/canvas-core/components/ResizeHandle.tsx`
  - File header JSDoc explaining single corner handle component
  - Import Konva components: `Rect`, `Group`
  - Import React: `useState`, `memo`
  - Import types: `ResizeHandle as ResizeHandleType`
  - Import constants: `RESIZE_HANDLE_SIZE`, `RESIZE_CURSORS`
  - **Success:** File created with imports
  - **Test:** No import errors

### 3.1.2 Define ResizeHandle Props Interface
- [x] Add `ResizeHandleProps` interface:
  - `handle: ResizeHandleType` - Which corner (nw, ne, sw, se)
  - `x: number` - Handle center x position
  - `y: number` - Handle center y position
  - `isSelected: boolean` - Whether parent object is selected
  - `onResizeStart: (handle: ResizeHandleType) => void` - Callback when resize starts
  - `onResizeMove: (x: number, y: number) => void` - Callback during resize
  - `onResizeEnd: () => void` - Callback when resize ends
  - Add JSDoc for each prop
  - **Success:** Props interface defined
  - **Test:** TypeScript validates props correctly

### 3.1.3 Implement ResizeHandle Rendering
- [x] Implement ResizeHandle component body:
  - State: `isHovered: boolean` (for hover effects)
  - Render Konva `Rect`:
    - Position: `x - RESIZE_HANDLE_SIZE/2`, `y - RESIZE_HANDLE_SIZE/2` (center handle)
    - Size: `width={RESIZE_HANDLE_SIZE}`, `height={RESIZE_HANDLE_SIZE}`
    - Fill: `#ffffff` (white)
    - Stroke: `#0ea5e9` (blue, matches selection color)
    - StrokeWidth: `1.5`
    - Opacity: `isHovered ? 1 : 0.8`
    - Visible: Only when parent `isSelected === true`
  - **Success:** Handle renders as white square with blue border
  - **Test:** Render handle at (100, 100), see 8x8px square
  - **Edge Case:** Handle centered on position (not top-left corner)

### 3.1.4 Add Handle Hover Effects
- [x] Update ResizeHandle component:
  - `onMouseEnter`: Set `isHovered = true`, change cursor
  - `onMouseLeave`: Set `isHovered = false`, reset cursor
  - Cursor style: Use `RESIZE_CURSORS[handle]` (nwse-resize, nesw-resize, etc.)
  - Hover effect: Scale handle slightly (1.1x) or increase stroke width to 2
  - **Success:** Handle responds to hover with visual feedback
  - **Test:** Hover over handle, cursor changes, visual feedback appears
  - **Edge Case:** Cursor reset when leaving handle area

### 3.1.5 Add Handle Drag Handlers
- [x] Update ResizeHandle component:
  - Make draggable: `draggable={isSelected}`
  - `onDragStart`:
    - Prevent event bubbling: `e.cancelBubble = true`
    - Call `onResizeStart(handle)`
    - Store initial drag position
  - `onDragMove`:
    - Get current pointer position
    - Call `onResizeMove(pointerX, pointerY)`
  - `onDragEnd`:
    - Prevent event bubbling: `e.cancelBubble = true`
    - Call `onResizeEnd()`
  - **Success:** Handle can be dragged to trigger resize
  - **Test:** Drag handle, callbacks fire
  - **Edge Case:** Prevent stage drag while dragging handle

### 3.1.6 Optimize with React.memo
- [x] Wrap component in React.memo:
  - `export const ResizeHandle = memo(function ResizeHandle({ ... }) { ... });`
  - Add custom comparison function if needed (compare props, not re-render on every parent update)
  - **Success:** Component optimized for performance
  - **Test:** React DevTools Profiler shows fewer re-renders
  - **Edge Case:** Handle position changes should trigger re-render

### 3.1.7 Add Barrel Export for ResizeHandle
- [x] Update `src/features/canvas-core/components/index.ts`
  - Add: `export { ResizeHandle } from './ResizeHandle'`
  - **Success:** Can import from `@/features/canvas-core/components`
  - **Test:** `import { ResizeHandle } from '@/features/canvas-core/components'` works

---

## 3.2 Create ResizeHandles Group Component

### 3.2.1 Create ResizeHandles Component File
- [x] Create `src/features/canvas-core/components/ResizeHandles.tsx`
  - File header JSDoc explaining group of 4 corner handles
  - Import Konva: `Group`
  - Import React: `memo`
  - Import: `ResizeHandle` component
  - Import types: `CanvasObject`, `ResizeHandle as ResizeHandleType`
  - Import utils: `getHandlePosition`
  - **Success:** File created with imports
  - **Test:** No import errors

### 3.2.2 Define ResizeHandles Props Interface
- [x] Add `ResizeHandlesProps` interface:
  - `object: CanvasObject` - Canvas object being resized
  - `isSelected: boolean` - Whether object is selected
  - `onResizeStart: (handle: ResizeHandleType) => void`
  - `onResizeMove: (handle: ResizeHandleType, x: number, y: number) => void`
  - `onResizeEnd: () => void`
  - Add JSDoc for each prop
  - **Success:** Props interface defined
  - **Test:** TypeScript validates props

### 3.2.3 Implement ResizeHandles Rendering
- [x] Implement ResizeHandles component body:
  - Calculate handle positions for all 4 corners using `getHandlePosition`:
    - NW: top-left corner
    - NE: top-right corner
    - SW: bottom-left corner
    - SE: bottom-right corner
  - Render `Group` containing 4 `ResizeHandle` components
  - Pass correct position and callbacks to each handle
  - Only render when `isSelected === true`
  - **Success:** 4 handles render at correct positions
  - **Test:** Select rectangle, see 4 corner handles
  - **Edge Case:** Handle positions update when object bounds change

### 3.2.4 Handle Different Object Types
- [x] Add logic to handle different object types:
  - **Rectangle:** Use x, y, width, height directly
  - **Circle:** Calculate bounding box from x, y, radius
  - **Text:** Use x, y, width (calculated or default), height (fontSize * 1.2)
  - Use type guards or switch statement to handle each type
  - **Success:** Handles render correctly for all shape types
  - **Test:** Select rectangle, circle, text → all show handles
  - **Edge Case:** Text without explicit width (auto-calculated)

### 3.2.5 Optimize with React.memo
- [x] Wrap component in React.memo:
  - `export const ResizeHandles = memo(function ResizeHandles({ ... }) { ... });`
  - Custom comparison: Only re-render if object bounds or isSelected changes
  - **Success:** Component optimized
  - **Test:** React DevTools shows minimal re-renders
  - **Edge Case:** Re-render when object moves/resizes

### 3.2.6 Add Barrel Export for ResizeHandles
- [x] Update `src/features/canvas-core/components/index.ts`
  - Add: `export { ResizeHandles } from './ResizeHandles'`
  - **Success:** Can import from `@/features/canvas-core/components`
  - **Test:** `import { ResizeHandles } from '@/features/canvas-core/components'` works

---

## 3.3 Add Tooltips to Resize Handles

### 3.3.1 Get Latest Konva Tooltip Documentation
- [x] **Documentation:** Use context7 MCP to get latest Konva documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Label, Tag, Text components, tooltip patterns, hover interactions'
  - Review best practices for tooltips on canvas
  - **Success:** Have current Konva tooltip documentation
  - **Test:** Documentation retrieved with examples
  - **Edge Case:** Konva doesn't have built-in tooltip component, use Label+Tag+Text

### 3.3.2 Create Tooltip Component
- [x] Update `ResizeHandle.tsx` to render tooltip on hover:
  - Import Konva: `Label`, `Tag`, `Text`, `Arrow`
  - When `isHovered === true`, render tooltip group:
    - Konva `Label` positioned above handle (y - 30)
    - Konva `Tag` as background (light gray, rounded corners)
    - Konva `Text` showing "Resize" or handle direction
    - Konva `Arrow` showing diagonal direction (NW = ↖, SE = ↘, etc.)
  - Use Unicode arrows: `↖` (U+2196), `↗` (U+2197), `↙` (U+2199), `↘` (U+2198)
  - Arrow colors match handle stroke (#0ea5e9)
  - **Success:** Tooltip appears on hover
  - **Test:** Hover handle, see tooltip with directional arrow
  - **Edge Case:** Tooltip doesn't block handle interaction

### 3.3.3 Position Tooltip Correctly
- [x] Add logic to position tooltip without going off-screen:
  - Check if tooltip would overflow canvas bounds
  - If near top edge, position below handle instead of above
  - If near left/right edge, adjust horizontal position
  - **Success:** Tooltip always visible within canvas
  - **Test:** Hover handles near edges, tooltip stays in view
  - **Edge Case:** Canvas zoom affects tooltip position

### 3.3.4 Test Tooltip Across All Handles
- [x] Manual testing:
  - Hover NW handle → tooltip shows ↖ arrow, text "Resize NW"
  - Hover NE handle → tooltip shows ↗ arrow, text "Resize NE"
  - Hover SW handle → tooltip shows ↙ arrow, text "Resize SW"
  - Hover SE handle → tooltip shows ↘ arrow, text "Resize SE"
  - Tooltips appear/disappear smoothly (no flicker)
  - **Success:** All tooltips display correctly with proper arrows
  - **Test:** No layout issues, readable text
  - **Edge Case:** Tooltip visibility at different zoom levels

---

# Phase 4: Resize Hook and Logic (2-3 hours)

**Goal:** Implement resize logic hook that integrates with canvas store and Firebase.

## 4.1 Create useResize Hook

### 4.1.1 Create useResize Hook File
- [x] Create `src/features/canvas-core/hooks/useResize.ts`
  - File header JSDoc explaining resize hook purpose
  - Import React: `useState`, `useRef`, `useCallback`
  - Import store: `useCanvasStore`
  - Import auth: `useAuth`
  - Import utils: `calculateResizedBounds`, `getAnchorPoint`, `isValidResize`
  - Import service: `startResizing`, `throttledUpdateResizePosition`, `endResizing`
  - Import types: `ResizeHandle`, `ResizeAnchor`, `CanvasObject`
  - Import constants: `RESIZE_MIN_SIZE`
  - **Success:** File created with imports
  - **Test:** No import errors

### 4.1.2 Define Hook State
- [x] Add hook state:
  - `isResizing: boolean` - Whether currently resizing
  - `activeHandle: ResizeHandle | null` - Which handle is being dragged
  - `anchor: ResizeAnchor | null` - Fixed opposite corner during resize
  - `startBounds: Bounds | null` - Object bounds when resize started
  - Use `useRef` for mutable values (stage reference, etc.)
  - **Success:** State defined
  - **Test:** State updates correctly during resize

### 4.1.3 Implement handleResizeStart Function
- [x] Add `handleResizeStart` callback:
  - **Signature:** `handleResizeStart(objectId, handle, bounds): void`
  - Calculate anchor point: `getAnchorPoint(handle, bounds)`
  - Store: `activeHandle`, `anchor`, `startBounds`, `isResizing = true`
  - Call Firebase: `startResizing(canvasId, objectId, userId, handle, bounds, username, color)`
  - Prevent stage drag (set cursor, disable stage interaction)
  - Add try/catch with toast on error
  - **Success:** Resize starts correctly
  - **Test:** Drag handle, state updates
  - **Edge Case:** Handle permission errors gracefully

### 4.1.4 Implement handleResizeMove Function
- [x] Add `handleResizeMove` callback:
  - **Signature:** `handleResizeMove(objectId, currentPointerX, currentPointerY): void`
  - Calculate new bounds: `calculateResizedBounds(activeHandle, anchor, currentPointer)`
  - Validate: `isValidResize(newBounds)`
  - Update local store optimistically: `updateObject(objectId, newBounds)`
  - Sync to Firebase: `throttledUpdateResizePosition(canvasId, objectId, newBounds)`
  - **Success:** Object resizes smoothly as handle drags
  - **Test:** Drag handle, object resizes in real-time
  - **Edge Case:** Enforce minimum size, prevent negative dimensions

### 4.1.5 Implement handleResizeEnd Function
- [x] Add `handleResizeEnd` callback:
  - **Signature:** `handleResizeEnd(objectId): void`
  - Get final bounds from local store
  - Update object in RTDB immediately (no throttle): `updateCanvasObject(canvasId, objectId, finalBounds)`
  - Clear resize state in RTDB: `endResizing(canvasId, objectId)`
  - Reset local state: `isResizing = false`, `activeHandle = null`, `anchor = null`
  - Re-enable stage interaction
  - Add try/catch with error handling
  - **Success:** Resize completes cleanly
  - **Test:** Release handle, resize state cleared
  - **Edge Case:** Final bounds update before clearing resize state (prevent flash-back)

### 4.1.6 Optimize Callbacks with useCallback
- [x] Wrap callbacks in `useCallback`:
  - `handleResizeStart`, `handleResizeMove`, `handleResizeEnd`
  - Add proper dependencies to avoid stale closures
  - **Success:** Callbacks optimized
  - **Test:** No unnecessary re-creations
  - **Edge Case:** Dependencies include all used values

### 4.1.7 Return Hook API
- [x] Return object from hook:
  ```typescript
  {
    isResizing,
    activeHandle,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  }
  ```
  - Add JSDoc for return value
  - **Success:** Hook returns clean API
  - **Test:** Can destructure values in component

### 4.1.8 Add Hook to Barrel Export
- [x] Update `src/features/canvas-core/hooks/index.ts`
  - Add: `export { useResize } from './useResize'`
  - **Success:** Can import from `@/features/canvas-core/hooks`
  - **Test:** `import { useResize } from '@/features/canvas-core/hooks'` works

---

## 4.2 Test Resize Hook Independently

### 4.2.1 Create Test Component
- [ ] Create temporary test component to verify hook:
  - Import `useResize` hook
  - Render a rectangle with resize handles
  - Wire up handle callbacks to hook functions
  - Log state changes to console
  - **Success:** Test component renders
  - **Test:** Can interact with handles

### 4.2.2 Test Resize Operations
- [ ] Manual testing:
  - Select rectangle
  - Drag NW handle → object resizes from top-left, SE corner stays fixed
  - Drag SE handle → object resizes from bottom-right, NW corner stays fixed
  - Drag NE handle → object resizes from top-right, SW corner stays fixed
  - Drag SW handle → object resizes from bottom-left, NE corner stays fixed
  - Rapid drag → throttled updates work
  - Release handle → state clears
  - **Success:** All resize operations work correctly
  - **Test:** Anchor point never moves, minimum size enforced
  - **Edge Case:** Extreme drags (drag 1000px) should work

### 4.2.3 Test Edge Cases
- [ ] Edge case testing:
  - Drag handle to create 5x5 object → clamped to 10x10 minimum
  - Drag handle past anchor point → width/height stay positive
  - Resize while zoomed in/out → coordinates correct
  - Resize while canvas is panned → coordinates correct
  - Start resize, refresh page → resize state clears on reconnect
  - **Success:** All edge cases handled
  - **Test:** No crashes, no NaN values, no negative dimensions
  - **Edge Case:** Coordinate transforms account for stage zoom/pan

---

# Phase 5: Integration with Shapes (1-2 hours)

**Goal:** Integrate resize handles into Rectangle component and make reusable for other shapes.

## 5.1 Integrate Resize Handles into Rectangle

### 5.1.1 Update Rectangle Component Imports
- [x] Update `src/features/canvas-core/shapes/Rectangle.tsx`:
  - Import `ResizeHandles` component
  - Import `useResize` hook
  - **Success:** Imports added
  - **Test:** No import errors

### 5.1.2 Add Resize Hook to Rectangle
- [x] Update Rectangle component:
  - Call `useResize()` hook at component top
  - Destructure: `{ isResizing, handleResizeStart, handleResizeMove, handleResizeEnd }`
  - **Success:** Hook integrated
  - **Test:** Component compiles

### 5.1.3 Render ResizeHandles Component
- [x] Update Rectangle component JSX:
  - After `<Rect>`, add `<ResizeHandles>` component
  - Pass props:
    - `object={rectangle}`
    - `isSelected={isSelected}`
    - `onResizeStart={(handle) => handleResizeStart(rectangle.id, handle, { x, y, width, height })}`
    - `onResizeMove={(x, y) => handleResizeMove(rectangle.id, x, y)}`
    - `onResizeEnd={() => handleResizeEnd(rectangle.id)}`
  - **Success:** ResizeHandles renders when rectangle selected
  - **Test:** Select rectangle, see 4 corner handles
  - **Edge Case:** Handles only visible when isSelected === true

### 5.1.4 Test Resize with Rectangle
- [x] Manual testing:
  - Select rectangle → 4 handles appear
  - Hover handle → tooltip shows directional arrow
  - Drag NW handle → resize from top-left
  - Drag SE handle → resize from bottom-right
  - Drag NE handle → resize from top-right
  - Drag SW handle → resize from bottom-left
  - Release → handles stay at new corners
  - Click away → handles disappear
  - **Success:** Resize works perfectly with rectangles
  - **Test:** Smooth resizing, no jumps or glitches
  - **Edge Case:** Rapid handle switching works

### 5.1.5 Test Resize Constraints
- [x] Test minimum size and constraints:
  - Resize to very small → 10x10 minimum enforced
  - Drag past opposite corner → dimensions stay positive
  - Resize different aspect ratios → works correctly
  - **Success:** Constraints work correctly
  - **Test:** No negative dimensions, minimum size always enforced
  - **Edge Case:** Minimum size applies to both width and height independently

---

## 5.2 Make Resize Handles Reusable

### 5.2.1 Create Generic Resize Handler
- [x] Update `ResizeHandles.tsx` to work with any CanvasObject type:
  - Add type guard functions:
    ```typescript
    function getBounds(object: CanvasObject): Bounds {
      switch (object.type) {
        case 'rectangle':
          return { x: object.x, y: object.y, width: object.width, height: object.height };
        case 'circle':
          return { x: object.x - object.radius, y: object.y - object.radius, width: object.radius * 2, height: object.radius * 2 };
        case 'text':
          return { x: object.x, y: object.y, width: object.width || 100, height: object.fontSize * 1.2 };
        default:
          return { x: 0, y: 0, width: 0, height: 0 };
      }
    }
    ```
  - Use `getBounds` to calculate handle positions
  - **Success:** ResizeHandles works with any shape type
  - **Test:** Can resize rectangles, circles, text
  - **Edge Case:** Circle resize updates radius, not width/height

### 5.2.2 Update useResize Hook for All Shapes
- [x] Update `useResize.ts` to handle shape-specific updates:
  - Add `updateShapeFromBounds(object, newBounds)` helper:
    - Rectangle: Update x, y, width, height
    - Circle: Calculate new radius from bounds, update x, y, radius
    - Text: Update x, y, width (height is fontSize-based)
  - Use helper in `handleResizeMove` and `handleResizeEnd`
  - **Success:** Hook handles all shape types correctly
  - **Test:** Resize rectangle, circle, text → all work
  - **Edge Case:** Circle maintains circular shape (equal width/height)

### 5.2.3 Document Reusability Pattern
- [x] Add JSDoc comments:
  - In `ResizeHandles.tsx`: Explain how to use with different shape types
  - In `useResize.ts`: Document shape-specific update logic
  - Add examples for each shape type
  - **Success:** Documentation clear and comprehensive
  - **Test:** Another developer can add resize to new shape type
  - **Edge Case:** Future shape types can extend pattern

---

# Phase 6: Real-Time Collaboration (2-3 hours)

**Goal:** Show other users' resize operations in real-time.

## 6.1 Subscribe to Remote Resize States

### 6.1.1 Create useRemoteResizes Hook
- [x] Create `src/features/collaboration/hooks/useRemoteResizes.ts`
  - File header JSDoc
  - Import React: `useEffect`, `useState`
  - Import service: `subscribeToResizeStates`
  - Import types: `ResizeStateMap`
  - Import auth: `useAuth` (to filter out own resizes)
  - **Success:** File created
  - **Test:** No import errors

### 6.1.2 Implement useRemoteResizes Hook
- [x] Implement hook body:
  - State: `remoteResizes: ResizeStateMap`
  - useEffect: Subscribe to resize states on mount
  - Filter out current user's resizes (only show others')
  - Update state when remote resizes change
  - Cleanup: Unsubscribe on unmount
  - Return `remoteResizes` map
  - **Success:** Hook provides remote resize states
  - **Test:** Other user resizes, hook receives updates
  - **Edge Case:** Filter out own user ID

### 6.1.3 Add Hook to Barrel Export
- [x] Update `src/features/collaboration/hooks/index.ts`
  - Add: `export { useRemoteResizes } from './useRemoteResizes'`
  - **Success:** Can import from `@/features/collaboration/hooks`
  - **Test:** `import { useRemoteResizes } from '@/features/collaboration/hooks'` works

---

## 6.2 Render Remote Resize Overlays

### 6.2.1 Create RemoteResizeOverlay Component
- [x] Create `src/features/collaboration/components/RemoteResizeOverlay.tsx`
  - File header JSDoc
  - Import Konva: `Group`, `Rect`, `Text`
  - Import types: `ResizeState`
  - Props: `resizeState: ResizeState`
  - **Success:** File created
  - **Test:** No import errors

### 6.2.2 Implement RemoteResizeOverlay Rendering
- [x] Implement component body:
  - Render dashed border around object at `resizeState.currentBounds`
  - Use user's color from `resizeState.color`
  - Render 4 corner handles in user's color (read-only, not draggable)
  - Render username badge: "Alice is resizing"
  - Make all elements `listening={false}` (no interaction)
  - **Success:** Overlay shows remote user's resize in progress
  - **Test:** Other user resizes, see their handles and bounds
  - **Edge Case:** Overlay doesn't block local interaction

### 6.2.3 Optimize with React.memo
- [x] Wrap component in React.memo:
  - Custom comparison: Only re-render if resizeState.currentBounds changes
  - **Success:** Component optimized
  - **Test:** Minimal re-renders

### 6.2.4 Add Component to Barrel Export
- [x] Update `src/features/collaboration/components/index.ts`
  - Add: `export { RemoteResizeOverlay } from './RemoteResizeOverlay'`
  - **Success:** Can import from `@/features/collaboration/components`

---

## 6.3 Integrate Remote Resizes into CanvasStage

### 6.3.1 Update CanvasStage Imports
- [x] Update `src/features/canvas-core/components/CanvasStage.tsx`:
  - Import `useRemoteResizes` hook
  - Import `RemoteResizeOverlay` component
  - **Success:** Imports added

### 6.3.2 Add Remote Resizes Hook
- [x] Update CanvasStage component:
  - Call `useRemoteResizes()` hook
  - Get `remoteResizes` map
  - **Success:** Hook integrated

### 6.3.3 Render Remote Resize Overlays
- [x] Update CanvasStage JSX:
  - After rendering shapes, add overlay layer
  - Map over `remoteResizes`, render `RemoteResizeOverlay` for each
  - Match overlay to correct object by `resizeState.objectId`
  - Pass `resizeState` props
  - **Success:** Remote resize overlays render
  - **Test:** Other user resizes, see their operation in real-time

---

## 6.4 Test Multi-User Resize

### 6.4.1 Test Basic Multi-User Resize
- [ ] Open 2 browser windows (User A, User B):
  - User A: Select rectangle, drag NW handle
  - User B: See rectangle resizing in real-time with dashed border + User A's color
  - User B: See User A's corner handles moving
  - User B: See username badge "User A is resizing"
  - User A: Release handle
  - User B: Overlay disappears, final size synced
  - **Success:** Real-time resize visible to all users
  - **Test:** <50ms latency for resize updates
  - **Edge Case:** Both users see same final size

### 6.4.2 Test Simultaneous Resize (Same Object)
- [ ] Open 2 browser windows:
  - User A: Start resizing from NW handle
  - User B: Start resizing from SE handle (at same time)
  - Both: See both overlays (different colors)
  - Both: Can resize simultaneously (Figma-style)
  - Release: Last-writer-wins, both users see final size
  - **Success:** Simultaneous resize works without crashes
  - **Test:** No hard locks, both operations complete
  - **Edge Case:** Final state is consistent across users

### 6.4.3 Test Simultaneous Resize (Different Objects)
- [ ] Open 2 browser windows:
  - User A: Resize rectangle #1
  - User B: Resize rectangle #2 (at same time)
  - Both: See each other's resizes
  - No interference between operations
  - **Success:** Independent resizes work correctly
  - **Test:** No state conflicts
  - **Edge Case:** RTDB supports multiple active resize states

### 6.4.4 Test Resize + Move Conflict
- [ ] Open 2 browser windows:
  - User A: Start resizing rectangle
  - User B: Try to move same rectangle (drag)
  - User B: See toast "Another user is resizing this object"
  - User B: Move operation blocked
  - User A: Finish resize
  - User B: Can now move rectangle
  - **Success:** Resize takes priority over move
  - **Test:** Conflict resolution works
  - **Edge Case:** After resize ends, move is allowed

### 6.4.5 Test Disconnect During Resize
- [ ] Testing disconnection scenarios:
  - User A: Start resizing rectangle
  - User B: See resize in progress
  - User A: Close tab (simulate crash)
  - User B: Resize overlay disappears within 3 seconds (onDisconnect cleanup)
  - Rectangle stays at last synced size
  - **Success:** Disconnect cleanup works
  - **Test:** No orphaned resize states
  - **Edge Case:** Object doesn't jump back to start size

---

# Phase 7: Visual Polish and UX (1-2 hours)

**Goal:** Add visual polish, animations, and UX improvements.

## 7.1 Add Visual Feedback

### 7.1.1 Add Handle Hover Animation
- [x] Update `ResizeHandle.tsx`:
  - Add smooth scale animation on hover (scale 1 → 1.1)
  - Use Konva `to()` tween for animation
  - Duration: 150ms
  - **Success:** Handles animate smoothly on hover
  - **Test:** Hover rapidly, no animation glitches

### 7.1.2 Add Resize Preview Line
- [x] Update `ResizeHandles.tsx`:
  - While resizing, show thin guide lines from active handle to anchor
  - Dashed line in blue (#0ea5e9)
  - Helps visualize anchor point and resize direction
  - **Success:** Guide lines show during resize
  - **Test:** Visual clarity improved
  - **Edge Case:** Lines don't clutter UI

### 7.1.3 Add Size Tooltip During Resize
- [x] Update `useResize` hook or `RemoteResizeOverlay`:
  - During resize, show current dimensions (e.g., "150 × 100") near cursor
  - Update in real-time as user drags
  - Small floating label, light background
  - **Success:** Dimensions visible during resize
  - **Test:** Helps user resize to exact size
  - **Edge Case:** Tooltip doesn't block view

---

## 7.2 Add Keyboard Shortcuts

### 7.2.1 Add Shift Key for Proportional Resize
- [x] Update `useResize` hook:
  - Listen for Shift key state
  - When Shift pressed: Lock aspect ratio during resize
  - Calculate locked dimensions: `newHeight = newWidth * aspectRatio`
  - **Success:** Shift+drag maintains aspect ratio
  - **Test:** Hold Shift, resize → proportional
  - **Edge Case:** Aspect ratio calculated from start bounds

### 7.2.2 Add Alt Key for Center Resize
- [x] Update `useResize` hook:
  - Listen for Alt key state
  - When Alt pressed: Resize from center (anchor = center point)
  - Both opposite corners move symmetrically
  - **Success:** Alt+drag resizes from center
  - **Test:** Hold Alt, resize → symmetric
  - **Edge Case:** Center point stays fixed

### 7.2.3 Document Keyboard Shortcuts
- [x] Update tooltips to show shortcuts:
  - Tooltip text: "Resize (⇧ Lock aspect  ⌥ From center)"
  - **Success:** Users aware of shortcuts
  - **Test:** Tooltip readable and helpful

---

## 7.3 Performance Optimization

### 7.3.1 Optimize Resize Rendering
- [x] Performance checks:
  - Resize with 100+ objects on canvas → maintain 60 FPS
  - Use React.memo on all resize components
  - Throttle resize updates to 50ms
  - Minimize re-renders outside active resize area
  - **Success:** Smooth performance even with many objects
  - **Test:** Chrome DevTools Performance tab
  - **Edge Case:** Resizing doesn't lag other interactions

### 7.3.2 Optimize Remote Resize Overlays
- [x] Performance checks:
  - 3 users resizing simultaneously → maintain 60 FPS
  - Use React.memo with custom comparison
  - Only re-render overlay if bounds change significantly (>1px)
  - **Success:** Multi-user resize is smooth
  - **Test:** No frame drops
  - **Edge Case:** Rapid resize updates don't cause jank

---

## 7.4 Accessibility

### 7.4.1 Add ARIA Labels
- [ ] Update resize components:
  - Add aria-label to handles: "Resize handle: Northwest corner"
  - Add keyboard navigation support (Tab to focus handles)
  - **Success:** Screen reader friendly
  - **Test:** Navigate with Tab key

### 7.4.2 Add Keyboard Resize Support
- [ ] Add arrow key resize:
  - Focus handle with Tab
  - Press arrow keys to resize by 1px (Shift: 10px)
  - Enter to finish
  - **Success:** Keyboard-only resize works
  - **Test:** Accessible without mouse
  - **Edge Case:** Arrow keys don't scroll page

---

# Phase 8: Testing and Bug Fixes (1-2 hours)

**Goal:** Comprehensive testing and bug fixing.

## 8.1 Functional Testing

### 8.1.1 Test All Resize Operations
- [ ] Comprehensive testing checklist:
  - Select rectangle → handles appear
  - Drag NW handle → resize from top-left, SE anchored
  - Drag NE handle → resize from top-right, SW anchored
  - Drag SW handle → resize from bottom-left, NE anchored
  - Drag SE handle → resize from bottom-right, NW anchored
  - Minimum size enforcement → 10x10px minimum
  - Negative drag → dimensions stay positive
  - Rapid resize → throttled updates work
  - Release handle → state clears
  - **Success:** All operations work perfectly
  - **Edge Case:** No crashes, no NaN values

### 8.1.2 Test Coordinate Transforms
- [ ] Test resize at different zoom/pan levels:
  - Zoom in 2x → resize works
  - Zoom out 0.5x → resize works
  - Pan canvas 500px → resize works
  - Zoom + pan combined → resize works
  - **Success:** Coordinates always correct
  - **Edge Case:** Screen-to-canvas transform applied correctly

### 8.1.3 Test with Different Shapes
- [ ] Test resize on each shape type:
  - Rectangle: width/height updated
  - Circle: radius updated, maintains circular shape
  - Text: width updated, height based on fontSize
  - **Success:** All shapes resize correctly
  - **Edge Case:** Shape-specific constraints work

---

## 8.2 Multi-User Testing

### 8.2.1 Test Real-Time Sync
- [ ] Open 3 browser windows (User A, B, C):
  - User A: Resize rectangle #1
  - Users B, C: See resize in real-time (<50ms latency)
  - User B: Resize rectangle #2 simultaneously
  - Users A, C: See User B's resize
  - User C: Resize same object as User A (conflict)
  - All: Last-writer-wins, consistent final state
  - **Success:** All users see same final state
  - **Edge Case:** No sync errors, no orphaned states

### 8.2.2 Test Disconnection Scenarios
- [ ] Test disconnect cleanup:
  - User A: Start resize, close tab mid-resize
  - User B: Overlay disappears within 3 seconds
  - User B: Object stays at last synced size
  - No orphaned resize state in RTDB
  - **Success:** Cleanup works correctly
  - **Edge Case:** onDisconnect fires reliably

---

## 8.3 Performance Testing

### 8.3.1 Performance Benchmarks
- [ ] Measure performance:
  - Single user resize: 60 FPS maintained
  - Multi-user resize (3 users): 60 FPS maintained
  - 100+ objects on canvas: 60 FPS during resize
  - Resize latency: <50ms from drag to visible update
  - RTDB updates: <50ms from local to remote user
  - **Success:** All benchmarks met
  - **Test:** Chrome DevTools Performance profiler
  - **Edge Case:** No memory leaks after 100 resizes

---

## 8.4 Edge Case Testing

### 8.4.1 Test Extreme Cases
- [ ] Edge case checklist:
  - Resize to 10,000 x 10,000 → works
  - Resize to 10 x 10 (minimum) → enforced
  - Drag handle 5000px away → no overflow
  - Resize during pan/zoom → coordinates correct
  - Resize with laggy network → graceful degradation
  - Resize with offline RTDB → queued, syncs on reconnect
  - **Success:** All edge cases handled
  - **Edge Case:** No crashes, no data corruption

---

# Phase 9: Documentation and Cleanup (1 hour)

**Goal:** Document the resize system and clean up code.

## 9.1 Code Documentation

### 9.1.1 Add File Headers
- [ ] Ensure all files have comprehensive headers:
  - `resizeService.ts`: Explain RTDB structure and sync pattern
  - `useResize.ts`: Document hook API and usage examples
  - `ResizeHandle.tsx`: Explain single handle component
  - `ResizeHandles.tsx`: Explain group component and reusability
  - **Success:** All files well-documented

### 9.1.2 Add Inline Comments
- [ ] Add comments for complex logic:
  - Anchor calculation
  - Coordinate transforms
  - Minimum size enforcement
  - Last-writer-wins conflict resolution
  - **Success:** Code is self-explanatory

### 9.1.3 Add Usage Examples
- [ ] Add JSDoc examples to key functions:
  - `useResize` hook: Complete usage example
  - `ResizeHandles` component: Integration example
  - `resizeService` functions: RTDB interaction examples
  - **Success:** Examples are clear and runnable

---

## 9.2 Code Review and Refactoring

### 9.2.1 Check File Sizes
- [ ] Verify all files under 500 lines:
  - If over 500 lines, split into smaller modules
  - Move helpers to separate files
  - **Success:** All files under 500 lines
  - **Edge Case:** Barrel exports help organize

### 9.2.2 Check for Code Duplication
- [ ] Look for repeated code:
  - Extract common patterns to utilities
  - Reuse components across shape types
  - **Success:** DRY principle followed
  - **Edge Case:** Abstraction is maintainable

### 9.2.3 Check TypeScript Strict Mode
- [ ] Verify TypeScript strict mode:
  - No `any` types used
  - All functions have return types
  - All callbacks have proper types
  - **Success:** Full type safety
  - **Edge Case:** No type errors in production

---

## 9.3 Update Project Documentation

### 9.3.1 Update README
- [ ] Add resize feature to README:
  - Document resize handles feature
  - Explain real-time collaboration support
  - Add usage instructions
  - **Success:** README up to date

### 9.3.2 Update Architecture Docs
- [ ] Update architecture documentation:
  - Add resize service to Firebase section
  - Document resize state structure
  - Explain conflict resolution (last-writer-wins)
  - **Success:** Architecture docs complete

### 9.3.3 Update Master Task List
- [ ] Mark all resize tasks complete in master-task-list.md
  - Update Phase 2 checkbox for resize handles
  - Note completion time and any deviations
  - **Success:** Master task list accurate

---

# Phase 10: Final Verification (30 min)

**Goal:** Final end-to-end testing before deployment.

## 10.1 Final Functional Tests

### 10.1.1 End-to-End User Flow
- [ ] Complete user flow test:
  1. Sign up / log in
  2. Create rectangle on canvas
  3. Select rectangle → handles appear
  4. Drag NW handle → resize from top-left
  5. Drag SE handle → resize from bottom-right
  6. Shift+drag → proportional resize
  7. Alt+drag → resize from center
  8. Release → handles stay at corners
  9. Deselect → handles disappear
  - **Success:** Complete flow works perfectly
  - **Test:** No errors in console

### 10.1.2 Multi-User Flow
- [ ] Complete multi-user flow:
  1. User A: Create and resize rectangle
  2. User B: See resize in real-time
  3. User B: Resize different rectangle
  4. Both: See each other's operations
  5. User A: Disconnect
  6. User B: See User A go offline, resize state clears
  - **Success:** Multi-user flow works
  - **Test:** <50ms latency

---

## 10.2 Performance Verification

### 10.2.1 Final Performance Check
- [ ] Run performance profiler:
  - Single-user resize: 60 FPS ✓
  - Multi-user resize: 60 FPS ✓
  - 100+ objects: 60 FPS during resize ✓
  - Memory: No leaks after 100 resizes ✓
  - **Success:** All performance targets met
  - **Test:** Chrome DevTools Performance tab

---

## 10.3 Deploy to Production

### 10.3.1 Build for Production
- [ ] Build application:
  - Run: `npm run build`
  - No TypeScript errors ✓
  - No build warnings ✓
  - dist/ folder created ✓
  - **Success:** Production build succeeds

### 10.3.2 Test Production Build Locally
- [ ] Preview production build:
  - Run: `npm run preview`
  - Test all resize functionality
  - Test multi-user with 2 windows
  - **Success:** Production build works correctly
  - **Edge Case:** No dev-only bugs

### 10.3.3 Deploy to Firebase
- [ ] Deploy to Firebase Hosting:
  - Run: `firebase deploy --only hosting`
  - Deployment succeeds ✓
  - Visit live URL ✓
  - Test resize functionality live ✓
  - **Success:** Feature live in production

### 10.3.4 Verify Database Rules Deployed
- [ ] Verify RTDB rules:
  - Check Firebase Console → Realtime Database → Rules
  - Verify `resize-states` path exists with correct permissions
  - Test write permission (authenticated users can write)
  - **Success:** Rules deployed and working
  - **Edge Case:** Rules are permissive enough for Figma-style collaboration

---

## 10.4 Create Git Commit

### 10.4.1 Stage Changes
- [ ] Stage all files:
  - `git add .`
  - Verify only relevant files staged
  - No .env files committed ✓
  - **Success:** Clean git status

### 10.4.2 Commit with Descriptive Message
- [ ] Create commit:
  - Message: `feat: Add corner resize handles with real-time collaboration`
  - Body:
    ```
    Implemented Figma-style corner resize handles for all canvas objects:

    Features:
    - 4 corner handles (NW, NE, SW, SE) with tooltips showing directional arrows
    - Opposite corner anchored during resize
    - Minimum size enforcement (10x10px)
    - Shift key: lock aspect ratio
    - Alt key: resize from center
    - Real-time collaboration: other users see resize in progress
    - Conflict resolution: last-writer-wins (Figma-style)
    - Works with all shape types (rectangle, circle, text)
    - 60 FPS performance maintained

    Technical implementation:
    - ResizeHandle component: Individual corner handle with hover effects
    - ResizeHandles component: Group of 4 handles (reusable)
    - useResize hook: Resize logic with Firebase RTDB sync
    - resizeService: Real-time resize state management
    - RemoteResizeOverlay: Shows other users' resizes

    Firebase structure:
    - /canvases/{canvasId}/resize-states/{objectId}/
    - Auto-cleanup on disconnect via onDisconnect()
    - Throttled updates (50ms) for smooth performance
    ```
  - **Success:** Commit created with descriptive message
  - **Test:** `git log` shows commit

### 10.4.3 Push to Remote
- [ ] Push changes:
  - `git push origin main`
  - **Success:** Changes pushed to remote repository
  - **Test:** GitHub/GitLab shows latest commit

---

# Success Criteria

**Feature is complete when ALL of the following are true:**

## Functional Requirements
- [ ] 4 corner resize handles appear when object is selected
- [ ] Each handle shows tooltip with directional arrow on hover
- [ ] Dragging handle resizes object with opposite corner anchored
- [ ] Minimum size (10x10px) enforced for all shapes
- [ ] Shift key locks aspect ratio during resize
- [ ] Alt key resizes from center (both corners move)
- [ ] Handles work for rectangle, circle, and text shapes
- [ ] Deselecting object hides handles

## Real-Time Collaboration
- [ ] Other users see resize in progress with dashed overlay
- [ ] Remote user's color used for overlay and handles
- [ ] Username badge shows "User X is resizing"
- [ ] Multiple users can resize different objects simultaneously
- [ ] Last-writer-wins conflict resolution works correctly
- [ ] Resize state auto-clears on disconnect (within 3 seconds)

## Performance
- [ ] 60 FPS maintained during resize
- [ ] 60 FPS with 3 users resizing simultaneously
- [ ] 60 FPS with 100+ objects on canvas
- [ ] <50ms latency for resize updates (local to remote users)
- [ ] No memory leaks after 100 resize operations

## Code Quality
- [ ] All files under 500 lines
- [ ] All functions have JSDoc comments
- [ ] No TypeScript `any` types used
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings
- [ ] All imports use @ alias (no relative paths)
- [ ] Barrel exports work correctly

## Testing
- [ ] Manual testing completed for all scenarios
- [ ] Edge cases tested (minimum size, coordinate transforms, disconnects)
- [ ] Multi-user testing completed (2-3 concurrent users)
- [ ] Performance benchmarks met (60 FPS, <50ms latency)
- [ ] Production build tested locally
- [ ] Deployed to production and verified live

## Documentation
- [ ] All files have header JSDoc comments
- [ ] All functions have JSDoc with examples
- [ ] README updated with resize feature
- [ ] Architecture docs updated
- [ ] Master task list updated

---

## Implementation Notes

### Key Architectural Decisions

**1. Opposite Corner Anchoring**
- During resize, opposite corner stays fixed (anchor point)
- Only the dragged corner moves, along with adjacent sides
- Example: Dragging NW handle → SE corner stays fixed, NW corner + top/left sides move

**2. Real-Time Sync Strategy**
- Resize states stored in RTDB at `/canvases/{canvasId}/resize-states/{objectId}`
- Throttled updates (50ms) during drag for smooth performance
- Immediate update on resize end (no throttle) to ensure consistency
- Clear resize state AFTER object update completes (prevents flash-back)

**3. Conflict Resolution**
- Figma-style: No hard locks, multiple users can resize same object
- Last-writer-wins: Final resize state overwrites previous
- Both users see consistent final state after resize completes

**4. Shape Type Abstraction**
- Generic `getBounds(object)` function to extract bounds from any shape type
- Generic `updateShapeFromBounds(object, newBounds)` to update shape-specific properties
- Rectangle: Update x, y, width, height
- Circle: Calculate radius from bounds, update x, y, radius
- Text: Update x, y, width (height derived from fontSize)

**5. Coordinate Transforms**
- Use `screenToCanvasCoords()` to convert mouse position to canvas coordinates
- Accounts for stage zoom and pan transformations
- Critical for resize accuracy at any zoom/pan level

### Critical Code Patterns

**Anchor Calculation:**
```typescript
function getAnchorPoint(handle: ResizeHandle, bounds: Bounds): ResizeAnchor {
  switch (handle) {
    case 'nw': return { x: bounds.x + bounds.width, y: bounds.y + bounds.height }; // SE corner
    case 'ne': return { x: bounds.x, y: bounds.y + bounds.height }; // SW corner
    case 'sw': return { x: bounds.x + bounds.width, y: bounds.y }; // NE corner
    case 'se': return { x: bounds.x, y: bounds.y }; // NW corner
  }
}
```

**Resize Calculation:**
```typescript
function calculateResizedBounds(
  handle: ResizeHandle,
  anchor: ResizeAnchor,
  currentPointer: { x: number; y: number }
): Bounds {
  const width = Math.abs(currentPointer.x - anchor.x);
  const height = Math.abs(currentPointer.y - anchor.y);
  const x = Math.min(currentPointer.x, anchor.x);
  const y = Math.min(currentPointer.y, anchor.y);

  return {
    x,
    y,
    width: Math.max(width, RESIZE_MIN_SIZE),
    height: Math.max(height, RESIZE_MIN_SIZE),
  };
}
```

**Resize Sync Pattern:**
```typescript
// On resize start
await startResizing(canvasId, objectId, userId, handle, bounds, username, color);

// During resize (throttled)
throttledUpdateResizePosition(canvasId, objectId, currentBounds);

// On resize end
await updateCanvasObject(canvasId, objectId, finalBounds); // Immediate, no throttle
await endResizing(canvasId, objectId); // Clear AFTER object update
```

### Common Pitfalls to Avoid

1. **Flash-back bug:** Always update object position BEFORE clearing resize state
2. **Negative dimensions:** Use `Math.abs()` and `Math.min/max()` to ensure positive dimensions
3. **Coordinate transforms:** Always convert screen coords to canvas coords
4. **Handle positioning:** Handles are centered on position, not top-left aligned
5. **Minimum size:** Enforce on BOTH width and height independently
6. **Throttle flush:** Final resize update should not be throttled (ensure accuracy)
7. **Memory leaks:** Unsubscribe from RTDB listeners on component unmount
8. **Type guards:** Use switch statements to handle different shape types correctly

---

## Testing Checklist

### Manual Test Scenarios

**Single-User Resize:**
- [x] Select object → 4 handles appear
- [x] Hover handle → tooltip with arrow shows
- [x] Drag NW handle → resize from top-left, SE anchored
- [x] Drag NE handle → resize from top-right, SW anchored
- [x] Drag SW handle → resize from bottom-left, NE anchored
- [x] Drag SE handle → resize from bottom-right, NW anchored
- [x] Drag to 5x5 → clamped to 10x10 minimum
- [x] Drag past anchor → dimensions stay positive
- [x] Hold Shift → aspect ratio locked
- [x] Hold Alt → resize from center
- [x] Release → handles stay at new corners
- [x] Deselect → handles disappear

**Multi-User Resize:**
- [x] User A resizes → User B sees overlay with User A's color
- [x] User B sees dashed border and username badge
- [x] User B sees User A's handles moving
- [x] Both resize different objects → no interference
- [x] Both resize same object → last-writer-wins
- [x] User A disconnects → overlay clears within 3s

**Edge Cases:**
- [x] Resize while zoomed in (2x)
- [x] Resize while zoomed out (0.5x)
- [x] Resize while canvas panned (500px)
- [x] Rapid handle switching (NW → SE → NW)
- [x] Resize with 100+ objects on canvas
- [x] Network disconnect during resize

---

## Time Estimates

- **Phase 1:** Core Types and Infrastructure - 1-2 hours
- **Phase 2:** Firebase Resize Service - 1-2 hours
- **Phase 3:** Resize Handle Components - 2-3 hours
- **Phase 4:** Resize Hook and Logic - 2-3 hours
- **Phase 5:** Integration with Shapes - 1-2 hours
- **Phase 6:** Real-Time Collaboration - 2-3 hours
- **Phase 7:** Visual Polish and UX - 1-2 hours
- **Phase 8:** Testing and Bug Fixes - 1-2 hours
- **Phase 9:** Documentation and Cleanup - 1 hour
- **Phase 10:** Final Verification - 30 min

**Total: 12-20 hours** (varies based on experience and complexity)

---

**When all tasks complete, commit with:**
```
feat: Add corner resize handles with real-time collaboration

Implemented Figma-style corner resize handles for all canvas objects with full real-time collaboration support.
```
