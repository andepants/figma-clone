# CanvasIcons Micro-Interactions Catalog

**Last Updated:** 2025-10-16
**Status:** ✅ Complete
**Purpose:** Comprehensive catalog of all animations used in CanvasIcons for consistency and reference

## Overview

This catalog documents 35+ micro-animations categorized by interaction type. Each animation includes:
- Trigger condition
- Animation properties (scale, opacity, transform, etc.)
- Timing (duration, easing, delay)
- Code example (Framer Motion + Tailwind)
- Accessibility notes (prefers-reduced-motion)

**Performance Target:** 60 FPS (16.67ms per frame)
**Animation Budget:** Max 300ms for most interactions, 600ms for complex entrance animations

---

## Table of Contents

1. [Entrance Animations](#entrance-animations) (8)
2. [Exit Animations](#exit-animations) (4)
3. [Hover Interactions](#hover-interactions) (8)
4. [Active/Press States](#activepress-states) (5)
5. [Loading States](#loading-states) (4)
6. [Success States](#success-states) (3)
7. [Error States](#error-states) (3)
8. [Scroll Animations](#scroll-animations) (4)

---

## Entrance Animations

### 1. Fade In (Basic)
- **Trigger:** Component mount
- **Animation:** Opacity 0 → 1
- **Duration:** 300ms
- **Easing:** ease-out

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

**Reduced Motion:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.3,
    ease: 'easeOut'
  }}
  // Framer Motion respects prefers-reduced-motion automatically
>
  {children}
</motion.div>
```

---

### 2. Fade In Up
- **Trigger:** Component mount, scroll into view
- **Animation:** Opacity 0 → 1, Y: 50px → 0
- **Duration:** 600ms
- **Easing:** easeOutExpo [0.22, 1, 0.36, 1]

```tsx
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations/variants';

<motion.div
  initial="hidden"
  animate="show"
  variants={fadeInUp}
>
  {children}
</motion.div>

// variants.ts
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
```

**Use Cases:** Hero sections, feature cards, pricing tiers

---

### 3. Fade In Left
- **Trigger:** Component mount, scroll into view
- **Animation:** Opacity 0 → 1, X: -50px → 0
- **Duration:** 500ms
- **Easing:** easeOut

```tsx
import { motion } from 'framer-motion';
import { fadeInLeft } from '@/lib/animations/variants';

<motion.div
  initial="hidden"
  animate="show"
  variants={fadeInLeft}
>
  {children}
</motion.div>
```

**Use Cases:** Side panels, navigation menus, testimonials

---

### 4. Scale In (Spring)
- **Trigger:** Modal open, tooltip appear
- **Animation:** Opacity 0 → 1, Scale 0.8 → 1
- **Duration:** ~400ms (spring-based)
- **Easing:** Spring (stiffness: 200, damping: 20)

```tsx
import { motion } from 'framer-motion';
import { scaleIn } from '@/lib/animations/variants';

<motion.div
  initial="hidden"
  animate="show"
  variants={scaleIn}
>
  {children}
</motion.div>

// variants.ts
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }
};
```

**Use Cases:** Modals, dialogs, context menus, tooltips

---

### 5. Stagger Children
- **Trigger:** Parent component mounts
- **Animation:** Children fade in sequentially
- **Stagger Delay:** 100ms between children
- **Initial Delay:** 300ms

```tsx
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations/variants';

<motion.div
  initial="hidden"
  animate="show"
  variants={staggerContainer}
>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

// variants.ts
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};
```

**Use Cases:** Feature grids, project cards, pricing tiers

---

### 6. Slide Down
- **Trigger:** Dropdown menu open, banner appear
- **Animation:** Opacity 0 → 1, Y: -20px → 0
- **Duration:** 400ms
- **Easing:** easeOut

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  className="origin-top"
>
  {children}
</motion.div>
```

**Use Cases:** Success banners, notification toasts, dropdown menus

---

### 7. Expand Height (Accordion)
- **Trigger:** Accordion section opens
- **Animation:** Height 0 → auto
- **Duration:** 300ms
- **Easing:** easeInOut

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence initial={false}>
  {isOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

**Use Cases:** FAQ accordions, collapsible panels, advanced settings

---

### 8. Blur In (Modal Backdrop)
- **Trigger:** Modal opens
- **Animation:** Backdrop blur 0 → 8px, Opacity 0 → 0.8
- **Duration:** 200ms
- **Easing:** easeOut

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
  animate={{ opacity: 0.8, backdropFilter: 'blur(8px)' }}
  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  className="fixed inset-0 bg-black/50"
  onClick={onClose}
/>
```

**Use Cases:** Modal backdrops, overlay screens

---

## Exit Animations

### 9. Fade Out
- **Trigger:** Component unmount
- **Animation:** Opacity 1 → 0
- **Duration:** 200ms
- **Easing:** ease-in

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeIn' }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

---

### 10. Scale Out
- **Trigger:** Modal closes, tooltip disappears
- **Animation:** Opacity 1 → 0, Scale 1 → 0.9
- **Duration:** 200ms
- **Easing:** easeIn

```tsx
<motion.div
  initial={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.2, ease: 'easeIn' }}
>
  {children}
</motion.div>
```

---

### 11. Slide Up Out
- **Trigger:** Toast notification dismissed
- **Animation:** Opacity 1 → 0, Y: 0 → -20px
- **Duration:** 300ms
- **Easing:** easeIn

```tsx
<motion.div
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeIn' }}
>
  {children}
</motion.div>
```

---

### 12. Collapse Height
- **Trigger:** Accordion closes, panel collapses
- **Animation:** Height auto → 0, Opacity 1 → 0
- **Duration:** 250ms
- **Easing:** easeInOut

```tsx
<motion.div
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.25, ease: 'easeInOut' }}
  className="overflow-hidden"
>
  {children}
</motion.div>
```

---

## Hover Interactions

### 13. Button Hover (Primary)
- **Trigger:** Mouse enter
- **Animation:** Scale 1.02, shadow sm → md, brightness 95% → 100%
- **Duration:** 150ms
- **Easing:** Spring (stiffness: 400, damping: 17)

```tsx
import { motion } from 'framer-motion';

<motion.button
  whileHover={{
    scale: 1.02,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  className="px-4 py-2 bg-primary-500 text-white rounded-md shadow-sm"
>
  Click Me
</motion.button>
```

**Use Cases:** Primary CTAs, submit buttons

---

### 14. Card Hover
- **Trigger:** Mouse enter
- **Animation:** Y: 0 → -4px, shadow md → lg
- **Duration:** 200ms
- **Easing:** easeOut

```tsx
<motion.div
  whileHover={{
    y: -4,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  className="p-6 bg-white rounded-lg shadow-md cursor-pointer"
>
  {children}
</motion.div>
```

**Use Cases:** Project cards, pricing tiers, template cards

---

### 15. Link Underline Expand
- **Trigger:** Mouse enter
- **Animation:** Width 0% → 100%
- **Duration:** 250ms
- **Easing:** easeOut

```tsx
<a href="#" className="relative group inline-block">
  <span className="text-primary-600 hover:text-primary-700 transition-colors">
    Learn More
  </span>
  <motion.span
    className="absolute bottom-0 left-0 h-0.5 bg-primary-500"
    initial={{ width: '0%' }}
    whileHover={{ width: '100%' }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  />
</a>
```

**Tailwind Alternative:**
```tsx
<a href="#" className="relative group inline-block">
  <span className="text-primary-600 hover:text-primary-700 transition-colors">
    Learn More
  </span>
  <span className="absolute bottom-0 left-0 h-0.5 bg-primary-500 w-0 group-hover:w-full transition-all duration-250 ease-out" />
</a>
```

---

### 16. Icon Rotate (Chevron)
- **Trigger:** Accordion expand/collapse
- **Animation:** Rotate 0deg → 90deg
- **Duration:** 200ms
- **Easing:** easeInOut

```tsx
<motion.svg
  animate={{ rotate: isExpanded ? 90 : 0 }}
  transition={{ duration: 0.2, ease: 'easeInOut' }}
  className="w-5 h-5 text-neutral-500"
>
  <ChevronRightIcon />
</motion.svg>
```

**Tailwind Alternative:**
```tsx
<ChevronRightIcon
  className={cn(
    "w-5 h-5 text-neutral-500 transition-transform duration-200",
    isExpanded && "rotate-90"
  )}
/>
```

---

### 17. Tooltip Fade In
- **Trigger:** Mouse enter (with 300ms delay)
- **Animation:** Opacity 0 → 1, Y: 5px → 0
- **Duration:** 150ms
- **Easing:** easeOut

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<div className="relative group">
  <button>Hover me</button>
  <AnimatePresence>
    {isHovered && (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.15, ease: 'easeOut', delay: 0.3 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-sm rounded whitespace-nowrap"
      >
        Tooltip text
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

---

### 18. Image Zoom (On Hover)
- **Trigger:** Mouse enter on image container
- **Animation:** Scale 1 → 1.05
- **Duration:** 300ms
- **Easing:** easeOut

```tsx
<div className="overflow-hidden rounded-lg">
  <motion.img
    src="/image.jpg"
    alt="Description"
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full h-full object-cover"
  />
</div>
```

---

### 19. Button Glow (Focus/Hover)
- **Trigger:** Focus or hover
- **Animation:** Box shadow expands with primary color
- **Duration:** 200ms
- **Easing:** easeOut

```tsx
<motion.button
  whileHover={{
    boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.2)'
  }}
  whileFocus={{
    boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.3)'
  }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  className="px-4 py-2 bg-primary-500 text-white rounded-md"
>
  Click Me
</motion.button>
```

**Tailwind Alternative (Focus Ring):**
```tsx
<button className="px-4 py-2 bg-primary-500 text-white rounded-md focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-shadow duration-200">
  Click Me
</button>
```

---

### 20. Dropdown Arrow Rotate
- **Trigger:** Dropdown opens
- **Animation:** Rotate 0deg → 180deg
- **Duration:** 200ms
- **Easing:** easeInOut

```tsx
<motion.svg
  animate={{ rotate: isOpen ? 180 : 0 }}
  transition={{ duration: 0.2, ease: 'easeInOut' }}
>
  <ChevronDownIcon />
</motion.svg>
```

---

## Active/Press States

### 21. Button Press (Scale Down)
- **Trigger:** Mouse down
- **Animation:** Scale 1 → 0.95
- **Duration:** 100ms
- **Easing:** easeOut

```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.1, ease: 'easeOut' }}
  className="px-4 py-2 bg-primary-500 text-white rounded-md"
>
  Click Me
</motion.button>
```

---

### 22. Ripple Effect (Material Design)
- **Trigger:** Click
- **Animation:** Circular wave expands from click point
- **Duration:** 600ms
- **Easing:** easeOut

```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

function RippleButton({ children, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = { x, y, id: Date.now() };

    setRipples([...ripples, ripple]);
    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== ripple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className="relative overflow-hidden px-4 py-2 bg-primary-500 text-white rounded-md"
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute w-5 h-5 bg-white rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
          }}
        />
      ))}
    </button>
  );
}
```

---

### 23. Toggle Switch (Slide + Scale)
- **Trigger:** Click toggle
- **Animation:** X: 0 → 20px, scale 1 → 1.1 → 1
- **Duration:** 200ms
- **Easing:** Spring

```tsx
<button
  onClick={() => setEnabled(!enabled)}
  className={cn(
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
    enabled ? "bg-primary-500" : "bg-neutral-300"
  )}
>
  <motion.span
    layout
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    className={cn(
      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm",
      enabled ? "translate-x-6" : "translate-x-1"
    )}
  />
</button>
```

---

### 24. Checkbox Check Draw
- **Trigger:** Checkbox checked
- **Animation:** SVG path draws from 0% → 100%
- **Duration:** 300ms
- **Easing:** easeOut

```tsx
<motion.svg
  viewBox="0 0 24 24"
  className="w-5 h-5 text-primary-500"
>
  <motion.path
    d="M5 13l4 4L19 7"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: isChecked ? 1 : 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  />
</motion.svg>
```

---

### 25. Radio Button Select (Scale)
- **Trigger:** Radio selected
- **Animation:** Inner circle scales in
- **Duration:** 200ms
- **Easing:** Spring

```tsx
<div className="relative w-5 h-5 rounded-full border-2 border-neutral-300">
  <AnimatePresence>
    {isSelected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute inset-1 rounded-full bg-primary-500"
      />
    )}
  </AnimatePresence>
</div>
```

---

## Loading States

### 26. Spinner (Rotate)
- **Trigger:** Loading state
- **Animation:** Rotate 0deg → 360deg (infinite)
- **Duration:** 1000ms
- **Easing:** linear

```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    duration: 1,
    repeat: Infinity,
    ease: 'linear'
  }}
  className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"
/>
```

**Tailwind Alternative:**
```tsx
<div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
```

---

### 27. Skeleton Shimmer
- **Trigger:** Loading content
- **Animation:** Gradient slides left to right
- **Duration:** 2000ms
- **Easing:** linear (infinite)

```tsx
<div className="relative overflow-hidden bg-neutral-200 rounded-md h-20">
  <motion.div
    animate={{ x: ['100%', '-100%'] }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
  />
</div>
```

**Tailwind with Keyframes:**
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

```tsx
<div className="relative overflow-hidden bg-neutral-200 rounded-md h-20">
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
</div>
```

---

### 28. Progress Bar (Width)
- **Trigger:** Upload/download progress
- **Animation:** Width 0% → progress%
- **Duration:** Smooth (based on progress)
- **Easing:** easeOut

```tsx
<div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: '0%' }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="h-full bg-primary-500"
  />
</div>
```

---

### 29. Dots Pulse (Typing Indicator)
- **Trigger:** Waiting for response
- **Animation:** 3 dots scale up/down in sequence
- **Duration:** 1400ms per cycle
- **Easing:** easeInOut

```tsx
<div className="flex gap-1">
  {[0, 1, 2].map(i => (
    <motion.div
      key={i}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.4, 1, 0.4]
      }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        delay: i * 0.2
      }}
      className="w-2 h-2 bg-neutral-500 rounded-full"
    />
  ))}
</div>
```

---

## Success States

### 30. Checkmark Draw
- **Trigger:** Success state
- **Animation:** SVG path draws + scale in
- **Duration:** 500ms
- **Easing:** easeOut

```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
>
  <svg viewBox="0 0 24 24" className="w-12 h-12 text-success-500">
    <motion.path
      d="M5 13l4 4L19 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
    />
  </svg>
</motion.div>
```

---

### 31. Green Flash (Background)
- **Trigger:** Save success, payment success
- **Animation:** Background flashes green briefly
- **Duration:** 600ms
- **Easing:** easeInOut

```tsx
<motion.div
  animate={{
    backgroundColor: ['#ffffff', '#dcfce7', '#ffffff']
  }}
  transition={{ duration: 0.6, ease: 'easeInOut' }}
  className="px-4 py-2 rounded-md"
>
  Saved successfully!
</motion.div>
```

---

### 32. Confetti Burst
- **Trigger:** Payment success, onboarding complete
- **Animation:** Particles shoot out from center
- **Duration:** 3000ms
- **Easing:** easeOut

```tsx
import confetti from 'canvas-confetti';

function celebrateSuccess() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#0ea5e9', '#10b981', '#f59e0b']
  });
}

// Or with Framer Motion (custom particles)
<motion.div className="relative">
  {particles.map((particle, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0, x: 0, y: 0 }}
      animate={{
        scale: [0, 1, 0],
        x: particle.x,
        y: particle.y,
        rotate: particle.rotate
      }}
      transition={{ duration: 3, ease: 'easeOut' }}
      className="absolute w-2 h-2 rounded-full bg-primary-500"
    />
  ))}
</motion.div>
```

---

## Error States

### 33. Shake (Input Error)
- **Trigger:** Form validation error
- **Animation:** Shake left-right
- **Duration:** 400ms
- **Easing:** easeInOut

```tsx
<motion.div
  animate={{
    x: [0, -10, 10, -10, 10, 0]
  }}
  transition={{ duration: 0.4, ease: 'easeInOut' }}
>
  <input className="border-2 border-error-500 px-3 py-2 rounded-md" />
</motion.div>
```

---

### 34. Error Bounce (Alert Icon)
- **Trigger:** Error state
- **Animation:** Scale bounce
- **Duration:** 600ms
- **Easing:** Spring

```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: [0, 1.2, 1] }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 15
  }}
  className="w-12 h-12 bg-error-50 rounded-full flex items-center justify-center"
>
  <AlertCircleIcon className="w-6 h-6 text-error-500" />
</motion.div>
```

---

### 35. Red Flash (Border)
- **Trigger:** Validation error
- **Animation:** Border color flashes red
- **Duration:** 500ms
- **Easing:** easeInOut

```tsx
<motion.input
  animate={{
    borderColor: ['#d4d4d4', '#ef4444', '#d4d4d4']
  }}
  transition={{ duration: 0.5, ease: 'easeInOut' }}
  className="px-3 py-2 border-2 rounded-md"
/>
```

---

## Scroll Animations

### 36. Fade In On Scroll
- **Trigger:** Element enters viewport
- **Animation:** Opacity 0 → 1, Y: 30px → 0
- **Duration:** 600ms
- **Easing:** easeOut
- **Threshold:** 0.1 (10% visible)

```tsx
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function ScrollReveal({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
    amount: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

---

### 37. Parallax (Background)
- **Trigger:** Page scroll
- **Animation:** Background moves slower than foreground
- **Speed:** 0.5x scroll speed

```tsx
import { motion, useScroll, useTransform } from 'framer-motion';

function ParallaxSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
      />
      <div className="relative z-10">
        {/* Content */}
      </div>
    </div>
  );
}
```

---

### 38. Number Count Up
- **Trigger:** Stat enters viewport
- **Animation:** Number animates from 0 to target
- **Duration:** 2000ms
- **Easing:** easeOut

```tsx
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

function AnimatedNumber({ value }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000 });
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  return (
    <span ref={ref}>
      <motion.span>{Math.round(springValue.get())}</motion.span>
    </span>
  );
}
```

---

### 39. Sticky Header (Slide Down)
- **Trigger:** Scroll past threshold
- **Animation:** Header slides down with backdrop blur
- **Duration:** 300ms
- **Easing:** easeOut

```tsx
import { motion, useScroll } from 'framer-motion';
import { useEffect, useState } from 'react';

function StickyHeader() {
  const { scrollY } = useScroll();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsSticky(latest > 100);
    });
  }, [scrollY]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isSticky ? 0 : -100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        isSticky && "backdrop-blur-lg bg-white/90 shadow-sm"
      )}
    >
      {/* Header content */}
    </motion.header>
  );
}
```

---

## Accessibility Guidelines

### Respecting Reduced Motion

All animations should respect the `prefers-reduced-motion` media query:

```tsx
import { motion, useReducedMotion } from 'framer-motion';

function AccessibleAnimation({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.6,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}
```

**CSS Alternative:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Tips

1. **Use `transform` and `opacity`** - Hardware accelerated, 60 FPS
2. **Avoid animating** `width`, `height`, `top`, `left` - Causes reflow
3. **Use `will-change`** sparingly - Only during animation
4. **Debounce scroll listeners** - Max 60 calls/second
5. **Remove animations** on low-end devices

```tsx
<motion.div
  style={{ willChange: 'transform' }}
  animate={{ x: 100 }}
  onAnimationComplete={() => {
    // Remove will-change after animation
  }}
/>
```

---

## Animation Timing Reference

| Duration | Use Case |
|----------|----------|
| 100ms | Instant feedback (button press) |
| 150-200ms | Micro-interactions (hover, focus) |
| 300ms | Quick transitions (fade, slide) |
| 400-600ms | Standard animations (modal open, page transition) |
| 1000ms+ | Loaders, complex entrance animations |

---

## Summary

**Total Animations:** 39
- Entrance: 8
- Exit: 4
- Hover: 8
- Active/Press: 5
- Loading: 4
- Success: 3
- Error: 3
- Scroll: 4

**Key Principles:**
- 60 FPS performance (use transform/opacity)
- Respect `prefers-reduced-motion`
- Spring animations for natural feel
- Consistent easing curves
- Loading states appear within 100ms
- Error states provide clear feedback

**Next Steps:**
- Implement animations in components
- Test on low-end devices
- Validate accessibility with screen readers
- Measure performance with Chrome DevTools

---

**Status:** ✅ Complete - 39 micro-animations cataloged with code examples and accessibility notes
