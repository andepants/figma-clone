# Text Double-Click Editing with Real-Time Collaboration

**Goal:** Implement comprehensive text editing with auto-enter edit mode on creation, real-time typing sync, and proper tool switching behavior.

**Target Behavior:**
1. Click text tool (T) → Click canvas → Text created → **Immediately editable** (textarea appears, ready to type)
2. User types → Other users see typing in real-time (~100ms throttle)
3. Press Enter → Save, exit edit mode, **auto-switch to move tool**
4. Double-click existing text → Edit mode → Make changes → Enter → Save
5. All changes sync to Realtime Database with visual indicators showing who's editing

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

## Phase 1: Fix Auto-Enter Edit Mode on Text Creation (1 hour)

**Problem:** Currently, when creating text with the text tool, it switches to move tool BEFORE entering edit mode, causing the textarea to not show properly.

### 1.1 Fix Tool Switching Timing

**Issue:** In `useShapeCreation.ts:207`, `setActiveTool('move')` happens immediately after creation, but edit mode setup is async (lines 218-232).

- [ ] **1.1.1** Remove premature tool switch from text creation
  - Open `src/features/canvas-core/hooks/useShapeCreation.ts`
  - Find line 207: `setActiveTool('move');`
  - Comment out or remove this line (tool switch will happen AFTER editing completes)
  - Keep the tool switch for rectangles and circles (line 370)
  - **Success:** Text tool doesn't switch to move immediately after creation
  - **Test:** Click text tool → Click canvas → Tool stays on text until editing ends
  - **Edge Case:** Rectangles and circles should still auto-switch (they don't enter edit mode)

- [ ] **1.1.2** Add tool switch to text save handler
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - Find `handleTextSave` function (line 106)
  - After `await endEditing('main', text.id);` (line 125)
  - Add: `setActiveTool('move');` (import setActiveTool from useToolStore)
  - **Success:** Tool switches to move when saving text
  - **Test:** Create text → Type → Press Enter → Tool switches to move
  - **Edge Case:** Must import `setActiveTool` from `@/stores`

- [ ] **1.1.3** Add tool switch to text cancel handler
  - In same file, find `handleTextCancel` function (line 132)
  - After `await endEditing('main', text.id);` (line 135)
  - Add: `setActiveTool('move');`
  - **Success:** Tool switches to move when canceling text edit
  - **Test:** Create text → Press Escape → Tool switches to move
  - **Edge Case:** Tool switch should happen even if edit lock wasn't acquired

- [ ] **1.1.4** Import setActiveTool in TextShape.tsx
  - At top of file, update useToolStore import (line 13)
  - Change: `import { useToolStore, useCanvasStore } from '@/stores';`
  - To: `import { useToolStore, useCanvasStore } from '@/stores';`
  - Destructure in component: `const { activeTool, setActiveTool } = useToolStore();` (line 72)
  - **Success:** setActiveTool is available in component
  - **Test:** No TypeScript errors, tool switching works
  - **Edge Case:** Make sure activeTool is still used (don't break existing functionality)

### 1.2 Ensure Edit Mode Starts Properly

**Issue:** Text is created with empty content, but edit mode might not show textarea immediately.

- [ ] **1.2.1** Verify editingTextId is set before textarea renders
  - Open `src/features/canvas-core/hooks/useShapeCreation.ts`
  - Check async block starting at line 219
  - Verify `setEditingText(newText.id);` (line 230) is called after successful lock
  - **Success:** setEditingText is called with correct text ID
  - **Test:** Log `editingTextId` in canvasStore, should match new text ID
  - **Edge Case:** If edit lock fails, text is created but not editable (acceptable)

- [ ] **1.2.2** Add console logging for debugging edit mode entry
  - In `useShapeCreation.ts`, add log before `setEditingText`:
  - `console.log('[Text Creation] Entering edit mode for:', newText.id);`
  - In `useTextEditor.ts`, add log at start of effect (line 68):
  - `console.log('[Text Editor] Effect triggered, isEditing:', isEditing);`
  - **Success:** Logs show edit mode sequence
  - **Test:** Create text → Check console logs → Should show edit mode entry
  - **Edge Case:** Remove logs after debugging (or wrap in `if (process.env.NODE_ENV === 'development')`)

- [ ] **1.2.3** Verify textarea appears and is focused
  - Open `src/features/canvas-core/hooks/useTextEditor.ts`
  - Check lines 164-165: `textarea.focus(); textarea.select();`
  - Verify textarea is added to body (line 87)
  - Verify z-index is high enough (line 149: `zIndex: '10000'`)
  - **Success:** Textarea appears immediately after text creation
  - **Test:** Create text → Textarea should appear with blue outline, focused
  - **Edge Case:** If stage is not available, textarea positioning might be off

### 1.3 Handle Edge Cases for Text Creation

- [ ] **1.3.1** Prevent creating text while editing another text
  - Open `src/features/canvas-core/hooks/useShapeCreation.ts`
  - In `handleMouseDown` (line 146), before text creation (line 167)
  - Add check: `if (editingTextId !== null) return;` (import editingTextId from canvasStore)
  - **Success:** Can't create new text while editing existing text
  - **Test:** Create text → Start typing → Try clicking canvas with text tool → Nothing happens
  - **Edge Case:** Should also check `isCreating` for shapes to prevent conflicts

- [ ] **1.3.2** Clear selection before entering edit mode
  - In `useShapeCreation.ts`, line 164: `clearSelection();` is already called
  - Verify it happens BEFORE text creation
  - **Success:** No shape is selected when text edit mode starts
  - **Test:** Select a rectangle → Switch to text tool → Click canvas → Rectangle deselects
  - **Edge Case:** Selection should clear even if text creation fails

- [ ] **1.3.3** Handle rapid text tool clicks
  - In `useShapeCreation.ts`, add debouncing or click guard
  - Store last creation time in ref: `const lastCreationRef = useRef<number>(0);`
  - In text creation block (line 167), check:
    ```typescript
    const now = Date.now();
    if (now - lastCreationRef.current < 500) {
      console.warn('Text creation too fast, ignoring');
      return;
    }
    lastCreationRef.current = now;
    ```
  - **Success:** Can't create multiple texts rapidly (500ms cooldown)
  - **Test:** Rapidly click text tool on canvas → Only one text appears
  - **Edge Case:** Cooldown should reset when text is saved/canceled

---

## Phase 2: Real-Time Text Content Sync (1.5 hours)

**Goal:** Other users see text content updating in real-time as the editor types (throttled to ~100ms).

### 2.1 Design Real-Time Text Content Structure

- [ ] **2.1.1** Document RTDB structure for live text content
  - Create documentation comment in `textEditingService.ts`
  - Structure:
    ```
    /canvases/{canvasId}/edit-states/{textId}/
      userId: string
      username: string
      color: string
      startedAt: number
      lastUpdate: number
      liveText: string  // ← NEW: Real-time text content
    ```
  - **Success:** Structure documented with JSDoc
  - **Test:** Can reference structure in implementation
  - **Edge Case:** `liveText` is optional (not present when edit state is created, added on first keystroke)

### 2.2 Add Live Text Update to Edit Service

- [ ] **2.2.1** Create updateLiveText function
  - Open `src/lib/firebase/textEditingService.ts`
  - Add new function after `updateEditHeartbeat` (after line 139):
    ```typescript
    /**
     * Update live text content during editing
     *
     * Updates the liveText field in edit state so other users can see
     * text content as it's being typed. Should be called with throttling
     * (~100ms) to avoid excessive RTDB writes.
     *
     * @param canvasId - Canvas identifier
     * @param textId - Text object being edited
     * @param liveText - Current text content
     * @returns Promise<void>
     */
    export async function updateLiveText(
      canvasId: string,
      textId: string,
      liveText: string
    ): Promise<void> {
      try {
        const editStateRef = ref(realtimeDb, `canvases/${canvasId}/edit-states/${textId}`);

        await update(editStateRef, {
          liveText,
          lastUpdate: Date.now(), // Update heartbeat too
        });
      } catch (error) {
        console.error('Failed to update live text:', error);
        // Don't throw - live updates shouldn't break the app
      }
    }
    ```
  - **Success:** Function defined with full JSDoc
  - **Test:** Function compiles, no TypeScript errors
  - **Edge Case:** Function should be silent on errors (log but don't throw)

- [ ] **2.2.2** Create throttled version of updateLiveText
  - In same file, after `updateLiveText` function
  - Import throttle utility: `import { throttle } from '../utils';`
  - Create throttled version:
    ```typescript
    /**
     * Throttled version of updateLiveText (100ms)
     * Use this to update live text during typing to avoid excessive writes
     */
    export const throttledUpdateLiveText = throttle(updateLiveText, 100);
    ```
  - **Success:** Throttled function exported
  - **Test:** Can import throttledUpdateLiveText from module
  - **Edge Case:** 100ms throttle balances responsiveness vs RTDB load

- [ ] **2.2.3** Export new functions from firebase barrel
  - Open `src/lib/firebase/index.ts`
  - Add to exports: `updateLiveText`, `throttledUpdateLiveText`
  - Check existing exports from `textEditingService.ts`
  - **Success:** Functions available via `@/lib/firebase` import
  - **Test:** Can import in other files
  - **Edge Case:** Make sure not to accidentally remove existing exports

### 2.3 Update Textarea to Send Live Text Updates

- [ ] **2.3.1** Add live text updates to textarea input handler
  - Open `src/features/canvas-core/hooks/useTextEditor.ts`
  - Find `handleInput` function (line 185)
  - At end of function, after auto-resize logic (after line 196)
  - Add import at top: `import { throttledUpdateLiveText } from '@/lib/firebase';`
  - Add live text update:
    ```typescript
    // Update live text in RTDB so other users can see typing
    throttledUpdateLiveText('main', text.id, textarea.value);
    ```
  - **Success:** Live text updates sent while typing
  - **Test:** Type in textarea → Check RTDB → See liveText field updating
  - **Edge Case:** Throttle ensures max 10 writes/second (100ms throttle)

- [ ] **2.3.2** Test throttled updates don't cause lag
  - Open browser console while editing text
  - Monitor Network tab for RTDB writes
  - Type rapidly in textarea (100+ characters)
  - **Success:** Typing feels responsive, writes are throttled
  - **Test:** Network tab shows ~10 writes/second max
  - **Edge Case:** If lag occurs, increase throttle to 150ms or 200ms

### 2.4 Subscribe to Live Text Updates

- [ ] **2.4.1** Update EditState interface to include liveText
  - Open `src/lib/firebase/textEditingService.ts`
  - Find `EditState` interface (line 21)
  - Add optional property:
    ```typescript
    export interface EditState {
      userId: string;
      username: string;
      color: string;
      startedAt: number;
      lastUpdate: number;
      liveText?: string; // ← NEW: Live text content (optional)
    }
    ```
  - **Success:** Interface updated
  - **Test:** No TypeScript errors
  - **Edge Case:** Optional field (not present when edit state is first created)

- [ ] **2.4.2** Create useEditStates hook
  - Create new file: `src/features/collaboration/hooks/useEditStates.ts`
  - Import dependencies:
    ```typescript
    import { useEffect, useState } from 'react';
    import { subscribeToEditStates } from '@/lib/firebase';
    import type { EditStateMap } from '@/lib/firebase/textEditingService';
    ```
  - Create hook:
    ```typescript
    /**
     * useEditStates Hook
     *
     * Subscribes to real-time edit states for a canvas.
     * Returns a map of textId -> EditState showing who is editing what.
     *
     * @param canvasId - Canvas identifier
     * @returns EditStateMap - Map of text IDs to edit states
     */
    export function useEditStates(canvasId: string): EditStateMap {
      const [editStates, setEditStates] = useState<EditStateMap>({});

      useEffect(() => {
        const unsubscribe = subscribeToEditStates(canvasId, (states) => {
          setEditStates(states);
        });

        return unsubscribe;
      }, [canvasId]);

      return editStates;
    }
    ```
  - **Success:** Hook compiles and exports
  - **Test:** Can import and use in components
  - **Edge Case:** Cleanup unsubscribe on unmount

- [ ] **2.4.3** Export hook from collaboration barrel
  - Open `src/features/collaboration/hooks/index.ts`
  - Add: `export { useEditStates } from './useEditStates';`
  - **Success:** Hook available from `@/features/collaboration/hooks`
  - **Test:** Import works in other files
  - **Edge Case:** Don't break existing exports

### 2.5 Display Live Text Content in TextShape

- [ ] **2.5.1** Pass edit state to TextShape component
  - Open `src/features/canvas-core/components/CanvasStage.tsx`
  - Import useEditStates: `import { useEditStates } from '@/features/collaboration/hooks';`
  - Add hook near other subscriptions:
    ```typescript
    const editStates = useEditStates('main');
    ```
  - Find where TextShape is rendered (search for `<TextShape`)
  - Add prop to TextShape:
    ```tsx
    <TextShape
      text={text}
      isSelected={selectedId === text.id}
      onSelect={() => selectObject(text.id)}
      remoteDragState={dragStates[text.id]}
      editState={editStates[text.id]} // ← NEW
    />
    ```
  - **Success:** Edit state passed to TextShape
  - **Test:** No TypeScript errors (need to update TextShape props next)
  - **Edge Case:** editState is undefined when text is not being edited (normal)

- [ ] **2.5.2** Update TextShape props interface
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - Find `TextShapeProps` interface (line 34)
  - Add import: `import type { EditState } from '@/lib/firebase/textEditingService';`
  - Add optional prop:
    ```typescript
    /** Optional edit state from another user (for live text preview) */
    editState?: EditState;
    ```
  - Update component signature (line 66):
    ```typescript
    export const TextShape = memo(function TextShape({
      text,
      isSelected,
      onSelect,
      remoteDragState,
      editState // ← NEW
    }: TextShapeProps) {
    ```
  - **Success:** TextShape accepts editState prop
  - **Test:** No TypeScript errors
  - **Edge Case:** editState is optional (undefined most of the time)

- [ ] **2.5.3** Display live text when being edited by another user
  - In TextShape component, find where text content is rendered
  - Find the `<KonvaText>` component (line 463)
  - Find the `text` prop (line 469): `text={getTransformedText()}`
  - Create helper to determine display text:
    ```typescript
    /**
     * Get the text content to display
     * If another user is editing, show their live text (with indicator)
     * Otherwise show the persisted text
     */
    const getDisplayText = () => {
      // If being edited by another user and we have live text
      if (editState && editState.userId !== currentUser?.uid && editState.liveText !== undefined) {
        return editState.liveText; // Show live text from other user
      }

      // Otherwise show persisted text (transformed)
      return getTransformedText();
    };
    ```
  - Update text prop: `text={getDisplayText()}`
  - **Success:** Live text from other users is displayed
  - **Test:** User A edits text → User B sees text updating in real-time
  - **Edge Case:** Only show live text if it's from another user (not self)

### 2.6 Add Visual Indicator for Remote Editing

- [ ] **2.6.1** Show colored border when text is being edited remotely
  - In TextShape component, find `getStroke()` function (line 388)
  - Add condition at the start:
    ```typescript
    const getStroke = () => {
      // Remote editing: Show editor's color with dashed stroke
      if (editState && editState.userId !== currentUser?.uid) {
        return editState.color;
      }

      if (isRemoteDragging) return remoteDragState.color;
      // ... rest of existing logic
    };
    ```
  - **Success:** Text shows colored border when being edited
  - **Test:** User A edits text → User B sees text with User A's color border
  - **Edge Case:** Border should be different style than drag border

- [ ] **2.6.2** Add dashed stroke style for remote editing
  - Find `<KonvaText>` component props (line 463)
  - After stroke/strokeWidth props (around line 491)
  - Add new props:
    ```typescript
    // Stroke style (dashed when being edited remotely)
    dash={editState && editState.userId !== currentUser?.uid ? [5, 5] : undefined}
    ```
  - **Success:** Remote editing shows dashed border
  - **Test:** Border is dashed vs solid (drag is solid)
  - **Edge Case:** Only dashed when editState exists and is from another user

- [ ] **2.6.3** Render username label when text is being edited remotely
  - In TextShape component, after `<KonvaText>` component (around line 509)
  - Before `<ResizeHandles>` component
  - Add label rendering:
    ```tsx
    {/* Editing indicator - show username label when being edited by another user */}
    {editState && editState.userId !== currentUser?.uid && (
      <Label
        x={displayX}
        y={displayY - 25} // Above text
        opacity={0.9}
      >
        <Tag
          fill={editState.color}
          pointerDirection="down"
          pointerWidth={6}
          pointerHeight={6}
          cornerRadius={3}
        />
        <Text
          text={`${editState.username} is editing...`}
          fontSize={12}
          fontFamily="Inter"
          fill="#ffffff"
          padding={6}
        />
      </Label>
    )}
    ```
  - Import Label, Tag, Text from 'react-konva' at top
  - **Success:** Username label appears above text when being edited
  - **Test:** User A edits → User B sees "User A is editing..." label
  - **Edge Case:** Label should not overlap with text content

---

## Phase 3: Edge Cases and Polish (1 hour)

### 3.1 Handle Concurrent Editing Attempts

- [ ] **3.1.1** Show toast when text is locked by another user
  - Install sonner if not already: Check if `import { toast } from 'sonner'` works
  - If not: `npx shadcn@latest add sonner` (already installed in Phase 1.10.5)
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - Find `handleDoubleClick` function (line 224)
  - Replace console.log at line 232:
    ```typescript
    toast.error(`${lockState.username} is editing this text`, {
      description: 'Wait for them to finish or try again later',
      duration: 3000,
    });
    ```
  - Replace console.log at line 244:
    ```typescript
    toast.error('This text is being edited by another user', {
      duration: 3000,
    });
    ```
  - **Success:** User sees toast when text is locked
  - **Test:** User A edits text → User B double-clicks same text → Toast appears
  - **Edge Case:** Toast should be dismissible

- [ ] **3.1.2** Disable double-click when text is being edited remotely
  - In TextShape, find `handleDoubleClick` function (line 224)
  - At the start of function, add check:
    ```typescript
    // Can't edit if another user is already editing
    if (editState && editState.userId !== currentUser?.uid) {
      toast.warning(`${editState.username} is editing this text`, {
        description: 'Wait for them to finish',
        duration: 2000,
      });
      return;
    }
    ```
  - **Success:** Can't enter edit mode on text being edited remotely
  - **Test:** User A edits text → User B tries double-click → Toast appears, no edit mode
  - **Edge Case:** Check should happen before acquiring lock

### 3.2 Handle Empty Text Deletion

- [ ] **3.2.1** Verify empty text deletion works
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - Check `handleTextSave` function (line 106)
  - Verify lines 110-116 handle empty text deletion
  - **Success:** Empty text is deleted after saving
  - **Test:** Create text → Press Enter immediately → Text is deleted
  - **Edge Case:** Text should be deleted from both store and RTDB

- [ ] **3.2.2** Show confirmation before deleting text with content
  - NOT NEEDED: Current behavior is fine (pressing Enter saves, deletion only happens for empty text)
  - **Success:** Existing behavior is correct
  - **Test:** Create text → Type content → Press Enter → Text is saved
  - **Edge Case:** Only empty text is deleted

### 3.3 Handle Network Disconnection During Editing

- [ ] **3.3.1** Verify onDisconnect cleanup works
  - Open `src/lib/firebase/textEditingService.ts`
  - Check `startEditing` function (line 56)
  - Verify line 95: `await onDisconnect(editStateRef).remove();`
  - **Success:** Edit lock is cleared on disconnect
  - **Test:** Start editing → Disconnect network → Reconnect → Check RTDB (edit state should be gone)
  - **Edge Case:** onDisconnect fires on browser close, tab close, network loss

- [ ] **3.3.2** Test offline editing and sync on reconnect
  - Enable Firebase offline persistence (should already be enabled)
  - Start editing text while online
  - Disconnect network
  - Continue typing (changes are local)
  - Reconnect network
  - **Success:** Changes sync to RTDB when reconnected
  - **Test:** Offline changes appear in RTDB after reconnect
  - **Edge Case:** Long offline periods (>30s) might cause stale state cleanup

### 3.4 Performance Optimization

- [ ] **3.4.1** Verify React.memo on TextShape
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - Check line 66: Component is wrapped in `memo`
  - **Success:** TextShape only re-renders when props change
  - **Test:** Edit one text → Other texts don't re-render (use React DevTools Profiler)
  - **Edge Case:** memo should compare editState prop correctly

- [ ] **3.4.2** Test performance with 20 text objects
  - Create 20 text shapes on canvas
  - Edit one text, type rapidly
  - Check FPS in Chrome DevTools Performance tab
  - **Success:** 60 FPS maintained during editing
  - **Test:** Performance profiler shows minimal re-renders
  - **Edge Case:** Live text updates shouldn't cause all texts to re-render

- [ ] **3.4.3** Verify throttle prevents RTDB overload
  - Open RTDB console while editing text
  - Type rapidly (100+ characters in <10 seconds)
  - Watch write operations in RTDB
  - **Success:** Max ~10 writes per second (100ms throttle)
  - **Test:** RTDB doesn't show excessive writes
  - **Edge Case:** Throttle should not cause noticeable lag

### 3.5 Accessibility and UX Polish

- [ ] **3.5.1** Add keyboard shortcut to enter text edit mode
  - Open `src/features/toolbar/hooks/useToolShortcuts.ts`
  - Find 'Enter' key handler for selected text
  - If doesn't exist, add:
    ```typescript
    // Enter key on selected text: Start editing
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const { selectedId, objects, editingTextId, setEditingText } = useCanvasStore.getState();

      // Can only edit if no text is currently being edited
      if (editingTextId !== null) return;

      if (selectedId) {
        const selected = objects.find(obj => obj.id === selectedId);
        if (selected && selected.type === 'text') {
          // Double-click behavior without actual double-click
          // Component handles edit lock and edit mode entry
          // For now, just trigger via event
          console.log('Enter key on text - use double-click instead');
        }
      }
    }
    ```
  - **Note:** Enter key to edit is complex (requires triggering component logic). Can be Phase 4 if needed.
  - **Success:** Keyboard shortcut documented as future enhancement
  - **Test:** Can still use double-click to edit
  - **Edge Case:** Might conflict with other Enter key handlers

- [ ] **3.5.2** Add placeholder text for empty text shapes
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - In `getDisplayText()` function, add check:
    ```typescript
    const getDisplayText = () => {
      // If being edited by another user and we have live text
      if (editState && editState.userId !== currentUser?.uid && editState.liveText !== undefined) {
        return editState.liveText;
      }

      // If text is empty and not being edited, show placeholder
      const transformedText = getTransformedText();
      if (!transformedText.trim() && !isEditing) {
        return 'Double-click to edit'; // Placeholder
      }

      return transformedText;
    };
    ```
  - **Success:** Empty text shows "Double-click to edit"
  - **Test:** Create text → Cancel before typing → See placeholder
  - **Edge Case:** Placeholder should only show when not editing

- [ ] **3.5.3** Add fade-in animation for editing indicator
  - In TextShape, update Label opacity animation
  - Use Konva Tween or CSS transition:
    ```tsx
    <Label
      x={displayX}
      y={displayY - 25}
      opacity={0.9} // Could animate from 0 to 0.9
    >
    ```
  - Create fade-in effect with useEffect:
    ```typescript
    useEffect(() => {
      if (editState && editState.userId !== currentUser?.uid) {
        // Label just appeared, could trigger animation
        // For now, simple opacity is fine
      }
    }, [editState?.userId]);
    ```
  - **Success:** Editing indicator appears smoothly
  - **Test:** Visual check - no jarring appearance
  - **Edge Case:** Animation should be subtle (Figma-style)

---

## Phase 4: Testing and Validation (1 hour)

### 4.1 Single-User Testing

- [ ] **4.1.1** Test text creation flow
  - Click text tool (T key)
  - Click on canvas
  - **Expected:** Text appears, textarea shows immediately, blue outline visible
  - Type "Hello World"
  - Press Enter
  - **Expected:** Text saved, tool switches to move
  - **Success:** Complete flow works without errors
  - **Test:** Repeat 5 times
  - **Edge Case:** Works at different zoom levels, pan positions

- [ ] **4.1.2** Test double-click editing
  - Create text: "Test Text"
  - Switch to move tool
  - Double-click text
  - **Expected:** Textarea appears with text selected
  - Change to "Edited Text"
  - Press Enter
  - **Expected:** Text saved, move tool still active
  - **Success:** Double-click flow works
  - **Test:** Repeat on multiple text objects
  - **Edge Case:** Works on text at edge of canvas

- [ ] **4.1.3** Test Escape key cancel
  - Create new text
  - Type "Cancel Me"
  - Press Escape
  - **Expected:** Text appears empty or deleted, tool switches to move
  - **Success:** Cancel works correctly
  - **Test:** Try cancel at different stages (empty text, partial text)
  - **Edge Case:** Empty text should be deleted on cancel

- [ ] **4.1.4** Test tool switching while editing
  - Create text, start typing
  - Press R key (rectangle tool) mid-edit
  - **Expected:** Text auto-saves, tool switches to rectangle
  - **Success:** Tool switching triggers auto-save
  - **Test:** Try switching to all tools (V, R, C, T)
  - **Edge Case:** Changes should persist even if tool changes

### 4.2 Multi-User Testing

- [ ] **4.2.1** Test concurrent text creation
  - Open 2 browser windows (User A, User B)
  - User A: Create text at (100, 100)
  - User B: Create text at (200, 200)
  - **Expected:** Both texts appear in both windows within 500ms
  - **Success:** No conflicts, both texts persist
  - **Test:** Create 5 texts from each user
  - **Edge Case:** Texts created at same time should both survive

- [ ] **4.2.2** Test live typing visibility
  - User A: Create text, start typing "Hello World"
  - User B: Watch canvas
  - **Expected:** User B sees text appearing letter by letter (~100ms delay)
  - **Expected:** User B sees colored dashed border on text
  - **Expected:** User B sees "User A is editing..." label above text
  - **Success:** Real-time updates work smoothly
  - **Test:** Type 100+ characters, verify all appear
  - **Edge Case:** Fast typing should be smooth (throttled to 100ms)

- [ ] **4.2.3** Test edit locking
  - User A: Start editing text "Locked"
  - User B: Try double-clicking same text
  - **Expected:** User B sees toast: "User A is editing this text"
  - **Expected:** User B cannot enter edit mode
  - User A: Press Enter (finish editing)
  - User B: Try double-clicking again
  - **Expected:** User B can now edit
  - **Success:** Edit locking prevents conflicts
  - **Test:** Try with 3 users editing different texts
  - **Edge Case:** Lock should release within 3 seconds of User A closing tab

- [ ] **4.2.4** Test disconnect during editing
  - User A: Start editing text
  - User A: Disconnect network (Chrome DevTools → Network → Offline)
  - User A: Continue typing locally
  - User B: Watch text (should stop updating)
  - User A: Wait 30 seconds (stale state timeout)
  - User B: Try double-clicking text
  - **Expected:** User B can take over editing (stale state cleanup)
  - User A: Reconnect network
  - **Expected:** User A's changes sync to RTDB
  - **Success:** Disconnect handling works
  - **Test:** Try disconnect at various stages (just started, mid-typing, before save)
  - **Edge Case:** Long disconnect (>30s) should allow lock takeover

### 4.3 Edge Case Testing

- [ ] **4.3.1** Test empty text deletion
  - Create text
  - Press Enter immediately (no typing)
  - **Expected:** Text is deleted, not saved as empty
  - **Success:** Empty texts don't clutter canvas
  - **Test:** Try with whitespace only ("   ") - should also delete
  - **Edge Case:** Text with only spaces should be considered empty

- [ ] **4.3.2** Test rapid tool switching
  - Press T → Click → Type 1 character → Press R → Press T → Click → Press V
  - **Expected:** No errors, all tools work correctly
  - **Expected:** Partial text is saved
  - **Success:** Rapid tool switching doesn't break state
  - **Test:** Switch between all 4 tools (Move, Rectangle, Circle, Text)
  - **Edge Case:** Tool state should always be consistent

- [ ] **4.3.3** Test editing at extreme zoom levels
  - Zoom out to 10% (0.1x)
  - Create text at (1000, 1000)
  - Edit text
  - **Expected:** Textarea appears at correct position (even if offscreen)
  - **Expected:** Can type normally
  - Zoom in to 500% (5.0x)
  - Edit text
  - **Expected:** Textarea scales correctly, typing works
  - **Success:** Editing works at all zoom levels
  - **Test:** Try zoom levels: 0.1x, 0.5x, 1.0x, 2.0x, 5.0x
  - **Edge Case:** Textarea positioning accounts for stage scale

- [ ] **4.3.4** Test editing while panning
  - Create text
  - Start editing
  - While typing, pan canvas with other hand (mouse drag)
  - **Expected:** ??? This might break (textarea doesn't follow pan)
  - **Success:** Either textarea follows pan, or editing is disabled during pan
  - **Test:** Try panning while textarea is open
  - **Edge Case:** May need to disable pan during editing OR update textarea position on pan

### 4.4 Performance Testing

- [ ] **4.4.1** Test with 50 text objects
  - Create 50 text objects on canvas
  - Edit one text, type rapidly
  - Check FPS in Chrome DevTools
  - **Expected:** 60 FPS maintained
  - **Success:** No lag during editing
  - **Test:** Monitor re-renders in React DevTools Profiler
  - **Edge Case:** Only editing text should re-render, not all texts

- [ ] **4.4.2** Measure RTDB write frequency
  - Start editing text
  - Type continuously for 10 seconds (~100 characters)
  - Check RTDB console for write count
  - **Expected:** ~100 writes (10 writes/second due to 100ms throttle)
  - **Success:** Throttling prevents excessive writes
  - **Test:** Count actual writes in Firebase console
  - **Edge Case:** Throttle should batch rapid keystrokes

- [ ] **4.4.3** Test memory leaks
  - Create and delete 20 texts
  - Edit and cancel 10 texts
  - Open Chrome DevTools → Memory tab
  - Take heap snapshot
  - **Expected:** No detached DOM nodes, stable memory
  - **Success:** No memory leaks after repeated operations
  - **Test:** Compare heap snapshots before/after
  - **Edge Case:** Textarea elements should be fully removed on cleanup

---

## Phase 5: Documentation and Cleanup (30 minutes)

### 5.1 Code Documentation

- [ ] **5.1.1** Add JSDoc comments to new functions
  - Check all functions in modified files have JSDoc
  - Functions to document:
    - `updateLiveText` in `textEditingService.ts`
    - `throttledUpdateLiveText` in `textEditingService.ts`
    - `useEditStates` in `useEditStates.ts`
    - `getDisplayText` in `TextShape.tsx`
  - **Success:** All functions have JSDoc with @param, @returns, @example
  - **Test:** Hover over function names in VS Code, see documentation
  - **Edge Case:** Examples should be practical and accurate

- [ ] **5.1.2** Update TextShape.tsx file header
  - Open `src/features/canvas-core/shapes/TextShape.tsx`
  - Update file header comment (line 1-7)
  - Add note about real-time editing:
    ```
    * Renders a text shape on the canvas with selection, drag, and edit capabilities.
    * Supports real-time collaborative editing with live text sync and visual indicators.
    * Text boxes are fixed-dimension containers where text wraps/clips within bounds.
    ```
  - **Success:** File header reflects new capabilities
  - **Test:** File header is clear and accurate

- [ ] **5.1.3** Document RTDB structure in architecture docs
  - Open or create `_docs/architecture/realtime-database.md`
  - Document edit-states structure:
    ```markdown
    ### Edit States Structure
    `/canvases/{canvasId}/edit-states/{textId}/`
    - `userId: string` - User ID of editor
    - `username: string` - Display name of editor
    - `color: string` - User's assigned color
    - `startedAt: number` - Timestamp when editing started
    - `lastUpdate: number` - Timestamp of last update (heartbeat)
    - `liveText?: string` - Current text content (updated while typing, throttled to 100ms)

    **Behavior:**
    - Edit lock is first-come-first-served
    - Lock expires after 30 seconds of inactivity (stale state cleanup)
    - Lock is automatically released on disconnect (onDisconnect handler)
    - Live text updates are throttled to 100ms to prevent RTDB overload
    ```
  - **Success:** RTDB structure fully documented
  - **Test:** Another developer can understand structure from docs

### 5.2 Remove Debug Logging

- [ ] **5.2.1** Remove or conditionally disable console.logs
  - Search for console.log statements added during implementation
  - Files to check:
    - `useShapeCreation.ts`
    - `useTextEditor.ts`
    - `TextShape.tsx`
  - Either remove logs or wrap in:
    ```typescript
    if (process.env.NODE_ENV === 'development') {
      console.log('[Debug] ...');
    }
    ```
  - **Success:** No console logs in production
  - **Test:** Build for production, check console is clean
  - **Edge Case:** Keep error logs (console.error)

### 5.3 Final Verification

- [ ] **5.3.1** Run TypeScript build
  - Run `npm run build`
  - **Expected:** No TypeScript errors
  - **Success:** Build completes successfully
  - **Test:** Check dist/ folder is created
  - **Edge Case:** All imports should resolve correctly

- [ ] **5.3.2** Test production build locally
  - Run `npm run preview`
  - Test full text editing flow in production build
  - **Expected:** All features work in production
  - **Success:** Production build identical to dev
  - **Test:** Test all Phase 4 scenarios in preview

- [ ] **5.3.3** Deploy to Firebase Hosting
  - Run `firebase deploy --only hosting`
  - Visit deployed URL
  - Test multi-user editing with 2 different devices
  - **Expected:** Real-time collaboration works in production
  - **Success:** Deployed app fully functional
  - **Test:** Test edit locking between 2 devices

---

## Success Criteria

Phase is complete when ALL of the following are verified:

### Functional Requirements
- [ ] Text tool creates text and immediately enters edit mode (textarea appears, focused)
- [ ] Typing in textarea updates local canvas instantly
- [ ] Pressing Enter saves text and switches to move tool
- [ ] Empty text is deleted (not saved)
- [ ] Double-clicking existing text enters edit mode
- [ ] Pressing Escape cancels editing
- [ ] Tool switching auto-saves text
- [ ] Other users see text content updating in real-time (~100ms delay)
- [ ] Other users see colored dashed border on text being edited
- [ ] Other users see "Username is editing..." label above text
- [ ] Edit locking prevents concurrent editing
- [ ] Toast notifications show when text is locked
- [ ] Disconnect cleanup releases edit locks automatically

### Performance Requirements
- [ ] 60 FPS maintained during text editing
- [ ] Live text updates throttled to ~10 writes/second (100ms throttle)
- [ ] No lag when typing rapidly
- [ ] React.memo prevents unnecessary re-renders
- [ ] RTDB doesn't show excessive writes
- [ ] No memory leaks after repeated text operations

### Multi-User Requirements
- [ ] User A creates text → User B sees it within 500ms
- [ ] User A types → User B sees letters appearing in real-time
- [ ] User A edits text → User B sees colored border + username label
- [ ] User A has edit lock → User B sees toast when trying to edit
- [ ] User A finishes editing → User B can immediately take over
- [ ] User A disconnects → User B can take over after 30 seconds

### Edge Cases
- [ ] Empty text is deleted on save
- [ ] Whitespace-only text is deleted on save
- [ ] Rapid tool switching doesn't break state
- [ ] Editing works at all zoom levels (0.1x to 5.0x)
- [ ] Placeholder text shows on empty text objects
- [ ] Concurrent text creation works (no conflicts)
- [ ] Stale edit states are cleaned up after 30 seconds
- [ ] onDisconnect releases locks on browser close

### Code Quality
- [ ] All functions have JSDoc comments
- [ ] File headers updated with new capabilities
- [ ] RTDB structure documented in architecture docs
- [ ] No console.log in production builds
- [ ] TypeScript build completes with no errors
- [ ] Production build tested and deployed
- [ ] All imports use @ alias

---

## Implementation Notes

### Tool Switching Timing
**Critical Fix:** Tool switch must happen AFTER editing completes, not immediately after text creation.

Before:
```typescript
// useShapeCreation.ts:207
setActiveTool('move'); // ❌ Too early!

// Async edit lock acquisition (lines 219-232)
await startEditing(...);
setEditingText(newText.id);
```

After:
```typescript
// useShapeCreation.ts:207 - REMOVE THIS LINE

// TextShape.tsx handleTextSave/handleTextCancel
await endEditing('main', text.id);
setActiveTool('move'); // ✅ After editing ends
```

### Real-Time Text Sync Architecture
```
User types → Textarea onChange
           → Local state update (instant)
           → throttledUpdateLiveText('main', textId, value) [100ms throttle]
           → RTDB /edit-states/{textId}/liveText updated
           → Other users subscribed via useEditStates
           → TextShape gets editState prop
           → getDisplayText() shows liveText from editState
           → Konva Text re-renders with new content
```

### Edit State Lifecycle
```
1. User double-clicks text (or text is created)
2. startEditing() attempts lock:
   - Check existing lock (return false if locked by another user)
   - Set edit state in RTDB
   - Configure onDisconnect() cleanup
3. While editing:
   - Every 100ms: throttledUpdateLiveText() updates liveText field
   - Every keystroke: updateEditHeartbeat() updates lastUpdate
4. On Enter/Escape/Tool Switch:
   - endEditing() clears edit state
   - setActiveTool('move')
5. On disconnect:
   - onDisconnect() automatically removes edit state
```

### Coordinate Transform for Textarea
Textarea positioning must account for:
- Stage position (stageBox.left, stageBox.top)
- Stage scale (stage.scaleX())
- Text position (textNode.absolutePosition())
- Text dimensions (width, height)

Formula:
```typescript
const areaPosition = {
  x: stageBox.left + textPosition.x * stageScale,
  y: stageBox.top + textPosition.y * stageScale,
};
```

### Throttle vs Debounce
- **Throttle (100ms):** Live text updates (ensures consistent update rate)
- **Debounce (500ms):** Final object persistence (waits for typing to stop)
- Throttle preferred for real-time UX (immediate feedback, controlled rate)

---

## Rollback Plan

If critical bugs are found after deployment:

1. **Immediate Rollback:**
   ```bash
   git revert HEAD
   npm run build
   firebase deploy --only hosting
   ```

2. **Disable Real-Time Text Sync:**
   - Comment out `throttledUpdateLiveText` call in `useTextEditor.ts`
   - Users can still edit, but without live sync

3. **Disable Edit Locking:**
   - Comment out lock checks in `TextShape.tsx` (lines 229-247)
   - Users can edit concurrently (last-write-wins)

4. **Revert Tool Switching:**
   - Restore `setActiveTool('move')` in `useShapeCreation.ts:207`
   - Remove from `handleTextSave` and `handleTextCancel`

---

## Future Enhancements (Phase 4+)

1. **Rich Text Editing:**
   - Bold, italic, underline buttons
   - Font size/family picker
   - Color picker for text color

2. **Text Formatting Toolbar:**
   - Show formatting toolbar when text is selected
   - Position above/below text (context menu style)

3. **Auto-Resize Text Box:**
   - Expand height as user types (vertical growth)
   - Shrink when lines are deleted

4. **Markdown Support:**
   - Parse markdown in text content
   - Render formatted text on canvas

5. **Text Templates:**
   - Predefined text styles (Heading 1, Body, Caption)
   - Quick apply via keyboard shortcut

6. **Voice-to-Text:**
   - Web Speech API integration
   - Voice input for text content

7. **Text Search:**
   - Search all text objects on canvas
   - Highlight matches, navigate between them

---

## Time Estimates

- **Phase 1:** Fix Auto-Enter Edit Mode (1 hour)
- **Phase 2:** Real-Time Text Content Sync (1.5 hours)
- **Phase 3:** Edge Cases and Polish (1 hour)
- **Phase 4:** Testing and Validation (1 hour)
- **Phase 5:** Documentation and Cleanup (30 minutes)

**Total:** ~5 hours

**Contingency:** +1 hour for unexpected issues

**Realistic Total:** 6 hours

---

## Git Commit Strategy

Commit after each phase for easy rollback:

1. `feat(text): Fix auto-enter edit mode on text creation`
2. `feat(text): Add real-time text content sync with edit indicators`
3. `feat(text): Add edge case handling and UX polish`
4. `test(text): Validate multi-user text editing flows`
5. `docs(text): Document text editing architecture and RTDB structure`

Final commit:
```
feat: Complete text double-click editing with real-time collaboration

- Auto-enter edit mode when creating text with text tool
- Real-time text content sync while typing (100ms throttle)
- Visual indicators (colored border + username label) for remote editing
- Edit locking prevents concurrent editing conflicts
- Auto-switch to move tool after text creation/editing
- Toast notifications for locked texts
- Comprehensive edge case handling (empty text deletion, disconnect cleanup)
- Performance optimizations (React.memo, throttling, minimal re-renders)

Closes #[issue-number]
```
