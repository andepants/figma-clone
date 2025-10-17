# CanvasIcons Design Tokens

**Last Updated:** 2025-10-16
**Status:** ✅ Production Ready
**Location:** `src/styles/globals.css` (Tailwind v4 inline @theme)

## Overview

CanvasIcons uses a comprehensive design token system built on Tailwind CSS v4 with inline `@theme` configuration. The system provides:
- Figma-inspired color palette (90% neutral grays, functional color for actions)
- 4px base spacing unit for precise alignment
- Systematic typography scale with 4px grid
- Elevation system with subtle shadows
- Animation keyframes for micro-interactions

---

## 🎨 Color System

### Brand Colors

Primary color for actions, CTAs, selected states:

```css
--color-primary-50: #f0f9ff   /* Lightest blue tint */
--color-primary-100: #e0f2fe
--color-primary-200: #bae6fd
--color-primary-300: #7dd3fc
--color-primary-400: #38bdf8
--color-primary-500: #0ea5e9  /* ✨ Main brand blue */
--color-primary-600: #0284c7
--color-primary-700: #0369a1
--color-primary-800: #075985
--color-primary-900: #0c4a6e  /* Darkest blue shade */
```

**Usage:**
- `bg-primary-500` - CTA buttons, active states
- `text-primary-600` - Links, interactive text
- `border-primary-300` - Focus rings, selected borders

### Neutral Colors

Foundation for 90% of UI (Figma-inspired minimalism):

```css
--color-neutral-50: #fafafa   /* Canvas background */
--color-neutral-100: #f5f5f5  /* Panel background */
--color-neutral-200: #e5e5e5  /* Borders, dividers */
--color-neutral-300: #d4d4d4  /* Subtle borders */
--color-neutral-400: #a3a3a3  /* Disabled text */
--color-neutral-500: #737373  /* Secondary text */
--color-neutral-600: #525252  /* Primary text light */
--color-neutral-700: #404040  /* Primary text */
--color-neutral-800: #262626  /* Headings */
--color-neutral-900: #171717  /* Hero text */
```

**Usage:**
- `bg-neutral-100` - Sidebar, toolbar backgrounds
- `text-neutral-700` - Body text
- `border-neutral-200` - Subtle dividers

### Semantic Colors

Success (Green):
```css
--color-success-50: #f0fdf4
--color-success-100: #dcfce7
--color-success-500: #22c55e  /* Success state */
--color-success-600: #16a34a  /* Success hover */
```

Error (Red):
```css
--color-error-50: #fef2f2
--color-error-100: #fee2e2
--color-error-500: #ef4444    /* Error state */
--color-error-600: #dc2626    /* Error hover */
```

Warning (Amber):
```css
--color-warning-50: #fffbeb
--color-warning-100: #fef3c7
--color-warning-500: #f59e0b  /* Warning state */
--color-warning-600: #d97706  /* Warning hover */
```

### Canvas-Specific Colors

```css
--color-canvas-bg: #f5f5f5           /* Canvas background (Figma gray) */
--color-canvas-grid: #e5e5e5         /* Grid lines */
--color-canvas-selection: #0ea5e9   /* Selection box */
--color-canvas-hover: rgba(14, 165, 233, 0.2) /* Hover overlay */
```

---

## 📐 Spacing System

**Base Unit:** 4px

Tailwind's default spacing follows the 4px grid:

```
0.5 = 2px    (0.125rem)
1   = 4px    (0.25rem)
2   = 8px    (0.5rem)
3   = 12px   (0.75rem)
4   = 16px   (1rem)
5   = 20px   (1.25rem)
6   = 24px   (1.5rem)
8   = 32px   (2rem)
10  = 40px   (2.5rem)
12  = 48px   (3rem)
16  = 64px   (4rem)
20  = 80px   (5rem)
24  = 96px   (6rem)
32  = 128px  (8rem)
```

**Usage:**
- `p-3` = 12px padding (buttons, inputs)
- `gap-4` = 16px gap (card spacing)
- `my-6` = 24px vertical margin (section spacing)

---

## 📝 Typography Scale

**Font Family:**
- Sans: `Inter`, `system-ui`, `sans-serif`
- Mono: `JetBrains Mono`, `monospace`

**Scale (follows 4px grid):**

```
xs   = 12px (0.75rem)   | line-height: 16px (1rem)      | Labels, captions
sm   = 14px (0.875rem)  | line-height: 20px (1.25rem)   | Secondary text
base = 16px (1rem)      | line-height: 24px (1.5rem)    | Body text
lg   = 18px (1.125rem)  | line-height: 28px (1.75rem)   | Subheadings
xl   = 20px (1.25rem)   | line-height: 28px (1.75rem)   | Card titles
2xl  = 24px (1.5rem)    | line-height: 32px (2rem)      | Section headings
3xl  = 30px (1.875rem)  | line-height: 36px (2.25rem)   | Page headings
4xl  = 36px (2.25rem)   | line-height: 40px (2.5rem)    | Hero headings
5xl  = 48px (3rem)      | line-height: 1                | Large hero
6xl  = 60px (3.75rem)   | line-height: 1                | XL hero
```

**Usage:**
```tsx
<h1 className="text-4xl font-bold">Hero Heading</h1>
<p className="text-base text-neutral-700">Body text paragraph</p>
<span className="text-sm text-neutral-500">Secondary info</span>
```

---

## 🎭 Border Radius

```css
--radius: 0.625rem (10px)            /* Base radius */
--radius-sm: calc(var(--radius) - 4px) = 6px
--radius-md: calc(var(--radius) - 2px) = 8px
--radius-lg: var(--radius) = 10px
--radius-xl: calc(var(--radius) + 4px) = 14px
```

**Usage:**
- `rounded-sm` - Small elements (chips, tags)
- `rounded-md` - Buttons, inputs
- `rounded-lg` - Cards, panels
- `rounded-xl` - Modals, large containers

---

## ☁️ Shadow Elevation System

Figma-inspired subtle shadows:

```css
shadow-xs  = 0 1px 2px 0 rgba(0, 0, 0, 0.05)
  ↳ Subtle lift (input fields)

shadow-sm  = 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)
  ↳ Slight elevation (buttons)

shadow-md  = 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
  ↳ Elevated (cards, dropdowns)

shadow-lg  = 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
  ↳ Floating (context menus)

shadow-xl  = 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
  ↳ Modal overlay

shadow-2xl = 0 25px 50px -12px rgba(0, 0, 0, 0.25)
  ↳ Maximum elevation
```

**Usage:**
```tsx
<div className="shadow-sm hover:shadow-md transition-shadow">
  Button with hover lift
</div>
```

---

## 🎬 Animation System

### Keyframes

```css
@keyframes fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slide-up {
  0%   { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
  0%   { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Animation Classes

```css
animate-fade-in    = fade-in 0.3s ease-out
animate-slide-up   = slide-up 0.4s ease-out
animate-slide-down = slide-down 0.4s ease-out
animate-shimmer    = shimmer 2s infinite (skeleton loading)
```

**Usage:**
```tsx
<div className="animate-fade-in">
  Fades in on mount
</div>

<div className="animate-slide-up delay-100">
  Slides up with 100ms delay
</div>
```

---

## 🔌 shadcn/ui Compatibility

CSS variables mapped for shadcn components:

```css
--color-background: var(--color-neutral-50)
--color-foreground: var(--color-neutral-900)
--color-primary: var(--color-primary-500)
--color-primary-foreground: var(--color-neutral-50)
--color-secondary: var(--color-neutral-200)
--color-muted: var(--color-neutral-200)
--color-muted-foreground: var(--color-neutral-500)
--color-destructive: var(--color-error-500)
--color-border: var(--color-neutral-200)
--color-input: var(--color-neutral-300)
--color-ring: var(--color-primary-500)
```

**Usage:**
All shadcn/ui components (Button, Dialog, Dropdown, etc.) automatically use these tokens.

---

## ✅ Verification Checklist

- [x] All brand colors defined (Sky Blue #0EA5E9)
- [x] Typography scale follows 4px grid
- [x] Shadow elevation system matches Figma
- [x] CSS variables work with shadcn/ui
- [x] Spacing system uses 4px base unit
- [x] Border radius system defined
- [x] Animation keyframes included
- [x] Canvas-specific colors defined
- [x] Semantic colors (success/error/warning) defined
- [x] Dark mode support included (future-ready)

---

## 🎯 Usage Examples

### Button Hierarchy

```tsx
{/* Primary action */}
<button className="bg-primary-500 text-white hover:bg-primary-600 px-4 py-2 rounded-md shadow-sm">
  Create Project
</button>

{/* Secondary action */}
<button className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300 px-4 py-2 rounded-md">
  Cancel
</button>

{/* Destructive action */}
<button className="bg-error-500 text-white hover:bg-error-600 px-4 py-2 rounded-md">
  Delete
</button>
```

### Card Component

```tsx
<div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold text-neutral-800 mb-2">
    Project Title
  </h3>
  <p className="text-base text-neutral-600">
    Project description with proper spacing and hierarchy.
  </p>
</div>
```

### Form Input

```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-neutral-300 rounded-md
             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
             text-base text-neutral-700 placeholder:text-neutral-400"
  placeholder="Enter project name"
/>
```

---

## 📚 References

- **Tailwind CSS:** v4.1.14 (with inline @theme)
- **Design System:** Figma-inspired minimalism
- **Color Philosophy:** 90% neutral grays, 10% functional color
- **Spacing:** 4px base unit for precise alignment
- **Shadows:** Subtle elevation (avoid heavy drop shadows)
- **Typography:** Inter font family, 4px grid-aligned sizes

---

## 🚀 Next Steps

1. ✅ Design tokens documented
2. 🔄 Create user flow diagrams (task 0.4.1)
3. 🔄 Create micro-animations catalog (task 0.4.2)
4. 🔄 Design error state catalog (task 0.4.3)
5. 🔄 Define loading patterns (task 0.4.4)
6. 🔄 Create empty state catalog (task 0.4.5)
