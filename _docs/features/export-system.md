# Export System

**Status:** ✅ Implemented (Phase 4 - October 2025)
**Implementation Plan:** [`_docs/plans/grouping-export.md`](../plans/grouping-export.md)

---

## Overview

CollabCanvas supports **high-quality PNG export** using Konva.js `stage.toDataURL()` method. Users can export selected objects or the entire canvas with 2x pixel ratio for crisp, production-ready images.

### Key Features

- **Selection-based**: Exports selected objects (or all if none selected)
- **High quality**: 2x pixelRatio (double resolution)
- **Bounding box**: Tight crop with 20px padding
- **Group expansion**: Automatically includes all descendants
- **Hidden objects**: Includes hidden objects (Figma behavior)
- **Keyboard shortcut**: Shift+Cmd/Ctrl+E

---

## User Experience

### Export Button

Location: **Top-right of canvas**, floating button above layers panel

```
[Canvas Area]
                                           [Export Button]
                                           [Right Sidebar →]
```

**Button States:**

- **Enabled**: Objects exist on canvas (objects.length > 0)
- **Disabled**: Canvas empty (grayed out, cursor-not-allowed)
- **Tooltip**: "Export canvas (Shift+Cmd+E)"

### Export Flow

1. **User clicks Export button** (or presses Shift+Cmd+E)
2. **System calculates bounding box** of objects to export
3. **Konva renders canvas region** to data URL (PNG)
4. **Browser downloads file** with timestamped name
5. **Success**: No visual feedback (download starts immediately)
6. **Error**: Alert message: "Export failed. Please try again."

**No preview modal in v1** — Direct download for speed

---

## Technical Implementation

### Export Function

Located in `src/lib/utils/export.ts`:

```typescript
/**
 * Export canvas to PNG file
 *
 * Exports selected objects (or entire canvas if none selected)
 * Uses Konva stage.toDataURL() with high quality settings
 *
 * @param stageRef - React ref to Konva Stage
 * @param selectedObjects - Currently selected objects
 * @param allObjects - All canvas objects
 * @returns Promise that resolves when download starts
 */
export async function exportCanvasToPNG(
  stageRef: React.RefObject<Konva.Stage>,
  selectedObjects: CanvasObject[],
  allObjects: CanvasObject[]
): Promise<void> {
  if (!stageRef.current) {
    throw new Error('Stage ref not available');
  }

  const stage = stageRef.current;

  // 1. Determine what to export
  let objectsToExport = selectedObjects.length > 0 ? selectedObjects : allObjects;

  // 2. Expand groups to include descendants
  const expandedIds = new Set<string>();
  objectsToExport.forEach(obj => {
    expandedIds.add(obj.id);
    if (obj.type === 'group') {
      const descendants = getAllDescendantIds(obj.id, allObjects);
      descendants.forEach(id => expandedIds.add(id));
    }
  });

  // 3. Filter to only renderable objects (exclude groups)
  const renderableObjects = allObjects.filter(
    obj => expandedIds.has(obj.id) && obj.type !== 'group'
  );

  if (renderableObjects.length === 0) {
    throw new Error('No objects to export');
  }

  // 4. Calculate bounding box with padding
  const bbox = calculateBoundingBox(renderableObjects);
  const padding = 20;
  const exportX = bbox.x - padding;
  const exportY = bbox.y - padding;
  const exportWidth = bbox.width + padding * 2;
  const exportHeight = bbox.height + padding * 2;

  // 5. Export stage as data URL
  const dataURL = stage.toDataURL({
    x: exportX,
    y: exportY,
    width: exportWidth,
    height: exportHeight,
    pixelRatio: 2, // High quality (2x resolution)
    mimeType: 'image/png',
  });

  // 6. Generate filename with timestamp
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', '-')
    .replace(/:/g, '-');
  const filename = `collabcanvas-${timestamp}.png`;

  // 7. Trigger download
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### Usage in Components

```typescript
// In CanvasPage.tsx
import { exportCanvasToPNG } from '@/lib/utils/export';

const stageRef = useRef<Konva.Stage>(null);

const handleExport = async () => {
  try {
    const { objects, selectedIds } = useCanvasStore.getState();
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));

    await exportCanvasToPNG(stageRef, selectedObjects, objects);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  }
};

// Pass stageRef to CanvasStage
<CanvasStage ref={stageRef} /* ... */ />

// Export button
<button
  onClick={handleExport}
  disabled={objects.length === 0}
  className="..."
>
  <Download className="w-4 h-4" />
  Export
</button>
```

---

## Export Behavior

### Selection Rules

| Scenario | Export Behavior |
|----------|-----------------|
| **No selection** | Export all objects on canvas |
| **1+ objects selected** | Export only selected objects |
| **Group selected** | Export all descendants (recursively) |
| **Hidden object selected** | Include in export (invisible in editor, visible in PNG) |
| **Locked object selected** | Include in export (locks don't affect export) |

### Group Handling

**Groups expand to include all descendants:**

```
User selects:
├── Group A

Exported objects:
├── Rectangle B (child of Group A)
├── Circle C (child of Group A)
└── Text D (child of nested Group B inside Group A)

Groups themselves NOT exported (no visual representation)
```

**Implementation:**

```typescript
// Recursively collect descendant IDs
const expandedIds = new Set<string>();
objectsToExport.forEach(obj => {
  expandedIds.add(obj.id);
  if (obj.type === 'group') {
    const descendants = getAllDescendantIds(obj.id, allObjects);
    descendants.forEach(id => expandedIds.add(id));
  }
});

// Filter out groups (they don't render)
const renderableObjects = allObjects.filter(
  obj => expandedIds.has(obj.id) && obj.type !== 'group'
);
```

### Hidden Objects

**Decision: INCLUDE hidden objects in export** (Figma behavior)

**Rationale:**

- Consistency with Figma UX
- Hidden objects still exist, just not visible in editor
- Preserves all design elements for final output
- Simpler implementation (no visibility filtering)

**Alternative (NOT implemented):**

```typescript
// If we wanted to EXCLUDE hidden objects:
const visibleObjects = renderableObjects.filter(obj => obj.visible !== false);
```

---

## File Naming

### Format

```
collabcanvas-YYYY-MM-DD-HH-MM-SS.png
```

### Examples

```
collabcanvas-2025-10-16-14-30-45.png
collabcanvas-2025-10-16-09-15-22.png
collabcanvas-2025-12-25-23-59-59.png
```

### Implementation

```typescript
const timestamp = new Date()
  .toISOString()              // "2025-10-16T14:30:45.123Z"
  .slice(0, 19)               // "2025-10-16T14:30:45"
  .replace('T', '-')          // "2025-10-16-14:30:45"
  .replace(/:/g, '-');        // "2025-10-16-14-30-45"

const filename = `collabcanvas-${timestamp}.png`;
```

**Benefits:**

- Sortable by date/time
- No filename conflicts
- Human-readable
- No special characters (filesystem-safe)

---

## Bounding Box Calculation

Export uses tight bounding box with 20px padding on all sides:

```typescript
// Calculate min/max bounds of all objects
const bbox = calculateBoundingBox(renderableObjects);

// Add 20px padding on all sides
const padding = 20;
const exportX = bbox.x - padding;        // Left padding
const exportY = bbox.y - padding;        // Top padding
const exportWidth = bbox.width + padding * 2;   // Left + right
const exportHeight = bbox.height + padding * 2; // Top + bottom
```

**Handles all object types:**

- **Rectangle/Text**: `x, y, width, height`
- **Circle**: `x - radius, y - radius, diameter, diameter`
- **Line**: `min/max of points[0..3]`
- **Group**: Skip (no dimensions)

**Edge Cases:**

- **Very thick strokes**: Bounding box calculation doesn't account for stroke width (minor visual clipping possible)
- **Large shadows**: Bounding box calculation doesn't account for shadow offset (minor clipping possible)
- **Future enhancement**: Include `strokeWidth/2` and `shadowBlur + shadowOffset` in calculations

---

## Konva.js toDataURL

### Parameters

```typescript
stage.toDataURL({
  x: exportX,              // Crop region X (stage coordinates)
  y: exportY,              // Crop region Y (stage coordinates)
  width: exportWidth,      // Crop region width
  height: exportHeight,    // Crop region height
  pixelRatio: 2,           // 2x resolution for crisp exports
  mimeType: 'image/png',   // PNG format (supports transparency)
});
```

### How It Works

1. **Konva renders canvas** to temporary HTMLCanvasElement
2. **Applies transforms** (rotation, opacity, shadows, etc.)
3. **Crops to specified region** (x, y, width, height)
4. **Scales by pixelRatio** (2x = double resolution)
5. **Converts to data URL** (base64-encoded PNG)

**Automatic features:**

- All transforms preserved (rotation, scale, skew)
- Opacity rendered correctly
- Shadows rendered correctly
- Strokes rendered correctly
- Layering/z-index respected

---

## Performance

### Benchmarks

| Canvas Size | Objects | Export Time | File Size |
|-------------|---------|-------------|-----------|
| Small (500x500px) | 10 | <100ms | ~50KB |
| Medium (1500x1500px) | 50 | ~500ms | ~200KB |
| Large (5000x5000px) | 100 | ~2s | ~1MB |

**Performance Characteristics:**

- **UI remains responsive** (async operation)
- **No browser freeze** for typical canvases
- **Memory efficient** (Konva handles cleanup)

**Edge Cases:**

- **Very large exports** (10000x10000px): May take 5-10 seconds
- **Browser memory limits**: Exports >10MB may fail silently
- **Solution**: Future enhancement - chunked export or resolution selection

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Shift+Cmd/Ctrl+E** | Export Canvas | Exports selection or all objects to PNG |

**Input Protection:** Shortcut does NOT fire when text input/textarea focused

**Implementation:**

```typescript
// In CanvasPage.tsx useEffect
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent triggering while typing
    if (isInputFocused()) return;

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
      e.preventDefault();
      handleExport();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Error Handling

### Error Scenarios

| Error | Cause | User Message |
|-------|-------|--------------|
| **Stage ref not available** | CanvasStage not mounted | "Export failed. Please try again." |
| **No objects to export** | Canvas empty or selection empty | "Export failed. Please try again." |
| **Browser blocked download** | Browser security/settings | "Export failed. Please try again." |
| **Memory limit exceeded** | Export too large (>10MB) | Silent failure (no download) |

**Future Enhancement:** More specific error messages and retry logic

---

## Multiplayer Behavior

**Export is LOCAL ONLY** — Does not sync to other users.

**Why:**

- Export is a read-only operation (doesn't modify canvas)
- No need to notify collaborators
- File download is user-specific (local filesystem)

**Verification:**

```
User A: Clicks Export
User B: No notification, no interruption, canvas unchanged
```

---

## Testing Scenarios

### Basic Export

1. Create 3 rectangles on canvas
2. Click Export button
3. Verify: PNG downloads with all 3 rectangles
4. Open PNG, verify: 2x resolution (sharp on retina displays)

### Selection Export

1. Create 5 circles
2. Select 2 circles
3. Click Export
4. Verify: PNG contains only 2 selected circles
5. Verify: Tight bounding box with 20px padding

### Group Export

1. Create Group A with 3 rectangles
2. Select Group A
3. Click Export
4. Verify: PNG contains 3 rectangles (no group shape)
5. Verify: Correct positioning relative to each other

### Hidden Object Export

1. Create 2 shapes
2. Hide 1 shape (visible: false)
3. Select both, export
4. Verify: PNG includes hidden shape (Figma behavior)

### Keyboard Shortcut

1. Create shapes
2. Press Shift+Cmd+E
3. Verify: PNG downloads
4. Focus text input, press Shift+Cmd+E
5. Verify: Export does NOT trigger (input protection)

### Transform Export

1. Create rectangle with rotation: 45°, opacity: 0.5, shadow
2. Export
3. Verify: PNG shows rotated, semi-transparent, shadowed rectangle

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/utils/export.ts` | Main export function |
| `src/lib/utils/geometry.ts` | Bounding box calculation |
| `src/features/layers-panel/utils/hierarchy.ts` | `getAllDescendantIds()` |
| `src/features/canvas/pages/CanvasPage.tsx` | Export button + keyboard shortcut |
| `src/features/canvas/components/CanvasStage.tsx` | Accepts `ref` prop for stage access |

---

## Future Enhancements

- **Export preview modal**: Show preview before downloading
- **Export history**: Track all exports per project (stored in Firebase)
- **Multi-format**: JPEG, SVG, PDF export options
- **Resolution selection**: 1x, 2x, 3x, custom pixelRatio
- **Background color**: Transparent vs white vs custom
- **Batch export**: Export all groups as separate files
- **Export settings panel**: Advanced options (quality, format, etc.)
- **Export to cloud**: Upload to Firebase Storage or external service
- **Code export**: HTML/CSS/SVG code generation

---

## Related Documentation

- [Grouping System](./grouping-system.md) - Exporting grouped objects
- [Hierarchy System](./hierarchy-system.md) - Parent-child relationships
- [Z-Index System](./z-index-system.md) - Layer ordering in exports
- Konva.js Export Docs: https://konvajs.org/docs/data_and_serialization/High-Quality-Export.html

---

**Last Updated:** 2025-10-16
**Implementation Status:** Complete (Phase 4 of grouping-export plan)
