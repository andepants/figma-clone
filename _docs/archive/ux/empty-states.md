# Empty State Catalog

**Purpose:** Helpful empty states that guide users to next action and reduce confusion.

**UX Principle:** Progressive disclosure - empty state is the first step in the user journey.

---

## Empty State Anatomy

Every empty state must include:
1. **Icon/Illustration** - Visual representation (simple, minimal)
2. **Heading** - Clear, concise title
3. **Description** - Explain what this space is for (1-2 sentences)
4. **Primary CTA** - Main action user should take
5. **Secondary Action** - Optional alternative path

---

## 1. Projects Dashboard - Paid User (No Projects Yet)

**Scenario:** Paid user lands on dashboard, hasn't created any projects yet.

**Goal:** Encourage creation with templates, show value of paid tier.

```tsx
<div className="flex flex-col items-center justify-center h-96 text-center px-4">
  {/* Icon */}
  <div className="w-20 h-20 mb-6 text-gray-300">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
    Create Your First Project
  </h3>

  {/* Description */}
  <p className="text-gray-600 mb-8 max-w-md">
    Start designing professional app icons and graphics with templates optimized for iOS and Android.
  </p>

  {/* Primary CTA */}
  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4">
    Create Project
  </button>

  {/* Secondary Action */}
  <button className="text-sm text-blue-600 hover:text-blue-700">
    Browse Templates →
  </button>
</div>
```

**Copy Variations:**
- Heading: "Your Canvas Awaits" | "Start Creating"
- Description: "Design App Store-ready icons in minutes" | "Collaborate in real-time on app graphics"

---

## 2. Projects Dashboard - Free User (Can't Create)

**Scenario:** Free user lands on dashboard, sees they can't create projects.

**Goal:** Show value, encourage upgrade without being pushy.

```tsx
<div className="flex flex-col items-center justify-center h-96 text-center px-4">
  {/* Icon */}
  <div className="w-20 h-20 mb-6 text-blue-100">
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
    Unlock Project Creation
  </h3>

  {/* Description */}
  <p className="text-gray-600 mb-2 max-w-md">
    Free accounts can browse and join public projects.
  </p>
  <p className="text-gray-600 mb-8 max-w-md">
    Upgrade to <span className="font-semibold text-blue-600">CanvasIcons Founders</span> for just <span className="font-semibold">$9.99/year</span> to create unlimited private projects.
  </p>

  {/* Primary CTA */}
  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4">
    Upgrade to Founders ($9.99/year)
  </button>

  {/* Secondary Action */}
  <button className="text-sm text-gray-600 hover:text-gray-700">
    Browse Public Projects →
  </button>
</div>
```

**Tone:** Informative, not pushy. Show value before asking for payment.

---

## 3. Shared Projects (No Public Projects)

**Scenario:** User navigates to "Shared Projects" tab, but no public projects exist yet.

**Goal:** Explain what shared projects are, encourage users to make projects public.

```tsx
<div className="flex flex-col items-center justify-center h-96 text-center px-4">
  {/* Icon */}
  <div className="w-20 h-20 mb-6 text-gray-300">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
    No Public Projects Yet
  </h3>

  {/* Description */}
  <p className="text-gray-600 mb-8 max-w-md">
    Public projects appear here for anyone to view and remix. Share your work with the community!
  </p>

  {/* Primary CTA (if user is paid) */}
  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4">
    Make a Project Public
  </button>

  {/* Secondary Action */}
  <button className="text-sm text-blue-600 hover:text-blue-700">
    Learn About Public Projects →
  </button>
</div>
```

**Copy Variations:**
- Heading: "Be the First to Share" | "Community Showcase Coming Soon"

---

## 4. Canvas (Blank Canvas)

**Scenario:** User opens a new blank project, canvas has no objects.

**Goal:** Guide user to create first object, show available tools.

```tsx
<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
  <div className="text-center">
    {/* Icon */}
    <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </div>

    {/* Heading */}
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      Blank Canvas
    </h3>

    {/* Description */}
    <p className="text-gray-500 text-sm mb-6 max-w-sm">
      Select a tool from the toolbar to get started, or press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">R</kbd> for Rectangle
    </p>

    {/* Helpful shortcuts */}
    <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
      <div>
        <kbd className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-mono">R</kbd>
        <span className="ml-1">Rectangle</span>
      </div>
      <div>
        <kbd className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-mono">O</kbd>
        <span className="ml-1">Circle</span>
      </div>
      <div>
        <kbd className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-mono">L</kbd>
        <span className="ml-1">Line</span>
      </div>
    </div>
  </div>
</div>
```

**Tone:** Helpful, not intrusive. Fades when user starts creating.

---

## 5. Export Modal (No Objects to Export)

**Scenario:** User opens export modal but canvas has no objects.

**Goal:** Inform user they need objects first, close modal gracefully.

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  {/* Icon */}
  <div className="w-16 h-16 mb-4 text-gray-300">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Canvas is Empty
  </h3>

  {/* Description */}
  <p className="text-gray-600 mb-6 max-w-sm">
    Add objects to your canvas before exporting. Try creating shapes, icons, or text.
  </p>

  {/* Primary CTA */}
  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
    Close
  </button>
</div>
```

**Tone:** Matter-of-fact, not scolding. User can close and continue working.

---

## 6. Export Modal (No Selection, Scope = Selection)

**Scenario:** User selected "Export Selection" but nothing is selected.

**Goal:** Guide user to either select objects or switch to "Export All".

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  {/* Icon */}
  <div className="w-16 h-16 mb-4 text-blue-100">
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No Objects Selected
  </h3>

  {/* Description */}
  <p className="text-gray-600 mb-6 max-w-sm">
    Select objects on the canvas first, or switch to "Export All" to export the entire canvas.
  </p>

  {/* Actions */}
  <div className="flex items-center space-x-3">
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
      Export All Instead
    </button>
    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
      Close
    </button>
  </div>
</div>
```

**Tone:** Helpful, provide immediate solution (switch to Export All).

---

## 7. Layers Panel (No Objects)

**Scenario:** User has blank canvas, layers panel is empty.

**Goal:** Explain purpose of layers panel, encourage creation.

```tsx
<div className="flex flex-col items-center justify-center h-64 text-center px-4">
  {/* Icon */}
  <div className="w-12 h-12 mb-3 text-gray-300">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-sm font-semibold text-gray-700 mb-2">
    No Layers Yet
  </h3>

  {/* Description */}
  <p className="text-xs text-gray-500 mb-4">
    Objects you create will appear here
  </p>
</div>
```

**Tone:** Minimal, doesn't distract from main canvas.

---

## 8. Search Results (No Matches)

**Scenario:** User searches for object/project but no results found.

**Goal:** Offer alternative actions, suggest better search terms.

```tsx
<div className="flex flex-col items-center justify-center h-64 text-center px-4">
  {/* Icon */}
  <div className="w-16 h-16 mb-4 text-gray-300">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>

  {/* Heading */}
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No Results Found
  </h3>

  {/* Description */}
  <p className="text-gray-600 mb-6 max-w-sm">
    No projects match "<span className="font-medium">{searchQuery}</span>". Try a different search term.
  </p>

  {/* Secondary Action */}
  <button className="text-sm text-blue-600 hover:text-blue-700">
    Clear Search
  </button>
</div>
```

---

## Empty State Best Practices

### Visual Design
- **Icon size:** 64-80px (w-16 h-16 to w-20 h-20)
- **Icon color:** Gray-300 for neutral, Blue-100 for informational
- **Max width:** 400-500px (max-w-md) to prevent long lines
- **Vertical spacing:** 16-24px between elements

### Copy Guidelines
- **Heading:** 2-5 words, actionable ("Create Your First Project" not "No Projects")
- **Description:** 1-2 sentences, explain value/purpose
- **CTA copy:** Verb-first ("Create Project" not "Get Started")
- **Tone:** Encouraging, not scolding ("Unlock" not "You can't")

### Interaction Design
- **Primary CTA:** Blue, prominent, solves the empty state
- **Secondary action:** Text link, gray, alternative path
- **No tertiary actions:** Keep it simple (2 actions max)

### Accessibility
- **Alt text:** Descriptive icon labels
- **Focus order:** CTA first, secondary action second
- **Keyboard nav:** All actions keyboard accessible
- **Screen readers:** Announce empty state with role="status"

---

## Implementation Pattern

### Reusable Empty State Component

```tsx
// src/components/common/EmptyState.tsx

interface EmptyStateProps {
  icon: React.ReactNode;
  heading: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  heading,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center px-4" role="status">
      {/* Icon */}
      <div className="w-20 h-20 mb-6 text-gray-300" aria-hidden="true">
        {icon}
      </div>

      {/* Heading */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
        {heading}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-8 max-w-md">
        {description}
      </p>

      {/* Actions */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4"
        >
          {primaryAction.label}
        </button>
      )}

      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {secondaryAction.label} →
        </button>
      )}
    </div>
  );
}
```

### Usage Example

```tsx
import { EmptyState } from '@/components/common/EmptyState';

function ProjectsDashboard() {
  const { projects, isLoading } = useProjects();

  if (isLoading) return <Skeleton />;

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderPlusIcon />}
        heading="Create Your First Project"
        description="Start designing professional app icons and graphics with templates optimized for iOS and Android."
        primaryAction={{
          label: 'Create Project',
          onClick: () => setShowCreateModal(true),
        }}
        secondaryAction={{
          label: 'Browse Templates',
          onClick: () => navigate('/templates'),
        }}
      />
    );
  }

  return <ProjectGrid projects={projects} />;
}
```

---

## Total Empty States: 8

1. **Projects Dashboard (Paid)** - Encourage creation with templates
2. **Projects Dashboard (Free)** - Encourage upgrade (not pushy)
3. **Shared Projects** - Explain public projects concept
4. **Canvas (Blank)** - Guide to first object with shortcuts
5. **Export Modal (No Objects)** - Inform need to create first
6. **Export Modal (No Selection)** - Offer "Export All" alternative
7. **Layers Panel** - Minimal, non-intrusive
8. **Search Results** - Suggest alternatives

**Next Steps:**
1. Create `EmptyState` component in `src/components/common/EmptyState.tsx`
2. Implement empty states in all major views
3. Test empty states with real user flows
4. Add Playwright tests for empty state scenarios
