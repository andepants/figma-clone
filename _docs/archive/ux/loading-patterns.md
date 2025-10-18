# Loading State Patterns

**Purpose:** Document loading patterns for all async operations with <100ms appearance time.

**UX Principle:** Immediate feedback - users need visual confirmation within 100ms to prevent confusion and double-clicks.

---

## Core Loading Patterns

### 1. Button Loading States

All interactive buttons must support these states:

#### Default State
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
  Complete Payment
</button>
```

#### Hover State
```tsx
// Handled by Tailwind: hover:bg-blue-700
// Animation: 150ms color transition
```

#### Loading State
```tsx
<button
  disabled
  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium opacity-50 cursor-not-allowed"
>
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
  Processing...
</button>
```

**Timing:** Loading state appears instantly (<16ms) on click

#### Disabled State
```tsx
<button
  disabled
  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
>
  Complete Payment
</button>
```

#### Success State
```tsx
<button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">
  <svg className="w-4 h-4 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
  Payment Complete
</button>
```

**Timing:** Success state shows for 2 seconds before transitioning to next screen

#### Error State
```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
  <svg className="w-4 h-4 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
  Payment Failed - Retry
</button>
```

**Timing:** Error state persists until user retries or dismisses

---

### 2. Page Loading (Skeleton Screens)

**Never show blank pages.** Always use skeleton screens while data loads.

#### Dashboard Skeleton
```tsx
<div className="p-6 space-y-6">
  {/* Header Skeleton */}
  <div className="flex justify-between items-center">
    <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
  </div>

  {/* Project Grid Skeleton */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
    ))}
  </div>
</div>
```

**Timing:** Skeleton appears immediately, replaces with real content when loaded

#### Canvas Skeleton
```tsx
<div className="h-screen flex">
  {/* Toolbar Skeleton */}
  <div className="w-16 bg-gray-100 border-r border-gray-200">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-12 m-2 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>

  {/* Canvas Area */}
  <div className="flex-1 bg-gray-50 flex items-center justify-center">
    <div className="text-gray-400">
      <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-sm">Loading canvas...</p>
    </div>
  </div>

  {/* Properties Panel Skeleton */}
  <div className="w-64 bg-white border-l border-gray-200 p-4 space-y-4">
    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
    <div className="h-10 bg-gray-200 rounded animate-pulse" />
    <div className="h-10 bg-gray-200 rounded animate-pulse" />
  </div>
</div>
```

---

### 3. Inline Loading (Form Validation)

Show spinner next to field during async validation.

```tsx
<div className="relative">
  <input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  />
  {isValidating && (
    <div className="absolute right-3 top-3">
      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )}
  {isAvailable === true && (
    <div className="absolute right-3 top-3">
      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  )}
</div>
```

**Timing:** Debounce validation by 300ms, show spinner after 100ms if still loading

---

### 4. Optimistic Updates

Show changes immediately, rollback on error.

#### Strategy
1. Update local state immediately (user sees change instantly)
2. Send request to server
3. If success: do nothing (already updated)
4. If error: rollback local state + show error

```tsx
// Example: Toggle project visibility
async function toggleVisibility(projectId: string) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  // 1. Optimistic update (instant UI feedback)
  setProjects(prev => prev.map(p =>
    p.id === projectId ? { ...p, isPublic: !p.isPublic } : p
  ));

  try {
    // 2. Send to server
    await updateProject(projectId, { isPublic: !project.isPublic });
  } catch (error) {
    // 3. Rollback on error
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, isPublic: project.isPublic } : p
    ));
    toast.error('Failed to update visibility');
  }
}
```

**Use Cases for Optimistic Updates:**
- Toggle visibility (public/private)
- Toggle lock state
- Rename project/layer
- Delete object (hide immediately, remove on confirm)
- Reorder objects

---

### 5. Background Sync Indicator

Subtle indicator for ongoing background operations.

```tsx
<div className="fixed bottom-4 right-4 z-50">
  {isSyncing && (
    <div className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center space-x-2">
      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-sm text-gray-700">Syncing changes...</span>
    </div>
  )}
  {syncComplete && (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center space-x-2">
      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <span className="text-sm text-green-700">All changes saved</span>
    </div>
  )}
</div>
```

**Timing:**
- Sync indicator appears after 500ms if still syncing (avoid flashing)
- Success indicator shows for 2 seconds then auto-dismisses

---

## Loading Timeout Handling

All loading states must have timeout fallback.

### Timeout Thresholds
- **Quick operations (< 2s expected):** 5s timeout
- **Medium operations (2-5s expected):** 10s timeout
- **Long operations (5s+ expected):** 30s timeout

### Timeout UI Pattern

```tsx
function PaymentButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'timeout' | 'success' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();

  async function handlePayment() {
    setStatus('loading');

    // Set 10s timeout for payment
    timeoutRef.current = setTimeout(() => {
      setStatus('timeout');
    }, 10000);

    try {
      await processPayment();
      clearTimeout(timeoutRef.current);
      setStatus('success');
    } catch (error) {
      clearTimeout(timeoutRef.current);
      setStatus('error');
    }
  }

  if (status === 'timeout') {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-700 mb-4">
          This is taking longer than expected...
        </p>
        <button onClick={handlePayment} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button onClick={handlePayment} disabled={status === 'loading'}>
      {status === 'loading' ? 'Processing...' : 'Complete Payment'}
    </button>
  );
}
```

---

## Shared Loading Components

### Spinner Component
```tsx
// src/components/common/Spinner.tsx

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
```

### Skeleton Component
```tsx
// src/components/common/Skeleton.tsx

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ className = '', shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded',
        shimmer && 'relative overflow-hidden',
        className
      )}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
}
```

---

## Performance Requirements

### Timing Goals
- ✅ Button loading state: **< 16ms** (single frame)
- ✅ Skeleton screen: **< 100ms** (perceived instant)
- ✅ Inline spinner: **100-300ms** (debounced validation)
- ✅ Background sync: **500ms** (avoid flashing)
- ✅ Success state: **2 seconds** (then auto-transition)

### Animation Performance
- All spinners use CSS `transform` (GPU-accelerated)
- Shimmer effect uses `transform: translateX()` (not `left` or `margin`)
- Skeleton animations run at 60 FPS
- Use `will-change: transform` for smoother animations

---

## Accessibility

### Screen Reader Support
```tsx
// Loading button with ARIA
<button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-live="polite"
>
  {isLoading && <Spinner className="sr-only" />}
  {isLoading ? (
    <>
      <span className="sr-only">Processing payment, please wait</span>
      <span aria-hidden="true">Processing...</span>
    </>
  ) : (
    'Complete Payment'
  )}
</button>
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
  .animate-pulse {
    animation: none;
  }
  .animate-shimmer {
    animation: none;
  }
}
```

---

## Loading State Checklist

- [ ] All buttons have loading state (spinner + disabled)
- [ ] All page loads use skeleton screens (no blank pages)
- [ ] All async validation shows inline spinner
- [ ] All data mutations use optimistic updates
- [ ] All background sync has subtle indicator
- [ ] All loading states have timeout fallback (5-30s)
- [ ] All loading states < 100ms to appear
- [ ] All spinners use GPU-accelerated animations
- [ ] All loading states support screen readers (ARIA)
- [ ] All animations respect prefers-reduced-motion

---

## Next Steps

1. Create `Spinner` component in `src/components/common/Spinner.tsx`
2. Create `Skeleton` component in `src/components/common/Skeleton.tsx`
3. Implement optimistic update utility in `src/lib/utils/optimistic.ts`
4. Add timeout handling to all async operations
5. Test all loading states manually
6. Add Playwright tests for loading states
