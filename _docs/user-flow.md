# User Flow: CollabCanvas

## Overview

CollabCanvas has a simple, linear user flow. All authenticated users access a single shared canvas where they collaborate in real-time. There are no canvas selection screens, dashboards, or project management features in the MVP.

---

## Primary User Flow

### 1. Landing Page
**Entry Point:** User visits the CollabCanvas URL

**Page Contents:**
- Project title/logo
- Brief tagline or description
- Call-to-action button: "Get Started" or "Login"

**User Action:**
- User clicks "Get Started" button

**Result:**
- Authentication modal opens

---

### 2. Authentication Modal
**Trigger:** User clicks "Get Started" from landing page

**Modal Contents:**
- Toggle between "Sign Up" and "Login" views
- **Sign Up Form:**
  - Email input
  - Password input
  - "Create Account" button
- **Login Form:**
  - Email input
  - Password input
  - "Login" button
- Toggle link: "Already have an account?" / "Need an account?"

**Optional Enhancement:**
- Magic link email verification after signup (can be added if easier than manual verification)

**User Action:**
- User enters email and password
- User clicks "Create Account" or "Login"

**Result:**
- User is authenticated
- Modal closes
- User is redirected to Canvas page

---

### 3. Canvas Page
**Entry:** User is redirected after successful authentication

**Page Contents:**
- Main canvas workspace (large, pannable/zoomable area)
- Top toolbar:
  - Shape creation button(s) - Rectangle, Circle, or Text (whichever is implemented)
  - Zoom controls (optional, can use mouse wheel)
- User presence indicator:
  - List of currently online users (usernames)
- Canvas area:
  - Any existing shapes/objects on the canvas
  - Other users' cursors with name labels
  - User's own cursor

**User Actions:**
- Pan canvas: Click and drag background
- Zoom canvas: Mouse wheel or pinch gesture
- Create shape: Click shape button, then click on canvas to place
- Move shape: Click and drag any shape
- See real-time updates: Watch as other users create/move objects

**Real-Time Behavior:**
- All changes save automatically
- All users see changes within <100ms
- Cursor positions update within <50ms
- When multiple users grab the same object, first user to touch it gets control

**Session Persistence:**
- If user refreshes browser, they stay on canvas page (already authenticated)
- Canvas state loads from server (all objects persist)

**Exit:**
- User simply closes browser tab/window
- No explicit "Save" or "Exit" needed (auto-saved)
- User's presence is removed from online users list

---

## Alternative Flows

### Returning User Flow
**Scenario:** User has already authenticated and returns to the site

**Flow:**
1. User visits CollabCanvas URL
2. System detects existing authentication session
3. User is redirected directly to Canvas page (skip landing + auth)
4. Canvas loads with current state

---

### Session Refresh
**Scenario:** User is on Canvas page and refreshes browser

**Flow:**
1. User presses refresh/F5
2. System verifies authentication session
3. Canvas page reloads
4. Canvas state loads from server
5. User continues editing from where they left off

---

### Logout (Optional - Not Required for MVP)
**Scenario:** User wants to log out

**Flow:**
1. User clicks "Logout" button (if implemented)
2. User session is cleared
3. User is redirected to Landing page

**Note:** This is not essential for MVP and can be deferred.

---

## Page Structure

CollabCanvas has **2 main pages:**

### 1. `/` (Landing Page)
- **Public** - Accessible without authentication
- **Purpose:** Entry point and authentication trigger
- **Elements:**
  - Hero section with project info
  - "Get Started" CTA button
  - Authentication modal (when triggered)

### 2. `/canvas` (Canvas Page)
- **Protected** - Requires authentication
- **Purpose:** Collaborative canvas workspace
- **Elements:**
  - Canvas workspace (pan/zoom area)
  - Shape creation toolbar
  - User presence list
  - Multiplayer cursors

---

## Authentication States

### Unauthenticated User
- Can access: Landing page only
- Cannot access: Canvas page
- Attempting to visit `/canvas` directly → Redirected to landing page

### Authenticated User
- Can access: Both landing page and canvas page
- Default behavior: Auto-redirect to canvas page from landing
- Session persists across browser refreshes

---

## Real-Time Collaboration Flow

### User A Creates Object
1. User A clicks shape button
2. User A clicks on canvas to place shape
3. Shape appears immediately for User A (optimistic update)
4. Shape data sent to server
5. Server broadcasts to all connected users
6. Shape appears on User B's canvas within <100ms

### User A Moves Object
1. User A clicks and drags shape
2. Shape moves in real-time for User A
3. Position updates sent to server (throttled)
4. Server broadcasts position updates
5. User B sees shape moving on their canvas within <100ms

### Conflict Handling
**Scenario:** User A and User B try to move the same object simultaneously

**Resolution:**
1. First user to click the object gets control
2. Server registers first touch timestamp
3. Second user's click is ignored or shows visual feedback (optional: "Object in use")
4. When first user releases object, it becomes available again

**Note:** Exact conflict UX can be refined during implementation, but "first touch wins" is the baseline rule.

---

## Data Flow Summary

```
User Actions → Local Update (Optimistic) → Server Update → Broadcast → All Users See Change
```

**Auto-Save Triggers:**
- Object created → Immediate save
- Object moved → Throttled save (every 100ms during drag)
- Object selected → No save needed
- User cursor moves → Real-time update (50ms throttle)

---

## Key User Expectations

1. **Instant Feedback:** When I create or move something, I see it immediately
2. **Real-Time Sync:** When others create or move things, I see it within 100ms
3. **Always Saved:** I never have to manually save my work
4. **Persistent State:** If I refresh or come back later, my work is still there
5. **Clear Presence:** I can see who else is on the canvas with me
6. **No Conflicts:** If someone else is moving an object, I can't interfere with it

---

## Error States (For Consideration)

### Authentication Errors
- Invalid email/password → Show error message in modal
- Email already exists → Show error message, prompt to login
- Network error during auth → Show retry option

### Canvas Errors
- Failed to load canvas → Show error message, retry button
- Connection lost → Show "Reconnecting..." indicator
- Failed to sync change → Show temporary warning (change may not persist)

**Note:** Error handling details can be refined during implementation.