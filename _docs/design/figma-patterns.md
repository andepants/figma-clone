# Figma Design Patterns Reference

This document serves as a consistent reference for implementing Figma-inspired UX patterns in CollabCanvas.

## Z-Index & Layer Ordering

**Array Position Mapping:**
- **Top of layers panel** = **front of canvas** (highest z-index)
- **Bottom of layers panel** = **back of canvas** (lowest z-index)
- Implementation: Last item in `objects` array renders on top

**Reordering:**
- Drag up in layers panel = bring forward (higher z-index)
- Drag down in layers panel = send backward (lower z-index)
- Visual feedback during drag shows drop position indicator

**Keyboard Shortcuts:**
- `]` - Bring selected object(s) to front
- `[` - Send selected object(s) to back

## Grouping (Cmd+G)

**Data Model:**
- Groups use parent-child hierarchy via `parentId` property
- Groups are special object type with no visual representation on canvas
- Groups exist only in hierarchy tree for organizational purposes

**Behavior:**
- Groups created with 2+ selected objects using Cmd+G
- Groups auto-collapse with arrow icon in layers panel
- Empty groups are automatically deleted when last child removed
- Nested groups fully supported (groups can contain groups)
- Children inherit parent's lock/visibility state

**Visual Indicators:**
- Folder icon in layers panel
- Collapse arrow (chevron) shows/hides children
- Indentation shows hierarchy depth (16px per level)

**Keyboard Shortcuts:**
- `Cmd/Ctrl+G` - Group selection (requires 2+ objects)
- `Shift+Cmd/Ctrl+G` - Ungroup selected group

## Context Menu

**Trigger:**
- Right-click object in layers panel
- Context menu appears at cursor position

**Menu Structure:**
- Separators divide action categories
- Keyboard shortcuts displayed on right side
- Disabled items grayed out and not clickable
- Destructive actions (e.g., Delete) shown in red

**Standard Actions:**
1. Bring to Front / Send to Back
2. Separator
3. Rename
4. Separator
5. Copy / Paste
6. Separator
7. Group Selection / Ungroup (context-dependent)
8. Separator
9. Show/Hide
10. Lock/Unlock

**Behavior:**
- Closes on click-away
- Closes on Escape key
- Closes after action selection
- Prevents overflow (stays on screen)

## Export

**Export Scope:**
- Selection-based: exports bounding box of selected objects
- If no selection: exports entire canvas
- Includes all transforms, styles, and layering

**Export Format:**
- Default: PNG at 2x resolution (pixelRatio: 2)
- High quality rendering via Konva.js `stage.toDataURL()`
- 20px padding around exported content

**File Naming:**
- Format: `collabcanvas-{YYYY-MM-DD}-{HH-MM-SS}.png`
- Example: `collabcanvas-2025-10-16-14-30-45.png`
- Timestamp uses ISO format with hyphens

**UI Location:**
- Export button in top-right header
- Download icon + "Export" label
- Disabled when canvas is empty
- No preview modal in v1 (direct download)

**Keyboard Shortcut:**
- `Shift+Cmd/Ctrl+E` - Export canvas/selection

## Keyboard Shortcuts (Mac)

### Selection & Editing
- `Cmd+A` - Select all
- `Cmd+C` - Copy selection
- `Cmd+V` - Paste
- `Cmd+X` - Cut
- `Cmd+D` - Duplicate
- `Delete` / `Backspace` - Delete selection

### Grouping & Organization
- `Cmd+G` - Group selection (requires 2+ objects)
- `Shift+Cmd+G` - Ungroup selection
- `]` - Bring to front
- `[` - Send to back

### Layer Properties
- `Cmd+R` - Rename selected layer
- `Shift+Cmd+H` - Show/hide selected objects
- `Shift+Cmd+L` - Lock/unlock selected objects (already implemented)

### Export & View
- `Shift+Cmd+E` - Export canvas
- `Cmd+=` - Zoom in
- `Cmd+-` - Zoom out
- `Cmd+0` - Reset zoom to 100%

### Windows/Linux
- Replace `Cmd` with `Ctrl` for all shortcuts
- All shortcuts work identically

## Design Principles

**Minimalist UI:**
- Canvas-first: Workspace dominates, minimal UI chrome
- Subtle shadows and soft borders
- Neutral color palette (90% grays)
- Color used only for actions/states

**Typography:**
- Font: Inter
- Clear hierarchy with size and weight
- Section headers: 12px uppercase with letter-spacing

**Feedback:**
- Optimistic updates (immediate local changes)
- Fast sync: Target < 150ms total latency
- 60 FPS rendering always maintained
- Throttled updates: 50ms for real-time sync

**Spacing & Layout:**
- 16px indentation per hierarchy level
- 8px padding for compact sections
- 12px padding for content sections
- 2px gaps between layer items
