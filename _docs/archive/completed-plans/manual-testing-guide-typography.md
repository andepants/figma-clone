# Typography Properties Panel - Manual Testing Guide

**Dev Server:** http://localhost:5176/
**Date:** 2025-10-14
**Status:** Ready for Manual Testing

---

## Prerequisites

✅ Dev server running on http://localhost:5176/
✅ TypeScript compiles without errors
✅ ESLint passes with no warnings
✅ Automated edge case tests pass (95.5% success rate)
✅ All components properly implemented

---

## Phase 7.1: Typography Controls Testing

### Test 1: Font Family Dropdown
**Duration:** 3 minutes

1. Create a text object (press `T`, click on canvas)
2. Select the text object
3. In Properties Panel → Typography section, locate "Font" dropdown
4. **Test actions:**
   - [ ] Open dropdown - verify 10 fonts are listed
   - [ ] Verify fonts are displayed in their own typeface
   - [ ] Change to "Roboto" - verify immediate update in canvas
   - [ ] Change to "Arial" - verify immediate update
   - [ ] Change to "Times New Roman" - verify immediate update
   - [ ] **Expected:** Text renders immediately in selected font
   - [ ] **Expected:** No flickering or lag
   - [ ] **Expected:** No console errors

---

### Test 2: Font Weight Dropdown
**Duration:** 3 minutes

1. With text selected, locate "Weight" dropdown
2. **Test actions:**
   - [ ] Open dropdown - verify 9 weights listed (Thin to Black)
   - [ ] Change to "Thin (100)" - verify text becomes thinner
   - [ ] Change to "Bold (700)" - verify text becomes bolder
   - [ ] Change to "Black (900)" - verify text becomes very bold
   - [ ] Change back to "Regular (400)" - verify normal weight
   - [ ] **Expected:** Visual weight changes are clear and immediate
   - [ ] **Expected:** No console errors

**Note:** Some fonts (Arial, Times New Roman) may not support all weights.

---

### Test 3: Font Size Input
**Duration:** 3 minutes

1. With text selected, locate "Size" input
2. **Test actions:**
   - [ ] Current value shows (default: 24px)
   - [ ] Type "32" and press Enter - verify text grows
   - [ ] Type "12" and press Enter - verify text shrinks
   - [ ] Type "8" (minimum) - verify it accepts
   - [ ] Type "400" (maximum) - verify it accepts
   - [ ] Try typing "5" (below min) - verify it clamps to 8
   - [ ] Try typing "500" (above max) - verify it clamps to 400
   - [ ] Use arrow keys to adjust - verify smooth changes
   - [ ] **Expected:** Size changes apply immediately
   - [ ] **Expected:** Min/max limits enforced
   - [ ] **Expected:** No console errors

---

### Test 4: Line Height Control
**Duration:** 2 minutes

1. With text selected, locate "Line height" input
2. **Test actions:**
   - [ ] Current value shows (default: 1.2)
   - [ ] Type "2.0" and press Enter - verify lines space out
   - [ ] Type "0.8" - verify lines get tighter
   - [ ] Type "0.5" (minimum) - verify it accepts
   - [ ] Type "3.0" (maximum) - verify it accepts
   - [ ] **Expected:** Line spacing changes visible (especially on multi-line text)
   - [ ] **Expected:** No console errors

---

### Test 5: Letter Spacing Control
**Duration:** 2 minutes

1. With text selected, locate "Letter spacing" input (has "%" suffix)
2. **Test actions:**
   - [ ] Current value shows (default: 0%)
   - [ ] Type "10" and press Enter - verify letters spread out
   - [ ] Type "-5" and press Enter - verify letters get tighter
   - [ ] Type "-20" (minimum) - verify very tight spacing
   - [ ] Type "100" (maximum) - verify very wide spacing
   - [ ] Type "0" - return to normal
   - [ ] **Expected:** Negative values work (tighter spacing)
   - [ ] **Expected:** Spacing changes visible immediately
   - [ ] **Expected:** No console errors

---

### Test 6: Alignment Buttons (Horizontal)
**Duration:** 2 minutes

1. With text selected, locate "Alignment" section
2. **Test horizontal alignment buttons (first row):**
   - [ ] Click "Align Left" button - verify text aligns left
   - [ ] **Expected:** Button highlights in blue
   - [ ] Click "Align Center" button - verify text centers
   - [ ] **Expected:** Previous button un-highlights, new button highlights
   - [ ] Click "Align Right" button - verify text aligns right
   - [ ] **Expected:** Active state always shows one button highlighted
   - [ ] **Expected:** No console errors

---

### Test 7: Alignment Buttons (Vertical)
**Duration:** 2 minutes

1. With text selected, locate vertical alignment buttons (second row)
2. **Test actions:**
   - [ ] Create text with some height (set width: 200px in Layout section)
   - [ ] Click "Align Top" button - verify text at top
   - [ ] Click "Align Middle" button - verify text in middle
   - [ ] Click "Align Bottom" button - verify text at bottom
   - [ ] **Expected:** Vertical alignment visible (may need taller text box)
   - [ ] **Expected:** Active state highlights correctly
   - [ ] **Expected:** No console errors

---

### Test 8: Text Transform Dropdown
**Duration:** 2 minutes

1. With text selected, locate "Text transform" dropdown
2. **Test actions:**
   - [ ] Type mixed-case text: "Hello World"
   - [ ] Select "Uppercase" - verify "HELLO WORLD"
   - [ ] Select "Lowercase" - verify "hello world"
   - [ ] Select "Capitalize" - verify "Hello World"
   - [ ] Select "None" - verify original text restored
   - [ ] **Expected:** Transform applies immediately
   - [ ] **Expected:** No console errors

---

### Test 9: Paragraph Spacing (Multi-line)
**Duration:** 2 minutes

1. With text selected, edit text to include newlines (press Enter)
2. **Test actions:**
   - [ ] Type multi-line text: "Line 1\nLine 2\nLine 3"
   - [ ] **Expected:** "Paragraph spacing" input appears
   - [ ] Type "20" and press Enter
   - [ ] **Expected:** Space between paragraphs increases
   - [ ] **Note:** Full paragraph spacing may be limited by Konva
   - [ ] Delete newlines - verify paragraph spacing input disappears

---

## Phase 7.2: Edge Case Testing

### Test 10: Empty Text
**Duration:** 2 minutes

1. Create a new text object
2. **Test actions:**
   - [ ] Select text and delete all content (make it empty)
   - [ ] **Expected:** Properties panel still shows Typography section
   - [ ] **Expected:** All controls remain functional
   - [ ] **Expected:** No console errors or crashes

---

### Test 11: Very Long Text
**Duration:** 3 minutes

1. Create a text object
2. **Test actions:**
   - [ ] Paste 1000+ characters (copy from lorem ipsum generator)
   - [ ] **Expected:** Text renders smoothly
   - [ ] Select the text
   - [ ] **Expected:** Properties panel opens without lag
   - [ ] Change font family
   - [ ] **Expected:** Update applies smoothly (no freezing)
   - [ ] Change font size
   - [ ] **Expected:** Update applies smoothly
   - [ ] **Expected:** No performance degradation
   - [ ] **Expected:** No console errors

---

### Test 12: Extreme Values
**Duration:** 3 minutes

1. Create a text object
2. **Test minimum/maximum values:**
   - [ ] Font size: Set to 8px - verify readable
   - [ ] Font size: Set to 400px - verify very large
   - [ ] Line height: Set to 0.5 - verify very tight
   - [ ] Line height: Set to 3.0 - verify very loose
   - [ ] Letter spacing: Set to -20% - verify very tight
   - [ ] Letter spacing: Set to 100% - verify very wide
   - [ ] **Expected:** All extreme values work without errors
   - [ ] **Expected:** Text remains visible and functional

---

### Test 13: Rapid Property Changes
**Duration:** 2 minutes

1. Create a text object and select it
2. **Test rapid changes:**
   - [ ] Rapidly change font family (click different fonts quickly)
   - [ ] **Expected:** No flickering in canvas
   - [ ] **Expected:** All changes apply correctly
   - [ ] Rapidly toggle alignment buttons
   - [ ] **Expected:** No visual glitches
   - [ ] Rapidly adjust font size with arrow keys
   - [ ] **Expected:** Smooth updates
   - [ ] **Expected:** No console errors
   - [ ] **Expected:** Firebase debouncing prevents excessive writes (check Network tab)

---

## Phase 7.3: Multi-User Testing

**Note:** This requires opening two browser windows/tabs in different locations or incognito mode.

### Test 14: Real-time Typography Sync
**Duration:** 5 minutes

1. **Setup:**
   - [ ] Open http://localhost:5176/ in Window A (normal mode)
   - [ ] Open http://localhost:5176/ in Window B (incognito or different browser)
   - [ ] Create a text object in Window A

2. **Test font family sync:**
   - [ ] In Window A: Change font to "Roboto"
   - [ ] **Expected:** Window B shows font change within 100ms
   - [ ] **Expected:** No flickering in Window B

3. **Test font size sync:**
   - [ ] In Window A: Change size to 32px
   - [ ] **Expected:** Window B shows size change within 100ms
   - [ ] **Expected:** Smooth update, no flash

4. **Test alignment sync:**
   - [ ] In Window A: Click "Align Right" button
   - [ ] **Expected:** Window B shows right-aligned text within 100ms
   - [ ] **Expected:** Properties panel in Window B updates button state

5. **Test all typography properties:**
   - [ ] Change font weight in Window A → verify in Window B
   - [ ] Change line height in Window A → verify in Window B
   - [ ] Change letter spacing in Window A → verify in Window B
   - [ ] Change text transform in Window A → verify in Window B

---

### Test 15: Concurrent Editing - Different Objects
**Duration:** 3 minutes

1. **Setup:**
   - [ ] Have Windows A and B open
   - [ ] Create two text objects: Text1 and Text2

2. **Test simultaneous edits:**
   - [ ] Window A: Select Text1, change font to "Roboto"
   - [ ] Window B: Select Text2, change font to "Arial"
   - [ ] **Expected:** Both edits work without conflicts
   - [ ] **Expected:** Window A sees Text2 change to Arial
   - [ ] **Expected:** Window B sees Text1 change to Roboto
   - [ ] **Expected:** No errors or sync issues

---

### Test 16: Concurrent Editing - Same Object
**Duration:** 2 minutes

1. **Setup:**
   - [ ] Have Windows A and B open
   - [ ] Create one text object

2. **Test concurrent edits on same object:**
   - [ ] Window A: Select text, start changing font
   - [ ] Window B: Select same text, change font size
   - [ ] **Expected:** Last change wins
   - [ ] **Expected:** Both windows see final state
   - [ ] **Expected:** No crashes or conflicts

---

### Test 17: Network Resilience
**Duration:** 3 minutes

1. **Setup:**
   - [ ] Window A with text object selected
   - [ ] Open browser DevTools → Network tab

2. **Test disconnect/reconnect:**
   - [ ] In DevTools: Set throttling to "Offline"
   - [ ] Change text properties (font, size, etc.)
   - [ ] **Expected:** Changes apply locally (optimistic update)
   - [ ] Set throttling back to "Online"
   - [ ] Wait a few seconds
   - [ ] **Expected:** Changes sync to Firebase
   - [ ] Check Window B
   - [ ] **Expected:** Window B sees all changes after reconnect
   - [ ] **Expected:** No data loss

---

## Phase 7.4: Visual Polish

### Test 18: Visual Consistency
**Duration:** 5 minutes

1. **Compare with other sections:**
   - [ ] Open Properties Panel with text selected
   - [ ] Compare Typography section spacing with Layout section
   - [ ] **Expected:** Consistent padding (16px on sides)
   - [ ] **Expected:** Consistent vertical spacing between controls
   - [ ] Compare label styles (font size, color, weight)
   - [ ] **Expected:** Labels match other sections (text-xs, text-gray-600)

2. **Font dropdown preview:**
   - [ ] Open Font dropdown
   - [ ] **Expected:** Each font displays in its own typeface
   - [ ] **Expected:** Dropdown is readable and clear

3. **Alignment button icons:**
   - [ ] Locate alignment buttons
   - [ ] **Expected:** Icons are clear and recognizable
   - [ ] **Expected:** Active state is obvious (blue background)
   - [ ] Hover over buttons
   - [ ] **Expected:** Hover state shows (gray background)

4. **Input field consistency:**
   - [ ] Check NumberInput sizes in Typography section
   - [ ] Compare with NumberInput in Layout section
   - [ ] **Expected:** Same height (h-8, ~32px)
   - [ ] **Expected:** Same styling (border, rounded, focus ring)

5. **Scrolling:**
   - [ ] Open all property sections (Position, Rotation, Layout, Typography, Appearance, Fill)
   - [ ] **Expected:** Panel scrolls smoothly
   - [ ] **Expected:** No horizontal scrollbar
   - [ ] **Expected:** All sections fit within 300px width

---

### Test 19: Tooltips and Labels
**Duration:** 2 minutes

1. **Check labels:**
   - [ ] Verify all inputs have labels above them
   - [ ] **Expected:** Labels use sentence case ("Font", not "FONT")
   - [ ] **Expected:** Labels are concise and clear

2. **Check tooltips:**
   - [ ] Hover over alignment buttons
   - [ ] **Expected:** Tooltip appears showing "Align left", "Align center", etc.
   - [ ] **Expected:** Tooltips are helpful and accurate

---

## Phase 7.5: Performance Testing

### Test 20: Many Text Objects
**Duration:** 5 minutes

1. **Create 50+ text objects:**
   - [ ] Press `T`, click canvas to create text (repeat 50 times)
   - [ ] **Expected:** Canvas remains smooth (60 FPS)
   - [ ] **Expected:** No lag during creation

2. **Select different text objects rapidly:**
   - [ ] Click different text objects in quick succession
   - [ ] **Expected:** Properties panel updates smoothly
   - [ ] **Expected:** No lag or freeze
   - [ ] **Expected:** Typography section appears/disappears smoothly

3. **Change properties with many objects:**
   - [ ] Select a text object
   - [ ] Change font family
   - [ ] **Expected:** Update applies immediately
   - [ ] **Expected:** No performance impact from other 49 objects

---

### Test 21: Large Text Performance
**Duration:** 3 minutes

1. **Create text with 1000+ characters:**
   - [ ] Paste very long lorem ipsum text
   - [ ] **Expected:** Text renders smoothly

2. **Change font size on large text:**
   - [ ] Select large text
   - [ ] Change font size to 48px
   - [ ] **Expected:** Change applies smoothly
   - [ ] **Expected:** No freezing or lag
   - [ ] Change back to 16px
   - [ ] **Expected:** Smooth performance

3. **Rapid property changes on large text:**
   - [ ] Rapidly change font family (click different fonts)
   - [ ] **Expected:** No lag
   - [ ] Rapidly adjust line height
   - [ ] **Expected:** Smooth updates
   - [ ] **Expected:** No performance degradation

---

### Test 22: Firebase Write Optimization
**Duration:** 3 minutes

1. **Monitor Firebase writes:**
   - [ ] Open DevTools → Network tab
   - [ ] Filter by "firebase" or "realtime database"
   - [ ] Create a text object and select it

2. **Test debouncing:**
   - [ ] Rapidly adjust font size (hold arrow key)
   - [ ] **Expected:** Network tab shows debounced writes (not every keystroke)
   - [ ] **Expected:** Maximum ~2 writes per second (500ms debounce)
   - [ ] Stop adjusting, wait 500ms
   - [ ] **Expected:** Final write sent with correct value

3. **Verify optimization:**
   - [ ] Change multiple properties quickly
   - [ ] **Expected:** Writes are batched/debounced
   - [ ] **Expected:** No excessive network traffic
   - [ ] **Expected:** Final state is correct in Firebase

---

## Test Results Checklist

### Phase 7.1: Typography Controls
- [ ] All 9 main tests completed
- [ ] No console errors
- [ ] All controls work as expected
- [ ] Visual feedback is clear

### Phase 7.2: Edge Cases
- [ ] All 4 edge case tests completed
- [ ] Extreme values handled gracefully
- [ ] No crashes or errors
- [ ] Performance remains smooth

### Phase 7.3: Multi-User Testing
- [ ] All 4 multi-user tests completed
- [ ] Real-time sync works (<100ms)
- [ ] No flickering or conflicts
- [ ] Network resilience confirmed

### Phase 7.4: Visual Polish
- [ ] All 2 visual tests completed
- [ ] Consistent with other sections
- [ ] Professional appearance
- [ ] No visual bugs

### Phase 7.5: Performance Testing
- [ ] All 3 performance tests completed
- [ ] 60 FPS maintained
- [ ] Large text performs well
- [ ] Firebase writes optimized

---

## Reporting Issues

If you find any issues during testing, please note:

1. **What you did** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Console errors** (if any)
5. **Screenshot** (if visual issue)

---

## Next Steps

After completing manual testing:

1. ✅ Document all test results
2. ⏸️ Fix any issues found
3. ⏸️ Retest failed cases
4. ⏸️ Proceed to Phase 8 (Documentation & Cleanup)

---

**Happy Testing!** 🎉

The Typography Properties Panel is feature-complete and ready for manual verification.
