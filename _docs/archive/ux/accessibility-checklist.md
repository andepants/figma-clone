# Accessibility Checklist (WCAG 2.1 AA)

**Purpose:** Ensure CanvasIcons is accessible to all users, meeting WCAG 2.1 Level AA standards.

**Why:** Accessibility is not optional. It's required for professional software and improves UX for everyone.

**Target:** Lighthouse accessibility score >95

---

## 1. Keyboard Navigation

### Requirements
- [ ] All interactive elements are focusable with Tab key
- [ ] Tab order follows logical reading order (top-to-bottom, left-to-right)
- [ ] Shift+Tab navigates backward through elements
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate menus and lists

### Testing
1. Disconnect mouse
2. Navigate entire app using only keyboard
3. Verify all interactive elements are reachable
4. Verify focus never gets trapped (except in modals)
5. Test all keyboard shortcuts (R for rectangle, Cmd+Z for undo, etc.)

### Common Issues
- ❌ `div` elements with onClick but not focusable → Use `button` or add `tabindex="0"`
- ❌ Custom dropdowns not keyboard accessible → Use Radix UI components
- ❌ Modal doesn't trap focus → Use focus trap library

---

## 2. Focus Indicators

### Requirements
- [ ] All focusable elements have visible focus ring (2px blue outline)
- [ ] Focus ring contrasts with background (3:1 minimum)
- [ ] Focus ring is not removed with `outline: none` unless replaced
- [ ] Focus ring works in both light and dark mode (future)

### Implementation
```css
/* Global focus styles */
*:focus-visible {
  outline: 2px solid #0EA5E9; /* Sky Blue 500 */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Never remove outline without replacement */
button:focus {
  outline: 2px solid #0EA5E9;
}
```

### Testing
1. Tab through all interactive elements
2. Verify focus ring is visible on every element
3. Test on light backgrounds (white, gray)
4. Test on dark backgrounds (blue buttons, dark panels)

---

## 3. Color Contrast

### Requirements
- [ ] Normal text (< 18px): 4.5:1 contrast ratio minimum
- [ ] Large text (≥ 18px or 14px bold): 3:1 contrast ratio minimum
- [ ] Interactive elements (buttons, links): 3:1 contrast ratio minimum
- [ ] Disabled text: No minimum (but should be clearly disabled)

### Color Combinations (Pre-approved)

#### Text Colors
✅ **Pass (4.5:1+)**
- `#1E293B` (Slate 800) on `#FFFFFF` (White) → 15.8:1
- `#64748B` (Slate 500) on `#FFFFFF` (White) → 5.7:1
- `#FFFFFF` (White) on `#0EA5E9` (Sky 500) → 3.5:1 (large text only)

❌ **Fail**
- `#94A3B8` (Slate 400) on `#FFFFFF` (White) → 3.1:1 (too low for normal text)

### Tools
- Chrome DevTools Lighthouse (Accessibility audit)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Tool](https://contrast-ratio.com/)

### Testing
1. Run Lighthouse audit on all pages
2. Check all text against background colors
3. Verify buttons, links, icons meet 3:1 minimum
4. Test with color blindness simulator (Chrome DevTools)

---

## 4. Alternative Text

### Requirements
- [ ] All `<img>` elements have descriptive `alt` text
- [ ] Decorative images use `alt=""` (empty string)
- [ ] Icon-only buttons have `aria-label`
- [ ] SVG icons have `<title>` or `aria-label`

### Examples

#### Image with Alt Text
```tsx
<img
  src="/logo.png"
  alt="CanvasIcons logo"
/>
```

#### Decorative Image
```tsx
<img
  src="/background-pattern.png"
  alt="" // Empty for decorative images
  aria-hidden="true"
/>
```

#### Icon-Only Button
```tsx
<button aria-label="Export canvas to PNG">
  <DownloadIcon aria-hidden="true" />
</button>
```

#### SVG Icon with Title
```tsx
<svg aria-labelledby="edit-icon-title">
  <title id="edit-icon-title">Edit project</title>
  <path d="..." />
</svg>
```

### Testing
1. Turn on screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate through all images
3. Verify screen reader announces descriptive text
4. Verify decorative images are skipped

---

## 5. Form Labels

### Requirements
- [ ] All `<input>`, `<select>`, `<textarea>` have associated `<label>`
- [ ] Label uses `for` attribute matching input `id`
- [ ] OR input is wrapped in `<label>`
- [ ] Placeholder text is NOT used as label (supplement only)
- [ ] Required fields are marked with `aria-required="true"`

### Examples

#### Explicit Label
```tsx
<label htmlFor="project-name">Project Name</label>
<input
  id="project-name"
  type="text"
  aria-required="true"
/>
```

#### Implicit Label
```tsx
<label>
  Project Name
  <input type="text" aria-required="true" />
</label>
```

#### Checkbox with Label
```tsx
<label>
  <input type="checkbox" />
  <span>Make project public</span>
</label>
```

### Testing
1. Click label → Input should focus
2. Screen reader should announce label when input is focused
3. Verify all inputs have labels (no orphaned inputs)

---

## 6. Error Identification

### Requirements
- [ ] Errors are announced to screen readers (`aria-live="polite"` or `role="alert"`)
- [ ] Error messages are programmatically associated with inputs (`aria-describedby`)
- [ ] Errors are visible (not color-only indication)
- [ ] Errors persist until user fixes issue (don't auto-hide)

### Examples

#### Inline Error with aria-describedby
```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <p id="email-error" className="text-red-600" role="alert">
    Please enter a valid email address
  </p>
)}
```

#### Form-Level Error
```tsx
{formError && (
  <div role="alert" className="bg-red-50 border border-red-200 p-4 rounded">
    <p className="text-red-800">{formError}</p>
  </div>
)}
```

### Testing
1. Submit form with errors
2. Screen reader should announce error
3. Tab to input → Screen reader should read error message
4. Verify error is visible (red text + icon, not just red border)

---

## 7. Skip Links

### Requirements
- [ ] "Skip to content" link at top of page (first focusable element)
- [ ] Skip link is visible when focused
- [ ] Skip link jumps to main content area

### Implementation
```tsx
// In App.tsx or Layout component
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
>
  Skip to content
</a>

// Main content area
<main id="main-content" tabIndex={-1}>
  {/* Page content */}
</main>
```

### Testing
1. Load page
2. Press Tab (first element should be skip link)
3. Press Enter → Focus should jump to main content
4. Verify skip link is hidden until focused

---

## 8. Semantic HTML

### Requirements
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping levels)
- [ ] Only one `<h1>` per page
- [ ] Use `<button>` for actions, `<a>` for navigation
- [ ] Use `<nav>`, `<main>`, `<header>`, `<footer>` landmarks
- [ ] Lists use `<ul>` or `<ol>`, not `<div>` with styling

### Heading Hierarchy

```tsx
// Landing Page
<h1>CanvasIcons - Professional App Icons</h1> {/* Page title */}
  <h2>Features</h2> {/* Section */}
    <h3>Real-Time Collaboration</h3> {/* Subsection */}
    <h3>Export-Ready Files</h3>
  <h2>Pricing</h2>
    <h3>Founders Tier</h3>
    <h3>Pro Tier</h3>
```

### Button vs Link

```tsx
// ✅ Button for actions
<button onClick={handleDelete}>Delete</button>

// ✅ Link for navigation
<a href="/pricing">View Pricing</a>

// ❌ Don't use link for actions
<a onClick={handleDelete}>Delete</a> // Wrong!

// ❌ Don't use button for navigation
<button onClick={() => navigate('/pricing')}>Pricing</button> // Wrong!
```

### Testing
1. Use HeadingsMap browser extension
2. Verify heading hierarchy is logical
3. Verify only one h1 per page
4. Verify landmarks are used (`<nav>`, `<main>`, etc.)

---

## 9. ARIA Labels

### Requirements
- [ ] Icon-only buttons have `aria-label`
- [ ] Custom components have appropriate ARIA roles
- [ ] Dynamic content uses `aria-live` for announcements
- [ ] Expandable sections use `aria-expanded`

### Examples

#### Icon Button
```tsx
<button aria-label="Close modal">
  <XIcon aria-hidden="true" />
</button>
```

#### Expandable Section
```tsx
<button
  aria-expanded={isExpanded}
  aria-controls="section-content"
>
  Show Details
</button>
<div id="section-content" hidden={!isExpanded}>
  {/* Content */}
</div>
```

#### Live Region (Announcements)
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {notification}
</div>
```

### Testing
1. Use screen reader to navigate app
2. Verify all buttons are announced with clear labels
3. Verify expanded/collapsed state is announced
4. Verify live regions announce updates

---

## 10. Focus Management

### Requirements
- [ ] Modal traps focus (can't tab outside)
- [ ] Modal returns focus to trigger element on close
- [ ] Dropdown menus trap focus
- [ ] Focus is moved to new content after navigation

### Modal Focus Trap

```tsx
import { useEffect, useRef } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose, triggerRef }) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal
  useFocusTrap(modalRef, isOpen);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

### Testing
1. Open modal
2. Press Tab → Focus should stay within modal
3. Press Escape → Modal closes, focus returns to button
4. Verify focus is not lost during navigation

---

## Screen Reader Testing

### VoiceOver (Mac)
1. Enable: System Preferences → Accessibility → VoiceOver
2. Activate: Cmd+F5
3. Navigate: VO+Right Arrow (Control+Option+Right Arrow)
4. Interact: VO+Space
5. Read all: VO+A

### NVDA (Windows)
1. Download: https://www.nvaccess.org/download/
2. Activate: Ctrl+Alt+N
3. Navigate: Down Arrow
4. Interact: Enter
5. Read all: Insert+Down Arrow

### Testing Checklist
- [ ] All text is read aloud correctly
- [ ] All buttons announce their action
- [ ] Form errors are announced
- [ ] Loading states are announced
- [ ] Navigation landmarks are identified
- [ ] Expandable sections announce state
- [ ] Modal/dialog role is announced

---

## Automated Testing

### Lighthouse (Chrome DevTools)
1. Open DevTools → Lighthouse tab
2. Select "Accessibility" category
3. Generate report
4. Fix all issues until score >95

### axe DevTools (Browser Extension)
1. Install: https://www.deque.com/axe/devtools/
2. Open DevTools → axe DevTools tab
3. Click "Scan ALL of my page"
4. Fix all critical and serious issues

### ESLint Plugin (jsx-a11y)
```bash
npm install -D eslint-plugin-jsx-a11y
```

```json
// .eslintrc
{
  "extends": ["plugin:jsx-a11y/recommended"],
  "plugins": ["jsx-a11y"]
}
```

---

## Common Accessibility Pitfalls

### ❌ Don't Do This
```tsx
// No focus indicator
button:focus { outline: none; }

// Div as button (not keyboard accessible)
<div onClick={handleClick}>Click me</div>

// Placeholder as label
<input placeholder="Enter your name" />

// Color-only error indication
<input className={hasError ? 'border-red-500' : ''} />

// Missing alt text
<img src="/logo.png" />

// Inaccessible modal (no focus trap)
<div className="modal">{/* Content */}</div>
```

### ✅ Do This Instead
```tsx
// Custom focus indicator
button:focus-visible {
  outline: 2px solid #0EA5E9;
  outline-offset: 2px;
}

// Button element
<button onClick={handleClick}>Click me</button>

// Label + placeholder
<label htmlFor="name">Name</label>
<input id="name" placeholder="e.g. John Doe" />

// Error with text + icon
{hasError && (
  <p className="text-red-600 flex items-center">
    <ExclamationIcon className="mr-2" />
    This field is required
  </p>
)}

// Descriptive alt text
<img src="/logo.png" alt="CanvasIcons logo" />

// Accessible modal with focus trap
<Dialog open={isOpen} onClose={onClose} aria-labelledby="modal-title">
  <h2 id="modal-title">Export Canvas</h2>
  {/* Content */}
</Dialog>
```

---

## Accessibility Checklist Summary

### Level A (Basic)
- [x] Keyboard navigation works for all elements
- [x] Focus indicators are visible
- [x] Color contrast meets 4.5:1 for text
- [x] All images have alt text
- [x] All inputs have labels

### Level AA (Intermediate)
- [x] Skip links implemented
- [x] Heading hierarchy is logical
- [x] ARIA labels for icon buttons
- [x] Error messages are accessible
- [x] Focus management in modals

### Level AAA (Advanced) - Future
- [ ] Sign language interpretation (video content)
- [ ] Extended audio descriptions
- [ ] 7:1 contrast ratio for text

---

## Testing Schedule

### During Development
- [ ] Run ESLint jsx-a11y plugin (on every commit)
- [ ] Manual keyboard navigation test (every feature)
- [ ] Screen reader spot-check (major UI changes)

### Before Release
- [ ] Full Lighthouse accessibility audit (all pages)
- [ ] axe DevTools scan (all pages)
- [ ] Complete keyboard navigation test
- [ ] Complete screen reader test (VoiceOver + NVDA)
- [ ] Manual WCAG 2.1 AA checklist review

### Ongoing
- [ ] Monthly accessibility audit
- [ ] User feedback from assistive technology users
- [ ] Update checklist as WCAG standards evolve

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Articles](https://webaim.org/articles/)

### Testing Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

### Learning
- [A11ycasts with Rob Dodson](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## Next Steps

1. Install ESLint jsx-a11y plugin
2. Run Lighthouse audit on existing pages
3. Fix all critical accessibility issues
4. Implement skip links
5. Add focus indicators to all interactive elements
6. Test with VoiceOver and NVDA
7. Document accessibility patterns for team
