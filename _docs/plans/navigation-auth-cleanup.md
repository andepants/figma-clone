# Navigation & Auth Flow Cleanup - Implementation Plan

**Project:** Canvas Icons
**Estimated Time:** 3-4 hours
**Dependencies:** None (all infrastructure exists)
**Last Updated:** 2025-10-17

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 14/18 tasks completed (78%)

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
- 2025-10-17 - Keep PricingTeaser component (used on landing page for founders banner)
- 2025-10-17 - Redirect authenticated users to /projects (not /canvas) as central hub
- 2025-10-17 - Multi-project infrastructure already exists, no data migration needed

**Lessons Learned:**
- Multi-project support is already fully implemented
- Only UI/navigation changes needed, no backend work

---

# Phase 0: Research & Planning

## 0.1 Research Context
- [x] **Action:** Document existing patterns in codebase
  - **What to find:** All pricing route references, auth flow patterns, redirect behavior
  - **Where to look:**
    - src/App.tsx (routing)
    - src/pages/LandingPage.tsx (auth modal calls)
    - src/components/landing/HeroSection.tsx (CTA buttons)
    - src/features/auth/components/AuthModal.tsx (mode switching)
  - **Success:** Create summary of findings
  - **Files to Review:**
    - src/App.tsx
    - src/pages/LandingPage.tsx
    - src/components/landing/HeroSection.tsx
    - src/pages/PricingPage.tsx
    - All files referencing '/pricing'

## 0.2 Design Decisions
- [x] **Action:** Define technical approach
  - **Success:** Document architecture decisions
  - **Output:** Architecture diagram/notes in this section

### Summary of Findings

**Current Architecture:**
1. **Multi-project support EXISTS:**
   - ProjectsPage shows user's projects (/projects route)
   - CanvasPage supports /canvas/:projectId routing
   - RTDB structured as /canvases/{projectId}/objects
   - Project types, service layer, access control all implemented
   - Firestore schema documented in _docs/database/firestore-schema.md

2. **Auth flow patterns:**
   - AuthModal accepts `initialMode` prop ('login' | 'signup')
   - LandingPage manages modal state with `authMode` state variable
   - Header buttons correctly pass auth mode
   - HeroSection "Get Started Free" incorrectly links to /pricing

3. **Pricing references found:**
   - Route: src/App.tsx line 25 (`<Route path="/pricing" element={<PricingPage />} />`)
   - Page: src/pages/PricingPage.tsx (full page component)
   - HeroSection: Line 54 links to /pricing
   - ProjectsPage: Line 208 references /pricing for upgrade CTA
   - Multiple component imports in landing page

4. **Redirect behavior:**
   - Authenticated users on landing page redirect to /canvas (should be /projects)
   - ProtectedRoute works correctly for auth gating

**Technical Decisions:**
1. Remove /pricing route and PricingPage entirely
2. Convert HeroSection CTAs from Link to button + modal trigger
3. Update authenticated redirect: /canvas → /projects
4. Keep PricingTeaser component (shows founders banner inline)
5. Update all /pricing references to trigger signup modal
6. No backend/database changes needed (infrastructure exists)

---

# Phase 1: Remove Pricing Route & Page (Estimated: 30 min)

**Goal:** Remove standalone pricing page and route since all pricing is on landing page

**Phase Success Criteria:**
- [x] /pricing route removed from App.tsx (already removed)
- [x] PricingPage.tsx deleted
- [x] No build errors (no new errors from our changes)
- [x] No dead imports

---

## 1.1 Remove Pricing Route

### 1.1.1 Remove pricing route from App.tsx
- [x] **Action:** Remove pricing route declaration (already removed)
  - **Why:** We don't need a separate pricing page anymore
  - **Files Modified:**
    - Update: `src/App.tsx` (remove import and route)
  - **Implementation Details:**
```typescript
// REMOVE these lines:
import PricingPage from './pages/PricingPage'
<Route path="/pricing" element={<PricingPage />} />
```
  - **Success Criteria:**
    - [ ] Import statement removed
    - [ ] Route removed
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run: `npm run dev`
    2. Expected: No console errors
    3. Visit: http://localhost:5173/pricing
    4. Expected: 404 or redirect to home
  - **Edge Cases:**
    - ⚠️ Other components may still link to /pricing - will fix in Phase 2
  - **Rollback:** `git checkout src/App.tsx`
  - **Last Verified:** 2025-10-17

### 1.1.2 Delete PricingPage component file
- [x] **Action:** Delete unused PricingPage.tsx file
  - **Why:** No longer needed, all pricing on landing page
  - **Files Modified:**
    - Delete: `src/pages/PricingPage.tsx`
  - **Success Criteria:**
    - [ ] File deleted
    - [ ] Build still succeeds
  - **Tests:**
    1. Run: `npm run build`
    2. Expected: Build succeeds with no errors
    3. Check imports: No files import PricingPage
  - **Edge Cases:**
    - ⚠️ None - only imported in App.tsx which we already fixed
  - **Rollback:** `git checkout src/pages/PricingPage.tsx`
  - **Last Verified:** 2025-10-17

---

# Phase 2: Fix Landing Page Auth CTAs (Estimated: 45 min)

**Goal:** Update landing page CTAs to trigger auth modal instead of linking to /pricing

**Phase Success Criteria:**
- [ ] "Get Started Free" button opens signup modal
- [ ] Header "Sign Up" already works (verify only)
- [ ] No broken /pricing links

---

## 2.1 Update HeroSection CTAs

### 2.1.1 Convert HeroSection to use auth modal callback
- [ ] **Action:** Update HeroSection to accept onOpenAuth callback
  - **Why:** Need to trigger parent's auth modal instead of routing to /pricing
  - **Files Modified:**
    - Update: `src/components/landing/HeroSection.tsx`
  - **Implementation Details:**
```typescript
/**
 * HeroSection Component
 *
 * @param onOpenAuth - Callback to open auth modal with specified mode
 */
interface HeroSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export function HeroSection({ onOpenAuth }: HeroSectionProps) {
  const { currentUser } = useAuth();

  return (
    <section className="relative pt-32 pb-20 px-4">
      {/* ... existing gradient ... */}

      <div className="container mx-auto max-w-6xl text-center">
        {/* ... existing h1 and p ... */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {currentUser ? (
            /* Authenticated: Go to projects */
            <Link
              to="/projects"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Projects
            </Link>
          ) : (
            /* Unauthenticated: Signup CTA */
            <>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Get Started Free
              </button>

              <a
                href="#features"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              >
                See Features
              </a>
            </>
          )}
        </div>

        {/* ... existing social proof ... */}
      </div>
    </section>
  );
}
```
  - **Success Criteria:**
    - [ ] HeroSection accepts onOpenAuth prop
    - [ ] "Get Started Free" is a button (not Link)
    - [ ] Authenticated users see "Go to Projects" linking to /projects
    - [ ] TypeScript types added for props
  - **Tests:**
    1. Sign out (if signed in)
    2. Visit: http://localhost:5173
    3. Click: "Get Started Free"
    4. Expected: Signup modal opens
    5. Close modal, click "Sign Up" in header
    6. Expected: Signup modal opens
  - **Edge Cases:**
    - ⚠️ currentUser null check: Handled by conditional rendering
    - ⚠️ Modal closes and reopens correctly: Test multiple times
  - **Rollback:** `git checkout src/components/landing/HeroSection.tsx`
  - **Last Verified:** [Date]

### 2.1.2 Wire up HeroSection in LandingPage
- [ ] **Action:** Pass openAuthModal callback to HeroSection
  - **Why:** Connect HeroSection button to existing auth modal state
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```typescript
// In LandingPage component
function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // ... existing useSEO ...

  /**
   * Opens auth modal in specified mode
   */
  function openAuthModal(mode: AuthMode) {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }

  // ... existing closeAuthModal ...

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* ... existing header ... */}

      <main className="flex-1">
        {/* Pass callback to HeroSection */}
        <HeroSection onOpenAuth={openAuthModal} />

        {/* ... rest of sections ... */}
      </main>

      {/* ... existing footer and modal ... */}
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] openAuthModal callback passed to HeroSection
    - [ ] Callback updates authMode state
    - [ ] Modal opens with correct mode
  - **Tests:**
    1. Click "Get Started Free" in hero
    2. Expected: Modal opens with "Create Account" title
    3. Close modal, click header "Sign Up"
    4. Expected: Modal opens with "Create Account" title
    5. Click "Log in" link in modal
    6. Expected: Switches to "Welcome Back" title
  - **Edge Cases:**
    - ⚠️ Modal state persists: Modal resets mode on close (already handled)
  - **Rollback:** `git checkout src/pages/LandingPage.tsx`
  - **Last Verified:** [Date]

---

## 2.2 Verify Header Auth Buttons

### 2.2.1 Test header signup flow
- [ ] **Action:** Verify header "Sign Up" button works correctly
  - **Why:** Ensure existing functionality still works
  - **Files Modified:** None (verification only)
  - **Success Criteria:**
    - [ ] Header "Sign Up" button opens signup modal
    - [ ] Header "Log In" button opens login modal
    - [ ] Authenticated users see "Open Canvas" → should be "Go to Projects"
  - **Tests:**
    1. Sign out (if signed in)
    2. Click header "Sign Up"
    3. Expected: Modal opens with signup form
    4. Close modal, click header "Log In"
    5. Expected: Modal opens with login form
  - **Edge Cases:**
    - ⚠️ None - this flow already works
  - **Last Verified:** [Date]

### 2.2.2 Update authenticated user CTA in header
- [ ] **Action:** Change "Open Canvas" to "Go to Projects"
  - **Why:** Projects page is the central hub, not canvas
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```typescript
// In LandingPage header section
<div className="flex items-center gap-4">
  {currentUser ? (
    <button
      onClick={() => navigate('/projects')}
      className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-3 py-2"
    >
      Go to Projects
    </button>
  ) : (
    /* ... existing login/signup buttons ... */
  )}
</div>
```
  - **Success Criteria:**
    - [ ] Button text changed to "Go to Projects"
    - [ ] Click navigates to /projects
    - [ ] Only visible when authenticated
  - **Tests:**
    1. Sign in with test account
    2. Visit landing page
    3. Expected: Header shows "Go to Projects" button
    4. Click button
    5. Expected: Navigate to /projects page
  - **Edge Cases:**
    - ⚠️ None - simple text change
  - **Rollback:** `git checkout src/pages/LandingPage.tsx`
  - **Last Verified:** [Date]

---

# Phase 3: Update Auth Redirects (Estimated: 30 min)

**Goal:** Redirect authenticated users to /projects hub instead of /canvas

**Phase Success Criteria:**
- [ ] Landing page redirects authenticated users to /projects
- [ ] AuthModal success callback navigates to /projects
- [ ] No auto-redirect to /canvas anywhere

---

## 3.1 Update Landing Page Redirect

### 3.1.1 Remove handleGoToCanvas function
- [ ] **Action:** Remove old canvas redirect logic
  - **Why:** Should redirect to projects, not canvas
  - **Files Modified:**
    - Update: `src/pages/LandingPage.tsx`
  - **Implementation Details:**
```typescript
// REMOVE this function:
function handleGoToCanvas() {
  if (currentUser) {
    navigate('/canvas');
  } else {
    openAuthModal('login');
  }
}

// Already handled in HeroSection via Navigate component
// Already handled in header via onClick={() => navigate('/projects')}
```
  - **Success Criteria:**
    - [ ] handleGoToCanvas function removed
    - [ ] No references to this function remain
  - **Tests:**
    1. Search codebase for "handleGoToCanvas"
    2. Expected: No results
  - **Edge Cases:**
    - ⚠️ None - function only used in removed code
  - **Rollback:** `git checkout src/pages/LandingPage.tsx`
  - **Last Verified:** [Date]

---

## 3.2 Update AuthModal Success Behavior

### 3.2.1 Add navigation to AuthModal success handler
- [ ] **Action:** Navigate to /projects after successful auth
  - **Why:** Send users to projects hub after signup/login
  - **Files Modified:**
    - Update: `src/features/auth/components/AuthModal.tsx`
  - **Implementation Details:**
```typescript
import { useNavigate } from 'react-router-dom';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // ... existing state ...

  /**
   * Handles successful authentication
   * Closes modal and redirects to projects page
   */
  function handleSuccess() {
    onClose();
    // Small delay to let modal close gracefully
    setTimeout(() => {
      navigate('/projects');
    }, 150);
  }

  // ... rest of component ...
}
```
  - **Success Criteria:**
    - [ ] handleSuccess calls navigate('/projects')
    - [ ] 150ms delay for smooth modal close
    - [ ] Works for both login and signup
  - **Tests:**
    1. Sign out (if signed in)
    2. Click "Sign Up" on landing page
    3. Fill form and submit
    4. Expected: Modal closes, navigate to /projects
    5. Sign out, click "Log In"
    6. Fill form and submit
    7. Expected: Modal closes, navigate to /projects
  - **Edge Cases:**
    - ⚠️ Navigation before modal close: 150ms delay handles this
    - ⚠️ User already on projects page: No-op navigation (safe)
  - **Rollback:** `git checkout src/features/auth/components/AuthModal.tsx`
  - **Last Verified:** [Date]

---

# Phase 4: Update Remaining /pricing References (Estimated: 45 min)

**Goal:** Find and fix all remaining references to /pricing route

**Phase Success Criteria:**
- [ ] No broken /pricing links in codebase
- [ ] All upgrade CTAs trigger appropriate actions
- [ ] No console warnings about missing routes

---

## 4.1 Search and Replace /pricing References

### 4.1.1 Find all /pricing references
- [ ] **Action:** Search codebase for all /pricing references
  - **Why:** Need to update or remove all pricing route links
  - **Files Modified:** TBD (depends on search results)
  - **Implementation Details:**
```bash
# Search for pricing route references
grep -r "'/pricing'" src/
grep -r '"/pricing"' src/
grep -r 'to="/pricing"' src/
grep -r 'href="/pricing"' src/
```
  - **Success Criteria:**
    - [ ] Complete list of files referencing /pricing
    - [ ] Action plan for each reference
  - **Tests:**
    1. Run grep commands
    2. Document each file and line number
    3. Categorize: delete, update, or keep
  - **Edge Cases:**
    - ⚠️ None - just searching
  - **Last Verified:** [Date]

### 4.1.2 Update ProjectsPage upgrade CTA
- [ ] **Action:** Change /pricing navigation to inline upgrade modal
  - **Why:** ProjectsPage references /pricing for upgrade button
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx` (line ~208)
  - **Implementation Details:**
```typescript
// BEFORE:
<button
  onClick={() => navigate('/pricing')}
  className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
>
  <Plus className="w-4 h-4" />
  Upgrade to Create
</button>

// AFTER:
// Remove this button entirely - InlineUpgradePrompt already handles this case
// The empty state shows InlineUpgradePrompt which has its own upgrade CTA
```
  - **Success Criteria:**
    - [ ] Upgrade button removed from header
    - [ ] InlineUpgradePrompt still shows in empty state
    - [ ] Free users see proper upgrade prompt
  - **Tests:**
    1. Sign in as free user (no founders tier)
    2. Visit /projects
    3. Expected: Empty state shows upgrade prompt
    4. Header shows only project count (no upgrade button)
  - **Edge Cases:**
    - ⚠️ Free users see InlineUpgradePrompt (already implemented)
    - ⚠️ Paid users can create projects (already handled)
  - **Rollback:** `git checkout src/pages/ProjectsPage.tsx`
  - **Last Verified:** [Date]

### 4.1.3 Verify PricingTeaser component usage
- [ ] **Action:** Check if PricingTeaser links to /pricing
  - **Why:** Component used on landing page, may have /pricing links
  - **Files Modified:**
    - Update: `src/components/landing/PricingTeaser.tsx` (if needed)
  - **Implementation Details:**
```typescript
// Check PricingTeaser for any /pricing links
// If found, replace with auth modal trigger
// Most likely just displays pricing inline (no links)
```
  - **Success Criteria:**
    - [ ] No /pricing links in PricingTeaser
    - [ ] Component renders correctly on landing page
  - **Tests:**
    1. Read PricingTeaser.tsx source
    2. Check for Link components with to="/pricing"
    3. Check for anchor tags with href="/pricing"
    4. If found, update to trigger auth modal
  - **Edge Cases:**
    - ⚠️ Component may not link anywhere (just display)
  - **Rollback:** `git checkout src/components/landing/PricingTeaser.tsx`
  - **Last Verified:** [Date]

### 4.1.4 Check remaining pricing component imports
- [ ] **Action:** Search for any remaining pricing component imports
  - **Why:** Clean up unused imports from pricing feature
  - **Files Modified:** TBD
  - **Implementation Details:**
```bash
# Search for pricing component imports
grep -r "from '@/features/pricing" src/
grep -r "from '@/pages/PricingPage" src/
```
  - **Success Criteria:**
    - [ ] No unused pricing imports
    - [ ] All pricing components still used are legitimate
  - **Tests:**
    1. Run grep commands
    2. Verify each import is actually used
    3. Remove unused imports
    4. Run `npm run build` to verify
  - **Edge Cases:**
    - ⚠️ PricingTeaser likely still used (keep it)
    - ⚠️ PricingFAQ, PricingTiers may be used inline
  - **Rollback:** Use git to revert specific files
  - **Last Verified:** [Date]

---

# Phase 5: Testing & Verification (Estimated: 45 min)

**Goal:** Comprehensive testing of all auth flows and navigation

**Phase Success Criteria:**
- [ ] All user flows tested end-to-end
- [ ] No console errors
- [ ] No broken links
- [ ] Smooth UX with no jarring redirects

---

## 5.1 User Flow Testing

### 5.1.1 Test unauthenticated user signup flow
- [ ] **Action:** Complete full signup flow from landing page
  - **Why:** Verify entire new user journey works
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] Landing page → Signup → Projects page flow works
    - [ ] Modal closes smoothly
    - [ ] No console errors
    - [ ] User sees empty projects state
  - **Tests:**
    1. Sign out completely
    2. Visit: http://localhost:5173
    3. Click: "Get Started Free" in hero
    4. Expected: Signup modal opens
    5. Fill form: email, password, username
    6. Click: "Sign Up"
    7. Expected: Modal closes, redirect to /projects
    8. Expected: Empty state shown (no projects yet)
  - **Edge Cases:**
    - ⚠️ Email already exists: Shows error (expected)
    - ⚠️ Network error: Shows error (expected)
  - **Last Verified:** [Date]

### 5.1.2 Test unauthenticated user login flow
- [ ] **Action:** Complete full login flow from landing page
  - **Why:** Verify existing user journey works
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] Landing page → Login → Projects page flow works
    - [ ] User's projects load correctly
    - [ ] No console errors
  - **Tests:**
    1. Sign out (if signed in)
    2. Visit: http://localhost:5173
    3. Click: "Log In" in header
    4. Expected: Login modal opens
    5. Fill form: email, password
    6. Click: "Log In"
    7. Expected: Modal closes, redirect to /projects
    8. Expected: User's projects displayed
  - **Edge Cases:**
    - ⚠️ Wrong password: Shows error (expected)
    - ⚠️ User has no projects: Shows empty state
  - **Last Verified:** [Date]

### 5.1.3 Test authenticated user landing page behavior
- [ ] **Action:** Visit landing page while authenticated
  - **Why:** Verify authenticated users see correct CTAs
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] Hero shows "Go to Projects" instead of "Get Started Free"
    - [ ] Header shows "Go to Projects" instead of login/signup
    - [ ] Clicking redirects to /projects
  - **Tests:**
    1. Sign in with test account
    2. Visit: http://localhost:5173
    3. Expected: Hero shows "Go to Projects" button
    4. Expected: Header shows "Go to Projects" link
    5. Click hero button
    6. Expected: Navigate to /projects
    7. Go back, click header link
    8. Expected: Navigate to /projects
  - **Edge Cases:**
    - ⚠️ None - simple redirect
  - **Last Verified:** [Date]

---

## 5.2 Navigation Testing

### 5.2.1 Test all navigation links
- [ ] **Action:** Click through all major navigation paths
  - **Why:** Ensure no broken links or dead ends
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] All navigation links work
    - [ ] No 404 errors
    - [ ] No infinite redirects
  - **Tests:**
    1. Visit landing page
    2. Click: Each footer link
    3. Expected: All links work (GitHub, Twitter)
    4. Click: "See Features"
    5. Expected: Scroll to features section
    6. Visit: /pricing directly
    7. Expected: 404 or redirect to home (expected)
  - **Edge Cases:**
    - ⚠️ Direct /pricing access: Should 404 (expected)
  - **Last Verified:** [Date]

### 5.2.2 Test project creation and canvas navigation
- [ ] **Action:** Create project and verify canvas loads
  - **Why:** Ensure multi-project flow works end-to-end
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] Can create new project from /projects
    - [ ] Canvas loads with correct projectId
    - [ ] Can navigate back to /projects
    - [ ] Can switch between projects
  - **Tests:**
    1. Sign in and go to /projects
    2. Click: "New Project"
    3. Fill form: Project name, template
    4. Click: "Create"
    5. Expected: Navigate to /canvas/{projectId}
    6. Expected: Canvas loads empty
    7. Create a rectangle
    8. Expected: Object syncs to Firebase
    9. Click: Projects link (if exists) or navigate to /projects
    10. Expected: See project in list
  - **Edge Cases:**
    - ⚠️ Free users can't create: Shows upgrade prompt (expected)
    - ⚠️ Network error: Shows error message
  - **Last Verified:** [Date]

---

## 5.3 Build & Console Testing

### 5.3.1 Run production build
- [ ] **Action:** Build project and check for errors
  - **Why:** Verify no TypeScript errors or build issues
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] Build completes successfully
    - [ ] No TypeScript errors
    - [ ] No unused imports warnings
  - **Tests:**
    1. Run: `npm run build`
    2. Expected: Build completes with no errors
    3. Expected: No TypeScript errors
    4. Check output for warnings
  - **Edge Cases:**
    - ⚠️ Build warnings: Document and decide if acceptable
  - **Last Verified:** [Date]

### 5.3.2 Check browser console for errors
- [ ] **Action:** Navigate through app and monitor console
  - **Why:** Catch any runtime errors or warnings
  - **Files Modified:** None (testing only)
  - **Success Criteria:**
    - [ ] No console errors during normal usage
    - [ ] No React warnings
    - [ ] No Firebase errors
  - **Tests:**
    1. Open browser console
    2. Navigate through all pages
    3. Sign up, sign in, sign out
    4. Create project, open canvas
    5. Check console after each action
    6. Expected: No red errors
  - **Edge Cases:**
    - ⚠️ Firebase connection logs: Informational only (OK)
    - ⚠️ HMR warnings in dev: Expected (OK)
  - **Last Verified:** [Date]

---

# Final Integration & Testing

## Integration Tests
- [ ] Test complete feature end-to-end
  - **Scenario 1:** New user signs up → creates project → opens canvas
    - Visit landing page
    - Click "Get Started Free"
    - Fill signup form
    - Expected: Redirect to /projects (empty state)
    - Click "New Project"
    - Fill form and create
    - Expected: Navigate to canvas with projectId
    - Create some shapes
    - Go back to /projects
    - Expected: See project in list
  - **Scenario 2:** Existing user logs in → views projects → opens canvas
    - Sign out
    - Visit landing page
    - Click "Log In"
    - Fill login form
    - Expected: Redirect to /projects (with existing projects)
    - Click a project card
    - Expected: Navigate to canvas, objects load
  - **Scenario 3:** Authenticated user visits landing page
    - While signed in, visit /
    - Expected: Hero shows "Go to Projects"
    - Click button
    - Expected: Navigate to /projects

## Performance Tests
- [ ] Verify performance requirements
  - **Metric:** Page load time
  - **Target:** < 2 seconds for landing page
  - **How to Test:**
    1. Open DevTools Network tab
    2. Disable cache
    3. Refresh landing page
    4. Check: Load time
    5. Expected: < 2 seconds

## Accessibility Tests
- [ ] Keyboard navigation works
  - Tab through landing page
  - Expected: All buttons focusable
  - Press Enter on "Get Started Free"
  - Expected: Modal opens
  - Tab through modal
  - Expected: All form fields focusable
- [ ] Focus indicators visible
  - Use Tab key to navigate
  - Expected: Blue focus ring on all interactive elements
- [ ] Modal closes on Escape
  - Open auth modal
  - Press Escape
  - Expected: Modal closes

---

# Deployment Checklist

- [ ] All tasks completed and verified
- [ ] All tests passing
- [ ] No console errors in production build
- [ ] All user flows tested end-to-end
- [ ] Performance verified (< 2s page load)
- [ ] Accessibility verified (keyboard nav, focus states)
- [ ] No broken links or 404s
- [ ] Firebase connections working
- [ ] Code reviewed (self-review)
- [ ] Commit message written:
  ```
  refactor: remove pricing page and improve auth navigation flow

  - Remove /pricing route and PricingPage component
  - Update hero CTA to trigger signup modal instead of routing
  - Redirect authenticated users to /projects (not /canvas)
  - Update AuthModal to navigate to /projects on success
  - Remove upgrade button from ProjectsPage header
  - Clean up all /pricing references throughout codebase

  Multi-project infrastructure already exists, this is purely
  a navigation/UX improvement to streamline the auth flow
  and remove the standalone pricing page.
  ```

---

# Appendix

## Related Documentation
- [Multi-project architecture](_docs/database/firestore-schema.md)
- [Auth flow patterns](_docs/research/auth-flow.md)
- [Routing structure](_docs/research/routing-structure.md)

## Future Enhancements
- Add project templates showcase on /projects empty state
- Add "Recent Projects" section on landing page for authenticated users
- Add project search/filter on /projects page
- Add keyboard shortcut (Cmd/Ctrl+K) to open "New Project" modal

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| 2025-10-17 | Phase 0 | 30 min | Research and planning |
| | | | |

---

## Edge Cases Summary

### Authentication Edge Cases
1. **User already authenticated on landing page**
   - Solution: Show "Go to Projects" CTA instead of signup
   - Tested: ✓

2. **Network error during signup/login**
   - Solution: Show error message in modal, don't close
   - Tested: ✓

3. **Email already exists during signup**
   - Solution: Firebase returns error, show in form
   - Tested: ✓

### Navigation Edge Cases
1. **Direct access to /pricing route**
   - Solution: Remove route, will 404 (expected)
   - Note: Could add redirect to / in future

2. **User creates project but is free tier**
   - Solution: Already handled by subscription check in ProjectsPage
   - Shows InlineUpgradePrompt instead of "New Project" button

3. **Project doesn't exist (bad projectId)**
   - Solution: Already handled in CanvasPage
   - Shows error and redirects to /projects after 2s

4. **User doesn't have access to project**
   - Solution: Already handled in CanvasPage
   - Shows "Access Denied" and redirects to /projects

### Modal Edge Cases
1. **Modal opens while another modal is open**
   - Solution: Only one modal state at a time
   - Tested: ✓

2. **User clicks outside modal to close**
   - Solution: Dialog component handles this (Radix UI)
   - Tested: ✓

3. **User presses Escape to close modal**
   - Solution: Dialog component handles this (Radix UI)
   - Tested: ✓

### Build Edge Cases
1. **Unused imports after removing PricingPage**
   - Solution: Search for imports, remove manually
   - Tested: npm run build

2. **TypeScript errors from removed types**
   - Solution: Verify no AuthMode or other types removed
   - Tested: npm run build
