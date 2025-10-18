/**
 * Canvas Sync Status Hook
 *
 * Tracks and manages the synchronization status of the canvas with Firebase.
 * Monitors network connectivity and provides sync status updates for UI indicators.
 *
 * Features:
 * - Online/offline detection
 * - Sync status tracking (synced, syncing, offline)
 * - Automatic status recovery on network reconnection
 */

import { useState, useEffect } from 'react';
import type { SyncStatus } from '@/components/common';

/**
 * Hook return value
 */
interface UseCanvasSyncStatusReturn {
  /** Current sync status for UI indicators */
  syncStatus: SyncStatus;
  /** Function to manually update sync status (e.g., after successful sync) */
  setSyncStatus: (status: SyncStatus) => void;
}

/**
 * Custom hook to track canvas synchronization status
 *
 * Monitors network connectivity and provides sync status for the SyncIndicator component.
 * Automatically detects online/offline state and updates status accordingly.
 *
 * @returns Object containing current sync status and setter function
 *
 * @example
 * function CanvasPage() {
 *   const { syncStatus, setSyncStatus } = useCanvasSyncStatus();
 *
 *   // Update status after successful sync
 *   useEffect(() => {
 *     if (dataSynced && navigator.onLine) {
 *       setSyncStatus('synced');
 *     }
 *   }, [dataSynced]);
 *
 *   return <SyncIndicator status={syncStatus} />;
 * }
 */
export function useCanvasSyncStatus(): UseCanvasSyncStatusReturn {
  // Track sync status for sync indicator
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  /**
   * Monitor online/offline status
   * Shows "offline" when no network connection
   * Automatically recovers to "synced" when connection is restored
   */
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    // Set initial status based on current network state
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

  return {
    syncStatus,
    setSyncStatus,
  };
}
