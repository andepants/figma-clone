# Line Feature Implementation Plan

**Goal:** Implement a Line tool with Figma-style behavior, including click-drag-release creation, automatic tool switching, and proper position/rotation handling.

**Key Features:**
- Click once to start, drag to create, release to finalize
- Auto-switch back to pointer/move tool after creation
- Position (x, y) is the lowest point of the two endpoints
- Rotation based on second point relative to first point
- No height property, only width (line length)
- Resize handles only on the two endpoints (not corners)
- Full RTDB sync and collaborative features

**Progress Tracker:** Track every task as you complete it. Each task is tested individually before moving forward.

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

## 2.4 Line Shape Implementation (Konva Line Component)

**Estimated Time:** 4-6 hours

### 2.4.1 Get Latest Konva Line Documentation

- [ ] **Documentation:** Use context7 MCP to get latest Konva Line documentation
  - Already retrieved above - Konva Line uses `points` array: `[x1, y1, x2, y2]`
  - Review Line-specific props: points, stroke, strokeWidth, lineCap, lineJoin
  - Check Line positioning (uses points array, not x/y like Rectangle)
  - Review performance considerations for lines
  - Understand how stroke properties affect line appearance
  - **Success:** Have current Konva Line documentation with code examples
  - **Test:** Documentation shows Line component with points array
  - **Edge Case:** Line uses points array `[x1, y1, x2, y2]` not x, y, width, height

---

### 2.4.2 Update Canvas Types for Line

- [ ] Update `src/types/canvas.types.ts`
  - Add `Line` interface extending `BaseCanvasObject` and `VisualProperties`
  - **Critical Properties:**
    - `type: 'line'` (discriminator)
    - `x: number` (lowest point X coordinate - see edge case below)
    - `y: number` (lowest point Y coordinate - see edge case below)
    - `points: [number, number, number, number]` (relative to x, y: `[x1, y1, x2, y2]`)
    - `width: number` (line length/distance, calculated from points)
    - `rotation: number` (angle in degrees, -179 to 179, see edge case below)
    - `stroke: string` (line color, default: '#000000')
    - `strokeWidth: number` (line thickness in pixels, default: 2)
  - **NO height property** - lines are 1-dimensional (only width/length)
  - **Edge Cases for Position Calculation:**
    - Position (x, y) = MIN of both endpoints
    - If point1 = (100, 200) and point2 = (300, 150):
      - x = Math.min(100, 300) = 100
      - y = Math.min(200, 150) = 150
    - Points array is relative to this (x, y) position:
      - point1_relative = (100 - 100, 200 - 150) = (0, 50)
      - point2_relative = (300 - 100, 150 - 150) = (200, 0)
      - points = [0, 50, 200, 0]
  - **Edge Cases for Rotation Calculation:**
    - Horizontal left-to-right: 0°
    - Straight up: 90°
    - Horizontal right-to-left: 180° (BUT normalize to -180°, see below)
    - Straight down: -90° (or 270° normalized to -90°)
    - **CRITICAL:** Rotation never goes 180-360, it flips:
      - 0° → 179° (clockwise from horizontal)
      - Then jumps to -179° → -1° (counterclockwise from horizontal)
      - Calculation: `let angle = Math.atan2(dy, dx) * (180 / Math.PI)`
      - Normalize: `if (angle === 180) angle = -180`
      - Range: -179 to 179 (never exactly 180)
  - Update `CanvasObject` union type to include `Line`
  - Update `ShapeType` to include `'line'`
  - Add JSDoc comments for all properties
  - **Success:** Line type defined with full TypeScript support
  - **Test:** Import Line type in another file, no TS errors
  - **Edge Case:** Position is MIN of endpoints, rotation is -179 to 179

**Example Line Object:**
```typescript
{
  id: 'line-123',
  type: 'line',
  x: 100,        // MIN(point1.x, point2.x)
  y: 150,        // MIN(point1.y, point2.y)
  points: [0, 50, 200, 0], // Relative to (x, y)
  width: 206,    // √((200-0)² + (0-50)²) ≈ 206
  rotation: -14, // Math.atan2(-50, 200) * (180/π) ≈ -14°
  stroke: '#000000',
  strokeWidth: 2,
  createdBy: 'user-123',
  createdAt: 1234567890,
  updatedAt: 1234567890,
}
```

---

### 2.4.3 Create Line Utility Functions

- [ ] Create `features/canvas-core/utils/lineHelpers.ts`
  - **File header with JSDoc documentation**
  - **Function 1: `calculateLineProperties`**
    - Input: two points `{ x1, y1, x2, y2 }`
    - Output: `{ x, y, points, width, rotation }`
    - **Logic:**
      ```typescript
      function calculateLineProperties(x1: number, y1: number, x2: number, y2: number) {
        // Position = MIN of endpoints
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);

        // Points relative to position
        const points: [number, number, number, number] = [
          x1 - x,
          y1 - y,
          x2 - x,
          y2 - y,
        ];

        // Width = distance between points
        const dx = x2 - x1;
        const dy = y2 - y1;
        const width = Math.sqrt(dx * dx + dy * dy);

        // Rotation = angle from point1 to point2
        let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        // Normalize to -179 to 179 range (never 180)
        if (rotation === 180) rotation = -180;

        return { x, y, points, width, rotation };
      }
      ```
    - **Success:** Function calculates all line properties correctly
    - **Test:**
      - Input (0, 0) → (100, 0): rotation = 0°
      - Input (0, 0) → (0, 100): rotation = 90°
      - Input (100, 0) → (0, 0): rotation = 180° → -180°
      - Input (0, 100) → (0, 0): rotation = -90°
      - Input (100, 100) → (200, 50): x=100, y=50, rotation ≈ -26.57°
  - **Function 2: `getLineEndpoints`**
    - Input: Line object
    - Output: `{ x1, y1, x2, y2 }` in absolute canvas coordinates
    - **Logic:**
      ```typescript
      function getLineEndpoints(line: Line): { x1: number; y1: number; x2: number; y2: number } {
        const [relX1, relY1, relX2, relY2] = line.points;
        return {
          x1: line.x + relX1,
          y1: line.y + relY1,
          x2: line.x + relX2,
          y2: line.y + relY2,
        };
      }
      ```
    - **Success:** Function converts relative points to absolute coordinates
    - **Test:** Line at (100, 50) with points [0, 50, 200, 0] → endpoints (100, 100), (300, 50)
  - **Function 3: `normalizeLineRotation`**
    - Input: angle in degrees (any range)
    - Output: angle in -179 to 179 range
    - **Logic:**
      ```typescript
      function normalizeLineRotation(angle: number): number {
        // Normalize to -180 to 180
        let normalized = angle % 360;
        if (normalized > 180) normalized -= 360;
        if (normalized < -180) normalized += 360;
        // Ensure never exactly 180
        if (normalized === 180) normalized = -180;
        return normalized;
      }
      ```
    - **Success:** Function normalizes angles correctly
    - **Test:**
      - Input 0° → 0°
      - Input 90° → 90°
      - Input 180° → -180°
      - Input 270° → -90°
      - Input 360° → 0°
      - Input -90° → -90°
  - **Update barrel export:** Add to `features/canvas-core/utils/index.ts`
  - **Success:** All utility functions work correctly
  - **Test:** Unit tests for all edge cases
  - **Edge Case:** Rotation normalization, position calculation with negative coordinates

---

### 2.4.4 Create Line Component with Code Quality Standards

- [ ] Create `features/canvas-core/shapes/Line.tsx`
  - **File header with JSDoc documentation**
  - Import Line from 'react-konva'
  - Import React and React.memo for performance
  - **Props interface:** Define LineProps with full JSDoc
    - `line: Line` (from canvas.types.ts)
    - `isSelected: boolean`
    - `isInMultiSelect?: boolean`
    - `onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void`
    - `remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null`
  - **Component implementation:**
    - Wrap in React.memo from the start
    - Render Konva Line with points array
    - **CRITICAL:** Follow Rectangle.tsx pattern for drag handling
      - startDragging, throttledUpdateDragPosition, endDragging
      - Drag moves both endpoints together (translate entire line)
    - **Line-Specific Rendering:**
      - Position: `x={line.x}` `y={line.y}` (top-left of bounding box)
      - Points: `points={line.points}` (relative to x, y)
      - Stroke: `stroke={line.stroke}` `strokeWidth={line.strokeWidth}`
      - LineCap: `lineCap="round"` (smooth endpoints)
      - LineJoin: `lineJoin="round"` (smooth corners if applicable)
    - **Selection border:** When selected, add second Line with thicker stroke (#0ea5e9)
    - **Hover state:** Change cursor to 'move' when hovering (if move tool active)
  - **Drag Behavior:**
    - Draggable only when selected AND move tool active
    - onDragMove: Update position, keep points array unchanged (translate entire line)
    - onDragEnd: Sync to RTDB
  - **Code Quality Checks:**
    - File under 500 lines (should be ~200 lines)
    - All exports documented with JSDoc
    - Named export: `export const Line = React.memo(...)`
    - No console.log statements
    - TypeScript strict mode passes
  - **Update barrel export:** Add Line to `features/canvas-core/shapes/index.ts`
  - **Success:** Line component renders correctly
  - **Test:** Render line from (100, 100) to (300, 200), see line with correct angle
  - **Edge Case:** Line renders at correct position using points array, not width/height

---

### 2.4.5 Add Line Selection Logic

- [ ] Update `Line.tsx` with selection handling
  - onClick: Check if activeTool === 'move', then call onSelect
  - Only allow clicks when move tool active (check toolStore)
  - Add hover cursor: 'pointer' when hovering (if move tool active)
  - **Hit Detection:** Line has thin clickable area (use strokeWidth + hitStrokeWidth)
    - Add `hitStrokeWidth={Math.max(line.strokeWidth * 2, 10)}` for easier selection
  - **Success:** Lines are selectable with move tool
  - **Test:** Click line with move tool → selects, with rectangle tool → ignored
  - **Edge Case:** Thin lines hard to click - increase hit area with hitStrokeWidth

---

### 2.4.6 Add Line Drag Handling

- [ ] Update `Line.tsx` with drag functionality
  - Add draggable prop: only true when isSelected && activeTool === 'move'
  - **Drag Behavior:**
    - onDragStart: Same as Rectangle (acquire drag lock)
    - onDragMove: Update position (x, y), keep points array unchanged
    - onDragEnd: Sync to RTDB, release drag lock
  - **CRITICAL:** When dragging, position changes but points array stays the same
    - This translates the entire line without changing its angle or length
  - Update cursor to 'move' during drag
  - **Success:** Selected lines can be dragged
  - **Test:** Select line → drag → position updates, angle/length unchanged
  - **Edge Case:** Multi-line drag (if in multi-select), points array unchanged

---

### 2.4.7 Implement Line Endpoint Resize Handles

- [ ] Create line-specific resize handles (DIFFERENT from Rectangle handles)
  - **NO corner handles** - lines only have 2 endpoint handles
  - **Handle Positions:**
    - Handle 1: At absolute endpoint 1 `(line.x + points[0], line.y + points[1])`
    - Handle 2: At absolute endpoint 2 `(line.x + points[2], line.y + points[3])`
  - **Handle Rendering:**
    - White circles (radius 6px)
    - Blue border when selected
    - Only visible when line is selected AND move tool active
  - **Drag Behavior:**
    - Dragging handle 1: Update point1, recalculate position/rotation/width
    - Dragging handle 2: Update point2, recalculate position/rotation/width
    - Use `calculateLineProperties` to recompute all properties
  - **Implementation Options:**
    - Option A: Create new `LineResizeHandles.tsx` component
    - Option B: Modify `ResizeHandles.tsx` to support line mode
    - **Recommendation:** Create separate component for clarity
  - **Success:** Line shows 2 endpoint handles when selected
  - **Test:** Select line → see 2 white circles at endpoints
  - **Edge Case:** Handles follow line endpoints, not bounding box corners

- [ ] Create `features/canvas-core/components/LineResizeHandles.tsx`
  - **Props:**
    - `line: Line`
    - `isSelected: boolean`
    - `onResizeEnd: (newLine: Partial<Line>) => void`
  - **Render 2 Circle handles:**
    - Handle 1 at endpoint 1
    - Handle 2 at endpoint 2
  - **Drag logic:**
    - onDragMove: Get new endpoint position
    - Recalculate line properties using `calculateLineProperties`
    - Update local preview (optimistic)
  - **onDragEnd:**
    - Call onResizeEnd with new `{ x, y, points, width, rotation }`
    - Sync to RTDB
  - **Success:** Dragging endpoints resizes line
  - **Test:** Drag endpoint → line angle/length changes, position recalculates
  - **Edge Case:** Ensure position is always MIN of endpoints after resize

- [ ] Integrate LineResizeHandles into Line.tsx
  - Import LineResizeHandles
  - Render below Line shape (in same Fragment)
  - Pass isSelected and callbacks
  - **Success:** Line component shows resize handles when selected
  - **Test:** Select line → drag endpoint → line updates
  - **Edge Case:** Handles only visible when move tool active

---

### 2.4.8 Render Lines in CanvasStage

- [ ] Update `features/canvas-core/components/CanvasStage.tsx`
  - Get lines from canvasStore: `objects.filter(obj => obj.type === 'line')`
  - Map over lines and render Line component
  - Pass isSelected, onSelect, onDragEnd handlers
  - Add key prop: `key={line.id}`
  - **Success:** Lines render alongside rectangles and circles
  - **Test:** Manually add line to store → see it on canvas
  - **Edge Case:** Lines and other shapes coexist without conflicts

---

### 2.4.9 Update Barrel Exports

- [ ] Update `features/canvas-core/shapes/index.ts`
  - Export Line component: `export { Line } from './Line'`
  - **Success:** Can import Line from '@/features/canvas-core/shapes'
  - **Test:** Import in CanvasStage works without relative paths

---

### 2.4.10 Test Line Rendering and Interaction

- [ ] Manual testing checklist:
  - Create line programmatically (add to store) → renders correctly
  - Line has correct angle based on endpoints
  - Line positioned correctly (x, y is MIN of endpoints)
  - Horizontal line (0°): left to right
  - Vertical line (90°): bottom to top
  - Vertical line (-90°): top to bottom
  - Diagonal line (45°): bottom-left to top-right
  - Diagonal line (-135°): top-left to bottom-right
  - Click line with move tool → selects (blue border appears)
  - Click line with rectangle tool → does not select
  - Drag selected line → position updates, angle/length unchanged
  - Drag unselected line → does not move
  - Click background → line deselects
  - Multiple lines can be created and selected independently
  - **Success:** All line behaviors work correctly
  - **Test:** Performance check - 20 lines maintain 60 FPS
  - **Edge Case:** Rotation normalization (-179 to 179), position is MIN of endpoints

---

### 2.4.11 Performance Verification - Line Shapes

- [ ] **FPS Checkpoint:** Verify 60 FPS with lines
  - Chrome DevTools Performance tab
  - Record while creating 20 lines
  - Pan canvas with 20 lines → verify 60 FPS
  - Zoom in/out with 20 lines → verify 60 FPS
  - Select and drag lines → verify 60 FPS
  - Mix: 10 rectangles + 10 lines + 10 circles → verify 60 FPS
  - **Success:** Maintain stable 60 FPS in all scenarios
  - **Test:** Performance profiler shows consistent frame times
  - **Edge Case:** Lines should not be slower than rectangles

---

## 2.5 Line Creation Tool (Add to Toolbar)

### 2.5.1 Update Tool Types

- [ ] Update `src/types/tool.types.ts`
  - Update `ToolType` union: add `'line'`
  - Update tools constant array to include line tool
  - Icon: `Minus` from lucide-react (horizontal line icon)
  - Shortcut: 'L'
  - **Success:** Line tool type defined
  - **Test:** No TypeScript errors, can reference 'line' tool

---

### 2.5.2 Add Line Button to Toolbar

- [ ] Update `features/toolbar/components/Toolbar.tsx`
  - Import Minus icon from lucide-react (or use appropriate line icon)
  - Add line button to shape tools section (after circle, before text)
  - Connect to toolStore.setActiveTool('line')
  - Show active state when tool === 'line' (blue background)
  - Add tooltip: "Line (L)" with keyboard shortcut
  - **Accessibility:** aria-label="Create line tool"
  - **Touch target:** Minimum 44x44px on mobile
  - **Success:** Line button appears in toolbar
  - **Test:** Click button → activeTool becomes 'line'

---

### 2.5.3 Implement Line Creation Hook Logic

- [ ] Update `features/canvas-core/hooks/useShapeCreation.ts`
  - Add line creation mode: when activeTool === 'line'
  - **Creation Flow:**
    - onMouseDown: Store start point (first endpoint)
    - onMouseMove: Show preview line from start point to current point
    - onMouseUp: Finalize line, **AUTO-SWITCH to move tool**
  - **Preview Rendering:**
    - Calculate line properties using `calculateLineProperties`
    - Show dashed preview line
  - **Minimum Length:** 10px (enforce on mouseUp)
  - **Success:** Hook handles line creation
  - **Test:** Log line properties during drag
  - **Edge Case:** Click without drag → 10px horizontal line (0° rotation)

- [ ] **CRITICAL: Auto-Switch to Move Tool**
  - After line creation (onMouseUp), call `setActiveTool('move')`
  - This mimics Figma behavior: create → auto-switch to pointer
  - **Success:** After creating line, tool automatically switches to move
  - **Test:** Create line → tool switches to move → can immediately select/drag
  - **Edge Case:** Switch happens BEFORE RTDB sync (optimistic)

---

### 2.5.4 Render Line Preview

- [ ] Update `CanvasStage.tsx` to render line preview
  - When previewShape exists and type === 'line', render preview Line
  - Style: dashed stroke, blue color
  - Use same Line component with preview flag
  - **Success:** Blue dashed line shows while dragging
  - **Test:** Drag with line tool → see preview → release → preview disappears
  - **Edge Case:** Preview should not interfere with existing lines

---

### 2.5.5 Finalize Line Creation

- [ ] Update `useShapeCreation.ts` onMouseUp for lines
  - Calculate final line properties (enforce minimum 10px length)
  - Create new Line object:
    ```typescript
    const { x, y, points, width, rotation } = calculateLineProperties(x1, y1, x2, y2);
    const newLine: Line = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'line',
      x,
      y,
      points,
      width: Math.max(width, 10), // Minimum 10px length
      rotation,
      stroke: '#000000', // Default black
      strokeWidth: 2,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    ```
  - Add to canvasStore (optimistic)
  - **CRITICAL:** Auto-switch to move tool IMMEDIATELY
  - Sync to RTDB
  - Clear preview state
  - **Success:** Lines are created on mouse up, tool switches to move
  - **Test:** Click-drag → release → line appears → tool is move
  - **Edge Case:** Click without drag → 10px horizontal line

---

### 2.5.6 Firebase RTDB Sync for Lines

- [ ] **RTDB Integration:** Verify lines sync to `/canvases/main/objects`
  - Lines should sync atomically like rectangles
  - Check `lib/firebase/canvasService.ts` supports Line type
  - Ensure Line objects serialize correctly (no NaN, undefined)
  - **Success:** Lines sync to RTDB within 50ms
  - **Test:** Create line → check RTDB console → line object exists
  - **Edge Case:** Ensure rotation is -179 to 179, not 180-360

---

### 2.5.7 Multi-User Line Sync Test

- [ ] Open 2 browser windows:
  - Window A: Create line with line tool
  - Window B: See line appear within 50ms
  - Window B: Select and drag line
  - Window A: See line move
  - Window B: Drag endpoint (resize)
  - Window A: See line resize
  - Both: Create multiple lines rapidly (5 lines in 5 seconds)
  - **Success:** All line operations sync across users
  - **Test:** No sync errors in console
  - **Edge Case:** Concurrent line creation should not cause conflicts

---

### 2.5.8 Add Line Tool Keyboard Shortcut

- [ ] Update `features/toolbar/hooks/useToolShortcuts.ts`
  - Add 'L' key handler: `setActiveTool('line')`
  - Add to keyboard shortcuts list
  - Test that L key activates line tool
  - **Success:** Pressing L activates line tool
  - **Test:** Press L → tool switches → press R → switches to rectangle → press L → back to line
  - **Edge Case:** Don't trigger when typing in input field

---

## 2.6 Line Properties Panel Integration

### 2.6.1 Update Properties Panel for Lines

- [ ] Update `features/canvas-core/components/PropertiesPanel.tsx` (if exists)
  - **Line-Specific Properties:**
    - Show **Width** (line length) - read-only or editable
    - Show **Rotation** (-179° to 179°) - editable
    - Show **Stroke Color** - editable
    - Show **Stroke Width** - editable
    - **NO Height property** (lines are 1D)
  - **Position Properties:**
    - Show **X** (lowest X of endpoints)
    - Show **Y** (lowest Y of endpoints)
    - **Edge Case:** When user edits X or Y, translate both endpoints
  - **Success:** Properties panel shows line-specific properties
  - **Test:** Select line → see correct properties in panel
  - **Edge Case:** Rotation shown as -179 to 179, never 180-360

---

### 2.6.2 Handle Line Rotation Editing

- [ ] Add rotation input field for lines
  - Allow user to type rotation angle
  - **Normalize input:** Convert 180-360 to -180 to 0 range
  - Update line rotation in RTDB
  - **Success:** User can edit rotation from properties panel
  - **Test:** Select line → change rotation to 90° → line rotates vertically
  - **Edge Case:** Input 180° → normalize to -180°, input 270° → normalize to -90°

---

### 2.6.3 Handle Line Width (Length) Editing

- [ ] Add width/length input field for lines
  - Allow user to type line length
  - **Behavior:** Keep rotation same, extend endpoint 2 to new length
  - Recalculate endpoint 2 position:
    ```typescript
    const angleRad = (line.rotation * Math.PI) / 180;
    const newX2 = line.x + Math.cos(angleRad) * newWidth;
    const newY2 = line.y + Math.sin(angleRad) * newWidth;
    // Then recalculate using calculateLineProperties
    ```
  - **Success:** User can edit line length from properties panel
  - **Test:** Select line → change width to 200px → line extends/shrinks
  - **Edge Case:** Ensure position updates if new endpoint becomes lowest point

---

## 2.7 Line Edge Cases & Polish

### 2.7.1 Handle Zero-Length Lines

- [ ] **Edge Case:** User clicks without dragging
  - Create 10px horizontal line (0° rotation) at click point
  - **Success:** No zero-length lines exist
  - **Test:** Single click → 10px line appears
  - **Edge Case:** Line has valid width, never 0

---

### 2.7.2 Handle Line Rotation Edge Cases

- [ ] **Test all rotation quadrants:**
  - 0° (horizontal right)
  - 45° (diagonal up-right)
  - 90° (vertical up)
  - 135° (diagonal up-left)
  - 179° (almost horizontal left)
  - -179° (almost horizontal left, other direction)
  - -135° (diagonal down-left)
  - -90° (vertical down)
  - -45° (diagonal down-right)
  - **Success:** All rotations normalized to -179 to 179
  - **Test:** Create lines in all directions → rotation calculated correctly
  - **Edge Case:** Never see 180° or 181° or 270°, always -179 to 179

---

### 2.7.3 Handle Line Position Edge Cases

- [ ] **Test position calculation edge cases:**
  - Line from (100, 100) to (200, 50): x=100, y=50 (MIN of both)
  - Line from (200, 50) to (100, 100): x=100, y=50 (same result)
  - Line from (0, 0) to (-50, -50): x=-50, y=-50
  - Negative coordinates: position can be negative
  - **Success:** Position always MIN of endpoints
  - **Test:** Create lines in all directions → position calculated correctly
  - **Edge Case:** Position independent of creation direction (left-to-right vs right-to-left)

---

### 2.7.4 Test Line Multi-Select

- [ ] **Multi-select with lines:**
  - Shift-click multiple lines → all selected
  - Drag group of lines → all move together
  - Resize handles disabled in multi-select (like rectangles)
  - **Success:** Lines work in multi-select
  - **Test:** Select 3 lines + 2 rectangles → drag group → all move
  - **Edge Case:** Line endpoint handles hidden in multi-select mode

---

### 2.7.5 Test Line Copy/Paste

- [ ] **Clipboard operations:**
  - Copy line (Cmd/Ctrl+C)
  - Paste line (Cmd/Ctrl+V) → duplicate appears offset by 10px
  - **Success:** Lines can be copied/pasted
  - **Test:** Create line → copy → paste → duplicate appears
  - **Edge Case:** Pasted line has same rotation, offset position

---

### 2.7.6 Test Line Delete

- [ ] **Delete operations:**
  - Select line → press Delete/Backspace → line removed
  - Delete syncs to RTDB
  - Other users see line disappear
  - **Success:** Lines can be deleted
  - **Test:** Select line → delete → line disappears from canvas and RTDB
  - **Edge Case:** Multi-select delete removes all selected lines

---

### 2.7.7 Add Line to Dimension Label

- [ ] Update `DimensionLabel.tsx` to support lines
  - Show **Width (length)** when line selected
  - Show **Rotation** in degrees
  - **NO Height** (lines are 1D)
  - **Success:** Dimension label shows line length and rotation
  - **Test:** Select line → see "206px ∠-14°" or similar
  - **Edge Case:** Dimension label positioned near line midpoint

---

### 2.7.8 Test Line with Zoom/Pan

- [ ] **Test lines at different zoom levels:**
  - Zoom in to 5.0x → lines render correctly
  - Zoom out to 0.1x → lines render correctly
  - Pan canvas → lines move with canvas
  - **Success:** Lines work at all zoom/pan levels
  - **Test:** Create line → zoom in → drag → zoom out → still correct
  - **Edge Case:** strokeWidth scales with zoom (or doesn't, based on design)

---

### 2.7.9 Test Line Performance with 100+ Lines

- [ ] **Load test with many lines:**
  - Create 100 lines on canvas
  - Pan canvas → verify 60 FPS
  - Zoom in/out → verify 60 FPS
  - Select/drag lines → verify 60 FPS
  - **Success:** Performance maintained with 100+ lines
  - **Test:** Performance profiler shows <16ms frame time
  - **Edge Case:** Lines as performant as rectangles

---

## 2.8 Final Line Feature Validation

### 2.8.1 Line Feature Checklist

**Must pass ALL before feature complete:**

**Functional Requirements:**
- [ ] User can select line tool with 'L' keyboard shortcut
- [ ] User can create line with click-drag-release
- [ ] Line appears with correct position (MIN of endpoints)
- [ ] Line appears with correct rotation (-179° to 179°)
- [ ] Line appears with correct width (length)
- [ ] Tool auto-switches to move after line creation
- [ ] User can select lines with move tool
- [ ] User can drag lines (translate, angle/length unchanged)
- [ ] User can resize lines by dragging endpoints
- [ ] Endpoint handles visible only when line selected
- [ ] Line shows only 2 handles (no corner handles)
- [ ] Line changes sync to RTDB within 50ms
- [ ] Multiple users see each other's lines in real-time
- [ ] Lines work in multi-select mode
- [ ] Lines can be copied/pasted
- [ ] Lines can be deleted
- [ ] Properties panel shows line-specific properties
- [ ] No height property shown for lines

**Rotation Requirements:**
- [ ] Horizontal left-to-right: 0°
- [ ] Vertical upward: 90°
- [ ] Horizontal right-to-left: -180° (not 180°)
- [ ] Vertical downward: -90°
- [ ] All rotations in range -179° to 179°
- [ ] Never see 180°, 181°, or 270° values
- [ ] Rotation normalizes correctly from any input

**Position Requirements:**
- [ ] Position (x, y) is MIN of both endpoints
- [ ] Line from (100,100) to (200,50): position = (100,50)
- [ ] Line from (200,50) to (100,100): position = (100,50) (same)
- [ ] Position updates correctly when endpoints change
- [ ] Negative coordinates handled correctly

**Performance Requirements:**
- [ ] 60 FPS while creating lines
- [ ] 60 FPS while dragging lines
- [ ] 60 FPS while resizing lines (dragging endpoints)
- [ ] 60 FPS with 100+ lines on canvas
- [ ] <50ms sync latency for line changes

**Multi-User Requirements:**
- [ ] User A creates line → User B sees it within 50ms
- [ ] User B drags line → User A sees it move
- [ ] User B drags endpoint → User A sees resize
- [ ] Concurrent line creation works without conflicts
- [ ] Remote drag state shows correct line position

**Edge Cases:**
- [ ] Click without drag → 10px horizontal line (0°)
- [ ] Very short drag (3px) → 10px line (minimum enforced)
- [ ] Rotation 180° normalized to -180°
- [ ] Rotation 270° normalized to -90°
- [ ] Position recalculates when endpoint dragged to new MIN
- [ ] Lines work at all zoom levels (0.1x to 5.0x)
- [ ] Line selection works with thin lines (hitStrokeWidth)
- [ ] Endpoint handles don't overlap with line

**Code Quality:**
- [ ] Line.tsx under 500 lines
- [ ] All functions have JSDoc comments
- [ ] No console errors
- [ ] All imports use @ alias
- [ ] TypeScript strict mode passes
- [ ] No 'any' types used
- [ ] lineHelpers.ts has full test coverage

---

## 2.9 Line Feature Deployment

### 2.9.1 Build and Test

- [ ] Run build: `npm run build`
  - **Success:** Build completes with no errors
  - **Test:** Check dist/ folder created
  - **Edge Case:** Fix any TypeScript errors

- [ ] Run preview: `npm run preview`
  - **Success:** Preview works locally
  - **Test:** Test all line features in production build
  - **Edge Case:** Ensure all line functionality works in production

---

### 2.9.2 Deploy to Firebase

- [ ] Deploy: `firebase deploy --only hosting`
  - **Success:** Deploy completes successfully
  - **Test:** Access deployed app, test line features
  - **Edge Case:** Verify RTDB sync works in production

---

### 2.9.3 Final Multi-User Test

- [ ] Open 3 devices (desktop, tablet, phone):
  - All 3 users create lines
  - All see each other's lines in real-time
  - All can drag/resize each other's lines (no conflicts)
  - All see correct cursors during line creation
  - **Success:** Full collaborative line editing works
  - **Test:** No sync delays, no conflicts
  - **Edge Case:** Network latency < 100ms for most users

---

## Phase 2 Success Criteria - Line Feature

Line feature is complete when:

1. ✅ **All checklist items above pass**
2. ✅ **Demo-ready:** "Press L → Click-drag → Line appears → Auto-switch to pointer → Drag endpoints to resize → Sync to all users"
3. ✅ **Performance targets met:** 60 FPS, <50ms sync
4. ✅ **Rotation always -179° to 179°** (never 180-360)
5. ✅ **Position always MIN of endpoints**
6. ✅ **No height property** (only width/length)
7. ✅ **Endpoint handles only** (no corner handles)
8. ✅ **Auto-switch to move tool after creation**
9. ✅ **No console errors**
10. ✅ **Deployed and publicly accessible**

**When all complete, commit with:** `feat: Add Line tool with Figma-style behavior and endpoint resize`

---

## Implementation Notes

### Line Data Structure
```typescript
interface Line {
  id: string;
  type: 'line';
  x: number;        // MIN(endpoint1.x, endpoint2.x)
  y: number;        // MIN(endpoint1.y, endpoint2.y)
  points: [number, number, number, number]; // [x1, y1, x2, y2] relative to (x, y)
  width: number;    // Length/distance between endpoints
  rotation: number; // -179 to 179 degrees
  stroke: string;
  strokeWidth: number;
  // No height property!
  // ...other VisualProperties
}
```

### Rotation Calculation
```typescript
// Calculate angle from point1 to point2
const dx = x2 - x1;
const dy = y2 - y1;
let rotation = Math.atan2(dy, dx) * (180 / Math.PI);

// Normalize to -179 to 179
if (rotation === 180) rotation = -180;
// Or more robustly:
if (rotation > 179) rotation -= 360;
```

### Position Calculation
```typescript
// Position is always the minimum of both endpoints
const x = Math.min(x1, x2);
const y = Math.min(y1, y2);

// Points array is relative to this position
const points: [number, number, number, number] = [
  x1 - x,
  y1 - y,
  x2 - x,
  y2 - y,
];
```

### Endpoint Resize Logic
```typescript
// When dragging endpoint 2:
const newX2 = dragX; // New absolute X
const newY2 = dragY; // New absolute Y

// Recalculate all properties
const { x, y, points, width, rotation } = calculateLineProperties(
  line.x + line.points[0], // Old endpoint 1 X
  line.y + line.points[1], // Old endpoint 1 Y
  newX2,                   // New endpoint 2 X
  newY2                    // New endpoint 2 Y
);

// Update line
updateObject(line.id, { x, y, points, width, rotation });
```

---

## File Structure After Line Implementation

```
src/
├── features/
│   ├── canvas-core/
│   │   ├── components/
│   │   │   ├── CanvasStage.tsx (updated with line rendering)
│   │   │   ├── LineResizeHandles.tsx (NEW)
│   │   │   ├── DimensionLabel.tsx (updated for lines)
│   │   │   └── index.ts
│   │   ├── shapes/
│   │   │   ├── Rectangle.tsx
│   │   │   ├── Circle.tsx
│   │   │   ├── TextShape.tsx
│   │   │   ├── Line.tsx (NEW)
│   │   │   └── index.ts (updated)
│   │   ├── hooks/
│   │   │   ├── useShapeCreation.ts (updated with line creation)
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── coordinates.ts
│   │       ├── lineHelpers.ts (NEW)
│   │       └── index.ts (updated)
│   └── toolbar/
│       ├── components/
│       │   └── Toolbar.tsx (updated with line button)
│       └── hooks/
│           └── useToolShortcuts.ts (updated with 'L' key)
├── types/
│   ├── canvas.types.ts (updated with Line interface)
│   ├── tool.types.ts (updated with 'line' tool type)
│   └── index.ts
└── stores/
    └── toolStore.ts (updated with 'line' tool)
```

---

## Testing Checklist

### Unit Tests (Optional but Recommended)
- [ ] `lineHelpers.ts` - Test `calculateLineProperties` with all edge cases
- [ ] `lineHelpers.ts` - Test `getLineEndpoints` conversion
- [ ] `lineHelpers.ts` - Test `normalizeLineRotation` with -360° to 720° inputs

### Integration Tests
- [ ] Line creation from all 8 compass directions
- [ ] Line rotation normalization in all quadrants
- [ ] Line position calculation with negative coordinates
- [ ] Line endpoint resize in all directions
- [ ] Line multi-user sync (create, drag, resize)
- [ ] Line multi-select with other shapes
- [ ] Line copy/paste/delete operations

### Performance Tests
- [ ] 100 lines on canvas, 60 FPS
- [ ] Rapid line creation (10 lines in 5 seconds)
- [ ] Line resize performance (drag endpoint 100 times)
- [ ] Multi-user line sync latency < 50ms

---

**End of Line Implementation Plan**
