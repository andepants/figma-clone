
# Phase 2: Enhanced Canvas

## Overview

**Goal:** Enhance the MVP with additional shape types, essential operations, and polish for better user experience.

**Timeline:** 6-8 hours

**Deliverable:** A polished collaborative canvas with multiple shape types, delete/duplicate operations, and improved UX.

**Success Criteria:**
- ✅ Three shape types work (rectangle, circle, text)
- ✅ Users can delete and duplicate objects
- ✅ Selection and manipulation feels polished
- ✅ Keyboard shortcuts work on desktop
- ✅ Mobile experience is improved
- ✅ UI has smooth animations and transitions
- ✅ Error states are handled gracefully

---

## Phase Scope

This phase makes the canvas feel complete and professional.

**What's Included:**
- Circle shape type
- Text shape type
- Delete operation
- Duplicate operation
- Keyboard shortcuts (Delete key, Cmd+D)
- Improved mobile touch interactions
- Smooth UI animations
- Loading states and error handling
- Zoom controls UI
- Better toolbar organization

**What's NOT Included:**
- Resize or rotate
- Multi-select
- Undo/redo
- Color picker
- Layer management
- Export/import
- AI features

**Development Strategy:**
Build horizontally—add features across all existing functionality:
1. Shapes → Operations → Polish → Mobile

---

## Features & Tasks

### Feature 1: Circle Shape Component

**Objective:** Add circle as a second shape type.

**Steps:**
1. Create `components/canvas/Circle.tsx` Konva Circle component
2. Update canvas.types.ts with Circle interface
3. Add circle rendering to CanvasStage (check object.type)
4. Make circle draggable and selectable (same as Rectangle)
5. Update store to handle circle objects

**Verification:** Circles render and behave like rectangles.

**Circle.tsx:**
```typescript
export function Circle({
  id,
  x,
  y,
  radius,
  color,
  isSelected
}: CircleProps) {
  const updateObject = useCanvasStore((state) => state.updateObject);
  const selectObject = useCanvasStore((state) => state.selectObject);

  return (
    <KonvaCircle
      x={x}
      y={y}
      radius={radius}
      fill={color}
      draggable
      onClick={() => selectObject(id)}
      onDragEnd={(e) => {
        updateObject(id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      stroke={isSelected ? '#0ea5e9' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}
```

---

### Feature 2: Create Circle Button

**Objective:** Add button to toolbar for creating circles.

**Steps:**
1. Add circle button to Toolbar.tsx with Circle icon
2. Create new circle object with default radius (50px)
3. Place at canvas center
4. Add circle to store
5. Test creating multiple circles

**Verification:** Clicking circle button creates a new circle.

**Toolbar update:**
```typescript
const handleCreateCircle = () => {
  const newCircle: CanvasObject = {
    id: crypto.randomUUID(),
    type: 'circle',
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 50,
    color: '#ef4444',
    createdBy: currentUser.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  addObject(newCircle);
};
```

---

### Feature 3: Text Shape Component

**Objective:** Add text as a third shape type.

**Steps:**
1. Create `components/canvas/Text.tsx` Konva Text component
2. Update canvas.types.ts with Text interface
3. Add text rendering to CanvasStage
4. Make text draggable and selectable
5. Use default text content: "Double-click to edit" (editing comes later if time permits)

**Verification:** Text renders and can be moved.

**Text.tsx:**
```typescript
export function TextShape({
  id,
  x,
  y,
  text,
  fontSize,
  color,
  isSelected
}: TextProps) {
  const updateObject = useCanvasStore((state) => state.updateObject);
  const selectObject = useCanvasStore((state) => state.selectObject);

  return (
    <KonvaText
      x={x}
      y={y}
      text={text}
      fontSize={fontSize}
      fill={color}
      draggable
      onClick={() => selectObject(id)}
      onDragEnd={(e) => {
        updateObject(id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      stroke={isSelected ? '#0ea5e9' : undefined}
      strokeWidth={isSelected ? 1 : 0}
    />
  );
}
```

---

### Feature 4: Create Text Button

**Objective:** Add button to toolbar for creating text.

**Steps:**
1. Add text button to Toolbar with Type icon
2. Create new text object with default content
3. Place at canvas center
4. Add text to store
5. Test creating multiple text objects

**Verification:** Clicking text button creates new text on canvas.

---

### Feature 5: Delete Operation

**Objective:** Allow users to delete selected objects.

**Steps:**
1. Add delete button to toolbar (TrashIcon)
2. Connect to `removeObject` store action
3. Only enable delete button when object is selected
4. Add keyboard shortcut: Delete/Backspace key
5. Sync deletion to Firestore

**Verification:** Delete button and Delete key remove selected object.

**Delete handler:**
```typescript
const handleDelete = () => {
  if (selectedId) {
    removeObject(selectedId);
    selectObject(null);
  }
};

// Keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      handleDelete();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedId]);
```

---

### Feature 6: Duplicate Operation

**Objective:** Allow users to duplicate selected objects.

**Steps:**
1. Add duplicate button to toolbar (CopyIcon)
2. Create copy of selected object with new ID
3. Offset duplicate slightly (x+20, y+20) so it's visible
4. Add keyboard shortcut: Cmd/Ctrl+D
5. Sync duplication to Firestore

**Verification:** Duplicate button and Cmd+D create a copy of selected object.

**Duplicate handler:**
```typescript
const handleDuplicate = () => {
  const selectedObject = objects.find(obj => obj.id === selectedId);
  if (!selectedObject) return;

  const duplicate = {
    ...selectedObject,
    id: crypto.randomUUID(),
    x: selectedObject.x + 20,
    y: selectedObject.y + 20,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  addObject(duplicate);
  selectObject(duplicate.id);
};
```

---

### Feature 7: Zoom Controls UI

**Objective:** Add visible zoom in/out buttons for users who don't know about mouse wheel.

**Steps:**
1. Add zoom controls section to toolbar
2. Add Zoom In button (+) and Zoom Out button (-)
3. Add Reset Zoom button (shows current zoom level)
4. Connect buttons to zoom functionality
5. Display current zoom percentage

**Verification:** Buttons zoom canvas, reset returns to 100%.

**Zoom controls:**
```typescript
export function ZoomControls() {
  const [zoom, setZoom] = useState(1);
  const stageRef = useCanvasStore((state) => state.stageRef);

  const handleZoomIn = () => {
    if (!stageRef) return;
    const newZoom = Math.min(5, zoom * 1.2);
    stageRef.scale({ x: newZoom, y: newZoom });
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!stageRef) return;
    const newZoom = Math.max(0.1, zoom / 1.2);
    stageRef.scale({ x: newZoom, y: newZoom });
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    if (!stageRef) return;
    stageRef.scale({ x: 1, y: 1 });
    stageRef.position({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={handleZoomOut}>
        <ZoomOut className="w-4 h-4" />
      </button>
      <button onClick={handleResetZoom}>
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={handleZoomIn}>
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
}
```

---

### Feature 8: Improved Toolbar Organization

**Objective:** Organize toolbar into logical sections.

**Steps:**
1. Group shape tools together (rectangle, circle, text)
2. Add visual divider between groups
3. Group operations together (delete, duplicate)
4. Place zoom controls on the right
5. Make toolbar responsive (stack on mobile)

**Verification:** Toolbar looks organized with clear sections.

**Toolbar structure:**
```typescript
<div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex gap-2 z-40">
  {/* Shape tools */}
  <div className="flex gap-1">
    <ShapeButton icon={Square} onClick={createRectangle} />
    <ShapeButton icon={Circle} onClick={createCircle} />
    <ShapeButton icon={Type} onClick={createText} />
  </div>

  {/* Divider */}
  <div className="w-px bg-neutral-200" />

  {/* Operations */}
  <div className="flex gap-1">
    <ShapeButton icon={Copy} onClick={duplicate} disabled={!selectedId} />
    <ShapeButton icon={Trash2} onClick={deleteObject} disabled={!selectedId} />
  </div>

  {/* Divider */}
  <div className="w-px bg-neutral-200" />

  {/* Zoom controls */}
  <ZoomControls />
</div>
```

---

### Feature 9: Deselect on Background Click

**Objective:** Clicking empty canvas deselects current selection.

**Steps:**
1. Add `onClick` handler to Stage
2. Check if click target is Stage (not a shape)
3. If stage clicked, deselect object
4. Verify shapes can still be selected
5. Test with pan/zoom (shouldn't deselect during drag)

**Verification:** Clicking empty space deselects, clicking shapes selects them.

**Implementation:**
```typescript
const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
  // Check if clicked on empty area
  if (e.target === e.target.getStage()) {
    selectObject(null);
  }
};
```

---

### Feature 10: Smooth UI Animations

**Objective:** Add subtle animations for better feel.

**Steps:**
1. Add fade-in animation to toolbar on page load
2. Add hover scale effect to toolbar buttons
3. Add smooth transition to selection outline
4. Add fade-in for cursors when they appear
5. Add slide-in for presence indicator

**Verification:** UI feels polished with smooth animations.

**CSS animations:**
```css
/* Toolbar fade-in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.toolbar {
  animation: fadeIn 0.3s ease-out;
}

/* Button hover */
.toolbar button {
  transition: all 0.15s ease-out;
}

.toolbar button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}
```

---

### Feature 11: Loading States for Operations

**Objective:** Show feedback when operations are processing.

**Steps:**
1. Add loading state to auth operations
2. Disable buttons during async operations
3. Show spinner in button during loading
4. Add loading indicator for initial canvas load
5. Add "Syncing..." indicator when writing to Firestore

**Verification:** Users see when operations are in progress.

---

### Feature 12: Toast Notifications

**Objective:** Show non-intrusive feedback messages.

**Steps:**
1. Install or create simple toast component
2. Show toast on successful duplicate: "Object duplicated"
3. Show toast on delete: "Object deleted"
4. Show toast on sync error: "Failed to save. Retrying..."
5. Auto-dismiss after 3 seconds

**Verification:** Toasts appear for operations and auto-dismiss.

---

### Feature 13: Improve Mobile Touch Support

**Objective:** Make canvas work better on mobile devices.

**Steps:**
1. Detect touch devices and adjust UI
2. Make touch targets larger (44x44px minimum)
3. Adjust toolbar for mobile (smaller, bottom position optional)
4. Test pinch-to-zoom gesture
5. Test two-finger pan gesture

**Verification:** Canvas is usable on mobile (iOS Safari, Chrome Android).

**Mobile detection:**
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Adjust toolbar
<div className={`
  fixed top-4 left-1/2 -translate-x-1/2
  ${isMobile ? 'scale-90' : ''}
`}>
```

---

### Feature 14: Keyboard Shortcuts Documentation

**Objective:** Let users know about keyboard shortcuts.

**Steps:**
1. Create shortcuts list in constants
2. Add "?" button to toolbar to show shortcuts
3. Create modal with keyboard shortcuts list
4. Include: Delete, Cmd+D, Space+Drag, Wheel
5. Make modal dismissible with Escape

**Verification:** Users can see available shortcuts.

**Shortcuts list:**
```typescript
const SHORTCUTS = [
  { key: 'Delete', action: 'Delete selected object' },
  { key: 'Cmd/Ctrl + D', action: 'Duplicate selected object' },
  { key: 'Space + Drag', action: 'Pan canvas (optional)' },
  { key: 'Mouse Wheel', action: 'Zoom in/out' },
  { key: 'Escape', action: 'Deselect object' },
];
```

---

### Feature 15: Error Recovery

**Objective:** Handle and recover from errors gracefully.

**Steps:**
1. Add retry logic for failed Firestore writes
2. Show error toast with retry button
3. Handle offline state (show "Offline" indicator)
4. Queue changes while offline, sync when back online
5. Test with network throttling and offline mode

**Verification:** App recovers from network errors without data loss.

**Retry logic:**
```typescript
async function syncToFirestore(objects: CanvasObject[], retries = 3) {
  try {
    await updateDoc(canvasRef, { objects });
  } catch (error) {
    if (retries > 0) {
      console.log(`Sync failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return syncToFirestore(objects, retries - 1);
    } else {
      console.error('Sync failed after all retries:', error);
      showToast('Failed to save changes. Please check your connection.', 'error');
    }
  }
}
```

---

### Feature 16: Canvas Performance Optimization

**Objective:** Ensure canvas stays smooth with many objects.

**Steps:**
1. Separate cursor layer from object layer (listening={false} on cursor layer)
2. Use Konva's built-in caching for static objects
3. Throttle pan/zoom updates to 60 FPS
4. Batch Firestore writes (max 1 write per 500ms)
5. Test with 100+ objects

**Verification:** Canvas maintains 60 FPS with 100+ objects.

**Layer optimization:**
```typescript
<Stage>
  {/* Objects layer - handles interactions */}
  <Layer>
    {objects.map(obj => <Shape key={obj.id} {...obj} />)}
  </Layer>

  {/* Cursor layer - no interactions needed */}
  <Layer listening={false}>
    {Object.entries(cursors).map(([id, cursor]) =>
      <Cursor key={id} {...cursor} />
    )}
  </Layer>
</Stage>
```

---

### Feature 17: Better Object Selection Visual

**Objective:** Make selection more obvious and professional.

**Steps:**
1. Increase selection stroke width to 3px
2. Add rounded corners to rectangle selection outline
3. Add subtle shadow to selection outline
4. Animate selection outline (pulse once on select)
5. Use consistent selection color (#0ea5e9)

**Verification:** Selection is clear and looks polished.

---

### Feature 18: Escape Key to Deselect

**Objective:** Add Escape key to deselect current object.

**Steps:**
1. Add global keyboard listener for Escape
2. Call `selectObject(null)` when Escape pressed
3. Verify works with all object types
4. Don't interfere with modal close (check if modal open)
5. Test with multiple selections

**Verification:** Pressing Escape deselects current object.

---

### Feature 19: Improve Landing Page

**Objective:** Make landing page more attractive.

**Steps:**
1. Add hero section with project title and tagline
2. Add description of features (real-time, collaborative, simple)
3. Style "Get Started" button prominently
4. Add footer with GitHub link (optional)
5. Ensure responsive design for mobile

**Verification:** Landing page looks professional and inviting.

**Landing page structure:**
```typescript
export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h1 className="text-5xl font-semibold text-neutral-800 mb-4">
          CollabCanvas
        </h1>
        <p className="text-xl text-neutral-600 mb-8">
          Real-time collaborative design canvas. Create together, instantly.
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-8 py-3 bg-primary-500 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-primary-600 transition-all"
        >
          Get Started
        </button>

        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <Feature icon={Users} title="Real-time" description="See changes instantly" />
          <Feature icon={Zap} title="Fast" description="60 FPS performance" />
          <Feature icon={Shapes} title="Simple" description="Easy to use" />
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
```

---

### Feature 20: Final Polish & Testing

**Objective:** Test everything and fix rough edges.

**Steps:**
1. Test all shape types in all browsers
2. Test all operations (create, move, delete, duplicate)
3. Test with 3+ concurrent users
4. Check mobile experience on real devices
5. Fix any visual inconsistencies

**Verification:** Everything works smoothly, looks polished, feels complete.

---

## Testing Phase 2

### Manual Testing Checklist

**New Shape Types:**
- [ ] Can create circles
- [ ] Can create text
- [ ] All shapes are draggable
- [ ] All shapes are selectable
- [ ] All shapes sync in real-time

**Operations:**
- [ ] Delete button works
- [ ] Delete key works
- [ ] Duplicate button works
- [ ] Cmd+D works
- [ ] Operations sync across users

**UI/UX:**
- [ ] Toolbar is organized and clear
- [ ] Zoom controls work
- [ ] Animations are smooth
- [ ] Loading states show
- [ ] Error states handled

**Mobile:**
- [ ] Canvas works on iOS Safari
- [ ] Canvas works on Chrome Android
- [ ] Touch targets are large enough
- [ ] Pinch to zoom works
- [ ] Two-finger pan works

**Performance:**
- [ ] Canvas maintains 60 FPS with 50+ objects
- [ ] No lag during operations
- [ ] Memory doesn't leak over time
- [ ] Works with slow network (3G simulation)

---

## Deliverables

At the end of Phase 2, you should have:

1. **Complete Shape Set**
   - Rectangles, circles, and text
   - All shapes fully functional
   - Consistent behavior across types

2. **Essential Operations**
   - Delete with button and keyboard
   - Duplicate with button and keyboard
   - Deselect with background click or Escape

3. **Polished UI**
   - Organized toolbar
   - Smooth animations
   - Loading states
   - Error handling
   - Toast notifications

4. **Better Mobile Support**
   - Touch-friendly interface
   - Pinch to zoom
   - Two-finger pan
   - Responsive toolbar

5. **Professional Feel**
   - Keyboard shortcuts
   - Visual polish
   - Performance optimization
   - Improved landing page

---

## Success Metrics

**Feature Completeness:**
- 3 shape types working ✅
- 2 operations (delete, duplicate) ✅
- Mobile support ✅

**Polish Level:**
- Smooth animations ✅
- Clear feedback ✅
- Error recovery ✅

**Performance:**
- Still 60 FPS ✅
- No memory leaks ✅
- Works on mobile ✅

---

## Next Phase

After completing Phase 2, proceed to **Phase 3: AI Canvas Agent**.

Phase 3 will add:
- AI integration with function calling
- Natural language commands
- AI-powered shape creation
- Complex multi-step operations
- AI development log

**Phase 2 → Phase 3 Bridge:**
- Canvas is fully functional
- All basic features work
- Now we add AI superpowers
- Focus shifts to AI-first development