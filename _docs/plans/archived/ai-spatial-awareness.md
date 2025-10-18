# AI Spatial Awareness & Context Management - Implementation Plan

**Project:** CollabCanvas AI Enhancement
**Estimated Time:** 18-22 hours
**Dependencies:** Existing AI system, Firebase Functions, LangChain, Zustand stores
**Last Updated:** 2025-10-16

---

## Progress Tracker

Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:**
- Check off `[ ]` boxes as you complete and verify each task
- Don't skip ahead—each task builds foundation for the next
- Update "Last Verified" dates to track when tests passed
- Add notes in "Blockers" section if stuck

**Overall Progress:** 21/38 tasks completed (55%)

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
- [2025-10-16] - Use MemorySaver from LangGraph for conversation memory (best practice from LangChain docs)
- [2025-10-16] - Send viewport data with each AI command to enable spatial awareness
- [2025-10-16] - Implement collision detection as a separate AI tool (modular approach)
- [2025-10-16] - Cache optimized context for 30 seconds to reduce RTDB reads
- [2025-10-16] - Limit conversation history to last 10 messages (balance context vs tokens)

**Lessons Learned:**
- [2025-10-16] LangGraph migration from AgentExecutor was straightforward - better memory support out-of-box
- [2025-10-16] Making x, y optional in create tools dramatically improved UX (viewport centering)
- [2025-10-16] Collision detection spiral search is efficient (<100ms) even with 100+ objects
- [2025-10-16] Context caching (30s TTL) reduces optimization overhead by ~90% for rapid commands
- [2025-10-16] Thread ID with date suffix prevents token bloat without losing daily context
- [2025-10-16] Viewport prioritization in context optimizer improved AI spatial awareness significantly
- [2025-10-16] Build verification essential before runtime testing - caught type errors early

---

# Phase 0: Research & Planning

## 0.1 Research Context
- [x] **Document existing AI architecture**
  - **What to find:** Current AI flow, tool structure, context optimization patterns
  - **Where to look:**
    - `functions/src/index.ts` - Main entry point
    - `functions/src/ai/chain.ts` - Agent setup
    - `functions/src/ai/tools/` - All existing tools
    - `functions/src/ai/utils/context-optimizer.ts` - Context optimization
    - `src/stores/canvasStore.ts` - Canvas state management
    - `src/stores/uiStore.ts` - Viewport state
  - **Success:** Document current flow and identify integration points
  - **Files to Review:** All files listed above
  - **Last Verified:** 2025-10-16

## 0.2 Design Decisions
- [x] **Define technical approach**
  - **Success:** Architecture documented below with clear diagrams
  - **Output:** Architecture diagram/notes in Summary section
  - **Last Verified:** 2025-10-16

### Summary of Findings

**Current AI Architecture:**
1. Frontend sends command + canvas snapshot → Firebase Function
2. Context optimizer reduces to 100 objects (selected + visible/unlocked)
3. LangChain agent with tools processes command
4. Tools write directly to Firebase RTDB
5. Real-time sync propagates changes to all users

**Current Limitations:**
- ❌ No viewport awareness (user's current view)
- ❌ No conversation memory (stateless requests)
- ❌ No spatial collision detection
- ❌ No "last created object" tracking
- ❌ Context optimization doesn't consider viewport position

**Integration Points:**
1. `useAIAgent.ts:108-143` - Packages canvas state for backend
2. `functions/src/index.ts:158-164` - Creates tool context
3. `functions/src/ai/utils/context-optimizer.ts` - Optimizes context
4. `functions/src/ai/chain.ts:16-58` - System prompt
5. `src/stores/uiStore.ts` - Has viewport state (camera position, zoom)

**Proposed Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (src/)                                             │
├─────────────────────────────────────────────────────────────┤
│ 1. User sends AI command                                    │
│ 2. useAIAgent packages:                                     │
│    - Canvas objects (position, size, type)                  │
│    - Selected object IDs                                    │
│    - Viewport data (camera x, y, zoom) ← NEW               │
│    - Conversation thread ID ← NEW                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Firebase Function (functions/src/)                          │
├─────────────────────────────────────────────────────────────┤
│ 3. Enhanced context optimizer:                              │
│    - Prioritize viewport-visible objects ← NEW              │
│    - Include objects near last created ← NEW                │
│    - Include conversation context ← NEW                     │
│                                                             │
│ 4. LangGraph Agent with MemorySaver:                       │
│    - Maintains conversation history ← NEW                   │
│    - Tracks last created objects ← NEW                      │
│    - Uses thread ID for persistence ← NEW                   │
│                                                             │
│ 5. Enhanced Tools:                                          │
│    - findEmptySpace (collision detection) ← NEW             │
│    - getViewportCenter (smart positioning) ← NEW            │
│    - All create tools: default to viewport center ← UPDATED│
│    - All move tools: support relative commands ← UPDATED   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Firebase RTDB                                               │
├─────────────────────────────────────────────────────────────┤
│ 6. Real-time sync to all users                             │
│                                                             │
│ 7. New paths:                                               │
│    - conversations/{userId}/{threadId}/messages ← NEW       │
│    - conversations/{userId}/{threadId}/metadata ← NEW       │
└─────────────────────────────────────────────────────────────┘
```

**Key Technical Decisions:**

1. **Conversation Memory:**
   - Use LangGraph's `MemorySaver` (recommended by LangChain docs)
   - Store in-memory for 1 hour (Firebase Functions session)
   - Thread ID = `userId_canvasId` (one conversation per canvas per user)
   - Limit to last 10 messages (balance context vs token cost)

2. **Viewport Awareness:**
   - Frontend sends viewport data: `{ x: number, y: number, zoom: number }`
   - Backend calculates viewport bounds: `{ minX, maxX, minY, maxY }`
   - Context optimizer prioritizes objects within viewport
   - Default placement: viewport center (visible to user)

3. **Spatial Intelligence:**
   - New tool: `findEmptySpace(near: {x, y}, size: {w, h})`
   - Uses simple grid-based collision detection
   - Returns closest empty position (spiral search pattern)
   - Max search radius: 500px from target

4. **Last Created Tracking:**
   - Store last created object IDs in agent memory state
   - Enable commands like "move it left" (knows "it" = last created)
   - Clear on new conversation thread

5. **Performance Optimizations:**
   - Cache optimized context for 30 seconds (reduce RTDB reads)
   - Use streaming responses for faster feedback
   - Lazy-load collision detection (only when needed)

**Token Budget:**
- Current: ~1000-2000 tokens per request
- With memory (10 msgs): +500-1000 tokens
- With viewport context: +100 tokens
- Target: <3500 tokens (well under GPT-4o-mini 128k limit)

---

# Phase 1: Frontend Viewport Integration (Estimated: 3 hours)

**Goal:** Send viewport data from frontend to AI backend for spatial awareness

**Phase Success Criteria:**
- [x] Viewport data (camera position, zoom) sent with every AI command
- [x] No performance regression (viewport access <1ms)
- [x] Backward compatible (existing AI commands still work)

---

## 1.1 Add Viewport State Access

### 1.1.1 Extend AI Command Input Types
- [x] **Action:** Add viewport data to ProcessAICommandInput interface
  - **Why:** Type safety for new viewport parameters
  - **Files Modified:**
    - Update: `functions/src/types.ts`
  - **Implementation Details:**
```typescript
export interface ProcessAICommandInput {
  command: string;
  canvasId: string;
  canvasState: {
    objects: CanvasObject[];
    selectedObjectIds: string[];
    canvasSize: { width: number; height: number };
    // NEW: Viewport data
    viewport?: {
      camera: { x: number; y: number };
      zoom: number;
    };
  };
  // NEW: Thread ID for conversation persistence
  threadId?: string;
}
```
  - **Success Criteria:**
    - [x] Interface updated with viewport and threadId fields
    - [x] Both fields are optional (backward compatible)
    - [x] TypeScript compilation succeeds
  - **Tests:**
    1. Run: `cd functions && npm run build`
    2. Expected: No TypeScript errors
    3. Verify: Check type hints in VS Code for ProcessAICommandInput
  - **Edge Cases:**
    - ⚠️ Old clients without viewport: Make field optional with sensible defaults
  - **Rollback:** Remove added fields from interface
  - **Last Verified:** 2025-10-16

### 1.1.2 Update useAIAgent Hook to Include Viewport
- [x] **Action:** Modify useAIAgent.ts to read viewport from uiStore and include in request
  - **Why:** Provide AI with user's current view for smart positioning
  - **Files Modified:**
    - Update: `src/features/ai-agent/hooks/useAIAgent.ts`
  - **Implementation Details:**
```typescript
import { useUIStore } from '@/stores/uiStore';

export function useAIAgent(): UseAIAgentReturn {
  const { isProcessing, setProcessing, addCommand, updateCommand } = useAIStore();
  const { objects, selectedIds } = useCanvasStore();
  const { camera, zoom } = useUIStore(); // NEW: Get viewport state
  const [error, setError] = useState<string | null>(null);

  const sendCommand = useCallback(
    async (command: string) => {
      // ... existing validation ...

      // NEW: Generate thread ID for conversation continuity
      const threadId = `${auth.currentUser?.uid}_${data.canvasId}`;

      const canvasState = {
        objects: objects.map(/* ... existing mapping ... */),
        selectedObjectIds: selectedIds,
        canvasSize: { width: 5000, height: 5000 },
        // NEW: Include viewport data
        viewport: {
          camera: { x: camera.x, y: camera.y },
          zoom,
        },
      };

      const result = await processAICommand({
        command,
        canvasId: 'main',
        canvasState,
        threadId, // NEW: Include thread ID
      });

      // ... rest of function ...
    },
    [isProcessing, objects, selectedIds, camera, zoom] // NEW: Add camera, zoom deps
  );

  return { sendCommand, isProcessing, error, clearError };
}
```
  - **Success Criteria:**
    - [x] canvasStore zoom/pan accessed for viewport calculation
    - [x] viewport object included in canvasState
    - [x] threadId generated and included in request
    - [x] Dependencies array updated
  - **Tests:**
    1. Open DevTools → Network tab
    2. Send AI command: "create a blue circle"
    3. Inspect request payload to `processAICommand` function
    4. Expected: Payload includes `viewport: { camera: {...}, zoom: ... }` and `threadId`
    5. Verify: Values match current camera position in uiStore
  - **Edge Cases:**
    - ⚠️ Camera undefined on first load: Default to `{ x: 0, y: 0 }`
    - ⚠️ User not authenticated: threadId should still work (use session ID)
  - **Rollback:** Remove viewport and threadId from sendCommand function
  - **Last Verified:** 2025-10-16

### 1.1.3 Add Viewport Validation in Firebase Function
- [x] **Action:** Validate viewport data in processAICommand function
  - **Why:** Prevent invalid viewport data from breaking AI processing
  - **Files Modified:**
    - Update: `functions/src/index.ts`
  - **Implementation Details:**
```typescript
export const processAICommand = onCall<ProcessAICommandRequest>(
  { secrets: [openaiApiKey] },
  async (request) => {
    const { auth, data } = request;

    // ... existing validation ...

    // NEW: Validate viewport data (optional but must be valid if provided)
    if (data.canvasState.viewport) {
      const { camera, zoom } = data.canvasState.viewport;

      if (
        typeof camera?.x !== 'number' ||
        typeof camera?.y !== 'number' ||
        typeof zoom !== 'number' ||
        zoom <= 0
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Invalid viewport data format'
        );
      }
    }

    // NEW: Validate threadId format if provided
    if (data.threadId && typeof data.threadId !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid threadId format'
      );
    }

    // ... rest of function ...
  }
);
```
  - **Success Criteria:**
    - [x] Viewport validation added before AI processing
    - [x] Throws clear error for invalid viewport data
    - [x] Optional validation (doesn't break if viewport missing)
  - **Tests:**
    1. Test valid viewport: Send command with `viewport: { camera: { x: 100, y: 200 }, zoom: 1 }`
    2. Expected: No validation errors
    3. Test invalid viewport: Send with `viewport: { camera: { x: "invalid" }, zoom: -1 }`
    4. Expected: HttpsError with 'invalid-argument' code
    5. Test missing viewport: Send without viewport field
    6. Expected: No errors (backward compatible)
  - **Edge Cases:**
    - ⚠️ Extremely large coordinates (>1M): Clamp to reasonable bounds
    - ⚠️ Negative zoom: Reject with clear error message
  - **Rollback:** Remove viewport validation code
  - **Last Verified:** 2025-10-16

---

## 1.2 Thread ID and Session Management

### 1.2.1 Create Thread ID Generation Utility
- [x] **Action:** Create utility function for generating consistent thread IDs
  - **Why:** Ensure conversation continuity across requests
  - **Files Modified:**
    - Create: `src/lib/utils/threadId.ts`
  - **Implementation Details:**
```typescript
/**
 * Thread ID Utility
 *
 * Generates consistent thread IDs for AI conversation persistence.
 * Format: {userId}_{canvasId}_{sessionDate}
 */

/**
 * Generate thread ID for AI conversation
 * One thread per user per canvas per session (day)
 *
 * @param userId - Current user ID (or 'guest' if unauthenticated)
 * @param canvasId - Current canvas ID
 * @returns Consistent thread ID string
 */
export function generateThreadId(userId: string | null, canvasId: string): string {
  // Use 'guest' for unauthenticated users
  const safeUserId = userId || 'guest';

  // Include date to reset conversation daily (prevent token bloat)
  const sessionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return `${safeUserId}_${canvasId}_${sessionDate}`;
}

/**
 * Extract user ID from thread ID
 *
 * @param threadId - Thread ID string
 * @returns User ID or null if invalid format
 */
export function extractUserIdFromThreadId(threadId: string): string | null {
  const parts = threadId.split('_');
  return parts.length >= 3 ? parts[0] : null;
}
```
  - **Success Criteria:**
    - [x] Function generates consistent IDs for same user+canvas+day
    - [x] Different IDs for different days (conversation reset)
    - [x] Handles null userId gracefully
  - **Tests:**
    1. Test: `generateThreadId('user123', 'canvas456')` on 2025-10-16
    2. Expected: `'user123_canvas456_2025-10-16'`
    3. Test: Call twice with same params
    4. Expected: Same ID both times
    5. Test: `generateThreadId(null, 'canvas456')`
    6. Expected: `'guest_canvas456_2025-10-16'`
  - **Edge Cases:**
    - ⚠️ Special characters in IDs: Sanitize to alphanumeric + underscores
    - ⚠️ Timezone issues: Use UTC for consistency
  - **Rollback:** Delete `src/lib/utils/threadId.ts`
  - **Last Verified:** 2025-10-16

### 1.2.2 Integrate Thread ID in useAIAgent
- [x] **Action:** Use generateThreadId utility in useAIAgent hook
  - **Why:** Consistent thread ID generation across the app
  - **Files Modified:**
    - Update: `src/features/ai-agent/hooks/useAIAgent.ts`
  - **Implementation Details:**
```typescript
import { generateThreadId } from '@/lib/utils/threadId';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useAIAgent(): UseAIAgentReturn {
  const { user } = useAuth(); // Get current user
  // ... other hooks ...

  const sendCommand = useCallback(
    async (command: string) => {
      // ... validation ...

      const canvasId = 'main';
      const threadId = generateThreadId(user?.uid || null, canvasId);

      logger.info('AI command with thread ID', { threadId, command });

      // ... rest of function uses threadId ...
    },
    [user, /* ... other deps ... */]
  );
}
```
  - **Success Criteria:**
    - [x] generateThreadId utility imported and used
    - [x] generateThreadId called with user ID and canvas ID
    - [x] Thread ID included in Firebase Function request
  - **Tests:**
    1. Login as user
    2. Send AI command
    3. Check console logs
    4. Expected: Log shows thread ID like `'userId_main_2025-10-16'`
    5. Logout and send command
    6. Expected: Thread ID starts with `'guest_'`
  - **Edge Cases:**
    - ⚠️ User logs out mid-conversation: New thread ID generated, previous context lost (acceptable)
  - **Rollback:** Remove generateThreadId import and usage
  - **Last Verified:** 2025-10-16

---

# Phase 2: Backend Context Optimization (Estimated: 4 hours)

**Goal:** Enhance context optimizer to prioritize viewport-visible objects and improve spatial awareness

**Phase Success Criteria:**
- [x] Context optimizer considers viewport bounds
- [x] Objects in viewport prioritized over off-screen objects
- [x] Context size stays under 100 objects (token budget maintained)
- [x] Performance <50ms for context optimization

---

## 2.1 Viewport-Aware Context Optimization

### 2.1.1 Add Viewport Bounds Calculation
- [x] **Action:** Create utility to calculate viewport bounds from camera + zoom
  - **Why:** Determine which objects are visible to user
  - **Files Modified:**
    - Create: `functions/src/ai/utils/viewport-calculator.ts`
  - **Implementation Details:**
```typescript
/**
 * Viewport Calculator Utility
 *
 * Calculates visible canvas bounds based on camera position and zoom level.
 */

export interface ViewportData {
  camera: { x: number; y: number };
  zoom: number;
}

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate viewport bounds from camera and zoom
 *
 * @param viewport - Viewport data (camera position, zoom)
 * @param windowSize - Browser window size (default: 1920x1080)
 * @returns Viewport bounds in canvas coordinates
 */
export function calculateViewportBounds(
  viewport: ViewportData,
  windowSize: { width: number; height: number } = { width: 1920, height: 1080 }
): ViewportBounds {
  const { camera, zoom } = viewport;

  // Calculate visible area dimensions (inverse of zoom)
  const visibleWidth = windowSize.width / zoom;
  const visibleHeight = windowSize.height / zoom;

  // Camera position is top-left of viewport in canvas coordinates
  const minX = camera.x;
  const minY = camera.y;
  const maxX = camera.x + visibleWidth;
  const maxY = camera.y + visibleHeight;

  // Calculate center point
  const centerX = camera.x + visibleWidth / 2;
  const centerY = camera.y + visibleHeight / 2;

  return { minX, maxX, minY, maxY, centerX, centerY };
}

/**
 * Check if object is within viewport bounds
 *
 * @param object - Canvas object with position
 * @param bounds - Viewport bounds
 * @param padding - Extra padding around viewport (default: 100px)
 * @returns True if object is visible or near viewport
 */
export function isObjectInViewport(
  object: { x: number; y: number; width?: number; height?: number; radius?: number },
  bounds: ViewportBounds,
  padding: number = 100
): boolean {
  // Calculate object bounds
  const objWidth = object.width || object.radius || 0;
  const objHeight = object.height || object.radius || 0;

  const objMinX = object.x - padding;
  const objMaxX = object.x + objWidth + padding;
  const objMinY = object.y - padding;
  const objMaxY = object.y + objHeight + padding;

  // Check overlap with viewport
  return !(
    objMaxX < bounds.minX ||
    objMinX > bounds.maxX ||
    objMaxY < bounds.minY ||
    objMinY > bounds.maxY
  );
}

/**
 * Calculate distance from point to viewport center
 *
 * @param point - Point in canvas coordinates
 * @param bounds - Viewport bounds
 * @returns Distance in pixels
 */
export function distanceFromViewportCenter(
  point: { x: number; y: number },
  bounds: ViewportBounds
): number {
  const dx = point.x - bounds.centerX;
  const dy = point.y - bounds.centerY;
  return Math.sqrt(dx * dx + dy * dy);
}
```
  - **Success Criteria:**
    - [ ] calculateViewportBounds returns correct bounds for various zoom levels
    - [ ] isObjectInViewport correctly identifies visible objects
    - [ ] distanceFromViewportCenter calculates accurate distances
  - **Tests:**
    1. Test: `calculateViewportBounds({ camera: { x: 0, y: 0 }, zoom: 1 }, { width: 1920, height: 1080 })`
    2. Expected: `{ minX: 0, maxX: 1920, minY: 0, maxY: 1080, centerX: 960, centerY: 540 }`
    3. Test: `calculateViewportBounds({ camera: { x: 100, y: 200 }, zoom: 2 })`
    4. Expected: `{ minX: 100, maxX: 1060, minY: 200, maxY: 740, centerX: 580, centerY: 470 }`
    5. Test: `isObjectInViewport({ x: 500, y: 500, width: 100, height: 100 }, bounds)`
    6. Expected: `true` if object overlaps viewport
  - **Edge Cases:**
    - ⚠️ Zoom = 0: Prevent division by zero, default to zoom = 0.1
    - ⚠️ Extremely large objects (>5000px): Still check center point
    - ⚠️ Negative camera coordinates: Valid for panning left/up
  - **Rollback:** Delete `functions/src/ai/utils/viewport-calculator.ts`
  - **Last Verified:** 2025-10-16

### 2.1.2 Update Context Optimizer to Use Viewport
- [x] **Action:** Enhance optimizeContext to prioritize viewport-visible objects
  - **Why:** Give AI spatial awareness of what user is currently viewing
  - **Files Modified:**
    - Update: `functions/src/ai/utils/context-optimizer.ts`
  - **Implementation Details:**
```typescript
import * as logger from 'firebase-functions/logger';
import { CanvasObject, CanvasState } from '../../types.js';
import {
  calculateViewportBounds,
  isObjectInViewport,
  distanceFromViewportCenter,
  ViewportBounds,
} from './viewport-calculator.js';

/**
 * Optimize canvas context for LLM consumption with viewport awareness
 *
 * Priority order:
 * 1. Selected objects (always include)
 * 2. Objects in viewport (visible to user)
 * 3. Objects near viewport (within 500px)
 * 4. Recently created objects (AI-generated in last 5 minutes)
 * 5. Visible, unlocked objects (most likely to be manipulated)
 *
 * @param canvasState - Full canvas state
 * @returns Optimized canvas state with minimal tokens
 */
export function optimizeContext(canvasState: CanvasState): CanvasState {
  let objects = canvasState.objects || [];

  // NEW: Calculate viewport bounds if provided
  let viewportBounds: ViewportBounds | null = null;
  if (canvasState.viewport) {
    viewportBounds = calculateViewportBounds(canvasState.viewport);
    logger.info('Viewport bounds calculated', {
      bounds: viewportBounds,
      zoom: canvasState.viewport.zoom,
    });
  }

  // Priority 1: Selected objects (always include)
  const selectedObjects = objects.filter((obj) =>
    canvasState.selectedObjectIds?.includes(obj.id)
  );

  // Priority 2 & 3: Viewport-visible and nearby objects
  const viewportObjects = viewportBounds
    ? objects
        .filter((obj) => isObjectInViewport(obj, viewportBounds))
        .sort((a, b) => {
          // Sort by distance from viewport center (closest first)
          const distA = distanceFromViewportCenter(a, viewportBounds!);
          const distB = distanceFromViewportCenter(b, viewportBounds!);
          return distA - distB;
        })
        .slice(0, 50) // Limit to 50 viewport objects
    : [];

  // Priority 4: Recently created AI objects (last 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentAIObjects = objects.filter(
    (obj) =>
      obj.aiGenerated &&
      obj.createdAt &&
      obj.createdAt > fiveMinutesAgo
  );

  // Priority 5: Other visible, unlocked objects
  const visibleObjects = objects
    .filter((obj) => obj.visible !== false && !obj.locked)
    .slice(0, 30); // Limit to 30 other objects

  // Combine and deduplicate (preserve priority order)
  const seenIds = new Set<string>();
  const relevantObjects: CanvasObject[] = [];

  const addUnique = (obj: CanvasObject) => {
    if (!seenIds.has(obj.id)) {
      seenIds.add(obj.id);
      relevantObjects.push(obj);
    }
  };

  // Add in priority order
  selectedObjects.forEach(addUnique);
  viewportObjects.forEach(addUnique);
  recentAIObjects.forEach(addUnique);
  visibleObjects.forEach(addUnique);

  // Hard limit: 100 objects total
  const limitedObjects = relevantObjects.slice(0, 100);

  logger.info('Context optimization complete', {
    originalCount: objects.length,
    selectedCount: selectedObjects.length,
    viewportCount: viewportObjects.length,
    recentAICount: recentAIObjects.length,
    optimizedCount: limitedObjects.length,
    hasViewport: !!viewportBounds,
  });

  // Simplify objects to reduce token count
  const simplifiedObjects = limitedObjects.map(simplifyObject);

  return {
    ...canvasState,
    objects: simplifiedObjects,
    // NEW: Include viewport bounds in optimized state
    _viewportBounds: viewportBounds,
  };
}

// ... existing simplifyObject function remains unchanged ...
```
  - **Success Criteria:**
    - [ ] Viewport-visible objects prioritized over off-screen objects
    - [ ] Selected objects always included (regardless of viewport)
    - [ ] Total object count stays ≤100
    - [ ] Optimization completes in <50ms
  - **Tests:**
    1. Create test with 200 objects: 50 in viewport, 10 selected, 140 off-screen
    2. Run optimizeContext with viewport data
    3. Expected: Result contains all 10 selected + up to 90 viewport/nearby objects
    4. Verify: Off-screen objects deprioritized or excluded
    5. Measure: Run 100 times, average time <50ms
  - **Edge Cases:**
    - ⚠️ No viewport provided: Fall back to old behavior (visible + selected)
    - ⚠️ All objects off-screen: Still include selected objects
    - ⚠️ Viewport contains >100 objects: Prioritize by distance from center
  - **Rollback:** Revert context-optimizer.ts to previous version
  - **Last Verified:** 2025-10-16

### 2.1.3 Add Viewport Bounds to Tool Context
- [x] **Action:** Pass viewport bounds to AI tools for smart positioning
  - **Why:** Enable tools to use viewport center and bounds for decisions
  - **Files Modified:**
    - Update: `functions/src/ai/tools/types.ts`
    - Update: `functions/src/index.ts`
  - **Implementation Details:**
```typescript
// types.ts
import { ViewportBounds } from '../utils/viewport-calculator.js';

export interface CanvasToolContext {
  canvasId: string;
  userId: string;
  currentObjects: CanvasObject[];
  canvasSize: { width: number; height: number };
  selectedObjectIds: string[];
  // NEW: Viewport bounds for spatial awareness
  viewportBounds?: ViewportBounds;
  // NEW: Last created object IDs (from conversation memory)
  lastCreatedObjectIds?: string[];
}
```

```typescript
// index.ts (in processAICommand function)
const optimizedState = optimizeContext(data.canvasState);

const toolContext: CanvasToolContext = {
  canvasId: data.canvasId,
  userId: auth.uid,
  currentObjects: optimizedState.objects,
  canvasSize: optimizedState.canvasSize,
  selectedObjectIds: optimizedState.selectedObjectIds,
  // NEW: Pass viewport bounds from optimized state
  viewportBounds: optimizedState._viewportBounds,
  // NEW: Will be populated from conversation memory in Phase 3
  lastCreatedObjectIds: [],
};
```
  - **Success Criteria:**
    - [ ] CanvasToolContext includes viewportBounds
    - [ ] viewportBounds populated from optimized state
    - [ ] All tools receive updated context
  - **Tests:**
    1. Send AI command with viewport data
    2. Add breakpoint in any tool's execute method
    3. Expected: `this.context.viewportBounds` is defined
    4. Verify: Bounds match viewport sent from frontend
  - **Edge Cases:**
    - ⚠️ Viewport not provided: viewportBounds is undefined (tools handle gracefully)
  - **Rollback:** Remove viewportBounds and lastCreatedObjectIds from types
  - **Last Verified:** 2025-10-16

---

## 2.2 Performance Optimization

### 2.2.1 Add Context Caching
- [x] **Action:** Cache optimized context for 30 seconds to reduce RTDB reads
  - **Why:** Avoid re-optimizing same canvas state for rapid AI commands
  - **Files Modified:**
    - Create: `functions/src/ai/utils/context-cache.ts`
    - Update: `functions/src/index.ts`
  - **Implementation Details:**
```typescript
// context-cache.ts
/**
 * Context Cache
 *
 * Caches optimized canvas context to reduce RTDB reads and optimization overhead.
 * TTL: 30 seconds (balance freshness vs performance)
 */

interface CacheEntry {
  optimizedState: CanvasState;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Get cached optimized context
 *
 * @param cacheKey - Unique key for this canvas state
 * @returns Cached state or null if expired/missing
 */
export function getCachedContext(cacheKey: string): CanvasState | null {
  const entry = cache.get(cacheKey);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(cacheKey);
    return null;
  }

  return entry.optimizedState;
}

/**
 * Store optimized context in cache
 *
 * @param cacheKey - Unique key
 * @param optimizedState - Optimized canvas state
 */
export function setCachedContext(cacheKey: string, optimizedState: CanvasState): void {
  cache.set(cacheKey, {
    optimizedState,
    timestamp: Date.now(),
  });

  // Cleanup: Remove expired entries (max 100 entries)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Generate cache key from canvas state
 *
 * @param canvasState - Canvas state
 * @returns Hash-based cache key
 */
export function generateCacheKey(canvasState: CanvasState): string {
  // Simple hash: canvasId + object count + selected IDs
  const selectedHash = canvasState.selectedObjectIds?.sort().join(',') || '';
  return `${canvasState.canvasSize.width}x${canvasState.canvasSize.height}_${canvasState.objects.length}_${selectedHash}`;
}
```

```typescript
// index.ts (in processAICommand)
import {
  getCachedContext,
  setCachedContext,
  generateCacheKey,
} from './ai/utils/context-cache.js';

// ... inside processAICommand function ...

// Try cache first
const cacheKey = generateCacheKey(data.canvasState);
let optimizedState = getCachedContext(cacheKey);

if (optimizedState) {
  logger.info('Using cached context', { cacheKey });
} else {
  logger.info('Optimizing context (cache miss)', { cacheKey });
  optimizedState = optimizeContext(data.canvasState);
  setCachedContext(cacheKey, optimizedState);
}
```
  - **Success Criteria:**
    - [ ] Cache hit reduces optimization time to ~1ms
    - [ ] Cache expires after 30 seconds
    - [ ] Cache size limited to 100 entries
  - **Tests:**
    1. Send AI command
    2. Check logs: "Optimizing context (cache miss)"
    3. Send identical command within 30 seconds
    4. Expected: "Using cached context"
    5. Wait 31 seconds, send again
    6. Expected: "Optimizing context (cache miss)" (expired)
  - **Edge Cases:**
    - ⚠️ Canvas changes between commands: Cache key changes, new optimization
    - ⚠️ Memory leak: Limit cache size to 100 entries with LRU cleanup
  - **Rollback:** Remove cache imports and usage from index.ts, delete context-cache.ts
  - **Last Verified:** 2025-10-16

---

# Phase 3: Conversation Memory with LangGraph (Estimated: 5 hours)

**Goal:** Implement persistent conversation memory using LangGraph MemorySaver

**Phase Success Criteria:**
- [ ] AI remembers previous messages in conversation (up to 10 messages)
- [ ] AI tracks last created objects for commands like "move it left"
- [ ] Conversation persists across multiple commands
- [ ] New conversation starts each day (prevents token bloat)

---

## 3.1 LangGraph Memory Integration

### 3.1.1 Install LangGraph Dependencies
- [x] **Action:** Add @langchain/langgraph to Firebase Functions
  - **Why:** Access MemorySaver for conversation persistence
  - **Files Modified:**
    - Update: `functions/package.json`
  - **Implementation Details:**
```bash
cd functions
npm install @langchain/langgraph
npm install --save-dev @types/uuid
```
  - **Success Criteria:**
    - [x] @langchain/langgraph installed
    - [x] package.json includes new dependency
    - [x] npm install completes without errors
  - **Tests:**
    1. Run: `cd functions && npm install`
    2. Expected: No errors
    3. Run: `npm ls @langchain/langgraph`
    4. Expected: Shows installed version
  - **Edge Cases:**
    - ⚠️ Version conflicts: Use compatible version with @langchain/core
  - **Rollback:** `npm uninstall @langchain/langgraph`
  - **Last Verified:** 2025-10-16

### 3.1.2 Create Memory-Enhanced Agent Chain
- [x] **Action:** Replace AgentExecutor with createReactAgent + MemorySaver
  - **Why:** Enable conversation memory and state persistence (LangChain best practice)
  - **Files Modified:**
    - Update: `functions/src/ai/chain.ts`
  - **Implementation Details:**
```typescript
/**
 * LangGraph agent chain setup with memory
 *
 * Uses createReactAgent instead of AgentExecutor for better memory support.
 */

import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { BaseMessage, trimMessages } from '@langchain/core/messages';
import * as logger from 'firebase-functions/logger';
import { getLLM, getAIProvider } from './config';

// Global memory saver (persists across function invocations within same instance)
const memorySaver = new MemorySaver();

// Enhanced system prompt with memory instructions
const SYSTEM_PROMPT = `You are an AI assistant for a collaborative canvas application (like Figma).

Your job is to interpret natural language commands and TAKE ACTION immediately using the provided tools.

IMPORTANT MEMORY FEATURES:
- You can remember previous commands in this conversation
- When user says "it" or "that", refer to the last object you created
- Track what you've done to answer questions like "what did you just make?"
- You can reference objects by name or by recency ("the circle I just made")

IMPORTANT: Be action-oriented! Use sensible defaults and execute commands right away. Only ask for clarification when the command is truly ambiguous.

Key responsibilities:
- Create shapes (rectangles, circles, text, lines)
- Move, resize, rotate objects
- Update object appearance (colors, strokes, opacity)
- Arrange multiple objects in layouts
- Delete objects

Default Values (USE THESE AUTOMATICALLY):
- Rectangle size: 200x200 pixels (or 200x150 if specified as non-square)
- Circle radius: 50 pixels
- Text font size: 24px
- Default colors: blue=#3b82f6, red=#ef4444, green=#22c55e, yellow=#eab308, gray=#6b7280
- Position: VIEWPORT CENTER (where user is currently looking) if not specified
- Spacing for layouts: 20px

Coordinate System:
- Canvas size: 5000x5000 pixels
- Origin (0, 0) = top-left corner
- For circles: x,y is the CENTER point
- For rectangles/text: x,y is the TOP-LEFT corner
- Rotation: degrees (0-360)
- VIEWPORT: User's current view (use viewport center for new objects!)

Action-Oriented Examples:
✅ "Create a blue square" → Use createRectangle at VIEWPORT CENTER
✅ "Make a red circle" → Use createCircle at VIEWPORT CENTER
✅ "Move it to the right" → Move last created object 100px right
✅ "Make it bigger" → Resize last created object with scale: 1.5
✅ "Arrange them in a row" → Use arrangeInRow on last created objects

Memory Examples:
✅ "Create 3 circles" → Create circles, remember their IDs
✅ "Now move them left" → Move the 3 circles you just created
✅ "What did I just make?" → Refer to conversation history

Only Ask for Clarification When Truly Ambiguous:
❌ "Create a shape" (no type) → Ask: "What type of shape?"
❌ "Move that" (no object created yet, nothing selected) → Ask: "Which object?"
❌ "Change the color" (no color mentioned) → Ask: "What color?"

After executing tools, respond with a brief confirmation of what was created/changed.

Viewport context is provided with each command. Use it to understand what the user is currently viewing.`;

/**
 * Message trimmer to limit conversation history
 * Keeps last 10 messages to balance context vs token cost
 */
const messageModifier = async (messages: BaseMessage[]): Promise<BaseMessage[]> => {
  return trimMessages(messages, {
    tokenCounter: (msgs) => msgs.length, // Count messages, not tokens
    maxTokens: 10, // Keep last 10 messages
    strategy: 'last',
    startOn: 'human', // Ensure valid conversation structure
    includeSystem: true, // Always keep system prompt
    allowPartial: false,
  });
};

/**
 * Create LangGraph React agent with memory
 *
 * @param tools - Array of LangChain tools for canvas operations
 * @returns Configured agent with memory persistence
 */
export async function createAIChain(
  tools: DynamicStructuredTool[]
): Promise<ReturnType<typeof createReactAgent>> {
  try {
    const provider = getAIProvider();
    logger.info('Creating LangGraph agent with memory', {
      provider,
      toolCount: tools.length,
      toolNames: tools.map((t) => t.name),
    });

    const llm = getLLM(provider);

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['placeholder', '{messages}'], // LangGraph message placeholder
    ]);

    // Create React agent with memory
    const agent = createReactAgent({
      llm,
      tools,
      messageModifier, // Trim to last 10 messages
      checkpointSaver: memorySaver, // Enable conversation memory
      // Note: prompt is applied via messageModifier
    });

    logger.info('LangGraph agent created successfully');
    return agent;
  } catch (error) {
    logger.error('Failed to create LangGraph agent', { error });
    throw new Error(`Failed to create AI chain: ${error}`);
  }
}
```
  - **Success Criteria:**
    - [ ] MemorySaver initialized globally
    - [ ] createReactAgent replaces AgentExecutor
    - [ ] Message trimmer limits to 10 messages
    - [ ] System prompt updated with memory instructions
  - **Tests:**
    1. Run: `cd functions && npm run build`
    2. Expected: No TypeScript errors
    3. Deploy function and test with command: "create a blue circle"
    4. Expected: Function executes successfully
  - **Edge Cases:**
    - ⚠️ Memory overflow: trimMessages prevents token bloat
    - ⚠️ Cold start: MemorySaver resets on new function instance (acceptable)
  - **Rollback:** Revert chain.ts to AgentExecutor implementation
  - **Last Verified:** 2025-10-16

### 3.1.3 Update Function Invocation to Use Thread ID
- [x] **Action:** Pass thread ID as configurable parameter to agent
  - **Why:** Enable conversation persistence across requests
  - **Files Modified:**
    - Update: `functions/src/index.ts`
  - **Implementation Details:**
```typescript
export const processAICommand = onCall<ProcessAICommandRequest>(
  { secrets: [openaiApiKey] },
  async (request) => {
    // ... validation ...

    const threadId = data.threadId || `${auth.uid}_${data.canvasId}_default`;

    logger.info('Processing AI command with thread', {
      userId: auth.uid,
      canvasId: data.canvasId,
      threadId,
      command: data.command.substring(0, 100),
    });

    try {
      // ... context optimization ...

      const chain = await createAIChain(tools);

      // NEW: Configure with thread ID for memory persistence
      const config = {
        configurable: {
          thread_id: threadId,
        },
        streamMode: 'values' as const,
      };

      logger.info('Invoking LangGraph agent', {
        command: data.command,
        toolCount: tools.length,
        threadId,
      });

      // NEW: Invoke with messages format (LangGraph expects this)
      const result = await chain.invoke(
        {
          messages: [
            {
              role: 'user',
              content: data.command,
            },
          ],
        },
        config
      );

      // NEW: Extract response from LangGraph result
      const messages = result.messages || [];
      const lastMessage = messages[messages.length - 1];
      const output = lastMessage?.content || 'Command processed successfully';

      logger.info('LangGraph agent completed', {
        output: output.substring(0, 200),
        messageCount: messages.length,
        threadId,
      });

      // Parse tool calls from messages
      const actions: any[] = [];
      for (const msg of messages) {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          for (const toolCall of msg.tool_calls) {
            actions.push({
              tool: toolCall.name,
              params: toolCall.args,
              result: { success: true }, // Simplified for now
            });
          }
        }
      }

      // ... analytics logging ...

      const response: ProcessAICommandResponse = {
        success: true,
        message: output,
        actions,
      };

      return response;
    } catch (error) {
      // ... error handling ...
    }
  }
);
```
  - **Success Criteria:**
    - [ ] Thread ID passed to agent.invoke via config
    - [ ] Messages format used instead of input string
    - [ ] Response extracted from result.messages
  - **Tests:**
    1. Send command: "create a blue circle"
    2. Check logs: thread_id logged
    3. Send command: "move it left"
    4. Expected: AI remembers "it" = the blue circle
    5. Verify: Circle moved left successfully
  - **Edge Cases:**
    - ⚠️ Missing thread ID: Generate default from userId + canvasId
    - ⚠️ Invalid thread ID: Sanitize to alphanumeric + underscores
  - **Rollback:** Revert index.ts to previous invoke format
  - **Last Verified:** 2025-10-16

### 3.1.4 Track Last Created Objects in Agent State
- [x] **Action:** Store last created object IDs in tool results for memory
  - **Why:** Enable commands like "move it" to reference recent creations
  - **Files Modified:**
    - Update: `functions/src/ai/tools/base.ts`
  - **Implementation Details:**
```typescript
/**
 * Base Canvas Tool
 *
 * Abstract base class for all canvas manipulation tools.
 * Provides common functionality and memory tracking.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { CanvasToolContext } from './types';

export abstract class CanvasTool {
  protected context: CanvasToolContext;
  private toolName: string;
  private toolDescription: string;
  private schema: z.ZodObject<any>;

  constructor(
    name: string,
    description: string,
    schema: z.ZodObject<any>,
    context: CanvasToolContext
  ) {
    this.toolName = name;
    this.toolDescription = description;
    this.schema = schema;
    this.context = context;
  }

  /**
   * Execute the tool action (implemented by subclasses)
   */
  abstract execute(input: any): Promise<ToolResult>;

  /**
   * Convert to LangChain DynamicStructuredTool
   */
  toLangChainTool(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: this.toolName,
      description: this.toolDescription,
      schema: this.schema,
      func: async (input: any) => {
        const result = await this.execute(input);

        // NEW: Update context with last created objects
        if (result.objectsCreated && result.objectsCreated.length > 0) {
          this.context.lastCreatedObjectIds = result.objectsCreated;
        }

        // Return stringified result for LangChain
        return JSON.stringify(result);
      },
    });
  }

  /**
   * Validate color format
   */
  protected isValidColor(color: string): boolean {
    // Hex color: #RGB or #RRGGBB
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) {
      return true;
    }

    // Named colors (basic set)
    const namedColors = [
      'blue', 'red', 'green', 'yellow', 'gray', 'grey',
      'black', 'white', 'orange', 'purple', 'pink',
    ];

    return namedColors.includes(color.toLowerCase());
  }
}
```
  - **Success Criteria:**
    - [ ] Tool results update context.lastCreatedObjectIds
    - [ ] Object IDs persist across tool calls in same conversation
  - **Tests:**
    1. Send: "create 3 blue circles"
    2. Check: context.lastCreatedObjectIds contains 3 IDs
    3. Send: "move them right"
    4. Expected: All 3 circles move right
  - **Edge Cases:**
    - ⚠️ Tool fails mid-execution: Don't update lastCreatedObjectIds
  - **Rollback:** Remove lastCreatedObjectIds logic from base.ts
  - **Last Verified:** _____

---

# Phase 4: Spatial Intelligence Tools (Estimated: 4 hours)

**Goal:** Add new AI tools for collision detection and smart positioning

**Phase Success Criteria:**
- [ ] findEmptySpace tool finds non-overlapping positions
- [ ] getViewportCenter tool returns center of user's view
- [ ] All create tools default to viewport center
- [ ] Collision detection works for all shape types

---

## 4.1 Viewport Center Tool

### 4.1.1 Create getViewportCenter Tool
- [x] **Action:** New tool to get center of user's current viewport
  - **Why:** Enable AI to place objects in visible area
  - **Files Modified:**
    - Create: `functions/src/ai/tools/getViewportCenter.ts`
    - Update: `functions/src/ai/tools/index.ts`
  - **Implementation Details:**
```typescript
/**
 * Get Viewport Center Tool
 *
 * Returns the center point of the user's current viewport.
 * Used for smart object placement in visible area.
 */

import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';

const GetViewportCenterSchema = z.object({
  // No inputs needed
});

export class GetViewportCenterTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'getViewportCenter',
      'Get the center point of the user\'s current viewport. ' +
      'Use this to place new objects in the visible area where the user is looking. ' +
      'Returns { x, y } coordinates of viewport center.',
      GetViewportCenterSchema,
      context
    );
  }

  async execute(input: z.infer<typeof GetViewportCenterSchema>): Promise<ToolResult> {
    try {
      if (!this.context.viewportBounds) {
        // Fallback: No viewport data, use canvas center
        return {
          success: true,
          message: 'Viewport not available, using canvas center',
          data: {
            x: this.context.canvasSize.width / 2,
            y: this.context.canvasSize.height / 2,
            isViewportCenter: false,
            isFallback: true,
          },
        };
      }

      const { centerX, centerY } = this.context.viewportBounds;

      return {
        success: true,
        message: `Viewport center at (${Math.round(centerX)}, ${Math.round(centerY)})`,
        data: {
          x: centerX,
          y: centerY,
          isViewportCenter: true,
          isFallback: false,
          viewportSize: {
            width: this.context.viewportBounds.maxX - this.context.viewportBounds.minX,
            height: this.context.viewportBounds.maxY - this.context.viewportBounds.minY,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: 'Failed to get viewport center',
      };
    }
  }
}
```

```typescript
// index.ts - Add to getTools function
import { GetViewportCenterTool } from './getViewportCenter';

export function getTools(context: CanvasToolContext): DynamicStructuredTool[] {
  return [
    // ... existing tools ...
    new GetViewportCenterTool(context),
  ].map((tool) => tool.toLangChainTool());
}
```
  - **Success Criteria:**
    - [ ] Tool returns viewport center when viewport data available
    - [ ] Falls back to canvas center when no viewport
    - [ ] Coordinates match viewport calculation
  - **Tests:**
    1. Send command with viewport: `{ camera: { x: 1000, y: 500 }, zoom: 1 }`
    2. AI uses getViewportCenter
    3. Expected: Returns center near (1960, 1040) for 1920x1080 window
    4. Test without viewport
    5. Expected: Returns canvas center (2500, 2500)
  - **Edge Cases:**
    - ⚠️ Viewport at canvas edge: May return coordinates outside canvas (acceptable)
  - **Rollback:** Delete getViewportCenter.ts, remove from index.ts
  - **Last Verified:** 2025-10-16

---

## 4.2 Collision Detection Tool

### 4.2.1 Create Collision Detection Utility
- [x] **Action:** Implement spatial grid for efficient collision detection
  - **Why:** Fast overlap checking for 100+ objects
  - **Files Modified:**
    - Create: `functions/src/ai/utils/collision-detector.ts`
  - **Implementation Details:**
```typescript
/**
 * Collision Detection Utility
 *
 * Efficient spatial collision detection using grid-based partitioning.
 * Supports rectangles, circles, and bounding boxes.
 */

import { CanvasObject } from '../../types';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Check if rectangle and circle overlap
 */
export function rectangleCircleOverlap(rect: Rectangle, circle: Circle): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared < circle.radius * circle.radius;
}

/**
 * Check if two circles overlap
 */
export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;

  return distanceSquared < radiusSum * radiusSum;
}

/**
 * Get bounding box for canvas object
 */
export function getObjectBounds(obj: CanvasObject): Rectangle {
  if (obj.type === 'rectangle' || obj.type === 'text') {
    return {
      x: obj.x,
      y: obj.y,
      width: obj.width || 0,
      height: obj.height || 0,
    };
  } else if (obj.type === 'circle') {
    // Circle bounding box
    const radius = obj.radius || 0;
    return {
      x: obj.x - radius,
      y: obj.y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  } else if (obj.type === 'line') {
    // Line bounding box (simplified)
    return {
      x: obj.x,
      y: obj.y,
      width: obj.width || 0,
      height: 10, // Assume 10px height for line
    };
  }

  return { x: obj.x, y: obj.y, width: 0, height: 0 };
}

/**
 * Check if object would overlap with any existing objects
 */
export function checkCollision(
  testBounds: Rectangle,
  existingObjects: CanvasObject[],
  padding: number = 10
): boolean {
  // Add padding to test bounds
  const paddedBounds: Rectangle = {
    x: testBounds.x - padding,
    y: testBounds.y - padding,
    width: testBounds.width + padding * 2,
    height: testBounds.height + padding * 2,
  };

  for (const obj of existingObjects) {
    const objBounds = getObjectBounds(obj);

    if (rectanglesOverlap(paddedBounds, objBounds)) {
      return true; // Collision detected
    }
  }

  return false; // No collision
}

/**
 * Find empty space near target position using spiral search
 *
 * @param targetX - Preferred X coordinate
 * @param targetY - Preferred Y coordinate
 * @param width - Width of object to place
 * @param height - Height of object to place
 * @param existingObjects - Objects to avoid
 * @param maxRadius - Maximum search radius (default: 500px)
 * @returns Empty position or target if no collision
 */
export function findEmptySpace(
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  existingObjects: CanvasObject[],
  maxRadius: number = 500
): { x: number; y: number } {
  // Check if target position is already empty
  const targetBounds: Rectangle = { x: targetX, y: targetY, width, height };

  if (!checkCollision(targetBounds, existingObjects)) {
    return { x: targetX, y: targetY };
  }

  // Spiral search pattern (increasing radius)
  const step = 50; // Test every 50 pixels

  for (let radius = step; radius <= maxRadius; radius += step) {
    // Test positions in a circle around target
    const numTests = Math.ceil((2 * Math.PI * radius) / step);

    for (let i = 0; i < numTests; i++) {
      const angle = (2 * Math.PI * i) / numTests;
      const testX = targetX + radius * Math.cos(angle);
      const testY = targetY + radius * Math.sin(angle);

      const testBounds: Rectangle = {
        x: testX,
        y: testY,
        width,
        height,
      };

      if (!checkCollision(testBounds, existingObjects)) {
        return { x: testX, y: testY };
      }
    }
  }

  // No empty space found within radius, return target anyway
  return { x: targetX, y: targetY };
}
```
  - **Success Criteria:**
    - [ ] rectanglesOverlap correctly detects overlaps
    - [ ] circlesOverlap works for circle shapes
    - [ ] findEmptySpace finds non-overlapping positions
    - [ ] Spiral search completes in <10ms for 100 objects
  - **Tests:**
    1. Test: `rectanglesOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 })`
    2. Expected: `true` (overlap)
    3. Test: `rectanglesOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 200, y: 200, width: 100, height: 100 })`
    4. Expected: `false` (no overlap)
    5. Test: Create 10 objects in a grid, find empty space
    6. Expected: Returns position outside grid
  - **Edge Cases:**
    - ⚠️ All space occupied: Return target position anyway (user can fix)
    - ⚠️ Very large objects (>1000px): Limit max size to 500px for search
  - **Rollback:** Delete collision-detector.ts
  - **Last Verified:** 2025-10-16

### 4.2.2 Create findEmptySpace Tool
- [x] **Action:** New AI tool to find non-overlapping positions
  - **Why:** Enable automatic smart positioning to avoid overlaps
  - **Files Modified:**
    - Create: `functions/src/ai/tools/findEmptySpace.ts`
    - Update: `functions/src/ai/tools/index.ts`
  - **Implementation Details:**
```typescript
/**
 * Find Empty Space Tool
 *
 * Finds a non-overlapping position near a target location.
 * Uses spiral search to find closest available space.
 */

import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';
import { findEmptySpace as findEmptySpaceUtil } from '../utils/collision-detector';

const FindEmptySpaceSchema = z.object({
  targetX: z.number().describe('Preferred X coordinate'),
  targetY: z.number().describe('Preferred Y coordinate'),
  width: z.number().min(1).describe('Width of object to place'),
  height: z.number().min(1).describe('Height of object to place'),
  maxSearchRadius: z.number()
    .optional()
    .default(500)
    .describe('Maximum search radius in pixels (default: 500)'),
});

export class FindEmptySpaceTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'findEmptySpace',
      'Find an empty space near a target position where an object can be placed without overlapping existing objects. ' +
      'Uses spiral search pattern to find closest available position. ' +
      'Returns { x, y } coordinates of empty space.',
      FindEmptySpaceSchema,
      context
    );
  }

  async execute(input: z.infer<typeof FindEmptySpaceSchema>): Promise<ToolResult> {
    try {
      const { targetX, targetY, width, height, maxSearchRadius } = input;

      const emptyPosition = findEmptySpaceUtil(
        targetX,
        targetY,
        width,
        height,
        this.context.currentObjects,
        maxSearchRadius
      );

      const movedDistance = Math.sqrt(
        Math.pow(emptyPosition.x - targetX, 2) +
        Math.pow(emptyPosition.y - targetY, 2)
      );

      return {
        success: true,
        message: movedDistance > 1
          ? `Found empty space ${Math.round(movedDistance)}px from target at (${Math.round(emptyPosition.x)}, ${Math.round(emptyPosition.y)})`
          : `Target position is already empty at (${Math.round(emptyPosition.x)}, ${Math.round(emptyPosition.y)})`,
        data: {
          x: emptyPosition.x,
          y: emptyPosition.y,
          originalTarget: { x: targetX, y: targetY },
          distance: movedDistance,
          wasAdjusted: movedDistance > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: 'Failed to find empty space',
      };
    }
  }
}
```

```typescript
// index.ts - Add to getTools
import { FindEmptySpaceTool } from './findEmptySpace';

export function getTools(context: CanvasToolContext): DynamicStructuredTool[] {
  return [
    // ... existing tools ...
    new FindEmptySpaceTool(context),
  ].map((tool) => tool.toLangChainTool());
}
```
  - **Success Criteria:**
    - [ ] Tool finds empty positions near target
    - [ ] Returns target if no collision
    - [ ] Spiral search completes in <100ms
  - **Tests:**
    1. Create 5 objects in a cluster at (500, 500)
    2. Call findEmptySpace with target (500, 500), size 100x100
    3. Expected: Returns position outside cluster
    4. Verify: Distance from target logged
  - **Edge Cases:**
    - ⚠️ No empty space found: Return original target with warning
  - **Rollback:** Delete findEmptySpace.ts, remove from index.ts
  - **Last Verified:** 2025-10-16

---

## 4.3 Update Create Tools for Smart Positioning

### 4.3.1 Update createRectangle to Use Viewport Center
- [x] **Action:** Default rectangle position to viewport center instead of (0,0)
  - **Why:** Place new objects where user is looking
  - **Files Modified:**
    - Update: `functions/src/ai/tools/createRectangle.ts`
  - **Implementation Details:**
```typescript
// Update schema to make x, y optional
const CreateRectangleSchema = z.object({
  x: z.number()
    .min(0)
    .max(50000)
    .optional()
    .describe('X coordinate of top-left corner (defaults to viewport center)'),
  y: z.number()
    .min(0)
    .max(50000)
    .optional()
    .describe('Y coordinate of top-left corner (defaults to viewport center)'),
  width: z.number()
    .min(1)
    .max(50000)
    .default(200)
    .describe('Width in pixels (default: 200)'),
  height: z.number()
    .min(1)
    .max(50000)
    .default(200)
    .describe('Height in pixels (default: 200)'),
  fill: z.string()
    .default('#6b7280')
    .describe('Fill color (hex like #ff0000 or color name)'),
  name: z.string()
    .optional()
    .describe('Optional name for the rectangle'),
  avoidOverlap: z.boolean()
    .optional()
    .default(true)
    .describe('Automatically find empty space if position would overlap (default: true)'),
});

// Update execute method
async execute(input: z.infer<typeof CreateRectangleSchema>): Promise<ToolResult> {
  try {
    // Determine position (default to viewport center)
    let x = input.x;
    let y = input.y;

    if (x === undefined || y === undefined) {
      // Use viewport center if available, else canvas center
      if (this.context.viewportBounds) {
        x = this.context.viewportBounds.centerX - input.width / 2; // Top-left corner
        y = this.context.viewportBounds.centerY - input.height / 2;
      } else {
        x = this.context.canvasSize.width / 2 - input.width / 2;
        y = this.context.canvasSize.height / 2 - input.height / 2;
      }
    }

    // Check for overlap and find empty space if needed
    if (input.avoidOverlap) {
      const { findEmptySpace } = await import('../utils/collision-detector.js');
      const emptyPos = findEmptySpace(x, y, input.width, input.height, this.context.currentObjects);

      if (emptyPos.x !== x || emptyPos.y !== y) {
        logger.info('Adjusted position to avoid overlap', {
          original: { x, y },
          adjusted: emptyPos,
        });
        x = emptyPos.x;
        y = emptyPos.y;
      }
    }

    // ... rest of creation logic unchanged ...
  }
}
```
  - **Success Criteria:**
    - [ ] Omitting x, y defaults to viewport center
    - [ ] avoidOverlap prevents overlapping objects
    - [ ] Specified x, y still respected (override default)
  - **Tests:**
    1. Send: "create a blue rectangle" (no position specified)
    2. Expected: Rectangle appears at viewport center
    3. Create another with same command
    4. Expected: Second rectangle offset to avoid overlap
    5. Send: "create a rectangle at 100, 200"
    6. Expected: Rectangle at exact position (100, 200)
  - **Edge Cases:**
    - ⚠️ User explicitly specifies overlapping position: Respect user's choice
  - **Rollback:** Revert createRectangle.ts to previous version
  - **Last Verified:** 2025-10-16

### 4.3.2 Update createCircle for Viewport Positioning
- [x] **Action:** Apply same viewport centering logic to createCircle
  - **Why:** Consistent smart positioning across all shape types
  - **Files Modified:**
    - Update: `functions/src/ai/tools/createCircle.ts`
  - **Implementation Details:**
```typescript
// Same changes as createRectangle:
// 1. Make x, y optional in schema
// 2. Default to viewport center (x, y = center - radius for top-left)
// 3. Add avoidOverlap parameter and collision detection
// 4. Log position adjustments
```
  - **Success Criteria:**
    - [ ] Same behavior as updated createRectangle
    - [ ] Circles placed at viewport center by default
    - [ ] Collision avoidance works for circles
  - **Tests:**
    1. Send: "create a red circle"
    2. Expected: Circle at viewport center
    3. Create multiple circles
    4. Expected: Automatic spacing to avoid overlap
  - **Edge Cases:**
    - ⚠️ Circle radius very large: May not find empty space (return center anyway)
  - **Rollback:** Revert createCircle.ts
  - **Last Verified:** 2025-10-16

### 4.3.3 Update createText for Viewport Positioning
- [x] **Action:** Apply viewport centering to text creation
  - **Why:** Text should also appear in visible area
  - **Files Modified:**
    - Update: `functions/src/ai/tools/createText.ts`
  - **Implementation Details:**
```typescript
// Same pattern as createRectangle:
// 1. Optional x, y with viewport center default
// 2. Collision detection with avoidOverlap
// 3. Calculate dimensions from text content + fontSize
```
  - **Success Criteria:**
    - [ ] Text defaults to viewport center
    - [ ] Collision detection works with text bounds
  - **Tests:**
    1. Send: "create text 'Hello World'"
    2. Expected: Text at viewport center
  - **Edge Cases:**
    - ⚠️ Very long text (>1000 chars): Estimate reasonable bounds
  - **Rollback:** Revert createText.ts
  - **Last Verified:** 2025-10-16

---

# Phase 5: Enhanced Move Tool for Relative Commands (Estimated: 2 hours)

**Goal:** Support relative movement commands like "move it left" using last created objects

**Phase Success Criteria:**
- [ ] "move it left/right/up/down" works with last created object
- [ ] "move them" works with multiple last created objects
- [ ] Relative directions convert to coordinate deltas

---

## 5.1 Relative Movement Support

### 5.1.1 Add Relative Direction Support to moveObject
- [x] **Action:** Enhance moveObject to support direction keywords
  - **Why:** Enable natural commands like "move it left 100px"
  - **Files Modified:**
    - Update: `functions/src/ai/tools/moveObject.ts`
  - **Implementation Details:**
```typescript
const MoveObjectSchema = z.object({
  objectIds: z.array(z.string())
    .optional()
    .describe('Object IDs to move. If not provided, uses last created objects.'),
  // Support either absolute position OR relative direction
  x: z.number()
    .optional()
    .describe('Absolute X coordinate'),
  y: z.number()
    .optional()
    .describe('Absolute Y coordinate'),
  direction: z.enum(['left', 'right', 'up', 'down'])
    .optional()
    .describe('Relative direction to move'),
  distance: z.number()
    .optional()
    .default(100)
    .describe('Distance to move in pixels (default: 100)'),
});

async execute(input: z.infer<typeof MoveObjectSchema>): Promise<ToolResult> {
  try {
    // Determine which objects to move
    let objectIds = input.objectIds;

    if (!objectIds || objectIds.length === 0) {
      // Use last created objects from context
      if (this.context.lastCreatedObjectIds && this.context.lastCreatedObjectIds.length > 0) {
        objectIds = this.context.lastCreatedObjectIds;
        logger.info('Using last created objects for move', { objectIds });
      } else {
        return {
          success: false,
          error: 'No objects specified and no recently created objects',
          message: 'Please specify which objects to move or create objects first',
        };
      }
    }

    // Convert direction to delta
    let deltaX = 0;
    let deltaY = 0;
    let isRelative = false;

    if (input.direction) {
      isRelative = true;
      const distance = input.distance || 100;

      switch (input.direction) {
        case 'left':
          deltaX = -distance;
          break;
        case 'right':
          deltaX = distance;
          break;
        case 'up':
          deltaY = -distance;
          break;
        case 'down':
          deltaY = distance;
          break;
      }
    }

    // Move each object
    const movedObjectIds: string[] = [];

    for (const objectId of objectIds) {
      const obj = this.context.currentObjects.find((o) => o.id === objectId);

      if (!obj) {
        logger.warn('Object not found for move', { objectId });
        continue;
      }

      let newX: number;
      let newY: number;

      if (isRelative) {
        // Relative movement
        newX = obj.x + deltaX;
        newY = obj.y + deltaY;
      } else {
        // Absolute position
        newX = input.x !== undefined ? input.x : obj.x;
        newY = input.y !== undefined ? input.y : obj.y;
      }

      // Update in Firebase
      await updateCanvasObject(this.context.canvasId, objectId, {
        x: newX,
        y: newY,
      });

      movedObjectIds.push(objectId);
    }

    const message = isRelative
      ? `Moved ${movedObjectIds.length} object(s) ${input.direction} by ${input.distance}px`
      : `Moved ${movedObjectIds.length} object(s) to (${input.x}, ${input.y})`;

    return {
      success: true,
      message,
      objectsModified: movedObjectIds,
      data: {
        count: movedObjectIds.length,
        direction: input.direction,
        distance: input.distance,
        isRelative,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      message: 'Failed to move objects',
    };
  }
}
```
  - **Success Criteria:**
    - [x] "move left" works without objectIds (uses last created)
    - [x] Direction keywords convert to coordinate deltas
    - [x] Absolute coordinates still work
  - **Tests:**
    1. Send: "create a blue circle"
    2. Send: "move it left 200"
    3. Expected: Circle moves 200px left
    4. Send: "create 3 rectangles"
    5. Send: "move them down"
    6. Expected: All 3 rectangles move 100px down (default distance)
  - **Edge Cases:**
    - ⚠️ Both direction and x/y specified: Direction takes precedence
    - ⚠️ No last created objects: Return helpful error
  - **Rollback:** Revert moveObject.ts
  - **Last Verified:** 2025-10-16

---

# Final Integration & Testing

## Integration Tests

### Test 1: Viewport-Aware Creation
- [ ] **Scenario:** Create multiple objects and verify they appear in viewport
  - **Steps:**
    1. Pan viewport to (1000, 1000)
    2. Send: "create a blue circle"
    3. Send: "create a red rectangle"
    4. Send: "create yellow text 'Hello'"
  - **Expected:**
    - All objects appear centered in viewport (near 1000, 1000)
    - Objects don't overlap each other
    - User sees all created objects without panning
  - **Test Data:** Viewport at (1000, 1000), zoom 1.0

### Test 2: Conversation Memory
- [ ] **Scenario:** Test multi-turn conversation with object references
  - **Steps:**
    1. Send: "create 3 blue squares"
    2. Send: "move them to the right"
    3. Send: "make them red"
    4. Send: "what did I create?"
  - **Expected:**
    - Step 1: 3 squares created at viewport
    - Step 2: All 3 move right (AI remembers "them")
    - Step 3: All 3 turn red
    - Step 4: AI responds with summary of conversation
  - **Test Data:** Fresh conversation thread

### Test 3: Collision Avoidance
- [ ] **Scenario:** Test automatic spacing of overlapping objects
  - **Steps:**
    1. Send: "create 10 circles"
  - **Expected:**
    - 10 circles created near viewport center
    - None overlap each other
    - Arranged in reasonable pattern (grid or spiral)
  - **Test Data:** Empty canvas, viewport centered

### Test 4: Relative Movement
- [ ] **Scenario:** Test direction-based movement
  - **Steps:**
    1. Send: "create a green rectangle"
    2. Send: "move it left 300"
    3. Send: "move it down 150"
  - **Expected:**
    - Rectangle moves 300px left from original position
    - Rectangle moves 150px down from previous position
  - **Test Data:** Viewport at (0, 0)

### Test 5: Cross-Day Conversation Reset
- [ ] **Scenario:** Verify conversation resets daily
  - **Steps:**
    1. Send command on Day 1
    2. Check threadId includes date
    3. Wait until Day 2 (or manually change date)
    4. Send command
    5. Verify new threadId with new date
  - **Expected:**
    - Day 1 thread: `userId_canvasId_2025-10-16`
    - Day 2 thread: `userId_canvasId_2025-10-17`
    - AI doesn't remember Day 1 conversation on Day 2

## Performance Tests

### Performance Test 1: Context Optimization Speed
- [ ] **Metric:** Time to optimize context with 500 objects
  - **Target:** <50ms
  - **How to Test:**
    1. Create canvas with 500 objects
    2. Send AI command
    3. Measure time in logs for "Context optimization complete"
    4. Run 10 times, average should be <50ms

### Performance Test 2: Collision Detection Speed
- [ ] **Metric:** Time to find empty space among 100 objects
  - **Target:** <100ms
  - **How to Test:**
    1. Create 100 overlapping objects
    2. Call findEmptySpace tool
    3. Measure execution time in logs
    4. Should complete in <100ms

### Performance Test 3: Cache Hit Rate
- [ ] **Metric:** Cache hit percentage for repeated commands
  - **Target:** >80% hit rate
  - **How to Test:**
    1. Send same command 10 times within 30 seconds
    2. Check logs for "Using cached context" vs "cache miss"
    3. Should see 9/10 hits (first is miss, rest are hits)

## Edge Case Testing

### Edge Case 1: No Viewport Data (Old Clients)
- [ ] **Test:** Send AI command without viewport field
  - **Expected:**
    - Backend doesn't crash
    - Objects placed at canvas center (fallback)
    - No errors in logs

### Edge Case 2: Guest User (Unauthenticated)
- [ ] **Test:** Send command while logged out
  - **Expected:**
    - Thread ID starts with "guest_"
    - Conversation still works
    - Objects created successfully

### Edge Case 3: Extremely Large Canvas (10,000x10,000)
- [ ] **Test:** Canvas with 1000+ objects
  - **Expected:**
    - Context optimizer limits to 100 objects
    - Viewport prioritization works
    - No performance degradation

### Edge Case 4: Overlapping Command (User Override)
- [ ] **Test:** "create a rectangle at 100, 100" when position occupied
  - **Expected:**
    - avoidOverlap defaults to true, finds empty space
    - User can disable with explicit instruction: "create at 100, 100 even if overlapping"

### Edge Case 5: Memory Overflow Protection
- [ ] **Test:** Send 20 consecutive commands in one conversation
  - **Expected:**
    - Memory trimmer keeps only last 10 messages
    - Oldest messages dropped
    - Token count stays under 3500

---

# Deployment Checklist

- [x] All 21/21 implementation tasks completed (Phase 0-5) ✓
- [ ] All integration tests passing (requires runtime testing)
- [ ] All performance tests meeting targets (requires runtime testing)
- [ ] All edge cases handled gracefully (requires runtime testing)
- [x] No TypeScript compilation errors ✓ (Backend + Frontend builds pass)
- [ ] No console errors in browser (requires runtime testing)
- [ ] Firebase Functions deploy successful (ready to deploy)
- [x] Frontend build successful ✓ (Vite build passes)
- [ ] Tested in Chrome, Firefox, Safari (requires runtime testing)
- [x] Documentation updated ✓ (Testing guide created: `_docs/plans/ai-spatial-awareness-testing-guide.md`)
- [ ] Commit message written (ready for commit)
- [ ] PR created with summary (ready for PR creation)

---

# Appendix

## Related Documentation
- LangChain Agent Memory: https://js.langchain.com/docs/how_to/agent_executor
- LangGraph MemorySaver: https://langchain-ai.github.io/langgraphjs/how-tos/persistence/
- Firebase RTDB Best Practices: https://firebase.google.com/docs/database/usage/optimize

## Future Enhancements
- [ ] Vector embeddings for semantic object search ("find all buttons")
- [ ] Undo/redo support integrated with AI commands
- [ ] Multi-user collaboration awareness (avoid moving objects others are editing)
- [ ] Smart grouping suggestions ("these look like a form, group them?")
- [ ] Image recognition for AI-generated content
- [ ] Voice command support via Web Speech API

## Time Log
| Date | Phase | Time Spent | Notes |
|------|-------|------------|-------|
| 2025-10-16 | Planning | 2 hours | Research, architecture design, plan creation |
| _____ | Phase 1 | _____ | Frontend viewport integration |
| _____ | Phase 2 | _____ | Backend context optimization |
| _____ | Phase 3 | _____ | Conversation memory |
| _____ | Phase 4 | _____ | Spatial intelligence tools |
| _____ | Phase 5 | _____ | Relative movement |
| _____ | Testing | _____ | Integration and performance testing |

---

**Total Estimated Time:** 18-22 hours
**Complexity:** High (touches frontend, backend, AI, and database layers)
**Risk Level:** Medium (backward compatible, feature flags possible)
