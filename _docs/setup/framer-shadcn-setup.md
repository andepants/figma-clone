# Framer Motion & shadcn/ui Setup Guide

**Date:** 2025-10-16
**Status:** ✅ Complete
**Purpose:** Animation and UI component library setup for premium features

---

## Installed Packages

### Framer Motion (v12.23.24)
```bash
npm install framer-motion
```
- **Purpose:** Advanced animations, page transitions, scroll effects
- **Size:** ~150KB
- **Docs:** https://www.framer.com/motion/

### Animation Helpers
```bash
npm install react-intersection-observer react-type-animation react-countup
```

1. **react-intersection-observer** (v9.16.0)
   - Purpose: Scroll-triggered animations
   - Detects when elements enter viewport
   - Used in `useScrollReveal` hook

2. **react-type-animation** (v3.2.0)
   - Purpose: Typing effect animations
   - For hero sections, code demos

3. **react-countup** (v6.5.3)
   - Purpose: Animated number counting
   - For stats, metrics, pricing

---

## shadcn/ui Configuration

### Already Configured ✅
**Config File:** `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Pre-installed Radix Components
- `@radix-ui/react-checkbox`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-tooltip`

### Add More Components
```bash
# Example: Add button, card, input components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add accordion
```

---

## Animation Utilities Created

### 1. Variants (`src/lib/animations/variants.ts`)

**Purpose:** Reusable animation configurations

**Available Variants:**
- `fadeInUp` - Fade in from below (scroll reveals)
- `fadeInLeft` - Fade in from left (sidebar entries)
- `fadeInRight` - Fade in from right (modals, notifications)
- `staggerContainer` - Stagger children animations
- `scaleIn` - Scale in with spring (dialogs, popovers)
- `slideDown` - Slide down from top (dropdowns)
- `slideUp` - Slide up from bottom (bottom sheets)
- `fade` - Simple fade (overlays, backdrops)
- `expandWidth` - Expand width (progress bars)
- `collapseWidth` - Collapse width (progress exit)

**Usage Example:**
```tsx
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

function MyComponent() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp}
    >
      Content fades in from below
    </motion.div>
  );
}
```

### 2. Transitions (`src/lib/animations/transitions.ts`)

**Purpose:** Timing and easing presets

**Available Transitions:**
- `spring` - Bouncy spring (buttons, cards)
- `softSpring` - Gentle spring (modals)
- `smooth` - No bounce (opacity, colors)
- `fast` - Quick feedback (hover states)
- `slow` - Page transitions
- `bouncySpring` - Pronounced bounce

**Easing Curves:**
- `easeOutExpo` - [0.22, 1, 0.36, 1] (Figma-style)
- `easeInOutCubic` - [0.65, 0, 0.35, 1]
- `easeOutCubic` - [0.33, 1, 0.68, 1]

**Usage Example:**
```tsx
import { motion } from 'framer-motion';
import { spring, easeOutExpo } from '@/lib/animations';

function MyButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
    >
      Click me
    </motion.button>
  );
}
```

### 3. useScrollReveal Hook (`src/hooks/useScrollReveal.ts`)

**Purpose:** Trigger animations on scroll

**Features:**
- Intersection Observer for performance
- Configurable threshold and root margin
- Trigger once or repeating
- Returns ref, controls, and inView state

**Usage Example:**
```tsx
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { fadeInUp } from '@/lib/animations';

function ScrollRevealSection() {
  const { ref, controls } = useScrollReveal({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-100px 0px'
  });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={fadeInUp}
    >
      <h2>This section animates when scrolled into view</h2>
    </motion.section>
  );
}
```

---

## Common Animation Patterns

### 1. Button Hover/Tap
```tsx
<motion.button
  whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Hover me
</motion.button>
```

### 2. Modal Entry
```tsx
import { scaleIn, fade } from '@/lib/animations';

function Modal({ isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="fixed inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="fixed inset-0 flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-lg">
              Modal content
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 3. Staggered List
```tsx
import { staggerContainer, fadeInUp } from '@/lib/animations';

function StaggeredList({ items }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.li
          key={item.id}
          variants={fadeInUp}
        >
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 4. Page Transitions
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          {/* Your routes */}
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
```

### 5. Scroll Progress Bar
```tsx
import { motion, useScroll } from 'framer-motion';

function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
```

---

## Performance Best Practices

### 1. Use GPU-Accelerated Properties
```tsx
// ✅ Good (GPU-accelerated)
<motion.div
  animate={{ x: 100, y: 100, scale: 1.2, opacity: 0.5 }}
/>

// ❌ Bad (causes layout recalc)
<motion.div
  animate={{ width: 200, height: 200, top: 100 }}
/>
```

**GPU-Accelerated:**
- `x`, `y` (transform: translate)
- `scale`, `scaleX`, `scaleY`
- `rotate`, `rotateX`, `rotateY`, `rotateZ`
- `opacity`

### 2. Use `will-change` Sparingly
```tsx
// Only when necessary for complex animations
<motion.div
  style={{ willChange: 'transform' }}
  animate={{ x: [0, 100, 0] }}
  transition={{ repeat: Infinity }}
/>
```

### 3. Reduce Motion for Accessibility
```tsx
import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ x: shouldReduceMotion ? 0 : 100 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    >
      Respects user's motion preferences
    </motion.div>
  );
}
```

### 4. Layout Animations
```tsx
// For smooth layout changes
<motion.div
  layout
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  Content that changes size/position
</motion.div>
```

---

## Tailwind v4 Compatibility

### CSS Variables (Already Configured)
Framer Motion works seamlessly with Tailwind v4 CSS variables:

```tsx
<motion.div
  animate={{
    backgroundColor: 'var(--color-primary-500)',
    color: 'var(--color-neutral-50)'
  }}
/>
```

### Utility Class Animations
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="bg-primary-500 text-neutral-50 rounded-lg shadow-lg"
/>
```

---

## Testing Animations

### 1. Visual Test
```tsx
// Create test page at src/pages/AnimationTest.tsx
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn, staggerContainer } from '@/lib/animations';

export default function AnimationTest() {
  return (
    <div className="p-8 space-y-8">
      <motion.h1 variants={fadeInUp} initial="hidden" animate="show">
        Animation Test Page
      </motion.h1>

      <motion.div variants={scaleIn} initial="hidden" animate="show">
        <div className="p-4 bg-blue-500 text-white rounded">
          Scale In Test
        </div>
      </motion.div>

      <motion.ul variants={staggerContainer} initial="hidden" animate="show">
        {[1, 2, 3].map((i) => (
          <motion.li key={i} variants={fadeInUp} className="p-2">
            Stagger Item {i}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
```

### 2. Performance Test
```bash
# Run with React DevTools Profiler
npm run dev

# Check:
# - Animation runs at 60 FPS
# - No layout thrashing
# - GPU acceleration active (check Layers in Chrome DevTools)
```

---

## Next Steps

### Phase 0.3: Design System & Tokens
- ✅ Tailwind config already has brand colors
- ✅ CSS variables already configured
- Ready for Phase 1: Landing page implementation

### Phase 1: Premium Landing Page
Use these animations:
- Hero section: `fadeInUp` + scroll reveal
- Features: `staggerContainer` with `fadeInUp` children
- CTAs: Button hover/tap animations
- Page transition: Smooth fade on route change

---

## Troubleshooting

### Issue: Animation not working
**Solution:**
```tsx
// Ensure initial and animate match variant keys
<motion.div
  variants={fadeInUp}
  initial="hidden"  // Must match variant key
  animate="show"    // Must match variant key
/>
```

### Issue: Layout shift during animation
**Solution:**
```tsx
// Reserve space with min-height
<motion.div
  className="min-h-[200px]"
  variants={fadeInUp}
  initial="hidden"
  animate="show"
/>
```

### Issue: AnimatePresence not working
**Solution:**
```tsx
// Ensure unique keys
<AnimatePresence mode="wait">
  <motion.div key={uniqueKey}> {/* Key is required */}
    Content
  </motion.div>
</AnimatePresence>
```

---

## Conclusion

✅ **Animation system ready for premium implementation**

**Installed:**
- Framer Motion v12.23.24
- react-intersection-observer v9.16.0
- react-type-animation v3.2.0
- react-countup v6.5.3

**Created:**
- 10 reusable animation variants
- 6 transition presets
- 3 easing curves
- useScrollReveal hook with Intersection Observer

**Compatible with:**
- Tailwind v4 CSS variables ✅
- shadcn/ui components ✅
- React 19 ✅
- TypeScript 5.9.3 ✅

**Performance:**
- GPU-accelerated transforms ✅
- Accessibility (reduced motion) ✅
- 60 FPS target ✅
- Lightweight (~150KB) ✅
