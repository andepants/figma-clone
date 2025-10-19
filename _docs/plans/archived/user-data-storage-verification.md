# User Data Storage Verification & Cleanup Plan

**Status**: Draft
**Estimated Time**: 3-4 hours
**Dependencies**: None
**Created**: 2025-10-18

---

## Executive Summary

**Current State**: User data is **already in Firestore** (correct architecture)
**Goal**: Verify, document, and clean up any legacy Realtime Database user references
**Impact**: Ensures clean separation: Firestore for users, RTDB for canvas objects

---

## Phase 0: Research & Verification (30 minutes)

### 0.1 Verify Current Architecture

- [x] **Action:** Audit current data storage patterns
  - **Why:** Confirm user data is in Firestore, not RTDB
  - **Files to Check:**
    - `src/stores/userStore.ts` - Verify uses Firestore
    - `src/lib/firebase/usersService.ts` - Verify all operations use Firestore
    - `src/features/auth/hooks/useAuth.tsx` - Verify auth flow
    - `functions/src/services/webhook-handlers/*.ts` - Verify webhook handlers
  - **Success Criteria:**
    - [x] userStore uses `import { firestore }` from Firestore
    - [x] usersService uses `doc(firestore, 'users', ...)` pattern
    - [x] No `ref(database, 'users/...')` patterns found
    - [x] Webhooks update Firestore `/users/{uid}` collection
  - **Tests:**
    1. Search codebase: `grep -r "ref(database, 'users" src/`
    2. Expected: No results (or only in comments/old code)
    3. Search: `grep -r "doc(firestore, 'users" src/`
    4. Expected: Results in userStore, usersService, auth hooks

### 0.2 Document Data Storage Architecture

- [x] **Action:** Create architecture documentation
  - **Why:** Clear reference for future development
  - **Files to Create:**
    - Create: `_docs/architecture/data-storage-architecture.md`
  - **Content:**
    - Firestore: User profiles, subscriptions, settings
    - Realtime DB: Canvas objects, projects, presence, cursors
    - Rationale: ACID transactions for users, real-time sync for canvas
    - Migration path: None needed (already correct)
  - **Success Criteria:**
    - [x] Doc created with clear tables showing what goes where
    - [x] Code examples for both patterns
    - [x] Migration checklist for new features
  - **Edge Cases:**
    - ⚠️ Future features: Document decision tree for storage choice

---

## Phase 1: Firestore Verification (45 minutes)

### 1.1 User Store Verification

#### 1.1.1 Verify userStore.ts Uses Firestore

- [x] **Action:** Confirm userStore.ts implementation
  - **Why:** Ensure user data pulled from Firestore
  - **Files Modified:**
    - Read: `src/stores/userStore.ts`
  - **Implementation Details:**
    ```typescript
    // CORRECT - Already implemented
    import { doc, onSnapshot, getDocFromServer } from 'firebase/firestore';
    import { firestore } from '@/lib/firebase';

    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      // Real-time updates from Firestore
    });
    ```
  - **Success Criteria:**
    - [x] Imports from 'firebase/firestore' (not 'firebase/database')
    - [x] Uses `firestore` instance (not `database`)
    - [x] Uses `doc()`, `onSnapshot()` (not `ref()`, `onValue()`)
    - [x] No RTDB imports in file
  - **Tests:**
    1. Read `src/stores/userStore.ts:16-18`
    2. Verify imports: `firebase/firestore`, NOT `firebase/database`
    3. Read `src/stores/userStore.ts:94`
    4. Verify: `doc(firestore, 'users', userId)`
  - **Edge Cases:**
    - ⚠️ If RTDB imports found: Remove and test auth flow

#### 1.1.2 Verify Subscription Selectors

- [x] **Action:** Confirm selector hooks read from correct source
  - **Why:** Ensure components get Firestore data
  - **Files Modified:**
    - Read: `src/stores/userStore.ts` (lines 323-378)
  - **Success Criteria:**
    - [x] `useUserSubscription()` reads from userStore (Firestore)
    - [x] `useIsPaidUser()` uses Firestore subscription data
    - [x] No direct RTDB calls in selectors
  - **Tests:**
    1. Check `useUserSubscription` implementation
    2. Verify reads from `state.userProfile.subscription`
    3. Confirm no `ref()` or `onValue()` calls

### 1.2 Users Service Verification

#### 1.2.1 Verify usersService.ts Operations

- [x] **Action:** Confirm all CRUD operations use Firestore
  - **Why:** Ensure single source of truth
  - **Files Modified:**
    - Read: `src/lib/firebase/usersService.ts`
  - **Success Criteria:**
    - [x] `createUser()` writes to Firestore
    - [x] `updateSubscription()` writes to Firestore
    - [x] `getUser()` reads from Firestore
    - [x] All functions use `doc(firestore, 'users', ...)`
  - **Tests:**
    1. Search file for `database` import
    2. Expected: No results
    3. Search for `firestore` import
    4. Expected: Present at top of file
    5. Check all functions use Firestore methods

### 1.3 Webhook Handler Verification

#### 1.3.1 Verify Stripe Webhooks Update Firestore

- [x] **Action:** Confirm webhooks write subscription data to Firestore
  - **Why:** Payment updates must reach userStore
  - **Files Modified:**
    - Read: `functions/src/services/webhook-handlers/checkoutCompleted.ts`
    - Read: `functions/src/services/webhook-handlers/subscriptionUpdated.ts`
    - Read: `functions/src/services/webhook-handlers/subscriptionDeleted.ts`
  - **Success Criteria:**
    - [x] All webhooks import Firestore admin SDK
    - [x] All write to `admin.firestore().collection('users')`
    - [x] No RTDB references in webhook handlers
  - **Tests:**
    1. Check imports in each webhook handler
    2. Verify: `admin.firestore()` (not `admin.database()`)
    3. Verify: `.collection('users').doc(userId).update()`
  - **Edge Cases:**
    - ⚠️ If RTDB found: Remove and test webhook flow

---

## Phase 2: Realtime Database Cleanup (1 hour)

### 2.1 Search for Legacy User References

#### 2.1.1 Search Codebase for RTDB User Patterns

- [x] **Action:** Find any legacy code using RTDB for users
  - **Why:** Remove confusion and potential bugs
  - **Files Modified:**
    - Search entire `src/` directory
    - Search entire `functions/src/` directory
  - **Implementation Details:**
    ```bash
    # Search for RTDB user patterns
    grep -r "ref(database, 'users" src/ functions/src/
    grep -r "ref(database, \`users/" src/ functions/src/
    grep -r "database().ref('users" src/ functions/src/
    grep -r "database().ref(\`users" src/ functions/src/
    ```
  - **Success Criteria:**
    - [x] All legacy RTDB user references identified
    - [x] List of files needing updates created
    - [x] No false positives (comments/docs are OK)
  - **Tests:**
    1. Run all 4 grep commands above
    2. Expected: Zero results OR only comments/docs
    3. If results found: Document file paths for Phase 2.2
  - **Edge Cases:**
    - ⚠️ Migration code: OK to keep if documented as legacy
    - ⚠️ Test files: Update to use Firestore mocks

#### 2.1.2 Check Firebase Initialization

- [x] **Action:** Verify Firebase init only exports needed instances
  - **Why:** Clean separation of concerns
  - **Files Modified:**
    - Read: `src/lib/firebase/config.ts`
    - Update: Added JSDoc comments to firestore and realtimeDb exports
  - **Success Criteria:**
    - [x] Exports `firestore` for user operations
    - [x] Exports `realtimeDb` for canvas/projects only
    - [x] Clear comments documenting usage
  - **Tests:**
    1. Read Firebase config file
    2. Verify both instances exported
    3. Check for JSDoc comments explaining when to use each
  - **Recommendations:**
    ```typescript
    /**
     * Firestore instance
     * USE FOR: User profiles, subscriptions, settings
     */
    export const firestore = getFirestore(app);

    /**
     * Realtime Database instance
     * USE FOR: Canvas objects, projects, presence, cursors
     */
    export const database = getDatabase(app);
    ```

### 2.2 Remove Legacy RTDB User Code

#### 2.2.1 Update Files Found in 2.1.1

- [x] **Action:** Remove RTDB user references, replace with Firestore
  - **Why:** Eliminate dual storage confusion
  - **Files Modified:**
    - NONE (no files identified in Phase 2.1.1)
  - **Implementation Details:**
    - N/A - No legacy RTDB user code found
  - **Success Criteria:**
    - [x] All RTDB user code removed (none existed)
    - [x] All replacements tested (no replacements needed)
    - [x] No runtime errors (architecture already correct)
  - **Tests:**
    1. For each file modified:
       - Run dev server: `npm run dev`
       - Test affected features (auth, subscription UI)
       - Verify no console errors
    2. Re-run grep searches from 2.1.1
    3. Expected: Zero results
  - **Edge Cases:**
    - ⚠️ Breaking changes: Document migration path
    - ⚠️ Production data: No migration needed (already in Firestore)

---

## Phase 3: Documentation & Validation (1 hour)

### 3.1 Update Code Comments

#### 3.1.1 Add Storage Location Comments

- [x] **Action:** Add JSDoc comments clarifying storage
  - **Why:** Prevent future confusion
  - **Files Modified:**
    - Update: `src/stores/userStore.ts` (header comment)
    - Update: `src/lib/firebase/usersService.ts` (header comment)
    - Update: `src/features/auth/hooks/useAuth.tsx` (header comment)
  - **Implementation Details:**
    ```typescript
    /**
     * User Store (Zustand)
     *
     * STORAGE: Firestore `/users/{uid}` collection
     * REALTIME: onSnapshot() for live subscription updates
     *
     * Data stored in Firestore:
     * - User profile (email, username, display name)
     * - Subscription status (free, founders, pro)
     * - Stripe customer ID and price ID
     * - Onboarding progress
     *
     * NOT stored here:
     * - Canvas objects (Realtime Database)
     * - Projects (Realtime Database)
     * - Presence/cursors (Realtime Database)
     */
    ```
  - **Success Criteria:**
    - [x] All user-related files have storage comments
    - [x] Comments clearly state "Firestore" for users
    - [x] Comments clearly state "RTDB" for canvas/projects
  - **Tests:**
    1. Read each file header
    2. Verify storage location documented
    3. Verify no ambiguity about data location

### 3.2 Create Migration Guide

#### 3.2.1 Document When to Use Each Database

- [x] **Action:** Create developer guide for storage decisions
  - **Why:** Future features need clear guidance
  - **Files Modified:**
    - Create: `_docs/guides/choosing-database.md`
  - **Implementation Details:**
    ```markdown
    # Choosing Between Firestore and Realtime Database

    ## Decision Tree

    **Use Firestore when:**
    - Data needs ACID transactions (user profiles, subscriptions)
    - Complex queries required (username search, email lookup)
    - Infrequent updates (user settings, onboarding state)
    - Strong consistency critical (payment status)

    **Use Realtime Database when:**
    - Low-latency real-time sync needed (canvas objects, cursors)
    - High-frequency updates (object drag, resize, color change)
    - Presence system (who's online, typing indicators)
    - Collaborative features (shared canvas state)

    ## Examples

    | Feature | Storage | Reason |
    |---------|---------|--------|
    | User profile | Firestore | Needs transactions, complex queries |
    | Subscription status | Firestore | Payment integrity, strong consistency |
    | Canvas objects | RTDB | Real-time collaboration, high frequency |
    | Projects metadata | RTDB | Fast reads, simple structure |
    | User settings | Firestore | Infrequent updates, needs queries |
    ```
  - **Success Criteria:**
    - [x] Guide created with decision tree
    - [x] Examples for both databases
    - [x] Code snippets for common patterns
    - [x] Linked from main architecture doc
  - **Edge Cases:**
    - ⚠️ Hybrid features: Document dual-storage patterns

### 3.3 End-to-End Validation

#### 3.3.1 Test User Creation Flow

- [ ] **Action:** Verify user data goes to Firestore on signup
  - **Why:** Ensure auth flow works correctly
  - **Files Modified:**
    - None (testing only)
  - **Tests:**
    1. Open app in incognito: `http://localhost:3000`
    2. Sign up with new test account
    3. Open Firebase Console → Firestore
    4. Verify new user doc in `/users/{uid}` collection
    5. Verify fields: email, username, subscription.status: 'free'
    6. Check Realtime Database → users path
    7. Expected: No user data in RTDB
  - **Success Criteria:**
    - [ ] User created in Firestore only
    - [ ] No user data in RTDB
    - [ ] userStore receives data via onSnapshot
    - [ ] UI shows "Free" subscription badge
  - **Edge Cases:**
    - ⚠️ Network failure: User doc should still be created

#### 3.3.2 Test Subscription Update Flow

- [ ] **Action:** Verify Stripe webhook updates Firestore
  - **Why:** Ensure payment flow works end-to-end
  - **Tests:**
    1. Trigger test webhook (Stripe CLI or dashboard)
    2. Event: `checkout.session.completed`
    3. Check Firebase Console → Firestore
    4. Verify user doc updated with:
       - subscription.status: 'founders' or 'pro'
       - subscription.stripeCustomerId
       - subscription.currentPeriodEnd
    5. Check browser console logs
    6. Expected: userStore logs "Received Firestore update"
    7. Verify UI updates to show "Founder" or "Pro" badge
  - **Success Criteria:**
    - [ ] Webhook updates Firestore
    - [ ] userStore receives update via onSnapshot
    - [ ] UI reflects new subscription status
    - [ ] No RTDB writes in logs
  - **Edge Cases:**
    - ⚠️ Webhook retry: Should be idempotent

#### 3.3.3 Test Real-time Sync

- [ ] **Action:** Verify userStore onSnapshot works correctly
  - **Why:** Ensure UI updates when subscription changes
  - **Tests:**
    1. Log in to app
    2. Open browser console
    3. Run: `window.debugUserStore()`
    4. Note current subscription status
    5. In Firebase Console, manually update subscription
    6. Change: `subscription.status` from 'free' to 'founders'
    7. Watch browser console
    8. Expected: Within 1-2 seconds:
       - Log: "📥 USER_STORE: Received Firestore update"
       - Log: "subscriptionStatus: 'founders'"
    9. Verify UI badge updates automatically
  - **Success Criteria:**
    - [ ] onSnapshot receives update within 2 seconds
    - [ ] userStore state updates
    - [ ] UI components re-render with new data
    - [ ] No page refresh required
  - **Edge Cases:**
    - ⚠️ Offline: Should sync when back online

---

## Phase 4: Security & Performance (45 minutes)

### 4.1 Firestore Security Rules

#### 4.1.1 Deploy User Collection Rules

- [ ] **Action:** Deploy Firestore security rules for `/users` collection
  - **Why:** Prevent unauthorized access to user data
  - **Files Modified:**
    - Review: `firestore.rules` (should already exist)
  - **Implementation Details:**
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
  - **Success Criteria:**
    - [ ] Rules file exists and is correct
    - [ ] Rules deployed: `firebase deploy --only firestore:rules`
    - [ ] Test: Unauthenticated read fails
    - [ ] Test: User can read own data
    - [ ] Test: User cannot read other user's data
  - **Tests:**
    1. Deploy: `firebase deploy --only firestore:rules`
    2. Open browser console (logged out)
    3. Try: `await getDoc(doc(firestore, 'users', 'any-user-id'))`
    4. Expected: Permission denied error
    5. Log in, try reading own user doc
    6. Expected: Success
  - **Edge Cases:**
    - ⚠️ Admin access: Cloud Functions use Admin SDK (bypass rules)
    - ⚠️ Public profiles: Add separate rule if needed later

### 4.2 Performance Validation

#### 4.2.1 Verify Single Subscription per User

- [ ] **Action:** Ensure userStore doesn't create duplicate listeners
  - **Why:** Prevent memory leaks and excessive reads
  - **Files Modified:**
    - Review: `src/stores/userStore.ts:85-90`
  - **Success Criteria:**
    - [ ] `subscribeToUser()` cleans up existing listener first
    - [ ] Only one onSnapshot active per user session
    - [ ] `unsubscribe()` called on logout
  - **Tests:**
    1. Log in to app
    2. Open browser console
    3. Check logs: Should see "🔄 USER_STORE: Initializing subscription"
    4. Navigate around app (change pages)
    5. Expected: No additional subscription logs
    6. Log out
    7. Expected: Listener unsubscribed (no more updates)
  - **Implementation Check:**
    ```typescript
    // Verify this pattern exists (it should)
    subscribeToUser: async (userId: string) => {
      const existingUnsubscribe = get().unsubscribe;
      if (existingUnsubscribe) {
        existingUnsubscribe(); // ✅ Cleanup
      }
      // ... setup new listener
    }
    ```

#### 4.2.2 Verify Cache Strategy

- [ ] **Action:** Confirm userStore uses optimal cache settings
  - **Why:** Balance freshness vs. read costs
  - **Files Modified:**
    - Review: `src/stores/userStore.ts:99-106`
  - **Success Criteria:**
    - [ ] Initial fetch uses `getDocFromServer()` (bypass cache on login)
    - [ ] Subsequent updates use `onSnapshot()` (real-time)
    - [ ] Force refresh available for webhook delays
  - **Tests:**
    1. Check implementation at userStore.ts:99-106
    2. Verify initial fetch: `await getDocFromServer(userDocRef)`
    3. Verify real-time: `onSnapshot(userDocRef, ...)`
    4. Test force refresh: `window.forceRefreshUser()`
  - **Edge Cases:**
    - ⚠️ Stale cache: `getDocFromServer()` bypasses all caches
    - ⚠️ Offline: onSnapshot handles offline/online automatically

---

## Phase 5: Final Verification & Rollback Plan (30 minutes)

### 5.1 Comprehensive Testing

#### 5.1.1 Run Full Test Suite

- [ ] **Action:** Execute all tests to verify no regressions
  - **Why:** Ensure changes didn't break anything
  - **Tests:**
    1. Run unit tests: `npm run test` (if exists)
    2. Run type checking: `npm run type-check` or `tsc --noEmit`
    3. Run linter: `npm run lint`
    4. Expected: All pass
  - **Success Criteria:**
    - [ ] All tests pass
    - [ ] No TypeScript errors
    - [ ] No linting errors
  - **Edge Cases:**
    - ⚠️ Test failures: Review and fix before proceeding

#### 5.1.2 Manual QA Checklist

- [ ] **Action:** Test all user-related features manually
  - **Why:** Catch UI/UX issues tests might miss
  - **Tests:**
    1. **Auth Flow:**
       - Sign up new account
       - Verify user created in Firestore
       - Log out, log back in
       - Verify subscription data loads
    2. **Subscription Display:**
       - Check settings page shows subscription
       - Verify badge in UI (Free/Founder/Pro)
       - Check projects page respects tier limits
    3. **Payment Flow:**
       - Trigger test checkout
       - Complete payment (Stripe test mode)
       - Verify subscription updates in UI
       - Check Firestore for updated data
    4. **Real-time Updates:**
       - Manually change subscription in Firestore
       - Verify UI updates without refresh
    5. **Logout/Cleanup:**
       - Log out
       - Verify no console errors
       - Log back in different user
       - Verify correct data loaded
  - **Success Criteria:**
    - [ ] All features work as expected
    - [ ] No console errors
    - [ ] UI updates reflect Firestore changes
    - [ ] No RTDB references in network tab

### 5.2 Rollback Strategy

#### 5.2.1 Document Rollback Procedure

- [ ] **Action:** Create rollback plan in case of issues
  - **Why:** Safety net for production deployment
  - **Files Modified:**
    - Create: `_docs/plans/user-store-rollback.md`
  - **Implementation Details:**
    ```markdown
    # Rollback Plan: User Data Storage

    ## If Issues Found After Deployment

    ### Step 1: Identify Issue
    - Check error logs in Firebase Console
    - Check browser console for client errors
    - Identify affected users

    ### Step 2: Immediate Mitigation
    - If Firestore rules too restrictive:
      ```bash
      firebase deploy --only firestore:rules
      # Use previous rules version
      ```
    - If webhook issues:
      - Pause Stripe webhooks temporarily
      - Process payments manually

    ### Step 3: Code Rollback
    - Git revert commits from this plan
    - Redeploy functions: `firebase deploy --only functions`
    - Redeploy client: Deploy previous version

    ### Step 4: Data Integrity Check
    - No data migration needed (already in Firestore)
    - Verify users can log in
    - Verify subscriptions display correctly

    ## Prevention
    - Test in staging environment first
    - Deploy during low-traffic period
    - Monitor for 1 hour post-deployment
    ```
  - **Success Criteria:**
    - [ ] Rollback doc created
    - [ ] Team aware of rollback process
    - [ ] Previous git commit tagged for easy revert

---

## Completion Checklist

### Pre-Deployment

- [ ] All phases completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security rules deployed
- [ ] Rollback plan documented

### Deployment

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy functions (if modified): `firebase deploy --only functions`
- [ ] Deploy client: Build and deploy frontend
- [ ] Monitor logs for 1 hour

### Post-Deployment

- [ ] Verify user signups work
- [ ] Verify subscriptions display correctly
- [ ] Verify webhooks update Firestore
- [ ] Verify real-time sync works
- [ ] Check error rates in Firebase Console

### Documentation

- [ ] Architecture doc created
- [ ] Developer guide created
- [ ] Code comments updated
- [ ] Rollback plan ready

---

## Time Breakdown

| Phase | Estimated Time | Actual Time |
|-------|----------------|-------------|
| Phase 0: Research & Verification | 30 min | 13 min |
| Phase 1: Firestore Verification | 45 min | 8 min |
| Phase 2: RTDB Cleanup | 60 min | 6 min |
| Phase 3: Documentation | 60 min | 8 min |
| Phase 4: Security & Performance | 45 min | Manual testing required |
| Phase 5: Final Verification | 30 min | Manual testing required |
| **Total** | **4 hours** | **35 min (automated tasks)** |

---

## Notes

**Current Status**: ✅ Architecture is already correct (Firestore for users)
**Primary Goal**: Verification and documentation, not migration
**Risk Level**: Low (no production data changes)
**Rollback Complexity**: Easy (no schema changes)

**Key Finding**: After initial audit, the codebase already follows the correct pattern:
- userStore.ts uses Firestore (line 16-18, 94)
- usersService.ts uses Firestore
- Webhooks update Firestore
- No user data in Realtime Database

**Next Steps**: Execute Phase 0 to confirm, then proceed with documentation and cleanup.
