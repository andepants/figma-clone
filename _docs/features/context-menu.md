# Context Menu System

**Status:** ✅ Implemented (Phase 3 - October 2025)
**Implementation Plan:** [`_docs/plans/grouping-export.md`](../plans/grouping-export.md)

---

## Overview

CollabCanvas provides a **right-click context menu** in the layers panel for quick access to common actions. The menu is Figma-inspired with keyboard shortcuts displayed, dynamic item visibility based on selection, and smooth interactions.

### Key Features

- **Right-click trigger**: Right-click layer item in layers panel
- **Dynamic items**: Menu items vary based on object type and state
- **Keyboard shortcuts**: Displayed alongside each action
- **Smart positioning**: Adjusts to stay on screen (no overflow)
- **Click-away close**: Closes on outside click or Escape key
- **Disabled states**: Grayed out items that can't be performed

---

## User Experience

### Trigger

**Right-click** on any layer item in layers panel

**Alternative triggers (NOT implemented in v1):**

- Canvas right-click (would require canvas object detection)
- Keyboard shortcut (e.g., Shift+F10)
- Three-dot menu button

### Menu Positioning

- **Opens at cursor position** (e.clientX, e.clientY)
- **Adjusts to stay on screen** (detects window edges)
- **Z-index above all UI** (z-50 in Tailwind)

**Edge detection logic:**

```typescript
// In ContextMenu.tsx
useEffect(() => {
  if (!menuRef.current) return;

  const menu = menuRef.current;
  const rect = menu.getBoundingClientRect();

  // Adjust horizontal overflow
  if (rect.right > window.innerWidth) {
    menu.style.left = `${x - rect.width}px`; // Flip to left of cursor
  }

  // Adjust vertical overflow
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${y - rect.height}px`; // Flip above cursor
  }
}, [x, y]);
```

### Closing

**Menu closes on:**

- Click outside menu (click-away detection)
- Press Escape key
- Click any menu item (action + close)
- Right-click different layer (close + open new menu)

---

## Menu Actions

### Available Actions (Dynamic)

| Action | Shortcut | Visibility |
|--------|----------|------------|
| **Bring to Front** | `]` | Always |
| **Send to Back** | `[` | Always |
| **Rename** | Cmd+R | Always |
| **Copy** | Cmd+C | Always |
| **Paste** | Cmd+V | Always (disabled if clipboard empty) |
| **Group Selection** | Cmd+G | Only when 2+ objects selected |
| **Ungroup** | Shift+Cmd+G | Only when group selected |
| **Show / Hide** | Shift+Cmd+H | Always (label changes based on state) |
| **Lock / Unlock** | Shift+Cmd+L | Always (label changes based on state) |
| **Delete** | Del | Always (danger state - red text) |

### Action Categories

```
┌───────────────────────────────┐
│ Z-Index Actions               │
│  Bring to Front          ]    │
│  Send to Back            [    │
├───────────────────────────────┤
│ Editing Actions               │
│  Rename              Cmd+R    │
├───────────────────────────────┤
│ Clipboard Actions             │
│  Copy                Cmd+C    │
│  Paste               Cmd+V    │
├───────────────────────────────┤
│ Grouping Actions              │
│  Group Selection     Cmd+G    │ ← Only if 2+ selected
│  Ungroup          Shift+Cmd+G │ ← Only if group selected
├───────────────────────────────┤
│ State Actions                 │
│  Hide             Shift+Cmd+H │ ← Label: "Hide" or "Show"
│  Lock             Shift+Cmd+L │ ← Label: "Lock" or "Unlock"
├───────────────────────────────┤
│ Destructive Actions           │
│  Delete                  Del  │ ← Red text (danger)
└───────────────────────────────┘
```

---

## Technical Implementation

### Context Menu Component

Located in `src/components/common/ContextMenu.tsx`:

```typescript
/**
 * Context Menu Component
 *
 * Reusable right-click context menu with keyboard shortcuts display
 * Positions itself near mouse click, adjusts to stay on screen
 * Closes on click-away, Escape, or action selection
 */

interface ContextMenuItem {
  type?: 'action' | 'separator';
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean; // Red text for destructive actions
}

interface ContextMenuProps {
  x: number;              // Cursor X position
  y: number;              // Cursor Y position
  items: ContextMenuItem[]; // Menu items
  onClose: () => void;    // Close callback
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust position to stay on screen
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();

    if (rect.right > window.innerWidth) {
      menu.style.left = `${x - rect.width}px`;
    }

    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-white border border-gray-200 rounded-md shadow-lg py-1"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) =>
        item.type === 'separator' ? (
          <div key={index} className="h-px bg-gray-200 my-1" />
        ) : (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={cn(
              "w-full px-3 py-1.5 text-left text-sm flex items-center justify-between",
              "hover:bg-gray-100 transition-colors",
              item.disabled && "opacity-50 cursor-not-allowed",
              item.danger && "text-red-600"
            )}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-500 ml-4">
                {item.shortcut}
              </span>
            )}
          </button>
        )
      )}
    </div>
  );
}
```

### Menu Items Builder

Located in `src/features/layers-panel/utils/contextMenu.ts`:

```typescript
/**
 * Build context menu items for a layer
 *
 * Items vary based on:
 * - Object type (group vs shape)
 * - Lock state
 * - Visibility state
 * - Selection count
 */
export function getContextMenuItems(
  object: CanvasObject,
  objects: CanvasObject[],
  selectedIds: string[]
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];
  const isGroup = object.type === 'group';
  const isLocked = object.locked === true;
  const isVisible = object.visible !== false;
  const multiSelect = selectedIds.length > 1;
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Platform-specific shortcuts
  const cmdKey = isMac ? '⌘' : 'Ctrl+';
  const shiftCmd = isMac ? '⇧⌘' : 'Shift+Ctrl+';

  // Z-Index actions
  items.push(
    { label: 'Bring to Front', shortcut: ']', onClick: () => bringToFront(object.id) },
    { label: 'Send to Back', shortcut: '[', onClick: () => sendToBack(object.id) },
    { type: 'separator' },
  );

  // Rename action
  items.push(
    { label: 'Rename', shortcut: `${cmdKey}R`, onClick: () => console.log('Rename:', object.id) },
    { type: 'separator' },
  );

  // Clipboard actions
  items.push(
    { label: 'Copy', shortcut: `${cmdKey}C`, onClick: () => console.log('Copy') },
    { label: 'Paste', shortcut: `${cmdKey}V`, onClick: () => console.log('Paste'), disabled: true }, // TODO: Check clipboard
    { type: 'separator' },
  );

  // Group/Ungroup actions
  if (isGroup) {
    items.push({
      label: 'Ungroup',
      shortcut: `${shiftCmd}G`,
      onClick: () => useCanvasStore.getState().ungroupObjects(),
    });
  } else if (multiSelect) {
    items.push({
      label: 'Group Selection',
      shortcut: `${cmdKey}G`,
      onClick: () => useCanvasStore.getState().groupObjects(),
    });
  }
  items.push({ type: 'separator' });

  // Visibility action
  items.push({
    label: isVisible ? 'Hide' : 'Show',
    shortcut: `${shiftCmd}H`,
    onClick: () => useCanvasStore.getState().toggleVisibility(object.id),
  });

  // Lock action
  items.push({
    label: isLocked ? 'Unlock' : 'Lock',
    shortcut: `${shiftCmd}L`,
    onClick: () => useCanvasStore.getState().toggleLock(object.id),
  });

  // Separator before delete
  items.push({ type: 'separator' });

  // Delete action (danger)
  items.push({
    label: 'Delete',
    shortcut: 'Del',
    onClick: () => useCanvasStore.getState().removeObject(object.id),
    danger: true,
  });

  return items;
}
```

### Integration with LayerItem

Located in `src/features/layers-panel/components/LayerItem.tsx`:

```typescript
// In LayerItem component

const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();      // Prevent browser context menu
  e.stopPropagation();     // Prevent event bubbling
  setContextMenu({ x: e.clientX, y: e.clientY });
};

// In JSX
<div
  onContextMenu={handleContextMenu}
  className="..."
>
  {/* Layer content */}
</div>

{/* Render context menu */}
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    items={getContextMenuItems(object, objects, selectedIds)}
    onClose={() => setContextMenu(null)}
  />
)}
```

---

## Platform-Specific Shortcuts

### Mac vs Windows/Linux

Context menu automatically detects platform and displays correct shortcuts:

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Copy | ⌘C | Ctrl+C |
| Group | ⌘G | Ctrl+G |
| Ungroup | ⇧⌘G | Shift+Ctrl+G |
| Hide | ⇧⌘H | Shift+Ctrl+H |
| Lock | ⇧⌘L | Shift+Ctrl+L |
| Export | ⇧⌘E | Shift+Ctrl+E |
| Bring to Front | ] | ] |
| Send to Back | [ | [ |
| Delete | Del | Del |

**Detection logic:**

```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const cmdKey = isMac ? '⌘' : 'Ctrl+';
const shiftCmd = isMac ? '⇧⌘' : 'Shift+Ctrl+';
```

---

## Styling

### Design System

**Colors:**

- Background: `bg-white`
- Border: `border-gray-200`
- Hover: `bg-gray-100`
- Text: `text-gray-900`
- Shortcut: `text-gray-500`
- Danger: `text-red-600`
- Disabled: `opacity-50`

**Spacing:**

- Menu padding: `py-1` (4px top/bottom)
- Item padding: `px-3 py-1.5` (12px horizontal, 6px vertical)
- Min width: `200px`
- Separator: `h-px` (1px height), `my-1` (4px margin)

**Typography:**

- Font size: `text-sm` (14px)
- Shortcut size: `text-xs` (12px)
- Font weight: Normal (no bold)

**Effects:**

- Shadow: `shadow-lg` (large shadow for depth)
- Border radius: `rounded-md` (6px)
- Z-index: `z-50` (above all UI elements)
- Transitions: `transition-colors` (smooth hover)

---

## Edge Cases

### During Drag Operation

**Problem:** User right-clicks while dragging layer

**Solution:** Right-click cancels drag, shows menu

**Implementation:**

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // Cancel any active drag
  if (isDragging) {
    cancelDrag();
  }

  setContextMenu({ x: e.clientX, y: e.clientY });
};
```

### During Rename

**Problem:** User right-clicks while renaming layer

**Solution:** Right-click closes rename input, shows menu

**Implementation:**

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // Close rename input
  if (isRenaming) {
    setIsRenaming(false);
  }

  setContextMenu({ x: e.clientX, y: e.clientY });
};
```

### Multiple Menus Open

**Problem:** User right-clicks different layer while menu open

**Solution:** Close previous menu, open new menu

**Implementation:**

```typescript
// Each LayerItem has its own contextMenu state
// When new menu opens, old menu auto-closes (React unmount)
```

### Disabled Actions

**Problem:** User clicks disabled action (e.g., Paste with empty clipboard)

**Solution:** Action doesn't trigger, cursor shows "not-allowed"

**Implementation:**

```typescript
<button
  onClick={() => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      onClose();
    }
  }}
  disabled={item.disabled}
  className={cn(
    // ...
    item.disabled && "opacity-50 cursor-not-allowed"
  )}
>
```

---

## Testing Scenarios

### Basic Context Menu

1. Create 3 rectangles
2. Right-click middle rectangle in layers panel
3. Verify: Menu opens at cursor
4. Verify: All actions shown (Bring to Front, Send to Back, etc.)
5. Click "Bring to Front"
6. Verify: Menu closes, rectangle moves to top

### Group Actions

1. Select 2 circles
2. Right-click one of them
3. Verify: "Group Selection" shown (multi-select)
4. Click "Group Selection"
5. Verify: Group created, menu closes
6. Right-click group
7. Verify: "Ungroup" shown (not "Group Selection")
8. Click "Ungroup"
9. Verify: Group deleted, circles ungrouped

### State-Specific Labels

1. Create visible rectangle
2. Right-click, verify: "Hide" shown
3. Click "Hide"
4. Right-click again, verify: "Show" shown
5. Create unlocked circle
6. Right-click, verify: "Lock" shown
7. Click "Lock"
8. Right-click again, verify: "Unlock" shown

### Edge Detection

1. Create rectangle near top-left of canvas
2. Right-click layer in layers panel
3. Verify: Menu positioned to avoid top/left overflow
4. Create rectangle near bottom-right
5. Right-click layer
6. Verify: Menu flips above cursor if needed

### Click-Away Close

1. Right-click layer, menu opens
2. Click outside menu (on canvas)
3. Verify: Menu closes
4. Right-click layer, menu opens
5. Press Escape key
6. Verify: Menu closes

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/components/common/ContextMenu.tsx` | Reusable context menu component |
| `src/features/layers-panel/utils/contextMenu.ts` | Menu items builder |
| `src/features/layers-panel/components/LayerItem.tsx` | Integration with layers panel |
| `src/stores/canvasStore.ts` | Action implementations |

---

## Future Enhancements

- **Canvas right-click**: Context menu on canvas objects (requires object detection)
- **Keyboard navigation**: Arrow keys to navigate menu, Enter to select
- **Submenus**: Nested menus for grouped actions (e.g., "Arrange" submenu)
- **Recent actions**: Show recently used actions at top
- **Custom actions**: Plugin system for user-defined actions
- **Hotkey customization**: User-defined keyboard shortcuts
- **Menu theming**: Light/dark mode support

---

## Related Documentation

- [Z-Index System](./z-index-system.md) - Bring to Front / Send to Back
- [Grouping System](./grouping-system.md) - Group / Ungroup actions
- [Lock System](./lock-system.md) - Lock / Unlock actions
- [Hierarchy System](./hierarchy-system.md) - Show / Hide actions

---

**Last Updated:** 2025-10-16
**Implementation Status:** Complete (Phase 3 of grouping-export plan)
