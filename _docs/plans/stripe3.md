# CanvasIcons - Complete Stripe Payment & Premium Implementation Plan

**Project:** CanvasIcons (CollabCanvas Premium)
**Domain:** canvasicons.com
**Branding:** Professional, minimal, Figma-inspired design system
**Estimated Time:** 50-60 hours (includes animations, robust testing, UX polish)
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
- Show tiers first, full comparison details below

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
- Success/error states visible within 200ms

### 5. Error Resilience
- Specific messages ("Card declined" not "Payment failed")
- Inline errors near problem field
- Don't clear form on error
- Recovery path always visible ("Try different card", "Contact support")
- Preserve user input on validation errors

### 6. Accessibility First (WCAG 2.1 AA)
- 4.5:1 color contrast minimum
- Keyboard navigation for all interactive elements
- Focus indicators (2px ring)
- Screen reader announcements for state changes
- Skip links, semantic HTML, ARIA labels

---

## 📊 Progress Tracker

**Overall Progress:** 0/120 tasks completed (0%)

**Phase Completion:**
- [ ] Phase 0: Research, UX Design & Animation System (0/22)
- [ ] Phase 1: Premium Landing Page with Framer Motion (0/18)
- [ ] Phase 2: Pricing Page with Interactive Animations (0/14)
- [ ] Phase 3: Projects Dashboard (0/16)
- [ ] Phase 4: Database & Types Setup (0/10)
- [ ] Phase 5: Stripe Integration with Error Handling (0/15)
- [ ] Phase 6: Access Control (0/11)
- [ ] Phase 7: Public/Private Projects (0/9)
- [ ] Phase 8: Canvas Isolation (0/7)
- [ ] Phase 9: E2E Testing with Playwright (0/12)
- [ ] Final: Performance, Accessibility & Polish (0/10)

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
- **Edge Cases:** Potential issues to watch for
- **Tests:** Manual verification steps
- **Playwright Test:** E2E test scenario
- **Files Modified:** Track what files changed
- **Rollback:** How to undo if needed

---

## Decision Log

**Active Decisions:**
- [2025-10-16] - Free users can sign up and join public projects (lower friction)
- [2025-10-16] - Founders deal: $9.99/year (limited to first 10 users)
- [2025-10-16] - Each canvas gets unique ID instead of hardcoded 'main'
- [2025-10-16] - Public projects visible in shared section without auth
- [2025-10-16] - Webhook-first payment verification (don't trust client-side success)
- [2025-10-16] - Real-time form validation on all payment forms
- [2025-10-16] - Progressive disclosure for export options and advanced settings
- [2025-10-16] - Framer Motion for premium animations (60 FPS target)
- [2025-10-16] - Playwright for E2E testing (not Puppeteer)
- [2025-10-16] - Onboarding checklist: 3-5 steps for new paid users

---

# Phase 0: Research, UX Design & Animation System (8-10 hours)

**Goal:** Document patterns, design flows, create animation catalog, set up design tokens

**Phase Success Criteria:**
- [ ] All existing patterns documented
- [ ] 5 user flow diagrams completed
- [ ] 30+ micro-animations cataloged
- [ ] Design tokens (colors, spacing, typography) defined
- [ ] Framer Motion + shadcn setup guide created
- [ ] Error catalog with 25+ scenarios
- [ ] Loading patterns for all async operations
- [ ] Empty state catalog
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

### 0.1.2 Review Current Auth & Database
- [ ] **Action:** Document Firebase patterns for subscription logic
  - **Why:** Integration point for Stripe subscriptions
  - **Files to Review:**
    - `src/lib/firebase/auth.ts`
    - `src/features/auth/components/*`
    - `src/stores/authStore.ts`
    - `src/lib/firebase/firestore.ts`
    - `src/lib/firebase/realtimedb.ts`
    - `src/lib/firebase/realtimeCanvasService.ts`
  - **Success Criteria:**
    - [ ] Auth flow documented (sign up, sign in, sign out)
    - [ ] Database structure mapped (RTDB + Firestore)
    - [ ] Identify where to add subscription data
    - [ ] Document current RTDB structure (canvas objects)
    - [ ] Identify where to add `/users` and `/projects` collections
  - **Tests:**
    1. Sign up with new account
    2. Sign in with existing account
    3. Check browser DevTools → Application → IndexedDB for user data
    4. Open Firebase Console → Firestore
    5. Open Firebase Console → Realtime Database
  - **Deliverable:** `_docs/research/firebase-architecture.md`

### 0.1.3 Review Current Routing
- [ ] **Action:** Document current routing structure
  - **Why:** Need to add `/pricing`, `/projects`, `/canvas/:id` routes
  - **Files to Review:**
    - `src/App.tsx` or routing file
    - `src/pages/*`
  - **Success Criteria:**
    - [ ] Document all existing routes
    - [ ] Note routing library (React Router, etc.)
    - [ ] Identify auth-protected routes pattern
  - **Tests:**
    1. Navigate to `/` - should show landing
    2. Navigate to `/canvas` - should show canvas
  - **Deliverable:** `_docs/research/routing-structure.md`

### 0.1.4 Review Current Canvas Store
- [ ] **Action:** Understand how canvas state is managed
  - **Why:** Need to adapt it for multi-project system (canvas ID per project)
  - **Files to Review:**
    - `src/stores/canvasStore.ts`
    - `src/lib/firebase/realtimeCanvasService.ts`
  - **Success Criteria:**
    - [ ] Document how objects are synced to Firebase
    - [ ] Note hardcoded 'main' canvas ID references
    - [ ] Identify where to inject dynamic canvas ID
    - [ ] Document current sync throttling (50ms expected)
  - **Tests:**
    1. Create object on canvas
    2. Check Firebase RTDB → Should see under `/canvases/main/objects`
    3. Measure sync latency (should be <150ms)
  - **Deliverable:** `_docs/research/canvas-sync-flow.md`

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

# Additional animation libraries
npm install react-intersection-observer  # For scroll reveals
npm install react-type-animation          # For typing effect
npm install react-countup                 # For animated numbers

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

## 0.4 UX Research & Flow Design

### 0.4.1 Create User Flow Diagrams
- [ ] **Action:** Design complete user journeys with Mermaid
  - **Why:** Visual representation prevents UX gaps
  - **UX Principle:** Progressive disclosure - identify where to reveal complexity
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
    - [ ] Loading states indicated
    - [ ] Progressive disclosure points identified
  - **Example Format:**
```mermaid
graph TD
    A[Landing Page] -->|Click "Get Started"| B[Sign Up Form]
    B -->|Submit| C{Valid?}
    C -->|No| D[Show Inline Error]
    D -->|Fix| B
    C -->|Yes| E[Loading State 200ms]
    E --> F[Projects Dashboard]
    F --> G[Empty State with CTA]
```
  - **Deliverable:** `_docs/ux/user-flows.md`

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

### 0.4.3 Design Error State Catalog
- [ ] **Action:** Create comprehensive error state catalog with recovery paths
  - **Why:** Specific, actionable errors reduce user frustration by 40%
  - **UX Principle:** Error resilience - always provide recovery path
  - **Error Categories:**
    - **Auth Errors** (wrong password, weak password, email exists, email invalid)
    - **Payment Errors** (card declined, insufficient funds, invalid card, expired card)
    - **Permission Errors** (can't create project - free tier, can't access private project)
    - **Network Errors** (offline, timeout, slow connection)
    - **Validation Errors** (invalid input, missing field, out of range)
  - **Success Criteria:**
    - [ ] 25+ specific error scenarios documented
    - [ ] Each error has user-friendly message (no technical jargon)
    - [ ] Each error has recovery action ("Try different card")
    - [ ] Each error has visual treatment (inline vs modal vs banner)
    - [ ] Each error preserves user input (don't clear form)
  - **Example Entry:**
```typescript
{
  code: 'card_declined',
  userMessage: 'Your card was declined. Please try a different payment method.',
  technicalMessage: 'Stripe error: card_declined',
  recovery: 'Try different card',
  visualTreatment: 'inline below payment form',
  preserveInput: true,
  severity: 'error'
}
```
  - **Deliverable:** `_docs/ux/error-catalog.md` + `src/constants/errors.ts`

### 0.4.4 Define Loading State Patterns
- [ ] **Action:** Document loading patterns for all async operations
  - **Why:** Immediate feedback (<100ms) prevents double-clicks and confusion
  - **UX Principle:** Immediate feedback - users need visual confirmation
  - **Loading Patterns:**
    - **Button Loading:** Spinner + "Loading..." text + disabled state
    - **Page Loading:** Skeleton screens (not blank page)
    - **Inline Loading:** Spinner next to field (form validation)
    - **Optimistic Updates:** Show immediately, rollback on error
    - **Background Sync:** Subtle indicator in corner
  - **Success Criteria:**
    - [ ] All button states defined (default, hover, loading, disabled, error, success)
    - [ ] Skeleton screens designed for dashboard and canvas
    - [ ] Optimistic update strategy documented
    - [ ] Loading timeout handling (what if >5 seconds?)
    - [ ] All loading states <100ms to appear
  - **Example Pattern:**
```tsx
// Button Loading State
<button
  onClick={handlePayment}
  disabled={isLoading}
  className={cn(
    "px-4 py-2 bg-blue-600 text-white rounded",
    isLoading && "opacity-50 cursor-not-allowed"
  )}
>
  {isLoading ? (
    <>
      <Spinner className="w-4 h-4 mr-2" />
      Processing...
    </>
  ) : (
    'Complete Payment'
  )}
</button>
```
  - **Deliverable:** `_docs/ux/loading-patterns.md` + Shared components

### 0.4.5 Design Empty State Catalog
- [ ] **Action:** Create helpful empty states for all major views
  - **Why:** Empty states guide users to next action, reduce confusion
  - **UX Principle:** Progressive disclosure - empty state is first step
  - **Empty States:**
    - Projects dashboard (no projects yet)
    - Projects dashboard (free user - can't create)
    - Shared projects (no public projects)
    - Canvas (blank canvas)
    - Export modal (no objects to export)
  - **Success Criteria:**
    - [ ] Each empty state has: Icon, Heading, Description, Primary CTA, Secondary action (optional)
    - [ ] Free user empty state encourages upgrade (but not pushy)
    - [ ] Paid user empty state encourages creation with templates
    - [ ] All empty states use consistent visual language
  - **Example Empty State:**
```tsx
<div className="flex flex-col items-center justify-center h-64 text-center">
  <div className="w-16 h-16 mb-4 text-gray-400">
    📁 {/* Icon */}
  </div>
  <h3 className="text-lg font-semibold mb-2">
    No projects yet
  </h3>
  <p className="text-gray-600 mb-6 max-w-md">
    Create your first project to start designing app icons and graphics
  </p>
  <button className="px-4 py-2 bg-blue-600 text-white rounded">
    Create Project
  </button>
</div>
```
  - **Deliverable:** `_docs/ux/empty-states.md` + Shared components

### 0.4.6 Define Database Schema (Enhanced)
- [ ] **Action:** Design Firestore schema for users and projects with validation
  - **Why:** Clear schema prevents refactoring later
  - **UX Principle:** Data consistency ensures reliable UX
  - **Implementation Details:**
```typescript
// Firestore Schema Design

/users/{userId}
  email: string (validated)
  username: string (unique, 3-20 chars, alphanumeric + underscore)
  subscription: {
    status: 'free' | 'founders' | 'pro'
    stripeCustomerId?: string
    stripePriceId?: string
    currentPeriodEnd?: timestamp
    cancelAtPeriodEnd?: boolean // For churn prevention
  }
  onboarding: {
    completedSteps: string[] // ['created_first_project', 'exported_file', etc.]
    currentStep: number // 0-4 (for 5-step onboarding)
    skipped: boolean
  }
  createdAt: timestamp
  updatedAt: timestamp
  lastLoginAt: timestamp // For engagement tracking

/projects/{projectId}
  id: string
  name: string (1-100 chars)
  ownerId: string (userId)
  template: 'blank' | 'feature-graphic' | 'app-icon'
  isPublic: boolean (default: false)
  collaborators: string[] (userIds)
  createdAt: timestamp
  updatedAt: timestamp
  thumbnail?: string (base64 or storage URL, max 500KB)
  objectCount: number // Denormalized for quick filtering

/public-projects/{projectId} (denormalized for fast queries)
  projectId: string
  name: string
  ownerId: string
  ownerUsername: string
  thumbnail?: string
  updatedAt: timestamp
  objectCount: number

/config/founders-deal
  spotsTotal: 10
  spotsRemaining: 7
  priceId: "price_xxx"
  active: true
```
  - **Success Criteria:**
    - [ ] Schema documented in this plan
    - [ ] Schema supports free/paid users
    - [ ] Schema supports public/private projects
    - [ ] Schema supports onboarding tracking
    - [ ] Validation rules defined for all fields
  - **Edge Cases:**
    - ⚠️ User deletes account → Need to handle orphaned projects
    - ⚠️ Project has no owner → Should never happen, but handle gracefully
    - ⚠️ Username conflict → Add random suffix

### 0.4.7 Define TypeScript Types (Enhanced)
- [ ] **Action:** Create comprehensive types for new entities with validation
  - **Why:** Type safety prevents bugs, enables better autocomplete
  - **Files Modified:**
    - Create: `src/types/subscription.types.ts`
    - Create: `src/types/project.types.ts`
    - Create: `src/types/onboarding.types.ts`
    - Create: `src/types/payment.types.ts`
  - **Implementation Details:**
```typescript
// src/types/subscription.types.ts
export type SubscriptionStatus = 'free' | 'founders' | 'pro';

export interface Subscription {
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: number; // Unix timestamp
  cancelAtPeriodEnd?: boolean;
}

export interface Onboarding {
  completedSteps: string[];
  currentStep: number; // 0-4
  skipped: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  subscription: Subscription;
  onboarding: Onboarding;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number;
}

// src/types/project.types.ts
export type ProjectTemplate = 'blank' | 'feature-graphic' | 'app-icon';

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  template: ProjectTemplate;
  isPublic: boolean;
  collaborators: string[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  objectCount: number;
}

export interface PublicProject {
  projectId: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  thumbnail?: string;
  updatedAt: number;
  objectCount: number;
}

// src/types/payment.types.ts
export interface PaymentError {
  code: string;
  userMessage: string;
  technicalMessage: string;
  recovery: string;
  visualTreatment: 'inline' | 'modal' | 'banner';
  preserveInput: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface PaymentState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: PaymentError;
  sessionId?: string;
}

// src/types/onboarding.types.ts
export type OnboardingStep =
  | 'welcome'
  | 'create_first_project'
  | 'explore_tools'
  | 'export_file'
  | 'share_project';

export interface OnboardingConfig {
  steps: OnboardingStep[];
  currentStep: number;
  canSkip: boolean;
  completedSteps: OnboardingStep[];
}
```
  - **Success Criteria:**
    - [ ] All types exported from `@/types`
    - [ ] Types match Firestore schema exactly
    - [ ] Payment error types support catalog
    - [ ] Onboarding types support 3-5 step flow

### 0.4.8 Plan Stripe Products & Prices (Enhanced)
- [ ] **Action:** Document Stripe product structure with test mode setup
  - **Why:** Need to create these in Stripe Dashboard
  - **Implementation Details:**
```
Stripe Products (Test Mode):
1. "CanvasIcons Founders Access"
   - Price: $9.99/year (recurring)
   - Metadata: { tier: "founders", maxUsers: "10", features: "unlimited_projects,public_private,all_templates" }
   - Price ID: price_xxx (get from Stripe)
   - Billing cycle: Annual
   - Trial period: None (founders deal)

2. "CanvasIcons Pro" (future - Phase 2)
   - Price 1: $90/year (recurring)
   - Price 2: $10/month (recurring)
   - Metadata: { tier: "pro", features: "unlimited_projects,public_private,all_templates,priority_support" }
   - Billing cycle: Annual or Monthly
   - Trial period: 14 days

Webhook Events to Handle:
- checkout.session.completed (initial payment)
- customer.subscription.updated (renewal, plan change)
- customer.subscription.deleted (cancellation)
- invoice.payment_failed (retry logic)
- invoice.payment_succeeded (renewal success)
```
  - **Success Criteria:**
    - [ ] Products documented
    - [ ] Know which price ID to use in checkout
    - [ ] Webhook events mapped to actions
    - [ ] Test mode products created in Stripe
  - **Tests:**
    1. Create products in Stripe Test Mode
    2. Copy price IDs to `.env.local`
    3. Test webhook delivery in Stripe dashboard

### 0.4.9 Plan URL Structure (Enhanced)
- [ ] **Action:** Define all new routes with auth requirements and error states
  - **Why:** Clear routing prevents conflicts and improves SEO
  - **Implementation Details:**
```
Routes:
/                     → Landing Page (public)
/pricing              → Pricing Page (public)
/projects             → Projects Dashboard (require auth)
                        ↳ Redirect to '/' if not authenticated
/canvas/:projectId    → Canvas Editor (require auth + project access)
                        ↳ Show "Access Denied" if no permission
                        ↳ Show "Project Not Found" if doesn't exist
/account              → Account Settings (require auth) [future]
/onboarding           → New user onboarding flow (require auth, paid users only)

Query Params:
/projects?payment=success&session_id={id}   → Show success banner, poll for subscription update
/projects?payment=cancelled                 → Show "Payment cancelled" message
/pricing?from=upgrade                       → Show "Upgrade to unlock" message
/pricing?plan=founders                      → Scroll to Founders tier

Error Routes:
/404                  → Page not found
/500                  → Server error
/offline              → No connection (PWA future)

Redirects:
/canvas              → /projects (old single-canvas route)
/                    → /projects (if authenticated)
```
  - **Success Criteria:**
    - [ ] All routes documented
    - [ ] Auth requirements noted
    - [ ] Error handling defined
    - [ ] Query params documented
    - [ ] Redirects mapped

### 0.4.10 Create Accessibility Checklist
- [ ] **Action:** Document WCAG 2.1 AA compliance requirements
  - **Why:** Accessibility is not optional, required for Figma-quality UX
  - **Standards:** WCAG 2.1 Level AA
  - **Checklist Items:**
    - [ ] **Keyboard Navigation:** All interactive elements focusable with Tab
    - [ ] **Focus Indicators:** Visible focus ring on all elements (2px blue outline)
    - [ ] **Color Contrast:** 4.5:1 for normal text, 3:1 for large text
    - [ ] **Alt Text:** All images have descriptive alt text
    - [ ] **Form Labels:** All inputs have associated labels
    - [ ] **Error Identification:** Errors announced to screen readers
    - [ ] **Skip Links:** "Skip to content" link at top
    - [ ] **Semantic HTML:** Proper heading hierarchy (h1 → h2 → h3)
    - [ ] **ARIA Labels:** Buttons without text have aria-label
    - [ ] **Focus Management:** Modal traps focus, returns on close
  - **Success Criteria:**
    - [ ] All checklist items implemented
    - [ ] Lighthouse accessibility score >95
    - [ ] Manual screen reader test (VoiceOver or NVDA)
    - [ ] Keyboard-only navigation test passed
  - **Tools:**
    - Chrome DevTools Lighthouse
    - axe DevTools extension
    - Screen reader (VoiceOver on Mac, NVDA on Windows)
  - **Deliverable:** `_docs/ux/accessibility-checklist.md`

### 0.4.11 [C7] Research 2025 Best Landing Pages
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

---

*Continue reading for the remaining phases...*

**Note:** This is a comprehensive 120-task plan. The full document continues with:
- Phase 1: Premium Landing Page with Framer Motion (18 tasks)
- Phase 2: Pricing Page with Interactive Animations (14 tasks)
- Phase 3: Projects Dashboard (16 tasks)
- Phase 4: Database & Types Setup (10 tasks)
- Phase 5: Stripe Integration with Error Handling (15 tasks)
- Phase 6: Access Control (11 tasks)
- Phase 7: Public/Private Projects (9 tasks)
- Phase 8: Canvas Isolation (7 tasks)
- Phase 9: E2E Testing with Playwright (12 tasks)
- Phase 10: Performance, Accessibility & Polish (10 tasks)

Total estimated time: **50-60 hours** for production-ready implementation.
