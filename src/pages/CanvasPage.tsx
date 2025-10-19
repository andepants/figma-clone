/**
 * Canvas Page
 *
 * Main canvas workspace for authenticated users.
 * Contains the collaborative canvas and toolbar with real-time Firestore sync.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type Konva from 'konva';
import { toast } from 'sonner';
import { CanvasStage } from '@/features/canvas-core/components';
import { Toolbar } from '@/features/toolbar/components';
import { RightSidebar } from '@/features/right-sidebar';
import { LayersPanel } from '@/features/layers-panel';
import { useToolShortcuts } from '@/features/toolbar/hooks';
import { useCanvasStore, usePageStore, useUIStore } from '@/stores';
import { getProject } from '@/lib/firebase/projectsService';
import { useAuth } from '@/features/auth/hooks';
import { useProjectAccess } from '@/features/collaboration/hooks';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncIndicator, ShortcutsModal, ConnectionStatus } from '@/components/common';
import { hexToRgba, exportCanvasToPNG } from '@/lib/utils';
import { ExportModal, type ExportOptions } from '@/features/export';
import { ImageUploadModal } from '@/features/canvas-core/components/ImageUploadModal';
import { canUserAccessProject } from '@/types/project.types';
import type { Project } from '@/types/project.types';
import { PUBLIC_PLAYGROUND_ID } from '@/config/constants';
import { subscribeToConnectionStatus, type ConnectionStatus as ConnectionStatusType } from '@/lib/firebase';
import {
  useCanvasSubscriptions,
  useCanvasSyncStatus,
  useNavigationPrevention,
} from './canvas/hooks';

// Load export utility in development mode
if (import.meta.env.DEV) {
  import('@/utils/exportCurrentCanvasAsTemplate');
}

function CanvasPage() {
  // Get projectId from URL params (e.g., /canvas/:projectId)
  // Falls back to 'main' for legacy /canvas route
  const { projectId = 'main' } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  // Get current user for access control
  const { currentUser } = useAuth();

  // Monitor project access - will redirect if user is removed
  useProjectAccess(projectId, currentUser?.uid || null);

  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Update SEO for canvas page
  useSEO({
    title: `${project?.name || 'Canvas'} - Canvas Icons | Real-time Design Collaboration`,
    description: 'Create and design in real-time with your team. Collaborative canvas workspace with live cursors, instant sync, and multiplayer editing.',
    url: `https://collabcanvas.app/canvas/${projectId}`,
    type: 'website',
  });

  // Keyboard shortcuts modal state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Image upload modal state
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Enable keyboard shortcuts for tools with callbacks
  useToolShortcuts(
    () => setIsShortcutsOpen(true),
    () => setIsImageUploadOpen(true)
  );

  // Get canvas store methods and state
  const { objects, selectedIds, setProjectId } = useCanvasStore();

  // Initialize canvasStore projectId from URL param
  useEffect(() => {
    setProjectId(projectId);
  }, [projectId, setProjectId]);

  // Memoize selected objects to prevent unnecessary preview re-generation
  const selectedObjects = useMemo(
    () => objects.filter(obj => selectedIds.includes(obj.id)),
    [objects, selectedIds]
  );

  // Ref to access Konva stage for export
  const stageRef = useRef<Konva.Stage | null>(null);

  // Get page settings for background color
  const { pageSettings } = usePageStore();

  // Get left sidebar state for layout adjustment
  const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);

  // Prevent browser navigation from gestures
  useNavigationPrevention();

  // Track sync status for sync indicator
  const { syncStatus, setSyncStatus } = useCanvasSyncStatus();

  // Track connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('connecting');

  // Subscribe to Firebase connection status
  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    return unsubscribe;
  }, []);

  // Subscribe to Firebase and manage real-time data
  const { isLoading } = useCanvasSubscriptions({
    projectId,
    currentUser,
    onSyncStatusChange: setSyncStatus,
  });

  /**
   * Load project and verify access
   * Redirects to projects page if user doesn't have access
   * Public playground bypasses access checks
   */
  useEffect(() => {
    async function loadProject() {
      if (!currentUser) {
        setProjectLoading(false);
        return;
      }

      // Public playground: Allow all authenticated users
      if (projectId === PUBLIC_PLAYGROUND_ID) {
        setProject(null); // No project metadata needed for playground
        setProjectLoading(false);
        return;
      }

      // Legacy route: /canvas without projectId
      if (projectId === 'main') {
        setProject(null);
        setProjectLoading(false);
        return;
      }

      try {
        const projectData = await getProject(projectId);

        if (!projectData) {
          setProjectError('Project not found');
          setProjectLoading(false);
          // Redirect to projects page after 2 seconds
          setTimeout(() => navigate('/projects'), 2000);
          return;
        }

        // Check if user has access to this project
        if (!canUserAccessProject(projectData, currentUser.uid)) {
          setProjectError('You do not have access to this project');
          setProjectLoading(false);
          // Redirect to projects page after 2 seconds
          setTimeout(() => navigate('/projects'), 2000);
          return;
        }

        setProject(projectData);
        setProjectLoading(false);
      } catch (error) {
        console.error('Error loading project:', error);
        setProjectError('Failed to load project');
        setProjectLoading(false);
      }
    }

    loadProject();
  }, [projectId, currentUser, navigate]);

  /**
   * Handle export with options from modal
   * Exports objects based on user-configured settings
   */
  async function handleExportWithOptions(options: ExportOptions) {
    try {
      // exportCanvasToPNG now returns ExportResult
      const result = await exportCanvasToPNG(stageRef, selectedObjects, objects, options);

      // Return result for Firebase upload in ExportModal
      return result;
    } catch (error) {
      // Provide helpful error messages based on error type
      let message = 'Unknown error occurred';

      if (error instanceof Error) {
        if (error.message.includes('Stage ref not available')) {
          message = 'Canvas not ready. Please try again.';
        } else if (error.message.includes('No objects to export')) {
          message = 'No objects to export. Create some objects first.';
        } else if (error.message.includes('Invalid bounding box')) {
          message = 'Export failed due to invalid object bounds. Please check your objects.';
        } else {
          message = error.message;
        }
      }

      alert(`Export failed: ${message}`);
      throw error; // Re-throw so modal can handle loading state
    }
  }

  /**
   * Handle export button click
   * Opens export modal instead of direct export
   */
  const handleExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  /**
   * Handle export keyboard shortcut (Shift+Cmd/Ctrl+E)
   * Only triggers if there's a selection
   */
  useEffect(() => {
    function handleExportShortcut(event: KeyboardEvent) {
      // Check if Shift+Cmd/Ctrl+E
      if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        const isTyping = activeElement instanceof HTMLInputElement ||
                         activeElement instanceof HTMLTextAreaElement ||
                         activeElement?.getAttribute('contenteditable') === 'true';

        if (isTyping) return;

        // Only export if there's a selection
        if (selectedIds.length === 0) return;

        event.preventDefault();
        handleExport();
      }
    }

    window.addEventListener('keydown', handleExportShortcut);
    return () => window.removeEventListener('keydown', handleExportShortcut);
  }, [handleExport, selectedIds]);

  /**
   * Warn users when canvas has too many objects
   * Shows warning at 1000 objects and every 100 objects after
   */
  useEffect(() => {
    const objectCount = objects.length;

    // Show warning at 1000, 1100, 1200, etc. objects
    if (objectCount >= 1000 && objectCount % 100 === 0) {
      toast.warning(
        `Large canvas (${objectCount} objects) may affect performance. Consider organizing into groups or separate projects.`,
        { duration: 5000 }
      );
    }
  }, [objects.length]);

  // Calculate background color with opacity
  const backgroundColor = pageSettings.backgroundColor;
  const opacity = pageSettings.opacity / 100;
  const bgColorWithOpacity = hexToRgba(backgroundColor, opacity);

  // Show project error if access denied or project not found
  if (projectError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">{projectError}</h1>
          <p className="text-gray-600">Redirecting to projects page...</p>
        </div>
      </div>
    );
  }

  // Show loading indicator during initial load
  if (isLoading || projectLoading) {
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

  // Check if this is the public playground
  const isPublicPlayground = projectId === PUBLIC_PLAYGROUND_ID;

  try {
    return (
      <div
        className="relative h-screen w-screen overflow-hidden"
        style={{ backgroundColor: bgColorWithOpacity }}
      >
        {/* Connection Status Banner - top-center, highest z-index */}
        <ConnectionStatus status={connectionStatus} />

        {/* Public Playground Banner */}
        {isPublicPlayground && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium">
              🎨 Public Playground - Changes visible to all users
            </span>
          </div>
        )}

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
          {/* Sync Indicator - shows online/offline and sync status */}
          <SyncIndicator status={syncStatus} className="!top-4 !right-[256px]" />
          {/* Canvas Stage - adjusted for right sidebar (240px right margin) */}
          <div className="absolute top-0 left-0 right-[240px] bottom-0">
            <CanvasStage stageRef={stageRef} projectId={projectId} />
          </div>
          {/* Right Sidebar - unified properties + AI chat */}
          <RightSidebar
            onExport={handleExport}
            hasObjects={objects.length > 0}
            hasSelection={selectedIds.length > 0}
            projectId={projectId}
          />
        </div>

        {/* Keyboard Shortcuts Modal */}
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExportWithOptions}
          hasSelection={selectedIds.length > 0}
          stageRef={stageRef}
          selectedObjects={selectedObjects}
          allObjects={objects}
        />

        {/* Image Upload Modal */}
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={() => setIsImageUploadOpen(false)}
          projectId={projectId}
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
