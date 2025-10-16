# Stripe Payment Integration & Multi-Project System - Enhanced Implementation Plan

**Project:** CollabCanvas (IconForge rebrand)
**Estimated Time:** 35-40 hours (expanded for UX robustness)
**Dependencies:** Firebase Auth, Firebase Firestore, Firebase Realtime DB, Stripe account, Puppeteer (testing)
**Last Updated:** 2025-10-16

---

## 🎯 Core UX Principles (Figma-Inspired)

This implementation follows industry-leading UX principles:

### 1. Progressive Disclosure
- Reveal complexity gradually, don't overwhelm users
- Show 3-5 key steps initially, expand details on demand
- Use collapsible sections for advanced options
- Example: Export modal shows basic options first, advanced in expandable section

### 2. Visual Hierarchy
- Important actions use primary colors (blue-600)
- Secondary actions use neutral colors (gray)
- Destructive actions use red
- Pricing: Founders tier visually prominent, Free tier subtle

### 3. Immediate Feedback
- All button clicks show loading state within 100ms
- Form validation in real-time (as user types)
- Optimistic UI updates (update UI before Firebase confirms)
- Success/error states visible within 200ms

### 4. Error Resilience
- Specific, actionable error messages (no technical jargon)
- Show errors inline near the problem
- Don't clear form on error
- Always provide recovery path ("Try different card", "Contact support")

### 5. Reduce Cognitive Load
- Maximum 3 options per decision point
- Pre-fill known information (email, username)
- Use plain language ("Sign Up Free" not "Initialize Account")
- Empty states guide users to next action

---

## Progress Tracker

**Overall Progress:** 0/89 tasks completed (0%)

**Phase Completion:**
- [ ] Phase 0: Research, Planning & UX Design (0/15)
- [ ] Phase 1: Landing Page Updates (0/12)
- [ ] Phase 2: Pricing Page (0/11)
- [ ] Phase 3: Projects Dashboard (0/15)
- [ ] Phase 4: Database & Types Setup (0/9)
- [ ] Phase 5: Stripe Integration (0/13)
- [ ] Phase 6: Access Control (0/10)
- [ ] Phase 7: Public/Private Projects (0/8)
- [ ] Phase 8: Canvas Isolation (0/6)
- [ ] Phase 9: E2E Testing with Puppeteer (0/8)
- [ ] Final: Performance & Accessibility (0/6)

---

## Legend

- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Completed and verified
- `[!]` = Blocked (see Blockers section)
- `[P]` = Has Puppeteer E2E test
- **Success Criteria:** How to verify task is done
- **UX Principle:** Which design principle applies
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task
- **Puppeteer Test:** Automated E2E test scenario
- **Files Modified:** Track what files changed
- **Rollback:** How to undo if needed

---

## Blockers & Notes

**Active Blockers:**
- None currently

**Decision Log:**
- [2025-10-16] - Free users can sign up and join public projects (lower friction)
- [2025-10-16] - Founders deal: $9.99/year (limited to first 10 users)
- [2025-10-16] - Each canvas gets unique ID instead of hardcoded 'main'
- [2025-10-16] - Public projects visible in shared section without auth
- [2025-10-16] - **NEW:** Webhook-first payment verification (don't trust client-side success)
- [2025-10-16] - **NEW:** Real-time form validation on all payment forms
- [2025-10-16] - **NEW:** Progressive disclosure for export options and advanced settings
- [2025-10-16] - **NEW:** 3-5 step onboarding checklist for new paid users

**UX Principles Applied:**
- Progressive disclosure on all multi-step flows
- Visual hierarchy: Primary (blue), Secondary (gray), Destructive (red)
- Immediate feedback: <100ms loading states, <200ms success/error
- Specific error messages with recovery paths
- Empty states guide to next action
- Real-time validation (no form submission surprises)

---

# Phase 0: Research, Planning & UX Design

**Goal:** Document existing patterns, design UX flows, create error/loading state catalog

**Phase Success Criteria:**
- [ ] All existing auth/database patterns documented
- [ ] Complete user flow diagrams for 5 key journeys
- [ ] Error state catalog with 20+ scenarios
- [ ] Loading state patterns defined for all async operations
- [ ] Accessibility checklist created

---

## 0.1 Research Existing Codebase

### 0.1.1 Document Current Auth System
- [ ] **Action:** Review and document current Firebase Auth implementation
  - **Why:** Need to understand existing auth flow before adding subscription logic
  - **UX Principle:** Consistency - maintain existing auth patterns
  - **Files to Review:**
    - `src/lib/firebase/auth.ts`
    - `src/features/auth/components/*`
    - `src/stores/authStore.ts` (if exists)
  - **Success Criteria:**
    - [ ] Document current sign-up flow (step-by-step)
    - [ ] Document current sign-in flow (step-by-step)
    - [ ] Note where user data is stored
    - [ ] Identify auth loading states
    - [ ] Identify auth error messages
  - **Tests:**
    1. Sign up with new account
    2. Sign in with existing account
    3. Check browser DevTools → Application → IndexedDB for user data
    4. Trigger error states (wrong password, weak password, etc.)
  - **Deliverable:** `_docs/research/auth-flow.md` with diagrams
  - **Last Verified:**

### 0.1.2 Review Firebase Database Structure
- [ ] **Action:** Document current Firestore/RTDB structure
  - **Why:** Need to understand where to add projects and user subscription data
  - **Files to Review:**
    - `src/lib/firebase/firestore.ts`
    - `src/lib/firebase/realtimedb.ts`
    - `src/lib/firebase/realtimeCanvasService.ts`
  - **Success Criteria:**
    - [ ] Document current RTDB structure (canvas objects)
    - [ ] Document current Firestore collections
    - [ ] Identify where to add `/users` and `/projects` collections
    - [ ] Map out data relationships (user → projects → canvases)
  - **Tests:**
    1. Open Firebase Console → Firestore
    2. Open Firebase Console → Realtime Database
    3. Document existing structure in Markdown
  - **Deliverable:** `_docs/research/database-structure.md`
  - **Last Verified:**

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
  - **Last Verified:**

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
  - **Last Verified:**

## 0.2 UX Design & Flow Mapping

### 0.2.1 Create User Flow Diagrams
- [ ] **Action:** Design visual flow diagrams for 5 key user journeys
  - **Why:** Visual representation prevents UX gaps and confusion
  - **UX Principle:** Progressive disclosure - identify where to reveal complexity
  - **Flows to Design:**
    1. New Free User Journey (landing → sign up → projects → upgrade prompt)
    2. Direct Paid User Journey (landing → pricing → payment → projects → first project)
    3. Free User Joins Public Project (browse shared → open → collaborate)
    4. Paid User Creates & Shares Project (create → edit → toggle public → share)
    5. Payment Error Recovery (checkout → error → retry/contact support)
  - **Success Criteria:**
    - [ ] All 5 flows documented with Mermaid diagrams
    - [ ] Decision points clearly marked
    - [ ] Error branches included
    - [ ] Loading states indicated
    - [ ] Progressive disclosure points identified
  - **Tools:** Mermaid.js or Figma
  - **Deliverable:** `_docs/ux/user-flows.md` with embedded diagrams
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
  - **Last Verified:**

### 0.2.2 Design Error State Catalog
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
    - [ ] 20+ specific error scenarios documented
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
  - **Last Verified:**

### 0.2.3 Define Loading State Patterns
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
  - **Last Verified:**

### 0.2.4 Design Empty State Catalog
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
  - **Last Verified:**

### 0.2.5 Define Database Schema (Enhanced)
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
  - **Last Verified:**

### 0.2.6 Define TypeScript Types (Enhanced)
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
  - **Last Verified:**

### 0.2.7 Plan Stripe Products & Prices (Enhanced)
- [ ] **Action:** Document Stripe product structure with test mode setup
  - **Why:** Need to create these in Stripe Dashboard
  - **Implementation Details:**
```
Stripe Products (Test Mode):
1. "IconForge Founders Access"
   - Price: $9.99/year (recurring)
   - Metadata: { tier: "founders", maxUsers: "10", features: "unlimited_projects,public_private,all_templates" }
   - Price ID: price_xxx (get from Stripe)
   - Billing cycle: Annual
   - Trial period: None (founders deal)

2. "IconForge Pro" (future - Phase 2)
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
  - **Last Verified:**

### 0.2.8 Plan URL Structure (Enhanced)
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
  - **Last Verified:**

### 0.2.9 Create Accessibility Checklist
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
  - **Last Verified:**

---

# Phase 1: Landing Page Updates (4-5 hours)

**Goal:** Update landing page with founders deal, clear value prop, and Figma-quality UX

**Phase Success Criteria:**
- [ ] Landing page shows founders deal banner
- [ ] CTA button goes to pricing page
- [ ] Page is mobile responsive (320px to 4K)
- [ ] SEO meta tags added
- [ ] Lighthouse score >90 (Performance, Accessibility, Best Practices, SEO)
- [ ] [P] Puppeteer E2E test: Hero CTA → Pricing flow

---

## 1.1 Hero Section

### 1.1.1 Update Hero Content with Visual Hierarchy
- [ ] **Action:** Rewrite hero section with clear value proposition
  - **Why:** Landing page is first impression, sets brand tone
  - **UX Principle:** Visual hierarchy - most important info largest and first
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
    - Create: `src/components/landing/HeroSection.tsx`
  - **Implementation Details:**
```tsx
// src/components/landing/HeroSection.tsx
export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative pt-32 pb-20 px-4">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" />

      <div className="container mx-auto max-w-6xl text-center">
        {/* Primary value prop - largest text */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Design App Icons & Graphics
          <br />
          <span className="text-blue-600">That Convert</span>
        </h1>

        {/* Supporting copy - medium text */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Professional templates. Real-time collaboration. Export-ready files.
          <br />
          <span className="font-semibold">From $9.99/year.</span>
        </p>

        {/* CTA buttons - visual hierarchy (primary vs secondary) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Primary CTA - most prominent */}
          <Link
            to="/pricing"
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </Link>

          {/* Secondary CTA - less prominent */}
          <Link
            to="#features"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            See Features
          </Link>
        </div>

        {/* Social proof - smallest text, subtle */}
        <p className="mt-8 text-sm text-gray-500">
          Trusted by indie developers and design teams
        </p>
      </div>
    </section>
  );
}
```
  - **Success Criteria:**
    - [ ] Headline is "Design App Icons & Graphics That Convert"
    - [ ] Subheading mentions price point ($9.99/year)
    - [ ] Primary CTA button says "Get Started Free" (blue, prominent)
    - [ ] Secondary CTA says "See Features" (outline, subtle)
    - [ ] Primary CTA links to `/pricing`
    - [ ] Secondary CTA scrolls to #features
    - [ ] Text hierarchy: h1 (5xl) > p (2xl) > CTA (lg) > social proof (sm)
    - [ ] Mobile responsive: stacks vertically <640px
  - **Tests:**
    1. Visit `/`
    2. Click "Get Started Free" → Should go to `/pricing`
    3. Click "See Features" → Should scroll to features section
    4. Resize to 320px wide → Should not horizontal scroll
  - **Edge Cases:**
    - ⚠️ User already logged in → Show "Go to Projects" instead of "Get Started Free"
  - **Rollback:** Restore original LandingPage.tsx from git
  - **Last Verified:**

### 1.1.2 Add Founders Deal Banner with Urgency
- [ ] **Action:** Create sticky banner at top with scarcity messaging
  - **Why:** Urgency drives conversions (FOMO principle)
  - **UX Principle:** Visual hierarchy - banner above all content, dismissable
  - **Files Modified:**
    - Create: `src/components/common/FoundersBanner.tsx`
    - Update: `src/pages/LandingPage.tsx`
    - Create: `src/hooks/useFoundersSpots.ts`
  - **Implementation Details:**
```tsx
// src/hooks/useFoundersSpots.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';

/**
 * Fetch remaining founders deal spots from Firestore
 * Real-time updates when spots are claimed
 */
export function useFoundersSpots() {
  const [spotsLeft, setSpotsLeft] = useState<number>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpots() {
      try {
        const configRef = doc(firestore, 'config', 'founders-deal');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
          const data = configSnap.data();
          setSpotsLeft(data.spotsRemaining ?? 7);
        }
      } catch (error) {
        console.error('Failed to fetch founders spots:', error);
        // Fallback to hardcoded value
        setSpotsLeft(7);
      } finally {
        setLoading(false);
      }
    }

    fetchSpots();
  }, []);

  return { spotsLeft, loading };
}

// src/components/common/FoundersBanner.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useFoundersSpots } from '@/hooks/useFoundersSpots';

export function FoundersBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { spotsLeft, loading } = useFoundersSpots();

  if (dismissed || loading) return null;

  const message = spotsLeft > 0
    ? `🎉 Founders Deal: $9.99/year (reg. $90) - Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left!`
    : '📝 Waitlist Open: Join to be notified when spots open';

  const ctaText = spotsLeft > 0 ? 'Claim Spot →' : 'Join Waitlist →';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-3 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <span className="text-sm md:text-base font-medium flex-1">
          {message}
        </span>

        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="text-sm font-semibold underline hover:no-underline whitespace-nowrap"
          >
            {ctaText}
          </Link>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// Firestore config document structure
/config/founders-deal
  spotsTotal: 10
  spotsRemaining: 7
  priceId: "price_xxx"
  active: true
```
  - **Success Criteria:**
    - [ ] Banner sticky at top of page
    - [ ] Shows remaining spots (fetched from Firestore, not hardcoded)
    - [ ] "Claim Spot" links to `/pricing`
    - [ ] Dismiss button (X) hides banner
    - [ ] Changes to "Waitlist" when spots = 0
    - [ ] Mobile responsive: text truncates on small screens
    - [ ] Banner pushes content down (doesn't overlay)
  - **Tests:**
    1. Visit `/` → Banner visible at top
    2. Scroll down → Banner stays fixed
    3. Click "Claim Spot" → Go to `/pricing`
    4. Click X → Banner dismisses
    5. Refresh page → Banner reappears (no persistence)
    6. Manually set spotsRemaining to 0 in Firestore → Should show waitlist message
  - **Edge Cases:**
    - ⚠️ When 0 spots left → Change text to "Waitlist Open"
    - ⚠️ Firestore fetch fails → Fallback to hardcoded 7 spots
    - ⚠️ User already has founders tier → Don't show banner
  - **Accessibility:**
    - [ ] Dismiss button has aria-label
    - [ ] Banner can be dismissed with keyboard (Tab + Enter)
  - **Last Verified:**

## 1.2 Features Section

### 1.2.1 Add Features Highlights with Icons
- [ ] **Action:** Create features section with 4 key value props
  - **Why:** Show value before asking to pay
  - **UX Principle:** Progressive disclosure - show features, hide technical details
  - **Files Modified:**
    - Create: `src/components/landing/FeaturesSection.tsx`
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```tsx
// src/components/landing/FeaturesSection.tsx
interface Feature {
  icon: string;
  title: string;
  description: string;
  benefit: string; // User benefit, not technical feature
}

const features: Feature[] = [
  {
    icon: '📱',
    title: 'App Icon Templates',
    description: 'iOS & Android icon templates with proper sizing',
    benefit: 'Ship faster with pre-sized templates'
  },
  {
    icon: '🎨',
    title: 'Feature Graphics',
    description: 'App Store screenshots and feature graphics',
    benefit: 'Increase downloads with professional graphics'
  },
  {
    icon: '🤝',
    title: 'Real-time Collaboration',
    description: 'Work together with your team, see changes instantly',
    benefit: 'No more emailing design files back and forth'
  },
  {
    icon: '💾',
    title: 'High-Res Export',
    description: 'Export PNG, SVG, and retina files (up to 3x)',
    benefit: 'Perfect quality for any device or platform'
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Everything You Need for App Graphics
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From idea to App Store-ready assets in minutes, not hours
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Icon */}
              <div className="text-5xl mb-4">{feature.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">
                {feature.description}
              </p>

              {/* User benefit - emphasized */}
              <p className="text-sm font-medium text-blue-600">
                → {feature.benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```
  - **Success Criteria:**
    - [ ] 4 features displayed in grid
    - [ ] Each feature has: icon (emoji), title, description, user benefit
    - [ ] Responsive: 1 col mobile (<640px), 2 col tablet (640-1024px), 4 col desktop (>1024px)
    - [ ] Hover effect: subtle shadow on card
    - [ ] Benefits emphasized in blue color
    - [ ] Section background is gray-50 (subtle contrast with white cards)
  - **Tests:**
    1. Visit landing page
    2. Scroll to features section
    3. Resize browser to mobile (320px) → Cards stack vertically
    4. Resize to tablet (768px) → 2 columns
    5. Resize to desktop (1440px) → 4 columns
    6. Hover over card → Shadow appears
  - **Accessibility:**
    - [ ] Section has id="features" for scroll anchor
    - [ ] Heading hierarchy: h2 (section) → h3 (feature titles)
  - **Last Verified:**

## 1.3 Pricing Teaser

### 1.3.1 Add Pricing Teaser Section with Comparison
- [ ] **Action:** Show pricing cards (simplified) on landing page
  - **Why:** Let users see price before clicking CTA (transparency)
  - **UX Principle:** Progressive disclosure - basic tiers on landing, full details on pricing page
  - **Files Modified:**
    - Create: `src/components/landing/PricingTeaser.tsx`
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```tsx
// src/components/landing/PricingTeaser.tsx
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

export function PricingTeaser() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free, upgrade when you're ready to create your own projects
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="border-2 border-gray-200 rounded-lg p-8 bg-white">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Free</h3>

            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">$0</p>
              <p className="text-gray-500">Forever free</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Join public projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Export high-res files</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">All editing tools</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">Create your own projects</span>
              </li>
            </ul>

            <Link
              to="/pricing"
              className="block w-full text-center py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Founders Tier - Highlighted */}
          <div className="border-2 border-blue-500 rounded-lg p-8 bg-blue-50 relative">
            {/* "Best Value" badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              🎯 Best Value
            </div>

            <h3 className="text-2xl font-bold mb-2 text-gray-900">Founders</h3>

            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">
                $9.99
                <span className="text-lg font-normal text-gray-600">/year</span>
              </p>
              <p className="text-gray-600">
                <span className="line-through">$90/year</span>
                <span className="ml-2 text-green-600 font-semibold">Save 89%</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Less than $1/month • Limited to 10 users
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Everything in Free</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Unlimited projects</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Public & private projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">All templates</span>
              </li>
            </ul>

            <Link
              to="/pricing"
              className="block w-full text-center py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Get Started - $9.99
            </Link>

            <p className="text-center text-sm text-gray-600 mt-4">
              Only 7 spots left at this price
            </p>
          </div>
        </div>

        {/* CTA to full pricing page */}
        <div className="text-center mt-12">
          <Link
            to="/pricing"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            See full pricing details →
          </Link>
        </div>
      </div>
    </section>
  );
}
```
  - **Success Criteria:**
    - [ ] Two tiers shown: Free and Founders
    - [ ] Founders tier highlighted with blue border and "Best Value" badge
    - [ ] Pricing clearly shows: price, period, savings, features
    - [ ] Free tier uses Check (green) and X (gray) icons
    - [ ] Founders tier emphasizes "Unlimited projects" with bold
    - [ ] Both CTAs link to `/pricing`
    - [ ] Mobile responsive: cards stack vertically <768px
    - [ ] Visual hierarchy: Founders tier more prominent (colored background, shadow)
  - **Tests:**
    1. Visit landing page, scroll to pricing teaser
    2. Founders card should be more visually prominent than Free
    3. Click "Sign Up Free" → Go to `/pricing`
    4. Click "Get Started - $9.99" → Go to `/pricing`
    5. Resize to mobile → Cards stack, maintain readability
  - **Edge Cases:**
    - ⚠️ User already has founders tier → Show "Current Plan" badge on Founders card
  - **Accessibility:**
    - [ ] Icons have aria-hidden (decorative)
    - [ ] Pricing amounts in semantic structure (not just visual)
  - **Last Verified:**

## 1.4 SEO & Meta Tags

### 1.4.1 Add SEO Meta Tags and Open Graph
- [ ] **Action:** Add comprehensive meta tags for SEO and social sharing
  - **Why:** Improve search ranking and social media appearance
  - **UX Principle:** First impression extends to search results and social previews
  - **Files Modified:**
    - Update: `index.html` or `src/App.tsx` (helmet)
    - Create: `public/og-image.png` (1200x630px Open Graph image)
  - **Implementation Details:**
```html
<!-- In index.html or via React Helmet -->
<head>
  <!-- Primary Meta Tags -->
  <title>CollabCanvas - Design App Icons & Graphics That Convert | $9.99/year</title>
  <meta name="title" content="CollabCanvas - Design App Icons & Graphics That Convert" />
  <meta name="description" content="Create professional app icons, feature graphics, and screenshots with real-time collaboration. Start free or get founders access for $9.99/year." />
  <meta name="keywords" content="app icon design, feature graphic, app store screenshot, collaborative design, Figma alternative" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://collabcanvas.app/" />
  <meta property="og:title" content="CollabCanvas - Design App Icons That Convert" />
  <meta property="og:description" content="Professional app graphics in minutes. Start free or get founders access for $9.99/year." />
  <meta property="og:image" content="https://collabcanvas.app/og-image.png" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://collabcanvas.app/" />
  <meta property="twitter:title" content="CollabCanvas - Design App Icons That Convert" />
  <meta property="twitter:description" content="Professional app graphics in minutes. Start free or get founders access for $9.99/year." />
  <meta property="twitter:image" content="https://collabcanvas.app/og-image.png" />

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <!-- Canonical URL -->
  <link rel="canonical" href="https://collabcanvas.app/" />
</head>
```

**Open Graph Image Specs:**
- Size: 1200x630px
- Format: PNG or JPG
- Content: Logo + "Design App Icons That Convert" + "$9.99/year"
- Background: Blue gradient matching brand
  - **Success Criteria:**
    - [ ] Title tag includes primary keyword and price
    - [ ] Meta description <160 characters, includes CTA
    - [ ] Open Graph image created (1200x630px)
    - [ ] Twitter card meta tags added
    - [ ] Favicon set (16x16, 32x32, 180x180)
    - [ ] Canonical URL set
  - **Tests:**
    1. View page source → Meta tags present
    2. Test Open Graph: https://www.opengraph.xyz/url/https://collabcanvas.app
    3. Test Twitter Card: https://cards-dev.twitter.com/validator
    4. Google search preview: Use SERP simulator
  - **Tools:**
    - Open Graph debugger: https://www.opengraph.xyz
    - Twitter Card validator: https://cards-dev.twitter.com/validator
    - Google SERP simulator: https://mobilemoxie.com/tools/mobile-serp-test/
  - **Last Verified:**

## 1.5 Puppeteer E2E Test: Landing → Pricing Flow

### 1.5.1 [P] Create Puppeteer Test for Hero CTA
- [ ] **Action:** Write E2E test for landing page → pricing page flow
  - **Why:** Automated testing prevents regressions in critical conversion flow
  - **UX Principle:** Immediate feedback - test confirms user journey works
  - **Files Modified:**
    - Create: `tests/e2e/landing-to-pricing.spec.ts`
    - Update: `package.json` (add test script)
  - **Implementation Details:**
```typescript
// tests/e2e/landing-to-pricing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Page → Pricing Flow', () => {
  test('should navigate from landing hero CTA to pricing page', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify hero section is visible
    const hero = page.locator('h1:has-text("Design App Icons & Graphics")');
    await expect(hero).toBeVisible();

    // Verify primary CTA exists
    const ctaButton = page.locator('a:has-text("Get Started Free")');
    await expect(ctaButton).toBeVisible();

    // Click CTA button
    await ctaButton.click();

    // Wait for navigation
    await page.waitForURL('/pricing');

    // Verify we're on pricing page
    await expect(page).toHaveURL('/pricing');

    // Verify pricing page header is visible
    const pricingHeader = page.locator('h1:has-text("Choose Your Plan")');
    await expect(pricingHeader).toBeVisible();

    // Verify both pricing tiers are visible
    const freeTier = page.locator('text=Free');
    const foundersTier = page.locator('text=Founders');
    await expect(freeTier).toBeVisible();
    await expect(foundersTier).toBeVisible();
  });

  test('should show founders banner and navigate to pricing', async ({ page }) => {
    await page.goto('/');

    // Verify founders banner is visible
    const banner = page.locator('[data-testid="founders-banner"]');
    await expect(banner).toBeVisible();

    // Verify banner shows remaining spots
    const bannerText = await banner.textContent();
    expect(bannerText).toContain('spots left');

    // Click "Claim Spot" link
    const claimSpotLink = banner.locator('a:has-text("Claim Spot")');
    await claimSpotLink.click();

    // Should navigate to pricing
    await page.waitForURL('/pricing');
    await expect(page).toHaveURL('/pricing');
  });

  test('should dismiss founders banner', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator('[data-testid="founders-banner"]');
    await expect(banner).toBeVisible();

    // Click dismiss button
    const dismissButton = banner.locator('button[aria-label="Dismiss banner"]');
    await dismissButton.click();

    // Banner should be hidden
    await expect(banner).not.toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');

    // Hero should be visible on mobile
    const hero = page.locator('h1:has-text("Design App Icons & Graphics")');
    await expect(hero).toBeVisible();

    // CTA buttons should stack vertically
    const ctaContainer = page.locator('.flex.flex-col.sm\\:flex-row');
    await expect(ctaContainer).toBeVisible();

    // Features should stack in single column
    await page.locator('#features').scrollIntoViewIfNeeded();
    const featuresGrid = page.locator('#features .grid');
    const gridClass = await featuresGrid.getAttribute('class');
    expect(gridClass).toContain('sm:grid-cols-2');
  });
});
```

```json
// package.json - add test scripts
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:landing": "playwright test tests/e2e/landing-to-pricing.spec.ts"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```
  - **Success Criteria:**
    - [ ] Test navigates from `/` to `/pricing` via hero CTA
    - [ ] Test verifies founders banner appears and links to pricing
    - [ ] Test verifies banner can be dismissed
    - [ ] Test verifies mobile responsiveness (390px width)
    - [ ] All tests pass on CI/CD pipeline
  - **Tests:**
    1. Run `npm run test:e2e:landing`
    2. All 4 test cases should pass
    3. Screenshots captured on failure
  - **CI Integration:**
    - Add to GitHub Actions workflow
    - Run on every PR to main branch
  - **Last Verified:**

---

# Phase 2: Pricing Page (3-4 hours)

**Goal:** Create dedicated pricing page with clear tiers, FAQ, and Figma-quality comparison UI

**Phase Success Criteria:**
- [ ] Pricing page accessible at `/pricing`
- [ ] Shows Free and Founders tiers with clear comparison
- [ ] Founders tier CTA goes to Stripe checkout (after Phase 5)
- [ ] Free tier CTA goes to sign up
- [ ] FAQ section answers common objections
- [ ] [P] Puppeteer E2E test: Checkout initiation flow

---

## 2.1 Create Pricing Page Component

### 2.1.1 Create Pricing Page Structure with Progressive Disclosure
- [ ] **Action:** Create new pricing page with header, tiers, and FAQ
  - **Why:** Dedicated pricing page for clear comparison reduces confusion
  - **UX Principle:** Progressive disclosure - show tiers first, FAQ below for those who need more info
  - **Files Modified:**
    - Create: `src/pages/PricingPage.tsx`
    - Update: `src/App.tsx` (add route)
  - **Implementation Details:**
```tsx
// src/pages/PricingPage.tsx
import { FoundersBanner } from '@/components/common/FoundersBanner';
import { PricingTiers } from '@/features/pricing/components/PricingTiers';
import { PricingFAQ } from '@/features/pricing/components/PricingFAQ';
import { PricingComparison } from '@/features/pricing/components/PricingComparison';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <FoundersBanner />

      {/* Header - clear value prop */}
      <div className="pt-24 pb-12 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start free and join public projects. Upgrade to create unlimited projects and unlock all features.
        </p>
      </div>

      {/* Pricing Tiers */}
      <PricingTiers />

      {/* Feature Comparison Table (Progressive Disclosure) */}
      <PricingComparison />

      {/* FAQ Section */}
      <PricingFAQ />

      {/* Footer CTA */}
      <div className="py-16 bg-gray-50 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Ready to get started?
        </h2>
        <p className="text-gray-600 mb-6">
          Join hundreds of developers creating professional app graphics
        </p>
        <a
          href="#pricing-tiers"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Choose Your Plan
        </a>
      </div>
    </div>
  );
}

// src/App.tsx - add route
<Route path="/pricing" element={<PricingPage />} />
```
  - **Success Criteria:**
    - [ ] Page renders at `/pricing`
    - [ ] Founders banner appears at top
    - [ ] Header clearly explains value prop
    - [ ] All sections present: tiers, comparison, FAQ, footer CTA
    - [ ] Scroll to top on navigation
  - **Tests:**
    1. Navigate to `/pricing`
    2. Should see page with header "Choose Your Plan"
    3. Scroll through all sections
  - **Rollback:** Remove PricingPage.tsx and route from App.tsx
  - **Last Verified:**

### 2.1.2 Create Detailed Pricing Tier Cards
- [ ] **Action:** Create detailed pricing cards with visual hierarchy
  - **Why:** Clear comparison helps users choose the right plan
  - **UX Principle:** Visual hierarchy - Founders tier most prominent
  - **Files Modified:**
    - Create: `src/features/pricing/components/PricingTiers.tsx`
  - **Implementation Details:**
```tsx
// src/features/pricing/components/PricingTiers.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  period?: string;
  originalPrice?: number;
  savings?: string;
  description: string;
  features: Array<{
    text: string;
    included: boolean;
    emphasized?: boolean;
  }>;
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    description: 'Perfect for trying out CollabCanvas',
    features: [
      { text: 'Join public projects', included: true },
      { text: 'All editing tools', included: true },
      { text: 'Export high-res files (PNG, SVG)', included: true },
      { text: 'Real-time collaboration', included: true },
      { text: 'Create your own projects', included: false },
      { text: 'Private projects', included: false },
    ],
    cta: 'Sign Up Free',
  },
  {
    id: 'founders',
    name: 'Founders',
    price: 9.99,
    period: 'year',
    originalPrice: 90,
    savings: 'Save 89%',
    description: 'Limited-time deal for early supporters',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited projects', included: true, emphasized: true },
      { text: 'Public & private projects', included: true },
      { text: 'All templates (icons, graphics, screenshots)', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Lifetime founders price', included: true, emphasized: true },
    ],
    cta: 'Get Started - $9.99',
    highlighted: true,
    badge: '🎯 Best Value - 7 spots left',
  },
];

export function PricingTiers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFreeCTA = () => {
    if (user) {
      navigate('/projects');
    } else {
      navigate('/projects'); // Will trigger auth flow
    }
  };

  return (
    <section id="pricing-tiers" className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'rounded-lg p-8 relative',
                tier.highlighted
                  ? 'border-2 border-blue-500 bg-blue-50 shadow-xl'
                  : 'border-2 border-gray-200 bg-white'
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              {/* Tier Name */}
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {tier.name}
              </h2>

              {/* Price */}
              <div className="mb-6">
                {tier.price === null ? (
                  <>
                    <p className="text-4xl font-bold text-gray-900">$0</p>
                    <p className="text-gray-500">Forever free</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-gray-900">
                      ${tier.price}
                      <span className="text-lg font-normal text-gray-600">
                        /{tier.period}
                      </span>
                    </p>
                    {tier.originalPrice && (
                      <p className="text-gray-600">
                        <span className="line-through">${tier.originalPrice}/{tier.period}</span>
                        {tier.savings && (
                          <span className="ml-2 text-green-600 font-semibold">
                            {tier.savings}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Less than $1/month
                    </p>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6">{tier.description}</p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={cn(
                        feature.included ? 'text-gray-700' : 'text-gray-400',
                        feature.emphasized && 'font-semibold'
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {tier.id === 'free' ? (
                <button
                  onClick={handleFreeCTA}
                  className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  {tier.cta}
                </button>
              ) : (
                <button
                  onClick={() => {/* Will connect to Stripe in Phase 5 */}}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```
  - **Success Criteria:**
    - [ ] Two tiers shown side-by-side on desktop
    - [ ] Founders tier has blue border, blue background, shadow
    - [ ] Free tier has gray border, white background
    - [ ] Price hierarchy: large price > period > original price (strikethrough) > savings (green)
    - [ ] Features use Check (green) / X (gray) icons
    - [ ] Emphasized features are bold ("Unlimited projects", "Lifetime founders price")
    - [ ] CTA buttons visually distinct (gray outline vs blue filled)
    - [ ] Mobile: cards stack vertically
  - **Tests:**
    1. Visit `/pricing`
    2. Founders card should be more visually prominent
    3. Hover over CTA buttons → Should show hover state
    4. Resize to mobile → Cards stack, maintain readability
  - **Edge Cases:**
    - ⚠️ User already subscribed → Show "Current Plan" badge and disable CTA
    - ⚠️ 0 founders spots left → Change badge to "Waitlist Open"
  - **Accessibility:**
    - [ ] Check/X icons have aria-hidden (decorative)
    - [ ] Price amounts in semantic structure
    - [ ] Focus visible on CTA buttons
  - **Last Verified:**

---

*[Continued in next part due to length - this is a comprehensive 89-task plan with Puppeteer tests, UX principles, error handling, and much more detail than the original. Would you like me to continue with the remaining phases?]*
