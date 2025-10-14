# Default Right Layout Implementation Plan

**Goal:** Create a default right panel layout when no shape is selected, featuring Page settings and Zoom controls.

**Key Features:**
- Page section with background color, opacity, and export settings
- Zoom dropdown with percentage display and preset options
- Presence display at the very top
- Remove zoom controls from bottom toolbar

**Important:** Follow existing patterns from PropertiesPanel, Toolbar, and shadcn/ui components.

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

# Phase 1: Create Default Layout Components (3-4 hours)

## 1.1 Create Page Settings Section Component

### 1.1.1 Design Page Section Types
- [ ] Create `src/types/page.types.ts`
  - Define `PageSettings` interface:
    ```typescript
    {
      backgroundColor: string;  // Default: '#FFFFFF'
      opacity: number;          // 0-100, Default: 100
      showInExports: boolean;   // Default: true
    }
    ```
  - Add JSDoc comments for all types
  - **Success:** Types defined with proper TypeScript support
  - **Test:** Import PageSettings type in another file, no TS errors
  - **Edge Case:** Opacity should be 0-100 (percentage), not 0-1 (decimal)

### 1.1.2 Create Zustand Store for Page Settings
- [ ] Create `src/stores/pageStore.ts`
  - State: `pageSettings: PageSettings`
  - Actions:
    - `setBackgroundColor(color: string): void`
    - `setOpacity(opacity: number): void`
    - `setShowInExports(show: boolean): void`
    - `updatePageSettings(updates: Partial<PageSettings>): void`
  - Initialize with defaults:
    ```typescript
    {
      backgroundColor: '#FFFFFF',
      opacity: 100,
      showInExports: true
    }
    ```
  - **Success:** Store created with proper types
  - **Test:** Import and call actions in console, state updates correctly
  - **Edge Case:** Opacity clamped to 0-100 range

### 1.1.3 Update Store Barrel Export
- [ ] Update `src/stores/index.ts`
  - Add: `export * from './pageStore'`
  - **Success:** Can import from @/stores
  - **Test:** `import { usePageStore } from '@/stores'` works
  - **Edge Case:** Ensure other store exports still work

### 1.1.4 Install Required shadcn Components
- [ ] Run: `npx shadcn@latest add slider`
  - **Success:** Slider component added to components/ui/
  - **Test:** Check components/ui/slider.tsx exists
  - **Edge Case:** May need to restart dev server after install
- [ ] Run: `npx shadcn@latest add checkbox`
  - **Success:** Checkbox component added to components/ui/
  - **Test:** Check components/ui/checkbox.tsx exists
  - **Edge Case:** Component may already exist, skip if present

### 1.1.5 Create PageSection Component Scaffold
- [ ] Create `src/features/properties-panel/components/PageSection.tsx`
  - **File header with JSDoc:** Explain component purpose
  - Import necessary components:
    - Slider from '@/components/ui/slider'
    - Checkbox from '@/components/ui/checkbox'
    - Eye icon from 'lucide-react'
  - Props: None (reads from store)
  - Component structure (scaffold only):
    ```tsx
    export function PageSection() {
      // TODO: Add store hooks
      // TODO: Add handlers
      return <div>Page Section</div>
    }
    ```
  - **Success:** File created with proper imports
  - **Test:** File compiles, no TypeScript errors
  - **Edge Case:** Component should be a named export, not default

### 1.1.6 Implement Background Color Picker
- [ ] Update `PageSection.tsx` - add color picker
  - Add state: `const { backgroundColor, setBackgroundColor } = usePageStore()`
  - Render native HTML color input:
    ```tsx
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500">Background</label>
      <input
        type="color"
        value={backgroundColor}
        onChange={(e) => setBackgroundColor(e.target.value)}
        className="h-8 w-16 rounded border border-gray-200 cursor-pointer"
      />
      <span className="text-xs text-gray-600 font-mono">
        {backgroundColor.toUpperCase()}
      </span>
    </div>
    ```
  - **Success:** Color picker renders and updates store
  - **Test:** Click color picker → change color → store updates
  - **Edge Case:** Color value should be uppercase hex (#1E1E1E not #1e1e1e)

### 1.1.7 Implement Opacity Slider
- [ ] Update `PageSection.tsx` - add opacity slider
  - Add state: `const { opacity, setOpacity } = usePageStore()`
  - Render Slider component with Eye icon:
    ```tsx
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500">Opacity</label>
      <Slider
        value={[opacity]}
        onValueChange={([value]) => setOpacity(value)}
        min={0}
        max={100}
        step={1}
        className="flex-1"
      />
      <span className="text-xs text-gray-600 min-w-[40px]">{opacity}%</span>
      <Eye className="w-4 h-4 text-gray-400" />
    </div>
    ```
  - **Success:** Slider updates opacity value in real-time
  - **Test:** Drag slider → value updates → store updates
  - **Edge Case:** Value should clamp to 0-100, show as percentage

### 1.1.8 Implement Show in Exports Checkbox
- [ ] Update `PageSection.tsx` - add exports checkbox
  - Add state: `const { showInExports, setShowInExports } = usePageStore()`
  - Render Checkbox with label:
    ```tsx
    <div className="flex items-center gap-2">
      <Checkbox
        id="show-exports"
        checked={showInExports}
        onCheckedChange={(checked) => setShowInExports(!!checked)}
      />
      <label
        htmlFor="show-exports"
        className="text-sm text-gray-700 cursor-pointer"
      >
        Show in exports
      </label>
    </div>
    ```
  - **Success:** Checkbox toggles store value
  - **Test:** Click checkbox → store value toggles
  - **Edge Case:** Ensure !!checked converts to boolean (not true | 'indeterminate')

### 1.1.9 Add Section Container Styling
- [ ] Update `PageSection.tsx` - wrap in section container
  - Add outer container matching PropertiesPanel pattern:
    ```tsx
    <div className="px-4 py-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Page
      </h3>
      {/* Color picker */}
      {/* Opacity slider */}
      {/* Exports checkbox */}
    </div>
    ```
  - **Success:** Section has consistent padding and spacing
  - **Test:** Visual check - matches other PropertiesPanel sections
  - **Edge Case:** Should match existing section styling exactly

### 1.1.10 Export PageSection Component
- [ ] Update `src/features/properties-panel/components/index.ts`
  - Add: `export { PageSection } from './PageSection'`
  - **Success:** Can import from properties-panel/components
  - **Test:** Import in PropertiesPanel works
  - **Edge Case:** Ensure barrel export doesn't break other imports

### 1.1.11 Test PageSection in Isolation
- [ ] Manual testing checklist:
  - Component renders with default values
  - Color picker opens and selects colors
  - Hex code updates when color changes
  - Opacity slider drags smoothly (0-100)
  - Percentage displays correctly
  - Checkbox toggles on/off
  - All values persist in Zustand store
  - **Success:** All interactions work correctly
  - **Test:** Open React DevTools, verify store updates
  - **Edge Case:** Rapid slider changes should debounce correctly

---

## 1.2 Create Zoom Dropdown Component

### 1.2.1 Check Existing Canvas Store for Zoom State
- [ ] Read `src/stores/canvasStore.ts`
  - Verify zoom state exists: `stageScale: number`, `stagePos: { x, y }`
  - Check for zoom actions: `setZoom`, `zoomIn`, `zoomOut`, `zoomToFit`
  - If actions don't exist, note what needs to be added
  - **Success:** Understand current zoom implementation
  - **Test:** Check if zoom state is in canvasStore or separate store
  - **Edge Case:** Zoom might be in CanvasStage component state, not store

### 1.2.2 Add Zoom Actions to Canvas Store (if needed)
- [ ] Update `src/stores/canvasStore.ts` (only if missing)
  - Add actions:
    - `setZoom(scale: number): void` - Set zoom to specific scale (0.1-5.0)
    - `zoomIn(): void` - Increase zoom by 10% (scale * 1.1)
    - `zoomOut(): void` - Decrease zoom by 10% (scale / 1.1)
    - `zoomToFit(): void` - Zoom to fit all objects on canvas
    - `zoomTo(percentage: number): void` - Zoom to specific percentage (50%, 100%, 200%)
  - Clamp zoom scale: `Math.max(0.1, Math.min(5.0, scale))`
  - **Success:** Zoom actions added to store
  - **Test:** Call actions from console, zoom updates
  - **Edge Case:** zoomToFit needs to calculate bounding box of all objects

### 1.2.3 Install Dropdown Menu shadcn Component
- [ ] Run: `npx shadcn@latest add dropdown-menu`
  - **Success:** DropdownMenu component added
  - **Test:** Check components/ui/dropdown-menu.tsx exists
  - **Edge Case:** May need to restart TypeScript server

### 1.2.4 Create ZoomDropdown Component Scaffold
- [ ] Create `src/features/properties-panel/components/ZoomDropdown.tsx`
  - **File header with JSDoc:** Explain zoom dropdown purpose
  - Import DropdownMenu components:
    ```tsx
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu'
    ```
  - Import icons: ZoomIn, ZoomOut, Maximize from 'lucide-react'
  - Props: None (reads from canvas store)
  - Component structure (scaffold):
    ```tsx
    export function ZoomDropdown() {
      // TODO: Add store hooks
      // TODO: Add handlers
      return <div>Zoom Dropdown</div>
    }
    ```
  - **Success:** File created with proper imports
  - **Test:** File compiles, no TypeScript errors
  - **Edge Case:** Named export, not default export

### 1.2.5 Implement Zoom Percentage Trigger Button
- [ ] Update `ZoomDropdown.tsx` - add trigger button
  - Get zoom from store: `const { stageScale } = useCanvasStore()`
  - Calculate percentage: `Math.round(stageScale * 100)`
  - Render dropdown trigger:
    ```tsx
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
        <span className="font-mono">{Math.round(stageScale * 100)}%</span>
        <ChevronDown className="w-3 h-3" />
      </button>
    </DropdownMenuTrigger>
    ```
  - **Success:** Trigger button shows current zoom percentage
  - **Test:** Zoom canvas → percentage updates in button
  - **Edge Case:** Percentage should round to whole number (9%, not 9.123%)

### 1.2.6 Implement Zoom In Menu Item
- [ ] Update `ZoomDropdown.tsx` - add zoom in item
  - Get action: `const { zoomIn } = useCanvasStore()`
  - Add menu item:
    ```tsx
    <DropdownMenuItem onClick={zoomIn}>
      <ZoomIn className="w-4 h-4 mr-2" />
      <span>Zoom in</span>
      <span className="ml-auto text-xs text-gray-400">⌘+</span>
    </DropdownMenuItem>
    ```
  - **Success:** Menu item triggers zoom in
  - **Test:** Click → zoom increases by 10%
  - **Edge Case:** Should respect max zoom limit (5.0x)

### 1.2.7 Implement Zoom Out Menu Item
- [ ] Update `ZoomDropdown.tsx` - add zoom out item
  - Get action: `const { zoomOut } = useCanvasStore()`
  - Add menu item:
    ```tsx
    <DropdownMenuItem onClick={zoomOut}>
      <ZoomOut className="w-4 h-4 mr-2" />
      <span>Zoom out</span>
      <span className="ml-auto text-xs text-gray-400">⌘-</span>
    </DropdownMenuItem>
    ```
  - **Success:** Menu item triggers zoom out
  - **Test:** Click → zoom decreases by 10%
  - **Edge Case:** Should respect min zoom limit (0.1x)

### 1.2.8 Implement Zoom to Fit Menu Item
- [ ] Update `ZoomDropdown.tsx` - add zoom to fit item
  - Get action: `const { zoomToFit } = useCanvasStore()`
  - Add menu item:
    ```tsx
    <DropdownMenuItem onClick={zoomToFit}>
      <Maximize className="w-4 h-4 mr-2" />
      <span>Zoom to fit</span>
      <span className="ml-auto text-xs text-gray-400">↑1</span>
    </DropdownMenuItem>
    ```
  - **Success:** Menu item fits all objects in viewport
  - **Test:** Create shapes → click → all shapes visible
  - **Edge Case:** Empty canvas should zoom to 100%

### 1.2.9 Add Dropdown Separator
- [ ] Update `ZoomDropdown.tsx` - add separator after zoom to fit
  - Import: `DropdownMenuSeparator`
  - Add after "Zoom to fit":
    ```tsx
    <DropdownMenuSeparator />
    ```
  - **Success:** Visual separator between dynamic and preset zooms
  - **Test:** Visual check - line appears
  - **Edge Case:** Should match Figma reference image styling

### 1.2.10 Implement Preset Zoom Levels (50%, 100%, 200%)
- [ ] Update `ZoomDropdown.tsx` - add preset zoom items
  - Get action: `const { zoomTo } = useCanvasStore()`
  - Add menu items:
    ```tsx
    <DropdownMenuItem onClick={() => zoomTo(50)}>
      Zoom to 50%
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => zoomTo(100)}>
      <span>Zoom to 100%</span>
      <span className="ml-auto text-xs text-gray-400">⌘0</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => zoomTo(200)}>
      Zoom to 200%
    </DropdownMenuItem>
    ```
  - **Success:** Preset zoom levels work
  - **Test:** Click each → zoom changes to exact percentage
  - **Edge Case:** 100% should be highlighted or show keyboard shortcut

### 1.2.11 Export ZoomDropdown Component
- [ ] Update `src/features/properties-panel/components/index.ts`
  - Add: `export { ZoomDropdown } from './ZoomDropdown'`
  - **Success:** Can import from properties-panel/components
  - **Test:** Import works in PropertiesPanel
  - **Edge Case:** Barrel export doesn't break other imports

### 1.2.12 Test ZoomDropdown in Isolation
- [ ] Manual testing checklist:
  - Dropdown trigger shows current zoom percentage
  - Dropdown opens on click
  - Zoom in works (increases by 10%)
  - Zoom out works (decreases by 10%)
  - Zoom to fit works (fits all objects)
  - Preset zooms work (50%, 100%, 200%)
  - Keyboard shortcuts display correctly
  - Dropdown closes after selecting option
  - Zoom limits respected (0.1x - 5.0x)
  - **Success:** All zoom operations work correctly
  - **Test:** Check canvas zoom updates in real-time
  - **Edge Case:** Rapid zoom changes should not lag

---

## 1.3 Integrate Components into PropertiesPanel

### 1.3.1 Read Current PropertiesPanel Empty State
- [ ] Review `src/features/properties-panel/components/PropertiesPanel.tsx`
  - Find empty state rendering (when `!shape`)
  - Note current structure:
    - Presence section at top
    - Empty message in center
  - **Success:** Understand current empty state structure
  - **Test:** No changes, just review
  - **Edge Case:** Empty state might have changed since last read

### 1.3.2 Update Empty State to Include Default Layout
- [ ] Update `PropertiesPanel.tsx` - modify empty state
  - Replace center empty message with new layout:
    ```tsx
    if (!shape) {
      return (
        <div className="fixed right-0 top-16 bottom-0 w-[300px] bg-white border-l border-gray-200 flex flex-col">
          {/* Presence Section - unchanged */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 z-20 flex items-center justify-between">
            <span className="text-xs text-gray-500">Active</span>
            {presenceUsers.length > 0 && (
              <PresenceDropdown
                users={presenceUsers}
                trigger={<AvatarStack users={presenceUsers} maxVisible={3} size="sm" />}
              />
            )}
          </div>

          {/* Zoom Section - NEW */}
          <div className="border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-gray-500">Zoom</span>
            <ZoomDropdown />
          </div>

          {/* Page Section - NEW */}
          <PageSection />

          {/* Spacer to push content to top */}
          <div className="flex-1" />
        </div>
      )
    }
    ```
  - **Success:** Default layout renders when nothing selected
  - **Test:** Deselect all shapes → see Page and Zoom sections
  - **Edge Case:** Layout should not show when shape is selected

### 1.3.3 Add Required Imports
- [ ] Update `PropertiesPanel.tsx` - add imports
  - Add to imports:
    ```tsx
    import { PageSection } from './PageSection';
    import { ZoomDropdown } from './ZoomDropdown';
    ```
  - **Success:** No import errors
  - **Test:** File compiles, TypeScript happy
  - **Edge Case:** Verify barrel exports work (from './PageSection' vs from '../')

### 1.3.4 Test Empty State Rendering
- [ ] Manual testing checklist:
  - Open canvas with no selection
  - See presence at top
  - See zoom section below presence
  - See page section below zoom
  - Zoom dropdown works
  - Page settings work
  - Layout matches reference image
  - No console errors
  - **Success:** Default layout renders correctly
  - **Test:** Visual comparison with reference image
  - **Edge Case:** Scrolling should work if content overflows

### 1.3.5 Test Selection State Transition
- [ ] Manual testing checklist:
  - Default layout visible (no selection)
  - Click shape → properties panel switches to shape properties
  - Presence still visible at top
  - Page/Zoom sections disappear
  - Shape properties appear
  - Click background → default layout reappears
  - **Success:** Smooth transition between states
  - **Test:** No flickering or layout jump
  - **Edge Case:** Rapid select/deselect should not cause issues

---

## 1.4 Remove Zoom from Bottom Toolbar

### 1.4.1 Check Current ZoomControls Component
- [ ] Find ZoomControls component:
  - Run glob: `**/ZoomControls.tsx`
  - Read file to understand implementation
  - Note what it does (zoom in/out buttons)
  - Check if it's exported from toolbar/components
  - **Success:** Understand what needs to be removed
  - **Test:** Component file exists and is imported
  - **Edge Case:** Component might be used elsewhere

### 1.4.2 Remove ZoomControls Import from Toolbar
- [ ] Update `src/features/toolbar/components/Toolbar.tsx`
  - Remove ZoomControls from imports:
    ```tsx
    // Before:
    import { ToolButton, ToolbarDivider, ZoomControls } from './'

    // After:
    import { ToolButton, ToolbarDivider } from './'
    ```
  - **Success:** Import removed
  - **Test:** File compiles after removal
  - **Edge Case:** Make sure other imports still work

### 1.4.3 Remove ZoomControls Render from Toolbar
- [ ] Update `Toolbar.tsx` - remove zoom controls section
  - Find and remove:
    ```tsx
    <ToolbarDivider />
    {/* Zoom controls */}
    <ZoomControls />
    ```
  - **Success:** Zoom controls no longer rendered
  - **Test:** Toolbar renders without zoom section
  - **Edge Case:** Make sure toolbar divider before help button remains

### 1.4.4 Verify Toolbar Still Works
- [ ] Manual testing checklist:
  - Toolbar renders at bottom
  - All tool buttons work (move, rectangle, circle, text)
  - Duplicate button works
  - Delete button works
  - Clear canvas button works
  - Help button works
  - No zoom controls visible
  - No console errors
  - **Success:** Toolbar fully functional without zoom
  - **Test:** Click each button to verify
  - **Edge Case:** Layout should reflow smoothly without zoom

### 1.4.5 Check if ZoomControls Component Should Be Deleted
- [ ] Check if ZoomControls is used anywhere else:
  - Search codebase: grep "ZoomControls" in src/
  - If not used: can be deleted
  - If used elsewhere: keep file
  - **Success:** Determine if file can be removed
  - **Test:** Search results show no other usage
  - **Edge Case:** Component might be referenced in tests or docs

### 1.4.6 Delete ZoomControls Component (if unused)
- [ ] Delete component file (only if not used elsewhere):
  - Delete `src/features/toolbar/components/ZoomControls.tsx`
  - Update barrel export: remove from `index.ts`
  - **Success:** File deleted, barrel export updated
  - **Test:** Build passes, no import errors
  - **Edge Case:** Skip this step if component is used elsewhere

---

## 1.5 Connect Zoom Store to Canvas Stage

### 1.5.1 Check Current Canvas Stage Zoom Implementation
- [ ] Read `src/features/canvas-core/components/CanvasStage.tsx`
  - Find zoom state: might be local state or store
  - Find zoom handlers: wheel event, zoom functions
  - Determine if zoom is in local state or store
  - **Success:** Understand current zoom architecture
  - **Test:** Zoom currently works on canvas
  - **Edge Case:** Zoom might be split between local and store state

### 1.5.2 Move Zoom State to Canvas Store (if needed)
- [ ] Update CanvasStage.tsx - use store for zoom
  - Replace local zoom state with store:
    ```tsx
    // Before:
    const [stageScale, setStageScale] = useState(1)

    // After:
    const { stageScale, setZoom } = useCanvasStore()
    ```
  - **Success:** Zoom state moved to store
  - **Test:** Zoom still works on canvas
  - **Edge Case:** Make sure zoom-to-cursor math still works

### 1.5.3 Verify Zoom Dropdown Updates Canvas
- [ ] Manual testing:
  - Open canvas
  - Open zoom dropdown (right panel)
  - Click "Zoom in" → canvas zooms in
  - Click "Zoom out" → canvas zooms out
  - Click "Zoom to 100%" → canvas resets to 100%
  - Canvas wheel zoom → dropdown percentage updates
  - **Success:** Bidirectional zoom sync works
  - **Test:** Both canvas and dropdown stay in sync
  - **Edge Case:** Rapid zoom changes should not cause desync

### 1.5.4 Verify Zoom Limits
- [ ] Test zoom boundaries:
  - Zoom in repeatedly → stops at 5.0x (500%)
  - Zoom out repeatedly → stops at 0.1x (10%)
  - Dropdown respects limits
  - Canvas wheel zoom respects limits
  - **Success:** Zoom clamped to 0.1x - 5.0x
  - **Test:** Cannot exceed limits from any control
  - **Edge Case:** Edge case values (exactly 0.1x, exactly 5.0x) work

---

## 1.6 Keyboard Shortcuts Integration

### 1.6.1 Check Existing Keyboard Shortcuts Hook
- [ ] Read `src/features/toolbar/hooks/useToolShortcuts.ts`
  - See how keyboard shortcuts are currently handled
  - Check if zoom shortcuts exist (⌘+, ⌘-, ⌘0)
  - Determine where to add zoom shortcuts
  - **Success:** Understand shortcut system
  - **Test:** Current tool shortcuts work (V, R, C, T)
  - **Edge Case:** Shortcuts might be in different file

### 1.6.2 Add Zoom Keyboard Shortcuts
- [ ] Update keyboard shortcuts hook
  - Add zoom shortcuts:
    ```tsx
    // Zoom in: Cmd/Ctrl + Plus
    if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
      e.preventDefault()
      zoomIn()
    }

    // Zoom out: Cmd/Ctrl + Minus
    if ((e.metaKey || e.ctrlKey) && e.key === '-') {
      e.preventDefault()
      zoomOut()
    }

    // Zoom to 100%: Cmd/Ctrl + 0
    if ((e.metaKey || e.ctrlKey) && e.key === '0') {
      e.preventDefault()
      zoomTo(100)
    }
    ```
  - **Success:** Keyboard shortcuts call zoom actions
  - **Test:** Press ⌘+ → zooms in, ⌘- → zooms out, ⌘0 → resets
  - **Edge Case:** Don't trigger when typing in input field

### 1.6.3 Test Keyboard Shortcuts
- [ ] Manual testing checklist:
  - Press ⌘+ → zoom in
  - Press ⌘- → zoom out
  - Press ⌘0 → zoom to 100%
  - Shortcuts work on both Mac (⌘) and Windows (Ctrl)
  - Shortcuts don't trigger when typing in input
  - Dropdown shows correct shortcut hints
  - **Success:** All zoom shortcuts functional
  - **Test:** Try on Mac and Windows/Linux
  - **Edge Case:** Numeric keypad 0 vs main keyboard 0

---

## 1.7 Page Settings Persistence (Optional - Future Enhancement)

### 1.7.1 Decide on Page Settings Persistence
- [ ] Determine if page settings should persist:
  - Option A: Local state only (resets on page reload)
  - Option B: localStorage (persists locally)
  - Option C: Firebase Realtime DB (syncs across users)
  - Recommended for MVP: Local state only (Option A)
  - **Success:** Decision made and documented
  - **Test:** Document decision in this file
  - **Edge Case:** Consider multi-user implications

### 1.7.2 Add localStorage Persistence (if Option B chosen)
- [ ] Update pageStore.ts (only if Option B):
  - Add persist middleware:
    ```tsx
    import { persist } from 'zustand/middleware'

    export const usePageStore = create(
      persist(
        (set) => ({ /* store */ }),
        { name: 'page-settings' }
      )
    )
    ```
  - **Success:** Settings persist across page reloads
  - **Test:** Change settings → reload page → settings preserved
  - **Edge Case:** localStorage might be disabled in private browsing

### 1.7.3 Add Firebase Sync (if Option C chosen)
- [ ] Implement page settings sync (only if Option C):
  - Create pageService.ts in lib/firebase
  - Subscribe to /canvases/main/pageSettings
  - Update on change (debounced 500ms)
  - **Success:** Page settings sync across users
  - **Test:** User A changes → User B sees update
  - **Edge Case:** Concurrent updates (last-write-wins)

---

## 1.8 Visual Polish and Edge Cases

### 1.8.1 Match Reference Image Styling
- [ ] Visual comparison with reference images:
  - Page section matches reference layout
  - Zoom dropdown matches reference design
  - Colors match (#1E1E1E text, etc.)
  - Spacing matches (padding, gaps)
  - Font sizes match
  - Borders match (gray-200)
  - **Success:** Layout looks identical to reference
  - **Test:** Side-by-side visual comparison
  - **Edge Case:** Minor differences acceptable if intentional

### 1.8.2 Test Responsive Behavior
- [ ] Test at different viewport sizes:
  - Desktop (1920x1080) → full layout
  - Laptop (1440x900) → full layout
  - Small laptop (1280x720) → layout scrolls
  - Properties panel width fixed at 300px
  - No horizontal overflow
  - **Success:** Layout responsive at all sizes
  - **Test:** Resize browser window
  - **Edge Case:** Very small screens might need adjustments

### 1.8.3 Test with Actual Canvas Content
- [ ] Test with various canvas states:
  - Empty canvas → default layout
  - Canvas with shapes → default layout (no selection)
  - Canvas with 100+ shapes → zoom to fit works
  - Very small shapes → zoom in works
  - Very large shapes → zoom out works
  - **Success:** All scenarios work correctly
  - **Test:** Create various canvas states
  - **Edge Case:** Edge case object positions (negative, very large)

### 1.8.4 Test Presence Integration
- [ ] Test presence in default layout:
  - User alone → presence shows "(You)"
  - Multiple users → all visible in avatar stack
  - Presence dropdown works in default layout
  - Presence updates in real-time
  - **Success:** Presence fully functional
  - **Test:** Open multiple browser windows
  - **Edge Case:** Many users (10+) should truncate gracefully

### 1.8.5 Check for Console Errors
- [ ] Final error check:
  - Open browser console
  - Clear console
  - Use all features of default layout
  - No errors or warnings
  - No React hydration errors
  - No TypeScript errors in build
  - **Success:** Console clean
  - **Test:** Run through all features
  - **Edge Case:** Warnings are acceptable, errors are not

### 1.8.6 Performance Check
- [ ] Test performance:
  - Zoom dropdown opens quickly (<100ms)
  - Page settings update smoothly
  - No layout shift when switching states
  - No unnecessary re-renders (check React DevTools)
  - 60 FPS maintained
  - **Success:** Smooth performance
  - **Test:** Chrome DevTools Performance tab
  - **Edge Case:** Slower devices might need optimization

---

## 1.9 Documentation and Code Quality

### 1.9.1 Add JSDoc Comments to All New Functions
- [ ] Review all new files:
  - PageSection.tsx → all functions documented
  - ZoomDropdown.tsx → all functions documented
  - pageStore.ts → all actions documented
  - **Success:** Every function has JSDoc comment
  - **Test:** Hover over function in VS Code → see documentation
  - **Edge Case:** Private/internal functions can have brief comments

### 1.9.2 Verify File Lengths
- [ ] Check all files under 500 lines:
  - PageSection.tsx → should be ~150 lines
  - ZoomDropdown.tsx → should be ~100 lines
  - pageStore.ts → should be ~50 lines
  - PropertiesPanel.tsx → check if over 500 lines
  - **Success:** All files under 500 lines
  - **Test:** Line count in VS Code
  - **Edge Case:** If over 500, split into smaller components

### 1.9.3 Verify No TypeScript Errors
- [ ] Run TypeScript check:
  - Run: `npm run build` or `tsc --noEmit`
  - No TypeScript errors
  - No 'any' types used
  - Strict mode passes
  - **Success:** Clean TypeScript build
  - **Test:** Build succeeds
  - **Edge Case:** Type inference should be preferred over explicit types

### 1.9.4 Update Project Documentation
- [ ] Document new features (optional):
  - Add note to README about default layout
  - Update component architecture docs
  - Add screenshots if desired
  - **Success:** Documentation updated
  - **Test:** README reflects new features
  - **Edge Case:** Can be done after PR merged

---

## 1.10 Final Validation Checklist

**Visual Requirements:**
- [ ] Presence section at top of right panel
- [ ] Zoom section below presence (with dropdown)
- [ ] Page section below zoom
- [ ] Zoom dropdown matches reference image design
- [ ] Page section matches reference image design
- [ ] Default layout only shows when nothing selected
- [ ] Shape properties replace default layout when shape selected
- [ ] No zoom controls in bottom toolbar

**Functional Requirements:**
- [ ] Zoom dropdown shows current zoom percentage
- [ ] Zoom in/out buttons work
- [ ] Zoom to fit works (fits all objects)
- [ ] Preset zoom levels work (50%, 100%, 200%)
- [ ] Zoom keyboard shortcuts work (⌘+, ⌘-, ⌘0)
- [ ] Page background color picker works
- [ ] Page opacity slider works (0-100%)
- [ ] Show in exports checkbox works
- [ ] All page settings persist in Zustand store
- [ ] Canvas zoom and dropdown zoom stay in sync

**Code Quality Requirements:**
- [ ] All files under 500 lines
- [ ] All functions have JSDoc comments
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Proper imports using @ alias
- [ ] Components in correct feature slices
- [ ] Barrel exports work
- [ ] No 'any' types used

**Performance Requirements:**
- [ ] Zoom dropdown opens quickly (<100ms)
- [ ] No layout shift during state transitions
- [ ] 60 FPS maintained during zoom
- [ ] React.memo used where appropriate
- [ ] No unnecessary re-renders

**Edge Cases Tested:**
- [ ] Empty canvas (no shapes)
- [ ] Canvas with 100+ shapes
- [ ] Very small zoom (0.1x)
- [ ] Very large zoom (5.0x)
- [ ] Rapid zoom changes
- [ ] Multiple users (presence updates)
- [ ] Browser window resize
- [ ] Keyboard shortcuts with inputs focused

---

## Success Criteria

This implementation is complete when:

1. ✅ **Default layout visible when nothing selected**
2. ✅ **Zoom dropdown functional with all options**
3. ✅ **Page section functional with all controls**
4. ✅ **Zoom removed from bottom toolbar**
5. ✅ **Layout matches reference images**
6. ✅ **All tests pass**
7. ✅ **No console errors**
8. ✅ **Code follows project standards**

**When complete, commit with:**
```
feat: Add default right panel layout with Page and Zoom sections

- Create PageSection component with background color, opacity, and export settings
- Create ZoomDropdown component with preset zoom levels and keyboard shortcuts
- Integrate components into PropertiesPanel empty state
- Remove zoom controls from bottom toolbar
- Add zoom actions to canvas store
- Connect keyboard shortcuts (⌘+, ⌘-, ⌘0)
- Match Figma reference design exactly
```

---

## Notes

- This plan follows the master-task-list.md format with granular steps
- Each step has success criteria, tests, and edge cases
- Total estimated time: 3-4 hours
- Can be completed in one session
- No external dependencies (uses existing patterns)
- Fully reversible if needed
