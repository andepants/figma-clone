/**
 * Canvas Page
 *
 * Main canvas workspace for authenticated users.
 * Contains the collaborative canvas and toolbar with real-time Firestore sync.
 */

import { useEffect } from 'react';
import { CanvasStage } from '@/features/canvas-core/components';
import { Toolbar } from '@/features/toolbar/components';
import { ActiveUsers } from '@/features/collaboration/components';
import { MenuButton } from '@/features/navigation/components';
import { useToolShortcuts } from '@/features/toolbar/hooks';
import { useCanvasStore } from '@/stores';
import { subscribeToCanvasObjects, setOnline, cleanupStaleDragStates, cleanupStaleCursors } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';

function CanvasPage() {
  console.log('CanvasPage rendering...');

  // Enable keyboard shortcuts for tools
  useToolShortcuts();

  // Get canvas store setObjects method
  const { setObjects } = useCanvasStore();

  // Get current user for presence
  const { currentUser } = useAuth();

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

    console.log('Setting user online with presence tracking...');

    const username = currentUser.username || currentUser.email || 'Anonymous';

    // Set user online (includes automatic onDisconnect cleanup)
    setOnline('main', currentUser.uid, username)
      .then(() => {
        console.log('Presence: User marked online');
      })
      .catch((error) => {
        console.error('Failed to set user online:', error);
      });

    // Clean up any stale drag states from previous sessions
    cleanupStaleDragStates('main')
      .then((count) => {
        if (count > 0) {
          console.log(`Cleaned up ${count} stale drag states`);
        }
      })
      .catch((error) => {
        console.error('Failed to cleanup stale drag states:', error);
      });

    // Clean up any stale cursors from previous sessions
    cleanupStaleCursors('main')
      .then((count) => {
        if (count > 0) {
          console.log(`Cleaned up ${count} stale cursors`);
        }
      })
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
    console.log('Setting up Realtime Database subscription...');

    try {
      // Subscribe to 'main' canvas objects in RTDB
      const unsubscribe = subscribeToCanvasObjects('main', (objects) => {
        console.log('Received from RTDB:', objects.length, 'objects');
        // Update local store with RTDB data
        // No need for complex merge logic - RTDB is now the single source of truth
        setObjects(objects);
      });

      // Cleanup: unsubscribe on unmount
      return () => {
        console.log('Cleaning up Realtime Database subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Realtime Database subscription:', error);
    }
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  try {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Toolbar />
        <div className="absolute top-4 left-4 z-10">
          <MenuButton />
        </div>
        <ActiveUsers />
        <CanvasStage />
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
