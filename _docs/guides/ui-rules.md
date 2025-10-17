2# UI Rules: CollabCanvas

## Design Philosophy

CollabCanvas follows a **minimalist, Figma-inspired** design language grounded in Figma's core principles. Our approach is based on Figma's founding vision to "eliminate the gap between imagination and reality" and their belief that "design is everyone's business."

### Core Figma-Inspired Principles

Figma emphasizes fast feedback loops, craftsmanship, and making the creative process fun through their company value of "play." They believe in "lifting your team" rather than competing, building for builders, and making complex things feel simple.

**Our Design Principles:**

1. **Canvas-First** - The workspace is the hero, UI chrome is minimal—just like Figma's interface where the canvas dominates

2. **Fast Feedback Loops** - "The faster you make that feedback loop, the more you can get into that flow state" (Dylan Field, Figma CEO)

3. **Simplicity Meets Functionality** - User-centric design where simplicity and power coexist

4. **Collaboration Over Competition** - Figma's "lift your team" value means building tools that encourage working together, not against each other

5. **Craftsmanship** - Thoughtfulness and care in every interaction, ensuring quality and attention to detail

6. **Play & Creativity** - Making the tool fun to use and letting users creatively express themselves

7. **Make Complexity Simple** - Build for builders and try to make complex things feel simple

8. **Responsive by Default** - Works seamlessly across devices
9. **Subtle & Refined** - Gentle shadows, soft borders, muted colors
10. **Fast & Lightweight** - Smooth interactions, instant feedback

---

## Layout Principles

### Canvas-Centric Layout

The canvas should occupy maximum screen space with minimal UI chrome.

**Structure:**
```
┌─────────────────────────────────────┐
│  Toolbar (floating or top)          │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         Canvas Workspace            │
│         (takes all space)           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  User Presence (floating corner)    │
└─────────────────────────────────────┘
```

**Key Rules:**
- Canvas occupies 100% of available viewport
- Toolbars float above canvas or sit in minimal fixed header
- No sidebars in MVP (keep it simple)
- User presence indicators in corners, non-intrusive

### Responsive Breakpoints

Follow standard breakpoints for different device sizes:

| Breakpoint | Size | Usage |
|------------|------|-------|
| `sm` | 640px | Mobile (portrait) |
| `md` | 768px | Tablet (portrait) |
| `lg` | 1024px | Tablet (landscape), small laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

**Responsive Behavior:**

**Mobile (< 768px):**
- Simplified toolbar (essential tools only)
- Bottom sheet for tool options
- Touch-friendly tap targets (min 44x44px)
- Single column layouts
- Collapsible user list

**Tablet (768px - 1024px):**
- Full toolbar available
- Side panels can appear
- Multi-touch gestures supported
- Floating panels instead of fixed sidebars

**Desktop (> 1024px):**
- Full feature set
- Floating toolbars and panels
- Keyboard shortcuts available
- Hover states prominent

---

## Component Design Principles

### Figma's Approach to UI

Figma's interface is known for its **intentional minimalism**—every element serves a purpose, and there's no visual noise. They prioritize:

- **Communication over decoration** - UI should communicate clearly, not just look pretty
- **Invisible interfaces** - "Good design goes unnoticed. Bad design frustrates users"
- **Progressive disclosure** - Show only what users need at each step
- **Consistent patterns** - When a button works one way everywhere, users stop thinking about the interface

### 1. Buttons

**Primary Button:**
- Used for main actions (Create, Login, Save)
- Filled background with primary color
- Clear hover and active states
- Minimum height: 40px (36px on mobile)

**Secondary Button:**
- Used for alternative actions
- Outlined or ghost style
- Subtle hover effects

**Icon Button:**
- Square or circular
- Used in toolbars
- 40x40px minimum (44x44px on mobile)
- Icon centered, clear hit area

**States:**
```
Default → Hover → Active → Disabled
```

**Example Usage:**
```typescript
// Primary action
<Button>Create Shape</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Icon button in toolbar
<Button variant="ghost" size="icon">
  <RectangleIcon />
</Button>
```

### 2. Inputs

**Text Input:**
- Clean, minimal border
- Focus state with subtle border color change
- Clear placeholder text
- Proper spacing (px-3 py-2)

**States:**
- Default: Subtle border
- Focus: Highlighted border (primary color)
- Error: Red border with error message
- Disabled: Reduced opacity

**Example:**
```typescript
<Input
  type="email"
  placeholder="Enter email"
  className="min-h-[40px]"
/>
```

### 3. Modals/Dialogs

**Auth Modal (Primary Use Case):**
- Centered on screen
- Semi-transparent backdrop (overlay)
- Clean white background
- Rounded corners (8px)
- Subtle shadow
- Max width: 400px on desktop
- Full width with padding on mobile

**Structure:**
```
┌──────────────────────┐
│  Modal Header        │
├──────────────────────┤
│                      │
│  Form Content        │
│                      │
├──────────────────────┤
│  Action Buttons      │
└──────────────────────┘
```

**Rules:**
- Focus trap (can't interact with background)
- Close on Escape key
- Close on backdrop click
- Smooth entrance animation (fade + scale)

### 4. Toolbars

**Floating Toolbar (Recommended):**
- Floats above canvas
- Positioned top-center or top-left
- Rounded corners
- Subtle shadow
- Semi-transparent background (optional)
- Groups related tools

**Fixed Toolbar (Alternative):**
- Minimal height (48px)
- Full width
- Subtle bottom border
- Tools left-aligned
- Actions right-aligned

**Tool Groups:**
- Separate groups with divider line
- Group by function (shapes, selection, view)
- Max 8 tools visible at once
- Overflow menu for additional tools

**Example Layout:**
```
[ Rectangle ] [ Circle ] [ Text ] | [ Select ] | [ Zoom In ] [ Zoom Out ]
```

### 5. User Presence Indicator

**Position:**
- Bottom-right corner (floating)
- OR top-right corner (fixed)

**Display:**
- Show first 5 users as avatar circles
- "+3" indicator for additional users
- Click to expand full user list

**Avatar Style:**
- Circular
- 32px diameter (40px on touch)
- Initials or colored circle
- Border to separate from background
- Overlap slightly when multiple users

**Example:**
```
┌─────────────────────────────────┐
│                                 │
│         Canvas                  │
│                                 │
│                    ┌──────────┐ │
│                    │ [A][B][C]│ │
│                    │   +2     │ │
│                    └──────────┘ │
└─────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Canvas Interactions

**Pan (Move Canvas):**
- Click and drag on empty space
- Space + drag (optional for desktop)
- Two-finger drag on touch devices
- Cursor changes to grab hand

**Zoom:**
- Mouse wheel (Ctrl/Cmd + wheel for finer control)
- Pinch gesture on touch devices
- Zoom buttons in toolbar
- Zoom should center on cursor position

**Select Object:**
- Single click to select
- Visual feedback (highlight border)
- Show selection handles (optional for MVP)

**Move Object:**
- Click and drag selected object
- Show position during drag
- Snap to grid (optional)
- Cursor changes to move cursor

**Create Shape:**
- Click tool in toolbar
- Click on canvas to place
- OR click and drag to define size
- Object appears immediately (optimistic)

### 2. Keyboard Shortcuts (Desktop)

While not required for MVP, plan for these:

| Action | Shortcut |
|--------|----------|
| Pan | Space + Drag |
| Zoom In | Cmd/Ctrl + Plus |
| Zoom Out | Cmd/Ctrl + Minus |
| Zoom to Fit | Cmd/Ctrl + 0 |
| Delete | Delete/Backspace |
| Undo | Cmd/Ctrl + Z |

### 3. Touch Gestures (Mobile/Tablet)

| Gesture | Action |
|---------|--------|
| Single tap | Select object |
| Drag | Move object or pan canvas |
| Pinch | Zoom |
| Two-finger tap | Undo (optional) |
| Long press | Context menu (optional) |

### 4. Loading States

**Initial Canvas Load:**
- Show skeleton loader
- OR simple "Loading canvas..." message
- Smooth fade-in when ready

**Syncing Updates:**
- No spinner for real-time updates (too distracting)
- Subtle status indicator (optional)
- Toast notification for errors only

**Authentication:**
- Button shows loading state
- Disable form during submission
- Clear error messages

---

## Feedback & Affordances

### Visual Feedback

**Hover States:**
- Buttons: Background color change or border
- Canvas Objects: Subtle outline or shadow
- Toolbar Icons: Background highlight

**Active States:**
- Buttons: Pressed appearance (darker)
- Selected Object: Clear border/outline
- Active Tool: Highlighted in toolbar

**Focus States:**
- Keyboard focus: Visible outline (accessibility)
- Input focus: Border color change

### Cursor Changes

Use appropriate cursors for context:

| Context | Cursor |
|---------|--------|
| Canvas panning | `grab` / `grabbing` |
| Hovering object | `pointer` |
| Moving object | `move` |
| Resizing (future) | `nwse-resize`, etc. |
| Creating shape | `crosshair` |
| Text editing | `text` |

### Multiplayer Cursors

**Design:**
- Arrow cursor icon
- User's color
- Label with username below cursor
- Smooth movement (interpolated)
- Fade out if inactive for 5 seconds

**Size:**
- Cursor: 16x16px
- Label: Auto-width, max 120px
- Keep cursor above all canvas objects

### Success/Error States

**Success:**
- Subtle green checkmark (optional)
- Toast notification (non-intrusive)
- Auto-dismiss after 3 seconds

**Error:**
- Red error message
- Icon + descriptive text
- Persist until dismissed or action resolved

---

## Accessibility Guidelines

### WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1
- UI components: Minimum 3:1

**Keyboard Navigation:**
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Escape to close modals

**Screen Reader Support:**
- Semantic HTML elements
- ARIA labels where needed
- Alt text for images/icons
- Announce dynamic changes

**Touch Targets:**
- Minimum 44x44px on mobile
- Adequate spacing between targets
- Clear visual boundaries

**Motion:**
- Respect prefers-reduced-motion
- No autoplay animations
- Smooth but not distracting transitions

---

## Animation & Transitions

### Principles

**Subtle & Purposeful:**
- Animations should guide attention
- Never decorative or distracting
- Fast and smooth (200-300ms)
- Use easing functions (ease-out most common)

### Common Transitions

**Modal Entry:**
```css
/* Fade in + slight scale */
fade-in: opacity 200ms ease-out
scale: scale 200ms ease-out (0.95 → 1)
```

**Button Hover:**
```css
/* Quick background change */
background-color: 150ms ease-out
```

**Object Selection:**
```css
/* Instant border appearance */
border: 0ms (no transition, immediate feedback)
```

**Cursor Movement:**
```javascript
// Smooth interpolation, not CSS transition
// Update position every 16ms (60fps)
// Linear interpolation between points
```

**Page Transitions:**
```css
/* Simple fade */
page-fade: opacity 200ms ease-in-out
```

### What NOT to Animate

- Canvas rendering (must be 60fps, no CSS)
- Real-time object positions (use Konva/Canvas API)
- Frequent state changes (causes jank)

---

## Spacing & Sizing

### Spacing Scale

Use consistent spacing values (Tailwind scale):

| Size | Value | Usage |
|------|-------|-------|
| `xs` | 4px | Tight spacing, icon padding |
| `sm` | 8px | Component internal spacing |
| `md` | 16px | Standard gap between elements |
| `lg` | 24px | Section spacing |
| `xl` | 32px | Large gaps |
| `2xl` | 48px | Page-level spacing |

**Examples:**
- Button padding: `px-4 py-2` (16px x 8px)
- Modal padding: `p-6` (24px)
- Toolbar gap: `gap-2` (8px between tools)
- Input margin: `mb-4` (16px)

### Component Heights

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Button | 40px | 44px |
| Input | 40px | 44px |
| Toolbar | 48px | 56px |
| Modal Header | 60px | 64px |

### Touch Targets

**Minimum Sizes:**
- Mobile: 44x44px (Apple guideline)
- Desktop: 40x40px acceptable
- Spacing between targets: 8px minimum

---

## Iconography

### Icon Style

**Characteristics:**
- Outline style (not filled)
- 24x24px standard size
- 2px stroke width
- Consistent visual weight
- Lucide React icon library (recommended)

**Usage:**
- Use icons alongside text for clarity
- Icon-only buttons need tooltips
- Keep icon color consistent with text

**Common Icons Needed:**
```typescript
import {
  Square,        // Rectangle tool
  Circle,        // Circle tool
  Type,          // Text tool
  MousePointer2, // Select tool
  ZoomIn,        // Zoom in
  ZoomOut,       // Zoom out
  Users,         // Presence indicator
  LogOut,        // Logout
} from 'lucide-react';
```

---

## Micro-Interactions

### Button Click
- Scale down slightly (0.95) on mousedown
- Scale back to 1 on mouseup
- Duration: 100ms

### Object Selection
- Instant border appearance
- Optional: Subtle scale pulse (1 → 1.02 → 1)

### Toast Notifications
- Slide in from top or bottom
- Auto-dismiss after 3 seconds
- Smooth slide out

### Hover Effects
- Smooth transition (150ms)
- Subtle color shift
- No dramatic changes

---

## Error Handling & Empty States

### Error Messages

**Structure:**
```
[Icon] Error Title
Brief explanation of what went wrong.
[Action Button]
```

**Tone:**
- Friendly and helpful
- Avoid technical jargon
- Suggest solution when possible

**Examples:**
- "Failed to sync changes" → "Try again"
- "Invalid email format" → Show inline below input
- "Connection lost" → "Reconnecting..."

### Empty States

**No Objects on Canvas:**
```
┌─────────────────────────────┐
│                             │
│    [Icon]                   │
│                             │
│    Get started!             │
│    Click a tool to create   │
│    your first shape         │
│                             │
└─────────────────────────────┘
```

**No Users Online:**
- Show "Only you" in presence indicator
- Subtle message: "Share link to collaborate"

---

## Responsive Patterns

### Mobile Adaptations

**Toolbar:**
- Horizontal scrollable toolbar
- OR bottom sheet with tool picker
- Essential tools only visible

**Modals:**
- Full screen on very small devices
- Padding: 16px instead of 24px
- Larger touch targets

**Canvas:**
- Touch gestures primary
- Simplified interactions
- No hover states (use tap)

### Tablet Adaptations

**Landscape:**
- Similar to desktop experience
- Floating panels instead of fixed
- Multi-touch supported

**Portrait:**
- Similar to mobile
- More vertical space for tools
- Collapsible panels

### Desktop Enhancements

**Features:**
- Keyboard shortcuts
- Hover states
- Context menus (right-click)
- Multi-select with Shift

---

## Content Guidelines

### Microcopy

**Button Labels:**
- Action-oriented: "Create Shape" not "Shape"
- Concise: Max 2-3 words
- Clear: Avoid ambiguity

**Error Messages:**
- Start with what went wrong
- Explain why (if helpful)
- Suggest solution

**Tooltips:**
- Brief (1-5 words)
- Describe action, not tool name
- Show keyboard shortcut if applicable

**Example:**
```
✓ "Create rectangle (R)"
✗ "Rectangle tool"
```

### Tone & Voice

**Characteristics:**
- Professional but friendly
- Clear and concise
- Encouraging
- Never condescending

**Examples:**
- "Get started!" (encouraging)
- "Something went wrong. Please try again." (clear, helpful)
- "Syncing..." (informative)

---

## Performance Considerations

### Rendering Performance

**Canvas Operations:**
- Maintain 60 FPS always
- Throttle cursor updates (50ms)
- Use Konva layers efficiently
- Batch updates when possible

**UI Animations:**
- Use CSS transforms (GPU accelerated)
- Avoid animating layout properties
- Use will-change sparingly

### Loading States

**Progressive Enhancement:**
1. Show skeleton/loading immediately
2. Load critical UI first
3. Load canvas data
4. Render canvas objects
5. Connect real-time listeners

**Perceived Performance:**
- Optimistic updates (show immediately, sync later)
- Skeleton loaders (better than spinners)
- Instant feedback on interactions

---

## Testing Considerations

### Visual Testing

- Test on multiple screen sizes
- Test with different zoom levels
- Test with many objects (500+)
- Test with multiple users (5+)

### Interaction Testing

- Test all touch gestures
- Test keyboard navigation
- Test with screen reader
- Test on slow network (throttle)

### Browser Testing

**Priority Browsers:**
- Chrome (primary)
- Safari (iOS)
- Firefox
- Safari (macOS)
- Edge

**Mobile Testing:**
- iOS Safari
- Chrome Android
- Test on real devices when possible

---

## Component Checklist

Before considering a component "complete," ensure:

- [ ] Responsive (works on all breakpoints)
- [ ] Accessible (keyboard, screen reader)
- [ ] Proper states (hover, active, disabled, error)
- [ ] Touch-friendly (adequate target sizes)
- [ ] Smooth animations (if any)
- [ ] Clear feedback on interactions
- [ ] Consistent with design system
- [ ] Proper TypeScript types
- [ ] Follows naming conventions

---

## Tools & Resources

**Design Reference:**
- **Figma's actual interface** - The gold standard for canvas-first design
- Observe Figma's use of floating panels, minimal chrome, and clean typography
- Study how Figma uses subtle shadows and clean lines

**Figma-Specific Design Patterns:**
- **Floating toolbars** - Figma uses rounded, floating toolbars with subtle shadows
- **Minimal UI chrome** - The canvas takes up 95% of screen space
- **Clean property panels** - Right-side panels with clear sections and spacing
- **Cursor collaboration** - Named cursor labels with user colors
- **Presence indicators** - Clean avatar circles in corners

**Other Figma-Inspired Tools:**
- Linear (similar minimalist style and focus on speed)
- Notion (clean, functional)
- Slack (collaborative, real-time focus)

**Key Learnings from Figma:**
1. **Speed matters** - Fast feedback loops keep users in flow state
2. **Collaboration is core** - Real-time multiplayer isn't a feature, it's the foundation
3. **Canvas dominates** - UI should never compete with the workspace
4. **Simplicity scales** - Simple tools can handle complex use cases
5. **Play enables creativity** - Fun tools produce better work

**Design Testing:**
- Chrome DevTools (responsive mode)
- React DevTools
- Lighthouse (accessibility audit)
- WAVE (accessibility checker)