/**
 * Canvas Page
 *
 * Main canvas workspace for authenticated users.
 * Contains the collaborative canvas and toolbar with real-time Firestore sync.
 */

import { useEffect, useState } from 'react';
import { CanvasStage } from '@/features/canvas-core/components';
import { Toolbar } from '@/features/toolbar/components';
import { RightSidebar } from '@/features/right-sidebar';
import { LayersPanel } from '@/features/layers-panel';
import { useToolShortcuts } from '@/features/toolbar/hooks';
import { useCanvasStore, usePageStore, useUIStore } from '@/stores';
import { markManipulated, unmarkManipulated, isManipulated } from '@/stores/manipulationTracker';
import {
  subscribeToCanvasObjects,
  subscribeToDragStates,
  subscribeToResizeStates,
  subscribeToEditStates,
  setOnline,
  cleanupStaleDragStates,
  cleanupStaleCursors,
} from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncIndicator, type SyncStatus, ShortcutsModal, EnvironmentIndicator } from '@/components/common';
import { hexToRgba, getUserDisplayName } from '@/lib/utils';

function CanvasPage() {
  // Update SEO for canvas page
  useSEO({
    title: 'Canvas - CollabCanvas | Real-time Design Collaboration',
    description: 'Create and design in real-time with your team. Collaborative canvas workspace with live cursors, instant sync, and multiplayer editing.',
    url: 'https://collabcanvas.app/canvas',
    type: 'website',
  });

  // Keyboard shortcuts modal state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Enable keyboard shortcuts for tools with callback to open shortcuts modal
  useToolShortcuts(() => setIsShortcutsOpen(true));

  // Get canvas store setObjects method
  const { setObjects } = useCanvasStore();

  // Get page settings for background color
  const { pageSettings } = usePageStore();

  // Get left sidebar state for layout adjustment
  const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);

  // Get current user for presence
  const { currentUser } = useAuth();

  // Track initial loading state
  const [isLoading, setIsLoading] = useState(true);

  // Track sync status for sync indicator
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  /**
   * Comprehensive prevention of browser back/forward navigation on swipe gestures
   * Multi-layered approach:
   * 1. Block all horizontal wheel events (trackpad two-finger swipe)
   * 2. Block horizontal touch gestures at screen edges (macOS swipe-back)
   * 3. CSS overscroll-behavior (defined in globals.css)
   *
   * Canvas panning is handled separately by Konva Stage and remains fully functional
   */
  useEffect(() => {
    // 1. Prevent horizontal wheel events (trackpad scroll)
    const preventWheelNavigation = (e: WheelEvent) => {
      // Aggressively prevent ALL horizontal wheel events
      // Canvas panning is handled by Konva's onWheel handler, not browser wheel events
      if (Math.abs(e.deltaX) > 0) {
        e.preventDefault();
      }
    };

    // 2. Prevent horizontal touch/swipe gestures that trigger browser navigation
    let touchStartX = 0;
    let touchStartY = 0;

    const preventTouchNavigation = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const preventTouchMoveNavigation = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        const deltaX = touchCurrentX - touchStartX;
        const deltaY = touchCurrentY - touchStartY;

        // If horizontal swipe is dominant and starts near screen edge, prevent it
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          const isEdgeSwipe = touchStartX < 50 || touchStartX > window.innerWidth - 50;
          if (isEdgeSwipe) {
            e.preventDefault();
          }
        }
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    document.addEventListener('wheel', preventWheelNavigation, { passive: false, capture: true });
    document.addEventListener('touchstart', preventTouchNavigation, { passive: false });
    document.addEventListener('touchmove', preventTouchMoveNavigation, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventWheelNavigation, { capture: true } as EventListenerOptions);
      document.removeEventListener('touchstart', preventTouchNavigation);
      document.removeEventListener('touchmove', preventTouchMoveNavigation);
    };
  }, []);

  /**
   * Additional safety net: Prevent browser back navigation via history manipulation
   * Pushes a dummy history state and intercepts popstate events
   */
  useEffect(() => {
    // Push a dummy state so back button doesn't leave the app
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Prevent navigation by immediately pushing state back
      window.history.pushState(null, '', window.location.href);
      e.preventDefault();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  /**
   * Monitor online/offline status
   * Shows "offline" when no network connection
   */
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    // Set initial status
    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Set user as online with automatic disconnect handling
   * Also cleans up any stale drag states and cursors from previous sessions
   * Firebase onDisconnect() will mark user offline on:
   * - Browser close/crash
   * - Network disconnect
   * - Tab close
   */
  useEffect(() => {
    if (!currentUser) return;

    // Use username with smart fallback to email username (not full email)
    const username = getUserDisplayName(currentUser.username, currentUser.email);

    // Set user online (includes automatic onDisconnect cleanup)
    setOnline('main', currentUser.uid, username).catch(() => {});

    // Clean up any stale drag states from previous sessions
    cleanupStaleDragStates('main').catch(() => {});

    // Clean up any stale cursors from previous sessions
    cleanupStaleCursors('main').catch(() => {});

    // Note: No explicit cleanup needed - onDisconnect() handles it
  }, [currentUser]);

  /**
   * Subscribe to drag states to track which objects current user is dragging
   * This prevents remote updates from causing handle jump during drag
   *
   * PERFORMANCE FIX: Uses global manipulation tracker instead of local ref
   * to enable immediate tracking in useGroupDrag before Firebase write completes
   */
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToDragStates('main', (dragStates) => {
      // Track which objects the current user is actively dragging
      Object.entries(dragStates).forEach(([objectId, dragState]) => {
        if (dragState.userId === currentUser.uid) {
          markManipulated(objectId);
        } else {
          unmarkManipulated(objectId);
        }
      });
    });

    return unsubscribe;
  }, [currentUser]);

  /**
   * Subscribe to resize states to track which objects current user is resizing
   * This prevents remote updates from causing handle jump during resize
   *
   * PERFORMANCE FIX: Uses global manipulation tracker instead of local ref
   * to enable immediate tracking in useResize before Firebase write completes
   */
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToResizeStates('main', (resizeStates) => {
      // Track which objects the current user is actively resizing
      Object.entries(resizeStates).forEach(([objectId, resizeState]) => {
        if (resizeState.userId === currentUser.uid) {
          markManipulated(objectId);
        } else {
          unmarkManipulated(objectId);
        }
      });
    });

    return unsubscribe;
  }, [currentUser]);

  /**
   * Subscribe to edit states to track which text objects current user is editing
   * This prevents remote updates from overwriting text content during editing
   * CRITICAL FIX: Prevents textarea flickering and text reverting to stored value
   */
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToEditStates('main', (editStates) => {
      // Track which text objects the current user is actively editing
      Object.entries(editStates).forEach(([textId, editState]) => {
        if (editState.userId === currentUser.uid) {
          markManipulated(textId);
        } else {
          unmarkManipulated(textId);
        }
      });
    });

    return unsubscribe;
  }, [currentUser]);

  /**
   * Subscribe to Realtime Database for real-time canvas updates
   * Cleanup subscription on unmount
   *
   * CRITICAL FIX: Uses selective merge to avoid overwriting objects being
   * actively manipulated by the current user. This prevents the "jumping handles"
   * bug where remote updates would overwrite local optimistic updates during drag/resize.
   */
  useEffect(() => {
    let isFirstLoad = true;

    try {
      // Subscribe to 'main' canvas objects in RTDB
      const unsubscribe = subscribeToCanvasObjects('main', (remoteObjects) => {
        // On first load, accept all remote objects
        if (isFirstLoad) {
          setObjects(remoteObjects);
          setIsLoading(false);
          isFirstLoad = false;
          return;
        }

        // For subsequent updates, perform selective merge
        // Skip objects that the current user is actively manipulating to prevent handle jumping
        const { objects: localObjects } = useCanvasStore.getState();

        // Build a map of local objects for quick lookup
        const localObjectsMap = new Map(localObjects.map(obj => [obj.id, obj]));

        // Merge: Keep local version of actively manipulated objects, use remote for others
        // PERFORMANCE FIX: Uses global manipulation tracker for immediate tracking
        const mergedObjects = remoteObjects.map(remoteObj => {
          // If current user is actively manipulating this object, keep local version
          if (isManipulated(remoteObj.id)) {
            const localObj = localObjectsMap.get(remoteObj.id);
            // If we have a local version, use it; otherwise fall back to remote
            return localObj || remoteObj;
          }

          // Otherwise, use remote version
          return remoteObj;
        });

        // Also include any local objects that don't exist remotely yet
        // (e.g., objects that were just created locally and haven't synced yet)
        localObjects.forEach(localObj => {
          const existsRemotely = remoteObjects.some(remoteObj => remoteObj.id === localObj.id);
          if (!existsRemotely && isManipulated(localObj.id)) {
            mergedObjects.push(localObj);
          }
        });

        // Update store with merged objects
        setObjects(mergedObjects);

        // Show brief "synced" indicator when data updates
        // (only if we're online - don't show during offline mode)
        if (navigator.onLine) {
          setSyncStatus('synced');
        }
      });

      // Cleanup: unsubscribe on unmount
      return () => {
        unsubscribe();
      };
    } catch {
      // Mark loading as complete even on error
      setIsLoading(false);
    }
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate background color with opacity
  const backgroundColor = pageSettings.backgroundColor;
  const opacity = pageSettings.opacity / 100;
  const bgColorWithOpacity = hexToRgba(backgroundColor, opacity);

  // Show loading indicator during initial load
  if (isLoading) {
    return (
      <div
        className="relative h-screen w-screen overflow-hidden"
        style={{ backgroundColor: bgColorWithOpacity }}
      >
        {/* Loading skeleton for layers panel */}
        {leftSidebarOpen && (
          <div className="absolute top-0 left-0 w-[240px] h-full bg-white border-r border-neutral-200 z-30">
            <div className="p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )}

        {/* Main content - shifts with sidebar */}
        <div
          className={`
            h-full transition-[margin-left] duration-200
            ${leftSidebarOpen ? 'ml-[240px]' : 'ml-0'}
          `}
        >
          {/* Loading skeleton for toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <Skeleton className="h-12 w-80 rounded-lg" />
          </div>

          {/* Loading indicator in center */}
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>

          {/* Loading skeleton for right sidebar */}
          <div className="absolute top-0 right-0 w-[240px] h-full bg-white border-l border-neutral-200">
            <div className="p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div
        className="relative h-screen w-screen overflow-hidden"
        style={{ backgroundColor: bgColorWithOpacity }}
      >
        {/* Environment Indicator - shows dev/prod mode (dev only) */}
        <EnvironmentIndicator />

        {/* Layers Panel - fixed left sidebar */}
        <LayersPanel />

        {/* Main canvas container - shifts when left sidebar opens */}
        <div
          className={`
            h-full transition-[margin-left] duration-200
            ${leftSidebarOpen ? 'ml-[240px]' : 'ml-0'}
          `}
        >
          <Toolbar onShowShortcuts={() => setIsShortcutsOpen(true)} />
          {/* Sync Indicator - shows online/offline and sync status (positioned left of right sidebar) */}
          <SyncIndicator status={syncStatus} className="!top-4 !right-[256px]" />
          {/* Canvas Stage - adjusted for right sidebar (240px right margin) */}
          <div className="absolute top-0 left-0 right-[240px] bottom-0">
            <CanvasStage />
          </div>
          {/* Right Sidebar - unified properties + AI chat */}
          <RightSidebar />
        </div>

        {/* Keyboard Shortcuts Modal */}
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error Loading Canvas</h1>
          <p className="text-gray-600 mt-2">{String(error)}</p>
        </div>
      </div>
    );
  }
}

export default CanvasPage;
