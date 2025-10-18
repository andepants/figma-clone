# Choosing Between Firestore and Realtime Database

**Quick Reference:** Use Firestore for user data, Realtime Database for canvas collaboration.

---

## Decision Tree

### Use Firestore when:

✅ **Data needs ACID transactions**
- Example: User profiles, subscriptions, payment processing
- Why: Ensures atomicity and consistency
- Use case: Stripe webhook updates subscription status atomically

✅ **Complex queries required**
- Example: Username search, email lookup, subscription tier filtering
- Why: Firestore supports compound queries and indexes
- Use case: Check if username is available during signup

✅ **Infrequent updates**
- Example: User settings, profile updates (once per session or less)
- Why: Firestore read/write costs optimized for infrequent access
- Use case: User changes theme preference

✅ **Strong consistency critical**
- Example: Payment status, subscription entitlements
- Why: No eventual consistency issues with billing
- Use case: Gate features based on subscription tier

✅ **Data is user-centric**
- Example: User profiles, preferences, auth metadata
- Why: Firestore security rules per-user document
- Use case: User can only read/write their own profile

---

### Use Realtime Database when:

✅ **Low-latency real-time sync required**
- Example: Canvas objects, cursor positions
- Why: Sub-100ms update propagation
- Use case: Drag object and see update on other user's screen <50ms

✅ **High-frequency updates occur**
- Example: Object drag (50ms throttle), resize, rotation
- Why: RTDB optimized for rapid writes
- Use case: Dragging objects updates 20 times per second

✅ **Presence/online status tracking**
- Example: Who's viewing the canvas, typing indicators
- Why: Built-in presence system with automatic offline detection
- Use case: Show avatars of online users

✅ **Simple JSON structure suffices**
- Example: Canvas state, project metadata
- Why: No need for complex queries or transactions
- Use case: Store canvas objects as flat JSON tree

✅ **Collaborative features**
- Example: Shared canvas, multiplayer editing
- Why: RTDB designed for real-time collaboration
- Use case: Multiple users editing the same canvas simultaneously

---

## Examples by Feature

| Feature | Storage | Reason |
|---------|---------|--------|
| User profile | Firestore | Needs transactions, complex queries |
| Subscription status | Firestore | Payment integrity, strong consistency |
| User settings | Firestore | Infrequent updates, needs queries |
| Canvas objects | RTDB | Real-time collaboration, high frequency |
| Object positions (x, y) | RTDB | High-frequency updates (drag, resize) |
| Cursor positions | RTDB | Real-time sync, 50ms throttle |
| Projects metadata | RTDB | Fast reads, simple structure |
| Presence (who's online) | RTDB | Built-in presence system |
| Stripe customer ID | Firestore | Payment data, strong consistency |
| Onboarding progress | Firestore | User-specific, infrequent updates |
| Canvas selection state | RTDB | Real-time collaboration |
| User email/username | Firestore | Complex queries (search, uniqueness) |
| Object z-index | RTDB | Collaborative layer ordering |
| Export history | Firestore | User-specific, infrequent access |

---

## Code Examples

### Example 1: User Signup (Firestore)

**When to use:** Creating user profile after authentication

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
      stripePriceId: 'price_1SJGvHGag53vyQGAppC8KBkE',
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

**Why Firestore:**
- User profile needs ACID transactions
- Username uniqueness requires complex query
- Subscription status needs strong consistency

---

### Example 2: Canvas Object Update (Realtime Database)

**When to use:** Dragging/resizing canvas objects in real-time

```typescript
import { ref, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

// Throttled to 50ms in production
async function updateObjectPosition(
  projectId: string,
  objectId: string,
  x: number,
  y: number
) {
  const objectRef = ref(realtimeDb, `projects/${projectId}/objects/${objectId}`);

  await update(objectRef, {
    x,
    y,
    updatedAt: Date.now(),
  });
}
```

**Why Realtime Database:**
- High-frequency updates (20/sec during drag)
- Low-latency sync required (<50ms)
- Multiple users need to see changes immediately

---

### Example 3: Subscription Update (Firestore)

**When to use:** Processing Stripe webhook for payment

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

async function updateSubscription(userId: string, tier: 'founders' | 'pro') {
  const userRef = doc(firestore, 'users', userId);

  await updateDoc(userRef, {
    'subscription.status': tier,
    'subscription.currentPeriodEnd': Date.now() + 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  });
}
```

**Why Firestore:**
- Payment data requires strong consistency
- ACID transaction ensures atomic update
- Subscription status gates feature access

---

### Example 4: Cursor Position (Realtime Database)

**When to use:** Showing other users' cursors in real-time

```typescript
import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

// Throttled to 50ms in production
async function updateCursor(
  projectId: string,
  userId: string,
  x: number,
  y: number
) {
  const cursorRef = ref(realtimeDb, `projects/${projectId}/cursors/${userId}`);

  await set(cursorRef, {
    x,
    y,
    timestamp: Date.now(),
  });
}
```

**Why Realtime Database:**
- Extremely high-frequency updates (20/sec)
- Low-latency sync critical for smooth UX
- Simple structure (x, y, timestamp)

---

### Example 5: Real-time Subscription (Firestore)

**When to use:** Listening for subscription changes in userStore

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

**Why Firestore:**
- Real-time updates for subscription status
- Strong consistency ensures correct entitlements
- Single subscription per user session

---

## Performance Comparison

| Metric | Firestore | Realtime Database |
|--------|-----------|-------------------|
| Read Latency | 100-200ms | 50-100ms |
| Write Latency | 150-300ms | 30-50ms |
| Update Frequency | Low (<1/min) | High (20/sec) |
| Query Complexity | High (compound) | Low (shallow) |
| Transactions | Yes (ACID) | Limited |
| Offline Support | Yes (cache) | Yes (sync) |
| Cost per 100K reads | $0.06 | Included in plan |
| Cost per 100K writes | $0.18 | Included in plan |

---

## Common Patterns

### Pattern 1: Hybrid User + Canvas

**Scenario:** User editing a canvas with real-time collaboration

```typescript
// Firestore: User profile and subscription
const userRef = doc(firestore, 'users', userId);
onSnapshot(userRef, (snapshot) => {
  // Update userStore with subscription status
});

// Realtime Database: Canvas objects
const objectsRef = ref(realtimeDb, `projects/${projectId}/objects`);
onValue(objectsRef, (snapshot) => {
  // Update canvasStore with objects
});
```

**Why both:**
- User data needs strong consistency (Firestore)
- Canvas needs real-time sync (RTDB)

---

### Pattern 2: Webhook to Firestore, UI to RTDB

**Scenario:** Stripe webhook updates user, UI shows canvas

```typescript
// Cloud Function (webhook handler)
const db = admin.firestore();
await db.collection('users').doc(userId).update({
  'subscription.status': 'founders',
});

// Client (canvas interaction)
const objectRef = ref(realtimeDb, `projects/${projectId}/objects/${objectId}`);
await update(objectRef, { x: 100, y: 200 });
```

**Why separate:**
- Payments → Firestore (strong consistency)
- Canvas → RTDB (low latency)

---

## Anti-Patterns (Don't Do This!)

### ❌ Storing User Profiles in Realtime Database

**Why not:**
- No complex queries (can't search by username)
- No ACID transactions (subscription updates not atomic)
- Security rules less granular

**Instead:** Use Firestore `/users/{uid}` collection

---

### ❌ Storing Canvas Objects in Firestore

**Why not:**
- High latency (150-300ms writes)
- High cost (frequent updates = many writes)
- Not optimized for real-time sync

**Instead:** Use Realtime Database `/projects/{projectId}/objects`

---

### ❌ Mixing Storage for Same Data Type

**Why not:**
- Confusing for developers
- Dual writes = sync issues
- Harder to maintain

**Instead:** Pick one database per data type and stick with it

---

## Migration Checklist

When adding a new feature, ask:

1. ☑️ **Is this user-specific data?**
   - Yes → Firestore `/users/{uid}`
   - No → Continue to #2

2. ☑️ **Does it require payment integrity?**
   - Yes → Firestore (subscription)
   - No → Continue to #3

3. ☑️ **Is it real-time collaborative?**
   - Yes → RTDB `/projects/{projectId}`
   - No → Continue to #4

4. ☑️ **Are updates high-frequency (>1/sec)?**
   - Yes → RTDB (canvas objects)
   - No → Continue to #5

5. ☑️ **Do you need presence tracking?**
   - Yes → RTDB (presence/cursors)
   - No → Continue to #6

6. ☑️ **Do you need complex queries?**
   - Yes → Firestore (user search)
   - No → RTDB (simple reads)

---

## Troubleshooting

### Issue: "Should I use Firestore or RTDB for this feature?"

**Ask yourself:**
- Is it user profile data? → Firestore
- Is it canvas collaboration? → RTDB
- Is it payment-related? → Firestore
- Does it update >1/sec? → RTDB
- Do I need complex queries? → Firestore

**Still unsure?** Default to:
- Firestore for user-centric features
- RTDB for canvas-centric features

---

### Issue: "Can I use both databases for the same feature?"

**Generally avoid** dual storage, but hybrid patterns are OK:

✅ **OK:** User profile in Firestore + user's cursor in RTDB
- Different data types, different use cases

❌ **Not OK:** User profile in both Firestore and RTDB
- Same data, dual writes = sync issues

---

### Issue: "What about offline support?"

**Firestore:**
- Persistent cache enabled by default
- Offline reads from cache
- Offline writes queued and synced when online

**Realtime Database:**
- Automatic offline sync
- Writes queued and replayed when online
- onDisconnect() for presence cleanup

**Recommendation:**
- Both databases support offline
- Choose based on data characteristics, not offline support

---

## References

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Choosing a Database](https://firebase.google.com/docs/firestore/rtdb-vs-firestore)
- Internal: `_docs/architecture/data-storage-architecture.md`
- Internal: `src/stores/userStore.ts`
- Internal: `src/lib/firebase/config.ts`

---

## Summary

**Golden Rule:** Firestore for users, Realtime Database for canvas.

**Quick Decision:**
- Need transactions or queries? → Firestore
- Need real-time or high-frequency? → RTDB

**When in doubt:**
- User data → Firestore
- Canvas data → RTDB

---

## Changelog

**2025-10-18:** Initial guide created based on production implementation
