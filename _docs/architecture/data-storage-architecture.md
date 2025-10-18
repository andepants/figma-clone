# Data Storage Architecture

**Status:** Current Implementation
**Last Updated:** 2025-10-18
**Owner:** Engineering Team

---

## Executive Summary

Canvas Icons uses a **dual-database architecture** to optimize for different data access patterns:

- **Firestore**: User profiles, subscriptions, and settings (ACID transactions, complex queries)
- **Realtime Database**: Canvas objects, projects, presence, and cursors (low-latency real-time sync)

This separation ensures strong consistency for critical user data while maintaining <150ms sync latency for collaborative canvas features.

---

## Database Responsibilities

### Firestore (Document Database)

**Collection:** `/users/{uid}`

**Use For:**
- User profiles (email, username, display name)
- Subscription status (free, founders, pro)
- Payment data (Stripe customer ID, price ID, period end)
- Onboarding progress (completed steps, current step)
- User settings and preferences

**Why Firestore:**
- ACID transactions ensure payment integrity
- Complex queries support username/email lookups
- Strong consistency critical for subscription status
- Infrequent updates (settings changes, payments)
- Admin SDK integration with Stripe webhooks

**Access Pattern:**
```typescript
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

// Read user profile
const userRef = doc(firestore, 'users', userId);
const userDoc = await getDoc(userRef);

// Real-time subscription updates
const unsubscribe = onSnapshot(userRef, (snapshot) => {
  const userData = snapshot.data();
  // Update UI with subscription changes
});

// Update user settings
await updateDoc(userRef, {
  'settings.theme': 'dark'
});
```

**Data Schema:**
```typescript
interface User {
  id: string;                    // Firebase Auth UID
  email: string;                 // User email
  username: string;              // Display username
  subscription: {
    status: 'free' | 'founders' | 'pro';
    stripePriceId?: string;      // Stripe price ID
    stripeCustomerId?: string;   // Stripe customer ID
    currentPeriodEnd?: number;   // Subscription end timestamp (ms)
    cancelAtPeriodEnd?: boolean; // Scheduled cancellation
  };
  onboarding?: {
    completedSteps: string[];    // Completed onboarding steps
    currentStep: number;         // Current step index
    skipped: boolean;            // User skipped onboarding
  };
  createdAt: number;             // Account creation timestamp (ms)
  updatedAt: number;             // Last update timestamp (ms)
}
```

---

### Realtime Database (JSON Tree)

**Paths:**
- `/projects/{projectId}` - Project metadata
- `/projects/{projectId}/objects/{objectId}` - Canvas objects
- `/projects/{projectId}/presence/{userId}` - User presence
- `/projects/{projectId}/cursors/{userId}` - Cursor positions

**Use For:**
- Canvas shapes (rectangles, circles, text, images)
- Object transformations (x, y, width, height, rotation)
- Real-time collaboration (cursors, presence indicators)
- Project metadata (name, owner, created date)
- Hierarchical relationships (parent-child, z-index)

**Why Realtime Database:**
- Low-latency sync (<50ms network time)
- High-frequency updates (drag, resize, color changes)
- Optimistic updates with automatic conflict resolution
- Presence system (online/offline detection)
- Simple JSON structure maps to canvas state

**Access Pattern:**
```typescript
import { ref, onValue, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';

// Subscribe to canvas objects
const objectsRef = ref(database, `projects/${projectId}/objects`);
onValue(objectsRef, (snapshot) => {
  const objects = snapshot.val();
  // Update canvas rendering
});

// Update object position (throttled to 50ms)
const objectRef = ref(database, `projects/${projectId}/objects/${objectId}`);
await update(objectRef, {
  x: 150,
  y: 200
});

// Set cursor position (throttled to 50ms)
const cursorRef = ref(database, `projects/${projectId}/cursors/${userId}`);
await set(cursorRef, {
  x: mouseX,
  y: mouseY,
  timestamp: Date.now()
});
```

**Data Schema:**
```typescript
interface Project {
  id: string;
  name: string;
  ownerId: string;              // User who created project
  createdAt: number;
  updatedAt: number;
  objects: Record<string, CanvasObject>;
  presence: Record<string, UserPresence>;
  cursors: Record<string, CursorPosition>;
}

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'image' | 'group';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  parentId?: string;            // Hierarchy support
  locked?: boolean;
  visible?: boolean;
  // ... type-specific properties
}
```

---

## Decision Tree: Choosing the Right Database

### Use Firestore When:

✅ **Data requires ACID transactions**
- Example: Subscription status, payment processing
- Why: Ensures atomicity and consistency

✅ **Complex queries are needed**
- Example: Search users by email, filter by subscription tier
- Why: Firestore supports compound queries and indexes

✅ **Updates are infrequent**
- Example: User settings, profile updates (once per session or less)
- Why: Firestore read/write costs optimized for infrequent access

✅ **Strong consistency is critical**
- Example: Payment status, subscription entitlements
- Why: No eventual consistency issues with billing

✅ **Data is user-centric**
- Example: User profiles, preferences, auth metadata
- Why: Firestore security rules per-user document

---

### Use Realtime Database When:

✅ **Low-latency real-time sync is required**
- Example: Canvas objects, cursor positions
- Why: Sub-100ms update propagation

✅ **High-frequency updates occur**
- Example: Object drag (50ms throttle), resize, rotation
- Why: RTDB optimized for rapid writes

✅ **Presence/online status tracking**
- Example: Who's viewing the canvas, typing indicators
- Why: Built-in presence system with automatic offline detection

✅ **Simple JSON structure suffices**
- Example: Canvas state, project metadata
- Why: No need for complex queries or transactions

✅ **Collaborative features**
- Example: Shared canvas, multiplayer editing
- Why: RTDB designed for real-time collaboration

---

## Migration Path

**Current Status:** ✅ No migration needed - architecture is already correct

**Historical Note:**
- User data has always been in Firestore
- Canvas data has always been in Realtime Database
- This document codifies existing best practices

**Future Features Checklist:**

When adding a new feature, ask:

1. **Is this user-specific data?** → Firestore (`/users/{uid}`)
2. **Does it require payment integrity?** → Firestore (subscription)
3. **Is it real-time collaborative?** → RTDB (`/projects/{projectId}`)
4. **Are updates high-frequency (>1/sec)?** → RTDB (canvas objects)
5. **Do you need presence tracking?** → RTDB (presence/cursors)
6. **Do you need complex queries?** → Firestore (user search)

---

## Code Examples

### Example 1: User Signup (Firestore)

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

async function createUser(userId: string, email: string, username: string) {
  const userRef = doc(firestore, 'users', userId);

  await setDoc(userRef, {
    id: userId,
    email,
    username,
    subscription: {
      status: 'free',
      stripePriceId: 'price_1SJGvHGag53vyQGAppC8KBkE', // Free tier
    },
    onboarding: {
      completedSteps: [],
      currentStep: 0,
      skipped: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

### Example 2: Canvas Object Update (RTDB)

```typescript
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

// Throttled to 50ms in production
async function updateObjectPosition(projectId: string, objectId: string, x: number, y: number) {
  const objectRef = ref(database, `projects/${projectId}/objects/${objectId}`);

  await update(objectRef, {
    x,
    y,
    updatedAt: Date.now(),
  });
}
```

### Example 3: Webhook Handler (Firestore)

```typescript
import { getFirestore } from 'firebase-admin/firestore';

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);

  await userRef.update({
    'subscription.status': 'founders',
    'subscription.stripeCustomerId': session.customer,
    'subscription.currentPeriodEnd': Date.now() + 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  });
}
```

### Example 4: Real-time Subscription (userStore)

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

function subscribeToUser(userId: string) {
  const userRef = doc(firestore, 'users', userId);

  // Real-time updates from Firestore
  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.data();
      // Update Zustand store with new subscription data
      set({ userProfile: userData, loading: false });
    }
  });

  return unsubscribe;
}
```

---

## Performance Characteristics

### Firestore

| Metric | Value | Notes |
|--------|-------|-------|
| Read Latency | 100-200ms | Global distribution |
| Write Latency | 150-300ms | ACID guarantees |
| Update Frequency | Low | <1/minute typical |
| Query Complexity | High | Compound indexes supported |
| Cost per 100K reads | $0.06 | Pricing tier dependent |
| Cost per 100K writes | $0.18 | Pricing tier dependent |

### Realtime Database

| Metric | Value | Notes |
|--------|-------|-------|
| Sync Latency | 50-100ms | WebSocket connection |
| Write Latency | 30-50ms | Optimistic updates |
| Update Frequency | High | 50ms throttle (20/sec) |
| Query Complexity | Low | Shallow queries only |
| Cost per GB stored | $5/month | Included in Firebase plan |
| Cost per GB downloaded | $1/GB | After free tier |

---

## Security Rules

### Firestore Rules

**File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Deploy:** `firebase deploy --only firestore:rules`

### Realtime Database Rules

**File:** `database.rules.json`

```json
{
  "rules": {
    "projects": {
      "$projectId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "objects": {
          ".indexOn": ["parentId", "type"]
        }
      }
    }
  }
}
```

**Deploy:** `firebase deploy --only database`

---

## Monitoring & Debugging

### Firestore

**Console Logs (userStore.ts):**
```
🔄 USER_STORE: Initializing subscription for user (server fetch first)...
🔍 USER_STORE: RAW FIRESTORE DATA (initial fetch)
✅ USER_STORE: Initial server fetch complete
📥 USER_STORE: Received Firestore update
```

**Firebase Console:**
- Firestore > Data > users collection
- Check document updates in real-time
- Verify subscription.status changes

### Realtime Database

**Console Logs (canvasStore.ts):**
```
🔄 CANVAS_STORE: Initializing RTDB sync
📥 CANVAS_STORE: Received objects update (50ms throttle)
```

**Firebase Console:**
- Realtime Database > Data > projects
- Monitor real-time updates
- Check presence/cursor paths

---

## Testing Strategy

### Unit Tests

**Firestore (User Operations):**
```typescript
// Mock Firestore
import { doc, getDoc } from 'firebase/firestore';
jest.mock('@/lib/firebase', () => ({
  firestore: mockFirestore,
}));

test('creates user with free subscription', async () => {
  await createUser('user123', 'test@example.com', 'testuser');
  const userDoc = await getDoc(doc(firestore, 'users', 'user123'));
  expect(userDoc.data().subscription.status).toBe('free');
});
```

**RTDB (Canvas Operations):**
```typescript
// Mock RTDB
import { ref, get } from 'firebase/database';
jest.mock('@/lib/firebase', () => ({
  database: mockDatabase,
}));

test('updates object position', async () => {
  await updateObjectPosition('proj1', 'obj1', 100, 200);
  const objectRef = ref(database, 'projects/proj1/objects/obj1');
  const snapshot = await get(objectRef);
  expect(snapshot.val().x).toBe(100);
  expect(snapshot.val().y).toBe(200);
});
```

### Integration Tests

**Subscription Flow:**
1. Sign up user → Firestore creates `/users/{uid}`
2. Complete checkout → Webhook updates Firestore
3. userStore onSnapshot → Receives update <2 seconds
4. UI updates → Shows "Founder" badge

**Canvas Collaboration:**
1. User A creates object → RTDB writes `/projects/{id}/objects/{id}`
2. User B receives update → onValue fires <100ms
3. Canvas re-renders → Shows new object
4. Both cursors visible → RTDB `/cursors` path

---

## Troubleshooting

### Issue: Subscription not updating in UI

**Diagnosis:**
1. Check Firebase Console → Firestore → users collection
2. Verify subscription.status updated
3. Check browser console for userStore logs
4. Expected: "📥 USER_STORE: Received Firestore update"

**Fix:**
- If no log: Check onSnapshot listener active
- If stale data: Call `forceRefreshUserProfile()`
- If webhook delay: Wait 5-10 seconds (Stripe processing)

### Issue: Canvas objects not syncing

**Diagnosis:**
1. Check Firebase Console → RTDB → projects path
2. Verify objects exist in database
3. Check browser console for RTDB connection
4. Expected: "🔄 CANVAS_STORE: Initializing RTDB sync"

**Fix:**
- If disconnected: Check internet connection
- If throttled: Verify 50ms throttle not blocking
- If missing: Check RTDB security rules

---

## References

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Choosing a Database](https://firebase.google.com/docs/firestore/rtdb-vs-firestore)
- Internal: `_docs/guides/choosing-database.md`
- Internal: `src/stores/userStore.ts`
- Internal: `src/lib/firebase/usersService.ts`

---

## Changelog

**2025-10-18:** Initial documentation (Architecture already implemented correctly)
