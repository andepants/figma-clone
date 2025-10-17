# Stripe Payment Integration & Multi-Project System - Implementation Plan

**Project:** CollabCanvas (IconForge rebrand)
**Estimated Time:** 25-30 hours
**Dependencies:** Firebase Auth, Firebase Firestore, Firebase Realtime DB, Stripe account
**Last Updated:** 2025-10-16

---

## Progress Tracker

**Overall Progress:** 0/72 tasks completed (0%)

**Phase Completion:**
- [ ] Phase 0: Research & Planning (0/8)
- [ ] Phase 1: Landing Page Updates (0/8)
- [ ] Phase 2: Pricing Page (0/7)
- [ ] Phase 3: Projects Dashboard (0/12)
- [ ] Phase 4: Database & Types Setup (0/7)
- [ ] Phase 5: Stripe Integration (0/10)
- [ ] Phase 6: Access Control (0/8)
- [ ] Phase 7: Public/Private Projects (0/6)
- [ ] Phase 8: Canvas Isolation (0/6)
- [ ] Final: Integration & Testing (0/0)

---

## Legend

- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Completed and verified
- `[!]` = Blocked (see Blockers section)
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task
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

**Lessons Learned:**
- [To be filled during implementation]

---

# Phase 0: Research & Planning

**Goal:** Document existing patterns and make key technical decisions

## 0.1 Research Existing Codebase

### 0.1.1 Document Current Auth System
- [ ] **Action:** Review and document current Firebase Auth implementation
  - **Why:** Need to understand existing auth flow before adding subscription logic
  - **Files to Review:**
    - `src/lib/firebase/auth.ts`
    - `src/features/auth/components/*`
    - `src/stores/authStore.ts` (if exists)
  - **Success Criteria:**
    - [ ] Document current sign-up flow
    - [ ] Document current sign-in flow
    - [ ] Note where user data is stored
  - **Tests:**
    1. Sign up with new account
    2. Sign in with existing account
    3. Check browser DevTools → Application → IndexedDB for user data
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
  - **Tests:**
    1. Open Firebase Console → Firestore
    2. Open Firebase Console → Realtime Database
    3. Document existing structure
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
  - **Tests:**
    1. Navigate to `/` - should show landing
    2. Navigate to `/canvas` - should show canvas
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
  - **Tests:**
    1. Create object on canvas
    2. Check Firebase RTDB → Should see under `/canvases/main/objects`
  - **Last Verified:**

## 0.2 Design Decisions

### 0.2.1 Define Database Schema
- [ ] **Action:** Design Firestore schema for users and projects
  - **Why:** Clear schema prevents refactoring later
  - **Implementation Details:**
```typescript
// Firestore Schema Design

/users/{userId}
  email: string
  username: string
  subscription: {
    status: 'free' | 'founders' | 'pro'
    stripeCustomerId?: string
    stripePriceId?: string
    currentPeriodEnd?: timestamp
  }
  createdAt: timestamp
  updatedAt: timestamp

/projects/{projectId}
  id: string
  name: string
  ownerId: string (userId)
  template: 'blank' | 'feature-graphic' | 'app-icon'
  isPublic: boolean
  collaborators: string[] (userIds)
  createdAt: timestamp
  updatedAt: timestamp
  thumbnail?: string (base64 or storage URL)

/public-projects/{projectId} (denormalized for quick queries)
  projectId: string
  name: string
  ownerId: string
  ownerUsername: string
  thumbnail?: string
  updatedAt: timestamp
```
  - **Success Criteria:**
    - [ ] Schema documented in this plan
    - [ ] Schema supports free/paid users
    - [ ] Schema supports public/private projects
  - **Edge Cases:**
    - ⚠️ User deletes account → Need to handle orphaned projects
    - ⚠️ Project has no owner → Should never happen, but handle gracefully
  - **Last Verified:**

### 0.2.2 Define TypeScript Types
- [ ] **Action:** Create types for new entities
  - **Why:** Type safety prevents bugs
  - **Files Modified:**
    - Create: `src/types/subscription.types.ts`
    - Create: `src/types/project.types.ts`
  - **Implementation Details:**
```typescript
// src/types/subscription.types.ts
export type SubscriptionStatus = 'free' | 'founders' | 'pro';

export interface Subscription {
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: number; // Unix timestamp
}

export interface User {
  id: string;
  email: string;
  username: string;
  subscription: Subscription;
  createdAt: number;
  updatedAt: number;
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
}

export interface PublicProject {
  projectId: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  thumbnail?: string;
  updatedAt: number;
}
```
  - **Success Criteria:**
    - [ ] All types exported from `@/types`
    - [ ] Types match Firestore schema
  - **Last Verified:**

### 0.2.3 Plan Stripe Products & Prices
- [ ] **Action:** Document Stripe product structure
  - **Why:** Need to create these in Stripe Dashboard
  - **Implementation Details:**
```
Stripe Products:
1. "IconForge Founders Access"
   - Price: $9.99/year (recurring)
   - Metadata: { tier: "founders", maxUsers: "10" }
   - Price ID: price_xxx (get from Stripe)

2. "IconForge Pro" (future)
   - Price 1: $90/year (recurring)
   - Price 2: $10/month (recurring)
   - Metadata: { tier: "pro" }
```
  - **Success Criteria:**
    - [ ] Products documented
    - [ ] Know which price ID to use in checkout
  - **Tests:**
    1. Create products in Stripe Test Mode
    2. Copy price IDs to `.env.local`
  - **Last Verified:**

### 0.2.4 Plan URL Structure
- [ ] **Action:** Define all new routes
  - **Why:** Clear routing prevents conflicts
  - **Implementation Details:**
```
Routes:
/                     → Landing Page (public)
/pricing              → Pricing Page (public)
/projects             → Projects Dashboard (require auth)
/canvas/:projectId    → Canvas Editor (require auth, check access)
/account              → Account Settings (require auth) [future]

Query Params:
/projects?payment=success   → Show success banner
/projects?payment=cancelled → Show cancelled message
```
  - **Success Criteria:**
    - [ ] All routes documented
    - [ ] Auth requirements noted
  - **Last Verified:**

---

# Phase 1: Landing Page Updates (3-4 hours)

**Goal:** Update landing page with founders deal and clear value prop

**Phase Success Criteria:**
- [ ] Landing page shows founders deal banner
- [ ] CTA button goes to pricing page
- [ ] Page is mobile responsive
- [ ] SEO meta tags added

---

## 1.1 Hero Section

### 1.1.1 Update Hero Content
- [ ] **Action:** Rewrite hero section for IconForge branding
  - **Why:** Landing page is first impression
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```tsx
<section className="hero">
  <h1>Design App Icons & Graphics That Convert</h1>
  <p>Professional templates. Simple editor. $9.99/year.</p>
  <div className="cta-buttons">
    <Link to="/pricing" className="btn-primary">
      Get Started Free
    </Link>
    <Link to="#features" className="btn-secondary">
      See Features
    </Link>
  </div>
</section>
```
  - **Success Criteria:**
    - [ ] Headline is "Design App Icons & Graphics That Convert"
    - [ ] CTA button says "Get Started Free"
    - [ ] Button links to `/pricing`
  - **Tests:**
    1. Visit `/`
    2. Click "Get Started Free" → Should go to `/pricing`
  - **Edge Cases:**
    - ⚠️ User already logged in → Should see "Go to Projects" instead
  - **Rollback:** Restore original LandingPage.tsx from git
  - **Last Verified:**

### 1.1.2 Add Founders Deal Banner
- [ ] **Action:** Create sticky banner at top of page
  - **Why:** Urgency drives conversions
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
    - Create: `src/components/common/FoundersBanner.tsx`
  - **Implementation Details:**
```tsx
// src/components/common/FoundersBanner.tsx
export function FoundersBanner({ spotsLeft = 7 }: { spotsLeft?: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <span className="text-sm font-medium">
          🎉 Founders Deal: $9.99/year (reg. $90) - Only {spotsLeft} spots left!
        </span>
        <Link
          to="/pricing"
          className="text-sm underline hover:no-underline"
        >
          Claim Spot →
        </Link>
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Banner sticky at top
    - [ ] Shows remaining spots (hardcoded for now)
    - [ ] "Claim Spot" links to `/pricing`
  - **Tests:**
    1. Visit `/` → Banner visible
    2. Scroll down → Banner stays fixed
    3. Click "Claim Spot" → Go to `/pricing`
  - **Edge Cases:**
    - ⚠️ When 0 spots left → Change text to "Waitlist Open"
  - **Last Verified:**

## 1.2 Features Section

### 1.2.1 Add Features Highlights
- [ ] **Action:** Create features section with 4 key features
  - **Why:** Show value before asking to pay
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```tsx
<section id="features" className="py-16 bg-gray-50">
  <div className="container mx-auto">
    <h2 className="text-3xl font-bold text-center mb-12">
      Everything You Need for App Graphics
    </h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        {
          icon: '📱',
          title: 'App Icon Templates',
          description: 'iOS & Android icon templates with proper sizing'
        },
        {
          icon: '🎨',
          title: 'Feature Graphics',
          description: 'App Store screenshots and feature graphics'
        },
        {
          icon: '🤝',
          title: 'Collaborative',
          description: 'Real-time collaboration with your team'
        },
        {
          icon: '💾',
          title: 'High-Res Export',
          description: 'Export PNG, SVG, and retina files'
        }
      ].map((feature) => (
        <div key={feature.title} className="text-center">
          <div className="text-4xl mb-4">{feature.icon}</div>
          <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
          <p className="text-gray-600 text-sm">{feature.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```
  - **Success Criteria:**
    - [ ] 4 features displayed in grid
    - [ ] Responsive (1 col mobile, 2 tablet, 4 desktop)
  - **Tests:**
    1. Resize browser to mobile → Should stack vertically
    2. Resize to desktop → Should show 4 columns
  - **Last Verified:**

## 1.3 Pricing Teaser

### 1.3.1 Add Pricing Teaser Section
- [ ] **Action:** Show pricing cards (simplified) on landing page
  - **Why:** Let users see price before clicking CTA
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```tsx
<section className="py-16">
  <div className="container mx-auto">
    <h2 className="text-3xl font-bold text-center mb-12">
      Simple, Transparent Pricing
    </h2>
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Free Tier */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2">Free</h3>
        <p className="text-3xl font-bold mb-4">$0</p>
        <ul className="space-y-2 mb-6">
          <li>✓ Join public projects</li>
          <li>✓ Export files</li>
          <li>✗ Create projects</li>
        </ul>
        <Link to="/pricing" className="btn-secondary w-full">
          Sign Up Free
        </Link>
      </div>

      {/* Founders Tier */}
      <div className="border-2 border-blue-500 rounded-lg p-6 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
          Founders Deal
        </div>
        <h3 className="text-xl font-bold mb-2">Founders</h3>
        <p className="text-3xl font-bold mb-1">
          $9.99<span className="text-lg text-gray-500">/year</span>
        </p>
        <p className="text-sm text-gray-500 line-through mb-4">Regular $90</p>
        <ul className="space-y-2 mb-6">
          <li>✓ Unlimited projects</li>
          <li>✓ Public & private</li>
          <li>✓ All templates</li>
          <li>✓ Collaborate</li>
        </ul>
        <Link to="/pricing" className="btn-primary w-full">
          Get Started - $9.99
        </Link>
      </div>
    </div>
  </div>
</section>
```
  - **Success Criteria:**
    - [ ] Free and Founders tiers shown
    - [ ] Founders tier highlighted with border
    - [ ] Prices and features accurate
  - **Tests:**
    1. Verify strikethrough on regular price
    2. Click both CTAs → Should go to `/pricing`
  - **Last Verified:**

---

# Phase 2: Pricing Page (2 hours)

**Goal:** Create dedicated pricing page with clear tiers

**Phase Success Criteria:**
- [ ] Pricing page accessible at `/pricing`
- [ ] Shows Free and Founders tiers
- [ ] Founders tier CTA goes to Stripe checkout (after Phase 5)
- [ ] Free tier CTA goes to sign up

---

## 2.1 Create Pricing Page Component

### 2.1.1 Create Pricing Page Structure
- [ ] **Action:** Create new pricing page with header and tiers
  - **Why:** Dedicated pricing page for clear comparison
  - **Files Modified:**
    - Create: `src/pages/PricingPage.tsx`
    - Update: `src/App.tsx` (add route)
  - **Implementation Details:**
```tsx
// src/pages/PricingPage.tsx
import { Link } from 'react-router-dom';
import { FoundersBanner } from '@/components/common/FoundersBanner';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <FoundersBanner spotsLeft={7} />

      {/* Header */}
      <div className="pt-20 pb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Start free, upgrade when you're ready to create your own projects.
        </p>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Grid will be added in next task */}
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Page renders at `/pricing`
    - [ ] Founders banner appears
    - [ ] Header centered with title
  - **Tests:**
    1. Navigate to `/pricing`
    2. Should see page with header
  - **Rollback:** Remove PricingPage.tsx and route from App.tsx
  - **Last Verified:**

### 2.1.2 Add Pricing Tier Cards
- [ ] **Action:** Create detailed pricing cards
  - **Why:** Clear comparison helps users choose
  - **Files Modified:**
    - Update: `src/pages/PricingPage.tsx`
  - **Implementation Details:**
```tsx
<div className="grid md:grid-cols-2 gap-8">
  {/* Free Tier */}
  <div className="border rounded-lg p-8 bg-white">
    <h2 className="text-2xl font-bold mb-2">Free</h2>
    <div className="mb-6">
      <p className="text-4xl font-bold">$0</p>
      <p className="text-gray-500">Forever free</p>
    </div>

    <ul className="space-y-3 mb-8">
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span>Join public projects</span>
      </li>
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span>Export high-res files</span>
      </li>
      <li className="flex items-start">
        <span className="text-gray-400 mr-2">✗</span>
        <span className="text-gray-400">Create your own projects</span>
      </li>
      <li className="flex items-start">
        <span className="text-gray-400 mr-2">✗</span>
        <span className="text-gray-400">Private projects</span>
      </li>
    </ul>

    <Link
      to="/projects"
      className="block w-full text-center py-3 px-6 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
    >
      Sign Up Free
    </Link>
  </div>

  {/* Founders Tier */}
  <div className="border-2 border-blue-500 rounded-lg p-8 bg-blue-50 relative">
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
      🎯 Founders Deal
    </div>

    <h2 className="text-2xl font-bold mb-2">Founders</h2>
    <div className="mb-6">
      <p className="text-4xl font-bold">
        $9.99<span className="text-lg font-normal text-gray-600">/year</span>
      </p>
      <p className="text-gray-600">
        <span className="line-through">$90/year</span>
        <span className="ml-2 text-green-600 font-semibold">Save 89%</span>
      </p>
      <p className="text-sm text-gray-500 mt-1">Less than $1/month</p>
    </div>

    <ul className="space-y-3 mb-8">
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span>Everything in Free</span>
      </li>
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span><strong>Unlimited projects</strong></span>
      </li>
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span>Public & private projects</span>
      </li>
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span>All templates</span>
      </li>
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span>Real-time collaboration</span>
      </li>
    </ul>

    <button
      onClick={() => {/* Will connect to Stripe in Phase 5 */}}
      className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
    >
      Get Started - $9.99
    </button>

    <p className="text-center text-sm text-gray-600 mt-4">
      Only 7 spots left at this price
    </p>
  </div>
</div>
```
  - **Success Criteria:**
    - [ ] Two cards shown side-by-side on desktop
    - [ ] Founders card highlighted with blue border
    - [ ] All features listed accurately
  - **Tests:**
    1. Compare features → Founders has all Free features plus more
    2. Check responsive → Cards stack on mobile
  - **Edge Cases:**
    - ⚠️ User already has founders tier → Show "Current Plan" badge
  - **Last Verified:**

### 2.1.3 Add FAQ Section
- [ ] **Action:** Add common questions section
  - **Why:** Answer objections before checkout
  - **Files Modified:**
    - Update: `src/pages/PricingPage.tsx`
  - **Implementation Details:**
```tsx
<section className="max-w-3xl mx-auto px-4 py-16">
  <h2 className="text-3xl font-bold text-center mb-8">
    Frequently Asked Questions
  </h2>

  <div className="space-y-6">
    <div>
      <h3 className="font-semibold mb-2">What happens after 10 founders spots are filled?</h3>
      <p className="text-gray-600">The price increases to $90/year or $10/month. Lock in $9.99/year forever by claiming your spot now.</p>
    </div>

    <div>
      <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
      <p className="text-gray-600">Yes, you can cancel anytime. Your projects will remain accessible until the end of your billing period.</p>
    </div>

    <div>
      <h3 className="font-semibold mb-2">What templates are included?</h3>
      <p className="text-gray-600">Blank canvas, app icon templates (iOS & Android), and feature graphic templates for App Store screenshots.</p>
    </div>

    <div>
      <h3 className="font-semibold mb-2">Do free users have full editing features?</h3>
      <p className="text-gray-600">Yes! Free users can join public projects and use all editing tools. Only project creation is limited.</p>
    </div>
  </div>
</section>
```
  - **Success Criteria:**
    - [ ] 4+ FAQs shown
    - [ ] Answers are clear and concise
  - **Tests:**
    1. Read through FAQs → Should address pricing, cancellation, features
  - **Last Verified:**

---

# Phase 3: Projects Dashboard (4-5 hours)

**Goal:** Create projects page that replaces direct canvas access

**Phase Success Criteria:**
- [ ] Projects page accessible at `/projects`
- [ ] Free users see shared projects only
- [ ] Paid users see "My Projects" + templates
- [ ] Can create project from template (paid only)

---

## 3.1 Create Projects Page

### 3.1.1 Create Projects Page Component
- [ ] **Action:** Create projects dashboard page
  - **Why:** Central hub for managing projects
  - **Files Modified:**
    - Create: `src/pages/ProjectsPage.tsx`
    - Update: `src/App.tsx` (add route with auth guard)
  - **Implementation Details:**
```tsx
// src/pages/ProjectsPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function ProjectsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const isPaidUser = user.subscription?.status === 'founders' || user.subscription?.status === 'pro';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">IconForge</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Content will be added in next tasks */}
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Page requires authentication
    - [ ] Shows user email in header
    - [ ] Redirects to landing if not logged in
  - **Tests:**
    1. Sign out → Navigate to `/projects` → Should redirect to `/`
    2. Sign in → Navigate to `/projects` → Should show projects page
  - **Edge Cases:**
    - ⚠️ User signs out while on page → Should redirect immediately
  - **Last Verified:**

### 3.1.2 Add "My Projects" Section (Paid Users)
- [ ] **Action:** Show user's projects if paid user
  - **Why:** Paid users need to access their projects
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
    - Create: `src/features/projects/components/ProjectCard.tsx`
  - **Implementation Details:**
```tsx
// In ProjectsPage.tsx
{isPaidUser && (
  <section className="mb-12">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold">My Projects</h2>
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <span>+</span>
        <span>New Project</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {userProjects.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500">
          <p>No projects yet. Create one to get started!</p>
        </div>
      ) : (
        userProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))
      )}
    </div>
  </section>
)}

// src/features/projects/components/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/canvas/${project.id}`)}
      className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow bg-white"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover rounded" />
        ) : (
          <span className="text-gray-400">No preview</span>
        )}
      </div>

      {/* Project Info */}
      <h3 className="font-semibold mb-1 truncate">{project.name}</h3>
      <p className="text-xs text-gray-500">
        Updated {new Date(project.updatedAt).toLocaleDateString()}
      </p>

      {/* Public/Private Badge */}
      {project.isPublic && (
        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          🌐 Public
        </span>
      )}
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] My Projects section only shows for paid users
    - [ ] Projects displayed in grid
    - [ ] Empty state shows when no projects
    - [ ] Click project → Navigate to canvas
  - **Tests:**
    1. Sign in as free user → Should NOT see "My Projects"
    2. Sign in as paid user → Should see "My Projects" section
    3. Click project card → Should navigate to `/canvas/:id`
  - **Last Verified:**

### 3.1.3 Add Templates Section (Paid Users)
- [ ] **Action:** Show template options for project creation
  - **Why:** Quick start for new projects
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```tsx
{isPaidUser && (
  <section className="mb-12">
    <h2 className="text-2xl font-bold mb-6">Start from Template</h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        {
          id: 'blank',
          name: 'Blank Canvas',
          description: 'Start with an empty canvas',
          icon: '📄',
          template: 'blank' as const
        },
        {
          id: 'feature-graphic',
          name: 'Feature Graphic',
          description: 'App Store screenshot template',
          icon: '📱',
          template: 'feature-graphic' as const
        },
        {
          id: 'app-icon',
          name: 'App Icon',
          description: 'iOS & Android icon template',
          icon: '🎨',
          template: 'app-icon' as const
        }
      ].map((template) => (
        <button
          key={template.id}
          onClick={() => handleCreateFromTemplate(template.template)}
          className="border-2 border-dashed rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="text-4xl mb-3">{template.icon}</div>
          <h3 className="font-semibold mb-1">{template.name}</h3>
          <p className="text-sm text-gray-600">{template.description}</p>
        </button>
      ))}
    </div>
  </section>
)}
```
  - **Success Criteria:**
    - [ ] 3 template cards shown
    - [ ] Only visible to paid users
    - [ ] Click template → Create project (will implement in next phase)
  - **Tests:**
    1. Sign in as paid user → Should see template section
    2. Hover over template → Should highlight
  - **Last Verified:**

### 3.1.4 Add Shared Projects Section (All Users)
- [ ] **Action:** Show public projects (free and paid can see)
  - **Why:** Free users need access to public projects
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```tsx
<section className="mb-12">
  <h2 className="text-2xl font-bold mb-6">Shared Projects</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {publicProjects.length === 0 ? (
      <div className="col-span-full text-center py-12 text-gray-500">
        <p>No public projects yet.</p>
      </div>
    ) : (
      publicProjects.map((project) => (
        <ProjectCard key={project.projectId} project={project} />
      ))
    )}
  </div>
</section>
```
  - **Success Criteria:**
    - [ ] Shared projects visible to all users
    - [ ] Shows public projects from `/public-projects` collection
    - [ ] Empty state when no public projects
  - **Tests:**
    1. Sign in as free user → Should see shared projects
    2. Sign in as paid user → Should also see shared projects
  - **Last Verified:**

### 3.1.5 Add Upgrade Prompt (Free Users)
- [ ] **Action:** Show upgrade prompt when free user tries to create project
  - **Why:** Convert free users to paid
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
    - Create: `src/components/common/UpgradeModal.tsx`
  - **Implementation Details:**
```tsx
// src/components/common/UpgradeModal.tsx
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">Upgrade to Create Projects</h2>

        <p className="text-gray-600 mb-6">
          Free users can join public projects, but need Founders access to create their own.
        </p>

        <ul className="space-y-2 mb-6">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Unlimited projects</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Public & private options</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>All templates</span>
          </li>
        </ul>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-center">
            <span className="text-2xl font-bold">$9.99/year</span>
            <span className="text-gray-600 ml-2 line-through">$90/year</span>
          </p>
          <p className="text-center text-sm text-gray-600 mt-1">
            Founders deal - Only 7 spots left
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

// In ProjectsPage.tsx (for free users)
{!isPaidUser && (
  <section className="mb-12">
    <div className="border-2 border-dashed rounded-lg p-12 text-center">
      <h2 className="text-2xl font-bold mb-3">Create Your Own Projects</h2>
      <p className="text-gray-600 mb-6">
        Upgrade to Founders access to create unlimited projects
      </p>
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Upgrade to Create Projects
      </button>
    </div>
  </section>
)}
```
  - **Success Criteria:**
    - [ ] Free users see upgrade prompt instead of "My Projects"
    - [ ] Modal shows pricing and benefits
    - [ ] "Upgrade Now" goes to pricing page
  - **Tests:**
    1. Sign in as free user → Should see upgrade prompt
    2. Click "Upgrade to Create Projects" → Modal appears
    3. Click "Upgrade Now" → Navigate to `/pricing`
  - **Last Verified:**

---

# Phase 4: Database & Types Setup (2-3 hours)

**Goal:** Set up Firestore collections and TypeScript types

**Phase Success Criteria:**
- [ ] User documents created on signup
- [ ] Project CRUD functions working
- [ ] Types exported from `@/types`

---

## 4.1 Create Database Services

### 4.1.1 Create User Service
- [ ] **Action:** Create Firestore service for user operations
  - **Why:** Centralize user database logic
  - **Files Modified:**
    - Create: `src/lib/firebase/userService.ts`
  - **Implementation Details:**
```typescript
// src/lib/firebase/userService.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './config';
import type { User, Subscription } from '@/types/subscription.types';

/**
 * Create user document in Firestore after signup
 */
export async function createUserDocument(
  userId: string,
  email: string,
  username: string
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);

  const userData: User = {
    id: userId,
    email,
    username,
    subscription: {
      status: 'free', // Default to free
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(userRef, userData);
}

/**
 * Get user document from Firestore
 */
export async function getUserDocument(userId: string): Promise<User | null> {
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as User;
}

/**
 * Update user subscription status after payment
 */
export async function updateUserSubscription(
  userId: string,
  subscription: Subscription
): Promise<void> {
  const userRef = doc(firestore, 'users', userId);

  await updateDoc(userRef, {
    subscription,
    updatedAt: Date.now(),
  });
}
```
  - **Success Criteria:**
    - [ ] Can create user document
    - [ ] Can fetch user document
    - [ ] Can update subscription
  - **Tests:**
    1. Call `createUserDocument` → Check Firestore console
    2. Call `getUserDocument` → Should return user data
    3. Call `updateUserSubscription` → Should update subscription field
  - **Edge Cases:**
    - ⚠️ User already exists → Should not overwrite
    - ⚠️ Firestore offline → Should throw error
  - **Rollback:** Delete userService.ts
  - **Last Verified:**

### 4.1.2 Create Project Service
- [ ] **Action:** Create Firestore service for project operations
  - **Why:** Centralize project CRUD logic
  - **Files Modified:**
    - Create: `src/lib/firebase/projectService.ts`
  - **Implementation Details:**
```typescript
// src/lib/firebase/projectService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from './config';
import type { Project, PublicProject, ProjectTemplate } from '@/types/project.types';

/**
 * Create new project
 */
export async function createProject(
  ownerId: string,
  name: string,
  template: ProjectTemplate
): Promise<Project> {
  const projectId = crypto.randomUUID();
  const projectRef = doc(firestore, 'projects', projectId);

  const project: Project = {
    id: projectId,
    name,
    ownerId,
    template,
    isPublic: false, // Default to private
    collaborators: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(projectRef, project);
  return project;
}

/**
 * Get all projects owned by user
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  const projectsRef = collection(firestore, 'projects');
  const q = query(projectsRef, where('ownerId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as Project);
}

/**
 * Get single project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectRef = doc(firestore, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    return null;
  }

  return projectSnap.data() as Project;
}

/**
 * Update project (e.g., toggle public/private)
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<void> {
  const projectRef = doc(firestore, 'projects', projectId);

  await updateDoc(projectRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = doc(firestore, 'projects', projectId);
  await deleteDoc(projectRef);

  // Also remove from public-projects if it was public
  try {
    const publicRef = doc(firestore, 'public-projects', projectId);
    await deleteDoc(publicRef);
  } catch {
    // Ignore if not in public-projects
  }
}

/**
 * Get all public projects
 */
export async function getPublicProjects(): Promise<PublicProject[]> {
  const publicProjectsRef = collection(firestore, 'public-projects');
  const snapshot = await getDocs(publicProjectsRef);

  return snapshot.docs.map((doc) => doc.data() as PublicProject);
}

/**
 * Add project to public-projects collection
 */
export async function addToPublicProjects(
  project: Project,
  ownerUsername: string
): Promise<void> {
  const publicRef = doc(firestore, 'public-projects', project.id);

  const publicProject: PublicProject = {
    projectId: project.id,
    name: project.name,
    ownerId: project.ownerId,
    ownerUsername,
    thumbnail: project.thumbnail,
    updatedAt: project.updatedAt,
  };

  await setDoc(publicRef, publicProject);
}

/**
 * Remove project from public-projects collection
 */
export async function removeFromPublicProjects(projectId: string): Promise<void> {
  const publicRef = doc(firestore, 'public-projects', projectId);
  await deleteDoc(publicRef);
}
```
  - **Success Criteria:**
    - [ ] Can create project
    - [ ] Can fetch user's projects
    - [ ] Can update project
    - [ ] Can delete project
    - [ ] Public projects CRUD works
  - **Tests:**
    1. Create project → Check Firestore console
    2. Get user projects → Should return array
    3. Update project → Should change in Firestore
    4. Delete project → Should remove from Firestore
  - **Edge Cases:**
    - ⚠️ Delete public project → Should remove from both collections
    - ⚠️ Get projects for user with none → Should return empty array
  - **Last Verified:**

### 4.1.3 Update Auth Flow to Create User Document
- [ ] **Action:** Call `createUserDocument` after sign up
  - **Why:** User documents needed for subscription tracking
  - **Files Modified:**
    - Update: `src/lib/firebase/auth.ts`
  - **Implementation Details:**
```typescript
// In signUpWithEmail function
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update user profile with display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });

    // Create user document in Firestore
    const { createUserDocument } = await import('./userService');
    await createUserDocument(userCredential.user.uid, email, displayName);
  }

  return userCredential;
}
```
  - **Success Criteria:**
    - [ ] Sign up creates Firestore user document
    - [ ] User document has default 'free' status
  - **Tests:**
    1. Sign up new user
    2. Check Firestore → `/users/{userId}` should exist
    3. Verify `subscription.status` is `'free'`
  - **Edge Cases:**
    - ⚠️ Firestore fails after Auth succeeds → User can still sign in but has no document (handle in useAuth hook)
  - **Last Verified:**

---

# Phase 5: Stripe Integration (3-4 hours)

**Goal:** Integrate Stripe checkout and webhooks

**Phase Success Criteria:**
- [ ] Stripe checkout works from pricing page
- [ ] Payment success updates user subscription
- [ ] Webhook handles subscription events
- [ ] User redirected to projects after payment

---

## 5.1 Stripe Setup

### 5.1.1 Create Stripe Products in Dashboard
- [ ] **Action:** Set up products in Stripe Test Mode
  - **Why:** Need product and price IDs for checkout
  - **Success Criteria:**
    - [ ] "IconForge Founders Access" product created
    - [ ] $9.99/year price created
    - [ ] Price ID copied to `.env.local`
  - **Tests:**
    1. Login to Stripe Dashboard (Test Mode)
    2. Products → Create product
    3. Copy price ID (starts with `price_`)
    4. Add to `.env.local` as `VITE_STRIPE_FOUNDERS_PRICE_ID`
  - **Edge Cases:**
    - ⚠️ Accidentally use live mode → Always use test mode for development
  - **Last Verified:**

### 5.1.2 Install Stripe Dependencies
- [ ] **Action:** Install Stripe libraries
  - **Why:** Need Stripe SDK for checkout
  - **Files Modified:**
    - Update: `package.json`
  - **Implementation Details:**
```bash
npm install @stripe/stripe-js
```
  - **Success Criteria:**
    - [ ] `@stripe/stripe-js` in dependencies
    - [ ] No build errors
  - **Tests:**
    1. Run `npm install`
    2. Import Stripe in a file → No TypeScript errors
  - **Last Verified:**

### 5.1.3 Create Stripe Service
- [ ] **Action:** Create client-side Stripe checkout service
  - **Why:** Handle checkout redirect from pricing page
  - **Files Modified:**
    - Create: `src/lib/stripe/checkout.ts`
    - Create: `.env.local` (if not exists)
  - **Implementation Details:**
```typescript
// src/lib/stripe/checkout.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Redirect to Stripe Checkout
 * @param priceId - Stripe price ID
 * @param userEmail - User's email (pre-fill checkout)
 * @param userId - User ID (pass to success URL)
 */
export async function redirectToCheckout(
  priceId: string,
  userEmail: string,
  userId: string
): Promise<void> {
  const stripe = await stripePromise;

  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  // In production, this would call your backend to create a checkout session
  // For now, we'll use Stripe's client-only checkout (requires setup in Stripe Dashboard)

  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/projects?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
    customerEmail: userEmail,
    clientReferenceId: userId, // Pass user ID to webhook
  });

  if (error) {
    throw error;
  }
}
```

```bash
# .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_FOUNDERS_PRICE_ID=price_xxx
```
  - **Success Criteria:**
    - [ ] Stripe loads without errors
    - [ ] Can call `redirectToCheckout`
  - **Tests:**
    1. Call `redirectToCheckout` with test price ID
    2. Should redirect to Stripe hosted checkout page
  - **Edge Cases:**
    - ⚠️ Stripe fails to load → Show error message
    - ⚠️ User closes checkout → Redirect to cancel URL
  - **Last Verified:**

### 5.1.4 Connect Pricing Page to Stripe
- [ ] **Action:** Wire up "Get Started" button to Stripe checkout
  - **Why:** Enable users to actually pay
  - **Files Modified:**
    - Update: `src/pages/PricingPage.tsx`
  - **Implementation Details:**
```tsx
import { redirectToCheckout } from '@/lib/stripe/checkout';
import { useAuth } from '@/features/auth/hooks/useAuth';

function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleFoundersCheckout() {
    if (!user) {
      // Redirect to sign up first
      navigate('/projects'); // Will show sign up flow
      return;
    }

    setLoading(true);
    try {
      await redirectToCheckout(
        import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID,
        user.email,
        user.id
      );
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    // ... existing code ...

    <button
      onClick={handleFoundersCheckout}
      disabled={loading}
      className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Get Started - $9.99'}
    </button>
  );
}
```
  - **Success Criteria:**
    - [ ] Click "Get Started" → Redirects to Stripe checkout
    - [ ] User email pre-filled in checkout
    - [ ] Button shows loading state
  - **Tests:**
    1. Click "Get Started" as logged-in user → Should go to Stripe
    2. Click "Get Started" as logged-out user → Should prompt sign up
    3. Complete test payment → Should redirect back to `/projects?payment=success`
  - **Edge Cases:**
    - ⚠️ User already subscribed → Show "Current Plan" instead of checkout button
  - **Last Verified:**

## 5.2 Webhook & Payment Success

### 5.2.1 Handle Payment Success (Client-Side)
- [ ] **Action:** Update UI when user returns from successful payment
  - **Why:** Show confirmation and update subscription status
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```tsx
function ProjectsPage() {
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus === 'success') {
      // Show success message
      // TODO: In production, verify session_id with backend before trusting

      // For now, poll Firestore for updated subscription
      const sessionId = searchParams.get('session_id');
      if (sessionId && user) {
        // Poll for subscription update (webhook may take a few seconds)
        const interval = setInterval(async () => {
          const { getUserDocument } = await import('@/lib/firebase/userService');
          const updatedUser = await getUserDocument(user.id);

          if (updatedUser?.subscription.status !== 'free') {
            // Subscription updated!
            clearInterval(interval);
            window.location.href = '/projects'; // Refresh to clear query params
          }
        }, 2000);

        // Stop polling after 30 seconds
        setTimeout(() => clearInterval(interval), 30000);
      }
    }
  }, [paymentStatus, user]);

  return (
    <div>
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <p className="text-green-800 font-semibold">
            🎉 Payment successful! Your account is being upgraded...
          </p>
        </div>
      )}

      {/* ... rest of page ... */}
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Success banner shows on redirect
    - [ ] Subscription updates after webhook fires
    - [ ] User can create projects after payment
  - **Tests:**
    1. Complete test payment
    2. Return to `/projects?payment=success`
    3. Should see success banner
    4. Wait 5-10 seconds → Subscription should update
  - **Edge Cases:**
    - ⚠️ Webhook fails → User paid but still shows as free (handle manually or retry)
  - **Last Verified:**

### 5.2.2 Create Webhook Endpoint (Backend)
- [ ] **Action:** Create serverless function to handle Stripe webhooks
  - **Why:** Update user subscription in Firestore after payment
  - **Files Modified:**
    - Create: `functions/src/stripe-webhook.ts` (if using Firebase Functions)
    - Or create backend API endpoint
  - **Implementation Details:**
```typescript
// Example using Firebase Cloud Functions
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { firestore } from './firebase-admin';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; // User ID passed from checkout

    if (userId) {
      // Update user subscription in Firestore
      await firestore.collection('users').doc(userId).update({
        'subscription.status': 'founders',
        'subscription.stripeCustomerId': session.customer,
        'subscription.currentPeriodEnd': Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
        updatedAt: Date.now(),
      });
    }
  }

  res.json({ received: true });
});
```
  - **Success Criteria:**
    - [ ] Webhook endpoint deployed
    - [ ] Webhook URL added to Stripe Dashboard
    - [ ] Webhook updates user subscription on payment
  - **Tests:**
    1. Complete test payment
    2. Check Stripe Dashboard → Webhooks → Should see successful delivery
    3. Check Firestore → User subscription should be 'founders'
  - **Edge Cases:**
    - ⚠️ Webhook fails → Retry automatically (Stripe retries failed webhooks)
    - ⚠️ Multiple webhook deliveries → Make endpoint idempotent
  - **Last Verified:**

---

# Phase 6: Access Control (2 hours)

**Goal:** Enforce free vs paid access rules

**Phase Success Criteria:**
- [ ] Free users cannot create projects
- [ ] Free users can join public projects
- [ ] Paid users can create unlimited projects
- [ ] Canvas page checks project access

---

## 6.1 Project Creation Guards

### 6.1.1 Add Subscription Check to Project Creation
- [ ] **Action:** Verify user is paid before creating project
  - **Why:** Enforce access control
  - **Files Modified:**
    - Update: `src/lib/firebase/projectService.ts`
  - **Implementation Details:**
```typescript
/**
 * Create new project (requires paid subscription)
 */
export async function createProject(
  ownerId: string,
  ownerSubscription: SubscriptionStatus,
  name: string,
  template: ProjectTemplate
): Promise<Project> {
  // Check subscription status
  if (ownerSubscription === 'free') {
    throw new Error('Paid subscription required to create projects');
  }

  // ... rest of createProject logic ...
}
```
  - **Success Criteria:**
    - [ ] Free users get error when trying to create project
    - [ ] Paid users can create projects
  - **Tests:**
    1. Try to create project as free user → Should throw error
    2. Create project as paid user → Should succeed
  - **Last Verified:**

### 6.1.2 Add UI Guards in Projects Page
- [ ] **Action:** Hide/disable create buttons for free users
  - **Why:** Prevent free users from attempting creation
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```tsx
const isPaidUser = user?.subscription.status === 'founders' || user?.subscription.status === 'pro';

// Only show "New Project" button to paid users
{isPaidUser && (
  <button onClick={handleCreateProject}>
    + New Project
  </button>
)}

// Only show templates to paid users
{isPaidUser && (
  <section>
    <h2>Start from Template</h2>
    {/* ... templates ... */}
  </section>
)}

// Show upgrade prompt to free users
{!isPaidUser && (
  <UpgradePrompt />
)}
```
  - **Success Criteria:**
    - [ ] Free users don't see create buttons
    - [ ] Free users see upgrade prompt
    - [ ] Paid users see all creation options
  - **Tests:**
    1. Sign in as free → Should NOT see create buttons
    2. Sign in as paid → Should see create buttons
  - **Last Verified:**

## 6.2 Canvas Access Control

### 6.2.1 Add Canvas Access Check
- [ ] **Action:** Verify user can access project before loading canvas
  - **Why:** Prevent unauthorized access to private projects
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx`
  - **Implementation Details:**
```tsx
function CanvasPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      if (!projectId || !user) return;

      const { getProject } = await import('@/lib/firebase/projectService');
      const proj = await getProject(projectId);

      if (!proj) {
        setAccessDenied(true);
        return;
      }

      // Check access: owner, collaborator, or public project
      const hasAccess =
        proj.ownerId === user.id ||
        proj.collaborators.includes(user.id) ||
        proj.isPublic;

      if (!hasAccess) {
        setAccessDenied(true);
        return;
      }

      setProject(proj);
    }

    checkAccess();
  }, [projectId, user]);

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to view this project.
          </p>
          <Link to="/projects" className="text-blue-600 hover:underline">
            Go to Projects
          </Link>
        </div>
      </div>
    );
  }

  // ... rest of canvas page ...
}
```
  - **Success Criteria:**
    - [ ] Owner can access their private projects
    - [ ] Anyone can access public projects
    - [ ] Non-owners cannot access private projects
  - **Tests:**
    1. Create private project as User A
    2. Sign in as User B → Navigate to `/canvas/{projectId}`
    3. Should see "Access Denied"
    4. Toggle project to public
    5. User B should now have access
  - **Edge Cases:**
    - ⚠️ Project doesn't exist → Show 404 instead of access denied
    - ⚠️ User not logged in → Redirect to sign in
  - **Last Verified:**

---

# Phase 7: Public/Private Projects (3 hours)

**Goal:** Add public/private toggle and shared projects functionality

**Phase Success Criteria:**
- [ ] Owner can toggle project public/private
- [ ] Public projects appear in "Shared Projects"
- [ ] Private projects only visible to owner

---

## 7.1 Public/Private Toggle

### 7.1.1 Add Toggle to Canvas Toolbar
- [ ] **Action:** Add public/private dropdown to canvas header
  - **Why:** Owner needs way to change visibility
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx`
    - Create: `src/components/canvas/PublicPrivateToggle.tsx`
  - **Implementation Details:**
```tsx
// src/components/canvas/PublicPrivateToggle.tsx
interface PublicPrivateToggleProps {
  project: Project;
  isOwner: boolean;
}

export function PublicPrivateToggle({ project, isOwner }: PublicPrivateToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOwner) {
    // Non-owners just see badge
    return (
      <div className="text-sm text-gray-600">
        {project.isPublic ? '🌐 Public' : '🔒 Private'}
      </div>
    );
  }

  async function handleToggle(makePublic: boolean) {
    const { updateProject, addToPublicProjects, removeFromPublicProjects } = await import('@/lib/firebase/projectService');
    const { getUserDocument } = await import('@/lib/firebase/userService');

    // Update project
    await updateProject(project.id, { isPublic: makePublic });

    if (makePublic) {
      // Add to public-projects collection
      const owner = await getUserDocument(project.ownerId);
      if (owner) {
        await addToPublicProjects(project, owner.username);
      }
    } else {
      // Remove from public-projects collection
      await removeFromPublicProjects(project.id);
    }

    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-gray-50"
      >
        <span className="text-sm">
          {project.isPublic ? '🌐 Public' : '🔒 Private'}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border rounded shadow-lg w-48 z-50">
          <button
            onClick={() => handleToggle(true)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            <div className="font-medium">🌐 Public</div>
            <div className="text-xs text-gray-500">Anyone can view</div>
          </button>
          <button
            onClick={() => handleToggle(false)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            <div className="font-medium">🔒 Private</div>
            <div className="text-xs text-gray-500">Only you can view</div>
          </button>
        </div>
      )}
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Owner sees dropdown with toggle
    - [ ] Non-owner sees read-only badge
    - [ ] Toggle updates project and public-projects collection
  - **Tests:**
    1. Open project as owner → Should see dropdown
    2. Toggle to public → Project added to public-projects
    3. Toggle to private → Project removed from public-projects
    4. Open project as non-owner → Should see badge only
  - **Last Verified:**

### 7.1.2 Real-time Public Projects Query
- [ ] **Action:** Subscribe to public projects in ProjectsPage
  - **Why:** Show live updates when projects made public
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```tsx
function ProjectsPage() {
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    // Subscribe to public projects
    const { onSnapshot, collection } = await import('firebase/firestore');
    const { firestore } = await import('@/lib/firebase/config');

    const unsubscribe = onSnapshot(
      collection(firestore, 'public-projects'),
      (snapshot) => {
        const projects = snapshot.docs.map((doc) => doc.data() as PublicProject);
        // Sort by most recently updated
        projects.sort((a, b) => b.updatedAt - a.updatedAt);
        setPublicProjects(projects);
      }
    );

    return () => unsubscribe();
  }, []);

  // ... rest of component ...
}
```
  - **Success Criteria:**
    - [ ] Public projects update in real-time
    - [ ] Sorted by most recent first
  - **Tests:**
    1. Open two browser windows (different users)
    2. User A toggles project to public
    3. User B's shared projects should update immediately
  - **Last Verified:**

---

# Phase 8: Canvas Isolation (5-6 hours)

**Goal:** Change canvas from hardcoded 'main' to dynamic project ID

**Phase Success Criteria:**
- [ ] Canvas loads objects from `/canvases/{projectId}/objects`
- [ ] Each project has isolated canvas data
- [ ] Old 'main' canvas data migrated or ignored

---

## 8.1 Update Canvas Services

### 8.1.1 Add Project ID Parameter to Canvas Service
- [ ] **Action:** Update realtimeCanvasService to accept project ID
  - **Why:** Load different canvas per project
  - **Files Modified:**
    - Update: `src/lib/firebase/realtimeCanvasService.ts`
  - **Implementation Details:**
```typescript
// Change all functions to accept canvasId parameter

/**
 * Subscribe to canvas objects
 * @param canvasId - Project ID (replaces hardcoded 'main')
 */
export function subscribeToCanvasObjects(
  canvasId: string,
  callback: (objects: CanvasObject[]) => void
): () => void {
  const objectsRef = ref(realtimeDB, `canvases/${canvasId}/objects`);

  // ... rest of function ...
}

// Update all other functions similarly:
// - addCanvasObject(canvasId, object)
// - updateCanvasObject(canvasId, objectId, updates)
// - removeCanvasObject(canvasId, objectId)
// - syncZIndexes(canvasId, objects)
// - batchUpdateCanvasObjects(canvasId, updates)
```
  - **Success Criteria:**
    - [ ] All canvas service functions accept `canvasId` param
    - [ ] No hardcoded 'main' references
  - **Tests:**
    1. Search codebase for hardcoded 'main' strings
    2. All canvas operations should use dynamic `canvasId`
  - **Rollback:** Restore original file from git
  - **Last Verified:**

### 8.1.2 Update Canvas Store to Use Project ID
- [ ] **Action:** Pass project ID to canvas operations
  - **Why:** Store needs to know which canvas to sync to
  - **Files Modified:**
    - Update: `src/stores/canvasStore.ts`
  - **Implementation Details:**
```typescript
// Add canvasId to store state
interface CanvasState {
  canvasId: string | null; // Current project ID
  objects: CanvasObject[];
  // ... rest of state ...
}

// Add action to set canvas ID
interface CanvasActions {
  setCanvasId: (id: string) => void;
  // ... rest of actions ...
}

// Update all Firebase sync calls to use canvasId
toggleVisibility: (id) => {
  const state = useCanvasStore.getState();
  const canvasId = state.canvasId;
  if (!canvasId) return; // Guard against no canvas loaded

  // ... rest of function ...

  import('@/lib/firebase').then(async ({ updateCanvasObject }) => {
    await updateCanvasObject(canvasId, id, { visible: newVisible });
  });
}

// Update all other actions similarly
```
  - **Success Criteria:**
    - [ ] Store tracks current canvas ID
    - [ ] All Firebase operations use canvas ID from store
  - **Tests:**
    1. Set canvas ID → All operations use correct ID
    2. Check Firebase RTDB → Objects saved under `/canvases/{projectId}/objects`
  - **Last Verified:**

### 8.1.3 Update Canvas Page to Load Project
- [ ] **Action:** Load canvas data based on project ID from URL
  - **Why:** Connect URL to canvas data
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx`
  - **Implementation Details:**
```tsx
function CanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { setCanvasId } = useCanvasStore();

  useEffect(() => {
    if (projectId) {
      // Set canvas ID in store
      setCanvasId(projectId);

      // Subscribe to canvas objects for this project
      const { subscribeToCanvasObjects } = await import('@/lib/firebase/realtimeCanvasService');
      const { setObjects } = useCanvasStore.getState();

      const unsubscribe = subscribeToCanvasObjects(projectId, (objects) => {
        setObjects(objects);
      });

      return () => {
        unsubscribe();
        setCanvasId(null); // Clear canvas ID on unmount
      };
    }
  }, [projectId, setCanvasId]);

  // ... rest of component ...
}
```
  - **Success Criteria:**
    - [ ] Canvas loads objects from correct project
    - [ ] Creating objects saves to correct project
    - [ ] Different projects have isolated canvases
  - **Tests:**
    1. Create Project A → Add rectangle
    2. Create Project B → Canvas should be empty
    3. Return to Project A → Rectangle should still be there
    4. Check Firebase → `/canvases/projectA/objects` and `/canvases/projectB/objects` separate
  - **Last Verified:**

---

# Final Integration & Testing

**Goal:** Verify entire flow works end-to-end

## Integration Tests

### End-to-End User Flows

- [ ] **Flow 1: New Free User**
  - **Scenario:**
    1. Visit landing page
    2. Click "Get Started Free"
    3. Sign up with email/password
    4. Land on projects page
    5. See "Shared Projects" section
    6. Click "Create Project" → Upgrade modal appears
    7. Click "Upgrade Now" → Go to pricing
    8. Complete payment
    9. Return to projects
    10. Can now create projects
  - **Expected:** All steps complete without errors
  - **Test Data:** test-user@example.com / password123

- [ ] **Flow 2: New Paid User (Direct)**
  - **Scenario:**
    1. Visit landing page
    2. Click pricing link
    3. Click "Get Started" on Founders tier
    4. Sign up with email/password
    5. Redirected to Stripe checkout
    6. Complete payment
    7. Redirected to projects page
    8. See empty state with templates
    9. Click template → Create project
    10. Land on canvas page
  - **Expected:** Can create project immediately after payment

- [ ] **Flow 3: Free User Joins Public Project**
  - **Scenario:**
    1. User A creates public project
    2. User B (free) signs in
    3. Sees project in "Shared Projects"
    4. Clicks project → Opens canvas
    5. Can edit and collaborate
    6. Cannot toggle public/private
  - **Expected:** Free user can view and edit public projects

- [ ] **Flow 4: Paid User Creates & Toggles Project**
  - **Scenario:**
    1. Paid user on projects page
    2. Click "Blank Canvas" template
    3. Enter name → Create
    4. Land on canvas page
    5. Canvas is private by default
    6. Toggle to public
    7. Project appears in shared projects
    8. Toggle back to private
    9. Project removed from shared projects
  - **Expected:** Toggle works bidirectionally

## Performance Tests

- [ ] **Canvas Load Time**
  - **Metric:** Time to first render
  - **Target:** < 1 second for empty canvas
  - **How to Test:**
    1. Open DevTools → Network tab
    2. Navigate to `/canvas/{projectId}`
    3. Measure time to interactive
  - **Expected:** Fast initial load

- [ ] **Project List Query**
  - **Metric:** Time to load projects list
  - **Target:** < 500ms for 100 projects
  - **How to Test:**
    1. Create 100+ test projects
    2. Measure Firestore query time
  - **Expected:** Responsive UI even with many projects

## Accessibility Tests

- [ ] **Keyboard Navigation**
  - **Test:** Tab through pricing page
  - **Expected:** All interactive elements focusable

- [ ] **Screen Reader**
  - **Test:** Use VoiceOver/NVDA on projects page
  - **Expected:** All content readable

- [ ] **Color Contrast**
  - **Test:** Check all text against backgrounds
  - **Tool:** Use Chrome DevTools Lighthouse
  - **Expected:** AAA rating on all text

---

# Deployment Checklist

- [ ] All tasks completed and verified
- [ ] All tests passing
- [ ] No console errors in browser
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Mobile responsive verified
- [ ] Stripe webhook endpoint deployed
- [ ] Environment variables set in production:
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
  - [ ] `VITE_STRIPE_FOUNDERS_PRICE_ID`
  - [ ] Stripe webhook secret configured in backend
- [ ] Firebase security rules updated:
  - [ ] `/users/{userId}` readable by owner only
  - [ ] `/projects/{projectId}` readable by owner/collaborators
  - [ ] `/public-projects` readable by anyone
  - [ ] `/canvases/{projectId}` writable by authorized users
- [ ] Commit message written
- [ ] PR created with description
- [ ] Documentation updated:
  - [ ] README with new user flow
  - [ ] Setup guide for Stripe integration

---

# Appendix

## Related Documentation

- Stripe Checkout Docs: https://stripe.com/docs/payments/checkout
- Firebase Auth: https://firebase.google.com/docs/auth
- Firebase Firestore: https://firebase.google.com/docs/firestore
- Firebase Realtime DB: https://firebase.google.com/docs/database

## Future Enhancements

- Email notifications for payment confirmations
- Project thumbnails (auto-generate from canvas)
- Collaboration features (invite by email)
- Usage analytics (projects created, exports, etc.)
- Pro tier implementation ($90/year or $10/month)
- Team accounts (multiple users under one subscription)
- Template marketplace
- Export history

## Time Log

| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| 2025-10-16 | Planning | 1 hour | Created implementation plan |
| | | | |
| | | | |
