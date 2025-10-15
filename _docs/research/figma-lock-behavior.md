# Figma Lock Behavior Research

**Date:** 2025-10-15
**Purpose:** Document Figma's lock implementation to ensure our CollabCanvas lock feature matches industry standards.

---

## Overview

Locking in Figma prevents layers from being moved or accidentally edited while still allowing certain interactions.

---

## Lock Icon Location

1. **Layers Panel:** Padlock icon appears next to each layer name
   - Hover to reveal unlock icon for unlocked layers
   - Always visible when locked (closed padlock)

2. **Canvas:** No lock icon visible on the canvas itself

3. **Properties Panel:** Lock status visible in properties (possibly)

---

## Actions Prevented by Lock

When a layer is locked in Figma:

1. **Selection:** Cannot select via normal left-click on canvas
2. **Drag:** Cannot move or reposition
3. **Resize:** Cannot resize or transform
4. **Editing:** Cannot edit content (text, shapes, etc.)
5. **Creating Connections:** Cannot attach connections to locked objects

---

## What You CAN Do with Locked Objects

1. **Select from Layers Panel:** Can select locked layers via Layers Panel
2. **Select from Right-Click Menu:** Right-click → "Select layer" works
3. **View Properties:** Can view (and adjust) properties in Properties Panel
4. **Duplicate:** Can duplicate locked objects (creates unlocked copy)
5. **Unlock:** Can unlock from Layers Panel or context menu

---

## Visual Indicators

1. **Padlock Icon:**
   - Unlocked: Shows on hover only in Layers Panel
   - Locked: Always visible in Layers Panel (closed padlock)

2. **Canvas:**
   - No special visual indicator on canvas when locked
   - Cannot select on canvas (click passes through)

3. **Selection Outline:**
   - When selected from Layers Panel, locked objects show selection outline
   - But cannot be transformed or moved

---

## Keyboard Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Lock/Unlock Selection | ⌘ Shift L | Ctrl Shift L |
| Unlock All | Edit → Unlock All | Edit → Unlock All |

**Important:**
- Shift + Command + L (not just Cmd+L)
- Toggles lock state for selected layer(s)
- Works on multiple selected layers at once

---

## Parent-Child Lock Behavior

**Critical Finding:**

1. **Locking a parent automatically locks ALL children**
   - Cannot select child layers on canvas when parent is locked
   - Cannot individually unlock children while parent is locked
   - Must unlock parent first to access children

2. **This is a source of user frustration:**
   - Users want to lock frame position but keep contents editable
   - No native way to lock just frame without locking children
   - Common feature request in Figma forums

**Decision for CollabCanvas:**
- For MVP: Implement Figma's behavior (lock parent locks children)
- Future enhancement: Option to lock position only (not children)

---

## Deletion Behavior

- Locked layers cannot be deleted via Delete/Backspace key
- Context menu "Delete" disabled for locked layers
- Must unlock before deleting

---

## Multi-User Behavior

- Lock state syncs across all users in real-time
- Any editor can lock/unlock layers (if they have edit access)
- Locked state visible to all collaborators

---

## Context Menu Differences

For **locked** objects:
- ✅ Select layer (enabled)
- ✅ Duplicate (enabled)
- ✅ Unlock (enabled)
- ❌ Delete (disabled)
- ❌ Rename (likely disabled)
- ❌ Reorder (Bring to Front, Send to Back - disabled)

For **unlocked** objects:
- All actions enabled

---

## Properties Panel Behavior

When locked object is selected from Layers Panel:
- Properties are visible
- Can adjust properties (color, size, etc.)
- This seems inconsistent with "prevents editing" but is Figma's behavior
- **Clarification needed:** Some sources say properties can be adjusted, others say editing is prevented

---

## Comparison with Our Implementation

### What We've Implemented Correctly ✅

1. ✅ Lock icon in Layers Panel (show on hover, always visible when locked)
2. ✅ Click on canvas doesn't select locked objects
3. ✅ Locked objects cannot be dragged
4. ✅ Locked objects cannot be resized (no transform handles)
5. ✅ Locked objects cannot be deleted via Delete key
6. ✅ Can select locked objects from Layers Panel
7. ✅ Context menu disabled for locked actions
8. ✅ Lock state syncs via RTDB

### Gaps to Address ❌

1. ❌ **Keyboard Shortcut:** Need Shift+Cmd+L (not just Cmd+L)
   - Currently: No keyboard shortcut implemented
   - Should add: Toggle lock for selected layer(s)

2. ❌ **Parent-Child Lock Behavior:** Not yet implemented
   - Currently: Each object locks independently
   - Should add: Locking parent locks all descendants
   - Should add: Unlocking parent unlocks all descendants
   - Should add: Cannot unlock child while parent is locked

3. ❌ **Selection Outline Style:** Not matching Figma
   - Currently: Using dashed gray outline
   - Figma: Normal selection outline (but no transform handles)
   - Should use: Normal blue outline, just disable handles

4. ❌ **Properties Panel Behavior:** Need to clarify
   - Currently: Likely allows property edits
   - Figma: Allows property adjustments (?)
   - Action: Test Figma to confirm, then document expected behavior

5. ❌ **Lock All / Unlock All:** Not implemented
   - Could add to context menu or Edit menu in future

6. ❌ **Multi-Select Lock Toggle:** Need to test
   - Should work: Select 3 objects → Shift+Cmd+L → all lock/unlock
   - Behavior: If any are locked, unlock all; if all unlocked, lock all

---

## Recommendations for Phase 4.4.2

### High Priority (Implement Now)

1. **Add Keyboard Shortcut: Shift+Cmd+L / Shift+Ctrl+L**
   - Update keyboard shortcuts constants
   - Add handler in useLayerShortcuts or similar
   - Toggle lock for all selected objects

2. **Implement Parent-Child Lock Behavior**
   - When locking object, lock all descendants
   - When unlocking object, unlock all descendants
   - Prevent unlocking child while parent is locked
   - Add tests for nested hierarchies

3. **Fix Selection Outline for Locked Objects**
   - Use normal blue outline (not dashed gray)
   - Just disable transform handles
   - Keep listening={false} for click events

### Medium Priority (Consider for MVP)

4. **Multi-Select Lock Toggle Behavior**
   - Test with multiple selected objects
   - Ensure consistent toggle behavior

5. **Context Menu: "Select Layer" Option**
   - Add "Select layer" option for locked objects in canvas context menu
   - Currently only available in Layers Panel

### Low Priority (Future Enhancement)

6. **Lock Position Only (Not Children)**
   - Toggle to lock frame position without locking children
   - User-requested feature not in Figma

7. **Unlock All Command**
   - Add to Edit menu or as keyboard shortcut
   - Unlocks all objects in current page/selection

---

## Testing Checklist

After implementing gaps:

- [ ] Shift+Cmd+L locks/unlocks selected layer
- [ ] Shift+Cmd+L works on multiple selected layers
- [ ] Locking parent locks all children
- [ ] Cannot unlock child while parent is locked
- [ ] Locked objects show normal blue selection outline (not dashed)
- [ ] Locked objects have no transform handles
- [ ] Lock state syncs across users
- [ ] Context menu disabled appropriately for locked objects

---

## References

- [Figma Help: Lock and unlock layers](https://help.figma.com/hc/en-us/articles/360041596573-Lock-and-unlock-layers)
- [Figma Forum: Parent-child lock behavior discussions](https://forum.figma.com/suggest-a-feature-11/stop-frames-from-moving-around-10833)
- Web search: "Figma lock unlock keyboard shortcut"
- Web search: "Figma locked object behavior"

---

## Notes

- Figma's parent-child lock behavior is intentional but controversial
- Many users want independent frame position locking
- Our implementation should match Figma for consistency
- Can add enhanced features later as differentiator
