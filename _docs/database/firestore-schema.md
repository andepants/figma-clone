# Firestore Database Schema

**Purpose:** Complete database schema for CanvasIcons with validation rules and denormalization strategy.

**UX Principle:** Data consistency ensures reliable UX across all features.

---

## Collections Overview

```
/users/{userId}                    → User profiles and subscription data
/projects/{projectId}              → Private and public project metadata
/public-projects/{projectId}       → Denormalized public projects (fast queries)
/config/founders-deal              → Founders tier configuration
```

---

## 1. Users Collection

**Path:** `/users/{userId}`

**Purpose:** Store user profiles, subscription status, and onboarding progress.

### Schema

```typescript
{
  id: string;                      // Firebase Auth UID
  email: string;                   // Validated email address
  username: string;                // Unique, 3-20 chars, alphanumeric + underscore
  subscription: {
    status: 'free' | 'founders' | 'pro';
    stripeCustomerId?: string;     // Stripe customer ID (if paid)
    stripePriceId?: string;        // Price ID for current subscription
    currentPeriodEnd?: number;     // Unix timestamp (ms)
    cancelAtPeriodEnd?: boolean;   // For churn prevention
  };
  onboarding: {
    completedSteps: string[];      // ['created_first_project', 'exported_file', etc.]
    currentStep: number;           // 0-4 (for 5-step onboarding)
    skipped: boolean;              // User skipped onboarding
  };
  createdAt: number;               // Unix timestamp (ms)
  updatedAt: number;               // Unix timestamp (ms)
  lastLoginAt: number;             // Unix timestamp (ms) - for engagement tracking
}
```

### Example Document

```json
{
  "id": "abc123xyz",
  "email": "user@example.com",
  "username": "designer_pro",
  "subscription": {
    "status": "founders",
    "stripeCustomerId": "cus_xxxxx",
    "stripePriceId": "price_xxxxx",
    "currentPeriodEnd": 1735689600000,
    "cancelAtPeriodEnd": false
  },
  "onboarding": {
    "completedSteps": ["created_first_project", "exported_file"],
    "currentStep": 2,
    "skipped": false
  },
  "createdAt": 1704067200000,
  "updatedAt": 1704153600000,
  "lastLoginAt": 1704153600000
}
```

### Validation Rules

```typescript
// Username validation
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

// Constraints
- email: Must be valid email format
- username: Unique across all users, 3-20 chars, alphanumeric + underscore only
- subscription.status: Enum ['free', 'founders', 'pro']
- onboarding.currentStep: 0-4 (max 5 steps)
```

### Security Rules

```javascript
match /users/{userId} {
  // Users can read their own document
  allow read: if request.auth != null && request.auth.uid == userId;

  // Users can update their own document (except subscription fields)
  allow update: if request.auth != null
    && request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['subscription']);

  // Only backend can create/update subscription fields
  allow write: if false; // Backend only via Admin SDK
}
```

---

## 2. Projects Collection

**Path:** `/projects/{projectId}`

**Purpose:** Store project metadata, ownership, and collaboration info.

### Schema

```typescript
{
  id: string;                      // UUID v4
  name: string;                    // 1-100 chars
  ownerId: string;                 // User ID (foreign key to /users/{userId})
  template: 'blank' | 'feature-graphic' | 'app-icon';
  isPublic: boolean;               // Default: false
  collaborators: string[];         // Array of user IDs
  createdAt: number;               // Unix timestamp (ms)
  updatedAt: number;               // Unix timestamp (ms)
  thumbnail?: string;              // Base64 data URL or Storage URL (max 500KB)
  objectCount: number;             // Denormalized for quick filtering
}
```

### Example Document

```json
{
  "id": "proj_abc123",
  "name": "iOS App Icon - Blue Theme",
  "ownerId": "abc123xyz",
  "template": "app-icon",
  "isPublic": true,
  "collaborators": ["abc123xyz", "def456uvw"],
  "createdAt": 1704067200000,
  "updatedAt": 1704153600000,
  "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "objectCount": 12
}
```

### Validation Rules

```typescript
// Constraints
- name: 1-100 characters
- ownerId: Must exist in /users collection
- template: Enum ['blank', 'feature-graphic', 'app-icon']
- isPublic: Boolean (default false)
- collaborators: Array of user IDs (owner always included)
- thumbnail: Max 500KB, base64 or Storage URL
- objectCount: Integer >= 0
```

### Security Rules

```javascript
match /projects/{projectId} {
  // Public projects readable by anyone
  allow read: if resource.data.isPublic == true;

  // Private projects readable by owner and collaborators
  allow read: if request.auth != null
    && (request.auth.uid == resource.data.ownerId
        || request.auth.uid in resource.data.collaborators);

  // Only owner can update/delete
  allow update, delete: if request.auth != null
    && request.auth.uid == resource.data.ownerId;

  // Paid users can create projects
  allow create: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscription.status in ['founders', 'pro'];
}
```

---

## 3. Public Projects Collection (Denormalized)

**Path:** `/public-projects/{projectId}`

**Purpose:** Fast queries for public project listing without hitting main /projects collection.

### Schema

```typescript
{
  projectId: string;               // Same as /projects/{projectId}
  name: string;                    // Duplicated for fast display
  ownerId: string;                 // Duplicated
  ownerUsername: string;           // Denormalized from /users
  thumbnail?: string;              // Duplicated
  updatedAt: number;               // Duplicated for sorting
  objectCount: number;             // Duplicated for filtering
}
```

### Example Document

```json
{
  "projectId": "proj_abc123",
  "name": "iOS App Icon - Blue Theme",
  "ownerId": "abc123xyz",
  "ownerUsername": "designer_pro",
  "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "updatedAt": 1704153600000,
  "objectCount": 12
}
```

### Sync Strategy

**When to create/update:**
- Create when project `isPublic` changed from `false` → `true`
- Update when project `name`, `thumbnail`, or `objectCount` changes
- Delete when project `isPublic` changed from `true` → `false`
- Delete when project is deleted

**Implementation:**
- Use Cloud Functions (Firestore triggers) to keep in sync
- OR use client-side transactions to update both collections

### Security Rules

```javascript
match /public-projects/{projectId} {
  // Anyone can read public projects
  allow read: if true;

  // Only backend can write (via Cloud Functions or Admin SDK)
  allow write: if false;
}
```

---

## 4. Config Collection

**Path:** `/config/founders-deal`

**Purpose:** Store Founders tier configuration and availability.

### Schema

```typescript
{
  spotsTotal: number;              // Total spots (10)
  spotsRemaining: number;          // Spots left (updated on each purchase)
  priceId: string;                 // Stripe Price ID
  active: boolean;                 // Deal still active?
}
```

### Example Document

```json
{
  "spotsTotal": 10,
  "spotsRemaining": 7,
  "priceId": "price_xxxxx",
  "active": true
}
```

### Security Rules

```javascript
match /config/{docId} {
  // Anyone can read config
  allow read: if true;

  // Only backend can write
  allow write: if false;
}
```

---

## Realtime Database (RTDB) Schema

**Purpose:** Real-time canvas objects and presence data.

**Path:** `/canvases/{projectId}/objects`

### Schema

```typescript
{
  canvases: {
    [projectId: string]: {
      objects: {
        [objectId: string]: CanvasObject;  // See existing canvas types
      };
      presence: {
        [userId: string]: {
          cursor: { x: number; y: number };
          color: string;
          username: string;
          lastSeen: number;  // Unix timestamp
        };
      };
    };
  };
}
```

**Note:** RTDB schema is already implemented. This schema is for new multi-project support.

### Migration Strategy

**Current:** `/canvases/main/objects`
**New:** `/canvases/{projectId}/objects`

1. Create default project for existing users
2. Migrate `/canvases/main/objects` → `/canvases/{defaultProjectId}/objects`
3. Update canvas service to use dynamic project ID

---

## Edge Cases & Error Handling

### 1. Orphaned Projects
**Scenario:** User deletes account but owns projects.

**Solution:**
- Mark projects as `ownerId: 'deleted'`
- Transfer ownership to first collaborator
- OR delete projects if no collaborators

### 2. Username Conflicts
**Scenario:** Two users try to claim same username.

**Solution:**
- Firestore transaction to check uniqueness
- If taken, append random suffix: `username_1234`
- OR show error and ask user to pick different username

### 3. Public Project Sync Failure
**Scenario:** Project marked public but /public-projects not updated.

**Solution:**
- Cloud Function retry logic (exponential backoff)
- Manual sync tool in admin panel
- Periodic cleanup job to find inconsistencies

### 4. Subscription Status Mismatch
**Scenario:** Stripe says 'active' but Firestore says 'free'.

**Solution:**
- Webhook updates Firestore (source of truth: Stripe)
- Periodic reconciliation job (every 24 hours)
- User refresh button to force sync

---

## Indexes

### Firestore Composite Indexes

```javascript
// Query: Get user's projects sorted by updatedAt
collection: projects
fields: [ownerId ASC, updatedAt DESC]

// Query: Get public projects sorted by updatedAt
collection: public-projects
fields: [updatedAt DESC]

// Query: Get projects by template
collection: projects
fields: [template ASC, updatedAt DESC]

// Query: Get user by username
collection: users
fields: [username ASC] // Unique index
```

### RTDB Indexes

```json
{
  "rules": {
    "canvases": {
      "$projectId": {
        ".indexOn": ["updatedAt"]
      }
    }
  }
}
```

---

## Data Size Limits

### Firestore
- Max document size: **1MB**
- Max array size: **20,000 elements** (collaborators array limit)
- Max write batch: **500 operations**

### RTDB
- Max node depth: **32 levels**
- Max key length: **768 bytes**
- Max write size: **256MB** (per write operation)

### Thumbnail Strategy
- Store thumbnails < 100KB in Firestore (base64 data URL)
- Store thumbnails > 100KB in Firebase Storage (reference URL)
- Max thumbnail size: **500KB** (enforced client-side)

---

## Migration Checklist

- [ ] Create `/users` collection with Auth triggers
- [ ] Create `/projects` collection
- [ ] Create `/public-projects` collection
- [ ] Create `/config/founders-deal` document
- [ ] Migrate existing canvas to default project
- [ ] Update RTDB structure for multi-project
- [ ] Set up Cloud Functions for denormalization
- [ ] Create Firestore security rules
- [ ] Create composite indexes
- [ ] Test all queries with production-like data

---

## Next Steps

1. Create TypeScript types matching this schema (`src/types/*.types.ts`)
2. Implement Firestore service (`src/lib/firebase/firestore.ts`)
3. Create Cloud Functions for denormalization
4. Write security rules (`firestore.rules`)
5. Set up composite indexes (`firestore.indexes.json`)
6. Test with production-like data (1000+ projects)
