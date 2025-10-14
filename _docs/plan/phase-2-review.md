# Phase 2 Master Plan Review - Comprehensive Analysis

**Date:** 2025-10-14
**Status:** In-depth review with Figma best practices, MCP integration, edge case analysis

---

## Executive Summary

This review examines Phase 2 tasks against:
1. **Figma UX Best Practices** - Ensuring consistency with professional design tools
2. **Library Documentation Strategy** - Adding context7 MCP instructions for all 3rd party libraries
3. **Edge Case Coverage** - Identifying missing critical scenarios
4. **Current Code Integration** - Aligning with existing resize, drag, and collaboration systems
5. **Performance & Collaboration** - Real-time sync patterns and optimization

---

## Critical Findings

### 🔴 HIGH PRIORITY ISSUES

#### 1. Resize Handles Not Integrated in Phase 2
**Problem:** Phase 2 doesn't reference corner resize handles, but you're actively implementing them.
**Impact:** Phase 2 validation checklist will be incomplete without resize verification.
**Solution:** Add Section 2.X for resize handle integration OR reference corner-resize-plan.md in Phase 2.

**Recommendation:**
```markdown
## 2.X Resize Handles Integration (2-3 hours)

### 2.X.1 Complete Corner Resize Implementation
- [ ] Follow corner-resize-plan.md through Phase 6
- [ ] Integrate ResizeHandles component into Rectangle, Circle, Text shapes
- [ ] Test resize with all shape types
- [ ] Verify multi-user resize collaboration
- **Success:** All shapes have 4-corner resize handles
- **Test:** Select shape → see handles → drag to resize
- **Edge Case:** Resize + move conflict (show lock toast)

### 2.X.2 Resize Performance Validation
- [ ] Test resize with 100+ objects → maintain 60 FPS
- [ ] Test 3 users resizing simultaneously → <50ms latency
- [ ] Chrome DevTools Performance profiler shows no bottlenecks
- **Success:** Resize meets performance targets
- **Test:** No frame drops during rapid resize operations
- **Edge Case:** Resize at extreme zoom levels (0.1x, 5.0x)
```

#### 2. Context7 MCP Instructions Inconsistent
**Problem:** Only some sections (2.1.1, 2.4.2, 2.5.2, etc.) have context7 instructions.
**Missing:** Konva documentation for shapes, react-konva APIs, performance optimizations.

**Sections Needing context7 MCP:**
- **2.1 Circle Shape** - Need Konva Circle API, radius properties
- **2.3 Text Shape** - Need Konva Text API, width calculation, wrapping
- **2.9 Zoom Controls** - Need lucide-react icon APIs
- **2.10 Selection Improvements** - Need Konva animation API
- **2.16 Performance** - Need Konva caching documentation

**Solution Template:**
```markdown
### X.X.X Get Latest [Library] Documentation
- [ ] **Documentation:** Use context7 MCP to get latest documentation
  - Call `mcp__context7__resolve-library-id` with '[library-name]'
  - Call `mcp__context7__get-library-docs` with topic '[specific API area]'
  - Review [specific features] and best practices
  - Check for breaking changes or new features
  - **Success:** Have current [library] documentation with examples
  - **Test:** Documentation retrieved and reviewed
  - **Edge Case:** If context7 unavailable, fallback to [official docs URL]
```

#### 3. Figma-Specific UX Patterns Missing
**Problem:** Some Phase 2 tasks don't follow Figma's exact interaction patterns.

**Missing Figma Behaviors:**
- **Selection Animation:** Figma has subtle scale animation (1.0 → 1.01 → 1.0) on select
- **Handle Appearance:** Handles should be 8x8px squares, white fill, blue stroke (matching Figma exactly)
- **Drag Lock Visual:** When another user has lock, show their name badge, not just toast
- **Zoom Shortcut:** Figma uses Cmd/Ctrl + 0 to reset zoom to 100%, not just button
- **Fit to Screen:** Figma has Cmd/Ctrl + 1 to fit all objects in view
- **Multi-selection:** Phase 2 doesn't include Shift+click for multi-select (Figma standard)

**Recommendations:** See Section 3 below for detailed UX improvements.

---

## Section-by-Section Review

### 2.1 Circle Shape Implementation (Konva Circle Component)

#### ✅ Strengths:
- Good structure with subtasks
- Includes performance verification
- Tests circle-specific behaviors

#### ⚠️ Issues:
1. **Missing context7 for Konva Circle API** (Section 2.1.1)
2. **Edge case missing:** Circle resize should maintain circular shape (equal width/height)
3. **Missing:** Circle-specific minimum size (radius >= 5px, not 10x10px)

#### 🔧 Fixes Needed:

**Add to 2.1.1:**
```markdown
### 2.1.1 Get Latest Konva and React-Konva Documentation
- [ ] **Documentation:** Use context7 MCP to get latest Konva Circle documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Circle shape API, radius property, fill property, stroke properties, performance optimization, React-Konva Circle component'
  - Review Circle-specific props: radius, x, y (center point vs rectangle top-left)
  - Check performance considerations for circles vs rectangles
  - Review fill, stroke, and shadow properties
  - **Success:** Have current Konva Circle documentation with code examples
  - **Test:** Documentation retrieved and reviewed, Circle positioning understood (center vs corner)
  - **Edge Case:** If context7 unavailable, use konvajs.org/docs/shapes/Circle.html
```

**Add to 2.1.3:**
```markdown
### 2.1.3 Create Circle Component with Code Quality Standards
...existing content...
  - **Circle-Specific Considerations:**
    - Position (x, y) is CENTER of circle, not top-left (unlike Rectangle)
    - Minimum radius: 5px (equivalent to 10x10px rectangle)
    - When resizing, maintain circular shape (width === height)
    - Hit detection uses radius, not bounding box
  - **Edge Case:** Circle resize should lock aspect ratio by default (always circular)
```

**Add to 2.1.8:**
```markdown
### 2.1.8 Test Circle Rendering and Interaction
...existing tests...
  - Circle positioned correctly (x, y is CENTER, not top-left corner)
  - Circle with radius 50 → bounding box is 100x100, centered on x, y
  - Resize maintains circular shape (width always equals height)
  - **Edge Case:** Very small circles (radius < 5px) → enforce minimum
```

---

### 2.2 Circle Creation Tool (Add to Toolbar)

#### ✅ Strengths:
- Includes keyboard shortcut (C key)
- Multi-user sync testing

#### ⚠️ Issues:
1. **Missing:** Circle creation should show radius during drag (not width × height)
2. **Edge case:** Dragging in different directions creates different "radius" interpretations

#### 🔧 Fixes Needed:

**Add to 2.2.3:**
```markdown
### 2.2.3 Implement Circle Creation Hook Logic
...existing content...
  - **Radius Calculation Strategy:**
    - Option A: Distance from center to pointer (radius = distance)
    - Option B: Half of bounding box diagonal (Figma style)
    - **Recommended:** Option A for predictable sizing
  - onMouseMove: Calculate radius from start point to current point
    - `const dx = currentX - startX`
    - `const dy = currentY - startY`
    - `const radius = Math.sqrt(dx*dx + dy*dy)` (Euclidean distance)
  - **Edge Case:** Very small drag → enforce minimum radius 5px
  - **Figma Behavior:** Circle grows from center outward as you drag
```

**Add new subtask 2.2.X:**
```markdown
### 2.2.X Add Size Tooltip During Circle Creation
- [ ] Show radius value during circle creation
  - Position tooltip near cursor during drag
  - Display: "Radius: 50px" or "⌀ 100px" (diameter)
  - Update in real-time as user drags
  - Use Konva Label + Tag + Text for tooltip
  - **Success:** Users see circle size while creating
  - **Test:** Drag to create circle → see radius value
  - **Edge Case:** Tooltip doesn't block view of circle preview
  - **Figma Pattern:** Figma shows "W × H" but for circles could show radius
```

---

### 2.3 Text Shape Implementation (Konva Text Component)

#### ✅ Strengths:
- Includes context7 for Konva Text docs (2.3.1)
- Plans for auto-width vs fixed-width

#### ⚠️ Issues:
1. **Missing:** Text editing not planned for Phase 2 (double-click to edit)
2. **Edge case:** Text overflow handling (clip vs wrap)
3. **Missing:** Text baseline alignment (top vs middle vs bottom)

#### 🔧 Fixes Needed:

**Update 2.3.1:**
```markdown
### 2.3.1 Get Latest Konva Text Documentation
- [ ] **Documentation:** Use context7 MCP to get latest Konva Text documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Text component API, fontSize, fontFamily, text property, width calculation, text wrapping, text alignment, verticalAlign, ellipsis, performance'
  - Review Text-specific challenges: auto-width calculation, multi-line text, text wrapping
  - Understand difference between auto-width (text length) and fixed-width (wrap or clip)
  - Check text rendering performance considerations (lots of text can be slow)
  - Review ellipsis mode for overflow handling
  - **Success:** Have current Konva Text documentation with code examples
  - **Test:** Documentation retrieved, understand width: undefined (auto) vs width: number (fixed)
  - **Edge Case:** Auto-width text can become very wide, fixed-width needs wrap strategy
```

**Add to 2.3.2:**
```markdown
### 2.3.2 Update Canvas Types for Text
...existing content...
  - Properties:
    - `type: 'text'`
    - `text: string` (content, default: "Double-click to edit")
    - `fontSize: number` (default: 24)
    - `fontFamily: string` (default: 'Inter')
    - `fill: string` (text color, default: '#171717')
    - `width?: number` (optional, undefined = auto-width)
    - `align?: 'left' | 'center' | 'right'` (text alignment)
    - `verticalAlign?: 'top' | 'middle' | 'bottom'` (baseline)
    - `wrap?: 'none' | 'word' | 'char'` (wrapping mode)
  - **Edge Case:** Auto-width text (width: undefined) grows horizontally without limit
  - **Figma Behavior:** Text starts as auto-width, can be converted to fixed-width by resizing
```

**Add new section 2.3.X:**
```markdown
### 2.3.X Text Overflow and Wrapping Strategy
- [ ] Define text overflow behavior
  - **Auto-width mode (width: undefined):**
    - Text grows horizontally without limit
    - No wrapping, single line
    - Resize handles adjust width → switches to fixed-width mode
  - **Fixed-width mode (width: number):**
    - Text wraps to fit width
    - Use `wrap: 'word'` for word wrapping
    - Ellipsis for overflow: `ellipsis: true`
  - **Edge Case:** Very long single word with no spaces
  - **Edge Case:** Text with special characters (emojis, Chinese, Arabic)
  - **Success:** Text overflow handled gracefully
  - **Test:** Long text without spaces → wraps or clips predictably
```

---

### 2.5 Delete Operation Implementation

#### ✅ Strengths:
- Good accessibility coverage
- Toast notifications planned

#### ⚠️ Issues:
1. **Missing edge case:** Delete during active resize (user A resizing, user B deletes)
2. **Missing:** Undo/redo consideration (Phase 2 doesn't have undo, but should note)

#### 🔧 Fixes Needed:

**Add to 2.5.6:**
```markdown
### 2.5.6 Test Delete Operation Thoroughly
...existing tests...
  - Delete while object is being resized (locally) → cancel resize, then delete
  - User A resizing → User B deletes → User A sees object disappear, resize state clears
  - Delete during remote drag → show toast "Cannot delete, another user is editing"
  - Delete with drag lock active → blocked with toast (lock takes precedence)
  - **Edge Case:** Delete immediately after creating (within debounce window)
  - **Edge Case:** Rapid delete + create same object (ID collision)
  - **Future:** Undo delete not implemented in Phase 2, note for Phase 3
```

---

### 2.6 Duplicate Operation Implementation

#### ✅ Strengths:
- Platform-specific shortcuts (Cmd vs Ctrl)
- Offset positioning

#### ⚠️ Issues:
1. **Figma deviation:** Figma duplicates with Cmd/Ctrl+D but also Alt+drag
2. **Missing:** Smart duplication offset (doesn't overlap existing objects)

#### 🔧 Fixes Needed:

**Add new section 2.6.X:**
```markdown
### 2.6.X Smart Duplicate Positioning
- [ ] Improve duplicate offset logic
  - Current: +20px x, +20px y (always same)
  - **Better:** Check if +20,+20 overlaps existing object, adjust if so
  - Algorithm:
    - Try offset (+20, +20)
    - If collision detected → try (+40, +40), (+60, +60), etc.
    - Max attempts: 5
    - Fall back to stacking if all collision
  - **Figma Pattern:** Figma uses smart grid snapping for duplicates
  - **Success:** Duplicates positioned intelligently
  - **Test:** Duplicate shape 10 times → creates grid pattern, not stack
  - **Edge Case:** Canvas edge → offset wraps to other side or stops at boundary
```

---

### 2.7 Keyboard Shortcuts System

#### ✅ Strengths:
- Comprehensive shortcut list
- Shortcuts modal planned

#### ⚠️ Issues:
1. **Missing Figma shortcuts:** Cmd/Ctrl+0 (reset zoom), Cmd/Ctrl+1 (fit all), Cmd/Ctrl+2 (zoom to selection)
2. **Missing:** Space+drag for pan (already implemented, not documented in shortcuts modal)

#### 🔧 Fixes Needed:

**Update 2.7.4:**
```markdown
### 2.7.4 Create Keyboard Shortcuts Reference
- [ ] Create `src/constants/keyboardShortcuts.ts`
  - Export KEYBOARD_SHORTCUTS array:
    ```typescript
    export const KEYBOARD_SHORTCUTS = [
      // Tools
      { key: 'V', action: 'Move tool', category: 'Tools' },
      { key: 'R', action: 'Rectangle tool', category: 'Tools' },
      { key: 'C', action: 'Circle tool', category: 'Tools' },
      { key: 'T', action: 'Text tool', category: 'Tools' },

      // Edit Operations
      { key: 'Del / Backspace', action: 'Delete selected', category: 'Edit' },
      { key: 'Cmd/Ctrl+D', action: 'Duplicate selected', category: 'Edit' },
      { key: 'Cmd/Ctrl+Z', action: 'Undo (future)', category: 'Edit', disabled: true },
      { key: 'Esc', action: 'Deselect', category: 'Edit' },

      // View & Navigation
      { key: 'Space+Drag', action: 'Pan canvas', category: 'Canvas' },
      { key: 'Cmd/Ctrl+Scroll', action: 'Zoom in/out', category: 'Canvas' },
      { key: 'Cmd/Ctrl+0', action: 'Reset zoom to 100%', category: 'Canvas' },
      { key: 'Cmd/Ctrl+1', action: 'Fit all objects in view', category: 'Canvas' },
      { key: 'Cmd/Ctrl+2', action: 'Zoom to selection', category: 'Canvas' },

      // Resize Modifiers (when dragging handle)
      { key: 'Shift+Drag', action: 'Lock aspect ratio', category: 'Resize' },
      { key: 'Alt+Drag', action: 'Resize from center', category: 'Resize' },

      // Help
      { key: '?', action: 'Show shortcuts', category: 'Help' },
    ];
    ```
  - **Success:** Comprehensive shortcuts documented
  - **Edge Case:** Note future/disabled shortcuts for Phase 3
```

**Add new sections for missing zoom shortcuts:**
```markdown
### 2.7.X Add Cmd/Ctrl+0 Reset Zoom Shortcut
- [ ] Update `useToolShortcuts.ts`
  - Add handler for Cmd/Ctrl+0 (zero key)
  - Reset zoom to 100%: `setStageScale(1.0)`
  - Reset pan to center: `setStagePos({ x: 0, y: 0 })`
  - **Figma Behavior:** Resets both zoom and pan to defaults
  - **Success:** Pressing Cmd/Ctrl+0 resets view
  - **Test:** Zoom and pan → press shortcut → view resets
  - **Edge Case:** Don't conflict with browser zoom reset

### 2.7.Y Add Cmd/Ctrl+1 Fit All Objects
- [ ] Update `useToolShortcuts.ts`
  - Add handler for Cmd/Ctrl+1
  - Calculate bounding box of all objects
  - Calculate zoom and pan to fit all objects in viewport
  - Leave 50px padding around edges
  - **Figma Behavior:** "Zoom to fit" all canvas content
  - **Success:** All objects visible in viewport
  - **Test:** Create shapes at various positions → shortcut fits all
  - **Edge Case:** Empty canvas → do nothing or reset to 100%
```

---

### 2.9 Zoom Controls UI

#### ✅ Strengths:
- Accessibility requirements included
- Visual feedback on buttons

#### ⚠️ Issues:
1. **Missing:** Zoom percentage display (clickable to type exact zoom)
2. **Figma deviation:** Figma shows zoom as dropdown, not just +/- buttons

#### 🔧 Fixes Needed:

**Add to 2.9.4:**
```markdown
### 2.9.4 Implement Reset Zoom Functionality
- [ ] Update `ZoomControls.tsx`
  - Reset button shows current zoom: "100%", "150%", "50%", etc.
  - onClick: Reset to 100% (zoom = 1.0)
  - Also reset pan position to (0, 0)
  - **Figma Enhancement:** Make zoom percentage clickable
    - Click → opens input field to type exact zoom (e.g., "250%")
    - Enter → applies zoom, Escape → cancels
    - **Edge Case:** Invalid input (e.g., "abc") → ignore, revert to current
  - **Success:** Reset button returns to 100% zoom
  - **Test:** Zoom in/out → click reset → back to 100%, centered
  - **Edge Case:** Reset should smoothly transition (optional animation)
```

---

### 2.10 Selection and Deselection Improvements

#### ✅ Strengths:
- Improved selection visuals
- Animation planned

#### ⚠️ Issues:
1. **Missing context7 for Konva Animation API** (2.10.4)
2. **Edge case:** Selection animation during rapid tool switching

#### 🔧 Fixes Needed:

**Update 2.10.4:**
```markdown
### 2.10.4 Add Selection Animation
- [ ] **Documentation:** Get latest Konva Animation documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Konva Animation, Tween, to() method, easing functions, animation performance, animation cleanup'
  - Review Konva.Animation and node.to() APIs for smooth transitions
  - Check animation cancellation (prevent animation buildup)
  - Review easing functions: Konva.Easings.EaseOut, Linear, etc.
  - Check performance best practices: animate opacity/scale only (not position during drag)
  - **Success:** Have current Konva animation documentation with examples
  - **Test:** Documentation retrieved with Tween and to() examples
  - **Edge Case:** If context7 unavailable, use konvajs.org/docs/animations/Tween.html

- [ ] Update shape components with selection animation
  - Use Konva's `node.to()` method for smooth transitions
  - On select: Animate stroke width from 0 to 3 over 150ms
  - Use easing: `Konva.Easings.EaseOut` for natural feel
  - Optional: Subtle scale animation (1.0 → 1.01 → 1.0) for extra polish (Figma style)
  - On deselect: Animate stroke width from 3 to 0 over 100ms
  - **Animation Cleanup:**
    - Store animation reference in useRef
    - Cancel previous animation before starting new one
    - Prevent animation queue buildup on rapid selection changes
  - **Performance:**
    - Ensure animations don't drop below 60 FPS
    - Test with 50+ shapes (animate only selected shape)
    - Use `shouldComponentUpdate` or React.memo to prevent unnecessary re-renders
  - **Success:** Selection has smooth, performant animation
  - **Test:** Select shape → see smooth border appear with 60 FPS maintained
  - **Edge Case:** Rapid selection switching (click 10 shapes quickly) → no animation queue buildup, only latest animation plays
  - **Figma Behavior:** Figma has very subtle scale pulse (1.0 → 1.01 → 1.0) over 200ms, consider adding
```

---

### 2.16 Canvas Performance Optimization

#### ✅ Strengths:
- Specific FPS targets
- Layer separation planned

#### ⚠️ Issues:
1. **Missing context7 for Konva caching** (2.16.3)
2. **Edge case:** Cache invalidation strategy unclear

#### 🔧 Fixes Needed:

**Update 2.16.3:**
```markdown
### 2.16.3 Implement Shape Caching for Performance
- [ ] **Documentation:** Get latest Konva caching documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'shape caching, cache() method, clearCache() method, performance optimization, when to use caching, cache limitations'
  - Review Konva `cache()` and `clearCache()` methods
  - Understand caching performance tradeoffs:
    - **Pro:** Faster rendering (rasterized to bitmap)
    - **Con:** Memory usage increases, must invalidate on changes
  - Check when caching helps vs hurts performance:
    - **Helps:** Complex shapes with many properties, static shapes
    - **Hurts:** Simple shapes (rect, circle), frequently changing shapes
  - Review cache invalidation patterns
  - **Success:** Have current Konva caching documentation with examples
  - **Test:** Documentation retrieved with cache() and clearCache() examples
  - **Edge Case:** If context7 unavailable, use konvajs.org/docs/performance/Shape_Caching.html

- [ ] Add caching to static shapes with smart invalidation
  - **Caching Strategy:**
    - For shapes that aren't selected/dragging: call `ref.current.cache()`
    - Don't cache selected shapes (constantly changing with selection border/handles)
    - Don't cache shapes being dragged (position changing rapidly)
    - Don't cache shapes being resized (dimensions changing rapidly)
    - Cache after shape creation finishes and is static
  - **Cache Invalidation (Critical):**
    - Clear cache when shape updates: `ref.current.clearCache()` then re-cache
    - Clear on selection (border/handles change), re-cache on deselection
    - Clear if shape properties change (fill, stroke, dimensions, text content)
    - Use `useEffect` with dependencies to trigger invalidation
  - **Implementation:**
    - Add `useEffect` in shape components to manage caching lifecycle
    - Example:
      ```typescript
      useEffect(() => {
        const node = shapeRef.current;
        if (!node) return;

        // Clear existing cache
        node.clearCache();

        // Re-cache if shape is static (not selected, not dragging, not resizing)
        if (!isSelected && !isDragging && !isResizing) {
          node.cache();
        }

        // Cleanup on unmount
        return () => {
          node.clearCache();
        };
      }, [isSelected, isDragging, isResizing, fill, stroke, width, height, text]);
      ```
  - **What NOT to Cache:**
    - Very simple shapes (single-color rectangles) → caching overhead > benefit
    - Shapes with gradients or complex fills → depends on complexity
    - Text shapes with wrapping → can be slow to cache, test carefully
  - **Success:** Static shapes use cached render, dynamic shapes don't
  - **Test:** With 100+ shapes, FPS improves by 10-20% when most shapes are static
  - **Edge Case:**
    - Don't cache very simple shapes (single-color rect may be faster without cache)
    - Clear cache correctly to avoid stale renders (shape changes but cached image doesn't)
    - Monitor memory usage (lots of cached shapes = more RAM)
  - **Figma Behavior:** Figma likely uses aggressive caching + dirty tracking for performance
```

---

## Missing Edge Cases - Critical Additions

### Interaction Conflicts
```markdown
### 2.X.X Test Interaction Conflict Matrix
- [ ] Test all interaction combinations:
  - User A dragging + User B resizing same object → both blocked with toast
  - User A resizing + User B deleting → delete blocked until resize completes
  - User A creating shape + User B moving canvas → no interference
  - User A selecting + User B deselecting remotely → both succeed (independent)
  - Rapid local tool switching (V,R,C,T,V) + remote user dragging → smooth
  - **Edge Case Matrix:**
    | Local Action | Remote Action | Expected Behavior |
    |--------------|---------------|-------------------|
    | Drag | Drag same obj | Local blocked (lock) |
    | Drag | Resize same obj | Local blocked (lock) |
    | Resize | Drag same obj | Local blocked (lock) |
    | Resize | Resize same obj | Both allowed (Figma-style) |
    | Delete | Drag same obj | Delete blocked (lock active) |
    | Delete | Resize same obj | Delete blocked (lock active) |
    | Create | Any | No conflict |
    | Select | Any | No conflict |
  - **Success:** All conflicts handled gracefully
  - **Test:** No crashes, clear feedback to users
```

### Coordinate Transform Edge Cases
```markdown
### 2.X.X Test Coordinate Transforms at Extremes
- [ ] Test coordinate calculations at extreme conditions:
  - **Zoom extremes:**
    - Create shape at 5.0x zoom → coordinates accurate
    - Resize at 0.1x zoom → handles still functional
    - Pan 10,000px + zoom 5.0x → math doesn't overflow
  - **Canvas bounds:**
    - Create shape at x=-5000, y=-5000 (far negative)
    - Create shape at x=10000, y=10000 (far positive)
    - Verify Konva handles large coordinates (±Infinity check)
  - **Floating point precision:**
    - Drag object 0.5px increments → no accumulated error
    - Resize by 0.1px → dimensions accurate
    - After 1000 operations → position drift < 1px
  - **Edge Case:** Stage transform matrix can produce NaN with extreme values
  - **Edge Case:** Very small zoom (0.01x) + large pan → pointer position may be inaccurate
  - **Success:** All coordinate operations accurate at extremes
  - **Test:** No NaN, no Infinity, no visual glitches
```

---

## Figma Best Practices Checklist

### Visual Design
- [x] **Handle Size:** 8x8px squares (matches Figma) - defined in resize.constants.ts
- [x] **Handle Style:** White fill, blue stroke, 3px border
- [ ] **Selection Border:** 3px blue (#0ea5e9), matches handles
- [ ] **Selection Animation:** Subtle scale pulse (1.0 → 1.01 → 1.0) over 150ms - ADD in 2.10.4
- [ ] **Hover Preview:** Subtle gray border before selection
- [ ] **Cursor States:** pointer (default), move (dragging), resize variants (nwse-resize, etc.)

### Interaction Patterns
- [x] **Corner Resize:** 4 corners (NW, NE, SW, SE), opposite corner anchored
- [ ] **Shift+Resize:** Lock aspect ratio - ADD in resize plan Phase 7
- [ ] **Alt+Resize:** Resize from center - ADD in resize plan Phase 7
- [ ] **Space+Drag:** Pan canvas (implemented, document in shortcuts)
- [ ] **Cmd/Ctrl+Scroll:** Zoom (implemented)
- [ ] **Cmd/Ctrl+0:** Reset zoom - MISSING, add in 2.7.X
- [ ] **Cmd/Ctrl+1:** Fit all in view - MISSING, add in 2.7.Y
- [ ] **Cmd/Ctrl+2:** Zoom to selection - MISSING, add in 2.7.Z

### Collaboration
- [x] **Lock System:** Drag locks prevent conflicts
- [x] **Visual Feedback:** Show other users' operations (drag overlay, selection overlay)
- [ ] **Resize Overlay:** Show other users' resize operations - IN PROGRESS (corner-resize-plan.md Phase 6)
- [x] **Colored Indicators:** Each user has assigned color
- [x] **Username Badges:** Show who is editing
- [ ] **Conflict Resolution:** Last-writer-wins for simultaneous edits - DOCUMENT better

### Performance
- [ ] **60 FPS Target:** All operations maintain 60 FPS
- [ ] **<50ms Latency:** Cursor and drag updates sync within 50ms
- [ ] **<100ms Latency:** Object updates sync within 100ms
- [ ] **Throttling:** Cursor (50ms), drag (50ms), object updates (500ms)
- [ ] **Debouncing:** Firestore writes (500ms)
- [ ] **Layer Optimization:** Background non-listening, cursors non-listening
- [ ] **Caching:** Static shapes cached, dynamic shapes not cached
- [ ] **100+ Objects:** Maintains performance with 100+ shapes - NEEDS TESTING

---

## Recommendations for Phase 2 Updates

### 1. Add Resize Integration Section
**Location:** After 2.16 (Performance), before 2.17 (Shortcuts Documentation)

**Content:** Reference to corner-resize-plan.md OR inline integration tasks

### 2. Add Context7 MCP to All Library Sections
**Sections to update:**
- 2.1.1: Konva Circle API
- 2.3.1: Konva Text API (already has, enhance)
- 2.10.4: Konva Animation API
- 2.16.3: Konva Caching API

**Template:** Use consistent format across all sections (see examples above)

### 3. Add Missing Figma Shortcuts
**New sections:**
- 2.7.X: Cmd/Ctrl+0 reset zoom
- 2.7.Y: Cmd/Ctrl+1 fit all objects
- 2.7.Z: Cmd/Ctrl+2 zoom to selection

### 4. Enhance Edge Case Testing
**Add new section at end of Phase 2:**
```markdown
## 2.21 Comprehensive Edge Case Testing

### 2.21.1 Interaction Conflict Matrix
[See "Missing Edge Cases" section above]

### 2.21.2 Coordinate Transform Extremes
[See "Missing Edge Cases" section above]

### 2.21.3 Multi-User Stress Testing
- [ ] 5 users editing simultaneously
- [ ] All 5 creating shapes rapidly
- [ ] 3 users resizing, 2 users dragging
- [ ] Network disconnect during multi-user editing
- **Success:** No crashes, all operations sync eventually
```

### 5. Update Validation Checklist
**Add to 2.20 (Phase 2 Validation Checklist):**
```markdown
### Functional Requirements - Resize Handles
- [ ] Corner resize handles appear on selected objects
- [ ] 4 corners (NW, NE, SW, SE) all functional
- [ ] Opposite corner stays anchored during resize
- [ ] Minimum size enforced (10x10px or radius 5px)
- [ ] Shift+drag locks aspect ratio (if implemented in Phase 2)
- [ ] Alt+drag resizes from center (if implemented in Phase 2)
- [ ] Multi-user resize visible with overlays
- [ ] Resize conflicts handled with locks
- [ ] <50ms latency for resize updates

### Figma Best Practices Compliance
- [ ] Handle size: 8x8px white squares with blue stroke
- [ ] Selection: 3px blue border with subtle animation
- [ ] Keyboard shortcuts match Figma (Cmd+0, Cmd+1, etc.)
- [ ] Cursor states appropriate for all interactions
- [ ] Multi-user collaboration follows Figma patterns
```

---

## Action Items Summary

### 🔴 Critical (Must fix before Phase 2 complete)
1. [ ] Add resize handles integration to Phase 2 OR reference corner-resize-plan.md
2. [ ] Add context7 MCP instructions to sections 2.1.1, 2.10.4, 2.16.3
3. [ ] Add missing Figma shortcuts (Cmd+0, Cmd+1, Cmd+2)
4. [ ] Add interaction conflict matrix testing
5. [ ] Update Phase 2 validation checklist with resize handles

### 🟡 High Priority (Strongly recommended)
6. [ ] Add coordinate transform extreme testing
7. [ ] Add smart duplicate positioning (avoid overlaps)
8. [ ] Add size tooltips during shape creation
9. [ ] Add clickable zoom percentage (type exact value)
10. [ ] Document text overflow/wrapping strategy

### 🟢 Medium Priority (Nice to have)
11. [ ] Add selection scale animation (Figma-style pulse)
12. [ ] Add keyboard arrow key resize support
13. [ ] Add multi-selection (Shift+click)
14. [ ] Add undo/redo placeholders for Phase 3

---

## Conclusion

**Overall Assessment:** Phase 2 is well-structured but needs:
1. **Resize integration** - Currently separate, should be referenced in Phase 2
2. **Consistent MCP usage** - Add context7 for all library docs
3. **Better edge case coverage** - Add interaction conflicts and coordinate extremes
4. **Figma parity** - Add missing shortcuts and visual patterns

**Estimated Additional Time:** 2-3 hours to implement recommendations

**Risk Assessment:** Medium - Missing edge cases could cause bugs in production

**Next Steps:**
1. Update master-task-list.md with recommended changes
2. Continue resize implementation per corner-resize-plan.md
3. Test interaction conflicts as you integrate resize
4. Update validation checklist before marking Phase 2 complete
