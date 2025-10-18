# AI Chat Panel Redesign - Integrated Right Sidebar

**Status:** ✅ COMPLETED
**Actual Time:** ~3 hours
**Dependencies:** Existing PropertiesPanel, AIChatPanel, CanvasPage
**Goal:** Integrate AI chat into right sidebar with resizable split, collapsible chat, and proper scrolling
**Completed:** 2025-10-15

---

## Phase 0: Research & Planning

### 0.1 Current Architecture Analysis
- [ ] **Action:** Document current component structure
  - **Why:** Understand what needs to change
  - **Current Structure:**
    - `PropertiesPanel`: Fixed right sidebar, 240px wide, full height
    - `AIChatPanel`: Fixed bottom-right, floating, independent positioning
    - Both rendered separately in CanvasPage
  - **Key Files:**
    - `src/pages/CanvasPage.tsx:431` - PropertiesPanel render
    - `src/pages/CanvasPage.tsx:434` - AIChatPanel render
    - `src/features/properties-panel/components/PropertiesPanel.tsx`
    - `src/features/ai-agent/components/AIChatPanel.tsx`

### 0.2 Technical Decisions
- [ ] **Action:** Define new architecture
  - **Why:** Clear implementation strategy
  - **Decisions:**
    1. **Container:** Create `RightSidebar.tsx` as parent container
    2. **Width:** Keep 240px (matches current properties panel)
    3. **Split:** Use CSS flexbox with resizable divider
    4. **Default Heights:** Properties 60%, AI 40%
    5. **Min Heights:** Properties 200px, AI 150px (input + 1 message)
    6. **Resize Handle:** 4px draggable divider between sections
    7. **Collapse State:** Store in `useUIStore` (persist across sessions)
    8. **Scroll:** Each section independently scrollable
  - **Success Criteria:**
    - [ ] Architecture documented
    - [ ] Component hierarchy defined
    - [ ] State management plan clear

### 0.3 UI/UX Pattern Research
- [ ] **Action:** Review similar resizable panel implementations
  - **Why:** Follow best practices for resize interactions
  - **Patterns:**
    - Double-click divider to reset to default (60/40)
    - Drag handle shows hover state (blue highlight)
    - Cursor changes to `ns-resize` on handle
    - Collapse button in AI header (minimize to input-only)
    - Expand button when collapsed (restore to previous height)
  - **Accessibility:**
    - Handle keyboard control (arrow keys to resize)
    - ARIA labels for divider and buttons
    - Focus indicators

---

## Phase 1: Foundation (1.5 hours)

### 1.1 Store Updates

#### 1.1.1 Add UI State for Sidebar Layout
- [ ] **Action:** Extend `useUIStore` with AI panel state
  - **Why:** Persist resize and collapse state across sessions
  - **Files Modified:**
    - Update: `src/stores/uiStore.ts`
  - **Implementation Details:**
```typescript
interface UIState {
  // ... existing state
  aiPanelHeight: number; // Percentage (0-100)
  isAIChatCollapsed: boolean;
  setAIPanelHeight: (height: number) => void;
  toggleAIChatCollapse: () => void;
}

// Default values
aiPanelHeight: 40, // 40% of sidebar
isAIChatCollapsed: false,
```
  - **Success Criteria:**
    - [ ] State added to UIStore interface
    - [ ] Actions created for height and collapse
    - [ ] Default values set
    - [ ] JSDoc comments added
  - **Tests:**
    1. Open browser console
    2. Run: `useUIStore.getState().setAIPanelHeight(50)`
    3. Verify: `useUIStore.getState().aiPanelHeight === 50`
    4. Run: `useUIStore.getState().toggleAIChatCollapse()`
    5. Verify: `useUIStore.getState().isAIChatCollapsed === true`
  - **Edge Cases:**
    - ⚠️ Height > 100: Clamp to 100
    - ⚠️ Height < 0: Clamp to 0
    - ⚠️ Invalid numbers: Default to 40

### 1.2 Create Container Component

#### 1.2.1 Create RightSidebar Component
- [ ] **Action:** Create new container component for right sidebar
  - **Why:** Single parent to manage properties + AI layout
  - **Files Modified:**
    - Create: `src/features/right-sidebar/components/RightSidebar.tsx`
    - Create: `src/features/right-sidebar/components/index.ts`
    - Create: `src/features/right-sidebar/index.ts`
  - **Implementation Details:**
```typescript
/**
 * RightSidebar Component
 *
 * Unified right sidebar containing properties panel and AI chat.
 * Supports resizable split between sections.
 */
export function RightSidebar() {
  const { aiPanelHeight, setAIPanelHeight, isAIChatCollapsed } = useUIStore();

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[240px] bg-white border-l border-gray-200 flex flex-col">
      {/* Properties Section - grows/shrinks */}
      <div
        className="flex-shrink-0 overflow-y-auto"
        style={{ height: `${100 - aiPanelHeight}%` }}
      >
        <PropertiesPanel />
      </div>

      {/* Resize Handle */}
      <ResizeHandle />

      {/* AI Chat Section - grows/shrinks */}
      <div
        className="flex-shrink-0 overflow-y-auto border-t border-gray-200"
        style={{ height: `${aiPanelHeight}%` }}
      >
        <AISection />
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Component created with proper JSDoc
    - [ ] Uses flexbox layout
    - [ ] Reads state from UIStore
    - [ ] Renders properties and AI sections
    - [ ] Exported from index files
  - **Tests:**
    1. Import: `import { RightSidebar } from '@/features/right-sidebar'`
    2. Mount component in test page
    3. Verify: Properties section visible at top
    4. Verify: AI section visible at bottom
    5. Verify: Border divider between sections
  - **Edge Cases:**
    - ⚠️ No selection: Properties shows empty state
    - ⚠️ Collapsed AI: AI section height adjusts

---

## Phase 2: Resize Functionality (1.5 hours)

### 2.1 Resize Handle Component

#### 2.1.1 Create ResizeHandle Component
- [ ] **Action:** Build draggable divider between properties and AI
  - **Why:** Allow users to adjust space allocation
  - **Files Modified:**
    - Create: `src/features/right-sidebar/components/ResizeHandle.tsx`
    - Update: `src/features/right-sidebar/components/index.ts`
  - **Implementation Details:**
```typescript
/**
 * ResizeHandle Component
 *
 * Draggable divider between properties and AI sections.
 * Supports mouse drag, double-click reset, and keyboard control.
 */
export function ResizeHandle() {
  const [isDragging, setIsDragging] = useState(false);
  const { setAIPanelHeight } = useUIStore();
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const sidebar = document.querySelector('[data-sidebar]');
    if (!sidebar) return;

    const rect = sidebar.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.min(80, Math.max(20, (1 - y / rect.height) * 100));

    setAIPanelHeight(percentage);
  }, [isDragging, setAIPanelHeight]);

  const handleDoubleClick = () => {
    setAIPanelHeight(40); // Reset to default
  };

  return (
    <div
      ref={handleRef}
      data-resize-handle
      className={cn(
        "h-1 bg-gray-200 hover:bg-blue-500 cursor-ns-resize transition-colors",
        isDragging && "bg-blue-500"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="separator"
      aria-label="Resize properties and AI sections"
      aria-valuenow={100 - aiPanelHeight}
      tabIndex={0}
    />
  );
}
```
  - **Success Criteria:**
    - [ ] Handle renders as 4px divider
    - [ ] Cursor changes to ns-resize on hover
    - [ ] Blue highlight on hover/drag
    - [ ] Mouse drag updates panel heights
    - [ ] Double-click resets to 60/40
    - [ ] ARIA attributes present
  - **Tests:**
    1. Hover over handle
    2. Expected: Cursor changes, blue highlight appears
    3. Click and drag up
    4. Expected: AI section grows, properties shrinks
    5. Double-click handle
    6. Expected: Splits reset to 60/40
  - **Edge Cases:**
    - ⚠️ Drag beyond limits: Clamp to 20-80%
    - ⚠️ Mouse leaves window: Stop dragging on mouseup
    - ⚠️ Fast dragging: Throttle updates to 16ms (60fps)

#### 2.1.2 Add Mouse Event Listeners
- [ ] **Action:** Wire up global mouse events for drag
  - **Why:** Track drag even when cursor leaves handle
  - **Files Modified:**
    - Update: `src/features/right-sidebar/components/ResizeHandle.tsx`
  - **Implementation Details:**
```typescript
useEffect(() => {
  if (!isDragging) return;

  const handleMouseMove = (e: MouseEvent) => {
    // ... move logic
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging]);
```
  - **Success Criteria:**
    - [ ] Drag continues when cursor leaves handle
    - [ ] Drag stops on mouseup anywhere
    - [ ] Event listeners cleaned up
  - **Tests:**
    1. Start dragging handle
    2. Move mouse far from handle
    3. Expected: Drag still works
    4. Release mouse button
    5. Expected: Drag stops
  - **Edge Cases:**
    - ⚠️ Component unmounts during drag: Cleanup listeners

### 2.2 Keyboard Resize Support

#### 2.2.1 Add Arrow Key Resize
- [ ] **Action:** Support arrow keys for accessibility
  - **Why:** Keyboard users need resize ability
  - **Files Modified:**
    - Update: `src/features/right-sidebar/components/ResizeHandle.tsx`
  - **Implementation Details:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  const { aiPanelHeight } = useUIStore.getState();

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    setAIPanelHeight(Math.min(80, aiPanelHeight + 5));
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    setAIPanelHeight(Math.max(20, aiPanelHeight - 5));
  } else if (e.key === 'Home') {
    e.preventDefault();
    setAIPanelHeight(40); // Reset to default
  }
};
```
  - **Success Criteria:**
    - [ ] Arrow up increases AI height by 5%
    - [ ] Arrow down decreases AI height by 5%
    - [ ] Home key resets to 40%
    - [ ] Focus indicator visible
  - **Tests:**
    1. Tab to resize handle (focus visible)
    2. Press Arrow Up
    3. Expected: AI section grows 5%
    4. Press Arrow Down
    5. Expected: AI section shrinks 5%
    6. Press Home
    7. Expected: Resets to 40%
  - **Edge Cases:**
    - ⚠️ At max height: Arrow up does nothing
    - ⚠️ At min height: Arrow down does nothing

---

## Phase 3: AI Section Layout (1.5 hours)

### 3.1 AI Section Component

#### 3.1.1 Create AISection Component
- [ ] **Action:** Build AI section with collapse functionality
  - **Why:** Dedicated component for AI chat in sidebar
  - **Files Modified:**
    - Create: `src/features/right-sidebar/components/AISection.tsx`
    - Update: `src/features/right-sidebar/components/index.ts`
  - **Implementation Details:**
```typescript
/**
 * AISection Component
 *
 * AI chat section in right sidebar.
 * Shows header, messages, and input. Supports collapse to input-only.
 */
export function AISection() {
  const { isAIChatCollapsed, toggleAIChatCollapse } = useUIStore();
  const { commandHistory } = useAIStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">AI Assistant</span>
        </div>
        <button
          onClick={toggleAIChatCollapse}
          className="p-1 hover:bg-gray-100 rounded"
          title={isAIChatCollapsed ? "Expand chat" : "Collapse chat"}
        >
          {isAIChatCollapsed ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Messages - only show when expanded */}
      {!isAIChatCollapsed && (
        <div className="flex-1 overflow-y-auto p-3">
          <ChatMessages messages={commandHistory} />
        </div>
      )}

      {/* Input - always visible */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200">
        <ChatInput />
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Header with AI icon and collapse button
    - [ ] Messages scrollable when expanded
    - [ ] Input always visible (even when collapsed)
    - [ ] Smooth collapse animation
  - **Tests:**
    1. View AI section in sidebar
    2. Verify: Header, messages, input all visible
    3. Click collapse button
    4. Expected: Messages hide, input stays visible
    5. Click expand button
    6. Expected: Messages reappear
  - **Edge Cases:**
    - ⚠️ No messages: Show empty state
    - ⚠️ Long messages: Scroll works
    - ⚠️ Collapsed state: Input still functional

#### 3.1.2 Refactor ChatMessages for Sidebar
- [ ] **Action:** Adapt ChatMessages for narrow sidebar layout
  - **Why:** Current floating panel is wider, sidebar is 240px
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatMessages.tsx`
  - **Implementation Details:**
```typescript
// Adjust message bubble widths for 240px container
// User messages: max-w-[85%] instead of max-w-[70%]
// AI messages: max-w-full
// Font size: text-xs instead of text-sm
// Padding: More compact spacing
```
  - **Success Criteria:**
    - [ ] Messages fit in 240px width
    - [ ] No horizontal scroll
    - [ ] Text readable at smaller size
    - [ ] Avatars scaled appropriately
  - **Tests:**
    1. Send test message
    2. Verify: Message fits in sidebar width
    3. Send long message (200 chars)
    4. Verify: Wraps properly, no overflow
  - **Edge Cases:**
    - ⚠️ Very long words: Use word-break: break-word
    - ⚠️ Code blocks: Horizontal scroll for code only

#### 3.1.3 Update ChatInput for Sidebar
- [ ] **Action:** Make input compact for sidebar layout
  - **Why:** Limited horizontal space
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatInput.tsx`
  - **Implementation Details:**
```typescript
// Single-line textarea that expands to multi-line as needed
// Max height: 120px (4-5 lines)
// Send button: Icon only (no text)
// Placeholder: "Ask AI..." (shorter)
```
  - **Success Criteria:**
    - [ ] Input fits in 240px width
    - [ ] Grows to multi-line when needed
    - [ ] Send button visible and clickable
    - [ ] Keyboard shortcuts work (Cmd+Enter)
  - **Tests:**
    1. Click input field
    2. Type short message
    3. Verify: Single line
    4. Type long message (100 chars)
    5. Verify: Expands to multi-line
    6. Press Cmd+Enter
    7. Verify: Message sends
  - **Edge Cases:**
    - ⚠️ Max height reached: Scroll within textarea
    - ⚠️ Empty input: Send button disabled

### 3.2 Scrolling Behavior

#### 3.2.1 Implement Auto-Scroll for New Messages
- [ ] **Action:** Auto-scroll messages to bottom on new message
  - **Why:** User should see latest AI response
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatMessages.tsx`
  - **Implementation Details:**
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```
  - **Success Criteria:**
    - [ ] Scrolls to bottom on new message
    - [ ] Smooth scroll animation
    - [ ] Doesn't interrupt manual scrolling
  - **Tests:**
    1. Scroll to middle of message history
    2. Send new message
    3. Expected: Auto-scrolls to show new message
  - **Edge Cases:**
    - ⚠️ User scrolled up: Don't auto-scroll (preserve position)

---

## Phase 4: Properties Panel Updates (0.5 hours)

### 4.1 Make Properties Content-Only

#### 4.1.1 Remove Fixed Positioning from PropertiesPanel
- [ ] **Action:** Convert to content component (no positioning)
  - **Why:** RightSidebar now handles positioning
  - **Files Modified:**
    - Update: `src/features/properties-panel/components/PropertiesPanel.tsx`
  - **Implementation Details:**
```typescript
// Remove: className="fixed right-0 top-0 bottom-0 w-[240px]..."
// Keep: Only inner content structure
// Container div becomes simple wrapper with overflow-y-auto
```
  - **Success Criteria:**
    - [ ] No fixed positioning classes
    - [ ] No width/height constraints
    - [ ] Content fills parent container
    - [ ] Scroll still works
  - **Tests:**
    1. Mount PropertiesPanel inside RightSidebar
    2. Verify: Takes up allocated space
    3. Resize sidebar split
    4. Verify: Panel adjusts height accordingly
  - **Edge Cases:**
    - ⚠️ Many sections: Scroll works within allocated space

---

## Phase 5: Integration & Cleanup (1 hour)

### 5.1 Update CanvasPage

#### 5.1.1 Replace Individual Panels with RightSidebar
- [ ] **Action:** Use RightSidebar instead of separate panels
  - **Why:** Unified layout
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx`
  - **Implementation Details:**
```typescript
// Remove:
// <PropertiesPanel />
// <AIChatPanel />

// Add:
import { RightSidebar } from '@/features/right-sidebar';

// In render:
<RightSidebar />
```
  - **Success Criteria:**
    - [ ] Only RightSidebar imported
    - [ ] PropertiesPanel and AIChatPanel removed
    - [ ] Canvas width calculation unchanged (still exclude 240px)
    - [ ] No visual regressions
  - **Tests:**
    1. Start dev server
    2. Open canvas page
    3. Verify: Properties at top, AI at bottom
    4. Verify: Canvas width correct (excludes sidebar)
    5. Verify: No layout shift
  - **Edge Cases:**
    - ⚠️ Left sidebar open: Layout still correct

#### 5.1.2 Remove Floating AI Panel Code
- [ ] **Action:** Clean up unused AIChatPanel component
  - **Why:** No longer needed, integrated into sidebar
  - **Files Modified:**
    - Delete: `src/features/ai-agent/components/AIChatPanel.tsx`
    - Update: `src/features/ai-agent/components/index.ts` (remove export)
  - **Implementation Details:**
```typescript
// AIChatPanel.tsx - DELETE entire file
// It's replaced by AISection.tsx in right-sidebar
```
  - **Success Criteria:**
    - [ ] File deleted
    - [ ] No import errors
    - [ ] Build succeeds
  - **Tests:**
    1. Run: `npm run build`
    2. Verify: No errors about missing AIChatPanel
  - **Edge Cases:**
    - ⚠️ Any tests importing it: Update tests

### 5.2 Remove AI Toggle Button

#### 5.2.1 Remove CMD+K Shortcut for Panel Toggle
- [ ] **Action:** Remove toggle shortcut (panel always visible now)
  - **Why:** AI is now integrated, not toggled
  - **Files Modified:**
    - Update: `src/stores/aiStore.ts`
    - Update: Any keyboard shortcut handlers
  - **Implementation Details:**
```typescript
// Remove: isChatPanelOpen state
// Remove: toggleChatPanel action
// Keep: All other AI state (commandHistory, etc.)
```
  - **Success Criteria:**
    - [ ] No toggle state in store
    - [ ] No CMD+K handler
    - [ ] Build succeeds
  - **Tests:**
    1. Press CMD+K
    2. Expected: Nothing happens (or reassign to other function)
  - **Edge Cases:**
    - ⚠️ Other shortcuts using CMD+K: Reassign

---

## Phase 6: Polish & Testing (0.5 hours)

### 6.1 Visual Polish

#### 6.1.1 Add Smooth Transitions
- [ ] **Action:** Animate resize and collapse
  - **Why:** Professional feel
  - **Files Modified:**
    - Update: `src/features/right-sidebar/components/RightSidebar.tsx`
    - Update: `src/features/right-sidebar/components/AISection.tsx`
  - **Implementation Details:**
```typescript
// RightSidebar sections:
className="transition-all duration-150 ease-out"

// AISection collapse:
<AnimatePresence>
  {!isAIChatCollapsed && (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 'auto' }}
      exit={{ height: 0 }}
      transition={{ duration: 0.15 }}
    >
      <ChatMessages />
    </motion.div>
  )}
</AnimatePresence>
```
  - **Success Criteria:**
    - [ ] Smooth resize animation
    - [ ] Smooth collapse/expand
    - [ ] No jank or flickering
    - [ ] 60fps performance
  - **Tests:**
    1. Drag resize handle
    2. Verify: Smooth animation, no jitter
    3. Toggle collapse
    4. Verify: Smooth expand/collapse
  - **Edge Cases:**
    - ⚠️ Slow device: Reduce animation duration

### 6.2 Cross-Browser Testing

#### 6.2.1 Test in Chrome, Safari, Firefox
- [ ] **Action:** Verify layout works across browsers
  - **Why:** Ensure compatibility
  - **Tests:**
    1. Chrome: Open canvas, resize, collapse
    2. Safari: Same tests
    3. Firefox: Same tests
    4. Verify: All features work identically
  - **Success Criteria:**
    - [ ] Chrome: No issues
    - [ ] Safari: No issues
    - [ ] Firefox: No issues
  - **Edge Cases:**
    - ⚠️ Safari flexbox bugs: Add vendor prefixes if needed

### 6.3 Responsive Testing

#### 6.3.1 Test with Narrow Viewports
- [ ] **Action:** Ensure sidebar works at small screen sizes
  - **Why:** Some users have small screens
  - **Tests:**
    1. Resize window to 1024px width
    2. Verify: Sidebar still functional
    3. Resize to 768px
    4. Verify: Consider hiding sidebar or making responsive
  - **Success Criteria:**
    - [ ] Works at 1024px and above
    - [ ] Graceful degradation below 1024px
  - **Edge Cases:**
    - ⚠️ Very small screens: May need mobile-specific layout

---

## Rollback Strategy

If issues arise:

1. **Revert CanvasPage changes:**
   ```bash
   git checkout src/pages/CanvasPage.tsx
   ```

2. **Restore old AIChatPanel:**
   ```bash
   git checkout src/features/ai-agent/components/AIChatPanel.tsx
   ```

3. **Remove RightSidebar feature:**
   ```bash
   rm -rf src/features/right-sidebar
   ```

4. **Revert store changes:**
   ```bash
   git checkout src/stores/uiStore.ts src/stores/aiStore.ts
   ```

---

## Success Metrics

After completion:
- ✅ AI chat integrated into right sidebar
- ✅ Resizable split (20-80% range)
- ✅ Collapsible chat (to input-only)
- ✅ Both sections scrollable independently
- ✅ Keyboard accessible (arrow keys, focus indicators)
- ✅ Smooth animations (60fps)
- ✅ Works in Chrome, Safari, Firefox
- ✅ No visual regressions

---

## Post-Implementation Tasks

- [ ] Update documentation about AI panel location
- [ ] Record demo video showing resize/collapse
- [ ] Get user feedback on default height (40%)
- [ ] Consider adding preset layouts (50/50, 70/30, etc.)
