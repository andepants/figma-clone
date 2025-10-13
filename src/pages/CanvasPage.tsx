/**
 * Canvas Page
 *
 * Main canvas workspace for authenticated users.
 * Contains the collaborative canvas and toolbar with real-time Firestore sync.
 */

import { useEffect } from 'react';
import { CanvasStage } from '@/features/canvas-core/components';
import { Toolbar } from '@/features/toolbar/components';
import { useToolShortcuts } from '@/features/toolbar/hooks';
import { useCanvasStore } from '@/stores';
import { subscribeToCanvas } from '@/lib/firebase';

function CanvasPage() {
  console.log('CanvasPage rendering...');

  // Enable keyboard shortcuts for tools
  useToolShortcuts();

  // Get canvas store setObjects method
  const { setObjects } = useCanvasStore();

  /**
   * Subscribe to Firestore for real-time canvas updates
   * Cleanup subscription on unmount
   */
  useEffect(() => {
    console.log('Setting up Firestore subscription...');

    try {
      // Subscribe to 'main' canvas document
      const unsubscribe = subscribeToCanvas('main', (objects) => {
        console.log('Received from Firestore:', objects.length, 'objects');
        // Update local store with Firestore data
        setObjects(objects);
      });

      // Cleanup: unsubscribe on unmount
      return () => {
        console.log('Cleaning up Firestore subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Firestore subscription:', error);
    }
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  try {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Toolbar />
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
