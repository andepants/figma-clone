# Theme Rules: CollabCanvas

## Design System Overview

CollabCanvas uses a **minimalist, Figma-inspired** design system rooted in Figma's core design philosophy. Figma's approach prioritizes:

- **Intentional minimalism** - Every element has a purpose
- **Visual clarity** - Clean hierarchy through typography and contrast
- **Subtle refinement** - Gentle shadows and soft borders (never harsh)
- **Canvas-first color** - Neutral backgrounds that don't compete with content
- **Functional color** - Color used for meaning, not decoration

### Figma's Visual Design Approach

Figma's CEO Dylan Field emphasizes that "the faster you make that feedback loop, the more you can get into that flow state," which influences every visual decision. The interface uses:

- **Neutral canvas backgrounds** - Light grays that recede, letting content shine
- **Minimal color palette** - Mostly grayscale with strategic accent colors
- **Subtle depth** - Soft shadows for hierarchy, never dramatic effects
- **Clean typography** - Clear, readable fonts at appropriate sizes
- **Whitespace as a tool** - Generous spacing for visual breathing room

---

## Color Palette

### Neutral Colors (Primary Palette)

These form the foundation of the interface - backgrounds, text, borders. Figma uses predominantly neutral colors with strategic pops of color only where needed for function or emphasis.

**Figma's Approach:** The canvas and UI are almost entirely grayscale, with color reserved for:
- Primary actions (buttons, links)
- User-specific elements (cursors, selections)
- Status indicators (success, error, warning)

```javascript
// tailwind.config.js
colors: {
  neutral: {
    50:  '#fafafa',  // Lightest backgrounds
    100: '#f5f5f5',  // Canvas background, light UI
    200: '#e5e5e5',  // Subtle borders, dividers
    300: '#d4d4d4',  // Borders, disabled states
    400: '#a3a3a3',  // Placeholder text
    500: '#737373',  // Secondary text
    600: '#525252',  // Body text
    700: '#404040',  // Headings
    800: '#262626',  // Dark text
    900: '#171717',  // Darkest text
  }
}
```

**Usage:**
- `neutral-50`: Very light backgrounds, modal overlays
- `neutral-100`: Canvas background, card backgrounds
- `neutral-200`: Subtle borders, dividers, separators
- `neutral-300`: Input borders, disabled button borders
- `neutral-400`: Placeholder text, icons in disabled state
- `neutral-500`: Secondary text, supporting information
- `neutral-600`: Primary body text
- `neutral-700`: Headings, important text
- `neutral-800`: Emphasis text
- `neutral-900`: Maximum contrast text

### Accent Colors

Minimal use of color for actions and states.

```javascript
colors: {
  // Primary - Main actions, links, selected states
  primary: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Primary brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Success - Confirmations, success states
  success: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',  // Success actions
    600: '#16a34a',
  },

  // Error - Errors, destructive actions
  error: {
    50:  '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',  // Error states
    600: '#dc2626',
  },

  // Warning - Warnings, cautions
  warning: {
    50:  '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',  // Warning states
    600: '#d97706',
  }
}
```

**Usage:**
- `primary-500`: Primary buttons, links, selected objects
- `success-500`: Success messages, confirmations
- `error-500`: Error messages, destructive actions
- `warning-500`: Warning messages, cautions

### Canvas-Specific Colors

Special colors for canvas elements.

```javascript
colors: {
  canvas: {
    bg: '#f5f5f5',           // Canvas background (neutral-100)
    grid: '#e5e5e5',         // Grid lines (very subtle, neutral-200)
    selection: '#0ea5e9',    // Selection outline (primary-500)
    hover: '#0ea5e920',      // Hover state (primary with 20% opacity)
  }
}
```

### User Cursor Colors

Distinct colors for multiplayer cursors (6-8 options for user assignment).

```javascript
const cursorColors = [
  '#0ea5e9', // Blue (primary)
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Orange
  '#10b981', // Green
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Deep orange
];
```

**Assignment:**
- Assign color to user on join
- Store in user presence data
- Use for cursor and label background

---

## Typography

### Figma's Typography Philosophy

Figma uses clean, highly readable sans-serif typography with clear hierarchy. Their approach:
- **Readability first** - Never sacrifice clarity for style
- **Consistent sizes** - Limited type scale prevents visual chaos
- **Appropriate weights** - Use weight to create hierarchy, not size alone
- **Generous line height** - Breathing room improves scannability

### Font Family

```css
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

**Why Inter:**
- Clean, modern sans-serif
- Excellent readability at all sizes
- Used by Figma, Linear, and other modern tools
- Available on Google Fonts

**Fallbacks:**
- `-apple-system`: macOS/iOS system font
- `BlinkMacSystemFont`: Older Chrome
- `Segoe UI`: Windows system font

**Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Font Sizes

```javascript
// tailwind.config.js
fontSize: {
  xs:   ['0.75rem', { lineHeight: '1rem' }],     // 12px - Tiny labels, captions
  sm:   ['0.875rem', { lineHeight: '1.25rem' }], // 14px - Small text, secondary info
  base: ['1rem', { lineHeight: '1.5rem' }],      // 16px - Body text, buttons
  lg:   ['1.125rem', { lineHeight: '1.75rem' }], // 18px - Large body text
  xl:   ['1.25rem', { lineHeight: '1.75rem' }],  // 20px - Small headings
  '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px - Section headings
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],// 30px - Page titles
}
```

**Usage:**
- `xs` (12px): Cursor labels, timestamps, tiny captions
- `sm` (14px): Secondary information, helper text, small buttons
- `base` (16px): Primary body text, button text, input text
- `lg` (18px): Emphasized text, large buttons
- `xl` (20px): Small section headings
- `2xl` (24px): Modal titles, section headers
- `3xl` (30px): Page titles (rare in canvas app)

### Font Weights

```javascript
fontWeight: {
  normal: '400',  // Body text
  medium: '500',  // Buttons, emphasized text
  semibold: '600', // Headings, strong emphasis
  bold: '700',     // Rare, maximum emphasis
}
```

**Usage:**
- `normal` (400): All body text, descriptions
- `medium` (500): Buttons, labels, tabs
- `semibold` (600): Headings, modal titles
- `bold` (700): Rarely used, only for maximum emphasis

### Text Examples

```typescript
// Page/Modal Title
<h1 className="text-2xl font-semibold text-neutral-800">
  Welcome to CollabCanvas
</h1>

// Section Heading
<h2 className="text-xl font-semibold text-neutral-700">
  Online Users
</h2>

// Body Text
<p className="text-base font-normal text-neutral-600">
  Click a tool to create your first shape
</p>

// Secondary Text
<span className="text-sm text-neutral-500">
  Last edited 2 minutes ago
</span>

// Caption / Label
<span className="text-xs text-neutral-400">
  john@example.com
</span>

// Button Text
<button className="text-base font-medium">
  Create Account
</button>
```

### Letter Spacing

```javascript
letterSpacing: {
  tight: '-0.01em',   // Headings (slightly tighter)
  normal: '0',        // Body text
  wide: '0.025em',    // Button text, labels (slightly wider)
}
```

**Usage:**
- Headings: `tracking-tight`
- Body text: `tracking-normal` (default)
- Buttons/labels: `tracking-wide`

---

## Spacing Scale

Use Tailwind's default spacing scale (4px base unit).

```javascript
spacing: {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
}
```

**Common Patterns:**

**Component Padding:**
- Button: `px-4 py-2` (16px x 8px)
- Input: `px-3 py-2` (12px x 8px)
- Modal: `p-6` (24px all sides)
- Card: `p-4` (16px all sides)

**Component Gaps:**
- Tight elements: `gap-2` (8px)
- Standard spacing: `gap-4` (16px)
- Loose spacing: `gap-6` (24px)

**Margins:**
- Between form elements: `mb-4` (16px)
- Between sections: `mb-8` (32px)
- Page-level: `mb-12` (48px)

---

## Border Radius

```javascript
borderRadius: {
  none: '0',
  sm: '0.25rem',    // 4px - Subtle rounding
  DEFAULT: '0.5rem', // 8px - Standard buttons, inputs
  md: '0.5rem',     // 8px - Cards, modals
  lg: '0.75rem',    // 12px - Large cards
  xl: '1rem',       // 16px - Very rounded
  full: '9999px',   // Circular - Avatar, pills
}
```

**Usage:**
- Buttons: `rounded-md` (8px)
- Inputs: `rounded-md` (8px)
- Modals: `rounded-lg` (12px)
- Cards: `rounded-lg` (12px)
- Avatars: `rounded-full` (circular)
- Tags/pills: `rounded-full` (circular)
- Canvas objects: `rounded-sm` or none (depends on tool)

---

## Shadows

Subtle shadows for depth, Figma-inspired.

### Figma's Shadow Philosophy

Figma uses shadows sparingly and subtly—they create just enough depth to separate layers without drawing attention. Key principles:

- **Soft, never harsh** - Shadows blend naturally, never have hard edges
- **Minimal z-axis** - Figma's interface feels flat but organized
- **Functional, not decorative** - Shadows indicate "this floats above that," nothing more
- **Consistent light source** - All shadows suggest light from above-left

```javascript
// tailwind.config.js
boxShadow: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  none: '0 0 #0000',
}
```

**Usage:**
- Floating toolbar: `shadow-lg`
- Modals: `shadow-xl`
- Buttons (hover): `shadow-md`
- Cards: `shadow-md`
- Dropdowns: `shadow-lg`
- Cursor labels: `shadow-sm`

**Example:**
```typescript
// Floating toolbar
<div className="bg-white rounded-lg shadow-lg p-2">
  {/* Tools */}
</div>

// Modal
<div className="bg-white rounded-lg shadow-xl p-6">
  {/* Content */}
</div>
```

---

## Borders

```javascript
borderWidth: {
  0: '0px',
  DEFAULT: '1px',
  2: '2px',
  4: '4px',
}

borderColor: {
  // Use neutral colors for borders
  DEFAULT: colors.neutral[200], // Subtle default border
}
```

**Usage:**
- Default borders: `border border-neutral-200`
- Focus state: `border-primary-500`
- Error state: `border-error-500`
- Thicker emphasis: `border-2`

**Examples:**
```typescript
// Input default
<input className="border border-neutral-300 rounded-md" />

// Input focus
<input className="border border-primary-500 rounded-md" />

// Input error
<input className="border border-error-500 rounded-md" />

// Divider
<div className="border-t border-neutral-200" />
```

---

## Opacity Values

```javascript
opacity: {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  50: '0.5',
  75: '0.75',
  90: '0.9',
  100: '1',
}
```

**Usage:**
- Modal backdrop: `bg-black opacity-50`
- Disabled elements: `opacity-50`
- Hover overlays: `opacity-10`
- Inactive cursors: `opacity-75`

---

## Z-Index Scale

```javascript
zIndex: {
  0: '0',
  10: '10',      // Canvas objects
  20: '20',      // Selection outlines
  30: '30',      // Cursors
  40: '40',      // Floating toolbar
  50: '50',      // Dropdown menus
  60: '60',      // Modals
  70: '70',      // Modal overlays
  80: '80',      // Toasts/notifications
  90: '90',      // Tooltips
  100: '100',    // Highest priority
}
```

**Hierarchy:**
```
Canvas (0)
  └─ Objects (10)
  └─ Selection outlines (20)
  └─ Cursors (30)
Floating UI (40)
Dropdowns (50)
Modals (60-70)
Toasts (80)
Tooltips (90)
```

---

## Transitions & Animations

### Duration

```javascript
transitionDuration: {
  75: '75ms',     // Instant feedback
  100: '100ms',   // Quick interactions
  150: '150ms',   // Standard hover
  200: '200ms',   // Button clicks
  300: '300ms',   // Modals, panels
  500: '500ms',   // Page transitions
}
```

**Usage:**
- Hover effects: `duration-150`
- Button clicks: `duration-200`
- Modal entry: `duration-300`
- Page transitions: `duration-500`

### Easing Functions

```javascript
transitionTimingFunction: {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',      // Most common
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

**Usage:**
- Most transitions: `ease-out`
- Two-way animations: `ease-in-out`
- Linear: rarely (progress bars)

### Common Transitions

```typescript
// Button hover
<button className="transition-colors duration-150 ease-out hover:bg-primary-600">

// Modal entry
<div className="transition-all duration-300 ease-out">

// Smooth opacity fade
<div className="transition-opacity duration-200 ease-out">

// Scale on click
<button className="transition-transform duration-100 ease-out active:scale-95">
```

---

## Component-Specific Styles

### Buttons

**Primary Button:**
```typescript
<button className="
  px-4 py-2
  bg-primary-500
  hover:bg-primary-600
  active:bg-primary-700
  text-white
  font-medium
  rounded-md
  shadow-sm
  hover:shadow-md
  transition-all duration-150 ease-out
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Create Shape
</button>
```

**Secondary Button (Outline):**
```typescript
<button className="
  px-4 py-2
  border border-neutral-300
  hover:border-neutral-400
  hover:bg-neutral-50
  text-neutral-700
  font-medium
  rounded-md
  transition-all duration-150 ease-out
">
  Cancel
</button>
```

**Ghost Button (Icon):**
```typescript
<button className="
  p-2
  hover:bg-neutral-100
  text-neutral-600
  rounded-md
  transition-colors duration-150 ease-out
">
  <SquareIcon className="w-5 h-5" />
</button>
```

### Inputs

```typescript
<input className="
  w-full
  px-3 py-2
  border border-neutral-300
  focus:border-primary-500 focus:ring-1 focus:ring-primary-500
  rounded-md
  text-base text-neutral-700
  placeholder:text-neutral-400
  transition-colors duration-150
  disabled:bg-neutral-100 disabled:cursor-not-allowed
" />
```

### Modal

```typescript
// Backdrop
<div className="
  fixed inset-0
  bg-black/50
  z-60
  transition-opacity duration-300
">

// Modal container
<div className="
  fixed inset-0
  flex items-center justify-center
  p-4
  z-70
">

  // Modal content
  <div className="
    w-full max-w-md
    bg-white
    rounded-lg
    shadow-xl
    p-6
    transition-all duration-300
  ">
    {/* Modal content */}
  </div>
</div>
```

### Floating Toolbar

```typescript
<div className="
  fixed top-4 left-1/2 -translate-x-1/2
  flex items-center gap-2
  bg-white
  rounded-lg
  shadow-lg
  p-2
  z-40
">
  {/* Tool buttons */}
</div>
```

### User Presence (Avatars)

```typescript
// Container
<div className="
  fixed bottom-4 right-4
  flex items-center gap-2
  bg-white
  rounded-full
  shadow-md
  px-3 py-2
  z-40
">
  {/* Avatar */}
  <div className="
    w-8 h-8
    rounded-full
    bg-primary-500
    text-white
    flex items-center justify-center
    text-sm font-medium
    border-2 border-white
    -ml-2 first:ml-0
  ">
    AB
  </div>
</div>
```

### Cursor Label

```typescript
<div className="
  absolute
  px-2 py-1
  bg-primary-500
  text-white
  text-xs
  rounded
  shadow-sm
  whitespace-nowrap
  pointer-events-none
">
  John Doe
</div>
```

---

## Responsive Breakpoints

Match the breakpoints defined in ui-rules.md:

```javascript
screens: {
  'sm': '640px',   // Mobile landscape, small tablets
  'md': '768px',   // Tablets portrait
  'lg': '1024px',  // Tablets landscape, laptops
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

**Usage Examples:**
```typescript
// Mobile-first responsive design
<div className="
  w-full          /* Mobile: full width */
  md:w-1/2        /* Tablet: half width */
  lg:w-1/3        /* Desktop: third width */
">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Different padding
<div className="
  p-4           /* Mobile: 16px */
  md:p-6        /* Tablet: 24px */
  lg:p-8        /* Desktop: 32px */
">
```

---

## Dark Mode (Future Enhancement)

While not in MVP scope, here's the structure for future dark mode support:

```javascript
// Dark mode colors (future)
colors: {
  dark: {
    bg: {
      primary: '#1a1a1a',
      secondary: '#262626',
      tertiary: '#404040',
    },
    text: {
      primary: '#fafafa',
      secondary: '#a3a3a3',
      tertiary: '#737373',
    },
    border: '#404040',
  }
}
```

---

## Implementation in Tailwind Config

Here's the complete tailwind.config.js:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        canvas: {
          bg: '#f5f5f5',
          grid: '#e5e5e5',
          selection: '#0ea5e9',
          hover: 'rgba(14, 165, 233, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
```

---

## Quick Reference: Common Styles

```typescript
// Text styles
const textStyles = {
  h1: "text-2xl font-semibold text-neutral-800",
  h2: "text-xl font-semibold text-neutral-700",
  body: "text-base text-neutral-600",
  caption: "text-sm text-neutral-500",
  label: "text-xs text-neutral-400",
};

// Button variants
const buttonStyles = {
  primary: "px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-150",
  secondary: "px-4 py-2 border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700 font-medium rounded-md transition-all duration-150",
  ghost: "p-2 hover:bg-neutral-100 text-neutral-600 rounded-md transition-colors duration-150",
};

// Input styles
const inputStyles = "w-full px-3 py-2 border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-md text-base text-neutral-700 placeholder:text-neutral-400 transition-colors duration-150";

// Card styles
const cardStyles = "bg-white rounded-lg shadow-md p-4";
```

---

## Figma's Visual Design Principles (Summary)

These principles from Figma's design philosophy should guide all visual decisions:

### 1. Intentional Minimalism
**"Make complex things feel simple"** - Dylan Field

- Remove anything that doesn't serve a purpose
- Every pixel should earn its place
- Complexity should be hidden behind simplicity

### 2. Visual Hierarchy Through Contrast
**"If everything looks the same, then you see nothing"** - Figma Design Resources

- Use size, weight, and color to create clear hierarchy
- Primary actions should be obvious
- Secondary elements should recede

### 3. Canvas-First Design
**The workspace is sacred** - Figma's core principle

- UI chrome should never compete with canvas content
- Background colors should recede (light grays, never pure white)
- Floating panels better than fixed sidebars

### 4. Functional Color
**Color communicates, not decorates**

- Use color sparingly and with purpose
- Neutral gray scale for 90% of UI
- Bright colors only for actions, states, and user-specific elements

### 5. Subtle Depth
**Depth through subtlety, not drama**

- Soft shadows suggest layering
- Rounded corners feel modern but not playful
- Borders are thin and understated

### 6. Craftsmanship
**"Thoughtfulness and care in the work we do"** - Figma Engineering Values

- Pixel-perfect alignment
- Consistent spacing everywhere
- Attention to micro-interactions
- Quality over speed

### 7. Speed & Feedback
**"Fast feedback loops keep you in flow state"** - Dylan Field

- Instant visual feedback on interactions
- Smooth transitions (200-300ms)
- No loading spinners unless necessary
- Optimistic updates

### 8. Accessibility First
**Design should be accessible to all**

- 4.5:1 contrast minimum for text
- Keyboard navigation support
- Screen reader friendly
- Touch targets 44x44px minimum

---

## Implementation Checklist

Before launching, verify:

- [ ] Color palette is 90% neutral grays
- [ ] Shadows are soft and subtle (never harsh)
- [ ] Canvas background is light gray (#f5f5f5), not white
- [ ] Typography uses Inter with clear hierarchy
- [ ] Spacing follows 4px/8px grid system
- [ ] All interactions have <300ms transitions
- [ ] Primary actions use blue (#0ea5e9)
- [ ] UI chrome is minimal and non-competitive
- [ ] Floating toolbars have rounded corners and soft shadows
- [ ] Cursor labels use user-specific colors
- [ ] All text meets WCAG 2.1 AA contrast
- [ ] Touch targets are 44x44px on mobile

---

## Design Tokens (for reference)

```typescript
export const tokens = {
  colors: {
    primary: '#0ea5e9',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    neutral: {
      text: '#525252',
      textLight: '#737373',
      border: '#e5e5e5',
      bg: '#f5f5f5',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
    }
  }
};
```