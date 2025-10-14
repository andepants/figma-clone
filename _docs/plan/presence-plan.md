# Presence Integration Plan - Figma-Style Avatars

**How to use this plan:**
1. Complete tasks **one at a time** in the order listed
2. After completing each task, mark the checkbox `[x]`
3. Test each step before moving to the next
4. Don't skip ahead - each step builds on the previous
5. Look for edge cases and test them thoroughly

**Goal:** Remove the standalone ActiveUsers component from top-right and integrate it into the PropertiesPanel as a Figma-style overlapping avatar stack with dropdown support.

**Key Features:**
- Overlapping circular avatars (Figma style)
- Profile initials or icons
- Coordinated colors per user
- Hover to see username tooltip
- Expandable dropdown for 4+ users
- Scrollable list in dropdown
- Always visible at top of PropertiesPanel

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

## Phase 1: Create Avatar Components (1-2 hours)

**Goal:** Build reusable avatar components that show user initials/icons with coordinated colors.

### 1.1 Create UserAvatar Base Component

- [ ] **1.1.1** Create `features/collaboration/components/UserAvatar.tsx`
  - Props interface: `{ userId: string; username: string; color: string; size?: 'sm' | 'md' | 'lg' }`
  - Size mapping: sm=24px, md=32px, lg=40px
  - Render circular div with user color background
  - Extract initials from username (first 2 chars, uppercase)
  - Display initials in white text, centered
  - **Success:** Component renders with initials and background color
  - **Test:** Render "John Doe" → shows "JD" in colored circle
  - **Edge Case:** Single name "John" → "JO", empty name → "?", emoji in name → handle gracefully

- [ ] **1.1.2** Add Avatar Sizing and Typography
  - sm: h-6 w-6, text-xs font-medium
  - md: h-8 w-8, text-sm font-semibold
  - lg: h-10 w-10, text-base font-bold
  - Add `rounded-full` for circular shape
  - Add subtle border: `ring-2 ring-white` (helps with overlap visibility)
  - **Success:** Avatar sizes correctly for all variants
  - **Test:** Render all 3 sizes, measure dimensions
  - **Edge Case:** Very long usernames → truncate to 2 initials max

- [ ] **1.1.3** Add JSDoc Comments and Export
  - Document component purpose, props, usage examples
  - Document size variants and when to use each
  - Export from `features/collaboration/components/index.ts`
  - **Success:** Can import UserAvatar from barrel export
  - **Test:** Import in another file, TypeScript autocomplete works

### 1.2 Create AvatarStack Component

- [ ] **1.2.1** Create `features/collaboration/components/AvatarStack.tsx`
  - Props interface: `{ users: Array<{ userId: string; username: string; color: string }>; maxVisible?: number; size?: 'sm' | 'md' | 'lg'; onShowAll?: () => void }`
  - Default maxVisible: 3 (show 3 avatars + "+X more" badge)
  - Calculate visible users and overflow count
  - **Success:** Component accepts users array
  - **Test:** Pass 5 users, component renders without errors
  - **Edge Case:** 0 users → render nothing, 1 user → show 1 avatar, 2-3 users → show all

- [ ] **1.2.2** Implement Overlapping Layout
  - Use flexbox with negative margin for overlap
  - Container: `flex items-center -space-x-2` (overlap by 8px)
  - Each avatar: `relative z-[index]` (z-index increases for stacking)
  - Last visible avatar has highest z-index
  - Hover effect: scale up slightly `hover:scale-110 hover:z-50` with transition
  - **Success:** Avatars overlap like Figma (each partially visible)
  - **Test:** Render 5 users, see 3 overlapping avatars
  - **Edge Case:** 1 avatar → no overlap, 2 avatars → slight overlap

- [ ] **1.2.3** Add Overflow Badge ("+X more")
  - If `users.length > maxVisible`, show badge
  - Badge: circular, same size as avatars, gray background (#6b7280)
  - Text: "+N" where N = users.length - maxVisible
  - Example: 8 users, maxVisible 3 → "+5" badge
  - Badge positioned after visible avatars
  - Clickable if onShowAll provided: `cursor-pointer hover:bg-gray-600`
  - **Success:** Badge shows correct overflow count
  - **Test:** 8 users → shows 3 avatars + "+5", click opens dropdown
  - **Edge Case:** Exactly maxVisible users → no badge, maxVisible+1 → "+1" badge

- [ ] **1.2.4** Add Tooltip on Hover
  - Install shadcn tooltip if not already: `npx shadcn@latest add tooltip`
  - Wrap each UserAvatar in Tooltip component
  - TooltipContent: username in small text
  - Tooltip delay: 300ms (don't show immediately)
  - **Success:** Hover over avatar → username appears after delay
  - **Test:** Hover over each avatar, tooltip shows correct username
  - **Edge Case:** Very long username → tooltip should wrap or truncate

- [ ] **1.2.5** Add JSDoc Comments and Export
  - Document component purpose, overlapping behavior
  - Document maxVisible prop and overflow badge
  - Export from `features/collaboration/components/index.ts`
  - **Success:** Can import AvatarStack from barrel export
  - **Test:** TypeScript autocomplete shows all props

---

## Phase 2: Create Presence Dropdown (1 hour)

**Goal:** Build expandable dropdown that shows full user list when clicked.

### 2.1 Create PresenceDropdown Component

- [ ] **2.1.1** Create `features/collaboration/components/PresenceDropdown.tsx`
  - Props interface: `{ users: Array<{ userId: string; username: string; color: string; isCurrentUser: boolean }>; trigger: React.ReactNode }`
  - Use shadcn Popover component for dropdown
  - Install if needed: `npx shadcn@latest add popover`
  - State: `isOpen: boolean` for open/close
  - Trigger element: passed as prop (will be AvatarStack)
  - **Success:** Dropdown structure created
  - **Test:** Click trigger → dropdown opens, click outside → closes

- [ ] **2.1.2** Build Dropdown Content Layout
  - Header: "Active Users" title + count badge
  - Header styling: border-bottom, px-3 py-2
  - Count badge: same as current ActiveUsers (primary-100 bg, primary-700 text)
  - User list container: max-h-[300px] overflow-y-auto
  - List: flex flex-col gap-0.5 p-2
  - **Success:** Dropdown has header and scrollable list area
  - **Test:** Open dropdown, see header with count
  - **Edge Case:** Very long list (20+ users) → scrollable

- [ ] **2.1.3** Render User List Items
  - Map over users array
  - Each item: flex items-center gap-2, rounded-md px-2 py-1.5
  - Layout: UserAvatar (sm) + username + "(You)" badge if current user
  - Hover effect: hover:bg-neutral-50
  - Current user always appears first (sort in parent)
  - **Success:** All users visible in list
  - **Test:** Open dropdown, scroll through all users
  - **Edge Case:** Current user highlighted, "(You)" badge visible

- [ ] **2.1.4** Add Search/Filter (Optional Enhancement)
  - If > 10 users, add search input at top
  - Search filters users by username (case-insensitive)
  - Input: small, rounded, with search icon
  - Real-time filtering as user types
  - **Success:** Typing filters user list
  - **Test:** Type "john" → only Johns visible
  - **Edge Case:** No results → show "No users found"

- [ ] **2.1.5** Add JSDoc Comments and Export
  - Document dropdown behavior and props
  - Document keyboard accessibility (Escape to close)
  - Export from `features/collaboration/components/index.ts`
  - **Success:** Can import PresenceDropdown from barrel export

---

## Phase 3: Integrate into PropertiesPanel (1 hour)

**Goal:** Add presence avatars to the top of PropertiesPanel, replacing standalone ActiveUsers.

### 3.1 Update PropertiesPanel Component

- [ ] **3.1.1** Import Presence Components
  - Add imports: `import { AvatarStack, PresenceDropdown } from '@/features/collaboration/components'`
  - Add import: `import { usePresence } from '@/features/collaboration/hooks'`
  - Add import: `import { useAuth } from '@/features/auth/hooks'`
  - **Success:** Imports resolve without errors
  - **Test:** TypeScript shows no import errors

- [ ] **3.1.2** Add usePresence Hook to Component
  - Call `const onlineUsers = usePresence('main')`
  - Call `const { currentUser } = useAuth()`
  - Create sorted users array (current user first, then others)
  - Map to format: `{ userId, username, color, isCurrentUser }`
  - **Success:** Users data available in component
  - **Test:** Log users array, see current user + others

- [ ] **3.1.3** Add Presence Section Above Shape Header
  - Create new section ABOVE the shape header
  - Section: sticky top-0, bg-white, border-b, px-4 py-2.5, z-20
  - Layout: flex items-center justify-between
  - Left side: "Active" text (text-xs text-gray-500)
  - Right side: AvatarStack + PresenceDropdown
  - **Success:** Presence section visible at top
  - **Test:** Open panel, see avatars at very top
  - **Edge Case:** When no shape selected, presence still visible

- [ ] **3.1.4** Compose AvatarStack with PresenceDropdown
  - Wrap AvatarStack in PresenceDropdown
  - AvatarStack is the trigger
  - Pass users array to both components
  - Set maxVisible: 3 (show 3 avatars + overflow)
  - Size: 'sm' (24px avatars for compact panel)
  - **Success:** Click avatars → dropdown opens with full list
  - **Test:** Click stack, dropdown appears below
  - **Edge Case:** 1-3 users → no dropdown, 4+ users → dropdown

- [ ] **3.1.5** Update Shape Header Styling
  - Shape header should now be second section (below presence)
  - Remove `top-0` from shape header (presence is sticky now)
  - Add `top-[48px]` to shape header (stick below presence section)
  - Ensure smooth scroll behavior
  - **Success:** Presence stays at top, shape header sticks below
  - **Test:** Scroll panel, presence always visible

- [ ] **3.1.6** Handle Empty State
  - When no shape selected, still show presence section
  - Empty state message: "Select a shape to view properties"
  - Layout: presence section at top, empty state centered below
  - **Success:** Presence visible even with no selection
  - **Test:** Deselect all shapes, presence still shows

---

## Phase 4: Remove Old ActiveUsers Component (30 min)

**Goal:** Clean up the standalone ActiveUsers component from top-right corner.

### 4.1 Remove ActiveUsers from CanvasPage

- [ ] **4.1.1** Update `src/pages/CanvasPage.tsx`
  - Remove `<ActiveUsers />` component (line 205)
  - Remove import: `import { ActiveUsers } from '@/features/collaboration/components'`
  - Remove SyncIndicator position adjustment (was positioned below ActiveUsers)
  - Update SyncIndicator className: change `!top-[290px]` to `!top-4`
  - **Success:** ActiveUsers no longer rendered on canvas
  - **Test:** Open canvas, no presence panel in top-right
  - **Edge Case:** Ensure SyncIndicator still visible and positioned correctly

- [ ] **4.1.2** Keep ActiveUsers Component File (For Now)
  - Don't delete `ActiveUsers.tsx` yet (might be useful)
  - Add comment at top: `// DEPRECATED: Now integrated into PropertiesPanel as AvatarStack`
  - Remove from barrel export: `features/collaboration/components/index.ts`
  - **Success:** Component not exported, not used
  - **Test:** Try to import ActiveUsers → TypeScript error
  - **Edge Case:** Can still access file directly if needed

---

## Phase 5: Polish and Refinements (1 hour)

**Goal:** Add animations, accessibility, and handle edge cases.

### 5.1 Add Animations

- [ ] **5.1.1** Animate Avatar Stack Entrance
  - Add Tailwind animate classes: `animate-in fade-in slide-in-from-right-2 duration-300`
  - Stagger animation for each avatar: delay-[100ms], delay-[200ms], delay-[300ms]
  - **Success:** Avatars slide in smoothly on load
  - **Test:** Refresh page, watch avatars animate in
  - **Edge Case:** Don't animate on every render, only mount

- [ ] **5.1.2** Animate Dropdown Open/Close
  - Add Popover animations: scale and fade
  - Open: `animate-in fade-in-0 zoom-in-95 duration-200`
  - Close: `animate-out fade-out-0 zoom-out-95 duration-150`
  - **Success:** Dropdown animates smoothly
  - **Test:** Open and close dropdown multiple times
  - **Edge Case:** Animation doesn't lag, feels snappy

- [ ] **5.1.3** Add Hover Transitions
  - Avatar hover: `transition-transform duration-200 ease-out`
  - List item hover: `transition-colors duration-150`
  - Overflow badge hover: `transition-colors duration-200`
  - **Success:** All interactions feel smooth
  - **Test:** Hover over all interactive elements
  - **Edge Case:** No animation jank, 60fps

### 5.2 Accessibility Improvements

- [ ] **5.2.1** Add ARIA Labels
  - AvatarStack: `aria-label="Active users"`
  - Overflow badge: `aria-label="Show all users"`
  - User avatar: `aria-label="${username}"`
  - Dropdown: `role="dialog"` `aria-label="Active users list"`
  - **Success:** Screen readers announce components correctly
  - **Test:** Use VoiceOver/NVDA to navigate
  - **Edge Case:** All interactive elements are keyboard accessible

- [ ] **5.2.2** Keyboard Navigation
  - Dropdown trigger: focusable with Tab
  - Enter/Space: open dropdown
  - Escape: close dropdown
  - Arrow keys: navigate user list (optional enhancement)
  - **Success:** Fully keyboard navigable
  - **Test:** Navigate with keyboard only
  - **Edge Case:** Focus trap when dropdown open

- [ ] **5.2.3** Touch Targets (Mobile)
  - All touch targets minimum 44x44px (iOS HIG)
  - Increase padding on small screens: `py-2 sm:py-1.5`
  - Increase avatar size on mobile: `h-8 w-8 sm:h-6 sm:w-6`
  - **Success:** Easy to tap on mobile devices
  - **Test:** Test on actual mobile device or Chrome DevTools
  - **Edge Case:** Fingers don't miss targets

### 5.3 Edge Case Handling

- [ ] **5.3.1** Handle 1 User (Solo Mode)
  - Show just current user avatar, no overflow badge
  - No dropdown (nothing to expand)
  - Tooltip still shows on hover: "You"
  - **Success:** Solo user mode looks clean
  - **Test:** Be the only user on canvas
  - **Edge Case:** Clicking avatar does nothing (no dropdown)

- [ ] **5.3.2** Handle Many Users (20+)
  - Dropdown becomes scrollable (max-h-[300px])
  - Consider adding search input (see 2.1.4)
  - Performance check: should render 50+ users without lag
  - **Success:** Large user list performs well
  - **Test:** Simulate 30 users (add to Realtime DB manually)
  - **Edge Case:** Scroll is smooth, no janky rendering

- [ ] **5.3.3** Handle Long Usernames
  - In avatar tooltip: wrap text, max-w-[200px]
  - In dropdown list: truncate with ellipsis `truncate`
  - Title attribute on hover shows full name
  - **Success:** Long names don't break layout
  - **Test:** User with 50-char name
  - **Edge Case:** "superlongusernamethatgoesforever@example.com" → truncates gracefully

- [ ] **5.3.4** Handle Color Contrast
  - Ensure initials are readable on all background colors
  - Use white text by default: `text-white`
  - For very light colors (#fef), use dark text: `text-gray-900`
  - Calculate luminance and adjust text color dynamically
  - **Success:** All initials are readable
  - **Test:** Try all 10 user colors from colorAssignment.ts
  - **Edge Case:** Yellow background → use dark text

- [ ] **5.3.5** Handle User Join/Leave
  - New user joins → animate avatar in
  - User leaves → fade out and remove from stack
  - Update count badge smoothly (no flash)
  - **Success:** Presence changes are smooth
  - **Test:** Open two windows, close one, watch avatar disappear
  - **Edge Case:** Rapid joins/leaves don't cause jank

---

## Phase 6: Testing and Validation (30 min)

**Goal:** Comprehensive testing of all scenarios.

### 6.1 Functional Testing

- [ ] **6.1.1** Test Solo User
  - Be the only user on canvas
  - ✓ Avatar shows in properties panel
  - ✓ Tooltip shows "You"
  - ✓ No overflow badge
  - ✓ No dropdown (or dropdown shows just you)
  - **Success:** Solo mode works perfectly
  - **Edge Case:** Clicking avatar does nothing or shows dropdown with just you

- [ ] **6.1.2** Test 2-3 Users
  - Have 2-3 users on canvas
  - ✓ All avatars visible (no overflow)
  - ✓ Avatars overlap slightly
  - ✓ Hover shows tooltip for each
  - ✓ No "+X more" badge
  - ✓ Dropdown optional (can still work)
  - **Success:** Small group looks good
  - **Edge Case:** 3 users is the max before overflow badge

- [ ] **6.1.3** Test 4+ Users
  - Have 4+ users on canvas
  - ✓ First 3 avatars visible
  - ✓ "+X more" badge shows correct count
  - ✓ Click badge → dropdown opens
  - ✓ Dropdown shows all users
  - ✓ Current user is first in list
  - ✓ Scroll works for long lists
  - **Success:** Overflow mode works perfectly
  - **Edge Case:** 10 users → "+7" badge, dropdown scrollable

- [ ] **6.1.4** Test User Join/Leave
  - Open 2 browser windows
  - Window A: Watch presence
  - Window B: Join (login)
  - ✓ Window A sees new avatar appear
  - Window B: Leave (close tab/logout)
  - ✓ Window A sees avatar disappear within 3s
  - **Success:** Real-time presence works
  - **Edge Case:** Network disconnect → user disappears (onDisconnect)

- [ ] **6.1.5** Test Interactions
  - Click avatar stack → dropdown opens
  - Click outside → dropdown closes
  - Press Escape → dropdown closes
  - Hover avatar → tooltip appears
  - Scroll dropdown → smooth scrolling
  - **Success:** All interactions work
  - **Edge Case:** Rapid clicking doesn't break dropdown

### 6.2 Visual Testing

- [ ] **6.2.1** Test Colors
  - Verify each user has consistent color (from getUserColor)
  - Colors match between avatar and dropdown list
  - Colors have good contrast with white text
  - **Success:** Colors look good and coordinated
  - **Test:** 10 users with all 10 colors

- [ ] **6.2.2** Test Layout
  - Presence section at top of PropertiesPanel
  - Presence sticky (always visible when scrolling)
  - Shape header sticks below presence
  - No layout shift when dropdown opens
  - **Success:** Layout is stable and polished
  - **Edge Case:** Narrow viewport (mobile) → still works

- [ ] **6.2.3** Test Animations
  - Avatars animate in on page load
  - Dropdown animates open/close
  - Hover effects are smooth
  - No janky animations
  - **Success:** Animations feel polished (Figma-quality)
  - **Edge Case:** Slow device → animations still smooth

### 6.3 Performance Testing

- [ ] **6.3.1** Test Render Performance
  - Chrome DevTools Performance tab
  - Record while opening/closing dropdown
  - Record with 20+ users
  - ✓ 60 FPS maintained
  - ✓ No long tasks (>50ms)
  - **Success:** Performance is excellent
  - **Edge Case:** 50 users → still smooth

- [ ] **6.3.2** Test Memory Usage
  - Chrome DevTools Memory tab
  - Open/close dropdown 20 times
  - Check for memory leaks
  - ✓ Memory stable, no leaks
  - **Success:** No memory issues
  - **Edge Case:** Long session → memory doesn't grow

---

## Phase 7: Documentation and Cleanup (30 min)

**Goal:** Document changes and clean up code.

### 7.1 Update Documentation

- [ ] **7.1.1** Add Component Documentation
  - JSDoc comments on all new components
  - Usage examples in comments
  - Props documentation complete
  - **Success:** All components well-documented
  - **Test:** TypeScript autocomplete shows docs

- [ ] **7.1.2** Update README (if needed)
  - Document new presence UI location
  - Update screenshots (if README has them)
  - **Success:** README reflects current state

### 7.2 Code Quality Check

- [ ] **7.2.1** TypeScript Strict Mode
  - Run: `npm run build`
  - ✓ No TypeScript errors
  - ✓ No `any` types
  - ✓ All props typed
  - **Success:** Build passes
  - **Edge Case:** Check for unused imports

- [ ] **7.2.2** File Size Check
  - All files under 500 lines
  - UserAvatar.tsx: ~60 lines
  - AvatarStack.tsx: ~100 lines
  - PresenceDropdown.tsx: ~120 lines
  - PropertiesPanel.tsx: ~150 lines
  - **Success:** All files reasonably sized
  - **Edge Case:** If over 500, split into smaller modules

- [ ] **7.2.3** Import Organization
  - Use @ alias for all imports (no relative ../../../)
  - Group imports: react → react-konva → @/types → local
  - Remove unused imports
  - **Success:** Clean import statements
  - **Test:** ESLint passes

### 7.3 Final Testing

- [ ] **7.3.1** Smoke Test All Features
  - ✓ Login works
  - ✓ Canvas loads
  - ✓ Presence avatars visible
  - ✓ Dropdown works
  - ✓ Shapes can be created
  - ✓ Properties panel works
  - ✓ Multi-user sync works
  - **Success:** Everything still works after changes
  - **Edge Case:** No regressions introduced

---

## Success Criteria

Phase 7 is complete when:

1. ✅ **Old ActiveUsers component removed from top-right**
2. ✅ **Presence avatars integrated into PropertiesPanel (top section)**
3. ✅ **Avatars overlap Figma-style** (3 visible + overflow badge)
4. ✅ **Colors coordinated** (same getUserColor utility)
5. ✅ **Tooltips show usernames on hover**
6. ✅ **Dropdown works for 4+ users** (scrollable, searchable)
7. ✅ **Current user always first** in list with "(You)" badge
8. ✅ **Real-time updates** (users join/leave smoothly)
9. ✅ **Animations polished** (fade in, scale, smooth transitions)
10. ✅ **Fully accessible** (keyboard nav, screen readers, ARIA)
11. ✅ **Mobile-friendly** (touch targets, responsive)
12. ✅ **Performance** (60 FPS, no memory leaks, fast rendering)
13. ✅ **All edge cases handled** (1 user, 50 users, long names, etc.)
14. ✅ **Code quality** (TypeScript strict, <500 lines/file, documented)
15. ✅ **No regressions** (all existing features still work)

---

## Commit Strategy

After completing all phases:

```bash
git add .
git commit -m "feat: Integrate Figma-style presence avatars into PropertiesPanel

- Remove standalone ActiveUsers component from top-right
- Create UserAvatar component with initials and colors
- Create AvatarStack with overlapping layout and overflow badge
- Create PresenceDropdown with full user list and search
- Integrate at top of PropertiesPanel (always visible)
- Add animations, tooltips, and accessibility
- Support 1 to 50+ users gracefully
- Maintain 60 FPS performance

Closes #[issue-number]"
```

---

## Visual Reference

### Before (Current State)
```
┌─────────────────────────────────────┐
│  [Menu]              [Active Users] │  ← Standalone panel top-right
│                      ┌─────────────┐│
│                      │ • User 1    ││
│                      │ • User 2    ││
│                      └─────────────┘│
│                                     │
│         Canvas Area                 │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### After (Target State)
```
┌─────────────────────────────────────┬────────────┐
│  [Menu]                             │ Active: ⚫⚫⚫+2│  ← In PropertiesPanel
│                                     ├────────────┤
│                                     │ □ Rectangle│
│                                     │            │
│         Canvas Area                 │ Position   │
│                                     │ X: 100     │
│                                     │ Y: 200     │
│                                     │            │
│                                     │ Fill       │
└─────────────────────────────────────┴────────────┘
```

### Dropdown Expanded
```
┌────────────────────┐
│ Active Users    (5)│  ← Header with count
├────────────────────┤
│ ⚫ You          (You)│  ← Current user first
│ ⚫ John Doe         │
│ ⚫ Jane Smith       │
│ ⚫ Bob Wilson       │
│ ⚫ Alice Brown      │
└────────────────────┘
```

---

## Notes

- **Colors:** Use existing `getUserColor()` utility from `features/collaboration/utils/colorAssignment.ts`
- **Presence:** Use existing `usePresence()` hook from `features/collaboration/hooks/usePresence.ts`
- **Auth:** Use existing `useAuth()` hook for current user
- **Performance:** React.memo all avatar components to prevent unnecessary re-renders
- **Figma Reference:** Look at Figma's top-right avatar stack for design inspiration

---

**Ready to start? Begin with Phase 1, Task 1.1.1!**
