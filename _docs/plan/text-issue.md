# Text Feature Debugging Plan

**Status:** Text feature not working - need comprehensive diagnosis and fix
**Created:** 2025-10-14
**Priority:** HIGH - Core feature blocking Phase 2 completion

---

## Problem Statement

Text shapes are not working at all. When clicking with the text tool:
- ❌ Text may not be appearing on canvas
- ❌ Text editing may not be triggering
- ❌ Text may be invisible or improperly rendered
- ❌ State management or RTDB sync may be broken
- ❌ Unknown issues preventing basic text functionality

---

## Investigation Checklist

Use this checklist to diagnose the root cause before attempting fixes.

### Layer 1: Basic Visibility (Is text rendering at all?)

- [ ] **1.1** Open browser console, look for errors when clicking text tool
  - **Success:** No console errors
  - **Failure:** Note exact error message and stack trace
  - **Edge Case:** Errors may be silent - check React DevTools for warnings

- [ ] **1.2** Add console.log in `useShapeCreation.ts` line 167 (text tool click)
  - Add: `console.log('TEXT TOOL CLICKED:', canvasPos)`
  - **Success:** Console shows position when clicking
  - **Failure:** Click handler not firing - tool state issue
  - **Test:** Click 3 times, should see 3 logs

- [ ] **1.3** Add console.log in `useShapeCreation.ts` line 204 (after text object created)
  - Add: `console.log('TEXT OBJECT CREATED:', newText)`
  - **Success:** Console shows full text object with all properties
  - **Failure:** Object creation failing before this point
  - **Test:** Verify object has `id`, `type: 'text'`, `text: ''`, `width: 200`, `height: 100`

- [ ] **1.4** Check canvasStore after clicking
  - Open React DevTools → Components → Find CanvasStore
  - Look at `objects` array after clicking with text tool
  - **Success:** New text object appears in objects array
  - **Failure:** Object not being added to store - `addObject()` failing
  - **Edge Case:** Object added but immediately removed (check for errors)

- [ ] **1.5** Check if TextShape component is rendering
  - Add console.log in `TextShape.tsx` line 510 (render function)
  - Add: `console.log('RENDERING TEXT:', text.id, text.text, text.width, text.height)`
  - **Success:** Console shows text being rendered
  - **Failure:** Component not rendering - check CanvasStage filter
  - **Test:** Should log every time text is rendered or re-rendered

- [ ] **1.6** Check Konva layer in browser DevTools
  - Inspect canvas element → Check for text nodes in DOM
  - Look for `<canvas>` with text drawing commands
  - **Success:** Text node exists in Konva layer
  - **Failure:** Konva not rendering text - component props issue
  - **Edge Case:** Text rendered but outside viewport (check x, y coords)

### Layer 2: Text Visibility (Is text visible when rendered?)

- [ ] **2.1** Verify text has content to display
  - **Current Issue:** Text created with `text: ''` (empty string)
  - Empty text = invisible! Nothing to render.
  - **Fix Needed:** Either add placeholder text OR immediately trigger editing
  - **Success:** Text has visible content OR edit mode triggered
  - **Failure:** Empty text stays empty - editing not starting

- [ ] **2.2** Check if editing mode is triggered after creation
  - Add console.log in `useShapeCreation.ts` line 230 (after editing lock acquired)
  - Add: `console.log('EDITING MODE STARTED:', newText.id, canEdit)`
  - **Success:** Logs show `canEdit: true` and editing started
  - **Failure:** Edit lock not acquired - check Firebase auth
  - **Edge Case:** Lock acquired but `setEditingText` not called

- [ ] **2.3** Check if `editingTextId` is set in canvasStore
  - React DevTools → CanvasStore → Look for `editingTextId`
  - **Success:** `editingTextId` matches newly created text ID
  - **Failure:** State not updated - `setEditingText()` failing
  - **Edge Case:** ID set but immediately cleared

- [ ] **2.4** Check if textarea overlay appears
  - Create text → Look for `<textarea>` element in DOM
  - Should be positioned over canvas with styling
  - **Success:** Textarea visible, focused, ready for input
  - **Failure:** Textarea not created - useTextEditor hook issue
  - **Edge Case:** Textarea created but positioned off-screen (check absolute positioning)

- [ ] **2.5** Verify text styling (fill color, fontSize, etc.)
  - Check TextShape props: `fill`, `fontSize`, `fontFamily`
  - **Current:** `fill: '#171717'` (dark gray), `fontSize: 24`, `fontFamily: 'Inter'`
  - **Success:** Styling correct, text should be visible
  - **Failure:** Wrong colors (white text on white bg?) or fontSize 0
  - **Edge Case:** Font not loaded (Inter might not be available)

- [ ] **2.6** Check text dimensions (width, height)
  - **Current:** `width: 200`, `height: 100`
  - Too small? Text might be clipped or hidden
  - **Success:** Dimensions appropriate for 24px font
  - **Failure:** width/height 0 or undefined - text invisible
  - **Edge Case:** Text positioned outside canvas viewport

### Layer 3: Text Editing (Can user type in the text?)

- [ ] **3.1** Check if useTextEditor hook is called
  - Add console.log in `useTextEditor.ts` line 70 (useEffect start)
  - Add: `console.log('TEXT EDITOR HOOK:', isEditing, text.id)`
  - **Success:** Hook called when `isEditing` is true
  - **Failure:** Hook not called - component issue
  - **Test:** Should log once when editing starts

- [ ] **3.2** Verify textarea is created and appended to DOM
  - Add console.log in `useTextEditor.ts` line 90 (after appendChild)
  - Add: `console.log('TEXTAREA CREATED:', textarea, areaPosition)`
  - **Success:** Textarea element logged with position
  - **Failure:** Textarea creation failing - DOM manipulation issue
  - **Edge Case:** Multiple textareas created (memory leak)

- [ ] **3.3** Check textarea positioning
  - Inspect textarea styles in DevTools
  - Should be `position: absolute`, positioned over text
  - **Success:** Textarea overlays text location on canvas
  - **Failure:** Textarea positioned at 0,0 or off-screen
  - **Edge Case:** Position calculation wrong with zoom/pan

- [ ] **3.4** Verify textarea has focus and select-all works
  - Add console.log in `useTextEditor.ts` after line 173
  - Add: `console.log('TEXTAREA FOCUSED:', document.activeElement === textarea)`
  - **Success:** Textarea has focus, text selected
  - **Failure:** Focus lost immediately or select not working
  - **Edge Case:** Outside click handler triggered too early

- [ ] **3.5** Test typing in textarea
  - Create text → Textarea appears → Type "Hello"
  - Check textarea.value in console
  - **Success:** Text appears in textarea
  - **Failure:** Textarea not accepting input - check disabled/readonly
  - **Edge Case:** Input works but not syncing to RTDB

- [ ] **3.6** Check live text sync to RTDB
  - Add console.log in `useTextEditor.ts` handleInput (line 201)
  - Add: `console.log('LIVE TEXT UPDATE:', textarea.value)`
  - **Success:** Updates logged every 100ms while typing
  - **Failure:** handleInput not called - event listener issue
  - **Edge Case:** Updates logged but RTDB write failing

### Layer 4: State Management (Is store being updated correctly?)

- [ ] **4.1** Check if text tool is active
  - React DevTools → ToolStore → Look for `activeTool`
  - **Success:** `activeTool === 'text'` when text tool clicked
  - **Failure:** Tool not switching - toolbar onClick issue
  - **Test:** Click text tool button, verify state change

- [ ] **4.2** Verify toolbar has text tool button
  - Inspect toolbar UI - should see text icon (Type icon from lucide-react)
  - Button should highlight when active
  - **Success:** Text tool button visible and clickable
  - **Failure:** Button missing from toolbar - check Toolbar.tsx
  - **Edge Case:** Button exists but onClick not wired up

- [ ] **4.3** Check text tool keyboard shortcut
  - Press 'T' key → Should activate text tool
  - Check useToolShortcuts hook
  - **Success:** 'T' key switches to text tool
  - **Failure:** Shortcut not registered - check useToolShortcuts
  - **Edge Case:** Shortcut works but conflicts with browser (Cmd+T)

- [ ] **4.4** Verify canvasStore.addObject() is called
  - Add console.log in `canvasStore.ts` addObject action
  - Add: `console.log('ADD OBJECT:', object)`
  - **Success:** Text object added to store
  - **Failure:** addObject not called or failing silently
  - **Edge Case:** Object added but store not notifying subscribers

- [ ] **4.5** Check if objects array updates
  - Before: `objects.length = X`
  - Click text tool → Create text
  - After: `objects.length = X + 1`
  - **Success:** Array grows by 1
  - **Failure:** Array unchanged - store mutation issue
  - **Edge Case:** Object added but filtered out by type

- [ ] **4.6** Verify selectedIds state after text creation
  - Text creation clears selection (line 164 in useShapeCreation)
  - **Success:** `selectedIds = []` after text created
  - **Failure:** Selection not cleared - clearSelection() failing
  - **Edge Case:** Selection cleared but immediately re-set

### Layer 5: Firebase RTDB Sync (Is text persisting?)

- [ ] **5.1** Check if addCanvasObject is called
  - Add console.log in `useShapeCreation.ts` line 210 (before RTDB call)
  - Add: `console.log('SYNCING TO RTDB:', newText)`
  - **Success:** Function called with text object
  - **Failure:** Function not called - async timing issue
  - **Test:** Should see log after text created

- [ ] **5.2** Check Firebase Console for text object
  - Open Firebase → Realtime Database
  - Navigate to `/canvases/main/objects/`
  - Look for text object with `type: 'text'`
  - **Success:** Text object exists in RTDB with correct structure
  - **Failure:** Object not in RTDB - write failing
  - **Edge Case:** Object written but immediately deleted

- [ ] **5.3** Check for RTDB errors in console
  - Look for Firebase errors: permission denied, quota exceeded, etc.
  - **Success:** No Firebase errors
  - **Failure:** Permission error - check RTDB rules
  - **Edge Case:** Writes succeed but reads fail (check rules)

- [ ] **5.4** Verify RTDB subscription is active
  - Check if `subscribeToCanvasObjects` is called in CanvasPage
  - **Success:** Subscription active, receiving updates
  - **Failure:** Subscription not set up - check CanvasPage useEffect
  - **Edge Case:** Subscription active but not updating store

- [ ] **5.5** Test multi-user text sync
  - Open 2 browser windows
  - Window A: Create text
  - Window B: Should see text appear
  - **Success:** Text syncs within 500ms
  - **Failure:** Text doesn't sync - RTDB propagation issue
  - **Edge Case:** Sync works one way but not both

- [ ] **5.6** Check edit lock acquisition
  - Add console.log in `useShapeCreation.ts` line 226 (edit lock result)
  - Add: `console.log('EDIT LOCK:', canEdit, currentUser)`
  - **Success:** `canEdit: true`, user authenticated
  - **Failure:** Lock denied - check editLock logic or auth
  - **Edge Case:** Lock acquired but not stored in RTDB

### Layer 6: Konva Rendering (Is Konva configured correctly?)

- [ ] **6.1** Check if text passes type filter in CanvasStage
  - Line 367: `objects.filter(obj => obj.type === 'text')`
  - **Success:** Filter returns text objects
  - **Failure:** Filter returns empty array - type mismatch
  - **Edge Case:** Type is 'text' but comparison fails (case sensitive?)

- [ ] **6.2** Verify TextShape is imported correctly
  - Check imports in CanvasStage.tsx (line 12)
  - **Success:** `import { TextShape } from '../shapes'`
  - **Failure:** Import missing or wrong path
  - **Edge Case:** Named import vs default import mismatch

- [ ] **6.3** Check TextShape props passed from CanvasStage
  - Verify all required props: text, isSelected, onSelect
  - Check optional props: remoteDragState, editState
  - **Success:** All props passed correctly
  - **Failure:** Missing required props - component won't render
  - **Edge Case:** Props passed but with wrong types

- [ ] **6.4** Verify Konva Text component rendering
  - Check if `<KonvaText>` receives props correctly
  - Props to check: x, y, text, fontSize, width, height, visible
  - **Success:** All props passed to Konva component
  - **Failure:** Props undefined or wrong values
  - **Edge Case:** Text hidden with `visible={false}`

- [ ] **6.5** Check text positioning with offset
  - Lines 516-517: Position adjusted for center-based offset
  - `x={displayX + textWidth / 2}`, `y={displayY + textHeight / 2}`
  - `offsetX={textWidth / 2}`, `offsetY={textHeight / 2}`
  - **Success:** Text centered correctly
  - **Failure:** Text positioned incorrectly - offset math wrong
  - **Edge Case:** Offset causes text to be off-screen

- [ ] **6.6** Verify text is not hidden by visible prop
  - Line 547: `visible={!isEditing}`
  - When editing, text is hidden (textarea shows instead)
  - **Success:** Text visible when not editing, hidden when editing
  - **Failure:** Text always hidden - isEditing always true?
  - **Edge Case:** Text hidden but textarea not showing

### Layer 7: Edge Cases & Known Issues

- [ ] **7.1** Check if text is created outside viewport
  - Text positioned at x: -1000, y: -1000 would be invisible
  - **Success:** Text within visible canvas bounds
  - **Failure:** Coordinates far negative or far positive
  - **Fix:** Ensure text created at pointer position

- [ ] **7.2** Check if empty text is the issue
  - **Current:** Text created with `text: ''` (empty)
  - Empty text = nothing to render
  - **Solution 1:** Add placeholder: `text: 'Double-click to edit'`
  - **Solution 2:** Start with single space: `text: ' '`
  - **Solution 3:** Trigger edit immediately (current approach)

- [ ] **7.3** Verify font family is loaded
  - Inter font may not be loaded on system
  - Check if Inter is in document fonts
  - **Success:** Inter loaded and available
  - **Failure:** Font not available - falls back to system font
  - **Fix:** Add font loading check or use web font

- [ ] **7.4** Check z-index / layer ordering
  - Text might be behind other shapes
  - Text rendered in objects layer (line 314)
  - **Success:** Text appears on top of other shapes
  - **Failure:** Text hidden behind shapes
  - **Fix:** Check render order in CanvasStage

- [ ] **7.5** Verify text not being deleted immediately
  - Create text → Store → RTDB → Subscribe callback → Store
  - Circular update could delete text
  - **Success:** Text persists after creation
  - **Failure:** Text appears briefly then disappears
  - **Fix:** Check subscription update logic

- [ ] **7.6** Check if multiple texts are conflicting
  - Create multiple texts → Do they all work?
  - **Success:** Each text is independent
  - **Failure:** Only first/last text works
  - **Edge Case:** IDs colliding, texts overwriting each other

---

## Diagnostic Tests (Run These Step-by-Step)

### Test 1: Minimal Text Creation
**Goal:** Verify text objects can be created and stored

```typescript
// In browser console:
const testText = {
  id: 'test-text-1',
  type: 'text',
  x: 100,
  y: 100,
  text: 'TEST TEXT',
  fontSize: 24,
  fontFamily: 'Arial',
  fill: '#FF0000', // Bright red for visibility
  width: 200,
  height: 100,
  createdBy: 'test',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Add to store directly
useCanvasStore.getState().addObject(testText);

// Check if it appears
// Success: Red "TEST TEXT" visible on canvas
// Failure: Nothing appears - rendering issue
```

### Test 2: Manual Text Rendering
**Goal:** Verify TextShape component works in isolation

```typescript
// In CanvasStage.tsx, add this before other text rendering:
<TextShape
  text={{
    id: 'manual-test',
    type: 'text',
    x: 200,
    y: 200,
    text: 'MANUAL TEST',
    fontSize: 32,
    fontFamily: 'Arial',
    fill: '#00FF00', // Bright green
    width: 300,
    height: 100,
    createdBy: 'test',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }}
  isSelected={false}
  onSelect={() => {}}
/>

// Success: Green "MANUAL TEST" visible
// Failure: Nothing appears - TextShape component broken
```

### Test 3: Text Tool Activation
**Goal:** Verify tool state management

```typescript
// In browser console:
console.log('Current tool:', useToolStore.getState().activeTool);

// Click text tool button or press T key
// Then check:
console.log('After click:', useToolStore.getState().activeTool);

// Success: Shows 'text'
// Failure: Shows 'move' or other tool - tool switch broken
```

### Test 4: Text Creation Flow
**Goal:** Follow complete creation path with logs

```typescript
// Add these console.logs to trace the flow:

// useShapeCreation.ts line 167:
console.log('1. TEXT TOOL MOUSEDOWN');

// useShapeCreation.ts line 204:
console.log('2. TEXT OBJECT CREATED:', newText);

// canvasStore.ts addObject:
console.log('3. ADDED TO STORE');

// useShapeCreation.ts line 210:
console.log('4. SYNCING TO RTDB');

// TextShape.tsx line 510:
console.log('5. RENDERING TEXT');

// useTextEditor.ts line 90:
console.log('6. CREATING TEXTAREA');

// Success: See logs 1-6 in order
// Failure: Flow breaks at specific step - that's the issue
```

### Test 5: Empty Text Rendering
**Goal:** Confirm if empty text is the root cause

```typescript
// Create text with actual content instead of empty string
// Modify useShapeCreation.ts line 176:

// BEFORE:
text: '', // Empty text - user will type immediately

// AFTER:
text: 'Click to edit', // Placeholder text

// Success: Text appears on canvas immediately
// Failure: Still nothing - not an empty text issue
```

---

## Fix Plan (Execute After Diagnosis)

### Fix Priority 1: Make Text Visible (Placeholder Approach)

- [ ] **F1.1** Change default text from empty string to placeholder
  - File: `useShapeCreation.ts` line 176
  - Change: `text: ''` → `text: 'Double-click to edit'`
  - **Why:** Empty text is invisible, placeholder makes it visible
  - **Test:** Create text → See placeholder immediately

- [ ] **F1.2** Auto-select placeholder text when editing starts
  - File: `useTextEditor.ts` line 102
  - Update textarea to select all on focus
  - **Why:** User can immediately start typing to replace placeholder
  - **Test:** Double-click text → Placeholder selected → Type replaces it

- [ ] **F1.3** Style placeholder differently
  - Add opacity or italic style to placeholder text
  - **Why:** Visual indication that text needs editing
  - **Test:** Placeholder looks different from real text

### Fix Priority 2: Ensure Edit Mode Triggers Immediately

- [ ] **F2.1** Verify startEditing is called after text creation
  - File: `useShapeCreation.ts` line 219-232
  - **Current:** Async IIFE acquires edit lock
  - **Test:** Add console.log to verify execution
  - **Success:** Edit lock acquired, editing starts

- [ ] **F2.2** Add error handling for edit lock failures
  - Check if currentUser exists before attempting lock
  - **Why:** Unauthenticated users can't edit
  - **Test:** Create text while logged in vs logged out

- [ ] **F2.3** Add timeout for edit lock acquisition
  - If lock not acquired in 2 seconds, show error
  - **Why:** Prevent infinite waiting state
  - **Test:** Simulate slow network, verify timeout

### Fix Priority 3: Fix Text Rendering Issues

- [ ] **F3.1** Ensure text has minimum dimensions
  - Check width >= 50, height >= 30
  - **Why:** Too small text box = clipped/invisible text
  - **Test:** Create text, verify dimensions in DevTools

- [ ] **F3.2** Verify fill color contrasts with background
  - Canvas background: #f5f5f5 (light gray)
  - Text fill: #171717 (dark gray)
  - **Why:** Poor contrast = hard to see
  - **Test:** Create text, clearly visible on canvas

- [ ] **F3.3** Check font family loading
  - Inter font should be loaded via globals.css
  - Fallback to Arial if Inter unavailable
  - **Why:** Missing font = rendering issues
  - **Test:** Check document.fonts, verify Inter loaded

### Fix Priority 4: Fix State Management

- [ ] **F4.1** Add debug logs to track state updates
  - Log when activeTool changes
  - Log when objects array updates
  - Log when editingTextId changes
  - **Why:** Helps identify state mutation issues
  - **Test:** Create text, check logs for state flow

- [ ] **F4.2** Verify store subscriptions are active
  - CanvasStage should re-render when objects change
  - **Why:** Components not re-rendering = changes invisible
  - **Test:** Manually mutate store, verify re-render

- [ ] **F4.3** Check for race conditions
  - Tool switch before text creation completes
  - Edit mode cleared before textarea created
  - **Why:** Timing issues can break flow
  - **Test:** Rapid clicking, verify stable behavior

### Fix Priority 5: Fix Firebase RTDB Sync

- [ ] **F5.1** Verify RTDB rules allow text writes
  - Check Firebase Console → Realtime Database → Rules
  - **Why:** Permission denied = silent failures
  - **Test:** Try manual write in Firebase Console

- [ ] **F5.2** Add error logging for RTDB operations
  - Catch errors in addCanvasObject
  - Log to console with details
  - **Why:** Silent failures are hard to debug
  - **Test:** Simulate RTDB offline, check error messages

- [ ] **F5.3** Verify text object structure matches schema
  - Check all required fields are present
  - Verify types match (string, number, etc.)
  - **Why:** Invalid schema = RTDB rejects write
  - **Test:** Manual inspection of created object

### Fix Priority 6: Fix Text Editing UX

- [ ] **F6.1** Ensure textarea appears at correct position
  - Account for zoom level
  - Account for canvas pan
  - **Why:** Textarea off-screen = can't type
  - **Test:** Create text at various zoom levels

- [ ] **F6.2** Style textarea to match text appearance
  - Font size, family, color, alignment
  - **Why:** WYSIWYG editing experience
  - **Test:** Edit text, textarea looks like rendered text

- [ ] **F6.3** Handle Enter key correctly
  - Shift+Enter = new line
  - Enter = save and exit
  - **Why:** Multi-line text support
  - **Test:** Type text with line breaks

---

## Success Criteria (All Must Pass)

### Basic Functionality
- [ ] Click text tool → Tool activates (button highlighted)
- [ ] Click canvas → Text object appears immediately
- [ ] Text is visible on canvas (not invisible)
- [ ] Double-click text → Edit mode starts
- [ ] Textarea appears overlaying text
- [ ] Can type in textarea
- [ ] Text updates in real-time (live sync)
- [ ] Press Enter → Text saves, textarea closes
- [ ] Press Escape → Cancels edit, textarea closes
- [ ] Click outside → Saves text, textarea closes
- [ ] Tool switches back to move after editing

### State Management
- [ ] Text object added to canvasStore.objects
- [ ] Text appears in React DevTools store state
- [ ] selectedIds cleared after text creation
- [ ] editingTextId set when editing starts
- [ ] editingTextId cleared when editing ends
- [ ] Store updates trigger component re-renders

### Firebase Sync
- [ ] Text object written to RTDB
- [ ] Text visible in Firebase Console
- [ ] Multi-user: User A creates text → User B sees it
- [ ] Multi-user: User A edits text → User B sees updates
- [ ] Edit lock prevents concurrent editing
- [ ] Edit lock released after editing

### Visual & UX
- [ ] Text clearly visible on canvas
- [ ] Text positioned where user clicked
- [ ] Text has selection border when selected
- [ ] Text has resize handles when selected
- [ ] Can drag text to move it
- [ ] Can resize text with handles
- [ ] Remote users see selection indicators
- [ ] Remote users see live text updates

### Edge Cases
- [ ] Empty text shows placeholder OR enters edit immediately
- [ ] Very long text wraps correctly
- [ ] Text works at 0.5x zoom
- [ ] Text works at 2x zoom
- [ ] Text works after canvas pan
- [ ] Multiple texts don't interfere
- [ ] Text persists after page refresh
- [ ] Text works offline (queued)

---

## Debugging Commands (Copy-Paste Ready)

```javascript
// 1. Check current tool
console.log('Tool:', useToolStore.getState().activeTool);

// 2. Check objects in store
console.log('Objects:', useCanvasStore.getState().objects);

// 3. Check text objects only
console.log('Text objects:', useCanvasStore.getState().objects.filter(o => o.type === 'text'));

// 4. Check editing state
console.log('Editing:', useCanvasStore.getState().editingTextId);

// 5. Check if textarea exists
console.log('Textarea:', document.querySelector('textarea'));

// 6. Manually create test text
useCanvasStore.getState().addObject({
  id: 'debug-text',
  type: 'text',
  x: 300,
  y: 300,
  text: 'DEBUG TEXT',
  fontSize: 48,
  fontFamily: 'Arial',
  fill: '#FF0000',
  width: 400,
  height: 100,
  createdBy: 'debug',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// 7. Check Firebase RTDB connection
// (Open Firebase Console → Realtime Database)

// 8. Force re-render
useCanvasStore.setState({ objects: [...useCanvasStore.getState().objects] });
```

---

## Root Cause Hypotheses (Most to Least Likely)

### Hypothesis 1: Empty Text Is Invisible ⭐⭐⭐⭐⭐
**Likelihood:** 95%
**Reason:** Text created with `text: ''` has nothing to render
**Test:** Change to placeholder text, see if it appears
**Fix:** Add placeholder OR ensure edit starts immediately

### Hypothesis 2: Edit Mode Not Starting ⭐⭐⭐⭐
**Likelihood:** 80%
**Reason:** Async edit lock might be failing
**Test:** Check if setEditingText is called
**Fix:** Add error handling, verify auth state

### Hypothesis 3: Text Positioned Off-Screen ⭐⭐⭐
**Likelihood:** 60%
**Reason:** Coordinate calculation might be wrong
**Test:** Check x, y values in console
**Fix:** Verify screenToCanvasCoords works correctly

### Hypothesis 4: Konva Text Not Rendering ⭐⭐⭐
**Likelihood:** 50%
**Reason:** Props issue or Konva configuration
**Test:** Manual <TextShape> test
**Fix:** Check props passed to Konva Text component

### Hypothesis 5: Tool Not Activating ⭐⭐
**Likelihood:** 30%
**Reason:** Toolbar button or shortcut broken
**Test:** Check activeTool in store
**Fix:** Verify toolbar onClick and keyboard handler

### Hypothesis 6: RTDB Sync Failing ⭐⭐
**Likelihood:** 20%
**Reason:** Permission rules or network issue
**Test:** Check Firebase Console, check for errors
**Fix:** Update RTDB rules, add error handling

### Hypothesis 7: Store Not Updating ⭐
**Likelihood:** 10%
**Reason:** Zustand store mutation issue
**Test:** Check objects array in React DevTools
**Fix:** Verify addObject implementation

---

## Implementation Order (After Root Cause Found)

1. **Fix the root cause** (most likely empty text issue)
2. **Add placeholder text** as immediate visible feedback
3. **Ensure edit mode triggers** reliably
4. **Add comprehensive logging** to track state flow
5. **Test with multiple users** to verify sync
6. **Handle edge cases** (zoom, pan, off-screen, etc.)
7. **Add error handling** for all async operations
8. **Polish UX** (animations, focus, keyboard shortcuts)

---

## Testing Protocol (After Fixes)

### Single User Tests
1. Click text tool → Create 5 texts → All visible
2. Double-click each → Edit mode works
3. Type text → Saves correctly
4. Drag texts → Movement works
5. Resize texts → Dimensions update
6. Delete texts → Removes correctly
7. Undo/redo (if implemented) → State consistent

### Multi-User Tests
1. User A creates text → User B sees it
2. User A edits text → User B sees updates
3. User A drags text → User B sees movement
4. User A tries to edit User B's locked text → Blocked
5. Users create texts simultaneously → No conflicts
6. User A disconnects → User B continues working

### Edge Case Tests
1. Create text at extreme zoom (0.1x, 5x)
2. Create text far from origin (x: 10000, y: 10000)
3. Create very long text (1000+ characters)
4. Create text rapidly (10 texts in 10 seconds)
5. Create text while canvas is panning
6. Create text with network offline
7. Refresh page mid-edit → State recovers

---

## Notes for AI Assistant

When debugging:
1. **Start with Layer 1** - Always check visibility first
2. **Use console.logs liberally** - Add at every step
3. **Test in isolation** - Verify each component works alone
4. **Check the simple things** - Empty text, wrong colors, off-screen position
5. **Follow the data flow** - Click → Store → RTDB → Subscribe → Render
6. **One fix at a time** - Don't change multiple things simultaneously
7. **Test after each fix** - Verify improvement before next change

Remember: **The text tool is likely working, but the text is invisible due to empty content.** Fix that first!
