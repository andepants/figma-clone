/**
 * Properties Panel Component
 *
 * Main container for the properties panel.
 * Shows property sections for the selected shape.
 * Displays active users presence at the top.
 */

import { useState, useEffect } from 'react';
import { Square, Circle as CircleIcon, Type, Minus, Download, ImageIcon } from 'lucide-react';
import { useSelectedShape } from '../hooks/useSelectedShape';
import { getSectionVisibility } from '../utils/section-visibility';
import { PositionSection } from './PositionSection';
import { RotationSection } from './RotationSection';
import { LayoutSection } from './LayoutSection';
import { TypographySection } from './TypographySection';
import { AppearanceSection } from './AppearanceSection';
import { FillSection } from './FillSection';
import { StrokeSection } from './StrokeSection';
import { ImageSection } from './ImageSection';
import { PageSection } from './PageSection';
import { ZoomDropdown } from './ZoomDropdown';
import { AvatarStack, PresenceDropdown, AddUserModal, type PresenceUser } from '@/features/collaboration/components';
import { usePresence } from '@/features/collaboration/hooks';
import { useAuth } from '@/features/auth/hooks';
import { useCanvasStore } from '@/stores/canvas';
import { getProject, removeCollaborator } from '@/lib/firebase';
import type { Project } from '@/types/project.types';
import { toast } from 'sonner';

export interface PropertiesPanelProps {
  onExport: () => void;
  hasObjects: boolean;
  hasSelection?: boolean;
}

/**
 * PropertiesPanel Component
 *
 * Fixed right sidebar that displays property controls for the selected shape.
 * Shows different sections based on the shape type.
 * Shows presence avatars at the top.
 * Shows empty state when nothing is selected.
 *
 * @param {PropertiesPanelProps} props - Component props
 * @param {Function} props.onExport - Export handler function
 * @param {boolean} props.hasObjects - Whether canvas has objects to export
 * @param {boolean} props.hasSelection - Whether user has objects selected
 * @example
 * ```tsx
 * <PropertiesPanel onExport={handleExport} hasObjects={true} hasSelection={true} />
 * ```
 */
export function PropertiesPanel({ onExport, hasSelection = false }: PropertiesPanelProps) {
  const shape = useSelectedShape();
  const visibility = getSectionVisibility(shape);
  const { projectId } = useCanvasStore();

  // Get presence data
  const onlineUsers = usePresence(projectId);
  const { currentUser } = useAuth();

  // Project and modal state
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Load current project
  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      try {
        const project = await getProject(projectId);
        setCurrentProject(project);
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    }
    loadProject();
  }, [projectId]);

  // Check if current user is owner
  const isOwner = currentProject?.ownerId === currentUser?.uid;

  // Map users to PresenceUser format with current user flag
  const presenceUsers: PresenceUser[] = onlineUsers.map(user => ({
    userId: user.userId,
    username: user.username || 'Anonymous',
    color: user.color,
    isCurrentUser: user.userId === currentUser?.uid,
  }));

  // Handle add user
  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  // Handle remove user
  const handleRemoveUser = async (userId: string) => {
    if (!currentUser || !projectId) return;

    try {
      await removeCollaborator(projectId, userId, currentUser.uid);
      toast.success('User removed from project');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove user';
      toast.error(message);
    }
  };

  // Handle user added successfully
  const handleUserAdded = () => {
    setIsAddUserModalOpen(false);
    toast.success('User added to project');
  };

  // Empty state - no selection
  if (!shape) {
    return (
      <div className="flex flex-col h-full">
        {/* Presence Section with Export Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 z-20 flex items-center justify-between">
          <div>
            {presenceUsers.length > 0 && (
              <PresenceDropdown
                users={presenceUsers}
                ownerId={currentProject?.ownerId}
                currentUserId={currentUser?.uid}
                onAddUser={isOwner ? handleAddUser : undefined}
                onRemoveUser={isOwner ? handleRemoveUser : undefined}
                trigger={<AvatarStack users={presenceUsers} maxVisible={3} size="sm" />}
              />
            )}
          </div>
          <button
            onClick={onExport}
            disabled={!hasSelection}
            className="
              flex items-center gap-1.5 px-2 py-1
              text-xs font-medium text-gray-700
              bg-white border border-gray-300 rounded shadow-sm
              hover:bg-gray-50 hover:border-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            title={hasSelection ? "Export Selection... (Shift+Cmd+E)" : "Select objects to export"}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Zoom Section */}
        <div className="border-b border-gray-200 px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Zoom</span>
          <ZoomDropdown />
        </div>

        {/* Page Section */}
        <PageSection />

        {/* Spacer to push content to top */}
        <div className="flex-1" />
      </div>
    );
  }

  // Get shape icon
  function getShapeIcon() {
    if (!shape) return null;
    switch (shape.type) {
      case 'rectangle':
        return <Square className="w-3.5 h-3.5 text-gray-600" />;
      case 'circle':
        return <CircleIcon className="w-3.5 h-3.5 text-gray-600" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-gray-600" />;
      case 'line':
        return <Minus className="w-3.5 h-3.5 text-gray-600" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-gray-600" />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Presence Section with Export Button - Always visible at top */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 z-20 flex items-center justify-between">
        <div>
          {presenceUsers.length > 0 && (
            <PresenceDropdown
              users={presenceUsers}
              ownerId={currentProject?.ownerId}
              currentUserId={currentUser?.uid}
              onAddUser={isOwner ? handleAddUser : undefined}
              onRemoveUser={isOwner ? handleRemoveUser : undefined}
              trigger={<AvatarStack users={presenceUsers} maxVisible={3} size="sm" />}
            />
          )}
        </div>
        <button
          onClick={onExport}
          disabled={!hasSelection}
          className="
            flex items-center gap-1.5 px-2 py-1
            text-xs font-medium text-gray-700
            bg-white border border-gray-300 rounded shadow-sm
            hover:bg-gray-50 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title={hasSelection ? "Export Selection... (Shift+Cmd+E)" : "Select objects to export"}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Shape Header - Sticks below presence */}
      <div className="sticky top-[40px] bg-white border-b border-gray-200 px-3 py-2 z-10">
        <div className="flex items-center gap-1.5">
          {getShapeIcon()}
          <span className="font-medium text-xs capitalize">{shape.type}</span>
        </div>
      </div>

      {/* Property Sections - conditionally rendered based on shape type */}
      <div className="divide-y divide-gray-200">
        {visibility.position && <PositionSection />}
        {visibility.rotation && <RotationSection />}
        {visibility.layout && <LayoutSection />}
        {visibility.text && <TypographySection />}
        {visibility.image && <ImageSection />}
        {visibility.appearance && <AppearanceSection />}
        {visibility.fill && <FillSection />}
        {visibility.stroke && <StrokeSection />}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        projectId={projectId}
        currentCollaborators={currentProject?.collaborators || {}}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}
