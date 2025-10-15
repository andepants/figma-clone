# Phase 6 Testing Documentation

**Status:** 🔄 READY FOR MANUAL TESTING
**Development Server:** http://localhost:5181/

---

## Quick Start

1. **Open Development Server**
   ```
   http://localhost:5181/
   ```

2. **Open Testing Guide**
   ```
   /Users/andre/coding/figma-clone/_docs/testing/manual-testing-guide.md
   ```

3. **Follow Test Suites**
   - Suite 1: Full-Item Dragging (6 tests)
   - Suite 2: Hierarchy System (8 tests)
   - Suite 3: Shift-Click Selection (5 tests)
   - Suite 4: Lock Feature (13 tests)
   - Suite 5: Section Header (5 tests)
   - Suite 6: Integration (5 tests)
   - Performance Tests (4 tests)
   - Accessibility Tests (3 tests)

4. **Document Results**
   - Update: `/Users/andre/coding/figma-clone/_docs/testing/phase-6-test-report.md`
   - Mark tests as ✅ PASS or ❌ FAIL
   - Document bugs with screenshots

---

## Files

### 📋 Test Report (Results go here)
`/Users/andre/coding/figma-clone/_docs/testing/phase-6-test-report.md`

**Purpose:** Document actual test results, bugs found, performance metrics

**Update as you test:**
- Change ⏳ PENDING → ✅ PASS or ❌ FAIL
- Fill in "Actual" behavior
- Add bugs to Bug section

### 📖 Testing Guide (Follow these steps)
`/Users/andre/coding/figma-clone/_docs/testing/manual-testing-guide.md`

**Purpose:** Step-by-step testing instructions

**How to use:**
1. Read each test case carefully
2. Follow steps exactly
3. Verify expected behavior
4. Document results in Test Report

### 📊 This File (Overview)
`/Users/andre/coding/figma-clone/_docs/testing/TESTING_README.md`

**Purpose:** Quick reference and overview

---

## Testing Scope

### Phase 6.1: Comprehensive Feature Testing (1.5-2 hours)
✅ All features implemented in Phases 1-5
✅ Individual feature tests
✅ Integration tests

**Total Tests:** 42 test cases

### Phase 6.2: Performance Testing (30 minutes)
✅ 100 flat objects
✅ 50 parents with 100 children
✅ Expand/collapse animations
✅ Drag-drop performance

**Total Tests:** 4 performance benchmarks

### Phase 6.3: Bug Fixes & Polish (30-45 minutes)
✅ Fix discovered bugs
✅ Polish UX details
✅ Verify accessibility

**Total Tasks:** TBD based on findings

---

## Features Being Tested

### ✅ Phase 1: Full-Item Dragging
- Drag from any part of layer item
- No grip icon needed
- Rename input prevents drag
- Interactive buttons prevent drag

### ✅ Phase 2: Hierarchy System
- Parent-child relationships
- Drag-drop to create hierarchy
- Collapse/expand parents
- Indentation (16px per level)
- Select parent = select children
- Prevent circular references

### ✅ Phase 3: Shift-Click Range Selection
- Click → Shift+click selects range
- Bidirectional (up/down)
- Adds to existing selection
- Works with hierarchies

### ✅ Phase 4: Lock Feature
- Lock prevents canvas selection
- Lock prevents drag/resize/delete
- Lock icon visibility
- Keyboard shortcut (Shift+Cmd/Ctrl+L)
- Parent-child lock cascading
- Inherited lock indicator
- Blue selection outline (not dashed gray)

### ✅ Phase 5: Collapsible Section Header
- "LAYERS" header with arrow
- Shows object count
- State persists (localStorage)

---

## Critical Test Areas

### 🔴 High Priority
1. **Lock Feature** (Phase 4)
   - Most complex implementation
   - Parent-child cascading
   - Inherited lock state
   - Selection outline style

2. **Hierarchy System** (Phase 2)
   - Core functionality
   - Drag-drop zones (before/child/after)
   - Circular reference prevention
   - Deep nesting

3. **Integration** (Suite 6)
   - Features working together
   - Lock + Hierarchy
   - Lock + Selection
   - Lock + Delete

### 🟡 Medium Priority
4. **Shift-Click Selection** (Phase 3)
   - Range selection logic
   - Works with hierarchies
   - Display order (collapsed parents)

5. **Performance** (Suite P)
   - 60 FPS target
   - Large datasets (100+ objects)
   - Animation smoothness

### 🟢 Low Priority
6. **Full-Item Dragging** (Phase 1)
   - Already tested in Phases 1-5
   - Just verify no regressions

7. **Section Header** (Phase 5)
   - Simple feature
   - Quick to test

---

## Expected Issues

### Known Complexity Areas
1. **Drag-drop zones** (before/child/after)
   - May need UX tweaking
   - Blue line vs blue box indicators

2. **Lock cascading** (parent → children)
   - Complex state management
   - Edge cases with multi-level hierarchy

3. **Range selection with hierarchy**
   - Display order vs object order
   - Collapsed parents

### Potential Bugs
- Lock icon opacity transitions
- Inherited lock indicator not showing
- Circular reference not prevented
- Range selection off by one
- Performance with 100+ objects

---

## Performance Targets

| Metric | Target | Tools |
|--------|--------|-------|
| Frame Rate | 60 FPS (< 16ms/frame) | Chrome DevTools Performance |
| Scroll | Smooth, no jank | Visual inspection |
| Animations | 150ms duration | Smooth transitions |
| Drag-drop | No lag | Visual inspection |
| Memory | Stable | Chrome Task Manager |

---

## Accessibility Requirements

| Requirement | Status |
|-------------|--------|
| Keyboard navigation | ⏳ TEST |
| Focus indicators | ⏳ TEST |
| ARIA labels | ⏳ TEST |
| Screen reader | ⏳ TEST |
| Keyboard shortcuts | ⏳ TEST |

---

## Bug Severity Levels

### 🔴 Critical
- Breaks core functionality
- Data loss
- Cannot proceed with workflow
- **Action:** Fix immediately

### 🟡 Minor
- Cosmetic issues
- Edge case bugs
- Doesn't block workflow
- **Action:** Fix in Phase 6.3

### 🔵 Polish
- UX improvements
- Animation tweaks
- Color/spacing adjustments
- **Action:** Optional, time permitting

---

## Testing Workflow

```
1. Start → Manual Testing Guide
         ↓
2. Follow Test Suite 1-6
         ↓
3. Document in Test Report
         ↓
4. Performance Testing
         ↓
5. Accessibility Testing
         ↓
6. Bug Documentation
         ↓
7. Bug Fixes (Phase 6.3)
         ↓
8. Re-test Fixed Bugs
         ↓
9. Final Sign-off
```

---

## After Testing

### If All Tests Pass ✅
1. Mark all checkboxes in Test Report
2. Update plan: Phase 6.1 → [x] Complete
3. Proceed to Phase 6.3 (Polish)

### If Bugs Found ❌
1. Document in Test Report (Bug section)
2. Prioritize: Critical → Minor → Polish
3. Create bug fix tasks
4. Execute Phase 6.3 (Bug Fixes)
5. Re-test after fixes

---

## Next Steps After Phase 6

1. ✅ Update plan checkboxes
2. ✅ Create Phase 7 (Documentation) tasks
3. ✅ Document hierarchy system
4. ✅ Document lock system
5. ✅ Update CLAUDE.md
6. ✅ Create usage examples
7. ✅ Final implementation review
8. ✅ Mark plan complete

---

## Questions?

If you encounter unexpected behavior:

1. **Check Console** - Any errors?
2. **Check Network** - Firebase sync issues?
3. **Check localStorage** - Corrupted state?
4. **Clear cache** - Cmd+Shift+R
5. **Document** - Screenshot + describe in Test Report

---

## Contact

**Plan Coordinator:** Claude Code
**Plan Document:** `/Users/andre/coding/figma-clone/_docs/plan/left-sidebar-enhancements.md`
**Current Phase:** Phase 6 - Testing & Polish

---

**Ready to begin testing!** 🚀

Open http://localhost:5181/ and follow the Manual Testing Guide.
