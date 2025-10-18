# CanvasIcons - Stripe Payment & Premium Landing Page Implementation

**Project:** CanvasIcons
**Domain:** canvasicons.com
**Branding:** Professional, minimal, Figma-inspired design system
**Estimated Time:** 45-50 hours (premium animations + robust testing)
**Dependencies:** Firebase Auth, Firestore, RTDB, Stripe, Framer Motion, shadcn/ui, Radix UI, Playwright
**Last Updated:** 2025-10-16

---

## 🎨 Brand Identity

**CanvasIcons** - The professional icon design tool for app developers

**Tagline Options:**
- Primary: "Professional App Icons. Zero Design Skills Required."
- Alternative: "Design App Icons That Convert Downloads"
- Short: "App Icons Made Simple"

**Value Proposition:**
Create App Store-ready icons and graphics in minutes with real-time collaboration, professional templates, and export-ready files.

**Brand Colors:**
- Primary: `#0EA5E9` (Sky Blue 500) - Actions, CTAs, highlights
- Secondary: `#64748B` (Slate 500) - Text, borders
- Accent: `#10B981` (Emerald 500) - Success states
- Neutral: `#F5F5F5` (Gray 100) - Backgrounds
- Dark: `#1E293B` (Slate 800) - Headings

---

## 🎯 Core UX Principles (2025 Best Practices)

### 1. Micro-Animations & Motion Design
- **Scroll-triggered reveals** - Elements fade in as they enter viewport
- **Hover micro-interactions** - Subtle scale, shadow, color transitions
- **Page transitions** - Smooth fade/slide between routes
- **Button states** - Press animation (scale down), success ripple effect
- **Loading states** - Skeleton screens with shimmer effect
- **Principle:** Motion guides attention, provides feedback, delights users

### 2. Progressive Disclosure
- Reveal complexity gradually (3-5 steps max per flow)
- Collapsible sections for advanced options
- FAQ accordion (one open at a time)
- Export modal: Basic options visible, advanced in expandable section

### 3. Visual Hierarchy (Figma-Style)
- **Typography scale:** 4xl/3xl (hero) → 2xl/xl (sections) → base (body) → sm (labels)
- **Color hierarchy:** Primary (blue) for actions, Gray for secondary, Red for destructive
- **Shadow elevation:** Flat (0) → Subtle (sm) → Lifted (md) → Floating (lg) → Modal (xl)
- **Spacing system:** 4px base unit (0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64)

### 4. Immediate Feedback (<100ms)
- Button loading states appear instantly
- Form validation in real-time (as user types)
- Optimistic UI updates (show immediately, rollback on error)
- Hover states respond within single frame (16ms)

### 5. Error Resilience
- Specific messages ("Card declined" not "Payment failed")
- Inline errors near problem field
- Don't clear form on error
- Recovery path always visible ("Try different card", "Contact support")

### 6. Accessibility First (WCAG 2.1 AA)
- 4.5:1 color contrast minimum
- Keyboard navigation for all interactive elements
- Focus indicators (2px ring)
- Screen reader announcements for state changes
- Skip links, semantic HTML, ARIA labels

---

## 📊 Progress Tracker

**Overall Progress:** 0/105 tasks completed (0%)

**Phase Completion:**
- [ ] Phase 0: Research, UX Design & Animation System (0/18)
- [ ] Phase 1: Premium Landing Page with Framer Motion (0/16)
- [ ] Phase 2: Pricing Page with Interactive Animations (0/13)
- [ ] Phase 3: Projects Dashboard (0/15)
- [ ] Phase 4: Database & Types Setup (0/9)
- [ ] Phase 5: Stripe Integration with Error Handling (0/14)
- [ ] Phase 6: Access Control (0/10)
- [ ] Phase 7: Public/Private Projects (0/8)
- [ ] Phase 8: Canvas Isolation (0/6)
- [ ] Phase 9: E2E Testing with Playwright (0/10)
- [ ] Final: Performance, Accessibility & Polish (0/8)

---

## Legend

- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Completed and verified
- `[!]` = Blocked
- `[P]` = Has Playwright E2E test
- `[A]` = Has animation/micro-interaction
- `[C7]` = Use Context7 for up-to-date docs
- **UX Principle:** Which design principle applies
- **Animation:** Micro-interaction details
- **Success Criteria:** How to verify completion
- **Puppeteer Test:** E2E test scenario

---

## 🎬 Animation Principles (2025 Web Design Trends)

Based on research of best 2025 websites:

### Scroll-Triggered Animations
```typescript
// Using Framer Motion
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
  {content}
</motion.div>
```

### Stagger Children
```typescript
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
>
  {children.map(child => (
    <motion.div
      key={child.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {child}
    </motion.div>
  ))}
</motion.div>
```

### Button Micro-Interactions
```typescript
<motion.button
  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Get Started
</motion.button>
```

### Page Transitions
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

---

# Phase 0: Research, UX Design & Animation System (6-8 hours)

**Goal:** Document patterns, design flows, create animation catalog, set up design tokens

**Phase Success Criteria:**
- [ ] All existing patterns documented
- [ ] 5 user flow diagrams completed
- [ ] 30+ micro-animations cataloged
- [ ] Design tokens (colors, spacing, typography) defined
- [ ] Framer Motion + shadcn setup guide created
- [ ] Error catalog with 25+ scenarios
- [ ] Accessibility checklist (WCAG 2.1 AA)

---

## 0.1 Research Existing Codebase

### 0.1.1 Document Current Tech Stack
- [ ] **Action:** Audit existing libraries and prepare for upgrades
  - **Why:** Need to integrate Framer Motion, shadcn, Radix without conflicts
  - **Files to Review:**
    - `package.json`
    - `tailwind.config.js`
    - `tsconfig.json`
  - **Success Criteria:**
    - [ ] List all current dependencies
    - [ ] Identify potential conflicts
    - [ ] Note Tailwind CSS version (need v3.4+)
    - [ ] Confirm TypeScript 5.0+
  - **Deliverable:** `_docs/research/tech-stack-audit.md`
  - **Last Verified:**

### 0.1.2 Review Current Auth & Database
- [ ] **Action:** Document Firebase patterns for subscription logic
  - **Why:** Integration point for Stripe subscriptions
  - **Files to Review:**
    - `src/lib/firebase/*`
    - `src/stores/authStore.ts`
  - **Success Criteria:**
    - [ ] Auth flow documented (sign up, sign in, sign out)
    - [ ] Database structure mapped (RTDB + Firestore)
    - [ ] Identify where to add subscription data
  - **Deliverable:** `_docs/research/firebase-architecture.md`
  - **Last Verified:**

## 0.2 [C7] Install & Configure Animation Libraries

### 0.2.1 [C7] Install Framer Motion & shadcn/ui
- [ ] **Action:** Install and configure motion + UI libraries
  - **Why:** Foundation for all animations and premium UI
  - **Context7:** Lookup latest Framer Motion docs
  - **Dependencies:**
```bash
# Framer Motion
npm install framer-motion

# shadcn/ui prerequisites
npm install -D tailwindcss@latest autoprefixer@latest postcss@latest
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# shadcn CLI
npx shadcn@latest init
```
  - **Configuration:**
```typescript
// components.json (shadcn config)
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```
  - **Success Criteria:**
    - [ ] Framer Motion installed (v11+)
    - [ ] shadcn/ui configured
    - [ ] Can import Radix components
    - [ ] Tailwind CSS variables set up
  - **Tests:**
    1. Import `motion` from framer-motion → No errors
    2. Run `npx shadcn@latest add button` → Button component generated
    3. Import Button component → Renders correctly
  - **Deliverable:** `_docs/setup/framer-shadcn-setup.md`
  - **Last Verified:**

### 0.2.2 [C7] Create Animation Utilities
- [ ] **Action:** Create reusable animation variants and hooks
  - **Why:** DRY principle for consistent animations
  - **Context7:** Look up Framer Motion variant patterns
  - **Files Modified:**
    - Create: `src/lib/animations/variants.ts`
    - Create: `src/lib/animations/transitions.ts`
    - Create: `src/hooks/useScrollReveal.ts`
  - **Implementation:**
```typescript
// src/lib/animations/variants.ts
import { Variants } from 'framer-motion';

/** Fade in from below on scroll */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // Custom easing (easeOutExpo)
    }
  }
};

/** Fade in from left */
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

/** Stagger children animation */
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

/** Scale in with spring */
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

// src/lib/animations/transitions.ts
export const spring = {
  type: 'spring',
  stiffness: 400,
  damping: 30
};

export const smooth = {
  duration: 0.3,
  ease: 'easeInOut'
};

export const easeOutExpo = [0.22, 1, 0.36, 1];

// src/hooks/useScrollReveal.ts
import { useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useInView } from 'framer-motion';

export function useScrollReveal() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    margin: '-100px 0px'
  });

  useEffect(() => {
    if (inView) {
      controls.start('show');
    }
  }, [controls, inView]);

  return { ref, controls };
}
```
  - **Success Criteria:**
    - [ ] All variant patterns exported
    - [ ] Easing curves match Figma-quality motion
    - [ ] useScrollReveal hook works
  - **Tests:**
    1. Import fadeInUp variant → No errors
    2. Apply to motion.div → Animates on scroll
  - **Last Verified:**

## 0.3 Design System & Tokens

### 0.3.1 Define Design Tokens
- [ ] **Action:** Create comprehensive design token system
  - **Why:** Consistency across all components
  - **UX Principle:** Visual hierarchy through systematic design
  - **Files Modified:**
    - Update: `tailwind.config.ts`
    - Create: `src/styles/tokens.css`
  - **Implementation:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // CanvasIcons Brand Colors
        brand: {
          primary: '#0EA5E9',    // Sky 500
          secondary: '#64748B',   // Slate 500
          accent: '#10B981',      // Emerald 500
          dark: '#1E293B',        // Slate 800
        },
        // shadcn/ui colors (CSS variables)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        // ... rest of shadcn colors
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        // Precise scale for hierarchy
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      },
      spacing: {
        // 4px base unit
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      boxShadow: {
        // Elevation system
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;
```

```css
/* src/styles/tokens.css */
@layer base {
  :root {
    /* CanvasIcons Brand */
    --brand-primary: 14 165 233;    /* Sky 500 */
    --brand-secondary: 100 116 139; /* Slate 500 */
    --brand-accent: 16 185 129;     /* Emerald 500 */

    /* shadcn/ui Light Mode */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 199 89% 48%;         /* Sky 500 */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 199 89% 48%;
    --radius: 0.5rem;
  }
}
```
  - **Success Criteria:**
    - [ ] All brand colors defined
    - [ ] Typography scale follows 4px grid
    - [ ] Shadow elevation system matches Figma
    - [ ] CSS variables work with shadcn
  - **Tests:**
    1. Apply `bg-brand-primary` → Shows Sky 500
    2. Apply `text-2xl` → 24px with correct line height
    3. Apply `shadow-lg` → Subtle elevated shadow
  - **Last Verified:**

## 0.4 UX Research & Flow Design

### 0.4.1 Create User Flow Diagrams
- [ ] **Action:** Design complete user journeys with Mermaid
  - **Why:** Visual representation prevents UX gaps
  - **Flows to Design:**
    1. Free User: Landing → Browse Public Projects → Try Editing
    2. Paid User (Direct): Landing → Pricing → Stripe → First Project
    3. Free→Paid Upgrade: Projects → Upgrade Prompt → Pricing → Payment
    4. Payment Error Recovery: Checkout → Card Declined → Retry/Support
    5. Onboarding (Paid): Post-Payment → Welcome → Create First Project → Export
  - **Success Criteria:**
    - [ ] 5 flows with Mermaid diagrams
    - [ ] Decision points marked
    - [ ] Error branches included
    - [ ] Animation trigger points noted
  - **Deliverable:** `_docs/ux/user-flows.md`
  - **Last Verified:**

### 0.4.2 Create Micro-Animations Catalog
- [ ] **Action:** Document all animations used in app
  - **Why:** Consistency and reference for implementation
  - **Categories:**
    - **Entrance** (fade in, slide up, scale in, stagger)
    - **Exit** (fade out, slide out, scale out)
    - **Hover** (scale, shadow, color shift, underline expand)
    - **Active/Press** (scale down, ripple, brightness)
    - **Loading** (spinner, skeleton shimmer, progress bar pulse)
    - **Success** (check mark draw, confetti, green flash)
    - **Error** (shake, red flash, exclamation bounce)
    - **Scroll** (parallax, fade in on view, stick on scroll)
  - **Format:**
```markdown
### Button Hover
- **Trigger:** Mouse enter
- **Animation:** Scale 1.02, shadow-lg, duration 150ms, spring(400, 17)
- **Code:**
  ```tsx
  <motion.button
    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
  />
  ```
```
  - **Success Criteria:**
    - [ ] 30+ micro-animations cataloged
    - [ ] Each has code example
    - [ ] Each has timing/easing specified
    - [ ] Accessibility notes included (prefers-reduced-motion)
  - **Deliverable:** `_docs/animations/micro-interactions-catalog.md`
  - **Last Verified:**

### 0.4.3 [C7] Research 2025 Best Landing Pages
- [ ] **Action:** Analyze top landing pages for inspiration
  - **Why:** Learn from industry-leading design patterns
  - **Context7:** Lookup "landing page design best practices 2025"
  - **Websites to Analyze:**
    - Linear.app (animations, typography)
    - Vercel.com (gradient backgrounds, scroll effects)
    - Stripe.com (pricing page, interactive demos)
    - Figma.com (product showcase, subtle animations)
    - Framer.com (motion design showcase)
  - **Analysis Points:**
    - Hero section layout
    - CTA button design & copy
    - Features section structure
    - Pricing table design
    - Footer structure
    - Animation timing
    - Color palette
    - Typography scale
  - **Success Criteria:**
    - [ ] 5 websites analyzed
    - [ ] Screenshot key sections
    - [ ] Note animation patterns
    - [ ] Extract copywriting patterns
  - **Deliverable:** `_docs/research/landing-page-inspiration.md`
  - **Last Verified:**

---

# Phase 1: Premium Landing Page with Framer Motion (10-12 hours)

**Goal:** Create stunning landing page that rivals best 2025 websites

**Phase Success Criteria:**
- [ ] Hero with animated gradient background
- [ ] Scroll-triggered section reveals
- [ ] Staggered feature cards
- [ ] Interactive pricing comparison
- [ ] Smooth page transitions
- [ ] 60 FPS animations (no jank)
- [ ] Lighthouse Performance >90
- [ ] [P] Playwright test: Landing → Pricing flow
- [ ] [A] 15+ micro-animations implemented

---

## 1.0 [C7] Setup Page Structure

### 1.0.1 [C7] Install Additional Animation Libraries
- [ ] **Action:** Add premium animation enhancements
  - **Context7:** Lookup "MagicUI" and "Aceternity UI" for React
  - **Why:** Pre-built animated components for landing page
  - **Libraries:**
```bash
# Optional: Premium animated components
npm install react-intersection-observer  # For scroll reveals
npm install react-type-animation           # For typing effect
npm install react-countup                  # For animated numbers
```
  - **Success Criteria:**
    - [ ] All libraries installed
    - [ ] No dependency conflicts
  - **Last Verified:**

## 1.1 [A] Animated Hero Section

### 1.1.1 [A] Create Hero with Animated Gradient
- [ ] **Action:** Build hero section with motion effects
  - **Why:** First impression must be stunning
  - **UX Principle:** Visual hierarchy + Motion design
  - **Animation:** Animated gradient background, fade-in text, floating elements
  - **Files Modified:**
    - Create: `src/components/landing/AnimatedHero.tsx`
    - Create: `src/components/effects/AnimatedGradient.tsx`
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation:**
```tsx
// src/components/effects/AnimatedGradient.tsx
import { motion } from 'framer-motion';

export function AnimatedGradient() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, 50, 0],
          y: [0, -50, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

// src/components/landing/AnimatedHero.tsx
import { motion } from 'framer-motion';
import { AnimatedGradient } from '@/components/effects/AnimatedGradient';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export function AnimatedHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedGradient />

      <motion.div
        className="container mx-auto px-4 pt-32 pb-20 text-center"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Founders deal: $9.99/year
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight"
        >
          Professional App Icons.
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Zero Design Skills Required.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeInUp}
          className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
        >
          Create App Store-ready icons and graphics in minutes with
          <strong className="text-gray-900"> real-time collaboration</strong>,
          professional templates, and export-ready files.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="px-8 py-6 text-lg shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg"
            >
              View Examples
            </Button>
          </motion.div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={fadeInUp}
          className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white"
                />
              ))}
            </div>
            <span>50+ developers</span>
          </div>
          <div className="flex items-center gap-2">
            ⭐⭐⭐⭐⭐
            <span>5.0 rating</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-3 bg-gray-400 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
```
  - **Success Criteria:**
    - [ ] Animated gradient background (3 floating orbs)
    - [ ] Text fades in with stagger effect
    - [ ] Badges have pulse animation
    - [ ] Buttons scale on hover/press
    - [ ] Scroll indicator animates
    - [ ] Gradient text on headline
    - [ ] 60 FPS on all animations
  - **Tests:**
    1. Load landing page → Hero animates in smoothly
    2. Hover CTA button → Scales up with shadow
    3. Click button → Scales down briefly
    4. Check DevTools Performance → 60 FPS
  - **Animation Details:**
    - Gradient orbs: 20-25s loop, x/y/scale transform
    - Text: Stagger 150ms, easeOutExpo, 800ms duration
    - Buttons: Spring animation (stiffness 400, damping 17)
    - Scroll indicator: 1.5s bounce, infinite loop
  - **Accessibility:**
    - [ ] Respects prefers-reduced-motion
    - [ ] Text contrast 4.5:1 minimum
    - [ ] Focus indicators on buttons
  - **Last Verified:**

---

*[This is the first ~20% of the complete plan. The full plan would include:]*

- **Remaining Phase 1 tasks:** Features section (scroll reveals), Pricing teaser (interactive hover), Footer, SEO
- **Phase 2:** Full pricing page with animated comparison table, FAQ accordion, Stripe checkout CTA
- **Phase 3:** Projects dashboard with skeleton loading, empty states, project cards
- **Phase 4:** Database schema, TypeScript types, Firebase services
- **Phase 5:** Complete Stripe integration with webhook handling, error recovery
- **Phase 6-8:** Access control, public/private projects, canvas isolation
- **Phase 9:** 10 Playwright E2E test suites
- **Phase 10:** Performance optimization (code splitting, image optimization), A11y audit

**Total: 105 tasks across 10 phases, ~45-50 hours**

Would you like me to continue with the complete plan?
