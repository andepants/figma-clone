/**
 * Canvas Page
 *
 * Main canvas workspace for authenticated users.
 * Contains the collaborative canvas and toolbar with real-time Firestore sync.
 */

import { useEffect, useState } from 'react';
import { CanvasStage } from '@/features/canvas-core/components';
import { Toolbar } from '@/features/toolbar/components';
import { MenuButton } from '@/features/navigation/components';
import { PropertiesPanel } from '@/features/properties-panel';
import { useToolShortcuts } from '@/features/toolbar/hooks';
import { useCanvasStore } from '@/stores';
import { subscribeToCanvasObjects, setOnline, cleanupStaleDragStates, cleanupStaleCursors } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncIndicator, type SyncStatus, ShortcutsModal } from '@/components/common';

function CanvasPage() {
  // Keyboard shortcuts modal state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Enable keyboard shortcuts for tools with callback to open shortcuts modal
  useToolShortcuts(() => setIsShortcutsOpen(true));

  // Get canvas store setObjects method
  const { setObjects } = useCanvasStore();

  // Get current user for presence
  const { currentUser } = useAuth();

  // Track initial loading state
  const [isLoading, setIsLoading] = useState(true);

  // Track sync status for sync indicator
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

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

    const username = currentUser.username || currentUser.email || 'Anonymous';

    // Set user online (includes automatic onDisconnect cleanup)
    setOnline('main', currentUser.uid, username)
      .catch((error) => {
        console.error('Failed to set user online:', error);
      });

    // Clean up any stale drag states from previous sessions
    cleanupStaleDragStates('main')
      .catch((error) => {
        console.error('Failed to cleanup stale drag states:', error);
      });

    // Clean up any stale cursors from previous sessions
    cleanupStaleCursors('main')
      .catch((error) => {
        console.error('Failed to cleanup stale cursors:', error);
      });

    // Note: No explicit cleanup needed - onDisconnect() handles it
  }, [currentUser]);

  /**
   * Subscribe to Realtime Database for real-time canvas updates
   * Cleanup subscription on unmount
   *
   * Note: Migrated from Firestore to RTDB to eliminate race conditions
   * and flash-back bugs during collaborative editing.
   */
  useEffect(() => {
    let isFirstLoad = true;

    try {
      // Subscribe to 'main' canvas objects in RTDB
      const unsubscribe = subscribeToCanvasObjects('main', (objects) => {
        // Update local store with RTDB data
        // No need for complex merge logic - RTDB is now the single source of truth
        setObjects(objects);

        // Mark loading as complete after first data received
        if (isFirstLoad) {
          setIsLoading(false);
          isFirstLoad = false;
        } else {
          // Show brief "synced" indicator when data updates
          // (only if we're online - don't show during offline mode)
          if (navigator.onLine) {
            setSyncStatus('synced');
          }
        }
      });

      // Cleanup: unsubscribe on unmount
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Realtime Database subscription:', error);
      // Mark loading as complete even on error
      setIsLoading(false);
    }
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading indicator during initial load
  if (isLoading) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-neutral-50">
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

        {/* Loading skeleton for properties panel */}
        <div className="absolute top-0 right-0 w-[300px] h-full bg-white border-l border-neutral-200">
          <div className="p-4 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Toolbar onShowShortcuts={() => setIsShortcutsOpen(true)} />
        <div className="absolute top-4 left-4 z-10">
          <MenuButton />
        </div>
        {/* Sync Indicator - shows online/offline and sync status */}
        <SyncIndicator status={syncStatus} className="!top-4" />
        {/* Canvas Stage - adjusted for properties panel (300px right margin) */}
        <div className="absolute top-16 left-0 right-[300px] bottom-0">
          <CanvasStage />
        </div>
        {/* Properties Panel - fixed right sidebar with integrated presence */}
        <PropertiesPanel />
        {/* Keyboard Shortcuts Modal */}
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering CanvasPage:', error);
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
