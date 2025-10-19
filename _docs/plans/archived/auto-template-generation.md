# Auto-Generate Templates on Project Creation

**Estimated Time:** 4-5 hours
**Dependencies:** None
**Priority:** High

## Overview

Remove template selection UI and auto-generate starter templates for every new project:
1. **App Icons Template**: iOS (1024x1024) and Android (512x512) rectangles with dimension labels
2. **Feature Graphic Template**: Google Play graphic (1024x500) with placeholder text, tagline, and iPhone mockup
3. **Info Labels**: Descriptive headers above each template section explaining dimensions and purpose

This ensures every user starts with the exact tools they need for app icon and feature graphic design.

---

## Phase 0: Research & Planning

### 0.1 Technical Constraints
- Firebase RTDB structure for canvas objects
- Konva.js rendering requirements
- Template generation must be client-side (no backend calls)
- Must work with existing canvas object types (rect, text, image)

### 0.2 Key Decisions
- **Decision 1**: Remove `template` field from Project type (no longer needed)
- **Decision 2**: Generate template objects immediately after project creation, before navigation
- **Decision 3**: Use placeholder rectangles (not DALL-E) for initial template
- **Decision 4**: Store iPhone frame and screenshot as static assets in `/public/templates/`
- **Decision 5**: Center all template objects in default viewport (0,0 to 2000,2000)

### 0.3 Architecture Overview
```
ProjectsPage (handleCreateProject)
  ↓
createProject() → Firebase Firestore
  ↓
generateTemplateObjects(projectId) → New utility function
  ↓
Creates canvas objects → Firebase RTDB
  ↓
Navigate to /canvas/:projectId
```

### 0.4 File Modifications Summary
- **Modify**: `src/pages/ProjectsPage.tsx` - Simplify handleCreateProject
- **Modify**: `src/features/projects/components/CreateProjectModal.tsx` - Remove template selection UI
- **Modify**: `src/types/project.types.ts` - Remove template field and TEMPLATES constant
- **Create**: `src/lib/utils/template-generator.ts` - Core template generation logic
- **Create**: `public/templates/iphone-frame.png` - iPhone mockup asset
- **Create**: `public/templates/screenshot-placeholder.png` - Screenshot asset

---

## Phase 1: Prepare Static Assets & Types

**Goal:** Set up static assets and update type definitions

### 1.1 Task Group: Add Static Assets (30 min)

#### 1.1.1 Create iPhone Frame Asset
- [ ] **Action:** Add iPhone 14 Pro frame image to `/public/templates/iphone-frame.png`
  - **Why:** Needed for feature graphic template
  - **Files Modified:**
    - Create: `public/templates/iphone-frame.png`
  - **Implementation Details:**
    - Use provided iPhone frame image (Image #1)
    - Ensure transparent background
    - Recommended size: 300x600px (scales to fit 1024x500 graphic)
  - **Success Criteria:**
    - [ ] Image file exists at correct path
    - [ ] Image has transparent background
    - [ ] Image loads in browser at `/templates/iphone-frame.png`
  - **Tests:**
    1. Navigate to `http://localhost:5173/templates/iphone-frame.png`
    2. Expected: iPhone frame displays with transparent background
    3. Verify: No 404 error
  - **Edge Cases:**
    - ⚠️ Image too large: Keep under 100KB for fast loading
    - ⚠️ Wrong format: Use PNG with alpha channel

#### 1.1.2 Create Screenshot Placeholder Asset
- [ ] **Action:** Add YC video screenshot to `/public/templates/screenshot-placeholder.png`
  - **Why:** Default content for iPhone frame in feature graphic
  - **Files Modified:**
    - Create: `public/templates/screenshot-placeholder.png`
  - **Implementation Details:**
    - Use provided screenshot (Image #2)
    - Resize to fit iPhone frame (approx 280x560px)
    - Ensure it matches iPhone screen dimensions
  - **Success Criteria:**
    - [ ] Image file exists at correct path
    - [ ] Image dimensions fit iPhone frame
    - [ ] Image loads in browser
  - **Tests:**
    1. Navigate to `http://localhost:5173/templates/screenshot-placeholder.png`
    2. Expected: Screenshot displays correctly
    3. Verify: Dimensions are appropriate for iPhone frame
  - **Edge Cases:**
    - ⚠️ Aspect ratio mismatch: Maintain 9:19.5 ratio (iPhone 14 Pro)

### 1.2 Task Group: Update Type Definitions (20 min)

#### 1.2.1 Remove Template Types
- [x] **Action:** Update `src/types/project.types.ts` to remove template-related code
  - **Why:** No longer selecting templates - always generate same starter content
  - **Files Modified:**
    - Update: `src/types/project.types.ts`
  - **Implementation Details:**
```typescript
// BEFORE
export type ProjectTemplate = 'blank' | 'feature-graphic' | 'app-icon';
export interface Project {
  // ... other fields
  template: ProjectTemplate;
}
export const TEMPLATES: Record<ProjectTemplate, TemplateMetadata> = { ... };

// AFTER
export interface Project {
  // ... other fields (remove template field)
  // template field removed - all projects now auto-generate same starter content
}
// Remove: ProjectTemplate type
// Remove: isProjectTemplate() function
// Remove: TEMPLATES constant
// Remove: TemplateMetadata interface
```
  - **Success Criteria:**
    - [ ] `template` field removed from Project interface
    - [ ] All template-related types and constants removed
    - [ ] No TypeScript errors in project
  - **Tests:**
    1. Run: `npm run type-check`
    2. Expected: No errors related to missing template field
    3. Verify: Build succeeds
  - **Edge Cases:**
    - ⚠️ Migration: Existing projects in Firestore may still have template field (backward compatible - just ignored)

---

## Phase 2: Create Template Generator Utility

**Goal:** Build core logic for generating canvas objects

### 2.1 Task Group: Template Generator Core (60 min)

#### 2.1.1 Create Template Generator File Structure
- [x] **Action:** Create `src/lib/utils/template-generator.ts` with JSDoc header
  - **Why:** Centralize all template generation logic
  - **Files Modified:**
    - Create: `src/lib/utils/template-generator.ts`
  - **Implementation Details:**
```typescript
/**
 * Template Generator Utility
 *
 * Auto-generates starter canvas objects for new projects:
 * 1. App Icons Template (iOS 1024x1024 + Android 512x512 rectangles)
 * 2. Feature Graphic Template (1024x500 graphic with text and iPhone mockup)
 *
 * All templates are generated client-side and written directly to Firebase RTDB.
 */

import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { CanvasObject } from '@/types/canvas.types';

export async function generateTemplateObjects(projectId: string): Promise<void> {
  // Implementation in next tasks
}
```
  - **Success Criteria:**
    - [ ] File created with JSDoc header
    - [ ] Imports from Firebase and types are correct
    - [ ] Function signature defined
  - **Tests:**
    1. Import in another file: `import { generateTemplateObjects } from '@/lib/utils/template-generator'`
    2. Expected: No import errors
    3. Verify: TypeScript recognizes function signature
  - **Edge Cases:**
    - ⚠️ None at this stage (just structure)

#### 2.1.2 Implement App Icons Template Generator
- [x] **Action:** Add `generateAppIconsTemplate()` helper function
  - **Why:** Creates iOS and Android starter rectangles with dimension labels and info header
  - **Files Modified:**
    - Update: `src/lib/utils/template-generator.ts`
  - **Implementation Details:**
```typescript
/**
 * Generate App Icons Template
 *
 * Creates:
 * - Info header text explaining app icon dimensions
 * - iOS rectangle (1024x1024) at x: 100, y: 150
 * - Android rectangle (512x512) at x: 1224, y: 150 (100px gap)
 * - "iOS 1024x1024" label above iOS rect
 * - "Android 512x512" label above Android rect
 *
 * Total: 5 objects (1 info header + 2 labels + 2 rectangles)
 */
function generateAppIconsTemplate(): CanvasObject[] {
  const timestamp = Date.now();
  const objects: CanvasObject[] = [];

  // Info Header (top-left, above all app icon elements)
  objects.push({
    id: crypto.randomUUID(),
    type: 'text',
    x: 100,
    y: 20, // Top of the template
    width: 1636, // Spans entire width of template
    height: 50,
    fill: '#111827', // Gray-900 (darker for emphasis)
    text: 'APP ICONS — iOS (1024 × 1024) • Android (512 × 512)',
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    name: 'App Icons Header',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // iOS Label
  objects.push({
    id: crypto.randomUUID(),
    type: 'text',
    x: 100,
    y: 100, // 80px below header
    width: 1024,
    height: 40,
    fill: '#000000',
    text: 'iOS 1024x1024',
    fontSize: 24,
    fontFamily: 'Inter',
    name: 'iOS Label',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // iOS Rectangle
  objects.push({
    id: crypto.randomUUID(),
    type: 'rect',
    x: 100,
    y: 150, // 50px below label
    width: 1024,
    height: 1024,
    fill: '#E5E7EB', // Gray-200
    stroke: '#9CA3AF', // Gray-400
    strokeWidth: 2,
    name: 'iOS App Icon',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Android Label
  objects.push({
    id: crypto.randomUUID(),
    type: 'text',
    x: 1224, // 100 + 1024 + 100 gap
    y: 356, // Vertically centered: 150 + (1024 - 512) / 2 - 50
    width: 512,
    height: 40,
    fill: '#000000',
    text: 'Android 512x512',
    fontSize: 20,
    fontFamily: 'Inter',
    name: 'Android Label',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Android Rectangle
  objects.push({
    id: crypto.randomUUID(),
    type: 'rect',
    x: 1224,
    y: 406, // Vertically centered: 150 + (1024 - 512) / 2
    width: 512,
    height: 512,
    fill: '#E5E7EB', // Gray-200
    stroke: '#9CA3AF', // Gray-400
    strokeWidth: 2,
    name: 'Android App Icon',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return objects;
}
```
  - **Success Criteria:**
    - [ ] Function returns array of 5 CanvasObject instances (added info header)
    - [ ] All objects have unique IDs
    - [ ] Info header positioned at top, spanning full width
    - [ ] Positions create side-by-side layout
    - [ ] Labels positioned above rectangles
  - **Tests:**
    1. Call function: `const objs = generateAppIconsTemplate()`
    2. Expected: Returns array with length 5 (was 4, now includes header)
    3. Verify: `objs[0].type === 'text'` and `objs[0].text` includes 'APP ICONS'
    4. Verify: Android rect is vertically centered with iOS rect
  - **Edge Cases:**
    - ⚠️ ID collisions: crypto.randomUUID() guarantees uniqueness

#### 2.1.3 Implement Feature Graphic Template Generator
- [x] **Action:** Add `generateFeatureGraphicTemplate()` helper function
  - **Why:** Creates Google Play feature graphic starter with info header, text, and iPhone mockup
  - **Files Modified:**
    - Update: `src/lib/utils/template-generator.ts`
  - **Implementation Details:**
```typescript
/**
 * Generate Feature Graphic Template
 *
 * Creates 1024x500 Google Play feature graphic with:
 * - Info header text explaining feature graphic dimensions
 * - Gray background rectangle (1024x500)
 * - "Your App Name" text (large, centered-left)
 * - "Your Tagline Here" text (smaller, below app name)
 * - iPhone frame image (right side)
 * - Screenshot inside iPhone frame
 *
 * Layout positions all elements below app icons template (y: 1250)
 * Total: 6 objects (1 info header + 1 bg + 2 text + 2 images)
 */
function generateFeatureGraphicTemplate(): CanvasObject[] {
  const timestamp = Date.now();
  const objects: CanvasObject[] = [];
  const startY = 1250; // Position below app icons (adjusted for header)

  // Info Header (above feature graphic)
  objects.push({
    id: crypto.randomUUID(),
    type: 'text',
    x: 100,
    y: startY - 50, // 50px above feature graphic
    width: 1024,
    height: 40,
    fill: '#111827', // Gray-900 (darker for emphasis)
    text: 'FEATURE GRAPHIC — Google Play Store (1024 × 500)',
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    name: 'Feature Graphic Header',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Background Rectangle (1024x500)
  objects.push({
    id: crypto.randomUUID(),
    type: 'rect',
    x: 100,
    y: startY,
    width: 1024,
    height: 500,
    fill: '#6B7280', // Gray-500 background
    stroke: '#4B5563', // Gray-600
    strokeWidth: 2,
    name: 'Feature Graphic Background',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // App Name Text (left side, large)
  objects.push({
    id: crypto.randomUUID(),
    type: 'text',
    x: 150, // 50px padding from left edge
    y: startY + 150, // Centered vertically with some offset
    width: 500,
    height: 80,
    fill: '#FFFFFF', // White text
    text: 'Your App Name',
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    name: 'App Name',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Tagline Text (below app name, smaller)
  objects.push({
    id: crypto.randomUUID(),
    type: 'text',
    x: 150,
    y: startY + 240, // Below app name
    width: 500,
    height: 40,
    fill: '#F3F4F6', // Gray-100 text
    text: 'Your Tagline Here',
    fontSize: 24,
    fontFamily: 'Inter',
    name: 'Tagline',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // iPhone Frame (right side)
  // Assuming frame is 300x600 to fit in 500px height
  objects.push({
    id: crypto.randomUUID(),
    type: 'image',
    x: 724, // Right side: 100 + 1024 - 400 (frame width with margin)
    y: startY + 50, // Centered vertically: (500 - 400) / 2
    width: 300,
    height: 600,
    imageUrl: '/templates/iphone-frame.png',
    storageType: 'url',
    name: 'iPhone Frame',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Screenshot (inside iPhone frame)
  // Position to fit inside frame screen area (adjust based on actual frame)
  objects.push({
    id: crypto.randomUUID(),
    type: 'image',
    x: 744, // Offset to center inside frame (20px frame border)
    y: startY + 70, // Offset for frame top (20px frame border)
    width: 260, // Slightly smaller than frame
    height: 560,
    imageUrl: '/templates/screenshot-placeholder.png',
    storageType: 'url',
    name: 'Screenshot',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return objects;
}
```
  - **Success Criteria:**
    - [ ] Function returns array of 6 CanvasObject instances (added info header)
    - [ ] All objects have unique IDs
    - [ ] Info header positioned above background rectangle
    - [ ] Text elements positioned on left
    - [ ] iPhone frame and screenshot positioned on right
    - [ ] Screenshot fits inside iPhone frame
  - **Tests:**
    1. Call function: `const objs = generateFeatureGraphicTemplate()`
    2. Expected: Returns array with length 6 (was 5, now includes header)
    3. Verify: `objs[0].type === 'text'` and `objs[0].text` includes 'FEATURE GRAPHIC'
    4. Verify: Background rect is 1024x500
    5. Verify: iPhone frame x position > app name x position
    6. Verify: Screenshot x/y is inside frame boundaries
  - **Edge Cases:**
    - ⚠️ Image loading: Images loaded from public folder, no upload needed
    - ⚠️ Positioning: Adjust screenshot offsets if iPhone frame border sizes differ

#### 2.1.4 Implement Main Generator Function
- [x] **Action:** Complete `generateTemplateObjects()` main function
  - **Why:** Orchestrates template generation and writes to Firebase RTDB
  - **Files Modified:**
    - Update: `src/lib/utils/template-generator.ts`
  - **Implementation Details:**
```typescript
/**
 * Generate Template Objects for New Project
 *
 * Creates starter canvas objects for every new project:
 * 1. App Icons Template (5 objects: 1 info header + 2 labels + 2 rectangles)
 * 2. Feature Graphic Template (6 objects: 1 info header + bg + 2 text + 2 images)
 *
 * Total: 11 canvas objects written to Firebase RTDB
 *
 * @param projectId - Firebase project ID
 * @throws Error if Firebase write fails
 */
export async function generateTemplateObjects(projectId: string): Promise<void> {
  try {
    // Generate all template objects
    const appIconObjects = generateAppIconsTemplate();
    const featureGraphicObjects = generateFeatureGraphicTemplate();
    const allObjects = [...appIconObjects, ...featureGraphicObjects];

    // Convert array to Firebase object structure
    // Firebase RTDB stores objects as { [id]: object } not arrays
    const objectsMap: Record<string, CanvasObject> = {};
    allObjects.forEach((obj) => {
      objectsMap[obj.id] = obj;
    });

    // Write to Firebase RTDB: /canvases/{projectId}/objects
    const objectsRef = ref(database, `canvases/${projectId}/objects`);
    await set(objectsRef, objectsMap);

    console.log(`✅ Generated ${allObjects.length} template objects for project ${projectId}`);
  } catch (error) {
    console.error('❌ Failed to generate template objects:', error);
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```
  - **Success Criteria:**
    - [ ] Function writes objects to correct Firebase path
    - [ ] All 11 objects written successfully (5 app icons + 6 feature graphic)
    - [ ] Error handling in place
    - [ ] Console logs success/failure
  - **Tests:**
    1. Call: `await generateTemplateObjects('test-project-123')`
    2. Expected: No errors thrown
    3. Verify in Firebase console: `/canvases/test-project-123/objects` has 11 entries
    4. Verify: Console shows "✅ Generated 11 template objects..."
  - **Edge Cases:**
    - ⚠️ Firebase connection failure: Throws error with descriptive message
    - ⚠️ Invalid projectId: Firebase will reject, caught by try/catch

---

## Phase 3: Update Project Creation Flow

**Goal:** Integrate template generator into project creation

### 3.1 Task Group: Simplify CreateProjectModal (30 min)

#### 3.1.1 Remove Template Selection UI
- [x] **Action:** Update `CreateProjectModal.tsx` to remove template selection section
  - **Why:** No longer selecting templates - always auto-generate
  - **Files Modified:**
    - Update: `src/features/projects/components/CreateProjectModal.tsx`
  - **Implementation Details:**
    - Remove: `selectedTemplate` state variable
    - Remove: Template selection grid UI (lines ~151-202)
    - Remove: `template` parameter from `onCreate` prop
    - Update: `handleSubmit` to call `onCreate(projectName, isPublic)` (no template)
  - **Success Criteria:**
    - [ ] Template selection UI removed
    - [ ] Modal only shows: name input + visibility toggle
    - [ ] No TypeScript errors
    - [ ] Modal is more compact and focused
  - **Tests:**
    1. Open modal (click "New Project" button)
    2. Expected: Only see name input and public/private toggle
    3. Verify: No template selection grid visible
    4. Verify: Modal height is shorter than before
  - **Edge Cases:**
    - ⚠️ None - just removing UI

#### 3.1.2 Update CreateProjectModal Props
- [x] **Action:** Update CreateProjectModal interface and usage
  - **Why:** Remove template parameter from onCreate callback
  - **Files Modified:**
    - Update: `src/features/projects/components/CreateProjectModal.tsx`
  - **Implementation Details:**
```typescript
// BEFORE
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, template: ProjectTemplate, isPublic: boolean) => void;
  isCreating?: boolean;
  defaultName?: string;
}

// AFTER
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isPublic: boolean) => void; // Remove template param
  isCreating?: boolean;
  defaultName?: string;
}

// Update handleSubmit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const validation = validateProjectName(projectName);
  if (!validation.valid) {
    setError(validation.error || 'Invalid project name');
    return;
  }
  setError('');
  onCreate(projectName, isPublic); // Remove template argument
};
```
  - **Success Criteria:**
    - [ ] Props interface updated
    - [ ] onCreate called with only 2 arguments
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run: `npm run type-check`
    2. Expected: No errors in CreateProjectModal
    3. Verify: ProjectsPage will show error (fixed in next task)
  - **Edge Cases:**
    - ⚠️ Breaking change: ProjectsPage must be updated (next task)

### 3.2 Task Group: Update ProjectsPage (40 min)

#### 3.2.1 Update handleCreateProject Function
- [x] **Action:** Update ProjectsPage handleCreateProject to remove template and add template generation
  - **Why:** Generate templates automatically instead of storing template type
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```typescript
// Add import at top
import { generateTemplateObjects } from '@/lib/utils/template-generator';

// Update function signature (remove template parameter)
const handleCreateProject = async (
  name: string,
  isPublic: boolean // Removed: template: ProjectTemplate
) => {
  if (!currentUser) return;

  try {
    setIsCreating(true);

    const newProject: Project = {
      id: generateProjectId(),
      name,
      ownerId: currentUser.uid,
      // REMOVED: template, // No longer needed
      isPublic,
      collaborators: [currentUser.uid],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      objectCount: 11, // Will have 11 template objects (5 app icons + 6 feature graphic)
    };

    // Create project in Firestore
    await createProject(newProject);

    // Generate template objects in RTDB
    await generateTemplateObjects(newProject.id);

    setProjects((prev) => [newProject, ...prev]);
    setShowCreateModal(false);

    // Navigate to canvas editor
    navigate(`/canvas/${newProject.id}`);
  } catch (error) {
    console.error('Failed to create project:', error);
    alert('Failed to create project. Please try again.');
  } finally {
    setIsCreating(false);
  }
};
```
  - **Success Criteria:**
    - [ ] Template parameter removed from function
    - [ ] generateTemplateObjects called after project creation
    - [ ] objectCount set to 11 (5 app icons + 6 feature graphic)
    - [ ] Error handling preserves existing behavior
  - **Tests:**
    1. Click "New Project" button
    2. Enter project name: "Test Template Project"
    3. Click "Create Project"
    4. Expected: Project created, templates generated, navigates to canvas
    5. Verify in Firebase: `/canvases/{projectId}/objects` has 11 objects
    6. Verify: Canvas loads with visible rectangles, text, and info headers
    7. Verify: App icons header reads "APP ICONS — iOS (1024 × 1024) • Android (512 × 512)"
    8. Verify: Feature graphic header reads "FEATURE GRAPHIC — Google Play Store (1024 × 500)"
  - **Edge Cases:**
    - ⚠️ Template generation fails: User still sees error, project creation rolls back
    - ⚠️ Network timeout: Standard Firebase timeout handling applies

#### 3.2.2 Update CreateProjectModal Usage
- [x] **Action:** Update CreateProjectModal component usage in ProjectsPage
  - **Why:** Pass updated onCreate callback
  - **Files Modified:**
    - Update: `src/pages/ProjectsPage.tsx`
  - **Implementation Details:**
```typescript
// BEFORE
<CreateProjectModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreate={handleCreateProject} // Signature: (name, template, isPublic) => void
  isCreating={isCreating}
  defaultName={getDefaultProjectName()}
/>

// AFTER
<CreateProjectModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreate={handleCreateProject} // Signature: (name, isPublic) => void
  isCreating={isCreating}
  defaultName={getDefaultProjectName()}
/>
```
  - **Success Criteria:**
    - [ ] No changes needed (just confirming signature matches)
    - [ ] No TypeScript errors
  - **Tests:**
    1. Run: `npm run type-check`
    2. Expected: No errors
    3. Verify: Modal opens and functions correctly
  - **Edge Cases:**
    - ⚠️ None - types should match from previous tasks

---

## Phase 4: Testing & Validation

**Goal:** Comprehensive testing of auto-template generation

### 4.1 Task Group: Manual Testing (30 min)

#### 4.1.1 Test Complete Flow
- [x] **Action:** Test entire project creation flow with templates
  - **Why:** Ensure all pieces work together
  - **Files Modified:** None (testing only)
  - **Implementation Details:**
    - Test sequence:
      1. Login to app
      2. Click "New Project"
      3. Enter name, select visibility
      4. Create project
      5. Verify templates appear on canvas
      6. Check Firebase RTDB structure
  - **Success Criteria:**
    - [ ] All 11 template objects visible on canvas
    - [ ] Info headers visible and readable at top
    - [ ] iOS and Android rectangles side by side
    - [ ] Feature graphic below app icons
    - [ ] iPhone frame and screenshot visible
    - [ ] All text elements readable
  - **Tests:**
    1. Create new project: "Template Test 1"
    2. Expected: Canvas loads with 11 objects
    3. Verify: App icons header at (100, 20) with text "APP ICONS — iOS (1024 × 1024) • Android (512 × 512)"
    4. Verify: iOS rect at (100, 150), Android rect at (1224, 406)
    5. Verify: Feature graphic header at (100, 1200) with text "FEATURE GRAPHIC — Google Play Store (1024 × 500)"
    6. Verify: Feature graphic background at (100, 1250)
    7. Verify: iPhone images load correctly
    8. Verify: Can select, move, edit all objects including headers
  - **Edge Cases:**
    - ⚠️ Slow image loading: Images should appear within 2 seconds
    - ⚠️ Missing images: Show placeholder or error in console

#### 4.1.2 Test Error Scenarios
- [x] **Action:** Test failure cases
  - **Why:** Ensure graceful error handling
  - **Files Modified:** None (testing only)
  - **Implementation Details:**
    - Test scenarios:
      1. Network offline during creation
      2. Invalid project ID
      3. Firebase permission denied
      4. Missing image assets
  - **Success Criteria:**
    - [ ] Clear error messages shown to user
    - [ ] Project creation fails gracefully
    - [ ] No partial data in Firebase
    - [ ] User can retry
  - **Tests:**
    1. Disconnect network
    2. Create project
    3. Expected: Error message appears
    4. Verify: No project created in Firestore
    5. Reconnect network, retry
    6. Expected: Success
  - **Edge Cases:**
    - ⚠️ Timeout: Firebase has built-in timeout (10 seconds)

### 4.2 Task Group: Cleanup (20 min)

#### 4.2.1 Remove Unused Code
- [x] **Action:** Clean up any remaining template-related code
  - **Why:** Remove dead code
  - **Files Modified:**
    - Search codebase for: `ProjectTemplate`, `TEMPLATES`, `isProjectTemplate`
  - **Implementation Details:**
    - Check all files for unused imports
    - Remove any dead code branches
    - Update any comments referencing templates
  - **Success Criteria:**
    - [ ] No references to old template system
    - [ ] Clean build with no warnings
    - [ ] No unused imports
  - **Tests:**
    1. Search: `git grep "ProjectTemplate"`
    2. Expected: No results (except maybe in git history)
    3. Run: `npm run build`
    4. Expected: No warnings about unused code
  - **Edge Cases:**
    - ⚠️ Comments: Update any docs that mention template selection

#### 4.2.2 Update Documentation
- [x] **Action:** Update CLAUDE.md if it mentions templates
  - **Why:** Keep docs in sync with code
  - **Files Modified:**
    - Update: `CLAUDE.md` (if template selection mentioned)
  - **Implementation Details:**
    - Add section about auto-generated templates
    - Remove any references to template selection
    - Document the 9 starter objects
  - **Success Criteria:**
    - [ ] Docs accurate
    - [ ] No outdated template selection instructions
  - **Tests:**
    1. Read CLAUDE.md
    2. Verify: Mentions auto-template generation
    3. Verify: No mention of template selection UI
  - **Edge Cases:**
    - ⚠️ None - documentation only

---

## Rollback Strategy

If template generation causes issues:

1. **Revert template generation**: Comment out `await generateTemplateObjects()` call
2. **Restore template selection**: Revert CreateProjectModal changes
3. **Restore Project type**: Add back `template` field
4. **Restore TEMPLATES constant**: Revert project.types.ts

Files to revert (in order):
1. `src/pages/ProjectsPage.tsx` (handleCreateProject)
2. `src/features/projects/components/CreateProjectModal.tsx`
3. `src/types/project.types.ts`
4. Delete `src/lib/utils/template-generator.ts`

## Success Metrics

- [ ] New projects created in < 3 seconds (including template generation)
- [ ] All 11 template objects visible on first canvas load (5 app icons + 6 feature graphic)
- [ ] Info headers clearly visible with dimension information
- [ ] No errors in console during template generation
- [ ] Template images load within 2 seconds
- [ ] Users can immediately edit all template objects including headers

## Auto-Generated Template Objects

Every new project will automatically include **11 canvas objects**:

### App Icons Section (5 objects)
1. **App Icons Info Header** - Text at (100, 20): "APP ICONS — iOS (1024 × 1024) • Android (512 × 512)"
2. **iOS Label** - Text at (100, 100): "iOS 1024x1024"
3. **iOS Rectangle** - Gray rect at (100, 150), size 1024×1024
4. **Android Label** - Text at (1224, 356): "Android 512x512"
5. **Android Rectangle** - Gray rect at (1224, 406), size 512×512

### Feature Graphic Section (6 objects)
6. **Feature Graphic Info Header** - Text at (100, 1200): "FEATURE GRAPHIC — Google Play Store (1024 × 500)"
7. **Feature Graphic Background** - Gray rect at (100, 1250), size 1024×500
8. **App Name Text** - White text at (150, 1400): "Your App Name"
9. **Tagline Text** - Light gray text at (150, 1490): "Your Tagline Here"
10. **iPhone Frame Image** - Image at (724, 1300), size 300×600
11. **Screenshot Image** - Image at (744, 1320), size 260×560

## Notes

- **Image assets**: Ensure iPhone frame and screenshot are optimized (< 100KB each)
- **Layout**: Positions are hardcoded for 2000x2000 default canvas - adjust if canvas size changes
- **Future**: Could add "Reset Template" action to regenerate starter objects
- **Migration**: Existing projects unaffected (no template field needed anymore)
- **Info Headers**: Bold, uppercase text with × symbol for dimensions (not 'x')
