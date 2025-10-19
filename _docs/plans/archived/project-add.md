# Project Collaboration System - Implementation Plan

**Project:** Canvas Icons - Private Projects with Invite-Based Collaboration
**Estimated Time:** 12-16 hours
**Dependencies:** Firebase Realtime Database, Authentication system
**Last Updated:** 2025-10-18

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 17/24 tasks completed (71%)

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
- Tasks 3.2.1 & 3.2.2: Firebase security rules require manual deployment (`firebase deploy --only database`) - marked as blocked for automated execution

**Decision Log:**
- 2025-10-18 - All projects default to private (isPublic: false) except PUBLIC_PLAYGROUND
- 2025-10-18 - Invited users have full edit permissions (no read-only mode)
- 2025-10-18 - Primary UI for adding users lives in PresenceDropdown (top-right)
- 2025-10-18 - Kicked users disconnect immediately with redirect

**Lessons Learned:**
- [Things discovered during implementation]

---

# Phase 0: Research & Planning

## 0.1 Research Context
- [x] Document existing patterns in codebase
  - **What to find:** Project access patterns, collaboration components, Firebase security rules
  - **Where to look:** `src/lib/firebase/projectsService.ts`, `src/features/collaboration/`, `database.rules.json`
  - **Success:** Create summary of findings
  - **Files Reviewed:**
    - `src/types/project.types.ts`
    - `src/lib/firebase/projectsService.ts`
    - `src/features/collaboration/components/PresenceDropdown.tsx`
    - `src/features/projects/components/ProjectCard.tsx`
    - `database.rules.json`

## 0.2 Design Decisions
- [x] Define technical approach
  - **Success:** Document architecture decisions (see Decision Log above)

### Summary of Findings

**Current Architecture:**
- Projects stored in Realtime DB at `/projects/{projectId}`
- Project type has: `id, name, ownerId, isPublic, collaborators[], createdAt, updatedAt, thumbnail, objectCount`
- Collaborators array already exists but not fully utilized
- PresenceDropdown shows active users with AvatarStack
- Security rules allow owner to write, public projects readable by all
- `getUserProjects()` fetches projects where `ownerId === userId`
- `getPublicProjectsForUser()` fetches public projects where user is collaborator

**Key Insights:**
- Data model already supports collaboration (no schema changes needed!)
- Need to expand project fetching to include `collaborators.includes(userId)`
- PresenceDropdown is perfect location for add/remove UI
- Security rules need update to allow collaborators to write
- User lookup requires new service function (search by email/username)

---

# Phase 1: Backend Services (Estimated: 3-4 hours)

**Goal:** Create backend functions for user lookup and collaborator management

**Phase Success Criteria:**
- [ ] Users can be found by email or username
- [ ] Collaborators can be added/removed from projects
- [ ] Project fetching includes collaborated projects

---

## 1.1 User Lookup System

### 1.1.1 Create User Search Service
- [x] **Action:** Add `findUserByEmailOrUsername()` function to auth service
  - **Why:** Need to search for users to invite to projects
  - **Files Modified:**
    - Created: `src/lib/firebase/authService.ts`
    - Updated: `src/lib/firebase/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * Find user by email or username
 * @param query - Email or username to search for
 * @returns User data or null if not found
 */
export async function findUserByEmailOrUsername(
  query: string
): Promise<{ uid: string; username: string; email: string } | null> {
  // Search in users collection by email or username
  // Return uid, username, email
  // Return null if not found
}
```
  - **Success Criteria:**
    - [x] Function exists in `src/lib/firebase/authService.ts`
    - [x] Function has JSDoc comment
    - [x] Function exported from `src/lib/firebase/index.ts`
    - [x] Function has proper TypeScript types
  - **Tests:**
    1. Search for existing user by email: `findUserByEmailOrUsername('test@example.com')`
    2. Expected: Returns `{ uid, username, email }` object
    3. Search for non-existent user: `findUserByEmailOrUsername('fake@fake.com')`
    4. Expected: Returns `null`
    5. Search by username if supported
  - **Edge Cases:**
    - ✓ Empty query string → return null immediately
    - ✓ Invalid email format → still search (might match username)
    - ✓ Query is current user's email → allow (handled in UI layer)
    - ✓ Case sensitivity → normalize to lowercase for comparison (email only)
    - ✓ Firebase Auth vs users collection → searches Firestore users collection
  - **Rollback:** Remove function from authService.ts and index.ts export
  - **Last Verified:** 2025-10-18

---

## 1.2 Collaborator Management

### 1.2.1 Add Collaborator Function
- [x] **Action:** Create `addCollaborator()` function in projectsService
  - **Why:** Add users to project collaborators array
  - **Files Modified:**
    - Updated: `src/lib/firebase/projectsService.ts`
    - Updated: `src/lib/firebase/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * Add collaborator to project
 * @param projectId - Project ID
 * @param userId - User ID to add as collaborator
 * @throws Error if project not found or user already collaborator
 */
export async function addCollaborator(
  projectId: string,
  userId: string
): Promise<void> {
  const projectRef = ref(realtimeDb, `projects/${projectId}`);
  const snapshot = await get(projectRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found');
  }

  const project = snapshot.val() as Project;

  if (project.collaborators.includes(userId)) {
    throw new Error('User is already a collaborator');
  }

  await update(projectRef, {
    collaborators: [...project.collaborators, userId],
    updatedAt: Date.now(),
  });
}
```
  - **Success Criteria:**
    - [x] Function exists in projectsService.ts with JSDoc
    - [x] Function exported from index.ts
    - [x] Function validates project exists
    - [x] Function checks for duplicate collaborators
    - [x] Function updates Realtime DB with new collaborator
  - **Tests:**
    1. Create test project with owner
    2. Add collaborator: `addCollaborator(projectId, userId2)`
    3. Expected: No errors, collaborators array now includes userId2
    4. Try adding same user again
    5. Expected: Error thrown "User is already a collaborator"
    6. Try with non-existent projectId
    7. Expected: Error thrown "Project not found"
  - **Edge Cases:**
    - ⚠️ Adding owner as collaborator → owner should already be in array (don't add again)
    - ⚠️ Non-existent project → throw error
    - ⚠️ User already in collaborators → throw error with clear message
    - ⚠️ Empty userId → validate input, throw error
    - ⚠️ Concurrent additions → Firebase handles atomically via update()
  - **Rollback:** Remove function from projectsService.ts
  - **Last Verified:** 2025-10-18

### 1.2.2 Remove Collaborator Function
- [x] **Action:** Create `removeCollaborator()` function in projectsService
  - **Why:** Remove users from project collaborators array (kick functionality)
  - **Files Modified:**
    - Updated: `src/lib/firebase/projectsService.ts`
    - Updated: `src/lib/firebase/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * Remove collaborator from project
 * @param projectId - Project ID
 * @param userId - User ID to remove
 * @param requestingUserId - User making the request (for permission check)
 * @throws Error if not owner, trying to remove owner, or user not found
 */
export async function removeCollaborator(
  projectId: string,
  userId: string,
  requestingUserId: string
): Promise<void> {
  const projectRef = ref(realtimeDb, `projects/${projectId}`);
  const snapshot = await get(projectRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found');
  }

  const project = snapshot.val() as Project;

  // Only owner can remove collaborators
  if (project.ownerId !== requestingUserId) {
    throw new Error('Only owner can remove collaborators');
  }

  // Cannot remove owner
  if (userId === project.ownerId) {
    throw new Error('Cannot remove project owner');
  }

  if (!project.collaborators.includes(userId)) {
    throw new Error('User is not a collaborator');
  }

  await update(projectRef, {
    collaborators: project.collaborators.filter(id => id !== userId),
    updatedAt: Date.now(),
  });
}
```
  - **Success Criteria:**
    - [x] Function exists with JSDoc and exported
    - [x] Function validates requesting user is owner
    - [x] Function prevents removing owner
    - [x] Function validates user is collaborator before removing
    - [x] Function updates Realtime DB
  - **Tests:**
    1. Create project with owner and 2 collaborators
    2. Owner removes collaborator: `removeCollaborator(projectId, userId2, ownerId)`
    3. Expected: No errors, collaborators array no longer includes userId2
    4. Non-owner tries to remove: `removeCollaborator(projectId, userId3, userId2)`
    5. Expected: Error "Only owner can remove collaborators"
    6. Owner tries to remove self: `removeCollaborator(projectId, ownerId, ownerId)`
    7. Expected: Error "Cannot remove project owner"
    8. Remove user not in collaborators
    9. Expected: Error "User is not a collaborator"
  - **Edge Cases:**
    - ⚠️ Owner removes self → prevent with error
    - ⚠️ Non-owner attempts removal → validate requestingUserId === ownerId
    - ⚠️ Removing last collaborator (only owner left) → allow
    - ⚠️ User not in collaborators → throw error
    - ⚠️ Concurrent removals → Firebase handles atomically
  - **Rollback:** Remove function from projectsService.ts
  - **Last Verified:** 2025-10-18

---

## 1.3 Project Fetching Updates

### 1.3.1 Create Get Collaborated Projects Function
- [x] **Action:** Add `getCollaboratedProjects()` function to projectsService
  - **Why:** Fetch projects where user is collaborator but not owner
  - **Files Modified:**
    - Updated: `src/lib/firebase/projectsService.ts`
    - Updated: `src/lib/firebase/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * Get projects where user is collaborator (not owner)
 * @param userId - User ID
 * @returns Array of projects where user is collaborator, sorted by updatedAt
 */
export async function getCollaboratedProjects(userId: string): Promise<Project[]> {
  const projectsRef = ref(realtimeDb, 'projects');
  const snapshot = await get(projectsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const projectsData = snapshot.val() as Record<string, Project>;
  return Object.values(projectsData)
    .filter(
      project =>
        project.collaborators.includes(userId) &&
        project.ownerId !== userId &&
        project.id !== 'PUBLIC_PLAYGROUND' // Exclude playground
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
```
  - **Success Criteria:**
    - [x] Function exists with JSDoc
    - [x] Function filters for collaborators only (not owner)
    - [x] Function excludes PUBLIC_PLAYGROUND
    - [x] Function sorts by updatedAt descending
    - [x] Function exported from index.ts
  - **Tests:**
    1. Create 3 projects: owned by userId1, collaborated by userId2
    2. Fetch: `getCollaboratedProjects(userId2)`
    3. Expected: Returns 3 projects, sorted newest first
    4. Verify none have ownerId === userId2
    5. Verify all have userId2 in collaborators array
    6. Verify PUBLIC_PLAYGROUND not included (if applicable)
  - **Edge Cases:**
    - ⚠️ User is both owner and collaborator → exclude (filter ownerId !== userId)
    - ⚠️ PUBLIC_PLAYGROUND in results → explicitly filter out
    - ⚠️ No collaborated projects → return empty array []
    - ⚠️ User removed from project mid-query → stale data acceptable
  - **Rollback:** Remove function from projectsService.ts
  - **Last Verified:** 2025-10-18

### 1.3.2 Update getUserProjects to Include Collaborated Projects
- [x] **Action:** Create new `getAllUserProjects()` function that combines owned + collaborated
  - **Why:** Single function to get all projects user can access
  - **Files Modified:**
    - Updated: `src/lib/firebase/projectsService.ts`
    - Updated: `src/lib/firebase/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * Get all projects accessible by user (owned + collaborated)
 * @param userId - User ID
 * @returns Combined array of owned and collaborated projects, sorted by updatedAt
 */
export async function getAllUserProjects(userId: string): Promise<Project[]> {
  const ownedProjects = await getUserProjects(userId);
  const collaboratedProjects = await getCollaboratedProjects(userId);

  // Combine and sort by updatedAt
  return [...ownedProjects, ...collaboratedProjects].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}
```
  - **Success Criteria:**
    - [x] Function exists with JSDoc
    - [x] Function calls both getUserProjects and getCollaboratedProjects
    - [x] Function combines results and sorts
    - [x] Function exported from index.ts
    - [x] No duplicate projects in result
  - **Tests:**
    1. Create user with 2 owned projects, 2 collaborated projects
    2. Fetch: `getAllUserProjects(userId)`
    3. Expected: Returns 4 projects total
    4. Verify no duplicates
    5. Verify sorted by updatedAt descending
    6. Verify includes both owned and collaborated
  - **Edge Cases:**
    - ⚠️ User has only owned projects → return only owned
    - ⚠️ User has only collaborated projects → return only collaborated
    - ⚠️ User has no projects → return empty array
    - ⚠️ Duplicate projects → shouldn't happen (filter prevents) but verify
  - **Rollback:** Remove function from projectsService.ts
  - **Last Verified:** 2025-10-18

---

# Phase 2: UI Components (Estimated: 4-5 hours)

**Goal:** Create UI for adding/removing collaborators

**Phase Success Criteria:**
- [ ] Modal exists for adding users by email/username
- [ ] PresenceDropdown shows add/remove buttons for owner
- [ ] ProjectCard displays collaboration status

---

## 2.1 Add User Modal

### 2.1.1 Create AddUserModal Component
- [x] **Action:** Create new modal component for adding users to project
  - **Why:** Provide UI for searching and adding collaborators
  - **Files Modified:**
    - Created: `src/features/collaboration/components/AddUserModal.tsx`
    - Updated: `src/features/collaboration/components/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * AddUserModal Component
 *
 * Modal for adding collaborators to a project by email or username.
 * Shows search input, found user preview, and add button.
 */
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentCollaborators: string[]; // Array of userIds already in project
  onUserAdded: () => void; // Callback after successful add
}

// UI Structure:
// - Search input (email or username)
// - Search button
// - Loading state while searching
// - Found user card (avatar, username, email)
// - "Add to Project" button
// - Error messages (not found, already added, etc.)
```
  - **Success Criteria:**
    - [x] Component file created with JSDoc header
    - [x] Props interface defined with TypeScript
    - [x] Modal uses custom modal pattern (consistent with CreateProjectModal)
    - [x] Search input with label "Email or Username"
    - [x] Loading state displays while searching
    - [x] Found user displays with avatar and name
    - [x] Error states handled (not found, already added)
    - [x] "Add" button calls addCollaborator service
    - [x] Success closes modal and calls onUserAdded callback
    - [x] Component exported from index.ts
  - **Tests:**
    1. Open modal, enter valid email, click search
    2. Expected: User card appears with avatar and name
    3. Click "Add to Project"
    4. Expected: Modal closes, success toast shown
    5. Open modal, enter email of existing collaborator
    6. Expected: Error "User is already a collaborator on this project"
    7. Open modal, enter non-existent email
    8. Expected: Error "User not found"
    9. Open modal, press Escape
    10. Expected: Modal closes without action
  - **Edge Cases:**
    - ⚠️ Empty search query → disable search button
    - ⚠️ Search for self (owner) → allow search but show error on add
    - ⚠️ Already a collaborator → show error immediately after search
    - ⚠️ Network error during search → show generic error message
    - ⚠️ Network error during add → show error, keep modal open to retry
    - ⚠️ User types during search → cancel previous search
    - ⚠️ Close modal during add operation → cancel operation
  - **Rollback:** Delete AddUserModal.tsx, remove export from index.ts
  - **Last Verified:** 2025-10-18

---

## 2.2 Update PresenceDropdown

### 2.2.1 Add Owner Badge to Users
- [x] **Action:** Show "Owner" badge next to owner in PresenceDropdown
  - **Why:** Clearly indicate who owns the project
  - **Files Modified:**
    - Updated: `src/features/collaboration/components/PresenceDropdown.tsx`
  - **Implementation Details:**
```typescript
// Add ownerId prop to PresenceDropdownProps
interface PresenceDropdownProps {
  users: PresenceUser[];
  trigger: React.ReactNode;
  ownerId: string; // NEW
  currentUserId: string; // NEW
  onAddUser?: () => void; // NEW - callback to open AddUserModal
  onRemoveUser?: (userId: string) => void; // NEW - callback to remove user
  className?: string;
}

// In user list item, show badge:
{user.userId === ownerId && (
  <span className="text-xs text-blue-600 font-medium">Owner</span>
)}
```
  - **Success Criteria:**
    - [ ] ownerId prop added to interface
    - [ ] Owner badge displays next to owner's name
    - [ ] Badge styled with blue color and "Owner" text
    - [ ] Badge appears in addition to "(You)" badge if owner is current user
  - **Tests:**
    1. Open PresenceDropdown as owner
    2. Expected: Your name shows "Owner" badge and "(You)" badge
    3. Open PresenceDropdown as collaborator
    4. Expected: Owner's name shows "Owner" badge (no "You" badge)
  - **Edge Cases:**
    - ⚠️ Owner is current user → show both "Owner" and "(You)" badges
    - ⚠️ Owner offline → badge still shows if owner in users list
  - **Rollback:** Revert PresenceDropdown.tsx changes
  - **Last Verified:** 2025-10-18

### 2.2.2 Add Remove Buttons for Owner
- [x] **Action:** Add X buttons next to collaborators (owner only)
  - **Why:** Allow owner to remove collaborators from project
  - **Files Modified:**
    - Updated: `src/features/collaboration/components/PresenceDropdown.tsx`
  - **Implementation Details:**
```typescript
// In user list item, conditionally show X button:
{currentUserId === ownerId && user.userId !== ownerId && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onRemoveUser?.(user.userId);
    }}
    className="text-gray-400 hover:text-red-600 transition-colors"
    title="Remove from project"
    aria-label={`Remove ${user.username} from project`}
  >
    <X className="w-3 h-3" />
  </button>
)}
```
  - **Success Criteria:**
    - [ ] X button appears next to collaborators (not owner)
    - [ ] X button only visible to owner
    - [ ] X button has hover state (red color)
    - [ ] Clicking X calls onRemoveUser callback with userId
    - [ ] X button has accessible label
  - **Tests:**
    1. Open PresenceDropdown as owner
    2. Expected: X buttons appear next to all collaborators except you
    3. Hover over X button
    4. Expected: Icon turns red
    5. Click X button
    6. Expected: onRemoveUser callback fired with correct userId
    7. Open PresenceDropdown as collaborator
    8. Expected: No X buttons visible
  - **Edge Cases:**
    - ⚠️ Owner trying to remove self → no X button shown on owner
    - ⚠️ Non-owner viewing → no X buttons at all
    - ⚠️ Clicking X while user disconnects → handle gracefully
  - **Rollback:** Revert PresenceDropdown.tsx changes
  - **Last Verified:** 2025-10-18

### 2.2.3 Add "Add User" Button for Owner
- [x] **Action:** Add "Add User" button at bottom of PresenceDropdown (owner only)
  - **Why:** Provide entry point to open AddUserModal
  - **Files Modified:**
    - Updated: `src/features/collaboration/components/PresenceDropdown.tsx`
  - **Implementation Details:**
```typescript
// After user list, before closing PopoverContent:
{currentUserId === ownerId && (
  <div className="border-t border-gray-200 p-2">
    <button
      onClick={onAddUser}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
    >
      <UserPlus className="w-4 h-4" />
      Add User
    </button>
  </div>
)}
```
  - **Success Criteria:**
    - [ ] Button appears at bottom of dropdown (owner only)
    - [ ] Button shows UserPlus icon and "Add User" text
    - [ ] Button has primary color styling
    - [ ] Button calls onAddUser callback when clicked
    - [ ] Button has hover state
  - **Tests:**
    1. Open PresenceDropdown as owner
    2. Expected: "Add User" button visible at bottom
    3. Click "Add User"
    4. Expected: onAddUser callback fired (modal should open)
    5. Open PresenceDropdown as collaborator
    6. Expected: "Add User" button not visible
  - **Edge Cases:**
    - ⚠️ Non-owner viewing → button hidden
    - ⚠️ PUBLIC_PLAYGROUND → might want to hide button entirely
  - **Rollback:** Revert PresenceDropdown.tsx changes
  - **Last Verified:** 2025-10-18

---

## 2.3 Project Card Updates

### 2.3.1 Add Collaboration Badge to ProjectCard
- [x] **Action:** Show "Shared with you" badge for collaborated projects
  - **Why:** Distinguish owned vs collaborated projects in projects portal
  - **Files Modified:**
    - Updated: `src/features/projects/components/ProjectCard.tsx`
  - **Implementation Details:**
```typescript
// Add currentUserId prop to ProjectCardProps
interface ProjectCardProps {
  project: Project;
  currentUserId: string; // NEW
  onRename: (projectId: string, newName: string) => void;
  onDelete: (projectId: string) => void;
  onToggleVisibility?: (projectId: string, isPublic: boolean) => void;
}

// In thumbnail section, replace visibility badge with role badge:
<div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm shadow-sm">
  {project.ownerId === currentUserId ? (
    <>
      <User className="w-3 h-3 text-blue-600" />
      <span className="text-xs font-medium text-blue-600">Owner</span>
    </>
  ) : (
    <>
      <Users className="w-3 h-3 text-green-600" />
      <span className="text-xs font-medium text-green-600">Shared</span>
    </>
  )}
</div>
```
  - **Success Criteria:**
    - [ ] currentUserId prop added to interface
    - [ ] Badge shows "Owner" for owned projects
    - [ ] Badge shows "Shared" for collaborated projects
    - [ ] Badge uses appropriate icons and colors
  - **Tests:**
    1. Render ProjectCard for owned project
    2. Expected: Badge shows "Owner" with User icon (blue)
    3. Render ProjectCard for collaborated project
    4. Expected: Badge shows "Shared" with Users icon (green)
  - **Edge Cases:**
    - ⚠️ Project missing ownerId → default to "Shared"
    - ⚠️ currentUserId not provided → show generic badge or none
  - **Rollback:** Revert ProjectCard.tsx changes
  - **Last Verified:** 2025-10-18

### 2.3.2 Disable Actions for Non-Owners
- [x] **Action:** Disable rename, delete, visibility toggle for collaborators
  - **Why:** Only owner should modify project metadata
  - **Files Modified:**
    - Updated: `src/features/projects/components/ProjectCard.tsx`
  - **Implementation Details:**
```typescript
// Compute isOwner flag
const isOwner = project.ownerId === currentUserId;

// Conditionally show hover actions
{showActions && !isRenaming && (
  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
    {isOwner && (
      <>
        <button onClick={handleRenameClick}>
          <Pencil />
        </button>
        {onToggleVisibility && (
          <button onClick={handleToggleVisibility}>
            {project.isPublic ? <Lock /> : <Globe />}
          </button>
        )}
        <button onClick={handleDelete}>
          <Trash2 />
        </button>
      </>
    )}
  </div>
)}
```
  - **Success Criteria:**
    - [ ] isOwner flag computed from ownerId comparison
    - [ ] Rename button only shown to owner
    - [ ] Delete button only shown to owner
    - [ ] Visibility toggle only shown to owner
    - [ ] Card still clickable to open canvas for collaborators
  - **Tests:**
    1. Render ProjectCard as owner, hover over card
    2. Expected: Rename, delete, visibility buttons appear
    3. Render ProjectCard as collaborator, hover over card
    4. Expected: No action buttons appear (just empty overlay or none)
    5. Click card as collaborator
    6. Expected: Navigates to canvas (not blocked)
  - **Edge Cases:**
    - ⚠️ Collaborator tries to rename via direct edit → prevent in handler
    - ⚠️ Collaborator double-clicks → navigate, don't enter rename mode
  - **Rollback:** Revert ProjectCard.tsx changes
  - **Last Verified:** 2025-10-18

---

# Phase 3: Real-time Access & Security (Estimated: 3-4 hours)

**Goal:** Enforce access control and handle real-time kick events

**Phase Success Criteria:**
- [ ] Kicked users disconnected immediately
- [ ] Database rules enforce owner/collaborator permissions
- [ ] Access checked before canvas loads

---

## 3.1 Real-time Access Enforcement

### 3.1.1 Create useProjectAccess Hook
- [x] **Action:** Create hook to monitor collaborators array and handle removal
  - **Why:** Detect when user is kicked and disconnect them immediately
  - **Files Modified:**
    - Created: `src/features/collaboration/hooks/useProjectAccess.ts`
    - Updated: `src/features/collaboration/hooks/index.ts` (add export)
  - **Implementation Details:**
```typescript
/**
 * useProjectAccess Hook
 *
 * Monitors project collaborators array in real-time.
 * Redirects user to /projects if removed from project.
 *
 * @param projectId - Current project ID
 * @param currentUserId - Current user ID
 */
export function useProjectAccess(projectId: string, currentUserId: string | null) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId || !projectId) return;

    // Subscribe to project collaborators
    const projectRef = ref(realtimeDb, `projects/${projectId}`);

    const unsubscribe = onValue(projectRef, (snapshot) => {
      if (!snapshot.exists()) {
        // Project deleted
        toast.error('Project no longer exists');
        navigate('/projects');
        return;
      }

      const project = snapshot.val() as Project;

      // Check if current user still has access
      const hasAccess =
        project.ownerId === currentUserId ||
        project.collaborators.includes(currentUserId);

      if (!hasAccess) {
        // User was removed
        toast.error('You were removed from this project');
        navigate('/projects');
      }
    });

    return unsubscribe;
  }, [projectId, currentUserId, navigate]);
}
```
  - **Success Criteria:**
    - [ ] Hook file created with JSDoc
    - [ ] Hook subscribes to project in Realtime DB
    - [ ] Hook checks collaborators array on every update
    - [ ] Hook redirects to /projects if user removed
    - [ ] Hook shows toast notification on removal
    - [ ] Hook cleans up subscription on unmount
    - [ ] Hook exported from index.ts
  - **Tests:**
    1. Open canvas as collaborator
    2. Expected: Canvas loads normally
    3. Have owner remove you via PresenceDropdown
    4. Expected: Immediately redirected to /projects with toast
    5. Open canvas, delete project from another tab
    6. Expected: Redirected with "Project no longer exists" message
  - **Edge Cases:**
    - ⚠️ Owner removes self → shouldn't be possible (prevented in UI)
    - ⚠️ Project deleted mid-session → handle with "Project no longer exists"
    - ⚠️ Network disconnect → don't trigger false removal
    - ⚠️ Hook runs before currentUserId available → guard with early return
    - ⚠️ Rapid re-subscription → Firebase handles automatically
  - **Rollback:** Delete useProjectAccess.ts, remove export
  - **Last Verified:** 2025-10-18

### 3.1.2 Integrate useProjectAccess into CanvasPage
- [x] **Action:** Add useProjectAccess hook to CanvasPage component
  - **Why:** Monitor access while user is on canvas
  - **Files Modified:**
    - Updated: `src/pages/CanvasPage.tsx`
  - **Implementation Details:**
```typescript
// Import hook
import { useProjectAccess } from '@/features/collaboration/hooks';

// Inside CanvasPage component
function CanvasPage() {
  const { projectId } = useParams();
  const { currentUser } = useAuth();

  // Monitor access - will redirect if removed
  useProjectAccess(projectId, currentUser?.uid || null);

  // ... rest of component
}
```
  - **Success Criteria:**
    - [ ] Hook imported from collaboration/hooks
    - [ ] Hook called with projectId and currentUserId
    - [ ] Hook called before canvas renders
  - **Tests:**
    1. Open canvas as collaborator
    2. Have owner kick you
    3. Expected: Redirected immediately (within 1-2 seconds)
    4. Toast appears: "You were removed from this project"
  - **Edge Cases:**
    - ⚠️ Hook runs multiple times → Firebase subscription handles efficiently
    - ⚠️ User navigates away during redirect → no issue
  - **Rollback:** Remove hook call from CanvasPage.tsx
  - **Last Verified:** 2025-10-18

---

## 3.2 Database Security Rules

### 3.2.1 Update Project Write Rules
- [!] **Action:** Allow collaborators to write to project (for canvas objects)
  - **Note:** Firebase security rules require manual deployment and testing
  - **Why:** Collaborators need edit permissions for canvas data
  - **Files Modified:**
    - Update: `database.rules.json`
  - **Implementation Details:**
```json
"projects": {
  "$projectId": {
    ".write": "auth != null && (
      data.child('ownerId').val() == auth.uid ||
      data.child('collaborators').hasChild(auth.uid) ||
      !data.exists()
    )"
  }
}
```
  - **Success Criteria:**
    - [ ] Rule updated in database.rules.json
    - [ ] Owner can write
    - [ ] Collaborators can write
    - [ ] Non-collaborators cannot write
    - [ ] New projects can be created (owner)
  - **Tests:**
    1. Deploy rules: `firebase deploy --only database`
    2. Test as owner: Create/update project
    3. Expected: Success
    4. Test as collaborator: Update project.updatedAt
    5. Expected: Success
    6. Test as non-collaborator: Try to update project
    7. Expected: Permission denied error
  - **Edge Cases:**
    - ⚠️ Owner removing collaborator → owner can write
    - ⚠️ Creating new project → !data.exists() allows creation
    - ⚠️ PUBLIC_PLAYGROUND → specific rule may be needed
  - **Rollback:** Revert database.rules.json, redeploy
  - **Last Verified:**

### 3.2.2 Update Canvas Objects Write Rules
- [!] **Action:** Allow collaborators to write canvas objects
  - **Note:** Firebase security rules require manual deployment and testing
  - **Why:** Collaborators need to add/edit/delete canvas objects
  - **Files Modified:**
    - Update: `database.rules.json`
  - **Implementation Details:**
```json
"canvases": {
  "$canvasId": {
    "objects": {
      ".write": "auth != null && (
        root.child('projects').child($canvasId).child('ownerId').val() == auth.uid ||
        root.child('projects').child($canvasId).child('collaborators').hasChild(auth.uid)
      )"
    }
  }
}
```
  - **Success Criteria:**
    - [ ] Rule checks project's ownerId
    - [ ] Rule checks project's collaborators array
    - [ ] Owner can write objects
    - [ ] Collaborators can write objects
    - [ ] Non-collaborators cannot write
  - **Tests:**
    1. Deploy rules: `firebase deploy --only database`
    2. Test as owner: Add canvas object
    3. Expected: Success
    4. Test as collaborator: Add canvas object
    5. Expected: Success
    6. Test as non-collaborator: Try to add object
    7. Expected: Permission denied
  - **Edge Cases:**
    - ⚠️ Canvas ID doesn't match project ID → ensure they're the same
    - ⚠️ Project deleted but canvas exists → handle gracefully
    - ⚠️ Performance of nested read in rule → Firebase optimizes this
  - **Rollback:** Revert database.rules.json, redeploy
  - **Last Verified:**

---

## 3.3 Canvas Page Access Check

### 3.3.1 Add Initial Access Check to CanvasPage
- [x] **Action:** Verify user has access before loading canvas
  - **Note:** Already implemented - found existing access check using canUserAccessProject()
  - **Why:** Prevent unauthorized access on initial page load
  - **Files Modified:**
    - Update: `src/pages/CanvasPage.tsx`
  - **Implementation Details:**
```typescript
// In project loading useEffect
useEffect(() => {
  async function checkAccess() {
    if (!currentUser || !projectId) return;

    setProjectLoading(true);
    try {
      const project = await getProject(projectId);

      if (!project) {
        setProjectError('Project not found');
        return;
      }

      // Check access
      const hasAccess = canUserAccessProject(project, currentUser.uid);
      if (!hasAccess) {
        setProjectError('You do not have access to this project');
        return;
      }

      setProject(project);
      setProjectError(null);
    } catch (error) {
      console.error('Failed to load project:', error);
      setProjectError('Failed to load project');
    } finally {
      setProjectLoading(false);
    }
  }

  checkAccess();
}, [currentUser, projectId]);

// Show error state if no access
if (projectError) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-4">{projectError}</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Projects
        </button>
      </div>
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Access checked on initial load
    - [ ] canUserAccessProject used for validation
    - [ ] Error message shown if no access
    - [ ] "Back to Projects" button navigates away
    - [ ] Canvas doesn't render if no access
  - **Tests:**
    1. Open canvas as owner
    2. Expected: Canvas loads normally
    3. Open canvas as collaborator
    4. Expected: Canvas loads normally
    5. Open canvas URL for project you're not in
    6. Expected: "Access Denied" message with back button
    7. Click "Back to Projects"
    8. Expected: Navigate to /projects
  - **Edge Cases:**
    - ⚠️ Project doesn't exist → show "Project not found"
    - ⚠️ User not logged in → redirect handled by auth guard
    - ⚠️ PUBLIC_PLAYGROUND → should be accessible (check canUserAccessProject handles this)
  - **Rollback:** Revert CanvasPage.tsx changes
  - **Last Verified:** 2025-10-18 (pre-existing implementation verified)

---

# Phase 4: Projects Portal Integration (Estimated: 2-3 hours)

**Goal:** Update projects portal to show collaborated projects

**Phase Success Criteria:**
- [ ] Collaborated projects appear in portal
- [ ] Projects sorted correctly (owned + collaborated)
- [ ] Free users see collaborated projects

---

## 4.1 Update Projects Data Hook

### 4.1.1 Replace getPublicProjectsForUser with getAllUserProjects
- [x] **Action:** Update useProjectsData to use new combined function
  - **Why:** Fetch both owned and collaborated projects together
  - **Files Modified:**
    - Updated: `src/pages/projects/hooks/useProjectsData.ts`
  - **Implementation Details:**
```typescript
// Remove separate publicProjects state
// Replace with single projects state that includes both

useEffect(() => {
  async function fetchProjects() {
    if (!currentUserId) return;

    try {
      setIsLoading(true);

      // Fetch all projects (owned + collaborated)
      const allProjects = await getAllUserProjects(currentUserId);
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  }

  fetchProjects();
}, [currentUserId]);
```
  - **Success Criteria:**
    - [ ] getAllUserProjects imported and used
    - [ ] Single projects state (no separate publicProjects)
    - [ ] Fetches regardless of canCreateProjects flag
    - [ ] Error handling in place
  - **Tests:**
    1. Log in as user with 2 owned, 2 collaborated projects
    2. Navigate to /projects
    3. Expected: All 4 projects appear
    4. Verify sorting by updatedAt (newest first)
  - **Edge Cases:**
    - ⚠️ Free user with no owned but has collaborated → show collaborated
    - ⚠️ Paid user with only owned → show only owned
    - ⚠️ User with no projects → show empty state
  - **Rollback:** Revert useProjectsData.ts changes
  - **Last Verified:** 2025-10-18

---

## 4.2 Update Projects Page

### 4.2.1 Pass currentUserId to ProjectCard Components
- [x] **Action:** Update ProjectsPage to pass currentUserId to ProjectCard
  - **Why:** ProjectCard needs to know ownership for badge and actions
  - **Files Modified:**
    - Updated: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```typescript
// In projects map/render
{projects.map((project) => (
  <ProjectCard
    key={project.id}
    project={project}
    currentUserId={currentUser?.uid || ''}
    onRename={handleRename}
    onDelete={handleDelete}
    onToggleVisibility={handleToggleVisibility}
  />
))}
```
  - **Success Criteria:**
    - [ ] currentUserId prop passed to all ProjectCard instances
    - [ ] Handles null currentUser gracefully (empty string fallback)
  - **Tests:**
    1. View projects page
    2. Expected: All project cards render with correct badges
    3. Owned projects show "Owner" badge
    4. Collaborated projects show "Shared" badge
  - **Edge Cases:**
    - ⚠️ currentUser is null → use empty string to prevent crashes
  - **Rollback:** Revert ProjectsPage changes
  - **Last Verified:** 2025-10-18

### 4.2.2 Update Section Headers (Optional)
- [ ] **Action:** Add section divider between owned and collaborated projects
  - **Why:** Visually separate owned vs collaborated projects
  - **Note:** Skipping - optional enhancement, can be added later if needed
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```typescript
// Split projects into owned and collaborated
const ownedProjects = projects.filter(p => p.ownerId === currentUser?.uid);
const collaboratedProjects = projects.filter(p => p.ownerId !== currentUser?.uid);

// Render with section headers
<div>
  {ownedProjects.length > 0 && (
    <div>
      <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ownedProjects.map(project => <ProjectCard ... />)}
      </div>
    </div>
  )}

  {collaboratedProjects.length > 0 && (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Shared with You</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collaboratedProjects.map(project => <ProjectCard ... />)}
      </div>
    </div>
  )}
</div>
```
  - **Success Criteria:**
    - [ ] Projects split into owned and collaborated
    - [ ] Section headers displayed
    - [ ] Sections only shown if projects exist
    - [ ] Grid layout maintained
  - **Tests:**
    1. View projects page with both owned and collaborated
    2. Expected: Two sections with headers
    3. View with only owned projects
    4. Expected: Only "Your Projects" section
    5. View with only collaborated
    6. Expected: Only "Shared with You" section
  - **Edge Cases:**
    - ⚠️ No projects → show empty state (existing behavior)
  - **Rollback:** Revert ProjectsPage changes
  - **Last Verified:**

---

## 4.3 Connect Modal to PresenceDropdown

### 4.3.1 Add Modal State to PropertiesPanel
- [x] **Action:** Manage AddUserModal state in PropertiesPanel
  - **Why:** PropertiesPanel renders PresenceDropdown and needs to open modal
  - **Files Modified:**
    - Updated: `src/features/properties-panel/components/PropertiesPanel.tsx`
  - **Implementation Details:**
```typescript
import { AddUserModal } from '@/features/collaboration/components';

export function PropertiesPanel({ ... }: PropertiesPanelProps) {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { projectId } = useCanvasStore();
  const { currentUser } = useAuth();

  // Get current project to check ownership
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    async function loadProject() {
      const project = await getProject(projectId);
      setCurrentProject(project);
    }
    loadProject();
  }, [projectId]);

  const isOwner = currentProject?.ownerId === currentUser?.uid;

  // Handle add user
  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  // Handle remove user
  const handleRemoveUser = async (userId: string) => {
    if (!currentUser) return;

    try {
      await removeCollaborator(projectId, userId, currentUser.uid);
      toast.success('User removed from project');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle user added
  const handleUserAdded = () => {
    setIsAddUserModalOpen(false);
    toast.success('User added to project');
  };

  return (
    <>
      <PresenceDropdown
        users={presenceUsers}
        ownerId={currentProject?.ownerId || ''}
        currentUserId={currentUser?.uid || ''}
        onAddUser={isOwner ? handleAddUser : undefined}
        onRemoveUser={isOwner ? handleRemoveUser : undefined}
        trigger={<AvatarStack users={presenceUsers} maxVisible={3} size="sm" />}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        projectId={projectId}
        currentCollaborators={currentProject?.collaborators || []}
        onUserAdded={handleUserAdded}
      />
    </>
  );
}
```
  - **Success Criteria:**
    - [ ] AddUserModal imported
    - [ ] Modal state managed in PropertiesPanel
    - [ ] onAddUser callback opens modal
    - [ ] onRemoveUser callback removes collaborator
    - [ ] Project loaded to get ownerId and collaborators
    - [ ] isOwner check passes callbacks conditionally
    - [ ] Success toasts shown on add/remove
  - **Tests:**
    1. Open canvas as owner
    2. Click PresenceDropdown, click "Add User"
    3. Expected: AddUserModal opens
    4. Add a user successfully
    5. Expected: Modal closes, success toast appears
    6. Click X on a collaborator
    7. Expected: User removed, success toast appears
    8. Open canvas as collaborator
    9. Expected: No "Add User" button, no X buttons
  - **Edge Cases:**
    - ⚠️ Remove fails (network error) → show error toast, don't remove from UI
    - ⚠️ Add fails → modal stays open, show error
    - ⚠️ Project not loaded yet → callbacks disabled until loaded
  - **Rollback:** Revert PropertiesPanel.tsx changes
  - **Last Verified:** 2025-10-18

---

# Final Integration & Testing

## Integration Tests
- [ ] Test complete add user flow end-to-end
  - **Scenario 1:** Owner adds collaborator by email
    1. Create project as User A
    2. Open PresenceDropdown, click "Add User"
    3. Enter User B's email, search, add
    4. Expected: User B now in collaborators, appears in PresenceDropdown
    5. Open project as User B
    6. Expected: Project appears in "Shared with You" section
    7. User B can edit canvas objects
  - **Scenario 2:** Owner removes collaborator
    1. User A removes User B via X button
    2. Expected: User B immediately disconnected with toast
    3. User B redirected to /projects
    4. Project no longer in User B's portal
  - **Scenario 3:** Collaborator views but cannot modify project settings
    1. User B (collaborator) hovers over project card
    2. Expected: No rename/delete/visibility buttons
    3. User B opens PresenceDropdown
    4. Expected: No "Add User" button, no X buttons

- [ ] Test edge cases
  - **Scenario 1:** Search for non-existent user
    1. Open AddUserModal, enter fake email
    2. Expected: "User not found" error
  - **Scenario 2:** Add user already in project
    1. Open AddUserModal, enter existing collaborator email
    2. Expected: "User is already a collaborator" error
  - **Scenario 3:** Owner tries to remove self
    1. No X button should appear next to owner's name
  - **Scenario 4:** Multiple concurrent edits
    1. User A (owner) and User B (collaborator) both edit canvas
    2. Expected: Both can add/edit/delete objects without conflicts
  - **Scenario 5:** Kick user while they're actively editing
    1. User B editing canvas
    2. User A kicks User B
    3. Expected: User B disconnected within 1-2 seconds with toast

## Performance Tests
- [ ] Verify presence performance with multiple collaborators
  - **Metric:** PresenceDropdown render time
  - **Target:** < 100ms with 10 users
  - **How to Test:**
    1. Add 10 collaborators to project
    2. Open PresenceDropdown
    3. Measure render time in React DevTools Profiler

- [ ] Verify project fetching performance
  - **Metric:** getAllUserProjects query time
  - **Target:** < 500ms for 20 projects
  - **How to Test:**
    1. Create user with 10 owned, 10 collaborated projects
    2. Navigate to /projects
    3. Measure fetch time in Network tab

## Accessibility Tests
- [ ] Keyboard navigation in AddUserModal
  - Tab through form elements
  - Press Enter to search
  - Press Escape to close
- [ ] Screen reader labels on buttons
  - X buttons have aria-label with username
  - "Add User" button has clear label
- [ ] Color contrast on badges and buttons
  - Owner badge (blue)
  - Shared badge (green)
  - X buttons (red on hover)

## Security Tests
- [ ] Verify database rules enforcement
  - **Test 1:** Non-collaborator cannot read project
    - Try to access project URL as unauthorized user
    - Expected: Access Denied page
  - **Test 2:** Non-collaborator cannot write canvas objects
    - Try to update object via Firebase console as unauthorized user
    - Expected: Permission denied error
  - **Test 3:** Collaborator can read and write
    - Verify collaborator can access canvas and edit objects
  - **Test 4:** Only owner can modify project metadata
    - Collaborator tries to rename project
    - Expected: No rename button available

---

# Deployment Checklist

- [ ] All tasks completed and verified
- [ ] All integration tests passing
- [ ] All edge cases tested
- [ ] Performance verified (< 500ms project fetch, < 100ms dropdown render)
- [ ] Accessibility verified (keyboard nav, screen reader, contrast)
- [ ] Security rules deployed and tested
- [ ] No console errors in browser
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Documentation updated (CLAUDE.md if needed)
- [ ] Commit message written following conventions
- [ ] PR created with detailed description

---

# Appendix

## Related Documentation
- `_docs/guides/creating-implementation-plans.md` - Plan creation guide
- `src/types/project.types.ts` - Project type definitions
- `src/lib/firebase/projectsService.ts` - Project CRUD operations
- `database.rules.json` - Firebase security rules

## Future Enhancements
- **Transfer ownership:** Allow owner to transfer project to collaborator
- **Read-only permissions:** Add viewer role (read but not edit)
- **Invitation emails:** Send email notifications when added to project
- **Collaborator limits:** Enforce max collaborators per project (e.g., 10)
- **Activity log:** Track who added/removed whom and when
- **Bulk operations:** Add/remove multiple users at once
- **Public project galleries:** Browse public projects from community
- **Project templates:** Create projects from pre-made templates

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| [Date] | Phase 0 | [Hours] | Research and planning completed |
| [Date] | Phase 1 | [Hours] | Backend services implemented |
| [Date] | Phase 2 | [Hours] | UI components built |
| [Date] | Phase 3 | [Hours] | Security and access control added |
| [Date] | Phase 4 | [Hours] | Projects portal integration |
| [Date] | Integration | [Hours] | End-to-end testing and fixes |
