# Routing Structure - CanvasIcons Premium

**Audit Date:** 2025-10-16
**Purpose:** Document current routing for new route integration (/pricing, /projects, /canvas/:id)
**Status:** ✅ Routing documented - ready for new routes

---

## Current Routing Setup

### Router Library
- **Library:** `react-router-dom` v7.9.4 ✅
- **Router Type:** `BrowserRouter`
- **Location:** `src/App.tsx`

### Routes Configuration

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route
      path="/canvas"
      element={
        <ProtectedRoute>
          <CanvasPage />
        </ProtectedRoute>
      }
    />
  </Routes>
</BrowserRouter>
```

---

## Current Routes

### 1. Landing Page (`/`)
- **Path:** `/`
- **Component:** `LandingPage` (`src/pages/LandingPage.tsx`)
- **Auth Required:** No
- **Purpose:** Public landing page, sign up/sign in entry point

### 2. Canvas Page (`/canvas`)
- **Path:** `/canvas`
- **Component:** `CanvasPage` (`src/pages/CanvasPage.tsx`)
- **Auth Required:** Yes (wrapped in `ProtectedRoute`)
- **Current Behavior:**
  - Shows loading spinner while checking auth
  - Redirects to `/` if not authenticated
  - Uses hardcoded canvas ID "main"
- **Issue:** No dynamic project ID (all users share same canvas)

---

## Protected Route Pattern

### Implementation
**Component:** `ProtectedRoute` (`src/features/auth/components/ProtectedRoute.tsx`)

**Flow:**
```typescript
1. Check auth state (loading)
   ↓
   If loading → Show spinner with "Checking authentication..."
   ↓
2. Check currentUser
   ↓
   If !currentUser → <Navigate to="/" replace />
   ↓
3. If authenticated → Render children
```

**Loading State UI:**
```tsx
<div className="fixed inset-0 flex items-center justify-center bg-white z-50">
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-3 border-neutral-200 border-t-primary-500 rounded-full animate-spin" />
    <p className="text-base text-neutral-600">
      Checking authentication...
    </p>
  </div>
</div>
```

**Redirect Behavior:**
- Uses `<Navigate to="/" replace />` to prevent back button issues
- Clears protected route from history

---

## Planned Routes for Premium Features

### New Routes to Add

```typescript
// Public Routes
<Route path="/" element={<LandingPage />} />
<Route path="/pricing" element={<PricingPage />} />

// Protected Routes
<Route
  path="/projects"
  element={
    <ProtectedRoute>
      <ProjectsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/canvas/:projectId"
  element={
    <ProtectedRoute>
      <CanvasPage />
    </ProtectedRoute>
  }
/>

// Future Routes
<Route
  path="/account"
  element={
    <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/onboarding"
  element={
    <ProtectedRoute requiresPaid>
      <OnboardingPage />
    </ProtectedRoute>
  }
/>

// Error Routes
<Route path="/404" element={<NotFoundPage />} />
<Route path="/500" element={<ServerErrorPage />} />
<Route path="*" element={<Navigate to="/404" replace />} />
```

### Query Parameters

**Payment Success:**
- `/projects?payment=success&session_id={id}`
- Show success banner
- Poll for subscription update

**Payment Cancelled:**
- `/projects?payment=cancelled`
- Show "Payment cancelled" message

**Upgrade Flow:**
- `/pricing?from=upgrade`
- Show "Upgrade to unlock" message

**Scroll to Tier:**
- `/pricing?plan=founders`
- Scroll to specific pricing tier

### Redirects

**Old Route → New Route:**
- `/canvas` → `/projects` (redirect authenticated users to dashboard)
- `/` → `/projects` (if authenticated, skip landing page)

---

## Enhanced ProtectedRoute (For Subscription Gating)

### Current Implementation
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

### Enhanced Implementation (Phase 6)
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPaid?: boolean;        // Require paid subscription
  allowedTiers?: SubscriptionStatus[];  // Specific tiers allowed
}

export function ProtectedRoute({
  children,
  requiresPaid = false,
  allowedTiers
}: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Check subscription requirement
  if (requiresPaid && currentUser.subscription?.status === 'free') {
    return <Navigate to="/pricing?from=upgrade" replace />;
  }

  // Check specific tier requirement
  if (allowedTiers && !allowedTiers.includes(currentUser.subscription?.status ?? 'free')) {
    return <Navigate to="/pricing?from=upgrade" replace />;
  }

  return <>{children}</>;
}
```

---

## Route-Based Canvas ID Extraction

### Current Problem
- Canvas ID hardcoded as "main" in `realtimeCanvasService.ts`
- All users share same canvas

### Solution (Phase 8: Canvas Isolation)

**1. Update Route:**
```typescript
<Route
  path="/canvas/:projectId"
  element={
    <ProtectedRoute>
      <CanvasPage />
    </ProtectedRoute>
  }
/>
```

**2. Extract projectId in CanvasPage:**
```typescript
import { useParams } from 'react-router-dom';

export function CanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();

  // Pass projectId to canvas store or context
  return <Canvas projectId={projectId} />;
}
```

**3. Update Canvas Store:**
```typescript
// Instead of hardcoded "main"
const canvasId = projectId;

// Pass to RTDB service
subscribeToCanvasObjects(canvasId, callback);
addCanvasObject(canvasId, object);
updateCanvasObject(canvasId, objectId, updates);
```

---

## Error Handling & Edge Cases

### Not Found (404)
- Invalid project ID → Show "Project not found" page
- Deleted project → Redirect to `/projects` with error message

### Access Denied (403)
- Private project, not owner/collaborator
- Show "You don't have access to this project"
- Provide link to `/projects`

### Loading States
- Auth loading → Spinner with "Checking authentication..."
- Project loading → Skeleton screen with "Loading project..."
- Subscription checking → Transparent to user (use cached data)

### Network Errors
- Offline → Show offline banner
- Timeout → Retry with exponential backoff
- Firebase down → Show error page with support link

---

## Navigation Patterns

### From Landing Page
```
Landing (/)
  ↓ Click "Get Started"
  ↓ User authenticated?
     Yes → /projects
     No  → Show AuthModal → /projects (after signup)
```

### From Projects Dashboard
```
Projects (/projects)
  ↓ Click "Create Project"
  ↓ User paid?
     Yes → Create project → /canvas/{projectId}
     No  → /pricing?from=upgrade
```

### From Pricing Page
```
Pricing (/pricing)
  ↓ Click "Subscribe"
  ↓ Stripe Checkout
  ↓ Success
  ↓ /projects?payment=success&session_id={id}
  ↓ Poll for subscription
  ↓ Show onboarding checklist
```

### From Canvas Page
```
Canvas (/canvas/{projectId})
  ↓ Click "Projects" in header
  ↓ /projects
  ↓ Click specific project
  ↓ /canvas/{projectId}
```

---

## Testing Scenarios

### Test 1: Public Access
- [x] Navigate to `/` → Landing page renders
- [ ] Navigate to `/pricing` → Pricing page renders (to be built)
- [ ] Not authenticated → Can browse public routes

### Test 2: Protected Routes
- [x] Navigate to `/canvas` while logged out → Redirects to `/`
- [x] Shows loading spinner during auth check
- [x] After login → Canvas page renders

### Test 3: Dynamic Routes (Future)
- [ ] Navigate to `/canvas/project-123` → Loads project-123
- [ ] Navigate to `/canvas/invalid-id` → 404 page
- [ ] Navigate to private project (not owner) → Access denied

### Test 4: Query Params (Future)
- [ ] `/projects?payment=success` → Shows success banner
- [ ] `/pricing?plan=founders` → Scrolls to Founders tier

---

## Files to Modify (Phase 1-3)

### Phase 1: Landing Page Route
- **Modify:** `src/App.tsx` (add `/pricing` route)
- **Create:** `src/pages/PricingPage.tsx`
- **No changes to:** Protected route logic

### Phase 2: Projects Dashboard Route
- **Modify:** `src/App.tsx` (add `/projects` route)
- **Create:** `src/pages/ProjectsPage.tsx`
- **Modify:** Redirect logic (authenticated users → `/projects` not `/`)

### Phase 3: Dynamic Canvas Route
- **Modify:** `src/App.tsx` (change `/canvas` → `/canvas/:projectId`)
- **Modify:** `src/pages/CanvasPage.tsx` (extract `projectId` from params)
- **Modify:** `src/stores/canvasStore.ts` (use dynamic canvas ID)
- **Modify:** All RTDB service calls (pass `projectId` instead of "main")

---

## Router Upgrade Considerations

### Current Version: React Router v7.9.4
- ✅ Latest version (v7)
- ✅ Supports all features we need:
  - Dynamic params (`:projectId`)
  - Query params (`?payment=success`)
  - Nested routes
  - Protected routes
  - Redirects
  - Replace navigation

### No Upgrade Needed
- v7 is latest and stable
- All premium features compatible
- No breaking changes expected

---

## Conclusion

✅ **Routing structure is simple and ready for extension**

**Current State:**
- 2 routes (landing, canvas)
- Protected route wrapper implemented
- React Router v7 (latest)
- Clean redirect pattern

**For Premium Features:**
- Add `/pricing` route (public)
- Add `/projects` route (protected)
- Change `/canvas` → `/canvas/:projectId` (protected, dynamic)
- Add query param handling for payment flows
- Enhance `ProtectedRoute` for subscription gating
- Add error routes (404, 500)

**Next Steps:**
- Phase 1: Add `/pricing` route + PricingPage component
- Phase 2: Add `/projects` route + ProjectsPage component
- Phase 8: Update canvas route to use dynamic projectId
- Phase 6: Enhance ProtectedRoute with subscription checks
