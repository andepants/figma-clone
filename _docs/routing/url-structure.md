# URL Structure & Routing

**Purpose:** Define all routes with auth requirements, error states, and query parameters.

**Benefits:** Clear routing prevents conflicts, improves SEO, and enables proper error handling.

---

## Route Overview

```
/                     → Landing Page (public)
/pricing              → Pricing Page (public)
/projects             → Projects Dashboard (require auth)
/canvas/:projectId    → Canvas Editor (require auth + project access)
/account              → Account Settings (require auth) [future]
/onboarding           → New user onboarding flow (require auth, paid users only)
/404                  → Page not found
/500                  → Server error
/offline              → No connection (PWA future)
```

---

## Public Routes

### `/` - Landing Page
- **Auth Required:** No
- **Redirect:** If authenticated → `/projects`
- **Purpose:** Marketing page with hero, features, pricing preview
- **Meta Tags:**
  - Title: "CanvasIcons - Professional App Icons. Zero Design Skills Required."
  - Description: "Create App Store-ready icons in minutes with real-time collaboration"

### `/pricing` - Pricing Page
- **Auth Required:** No
- **Purpose:** Full pricing table with Founders and Pro tiers
- **Query Params:**
  - `?from=upgrade` → Show "Upgrade to unlock" message
  - `?plan=founders` → Scroll to Founders tier, highlight
  - `?plan=pro` → Scroll to Pro tier, highlight
- **Meta Tags:**
  - Title: "Pricing - CanvasIcons"
  - Description: "Simple, transparent pricing. Start with Founders at $9.99/year."

---

## Protected Routes (Require Authentication)

### `/projects` - Projects Dashboard
- **Auth Required:** Yes
- **Redirect:** If not authenticated → `/` with `?redirect=/projects`
- **Purpose:** User's project list, create/manage projects
- **Query Params:**
  - `?payment=success&session_id={id}` → Show success banner, poll for subscription update
  - `?payment=cancelled` → Show "Payment cancelled" message
  - `?tab=my-projects` → Show user's projects (default)
  - `?tab=shared` → Show public/shared projects
- **Error States:**
  - No projects → Empty state with "Create Project" CTA
  - Free user → Empty state with upgrade prompt

### `/canvas/:projectId` - Canvas Editor
- **Auth Required:** Yes
- **Project Access Required:** Yes (owner or collaborator)
- **Redirect:** If not authenticated → `/` with `?redirect=/canvas/:projectId`
- **Purpose:** Main canvas editing interface
- **Error States:**
  - Project not found → Full-page 404 with "Go to Dashboard" CTA
  - Access denied → Full-page error with "Request Access" or "Browse Public Projects"
  - Project deleted → Full-page error with "Go to Dashboard"
- **URL Params:**
  - `:projectId` → Project UUID (e.g., `proj_abc123`)

### `/account` - Account Settings [Future]
- **Auth Required:** Yes
- **Redirect:** If not authenticated → `/` with `?redirect=/account`
- **Purpose:** User profile, subscription management, billing
- **Sections:**
  - Profile (username, email)
  - Subscription (tier, billing, cancel)
  - Security (password, 2FA)
  - Preferences (theme, notifications)

### `/onboarding` - Onboarding Flow
- **Auth Required:** Yes
- **Paid Users Only:** Yes (founders or pro)
- **Redirect:** If not authenticated → `/`
- **Redirect:** If free user → `/pricing?from=upgrade`
- **Purpose:** 3-5 step onboarding for new paid users
- **Query Params:**
  - `?step=0` → Welcome screen
  - `?step=1` → Create first project
  - `?step=2` → Explore tools
  - `?step=3` → Export file
  - `?step=4` → Share project
- **Skip Logic:**
  - User can skip onboarding (stored in Firestore)
  - After onboarding → Redirect to `/projects`

---

## Error Routes

### `/404` - Page Not Found
- **Trigger:** Unknown route accessed
- **Content:**
  - Heading: "Page Not Found"
  - Description: "The page you're looking for doesn't exist or has been moved."
  - CTA: "Go to Dashboard" (if authenticated) or "Go to Home" (if not)

### `/500` - Server Error
- **Trigger:** Unhandled exception, server crash
- **Content:**
  - Heading: "Something Went Wrong"
  - Description: "We're working to fix the issue. Please try again later."
  - CTA: "Retry" or "Go to Home"

### `/offline` - No Connection [Future PWA]
- **Trigger:** App detects offline mode
- **Content:**
  - Heading: "You're Offline"
  - Description: "Check your connection. Changes will sync when you're back online."
  - CTA: "Retry Connection"

---

## Redirects (Legacy Routes)

### `/canvas` → `/projects`
- **Reason:** Old single-canvas route, now supports multiple projects
- **Status Code:** 301 (Permanent Redirect)

### `/` → `/projects` (if authenticated)
- **Reason:** Skip landing page for logged-in users
- **Status Code:** 302 (Temporary Redirect)
- **Condition:** Only if `localStorage.getItem('skipLandingPage')` is true

---

## Query Parameters

### Payment Flow
- `?payment=success` → Show success banner on `/projects`
- `?payment=cancelled` → Show cancellation message on `/projects`
- `?session_id={id}` → Stripe Checkout Session ID (verify payment)

### Navigation
- `?redirect={url}` → Return URL after login/signup
- `?tab={name}` → Active tab on `/projects` (my-projects, shared)
- `?from={source}` → Track where user came from (upgrade, landing, etc.)

### Pricing & Plans
- `?plan={tier}` → Highlight specific tier on `/pricing` (founders, pro)
- `?interval={period}` → Pre-select billing interval (month, year)

### Onboarding
- `?step={number}` → Current onboarding step (0-4)

---

## Route Guards (Implementation)

### Auth Guard
```typescript
// Check if user is authenticated
function requireAuth(to: Route) {
  const user = useAuthStore.getState().user;

  if (!user) {
    // Redirect to landing with return URL
    return {
      path: '/',
      query: { redirect: to.fullPath },
    };
  }

  return true;
}
```

### Paid User Guard
```typescript
// Check if user has paid subscription
function requirePaidUser(to: Route) {
  const user = useAuthStore.getState().user;

  if (!user) {
    return { path: '/', query: { redirect: to.fullPath } };
  }

  if (user.subscription.status === 'free') {
    // Redirect to pricing with upgrade message
    return {
      path: '/pricing',
      query: { from: 'upgrade' },
    };
  }

  return true;
}
```

### Project Access Guard
```typescript
// Check if user has access to project
async function requireProjectAccess(to: Route) {
  const user = useAuthStore.getState().user;
  const projectId = to.params.projectId;

  if (!user) {
    return { path: '/', query: { redirect: to.fullPath } };
  }

  // Fetch project
  const project = await getProject(projectId);

  if (!project) {
    return { path: '/404' };
  }

  // Check access
  const hasAccess = canUserAccessProject(project, user.id);

  if (!hasAccess) {
    return {
      path: '/projects',
      state: { error: 'access_denied', projectId },
    };
  }

  return true;
}
```

---

## Route Configuration (React Router)

```typescript
// src/App.tsx or src/routes.tsx

import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },

  // Protected routes
  {
    path: '/projects',
    element: <ProjectsDashboard />,
    loader: requireAuth,
  },
  {
    path: '/canvas/:projectId',
    element: <CanvasEditor />,
    loader: async ({ params }) => {
      const authCheck = requireAuth();
      if (authCheck !== true) return authCheck;
      return requireProjectAccess({ params });
    },
  },
  {
    path: '/onboarding',
    element: <OnboardingFlow />,
    loader: () => {
      const authCheck = requireAuth();
      if (authCheck !== true) return authCheck;
      return requirePaidUser();
    },
  },

  // Error routes
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '/500',
    element: <ServerErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />, // Catch-all 404
  },
]);
```

---

## SEO & Meta Tags

### Dynamic Meta Tags (react-helmet or similar)

```typescript
// Landing Page
<Helmet>
  <title>CanvasIcons - Professional App Icons. Zero Design Skills Required.</title>
  <meta name="description" content="Create App Store-ready icons in minutes with real-time collaboration, professional templates, and export-ready files." />
  <meta property="og:title" content="CanvasIcons - Professional App Icons" />
  <meta property="og:description" content="Create App Store-ready icons in minutes" />
  <meta property="og:image" content="https://canvasicons.com/og-image.png" />
</Helmet>

// Pricing Page
<Helmet>
  <title>Pricing - CanvasIcons</title>
  <meta name="description" content="Simple, transparent pricing. Start with Founders at $9.99/year or upgrade to Pro for $90/year." />
</Helmet>

// Projects Dashboard
<Helmet>
  <title>My Projects - CanvasIcons</title>
  <meta name="robots" content="noindex" /> {/* Private page */}
</Helmet>

// Canvas Editor
<Helmet>
  <title>{projectName} - CanvasIcons</title>
  <meta name="robots" content="noindex" /> {/* Private page */}
</Helmet>
```

---

## Analytics & Tracking

### Track Page Views

```typescript
// Track with Google Analytics, Posthog, or similar
import { analytics } from '@/lib/analytics';

router.subscribe((state) => {
  analytics.page(state.location.pathname, {
    title: document.title,
    referrer: state.location.state?.referrer,
  });
});
```

### Track Query Params

```typescript
// Track payment success
if (searchParams.get('payment') === 'success') {
  analytics.track('Payment Completed', {
    sessionId: searchParams.get('session_id'),
  });
}

// Track upgrade intent
if (searchParams.get('from') === 'upgrade') {
  analytics.track('Upgrade Flow Started', {
    source: 'free_tier_limit',
  });
}
```

---

## Routing Checklist

- [ ] All routes defined with auth requirements
- [ ] Auth guards implemented (requireAuth, requirePaidUser)
- [ ] Project access guard implemented
- [ ] Error routes (404, 500) designed
- [ ] Query params documented
- [ ] Redirects configured (legacy routes)
- [ ] Meta tags set for all public pages
- [ ] Analytics tracking on all routes
- [ ] Breadcrumbs for navigation (future)
- [ ] Deep linking support (mobile app - future)

---

## Next Steps

1. Implement route guards in `src/lib/guards/*.ts`
2. Set up React Router with guards
3. Add meta tags to all pages
4. Test auth flow with redirects
5. Test project access with different user roles
6. Add analytics tracking
7. Test all error states (404, 500, access denied)
